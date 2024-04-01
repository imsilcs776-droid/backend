import { Context, Endpoint, Get, Query, Req } from "@mv-data-core/decorator";
import { conditionServiceFactory } from "./factories/condition-service.factory";
import { findAllConditionPayload } from "./swagger-schemas/find-all/find-all-condition-payload.schema";
import { findAllConditionProperty } from "./swagger-schemas/find-all/find-all-condition-property.schema";

@Endpoint("conditions")
export default class DefineEndpoint {
	@Get(findAllConditionProperty, findAllConditionPayload)
  async findAll(
    @Req() req: any,
		@Context() ctx: any,
    @Query('businessId') businessId: number,
    @Query('activityId') activityId: number,
    @Query('type') type: string,
    @Query('filterBy') filterBy: string,
    @Query('search') search: string,
    @Query('pagination') pagination: number,
    @Query('limit') limit: number,
  ) {
    const {
			services: { ItemsService },
      database
		} = ctx;

    const conditionsService = conditionServiceFactory(ItemsService, database, req);

    const findAllConditionDto = {
      businessId,
      activityId,
      type,
      filterBy,
      search,
      pagination,
      limit,
    }

    return conditionsService.findAll(findAllConditionDto);
  }
}