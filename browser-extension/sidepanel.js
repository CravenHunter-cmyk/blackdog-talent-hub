const STORAGE_KEY = "blackdogRecruitingHelperRoomsStateV1"
const RECRUITING_PROJECTS = [
  "Native LLM Evaluator Recruitment",
  "Speech Annotation Recruitment",
  "Arabic Evaluator Pool",
  "Indonesian Data Annotation Pool",
]
const DEFAULT_RECRUITING_PROJECT = RECRUITING_PROJECTS[0]

const state = {
  upworkUserName: "",
  selectedRecruitingProject: DEFAULT_RECRUITING_PROJECT,
  conversationTranslationDefaultExpanded: false,
  conversationTranslationExpanded: false,
  conversationTranslationLoading: false,
  conversationTranslationLoadingRoomId: "",
  rooms: {},
  activeRoomKey: "",
  activeRoomId: "",
  liveRoomId: "",
  connectionStatus: "Waiting for active Upwork tab",
  lastSync: "Never",
  extractionMode: "Unknown",
  lastAction: "idle",
  debugScanStatus: "idle",
  debugScanResults: [],
  debugScanError: "",
  replyGoal: "Auto",
  replyTone: "Professional and friendly",
  replyCustomInstruction: "",
  replyScriptId: "",
  projectScriptStatus: "",
  replyEnglish: "",
  replyEnglishCopyStatus: "",
  replyChineseNotes: "",
  replyNextStep: "",
  replyStatus: "Ready",
  replyResultType: "",
  replyPayloadPreview: "",
  replyResponsePreview: "",
  replyError: "",
  replyLoading: false,
  replyTranslateLoading: false,
  replyChineseDraft: "",
  talentProfiles: {},
  talentProfileModalOpen: false,
  talentProfileRoomId: "",
  talentProfileDraft: null,
  talentProfileStatus: "",
}

let projectScriptStatusTimer = null
let roomsNormalizationNeedsPersist = false

