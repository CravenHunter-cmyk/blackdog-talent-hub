const STORAGE_KEY = "blackdogRecruitingHelperRoomsStateV1"

const state = {
  upworkUserName: "",
  rooms: {},
  activeRoomId: "",
  connectionStatus: "Waiting for active Upwork tab",
  lastSync: "Never",
  extractionMode: "Unknown",
  lastAction: "idle",
  debugScanStatus: "idle",
  debugScanResults: [],
  debugScanError: "",
}

function el(id) {
  return document.getElementById(id)
}

function text(value = "") {
  return String(value).replace(/\s+/g, " ").trim()
}

function blockText(value = "") {
  return String(value).replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
}

function hash(value = "") {
  let out = 0
  for (let i = 0; i < value.length; i += 1) {
    out = (out << 5) - out + value.charCodeAt(i)
    out |= 0
  }
  return Math.abs(out).toString(36)
}

function safeName(value = "") {
  return text(value)
}

function similarName(a = "", b = "") {
  const left = safeName(a).toLowerCase()
  const right = safeName(b).toLowerCase()
  if (!left || !right) return false
  if (left === right) return true
  return left.replace(/[^a-z0-9]+/g, "") === right.replace(/[^a-z0-9]+/g, "")
}

function getRoomKey(snapshot = {}) {
  return safeName(snapshot.roomId || snapshot.roomUrl || snapshot.pageUrl || "")
}

function nowIso() {
  return new Date().toISOString()
}

function setDebugAction(action) {
  state.lastAction = action
  const node = el("debug-status")
  if (node) node.textContent = `Side panel script loaded · Last action: ${action || "idle"}`
}

function setDebugScanStatus(value) {
  state.debugScanStatus = value
  const node = el("debug-scan-status")
  if (node) node.textContent = value
}

function setStatus(id, value) {
  const node = el(id)
  if (node) node.textContent = value
}

function setStatusState(id, value, stateValue) {
  const node = el(id)
  if (!node) return
  node.textContent = value
  if (stateValue) node.dataset.state = stateValue
}

async function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, (items) => resolve(items || {})))
}

async function storageSet(items) {
  return new Promise((resolve) => chrome.storage.local.set(items, () => resolve()))
}

async function storageRemove(keys) {
  return new Promise((resolve) => chrome.storage.local.remove(keys, () => resolve()))
}

function emptyRoom(snapshot = {}) {
  const roomId = getRoomKey(snapshot) || hash(snapshot.pageTitle || `${Date.now()}`)
  return {
    roomId,
    roomUrl: snapshot.roomUrl || snapshot.pageUrl || "",
    pageUrl: snapshot.pageUrl || snapshot.roomUrl || "",
    pageTitle: snapshot.pageTitle || "Untitled Page",
    meName: snapshot.meName || state.upworkUserName || "Unknown",
    candidateName: snapshot.candidateName || "Unknown Candidate",
    conversationTitle: snapshot.conversationTitle || "Upwork Conversation",
    conversationMessages: [],
    lastSyncedAt: snapshot.capturedAt || nowIso(),
    extractionMode: snapshot.extractionMode || "fallback",
    cachedConversation: Boolean(snapshot.cachedConversation),
  }
}

function normalizeMessage(message, index, roomId, meName, candidateName) {
  const sender = safeName(message?.sender || "Unknown") || "Unknown"
  const textValue = blockText(message?.text || "")
  const timestamp = safeName(message?.timestamp || "") || ""
  const direction = deriveDirection(sender, meName, candidateName)
  const seed = timestamp ? `${roomId}|${sender}|${timestamp}|${textValue}` : `${roomId}|${sender}|${textValue}|${index}`
  return {
    id: text(message?.id) || hash(seed),
    sender,
    direction,
    text: textValue,
    timestamp,
    capturedAt: safeName(message?.capturedAt || nowIso()) || nowIso(),
  }
}

function isMeaningfulConversationMessage(message = {}) {
  const sender = safeName(message.sender || "")
  const body = safeName(message.text || "")
  if (!sender || sender === "Unknown") return false
  if (!body) return false
  if (body === sender) return false
  if (/^\d{1,2}:\d{2}\s?(AM|PM|am|pm)?$/.test(body)) return false
  if (/^(candidate|me|unknown|saved|view details)$/i.test(body)) return false
  if (/^(candidate|me|unknown|saved|view details)$/i.test(sender)) return false
  if (body.length < 8 && !/^(hi|hello|hey|ok|okay|yes|no|thanks|thank you|got it|sure|sounds good)$/i.test(body)) return false
  return true
}

