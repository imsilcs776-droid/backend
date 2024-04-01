export interface IDetailFinding {
  aoi: number,
  aoc: number,
  maj: number,
  total: number
}

export interface IDepartment {
  name: string,
}

export interface IRegion {
  name: string, 
  department: string,
  detail_finding: IDetailFinding
}

export interface IUser {
  full_name: string,
  i_com_code: string,
  department: IDepartment
}

export interface IAuditPlanAuditee {
  user: IUser
}

export interface IAuditPlanChecklist {
  id: string,
}

export interface IAuditImplementation {
  id: string,
  division: string,
  department: string,
  start: string,
  end: string,
  audit_plan_checklist: IAuditPlanChecklist,
  audit_plan_implementation_auditees: IAuditPlanAuditee[],
  region: IRegion
}

export interface IAuditRealization {
  audit_plan_checklist_detail: IChecklistDetail
}

export interface IChecklistDetail {
  finding_type: string | null
}

export interface IChecklistData {
  id: string,
  audit_plan_checklist_details: IChecklistDetail
}

export interface IAuditPlan {
  id: string,
  audit_realizations: IAuditRealization[],
  checklist_data: IChecklistData[],
  audit_program: string

}

export interface IAuditResult {
  id: string,
  assigned_to: string,
  audit_plan: IAuditPlan,
}