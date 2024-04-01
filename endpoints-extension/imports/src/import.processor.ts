import * as dotenv from 'dotenv';
import { ImportHelper } from './import.helper';
import * as ExcelHelper from "xlsx";
dotenv.config();
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD;

export class ImportProcessor {
  constructor(
    private readonly redisService: any,
    private readonly sectorService: any,
    private readonly areaService: any,
    private readonly lineService: any,
    private readonly processService: any,
    private readonly machineService: any,
    private readonly departmentService: any,
    private readonly jobService: any,
    private readonly levelService: any,
    private readonly userService: any,
    private readonly restrictionService: any,
    private readonly statusService: any,
    private readonly metaService: any,
  ) { }

  async plant(job: any) {
    const {
      data: { companyId, plantId, sheets, outline },
    } = job;
    const helper = new ImportHelper();
    const client = await this.redisService.getClient();
    const { Area, Sector, Line, Process, Machine } = sheets;
    const xlsAreas = await helper.populateArea(Area);
    const xlsSectors = await helper.populateSector(Sector);
    const xlsLines = await helper.populateLine(Line);
    const xlsProcesses = await helper.populateProcess(Process);
    const xlsMachines = await helper.populateMachine(Machine);
    let areas: any = [];
    let sectors: any = [];
    let lines: any = [];
    let processes: any = [];
    let machines: any = [];

    const isValid = await this.validateLimit('PLANT', {
      companyId,
      xlsAreas,
      xlsSectors,
      xlsLines,
      xlsProcesses,
      xlsMachines,
    });

    if (isValid) {
      let counter = 0;
      const total =
        xlsAreas.length +
        xlsSectors.length +
        xlsLines.length +
        xlsProcesses.length +
        xlsMachines.length;

      //Area Loading
      (areas = await this.areaService.readByQuery({
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));
      for (const xlsArea of xlsAreas) {
        const [filterArea] = areas.filter(
          (dt: { code: any; }) => dt.code == xlsArea.code,
        );

        if (!filterArea) {
          const body: any = {
            company: companyId,
            plant: plantId,
            name: String(xlsArea.name),
            is_active: true,
            code: String(xlsArea.code),
            description: String(xlsArea.description),
          };

          try {
            await this.areaService.createOne(body);
            outline.successCount++;
          } catch (error) {
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsArea,
            });
          }
        }
        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }

      //Sector Loading
      (sectors = await this.sectorService.readByQuery({
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));
      for (const xlsSector of xlsSectors) {
        const [filterSector] = sectors.filter(
          (dt: { code: any; }) => dt.code == xlsSector.code,
        );
        if (!filterSector) {
          const body: any = {
            company: companyId,
            plant: plantId,
            name: String(xlsSector.name),
            is_active: true,
            code: String(xlsSector.code),
            description: String(xlsSector.description),
          };

          try {
            await this.sectorService.createOne(body);
            outline.successCount++;
          } catch (error) {
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsSector,
            });
          }
        }
        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }

      //Line loading
      (sectors = await this.sectorService.readByQuery({
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));

      (lines = await this.lineService.readByQuery({
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));
      for (const xlsLine of xlsLines) {
        const [filterLine] = lines.filter(
          (dt: { code: any; }) => dt.code == xlsLine.code,
        );
        const [filterSector] = sectors.filter(
          (dt: { code: any; }) => dt.code == xlsLine.sectorCode,
        );
        if (!filterLine) {
          const body: any = {
            company: companyId,
            plant: plantId,
            sector: filterSector ? filterSector.id : -1,
            name: String(xlsLine.name),
            is_active: true,
            code: String(xlsLine.code),
            description: String(xlsLine.description),
          };

          try {
            await this.lineService.createOne(body);
            outline.successCount++;
          } catch (error) {
            console.debug(body, error);
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsLine,
            });
          }
        }

        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }

      //Process loading
      (lines = await this.lineService.readByQuery({
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));

      (processes = await this.processService.readByQuery({
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));
      for (const xlsProcess of xlsProcesses) {
        const [filterProcess] = processes.filter(
          (dt: { code: any; }) => dt.code == xlsProcess.code,
        );
        const [filterSector] = sectors.filter(
          (dt: { code: any; }) => dt.code == xlsProcess.sectorCode,
        );
        const [filterLine] = lines.filter(
          (dt: { code: any; }) => dt.code == xlsProcess.lineCode,
        );
        if (!filterProcess) {
          const body: any = {
            company: companyId,
            plant: plantId,
            sector: filterSector ? filterSector.id : -1,
            line: filterLine ? filterLine.id : -1,
            name: String(xlsProcess.name),
            is_active: true,
            code: String(xlsProcess.code),
            description: String(xlsProcess.description),
          };

          try {
            await this.processService.createOne(body);
            outline.successCount++;
          } catch (error) {
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsProcess,
            });
          }
        }
        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }

