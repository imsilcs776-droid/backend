import { Body, Context, Endpoint, Param, Patch, Req } from "@mv-data-core/decorator";

@Endpoint('flows')
export default class DefineEndpoint {
  @Patch(
    { path: "/bulk", tag: "Flow" },
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
      request: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "number",
            },
            business: {
              type: "number",
            },
            activity: {
              type: "number",
            },
            dependencies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: 'number',
                  },
                }
              },
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
    const flowMapsService = new ItemsService("flow_maps", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const flowMaps = await flowMapsService.readByQuery({
      fields: ["*"],
      filter: {
        flow: {
          _in: bodies.map((body: any) => body.id),
        },
      },
    });

    if (bodies instanceof Array) {
      for (const body of bodies) {
        const { id, business, activity, dependencies } = body;

        const [flowMap] = flowMaps.filter(
          (dt: any) =>
            dt.flow == id &&
            dt.business == business &&
            dt.activity == activity,
        );

        if (flowMap) {
          const { data } = flowMap;
          await flowMapsService.updateOne(flowMap.id, {
            data: {
              ...data,
              dependencies
            },
          });
        } else {
          await flowMapsService.createOne({
            business,
            activity,
            flow: id,
            data: { dependencies },
          });
        }
      }
      return {
        success: true,
        message: 'Patching flows successfully.',
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
