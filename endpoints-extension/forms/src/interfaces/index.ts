export interface IForm {
  id: number;
  user_created: string;
  user_updated: string;
  code: string;
  title: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
  created_by: string;
  active_version: string;
  active_version_code: string;
  tags: string[];
  categories: string[];
  versions: IFormVersion[];
}

interface IFormVersion {
  id: string;
  code: string;
  draftable: boolean;
  stepMode: boolean;
  stepCounter: number;
  conditions: any[];
  form: number;
  attachments: any[];
  sections: IFormSection[];
}

interface IFormSection {
  id: string;
  order: number;
  title: string;
  description: string;
  version: string;
  attachments: any[];
  fields: IFormField[];
}

interface IFormField {
  id: string;
  name: string;
  identifier:
    | "long-text"
    | "range-time"
    | "camera-based"
    | "check-box"
    | "number"
    | "timer"
    | "file-image-upload"
    | "date-time-picker"
    | "range-date"
    | "time-picker"
    | "text"
    | "drop-down"
    | "date-time-range"
    | "multiple-choice"
    | "scale-input"
    | "date-picker";
  properties: {
    isData: boolean;
    decorator: {
      appendIcon: string;
      autofocus: boolean;
      dense: boolean;
      label: string;
      placeholder: string;
      prependIcon: string;
      prefix: string;
      autogrow: boolean;
      columns: number;
      min?: number;
      max?: number;
      itemText: "";
      itemValue: "";
      items?: {text: string, value: string}[];
    };
    textEditor: {
      size: string;
      style: string;
      align: string;
    };
    validator: {
      enabled: boolean;
      required: boolean;
    };
    inputTime: {
      enabled: boolean;
    };
    tool: {
      id: string;
    };
    help: {
      enabled: boolean;
      image: string;
      description: string;
    };
    remarks: {
      enabled: boolean;
    };
    dragable: boolean;
    autohide: boolean;
    identifier:
      | "long-text"
      | "range-time"
      | "camera-based"
      | "check-box"
      | "number"
      | "timer"
      | "file-image-upload"
      | "date-time-picker"
      | "range-date"
      | "time-picker"
      | "text"
      | "drop-down"
      | "date-time-range"
      | "multiple-choice"
      | "scale-input"
      | "date-picker";
  };
  section: string;
  parameter: any;
  datatype: "textarea" | "json" | "file" | "boolean" | "number" | "string" | "datetime" | "options" | "date";
}

export interface IDirectusField {
  field: string;
  type: string;
  meta: {
    hidden?: boolean;
    readonly?: boolean;
    interface: string;
    special?: string[] | null;
    width?: string;
    display?: string;
    display_options?: { relative: boolean };
    options?: {
      template?: string;
      placeholder?: string;
      clear?: boolean;
      label?: string;
      min?: number;
      max?: number;
      includeSeconds?: boolean;
      choices?: {text: string, value: string}[],
      allowNone?: boolean;
      minValue?: number;
      maxValue?: number;
      stepInterval?: number;
    };
    required?: boolean;
  };
  schema: {
    is_primary_key?: boolean;
    length?: number;
    has_auto_increment?: boolean;
    default_value?: any;
  };
}

export interface IDirectusRelation {
  collection: string,
  field: string,
  meta?: { sort_field: string | null },
  related_collection: string,
  schema: {
    on_delete?: string,
  },
}

export interface FormMapDTO {
  id?: number;
  dependencies?: number[] | null;
}

