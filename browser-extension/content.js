console.log("[BlackDog] content.js loaded:", window.location.href);
window.__BLACKDOG_CONTENT_LOADED__ = true;

const MESSAGE_NOISE_PATTERNS = [
  /search messages/i,
  /meeting recaps?/i,
  /personal notepad/i,
  /people/i,
  /files and links/i,
  /activity/i,
  /invite/i,
  /overview/i,
  /job details/i,
  /contract/i,
  /attachments?/i,
  /portfolio/i,
  /proposal/i,
  /sidebar/i,
  /filter/i,
]

const UI_TEXT_PATTERNS = [
  /^view details$/i,
  /^saved$/i,
  /^search messages$/i,
  /^meeting recaps?$/i,
  /^files and links$/i,
  /^personal notepad$/i,
  /^people$/i,
  /^activity$/i,
  /^send$/i,
  /^attach file$/i,
  /^emoji$/i,
  /^more$/i,
  /^upwork$/i,
  /^messages$/i,
  /^jobs$/i,
  /^reports$/i,
  /^talent$/i,
  /^settings$/i,
]

const TIME_PATTERN = /\b(?:\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?|Yesterday|Today|[A-Z][a-z]{2}\s\d{1,2}|[A-Z][a-z]{2}\s\d{1,2},?\s\d{4})\b/

const SNAPSHOT_DEBOUNCE_MS = 450

let lastBroadcastSignature = ""
let snapshotTimer = null
let observerStarted = false
let cachedUpworkUserName = ""

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim()
}

function safeName(value = "") {
  return normalizeText(value)
}

function similarName(a = "", b = "") {
  const left = safeName(a).toLowerCase()
  const right = safeName(b).toLowerCase()
  if (!left || !right) return false
  if (left === right) return true
  return left.replace(/[^a-z0-9]+/g, "") === right.replace(/[^a-z0-9]+/g, "")
}

