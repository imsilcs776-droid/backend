import {
  Context,
  Endpoint,
  Get,
  Param,
  Post,
  Req
} from "@mv-data-core/decorator";
import { Form } from "multiparty";
import { importsServiceFactory } from "./factories/imports.service.factory";
import { importOrgnizationPayload } from "./swagger-schemas/organization/import-organization-payload.schema";
import { importOrganizationProperty } from "./swagger-schemas/organization/import-organization-property.schema";
import { importPlantPayload } from "./swagger-schemas/plant/import-plant-payload.schema";
import { importPlantProperty } from "./swagger-schemas/plant/import-plant-property.schema";
import { subscribeImportPayload } from "./swagger-schemas/subscribe/subscribe-import-payload.schema";
import { subscribeImportProperty } from "./swagger-schemas/subscribe/subscribe-import-property.schema";

const DIRECTORY = './uploads';

@Endpoint('import')
export default class DefineEndpoint {
  @Post(importPlantProperty, importPlantPayload)
  async plant(
    @Req() req: any,
    @Param('companyId') companyId: number,
    @Param('plantId') plantId: number,
		@Context() ctx: any,
  ) {
    const promisifyUpload = (req: any) => new Promise((resolve, reject) => {
      const form = new Form({
        autoFiles: true,
        uploadDir: DIRECTORY
      });
  
      form.parse(req, async function (err, fields, files) {
        if (err) {
          return reject(err);
        }
  
        const {
          services: { ItemsService, MetaService, RedisService, BullService },
        } = ctx;
        
        const importsService = importsServiceFactory(ItemsService, MetaService, RedisService, BullService, req, process.env);
  
        const importedPlant = await importsService.plant(companyId, plantId, files.file[0].path);

        return resolve(importedPlant);
      });
    });

    const importedPlant = await promisifyUpload(req);

    return importedPlant;
  }

  @Post(importOrganizationProperty, importOrgnizationPayload)
  async organization(
    @Req() req: any,
    @Param('companyId') companyId: number,
    @Param('plantId') plantId: number,
		@Context() ctx: any,
  ) {
    const promisifyUpload = (req: any) => new Promise((resolve, reject) => {
      const form = new Form({
        autoFiles: true,
        uploadDir: DIRECTORY
      });
  
      form.parse(req, async function (err, fields, files) {
        if (err) {
          return reject(err);
        }
  
        const {
          services: { ItemsService, MetaService, RedisService, BullService },
        } = ctx;
  
        const importsService = importsServiceFactory(ItemsService, MetaService, RedisService, BullService, req, process.env);

        const importedOrganization = await importsService.organization(companyId, plantId, files.file[0].path);

        return resolve(importedOrganization);
      });
    });

    const importedOrganization = await promisifyUpload(req);

    return importedOrganization;
  }

  @Get(subscribeImportProperty, subscribeImportPayload)
  async subscribe(@Param('topic') topic: string, @Context() ctx: any, @Req() req: any) {
    const {
      services: { ItemsService, MetaService, RedisService, BullService },
    } = ctx;

    const importsService = importsServiceFactory(ItemsService, MetaService, RedisService, BullService, req, process.env);

    return importsService.subscribe(topic);
  }
}
