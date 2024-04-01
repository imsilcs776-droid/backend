import { ResponseSwagger } from "@mv-data-core/decorator/dist/esm/utils";

export const visualizeQuestionResponses: ResponseSwagger[] = [
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
]