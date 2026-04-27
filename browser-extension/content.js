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

const INVALID_CANDIDATE_NAME_VALUES = [
  "account settings",
  "settings",
  "messages",
  "search messages",
  "meeting recaps",
  "people",
  "files and links",
  "personal notepad",
  "activity timeline",
  "proposal received",
  "project alignment",
  "offer acceptance",
  "contract starts",
  "send offer",
  "view proposal",
  "upwork home",
  "toggle search",
  "skip to content",
  "more options",
  "favorites",
  "unread",
  "jobs",
  "all job posts",
]

const TIME_PATTERN = /\b(?:\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?|Yesterday|Today|[A-Z][a-z]{2}\s\d{1,2}|[A-Z][a-z]{2}\s\d{1,2},?\s\d{4})\b/

const SNAPSHOT_DEBOUNCE_MS = 450

let lastBroadcastSignature = ""
let snapshotTimer = null
let observerStarted = false
let cachedUpworkUserName = ""
let lastObservedUrl = window.location.href
let lastCandidateAvatarUrl = ""
let lastCandidateAvatarRoomKey = ""
let lastCandidateAvatarCandidateName = ""
let lastAvatarBackgroundImageCandidateCount = 0
let lastAvatarBestScore = 0
let lastAvatarBestSourceType = ""
let avatarRetryTimer = null
let avatarRetryCount = 0
let avatarRetryRoomKey = ""
const AVATAR_RETRY_LIMIT = 10
const AVATAR_RETRY_DELAY_MS = 700

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

function isInvalidCandidateName(name = "") {
  const value = normalizeText(name).toLowerCase()
  return !value || INVALID_CANDIDATE_NAME_VALUES.includes(value)
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
  return extractRoomIdFromUrl(window.location.href) || normalizeText(window.location.pathname || window.location.href || hashString(document.title || `${Date.now()}`))
}

function guessRoomUrl() {
  return window.location.href
}

