import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';
import { Adapter } from './adapter';
import { Database } from './database';
import { Mysql } from './mysql';

export class MysqlAdapter implements Database {
  private adapter: Adapter;
  getDatasource(credential: CredentialDTO): Adapter {
    if (!this.adapter) {
      this.adapter = new Mysql(credential);
    }

    return this.adapter;
  }
}