const PROJECT_SCRIPT_LIBRARY = {
  "Native LLM Evaluator Recruitment": [
    {
      id: "script_1",
      title: "话术1：初次打招呼",
      text:
        "Hi, nice to meet you, and thank you for your interest.\nCould you please briefly share what LLM evaluation, AI response rating, data annotation, or linguistic QA projects you have worked on before?\nIf possible, please also let me know which companies or platforms you have worked with, and how many hours per day you are usually available when tasks are assigned.",
    },
    {
      id: "script_2",
      title: "话术2：询问评测经验",
      text:
        "Could you please share more details about your previous LLM evaluation, AI response rating, data annotation, or linguistic QA experience?\nIt would be helpful to know the types of tasks you handled and the platforms or companies you worked with, if you are able to share.",
    },
    {
      id: "script_3",
      title: "话术3：询问可工作时间",
      text:
        "Could you please let me know your usual availability for this type of project?\nFor example, how many hours per day or per week you can usually commit when tasks are assigned.",
    },
    {
      id: "script_4",
      title: "话术4：询问时薪",
      text:
        "Could you also share your expected hourly rate for native-language evaluation or data annotation work?\nFor each specific task, we will confirm the workload, timeline, and payment method before starting.",
    },
    {
      id: "script_5",
      title: "话术5：说明项目制合作模式",
      text:
        "Just to make our working model clear: our tasks are project-based and may not be available every day. They are usually released in stages, and before each task starts, we will check your availability and confirm the schedule with you in advance.\nIf your evaluation quality is good and communication is smooth, we will give you higher priority for future tasks in your language. Our goal is to build a long-term evaluator pool and work with reliable evaluators continuously.\nWould this working model be acceptable for you?",
    },
    {
      id: "script_6",
      title: "话术6：说明付款方式",
      text:
        "For payment, we can first agree on a general hourly rate for cooperation. However, the final payment for each task may vary depending on the task type, difficulty, workload, expected efficiency, and language.\nBefore each task starts, we will clearly confirm the task details, timeline, and payment method with you.",
    },
    {
      id: "script_7",
      title: "话术7：加入人才池",
      text:
        "Thank you for sharing your background. Your experience looks relevant to our LLM evaluation projects.\nWe can first keep you in our evaluator pool for your language. Once we have a suitable task, I will contact you as soon as possible with the task details, schedule, guideline, and payment information.\nPlease stay responsive on Upwork, as some projects may require quick confirmation before starting.",
    },
    {
      id: "script_8",
      title: "话术8：邀请筛选测试",
      text:
        "Based on your background, we would like to invite you to a short screening step for this type of evaluation work.\nBefore starting, we will share the task requirements, guideline, timeline, and payment details for your confirmation.",
    },
  ],
  "Speech Annotation Recruitment": [
    {
      id: "script_1",
      title: "话术1：说明语音任务",
      text:
        "Hi, thank you for your interest.\nWe are recruiting for speech annotation tasks, and I’d like to share a bit more about the working scope.\nCould you briefly tell me about your experience with speech labeling, transcription, or audio quality review?",
    },
    {
      id: "script_2",
      title: "话术2：询问设备和环境",
      text:
        "To make sure the work runs smoothly, could you please share what device and recording environment you usually use?\nIt would also help to know whether you have a quiet workspace and stable internet connection for this type of task.",
    },
    {
      id: "script_3",
      title: "话术3：确认可录音时间",
      text:
        "Could you let me know how many hours per day you are usually available for speech annotation or recording review tasks?\nThis will help us understand how to match you with upcoming work.",
    },
  ],
  "Arabic Evaluator Pool": [
    {
      id: "script_1",
      title: "话术1：确认阿拉伯语地区",
      text:
        "Hi, thanks for your interest in our Arabic evaluator pool.\nCould you please confirm which Arabic region you are most familiar with, such as MENA, KSA, or other Arabic-speaking regions?",
    },
    {
      id: "script_2",
      title: "话术2：询问 MENA / KSA / RoW 覆盖",
      text:
        "It would be helpful to know whether your Arabic background covers MENA, KSA, or other regional variants.\nThis helps us understand which projects may be the best fit for you.",
    },
    {
      id: "script_3",
      title: "话术3：确认评测经验",
      text:
        "Could you please share any previous experience you have with Arabic language evaluation, data annotation, or QA tasks?\nA brief summary is enough for us to review your fit.",
    },
  ],
  "Indonesian Data Annotation Pool": [
    {
      id: "script_1",
      title: "话术1：确认印尼语母语背景",
      text:
        "Hi, thank you for your interest in our Indonesian data annotation pool.\nCould you please confirm whether Indonesian is your native language or the main language you work with most often?",
    },
    {
      id: "script_2",
      title: "话术2：询问标注经验",
      text:
        "Could you please share any previous experience you have with data annotation, LLM evaluation, or related language tasks?\nIt would help us understand your background better.",
    },
    {
      id: "script_3",
      title: "话术3：确认可用时间和时薪",
      text:
        "Could you also let me know your usual availability and expected hourly rate for Indonesian annotation work?\nThis will help us plan upcoming tasks more accurately.",
    },
  ],
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

function normalizeText(value = "") {
  return safeName(value)
}

function similarName(a = "", b = "") {
  const left = safeName(a).toLowerCase()
  const right = safeName(b).toLowerCase()
  if (!left || !right) return false
  if (left === right) return true
  return left.replace(/[^a-z0-9]+/g, "") === right.replace(/[^a-z0-9]+/g, "")
}

function isInvalidCandidateName(name = "") {
  const value = safeName(name).toLowerCase()
  const blocked = [
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
  return !value || blocked.includes(value)
}

function normalizeRoomUrl(value = "") {
  const input = normalizeText(value || "")
  if (!input) return ""
  try {
    const url = new URL(input)
    url.hash = ""
    const removableParams = [
      "sidebar",
      "companyReference",
      "pageTitle",
      "ref",
      "source",
      "utm_source",
      "utm_medium",
      "utm_campaign",
    ]
    removableParams.forEach((key) => url.searchParams.delete(key))
    const query = url.searchParams.toString()
    return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`
  } catch {
    return input
  }
}

function getRoomKey(snapshot = {}) {
  const roomId = normalizeText(snapshot.roomId || "")
  if (roomId) return roomId
  const roomUrl = normalizeRoomUrl(snapshot.roomUrl || snapshot.pageUrl || "")
  if (roomUrl) return roomUrl
  const name = normalizeText(snapshot.candidateName || "").toLowerCase()
  const platform = normalizeText(snapshot.platform || "Upwork").toLowerCase()
  return `${platform}:${name}`
}

function getActiveRoomKey() {
  return safeName(state.activeRoomKey || state.activeRoomId || "")
}

function getRoomDedupeScore(room = {}) {
  const roomKey = getRoomKey(room)
  const roomUrl = normalizeRoomUrl(room.roomUrl || room.pageUrl || "")
  const messages = Array.isArray(room.conversationMessages) ? room.conversationMessages.length : 0
  const candidateName = safeName(room.candidateName || "")
  const score =
    (roomKey ? 1000 : 0) +
    (roomUrl ? 700 : 0) +
    messages * 20 +
    (safeName(room.candidateAvatarUrl || room.avatarUrl || "") ? 150 : 0) +
    (safeName(room.candidateHeadline || "") ? 120 : 0) +
    (safeName(room.lastSyncedAt || room.updatedAt || room.lastSeenAt || "") ? 40 : 0) +
    (similarName(candidateName, state.upworkUserName || "") ? 25 : 0) +
    (room.roomId === getActiveRoomKey() ? 5000 : 0) +
    (room.roomId === state.liveRoomId ? 4000 : 0) +
    ((room.status || "active") === "active" ? 300 : (room.status || "active") === "kept" ? 200 : 100)
  return score
}

function dedupeCandidateRooms(rooms = {}) {
  const entries = Array.isArray(rooms)
    ? rooms.map((room, index) => [safeName(room?.roomId || room?.roomUrl || room?.pageUrl || `room-${index}`), room])
    : Object.entries(rooms || {})

  const beforeCount = entries.length
  const removedDuplicates = []
  const removedInvalid = []
  const keyMap = new Map()
  const roomUrlMap = new Map()

  const collect = (room, inputKey, index) => {
    if (!room || typeof room !== "object") return
    const roomKey = getRoomKey(room) || safeName(inputKey || room.roomId || room.roomUrl || room.pageUrl || `room-${index}`)
    const candidateName = safeName(room.candidateName || "")
    if (isInvalidCandidateName(candidateName) && candidateName !== "Unknown Candidate") {
      removedInvalid.push({
        roomKey,
        candidateName,
        roomUrl: safeName(room.roomUrl || room.pageUrl || ""),
      })
      return
    }

    const normalizedRoom = { ...room, roomId: roomKey }
    if (!keyMap.has(roomKey)) {
      keyMap.set(roomKey, normalizedRoom)
      return
    }
    const existing = keyMap.get(roomKey)
    const merged = mergeRoomRecord(existing, normalizedRoom)
    keyMap.set(roomKey, merged)
    removedDuplicates.push({
      duplicateCandidateName: safeName(room.candidateName || ""),
      oldKey: roomKey,
      keptKey: roomKey,
      reason: "room-key",
    })
  }

  entries.forEach(([inputKey, room], index) => collect(room, inputKey, index))

  const roomKeyEntries = Array.from(keyMap.entries())
  const finalRooms = {}
  for (const [roomKey, room] of roomKeyEntries) {
    const roomUrl = normalizeRoomUrl(room.roomUrl || room.pageUrl || "")
    if (!roomUrl) {
      finalRooms[roomKey] = room
      continue
    }

    const existingKey = roomUrlMap.get(roomUrl)
    if (!existingKey || existingKey === roomKey) {
      roomUrlMap.set(roomUrl, roomKey)
      finalRooms[roomKey] = room
      continue
    }

    const existing = finalRooms[existingKey]
    if (!existing) {
      roomUrlMap.set(roomUrl, roomKey)
      finalRooms[roomKey] = room
      continue
    }

    const existingScore = getRoomDedupeScore(existing)
    const incomingScore = getRoomDedupeScore(room)
    const keptKey = incomingScore > existingScore ? roomKey : existingKey
    const keptRoom = keptKey === roomKey ? room : existing
    const mergedRoom = mergeRoomRecord(keptRoom, keptKey === roomKey ? existing : room)
    finalRooms[keptKey] = mergedRoom
    roomUrlMap.set(roomUrl, keptKey)
    if (keptKey !== roomKey) delete finalRooms[roomKey]
    if (keptKey !== existingKey) delete finalRooms[existingKey]
    removedDuplicates.push({
      duplicateCandidateName: safeName(room.candidateName || existing.candidateName || ""),
      oldKey: keptKey === roomKey ? existingKey : roomKey,
      keptKey,
      reason: "room-url",
    })

    const removedKey = keptKey === roomKey ? existingKey : roomKey
    if (getActiveRoomKey() === removedKey) {
      state.activeRoomKey = keptKey
      state.activeRoomId = keptKey
    }
    if (state.liveRoomId === removedKey) {
      state.liveRoomId = keptKey
    }
  }

  const activeKey = getActiveRoomKey()
  const liveKey = state.liveRoomId
  if (liveKey && !finalRooms[liveKey]) {
    if (activeKey && finalRooms[activeKey] && activeKey === liveKey) {
      state.liveRoomId = activeKey
    } else {
      state.liveRoomId = ""
    }
  }

  if (removedInvalid.length) {
    console.log("[BlackDog] removed invalid candidate rooms", removedInvalid)
    roomsNormalizationNeedsPersist = true
  }
  if (removedDuplicates.length) {
    console.log("[BlackDog] dedupe candidate rooms", {
      beforeCount,
      afterCount: Object.keys(finalRooms).length,
      removedDuplicates,
    })
    roomsNormalizationNeedsPersist = true
  }

  return finalRooms
}

function nowIso() {
  return new Date().toISOString()
}

function getTalentProfileKey(room = {}) {
  const roomKey = getRoomKey(room)
  if (roomKey) return roomKey
  const roomUrl = normalizeRoomUrl(room.roomUrl || room.pageUrl || "")
  if (roomUrl) return roomUrl
  const candidate = isInvalidCandidateName(room.candidateName || "") ? "" : safeName(room.candidateName || "")
  const platform = "Upwork"
  return candidate ? `${candidate}:${platform}` : ""
}

function candidateHeadlineToTaskTags(headline = "") {
  const raw = safeName(headline || "")
  if (!raw) return ""
  const parts = raw
    .split("|")
    .flatMap((segment) => String(segment || "").split(/[,/&·•]/g))
    .map((item) => safeName(item))
    .filter(Boolean)

  const unique = []
  const seen = new Set()
  for (const part of parts) {
    const normalized = part.replace(/\s+/g, " ").trim()
    if (!normalized) continue
    const lower = normalized.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    unique.push(normalized)
  }
  return unique.slice(0, 8).join(", ")
}

function prefillTalentProfileFromRoom(profile = {}, room = {}) {
  const next = {
    ...profile,
    candidateHeadline: safeName(profile.candidateHeadline || room.candidateHeadline || ""),
  }
  const headline = safeName(next.candidateHeadline || "")
  if (!headline) return next
  const mainSkill = safeName(next.mainSkill || "")
  const taskTags = safeName(next.taskTags || "")
  const headlineMain = headline.split("|")[0].trim()
  if (!mainSkill && headlineMain) {
    next.mainSkill = headlineMain
  }
  if (!taskTags) {
    next.taskTags = candidateHeadlineToTaskTags(headline)
  }
  return next
}

function createInitialTalentProfile(room = {}) {
  const candidateName = isInvalidCandidateName(room.candidateName || "") ? "Unknown Candidate" : safeName(room.candidateName || "Unknown Candidate")
  return {
    roomId: safeName(room.roomId || ""),
    candidateName,
    candidateHeadline: safeName(room.candidateHeadline || ""),
    platform: "Upwork",
    upworkChatUrl: safeName(room.roomUrl || room.pageUrl || ""),
    profileUrl: "",
    upworkProfileUrl: "",
    nativeLanguage: "",
    secondLanguage: "",
    languageVariant: "",
    otherLanguages: "",
    mainSkill: "",
    taskTags: "",
    experienceSummary: "",
    hasLLMEvaluationExperience: "Unknown",
    evaluationTypes: "",
    platformsCompanies: "",
    dailyAvailability: "",
    weekendAvailability: "",
    email: "",
    onlineContactMethod: "WhatsApp",
    onlineContactAccount: "",
    avatarUrl: safeName(room.candidateAvatarUrl || room.avatarUrl || ""),
    submittedToTalentPool: false,
    submittedAt: "",
    updatedAt: nowIso(),
  }
}

function normalizeTalentProfile(profile = {}, room = {}) {
  const fallback = createInitialTalentProfile(room)
  const incomingCandidate = safeName(profile.candidateName || "")
  const roomCandidate = safeName(room.candidateName || "")
  const candidateName =
    (!isInvalidCandidateName(incomingCandidate) && incomingCandidate) ||
    (!isInvalidCandidateName(roomCandidate) && roomCandidate) ||
    fallback.candidateName
  return {
    ...fallback,
    roomId: safeName(profile.roomId || room.roomId || fallback.roomId),
    candidateName,
    candidateHeadline: safeName(profile.candidateHeadline || room.candidateHeadline || fallback.candidateHeadline),
    platform: "Upwork",
    upworkChatUrl: safeName(profile.upworkChatUrl || room.roomUrl || room.pageUrl || fallback.upworkChatUrl),
    profileUrl: safeName(profile.profileUrl || profile.upworkProfileUrl || fallback.profileUrl || fallback.upworkProfileUrl || ""),
    upworkProfileUrl: safeName(profile.profileUrl || profile.upworkProfileUrl || fallback.profileUrl || fallback.upworkProfileUrl || ""),
    weekendAvailability: ["", "Yes", "No"].includes(profile.weekendAvailability) ? profile.weekendAvailability : "",
    nativeLanguage: safeName(profile.nativeLanguage || fallback.nativeLanguage || ""),
    secondLanguage: safeName(profile.secondLanguage || profile.otherLanguages || fallback.secondLanguage || ""),
    languageVariant: safeName(profile.languageVariant || fallback.languageVariant || ""),
    otherLanguages: safeName(profile.otherLanguages || profile.secondLanguage || fallback.otherLanguages || ""),
    mainSkill: safeName(profile.mainSkill || fallback.mainSkill || ""),
    taskTags: safeName(profile.taskTags || fallback.taskTags || ""),
    experienceSummary: safeName(profile.experienceSummary || fallback.experienceSummary || ""),
    hasLLMEvaluationExperience: ["Unknown", "Yes", "No"].includes(profile.hasLLMEvaluationExperience)
      ? profile.hasLLMEvaluationExperience
      : "Unknown",
    evaluationTypes: safeName(profile.evaluationTypes || fallback.evaluationTypes || ""),
    platformsCompanies: safeName(profile.platformsCompanies || fallback.platformsCompanies || ""),
    dailyAvailability: ["", "0–2 hours/day", "2–4 hours/day", "4–6 hours/day", "Any time"].includes(profile.dailyAvailability)
      ? profile.dailyAvailability
      : "",
    email: safeName(profile.email || fallback.email || ""),
    onlineContactMethod: safeName(profile.onlineContactMethod || fallback.onlineContactMethod || "WhatsApp") || "WhatsApp",
    onlineContactAccount: safeName(profile.onlineContactAccount || fallback.onlineContactAccount || ""),
    avatarUrl: profile.avatarUrl || room.candidateAvatarUrl || room.avatarUrl || "",
    submittedToTalentPool: Boolean(profile.submittedToTalentPool),
    submittedAt: profile.submittedAt || "",
    updatedAt: profile.updatedAt || nowIso(),
  }
}

function cleanupInvalidCandidateRooms() {
  const removedRooms = []
  const nextRooms = {}
  const nextTalentProfiles = { ...(state.talentProfiles || {}) }
  const removedKeys = new Set()

  Object.entries(state.rooms || {}).forEach(([roomKey, room]) => {
    const candidateName = safeName(room?.candidateName || "")
    if (isInvalidCandidateName(candidateName) && candidateName !== "Unknown Candidate") {
      removedKeys.add(roomKey)
      removedRooms.push({
        roomKey,
        candidateName,
        roomUrl: safeName(room?.roomUrl || room?.pageUrl || ""),
      })
      delete nextTalentProfiles[getTalentProfileKey(room || {})]
      return
    }
    nextRooms[roomKey] = room
  })

  if (removedRooms.length) {
    state.rooms = nextRooms
    state.talentProfiles = nextTalentProfiles
    if (removedKeys.has(state.activeRoomKey)) {
      state.activeRoomKey = Object.keys(nextRooms)[0] || ""
      state.activeRoomId = state.activeRoomKey
    }
    if (removedKeys.has(state.liveRoomId)) {
      state.liveRoomId = ""
    }
    roomsNormalizationNeedsPersist = true
    console.log("[BlackDog] removed invalid candidate rooms", removedRooms)
    void storageSet({ talentProfiles: state.talentProfiles })
  }
}

function avatarInitials(name = "") {
  const parts = safeName(name)
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return "U"
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function setDebugAction(action) {
  state.lastAction = action
  console.log("[BlackDog] Last action:", action)
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
    status: snapshot.status || "active",
    conversationMessages: [],
    totalMessagesCaptured: 0,
    lastMessageText: "",
    lastMessageTime: "",
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
    if (isInvalidCandidateName(sender)) continue
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
    selectedRecruitingProject: state.selectedRecruitingProject || DEFAULT_RECRUITING_PROJECT,
    rooms: state.rooms,
    activeRoomKey: getActiveRoomKey(),
    activeRoomId: state.activeRoomId,
  }
}

async function persistState() {
  await storageSet({ [STORAGE_KEY]: serializeState() })
}

function mergeRoomRecord(existing = {}, incoming = {}) {
  const previousKey = getRoomKey(existing)
  const incomingKey = getRoomKey(incoming)
  const roomKey = incomingKey || previousKey
  const existingRoomUrl = normalizeRoomUrl(existing.roomUrl || existing.pageUrl || "")
  const incomingRoomUrl = normalizeRoomUrl(incoming.roomUrl || incoming.pageUrl || "")
  const sameRoomUrl = !existingRoomUrl || !incomingRoomUrl || existingRoomUrl === incomingRoomUrl
  const existingCandidateName = safeName(existing.candidateName || "")
  const incomingCandidateName = safeName(incoming.candidateName || "")
  const incomingIsKnownCandidate =
    incomingCandidateName && incomingCandidateName !== "Unknown Candidate" && !isInvalidCandidateName(incomingCandidateName)
  const existingIsKnownCandidate =
    existingCandidateName && existingCandidateName !== "Unknown Candidate" && !isInvalidCandidateName(existingCandidateName)
  const candidateName = incomingIsKnownCandidate
    ? incomingCandidateName
    : existingIsKnownCandidate
      ? existingCandidateName
      : "Unknown Candidate"

  const incomingMessages = Array.isArray(incoming.conversationMessages) ? incoming.conversationMessages : []
  const existingMessages = Array.isArray(existing.conversationMessages) ? existing.conversationMessages : []
  const meName = safeName(incoming.meName || existing.meName || state.upworkUserName || "")
  const messageSeed = incomingMessages.length
    ? mergeMessages(existingMessages, incomingMessages, roomKey, meName, candidateName)
    : existingMessages
  const statusPriority = { active: 1, kept: 2, closed: 3 }
  const existingStatus = safeName(existing.status || "active") || "active"
  const incomingStatus = safeName(incoming.status || "") || ""
  const mergedStatus =
    incomingStatus && statusPriority[incomingStatus] >= (statusPriority[existingStatus] || 0)
      ? incomingStatus
      : existingStatus

  const mergedCandidateHeadline = safeName(incoming.candidateHeadline || existing.candidateHeadline || "")
  const mergedAvatarUrl =
    safeName(incoming.candidateAvatarUrl || "") &&
    sameRoomUrl &&
    (incomingIsKnownCandidate ? !existingIsKnownCandidate || similarName(incomingCandidateName, existingCandidateName) : true)
      ? safeName(incoming.candidateAvatarUrl || "")
      : safeName(existing.candidateAvatarUrl || existing.avatarUrl || "")

  const merged = {
    ...existing,
    ...incoming,
    roomId: roomKey,
    roomUrl: incoming.roomUrl || incoming.pageUrl || existing.roomUrl || existing.pageUrl || "",
    pageUrl: incoming.pageUrl || incoming.roomUrl || existing.pageUrl || existing.roomUrl || "",
    candidateName,
    candidateHeadline: mergedCandidateHeadline,
    candidateAvatarUrl: mergedAvatarUrl,
    conversationMessages: messageSeed,
    totalMessagesCaptured: messageSeed.length,
    lastMessageText: messageSeed.length ? messageSeed[messageSeed.length - 1].text || "" : safeName(existing.lastMessageText || ""),
    lastMessageTime: messageSeed.length ? messageSeed[messageSeed.length - 1].timestamp || "" : safeName(existing.lastMessageTime || ""),
    lastSyncedAt: incoming.lastSyncedAt || incoming.capturedAt || existing.lastSyncedAt || nowIso(),
    lastSeenAt: nowIso(),
    extractionMode: incoming.extractionMode || existing.extractionMode || "fallback_debug_only",
    status: mergedStatus,
    cachedConversation: Boolean(existing.cachedConversation || incoming.cachedConversation || false),
  }

  return merged
}

function normalizeRoomCollection(rooms = {}) {
  return dedupeCandidateRooms(rooms)
}

async function loadState() {
  const items = await storageGet([
    STORAGE_KEY,
    "upworkUserName",
    "selectedRecruitingProject",
    "conversationTranslationDefaultExpanded",
    "talentProfiles",
  ])
  const saved = items[STORAGE_KEY] || {}
  state.upworkUserName = safeName(saved.upworkUserName || items.upworkUserName || "")
  state.selectedRecruitingProject = safeName(
    saved.selectedRecruitingProject || items.selectedRecruitingProject || DEFAULT_RECRUITING_PROJECT,
  )
  if (!RECRUITING_PROJECTS.includes(state.selectedRecruitingProject)) {
    state.selectedRecruitingProject = DEFAULT_RECRUITING_PROJECT
  }
  state.conversationTranslationDefaultExpanded = Boolean(
    saved.conversationTranslationDefaultExpanded ?? items.conversationTranslationDefaultExpanded ?? false,
  )
  state.conversationTranslationExpanded = state.conversationTranslationDefaultExpanded
  state.rooms = normalizeRoomCollection(saved.rooms && typeof saved.rooms === "object" ? saved.rooms : {})
  state.talentProfiles = items.talentProfiles && typeof items.talentProfiles === "object" ? items.talentProfiles : {}
  cleanupInvalidCandidateRooms()
  Object.values(state.rooms).forEach((room) => {
    if (room && typeof room === "object") {
      room.cachedConversation = true
      room.status = room.status || "active"
    }
  })
  const savedActiveRoomKey = safeName(saved.activeRoomKey || "")
  const savedActiveRoomId = safeName(saved.activeRoomId || "")
  const preferredActiveKey = savedActiveRoomKey || savedActiveRoomId
  state.activeRoomKey = preferredActiveKey && state.rooms[preferredActiveKey] ? preferredActiveKey : ""
  state.activeRoomId = state.activeRoomKey
  if (!state.activeRoomKey && preferredActiveKey) {
    const savedUrl = normalizeRoomUrl(preferredActiveKey)
    const matched = Object.entries(state.rooms).find(([, room]) => {
      if (!room || typeof room !== "object") return false
      const roomKey = getRoomKey(room)
      const roomUrl = normalizeRoomUrl(room.roomUrl || room.pageUrl || "")
      return roomKey === preferredActiveKey || (savedUrl && roomUrl && savedUrl === roomUrl)
    })
    if (matched) state.activeRoomKey = matched[0]
  }
  if (!state.activeRoomKey) {
    state.activeRoomKey = Object.keys(state.rooms)[0] || ""
  }
  state.activeRoomId = state.activeRoomKey
  state.liveRoomId = ""
  if (state.activeRoomKey && !state.rooms[state.activeRoomKey]) {
    state.activeRoomKey = Object.keys(state.rooms)[0] || ""
    state.activeRoomId = state.activeRoomKey
  }
  state.talentProfiles = items.talentProfiles && typeof items.talentProfiles === "object" ? items.talentProfiles : state.talentProfiles
  if (roomsNormalizationNeedsPersist) {
    roomsNormalizationNeedsPersist = false
    await persistState()
  }
}

function activeRoom() {
  const activeKey = getActiveRoomKey()
  return activeKey && state.rooms[activeKey] ? state.rooms[activeKey] : null
}

function liveRoom() {
  return state.liveRoomId && state.rooms[state.liveRoomId] ? state.rooms[state.liveRoomId] : null
}

function getRoomsArray() {
  const deduped = dedupeCandidateRooms(state.rooms || {})
  state.rooms = deduped
  cleanupInvalidCandidateRooms()
  if (roomsNormalizationNeedsPersist) {
    roomsNormalizationNeedsPersist = false
    void persistState()
  }
  return Object.values(deduped).filter((room) => room && typeof room === "object")
}

function formatLastMessageTime(room) {
  if (!room?.conversationMessages?.length) return "—"
  const timestamp = room.conversationMessages[room.conversationMessages.length - 1].timestamp || ""
  return timestamp && timestamp !== "Unknown" ? timestamp : "—"
}

function getConversationMessages(room = activeRoom()) {
  if (!room || !Array.isArray(room.conversationMessages)) return []
  return room.conversationMessages.filter(isMeaningfulConversationMessage)
}

function getConversationTranslationMap(room) {
  if (!room || typeof room.conversationTranslations !== "object" || !room.conversationTranslations) return {}
  return room.conversationTranslations
}

function getConversationTranslationEntry(room, messageId) {
  return getConversationTranslationMap(room)[messageId] || null
}

function setConversationTranslationEntry(roomId, messageId, entry) {
  const room = state.rooms[roomId]
  if (!room) return
  if (!room.conversationTranslations || typeof room.conversationTranslations !== "object") {
    room.conversationTranslations = {}
  }
  room.conversationTranslations[messageId] = entry
}

function getConversationTranslationTargetMessages(room) {
  const messages = getConversationMessages(room)
  if (!messages.length) return []
  return messages.slice(-10)
}

function hasPendingConversationTranslation(room, messages) {
  const translations = getConversationTranslationMap(room)
  return messages.some((message) => {
    const entry = translations[message.id]
    return !entry || entry.status === "loading"
  })
}

function setConversationTranslationExpanded(nextValue) {
  state.conversationTranslationExpanded = Boolean(nextValue)
  renderConversation()
  void persistState()
}

async function ensureConversationTranslations(room) {
  if (!room || state.conversationTranslationLoading) return
  const targetMessages = getConversationTranslationTargetMessages(room)
  if (!targetMessages.length || !hasPendingConversationTranslation(room, targetMessages)) return

  const roomId = room.roomId
  state.conversationTranslationLoading = true
  state.conversationTranslationLoadingRoomId = roomId
  setStatus("conversation-translation-status", "Translating...")
  renderConversation()

  try {
    for (const message of targetMessages) {
      const existing = getConversationTranslationEntry(room, message.id)
      if (existing && existing.status === "ready" && existing.text) continue

      setConversationTranslationEntry(roomId, message.id, {
        status: "loading",
        text: "",
        updatedAt: nowIso(),
      })
      renderConversation()
      void persistState()

      try {
        const response = await callRecruitingAi({
          mode: "translate_to_chinese",
          candidateName: room.candidateName || "Unknown Candidate",
          meName: room.meName || state.upworkUserName || "Unknown",
          goal: "Auto",
          assistantGoal: "Translate current message into Chinese",
          tone: "Professional and friendly",
          customInstruction: "",
          draftText: message.text || "",
          latestCandidateMessage: message.text || "",
          conversationMessages: [message],
          candidateStatus: room.status || "active",
        })
        const result = response?.result || {}
        const translatedText = blockText(result.chineseTranslation || result.meaningNotes || result.translation || "")
        setConversationTranslationEntry(roomId, message.id, {
          status: translatedText ? "ready" : "error",
          text: translatedText || "中文翻译失败，请稍后重试",
          updatedAt: nowIso(),
          mock: Boolean(result.mock),
        })
      } catch (error) {
        console.error("[BlackDog] conversation translation failed", error)
        setConversationTranslationEntry(roomId, message.id, {
          status: "error",
          text: "中文翻译失败，请稍后重试",
          updatedAt: nowIso(),
          error: text(error instanceof Error ? error.message : "Translation failed."),
        })
      }

      renderConversation()
      await persistState()
    }
  } finally {
    state.conversationTranslationLoading = false
    state.conversationTranslationLoadingRoomId = ""
    setStatus("conversation-translation-status", "")
    renderConversation()
    await persistState()
  }
}

function buildConversationTranslationBlock(room, message) {
  const translationEntry = getConversationTranslationEntry(room, message.id)
  if (!state.conversationTranslationExpanded) return null

  const targetIds = new Set(getConversationTranslationTargetMessages(room).map((item) => item.id))
  const shouldRender = targetIds.has(message.id) || Boolean(translationEntry)
  if (!shouldRender) return null

  const block = document.createElement("div")
  block.className = `message-translation ${translationEntry?.status === "loading" ? "loading" : translationEntry?.status === "error" ? "error" : ""}`
  const prefix = document.createElement("strong")
  prefix.textContent = "中文："

  const content = document.createElement("span")
  if (translationEntry?.status === "loading") {
    content.textContent = "Translating..."
  } else if (translationEntry?.status === "error") {
    content.textContent = translationEntry.text || "中文翻译失败，请稍后重试"
  } else {
    content.textContent = translationEntry?.text || "Translating..."
  }

  block.append(prefix, content)
  return block
}

function getTopbarStatus(room) {
  const status = safeName(state.connectionStatus || "")
  if (!room) {
    if (/could not|error|failed|disconnected/i.test(status)) return "Error"
    return "Waiting"
  }
  if (room.extractionMode === "no_story_container_found") return "Disconnected"
  if (/could not|error|failed|disconnected/i.test(status)) return "Error"
  return "Connected"
}

function renderConnection() {
  const room = activeRoom()
  const topbarStatus = el("topbar-status")
  if (topbarStatus) {
    const statusText = getTopbarStatus(room)
    topbarStatus.textContent = statusText
    topbarStatus.dataset.state = statusText.toLowerCase()
  }
  const userInput = el("upwork-user-name")
  if (userInput) userInput.value = state.upworkUserName || ""
  const projectNode = el("reply-project")
  if (projectNode && projectNode instanceof HTMLSelectElement) {
    if (!projectNode.dataset.bound) {
      projectNode.innerHTML = ""
      RECRUITING_PROJECTS.forEach((project) => {
        const option = document.createElement("option")
        option.value = project
        option.textContent = project
        projectNode.append(option)
      })
      projectNode.dataset.bound = "true"
    }
    projectNode.value = RECRUITING_PROJECTS.includes(state.selectedRecruitingProject)
      ? state.selectedRecruitingProject
      : DEFAULT_RECRUITING_PROJECT
  }
}

function renderConversation() {
  const room = activeRoom()
  const translationToggle = el("conversation-translation-toggle")
  const translationDefaultExpanded = el("conversation-translation-default-expanded")
  const translationDefaultLabel = translationDefaultExpanded?.closest("label")?.querySelector("span")
  const translationStatus = el("conversation-translation-status")
  if (translationToggle) {
    translationToggle.textContent = "Chinese"
    translationToggle.classList.toggle("is-active", Boolean(state.conversationTranslationExpanded))
  }
  if (translationDefaultExpanded) {
    translationDefaultExpanded.checked = Boolean(state.conversationTranslationDefaultExpanded)
  }
  if (translationDefaultLabel) {
    translationDefaultLabel.textContent = "Open by default"
  }
  if (translationStatus) {
    translationStatus.hidden = !state.conversationTranslationLoading
    translationStatus.textContent = state.conversationTranslationLoading ? "Translating..." : "Translating..."
  }
  setStatus("me-name", room?.meName || state.upworkUserName || "Not set")
  setStatus("candidate-name", room?.candidateName && room.candidateName !== "Unknown Candidate" ? room.candidateName : "Not detected")
  const visibleMessages = getConversationMessages(room)
  setStatus("total-messages-captured", String(visibleMessages.length))
  setStatus("last-message-time", formatLastMessageTime({ conversationMessages: visibleMessages }) || "—")
  setStatus("low-confidence-blocks", String(room?.hiddenLowConfidenceBlocks || 0))
  setStatus("noise-blocks-removed", String(room?.noiseBlocksRemoved || 0))
  setStatus("debug-scan-status", state.debugScanStatus || "idle")

  const live = liveRoom()
  const isViewingCachedRoom = Boolean(room && live && room.roomId !== live.roomId)
  const currentNote = room
    ? isViewingCachedRoom
      ? `Viewing cached room. Open this candidate in Upwork to continue live capture.`
      : room.extractionMode === "no_story_container_found"
        ? "Could not find Upwork story-container message blocks."
        : visibleMessages.length
          ? `${room.cachedConversation ? "Cached conversation · " : ""}${room.candidateName || "Not detected"} · ${visibleMessages.length} messages captured`
          : "Story containers found. Awaiting reliable messages."
    : "No conversation synced yet."
  setStatus(
    "conversation-meta",
    currentNote,
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

  const messages = [...visibleMessages].reverse()
  if (room && state.conversationTranslationExpanded) {
    void ensureConversationTranslations(room)
  }

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

    const translationBlock = buildConversationTranslationBlock(room, message)
    if (translationBlock) card.append(translationBlock)
    list.append(card)
  })
}

function renderReplyAssistant() {
  const englishNode = el("reply-english")
  const chineseNode = el("reply-chinese")
  const copyStatusNode = el("reply-copy-status")
  const errorNode = el("reply-error")
  const resultTypeNode = el("reply-result-type-badge")
  const translateButton = el("translate-reply")

  if (englishNode && document.activeElement !== englishNode) englishNode.value = state.replyEnglish || ""
  if (chineseNode && document.activeElement !== chineseNode) chineseNode.value = state.replyChineseDraft || ""
  if (copyStatusNode) {
    copyStatusNode.hidden = !state.replyEnglishCopyStatus
    copyStatusNode.textContent = state.replyEnglishCopyStatus || "Copied"
  }
  if (resultTypeNode) {
    const isMock = state.replyResultType === "Mock Fallback"
    resultTypeNode.hidden = !isMock
    resultTypeNode.dataset.state = isMock ? "mock" : ""
    resultTypeNode.textContent = "MOCK"
  }
  if (errorNode) {
    if (state.replyError) {
      errorNode.hidden = false
      errorNode.textContent = state.replyError
    } else {
      errorNode.hidden = true
      errorNode.textContent = ""
    }
  }

  const generateButton = el("generate-reply")
  const copyButton = el("copy-reply")
  const clearButton = el("clear-reply")
  if (generateButton) {
    generateButton.disabled = Boolean(state.replyLoading || state.replyTranslateLoading)
    generateButton.textContent = state.replyLoading ? "Generating..." : "AI Reply"
  }
  if (translateButton) {
    translateButton.disabled = Boolean(state.replyTranslateLoading || state.replyLoading)
    translateButton.textContent = state.replyTranslateLoading ? "Translating..." : "Translate"
  }
  if (copyButton) copyButton.disabled = Boolean(state.replyLoading || state.replyTranslateLoading || !state.replyEnglish)
  if (clearButton) clearButton.disabled = Boolean(state.replyLoading || state.replyTranslateLoading)
}

function renderProjectScriptArea() {
  const scriptNode = el("reply-script")
  const statusNode = el("reply-script-status")
  const previewNode = el("reply-script-preview")
  const column = scriptNode?.closest(".project-script-column")
  const sidebarLayout = ensureRightSidebarLayout()
  const sidebarCard = sidebarLayout?.candidateCard || el("candidate-chats-list")?.closest(".candidate-chats-card")
  const sidebar = sidebarLayout?.rightSidebar || sidebarCard?.parentElement
  const host = el("project-scripts-card-host")

  renderProjectScriptSelect()

  const script = getProjectScriptById(state.replyScriptId || scriptNode?.value || "")
  const previewText = script ? script.text.split("\n").slice(0, 3).join("\n") : "Select a script to preview and copy."

  if (scriptNode) scriptNode.value = state.replyScriptId || ""
  if (statusNode) {
    statusNode.hidden = !state.projectScriptStatus
    statusNode.textContent = state.projectScriptStatus || "Copied"
  }
  if (previewNode) {
    previewNode.hidden = false
    previewNode.textContent = script ? `Preview: ${previewText.slice(0, 120)}` : previewText
  }

  if (column && sidebar && sidebarCard) {
    let container = host
    if (!container) {
      container = document.createElement("section")
      container.id = "project-scripts-card-host"
      container.className = "project-scripts-card-host"
      sidebar.insertBefore(container, sidebarCard)
    } else if (container.parentElement !== sidebar) {
      sidebar.insertBefore(container, sidebarCard)
    }

    if (column.parentElement !== container) {
      container.append(column)
    }
  }
}

function ensureRightSidebarLayout() {
  const workspace = document.querySelector(".workspace-body")
  const currentCard = el("conversation-list")?.closest(".current-conversation-card")
  const candidateCard = el("candidate-chats-list")?.closest(".candidate-chats-card")
  if (!workspace || !currentCard || !candidateCard) return null

  let rightSidebar = workspace.querySelector(".right-sidebar")
  if (!rightSidebar) {
    rightSidebar = document.createElement("div")
    rightSidebar.className = "right-sidebar"
  }

  const insertBeforeNode = currentCard.nextElementSibling || null
  if (rightSidebar.parentElement !== workspace) {
    workspace.insertBefore(rightSidebar, insertBeforeNode)
  } else if (rightSidebar.previousElementSibling !== currentCard) {
    workspace.insertBefore(rightSidebar, insertBeforeNode)
  }

  if (candidateCard.parentElement !== rightSidebar) {
    rightSidebar.append(candidateCard)
  }

  const host = el("project-scripts-card-host")
  if (host && host.parentElement === workspace && host !== rightSidebar) {
    rightSidebar.insertBefore(host, candidateCard)
  }

  return { workspace, rightSidebar, candidateCard }
}

function getTalentProfileFieldIds() {
  return {
    avatar: "talent-profile-avatar",
    candidateName: "talent-profile-candidate-name",
    upworkChatUrl: "talent-profile-upwork-chat-url",
    profileUrl: "talent-profile-profile-url",
    upworkProfileUrl: "talent-profile-profile-url",
    nativeLanguage: "talent-profile-native-language",
    secondLanguage: "talent-profile-other-languages",
    mainSkill: "talent-profile-main-skill",
    taskTags: "talent-profile-task-tags",
    experienceSummary: "talent-profile-experience-summary",
    hasLLMEvaluationExperience: "talent-profile-has-llm-evaluation-experience",
    evaluationTypes: "talent-profile-evaluation-types",
    platformsCompanies: "talent-profile-platforms-companies",
    dailyAvailability: "talent-profile-daily-availability",
    weekendAvailability: "talent-profile-weekend-availability",
    email: "talent-profile-email",
    onlineContactMethod: "talent-profile-online-contact-method",
    onlineContactAccount: "talent-profile-online-contact-account",
  }
}

function hideTalentProfileField(id = "") {
  const node = el(id)
  const label = node?.closest("label.stack")
  if (label) {
    label.classList.add("talent-profile-hidden-field")
  }
  return label || null
}

function markTalentProfileFieldNoLabel(id = "") {
  const node = el(id)
  const label = node?.closest("label.stack")
  if (label) {
    label.classList.add("talent-profile-field-no-label")
  }
  return label || null
}

function moveTalentProfileField(id = "", target = null) {
  const node = el(id)
  const label = node?.closest("label.stack")
  if (!label || !target) return null
  if (label.parentElement !== target) {
    target.append(label)
  }
  return label
}

function setTalentProfileLabelText(fieldId = "", labelText = "") {
  const node = el(fieldId)
  if (!node) return

  const label = node.closest("label.stack")
  if (!label) return

  const labelNode =
    label.querySelector(".field-label") ||
    label.querySelector("span") ||
    label.querySelector("strong")

  if (labelNode) {
    labelNode.textContent = labelText
    return
  }

  const firstTextNode = Array.from(label.childNodes).find((child) => child.nodeType === Node.TEXT_NODE)
  if (firstTextNode) {
    firstTextNode.textContent = labelText
  }
}

function ensureTalentProfileTemplate() {
  let modal = el("talent-profile-modal")
  if (!modal) {
    const overlay = document.createElement("div")
    overlay.id = "talent-profile-modal"
    overlay.className = "talent-profile-modal"
    overlay.hidden = true
    overlay.innerHTML = `
      <div class="talent-profile-overlay"></div>
      <div class="talent-profile-dialog card" role="dialog" aria-modal="true" aria-labelledby="talent-profile-title">
        <div class="talent-profile-header">
          <h3 id="talent-profile-title">Talent Profile</h3>
          <button id="talent-profile-close" class="secondary compact" type="button">×</button>
        </div>

        <div class="talent-profile-body">
          <section class="talent-profile-section">
            <div class="talent-profile-section-title">Basic Info</div>
            <div class="talent-profile-hero">
              <div class="talent-avatar-box">
                <div id="talent-profile-avatar" class="talent-avatar">U</div>
              </div>
              <label class="stack talent-profile-full">
                <span class="group-label">Candidate Name</span>
                <input id="talent-profile-candidate-name" class="text-input" type="text" />
              </label>
              <div class="talent-profile-grid talent-profile-url-grid">
                <label class="stack">
                  <span class="group-label">Upwork Chat URL</span>
                  <input id="talent-profile-upwork-chat-url" class="text-input" type="url" readonly />
                </label>
                <label class="stack">
                  <span class="group-label">Profile URL</span>
                  <input id="talent-profile-upwork-profile-url" class="text-input" type="url" placeholder="Paste candidate profile URL" />
                </label>
              </div>
            </div>
          </section>

          <section class="talent-profile-section">
            <div class="talent-profile-section-title">Language</div>
            <div class="talent-profile-grid">
              <label class="stack">
                <span class="group-label">Native Language</span>
                <input id="talent-profile-native-language" class="text-input" type="text" />
              </label>
              <label class="stack">
                <span class="group-label">Language Variant</span>
                <input id="talent-profile-language-variant" class="text-input" type="text" />
              </label>
              <label class="stack talent-profile-full">
                <span class="group-label">Other Languages</span>
                <input id="talent-profile-other-languages" class="text-input" type="text" />
              </label>
            </div>
          </section>

          <section class="talent-profile-section">
            <div class="talent-profile-section-title">Skills & Experience</div>
            <div class="talent-profile-grid">
              <label class="stack">
                <span class="group-label">Main Skill</span>
                <input id="talent-profile-main-skill" class="text-input" type="text" />
              </label>
              <label class="stack">
                <span class="group-label">Task Tags</span>
                <input id="talent-profile-task-tags" class="text-input" type="text" />
              </label>
              <label class="stack">
                <span class="group-label">Has LLM Evaluation Experience</span>
                <select id="talent-profile-has-llm-evaluation-experience" class="text-input">
                  <option>Yes</option>
                  <option>No</option>
                  <option selected>Unknown</option>
                </select>
              </label>
              <label class="stack">
                <span class="group-label">Evaluation Types</span>
                <input id="talent-profile-evaluation-types" class="text-input" type="text" />
              </label>
              <label class="stack">
                <span class="group-label">Platforms / Companies</span>
                <input id="talent-profile-platforms-companies" class="text-input" type="text" />
              </label>
              <label class="stack talent-profile-full">
                <span class="group-label">Experience Summary</span>
                <textarea id="talent-profile-experience-summary" class="reply-textarea talent-profile-textarea" rows="4"></textarea>
              </label>
            </div>
          </section>

          <section class="talent-profile-section">
            <div class="talent-profile-section-title">Availability</div>
            <div class="talent-profile-grid">
              <label class="stack">
                <span class="group-label">Daily Availability</span>
                <input id="talent-profile-daily-availability" class="text-input" type="text" />
              </label>
              <label class="stack">
                <span class="group-label">Weekend Availability</span>
                <select id="talent-profile-weekend-availability" class="text-input">
                  <option>Yes</option>
                  <option>No</option>
                  <option>Depends</option>
                  <option selected>Unknown</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        <div class="talent-profile-footer">
          <button id="talent-profile-ai-fill" class="secondary compact" type="button">AI Fill from Chat</button>
          <div class="talent-profile-footer-actions">
            <button id="talent-profile-close-footer" class="secondary compact" type="button">Close</button>
            <button id="talent-profile-save-draft" class="secondary compact" type="button">Save Draft</button>
            <button id="talent-profile-save-pool" class="primary compact" type="button">Save to Talent Pool</button>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector(".side-panel") || document.body
    root.append(overlay)
    modal = overlay
    console.log("[BlackDog] created talent profile modal")
  }
  const body = modal?.querySelector(".talent-profile-body")
  if (!modal || !body) return

  const sections = Array.from(body.querySelectorAll(":scope > .talent-profile-section"))
  const basicInfoSection = sections[0] || null
  const languageSection = sections[1] || null
  const skillsSection = sections[2] || null
  const availabilitySection = sections[3] || null

  ;["talent-profile-platform", "talent-profile-country-region", "talent-profile-timezone", "talent-profile-identity"].forEach(
    (id) => hideTalentProfileField(id),
  )
  const profileUrlNode = el("talent-profile-profile-url") || el("talent-profile-upwork-profile-url")
  if (profileUrlNode) {
    if (profileUrlNode.id !== "talent-profile-profile-url") {
      profileUrlNode.id = "talent-profile-profile-url"
    }
    const profileLabel = profileUrlNode.closest("label.stack")
    if (profileLabel) {
      profileLabel.classList.remove("talent-profile-hidden-field")
    }
  }
  const basicInfoChatUrlNode = el("talent-profile-upwork-chat-url")
  if (basicInfoChatUrlNode) {
    basicInfoChatUrlNode.readOnly = true
  }

  if (basicInfoSection) {
    basicInfoSection.classList.add("talent-profile-basic-section")
    const sectionTitle = basicInfoSection.querySelector(".talent-profile-section-title")
    if (sectionTitle) sectionTitle.textContent = "Basic Info"

    let hero = basicInfoSection.querySelector(".talent-profile-basic-hero")
    if (!hero) {
      hero = document.createElement("div")
      hero.className = "talent-profile-basic-hero"
      basicInfoSection.insertBefore(hero, basicInfoSection.querySelector(".talent-profile-grid") || null)
    }

    const avatarBox = el("talent-profile-avatar")?.closest(".talent-avatar-box")
    const candidateLabel = el("talent-profile-candidate-name")?.closest("label.stack")
    if (avatarBox && avatarBox.parentElement !== hero) {
      hero.append(avatarBox)
    }
    if (candidateLabel && candidateLabel.parentElement !== hero) {
      hero.append(candidateLabel)
    }

    let urlGrid = basicInfoSection.querySelector(".talent-profile-url-grid")
    if (!urlGrid) {
      urlGrid = document.createElement("div")
      urlGrid.className = "talent-profile-url-grid"
      hero.after(urlGrid)
    } else {
      urlGrid.classList.remove("talent-profile-grid")
      urlGrid.classList.add("talent-profile-url-grid")
    }
    urlGrid.style.display = "grid"
    moveTalentProfileField("talent-profile-upwork-chat-url", urlGrid)
    moveTalentProfileField("talent-profile-profile-url", urlGrid)
    const urlGridChatUrlNode = el("talent-profile-upwork-chat-url")
    if (urlGridChatUrlNode) urlGridChatUrlNode.readOnly = true
    const urlGridProfileUrlNode = el("talent-profile-profile-url")
    if (urlGridProfileUrlNode) urlGridProfileUrlNode.placeholder = "Paste candidate profile URL"
  }

  if (languageSection) {
    languageSection.classList.remove("talent-profile-hidden-section")
    languageSection.hidden = false
    const title = languageSection.querySelector(".talent-profile-section-title")
    if (title) title.textContent = "Language"
    let grid = languageSection.querySelector(".talent-profile-grid")
    if (!grid) {
      grid = document.createElement("div")
      grid.className = "talent-profile-grid talent-profile-language-grid"
      languageSection.append(grid)
    }
    grid.classList.add("talent-profile-language-grid")
    moveTalentProfileField("talent-profile-native-language", grid)
    const secondLanguageLabel = moveTalentProfileField("talent-profile-other-languages", grid)
    if (secondLanguageLabel) {
      secondLanguageLabel.classList.remove("talent-profile-full")
      const labelSpan = secondLanguageLabel.querySelector(".group-label")
      if (labelSpan) labelSpan.textContent = "Second Language"
    }
    hideTalentProfileField("talent-profile-language-variant")
  }

  if (skillsSection) {
    skillsSection.classList.remove("talent-profile-hidden-section")
    skillsSection.hidden = false
    const title = skillsSection.querySelector(".talent-profile-section-title")
    if (title) title.textContent = "Skills"
    let grid = skillsSection.querySelector(".talent-profile-grid")
    if (!grid) {
      grid = document.createElement("div")
      grid.className = "talent-profile-grid talent-profile-skills-grid"
      skillsSection.append(grid)
    }
    grid.classList.add("talent-profile-skills-grid")
    moveTalentProfileField("talent-profile-main-skill", grid)
    markTalentProfileFieldNoLabel("talent-profile-main-skill")
    const skillNode = el("talent-profile-main-skill")
    if (skillNode) skillNode.placeholder = "Main skill, e.g. LLM evaluation, transcription, MTPE"
    hideTalentProfileField("talent-profile-task-tags")
    hideTalentProfileField("talent-profile-has-llm-evaluation-experience")
    hideTalentProfileField("talent-profile-evaluation-types")
    hideTalentProfileField("talent-profile-platforms-companies")
  }

  let experienceSection = body.querySelector(".talent-profile-experience-section")
  if (!experienceSection) {
    experienceSection = document.createElement("section")
    experienceSection.className = "talent-profile-section talent-profile-experience-section"
    experienceSection.innerHTML = `
      <div class="talent-profile-section-title">Experience</div>
      <div class="talent-profile-grid talent-profile-experience-grid"></div>
    `
  }
  if (experienceSection.parentElement !== body) {
    body.insertBefore(experienceSection, availabilitySection || null)
  }
  const experienceGrid = experienceSection.querySelector(".talent-profile-experience-grid")
  if (experienceGrid) {
    experienceGrid.classList.add("talent-profile-experience-grid")
    moveTalentProfileField("talent-profile-experience-summary", experienceGrid)
    markTalentProfileFieldNoLabel("talent-profile-experience-summary")
    const experienceNode = el("talent-profile-experience-summary")
    if (experienceNode) experienceNode.placeholder = "Briefly describe relevant project experience"
  }
  hideTalentProfileField("talent-profile-has-llm-evaluation-experience")
  hideTalentProfileField("talent-profile-evaluation-types")
  hideTalentProfileField("talent-profile-platforms-companies")

  let contactSection = body.querySelector(".talent-profile-contact-section")
  if (!contactSection) {
    contactSection = document.createElement("section")
    contactSection.className = "talent-profile-section talent-profile-contact-section"
    contactSection.innerHTML = `
      <div class="talent-profile-section-title">Contact</div>
      <div class="talent-profile-grid talent-profile-contact-grid">
        <label class="stack talent-profile-full">
          <span class="group-label">Email</span>
          <input id="talent-profile-email" class="text-input" type="email" placeholder="candidate@example.com" />
        </label>
        <label class="stack">
          <span class="group-label">Contact Method</span>
          <select id="talent-profile-online-contact-method" class="text-input">
            <option>WhatsApp</option>
            <option>Telegram</option>
            <option>WeChat</option>
            <option>Line</option>
            <option>Skype</option>
            <option>Other</option>
          </select>
        </label>
        <label class="stack">
          <span class="group-label">Contact Account</span>
          <input id="talent-profile-online-contact-account" class="text-input" type="text" placeholder="Phone number or account ID" />
        </label>
      </div>
    `
  }

  if (contactSection.parentElement !== modal.querySelector(".talent-profile-body")) {
    body.append(contactSection)
  }

  const contactChatUrlNode = el("talent-profile-upwork-chat-url")
  if (contactChatUrlNode) {
    contactChatUrlNode.readOnly = true
    const chatLabel = contactChatUrlNode.closest("label.stack")
    if (chatLabel) chatLabel.classList.remove("talent-profile-hidden-field")
  }

  const dailyAvailability = el("talent-profile-daily-availability")
  if (dailyAvailability) {
    let selectNode = dailyAvailability
    if (!(dailyAvailability instanceof HTMLSelectElement)) {
      selectNode = document.createElement("select")
      selectNode.id = "talent-profile-daily-availability"
      selectNode.className = dailyAvailability.className || "text-input"
      dailyAvailability.replaceWith(selectNode)
    }
    if (selectNode instanceof HTMLSelectElement && !selectNode.dataset.bound) {
      selectNode.innerHTML = ""
      const emptyOption = document.createElement("option")
      emptyOption.value = ""
      emptyOption.textContent = ""
      selectNode.append(emptyOption)
      ;["0–2 hours/day", "2–4 hours/day", "4–6 hours/day", "Any time"].forEach((value) => {
        const option = document.createElement("option")
        option.value = value
        option.textContent = value
        selectNode.append(option)
      })
      selectNode.value = ""
      selectNode.dataset.bound = "true"
    }
  }
  const availabilityGrid = availabilitySection?.querySelector(".talent-profile-grid")
  if (availabilityGrid) availabilityGrid.classList.add("talent-profile-availability-grid")

  const weekendAvailability = el("talent-profile-weekend-availability")
  if (weekendAvailability instanceof HTMLSelectElement && !weekendAvailability.dataset.bound) {
    weekendAvailability.innerHTML = ""
    const emptyOption = document.createElement("option")
    emptyOption.value = ""
    emptyOption.textContent = ""
    weekendAvailability.append(emptyOption)
    ;["Yes", "No"].forEach((value) => {
      const option = document.createElement("option")
      option.value = value
      option.textContent = value
      weekendAvailability.append(option)
    })
    weekendAvailability.value = ""
    weekendAvailability.dataset.bound = "true"
  }

  setTalentProfileLabelText("talent-profile-native-language", "Native Language")
  setTalentProfileLabelText("talent-profile-other-languages", "Second Language")
  setTalentProfileLabelText("talent-profile-main-skill", "Skill")
  setTalentProfileLabelText("talent-profile-experience-summary", "Experience")
  setTalentProfileLabelText("talent-profile-daily-availability", "Daily Availability")
  setTalentProfileLabelText("talent-profile-weekend-availability", "Weekend Availability")
  setTalentProfileLabelText("talent-profile-email", "Email")
  setTalentProfileLabelText("talent-profile-online-contact-method", "Contact Method")
  setTalentProfileLabelText("talent-profile-online-contact-account", "Contact Account")
}

function readTalentProfileForm() {
  const room = activeRoom()
  const fields = getTalentProfileFieldIds()
  return {
    roomId: state.talentProfileRoomId || room?.roomId || "",
    candidateName: safeName(el(fields.candidateName)?.value || room?.candidateName || "Unknown Candidate"),
    candidateHeadline: safeName(state.talentProfileDraft?.candidateHeadline || room?.candidateHeadline || ""),
    platform: "Upwork",
    upworkChatUrl: safeName(el(fields.upworkChatUrl)?.value || room?.roomUrl || room?.pageUrl || ""),
    profileUrl: safeName(el(fields.profileUrl)?.value || el(fields.upworkProfileUrl)?.value || ""),
    upworkProfileUrl: safeName(el(fields.upworkProfileUrl)?.value || ""),
    nativeLanguage: safeName(el(fields.nativeLanguage)?.value || ""),
    secondLanguage: safeName(el(fields.secondLanguage)?.value || ""),
    otherLanguages: safeName(el(fields.secondLanguage)?.value || ""),
    mainSkill: safeName(el(fields.mainSkill)?.value || ""),
    taskTags: safeName(el(fields.taskTags)?.value || ""),
    experienceSummary: safeName(el(fields.experienceSummary)?.value || ""),
    hasLLMEvaluationExperience: safeName(el(fields.hasLLMEvaluationExperience)?.value || "Unknown") || "Unknown",
    evaluationTypes: safeName(el(fields.evaluationTypes)?.value || ""),
    platformsCompanies: safeName(el(fields.platformsCompanies)?.value || ""),
    dailyAvailability: safeName(el(fields.dailyAvailability)?.value || ""),
    weekendAvailability: safeName(el(fields.weekendAvailability)?.value || ""),
    email: safeName(el(fields.email)?.value || ""),
    onlineContactMethod: safeName(el(fields.onlineContactMethod)?.value || "WhatsApp") || "WhatsApp",
    onlineContactAccount: safeName(el(fields.onlineContactAccount)?.value || ""),
    avatarUrl: state.talentProfileDraft?.avatarUrl || room?.candidateAvatarUrl || room?.avatarUrl || "",
    submittedToTalentPool: Boolean(state.talentProfileDraft?.submittedToTalentPool),
    submittedAt: state.talentProfileDraft?.submittedAt || "",
    updatedAt: nowIso(),
  }
}

function fillTalentProfileForm(profile = {}) {
  const fields = getTalentProfileFieldIds()
  const candidateName = safeName(profile.candidateName || "Unknown Candidate")
  const avatarNode = el(fields.avatar)
  if (avatarNode) {
    avatarNode.textContent = profile.avatarUrl ? "" : avatarInitials(candidateName)
    avatarNode.style.backgroundImage = profile.avatarUrl ? `url(${profile.avatarUrl})` : "none"
    avatarNode.style.backgroundSize = profile.avatarUrl ? "cover" : "auto"
    avatarNode.style.backgroundPosition = profile.avatarUrl ? "center" : "center"
    avatarNode.dataset.hasImage = profile.avatarUrl ? "true" : "false"
  }

  const set = (id, value = "") => {
    const node = el(id)
    if (!node) return
    node.value = value || ""
  }

  set(fields.candidateName, candidateName)
  set(fields.upworkChatUrl, profile.upworkChatUrl || "")
  set(fields.profileUrl, profile.profileUrl || profile.upworkProfileUrl || "")
  set(fields.nativeLanguage, profile.nativeLanguage || "")
  set(fields.secondLanguage, profile.secondLanguage || profile.otherLanguages || "")
  set(fields.mainSkill, profile.mainSkill || "")
  set(fields.taskTags, profile.taskTags || "")
  set(fields.experienceSummary, profile.experienceSummary || "")
  set(fields.hasLLMEvaluationExperience, profile.hasLLMEvaluationExperience || "Unknown")
  set(fields.evaluationTypes, profile.evaluationTypes || "")
  set(fields.platformsCompanies, profile.platformsCompanies || "")
  set(fields.dailyAvailability, profile.dailyAvailability === "Unknown" ? "" : profile.dailyAvailability || "")
  set(fields.weekendAvailability, profile.weekendAvailability === "Unknown" ? "" : profile.weekendAvailability || "")
  set(fields.email, profile.email || "")
  set(fields.onlineContactMethod, profile.onlineContactMethod || "WhatsApp")
  set(fields.onlineContactAccount, profile.onlineContactAccount || "")

  const chatUrlNode = el(fields.upworkChatUrl)
  if (chatUrlNode) chatUrlNode.readOnly = true

  ensureTalentProfileTemplate()

  const statusNode = el("talent-profile-status")
  if (statusNode) {
    statusNode.hidden = true
    statusNode.textContent = ""
  }
}

function renderTalentProfileModal() {
  ensureTalentProfileTemplate()
  const modal = el("talent-profile-modal")
  if (!modal) {
    console.warn("[BlackDog] talent profile modal missing after ensureTalentProfileTemplate")
    return
  }
  if (!state.talentProfileModalOpen) {
    forceHideTalentProfileModal()
    return
  }
  const room =
    state.rooms[state.talentProfileRoomId] ||
    Object.values(state.rooms || {}).find((candidateRoom) => {
      if (!candidateRoom || typeof candidateRoom !== "object") return false
      return getRoomKey(candidateRoom) === state.talentProfileRoomId
    })
  console.log("[BlackDog] render talent profile modal", {
    modalOpen: state.talentProfileModalOpen,
    roomId: state.talentProfileRoomId,
    roomFound: Boolean(room),
    modalExists: Boolean(modal),
  })
  modal.hidden = false
  modal.style.display = "flex"
  modal.style.visibility = "visible"
  modal.style.opacity = "1"
  modal.setAttribute("aria-hidden", "false")
  const key = getTalentProfileKey(room || {})
  const saved = state.talentProfiles[key] || createInitialTalentProfile(room || {})
  const roomCandidateAvatarUrl = safeName(room?.candidateAvatarUrl || room?.avatarUrl || "")
  const merged = prefillTalentProfileFromRoom(
    normalizeTalentProfile(
      {
        ...saved,
        ...state.talentProfileDraft,
        avatarUrl: state.talentProfileDraft?.avatarUrl || roomCandidateAvatarUrl || saved.avatarUrl || "",
      },
      room || {},
    ),
    room || {},
  )
  state.talentProfileDraft = merged
  fillTalentProfileForm(merged)
}

function forceHideTalentProfileModal() {
  const modal = el("talent-profile-modal")
  if (!modal) return
  modal.hidden = true
  modal.style.display = "none"
  modal.style.visibility = "hidden"
  modal.style.opacity = "0"
  modal.setAttribute("aria-hidden", "true")
}

function bindTalentProfileModalClosers() {
  const modal = el("talent-profile-modal")
  if (!modal) return

  if (!modal.dataset.bound) {
    modal.dataset.bound = "true"
    modal.dataset.action = "talent-profile-modal"
    modal.style.pointerEvents = "auto"
    const overlay = modal.querySelector(".talent-profile-overlay")
    if (overlay) {
      overlay.dataset.action = "close-talent-profile-overlay"
      overlay.style.pointerEvents = "auto"
    }
    const dialog = modal.querySelector(".talent-profile-dialog")
    if (dialog) {
      dialog.dataset.modalContent = "talent-profile"
      dialog.style.pointerEvents = "auto"
    }
    modal.addEventListener("click", (event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      const actionTarget = target.closest("[data-action]")
      if (!actionTarget) return
      const action = actionTarget.getAttribute("data-action") || ""
      if (action === "close-talent-profile" || action === "emergency-close-talent-profile") {
        closeTalentProfileModal()
        return
      }
      if (action === "close-talent-profile-overlay" && target === actionTarget) {
        closeTalentProfileModal()
      }
    })
    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return
      if (!state.talentProfileModalOpen) return
      closeTalentProfileModal()
    })
  }

  const closeButton = el("talent-profile-close")
  if (closeButton) closeButton.dataset.action = "close-talent-profile"
}

