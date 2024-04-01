import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';
import { Client, types } from 'pg';
import { Adapter } from './adapter';

export class Postgre implements Adapter {
  private client: Client;
  private credential: CredentialDTO;
  constructor(credential: CredentialDTO) {
    this.credential = credential;
  }

  private async getConnection(): Client {
    if (!this.client) {
      this.client = new Client({
        host: this.credential.host,
        port: this.credential.port,
        database: this.credential.database
          ? this.credential.database
          : 'postgres',
        user: this.credential.username,
        password: this.credential.password,
      });
      types.setTypeParser(20, (val) => parseInt(val));
    }

    return this.client;
  }

  async getDatabases() {
    const connection: Client = await this.getConnection();
    await connection.connect();
    const results = await (
      await connection.query(
        'SELECT datname as name FROM pg_database WHERE datistemplate = false',
      )
    ).rows;

    await connection.end();

    return results;
  }
  async getEntities(dbname?: string) {
    const connection: Client = await this.getConnection();
    connection.connectionParameters.database = dbname;
    await connection.connect();
    const results = await (
      await connection.query(
        `SELECT table_name as name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
      )
    ).rows;

    await connection.end();

    return results;
  }
  async getProperties(dbname?: string, entity?: string) {
    const connection: Client = await this.getConnection();
    connection.connectionParameters.database = dbname;
    await connection.connect();
    const results = await (
      await connection.query(
        'SELECT column_name as name FROM information_schema.columns WHERE table_name = $1',
        [entity],
      )
    ).rows;

    await connection.end();

    return results.map((result) => result.name);
  }

  async getDataOfEntity(dbname: string, entity?: string) {
    const connection = await this.getConnection();
    connection.connectionParameters.database = dbname;
    await connection.connect();

    const results = await connection
      .query(`SELECT * FROM "${entity}"`)
      .then((res) => res.rows)
      .catch((e) => {
        throw e;
      });

    await connection.end();

    return results;
  }

  async generateQuery(dbname?: string, entity?: string, query?: any) {
    try {
      const connection: Client = await this.getConnection();
      connection.connectionParameters.database = dbname
        ? dbname
        : connection.connectionParameters.database;
      await connection.connect();

      const results = await connection
        .query(`${query}`)
        .then((res) => res.rows)
        .catch((e) => {
          throw e;
        });

      await connection.end();

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
