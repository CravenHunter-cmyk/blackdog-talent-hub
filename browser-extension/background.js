const UPWORK_PREFIXES = ["https://www.upwork.com/", "https://upwork.com/"]
const UPWORK_MESSAGE_ROOM_PATTERNS = ["/ab/messages/rooms/"]
const latestSnapshotsByTab = new Map()

function isUpworkUrl(url) {
  return typeof url === "string" && UPWORK_PREFIXES.some((prefix) => url.startsWith(prefix))
}

function isUpworkMessagesRoomUrl(url) {
  return isUpworkUrl(url) && UPWORK_MESSAGE_ROOM_PATTERNS.some((fragment) => String(url).includes(fragment))
}

async function ensureSidePanel(tabId, url) {
  if (!Number.isInteger(tabId) || !isUpworkUrl(url)) return

  try {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: true,
      path: "sidepanel.html",
    })
  } catch {
    // Best effort. Some Chrome builds may not allow setting the side panel on every event.
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab ?? null
}

async function findBestUpworkMessagesRoomTab() {
  const currentWindowTabs = await chrome.tabs.query({ currentWindow: true })
  const allTabs = await chrome.tabs.query({})
  const candidates = [...currentWindowTabs, ...allTabs]

  const unique = candidates.filter(
    (tab, index, array) => tab?.id && tab.url && array.findIndex((item) => item.id === tab.id) === index,
  )

  const roomTabs = unique.filter((tab) => isUpworkMessagesRoomUrl(String(tab.url || "")))
  if (roomTabs.length) {
    return roomTabs.find((tab) => tab.active) ?? roomTabs[0]
  }

  const upworkTabs = unique.filter((tab) => isUpworkUrl(String(tab.url || "")))
  if (upworkTabs.length) {
    return upworkTabs.find((tab) => tab.active) ?? upworkTabs[0]
  }

  return null
}

async function ensureContentScriptInjected(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    })
    return true
  } catch {
    return false
  }
}

async function sendMessageToTab(tabId, payload) {
  return await new Promise((resolve, reject) => {
    try {
      chrome.tabs.sendMessage(tabId, payload, (response) => {
        const lastError = chrome.runtime.lastError
        if (lastError) {
          reject(new Error(lastError.message))
          return
        }
        resolve(response)
      })
    } catch (error) {
      reject(error)
    }
  })
}

async function ensureContentScript(tabId) {
  try {
    const pingResponse = await sendMessageToTab(tabId, { type: "BLACKDOG_PING" })
    if (pingResponse?.ok) return true
  } catch {
    // Ignore and try injection below.
  }

  const injected = await ensureContentScriptInjected(tabId)
  if (!injected) return false

  await new Promise((resolve) => setTimeout(resolve, 300))

  try {
    const retryPing = await sendMessageToTab(tabId, { type: "BLACKDOG_PING" })
    return Boolean(retryPing?.ok)
  } catch {
    return false
  }
}

async function requestSnapshotFromTab(tabId) {
  console.log("[BlackDog background] request snapshot tab", { tabId })
  const injected = await ensureContentScript(tabId)
  if (!injected) return { ok: false, error: "Could not read Upwork page." }

  const readSnapshot = async (label) => {
    try {
      const response = await sendMessageToTab(tabId, { type: "COLLECT_UPWORK_SNAPSHOT" })
      console.log("[BlackDog background] content response", {
        tabId,
        label,
        ok: Boolean(response?.ok),
        hasSnapshot: Boolean(response?.snapshot),
      })
      if (response?.ok && response.snapshot) return { ok: true, snapshot: response.snapshot }
      if (response && response.roomId && response.conversationMessages) return { ok: true, snapshot: response }
      return { ok: false, error: response?.error || "Could not read Upwork page." }
    } catch (error) {
      console.warn("[BlackDog background] snapshot request failed", {
        tabId,
        label,
        error: error instanceof Error ? error.message : String(error),
      })
      return { ok: false, error: error instanceof Error ? error.message : "Could not read Upwork page." }
    }
  }

  const first = await readSnapshot("first")
  if (first.ok) return first

  const reinjected = await ensureContentScriptInjected(tabId)
  if (!reinjected) return first

  await new Promise((resolve) => setTimeout(resolve, 300))
  return await readSnapshot("retry")
}

