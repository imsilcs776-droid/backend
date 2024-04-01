export interface Adapter {
  getDatabases();
  getEntities(dbname?: string);
  getProperties(dbname?: string, entity?: string);
  getDataOfEntity(dbname?: string, entity?: string);
  generateQuery(
    dbname?: string,
    entity?: string,
    query?: any,
  ): { data?: any; success: boolean; message?: string } | any;
}
  