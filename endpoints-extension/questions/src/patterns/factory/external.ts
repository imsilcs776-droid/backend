import { Adapter } from './adapter';
import Axios from 'axios';
import * as https from 'https';
import { CredentialDTO } from '../../dto/credential.dto';


export class External implements Adapter {
  private data: any;
  private credential: CredentialDTO;
  HttpClient = Axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false,
    }),
  });


  constructor(credential: CredentialDTO) {
    this.credential = credential;
  }

  private async getConnection() {
    if (!this.data) {


      const uri =  this.credential.host;
      const headers = {
        Authorization:
          `Bearer ${this.credential.additional.auth_db}`,
      }
      const result = await this.HttpClient.get(uri, {headers});

    }

    return this.data;
  }

  async getDatabases() {
    await this.getConnection();
    return [{ name: this.credential.name }];
  }

  async getEntities(dbname?: string) {
    await this.getConnection();
    return [{ name: this.credential.name }];
  }

  async getProperties(dbname?: string, entity?: string) {
    const connection = await this.getConnection();

    if (!connection || !connection.data) throw new Error("external data imcopatible");
    if (connection.data instanceof Array && connection.data.length) {
      return Object.keys(connection.data[0])
    }
  }

  async getDataOfEntity(dbname: string, entity?: string) {
    const connection = await this.getConnection();

    if (!connection || !connection.data) throw new Error("external data imcopatible");

    return connection.data;
  }

  async generateQuery(dbname?: string, entity?: string, query?: any) {
    try {
      const connection = await this.getConnection();

      if (!connection || !connection.data) throw new Error("external data imcopatible");
  
      let results = connection.data;

      /**
       * @TODO sould be make query
       */
      results.data = results.data.map((result: { [x: string]: any; }) => {
        const keys = Object.keys(result);
        const newResult: any = {};
        keys.forEach((key) => {
          newResult[`${entity}_${key}`] = result[key];
        });

        return newResult;
      });

      return {
        data: results.data,
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
