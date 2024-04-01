import { Body, Context, Endpoint, Get, Param, Patch, Req, Res } from "@mv-data-core/decorator";
import { RequestBody } from "./interfaces";

@Endpoint("privileges")
export default class DefineEndpoint {
  @Patch(
    { path: "/bulk", tag: "Privilege" },
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
                }
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          product_id: {
            type: "number",
          },
          product_code: {
            type: "string",
          },
          role_id: {
            type: "number",
          },
          user_ids: {
            type: "array",
            items: {
              type: "string",
            },
          },
        }
      }
    }
  )
  async bulkAssign(@Req() req: any, @Context() ctx: any, @Body() body: RequestBody) {
    const { product_code, role_id, user_ids } = body;

    let { product_id } = body;

    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException },
    } = ctx;
    const privilegeService = new ItemsService("Privileges", {
      schema: req.schema,
      accountability: req.accountability,
    });

    if (!product_id) {
      if (!product_code) throw new InvalidPayloadException("product_id or product_code is required");
      const productService = new ItemsService("products", {
        schema: req.schema,
        accountability: req.accountability,
      });
      const [product] = await productService.readByQuery({
        filter: {
          code: {
            _eq: product_code,
          },
        },
      });

      if (!product) throw new InvalidPayloadException("product not found");
      product_id = product.id;
    }

    if (!Array.isArray(user_ids)) throw new InvalidPayloadException("user_ids must be an array");

    const currentPrivileges: { id: number; product: number; role: number; user: string }[] = await privilegeService.readByQuery({
      filter: {
        product: {
          _eq: product_id,
        },
        role: {
          _eq: role_id,
        },
      },
    });

    const currentUserIds = currentPrivileges.map((x) => x.user);
    const deletedIds: number[] = [];
    const addPromises: Promise<any>[] = [];

    for (const { id, user: userId } of currentPrivileges) {
      if (!user_ids.includes(userId)) deletedIds.push(id);
    }

    await privilegeService.deleteMany(deletedIds)

    for (const userId of user_ids) {
      if (!currentUserIds.includes(userId)) {
        addPromises.push(
          privilegeService.createOne({
            product: product_id,
            role: role_id,
            user: userId,
          })
        );
      }
    }

    await Promise.all(addPromises)

    return {
      success: true,
      message: "Create some privileges successfully",
    };
  }
}