function extractRoomIdFromUrl(url = window.location.href) {
  const match = String(url || "").match(/\/rooms\/([^/?#]+)/i)
  return normalizeText(match?.[1] || "")
}

function extractCandidateNameFromUrl(pageUrl = window.location.href, meName = "") {
  try {
    const url = new URL(pageUrl, window.location.origin)
    const raw = normalizeText((url.searchParams.get("pageTitle") || "").replace(/\+/g, " "))
    if (!raw) return ""

    const candidates = raw
      .split(/[\u2022|•–—-]/)
      .map((part) => normalizeText(part))
      .filter(Boolean)

    const pool = candidates.length ? candidates : [raw]
    for (const candidate of pool) {
      if (!looksLikeName(candidate)) continue
      if (similarName(candidate, meName)) continue
      if (isInvalidCandidateName(candidate)) continue
      return candidate
    }
    return ""
  } catch {
    return ""
  }
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

function extractCandidateNameFromPageTitle(pageTitle = "", meName = "") {
  const title = normalizeText(pageTitle || "")
  if (!title) return ""
  const segments = title
    .split(/[\u2022|•–—-]/)
    .map((segment) => normalizeText(segment))
    .filter(Boolean)

  for (const segment of segments) {
    if (looksLikeName(segment) && !similarName(segment, meName) && !isInvalidCandidateName(segment)) return segment
  }

  if (looksLikeName(title) && !similarName(title, meName) && !isInvalidCandidateName(title)) return title
  return ""
}

function extractCandidateNameFromBodyText(bodyText = "", meName = "", preferredName = "") {
  const lines = normalizeBlockText(bodyText)
    .slice(0, 1500)
    .split("\n")
    .map((line) => normalizeText(line))
    .filter(Boolean)

  if (preferredName) {
    const preferred = safeName(preferredName)
    const preferredMatch = lines.find((line) => similarName(line, preferred) && !isInvalidCandidateName(line))
    if (preferredMatch) return preferredMatch
  }

  for (const line of lines.slice(0, 20)) {
    if (looksLikeName(line) && !similarName(line, meName) && !isInvalidCandidateName(line)) return line
  }
  return ""
}

function isLikelyHeadlineLine(line = "", meName = "", candidateName = "") {
  const textValue = normalizeText(line)
  if (!textValue) return false
  if (isTimestampLine(textValue)) return false
  if (looksLikeName(textValue)) return false
  if (UI_TEXT_PATTERNS.some((pattern) => pattern.test(textValue))) return false
  if (MESSAGE_NOISE_PATTERNS.some((pattern) => pattern.test(textValue))) return false
  if (similarName(textValue, meName)) return false
  if (candidateName && similarName(textValue, candidateName)) return false
  if (/^(hi|hello|hey|thanks|thank you|dear|good morning|good afternoon|good evening)\b/i.test(textValue)) return false
  if (textValue.length < 4 || textValue.length > 140) return false
  return true
}

function extractCandidateHeadline(bodyText = "", candidateName = "", meName = "") {
  const text = normalizeBlockText(bodyText).slice(0, 1500)
  if (!text) return ""
  const lines = text.split("\n").map((line) => normalizeText(line)).filter(Boolean)
  if (!lines.length) return ""

  let startIndex = -1
  const targetName = safeName(candidateName || "")
  if (targetName) {
    startIndex = lines.findIndex((line) => similarName(line, targetName))
  }
  if (startIndex < 0) {
    startIndex = lines.findIndex((line) => looksLikeName(line) && !similarName(line, meName))
  }
  if (startIndex < 0) return ""

  const headlineParts = []
  for (let index = startIndex + 1; index < Math.min(lines.length, startIndex + 6); index += 1) {
    const line = lines[index]
    if (!line) continue
    if (looksLikeName(line) || isTimestampLine(line)) break
    if (UI_TEXT_PATTERNS.some((pattern) => pattern.test(line))) continue
    if (MESSAGE_NOISE_PATTERNS.some((pattern) => pattern.test(line))) continue
    if (!isLikelyHeadlineLine(line, meName, candidateName)) continue
    headlineParts.push(line)
    if (headlineParts.join(" ").length >= 140) break
    if (headlineParts.length >= 2) break
  }

  return normalizeText(headlineParts.join(" "))
}

function extractConversationIdentity({ pageTitle = "", bodyText = "", messages = [], meName = "" } = {}) {
  const urlCandidateName = extractCandidateNameFromUrl(pageTitle, meName) || extractCandidateNameFromPageTitle(pageTitle, meName)
  const headerCandidateName = extractCandidateNameFromBodyText(bodyText, meName, urlCandidateName)
  const inferredCandidateName = chooseCandidateName(messages, meName, "Unknown Candidate")
  const finalCandidateName =
    (!isInvalidCandidateName(urlCandidateName) && urlCandidateName) ||
    (!isInvalidCandidateName(headerCandidateName) && headerCandidateName) ||
    (!isInvalidCandidateName(inferredCandidateName) && inferredCandidateName) ||
    "Unknown Candidate"
  const candidateHeadline = extractCandidateHeadline(bodyText, finalCandidateName, meName)
  return {
    urlCandidateName,
    headerCandidateName,
    inferredCandidateName,
    finalCandidateName,
    candidateHeadline,
  }
}

function isTimestampLine(textValue = "") {
  const normalized = normalizeText(textValue)
  if (!normalized) return false
  return TIME_PATTERN.test(normalized)
}

function extractUrlFromBackgroundImage(value = "") {
  const text = String(value || "").trim()
  if (!text || text === "none") return ""

  const match = text.match(/url\((['"]?)(.*?)\1\)/i)
  const url = normalizeText(match?.[2] || "")
  return /^https?:\/\//i.test(url) ? url : ""
}

function extractImageUrlFromElement(element) {
  if (!element || !(element instanceof Element)) return ""

  const candidates = []
  const directSrc = normalizeText(element.getAttribute("src") || "")
  const directSrcset = normalizeText(element.getAttribute("srcset") || "")
  if (directSrc) candidates.push(directSrc)
  if (directSrcset) {
    const srcsetUrl = directSrcset
      .split(",")
      .map((entry) => normalizeText(entry.split(/\s+/)[0] || ""))
      .find((value) => /^https?:\/\//i.test(value))
    if (srcsetUrl) candidates.push(srcsetUrl)
  }

  const style = window.getComputedStyle(element)
  const bgUrl = extractUrlFromBackgroundImage(style.backgroundImage || "")
  if (bgUrl) candidates.push(bgUrl)

  return candidates.find((value) => /^https?:\/\//i.test(value)) || ""
}

function isLikelyAvatarElement(element) {
  if (!element || !(element instanceof Element)) return false
  const rect = element.getBoundingClientRect()
  if (!rect || rect.width < 24 || rect.height < 24) return false
  const className = String(element.className || "").toLowerCase()
  const ariaLabel = String(element.getAttribute("aria-label") || "").toLowerCase()
  const alt = String(element.getAttribute("alt") || "").toLowerCase()
  if (/icon|favicon|svg|badge|avatar-placeholder|placeholder/.test(className)) return false
  if (/icon|favicon|badge/.test(ariaLabel)) return false
  if (/icon|favicon/.test(alt)) return false
  return true
}

function findCandidateRoomListContainer(candidateName = "") {
  const target = safeName(candidateName || "")
  if (!target || target === "Unknown Candidate" || isInvalidCandidateName(target)) return null

  const nodes = Array.from(document.querySelectorAll("section, div, article, li, a, button")).filter((node) => {
    if (!(node instanceof Element)) return false
    if (!isVisibleElement(node)) return false
    if (node === document.body || node === document.documentElement) return false
    const text = normalizeText(node.innerText || "")
    return Boolean(text) && text.toLowerCase().includes(target.toLowerCase())
  })

  let bestNode = null
  let bestScore = Number.NEGATIVE_INFINITY

  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    const width = Math.round(rect.width || 0)
    const height = Math.round(rect.height || 0)
    if (width < 80 || height < 32) continue
    if (width > 1800 || height > 1400) continue

    const className = String(node.className || "").toLowerCase()
    const text = normalizeText(node.innerText || "")
    let score = 0

    if (/rooms-panel|rooms-panel-room-list|room-list|right-content|header-row|avatar-content|room\b/.test(className)) score += 200
    if (text.toLowerCase().includes(target.toLowerCase())) score += 120
    if (node.querySelector("img,[style*='background-image']")) score += 120
    if (width <= 600 && height <= 260) score += 90
    if (width <= 400 && height <= 220) score += 60
    if (text.length > 1800) score -= 100
    if (/account settings|search messages|meeting recaps|people|files and links|personal notepad|activity timeline/i.test(text)) score -= 300

    if (score > bestScore) {
      bestScore = score
      bestNode = node
    }
  }

  return bestNode
}

function findCandidateRoomListItem(candidateName = "") {
  const name = safeName(candidateName || "")
  if (!name || name === "Unknown Candidate" || isInvalidCandidateName(name)) return null

  const candidates = Array.from(document.querySelectorAll("a.room-list-item, [class*='room-list-item']"))

  const matched = candidates
    .filter((el) => {
      if (!(el instanceof Element)) return false
      const text = safeName(el.innerText || "")
      return text.includes(name)
    })
    .sort((a, b) => {
      const aText = safeName(a.innerText || "")
      const bText = safeName(b.innerText || "")
      return aText.length - bText.length
    })

  return matched[0] || null
}

function extractAvatarUrlFromContainer(container) {
  if (!container) return ""

  const elements = Array.from(container.querySelectorAll("img, div, span, button, a, figure"))
  for (const el of elements) {
    if (!(el instanceof Element)) continue

    const src = el.tagName === "IMG" ? (el.currentSrc || el.src || "") : ""
    if (src && /profile-portraits/i.test(src)) return src

    const bg = window.getComputedStyle(el).backgroundImage || ""
    const bgUrl = extractUrlFromBackgroundImage(bg)
    if (bgUrl && /profile-portraits/i.test(bgUrl)) return bgUrl
  }

  return ""
}

function findLikelyCandidateNameFromText(value = "", meName = "") {
  const lines = String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => normalizeText(line))
    .filter(Boolean)

  for (const line of lines.slice(0, 30)) {
    if (!looksLikeName(line)) continue
    if (similarName(line, meName)) continue
    if (isInvalidCandidateName(line)) continue
    if (/^(candidate|me|unknown|saved|view details)$/i.test(line)) continue
    return line
  }

  return ""
}

function inferCandidateNameForAvatar(candidateName = "", meName = "") {
  const normalizedCandidateName = safeName(candidateName || "")
  if (normalizedCandidateName && normalizedCandidateName !== "Unknown Candidate" && !isInvalidCandidateName(normalizedCandidateName)) {
    return normalizedCandidateName
  }

  const title = normalizeText(document.title || "")
  const bodyText = normalizeBlockText(document.body?.innerText || "")
  return (
    findLikelyCandidateNameFromText(title, meName) ||
    findLikelyCandidateNameFromText(bodyText, meName) ||
    normalizedCandidateName ||
    "Unknown Candidate"
  )
}

function scoreAvatarElement({
  element,
  url,
  candidateText,
  meText,
  sourceType,
}) {
  if (!element || !(element instanceof Element)) return { score: Number.NEGATIVE_INFINITY, width: 0, height: 0 }

  const rect = element.getBoundingClientRect()
  const width = Math.round(rect.width || 0)
  const height = Math.round(rect.height || 0)
  if (width < 24 || height < 24) return { score: Number.NEGATIVE_INFINITY, width, height }

  const currentText = normalizeText(
    [
      element.getAttribute("alt") || "",
      element.getAttribute("aria-label") || "",
      element.parentElement?.innerText || "",
      element.closest("article,section,div,header,[role='main'],[role='heading']")?.innerText || "",
    ]
      .filter(Boolean)
      .join(" "),
  )

  let score = 0
  const lowerText = currentText.toLowerCase()
  const lowerUrl = normalizeText(url || "").toLowerCase()
  const className = String(element.className || "").toLowerCase()
  const ariaLabel = String(element.getAttribute("aria-label") || "").toLowerCase()

  if (candidateText && lowerText.includes(candidateText.toLowerCase())) score += 1000
  if (meText && lowerText.includes(meText.toLowerCase())) score -= 1000
  else if (meText) score += 200

  const topLeftDistance = Math.abs(rect.left) + Math.abs(rect.top)
  if (topLeftDistance < 900) score += 300
  if (width >= 32 && width <= 120 && height >= 32 && height <= 120) score += 200
  if (Math.abs(width - height) <= 8 || /50%|9999px/i.test(String(element.style.borderRadius || ""))) score += 100
  if (width > 180 || height > 180) score -= 300
  if (element.closest("nav,aside,footer,[role='navigation']")) score -= 300
  if (/(favicon|logo|icon|sprite|\.svg(\?|#|$))/i.test(lowerUrl)) score -= 500
  if (/(favicon|logo|icon|sprite)/i.test(className)) score -= 300
  if (/(favicon|logo|icon|sprite)/i.test(ariaLabel)) score -= 300
  if (/\/profile-portraits\//i.test(lowerUrl)) score += 600

  if (candidateText && lowerText.includes(candidateText.toLowerCase())) score += 400
  if (/Me\b/i.test(currentText) || /Julie Zhu/i.test(currentText)) score -= 500
  if (sourceType === "background") score += 25
  if (sourceType === "img") score += 10

  return { score, width, height }
}

function extractCandidateAvatarUrl(candidateName = "", meName = "") {
  const resolvedCandidateName = inferCandidateNameForAvatar(candidateName || "", meName || "")
  const candidateText = safeName(resolvedCandidateName || candidateName || "")
  const meText = safeName(meName || "")
  const seen = new Set()
  let best = ""
  let bestScore = Number.NEGATIVE_INFINITY
  let bestSourceType = ""
  let backgroundImageCandidateCount = 0

  const roomListItem = findCandidateRoomListItem(candidateText)
  const scopedAvatarUrl = extractAvatarUrlFromContainer(roomListItem)
  if (scopedAvatarUrl) {
    lastAvatarBackgroundImageCandidateCount = 1
    lastAvatarBestScore = 9999
    lastAvatarBestSourceType = "room-list-item"
    console.log("[BlackDog] avatar from room list item", {
      candidateName,
      scopedAvatarUrl,
      containerText: safeName(roomListItem?.innerText || "").slice(0, 160),
    })
    return scopedAvatarUrl
  }

  const candidateContainer = findCandidateRoomListContainer(candidateText)
  const collectAvatarSources = (root, strictCandidateScope = false) => {
    const sources = []
    if (!root || !(root instanceof Element || root instanceof Document || root instanceof ShadowRoot)) return sources

    const rootImgs = Array.from(root.querySelectorAll("img"))
    for (const img of rootImgs) {
      if (!(img instanceof Element)) continue
      if (!isVisibleElement(img)) continue
      if (!isLikelyAvatarElement(img)) continue

      const src = img.currentSrc || img.src || extractImageUrlFromElement(img)
      if (!src || !/^https?:\/\//i.test(src)) continue
      if (/favicon|logo|icon|sprite|\.svg(\?|#|$)/i.test(src)) continue
      if (seen.has(src)) continue
      seen.add(src)
      sources.push({ element: img, url: src, sourceType: "img" })
    }

    const rootElements = Array.from(root.querySelectorAll("div, span, button, a, figure"))
    for (const element of rootElements) {
      if (!(element instanceof Element)) continue
      if (!isVisibleElement(element)) continue
      if (element.closest("nav,aside,footer,[role='navigation']")) continue

      const computed = window.getComputedStyle(element)
      const bgUrl = extractUrlFromBackgroundImage(computed.backgroundImage || "")
      if (!bgUrl || !/^https?:\/\//i.test(bgUrl)) continue
      if (/favicon|logo|icon|sprite|\.svg(\?|#|$)/i.test(bgUrl)) continue
      const rect = element.getBoundingClientRect()
      const width = Math.round(rect.width || 0)
      const height = Math.round(rect.height || 0)
      if (width < 24 || height < 24) continue
      if (seen.has(bgUrl)) continue
      if (strictCandidateScope) {
        const currentText = normalizeText(element.innerText || element.parentElement?.innerText || "")
        const nearestText = normalizeText(
          element.closest("article,section,div,header,[role='main'],[role='heading']")?.innerText || "",
        )
        if (candidateText && !currentText.toLowerCase().includes(candidateText.toLowerCase()) && !nearestText.toLowerCase().includes(candidateText.toLowerCase())) continue
        if (meText && (currentText.toLowerCase().includes(meText.toLowerCase()) || nearestText.toLowerCase().includes(meText.toLowerCase()))) continue
      }
      seen.add(bgUrl)
      sources.push({ element, url: bgUrl, sourceType: "background" })
      backgroundImageCandidateCount += 1
    }

    return sources
  }

  const scopedSources = candidateContainer ? collectAvatarSources(candidateContainer, true) : []
  const fallbackSources = scopedSources.length ? [] : collectAvatarSources(document, false)
  const candidateSources = scopedSources.length ? scopedSources : fallbackSources

  for (const candidate of candidateSources) {
    const currentText = normalizeText(candidate.element?.innerText || candidate.element?.parentElement?.innerText || "")
    const nearestText = normalizeText(
      candidate.element?.closest("article,section,div,header,[role='main'],[role='heading']")?.innerText || "",
    )
    if (candidateText && !currentText.toLowerCase().includes(candidateText.toLowerCase()) && !nearestText.toLowerCase().includes(candidateText.toLowerCase())) continue
    if (meText && (currentText.toLowerCase().includes(meText.toLowerCase()) || nearestText.toLowerCase().includes(meText.toLowerCase()))) continue

    const { score } = scoreAvatarElement({
      element: candidate.element,
      url: candidate.url,
      candidateText,
      meText,
      sourceType: candidate.sourceType,
    })
    if (score > bestScore) {
      bestScore = score
      best = candidate.url
      bestSourceType = candidate.sourceType
    }
  }

  lastAvatarBackgroundImageCandidateCount = backgroundImageCandidateCount
  lastAvatarBestScore = Number.isFinite(bestScore) ? bestScore : 0
  lastAvatarBestSourceType = bestSourceType
  console.log("[BlackDog] avatar scoped search fallback", {
    candidateName,
    roomId: extractRoomIdFromUrl() || guessRoomId(),
    foundContainer: Boolean(candidateContainer),
    containerText: candidateContainer ? safeName(candidateContainer.innerText || "").slice(0, 120) : "",
    candidateAvatarUrl: best || "",
    lastCandidateAvatarUrl,
    lastCandidateAvatarRoomKey,
    lastCandidateAvatarCandidateName,
  })
  console.log("[BlackDog] avatar scoped search", {
    candidateName,
    roomId: extractRoomIdFromUrl() || guessRoomId(),
    foundContainer: Boolean(candidateContainer),
    containerText: candidateContainer ? safeName(candidateContainer.innerText || "").slice(0, 120) : "",
    candidateAvatarUrl: best || "",
    lastCandidateAvatarUrl,
    lastCandidateAvatarRoomKey,
    lastCandidateAvatarCandidateName,
  })
  return best || ""
}

function isUpworkMessagesRoomPage() {
  return /upwork\.com\/ab\/messages\/rooms\//i.test(String(window.location.href || ""))
}

function scheduleAvatarRetry() {
  if (avatarRetryTimer) clearTimeout(avatarRetryTimer)
  const roomId = extractRoomIdFromUrl() || guessRoomId()
  if (avatarRetryRoomKey !== roomId) {
    avatarRetryRoomKey = roomId
    avatarRetryCount = 0
  }
  if (avatarRetryCount >= AVATAR_RETRY_LIMIT) return

  avatarRetryTimer = window.setTimeout(() => {
    avatarRetryTimer = null
    avatarRetryCount += 1
    if (!isUpworkMessagesRoomPage()) return

    const nextRoomId = extractRoomIdFromUrl() || guessRoomId()
    const meName = cachedUpworkUserName || ""
    const candidateAvatarUrl = extractCandidateAvatarUrl("Unknown Candidate", meName)
    console.log("[BlackDog] avatar retry", {
      retry: avatarRetryCount,
      roomId: nextRoomId,
      candidateAvatarUrl,
      lastCandidateAvatarUrl,
      imgCount: document.querySelectorAll("img").length,
    })

    if (candidateAvatarUrl) {
      lastCandidateAvatarUrl = candidateAvatarUrl
      lastCandidateAvatarRoomKey = nextRoomId
      lastCandidateAvatarCandidateName = "Unknown Candidate"
      void broadcastSnapshot()
      return
    }

    if (avatarRetryCount < AVATAR_RETRY_LIMIT) {
      scheduleAvatarRetry()
    }
  }, AVATAR_RETRY_DELAY_MS)
}

function resetCurrentRoomTransientState() {
  lastCandidateAvatarUrl = ""
  lastCandidateAvatarRoomKey = ""
  lastCandidateAvatarCandidateName = ""
  avatarRetryCount = 0
  if (avatarRetryTimer) {
    clearTimeout(avatarRetryTimer)
    avatarRetryTimer = null
  }
}

function scheduleSnapshotBroadcast(reason = "mutation") {
  if (snapshotTimer) clearTimeout(snapshotTimer)
  snapshotTimer = window.setTimeout(() => {
    console.log("[BlackDog] schedule snapshot broadcast", {
      reason,
      url: window.location.href,
    })
    void broadcastSnapshot()
  }, SNAPSHOT_DEBOUNCE_MS)
}

function handlePossibleRoomChange(reason = "mutation") {
  const currentUrl = window.location.href
  if (currentUrl === lastObservedUrl) return false
  lastObservedUrl = currentUrl
  console.log("[BlackDog] room url changed", {
    reason,
    currentUrl,
  })
  resetCurrentRoomTransientState()
  scheduleSnapshotBroadcast("room_url_changed")
  return true
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
    if (!sender || sender === "Unknown" || isInvalidCandidateName(sender)) continue
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
  const roomUrl = guessRoomUrl()
  const roomId = extractRoomIdFromUrl(roomUrl) || guessRoomId()
  const sourceNode = getConversationRoot()
  const urlPageTitle = (() => {
    try {
      const url = new URL(roomUrl, window.location.origin)
      return normalizeText(url.searchParams.get("pageTitle") || "")
    } catch {
      return ""
    }
  })()
  const pageTitle = normalizeText(document.title || "Untitled Page")
  const conversationTitle = extractConversationTitle(sourceNode)
  const bodyText = normalizeBlockText(document.body?.innerText || "")

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

  const identity = extractConversationIdentity({
    pageTitle: urlPageTitle,
    bodyText,
    messages,
    meName,
  })
  const candidateName = identity.finalCandidateName
  const candidateHeadline = identity.candidateHeadline
  console.log("[BlackDog] snapshot identity", {
    roomId,
    roomUrl,
    urlCandidateName: identity.urlCandidateName,
    headerCandidateName: identity.headerCandidateName,
    inferredCandidateName: identity.inferredCandidateName,
    finalCandidateName: candidateName,
    messageCount: messages.length,
    candidateHeadline,
  })
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
  const candidateAvatarUrl = extractCandidateAvatarUrl(candidateName, meName)
  console.log("[BlackDog] candidate avatar", {
    candidateName,
    meName,
    candidateAvatarUrl,
    backgroundImageCandidateCount: lastAvatarBackgroundImageCandidateCount,
    bestAvatarScore: lastAvatarBestScore,
    bestAvatarSourceType: lastAvatarBestSourceType,
    lastCandidateAvatarUrl,
    lastCandidateAvatarRoomKey,
    lastCandidateAvatarCandidateName,
    imgCount: document.querySelectorAll("img").length,
    retryScheduled: Boolean(avatarRetryTimer),
  })
  const imageCount = document.querySelectorAll("img").length
  const shouldRetryAvatar = (candidateName === "Unknown Candidate" || imageCount === 0) && !candidateAvatarUrl
  if (candidateAvatarUrl) {
    lastCandidateAvatarUrl = candidateAvatarUrl
    lastCandidateAvatarRoomKey = roomId
    lastCandidateAvatarCandidateName = candidateName
  } else if (!lastCandidateAvatarUrl && shouldRetryAvatar && !avatarRetryTimer && avatarRetryCount < AVATAR_RETRY_LIMIT) {
    scheduleAvatarRetry()
  }
  const stableAvatarUrl =
    roomId &&
    lastCandidateAvatarRoomKey === roomId &&
    safeName(lastCandidateAvatarCandidateName) === safeName(candidateName)
      ? lastCandidateAvatarUrl
      : ""
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
    candidateHeadline,
    conversationTitle,
    candidateAvatarUrl: candidateAvatarUrl || stableAvatarUrl || "",
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
    `${snapshot.roomId}|${snapshot.meName}|${snapshot.candidateName}|${snapshot.candidateHeadline}|${snapshot.candidateAvatarUrl}|${snapshot.conversationMessages.map((message) => message.id).join("|")}|${snapshot.totalMessagesCaptured}`,
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
  scheduleSnapshotBroadcast("mutation")
}

function startObserver() {
  if (observerStarted) return
  observerStarted = true

  const target = document.body || document.documentElement
  if (!target) return

  const observer = new MutationObserver(() => {
    if (!handlePossibleRoomChange("mutation")) {
      scheduleBroadcast()
    }
  })

  observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  const patchHistoryMethod = (methodName) => {
    const original = history[methodName]
    if (typeof original !== "function") return
    if (original.__blackdogPatched) return
    const patched = function patchedHistoryState(...args) {
      const result = original.apply(this, args)
      handlePossibleRoomChange(methodName)
      return result
    }
    patched.__blackdogPatched = true
    history[methodName] = patched
  }

  patchHistoryMethod("pushState")
  patchHistoryMethod("replaceState")

  window.addEventListener("popstate", () => {
    handlePossibleRoomChange("popstate")
    scheduleBroadcast()
  })
  window.addEventListener("focus", () => {
    handlePossibleRoomChange("focus")
    scheduleBroadcast()
  })
  window.addEventListener("visibilitychange", () => {
    handlePossibleRoomChange("visibilitychange")
    scheduleBroadcast()
  })
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.upworkUserName) return
    setCachedUpworkUserName(changes.upworkUserName.newValue || "")
    scheduleBroadcast()
  })

  scheduleBroadcast()
}

function collectUpworkSnapshot() {
  console.log("[BlackDog content] collect snapshot requested")
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
        .then((snapshot) => {
          console.log("[BlackDog content] snapshot result", {
            roomId: snapshot?.roomId,
            candidateName: snapshot?.candidateName,
            messageCount: Array.isArray(snapshot?.conversationMessages) ? snapshot.conversationMessages.length : 0,
          })
          sendResponse({ ok: true, snapshot })
        })
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
