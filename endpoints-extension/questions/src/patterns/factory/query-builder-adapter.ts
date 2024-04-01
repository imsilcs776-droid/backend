import { CredentialDTO } from 'src/modules/credential/dto/credential.dto';
import { Adapter } from './adapter';
import { Database } from './database';
import { QueryBuilder } from './query-builder';

export class QueryBuilderAdapter implements Database {
  private adapter: Adapter;
  getDatasource(credential: CredentialDTO): Adapter {
    if (!this.adapter) {
      this.adapter = new QueryBuilder(credential);
    }
    return this.adapter;
  }
}