function openTalentProfile(roomId) {
  const inputRoomId = safeName(roomId || "")
  const inputRoomUrl = normalizeRoomUrl(inputRoomId)

  let resolvedRoomKey = inputRoomId
  let room = state.rooms[inputRoomId]

  if (!room) {
    const matched = Object.entries(state.rooms || {}).find(([key, candidateRoom]) => {
      if (!candidateRoom || typeof candidateRoom !== "object") return false

      const candidateRoomUrl = normalizeRoomUrl(candidateRoom.roomUrl || candidateRoom.pageUrl || "")
      return (
        key === inputRoomId ||
        candidateRoom.roomId === inputRoomId ||
        getRoomKey(candidateRoom) === inputRoomId ||
        (inputRoomUrl && candidateRoomUrl && inputRoomUrl === candidateRoomUrl)
      )
    })

    if (matched) {
      resolvedRoomKey = matched[0]
      room = matched[1]
    }
  }

  console.log("[BlackDog] open talent profile clicked", {
    inputRoomId,
    resolvedRoomKey,
    found: Boolean(room),
    candidateName: room?.candidateName,
    availableRoomKeys: Object.keys(state.rooms || {}),
  })

  if (!room) {
    console.warn("[BlackDog] open talent profile room not found", {
      inputRoomId,
      availableRoomKeys: Object.keys(state.rooms || {}),
    })
    return
  }

  if (isInvalidCandidateName(room.candidateName || "") && safeName(room.candidateName || "") !== "Unknown Candidate") {
    console.warn("[BlackDog] blocked invalid candidate profile", {
      candidateName: room.candidateName,
      inputRoomId,
      resolvedRoomKey,
    })
    return
  }

  state.talentProfileRoomId = resolvedRoomKey
  const key = getTalentProfileKey(room)
  const saved = state.talentProfiles[key] || createInitialTalentProfile(room)
  const hasMatchingDraft = state.talentProfileDraft && state.talentProfileDraft.roomId === resolvedRoomKey
  const candidateAvatarUrl = safeName(room.candidateAvatarUrl || room.avatarUrl || "")
  state.talentProfileDraft = prefillTalentProfileFromRoom(
    normalizeTalentProfile(
      {
        ...saved,
        ...(hasMatchingDraft ? state.talentProfileDraft : {}),
        roomId: resolvedRoomKey,
        avatarUrl:
          (hasMatchingDraft ? state.talentProfileDraft?.avatarUrl : "") || candidateAvatarUrl || saved.avatarUrl || "",
      },
      room,
    ),
    room,
  )
  state.talentProfileStatus = ""
  state.talentProfileModalOpen = true
  ensureTalentProfileTemplate()
  renderAll()
  window.setTimeout(() => {
    renderTalentProfileModal()
  }, 0)
}

