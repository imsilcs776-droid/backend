import { MongoClient } from 'mongodb';
import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';
import { Adapter } from './adapter';

export class Mongo implements Adapter {
  private credential: CredentialDTO;
  private client: MongoClient;
  constructor(credential: CredentialDTO) {
    this.credential = credential;
  }

  private async getConnection(): Promise<MongoClient> {
    if (!this.client) {
      let uri = '';
      if (this.credential.username) {
        uri = `mongodb://${this.credential.username}:${this.credential.password}@${this.credential.host}:${this.credential.port}/?authSource=admin&readPreference=primary&ssl=false`;
      } else {
        uri = `mongodb://${this.credential.host}:${this.credential.port}/?authSource=admin&readPreference=primary&ssl=false`;
      }
      this.client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    return this.client;
  }

  async getDatabases() {
    try {
      const connection: MongoClient = await this.getConnection();
      await connection.connect();
      const { databases } = await connection.db().admin().listDatabases();
      await connection.close();

      return databases;
    } catch (e) {
      throw e;
    }
  }
  async getEntities(dbname?: string) {
    const connection: MongoClient = await this.getConnection();
    await connection.connect();
    const results: any = await connection
      .db(dbname)
      .listCollections({}, { nameOnly: true })
      .toArray();
    await connection.close();

    return results;
  }

  async getProperties(dbname?: string, entity?: string) {
    const connection: MongoClient = await this.getConnection();
    await connection.connect();
    const datum: any[] = await connection
      .db(dbname)
      .collection(entity)
      .find()
      .toArray();
    const results = Object.keys(datum[datum.length - 1]);
    await connection.close();

    return results;
  }

  async getDataOfEntity(dbname: string, entity?: string) {
    const connection: MongoClient = await this.getConnection();
    await connection.connect();

    const pipelines: any[] = [
      {
        $match: { deletedAt: { $eq: null } },
      },
    ];

    const datum: any[] = await connection
      .db(dbname)
      .collection(entity)
      .aggregate(pipelines)
      .toArray();
    await connection.close();

    return datum;
  }

  async generateQuery(dbname?: string, entity?: string, query?: any) {
    try {
      const connection: MongoClient = await this.getConnection();
      await connection.connect();
      const results: any[] = await connection
        .db(dbname)
        .collection(entity)
        .aggregate(query)
        .toArray();
      await connection.close();

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
