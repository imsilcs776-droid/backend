export interface SubmissionDTO {
  data: any
  status?: number
  dispose_to?: string
  assign_to: string
  replaced: string
  reject_type?: string
  approve_order: string
  reason: string
  send_email: number
  draft_id: number
}

export interface CreateSubmissionDTO {
  data: any
  assign_to: string
  replaced: string
  form: number
  submission_number: number
  send_email: number
  is_revice: number
  draft_id: number
  submission_revice: number
  repo_revice: number
}
