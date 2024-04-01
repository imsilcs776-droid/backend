import { Body, Context, Endpoint, Get, Param, Patch, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint("approvers")
export default class DefineEndpoint {
  @Get(
    { path: "", tag: "Approvers" },
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
      ],
    }
  )
  async findAll(
    @Req() req: any,
    @Query("limit") limit: number,
    @Query("offset") offset: number,
    @Query("page") page: number,
    @Context() ctx: any
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = ctx;
    const approverService = new ItemsService("approvers", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const approvalService = new ItemsService("approvals", {
      schema: req.schema,
      accountability: req.accountability,
    });

    let meta = {
      count: 0,
      limit: limit,
      current_page: page,
      total_page: 0,
    };

    const approvers = await approverService.readByQuery({
      fields: ["*"],
      limit: limit || undefined,
      offset: offset || undefined,
      page: page || undefined,
    });
    const approvals: { approvers: { approver_id: number; users: string[] }[] }[] = await approvalService.readByQuery({
      fields: ["*"],
    });
    const counter: { [id: string]: number } = {};

    for (const approval of approvals) {
      const { approvers: approverList } = approval;
      for (const approver of approverList) {
        const { approver_id } = approver;
        if (counter[approver_id.toString()]) {
          counter[approver_id.toString()]++;
        } else {
          counter[approver_id.toString()] = 1;
        }
      }
    }
    const approverCount = await approverService.readByQuery({
      aggregate: {
        count: ["id"],
      },
    });

    meta.count = approverCount[0].count.id;
    meta.total_page = Math.ceil(meta.count / meta.limit);

    return {
      success: true,
      message: "Successfully retrieved approvers",
      data: approvers.map((approver: any) => {
        return {
          id: approver.id,
          name: approver.name,
          num_of_usage: counter[approver.id.toString()] || 0,
        };
      }),
      meta,
    };
  }
}