function closeTalentProfileModal() {
  console.log("[BlackDog] close talent profile")
  state.talentProfileModalOpen = false
  state.talentProfileRoomId = ""
  state.talentProfileDraft = state.talentProfileDraft || null
  state.talentProfileStatus = ""
  forceHideTalentProfileModal()
  renderAll()
}

function setTalentProfileStatus(message = "", autoClear = false) {
  state.talentProfileStatus = message || ""
  const node = el("talent-profile-status")
  if (node) {
    node.hidden = !state.talentProfileStatus
    node.textContent = state.talentProfileStatus
  }
  if (autoClear && message) {
    window.setTimeout(() => {
      if (state.talentProfileStatus === message) {
        state.talentProfileStatus = ""
        const next = el("talent-profile-status")
        if (next) {
          next.hidden = true
          next.textContent = ""
        }
      }
    }, 2000)
  }
}

function submitTalentProfileToPlatform(profile) {
  // TODO: send profile to BlackDog Talent Hub backend.
  console.log("[BlackDog] submitTalentProfileToPlatform TODO", profile)
}

function getSelectedRecruitingProject() {
  const project = safeName(state.selectedRecruitingProject || "")
  return project || "Native LLM Evaluator Recruitment"
}

function getProjectScriptsForCurrentProject() {
  const project = getSelectedRecruitingProject()
  return PROJECT_SCRIPT_LIBRARY[project] || PROJECT_SCRIPT_LIBRARY["Native LLM Evaluator Recruitment"]
}

