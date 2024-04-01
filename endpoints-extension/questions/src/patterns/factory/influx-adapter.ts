
import { CredentialDTO } from '../../dto/credential.dto';
import { Adapter } from './adapter';
import { Database } from './database';
import { Influx } from './influx';

export class InfluxAdapter implements Database {
  private adapter: Adapter | undefined;
  getDatasource(credential: CredentialDTO): Adapter {
    if (!this.adapter) {
      this.adapter = new Influx(credential);
    }
    return this.adapter;
  }
}