function deriveDirection(sender, meName, candidateName) {
  if (!sender || sender === "Unknown") return "unknown"
  if (similarName(sender, meName)) return "me"
  if (candidateName && candidateName !== "Unknown Candidate" && similarName(sender, candidateName)) return "candidate"
  return "candidate"
}

function mergeMessages(existing = [], incoming = [], roomId, meName, candidateName) {
  const map = new Map()
  for (const [index, message] of existing.entries()) {
    const normalized = normalizeMessage(message, index, roomId, meName, candidateName)
    map.set(normalized.id, normalized)
  }

  for (const [index, message] of incoming.entries()) {
    const normalized = normalizeMessage(message, existing.length + index, roomId, meName, candidateName)
    const prior = map.get(normalized.id)
    if (prior) {
      map.set(normalized.id, {
        ...prior,
        ...normalized,
        capturedAt: prior.capturedAt || normalized.capturedAt,
      })
    } else {
      map.set(normalized.id, normalized)
    }
  }

  return Array.from(map.values())
}

function deriveCandidateName(messages = [], meName = "", fallback = "Unknown Candidate") {
  const counts = new Map()
  for (const message of messages) {
    const sender = safeName(message?.sender || "")
    if (!sender || sender === "Unknown") continue
    if (similarName(sender, meName)) continue
    counts.set(sender, (counts.get(sender) || 0) + 1)
  }

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  if (entries.length) return entries[0][0]
  return fallback
}

function serializeState() {
  return {
    upworkUserName: state.upworkUserName,
    rooms: state.rooms,
    activeRoomId: state.activeRoomId,
  }
}

async function persistState() {
  await storageSet({ [STORAGE_KEY]: serializeState() })
}

async function loadState() {
  const items = await storageGet([STORAGE_KEY, "upworkUserName"])
  const saved = items[STORAGE_KEY] || {}
  state.upworkUserName = safeName(saved.upworkUserName || items.upworkUserName || "")
  state.rooms = saved.rooms && typeof saved.rooms === "object" ? saved.rooms : {}
  Object.values(state.rooms).forEach((room) => {
    if (room && typeof room === "object") {
      room.cachedConversation = true
    }
  })
  state.activeRoomId = safeName(saved.activeRoomId || Object.keys(state.rooms)[0] || "")
  if (state.activeRoomId && !state.rooms[state.activeRoomId]) {
    state.activeRoomId = Object.keys(state.rooms)[0] || ""
  }
}

function activeRoom() {
  return state.activeRoomId && state.rooms[state.activeRoomId] ? state.rooms[state.activeRoomId] : null
}

function formatLastMessageTime(room) {
  if (!room?.conversationMessages?.length) return "—"
  const timestamp = room.conversationMessages[room.conversationMessages.length - 1].timestamp || ""
  return timestamp && timestamp !== "Unknown" ? timestamp : "—"
}

function renderConnection() {
  const room = activeRoom()
  setStatus(
    "connection-status",
    room
      ? room.extractionMode === "no_story_container_found"
        ? "Could not find Upwork story-container message blocks."
        : room.cachedConversation
          ? `Connected to cached conversation for ${room.candidateName || "current room"}`
          : `Connected to ${room.candidateName || "current room"}`
      : "Waiting for active Upwork tab",
  )
  setStatus("last-sync", room?.lastSyncedAt || "Never")
  setStatus("extraction-mode", room?.extractionMode === "live-capture" ? "Live Capture" : room?.extractionMode || "Unknown")
  setStatusState("debug-status", `Side panel script loaded · Last action: ${state.lastAction || "idle"}`)
  const userInput = el("upwork-user-name")
  if (userInput) userInput.value = state.upworkUserName || ""
}