function renderProjectScriptSelect() {
  const scriptNode = el("reply-script")
  if (!scriptNode) return

  const currentScripts = getProjectScriptsForCurrentProject()
  const selectedScriptId = state.replyScriptId || ""

  scriptNode.innerHTML = ""
  const placeholder = document.createElement("option")
  placeholder.value = ""
  placeholder.textContent = "Select a script"
  scriptNode.append(placeholder)

  currentScripts.forEach((script) => {
    const option = document.createElement("option")
    option.value = script.id
    option.textContent = script.title
    scriptNode.append(option)
  })

  const stillExists = currentScripts.some((script) => script.id === selectedScriptId)
  scriptNode.value = stillExists ? selectedScriptId : ""
  if (!stillExists) state.replyScriptId = ""
}

function setReplyState(patch = {}) {
  Object.assign(state, patch)
  renderReplyAssistant()
}

function getConversationMessagesForReply(room = activeRoom()) {
  return Array.isArray(room?.conversationMessages) ? room.conversationMessages : []
}

function buildReplyRequestPayload(room = activeRoom()) {
  const conversationMessages = getConversationMessagesForReply(room)
  const meName = room?.meName || state.upworkUserName || "Unknown"

  return {
    mode: "reply",
    candidateName: room?.candidateName || "Unknown Candidate",
    meName,
    goal: "Auto",
    assistantGoal: "Auto",
    tone: "Professional and friendly",
    customInstruction: "",
    conversationMessages,
    candidateStatus: room?.status || "active",
  }
}

