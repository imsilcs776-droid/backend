export enum SourceTypes {
  SINGLE_CREDENCIAL__SINGLE_DATABASE__SINGLE_TABLE = 'SINGLE_CREDENCIAL__SINGLE_DATABASE__SINGLE_TABLE',
  SINGLE_CREDENCIAL__SINGLE_DATABASE__MULTY_TABLE = 'SINGLE_CREDENCIAL__SINGLE_DATABASE__MULTY_TABLE',
  SINGLE_CREDENCIAL__MULTY_DATABASE__MULTY_TABLE = 'SINGLE_CREDENCIAL__MULTY_DATABASE__MULTY_TABLE',
  MULTY_CREDENCIAL = 'MULTY_CREDENCIAL',
}

export class Source {
  type: SourceTypes | any;

  constructor(sources:any = [], credentials:any = [], databases:any = []) {
    if (sources.length == 1) {
      this.type = SourceTypes.SINGLE_CREDENCIAL__SINGLE_DATABASE__SINGLE_TABLE;
    } else if (
      /**
       * single credetial
       * single database
       * multi source
       * can use single query
       */
      credentials.length == 1 &&
      sources.length > 1 &&
      databases.length == 1
    ) {
      this.type = SourceTypes.SINGLE_CREDENCIAL__SINGLE_DATABASE__MULTY_TABLE;
    } else if (
      /**
       * single credetial
       * multy database
       * multi source
       * can use single query
       */
      credentials.length == 1 &&
      sources.length > 1 &&
      databases.length > 1
    ) {
      this.type = SourceTypes.SINGLE_CREDENCIAL__MULTY_DATABASE__MULTY_TABLE;
    } else if (credentials.length > 1 && sources.length > 1) {
      /**
       * multy credetial
       * multy database
       * multy source
       */
      this.type = SourceTypes.MULTY_CREDENCIAL;
    }
  }
}
