import { Context, Endpoint, Get, Param, Req } from "@mv-data-core/decorator";
import { IAuditImplementation, IAuditResult, IChecklistDetail, IDetailFinding, IRegion } from "./interfaces";

@Endpoint()
export default class DefineEndpoint {
  @Get(
    { path: "/result-document/:auditResultId", tag: "Audit_Results"},
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: "string"
                },
                data: {
                  type: "array",
                  properties: {
                    id: {
                      type: "string",
                    },
                  }
                }
              }
            },
          },
        },
      ],
      parameters: [
        {
          in: 'path',
          name: 'auditResultId',
          schema: {
            type: 'string',
          },
          required: true,
        },
      ],
    }
  )
  async detail(@Req() req: any, @Context() ctx: any, @Param("auditResultId") auditResultId: string) {
    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException },
    } = ctx;

    const auditService = new ItemsService("audit_results", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const auditPlanService = new ItemsService("audit_plans", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const auditImplementationService = new ItemsService("audit_plan_implementations", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const auditChecklistService = new ItemsService("audit_plan_checklist_details", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [auditResult]: [IAuditResult] = await auditService.readByQuery({
      filter: {
        id: {
          _eq: auditResultId,
        },
      },
      fields: [
        'assigned_to',
        'audit_plan.id',
      ],
    });

    if (!auditResult) throw new InvalidPayloadException(`Audit Result Not Found`);

    const [auditPlans] = await auditPlanService.readByQuery({
      filter: {
        id: { _eq: auditResult.audit_plan.id } 
      },
      fields: [
        'id',
        'auditor_team.lead.user.first_name',
        'auditor_team.lead.user.last_name',
        'auditor_team.members.user_auditor.user.first_name',
        'auditor_team.members.user_auditor.user.last_name',
      ],
    });

    const auditImplementation: IAuditImplementation[] = await auditImplementationService.readByQuery({
      filter: {
        _and: [ 
          { audit_plan: { _eq: auditPlans.id } },
          { audit_plan_checklist: { _nnull: true } }
        ]
      },
      fields: [
        'id',
        'start',
        'end',
        'department.name',
        'department.code',
        'division.name',
        'audit_plan_checklist.id',
        'audit_plan_implementation_auditees.user.full_name',
        'audit_plan_implementation_auditees.user.i_com_code',
        'audit_plan_implementation_auditees.user.department.name',
      ],
    });

    const schedules: any[] = [];
    const division: any[] = [];
    const departments: any[] = [];
    const auditees: any[] = [];

    const members: string[] = auditPlans.auditor_team.members.map((member: any) => {
      return member.user_auditor.user.first_name + ' ' + member.user_auditor.user.last_name;
    });

    let auditByRegion: IRegion[] = await Promise.all(auditImplementation.map( async (implementation) => {
      const regionalPos = checkRegional(implementation.audit_plan_implementation_auditees[0]?.user.i_com_code as string);
      const departmentPos = implementation.audit_plan_implementation_auditees[0]?.user.department !== null ? implementation.audit_plan_implementation_auditees[0]?.user.department.name as string : 'Department Tidak Ada';

      division.push(implementation.division);
      departments.push(implementation.department);
      schedules.push(`${implementation.start}until${implementation.end}`)
      implementation.audit_plan_implementation_auditees.forEach((auditee) => {
        auditees.push((auditee.user.full_name))
      })

      if (implementation.audit_plan_checklist == null) {
        return {
          name: regionalPos,
          department: departmentPos,
          detail_finding: {
            aoi: 0,
            aoc: 0,
            maj: 0,
            total: 0
          }
        } 
      }
      
      const detailData: IChecklistDetail[] = await auditChecklistService.readByQuery({
        filter: {
          _and: [
            { audit_plan_checklist: { _eq: implementation.audit_plan_checklist.id } },
            { finding_type: { _nnull: true } },
            { finding_type: { _neq: "suitability" } }
          ]
        },
        fields: [
          'finding_type'
        ],
      });

      const findingResult = countFinding(detailData)

      const regionAudit = {
        name: regionalPos,
        department: departmentPos,
        detail_finding: findingResult
      }

      return regionAudit;
    }));

    const regionGrouped = Object.entries(
      groupBy('name')(auditByRegion)
    ).map(([key, value]) => ({ name: key, department: value }))
    
    const resultData = {
      assigned_to: auditResult.assigned_to,
      schedules: schedules,
      lead: auditPlans.auditor_team.lead.user.first_name + ' ' + auditPlans.auditor_team.lead.user.last_name,
      members: members,
      divisions: division,
      departments: departments,
      auditees: auditees,
      findings: regionGrouped
    }
    
    return {
      success: true,
      message: 'Get Audit Result Details',
      data: resultData
    }
  }
}

function checkRegional(comCode: string): string {
  switch (comCode) {
    case '1000':
      return 'Kantor Pusat';
    case '1310':
      return 'Regional 1';
    case '1320':
      return 'Regional 2';
    case '1330':
      return 'Regional 3';
    case '1340':
      return 'Regional 4';
    default:
      return 'Not Found'
  }
}

function countFinding(detailData: IChecklistDetail[]): IDetailFinding {
  let aocLength = 0;
  let aoiLength = 0;
  let majLength = 0;
  detailData.forEach(detail => {
    switch (detail.finding_type as string) {
      case 'concern':
        aocLength += 1;
        break;
      case 'improvement':
        aoiLength += 1;
        break;
      case 'major':
        majLength += 1;
        break;
      default:
        break;
    }
  });

  return {
    aoi: aoiLength,
    aoc: aocLength,
    maj: majLength,
    total: aoiLength + aocLength + majLength
  }
}

const groupBy = (prop: string) => (data: any[]) => {
  return data.reduce((dict: { [x: string]: any; }, item: { [x: string]: any; }) => {
    const { [prop]: _, ...rest } = item
    dict[item[prop]] = [...(dict[item[prop]] || []), rest]
    return dict
  }, {})
}