function renderConversation() {
  const room = activeRoom()
  setStatus("me-name", room?.meName || state.upworkUserName || "Not set")
  setStatus("candidate-name", room?.candidateName && room.candidateName !== "Unknown Candidate" ? room.candidateName : "Not detected")
  const visibleMessages = Array.isArray(room?.conversationMessages) ? room.conversationMessages.filter(isMeaningfulConversationMessage) : []
  setStatus("total-messages-captured", String(visibleMessages.length))
  setStatus("last-message-time", formatLastMessageTime({ conversationMessages: visibleMessages }) || "—")
  setStatus("room-url", room?.roomUrl || room?.pageUrl || "-")
  setStatus("low-confidence-blocks", String(room?.hiddenLowConfidenceBlocks || 0))
  setStatus("noise-blocks-removed", String(room?.noiseBlocksRemoved || 0))
  setStatus("debug-scan-status", state.debugScanStatus || "idle")
  setStatus(
    "conversation-meta",
    room
      ? room.extractionMode === "no_story_container_found"
        ? "Could not find Upwork story-container message blocks."
        : visibleMessages.length
          ? `${room.cachedConversation ? "Cached conversation · " : ""}${room.candidateName || "Not detected"} · ${visibleMessages.length} messages captured`
          : "Story containers found. Awaiting reliable messages."
      : "No conversation synced yet.",
  )

  const list = el("conversation-list")
  if (!list) return

  list.innerHTML = ""
  if (!room) {
    const empty = document.createElement("div")
    empty.className = "empty-state"
    empty.textContent = "No room captured yet. Open an Upwork message room and click Sync Current Conversation."
    list.append(empty)
    return
  }

  const messages = visibleMessages
  if (!messages.length) {
    const empty = document.createElement("div")
    empty.className = "empty-state"
    empty.textContent =
      room.extractionMode === "no_story_container_found"
        ? "Could not find Upwork story-container message blocks."
        : room.extractionMode === "fallback_debug_only"
          ? "Could not reliably isolate Upwork message blocks yet. Use Debug DOM Scan below."
        : "No reliable chat messages detected yet. Please make sure the active Upwork message room is open."
    list.append(empty)
    return
  }

  const displayMessages = messages.filter((message) => {
    const sender = text(message.sender || "")
    const body = text(message.text || "")
    return sender && sender !== "Unknown" && body && !/^(unknown|view details|saved)$/i.test(sender) && !/^(unknown|view details|saved)$/i.test(body)
  })

  displayMessages.forEach((message) => {
    const card = document.createElement("article")
    const direction = deriveDirection(message.sender, room.meName, room.candidateName)
    card.className = `message-card ${direction}`

    const head = document.createElement("div")
    head.className = "message-head"

    const sender = document.createElement("div")
    sender.className = "message-sender"
    sender.textContent = message.sender || "Unknown"

    const meta = document.createElement("div")
    meta.className = "message-meta"
    meta.textContent = message.timestamp && message.timestamp !== "Unknown" ? message.timestamp : ""

    const badge = document.createElement("span")
    badge.className = `message-badge ${direction}`
    badge.textContent = direction === "me" ? "Me" : direction === "candidate" ? "Candidate" : "Unknown"

    const body = document.createElement("div")
    body.className = "message-body"
    body.textContent = message.text || ""

    head.append(sender, badge)
    if (meta.textContent) head.append(meta)
    card.append(head, body)
    list.append(card)
  })
}

function renderDebugScanResults() {
  const results = Array.isArray(state.debugScanResults) ? state.debugScanResults : []
  const container = el("debug-scan-results")
  if (!container) return

  container.innerHTML = ""

  if (!results.length) {
    const empty = document.createElement("div")
    empty.className = "empty-state"
    empty.textContent = "No debug scan results yet."
    container.append(empty)
    return
  }

  results.forEach((node) => {
    const card = document.createElement("article")
    card.className = "debug-node-card"

    const head = document.createElement("div")
    head.className = "debug-node-head"
    head.innerHTML = `<strong>#${node.index}</strong><span>score: ${node.score ?? "-"}</span>`

    const meta = document.createElement("div")
    meta.className = "debug-node-meta"
    meta.innerHTML = [
      `tagName: ${node.tagName || "-"}`,
      `className: ${node.className || "-"}`,
      `role: ${node.role || "-"}`,
      `aria-label: ${node.ariaLabel || "-"}`,
      `data-testid: ${node.dataTestId || "-"}`,
      `textLength: ${node.textLength || 0}`,
      `childCount: ${node.childCount || 0}`,
      `boundingRect: top=${node.boundingRect?.top ?? "-"}, left=${node.boundingRect?.left ?? "-"}, width=${node.boundingRect?.width ?? "-"}, height=${node.boundingRect?.height ?? "-"}`,
      `containsMyName: ${node.containsMyName ? "yes" : "no"}`,
      `containsCandidateName: ${node.containsCandidateName ? "yes" : "no"}`,
      `containsTimePattern: ${node.containsTimePattern ? "yes" : "no"}`,
    ]
      .map((line) => `<div>${line}</div>`)
      .join("")

    const sample = document.createElement("textarea")
    sample.className = "debug-node-sample"
    sample.readOnly = true
    sample.value = node.sampleText || ""
    sample.spellcheck = false

    card.append(head, meta, sample)
    container.append(card)
  })
}

