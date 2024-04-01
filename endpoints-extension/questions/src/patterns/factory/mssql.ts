import { Adapter } from './adapter';
import * as client from 'mssql';
import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';

export class Mssql implements Adapter {
  private client;
  private credential: CredentialDTO;
  constructor(credential: CredentialDTO) {
    this.credential = credential;
  }

  private async getConnection() {
    if (!this.client) {
      this.client = await client.connect({
        database: this.credential.database,
        server: this.credential.host,
        user: this.credential.username,
        password: this.credential.password,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
        options: {
          encrypt: false,
          trustServerCertificate: true, // change to true for local dev / self-signed certs
        },
      });
    }

    return this.client;
  }

  async getDatabases() {
    const connection = await this.getConnection();

    let results = await connection
      .request()
      .query(`SELECT name FROM master.dbo.sysdatabases`);

    return results.recordset;
  }

  async getEntities(dbname?: string) {
    const connection = await this.getConnection();

    let results = await connection
      .request()
      .query(
        `SELECT * FROM ${dbname}.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`,
      );

    const datas = results.recordset.map((record) => ({
      name: record.TABLE_NAME,
    }));

    return datas;
  }

  async getProperties(dbname: string, entity?: string) {
    const connection = await this.getConnection();

    let results = await connection
      .request()
      .query(
        `SELECT COLUMN_NAME FROM ${dbname}.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${entity}' ORDER BY ORDINAL_POSITION`,
      );

    const datas = results.recordset.map((record) => record.COLUMN_NAME);

    return datas;
  }

  async getDataOfEntity(dbname: string, entity?: string) {
    const connection = await this.getConnection();

    let results = await connection.request().query(`SELECT * FROM ${entity}`);

    const datas = results.recordset.map((record) => record);

    return datas;
  }

  async generateQuery(dbname: string = '', entity: string = '', query?: any) {
    try {
      this.credential.database = dbname;
      const connection = await this.getConnection();

      let results = await connection.request().query(`${query}`);

      return {
        data: results.recordset,
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
