import { QueryGeneratorNoSQL } from './generator/nosql/filter-nosql';
import { QueryGroupSummaryNoSQL } from './generator/nosql/group-and-summary-nosql';
import { QueryLimitNoSQL } from './generator/nosql/limit-nosql';
import { QuerySortNoSQL } from './generator/nosql/sort-nosql';
import { QuerySelectSQLInflux } from './generator/sql-influx/select-sql-influx';
import { QuerySortSQLInflux } from './generator/sql-influx/sort-sql-influx';
import { QueryWhereSQL } from './generator/sql/filter-sql';
import { QueryGroupBySQL } from './generator/sql/groupby-sql';
import { QueryLimitSQL } from './generator/sql/limit-sql';
import { QuerySelectSQL } from './generator/sql/select-sql';
import { QuerySortSQL } from './generator/sql/sort-sql';
import { QuerySummarySQL } from './generator/sql/summary-sql';
import { ConfigParameterMulty, ConfigParameterSingle } from './inteface';

export class QueryTool {
  public static prepareSingleSQL(params: ConfigParameterSingle) {
    const {
      sources,
      joins,
      shown,
      limit,
      sorts,
      summarizes,
      groups,
    }: ConfigParameterSingle = params;

    const [mainSource] = sources.filter((source) => source.isPrimary);
    const reduceJoins = joins.reduce((acc, value) => {
      const { left, right } = value;
      if (acc.indexOf(left.datasourceId) < 0) acc.push(left.datasourceId);
      if (acc.indexOf(right.datasourceId) < 0) acc.push(right.datasourceId);
      return acc;
    }, []);

    const sourceByReduceJoin = sources.filter((source) => {
      return reduceJoins > 0 ? reduceJoins.includes(`${source.id}`) : true;
    });

    const selection = sourceByReduceJoin.reduce((sourceAcc, source) => {
      const { entity, properties }: any = source;
      return properties
        .filter((pro) => pro.isShown || !shown)
        .reduce((proAcc, pro) => {
          const { name } = pro;
          proAcc.push(`"${entity}"."${name}" as "${entity}_${name}" `);
          return proAcc;
        }, sourceAcc);
    }, []);

    const entity: string = mainSource ? mainSource.entity : '';

    const joining = joins.reduce((acc, value) => {
      const { type, left, right } = value;

      console.log(sourceByReduceJoin);

      let { entity: leftTblname } = sourceByReduceJoin.find(
        (source) => String(source.id) == String(left.datasourceId),
      );
      const { entity: rightTblname } = sourceByReduceJoin.find(
        (source) => String(source.id) == String(right.datasourceId),
      );
      if (entity != rightTblname) {
        entity == leftTblname ? (leftTblname = `"${leftTblname}"`) : '';
        acc =
          acc +
          ` ${type.toUpperCase()}
                    JOIN (SELECT * FROM "${rightTblname}") as "${rightTblname}" ON ${leftTblname}."${
            left.property
          }" = "${rightTblname}"."${right.property}"`;
      }
      return acc;
    }, '');

    const whereQuery = QueryWhereSQL.generate(sourceByReduceJoin);
    const limitQuery = QueryLimitSQL.generate(limit);
    const sortQuery = QuerySortSQL.generate(sorts);
    const summaryQuery = QuerySummarySQL.generate(summarizes);
    const groupQuery = QueryGroupBySQL.generate(summarizes, groups);
    const selectQuery = QuerySelectSQL.generate(
      selection,
      summaryQuery,
      groups,
    );

    return `
      SELECT ${selectQuery}
      FROM "${entity}" ${joining} 
      ${whereQuery} 
      ${groupQuery}
      ${sortQuery} 
      ${limitQuery} 
      `;
  }

  public static prepareSingleVirtual(params: ConfigParameterSingle) {}

