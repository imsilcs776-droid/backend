import { FindAllMenuDto } from "./dto/find-all-menu.dto";

export class MenusService {
  constructor(
    private readonly menuItemsService: any,
    private readonly metaService: any,
  ) { }

  async findAll(
    findAllMenuDto: FindAllMenuDto
  ) {
    const {
      companyId,
      dashboardId,
      plantId,
      roleIds,
      clusterId,
      categories,
      filterBy,
      isActive,
      search,
      sortBy,
      sortType,
      limit,
      pagination
    } = findAllMenuDto;

    try {
      let filter: any = {};

      if (companyId) filter.company = { _eq: Number(companyId) };
      if (dashboardId) filter.dashboards = { dashboards_id: { _eq: Number(dashboardId) } };
      if (plantId) filter.plants = { plants_id: { _eq: Number(plantId) } };
      if (roleIds && roleIds instanceof Array) {
        filter.roles = { roles_id: { _in: roleIds.map(Number) } }
      } else if (roleIds) {
        filter.roles = { roles_id: { _eq: Number(roleIds) } }
      }

      if (clusterId) filter.cluster = { _eq: Number(clusterId) };
      if (companyId) filter.company = { _eq: Number(companyId) };
      isActive
        ? filter.is_active = { _eq: String(isActive) == 'true' ? true : false }
        : null;

      if (filterBy) {
        filter[filterBy] = { _contains: search }
      }
      if (categories) {
        if (categories instanceof Array) {
          filter._or = categories.map(category => {
            return { categories: { _contains: category } }
          });
        } else {
          filter.categories = { _contains: categories };
        }
      }

      let sort;
      if (sortBy) {
        sort = sortType === 'ASC' ? [sortBy] : [`-${sortBy}`];
      } else {
        sort = ['-created_at'];
      }

      const options = {
        fields: ["*", "dashboards.*.*", "roles.*.*", "plants.*.*"],
        filter,
        limit: limit || undefined,
        page: pagination || undefined,
        sort,
        meta: ['count', 'total_page', 'current_page', 'limit']
      };

      let [
        data,
        meta
      ] = await Promise.all([
        this.menuItemsService.readByQuery(options),
        this.metaService.getMetaForQuery("menus", options)
      ])

      // if (categories) {
      //   data = data.filter((dt: any) => {
      //     let isContain = false;

      //     dt.categories.forEach((dataCategory: any) => {
      //       if (categories instanceof Array) {
      //         categories.forEach(category => {
      //           if (dataCategory === category) {
      //             isContain = true;
      //           }
      //         });
      //       } else if (dataCategory === categories) {
      //         isContain = true;
      //       }
      //     })

      //     return isContain;
      //   })
      // }

      return {
        success: true,
        message: "Success",
        data,
        meta
      }
    } catch (error) {
      throw error;
    }
  }
}