function normalizeBlockText(value = "") {
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function hashString(value = "") {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function isVisibleElement(element) {
  if (!element || !(element instanceof Element)) return false
  const style = window.getComputedStyle(element)
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0"
}

function looksLikeName(value = "") {
  const text = normalizeText(value)
  if (text.length < 3 || text.length > 80) return false
  if (MESSAGE_NOISE_PATTERNS.some((pattern) => pattern.test(text))) return false
  if (UI_TEXT_PATTERNS.some((pattern) => pattern.test(text))) return false
  const words = text.split(" ")
  if (words.length < 2 || words.length > 6) return false
  return words.every((word) => /^[A-ZÀ-ÿ][A-Za-zÀ-ÿ'’-]*$/.test(word))
}

async function readUpworkUserName() {
  if (cachedUpworkUserName) return cachedUpworkUserName
  const items = await chrome.storage.local.get(["upworkUserName"])
  cachedUpworkUserName = normalizeText(items.upworkUserName || "")
  return cachedUpworkUserName
}

function setCachedUpworkUserName(value) {
  cachedUpworkUserName = normalizeText(value || "")
}

function guessRoomId() {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
  return normalizeText(path || window.location.href || hashString(document.title || `${Date.now()}`))
}

function guessRoomUrl() {
  return window.location.href
}

function getConversationRoot() {
  return document.querySelector("main,[role='main']") ?? document.body ?? document.documentElement
}

function extractConversationTitle(root) {
  const titleCandidates = [
    ...Array.from(root.querySelectorAll("h1, h2, h3, [role='heading']")),
    ...Array.from(document.querySelectorAll("h1, h2, h3, [role='heading']")),
  ]

  for (const node of titleCandidates) {
    const textValue = normalizeText(node.textContent || "")
    if (textValue && !MESSAGE_NOISE_PATTERNS.some((pattern) => pattern.test(textValue))) {
      return textValue
    }
  }

  return normalizeText(document.title || "Upwork Conversation")
}

function isTimestampLine(textValue = "") {
  const normalized = normalizeText(textValue)
  if (!normalized) return false
  return TIME_PATTERN.test(normalized)
}

function parseStoryContainerNode(node, roomId) {
  const textValue = normalizeBlockText(node.innerText || node.textContent || "")
  if (textValue.length < 8 || textValue.length > 8000) return { message: null, reason: "too_short", textValue }

  const lines = textValue.split("\n").map((line) => normalizeText(line)).filter(Boolean)
  if (!lines.length) return { message: null, reason: "empty_lines", textValue }

  let startIndex = 0
  let sender = ""
  while (startIndex < lines.length) {
    const line = lines[startIndex]
    if (/^(candidate|me|unknown|saved|view details)$/i.test(line)) {
      startIndex += 1
      continue
    }
    if (/^(saturday|sunday|monday|tuesday|wednesday|thursday|friday),?\s+[a-z]{3}\s?\d{1,2}$/i.test(line)) {
      startIndex += 1
      continue
    }
    sender = line
    startIndex += 1
    break
  }

  if (!sender) return { message: null, reason: "missing_sender", lines }

  let timestamp = ""
  while (startIndex < lines.length) {
    const line = lines[startIndex]
    if (isTimestampLine(line)) {
      timestamp = line
      startIndex += 1
      break
    }
    if (/^(candidate|me|unknown|saved|view details)$/i.test(line)) {
      startIndex += 1
      continue
    }
    if (/^(saturday|sunday|monday|tuesday|wednesday|thursday|friday),?\s+[a-z]{3}\s?\d{1,2}$/i.test(line)) {
      startIndex += 1
      continue
    }
    break
  }

  const bodyLines = lines
    .slice(startIndex)
    .filter((line) => !/^(saved|view details|candidate|me|unknown)$/i.test(line))
    .filter((line) => !/^(saturday|sunday|monday|tuesday|wednesday|thursday|friday),?\s+[a-z]{3}\s?\d{1,2}$/i.test(line))
  const cleanedBody = bodyLines.join("\n").trim()

  if (!sender || !cleanedBody) return { message: null, reason: "missing_text", sender, timestamp, bodyLines }
  if (cleanedBody === sender || cleanedBody === timestamp) return { message: null, reason: "sender_or_timestamp_only", sender, timestamp, bodyLines }
  if (cleanedBody.length < 2) return { message: null, reason: "too_short_body", sender, timestamp, bodyLines }

  return {
    message: {
      id: hashString(`${roomId}|${sender}|${timestamp || ""}|${normalizeText(cleanedBody)}`),
      sender,
      timestamp: normalizeText(timestamp || ""),
      text: cleanedBody,
      capturedAt: new Date().toISOString(),
    },
  }
}

function extractMessageBlocksFromUpworkRoom(roomId) {
  const allDivs = Array.from(document.querySelectorAll("div"))
  const storyNodes = allDivs.filter((node) => {
    if (!(node instanceof Element)) return false
    if (!isVisibleElement(node)) return false
    if (node.closest("nav,aside,header,footer,form")) return false

    const className = String(node.className || "")
    const hasExactStoryClass = className.split(/\s+/).includes("up-d-story")
    if (!hasExactStoryClass) return false

    const text = node.innerText || node.textContent || ""
    if (!text || text.length < 8) return false

    return true
  })

  console.log("[BlackDog] up-d-story candidates", {
    allDivCount: allDivs.length,
    storyNodeCount: storyNodes.length,
    samples: storyNodes.slice(0, 5).map((node) => ({
      className: String(node.className || ""),
      dataTestId: node.getAttribute("data-testid"),
      text: (node.innerText || node.textContent || "").slice(0, 300),
    })),
  })

  let noiseBlocksRemoved = 0
  let lowConfidenceBlocks = 0
  let headerOnlyBlocks = 0

  if (!storyNodes.length) {
    return {
      messages: [],
      noiseBlocksRemoved: 0,
      lowConfidenceBlocks: 0,
      headerOnlyBlocks: 0,
      foundStoryContainer: false,
    }
  }

  const parsedMessages = []

  for (const [index, node] of storyNodes.entries()) {
    const textValue = normalizeBlockText(node.innerText || node.textContent || "")
    if (textValue.length < 8 || textValue.length > 8000) {
      lowConfidenceBlocks += 1
      continue
    }

    const lines = textValue.split("\n").map((line) => normalizeText(line)).filter(Boolean)
    console.log("[BlackDog] story node raw", {
      index,
      textValue,
      lines,
    })

    const parsed = parseStoryContainerNode(node, roomId)
    console.log("[BlackDog] story node parsed", {
      index,
      parsed,
    })
    if (!parsed?.message) {
      if (
        parsed?.reason === "missing_sender" ||
        parsed?.reason === "missing_text" ||
        parsed?.reason === "sender_or_timestamp_only" ||
        parsed?.reason === "too_short_body"
      ) {
        headerOnlyBlocks += 1
      }
      lowConfidenceBlocks += 1
      continue
    }

    parsedMessages.push(parsed.message)
  }

  const deduped = []
  const grouped = new Map()
  for (const message of parsedMessages) {
    const sender = safeName(message.sender || "")
    const timestamp = safeName(message.timestamp || "")
    const normalizedText = normalizeText(message.text || "")
    const key = `${roomId}|${sender}|${timestamp}`
    const id = hashString(`${key}|${normalizedText}`)
    const next = {
      ...message,
      id,
      sender,
      timestamp,
      text: normalizedText,
    }

    const bucket = grouped.get(key) || []
    let absorbed = false

    for (let index = bucket.length - 1; index >= 0; index -= 1) {
      const existing = bucket[index]
      const existingText = normalizeText(existing.text || "")
      if (!existingText || !normalizedText) continue
      if (existingText === normalizedText) {
        absorbed = true
        break
      }
      if (existingText.includes(normalizedText) && existingText.length >= normalizedText.length) {
        absorbed = true
        break
      }
      if (normalizedText.includes(existingText) && normalizedText.length > existingText.length) {
        bucket.splice(index, 1)
      }
    }

    if (!absorbed) {
      bucket.push(next)
      grouped.set(key, bucket)
    }
  }

  for (const bucket of grouped.values()) {
    deduped.push(...bucket)
  }

  return {
    messages: deduped,
    noiseBlocksRemoved,
    lowConfidenceBlocks,
    headerOnlyBlocks,
    foundStoryContainer: true,
  }
}

function extractCandidateHintsFromTextNodes(root, meName) {
  const counts = new Map()
  const nodes = Array.from(root.querySelectorAll("main, section, article, div"))
  for (const node of nodes) {
    if (!(node instanceof Element)) continue
    if (!isVisibleElement(node)) continue
    if (node.closest("nav,aside,header,footer,form")) continue
    const textValue = normalizeBlockText(node.innerText || node.textContent || "")
    if (textValue.length < 40 || textValue.length > 3000) continue
    const lines = textValue.split("\n").map((line) => normalizeText(line)).filter(Boolean)
    for (const line of lines.slice(0, 10)) {
      if (!looksLikeName(line)) continue
      if (similarName(line, meName)) continue
      counts.set(line, (counts.get(line) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)
}

function debugScanUpworkDom() {
  const meName = cachedUpworkUserName || ""
  const roomId = guessRoomId()
  const roomUrl = guessRoomUrl()
  const root = document.querySelector("main,[role='main']") ?? document.body ?? document.documentElement
  const candidateHints = extractCandidateHintsFromTextNodes(root, meName)
  const nodes = Array.from(root.querySelectorAll("main, section, article, div"))
  const results = []

  for (const node of nodes) {
    if (!(node instanceof Element)) continue
    if (!isVisibleElement(node)) continue
    if (node.closest("nav,aside,header,footer,form")) continue

    const rect = node.getBoundingClientRect()
    if (!rect || rect.width <= 0 || rect.height <= 0) continue

    const textValue = normalizeBlockText(node.innerText || node.textContent || "")
    if (textValue.length < 50 || textValue.length > 5000) continue

    const sampleText = textValue.slice(0, 800)
    const lowerSample = sampleText.toLowerCase()
    if (MESSAGE_NOISE_PATTERNS.some((pattern) => pattern.test(sampleText))) continue

    const containsMyName = similarName(sampleText, meName) || lowerSample.includes(meName.toLowerCase())
    const containsCandidateName = candidateHints.some((name) => lowerSample.includes(name.toLowerCase()))
    const containsTimePattern = TIME_PATTERN.test(sampleText)
    const centerPenalty = Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2)
    const verticalPenalty = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2)
    const noisePenalty = (lowerSample.includes("search messages") ? 120 : 0) +
      (lowerSample.includes("files and links") ? 120 : 0) +
      (lowerSample.includes("meeting recaps") ? 120 : 0) +
      (lowerSample.includes("personal notepad") ? 120 : 0) +
      (lowerSample.includes("people") ? 80 : 0) +
      (lowerSample.includes("activity") ? 80 : 0)
    const score =
      Math.min(400, textValue.length / 4) +
      (containsMyName ? 180 : 0) +
      (containsCandidateName ? 220 : 0) +
      (containsTimePattern ? 120 : 0) -
      Math.min(200, centerPenalty / 5) -
      Math.min(200, verticalPenalty / 5) -
      noisePenalty

    results.push({
      index: results.length,
      tagName: node.tagName,
      className: safeName(node.className || ""),
      role: safeName(node.getAttribute("role") || ""),
      ariaLabel: safeName(node.getAttribute("aria-label") || ""),
      dataTestId: safeName(node.getAttribute("data-testid") || node.getAttribute("data-test") || node.getAttribute("data-qa") || ""),
      textLength: textValue.length,
      childCount: node.childElementCount,
      sampleText,
      containsMyName,
      containsCandidateName,
      containsTimePattern,
      boundingRect: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      score,
      roomId,
      roomUrl,
      pageUrl: roomUrl,
    })
  }

  const sorted = results.sort((a, b) => b.score - a.score).slice(0, 20)
  return sorted
}

function chooseCandidateName(messages, meName, fallback = "Unknown Candidate") {
  const counts = new Map()
  for (const message of messages) {
    const sender = safeName(message.sender || "")
    if (!sender || sender === "Unknown") continue
    if (similarName(sender, meName)) continue
    counts.set(sender, (counts.get(sender) || 0) + 1)
  }

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  return entries.length ? entries[0][0] : fallback
}

function normalizeDirectionForRoom(messages, meName, candidateName) {
  return messages.map((message) => {
    const sender = safeName(message.sender || "Unknown") || "Unknown"
    if (sender !== "Unknown" && similarName(sender, meName)) {
      return { ...message, sender, direction: "me" }
    }
    if (sender !== "Unknown" && candidateName !== "Unknown Candidate" && similarName(sender, candidateName)) {
      return { ...message, sender, direction: "candidate" }
    }
    if (sender === "Unknown") {
      return { ...message, sender, direction: "unknown" }
    }
    return { ...message, sender, direction: "candidate" }
  })
}

function dedupeMessages(messages, roomId) {
  const map = new Map()
  messages.forEach((message) => {
    const sender = safeName(message.sender || "Unknown") || "Unknown"
    const timestamp = safeName(message.timestamp || "") || ""
    const normalizedText = normalizeText(message.text || "")
    const seed = `${roomId}|${sender}|${normalizedText}`
    const id = message.id || hashString(seed)
    if (!map.has(id)) {
      map.set(id, {
        ...message,
        id,
        sender,
        timestamp: timestamp || "",
        text: normalizedText,
        capturedAt: message.capturedAt || new Date().toISOString(),
      })
    }
  })
  return Array.from(map.values())
}

async function extractConversationData() {
  const meName = await readUpworkUserName()
  const roomId = guessRoomId()
  const roomUrl = guessRoomUrl()
  const sourceNode = getConversationRoot()
  const pageTitle = normalizeText(document.title || "Untitled Page")
  const conversationTitle = extractConversationTitle(sourceNode)

  let messages = []
  let noiseBlocksRemoved = 0
  let lowConfidenceBlocks = 0
  let headerOnlyBlocks = 0
  let foundStoryContainer = false
  const extracted = extractMessageBlocksFromUpworkRoom(roomId)
  messages = extracted.messages
  noiseBlocksRemoved = extracted.noiseBlocksRemoved
  lowConfidenceBlocks = extracted.lowConfidenceBlocks
  headerOnlyBlocks = extracted.headerOnlyBlocks || 0
  foundStoryContainer = Boolean(extracted.foundStoryContainer)
  messages = dedupeMessages(messages, roomId)

  const candidateName = chooseCandidateName(messages, meName, "Unknown Candidate")
  const normalizedMessages = normalizeDirectionForRoom(messages, meName, candidateName)
  console.log("[BlackDog] parsed messages", messages)
  console.log("[BlackDog] normalized messages", normalizedMessages)
  const reliableMessages = normalizedMessages.filter((message) => {
    const sender = safeName(message.sender || "")
    const body = safeName(message.text || "")
    if (!sender || sender === "Unknown") return false
    if (!body) return false
    if (body === sender) return false
    if (/^(candidate|me|unknown|saved|view details)$/i.test(body)) return false
    return message.direction === "me" || message.direction === "candidate"
  })
  console.log("[BlackDog] reliable messages", reliableMessages)
  const finalMessages = foundStoryContainer ? reliableMessages : []
  const extractionMode = foundStoryContainer ? "story_container_capture" : "no_story_container_found"
  const conversationText = finalMessages
    .map((message) => `${message.sender}${message.timestamp && message.timestamp !== "Unknown" ? ` (${message.timestamp})` : ""}: ${message.text}`)
    .join("\n\n")
    .trim()

  const lastMessageTime = finalMessages.length ? finalMessages[finalMessages.length - 1].timestamp || "" : ""
  const fallbackNote = !foundStoryContainer ? "Could not find Upwork story-container message blocks." : ""
  const snapshot = {
    roomId,
    roomUrl,
    pageUrl: roomUrl,
    pageTitle,
    meName: meName || "Unknown",
    candidateName,
    conversationTitle,
    conversationMessages: finalMessages,
    conversationText: fallbackNote || conversationText,
    extractionMode,
    totalMessagesCaptured: finalMessages.length,
    lastMessageTime,
    capturedAt: new Date().toISOString(),
    hiddenLowConfidenceBlocks: lowConfidenceBlocks + headerOnlyBlocks,
    noiseBlocksRemoved,
  }

  snapshot.snapshotSignature = hashString(
    `${snapshot.roomId}|${snapshot.meName}|${snapshot.candidateName}|${snapshot.conversationMessages.map((message) => message.id).join("|")}|${snapshot.totalMessagesCaptured}`,
  )

  return snapshot
}

async function broadcastSnapshot() {
  const snapshot = await extractConversationData()
  if (snapshot.snapshotSignature === lastBroadcastSignature) return
  lastBroadcastSignature = snapshot.snapshotSignature

  try {
    void chrome.runtime.sendMessage({
      type: "BLACKDOG_UPWORK_SNAPSHOT_UPDATED",
      snapshot,
    }).catch(() => null)
  } catch {
    // Best effort only.
  }
}

function scheduleBroadcast() {
  if (snapshotTimer) clearTimeout(snapshotTimer)
  snapshotTimer = window.setTimeout(() => {
    void broadcastSnapshot()
  }, SNAPSHOT_DEBOUNCE_MS)
}

function startObserver() {
  if (observerStarted) return
  observerStarted = true

  const target = document.body || document.documentElement
  if (!target) return

  const observer = new MutationObserver(() => {
    scheduleBroadcast()
  })

  observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  window.addEventListener("focus", scheduleBroadcast)
  window.addEventListener("visibilitychange", scheduleBroadcast)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.upworkUserName) return
    setCachedUpworkUserName(changes.upworkUserName.newValue || "")
    scheduleBroadcast()
  })

  scheduleBroadcast()
}

function collectUpworkSnapshot() {
  return extractConversationData()
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message?.type === "BLACKDOG_PING") {
      sendResponse({ ok: true, message: "content script alive", url: window.location.href })
      return false
    }

    if (message?.type === "COLLECT_UPWORK_SNAPSHOT") {
      void Promise.resolve(collectUpworkSnapshot())
        .then((snapshot) => sendResponse({ ok: true, snapshot }))
        .catch((error) => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          })
        })
      return true
    }

    if (message?.type === "DEBUG_DOM_SCAN" || message?.type === "COLLECT_UPWORK_DEBUG_SCAN") {
      void Promise.resolve(debugScanUpworkDom())
        .then((results) => sendResponse({ ok: true, results }))
        .catch((error) => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          })
        })
      return true
    }

    sendResponse({ ok: false, error: "Unknown message type" })
    return false
  } catch (error) {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
    return false
  }
})

window.addEventListener("message", (event) => {
  if (event.source !== window) return
  if (event.data?.type !== "COLLECT_UPWORK_SNAPSHOT") return
  // Reserved for future in-page preview debugging.
})

startObserver()

window.collectUpworkSnapshot = collectUpworkSnapshot
