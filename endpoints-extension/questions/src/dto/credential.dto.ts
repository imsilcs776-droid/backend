export interface CredentialDTO {
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  dialect: string;
  service: any;
  // eslint-disable-next-line @typescript-eslint/ban-types
  additional: {
    auth_db: string
  };
}
