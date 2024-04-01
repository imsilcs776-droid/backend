export default {
  getItem: async (body: any): Promise<any> => {
    const { req, ItemsService, name, params } = body || {}
    const approveOrder = new ItemsService(name, {
      schema: req.schema,
      accountability: req.accountability,
    })

    return (await approveOrder.readByQuery(params)) || []
  },

  getUser: async (body: any): Promise<any> => {
    const { req, UsersService } = body || {}
    const usersService = new UsersService({
      schema: req.schema,
      accountability: req.accountability,
    })

    return await usersService.readOne(req.accountability.user)
  },
  getMeta: async (body: any): Promise<any> => {
    const { req, MetaService, name, params } = body || {}
    const metaService = new MetaService({
      schema: req.schema,
      accountability: req.accountability,
    })

    return await metaService.getMetaForQuery(name, params)
  },
}
