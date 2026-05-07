export type CurrentUser = {
  id: string
  name: string
  role: "hr" | "admin" | "viewer"
}

export type TalentPoolSubmissionPayload = {
  source: "upwork"
  platform: "Upwork"
  candidateName: string
  avatarUrl: string
  education: string
  professionalDomain: string
  upworkChatUrl: string
  profileUrl: string
  nativeLanguage: string
  secondLanguage: string
  mainSkill: string
  experienceSummary: string
  dailyAvailability: string
  weekendAvailability: string
  email: string
  onlineContactMethod: string
  onlineContactAccount: string
  submittedAt: string
  roomId: string
  pageUrl: string
  submittedByHrId: string
  submittedByHrName: string
}

export type TalentProfileRecord = {
  talentId: string
  sourcePlatform: "Upwork"
  candidateName: string
  avatarUrl: string
  education: string
  professionalDomain: string
  upworkChatUrl: string
  profileUrl: string
  nativeLanguage: string
  secondLanguage: string
  mainSkill: string
  experienceSummary: string
  dailyAvailability: string
  weekendAvailability: string
  email: string
  onlineContactMethod: string
  onlineContactAccount: string
  submittedByHrId: string
  submittedByHrName: string
  submittedAt: string
  status: "submitted"
  profilePdfFileUrl: string
  profilePdfFilePath: string
  createdAt: string
  updatedAt: string
  status: "submitted" | "deleted"
  deletedAt?: string
  deletedById?: string
  deletedByName?: string
}

export type HrSubmissionRecord = {
  progressId: string
  talentId: string
  hrId: string
  hrName: string
  candidateName: string
  avatarUrl: string
  nativeLanguage: string
  secondLanguage: string
  upworkChatUrl: string
  submitStatus: "success"
  submittedAt: string
}

export type TalentPoolDataset = {
  talentProfiles: TalentProfileRecord[]
  hrSubmissions: HrSubmissionRecord[]
}
