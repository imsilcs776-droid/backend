import { Body, Context, Endpoint, Get, Param, Patch, Req, Res } from "@mv-data-core/decorator";

@Endpoint('clusters')
export default class DefineEndpoint {
  @Patch(
    { path: "/bulk", tag: "Cluster" },
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
      request: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "number",
            },
            code: {
              type: "string",
            },
            name: {
              type: "string",
            },
            is_active: {
              type: "boolean",
            },
            pages: {
              type: "array",
              items: {
                type: "number",
              },
            },
            cluster: {
              type: "number",
            },
            is_collapse: {
              type: "boolean",
            },
            order: {
              type: "number",
            },
          },
        }
      },
    }
  )
  async bulkUpdate(@Req() req: any, @Context() ctx: any, @Body() bodies: any) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    const clustersService = new ItemsService("clusters", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const clusters = await clustersService.readByQuery({
      fields: ["*"],
    });

    if (bodies instanceof Array) {
      for (const body of bodies) {
        const { id, code, name, is_active, pages, cluster, is_collapse, order } = body;

        const clusterData = clusters.find(
          (dt: any) =>
            dt.id == id
        );

        if (clusterData) {
          await clustersService.updateOne(clusterData.id, {
            code,
            name,
            is_active,
            pages,
            cluster,
            is_collapse,
            order
          });
        } else {
          await clustersService.createOne({
            code,
            name,
            is_active,
            pages,
            cluster,
            is_collapse,
            order
          });
        }
      }
      return {
        success: true,
        message: 'Patching clusters successfully.',
        data: null,
      };
    } else {
      return {
        success: false,
        message: 'Wrong format.',
        data: null,
      };
    }
  }
}