function getProjectScriptById(scriptId = "") {
  return getProjectScriptsForCurrentProject().find((script) => script.id === scriptId) || null
}

function setProjectScriptStatus(message = "", autoClear = false) {
  if (projectScriptStatusTimer) {
    clearTimeout(projectScriptStatusTimer)
    projectScriptStatusTimer = null
  }

  state.projectScriptStatus = message || ""
  renderProjectScriptArea()

  if (autoClear && message) {
    projectScriptStatusTimer = setTimeout(() => {
      state.projectScriptStatus = ""
      renderProjectScriptArea()
      projectScriptStatusTimer = null
    }, 2000)
  }
}

async function copyProjectScript(scriptId = "") {
  const script = getProjectScriptById(scriptId)
  if (!script) {
    setProjectScriptStatus("")
    return false
  }

  try {
    await navigator.clipboard.writeText(script.text)
    setProjectScriptStatus("Copied", true)
    return true
  } catch (error) {
    console.error("[BlackDog] Project script copy failed", error)
    setProjectScriptStatus("Copy failed.")
    return false
  }
}

async function callRecruitingAi(body) {
  const response = await fetch("http://localhost:3000/api/recruiting-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  let json = null
  try {
    json = await response.json()
  } catch {
    json = null
  }

  if (!response.ok) {
    throw new Error(json?.error || `AI request failed with status ${response.status}.`)
  }

  if (!json?.ok) {
    throw new Error(json?.error || "AI request failed.")
  }

  return json
}

async function generateReply() {
  const room = activeRoom()
  if (!room) {
    setReplyState({ replyError: "No active candidate chat selected.", replyStatus: "Error" })
    return
  }

  const payload = buildReplyRequestPayload(room)

  setReplyState({
    replyLoading: true,
    replyError: "",
    replyStatus: "Generating...",
    replyResultType: "",
  })

  try {
    const response = await callRecruitingAi(payload)

    const result = response?.result || {}
    const englishReply = text(result.englishReply || "")
    const replyResultType = result.mock === true ? "Mock Fallback" : "Real AI"

    setReplyState({
      replyEnglish: englishReply,
      replyResultType,
      replyStatus: "Ready",
      replyError: "",
      replyLoading: false,
    })
  } catch (error) {
    const message = text(error instanceof Error ? error.message : "Failed to generate reply.")
    setReplyState({
      replyError: message,
      replyStatus: "Error",
      replyResultType: "Error",
      replyLoading: false,
    })
  }
}

async function translateReplyDraftToEnglish() {
  const room = activeRoom()
  const chineseDraft = text(state.replyChineseDraft || "")
  if (!chineseDraft) {
    setReplyState({ replyError: "请输入中文内容" })
    return
  }
  if (!room) {
    setReplyState({ replyError: "No active candidate chat selected.", replyStatus: "Error" })
    return
  }

  setReplyState({
    replyTranslateLoading: true,
    replyError: "",
    replyStatus: "Translating...",
    replyResultType: "",
  })

  try {
    const response = await callRecruitingAi({
      mode: "translate_to_english",
      candidateName: room?.candidateName || "Unknown Candidate",
      meName: room?.meName || state.upworkUserName || "Unknown",
      goal: "Auto",
      assistantGoal: "Translate Chinese HR draft into natural Upwork English reply",
      tone: "Professional and friendly",
      customInstruction: "",
      draftText: chineseDraft,
      conversationMessages: getConversationMessagesForReply(room),
      candidateStatus: room?.status || "active",
    })

    const result = response?.result || {}
    const englishReply = text(result.englishReply || result.polishedVersion || "")

    setReplyState({
      replyEnglish: englishReply,
      replyResultType: result.mock === true ? "Mock Fallback" : "Real AI",
      replyError: "",
      replyTranslateLoading: false,
      replyStatus: "Ready",
    })
  } catch (error) {
    console.error("[BlackDog] translate reply failed", error)
    setReplyState({
      replyError: "Translation failed.",
      replyTranslateLoading: false,
      replyStatus: "Error",
      replyResultType: "",
    })
  }
}

async function copyReply() {
  try {
    await navigator.clipboard.writeText(state.replyEnglish || "")
    state.replyEnglishCopyStatus = "Copied"
    renderReplyAssistant()
    window.setTimeout(() => {
      if (state.replyEnglishCopyStatus === "Copied") {
        state.replyEnglishCopyStatus = ""
        renderReplyAssistant()
      }
    }, 2000)
  } catch {
    setReplyState({
      replyError: "Copy failed.",
    })
  }
}

function clearReply() {
  setReplyState({
    replyEnglish: "",
    replyChineseDraft: "",
    replyError: "",
    replyResultType: "",
    replyTranslateLoading: false,
  })
  state.replyEnglishCopyStatus = ""
  renderReplyAssistant()
}

function renderCandidateChats() {
  const activeList = el("candidate-chats-list")
  const closedList = el("candidate-chats-closed-list")
  const liveNote = el("candidate-chats-live-note")
  const clearClosedButton = el("clear-closed-chats")
  if (!activeList || !closedList || !liveNote) return

  ensureRightSidebarLayout()

  const card = activeList.closest(".candidate-chats-card")
  const title = card?.querySelector(".section-head h2")
  const subtitle = card?.querySelector(".section-head p")
  const titleWrap = title?.parentElement
  if (title && titleWrap) {
    title.textContent = "Candidate Chats"
    titleWrap.classList.add("candidate-chats-title-row")
    let countBadge = card?.querySelector("#candidate-chats-count")
    if (!countBadge && title.parentElement) {
      countBadge = document.createElement("span")
      countBadge.id = "candidate-chats-count"
      countBadge.className = "candidate-chats-count"
      title.after(countBadge)
    }
    if (countBadge) countBadge.textContent = "(0)"
  }
  if (subtitle) {
    subtitle.hidden = true
    subtitle.textContent = ""
  }
  liveNote.hidden = true
  liveNote.textContent = ""

  const rooms = getRoomsArray()
  const live = liveRoom()
  const isRenderableCandidateRoom = (room) => {
    if (!room || typeof room !== "object") return false
    const candidateName = safeName(room.candidateName || "")
    if (!candidateName || candidateName === "Unknown Candidate") return false
    if (isInvalidCandidateName(candidateName)) return false
    return true
  }
  const rank = (room) => {
    const status = room.status || "active"
    const liveRank = live && room.roomId === live.roomId ? 0 : 1
    const statusRank = status === "kept" ? 1 : status === "active" ? 2 : 3
    const timeRank = -new Date(room.lastSyncedAt || 0).getTime()
    return [liveRank, statusRank, timeRank]
  }
  const sortedRooms = rooms.sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    for (let index = 0; index < ra.length; index += 1) {
      if (ra[index] !== rb[index]) return ra[index] - rb[index]
    }
    return 0
  })
  const filteredRooms = sortedRooms.filter(isRenderableCandidateRoom)
  const roomEntries = Object.entries(state.rooms || {}).filter(([, room]) => filteredRooms.includes(room))
  const activeRoomEntries = roomEntries.filter(([, room]) => (room.status || "active") !== "closed")
  const closedRoomEntries = roomEntries.filter(([, room]) => (room.status || "active") === "closed")
  const totalCandidateCount = filteredRooms.length
  if (title) {
    title.textContent = "Candidate Chats"
    const countBadge = card?.querySelector("#candidate-chats-count")
    if (countBadge) countBadge.textContent = `(${totalCandidateCount})`
  }

  const renderRoomCard = (roomKey, room) => {
    const card = document.createElement("article")
    card.className = `candidate-chat-card ${(room.status || "active") === "closed" ? "closed" : ""} ${
      roomKey === getActiveRoomKey() ? "selected" : ""
    }`
    card.dataset.roomId = roomKey

    const top = document.createElement("div")
    top.className = "candidate-chat-top"

    const name = document.createElement("strong")
    name.textContent = room.candidateName || "Unknown Candidate"

    const badge = document.createElement("span")
    badge.className = `candidate-status-badge ${(room.status || "active")}`
    badge.textContent = (room.status || "active").toUpperCase()

    top.append(name, badge)

    const buttons = document.createElement("div")
    buttons.className = "candidate-chat-buttons"
    const actions = (room.status || "active") === "closed" ? ["view", "profile", "reopen"] : ["view", "profile", "keep", "close"]
    actions.forEach((action) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "secondary"
      button.dataset.roomId = roomKey
      button.dataset.roomAction = action
      if (action === "profile") {
        button.dataset.action = "open-talent-profile"
      }
      button.textContent =
        action === "keep"
          ? "Keep"
          : action === "close"
            ? "Close"
            : action === "reopen"
              ? "Reopen"
              : action === "profile"
                ? "Profile"
                : "View"
      buttons.append(button)
    })

    card.append(top, buttons)
    return card
  }

  activeList.innerHTML = ""
  closedList.innerHTML = ""

  if (!activeRoomEntries.length && !closedRoomEntries.length) {
    const empty = document.createElement("div")
    empty.className = "empty-state"
    empty.textContent = "No candidates"
    activeList.append(empty)
  } else if (activeRoomEntries.length) {
    activeRoomEntries.forEach(([roomKey, room]) => activeList.append(renderRoomCard(roomKey, room)))
  }

  if (!closedRoomEntries.length) {
    const empty = document.createElement("div")
    empty.className = "empty-state"
    empty.textContent = "No closed chats."
    closedList.append(empty)
  } else {
    closedRoomEntries.forEach(([roomKey, room]) => closedList.append(renderRoomCard(roomKey, room)))
  }

  if (clearClosedButton) {
    clearClosedButton.dataset.action = "clear-closed-rooms"
    clearClosedButton.hidden = !closedRoomEntries.length
    clearClosedButton.disabled = !closedRoomEntries.length
  }
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
  console.log("[BlackDog] talentProfileModalOpen", state.talentProfileModalOpen)
  const userInput = el("upwork-user-name")
  if (userInput) userInput.value = state.upworkUserName || ""
  renderConnection()
  renderCandidateChats()
  renderReplyAssistant()
  renderProjectScriptArea()
  renderConversation()
  renderDebugScanResults()
  if (state.talentProfileModalOpen) {
    ensureTalentProfileTemplate()
    renderTalentProfileModal()
  }
}