      //Machine loading
      (processes = await this.processService.readByQuery({
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));

      (machines = await this.machineService.readByQuery({
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));
      for (const xlsMachine of xlsMachines) {
        const [filterMachine] = machines.filter(
          (dt: { code: any; }) => dt.code == xlsMachine.code,
        );
        const [filterArea] = areas.filter(
          (dt: { code: any; }) => dt.code == xlsMachine.areaCode,
        );
        const [filterSector] = sectors.filter(
          (dt: { code: any; }) => dt.code == xlsMachine.sectorCode,
        );
        const [filterLine] = lines.filter(
          (dt: { code: any; }) => dt.code == xlsMachine.lineCode,
        );
        const [filterProcess] = processes.filter(
          (dt: { code: any; }) => dt.code == xlsMachine.processCode,
        );
        if (!filterMachine) {
          const body: any = {
            company: companyId,
            plant: plantId,
            area: filterArea ? filterArea.id : null,
            sector: filterSector ? filterSector.id : -1,
            line: filterLine ? filterLine.id : -1,
            process: filterProcess ? filterProcess.id : -1,
            name: String(xlsMachine.name),
            is_active: true,
            code: String(xlsMachine.code),
            description: String(xlsMachine.description),
          };

          try {
            await this.machineService.createOne(body);
            outline.successCount++;
          } catch (error) {
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsMachine,
            });
          }
        }
        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }
    } else {
      outline.successCount = 0;
      outline.failedCount = 0;
      outline.progress = 0;
      outline.errors.push({
        success: false,
        message: `The data you import will exceed the maximum limit, please adjust the data first!`,
        data: null,
      });
      await this.storeRedis(client, outline);
    }

  }

  async organization(job: any) {
    const {
      data: { companyId, plantId, sheets, outline },
    } = job;

    const client = await this.redisService.getClient();
    const { Department, Job_Title, Job_Level, User } = sheets;

    const xlsDepartments: any[] = ExcelHelper.utils.sheet_to_json(Department);
    const xlsJobs: any[] = ExcelHelper.utils.sheet_to_json(Job_Title);
    const xlsLevels: any[] = ExcelHelper.utils.sheet_to_json(Job_Level);
    let xlsUsers: any[] = [];

    if (User) {
      xlsUsers = ExcelHelper.utils.sheet_to_json(User);
    }
    let departments: any = [];
    let jobs: any = [];
    let levels: any = [];
    let users: any = [];

    const isValid = await this.validateLimit('ORGANIZATION', {
      companyId,
      xlsDepartments,
      xlsUsers
    });

    if (isValid) {
      let counter = 0;
      const total =
        xlsDepartments.length +
        xlsJobs.length +
        xlsLevels.length +
        xlsUsers.length;

      // Department Loading
      (departments = await this.departmentService.readByQuery({
        fields: ["*", "department.*"],
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));

      for (const xlsDept of xlsDepartments) {
        const [filterDept] = departments.filter((dt: { department: { code: any; }; }) => dt.department.code == xlsDept["department code"]);
        if (!filterDept) {
          const body: any = {
            company: companyId,
            plant: plantId,
            department: {
              code: String(xlsDept["department code"]),
              name: String(xlsDept["department name"]),
              description: String(xlsDept["description (optional)"]),
              is_active: true,
            }
          };

          try {
            await this.departmentService.createOne(body);
            outline.successCount++;
          } catch (error) {
            console.debug(error);
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsDept,
            });
          }
        }
        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }

      //Job Loading
      (departments = await this.departmentService.readByQuery({
        fields: ["*", "department.*"],
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
          deleted_at: {
            _null: true,
          },
        }
      }));

      (jobs = await this.jobService.readByQuery({
        fields: ["*", "job.*"],
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
        }
      }));

      for (const xlsJob of xlsJobs) {
        const [filterDept] = departments.filter(
          (dt: { department: { code: any; }; }) => dt.department.code == xlsJob["department code"],
        );
        const [filterJob] = jobs.filter((dt: { job: { code: any; }; }) => dt.job.code == xlsJob["job title code"]);

        if (!filterJob) {
          const body: any = {
            company: companyId,
            plant: plantId,
            department: filterDept ? filterDept.department.id : -1,
            job: {
              code: String(xlsJob["job title code"]),
              name: String(xlsJob["job title name"]),
              description: String(xlsJob["description (optional)"]),
              is_active: true,
            }
          };

          try {
            await this.jobService.createOne(body);
            outline.successCount++;
          } catch (error) {
            console.debug(error);
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsJob,
            });
          }
        }
        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }

      //Level Loading
      (jobs = await this.jobService.readByQuery({
        fields: ["*", "job.*"],
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
        }
      }));

      (levels = await this.levelService.readByQuery({
        fields: ["*", "level.*"],
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
        }
      }));
      for (const xlsLevel of xlsLevels) {
        const [filterDept] = departments.filter(
          (dt: { department: { code: any; }; }) => dt.department.code == xlsLevel["department code"],
        );
        const [filterJob] = jobs.filter((dt: { job: { code: any; }; }) => dt.job.code == xlsLevel["job title code"]);
        const [filterLevel] = levels.filter((dt: { level: any; }) => {
          const { level } = dt;
          const { code }: any = level ? level : {};
          return code && code == xlsLevel["job level code"] ? true : false
        });
        if (!filterLevel) {
          const body: any = {
            company: companyId,
            plant: plantId,
            department: filterDept ? filterDept.department.id : -1,
            job: filterJob ? filterJob.job.id : -1,
            level: {
              code: String(xlsLevel["job level code"]),
              name: String(xlsLevel["job level name"]),
              description: String(xlsLevel["description (optional)"]),
              is_active: true,
            }
          };

          try {
            await this.levelService.createOne(body);
            outline.successCount++;
          } catch (error) {
            console.debug(error);
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsLevel,
            });
          }
        }
        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }

      //User Loading
      (levels = await this.levelService.readByQuery({
        fields: ["*", "level.*"],
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
        }
      }));

      (users = await this.userService.readByQuery({
        fields: ["*", "level.*"],
        filter: {
          company: {
            _eq: companyId
          },
          plant: {
            _eq: plantId
          },
        }
      }));
      for (const xlsUser of xlsUsers) {
        const [filterUser] = users.filter(
          (dt: { email: any; username: any; }) => dt.email == xlsUser.email || dt.username == xlsUser.username
        );
        const [filterDept] = departments.filter(
          (dt: { department: { code: any; }; }) => dt.department.code == xlsUser["department code"],
        );
        const [filterJob] = jobs.filter((dt: { job: { code: any; }; }) => dt.job.code == xlsUser["job title code"]);
        const [filterLevel] = levels.filter((dt: { level: any; }) => {
          const { level } = dt;
          const { code }: any = level ? level : {};
          return code && code == xlsUser["job level code"] ? true : false
        });
        if (!filterUser) {
          const body: any = {
            company: companyId,
            plant: plantId,
            department: filterDept ? filterDept.department.id : -1,
            job: filterJob ? filterJob.job.id : -1,
            level: filterLevel ? filterLevel.level.id : -1,
            status: "active",
            username: String(xlsUser.username),
            password: DEFAULT_PASSWORD,
            email: String(xlsUser.email),
            profile: {
              id_number: String(xlsUser["id number"]),
              email: String(xlsUser.email),
              full_name: String(xlsUser.fullname),
              gender: String(xlsUser.gender),
              religion: String(xlsUser.religion),
              address: String(xlsUser.address),
              phone: String(xlsUser.phone),
              post_code: String(xlsUser["postal code"]),
            }
          };

          try {
            await this.userService.createOne(body);
            outline.successCount++;
          } catch (error) {
            console.debug(error);
            outline.failedCount++;
            outline.errors.push({
              success: false,
              message: error,
              data: xlsUser,
            });
          }
        }
        counter++;
        outline.progress = total > 0 ? (counter / total) * 100 : 0;
        outline.progress = Math.floor(outline.progress);
        await this.storeRedis(client, outline);
      }
    } else {
      outline.successCount = 0;
      outline.failedCount = 0;
      outline.progress = 0;
      outline.errors.push({
        success: false,
        message: `The data you import will exceed the maximum limit, please adjust the data first!`,
        data: null,
      });
      await this.storeRedis(client, outline);
    }
  }

  async subscribe(topic: any) {
    const client = await this.redisService.getClient();
    return await client.get(topic);
  }

  private async storeRedis(client: any, outline: any) {
    const { topic, progress, errors, successCount, failedCount } = outline;
    await client.set(`${topic}`, JSON.stringify({ data: { progress, successCount, failedCount, errors } })); // redis set
    await client.publish(`${topic}`, JSON.stringify({ data: { progress, successCount, failedCount, errors } })); // redis publish
  }

  private async validateLimit(category: string, item: any) {
    const { companyId } = item;
    const [status] = await this.statusService.readByQuery({
      filter: {
        category: {
          _eq: "RESTRICTION"
        },
        code: {
          _eq: "LIMIT"
        },
        deleted_at: {
          _null: true,
        },
      }
    });

    let restrictions = await this.restrictionService.readByQuery({
      filter: {
        company: {
          _eq: companyId
        },
        deleted_at: {
          _null: true,
        },
      }
    });

    restrictions = restrictions.filter((restriction: { settings: { status: any; }[]; }) => {
      let include = false;

      restriction.settings.forEach((setting: { status: any; }) => {
        if (setting.status === status?.id) {
          include = true;
        }
      })

      return include && restriction;
    });

    if (category == 'ORGANIZATION') {
      let departmentLength: number = 0;
      let userLength: number = 0;

      const { xlsDepartments, xlsUsers } = item;

      const departmentMeta = await this.metaService.getMetaForQuery("departments", {
        meta: ['count', 'total_page', 'current_page', 'limit'],
        limit: 1,
        offset: 0,
        page: 1,
        filter: {
          company: {
            _eq: companyId
          }
        }
      });

      departmentLength = Math.floor(xlsDepartments.length + departmentMeta.count);

      const userMeta = await this.metaService.getMetaForQuery("directus_users", {
        meta: ['count', 'total_page', 'current_page', 'limit'],
        limit: 1,
        offset: 0,
        page: 1,
        filter: {
          company: {
            _eq: companyId
          }
        }
      });

      userLength = Math.floor(xlsUsers.length + userMeta.count);

      if (restrictions.length > 0) {
        const [restriction] = restrictions.filter((restriction: { settings?: any; entity?: any; }) => {
          const { entity } = restriction;
          if (entity == 'Departments') {
            const [setting] = restriction.settings.filter((setting: { value: number; }) => {
              return departmentLength > setting.value ? true : false;
            });
            return setting ? true : false;
          } else if (entity == 'Users') {
            const [setting] = restriction.settings.filter((setting: { value: number; }) => {
              return userLength > setting.value ? true : false;
            });
            return setting ? true : false;
          }
          return false;
        });

        return restriction ? false : true;
      }

    } else if (category == 'PLANT') {
      let areaLength: number = 0;
      let sectorLength: number = 0;
      let lineLength: number = 0;
      let processLength: number = 0;
      let machineLength: number = 0;
      const { xlsAreas, xlsSectors, xlsLines, xlsProcesses, xlsMachines } = item;

      const areaMeta = await this.metaService.getMetaForQuery("areas", {
        meta: ['count', 'total_page', 'current_page', 'limit'],
        limit: 1,
        offset: 0,
        page: 1,
        filter: {
          company: {
            _eq: companyId
          }
        }
      });

      areaLength = Math.floor(xlsAreas.length + areaMeta.count);

      const sectorMeta = await this.metaService.getMetaForQuery("sectors", {
        meta: ['count', 'total_page', 'current_page', 'limit'],
        limit: 1,
        offset: 0,
        page: 1,
        filter: {
          company: {
            _eq: companyId
          }
        }
      });

      sectorLength = Math.floor(xlsSectors.length + sectorMeta.count);

      const lineMeta = await this.metaService.getMetaForQuery("lines", {
        meta: ['count', 'total_page', 'current_page', 'limit'],
        limit: 1,
        offset: 0,
        page: 1,
        filter: {
          company: {
            _eq: companyId
          }
        }
      });
      lineLength = Math.floor(xlsLines.length + lineMeta.count);

      const processMeta = await this.metaService.getMetaForQuery("processes", {
        meta: ['count', 'total_page', 'current_page', 'limit'],
        limit: 1,
        offset: 0,
        page: 1,
        filter: {
          company: {
            _eq: companyId
          }
        }
      });
      processLength = Math.floor(xlsProcesses.length + processMeta.count);

      const machineMeta = await this.metaService.getMetaForQuery("machines", {
        meta: ['count', 'total_page', 'current_page', 'limit'],
        limit: 1,
        offset: 0,
        page: 1,
        filter: {
          company: {
            _eq: companyId
          }
        }
      });
      machineLength = Math.floor(xlsMachines.length + machineMeta.count);

      if (restrictions.length > 0) {
        const [restriction] = restrictions.filter((restriction: { settings?: any; entity?: any; }) => {
          const { entity } = restriction;
          if (entity == 'Areas') {
            const [setting] = restriction.settings.filter((setting: { value: number; }) => {
              return areaLength > setting.value ? true : false;
            });
            return setting ? true : false;
          } else if (entity == 'Sectors') {
            const [setting] = restriction.settings.filter((setting: { value: number; }) => {
              return sectorLength > setting.value ? true : false;
            });
            return setting ? true : false;
          } else if (entity == 'Lines') {
            const [setting] = restriction.settings.filter((setting: { value: number; }) => {
              return lineLength > setting.value ? true : false;
            });
            return setting ? true : false;
          } else if (entity == 'Processes') {
            const [setting] = restriction.settings.filter((setting: { value: number; }) => {
              return processLength > setting.value ? true : false;
            });
            return setting ? true : false;
          } else if (entity == 'Machines') {
            const [setting] = restriction.settings.filter((setting: { value: number; }) => {
              return machineLength > setting.value ? true : false;
            });
            return setting ? true : false;
          }
          return false;
        });

        return restriction ? false : true;
      }
    }
    return true;
  }
}
