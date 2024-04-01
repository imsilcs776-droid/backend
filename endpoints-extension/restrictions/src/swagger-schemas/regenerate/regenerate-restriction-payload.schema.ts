import { ResponseSwagger } from "@mv-data-core/decorator/dist/esm/utils";

export const regenerateRestrictionPayload: { responses: ResponseSwagger[], request: object } = {
  responses: [
    {
      200: {
        description: "Restriction",
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
            data: {
              type: "null"
            }
          },
        },
      },
    },
  ],
  request: {
    type: "object",
    properties: {
      company: {
        type: "number"
      }
    }
  }
}