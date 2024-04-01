export class MarkBaseDTO {
  company: number | undefined;
  feature: number | undefined;
  is_complete: boolean | undefined;
  additional: object | undefined;
  created_by: number | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  deleted_at: Date | undefined;
}

export interface MarkRegenerateDTO {
  company: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
}
