import { ImportProcessor } from "./import.processor";
import { readFileSync, unlink } from "fs";
import * as ExcelHelper from "xlsx";

export class ImportsService {
  constructor(
    private readonly importProcessor: ImportProcessor,
    private readonly queue: any
  ) { }

  async plant(companyId: number, plantId: number, filePath: string) {
    const buf = readFileSync(filePath);

    const { Sheets } = ExcelHelper.read(buf);

    unlink(filePath, () => { });

    const outline = {
      redisKey: 'mes-redis',
      topic: 'plant',
      progress: 0,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };
    
    if (Sheets) {
      try {
        this.queue.process('plant', async (job: any, done: () => void) => {
          try {
            await this.importProcessor.plant(job);
            done();
          } catch (e) {
            throw e;
          }
        });

        await this.queue.add('plant', {
          companyId,
          plantId,
          sheets: Sheets,
          outline,
        }, {
          attempts: 3,
          // removeOnComplete: true,
          removeOnFail: true,
        });
      } catch (e: any) {
        return {
          success: false,
          message: e.message || e,
          data: null
        }
      }

      return {
        success: true,
        message: 'Data is processing successfully.',
        data: outline,
      };
    } else {
      return {
        success: false,
        message: 'Data is not loaded. Check the file, please.',
        data: null,
      };
    }
  }

  async organization(companyId: number, plantId: number, filePath: string) {

    const buf = readFileSync(filePath);

    const { Sheets } = ExcelHelper.read(buf);

    unlink(filePath, () => { });
    
    const outline = {
      redisKey: 'mes-redis',
      topic: 'organization',
      progress: 0,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    if (Sheets) {
      try {
        this.queue.process('organization', async (job: any, done: () => void) => {
          try {
            await this.importProcessor.organization(job);
            done();
          } catch (e) {
            throw e;
          }
        });

        await this.queue.add('organization', {
          companyId,
          plantId,
          sheets: Sheets,
          outline,
        }, {
          attempts: 3,
          // removeOnComplete: true,
          removeOnFail: true,
        });
      } catch (e: any) {
        return {
          success: false,
          message: e.message || e,
          data: null
        }
      }

      return {
        success: true,
        message: 'Data is processing successfully.',
        data: outline,
      };
    } else {
      return {
        success: false,
        message: 'Data is not loaded. Check the file, please.',
        data: null,
      };
    }
  }

  async subscribe(topic: string) {
    let data: any = await this.importProcessor.subscribe(topic);

    if (data) {
      data = JSON.parse(data)
      return {
        success: true,
        message: 'Getting detail successfully.',
        ...data
      }
    } else {
      return {
        success: false,
        message: 'Data not found.',
        data: null
      }
    }
  }
}