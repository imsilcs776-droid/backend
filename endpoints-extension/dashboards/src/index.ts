import { Context, Endpoint, Get } from "@mv-data-core/decorator";
import axios from "axios"

@Endpoint('bi-dashboards')
export default class Dashboards {
  @Get(
    { path: "/public", tag: "public" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "number"
                  },
                  name: {
                    type: "string"
                  },
                  public_uuid: {
                    type: "string"
                  }
                }
              }
            },
          },
        },
      ],
    }
  )
  async public(@Context() ctx: any) {
    const { env } = ctx

    const {
      BI_URL,
      BI_USER,
      BI_PASS
    } = env
    const payload = {
      username: BI_USER,
      password: BI_PASS
    }
    let data = null
    let message = ''
    let success = true
    try {
      const login = await axios.post(`${BI_URL}/api/session`, payload)
      const sessionId = login?.data?.id

      if (sessionId) {
        const dashboards = await axios.get(`${BI_URL}/api/dashboard/public`, {
          headers: {
            'X-Metabase-Session': sessionId
          }
        })
        data = dashboards.data
      }
    } catch (error: any) {
      console.log('error', error.response.data)
      message = error.response.data
      success = false
    }
    
    return {
      success,
      message,
      data,
    }
  }
}
