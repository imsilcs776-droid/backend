import { Body, Context, Endpoint, Get, Param, Patch, Post, Put, Query, Req, Res } from "@mv-data-core/decorator";
import { AutomationHelper } from "./helper";
import { DateOperation } from "./utils";
import fs from 'fs';

@Endpoint('automations')
export default class DefineEndpoint {
  @Post(
    { path: "/manual", tag: "Automation" },
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
        type: "object",
        properties: {
          automationId: {
            type: "number",
          },
          startDate: {
            type: "string"
          },
          endDate: {
            type: "string"
          },
          method: {
            type: "string",
          },
          recipients: {
            type: "array",
            items: {
              type: "string",
            },
          },
          subject: {
            type: "string",
          },
          message: {
            type: "string",
          },
        },
      },
    }
  )
  async manual(@Req() req: any, @Context() ctx: any, @Body() body: any) {
    const {
      services: { ItemsService, MailService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    try {
      const automationService = new ItemsService("automations", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const questionService = new ItemsService("questions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const virtualService = new ItemsService("virtual_tables", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const credentialService = new ItemsService("credentials", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageClassificationService = new ItemsService("sage_classification", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageExpressionService = new ItemsService("sage_expressions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageStatementService = new ItemsService("sage_statements", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const userService = new ItemsService("directus_users", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationLogService = new ItemsService("automation_logs", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationHandlerService = new ItemsService("automation_handlers", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const insightService = new ItemsService("insights", {
        schema: req.schema,
        accountability: req.accountability,
      });


      const mailService = new MailService({
        schema: req.schema,
        accountability: req.accountability,
      });

      const { user } = req.accountability;
      const { automationId } = body;

      const automation = await automationService.readOne(automationId);

      if (automation) {
        const automationHelper = new AutomationHelper(
          questionService,
          virtualService,
          credentialService,
          sageClassificationService,
          sageExpressionService,
          sageStatementService,
          userService,
          automationService,
          automationLogService,
          automationHandlerService,
          mailService,
          insightService,
        );

        await automationHelper.populateTask({ automation, isManual: true, userId: user, ...body });

        return {
          success: true,
          message: 'The automation has been prosessed successfully.',
          data: automation
        }
      }

      return {
        success: false,
        message: 'The automation not found!',
        data: automation
      };
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      // return new ServiceUnavailableException(error.message);
      return { success: false, message: error };
    }
  }

  @Patch(
    { path: "/configuration/:id", tag: "Automation" },
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
        type: "object",
        properties: {
          sources: {
            type: "array",
            items: {
              properties: {
                sheet_name: {
                  type: "string",
                },
                first_row: {
                  type: "string",
                },
                source: {
                  type: "string",
                },
                reference: {
                  type: "number",
                },
                cell_range: {
                  type: "string",
                },
              },
            },
          },
          extension: {
            type: "string",
          },
          additional: {
            type: "object",
          }
        },
      },
    }
  )
  async configuration(@Req() req: any, @Context() ctx: any, @Param("id") id: number, @Body() body: any) {
    const {
      services: { ItemsService, MailService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    try {
      const automationService = new ItemsService("automations", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const questionService = new ItemsService("questions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const virtualService = new ItemsService("virtual_tables", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const credentialService = new ItemsService("credentials", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageClassificationService = new ItemsService("sage_classification", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageExpressionService = new ItemsService("sage_expressions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageStatementService = new ItemsService("sage_statements", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const userService = new ItemsService("directus_users", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationLogService = new ItemsService("automation_logs", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationHandlerService = new ItemsService("automation_handlers", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const insightService = new ItemsService("insights", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const mailService = new MailService({
        schema: req.schema,
        accountability: req.accountability,
      });

      const automation = await automationService.readOne(id);

      if (automation) {
        let automationBaseDTO : any = {};
        const { sources, extension, additional } = body;
        automationBaseDTO.sources = sources;
        automationBaseDTO.extension = extension;
        automationBaseDTO.additional = additional;

        const result = await automationService.updateOne(id, automationBaseDTO);
        if (result) {
          const automationHelper = new AutomationHelper(
            questionService,
            virtualService,
            credentialService,
            sageClassificationService,
            sageExpressionService,
            sageStatementService,
            userService,
            automationService,
            automationLogService,
            automationHandlerService,
            mailService,
            insightService,
          );
  
          await automationHelper.start(id);
        }

        return {
          success: true,
          message: 'The automation configuration has been prosessed successfully.',
          data: automation
        }
      }

      return {
        success: false,
        message: 'The automation not found!',
        data: automation
      };
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      // return new ServiceUnavailableException(error.message);
      return { success: false, message: error };
    }
  }

  @Patch(
    { path: "/:id", tag: "Automation" },
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
        type: "object",
        properties: {
          company: {
            type: "number",
          },
          title: {
            type: "string",
          },
          interval: {
            type: "object",
          },
          start_date: {
            type: "string",
          },
          method: {
            type: "string",
          },
          recipients: {
            type: "array",
            items: {
              type: "string",
            },
          },
          subject: {
            type: "string",
          },
          message: {
            type: "string",
          },
          sources: {
            type: "array",
            items: {
              type: "object",
            },
          },
          extension: {
            type: "string",
          },
          is_active: {
            type: "boolean",
          },
          additional: {
            type: "object",
          },
        },
      },
    }
  )
  async update(@Req() req: any, @Context() ctx: any, @Param("id") id: number, @Body() body: any) {
    const {
      services: { ItemsService, MailService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    try {
      const automationService = new ItemsService("automations", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const questionService = new ItemsService("questions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const virtualService = new ItemsService("virtual_tables", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const credentialService = new ItemsService("credentials", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageClassificationService = new ItemsService("sage_classification", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageExpressionService = new ItemsService("sage_expressions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageStatementService = new ItemsService("sage_statements", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const userService = new ItemsService("directus_users", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationLogService = new ItemsService("automation_logs", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationHandlerService = new ItemsService("automation_handlers", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const insightService = new ItemsService("insights", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const mailService = new MailService({
        schema: req.schema,
        accountability: req.accountability,
      });
      
      const { automationId } = body;

      const automation = await automationService.readOne(automationId);

      if (automation) {
        const { interval }: any = body;
        const data = await automationService.updateOne(
          id,
          body,
        );

        if (data && interval) {
          const { unit, value } = interval;

          if ((unit && unit.toUpperCase() != automation.interval.unit.toUpperCase()) || (value && Number(value) != Number(automation.interval.value))) {
            const [ handler ] = await automationHandlerService.readByQuery({
              filter: {
                automation: {
                  _eq: automation.id,
                },
              },
            });

            if (handler) {
              const automationHelper = new AutomationHelper(
                questionService,
                virtualService,
                credentialService,
                sageClassificationService,
                sageExpressionService,
                sageStatementService,
                userService,
                automationService,
                automationLogService,
                automationHandlerService,
                mailService,
                insightService,
              );
              const { startDate, nextDate } = automationHelper.computePeriod(handler.start_date, interval);
              const automationHandlerDTO: any = handler;
              automationHandlerDTO.start_date = startDate;
              automationHandlerDTO.next_date = nextDate;
              automationHandlerDTO.is_active = true;
              await automationHandlerService.updateOne(handler.id, automationHandlerDTO);
            }
          }
        }

        return {
          success: true,
          message: 'Successfully Update Automation',
          data,
        }
      }

      return {
        success: false,
        message: 'The automation not found!',
        data: automation
      };
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      // return new ServiceUnavailableException(error.message);
      return { success: false, message: error };
    }
  }
  
  @Get(
    { path: "/download/:id", tag: "Automation" },
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
          name: "start_date",
          schema: { type: "string" },
          description: 'YYYY-MM-DD HH:mm:ss',
          required: false,
        },
        {
          in: "query",
          name: "end_date",
          schema: { type: "string" },
          description: 'YYYY-MM-DD HH:mm:ss',
          required: false,
        },
      ],
    }
  )
  async download(
    @Req() req: any, 
    @Res() res: any, 
    @Context() ctx: any, 
    @Param("id") id: number,
    @Query('startDate') start_date: Date,
    @Query('endDate') end_date: Date,
  ) {
    const {
      services: { ItemsService, MailService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    try {
      const automationService = new ItemsService("automations", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const questionService = new ItemsService("questions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const virtualService = new ItemsService("virtual_tables", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const credentialService = new ItemsService("credentials", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageClassificationService = new ItemsService("sage_classification", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageExpressionService = new ItemsService("sage_expressions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageStatementService = new ItemsService("sage_statements", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const userService = new ItemsService("directus_users", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationLogService = new ItemsService("automation_logs", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationHandlerService = new ItemsService("automation_handlers", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const insightService = new ItemsService("insights", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const mailService = new MailService({
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationHelper = new AutomationHelper(
        questionService,
        virtualService,
        credentialService,
        sageClassificationService,
        sageExpressionService,
        sageStatementService,
        userService,
        automationService,
        automationLogService,
        automationHandlerService,
        mailService,
        insightService,
      );

      const automation = await automationService.readOne(id);
  
      if (automation) {
        const now = new Date();
        const { title, extension, additional } = automation;
        const fileName = `${title.split(' ').join('_')}#${DateOperation.getDate(now)}_${DateOperation.getTimePicker(now).split(':').join('-')}.${extension ? extension.toLowerCase(): 'xlsx'}`;
        const sources = automation.sources.map((source: any) => {
          return {
            ...source,
            filter: {
              startDate: start_date ? new Date(start_date) : undefined,
              endDate: end_date ? new Date(end_date) : undefined
            }
          }
        });
  
        try {
          const data: any = await automationHelper.computeSources(fileName, sources, extension ? extension : 'XLSX', { ...additional, isToBlob: true });
  
          res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
          res.setHeader('Content-type', 'application/vnd.ms-excel')
          res.send(data)
        } catch (_e) {
          res.send({
            success: false,
            message: 'Generating file has been failed.',
            data: automation
          });
        }
      } else {
        res.send({
          success: true,
          message: 'Successfully generating file.',
          data: automation
        });
      }
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      // return new ServiceUnavailableException(error.message);
      res.send({ success: false, message: error });
    }
  }

  @Get(
    { path: "/log/download/:id", tag: "Automation" },
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
    }
  )
  async downloadLog(
    @Req() req: any, 
    @Res() res: any, 
    @Context() ctx: any, 
    @Param("id") id: number,
  ) {
    const {
      services: { ItemsService, MailService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    try {

      const automationService = new ItemsService("automations", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const questionService = new ItemsService("questions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const virtualService = new ItemsService("virtual_tables", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const credentialService = new ItemsService("credentials", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageClassificationService = new ItemsService("sage_classification", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageExpressionService = new ItemsService("sage_expressions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const sageStatementService = new ItemsService("sage_statements", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const userService = new ItemsService("directus_users", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationLogService = new ItemsService("automation_logs", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationHandlerService = new ItemsService("automation_handlers", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const insightService = new ItemsService("insights", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const mailService = new MailService({
        schema: req.schema,
        accountability: req.accountability,
      });

      const automationHelper = new AutomationHelper(
        questionService,
        virtualService,
        credentialService,
        sageClassificationService,
        sageExpressionService,
        sageStatementService,
        userService,
        automationService,
        automationLogService,
        automationHandlerService,
        mailService,
        insightService,
      );

      const automationLog = await automationLogService.readOne(id, {
        fields: ["*", "reference.*"],
      });
  
      if (automationLog) {
        const automation = automationLog?.reference;
        const { file_name, sources, extension } = automationLog;
        const additional = automation ? { ...automation.additional, isToBlob: true } : { isToBlob: true };
  
        try {
          const data: any = await automationHelper.computeSources(file_name, sources, extension ? extension : 'XLSX', { ...additional, isToBlob: true });
  
          res.setHeader('Content-disposition', `attachment; filename=${file_name}`);
          res.setHeader('Content-type', 'application/vnd.ms-excel')
          res.send(data)
        } catch (_e) {
          res.send({
            success: false,
            message: 'Generating file has been failed.',
            data: automationLog
          });
        }
      } else {
        res.send({
          success: true,
          message: 'Successfully generating file.',
          data: automationLog
        });
      }
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      // return new ServiceUnavailableException(error.message);
      res.send({ success: false, message: error });
    }
  }
}
