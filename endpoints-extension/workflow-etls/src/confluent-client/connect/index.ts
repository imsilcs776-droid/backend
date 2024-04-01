import { Context, Endpoint, Get, Req, Post, Body, Param, Query, Delete } from "@mv-data-core/decorator";
import 'dotenv/config'
import { CONFLUENT } from "../../constants/confluent";
import { MESSAGE } from "../../constants/message";
import providers from "../../providers";
import { PLAY_CONTROL, CONNECT_TYPE } from "./constant";

const tagName = 'Connect'

@Endpoint(`workflow-etl`)
export default class Connect {
  @Get(
    { path: "/cluster/connect", tag: "Workflow-ETL " + tagName},
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
                  type: "object",
                  properties: {
                    urls: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    },
                    displayName: {
                      type: "string"
                    },
                    clusterId: {
                      type: "string"
                    }
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
    }
  )
  async getClusterConnect(@Req() req: any, @Context() ctx: any) {
    try {
      const data = await providers.providerClient.get(CONFLUENT.HTTP_HOST + '/2.0/clusters/connect')
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
    { path: "/connectors", tag: "Workflow-ETL " + tagName },
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
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
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
      ],
      parameters: [
        {
          in: "query",
          name: "type",
          schema: {
            type: "string",
            enum: CONNECT_TYPE
          },
          required: true,
        },
      ],
    }
  )
  async getConnector(@Req() req: any, @Query("type") type: CONNECT_TYPE) {
    try {
      let connectType: string
      switch (type) {
        case CONNECT_TYPE.SINK:
          connectType = CONNECT_TYPE.SINK
          break;

        case CONNECT_TYPE.SOURCE:
          connectType = CONNECT_TYPE.SOURCE
          break;
        
        default:
          connectType = ''
          break;
      }
      const [results] = await providers.ksqlClient.query(`LIST ${connectType} CONNECTORS;`)
      const data = results.connectors.map((connector: any) => connector)
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
    { path: "/connector-plugins", tag: "Workflow-ETL " + tagName },
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
                  type: "array",
                  items: {
                    properties: {
                      class: {
                        type: "string"
                      },
                      type: {
                        type: "string"
                      },
                      version: {
                        type: "string"
                      }
                    }
                  }
                },
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
    }
  )
  async getConnectorPlugIn(@Req() req: any) {
    try {
      const data = await providers.providerClient.get(`${CONFLUENT.CONNECT_HOST}/connector-plugins`);
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
    { path: "/connectors/:connectorName", tag: "Workflow-ETL " + tagName },
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
                  type: "object",
                  properties: {
                    name: {
                      type: "string"
                    },
                    config: {
                      type: "object",
                      properties: {
                        "connector.class": {
                          type: "string"
                        },
                        "tasks.max": {
                          type: "string"
                        },
                      }
                    },
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          connector: {
                            type: "string"
                          },
                          task: {
                            type: "integer"
                          }
                        }
                      }
                    },
                    type: {
                      type: "string"
                    }
                  }
                },
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
      ],
      parameters: [
        {
          in: "path",
          name: "connectorName",
          schema: {
            type: "string",
          },
          required: true,
        },
      ],
    }
  )
  async getConnectorDetail(@Req() req: any, @Param("connectorName") connectorName: string) {
    try {
      const data = await providers.providerClient.get( `${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}`);
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
    { path: "/connectors/:connectorName", tag: "Workflow-ETL " + tagName },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
            },
          },
        },
      ],
      parameters: [
        {
          in: "path",
          name: "connectorName",
          schema: {
            type: "string",
          },
          required: true,
        },
      ],
    }
  )
  async deleteConnector(@Req() req: any, @Param("connectorName") connectorName: string) {
    try {
      const connDetail = await providers.providerClient.get(`${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}`);
      const { type } = connDetail || {};


      if (type === 'source') {
        const topicPrefix = connDetail?.config["topic.prefix"] || ''
        const topicSuffixs = (connDetail?.config["table.whitelist"] || '').split(',')
        const fullNameTopics = topicSuffixs.map((topicSuffix:any) => topicPrefix + topicSuffix)
        if (!fullNameTopics || !fullNameTopics.length) {
          // return 'BERHASIL DELETE KARENA SOURCE GAK DIPAKE'
          const data = await providers.providerClient.delete(`${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}`);
          return {
            data,
            "success": true,
            "message": MESSAGE.SUCCESS
          }
        }

        const [extendedTopics] = await providers.ksqlClient.query('SHOW TOPICS EXTENDED;')
        const { topics } = extendedTopics || {}
        const isMatchTopic = topics
          .some((tp:any) => 
            fullNameTopics.some((fullNameTopic:any)=> tp.name === fullNameTopic)
              )
        console.log(isMatchTopic)
        if (!isMatchTopic) {
          // return 'BERHASIL DELETE KARENA SOURCE GAK DIPAKE'
          const data = await providers.providerClient.delete(`${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}`);
          return {
            data,
            "success": true,
            "message": MESSAGE.SUCCESS
          }
        }
  
        const topicInUse = topics.some((tpc:any) => {
          const isConnectorTopic = fullNameTopics.some(( fnt:string )=> fnt=== tpc.name)
          return isConnectorTopic && tpc.consumerCount > 0
        })
        if (topicInUse) throw new Error(`Action Forbiden, Topic ${fullNameTopics.join(" & ")} In Use`)
        
        const [cluster] = await providers.providerClient.get(`${CONFLUENT.HTTP_HOST}/2.0/clusters/kafka`)
        if (!cluster || !cluster.clusterId) throw new Error("Cluster not Found");

        await Promise.all(await fullNameTopics.map(async (fnt:string)=> {
          return await providers.providerClient.delete(`${CONFLUENT.HTTP_HOST}/2.0/kafka/${cluster.clusterId}/topics/${fnt}`)
        }))

        // return 'BERHASIL DELETE KARENA SOURCE GAK DIPAKE'
        const data = await providers.providerClient.delete(`${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}`);
        return {
          data,
          "success": true,
          "message": MESSAGE.SUCCESS
        }
      }

      // return 'BERHASIL DELETE KARENA SINK'

      const data = await providers.providerClient.delete(`${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}`);
      return {
        data,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(err: any) {
      throw new Error(err?.message || err)
    }
  }

  @Post(
    { path: "/connectors/:connectorName/:control", tag: "Workflow-ETL " + tagName },
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
                  type: "object",
                },
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
      ],
      parameters: [
        {
          in: "path",
          name: "connectorName",
          schema: {
            type: "string",
          },
          required: true,
        },
        {
          in: "path",
          name: "control",
          schema: {
            type: "string",
            enum: PLAY_CONTROL
          },
          required: true,
        },
      ],
    }
  )
  async reStartConnector(
    @Param("connectorName") connectorName: string,
    @Param("control") playControl: string
  ) {
    try {
      let data = null
      if (playControl === PLAY_CONTROL.RESTART) {
        data = await providers.providerClient.post(`${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}/${playControl}`);
      } else {
        data = await providers.providerClient.put(`${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}/${playControl}`);
      }   
        
      return {
        data,
        success: true,
        message: MESSAGE.SUCCESS,
      };
    } catch(err: any) {
      throw new Error(err?.message || err)
    }
  }

  @Post(
    { path: "/connectors/:connectorName", tag: "Workflow-ETL " + tagName },
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
                  type: "object",
                },
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
      ],
      request: {
        type: "object",
        example: {
          "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
          "timestamp.column.name": "created_at",
          "dialect.name": "SqlServerDatabaseDialect",
          "incrementing.column.name": "id",
          "connection.password": "laniuslab1!",
          "validate.non.null": "false",
          "tasks.max": "1",
          "query": "",
          "connection.attempts": "3",
          "batch.max.rows": "10000",
          "table.types": "TABLE",
          "table.whitelist": "action_photos",
          "mode": "timestamp+incrementing",
          "value.converter.schema.registry.url": "http://schema-registry:8081",
          "topic.prefix": "COBA",
          "connection.user": "sa",
          "poll.interval.ms": "60000",
          "db.timezone": "UTC",
          "name": "kijang-3",
          "value.converter": "io.confluent.connect.avro.AvroConverter",
          "connection.url": "jdbc:sqlserver://192.168.18.169:1433;databaseName=master;",
          "key.converter": "org.apache.kafka.connect.storage.StringConverter"
        },
        properties: {
          "connector.class": {
            type: "string"
          },
          "tasks.max": {
            type: "string"
          },
          "key.converter": {
            type: "string"
          },
          "value.converter": {
            type: "string"
          },
          "connection.url": {
            type: "string"
          },
          "connection.user": {
            type: "string"
          },
          "connection.password": {
            type: "string"
          },
          "connection.attempts": {
            type: "string"
          },
          "table.whitelist": {
            type: "string"
          },
          "mode": {
            type: "string"
          },
          "incrementing.column.name": {
            type: "string"
          },
          "timestamp.column.name": {
            type: "string"
          },
          "table.types": {
            type: "string"
          },
          "topic.prefix": {
            type: "string"
          },
          "db.timezone": {
            type: "string"
          },
        }
      },
      parameters: [
        {
          in: "path",
          name: "connectorName",
          schema: {
            type: "string",
          },
          required: true,
        }
      ]
    }
  )
  async createConnector(
    @Body() body: any, 
    @Param("connectorName") connectorName: string,
  ) {
    if (body?.name !== connectorName) {
      throw new Error("connectorName should be same value with name");
    }
    const data = await providers.providerClient.put(`${CONFLUENT.CONNECT_HOST}/connectors/${connectorName}/config`, body);
    
    return {
      data,
      success: true,
      message: "Connector created.",
    };
  }
}
