export class TelevisionsService {
  constructor(
    private readonly televisionItemService: any
  ) {}
  
  async findAll(
    findAllTelevisionDto: any
  ) {
    try {
      const {
        pagination,
        limit,
        filterBy,
        search,
        companyId,
        plantId,
        tierId,
        subTierId
      } = findAllTelevisionDto;

      let filter: any = {
        company: { _eq: companyId }
      };
      
      if(plantId) filter.plant = { _eq: plantId };
      if(tierId) filter.tier = { _eq: tierId };
      if(subTierId) filter.sub_tier = { _eq: subTierId };
      if (filterBy) filter[filterBy] = { _contains: search }

      const televisions = await this.televisionItemService.readByQuery({
        fields: ["*", "*.*"],
        filter,
        limit: limit || undefined,
        offset: limit && pagination > 0 ? (Number(pagination) - 1) * limit : 0 || undefined
      });

      return televisions;
    } catch (error) {
      throw error;
    }
  }
}