import { CredentialDTO } from '../../dto/credential.dto';
import { Adapter } from './adapter';
import { Database } from './database';
import { External } from './external';

export class ExternalAdapter implements Database {
  private adapter: Adapter | undefined;
  getDatasource(credential: CredentialDTO): Adapter {
    if (!this.adapter) {
      this.adapter = new External(credential);
    }
    return this.adapter;
  }
}
