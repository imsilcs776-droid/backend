import { Context, Endpoint, Get, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint("entities")
export default class DefineEndpoint {
  @Get(
    { path: "", tag: "Entities" },
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
                  type: "boolean",
                },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "number",
                      },
                      name: {
                        type: "string",
                      },
                      code: {
                        type: "string",
                      },
                      count: {
                        type: "number",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "companyId",
          schema: {
            type: "number",
          },
        },
        {
          in: "query",
          name: "plantId",
          schema: {
            type: "number",
          },
        },
      ],
    }
  )
  async getAll(@Req() req: any, @Context() ctx: any, @Query("companyId") companyId: number, @Query("plantId") plantId: number) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = ctx;
    const entityService = new ItemsService("entities", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const entities: { name: string; code: string; count: number }[] = await entityService.readByQuery({
      fields: ["*"],
    });

    for (let i = 0; i < entities.length; i++) {
      const { name } = entities[i];
      let count = 0;
      try {
        const itemService = new ItemsService(name.toLowerCase(), {
          schema: req.schema,
          accountability: req.accountability,
        });

        const filter: {
          [fieldName: string]: {
            _eq: number;
          };
        } = {};

        if (companyId) filter.company = { _eq: companyId };
        if (plantId) filter.plant = { _eq: plantId };

        const itemCount = await itemService.readByQuery({
          aggregate: {
            count: ["id"],
          },
          filter,
        });

        count = itemCount[0].count.id;
      } catch (_e) {}

      entities[i].count = count;
    }

    return {
      success: true,
      data: entities,
    };
  }
}
