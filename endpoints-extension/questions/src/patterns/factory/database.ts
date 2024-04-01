import { CredentialDTO } from '../../dto/credential.dto';
import { Adapter } from './adapter';

export interface Database {
  getDatasource(credential: CredentialDTO): Adapter;
}
