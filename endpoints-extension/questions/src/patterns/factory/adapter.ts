export interface Adapter {
  getDatabases(): any;
  getEntities(dbname?: string): any;
  getProperties(dbname?: string, entity?: string): any;
  getDataOfEntity(dbname?: string, entity?: string): any;
  generateQuery(
    dbname?: string,
    entity?: string,
    query?: any,
  ): { data?: any; success: boolean; message?: string } | any;
}
