import { Context, Endpoint, Get, Req } from "@mv-data-core/decorator";
import 'dotenv/config'
import { CONFLUENT } from "../../constants/confluent";
import { MESSAGE } from "../../constants/message";
import providers from "../../providers";

const tagName = 'Cluster'
const tagname = tagName.toLowerCase()

@Endpoint(`workflow-etl`)
export default class Cluster {
  @Get(
    { path: "/cluster", tag: "Workflow-ETL " + tagName},
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
                      "clusterId": "qKvtU4qrTQGg4Mt4qzrZeQ",
                      "displayName": "controlcenter.cluster",
                      "zookeeperConnect": [],
                      "bootstrapServers": [
                        "broker:29092"
                      ]
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
  async getClusters(@Req() req: any, @Context() ctx: any) {
    try {
      const data = await providers.providerClient.get(CONFLUENT.HTTP_HOST + '/2.0/clusters/kafka')
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
