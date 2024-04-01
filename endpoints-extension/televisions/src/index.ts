import { Context, Endpoint, Get, Query, Req } from "@mv-data-core/decorator";
import { televisionsServiceFactory } from "./factories/televisions-service.factory";
import { findAllTelevisionPayload } from "./swagger-schemas/find-all/find-all-television-payload.schema";
import { findAllTelevisionProperty } from "./swagger-schemas/find-all/find-all-television-property.schema";

@Endpoint("televisions")
export default class DefineEndpoint {
	@Get(findAllTelevisionProperty, findAllTelevisionPayload)
  async findAll(
    @Req() req: any,
		@Context() ctx: any,
    @Query('pagination') pagination: number,
    @Query('limit') limit: number,
    @Query('filterBy') filterBy: string,
    @Query('search') search: string,
    @Query('companyId') companyId: number,
    @Query('plantId') plantId: number,
    @Query('tierId') tierId: number,
    @Query('subTierId') subTierId: number,
  ) {
    const {
			services: { ItemsService },
      env
		} = ctx;

    const {
      ADMIN_ID,
      ADMIN_ROLE,
    } = env;

    const accountability = {
      user: ADMIN_ID,
      role: ADMIN_ROLE,
      admin: true,
      app: true,
      ip: '::1',
      userAgent: 'System/1.0.0',
      share: undefined,
      share_scope: undefined,
      permissions: []
    };

    const televisionsService = televisionsServiceFactory(ItemsService, req, accountability);

    return televisionsService.findAll({
      pagination,
      limit,
      filterBy,
      search,
      companyId,
      plantId,
      tierId,
      subTierId
    });
  }
}