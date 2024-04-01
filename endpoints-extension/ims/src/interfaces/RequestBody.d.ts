export interface SubmissionDTO {
  data: any
  level?: number
  status?: number
  send_email: number
  file_publisher: {
    submission: number
    folder: string
    document_number: string
    revision_number: number
    department_division: number
    division_number: number
  }
}

export interface ObsoleteDTO {
  id: string
  created_by: string
  created_at: Date
  file_publisher: string
  status: number
  business: number
  reason_reject: string
  reason_obsolete: string
}

export interface ObsoleteLogDTO {
  id: string
  created_by: string
  created_at: Date
  document_obsolete: string
  status: number
  reason_reject: string
}

export interface SearchDTO {
  query: string
  departments_related: number
  business: number
}
