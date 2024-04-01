import { Context, Endpoint, Get, Param, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint('pyramids')
export default class DefineEndpoint {
  @Get(
    { path: "/", tag: "Pyramid" },
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
          name: "plant",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "department",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "filter_by",
          schema: { type: "string" },
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
        {
          in: "query",
          name: "lower_than",
          schema: { type: "string" },
          required: false,
          description: 'YYYY-MM-DD HH:mm:ss'
        },
        {
          in: "query",
          name: "greater_than",
          schema: { type: "string" },
          required: false,
          description: 'YYYY-MM-DD HH:mm:ss'
        },
      ],
    }
  )
  async pyramids(
    @Req() req: any,
    @Res() res: any,
    @Context() ctx: any,
    @Query('plant') plant: number,
    @Query('department') department: number,
    @Query('filter_by') filter_by: string,
    @Query('search') search: string,
    @Query('pagination') pagination: number,
    @Query('limit') limit: number,
    @Query('lower_than') lower_than: string,
    @Query('greater_than') greater_than: string,
  ) {
    const {
      services: { ItemsService, MetaService },
      exceptions: { ServiceUnavailableException },
      env
    } = ctx;

    const {
      ADMIN_ID,
      ADMIN_ROLE,
    } = env;

    const accountability = {
      user: ADMIN_ID,
      role: ADMIN_ROLE,
      admin: true,
      app: true,
      ip: '::1',
      userAgent: 'System/1.0.0',
      share: undefined,
      share_scope: undefined,
      permissions: []
    };

    const eventService = new ItemsService("events", {
      schema: req.schema,
      accountability,
    });

    const pyramidService = new ItemsService("pyramids", {
      schema: req.schema,
      accountability,
    });

    const metaService = new MetaService({
      schema: req.schema,
      accountability,
    });

    try {
      const filter: any = {};
  
      if (filter_by) filter[filter_by] = { _contains: search };
  
      const sanitizedQuery = {
        fields: ["*"],
        filter,
        limit,
        offset: pagination && limit ? 1 : undefined,
        page: pagination,
        meta: ['count','total_page','current_page','limit'],
      };
  
      let pyramids = await pyramidService.readByQuery(sanitizedQuery);
      const meta = await metaService.getMetaForQuery("pyramids", sanitizedQuery);
      let daysWithoutEvent = 0;

      if (pyramids.length > 0) {
        const eventFilter: any = {};

        eventFilter.type = { _eq: "PYRAMID" };
        eventFilter.reference = { _in: pyramids.map((pr: any) => pr.id) };
  
        if (plant) eventFilter.plant = { _eq: plant };
        if (department) eventFilter.department = { _eq: department };
        if (lower_than && greater_than) eventFilter.created_at = { _between: [new Date(lower_than), new Date(greater_than)] };
  
        const events = await eventService.readByQuery({ fields: ["*"], filter: eventFilter });

        pyramids = pyramids.map((py: any) => {
          return {
            id: py.id,
            name: py.name,
            level: py.level,
            color: py.color,
            is_active: py.isActive,
            event_count: events
              .filter((event: any) => event.reference === py.id)
              .reduce((acc: any, event: any) => {
                acc = acc + parseInt(event.total);
                return acc;
              }, 0),
          };
        });
  
        const [event] = await eventService.readByQuery({
          fields: ["*"],
          filter: eventFilter,
          sort: ["-created_at"],
        });
  
        if (event) {
          const now: any = greater_than ? new Date(greater_than) : new Date();
          const latest: any = new Date(event.created_at);
  
          const difference = Math.abs(now - latest);
          daysWithoutEvent = difference / (1000 * 3600 * 24);
        }
      }

      return {
        success: true,
        message: 'Successfully Get Data',
        data: {
          days_without_event: Math.floor(daysWithoutEvent),
          pyramids,
        },
        meta,
      };
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message);
    }
  }

  @Get(
    { path: "/:id", tag: "Pyramid" },
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
                message: {
                  type: "string",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "path",
          name: "id",
          schema: {
            type: "number",
          },
          required: true,
        },
      ],
    }
  )
  async detail(
    @Req() req: any,
    @Res() res: any,
    @Context() ctx: any,
    @Param("id") id: number
  ) {
    const {
      services: { ItemsService, MetaService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    const eventService = new ItemsService("events", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const pyramidService = new ItemsService("pyramids", {
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      let pyramid = await pyramidService.readOne(id);

      if (pyramid) {
        const events = await eventService.readByQuery({
          fields: ["*"],
          filter: {
            type: { _eq: "PYRAMID" },
            reference: { _eq: pyramid.id },
          },
        });
  
        pyramid = {
          ...pyramid,
          event_count: events.reduce((acc: any, event: any) => {
            acc = acc + parseInt(event.total);
            return acc;
          }, 0),
        };
      }

      return {
        success: true,
        message: 'Successfully Get Data',
        data: pyramid,
      };
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message);
    }
  }
}
