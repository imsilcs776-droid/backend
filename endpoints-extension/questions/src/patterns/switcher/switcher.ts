import {
  Group,
  Sort,
  Summarize,
  Filter as FilterQuestion,
  QuestionAgregate,
} from '../../interfaces/question-agregate.interface';
import {
  Datasource,
  Filter,
  Include,
  Join,
  VirtualAgregate,
} from '../../interfaces/virtual-agregate.interface';
import { Dialect } from 'src/utils/constants/dialect';
import { Population } from 'src/utils/population';
import { QueryTool } from 'src/utils/query';
import { CredentialDTO } from '../../dto/credential.dto';
import { Adapter } from '../factory/adapter';
import { ExternalAdapter } from '../factory/external-adapter';
import { InfluxAdapter } from '../factory/influx-adapter';
import { MongoAdapter } from '../factory/mongo-adapter';
import { MssqlAdapter } from '../factory/mssql-adapter';
import { PostgreAdapter } from '../factory/postgre-adapter';
import { QueryBuilderAdapter } from '../factory/query-builder-adapter';
import { Source, SourceTypes } from './source';

export class Switcher {
  public datasources: Datasource[] = [];
  public joins: Join[] = [];
  public includes: Include[] = [];
  public filters: Filter[] = [];

  public tables: any[] = [];
  public sorts: any[] = [];
  public summarizes: any[] = [];
  public groups: any[] = [];
  public limit: number = 0;

  private service: any;

  constructor(public virtual: VirtualAgregate) {
    this.datasources = this.virtual.datasources;
    this.joins = this.virtual.joins;
    this.includes = this.virtual.includes;
    this.filters = this.virtual.filters;

    this.datasources = this.datasources
      .filter(
        (datasource) =>
          /**
           * remove unjoin datasource
           */
          this.joins.some(
            (join) =>
              join.left.datasource_id == datasource.id ||
              join.right.datasource_id == datasource.id,
          ) || datasource.is_primary,
      )
      .map((datasource) => {
        const filtersOfSource = this.filters.filter(
          (filter) => filter.datasource_id === datasource.id,
        );
        return { ...datasource, ...{ filters: filtersOfSource } };
      });
  }

  public async injectWith(service: any) {
    this.service = service;
  }

  public async doPopulate() {
    const credentialIds: number[] = [
      ...new Set(this.datasources.map((datasource) => datasource.credential_id)),
    ];
    const databaseIds: number[] = [
      ...new Set(this.datasources.map((datasource) => datasource.id)),
    ];
    const source = new Source(this.datasources, credentialIds, databaseIds);

    // console.log(source.type, credentialIds, databaseIds, this.datasources);

    switch (source.type) {
      case SourceTypes.SINGLE_CREDENCIAL__SINGLE_DATABASE__SINGLE_TABLE:
        return await this.getSingleCredentialSingleDatabaseSingleTable();

      case SourceTypes.SINGLE_CREDENCIAL__SINGLE_DATABASE__MULTY_TABLE:
        return await this.getSingleCredentialSingleDatabaseMultyTable();

      case SourceTypes.SINGLE_CREDENCIAL__MULTY_DATABASE__MULTY_TABLE:
        return await this.getSingleCredentialMultyDatabaseMultyTable();

      case SourceTypes.MULTY_CREDENCIAL:
        return await this.getMultyCredential();

      default:
        throw new Error('data error');
    }
  }

  public doAddSetting(question: QuestionAgregate) {
    const {
      limit,
      sorts,
      groups = [],
      summarizes = [],
      filters = [],
    } = (question as {
      filters: FilterQuestion[];
      sorts: Sort[];
      summarizes: Summarize[];
      groups: Group[];
      limit: number;
    }) || {};

    filters.forEach((filter) => {
      this.filters.push(filter);
    });

    this.limit = limit;
    this.sorts = sorts;
    this.groups = groups;
    this.summarizes = summarizes;
  }

