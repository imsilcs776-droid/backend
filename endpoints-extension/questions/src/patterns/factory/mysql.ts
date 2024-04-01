import { Adapter } from './adapter';
import * as client from 'mysql';
import * as util from 'util';
import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';

export class Mysql implements Adapter {
  private client;
  private credential: CredentialDTO;
  constructor(credential: CredentialDTO) {
    this.credential = credential;
  }
  getDataOfEntity(dbname?: string, entity?: string) {
    throw new Error('Method not implemented.');
  }

  private async getConnection() {
    console.log(this.credential);
    if (!this.client) {
      this.client = await client.createPool({
        database: this.credential.database,
        host: this.credential.host,
        user: this.credential.username,
        password: this.credential.password,
        connectionLimit: 10,
      });

      // Ping database to check for common exception errors.
      this.client.getConnection((err, connection) => {
        if (err) {
          if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
          }
          if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
          }
          if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
          }
        }

        if (connection) connection.release();

        return;
      });
    }

    // Promisify for Node.js async/await.
    this.client.query = util.promisify(this.client.query);

    return this.client;
  }

  async getDatabases() {
    const connection = await this.getConnection();

    let results = await connection.query(`SHOW DATABASES;`);

    const datas = results.map((record) => ({
      name: record.Database,
    }));

    return datas;
  }

  async getEntities(dbname?: string) {
    const connection = await this.getConnection();
    let results = await connection.query(`SHOW TABLES FROM ${dbname};`);

    const datas = results.map((record) => ({
      name: record[`Tables_in_${dbname}`],
    }));

    return datas;
  }

  async getProperties(dbname: string, tblname?: string) {
    const connection = await this.getConnection();

    let results = await connection.query(
      `SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${dbname}' AND TABLE_NAME = '${tblname}';`,
    );

    const datas = results.map((record) => record.COLUMN_NAME);

    return datas;
  }

  async generateQuery(dbname: string = '', tblname: string = '', query?: any) {
    try {
      this.credential.database = dbname;

      const connection = await this.getConnection();
      query = query.replace(/"/g, '`');

      let results = await connection.query(query);

      return {
        data: results,
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
