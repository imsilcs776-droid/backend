import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';
import { Adapter } from './adapter';
import { Database } from './database';
import { Mssql } from './mssql';

export class MssqlAdapter implements Database {
  private adapter: Adapter;
  getDatasource(credential: CredentialDTO): Adapter {
    if (!this.adapter) {
      this.adapter = new Mssql(credential);
    }

    return this.adapter;
  }
}
