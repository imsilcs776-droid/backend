import { Payload } from "@mv-data-core/decorator/dist/esm/utils";

export const subscribeImportPayload: Payload = {
  responses: [
    {
      200: {
        description: "Import",
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
  parameters: [
    {
      in: "path",
      name: "topic",
      schema: {
        type: "string",
      },
      required: true,
    }
  ],
}