import { Body, Context, Delete, Endpoint, Get, Param, Patch, Post, Req, Res } from "@mv-data-core/decorator";
import { CronTaskHelper } from "./helpers";
import * as fs from "fs";

@Endpoint('cron-tasks')
export default class DefineEndpoint {
  @Post(
    { path: "/", tag: "CronTask" },
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
                  "type": "string"
                }
              }
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          company: {
            type: "number",
          },
          name: {
            type: "string"
          },
          time: {
            type: "string"
          },
        },
      },
    }
  )
  async create(
    @Req() req: any,
    @Context() context: any,
    @Body() body: any
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
      schedule,
    } = context;

    const cronTaskService = new ItemsService("cron_tasks", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const cronTaskLogService = new ItemsService("cron_task_logs", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const productService = new ItemsService("products", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const companyService = new ItemsService("companies", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const flowService = new ItemsService("flows", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const flowMapService = new ItemsService("flow_maps", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const activityService = new ItemsService("activities", {
      schema: req.schema,
      accountability: req.accountability,
    });
    
    try {
      const { time }: any = body;
      const [hour, minute] = time ? time.split(':') : [];

      let success = false;
      let message = "";

      if (!time) {
        throw new Error("Time is required.");
      } else if (isNaN(Number(hour)) || isNaN(Number(minute))) {
        throw new Error("Wrong format of time.");
      }

      const cronTask = await cronTaskService.createOne(body);

      if (cronTask) {
        const cronTaskHelper = new CronTaskHelper(
          cronTaskService,
          cronTaskLogService,
          productService,
          companyService,
          flowService,
          flowMapService,
          activityService
        );

        success = true;
        message = "Creating cron task successfully.";

        await cronTaskHelper.addCronJob(`${cronTask}`, {
          company: body.company,
          hour: Number(hour),
          minute: Number(minute),
        });
      }

      return {
        success,
        message,
        data: body,
      };
    } catch (e) {
      const error = e as Error;
      return new ServiceUnavailableException(error.message ?? error);
    }
  }

  @Post(
    { path: "/execute", tag: "CronTask" },
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
                  "type": "string"
                }
              }
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          company: {
            type: "number",
          },
        },
      },
    }
  )
  async execute(
    @Req() req: any,
    @Context() context: any,
    @Body() body: any
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
      schedule,
    } = context;

    const cronTaskService = new ItemsService("cron_tasks", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const cronTaskLogService = new ItemsService("cron_task_logs", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const productService = new ItemsService("products", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const companyService = new ItemsService("companies", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const flowService = new ItemsService("flows", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const flowMapService = new ItemsService("flow_maps", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const activityService = new ItemsService("activities", {
      schema: req.schema,
      accountability: req.accountability,
    });
    
    try {
      const { company }: any = body;

      const { user } = req.accountability;

      let success = false;
      let message = "Cron task has been failed.";

      const cronTaskHelper = new CronTaskHelper(
        cronTaskService,
        cronTaskLogService,
        productService,
        companyService,
        flowService,
        flowMapService,
        activityService
      );

      const res = await cronTaskHelper.populateTask({
        companyId: company,
        isManual: true,
        userId: user,
      });

      if (res) {
        success = true;
        message = 'Cron task has been running manually.';
      }

      return {
        success,
        message,
        data: body,
      };
    } catch (e) {
      const error = e as Error;
      return new ServiceUnavailableException(error.message ?? error);
    }
  }

  @Delete(
    { path: "/:id", tag: "CronTask" },
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
                  "type": "string"
                }
              }
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
  async delete(
    @Param("id") id: number,
    @Req() req: any,
    @Context() context: any,
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
      schedule,
    } = context;

    const cronTaskService = new ItemsService("cron_tasks", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const cronTaskLogService = new ItemsService("cron_task_logs", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const productService = new ItemsService("products", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const companyService = new ItemsService("companies", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const flowService = new ItemsService("flows", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const flowMapService = new ItemsService("flow_maps", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const activityService = new ItemsService("activities", {
      schema: req.schema,
      accountability: req.accountability,
    });
    
    try {
      let success = false;
      let message = "Failed to delete cron task";

      const cronTaskHelper = new CronTaskHelper(
        cronTaskService,
        cronTaskLogService,
        productService,
        companyService,
        flowService,
        flowMapService,
        activityService
      );

      const cronTask = await cronTaskService.deleteOne(id);

      console.log(cronTask);

      ({ success, message } = await cronTaskHelper.deleteTask(id))

      return {
        success,
        message,
        data: undefined,
      };
    } catch (e) {
      const error = e as Error;
      return new ServiceUnavailableException(error.message ?? error);
    }
  }
}
