import { Body, Context, Endpoint, Get, Param, Patch, Post, Req, Res } from "@mv-data-core/decorator";

@Endpoint('marks')
export default class DefineEndpoint {
  @Post(
    { path: "/re-generate", tag: "Mark" },
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
        properties: {
          company: {
            type: "number",
          },
        },
      },
    }
  )
  async create(
    @Req() req: any,
    @Context() context: any,
    @Body() body: any
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = context;

    const productService = new ItemsService("products", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const markService = new ItemsService("marks", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const productFeatureService = new ItemsService("product_features", {
      schema: req.schema,
      accountability: req.accountability,
    });
    
    try {
      const { company } = body;
      let product: any = null;

      if (company) {
        const filter: any = {};

        filter.company = { _eq: +company };

        const data = await markService.readByQuery({
          filter,
        });

        const products = await productService.readByQuery({
          filter: {
            code: { _eq: 'MES' },
          },
        });
        [product] = products;

        if (product) {
          const productFeatures = await productFeatureService.readByQuery({
            filter: {
              product: { _eq: product.id },
            }
          });
          
          for (const item of productFeatures) {
            const [filterMark] = data.filter((dt: any) => dt.feature === item.feature);
            if (filterMark) continue;
            const markBaseDTO: any = {};
            markBaseDTO.company = company;
            markBaseDTO.feature = item.feature;
            await markService.createOne(markBaseDTO);
          }

          return {
            success: true,
            message: 'Data has been processing.',
            data: null,
          };
        } else {
          return {
            success: false,
            message: 'Data not found.',
            data: null,
          };
        }
      } else {
        return {
          success: false,
          message: 'Data not found.',
          data: null,
        };
      }
    } catch (e) {
      const error = e as Error;
      console.log(e);
      return new ServiceUnavailableException(error.message ?? error);
    }
  }
}
