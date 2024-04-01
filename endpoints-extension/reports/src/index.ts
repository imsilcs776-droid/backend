import { Body, Context, Endpoint, Get, Param, Patch, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint('reports')
export default class DefineEndpoint {
  @Get(
    { path: "/business", tag: "Report" },
    {
      responses: [
        {
          200: {
            description: "Response get array of object report",
            responseType: "array",
            schema: "Report",
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "company",
          schema: { type: "number" },
          required: true,
        },
        {
          in: "query",
          name: "plant",
          schema: { type: "number" },
          required: true,
        },
        {
          in: "query",
          name: "filter_by",
          schema: { enum: ['name'], type: "string" },
          required: false,
        },
        {
          in: "query",
          name: "search",
          schema: { type: "string" },
          required: false,
        },
        {
          in: "query",
          name: "pagination",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "limit",
          schema: { type: "number" },
          required: false,
        },
      ],
    }
  )
  async getReportsBusiness(
    @Req() req: any,
    @Res() res: any,
    @Context() context: any,
    @Query("company") company: number,
    @Query("plant") plant: number,
    @Query("filter_by") filter_by: string,
    @Query("search") search: string,
    @Query("pagination") pagination: number,
    @Query("limit") limit: number,
  ) {
    const {
      services: { ItemsService, MetaService },
      exceptions: { ServiceUnavailableException },
    } = context;

    const businesservice = new ItemsService("Businesses", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const plantService = new ItemsService("plants", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const businessStateservice = new ItemsService("business_states", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const metaService = new MetaService({
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      let success = true;
      let message = 'Successfully Get Data';
      let data: any = [];

      const filter: any = {};

      if (company) filter.company = { _eq: company };
      if (plant) filter.plant = { _eq: plant };
      if (filter_by && search) filter[filter_by] = { _contains: search };

      const sanitizedQuery = {
        fields: ["*", "activities.*", "entity.*"],
        filter,
        limit,
        offset: 1,
        page: pagination,
        meta: ['count','total_page','current_page','limit'],
      };

      const businesses = await businesservice.readByQuery(sanitizedQuery);
      const meta = await metaService.getMetaForQuery("Businesses", sanitizedQuery);

      if (businesses.length > 0) {
        const collections: any = [];
        let entityNames = businesses.map((bus: any) => bus.entity?.name).filter((bus: any) => bus);
        entityNames = [...new Set(entityNames)];

        for (const entityName of entityNames) {
          const dynamicService = new ItemsService(entityName.toLowerCase(), {
            schema: req.schema,
            accountability: req.accountability,
          });

          const dynamicDatas = await dynamicService.readByQuery({
            filter: {
              company: {
                _eq: company,
              },
              plant: {
                _eq: plant,
              }
            },
          });

          collections.push({ entityName, dataLength: dynamicDatas.length });
        }

        const plants = await plantService.readByQuery({
          filter: {
            id: {
              _in: businesses.map((bus: any) => bus.plant).filter((bus: any) => bus)
            }
          },
        });

        const states = await businessStateservice.readByQuery({
          fields: ["*", "next_activities.activity.*"],
          filter: {
            business: {
              _in: businesses.map((dt: any) => dt.id).filter((dt: any) => dt)
            },
          }
        });

        data = businesses.map((dt: any) => {
          let activityCount: number = 0;
          let activityComplete: number = 0;
          const [plant] = plants.filter((plant: any) => plant.id == dt.plant);
          if (dt.entity && dt.entity != '') {
            const [collection] = collections.filter((collection: any) => collection.entityName == dt.entity?.name);
            activityCount = collection ? dt.activities.length * Number(collection.dataLength) : 0;
            activityComplete = dt.activities.reduce((acc: any, activity: any) => {
              if (activity.frequency) {
                states.filter((state: any) => state.business === dt.id && state.activity == activity.id && state.frequency === state.counter && state.is_complete).map((state: any) => {
                  acc += 1;
                  return state;
                });
              } else {
                states.filter((state: any) => state.business === dt.id && state.activity === activity.id && state.is_complete).map((state: any) => {
                  acc += 1;
                  return state;
                });
              }
              return acc;
            }, 0);
          } else {
            activityCount = dt.activities.length;
            activityComplete = dt.activities.reduce((acc: any, activity: any) => {
              if (activity.frequency) {
                const [findState] = states.filter((state: any) => state.businessId === dt.id && state.activity === activity.id && state.frequency === state.counter && state.is_complete)
                acc += findState ? 1 : 0;
              } else {
                const [findState] = states.filter((state: any) => state.businessId === dt.id && state.activity === activity.id && state.is_complete)
                acc += findState ? 1 : 0;
              }
              return acc;
            }, 0);
          }
          
          return {
            id: dt._id,
            plantId: dt.plantId,
            name: dt.name,
            type: dt.type,
            periodType: dt.periodType,
            plant: plant ? {
              id: plant.id,
              name: plant.name
            } : null,
            activityCount,
            progress: activityCount > 0 ? Math.floor((activityComplete / activityCount) * 100) : 0
          }
        });
      }

      return {
        success,
        message,
        data,
        meta,
      };
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message);
    }
  }

  @Get(
    { path: "/activity", tag: "Report" },
    {
      responses: [
        {
          200: {
            description: "Response get array of object report",
            responseType: "array",
            schema: "Report",
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "business",
          schema: { type: "number" },
          required: true,
        },
        {
          in: "query",
          name: "filter_by",
          schema: { enum: ['name'], type: "string" },
          required: false,
        },
        {
          in: "query",
          name: "search",
          schema: { type: "string" },
          required: false,
        },
        {
          in: "query",
          name: "pagination",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "limit",
          schema: { type: "number" },
          required: false,
        },
      ],
    }
  )
  async getReportsActivity(
    @Req() req: any,
    @Res() res: any,
    @Context() context: any,
    @Query("business") business: number,
    @Query("filter_by") filter_by: string,
    @Query("search") search: string,
    @Query("pagination") pagination: number,
    @Query("limit") limit: number,
  ) {
    const {
      services: { ItemsService, MetaService },
      exceptions: { ServiceUnavailableException },
    } = context;

    const businesservice = new ItemsService("Businesses", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const businessStateservice = new ItemsService("business_states", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const activityService = new ItemsService("activities", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const metaService = new MetaService({
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      let success = true;
      let message = 'Successfully Get Data';

      const filter: any = {
        business: {
          _eq: business,
        },
      };

      if (filter_by && search) filter[filter_by] = { _contains: search };

      const sanitizedQuery = {
        fields: ["*", "flows.flow.*", "flows.flow.forms.form.*", "dependencies.*", "plant.*", "company.*", "department.*"],
        filter,
        limit,
        offset: 1,
        page: pagination,
        meta: ['count','total_page','current_page','limit'],
      };

      let data = await activityService.readByQuery(sanitizedQuery);
      const meta = await metaService.getMetaForQuery("activities", sanitizedQuery);

      if (data.length > 0) {
        let collections: any = [];
        const businessData = await businesservice.readOne(+business);

        if (businessData && businessData.entity?.name) {
          const dynamicService = new ItemsService(businessData.entity?.name.toLowerCase(), {
            schema: req.schema,
            accountability: req.accountability,
          });
          
          const dynamicDatas = await dynamicService.readByQuery({
            filter: {
              company: {
                _eq: businessData.company,
              },
              plant: {
                _eq: businessData.plant,
              },
            },
          });

          collections.push({ entity: businessData.entity?.id, data: dynamicDatas });
        }

        const states = await businessStateservice.readByQuery({
          fields: ["*", "next_activities.activity.*"],
          filter: {
            business: {
              _eq: business,
            },
            is_active: {
              _eq: true,
            },
          },
        });

        data = data.map((dt: any) => {
          const { frequency } = dt;
  
          if (businessData.entity) {
            let entities: any = [];
            const filterStates = states.filter((state: any) => state.activity === dt.id);
            const totalFlow: number = collections.length > 0 ? collections[0].data.length * dt.flows.length : 0;
            const totalForm: number = collections.length > 0 ? collections[0].data.length * dt.flows.reduce((acc: any, flow: any) => {
              const { forms } = flow.flow;
              acc += forms.reduce((accForm: any, form: any) => {
                const { period } = form.form;
                // * Diskusi ini proses apa
                if (period && period.times) {
                  accForm += Number(period.times);
                } else {
                  accForm += 1;
                }
                return accForm;
              }, 0);
              return acc;
            }, 0) : 0;
            for (const state of filterStates) {
              const [findCollection] = collections.filter(
                (item: any) => item.entity == state.entity,
              );
      
              const [entityDetail] = findCollection
                ? findCollection.data.filter((obj: any) => obj.id == state.entity_ref)
                : [];
              
              const summaryState = {
                flowCount: state.flows.filter((flow: any) => flow.isComplete).length,
                formCount: state.flows.reduce((acc: any, flow: any) => {
                  acc += flow.forms.reduce((accForm: any, form: any) => {
                    accForm += form.inputCount;
                    return accForm;
                  }, 0);
                  return acc;
                }, 0)
              }
              let progress = 0;
              if (frequency) {
                const { counter } = state;
                progress =
                  totalForm != 0
                    ? ((counter - 1) * totalForm + summaryState.formCount) /
                      (totalForm * frequency)
                    : 0;
                progress = Math.floor(progress * 100);
              } else if (!frequency) {
                progress = totalForm != 0 ? summaryState.formCount / totalForm : 0;
                progress = Math.floor(progress * 100);
              }
  
              entities.push({
                id: entityDetail ? entityDetail.id : null,
                name: entityDetail ? entityDetail.name : '',
                nextActivities: state.nextActivities.map((na: any) => {
                  return {
                    id: na.activity.id,
                    name: na.activity.name,
                  };
                }),
                summary: {
                  flowCount: summaryState.flowCount,
                  totalFlow,
                  formCount: summaryState.formCount,
                  totalForm,
                },
                progress,
              });
            }
  
            if (filterStates <= 0) {
              const [findCollection] = collections.filter(
                (item: any) => item.entity == businessData.entity,
              );
              const items = findCollection ? findCollection.data : [];
              for (const item of items) {
                entities.push({
                  id: item.id,
                  name:item.name,
                  nextActivities: data
                  .filter((activity: any) => {
                    const [dependency] = activity.dependencies.filter(
                      (dependency: any) => dependency.id == dt.id,
                    );
                    return dependency ? true : false;
                  })
                  .map((activity: any) => {
                    return {
                      id: activity.id,
                      name: activity.name
                    }
                  }),
                  summary: {
                    flowCount: 0,
                    totalFlow,
                    formCount: 0,
                    totalForm,
                  },
                  progress: 0,
                });
              }
            }
  
            return {
              id: dt._id,
              company_id: dt.company.id,
              plant_id: dt.plant.id,
              department_id: dt.department_id,
              department: {
                id: dt.department.id,
                name: dt.department.name
              },
              name: dt.name,
              frequency,
              entities,
            }
          } else {
            const totalFlow: number = dt.flows.length;
            const totalForm: number = dt.flows.reduce((acc: any, flow: any) => {
              const { forms } = flow.flow;
              acc += forms.reduce((accForm: any, form: any) => {
                const { period } = form.form;
                if (period && period.times) {
                  accForm += Number(period.times);
                } else {
                  accForm += 1;
                }
                return accForm;
              }, 0);
              return acc;
            }, 0);
            const [findState] = states.filter(
              (state: any) =>
                state.activity == dt.id
            );
            const summaryState = findState
              ? {
                  flowCount: findState.flows.filter((flow: any) => flow.isComplete)
                    .length,
                  formCount: findState.flows.reduce((acc: any, flow: any) => {
                    acc += flow.flow.forms.reduce((accForm: any, form: any) => {
                      // * Coba Diskusi Lagi
                      accForm += form.form?.inputCount ?? 0;
                      return accForm;
                    }, 0);
                    return acc;
                  }, 0),
                }
              : {
                  flowCount: 0,
                  formCount: 0,
                };
            
            let progress = 0;
    
            if (frequency && findState) {
              const { counter } = findState;
              progress =
                totalForm > 0
                  ? ((counter - 1) * totalForm + summaryState.formCount) /
                    (totalForm * frequency)
                  : 0;
              progress = Math.floor(progress * 100);
            } else if (!frequency && findState) {
              progress = totalForm > 0 ? summaryState.formCount / totalForm : 0;
              progress = Math.floor(progress * 100);
            }
            return {
              id: dt._id,
              companyId: dt.companyId,
              plantId: dt.plantId,
              departmentId: dt.departmentId,
              department: {
                id: dt.department.id,
                name: dt.department.name
              },
              name: dt.name,
              frequency,
              entities: [],
              nextActivities: findState ? findState.nextActivities.map((na: any) => {
                return {
                  id: na.id,
                  name: na.name,
                };
              }) : [],
              summary: {
                flowCount: summaryState.flowCount,
                totalFlow,
                formCount: summaryState.formCount,
                totalForm,
              },
              progress,
            }
          }
        })
      }

      return {
        success,
        message,
        data,
        meta,
      };
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message);
    }
  }

  @Get(
    { path: "/action", tag: "Report" },
    {
      responses: [
        {
          200: {
            description: "Response get array of object report",
            responseType: "array",
            schema: "Report",
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "plant",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "tier",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "sub_tier",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "created_from",
          schema: { type: "string" },
          required: false,
          description: 'YYYY-MM-DD HH:mm:ss',
        },
        {
          in: "query",
          name: "created_to",
          schema: { type: "string" },
          required: false,
          description: 'YYYY-MM-DD HH:mm:ss',
        },
        {
          in: "query",
          name: "due_from",
          schema: { type: "string" },
          required: false,
          description: 'YYYY-MM-DD HH:mm:ss',
        },
        {
          in: "query",
          name: "due_to",
          schema: { type: "string" },
          required: false,
          description: 'YYYY-MM-DD HH:mm:ss',
        },
      ],
    }
  )
  async getReportsAction(
    @Req() req: any,
    @Res() res: any,
    @Context() context: any,
    @Query("plant") plant: number,
    @Query("tier") tier: number,
    @Query("sub_tier") sub_tier: number,
    @Query("created_from") created_from: string,
    @Query("created_to") created_to: string,
    @Query("due_from") due_from: string,
    @Query("due_to") due_to: string,
  ) {
    const {
      services: { ItemsService, MetaService },
      exceptions: { ServiceUnavailableException },
    } = context;

    const businesservice = new ItemsService("Businesses", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const businessStateservice = new ItemsService("business_states", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const activityService = new ItemsService("activities", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const actionService = new ItemsService("actions", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const statusService = new ItemsService("statuses", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const variableService = new ItemsService("variables", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const metaService = new MetaService({
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      let success = true;
      let message = 'Successfully Get Data';

      const filter: any = {};

      if (plant) filter.plant = { _eq: plant };
      if (tier) filter.tier = { _eq: tier };
      if (sub_tier) filter.sub_tier = { _eq: sub_tier };
      if (created_from && created_to) filter.created_at = { _between: [created_from, created_to] };
      if (due_from && due_to) filter.due_date = { _between: [due_from, due_to] };

      const sanitizedQuery = {
        fields: ["*", "parent.*", "zone.*", "zone.line.*", "zone.sector.*", "zone.process.*", "zone.machine.*"],
        filter,
      };

      let actions = await actionService.readByQuery(sanitizedQuery);

      let data: any = {
        statuses: [],
        priorities: [],
        parameters: [],
        zones: [],
        avgEscalate: 0,
        avgClosed: 0,
        overdue: 0
      };

      if (actions.length > 0) {
        const now = new Date();
        const statuses = await statusService.readByQuery({
          filter: {
            category: {
              _eq: 'ACTION',
            },
            is_active: {
              _eq: true,
            },
          },
        });

        const variables = await variableService.readByQuery({
          filter: {
            id: {
              _in: actions.map((action: any) => action.variable)
            },
          },
        });

        const [escalateStatus] = statuses.filter((status: any) => status.code == 'ESCAL');
        const [closedStatus] = statuses.filter((status: any) => status.code == 'CLOSE');

        data.statuses = statuses.map((status: any) => {
          const count = actions.filter(
            (dt: any) => status.id === dt.status,
          ).length;
          return {
            id: status.id,
            code: status.code,
            name: status.name,
            count,
          };
        });

        data.priorities = actions.sort((a: any, b: any) => a.priority - b.priority).reduce((acc: any, action: any) => {
          if (acc.length <= 0) {
            acc.push({
              priority: action.priority,
              count: 1
            });
          } else {
            const index = acc.findIndex((item: any) => item.priority == action.priority);
            if (index < 0) {
              acc.push({
                priority: action.priority,
                count: 1
              });
            } else {
              acc[index].count++;
            }
          }
          return acc;
        }, []);

        data.avgEscalate = actions.filter((action: any) => action.parent).reduce((acc: any, action: any, index: any, arr: any) => {
          const { parent } = action;
          parent ? acc += ((action.created_at - parent.created_at) / arr.length) : null;
          return acc;
        }, 0);

        data.avgClosed = actions.filter((action: any) => closedStatus && action.status === closedStatus.id)
        .reduce((acc: any, action: any, index: any, arr: any) => {
          acc += ((action.updated_at - action.created_at) / arr.length);
          return acc;
        }, 0);

        data.overdue = actions.filter((action: any) => escalateStatus && closedStatus && action.status !== escalateStatus.id && action.status !== closedStatus.id)
        .reduce((acc: any, action: any) => {
          now > action.dueDate ? acc++ : null; 
          return acc;
        }, 0);

        data.parameters = actions.sort((a: any, b: any) => a.variable - b.variable).reduce((acc: any, action: any) => {
          if (acc.length <= 0) {
            acc.push({
              id: action.variable,
              count: 1
            });
          } else {
            const index = acc.findIndex((item: any) => item.id == action.variable);
            if (index < 0) {
              acc.push({
                id: action.variable,
                count: 1
              });
            } else {
              acc[index].count++;
            }
          }
          return acc;
        }, []);

        if (data.parameters.length > 0) {
          data.parameters = data.parameters.map((parameter: any) => {
            const [variable] = variables.filter((variable: any) => variable.id === parameter.id);
            return {
              id: parameter.id,
              name: variable ? variable.name : '',
              count: parameter.count
            }
          })
        }

        data.zones = actions.reduce((acc: any, action: any) => {
          const { zone } = action;
          const { type } = zone;

          if (zone && acc.length <= 0) {
            acc.push({
              type,
              entities: [{ id: zone[type.toLowerCase()]?.id ?? null, name: zone[type.toLowerCase()]?.name ?? null, count: 1 }]
            });
          } else if (zone) {
            const index = acc.findIndex((item: any) => item.type === type);
            if (index < 0) {
              acc.push({
                type,
                entities: [{ id: zone[type.toLowerCase()]?.id ?? null, name: zone[type.toLowerCase()]?.name ?? null, count: 1 }]
              });
            } else {
              const indexEntities = acc[index].entities.findIndex((obj: any) => obj.id === zone[type.toLowerCase()]?.id ?? null);
              if (indexEntities < 0) {
                acc[index].entities.push({
                  id: zone[type.toLowerCase()]?.id ?? null,
                  name: zone[type.toLowerCase()]?.name ?? null,
                  count: 1
                })
              } else {
                acc[index].entities[indexEntities].count++;
              }
            }
          }
          return acc;
        }, []);
      }

      return {
        success,
        message,
        data,
      };
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message);
    }
  }
}
