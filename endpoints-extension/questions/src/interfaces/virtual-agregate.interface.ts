export interface Property {
  is_key: boolean;
  is_shown: boolean;
  name: string;
  as: string;
}

export interface Additional {
  auth_db: string;
}

export interface Credential {
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
  dialect: string;
  additional: Additional;
  id: number;
  database: string;
  service: any;
}

export interface Datasource {
  database: string;
  entity: string;
  is_primary: boolean;
  properties: Property[];
  id: number;
  credential_id: number;
  credential?: Credential;
}

export interface Include {
  label: string;
  property: string;
  as: string;
  entity: string;
  database: string;
  datasource_id: number;
}

export interface Left {
  datasource_id: number;
  property: string;
  // database: string;
  // entity: string;
}

export interface Right {
  datasource_id: number;
  property: string;
  // database: string;
  // entity: string;
}

export interface Join {
  type: string;
  left: Left;
  right: Right;
}

/**
 * @TODO : check if nessesary
 *   database?: string;
 *   entity?: string;
 */
export interface Filter {
  datasource_id: number;
  database?: string;
  entity?: string;
  property: string;
  operator: string;
  value: string;
}

export interface VirtualAgregate {
  joins: Join[];
  datasources: Datasource[];
  id: number;
  includes: Include[];
  filters: Filter[];
}
