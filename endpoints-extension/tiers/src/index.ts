import { Body, Context, Endpoint, Get, Param, Patch, Post, Query, Req, Res } from "@mv-data-core/decorator";

@Endpoint("tiers")
export default class DefineEndpoint {
  @Get(
    { path: "", tag: "Tier" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "category",
          schema: {
            type: "string",
            enum: ["TIER", "SUB-TIER"],
          },
        },
        {
          in: "query",
          name: "companyId",
          schema: {
            type: "number",
          },
        },
        {
          in: "query",
          name: "plantId",
          schema: {
            type: "number",
          },
        },
        {
          in: "query",
          name: "limit",
          schema: {
            type: "number",
          },
        },
        {
          in: "query",
          name: "page",
          schema: {
            type: "number",
          },
        },
      ],
    }
  )
  async getAll(
    @Req() req: any,
    @Context() context: any,
    @Query("category") category: string,
    @Query("companyId") companyId: number,
    @Query("plantId") plantId: number,
    @Query("limit") limit: number,
    @Query("page") page: number
  ) {
    const {
      services: { ItemsService },
    } = context;
    const tierService = new ItemsService("tiers", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const filter: {
      [key: string]: {
        _eq?: string | number;
        _null?: boolean;
      };
    } = {
      deleted_at: {
        _null: true,
      },
    };
    if (category) filter.category = { _eq: category };
    if (companyId) filter.company = { _eq: companyId };
    if (plantId) filter.plant = { _eq: plantId };
    const tiers = await tierService.readByQuery({
      fields: [
        "id",
        "name",
        "company",
        "plant",
        "sub_tiers.id",
        "sub_tiers.name",
        "sub_tiers.company",
        "sub_tiers.plant.id",
        "sub_tiers.plant.name",
        "sub_tiers.plant.code",
        "sub_tiers.plant.description",
        "is_active",
        "plant.id",
        "plant.name",
        "plant.code",
        "plant.description",
        "reference.id",
        "reference.name",
        "reference.company",
        "reference.plant.id",
        "reference.plant.name",
        "reference.plant.code",
        "reference.plant.description",
      ],
      filter,
      page: page || undefined,
      limit: limit || undefined,
    });
    const countTiers = await tierService.readByQuery({
      fields: ["*"],
      filter,
      aggregate: {
        count: ["id"],
      },
    });
    const count = countTiers[0].count.id;
    const meta = {
      count,
      total_page: Math.ceil(count / limit),
      current_page: page,
      limit,
    };
    return {
      success: true,
      data: tiers,
      meta,
    };
  }

  @Post(
    { path: "", tag: "Tier" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          companyId: {
            type: "number",
          },
          plantId: {
            type: "number",
          },
          name: {
            type: "string",
          },
          category: {
            type: "string",
          },
          order: {
            type: "number",
          },
          // referenceId: {
          //   type: "number",
          // },
          parentId: {
            type: "number",
          },
          counter: {
            type: "number",
          },
        },
      },
    }
  )
  async create(@Req() req: any, @Context() context: any, @Body() body: unknown) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException, InvalidPayloadException },
    } = context;
    const { companyId, plantId, name, category, counter, parentId } = body as {
      companyId: number;
      plantId: number;
      name: string;
      category: string;
      referenceId: number;
      counter: number;
      parentId: number;
    };
    let { order } = body as { order: number };
    const tierService = new ItemsService("tiers", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const now = new Date();
    const { user: userId } = req.accountability;
    if (counter) {
      const tierCounter = await tierService.readByQuery({
        aggregate: {
          count: ["id"],
        },
        filter: {
          company: { _eq: companyId },
          plant: { _eq: plantId },
          deleted_at: { _null: true },
        },
      });

      let reference = null;
      const lastCount: number = tierCounter[0].count.id;
      for (let index = 1; index <= counter; index++) {
        const nextCounter = index + lastCount;
        const payload: {
          company: number;
          plant: number;
          name: string;
          category: string;
          order: number;
          reference: number;
          created_at: Date;
          updated_at: Date;
          created_by: string;
        } = {
          company: companyId,
          plant: plantId,
          name: `Tier ${nextCounter}`,
          order: nextCounter,
          reference: reference || null,
          category: "TIER",
          created_at: now,
          updated_at: now,
          created_by: userId,
        };
        const tierId = await tierService.createOne(payload);
        reference = tierId || null;
      }
      return {
        success: true,
        message: "Creating tier successfully.",
        data: null,
      };
    } else if (category && category.toUpperCase() == "TIER") {
      const [findTier] = await tierService.readByQuery({
        filter: {
          reference: { _eq: null },
          deleted_at: { _null: true },
        },
      });
      order = findTier ? findTier.order + 1 : 0;
      const tierId = await tierService.createOne({
        company: companyId,
        plant: plantId,
        name,
        category,
        order,
        created_at: now,
        updated_at: now,
        created_by: userId,
      });
      if (tierId && findTier) {
        await tierService.updateOne(findTier.id, {
          reference: tierId,
        });
        return {
          success: true,
          message: "Creating tier successfully.",
          data: null,
        };
      }
      throw new ServiceUnavailableException("Failed to create tier.");
    } else if (category && category.toUpperCase() == "SUB-TIER") {
      await tierService.createOne({
        company: companyId,
        plant: plantId,
        name,
        category,
        order,
        created_at: now,
        updated_at: now,
        created_by: userId,
        parentId,
      });
      return {
        success: true,
        message: "Creating subtier successfully.",
        data: null,
      };
    }
    throw new InvalidPayloadException("Invalid payload.");
  }

  @Post(
    { path: "/reset", tag: "Tier" },
    {
      responses: [
        {
          200: {
            description: "Description",
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
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          company_id: {
            type: "number",
          },
          plant_id: {
            type: "number",
          },
        },
      },
    }
  )
  async reset(@Req() req: any, @Context() context: any, @Body() body: unknown) {
    const {
      services: { ItemsService },
    } = context;
    const { company_id, plant_id } = body as {
      company_id: number;
      plant_id: number;
    };
    const tierService = new ItemsService("tiers", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const filter: { _and: any[] } = { _and: [] };

    if (company_id) filter._and.push({ company: { _eq: company_id } });
    if (plant_id) filter._and.push({ plant: { _eq: plant_id } });

    await tierService.updateByQuery(
      {
        filter,
      },
      {
        deleted_at: new Date(),
      }
    );

    return {
      success: true,
      message: "Reset tier successfully.",
    };
  }
}