  public static prepareSingleSQLInflux(params: ConfigParameterSingle) {
    const {
      sources,
      joins,
      shown,
      limit,
      sorts,
      summarizes,
      groups,
    }: ConfigParameterSingle = params;

    const [mainSource] = sources.filter((source) => source.isPrimary);
    const reduceJoins = joins.reduce((acc, value) => {
      const { left, right } = value;
      if (acc.indexOf(left.datasourceId) < 0) acc.push(left.datasourceId);
      if (acc.indexOf(right.datasourceId) < 0) acc.push(right.datasourceId);
      return acc;
    }, []);

    const sourceByReduceJoin = sources.filter((source) => {
      return reduceJoins > 0 ? reduceJoins.includes(`${source.id}`) : true;
    });

    const selection = sourceByReduceJoin.reduce((sourceAcc, source) => {
      const { entity, properties }: any = source;
      return properties
        .filter((pro) => pro.isShown || !shown)
        .reduce((proAcc, pro) => {
          const { name } = pro;
          proAcc.push(`"${name}" as "${entity}_${name}" `);
          return proAcc;
        }, sourceAcc);
    }, []);

    const entity: string = mainSource ? mainSource.entity : '';

    const whereQuery = QueryWhereSQL.generate(sourceByReduceJoin);
    /**
     * TODO: FIX LIMIT
     */
    const limitQuery = QueryLimitSQL.generate(1000);
    const sortQuery = QuerySortSQLInflux.generate(sorts);
    const summaryQuery = QuerySummarySQL.generate(summarizes);
    // const groupQuery = QueryGroupBySQL.generate(summarizes, groups);
    const selectQuery = QuerySelectSQLInflux.generate(
      selection,
      summaryQuery,
      groups,
    );

    // console.log(params);

    // console.log(`
    // SELECT ${selectQuery}
    // FROM "${entity}"
    // ${whereQuery}
    // ${sortQuery}
    // ${limitQuery}
    // `);

    return `
      SELECT ${selectQuery}
      FROM "${entity}"
      ${whereQuery} 
      ${sortQuery} 
      ${limitQuery}
      `;
  }

  public static prepareSingleNoSQL(params: ConfigParameterSingle) {
    let queries = [];
    const {
      sources,
      joins,
      shown,
      limit,
      sorts,
      summarizes,
      groups,
    }: ConfigParameterSingle = params;
    const [mainSource] = sources.filter((source) => source.isPrimary);
    const mainTable: string = mainSource ? mainSource.entity : '';
    const selection = sources.reduce((sourceAcc, source) => {
      const { entity, properties } = source;
      return properties
        .filter((pro) => pro.isShown || !shown)
        .reduce((proAcc, pro) => {
          const { name, as } = pro;

          if (mainTable == entity) {
            proAcc[`${entity}_${name}`] = `$${name}`;
          } else if (joins.length > 0) {
            proAcc[`${entity}_${name}`] = `$${entity}.${name}`;
          }
          return proAcc;
        }, sourceAcc);
    }, {});

    const joining = joins.reduce((joinAcc, join) => {
      const { type, left, right } = join;
      const { entity: leftTblname } = sources.find(
        (obj) => obj.id == left.datasourceId,
      );
      const { entity: rightTblname } = sources.find(
        (obj) => obj.id == right.datasourceId,
      );
      if (leftTblname == mainTable) {
        if (
          left.property.toLowerCase().slice(left.property.length - 1) == 's'
        ) {
          left.property = `${left.property}.id`;
        }
        joinAcc.push({
          $lookup: {
            from: `${rightTblname}`,
            localField: `${left.property}`,
            foreignField: `${right.property}`,
            as: `${rightTblname}`,
          },
        });
      }
      return joinAcc;
    }, []);

    const matchQuery = QueryGeneratorNoSQL.generateWhereNoSQL(sources);
    const limitQuery = QueryLimitNoSQL.generate(limit);
    const sortQuery = QuerySortNoSQL.generate(sorts);
    const summaryAndGroup = QueryGroupSummaryNoSQL.generate(
      groups,
      summarizes,
      selection,
    );
    const summaryAndGroupProjection = QueryGroupSummaryNoSQL.generateProjection(
      groups,
      summarizes,
      selection,
    );

    queries.push(...joining);
    queries.push({ $project: selection });
    queries.push(matchQuery);
    queries.push(summaryAndGroup);
    queries.push(summaryAndGroupProjection);
    queries.push(limitQuery);
    queries.push(sortQuery);

    queries = queries.filter((query) => query);

    return queries;
  }

