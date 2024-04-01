import { ResponseSwagger } from "@mv-data-core/decorator/dist/esm/utils";

export const findAllTelevisionPayload: { responses: ResponseSwagger[], parameters: any } = {
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
  parameters: [
    {
      in: "query",
      name: "limit",
      schema: { type: "number" },
      required: false,
    },
    {
      in: "query",
      name: "pagination",
      schema: { type: "number" },
      required: false,
    },
    {
      in: "query",
      name: "search",
      schema: { type: "string" },
      required: false,
    },
    {
      in: "query",
      name: "filterBy",
      schema: { 
        type: "string",
        enum: ["name"] 
      },
      required: false,
    },
    {
      in: "query",
      name: "tierId",
      schema: { type: "number" },
      required: false,
    },
    {
      in: "query",
      name: "subTierId",
      schema: { type: "number" },
      required: false,
    },
    {
      in: "query",
      name: "companyId",
      schema: { type: "number" },
      required: true,
    },
    {
      in: "query",
      name: "plantId",
      schema: { type: "number" },
      required: false,
    },
  ],
}