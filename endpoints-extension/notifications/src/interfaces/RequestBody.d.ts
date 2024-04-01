export interface NotificationDTO {
  id: string
  created_by: string
  created_at: string
  deleted_at: string
  message: string
  subject: string
  url: string
  users: string[]
}

export interface NotificationDepartmentDTO {
  id: string
  created_by: string
  created_at: string
  deleted_at: string
  message: string
  subject: string
  url: string
  department: number
}