async function requestDebugScanFromTab(tabId) {
  const injected = await ensureContentScript(tabId)
  if (!injected) return { ok: false, error: "Could not read Upwork page." }

  try {
    const response = await sendMessageToTab(tabId, { type: "DEBUG_DOM_SCAN" })
    if (response?.ok && Array.isArray(response.results)) return { ok: true, results: response.results }
    return { ok: false, error: response?.error || "Could not read Upwork page." }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not read Upwork page." }
  }
}

async function requestSnapshotFromBestTab(forceRefresh = false) {
  const activeTab = await getActiveTab()
  const tab = activeTab && isUpworkUrl(activeTab.url) ? activeTab : await findBestUpworkMessagesRoomTab()
  console.log("[BlackDog background] active tab", {
    forceRefresh,
    activeTabId: activeTab?.id,
    activeTabUrl: activeTab?.url,
    selectedTabId: tab?.id,
    selectedTabUrl: tab?.url,
  })
  if (!tab?.id) return { ok: false, error: "No Upwork messages room found." }

  const response = await requestSnapshotFromTab(tab.id)
  if (response.ok && response.snapshot) {
    latestSnapshotsByTab.set(tab.id, response.snapshot)
  }
  return response
}

async function requestDebugScanFromBestTab() {
  const tab = await findBestUpworkMessagesRoomTab()
  if (!tab?.id) return { ok: false, error: "No Upwork messages room found." }
  return await requestDebugScanFromTab(tab.id)
}

async function openOrFocusUpworkTab() {
  const tabs = await chrome.tabs.query({})
  const existing = tabs.find((tab) => isUpworkUrl(tab.url))

  if (existing?.id) {
    if (existing.windowId !== undefined) {
      await chrome.windows.update(existing.windowId, { focused: true })
    }
    await chrome.tabs.update(existing.id, { active: true })
    return existing
  }

  return chrome.tabs.create({
    url: "https://www.upwork.com/",
    active: true,
  })
}

async function openRecruitingHelper() {
  const activeTab = await getActiveTab()
  const tab = activeTab && isUpworkUrl(activeTab.url) ? activeTab : await openOrFocusUpworkTab()
  if (!tab?.id) return

  await ensureSidePanel(tab.id, tab.url)

  try {
    await chrome.sidePanel.open({ tabId: tab.id })
  } catch {
    // Best effort.
  }
}

chrome.action.onClicked.addListener(() => {
  void openRecruitingHelper()
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      void ensureSidePanel(tab.id ?? -1, tab.url)
    }
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    void ensureSidePanel(tabId, tab.url)
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    void ensureSidePanel(activeInfo.tabId, tab?.url)
  })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "BLACKDOG_UPWORK_SNAPSHOT_UPDATED") {
    const tabId = sender.tab?.id
    if (typeof tabId === "number") {
      latestSnapshotsByTab.set(tabId, message.snapshot)
    }

    try {
      chrome.runtime.sendMessage({
        type: "BLACKDOG_SIDE_PANEL_SNAPSHOT_UPDATED",
        snapshot: message.snapshot,
      })
    } catch {
      // Best effort.
    }

    return false
  }

  if (message?.type === "BLACKDOG_REQUEST_SNAPSHOT" || message?.type === "REQUEST_UPWORK_SNAPSHOT") {
    void (async () => {
      console.log("[BlackDog background] request snapshot", message)
      const response = await requestSnapshotFromBestTab(Boolean(message.forceRefresh))
      sendResponse(response)
    })()
    return true
  }

  if (message?.type === "BLACKDOG_REQUEST_DEBUG_SCAN" || message?.type === "COLLECT_UPWORK_DEBUG_SCAN") {
    void (async () => {
      const response = await requestDebugScanFromBestTab()
      sendResponse(response)
    })()
    return true
  }

  if (message?.type === "CLEAR_RECRUITING_CACHE") {
    latestSnapshotsByTab.clear()
    sendResponse({ ok: true })
    return false
  }

  if (message?.type === "OPEN_OR_FOCUS_UPWORK") {
    void openRecruitingHelper().then(() => sendResponse({ ok: true }))
    return true
  }

  return false
})
