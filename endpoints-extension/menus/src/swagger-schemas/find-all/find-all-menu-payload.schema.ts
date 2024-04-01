import { ResponseSwagger } from "@mv-data-core/decorator/dist/esm/utils";

export const findAllMenuPayload: { responses: ResponseSwagger[], parameters: any } = {
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
      name: "sortType",
      schema: {
        type: "string",
        enum: ["ASC", "DESC"]
      },
      required: false,
    },
    {
      in: "query",
      name: "sortBy",
      schema: {
        type: "string",
        enum: ["created_at", "updated_at"]
      },
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
      name: "clusterId",
      schema: { type: "number" },
      required: false,
    },
    {
      in: "query",
      name: "dashboardId",
      schema: { type: "number" },
      required: false,
    },
    {
      in: "query",
      name: "plantId",
      schema: { type: "number" },
      required: false,
    },
    {
      in: "query",
      name: "companyId",
      schema: { type: "number" },
      required: false,
    },
    {
      in: "query",
      name: "roleIds",
      schema: { type: "array", items: { type: "number" } },
      required: false,
    },
    {
      in: "query",
      name: "categories",
      schema: { type: "array", items: { type: "string" } },
      required: false,
      description: "GENERAL|TEMPLATE|MDP|DAQ|TV|TV-SIDEBAR",
    },
    {
      in: "query",
      name: "isActive",
      schema: { type: "boolean" },
      required: false,
    },
  ],
}