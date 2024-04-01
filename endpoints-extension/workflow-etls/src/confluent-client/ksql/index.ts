import { Body, Context, Endpoint, Get, Post, Req, Param, Delete } from "@mv-data-core/decorator";
import 'dotenv/config'
import { MESSAGE } from "../../constants/message";
import providers from "../../providers";
import { KsqlDto } from "./interface";

const tagName = 'Ksql'
const tagname = tagName.toLowerCase()

@Endpoint(`workflow-etl`)
export default class KSQL {
  @Post(
    { path: "/editor", tag: "Workflow-ETL " + tagName},
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object"
                },
                success: {
                  type: "boolean",
                },
                message: {
                  type: "string",
                }
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          query: {
            type: "string"
          }
        }
      }
    }
  )
  async onExecute(@Req() req: any, @Body() body: KsqlDto) {
    try {
      const results = await providers.ksqlClient.query(body.query)
      return {
        data: results,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(err: any) {
      throw new Error(err?.message || err)
    }
  }
  
  @Get(
    { path: "/streams", tag: "Workflow-ETL " + tagName},
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                data: {
                  example: [
                    {
                      name: 'stream-01'
                    }
                  ]
                },
                success: {
                  type: "boolean",
                },
                message: {
                  type: "string",
                }
              },
            },
          },
        },
      ]
    }
  )
  async getStreams(@Req() req: any, @Context() ctx: any) {
    try {
      const [result] = await providers.ksqlClient.query('SHOW STREAMS EXTENDED;')
      const data = result ? (result.sourceDescriptions || []).map((stream: any) => (stream)) : [];
      return {
        data,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(err: any) {
      throw new Error(err?.message || err)
    }
  }

  @Get(
    { path: "/streams/:streamName", tag: "Workflow-ETL " + tagName},
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                data: {
                  example: {
                    name: 'stream-01',
                    fields: [
                      {
                        name: "PAGE_ID",
                        schema: {
                          type: "BIGINT",
                          fields: null,
                          memberSchema: null
                        }
                      }
                    ],
                    keyFormat: "KAFKA",
                    valueFormat: "AVRO",
                    topic: "coba",
                    statement: "CREATE STREAM COBA1 (PAGE_ID BIGINT, VIEWTIME BIGINT, USER_ID STRING) WITH (KAFKA_TOPIC='coba', KEY_FORMAT='KAFKA', VALUE_FORMAT='AVRO');"
                  }
                },
                success: {
                  type: "boolean",
                },
                message: {
                  type: "string",
                }
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "path",
          name: "streamName",
          schema: {
            type: "string",
          },
          required: true,
        },
      ],
    }
  )
  async getStream(@Req() req: any, @Context() ctx: any, @Param("streamName") streamName: string) {
    try {
      const [result] = await providers.ksqlClient.query(`DESCRIBE ${streamName};`);
      const { sourceDescription }: any = result ? result : {};
      const data = sourceDescription ? {
        name: sourceDescription.name,
        fields: sourceDescription.fields,
        keyFormat: sourceDescription.keyFormat,
        valueFormat: sourceDescription.valueFormat,
        topic: sourceDescription.topic,
        statement: sourceDescription.statement,
        partitions: sourceDescription.partitions,
        replication: sourceDescription.replication,
      } : null;
      return {
        data,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(err: any) {
      throw new Error(err?.message || err)
    }
  }

  @Delete(
    { path: "/streams/:streamName", tag: "Workflow-ETL " + tagName},
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                data: {},
                success: {
                  type: "boolean",
                },
                message: {
                  type: "string",
                }
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "path",
          name: "streamName",
          schema: {
            type: "string",
          },
          required: true,
        },
      ],
    }
  )
  async dropStream(@Req() req: any, @Context() ctx: any, @Param("streamName") streamName: string) {
    try {
      const [data] = await providers.ksqlClient.query(`DROP STREAM IF EXISTS ${streamName} DELETE TOPIC IF EXISTS;`);
      return {
        data,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(e: any) {
      try {
        const [data] = await providers.ksqlClient.query(`DROP STREAM IF EXISTS ${streamName};`);
        return {
          data,
          "success": true,
          "message": MESSAGE.SUCCESS
        }
      } catch(err: any) {
        throw new Error(err?.message || err)
      }
    }
  }

  @Get(
    { path: "/tables", tag: "Workflow-ETL " + tagName},
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                data: {
                  example: [
                    {
                      type: 'TABLE',
                      name: 'table-01',
                      topic: 'topic-01',
                      keyFormat: 'KAFKA',
                      valueFormat: 'JSON',
                      isWindowed: false
                    }
                  ]
                },
                success: {
                  type: "boolean",
                },
                message: {
                  type: "string",
                }
              },
            },
          },
        },
      ]
    }
  )
  async getTables(@Req() req: any, @Context() ctx: any) {
    try {
      const [result] = await providers.ksqlClient.query('SHOW TABLES EXTENDED;')
      const data = result ? (result.sourceDescriptions || []).map((table: any) => {
        return {
          isWindowed: false,
          keyFormat: table.keyFormat,
          name: table.name,
          topic: table.topic,
          type: table.type,
          valueFormat: table.valueFormat,
          partitions:table.partitions,
          replication:table.replication,
        }
      }) : [];
      return {
        data,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(err: any) {
      throw new Error(err?.message || err)
    }
  }

  @Get(
    { path: "/tables/:tableName", tag: "Workflow-ETL " + tagName},
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                data: {
                  example: {
                    name: 'table-01',
                    fields: [
                      {
                        name: "PAGE_ID",
                        schema: {
                          type: "BIGINT",
                          fields: null,
                          memberSchema: null
                        }
                      }
                    ],
                    keyFormat: "KAFKA",
                    valueFormat: "JSON",
                    topic: "users-topic",
                    statement: "CREATE TABLE USERS (ID BIGINT PRIMARY KEY, USERTIMESTAMP BIGINT, GENDER STRING, REGION_ID STRING) WITH (KAFKA_TOPIC='users-topic', KEY_FORMAT='KAFKA', PARTITIONS=1, VALUE_FORMAT='JSON');"
                  }
                },
                success: {
                  type: "boolean",
                },
                message: {
                  type: "string",
                }
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "path",
          name: "tableName",
          schema: {
            type: "string",
          },
          required: true,
        },
      ],
    }
  )
  async getTable(@Req() req: any, @Context() ctx: any, @Param("tableName") tableName: string) {
    try {
      const [result] = await providers.ksqlClient.query(`DESCRIBE ${tableName};`);
      const { sourceDescription }: any = result ? result : {};
      const data = sourceDescription ? {
        name: sourceDescription.name,
        fields: sourceDescription.fields,
        keyFormat: sourceDescription.keyFormat,
        valueFormat: sourceDescription.valueFormat,
        topic: sourceDescription.topic,
        statement: sourceDescription.statement,
        partitions: sourceDescription.partitions,
        replication: sourceDescription.replication,
      } : null;
      return {
        data,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(err: any) {
      throw new Error(err?.message || err)
    }
  }

  @Delete(
    { path: "/tables/:tableName", tag: "Workflow-ETL " + tagName},
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                data: {},
                success: {
                  type: "boolean",
                },
                message: {
                  type: "string",
                }
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "path",
          name: "tableName",
          schema: {
            type: "string",
          },
          required: true,
        },
      ],
    }
  )
  async dropTable(@Req() req: any, @Context() ctx: any, @Param("tableName") tableName: string) {
    try {
      const [data] = await providers.ksqlClient.query(`DROP TABLE IF EXISTS ${tableName} DELETE TOPIC;`);
      return {
        data,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(e: any) {
      try {
        const [data] = await providers.ksqlClient.query(`DROP TABLE IF EXISTS ${tableName};`);
        return {
          data,
          "success": true,
          "message": MESSAGE.SUCCESS
        }
      } catch(err: any) {
        throw new Error(err?.message || err)
      }
    }
  }
}