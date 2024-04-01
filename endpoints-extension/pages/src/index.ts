import { Body, Context, Endpoint, Get, Param, Patch, Req, Res } from "@mv-data-core/decorator";

@Endpoint('pages')
export default class DefineEndpoint {
  @Patch(
    { path: "/bulk", tag: "Page" },
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
            description: {
              type: "string",
            },
            icon: {
              type: "string",
            },
            url: {
              type: "string",
            },
            parent: {
              type: "number",
            },
            module: {
              type: "number",
            },
            cluster: {
              type: "number",
            },
            childrens: {
              type: "number",
            },
            is_collapse: {
              type: "boolean",
            },
            type: {
              type: "string",
            },
            status: {
              type: "boolean",
            },
            platform: {
              type: "array",
              items: {
                type: "string",
              },
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

    const pagesService = new ItemsService("pages", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const pages = await pagesService.readByQuery({
      fields: ["*"],
    });

    if (bodies instanceof Array) {
      for (const body of bodies) {
        const { id, code, name, description, icon, url, parent, module, cluster, childrens, is_collapse, type, status, platform, order } = body;

        const page = pages.find(
          (dt: any) =>
            dt.id == id
        );

        if (page) {
          await pagesService.updateOne(page.id, {
            code, name, description, icon, url, parent, module, cluster, childrens, is_collapse, type, status, platform, order
          });
        } else {
          await pagesService.createOne({
            code, name, description, icon, url, parent, module, cluster, childrens, is_collapse, type, status, platform, order
          });
        }
      }
      return {
        success: true,
        message: 'Patching pages successfully.',
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
