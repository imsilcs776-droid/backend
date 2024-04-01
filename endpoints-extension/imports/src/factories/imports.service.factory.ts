import { ImportsService } from "../imports.service"
import { importsProcessorFactory } from "./import.processor.factory"

export const importsServiceFactory = (ItemsService: any, MetaService: any, RedisService: any, BullService: any, req: any, env: any) => {
  const importProcessor = importsProcessorFactory(ItemsService, MetaService, RedisService, req);

  const bull = new BullService("mes-import", { redis: { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD, username: env.REDIS_USERNAME } });
  const queue = bull.getQueue();

  return new ImportsService(importProcessor, queue)
}