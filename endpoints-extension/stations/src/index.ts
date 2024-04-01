import { Body, Context, Endpoint, Get, Param, Patch, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint("stations")
export default class DefineEndpoint {
  @Get(
    { path: "", tag: "Station" },
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
                  type: "string",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "category",
          schema: {
            type: "string",
            enum: ["USER", "DEVICE"],
          },
          required: true,
        },
        {
          in: "query",
          name: "companyId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "plantId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "departmentId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "jobId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "levelId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "page",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "userId",
          schema: {
            type: "string",
          },
          required: false,
        },
        {
          in: "query",
          name: "uniqueDevice",
          schema: {
            type: "string",
          },
          required: false,
        },
      ],
    }
  )
  async getStations(
    @Req() req: any,
    @Context() context: any,
    @Query("category") category: string,
    @Query("companyId") companyId: number,
    @Query("plantId") plantId: number,
    @Query("departmentId") departmentId: number,
    @Query("jobId") jobId: number,
    @Query("levelId") levelId: number,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("userId") userId: string,
    @Query("uniqueDevice") uniqueDevice: string
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = context;
    // const stationService = new ItemsService("stations", {
    //   schema: req.schema,
    //   accountability: req.accountability,
    // });
    // const stations = await stationService.readByQuery({
    //   fields: ["id", "code", "name", "description"],
    // });
    if (category.toUpperCase() == 'USER') {
      const filter: {
        id?: {
          _eq: string;
        };
      } = {};
      if (userId) filter.id = { _eq: userId };
      const userService = new ItemsService("directus_users", {
        schema: req.schema,
        accountability: req.accountability,
      });
      const users = await userService.readByQuery({
        fields: [
          "id",
          "email",
          "first_name",
          "last_name",
          "profile.*",
          "avatar.*",
          "stations.id",
          "stations.position.id",
          "stations.position.name",
          "stations.position.type",
          "stations.position.company.id",
          "stations.position.company.code",
          "stations.position.company.name",
          "stations.position.plant.id",
          "stations.position.plant.code",
          "stations.position.plant.name",
          "stations.position.Zones.Zones_id.sector.id",
          "stations.position.Zones.Zones_id.sector.code",
          "stations.position.Zones.Zones_id.sector.name",
          "stations.position.Zones.Zones_id.line.id",
          "stations.position.Zones.Zones_id.line.code",
          "stations.position.Zones.Zones_id.line.name",
          "stations.position.Zones.Zones_id.process.id",
          "stations.position.Zones.Zones_id.process.code",
          "stations.position.Zones.Zones_id.process.name",
          "stations.position.Zones.Zones_id.machine.id",
          "stations.position.Zones.Zones_id.machine.code",
          "stations.position.Zones.Zones_id.machine.name",
          "stations.position.Zones.Zones_id.id",
          "stations.position.Zones.Zones_id.type",
        ],
        filter
      });
      return {
        success: true,
        data: users,
      };
    } else if (category.toUpperCase() == "DEVICE") {
      const filter: {
        mac_ddress?: {
          _eq: string;
        };
      } = {};
      if (uniqueDevice) filter.mac_ddress = { _eq: uniqueDevice };
      const deviceService = new ItemsService("devices", {
        schema: req.schema,
        accountability: req.accountability,
      });
      const devices = await deviceService.readByQuery({
        fields: [
          "id",
          "code",
          "name",
          "mac_address",
          "stations.id",
          "stations.position.id",
          "stations.position.name",
          "stations.position.type",
          "stations.position.company.id",
          "stations.position.company.code",
          "stations.position.company.name",
          "stations.position.plant.id",
          "stations.position.plant.code",
          "stations.position.plant.name",
          "stations.position.Zones.Zones_id.sector.id",
          "stations.position.Zones.Zones_id.sector.code",
          "stations.position.Zones.Zones_id.sector.name",
          "stations.position.Zones.Zones_id.line.id",
          "stations.position.Zones.Zones_id.line.code",
          "stations.position.Zones.Zones_id.line.name",
          "stations.position.Zones.Zones_id.process.id",
          "stations.position.Zones.Zones_id.process.code",
          "stations.position.Zones.Zones_id.process.name",
          "stations.position.Zones.Zones_id.machine.id",
          "stations.position.Zones.Zones_id.machine.code",
          "stations.position.Zones.Zones_id.machine.name",
          "stations.position.Zones.Zones_id.id",
          "stations.position.Zones.Zones_id.type",
        ],
        filter
      });
      return {
        success: true,
        data: devices
      }
    }
  }
}
