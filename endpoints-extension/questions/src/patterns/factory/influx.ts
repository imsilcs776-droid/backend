import { Adapter } from './adapter';
import * as client from 'influx';
import { CredentialDTO } from '../../dto/credential.dto';

export class Influx implements Adapter {
  private client;
  private credential: CredentialDTO;
  constructor(credential: CredentialDTO) {
    this.credential = credential;
  }

  private async getConnection() {
    if (!this.client) {
      this.client = new client.InfluxDB({
        database: this.credential.database,
        host: this.credential.host,
        port: Number(this.credential.port),
        username: this.credential.username,
        password: this.credential.password,
      });
    }

    return this.client;
  }

  async getDatabases() {
    const connection = await this.getConnection();
    const results = await connection.getDatabaseNames().then((databases: any[]) => {
      if (databases instanceof Array && databases.length) {
        return databases.map((database) => ({
          name: database,
        }));
      }

      return [];
    });

    return results;
  }
  async getEntities(dbname?: string) {
    const connection = await this.getConnection();
    const results = await connection.getMeasurements().then((entities: any[]) => {
      if (entities instanceof Array && entities.length) {
        return entities.map((entity) => ({
          name: entity,
        }));
      }
      return [];
    });

    return results;
  }

  async getProperties(dbname: string, entity?: string) {
    const connection = await this.getConnection();

    const results = await connection
      .query(`SELECT * FROM ${entity} LIMIT 1`)
      .then((data: string | any[]) => {
        if (data instanceof Array && data.length) {
          return Object.keys(data[0]);
        }
        return [];
      });

    return results;
  }

  async getDataOfEntity(dbname: string, entity?: string) {
    const connection = await this.getConnection();

    const results = await connection.query(`SELECT * FROM ${entity} LIMIT 100`);

    return results;
  }

  async generateQuery(dbname: string = '', entity: string = '', query?: any) {
    try {
      const connection = await this.getConnection();

      const results = await await connection.query(`${query}`);

      return {
        data: results,
        success: true,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message,
      };
    }
  }
}
