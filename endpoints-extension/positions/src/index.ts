import { Body, Context, Endpoint, Get, Param, Patch, Post, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint("positions")
export default class DefineEndpoint {
  @Get(
    { path: "", tag: "Position" },
    {
      responses: [
        {
          200: {
            description: "Response get array of object variable",
            responseType: "array",
            schema: "Variable",
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "companyId",
          schema: { type: "number" },
          required: true,
        },
        {
          in: "query",
          name: "plantId",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "departmentId",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "jobId",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "levelId",
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
          name: "offset",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "page",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "type",
          required: false,
          schema: {
            type: "string",
            enum: ["SECTOR", "LINE", "PROCESS", "MACHINE"],
          },
        },
        {
          in: "query",
          name: "isOutline",
          required: false,
          schema: {
            type: "string",
            enum: ["true", "false"],
          },
        },
      ],
    }
  )
  async getPositions(
    @Req() req: any,
    @Res() res: any,
    @Context() context: any,
    @Query("companyId") companyId: number,
    @Query("plantId") plantId: number,
    @Query("departmentId") departmentId: number,
    @Query("jobId") jobId: number,
    @Query("levelId") levelId: number,
    @Query("limit") limit: number,
    @Query("offset") offset: number,
    @Query("page") page: number,
    @Query("type") type: string,
    @Query("isOutline") isOutline: boolean,
    @Query("search") search: string,
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = context;
    const positionService = new ItemsService("positions", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const levelService = new ItemsService("mt_levels", {
      schema: req.schema,
      accountability: req.accountability,
    });
    let meta = {
      count: 0,
      limit: limit,
      current_page: page,
      total_page: 0,
    };
    try {
      const levels = await levelService.readByQuery({
        fields: ["id", "code", "name", "description"],
      });
      const levelMap: { [id: number]: any } = {};
      for (const level of levels) {
        levelMap[level.id] = level;
      }
      const filter: {
        company?: {
          _eq: number;
        };
        plant?: {
          _eq: number;
        };
        department?: {
          _eq: number;
        };
        job?: {
          _eq: number;
        };
        level?: {
          _eq: number;
        };
        type?: {
          _eq: string;
        };
        deleted_at?: {
          _null: boolean;
        };
        name?: {
          _contains: string;
        };
      } = {};
      filter.deleted_at = { _null: true };
      if (companyId) filter.company = { _eq: companyId };
      if (plantId) filter.plant = { _eq: plantId };
      if (departmentId) filter.department = { _eq: departmentId };
      if (jobId) filter.job = { _eq: jobId };
      if (levelId) filter.level = { _eq: levelId };
      if (type) filter.type = { _eq: type };
      if (search) filter.name = { _contains: search }
      if (isOutline) {
        const positions = await positionService.readByQuery({
          fields: ["*.*"],
          group: ["type", "level"],
          aggregate: {
            count: ["id"],
          },
          limit: limit || undefined,
          offset: offset || undefined,
          page: page || undefined,
          filter,
        });
        const result = positions.map((position: any) => {
          const selectedLevel = levelMap[position.level];
          return {
            type: position.type,
            totalPosition: position.count.id,
            level: selectedLevel || null,
          };
        });
        const positionCount = await positionService.readByQuery({
          fields: ["*"],
          group: ["type", "level"],
          aggregate: {
            count: ["id"],
          },
        });
        meta.count = positionCount.length;
        meta.total_page = Math.ceil(meta.count / meta.limit);
        return {
          success: true,
          data: result,
          meta,
        };
      } else {
        const positions = await positionService.readByQuery({
          fields: ["*", "level.id", "level.code", "level.name", "level.description"],
          limit: limit || undefined,
          offset: offset || undefined,
          page: page || undefined,
          filter,
        });
        const positionCount = await positionService.readByQuery({
          fields: ["*"],
        });
        meta.count = positionCount.length;
        meta.total_page = Math.ceil(meta.count / meta.limit);
        return {
          success: true,
          data: positions,
          meta,
        };
      }
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message);
    }
  }

  @Post(
    { path: "", tag: "Position" },
    {
      responses: [
        {
          200: {
            description: "Response create position",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                message: { type: "string" },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          companyId: {
            type: "number",
          },
          plantId: {
            type: "number",
          },
          departmentId: {
            type: "number",
          },
          jobId: {
            type: "number",
          },
          levelId: {
            type: "number",
          },
          type: {
            type: "string",
          },
          counter: {
            type: "number",
          },
        },
      },
    }
  )
  async createPosition(@Context() context: any, @Req() req: any, @Body() body: any) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = context;
    const {
      companyId,
      plantId,
      departmentId,
      jobId,
      levelId,
      type,
      counter,
    }: {
      companyId: number;
      plantId: number;
      departmentId: number;
      jobId: number;
      levelId: number;
      type: string;
      counter: number;
    } = body;
    const positionService = new ItemsService("positions", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const positionCount = await positionService.readByQuery({
      fields: ["*"],
      aggregate: {
        count: ["id"],
      },
      filter: {
        company: {
          _eq: companyId,
        },
        plant: {
          _eq: plantId,
        },
        department: {
          _eq: departmentId,
        },
        job: {
          _eq: jobId,
        },
        level: {
          _eq: levelId,
        },
        type: {
          _eq: type,
        },
      }
    });
    const total = positionCount[0].count.id;

    const now = new Date();
    for (let index = 1; index <= counter; index++) {
      await positionService.createOne({
        company: companyId,
        plant: plantId,
        department: departmentId,
        job: jobId,
        level: levelId,
        type,
        name: `Pos ${total + index}`,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }
    return {
      success: true,
      message: 'Creating position successfully.',
    };
  }
}
