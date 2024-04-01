import { Body, Context, Endpoint, Get, Param, Post, Query, Req, Res } from "@mv-data-core/decorator";
import { ApiExtensionContext, PrimaryKey } from "@mv-data-core/shared/types";

const DATA_TYPE_MAPPING: Record<string, string> = {
  int: "integer",
  integer: "integer",
  real: "integer",
  "int unsigned": "integer",
  "tinyint unsigned": "integer",
  year: "integer",
  "smallint unsigned": "integer",
  "mediumint unsigned": "integer",
  tinyint: "integer",
  smallint: "integer",
  mediumint: "integer",

  uuid: "uuid",
  uniqueidentifier: "uuid",

  datetime2: "datetime",
  datetimeoffset: "datetime",
  datetime: "datetime",
  "timestamp without time zone": "datetime",
  "timestamp with time zone": "datetime",
  timestamp: "datetime",

  nvarchar: "string",
  varchar: "string",
  "character varying": "string",
  text: "string",
  char: "string",
  longtext: "string",
  enum: "string",
  mediumtext: "string",
  nchar: "string",
  varchar2: "string",
  tinytext: "string",
  varbinary: "string",

  boolean: "boolean",
  bit: "boolean",

  double: "double",
  decimal: "double",

  float: "float",

  bigint: "bigInteger",
  "bigint unsigned": "bigInteger",

  date: "date",

  time: "time",
  "time without time zone": "time",

  json: "json",
  // "geometry",
};

