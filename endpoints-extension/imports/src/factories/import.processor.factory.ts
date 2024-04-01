import { ImportProcessor } from "../import.processor"

export const importsProcessorFactory = (ItemsService: any, MetaService: any, RedisService: any, req: any) => {
  const redisService = new RedisService();

  const areaItemService = new ItemsService("areas", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const sectorItemService = new ItemsService("sectors", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const lineItemService = new ItemsService("lines", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const processItemService = new ItemsService("processes", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const machineItemService = new ItemsService("machines", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const departmentItemService = new ItemsService("departments", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const jobItemService = new ItemsService("jobs", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const levelItemService = new ItemsService("levels", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const userItemService = new ItemsService("directus_users", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const restrictionItemService = new ItemsService("restrictions", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const statusItemService = new ItemsService("statuses", {
    schema: req.schema,
    accountability: req.accountability,
  });

  const metaService = new MetaService({
    schema: req.schema,
    accountability: req.accountability,
  });

  return new ImportProcessor(
    redisService,
    sectorItemService,
    areaItemService,
    lineItemService,
    processItemService,
    machineItemService,
    departmentItemService,
    jobItemService,
    levelItemService,
    userItemService,
    restrictionItemService,
    statusItemService,
    metaService
  )
}
