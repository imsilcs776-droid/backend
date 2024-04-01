import { ResponseSwagger } from "@mv-data-core/decorator/dist/esm/utils";

export const importPlantPayload: { responses: ResponseSwagger[], request: object, parameters: Array<object> } = {
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
  request: {
    type: "object",
    properties: {
      file: {
        type: "string",
        format: "binary"
      }
    }
  },
  parameters: [
    {
      in: "path",
      name: "companyId",
      schema: {
        type: "number",
      },
      required: true,
    },
    {
      in: "path",
      name: "plantId",
      schema: {
        type: "number",
      },
      required: true,
    }
  ],
}