  private async getSingleCredentialSingleDatabaseSingleTable() {
    let adapter: Adapter;
    let query: any;

    const [{ credential, database, entity }] = this.datasources as any[];

    switch (credential.dialect) {
      case Dialect.POSTGRES:
        adapter = new PostgreAdapter().getDatasource(
          credential as CredentialDTO,
        );
        query = QueryTool.prepareSingleSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      case Dialect.MSSQL:
        adapter = new MssqlAdapter().getDatasource(credential as CredentialDTO);
        query = QueryTool.prepareSingleSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      case Dialect.INFLUX:
        credential.database = database;
        adapter = new InfluxAdapter().getDatasource(
          credential as CredentialDTO,
        );
        query = QueryTool.prepareSingleSQLInflux({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      /**
       * @TODO change prepareSingleNoSQL
       */
      case Dialect.QUERY_BUILDER:
        credential.service = this.service;
        adapter = new QueryBuilderAdapter().getDatasource(
          credential as CredentialDTO,
        );
        query = QueryTool.prepareSingleNoSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      /**
       * @TODO change prepareSingleNoSQL
       */
      case Dialect.EXTERNAL:
        credential.service = this.service;
        adapter = new ExternalAdapter().getDatasource(
          credential as CredentialDTO,
        );
        query = QueryTool.prepareSingleNoSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      default:
        adapter = new MongoAdapter().getDatasource(credential as CredentialDTO);
        query = QueryTool.prepareSingleNoSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });

        break;
    }

    const results = await adapter.generateQuery(database, entity, query);

    if (!results.success) throw results.message;

    return Population.singleDatabase(
      results.data,
      this.datasources,
      this.includes,
    );
  }

  private async getSingleCredentialSingleDatabaseMultyTable() {
    let adapter: Adapter;
    let query: any;

    const { credential, database, entity } = (this.datasources.find(
      (datasource) => datasource.is_primary,
    )) as Datasource;

    switch (credential?.dialect) {
      case Dialect.POSTGRES:
        adapter = new PostgreAdapter().getDatasource(
          credential as CredentialDTO,
        );
        query = QueryTool.prepareSingleSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      case Dialect.MSSQL:
        adapter = new MssqlAdapter().getDatasource(credential as CredentialDTO);
        query = QueryTool.prepareSingleSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      case Dialect.INFLUX:
        credential.database = database;
        adapter = new InfluxAdapter().getDatasource(
          credential as CredentialDTO,
        );
        query = QueryTool.prepareSingleSQLInflux({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      /**
       * @TODO change prepareSingleNoSQL
       */
      case Dialect.QUERY_BUILDER:
        credential.service = this.service;
        adapter = new QueryBuilderAdapter().getDatasource(
          credential as CredentialDTO,
        );
        query = QueryTool.prepareSingleNoSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      /**
       * @TODO change prepareSingleNoSQL
       */
      case Dialect.EXTERNAL:
        credential.service = this.service;
        adapter = new ExternalAdapter().getDatasource(
          credential as CredentialDTO,
        );
        query = QueryTool.prepareSingleNoSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });
        break;

      default:
        adapter = new MongoAdapter().getDatasource(credential as CredentialDTO);
        query = QueryTool.prepareSingleNoSQL({
          sources: this.datasources,
          joins: this.joins,
          shown: true,
          limit: this.limit,
          sorts: this.sorts,
          groups: this.groups,
          summarizes: this.summarizes,
        });

        break;
    }

    const results = await adapter.generateQuery(database, entity, query);

    if (!results.success) throw results.message;

    return Population.singleDatabase(
      results.data,
      this.datasources,
      this.includes,
    );
  }

  private async getSingleCredentialMultyDatabaseMultyTable() {
    let adapter: Adapter;
    let query: any;

    const datas: any = [];
    const databaseNames = [
      ...new Set(this.datasources.map((datasource) => datasource.database)),
    ];

    for (const database of databaseNames) {
      const { credential, entity } = (this.datasources.find(
        (datasource) => datasource.is_primary && datasource.database == database,
      )) as Datasource;

      switch (credential?.dialect) {
        case Dialect.POSTGRES:
          adapter = new PostgreAdapter().getDatasource(
            credential as CredentialDTO,
          );
          query = QueryTool.prepareMultiSQL({
            database,
            sources: this.datasources,
            joins: this.joins,
          });
          break;

        case Dialect.MSSQL:
          adapter = new MssqlAdapter().getDatasource(
            credential as CredentialDTO,
          );
          query = QueryTool.prepareMultiSQL({
            database,
            sources: this.datasources,
            joins: this.joins,
          });
          break;

        case Dialect.INFLUX:
          credential.database = database;
          adapter = new InfluxAdapter().getDatasource(
            credential as CredentialDTO,
          );
          query = QueryTool.prepareSingleSQLInflux({
            sources: this.datasources,
            joins: this.joins,
            shown: true,
          });
          break;

        /**
         * @TODO change prepareSingleNoSQL
         */
        case Dialect.EXTERNAL:
          credential.service = this.service;
          adapter = new ExternalAdapter().getDatasource(
            credential as CredentialDTO,
          );
          query = QueryTool.prepareSingleSQLInflux({
            sources: this.datasources,
            joins: this.joins,
            shown: true,
          });
          break;

        /**
         * @TODO change prepareSingleNoSQL
         */
        case Dialect.QUERY_BUILDER:
          credential.service = this.service;
          adapter = new QueryBuilderAdapter().getDatasource(
            credential as CredentialDTO,
          );
          query = QueryTool.prepareSingleSQLInflux({
            sources: this.datasources,
            joins: this.joins,
            shown: true,
          });
          break;

        default:
          adapter = new MongoAdapter().getDatasource(
            credential as CredentialDTO,
          );
          query = QueryTool.prepareMultiNoSQL({
            database,
            sources: this.datasources,
            joins: this.joins,
          });
          break;
      }

      const results = await adapter.generateQuery(database, entity, query);

      if (!results.success) throw results.message;

      datas.push(results.data);
    }

    /**
     * @TODO : add sort and limit
     */
    return Population.multipleDatabase(
      datas,
      this.datasources,
      this.joins,
      this.includes,
      this.summarizes,
      this.groups,
    );
  }

