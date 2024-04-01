import { Body, Context, Endpoint, Get, Param, Patch, Req, Res } from "@mv-data-core/decorator";

@Endpoint('favorites')
export default class DefineEndpoint {
  @Get(
    { path: "/user", tag: "Favorite" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                msg: {
                  type: "string"
                }
              }
            },
          },
        },
      ],
    }
  )
  async favoritesUser(
    @Req() req: any, 
    @Res() res: any, 
    @Context() ctx: any, 
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    const favoriteService = new ItemsService("favorites", {
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      const { user } = req.accountability;
      const filter: any = {};

      filter.user = { _eq: user };

      const [favorite] = await favoriteService.readByQuery({
        fields: ["*", "businesses.business.*"],
        filter,
      });

      return {
        success: true,
        message: 'Getting detail successfully.',
        data: favorite,
      };
    } catch (error: any) {
      // return new ServiceUnavailableException(error?.message ?? error);
      return { success: false, message: error?.message ?? error };
    }
  }

  @Patch(
    { path: "/name/:name", tag: "Hello" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                msg: {
                  "type": "string"
                }
              }
            },
          },
        },
      ],
      request: {
        type: "object",
      }
    }
  )
  async update(
    @Param("name") name: string,
    @Context() context: any,
    @Body() body: any
  ) {
    const {
      exceptions: { ServiceUnavailableException },
    } = context;
    if (name == 'wrong') {
      throw new ServiceUnavailableException("Wrong name");
    }
    return {
      msg: `Hello ${name}`,
    }
  }
}