  public static prepareMultiSQL(params: ConfigParameterMulty) {
    const { database, sources, joins, limit, sorts }: ConfigParameterMulty =
      params;
    const filterSources = sources.filter(
      (source) => source.database == database,
    );
    const [mainSource] = filterSources.filter((source) => source.isPrimary);
    const entity = mainSource ? mainSource.entity : '';
    const listSources = filterSources.map((source) => String(source.id));
    const filterJoins = joins.filter(
      (value) =>
        listSources.includes(value.left.datasourceId) &&
        listSources.includes(value.right.datasourceId),
    );
    const reduceJoins = filterJoins.reduce((joinAcc, join) => {
      const { left, right } = join;
      if (joinAcc.indexOf(left.datasourceId) < 0)
        joinAcc.push(left.datasourceId);
      if (joinAcc.indexOf(right.datasourceId) < 0)
        joinAcc.push(right.datasourceId);
      return joinAcc;
    }, []);

    const selection = filterSources
      .filter((source) => {
        return reduceJoins > 0 ? reduceJoins.includes(String(source.id)) : true;
      })
      .reduce((sourceAcc, obj) => {
        const { id, entity, properties }: any = obj;
        return properties.reduce((proAcc, pro) => {
          const { isKey, name, as } = pro;
          if (mainSource && String(id) == String(mainSource.id)) {
            proAcc.push(`"${entity}"."${name}" as "${entity}_${name}" `);
          } else {
            proAcc.push(`${entity}."${name}" as "${entity}_${name}" `);
          }
          return proAcc;
        }, sourceAcc);
      }, []);

    const joining = filterJoins.reduce((joinAcc, join) => {
      const { type, left, right } = join;
      let { entity: leftTblname } = sources.find(
        (obj) => obj.id == left.datasourceId,
      );
      const { entity: rightTblname } = sources.find(
        (obj) => obj.id == right.datasourceId,
      );
      if (entity != rightTblname) {
        entity == leftTblname ? (leftTblname = `"${leftTblname}"`) : '';
        joinAcc =
          joinAcc +
          ` ${type.toUpperCase()}
                    JOIN (SELECT * FROM "${rightTblname}") as ${rightTblname} ON ${leftTblname}."${
            left.property
          }" = ${rightTblname}."${right.property}"`;
      }
      return joinAcc;
    }, '');

    const whereQuery = QueryWhereSQL.generate(filterSources);
    const limitQuery = QueryLimitSQL.generate(limit);
    const sortQuery = QuerySortSQL.generate(sorts);

    return `SELECT ${selection} FROM "${entity}" ${joining} ${whereQuery} ${sortQuery} ${limitQuery}`;
  }

  public static prepareMultiNoSQL(params: ConfigParameterMulty) {
    const { database, sources, joins, limit, sorts }: ConfigParameterMulty =
      params;
    let queries = [];
    const filterSources = sources.filter(
      (source) => source.database == database,
    );
    const [mainSource] = filterSources.filter((source) => source.isPrimary);
    const entity = mainSource ? mainSource.entity : '';
    const listSources = filterSources.map((source) => String(source.id));
    const filterJoins = joins.filter(
      (join) =>
        listSources.includes(join.left.datasourceId) &&
        listSources.includes(join.right.datasourceId),
    );
    const reduceJoins = filterJoins.reduce((joinAcc, join) => {
      const { left, right } = join;
      if (joinAcc.indexOf(left.datasourceId) < 0)
        joinAcc.push(left.datasourceId);
      if (joinAcc.indexOf(right.datasourceId) < 0)
        joinAcc.push(right.datasourceId);
      return joinAcc;
    }, []);

    const projection = filterSources
      .filter((source) => {
        return reduceJoins > 0 ? reduceJoins.includes(String(source.id)) : true;
      })
      .reduce((sourceAcc, source) => {
        const { id, entity, properties }: any = source;
        return properties.reduce((proAcc, pro) => {
          const { isKey, name, as } = pro;
          if (mainSource && String(id) == String(mainSource.id)) {
            proAcc[`${entity}_${name}`] = `$${name}`;
          } else {
            proAcc[`${entity}_${name}`] = `$${entity}.${name}`;
          }
          return proAcc;
        }, sourceAcc);
      }, {});

    const joining = filterJoins.reduce((joinAcc, join) => {
      const { type, left, right } = join;
      let { entity: leftTblname } = sources.find(
        (source) => source.id == left.datasourceId,
      );
      const { entity: rightTblname } = sources.find(
        (source) => source.id == right.datasourceId,
      );

      if (entity != rightTblname) {
        entity == leftTblname ? (leftTblname = `"${leftTblname}"`) : '';
        if (
          left.property.toLowerCase().slice(left.property.length - 1) == 's'
        ) {
          left.property = `${left.property}.id`;
        }
        joinAcc.push({
          $lookup: {
            from: `${rightTblname}`,
            localField: `${left.property}`,
            foreignField: `${right.property}`,
            as: `${rightTblname}`,
          },
        });
      }
      return joinAcc;
    }, []);

    const match = QueryGeneratorNoSQL.generateWhereNoSQL(sources);
    const limitQuery = QueryLimitSQL.generate(limit);
    const sortQuery = QuerySortSQL.generate(sorts);

    queries.push(...joining);
    queries.push({ $project: projection });
    queries.push(match);
    queries.push(sortQuery);
    queries.push(limitQuery);
    queries = queries.filter((querie) => querie);

    return queries;
  }
}
