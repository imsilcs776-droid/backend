import { Context, Endpoint, Get, Req, Param, Query } from "@mv-data-core/decorator";
import 'dotenv/config'
import { CONFLUENT } from "../../constants/confluent";
import { MESSAGE } from "../../constants/message";
import providers from "../../providers";

const tagName = 'Topic'
const tagname = tagName.toLowerCase()

@Endpoint(`workflow-etl`)
export default class Topic {
  @Get(
    { path: "/topics", tag: "Workflow-ETL " + tagName},
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
                      name: 'topic-01'
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
      ],
    }
  )
  async getTopics(@Req() req: any, @Context() ctx: any, @Query('filterBy') filterBy: string, @Query('search') search: string) {
    try {
      const [rawTopics] = await providers.ksqlClient.query('SHOW TOPICS EXTENDED;')
      const [cluster] = await providers.providerClient.get(`${CONFLUENT.HTTP_HOST}/2.0/clusters/kafka`)
      let topics = [];
      if (cluster) {
        const allTopics = await providers.providerClient.get(`${CONFLUENT.HTTP_HOST}/2.0/kafka/${cluster.clusterId}/topics`);
        topics = allTopics
          .filter((topic: any) => {
            return rawTopics.topics.some((rawTopic: any)=> topic.name.toLowerCase() === rawTopic.name.toLowerCase())
          })
          .map((item: any)=> {
            const { consumerCount, consumerGroupCount } = rawTopics.topics.find((rawTopic:any)=> item.name.toLowerCase() === rawTopic.name.toLowerCase() )
            return {
              internal: item.internal,
              name: item.name,
              followers: item?.partitions?.length || 0,
              partitions: item?.partitions?.length || 0,
              lastProduced: new Date(),
              consumerCount,
              consumerGroupCount
            }
          })
          .filter((topic:any)=> {
            if (filterBy && search) {
              const keys = Object.keys(topic)
              if (keys.some(key => key === filterBy)) {
                return topic[filterBy].toLowerCase().includes(search.toLowerCase())
              }

              return false
            }

            return true
          })
      };
      return {
        data: topics,
        "success": true,
        "message": MESSAGE.SUCCESS
      }
    } catch(err: any) {
      throw new Error(err?.message || err)
    }
  }

  @Get(
    { path: "/topics/schema/:topicName", tag: "Workflow-ETL " + tagName},
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
                    subject: 'topic-01-value',
                    version: 1,
                    id: 2,
                    schema: {
                      type: "record",
                      name: "KsqlDataSourceSchema",
                      namespace: "io.confluent.ksql.avro_schemas",
                      fields: [
                        {
                          name: "PAGE_ID",
                          type: ["null", "long"],
                          default: null
                        },
                        {
                          name: "USER_ID",
                          type: ["null", "string"],
                          default: null
                        }
                      ],
                      "connect.name": "io.confluent.ksql.avro_schemas.KsqlDataSourceSchema"
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
      parameters: [
        {
          in: "path",
          name: "topicName",
          schema: {
            type: "string",
          },
          required: true,
        },
      ],
    }
  )
  async getTopic(@Req() req: any, @Context() ctx: any, @Param("topicName") topicName: string) {
    try {
      const [schema] = await providers.providerClient.get(CONFLUENT.HTTP_HOST + '/2.0/clusters/schema-registry');
      let data = null;
      if (schema) {
        const [version] = await providers.providerClient.get(`${CONFLUENT.HTTP_HOST}/api/schema-registry/${schema.clusterId}/subjects/${topicName}-value/versions`);
        data = await providers.providerClient.get(`${CONFLUENT.HTTP_HOST}/api/schema-registry/${schema.clusterId}/subjects/${topicName}-value/versions/${version ? version : 0}`);
        data && data.schema ? data.schema = JSON.parse(data.schema) : null;
      }
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