  private async getMultyCredential() {
    let adapter: Adapter;
    let query: any;

    const credentials = [
      ...new Set(this.datasources.map((datasource) => datasource.credential)),
    ];

    const container: any = {};
    for (const credential of credentials) {
      const datas: any = [];
      const filterSources = this.datasources.filter(
        (source) => source.credential_id == credential?.id,
      );
      const listSources = filterSources.map((source) => source.id);
      const filterJoins = this.joins.filter((join) => {
        return (
          listSources.includes(join.left.datasource_id) &&
          listSources.includes(join.right.datasource_id)
        );
      });
      const databases: any = (filterSources as any[])
        .map((source) => source.database)
        .reduce((acc, value) => {
          acc.includes(value) ? '' : acc.push(value);
          return acc;
        }, []);

      for (const database of databases) {
        const [{ entity }] = (filterSources.filter(
          (source) => source.is_primary && source.database == database,
        )) as any[];

        switch (credential?.dialect) {
          case Dialect.POSTGRES:
            adapter = new PostgreAdapter().getDatasource(
              credential as CredentialDTO,
            );
            query =
              databases.length == 1
                ? QueryTool.prepareSingleSQL({
                    sources: filterSources,
                    joins: filterJoins,
                    shown: false,
                  })
                : QueryTool.prepareMultiSQL({
                    database,
                    sources: filterSources,
                    joins: this.joins,
                  });
            break;

          case Dialect.MSSQL:
            adapter = new MssqlAdapter().getDatasource(
              credential as CredentialDTO,
            );
            query =
              databases.length == 1
                ? QueryTool.prepareSingleSQL({
                    sources: filterSources,
                    joins: filterJoins,
                    shown: false,
                  })
                : QueryTool.prepareMultiSQL({
                    database,
                    sources: filterSources,
                    joins: this.joins,
                  });
            break;

          case Dialect.INFLUX:
            credential.database = database;
            adapter = new InfluxAdapter().getDatasource(
              credential as CredentialDTO,
            );
            query = QueryTool.prepareSingleSQLInflux({
              sources: filterSources,
              joins: this.joins,
              shown: true,
            });
            break;

          /**
           * @TODO change prepareSingleNoSQL
           */
          case Dialect.QUERY_BUILDER:
            credential.service = this.service;
            adapter = new QueryBuilderAdapter().getDatasource(
              credential as CredentialDTO,
            );
            query = QueryTool.prepareSingleSQLInflux({
              sources: this.datasources,
              joins: this.joins,
              shown: true,
            });
            break;

          /**
           * @TODO change prepareSingleNoSQL
           */
          case Dialect.EXTERNAL:
            credential.service = this.service;
            adapter = new ExternalAdapter().getDatasource(
              credential as CredentialDTO,
            );
            query = QueryTool.prepareSingleSQLInflux({
              sources: this.datasources,
              joins: this.joins,
              shown: true,
            });
            break;

          default:
            adapter = new MongoAdapter().getDatasource(
              credential as CredentialDTO,
            );
            query =
              databases.length == 1
                ? QueryTool.prepareSingleNoSQL({
                    sources: filterSources,
                    joins: filterJoins,
                    shown: false,
                  })
                : QueryTool.prepareMultiNoSQL({
                    database,
                    sources: filterSources,
                    joins: this.joins,
                  });
            break;
        }

        const results = await adapter.generateQuery(database, entity, query);

        if (!results.success) throw results.message;

        datas.push(results.data);
      }
      if (filterJoins.length > 0) {
        const { data } =
          databases.length == 1
            ? { data: datas.flat(1) }
            : Population.multipleDatabase(
                datas,
                filterSources,
                [],
                filterJoins,
              );
        container[`${credential?.id}`] = data;
      } else {
        container[`${credential?.id}`] = datas.flat(1);
      }
    }

    return Population.multipleCredential(
      container,
      this.datasources,
      this.joins,
      this.includes,
    );
  }
}
