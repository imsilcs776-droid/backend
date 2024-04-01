import { FilterQuery } from 'mongoose';
import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';
import { VirtualAgregate } from 'src/modules/virtual/interfaces/virtual-agregate.interface';
import { Virtual } from 'src/modules/virtual/interfaces/virtual.interface';
import { Switcher } from '../switcher/switcher';
import { Adapter } from './adapter';

export class QueryBuilder implements Adapter {
  private client;
  private credential: CredentialDTO;
  constructor(credential) {
    this.credential = credential;
  }

  private async getConnection() {
    if (!this.client) {
      this.client = this.credential.service;
    }

    return this.client;
  }

  async getDatabases() {
    return [{ name: this.credential.name }];
  }

  async getEntities(dbname?: string) {
    const connection = await this.getConnection();
    const filter: FilterQuery<Virtual> = {
      deletedAt: { $eq: null },
    };
    const virtuals = await connection.findAll(filter);
    const results = virtuals.map((virtual) => ({ name: virtual.name }));

    return results;
  }

  async getProperties(dbname?: string, entity?: string) {
    const connection = await this.getConnection();

    const filter: FilterQuery<Virtual> = {
      deletedAt: { $eq: null },
      name: { $eq: entity },
    };
    const [virtualTable] = await connection.findAll(filter);

    if (!virtualTable) throw 'wrong table name';

    const virtual: VirtualAgregate = await connection.findCompleteAggregationEX(
      virtualTable.id,
    );

    if (!virtual) throw new Error("virtual doesn't exist");

    const switcher = new Switcher(virtual);
    switcher.injectWith(connection);
    const results = await switcher.doPopulate();
    const properties = results.headers.map((header) => header.field);
    return properties;
  }

  async getDataOfEntity(dbname: string, entity?: string) {
    const connection = await this.getConnection();

    const filter: FilterQuery<Virtual> = {
      deletedAt: { $eq: null },
      name: { $eq: entity },
    };

    const [virtualTable] = await connection.findAll(filter);
    if (!virtualTable) throw 'wrong table name';

    const virtual: VirtualAgregate = await connection.findCompleteAggregationEX(
      virtualTable.id,
    );
    if (!virtual) throw new Error("virtual doesn't exist");

    const switcher = new Switcher(virtual);
    switcher.injectWith(connection);
    const results = await switcher.doPopulate();

    return results;
  }

  async generateQuery(dbname?: string, entity?: string, query?: any) {
    try {
      const connection = await this.getConnection();

      const filter: FilterQuery<Virtual> = {
        deletedAt: { $eq: null },
        name: { $eq: entity },
      };
      const [virtualTable] = await connection.findAll(filter);

      if (!virtualTable) throw 'wrong table name';

      const virtual: VirtualAgregate =
        await connection.findCompleteAggregationEX(virtualTable.id);

      if (!virtual) throw new Error("virtual doesn't exist");

      
      const switcher = new Switcher(virtual);
      switcher.injectWith(connection);
      let results = await switcher.doPopulate();

      /**
       * @TODO sould be make query
       */
      results.data = results.data.map((result) => {
        const keys = Object.keys(result);
        const newResult = {};
        keys.forEach((key) => {
          newResult[`${entity}_${key}`] = result[key];
        });

        return newResult;
      });

      return {
        data: results.data,
        success: true,
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }
}