function renderAll() {
  const userInput = el("upwork-user-name")
  if (userInput) userInput.value = state.upworkUserName || ""
  renderConnection()
  renderConversation()
  renderDebugScanResults()
}

function normalizeIncomingSnapshot(snapshot = {}) {
  const roomId = getRoomKey(snapshot)
  const existing = state.rooms[roomId] || emptyRoom(snapshot)
  const meName = safeName(state.upworkUserName || snapshot.meName || existing.meName || "")
  const incomingMessages = Array.isArray(snapshot.conversationMessages) ? snapshot.conversationMessages : []
  const previousMessages = Array.isArray(existing.conversationMessages) ? existing.conversationMessages : []
  const filteredPreviousMessages = previousMessages.filter(isMeaningfulConversationMessage)
  const filteredIncomingMessages = incomingMessages.filter(isMeaningfulConversationMessage)
  const mergedMessages = mergeMessages(filteredPreviousMessages, filteredIncomingMessages, roomId, meName, existing.candidateName || snapshot.candidateName)
  const candidateName = deriveCandidateName(mergedMessages, meName, safeName(snapshot.candidateName || existing.candidateName || "Unknown Candidate"))
  const normalizedMessages = mergedMessages.map((message) => ({
    ...message,
    direction: deriveDirection(message.sender, meName, candidateName),
  }))
  const reliableMessages = normalizedMessages.filter(isMeaningfulConversationMessage)
  const lowConfidenceExtraction =
    snapshot.extractionMode === "fallback_debug_only" || reliableMessages.length < 2 || (reliableMessages.length && snapshot.hiddenLowConfidenceBlocks && snapshot.hiddenLowConfidenceBlocks > reliableMessages.length)

  const room = {
    ...existing,
    roomId,
    roomUrl: snapshot.roomUrl || snapshot.pageUrl || existing.roomUrl || "",
    pageUrl: snapshot.pageUrl || snapshot.roomUrl || existing.pageUrl || "",
    pageTitle: snapshot.pageTitle || existing.pageTitle || "Untitled Page",
    meName: meName || "Unknown",
    candidateName,
    conversationTitle: snapshot.conversationTitle || existing.conversationTitle || "Upwork Conversation",
    conversationMessages: reliableMessages,
    lastSyncedAt: snapshot.capturedAt || nowIso(),
    extractionMode: lowConfidenceExtraction ? "fallback_debug_only" : snapshot.extractionMode || existing.extractionMode || "fallback_debug_only",
    hiddenLowConfidenceBlocks: snapshot.hiddenLowConfidenceBlocks || 0,
    noiseBlocksRemoved: snapshot.noiseBlocksRemoved || 0,
    cachedConversation: false,
  }

  state.rooms[roomId] = room
  state.activeRoomId = roomId
  state.connectionStatus = lowConfidenceExtraction
    ? "Low confidence extraction. Please check the active Upwork message room."
    : "Connected to active Upwork conversation"
  state.lastSync = room.lastSyncedAt
  state.extractionMode = room.extractionMode === "live-capture" ? "Live Capture" : "fallback_debug_only"
  return room
}

async function clearCache() {
  setDebugAction("Clear Cache clicked")
  await storageRemove([
    STORAGE_KEY,
    "candidateProfiles",
    "candidateOrder",
    "activeCandidateName",
    "currentConversation",
  ])
  state.rooms = {}
  state.activeRoomId = ""
  state.connectionStatus = "Waiting for active Upwork tab"
  state.lastSync = "Never"
  state.extractionMode = "Unknown"
  state.debugScanStatus = "idle"
  state.debugScanResults = []
  state.debugScanError = ""
  renderAll()
  await storageSet({ upworkUserName: state.upworkUserName })
  await sendRuntimeMessage({ type: "CLEAR_RECRUITING_CACHE" }).catch(() => null)
  const note = el("conversation-meta")
  if (note) note.textContent = "Cache cleared. Please refresh visible history or run Debug DOM Scan."
}

function upsertRoomFromSnapshot(snapshot) {
  normalizeIncomingSnapshot(snapshot)
  renderAll()
  void persistState()
}

