import { Body, Context, Endpoint, Get, Param, Patch, Req, Res } from "@mv-data-core/decorator";

@Endpoint()
export default class DefineEndpoint {
  @Get(
    { path: "/:id", tag: "Approvals" },
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
          required: true,
          schema: {
            type: "number",
          },
        },
      ],
    }
  )
  async detail(@Req() req: any, @Context() ctx: any, @Param("id") id: number) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException, InvalidPayloadException },
    } = ctx;

    const approvalService = new ItemsService("approvals", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const approval: {
      inputters: {
        job: {
          id: number;
          name: string;
        };
        job_id?: number;
        levels: number[] | { id: number; name: string };
      }[];
      approvers: {
        approver_id?: number;
        approver: {
          id: number;
          name: string;
        };
        users: string[];
      }[];
    } = await approvalService.readOne(id);

    if (!approval) throw new InvalidPayloadException("Invalid approval id");

    const levelService = new ItemsService("mt_levels", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const jobService = new ItemsService("mt_jobs", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const levels = await levelService.readByQuery({
      fields: ["*"],
    });

    const jobs = await jobService.readByQuery({
      fields: ["*"],
    });

    const levelMap: { [id: number]: any } = {};
    const jobMap: { [id: number]: any } = {};

    for (const level of levels) {
      levelMap[level.id] = level;
    }

    for (const job of jobs) {
      jobMap[job.id] = job;
    }

    let userIds: string[] = [];
    const approverIds: number[] = [];

    approval.approvers.forEach(({ approver_id, users }) => {
      approverIds.push(approver_id as number);
      userIds = [...userIds, ...users];
    });

    const userService = new ItemsService("directus_users", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const approverService = new ItemsService("approvers", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const users = await userService.readByQuery({
      fields: [
        "id",
        "department.id",
        "department.name",
        "department.code",
        "job.id",
        "job.name",
        "job.code",
        "level.id",
        "level.name",
        "level.code",
        "profile.full_name",
        "profile.photo.*",
        "profile.id_number",
      ],
      filter: {
        id: {
          _in: userIds,
        },
      },
    });

    const approvers = await approverService.readByQuery({
      fields: ["*"],
      filter: {
        id: {
          _in: approverIds,
        },
      },
    });

    const userMap: { [id: string]: any } = {};

    for (const user of users) {
      userMap[user.id] = user;
    }

    const approverMap: { [id: number]: any } = {};

    for (const approver of approvers) {
      approverMap[approver.id] = approver;
    }

    const inputtersMapped = approval.inputters.map((inputter) => {
      const job = jobMap[inputter?.job_id || 0];
      delete inputter.job_id;
      if (job) {
        inputter.job = {
          id: job.id,
          name: job.name,
        };
      } else {
        inputter.job = {
          id: inputter.job_id as unknown as number,
          name: "",
        };
      }
      const levels = (inputter.levels as number[]).map((levelId: number) => {
        const level = levelMap[levelId];
        if (level) {
          return {
            id: level.id,
            name: level.name,
          };
        } else {
          return {
            id: levelId,
            name: "",
          };
        }
      });
      inputter.levels = levels as any[];
      return inputter;
    });

    const approversMapped = approval.approvers.map((approver) => {
      const selectedApprover = approverMap[approver.approver_id || 0];
      if (selectedApprover) {
        approver.approver = {
          id: selectedApprover.id,
          name: selectedApprover.name,
        };
      } else {
        approver.approver = {
          id: approver.approver_id as unknown as number,
          name: "",
        };
      }
      delete approver.approver_id;

      const users = (approver.users as string[]).map((userId: string) => {
        const user = userMap[userId];
        if (user) {
          return {
            id: user.id,
            ...user,
          };
        } else {
          return {
            id: userId,
            name: "",
          };
        }
      });
      approver.users = users;

      return approver;
    });

    approval.inputters = inputtersMapped;
    approval.approvers = approversMapped;

    return {
      success: true,
      data: approval,
    };
  }
}
