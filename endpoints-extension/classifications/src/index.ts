import { Body, Context, Endpoint, Get, Param, Patch, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint('classifications')
export default class DefineEndpoint {
  @Get(
    { path: "/", tag: "Classification" },
    {
      responses: [
        {
          200: {
            description: "Response get array of object classification",
            responseType: "array",
            schema: "Classification",
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
          name: "activity",
          schema: { type: "number" },
          required: true,
        },
        {
          in: "query",
          name: "type",
          required: true,
          schema: {
            type: "string",
            enum: ["SECTOR", "LINE", "PROCESS", "MACHINE"],
          },
        },
        // {
        //   in: "query",
        //   name: "filter_by",
        //   schema: { type: "string" },
        //   required: false,
        // },
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
  async getClassifications(
    @Req() req: any,
    @Res() res: any,
    @Context() context: any,
    @Query("business") business: number,
    @Query("activity") activity: number,
    @Query("type") type: string,
    // @Query("filter_by") filter_by: string,
    @Query("search") search: string,
    @Query("pagination") pagination: number,
    @Query("limit") limit: number,
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = context;

    const entityService = new ItemsService("entities", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const formService = new ItemsService("forms", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const activityService = new ItemsService("activities", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const classificationService = new ItemsService("classifications", {
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      let success = true;
      let message = '';
      let data: any = [];
      let meta = {
        count: 0,
        limit: limit ?? null,
        current_page: pagination ?? null,
        total_page: 0,
      };
      const forms: any = [];

      const filter: {
        business?: {
          _eq: number
        },
        activity?: {
          _eq: number
        },
        type?: {
          _eq: string
        },
      } = {};

      if (business) filter.business = { _eq: business };
      if (activity) filter.activity = { _eq: activity };
      if (type) filter.type = { _eq: type };

      const activities = await activityService.readByQuery({
        // fields: ["*.*"],
        fields: ["*", "flows.flow.*", "flows.flow.forms.*"],
        filter: {
          id: {
            _eq: activity,
          }
        }
      });

      // return activities;

      const formIds = activities
      .map((act: any) => {
        return act.flows
          .reduce((acc: any, item: any) => {
            acc.push(item.flow.forms.map((form: any) => form.form));
            return acc;
          }, [])
          .flat(1);
      })
      .flat(1);

      for (const formId of formIds) {
        const form = await formService.readOne(formId, {
          fields: ["*.*"],
        });
        form ? forms.push(form) : null;
      }

      const classifications = await classificationService.readByQuery({
        fields: ["*", "business.*", "activity.*"],
      });

      const [entity] = await entityService.readByQuery({
        fields: ["*"],
        filter: {
          code: {
            _eq: type.toUpperCase()
          },
        },
      });

      if (!entity) throw new ServiceUnavailableException("Entity Data Not Found!");

      const dynamicService = new ItemsService(entity.name.toLowerCase(), {
        schema: req.schema,
        accountability: req.accountability,
      });

      if (forms && forms.length > 0) {
        const [{ company, plant }] = activities;
        const result = await dynamicService.readByQuery({
          fields: ["*"],
          limit: limit,
          offset: 1,
          page: pagination,
          meta: ['count', 'total_page', 'current_page', 'limit'],
          filter: {
            company: {
              _eq: company,
            },
            plant: {
              _eq: plant,
            },
            name: {
              _contains: search,
            }
          },
        });

        const resultCount = await dynamicService.readByQuery({
          aggregate: {
            count: ["id"],
          },
          filter: {
            company: {
              _eq: company,
            },
            plant: {
              _eq: plant,
            },
            name: {
              _contains: search,
            }
          },
        });

        // return result;
        meta.count = resultCount[0].count.id;
        meta.total_page = meta.limit ? Math.ceil(meta.count / meta.limit) : 0;

        message = "Successfully Get Data";
        data = result.map((dt: any) => {
          const formMaps = forms.filter((form: any) => {
            const [field] = form.fields.filter((field: any) => {
              const { isData, filters }: any = field.properties ? field.properties : { isData: true, filters: null };
              return filters && filters.entityName == entity.name && !isData
                ? true
                : false;
            });
            return field ? true : false;
          })
          .map((form: any) => {
            const {
              settings: { id, title, code },
              fields,
            } = form;
            return {
              id,
              code,
              title,
              fields: fields
                .filter((field: any) => {
                  const { properties } = field;
                  return (
                    properties.classifications &&
                    properties.classifications.length > 0
                  );
                })
                .map((field: any) => {
                  const { properties } = field;
                  return {
                    id: field.id,
                    name: field.name,
                    classifications: properties.classifications,
                  };
                }),
            };
          });

          return {
            id: dt.id,
            name: dt.name,
            forms: formMaps,
            classifications: classifications
              .filter(
                (cls: any) => cls.type == type.toUpperCase() && cls.entity == dt.id,
              )
              .map((cls: any) => {
                return {
                  id: cls.id,
                  type: cls.type,
                  entity: cls.entity,
                  customs: cls.customs,
                };
              }),
          };
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
}
