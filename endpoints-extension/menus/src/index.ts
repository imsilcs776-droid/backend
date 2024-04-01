import { Context, Endpoint, Get, Query, Req } from "@mv-data-core/decorator";
import { menusServiceFactory } from "./factories/menus-service.factory";
import { findAllMenuPayload } from "./swagger-schemas/find-all/find-all-menu-payload.schema";
import { findAllMenuProperty } from "./swagger-schemas/find-all/find-all-menu-property.schema";

@Endpoint("menus")
export default class DefineEndpoint {
	@Get(findAllMenuProperty, findAllMenuPayload)
  async findAll(
    @Req() req: any,
		@Context() ctx: any,
    @Query('companyId') companyId: number,
    @Query('plantId') plantId: number,
    @Query('roleIds') roleIds: number[],
    @Query('dashboardId') dashboardId: number,
    @Query('clusterId') clusterId: number,
    @Query('categories') categories: string[],
    @Query('filterBy') filterBy: string,
    @Query('search') search: string,
    @Query('isActive') isActive: boolean,
    @Query('sortBy') sortBy: string,
    @Query('sortType') sortType: string,
    @Query('pagination') pagination: number,
    @Query('limit') limit: number, 
  ) {
    const {
			services: { ItemsService, MetaService },
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

    const menusService = menusServiceFactory(ItemsService, MetaService, req, accountability);

    return menusService.findAll({
      pagination,
      limit,
      filterBy,
      search,
      companyId,
      plantId,
      roleIds,
      dashboardId,
      clusterId,
      categories,
      isActive,
      sortBy,
      sortType
    });
  }
}