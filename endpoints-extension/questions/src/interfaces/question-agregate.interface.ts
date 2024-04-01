import { Filter as FilterVirtual } from "./virtual-agregate.interface";

export interface Column {
  property: string;
  as: string;
  entity: string;
  database: string;
  datasource_id: number;
  isShown: boolean;
}

export interface Table {
  virtual_id: number;
  name: string;
  columns: Column[];
}

export interface Group {
  datasource_id: number;
  database: string;
  entity: string;
  property: string;
  as: string;
}

export interface Summarize {
  datasource_id: number;
  database: string;
  entity: string;
  property: string;
  as: string;
  summary: string;
}

export interface Filter extends FilterVirtual {
  as: string;
}

export interface Sort {
  datasource_id: number;
  database: string;
  entity: string;
  property: string;
  as: string;
  order: string;
}

export interface QuestionAgregate {
  name: string;
  table: Table;
  filters: Filter[];
  sorts: Sort[];
  summarizes: Summarize[];
  groups: Group[];
  limit: number;
  id?: string;
}