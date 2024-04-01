export interface ActivityDTO {
  id?: number
  name: string
  description: string
  company: number
  plant: number
  department: number
  business: number
  tags: string[]
  icons: string
  frequency: number
  type: string
  forms: number[]
  created_by?: string
}
