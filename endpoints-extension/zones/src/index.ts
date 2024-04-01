import { Body, Context, Endpoint, Get, Param, Patch, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint("zones")
export default class DefineEndpoint {
  @Get(
    { path: "", tag: "Zone" },
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
          name: "companyId",
          schema: {
            type: "number",
          },
          required: true,
        },
        {
          in: "query",
          name: "plantId",
          schema: {
            type: "number",
          },
          required: true,
        },
        {
          in: "query",
          name: "lineId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "sectorId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "processId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "machineId",
          schema: {
            type: "number",
          },
          required: false,
        },
        {
          in: "query",
          name: "type",
          schema: {
            type: "string",
            enum: ["SECTOR", "LINE", "PROCESS", "MACHINE"],
          },
          required: true,
        },
        {
          in: "query",
          name: "hasMap",
          schema: {
            type: "string",
            enum: ["true", "false"],
          },
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "number",
          },
        },
        {
          in: "query",
          name: "offset",
          schema: {
            type: "number",
          },
        },
        {
          in: "query",
          name: "page",
          schema: {
            type: "number",
          },
        },
      ],
    }
  )
  async getZones(
    @Context() context: any,
    @Req() req: any,
    @Query("type") type: string,
    @Query("hasMap") hasMap: boolean,
    @Query("limit") limit: number,
    @Query("offset") offset: number,
    @Query("page") page: number,
    @Query("companyId") companyId: number,
    @Query("plantId") plantId: number,
    @Query("lineId") lineId: number,
    @Query("sectorId") sectorId: number,
    @Query("processId") processId: number,
    @Query("machineId") machineId: number
  ) {
    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException },
    } = context;
    const zoneService = new ItemsService("Zones", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const zones = await zoneService.readByQuery({
      fields: ["*", "positions.*"],
    });
    let datas = [];
    const TYPES = ["SECTOR", "LINE", "PROCESS", "MACHINE"];
    const typeMaps: { [key: string]: string } = {
      SECTOR: "sectors",
      LINE: "lines",
      PROCESS: "processes",
      MACHINE: "machines",
    };
    if (TYPES.includes(type.toUpperCase())) {
      const filter: {
        [key: string]: {
          _eq: number;
        };
      } = {
        company: {
          _eq: companyId,
        },
        plant: {
          _eq: plantId,
        }
      }
      if (lineId) filter.line = { _eq: lineId };
      if (sectorId) filter.sector = { _eq: sectorId };
      if (processId) filter.process = { _eq: processId };
      if (machineId) filter.machine = { _eq: machineId };
      const entityName = type.toLowerCase();
      const zoneMap: { [id: number]: any } = {};
      for (const zone of zones) {
        const { [entityName]: entity, 'type': entityType } = zone;
        if (entity && entityType.toLowerCase() === entityName) zoneMap[entity] = zone;
      }
      const service = new ItemsService(typeMaps[type.toUpperCase()], {
        schema: req.schema,
        // accountability: req.accountability,
      });
      datas = await service.readByQuery({
        fields: [
          "id",
          "name",
          "company.id",
          "company.name",
          "plant.id",
          "plant.name",
          "sector.id",
          "sector.name",
          "line.id",
          "line.name",
          "process.id",
          "process.name",
        ],
        filter,
        limit: limit || undefined,
        offset: offset || undefined,
        page: page || undefined,
      });
      const resCount = await service.readByQuery({
        fields: ["*"],
        filter,
        aggregate: {
          count: ["id"],
        },
      });
      const count = resCount[0].count.id;
      const meta = {
        count,
        current_page: page,
        limit,
        total_page: Math.ceil(count / limit),
      }
      let mapped = [];
      if (hasMap) {
        for (const data of datas) {
          const zone = zoneMap[data.id];
          if (zone) {
            const { id, positions } = zone;
            data.zone = {
              id,
              positions: positions.map((pos: any) => pos.positions_id),
            };
            mapped.push(data);
          }
        }
      } else {
        mapped = datas.map((data: any) => {
          const zone = zoneMap[data.id];
          if (zone) {
            const { id, positions } = zone;
            data.zone = {
              id,
              positions: positions.map((pos: any) => pos.positions_id),
            };
          } else {
            data.zone = null;
          }
          return data;
        });
      }
      return {
        success: true,
        data: mapped,
        meta
      };
    } else {
      throw new InvalidPayloadException("Type not found");
    }
  }
}