function normalizeIncomingSnapshot(snapshot = {}) {
  const requestedKey = getRoomKey(snapshot)
  const incomingRoomUrl = normalizeRoomUrl(snapshot.roomUrl || snapshot.pageUrl || "")
  const existingKey =
    (requestedKey && state.rooms[requestedKey] ? requestedKey : "") ||
    Object.entries(state.rooms || {}).find(([, room]) => {
      if (!room || typeof room !== "object") return false
      const roomUrl = normalizeRoomUrl(room.roomUrl || room.pageUrl || "")
      return Boolean(incomingRoomUrl && roomUrl && incomingRoomUrl === roomUrl)
    })?.[0] ||
    requestedKey
  const existing = state.rooms[existingKey] || emptyRoom(snapshot)
  const roomId = existingKey || requestedKey
  const meName = safeName(state.upworkUserName || snapshot.meName || existing.meName || "")
  const incomingMessages = Array.isArray(snapshot.conversationMessages) ? snapshot.conversationMessages : []
  const previousMessages = Array.isArray(existing.conversationMessages) ? existing.conversationMessages : []
  const filteredPreviousMessages = previousMessages.filter(isMeaningfulConversationMessage)
  const filteredIncomingMessages = incomingMessages.filter(isMeaningfulConversationMessage)
  const mergeCandidateHint = safeName(snapshot.candidateName || existing.candidateName || "Unknown Candidate")
  const mergedMessages = filteredIncomingMessages.length
    ? mergeMessages(filteredPreviousMessages, filteredIncomingMessages, roomId, meName, mergeCandidateHint)
    : filteredPreviousMessages
  const snapshotCandidateName = safeName(snapshot.candidateName || "")
  const existingCandidateName = safeName(existing.candidateName || "")
  const derivedCandidateName = deriveCandidateName(mergedMessages, meName, "Unknown Candidate")
  const candidateName =
    (!isInvalidCandidateName(snapshotCandidateName) && snapshotCandidateName !== "Unknown Candidate" ? snapshotCandidateName : "") ||
    (!isInvalidCandidateName(existingCandidateName) && existingCandidateName !== "Unknown Candidate" ? existingCandidateName : "") ||
    (!isInvalidCandidateName(derivedCandidateName) && derivedCandidateName !== "Unknown Candidate" ? derivedCandidateName : "") ||
    "Unknown Candidate"
  const normalizedMessages = mergedMessages.map((message) => ({
    ...message,
    direction: deriveDirection(message.sender, meName, candidateName),
  }))
  const reliableMessages = normalizedMessages.filter(isMeaningfulConversationMessage)
  const lowConfidenceExtraction =
    snapshot.extractionMode === "fallback_debug_only" || reliableMessages.length < 2 || (reliableMessages.length && snapshot.hiddenLowConfidenceBlocks && snapshot.hiddenLowConfidenceBlocks > reliableMessages.length)

  const incomingCandidateAvatarUrl = safeName(snapshot.candidateAvatarUrl || "")
  const sameCandidate = !snapshotCandidateName || snapshotCandidateName === "Unknown Candidate" || !existingCandidateName || similarName(snapshotCandidateName, existingCandidateName)
  const sameRoom = !incomingRoomUrl || !normalizeRoomUrl(existing.roomUrl || existing.pageUrl || "") || incomingRoomUrl === normalizeRoomUrl(existing.roomUrl || existing.pageUrl || "")
  console.log("[BlackDog] merge room", {
    roomKey: roomId,
    candidateName: snapshot.candidateName,
    existingCandidateName: existing?.candidateName,
    messageCount: snapshot.conversationMessages?.length || 0,
    avatar: Boolean(snapshot.candidateAvatarUrl),
    headline: snapshot.candidateHeadline,
  })
  const room = mergeRoomRecord(existing, {
    ...snapshot,
    roomId,
    roomUrl: snapshot.roomUrl || snapshot.pageUrl || existing.roomUrl || "",
    pageUrl: snapshot.pageUrl || snapshot.roomUrl || existing.pageUrl || "",
    pageTitle: snapshot.pageTitle || existing.pageTitle || "Untitled Page",
    meName: meName || "Unknown",
    candidateName,
    candidateHeadline: safeName(snapshot.candidateHeadline || existing.candidateHeadline || ""),
    candidateAvatarUrl:
      incomingCandidateAvatarUrl && sameCandidate && sameRoom
        ? incomingCandidateAvatarUrl
        : existing.candidateAvatarUrl || "",
    conversationTitle: snapshot.conversationTitle || existing.conversationTitle || "Upwork Conversation",
    conversationMessages: reliableMessages,
    totalMessagesCaptured: reliableMessages.length,
    lastMessageText: reliableMessages.length ? reliableMessages[reliableMessages.length - 1].text || "" : "",
    lastMessageTime: reliableMessages.length ? reliableMessages[reliableMessages.length - 1].timestamp || "" : "",
    lastSyncedAt: snapshot.capturedAt || nowIso(),
    extractionMode: lowConfidenceExtraction ? "fallback_debug_only" : snapshot.extractionMode || existing.extractionMode || "fallback_debug_only",
    hiddenLowConfidenceBlocks: snapshot.hiddenLowConfidenceBlocks || 0,
    noiseBlocksRemoved: snapshot.noiseBlocksRemoved || 0,
    cachedConversation: false,
    status: existing.status || snapshot.status || "active",
  })

  if (existingKey && existingKey !== roomId) {
    delete state.rooms[existingKey]
  }
  state.rooms[roomId] = room
  state.rooms = dedupeCandidateRooms(state.rooms || {})
  state.liveRoomId = roomId
  state.activeRoomKey = roomId
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
  state.activeRoomKey = ""
  state.activeRoomId = ""
  state.liveRoomId = ""
  state.connectionStatus = "Waiting for active Upwork tab"
  state.lastSync = "Never"
  state.extractionMode = "Unknown"
  state.debugScanStatus = "idle"
  state.debugScanResults = []
  state.debugScanError = ""
  state.conversationTranslationLoading = false
  state.conversationTranslationLoadingRoomId = ""
  renderAll()
  await storageSet({ upworkUserName: state.upworkUserName })
  await sendRuntimeMessage({ type: "CLEAR_RECRUITING_CACHE" }).catch(() => null)
  const note = el("conversation-meta")
  if (note) note.textContent = "Cache cleared. Please refresh visible history or run Debug DOM Scan."
}