@Endpoint("databases")
export default class DefineEndpoint {
  @Get(
    { path: "/test/:id", tag: "Databases", description: "Test connection from defined credential" },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "id",
          in: "path",
          description: "Credential ID",
          required: true,
          schema: {
            type: "number",
          },
        }
      ]
    }
  )
  async testConnection(@Req() req: any, @Context() context: ApiExtensionContext, @Param("id") id: number) {
    const {
      services: { ItemsService, DatabaseService },
      exceptions: { ServiceUnavailableException, NotFoundException },
    } = context;

    const credentialService = new ItemsService("credentials", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [credential] = await credentialService.readByQuery({
      filter: {
        id: {
          _eq: id,
        },
      },
      fields: ["name", "host", "port", "username", "password", "database", "dialect.code"],
    });

    if (!credential) throw new NotFoundException("Credential not found");

    const availableDialects = ["mysql", "pg", "mongodb", "mssql"];

    if (!availableDialects.includes(credential.dialect?.code)) throw new ServiceUnavailableException("Dialect cant available right now");

    const db = new DatabaseService({
      config: {
        dbClient: credential.dialect.code,
        dbHost: credential.host,
        dbPort: credential.port,
        dbUser: credential.username,
        dbPassword: credential.password,
      },
    });

    const isConnected = await db.testConnection();

    if (credential.dialect?.code !== "mongodb") await db.destroy();

    return {
      success: isConnected,
    };
  }

  @Post(
    { path: "/test", tag: "Databases", description: 'Test connection from given credential' },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          dialectCode: {
            type: "string",
          },
          host: {
            type: "string",
          },
          port: {
            type: "integer",
          },
          username: {
            type: "string",
          },
          password: {
            type: "string",
          },
        },
      },
    }
  )
  async testConnectionRaw(@Context() context: ApiExtensionContext, @Body() body: any) {
    const {
      services: { DatabaseService },
      exceptions: { ServiceUnavailableException },
    } = context;

    const credential: {
      dialectCode: string;
      host: string;
      port: number;
      username: string;
      password: string;
    } = body;

    const availableDialects = ["mysql", "pg", "mongodb", "mssql"];

    if (!availableDialects.includes(credential.dialectCode)) throw new ServiceUnavailableException("Dialect cant available right now");

    const db = new DatabaseService({
      config: {
        dbClient: credential.dialectCode,
        dbHost: credential.host,
        dbPort: credential.port,
        dbUser: credential.username,
        dbPassword: credential.password,
      },
    });

    const isConnected = await db.testConnection();

    if (credential.dialectCode !== "mongodb") await db.destroy();

    return {
      success: isConnected,
    };
  }

  @Get(
    { path: "/:id", tag: "Databases", description: 'Get Database list from defined credential' },
    {
      responses: [
        {
          200: {
            description: "Response get array of object Database",
            responseType: "array",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "id",
          in: "path",
          description: "Credential ID",
          required: true,
          schema: {
            type: "number",
          },
        }
      ]
    }
  )
  async getDatabasesFromCredential(@Req() req: any, @Res() @Context() context: ApiExtensionContext, @Param("id") id: number) {
    const {
      services: { ItemsService, DatabaseService },
      exceptions: { ServiceUnavailableException, NotFoundException },
    } = context;

    const credentialService = new ItemsService("credentials", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [credential] = await credentialService.readByQuery({
      filter: {
        id: {
          _eq: id,
        },
      },
      fields: ["name", "host", "port", "username", "password", "database", "dialect.code"],
    });

    if (!credential) throw new NotFoundException("Credential not found");

    const availableDialects = ["mysql", "pg", "mongodb", "mssql"];

    if (!availableDialects.includes(credential.dialect?.code)) throw new ServiceUnavailableException("Dialect cant available right now");

    const db = new DatabaseService({
      config: {
        dbClient: credential.dialect.code,
        dbHost: credential.host,
        dbPort: credential.port,
        dbUser: credential.username,
        dbPassword: credential.password,
      },
    });

    const databases = await db.getDatabases();

    if (credential.dialect?.code !== "mongodb") await db.destroy();

    return {
      success: true,
      data: databases,
    };
  }

  @Get(
    { path: "/:id/:databaseName", tag: "Databases", description: 'Get Tables list from defined credential' },
    {
      responses: [
        {
          200: {
            description: "Response get array of object Tables",
            responseType: "array",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "id",
          in: "path",
          schema: {
            type: "number",
          },
          description: "Id of credential",
          required: true,
        },
        {
          name: "databaseName",
          in: "path",
          schema: {
            type: "string",
          },
          description: "Database Name",
          required: true,
        },
        {
          name: "isDetail",
          in: "query",
          schema: {
            type: "boolean",
            enum: ["true", "false"]
          },
        },
      ],
    }
  )
  async getTablesFromCredential(
    @Req() req: any,
    @Res() @Context() context: ApiExtensionContext,
    @Param("id") id: number,
    @Param("databaseName") databaseName: string,
    @Query("isDetail") isDetail: boolean
  ) {
    const {
      services: { ItemsService, DatabaseService },
      exceptions: { ServiceUnavailableException, NotFoundException },
    } = context;

    const credentialService = new ItemsService("credentials", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [credential] = await credentialService.readByQuery({
      filter: {
        id: {
          _eq: id,
        },
      },
      fields: ["name", "host", "port", "username", "password", "database", "dialect.code"],
    });

    if (!credential) throw new NotFoundException("Credential not found");

    const availableDialects = ["mysql", "pg", "mongodb", "mssql"];

    if (!availableDialects.includes(credential.dialect?.code)) throw new ServiceUnavailableException("Dialect cant available right now");

    const db = new DatabaseService({
      config: {
        dbClient: credential.dialect.code,
        dbHost: credential.host,
        dbPort: credential.port,
        dbUser: credential.username,
        dbPassword: credential.password,
        dbDatabase: databaseName,
      },
    });

    const tables = isDetail ? await db.getTablesInfo(databaseName) : await db.getTables(databaseName);

    if (credential.dialect?.code !== "mongodb") await db.destroy();

    return {
      success: true,
      data: tables,
    };
  }

  @Get(
    { path: "/:id/:databaseName/:tableName", tag: "Databases", description: 'Get Column list from defined credential' },
    {
      responses: [
        {
          200: {
            description: "Response get array of object Column",
            responseType: "array",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "id",
          in: "path",
          schema: {
            type: "number",
          },
          description: "Id of credential",
          required: true
        },
        {
          name: "databaseName",
          in: "path",
          schema: {
            type: "string",
          },
          description: "Database Name",
          required: true
        },
        {
          name: "tableName",
          in: "path",
          schema: {
            type: "string",
          },
          description: "Table Name",
          required: true
        },
        {
          name: "isDetail",
          in: "query",
          schema: {
            type: "boolean",
            enum: ["true", "false"]
          },
        },
      ],
    }
  )
  async getColumnsFromCredential(
    @Req() req: any,
    @Res() @Context() context: ApiExtensionContext,
    @Param("id") id: number,
    @Param("databaseName") databaseName: string,
    @Param("tableName") tableName: string,
    @Query("isDetail") isDetail: boolean
  ) {
    const {
      services: { ItemsService, DatabaseService },
      exceptions: { ServiceUnavailableException, NotFoundException },
    } = context;

    const credentialService = new ItemsService("credentials", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [credential] = await credentialService.readByQuery({
      filter: {
        id: {
          _eq: id,
        },
      },
      fields: ["name", "host", "port", "username", "password", "database", "dialect.code"],
    });

    if (!credential) throw new NotFoundException("Credential not found");

    const availableDialects = ["mysql", "pg", "mongodb", "mssql"];

    if (!availableDialects.includes(credential.dialect?.code)) throw new ServiceUnavailableException("Dialect cant available right now");

    const db = new DatabaseService({
      config: {
        dbClient: credential.dialect.code,
        dbHost: credential.host,
        dbPort: credential.port,
        dbUser: credential.username,
        dbPassword: credential.password,
        dbDatabase: databaseName,
      },
    });

    const columns = isDetail ? await db.getColumnsInfo(tableName) : await db.getColumns(tableName);

    if (credential.dialect?.code !== "mongodb") await db.destroy();

    return {
      success: true,
      data: columns,
    };
  }

  @Post(
    { path: "/:id", tag: "Databases", description: "Migrate Database" },
    {
      responses: [
        {
          200: {
            description: "Migrate Database",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                ids: {
                  type: "array",
                  items: {
                    type: "string",
                  }
                },
                message: {
                  type: "string",
                }
              }
            }
          },
        },
      ],
      parameters: [
        {
          name: "id",
          in: "path",
          schema: {
            type: "number",
          },
          description: "Id of credential",
          required: true
        }
      ],
      request: {
        type: "object",
        properties: {
          excludedDatabases: {
            type: "array",
            items: {
              type: "string",
            }
          },
          includedDatabases: {
            type: "array",
            items: {
              type: "string",
            }
          }
        }
      }
    }
  )
  async migrateDbase(@Req() req: any, @Context() context: ApiExtensionContext, @Param("id") id: number, @Body() body: any) {
    const {
      services: { ItemsService, DatabaseService },
      exceptions: { ServiceUnavailableException, NotFoundException },
    } = context;

    let {
      excludedDatabases,
      includedDatabases,
    }: {
      excludedDatabases: string[];
      includedDatabases: string[];
    } = body;

    if (!excludedDatabases) excludedDatabases = [];
    if (!includedDatabases) includedDatabases = [];

    const credentialService = new ItemsService("credentials", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [credential] = await credentialService.readByQuery({
      filter: {
        id: {
          _eq: id,
        },
      },
      fields: ["name", "host", "port", "username", "password", "database", "dialect.code"],
    });

    if (!credential) throw new NotFoundException("Credential not found");

    const availableDialects = ["mysql", "pg", "mongodb", "mssql"];

    if (!availableDialects.includes(credential.dialect?.code)) throw new ServiceUnavailableException("Dialect cant available right now");

    let db = new DatabaseService({
      config: {
        dbClient: credential.dialect.code,
        dbHost: credential.host,
        dbPort: credential.port,
        dbUser: credential.username,
        dbPassword: credential.password,
      },
    });

    const databases: { name: string }[] = await db.getDatabases();

    // destroy current connection because there are new connection with new database name
    await db.destroy();

    const collectionService = new ItemsService("directus_collections", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const fieldService = new ItemsService("directus_fields", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const relationService = new ItemsService("directus_relations", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const ids: PrimaryKey[] = [];
    for (const { name: databaseName } of databases) {
      const collectionDatas = [];
      if (includedDatabases.length && !includedDatabases.includes(databaseName)) continue;
      if (!excludedDatabases.includes(databaseName)) {
        db = new DatabaseService({
          config: {
            dbClient: credential.dialect.code,
            dbHost: credential.host,
            dbPort: credential.port,
            dbUser: credential.username,
            dbPassword: credential.password,
            dbDatabase: databaseName,
          },
        });
        const tables = await db.getTablesInfo(databaseName);
        console.log({
          databaseName,
          tables,
        });

        let tableData: {
          primaryKey?: string;
          name: string;
          columns: any[];
          relations: {
            many_collection?: string;
            many_field?: string;
            one_collection?: string;
            one_field?: string;
          }[];
        };

        for (const { name: tableName, primaryKey } of tables) {
          const fields = [];
          const columns = await db.getColumnsInfo(tableName);
          tableData = {
            primaryKey,
            name: tableName,
            columns,
            relations: [],
          };

          const collectionName = `${id}|${databaseName}|${tableName}`;

          const payload = {
            collection: collectionName,
            is_external_source: true,
            credential: id,
            schema: "public",
            tags: ["migrated-data"],
            database_name: databaseName,
            physical_table_name: tableName,
          };
          collectionDatas.push(payload);

          for (const column of columns) {
            const { data_type, name: columnName, foreign_key_table, foreign_key_column } = column;

            if (foreign_key_table && foreign_key_column) {
              tableData.relations.push({
                many_collection: tableName,
                many_field: columnName,
                one_collection: foreign_key_table,
                one_field: foreign_key_column,
              });
            }

            const convertedDataType = DATA_TYPE_MAPPING[data_type] || data_type;

            fields.push({
              is_external_source: true,
              field: columnName,
              collection: collectionName,
              data_type: convertedDataType,
              special: columnName == primaryKey ? "primary" : null,
            });
          }

          await fieldService.createMany(fields);
          await relationService.createMany(tableData.relations);
        }

        await db.destroy();
        const createdCollections: PrimaryKey[] = await collectionService.createMany(collectionDatas);
        ids.push(...createdCollections);
      }
    }

    return {
      success: true,
      ids,
      message: `Successfully migrated ${ids.length} collections`,
    };
  }

  @Get(
    { path: "/imported/:id", tag: "Databases", description: "Get Imported Database list" },
    {
      responses: [
        {
          200: {
            description: "Response get array of imported database",
            responseType: "array",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "id",
          in: "path",
          description: "Credential id",
          required: true,
          schema: {
            type: "number",
          },
        },
      ],
    }
  )
  async getImportedDatabases(@Req() req: any, @Context() context: ApiExtensionContext, @Param("id") id: number) {
    const {
      services: { ItemsService },
      exceptions: { NotFoundException },
      database,
    } = context;

    const credentialService = new ItemsService("credentials", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [credential] = await credentialService.readByQuery({
      filter: {
        id: {
          _eq: id,
        },
      },
      fields: ["id"],
    });

    if (!credential) throw new NotFoundException("Credential not found");

    const existingDbases = await database("directus_collections")
      .select(database.raw("database_name as name"))
      .distinctOn("database_name")
      .where({
        is_external_source: true,
        credential: id,
      });

    return {
      success: true,
      data: existingDbases,
    };
  }

  @Get(
    { path: "/imported/:id/:databaseName", tag: "Databases", description: "Get Imported table list" },
    {
      responses: [
        {
          200: {
            description: "Response get array of imported Table",
            responseType: "array",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "id",
          in: "path",
          description: "Credential id",
          required: true,
          schema: {
            type: "number",
          },
        },
        {
          name: "databaseName",
          in: "path",
          description: "Database name",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
    }
  )
  async getImportedTables(
    @Req() req: any,
    @Context() context: ApiExtensionContext,
    @Param("id") id: number,
    @Param("databaseName") databaseName: string
  ) {
    const {
      services: { ItemsService },
      exceptions: { NotFoundException },
      database,
    } = context;

    const credentialService = new ItemsService("credentials", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [credential] = await credentialService.readByQuery({
      filter: {
        id: {
          _eq: id,
        },
      },
      fields: ["id"],
    });

    if (!credential) throw new NotFoundException("Credential not found");

    const existingTableNames = await database("directus_collections").select(database.raw("physical_table_name as name")).where({
      is_external_source: true,
      credential: id,
      database_name: databaseName,
    });

    return {
      success: true,
      data: existingTableNames,
    };
  }

  @Get(
    { path: "/imported/:id/:databaseName/:tableName", tag: "Databases", description: "Get Imported column list" },
    {
      responses: [
        {
          200: {
            description: "Response get array of imported Column",
            responseType: "array",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: {
                        type: "string",
                      },
                      data_type: {
                        type: "string",
                      },
                      special: {
                        type: "string",
                      }
                    },
                  },
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "id",
          in: "path",
          description: "Credential id",
          required: true,
          schema: {
            type: "number",
          },
        },
        {
          name: "databaseName",
          in: "path",
          description: "Database name",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          name: "tableName",
          in: "path",
          description: "Table name",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
    }
  )
  async getImportedColumns(
    @Req() req: any,
    @Context() context: ApiExtensionContext,
    @Param("id") id: number,
    @Param("databaseName") databaseName: string,
    @Param("tableName") tableName: string
  ) {
    const {
      services: { ItemsService },
      exceptions: { NotFoundException },
      database,
    } = context;

    const credentialService = new ItemsService("credentials", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [credential] = await credentialService.readByQuery({
      filter: {
        id: {
          _eq: id,
        },
      },
      fields: ["id"],
    });

    if (!credential) throw new NotFoundException("Credential not found");

    const collection = `${id}|${databaseName}|${tableName}`;

    const existingTableColumns = await database("directus_fields").select(["field", "data_type", "special"]).where({
      is_external_source: true,
      collection,
    });

    return {
      success: true,
      data: existingTableColumns,
    };
  }
}
