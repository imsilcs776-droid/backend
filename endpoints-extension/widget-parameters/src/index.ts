import { Context, Endpoint, Get, Query, Req } from "@mv-data-core/decorator";

@Endpoint('widget_parameters')
export default class DefineEndpoint {
  @Get(
    { path: "", tag: "Widget Parameters" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                msg: {
                  type: "string"
                }
              }
            },
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "plantId",
          schema: {
            type: "number"
          }
        },
        {
          in: "query",
          name: "companyId",
          schema: {
            type: "number"
          }
        },
        {
          in: "query",
          name: "tierId",
          schema: {
            type: "number"
          }
        },
        {
          in: "query",
          name: "subTierId",
          schema: {
            type: "number"
          }
        },
        {
          in: "query",
          name: "page",
          schema: {
            type: "number"
          }
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "number"
          }
        },
      ]
    },
  )
  async getAll(
    @Req() req: any,
    @Context() ctx: any,
    @Query('plantId') plantId: number,
    @Query('companyId') companyId: number,
    @Query('tierId') tierId: number,
    @Query('subTierId') subTierId: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException },
    } = ctx;
    const widgetParameterService = new ItemsService("widget_parameters", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const viewService = new ItemsService("views", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const viewFilter: {
      plant?: {
        _eq: number
      },
      company?: {
        _eq: number
      },
      tier?: {
        _eq: number
      },
      sub_tier?: {
        _eq: number
      }
    } = {}

    if (plantId) viewFilter.plant = { _eq: plantId }
    if (companyId) viewFilter.company = { _eq: companyId }
    if (tierId) viewFilter.tier = { _eq: tierId }
    if (subTierId) viewFilter.sub_tier = { _eq: subTierId }

    const views = await viewService.readByQuery({
      filter: viewFilter
    })

    const dashboardIds = views.map((view: {dashboard: number}) => view.dashboard)

    const widgetParameters = await widgetParameterService.readByQuery({
      filter: {
        dashboard: {
          _in: dashboardIds
        }
      },
      limit: limit || undefined,
      page: page || undefined,
    })

    const widgetParameterCount = await widgetParameterService.readByQuery({
      fields: ["*"],
      aggregate: {
        count: ["id"],
      },
      filter: {
        dashboard: {
          _in: dashboardIds
        }
      }
    });

    let meta = {
      count: 0,
      limit: limit,
      current_page: page,
      total_page: 0,
    };

    meta.count = widgetParameterCount[0].count.id;
    meta.total_page = Math.ceil(meta.count / meta.limit);

    return {
      success: true,
      message: "Successfully get widget parameter list",
      data: widgetParameters,
      meta
    }
  }
}