function messageListener(message) {
  if (message?.type !== "BLACKDOG_UPWORK_SNAPSHOT_UPDATED") return false
  if (message.snapshot) {
    upsertRoomFromSnapshot(message.snapshot)
  }
  return false
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        const runtimeError = chrome.runtime.lastError
        if (runtimeError) {
          reject(new Error(runtimeError.message))
          return
        }
        resolve(response)
      })
    } catch (error) {
      reject(error)
    }
  })
}

function normalizeSnapshotError(error = "") {
  const value = text(error || "")
  if (/No Upwork messages room found/i.test(value)) {
    return "No Upwork messages room found."
  }
  if (/Receiving end does not exist|Could not establish connection|Snapshot collection failed|Could not read Upwork page/i.test(value)) {
    return "Could not read Upwork page."
  }
  return value || "Could not read Upwork page."
}

async function requestSnapshot(forceRefresh = false) {
  setDebugAction(forceRefresh ? "Refresh Visible History clicked" : "Refresh clicked")
  setStatus("connection-status", "Requesting active Upwork snapshot")
  try {
    const response = await sendRuntimeMessage({ type: "BLACKDOG_REQUEST_SNAPSHOT", forceRefresh })
    console.log("[BlackDog] Refresh response", response)
    if (!response?.ok || !response.snapshot) {
      const error = normalizeSnapshotError(response?.error)
      setStatus("connection-status", "Waiting for active Upwork tab")
      const note = el("conversation-meta")
      if (note) note.textContent = error
      return null
    }

    console.log("[BlackDog] snapshot.conversationMessages.length", Array.isArray(response.snapshot.conversationMessages) ? response.snapshot.conversationMessages.length : 0)
    upsertRoomFromSnapshot(response.snapshot)
    return response.snapshot
  } catch (error) {
    const message = normalizeSnapshotError(error instanceof Error ? error.message : "")
    setStatus("connection-status", "Waiting for active Upwork tab")
    const note = el("conversation-meta")
    if (note) note.textContent = message
    return null
  }
}

async function requestDebugScan() {
  setDebugAction("Debug DOM Scan clicked")
  setDebugScanStatus("scanning")
  try {
    const response = await sendRuntimeMessage({ type: "BLACKDOG_REQUEST_DEBUG_SCAN" })
    console.log("[BlackDog] Debug DOM Scan response", response)
    const results = Array.isArray(response?.results)
      ? response.results
      : Array.isArray(response?.result?.results)
        ? response.result.results
      : Array.isArray(response?.result?.candidates)
        ? response.result.candidates
        : []

    if (!response?.ok || !results.length) {
      const message = text(response?.error || "Debug DOM scan failed.")
      state.debugScanError = message
      setDebugScanStatus(`error: ${message}`)
      state.debugScanResults = []
      renderDebugScanResults()
      return null
    }

    state.debugScanError = ""
    state.debugScanResults = results
    setDebugScanStatus(`loaded ${state.debugScanResults.length} candidate nodes`)
    renderDebugScanResults()
    return results
  } catch (error) {
    const message = text(error instanceof Error ? error.message : "Debug DOM scan failed.")
    state.debugScanError = message
    setDebugScanStatus(`error: ${message}`)
    state.debugScanResults = []
    renderDebugScanResults()
    return null
  }
}

async function saveUpworkUserName() {
  const input = el("upwork-user-name")
  const value = safeName(input?.value || "")
  state.upworkUserName = value
  if (state.activeRoomId && state.rooms[state.activeRoomId]) {
    state.rooms[state.activeRoomId].meName = value || "Unknown"
  }
  setDebugAction("Save User Name clicked")
  await storageSet({ [STORAGE_KEY]: serializeState() })
  await storageSet({ upworkUserName: value })
  renderAll()
  await requestSnapshot(true)
}

function bindClick(id, handler) {
  const node = el(id)
  if (node) node.addEventListener("click", handler)
}

function bindEvents() {
  bindClick("save-user-name", () => {
    void saveUpworkUserName()
  })
  bindClick("sync-page", () => {
    void requestSnapshot(false)
  })
  bindClick("refresh-visible-history", () => {
    void requestSnapshot(true)
  })
  bindClick("debug-dom-scan", () => {
    void requestDebugScan()
  })
  bindClick("clear-cache", () => {
    void clearCache()
  })
}

async function bootstrap() {
  await loadState()
  renderAll()
  bindEvents()
  chrome.runtime.onMessage.addListener(messageListener)
  setDebugAction("idle")
  void requestSnapshot(false)
}

document.addEventListener("DOMContentLoaded", () => {
  void bootstrap()
})

window.addEventListener("beforeunload", () => {
  void persistState()
})