function updateRoomStatus(roomId, nextStatus) {
  const room = state.rooms[roomId]
  if (!room) return
  room.status = nextStatus
  if (nextStatus === "reopen") room.status = "active"
  if (room.status === "active" && roomId === state.activeRoomId) {
    state.connectionStatus = `Connected to ${room.candidateName || "current room"}`
  }
  void persistState()
  renderAll()
}

async function clearClosedRooms() {
  console.log("[BlackDog] clear closed clicked")
  const removedRooms = []
  const nextRooms = {}

  Object.entries(state.rooms || {}).forEach(([roomKey, room]) => {
    if (!room || typeof room !== "object") return
    const candidateName = safeName(room.candidateName || "")
    const status = room.status || room.candidateStatus || room.lifecycle || (room.closed ? "closed" : "active")
    const isClosed =
      room.status === "closed" ||
      room.candidateStatus === "closed" ||
      room.closed === true ||
      room.isClosed === true ||
      room.lifecycle === "closed"

    if (isClosed) {
      removedRooms.push({
        roomKey,
        candidateName,
        status: safeName(status || "closed"),
      })
      return
    }

    nextRooms[roomKey] = room
  })

  state.rooms = nextRooms
  if (!state.activeRoomKey || !state.rooms[state.activeRoomKey]) {
    state.activeRoomKey = Object.keys(state.rooms)[0] || ""
  }
  if (state.liveRoomId && !state.rooms[state.liveRoomId]) {
    state.liveRoomId = ""
  }
  state.activeRoomId = state.activeRoomKey

  console.log("[BlackDog] removed closed rooms", removedRooms)
  await storageSet({ [STORAGE_KEY]: serializeState() })
  renderAll()
}

async function saveCurrentTalentProfile(submittedToPool = false) {
  const room = state.rooms[state.talentProfileRoomId]
  if (!room) return
  if (isInvalidCandidateName(room.candidateName || "") && safeName(room.candidateName || "") !== "Unknown Candidate") return
  const key = getTalentProfileKey(room)
  const existingProfile = state.talentProfiles[key] || state.talentProfileDraft || {}
  const profile = normalizeTalentProfile(prefillTalentProfileFromRoom(readTalentProfileForm(), room), room)
  profile.submittedToTalentPool = Boolean(
    submittedToPool || existingProfile.submittedToTalentPool || profile.submittedToTalentPool,
  )
  if (submittedToPool) {
    profile.submittedToTalentPool = true
    profile.submittedAt = nowIso()
  } else {
    profile.submittedAt = existingProfile.submittedAt || profile.submittedAt || ""
  }
  state.talentProfiles[key] = profile
  state.talentProfileDraft = profile
  room.talentProfile = profile
  submitTalentProfileToPlatform(profile)
  await storageSet({ talentProfiles: state.talentProfiles })
  await storageSet({ [STORAGE_KEY]: serializeState() })
  setTalentProfileStatus(submittedToPool ? "Saved to Talent Pool." : "Draft saved.", true)
  renderAll()
}

function viewRoom(roomId) {
  const room = state.rooms[roomId]
  if (!room) return
  state.activeRoomKey = roomId
  state.activeRoomId = roomId
  const live = liveRoom()
  state.connectionStatus =
    live && live.roomId === roomId
      ? `Connected to ${room.candidateName || "current room"}`
      : "Viewing cached room. Open this candidate in Upwork to continue live capture."
  renderAll()
  void persistState()
}

function upsertRoomFromSnapshot(snapshot) {
  normalizeIncomingSnapshot(snapshot)
  renderAll()
  void persistState()
}

function messageListener(message) {
  if (message?.type !== "BLACKDOG_UPWORK_SNAPSHOT_UPDATED" && message?.type !== "BLACKDOG_SIDE_PANEL_SNAPSHOT_UPDATED") return false
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

function isWaitingSnapshotError(message = "") {
  return /No Upwork messages room found/i.test(text(message))
}

async function requestSnapshot(forceRefresh = false) {
  console.log("[BlackDog] request snapshot start", { forceRefresh })
  setDebugAction(forceRefresh ? "Refresh Visible History clicked" : "Refresh clicked")
  setStatus("connection-status", "Requesting active Upwork snapshot")
  try {
    const response = await sendRuntimeMessage({ type: "BLACKDOG_REQUEST_SNAPSHOT", forceRefresh })
    console.log("[BlackDog] Refresh response", response)
    if (!response?.ok || !response.snapshot) {
      const error = normalizeSnapshotError(response?.error)
      state.connectionStatus = isWaitingSnapshotError(error) ? "Waiting for active Upwork tab" : error
      renderConnection()
      const note = el("conversation-meta")
      if (note) note.textContent = error
      return null
    }

    console.log("[BlackDog] snapshot.conversationMessages.length", Array.isArray(response.snapshot.conversationMessages) ? response.snapshot.conversationMessages.length : 0)
    upsertRoomFromSnapshot(response.snapshot)
    state.connectionStatus = `Connected to ${response.snapshot.candidateName || "current room"}`
    renderConnection()
    return response.snapshot
  } catch (error) {
    const message = normalizeSnapshotError(error instanceof Error ? error.message : "")
    state.connectionStatus = isWaitingSnapshotError(message) ? "Waiting for active Upwork tab" : message
    renderConnection()
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
  const currentKey = getActiveRoomKey()
  if (currentKey && state.rooms[currentKey]) {
    state.rooms[currentKey].meName = value || "Unknown"
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
  bindTalentProfileModalClosers()
  bindClick("save-user-name", () => {
    void saveUpworkUserName()
  })
  const projectNode = el("reply-project")
  if (projectNode) {
    projectNode.addEventListener("change", () => {
      const nextProject = safeName(projectNode.value || "")
      state.selectedRecruitingProject = RECRUITING_PROJECTS.includes(nextProject)
        ? nextProject
        : DEFAULT_RECRUITING_PROJECT
      state.replyScriptId = ""
      state.projectScriptStatus = "Select a script"
      void storageSet({ [STORAGE_KEY]: serializeState(), selectedRecruitingProject: state.selectedRecruitingProject })
      renderAll()
    })
  }
  bindClick("sync-page", () => {
    console.log("[BlackDog] Refresh clicked")
    void requestSnapshot(false)
  })
  bindClick("refresh-visible-history", () => {
    console.log("[BlackDog] Refresh Visible History clicked")
    void requestSnapshot(true)
  })
  bindClick("debug-dom-scan", () => {
    void requestDebugScan()
  })
  bindClick("clear-cache", () => {
    void clearCache()
  })
  bindClick("clear-closed-chats", () => {
    void clearClosedRooms()
  })
  bindClick("talent-profile-ai-fill", () => {
    setTalentProfileStatus("AI Fill will be added later.", true)
  })
  bindClick("talent-profile-save-draft", () => {
    void saveCurrentTalentProfile(false)
  })
  bindClick("talent-profile-save-pool", () => {
    void saveCurrentTalentProfile(true)
  })
  bindClick("conversation-translation-toggle", () => {
    const nextExpanded = !state.conversationTranslationExpanded
    setConversationTranslationExpanded(nextExpanded)
    if (nextExpanded) {
      const room = activeRoom()
      if (room) void ensureConversationTranslations(room)
    }
  })
  bindClick("generate-reply", () => {
    void generateReply()
  })
  bindClick("translate-reply", () => {
    void translateReplyDraftToEnglish()
  })
  bindClick("copy-reply", () => {
    void copyReply()
  })
  bindClick("clear-reply", () => {
    clearReply()
  })

  const scriptNode = el("reply-script")
  if (scriptNode) {
    scriptNode.addEventListener("change", () => {
      state.replyScriptId = scriptNode.value
      if (scriptNode.value) {
        void copyProjectScript(scriptNode.value)
      } else {
        setProjectScriptStatus("Select a script")
      }
    })
  }
  const englishNode = el("reply-english")
  if (englishNode) {
    englishNode.addEventListener("input", () => {
      state.replyEnglish = englishNode.value
    })
  }
  const chineseNode = el("reply-chinese")
  if (chineseNode) {
    chineseNode.addEventListener("input", () => {
      state.replyChineseDraft = chineseNode.value
    })
  }

  const translationDefaultExpanded = el("conversation-translation-default-expanded")
  if (translationDefaultExpanded) {
    translationDefaultExpanded.addEventListener("change", () => {
      state.conversationTranslationDefaultExpanded = Boolean(translationDefaultExpanded.checked)
      state.conversationTranslationExpanded = state.conversationTranslationDefaultExpanded
      void storageSet({ conversationTranslationDefaultExpanded: state.conversationTranslationDefaultExpanded })
      renderConversation()
      if (state.conversationTranslationExpanded) {
        const room = activeRoom()
        if (room) void ensureConversationTranslations(room)
      }
    })
  }

  document.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const actionTarget = target.closest("[data-action]")
    if (actionTarget instanceof HTMLElement) {
      const action = actionTarget.dataset.action || ""
      if (action === "open-talent-profile") {
        event.preventDefault()
        event.stopPropagation()

        const roomId = actionTarget.getAttribute("data-room-id") || actionTarget.dataset.roomId || ""
        console.log("[BlackDog] profile button clicked", { roomId })

        if (!roomId) {
          console.warn("[BlackDog] open talent profile missing roomId")
          return
        }
        openTalentProfile(roomId)
        return
      }
      if (action === "close-talent-profile" || action === "emergency-close-talent-profile") {
        closeTalentProfileModal()
        return
      }
      if (action === "close-talent-profile-overlay" && event.target === actionTarget) {
        closeTalentProfileModal()
        return
      }
    }
    const button = target.closest("button[data-room-id][data-room-action]")
    if (!button) return

    const roomId = button.getAttribute("data-room-id") || ""
    const action = button.getAttribute("data-room-action") || ""
    if (!roomId || !action) return

    event.preventDefault()
    event.stopPropagation()

    if (action === "keep") updateRoomStatus(roomId, "kept")
    if (action === "close") updateRoomStatus(roomId, "closed")
    if (action === "reopen") updateRoomStatus(roomId, "active")
    if (action === "view") viewRoom(roomId)
    if (action === "clear-closed-rooms") {
      void clearClosedRooms()
      return
    }
  })

}

async function bootstrap() {
  await loadState()
  state.talentProfileModalOpen = false
  state.talentProfileRoomId = ""
  state.talentProfileStatus = ""
  forceHideTalentProfileModal()
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
