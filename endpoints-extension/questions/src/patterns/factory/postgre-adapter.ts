import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';
import { Adapter } from './adapter';
import { Database } from './database';
import { Postgre } from './postgre';

export class PostgreAdapter implements Database {
  private adapter: Adapter;
  getDatasource(credential: CredentialDTO): Adapter {
    if (!this.adapter) this.adapter = new Postgre(credential);
    return this.adapter;
  }
}
