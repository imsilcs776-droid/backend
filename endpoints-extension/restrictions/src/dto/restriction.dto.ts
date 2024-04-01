export interface RestrictionBaseDTO {
  company: number;
  name: string;
  description: string;
  settings: object[];
  entity: string;
  created_by: number;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
}

export interface RestrictionRegenerateBaseDTO {
  company: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
}
