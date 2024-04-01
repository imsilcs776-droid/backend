import { Sort } from './generator/sql/sort-sql';

export interface Filter {
  property: string;
  operator: string;
  value: string;
  entity: string;
}

export interface DataSource {
  credentialId: string;
  database: string;
  entity: string;
  id: string;
  isPrimary: boolean;
  properties: {
    as: string;
    isKey: boolean;
    isShown: boolean;
    name: string;
  }[];
  filters?: Filter[];
}

export interface Sumarize {
  datasourceId: string;
  database: string;
  entity: string;
  property: string;
  as: string;
  summary: string | 'AVERAGE' | 'COUNT' | 'SUM';
  alias: string;
}

export interface Group {
  datasourceId: string;
  database: string;
  entity: string;
  property: string;
  as: string;
  alias: string;
}

export interface ConfigParameterSingle {
  sources?: DataSource[];
  joins?: any[];
  shown?: boolean;
  limit?: number;
  sorts?: Sort[];
  summarizes?: Sumarize[];
  groups?: Group[];
}

export interface ConfigParameterMulty {
  database?: string;
  sources?: DataSource[];
  joins?: any[];
  limit?: number;
  sorts?: Sort[];
  summarizes?: Sumarize[];
  groups?: Group[];
}
