import { Body, Context, Endpoint, Get, Param, Patch, Post, Req, Res } from "@mv-data-core/decorator";
import { InsightHelper } from "./helpers";

@Endpoint('insights')
export default class DefineEndpoint {
  @Get(
    { path: "/visualize/:id", tag: "Insight" },
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
  async visualize(@Req() req: any, @Context() ctx: any, @Param("id") id: number) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    try {
      const automationService = new ItemsService("automations", {
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

      const insightService = new ItemsService("insights", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const questionService = new ItemsService("questions", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const insight = await insightService.readOne(id);

      if (insight) {
        const insightHelper = new InsightHelper(
          credentialService,
          sageClassificationService,
          sageExpressionService,
          sageStatementService,
          insightService,
          questionService,
        );

        const { success, message, data }: any = await insightHelper.visualize(id);

        return {
          success,
          message,
          data: data,
        }
      }

      return {
        success: false,
        message: 'The automation not found!',
        data: insight
      };
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      // return new ServiceUnavailableException(error.message);
      return { success: false, message: error };
    }
  }
}
