import { DataGenerator } from './population/data-generator';
import { HeaderGenerator } from './population/header-generator';
import { Group, Sumarize } from './query/inteface';

export class Population {
  public static singleDatabase(
    datas: any,
    sources: any,
    includes: any[] = [],
    summaries: Sumarize[] = [],
    groups: Group[] = [],
  ) {
    const headerGenerator = new HeaderGenerator();
    headerGenerator.generateProperties(sources);
    headerGenerator.addSumaries(summaries, includes);
    headerGenerator.addGroup(groups);
    headerGenerator.addDataType(datas);
    const headers = headerGenerator.headers;

    /**
     * data maker
     */
    const data = datas.map((data) => {
      const filtered = Object.keys(data)
        .filter((key) => headers.some((header) => header.field === key))
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});
      return filtered;
    });

    return {
      headers,
      data,
    };
  }

  public static multipleDatabase(
    datas,
    sources,
    joins,
    includes: any[] = [],
    summaries: Sumarize[] = [],
    groups: Group[] = [],
  ) {
    const headerGenerator = new HeaderGenerator();
    headerGenerator.generateProperties(sources);
    headerGenerator.addSumaries(summaries, includes);
    headerGenerator.addGroup(groups);
    headerGenerator.addDataType(datas);
    const headers = headerGenerator.headers;

    const filterJoins = joins.filter((join) => {
      const { left, right } = join;
      return left.database != right.database;
    });

    const results: any = datas.reduce((dataAcc, data, indexData, arrData) => {
      if (arrData.length == 1) {
        dataAcc.push(data);
      } else if (indexData == 0 && arrData.length > 1) {
        const [dataOne, dataTwo] = arrData;
        const [tblOne] =
          dataOne.length > 0 ? Object.keys(dataOne[0])[1].split('_') : [];
        const [findJoin] = filterJoins.filter(
          (join) =>
            String(join.left.entity) == String(tblOne) ||
            String(join.right.entity) == String(tblOne),
        );

        dataAcc = this.compareCollection(findJoin, dataOne, dataTwo);
      } else if (indexData + 1 != arrData.length) {
        const [tblOne] =
          dataAcc.length > 0 ? Object.keys(dataAcc[0])[1].split('_') : [];
        const [next] = arrData[indexData + 1];

        const [findJoin] = filterJoins.filter(
          (join) =>
            String(join.left.entity) == String(tblOne) ||
            String(join.right.entity) == String(tblOne),
        );
        dataAcc = this.compareCollection(findJoin, dataAcc, next);
      }
      return dataAcc;
    }, []);

    let data = results.map((result) => {
      const filtered = Object.keys(result)
        .filter((key) =>
          headerGenerator.properties.some((property) => property.field === key),
        )
        .reduce((obj, key) => {
          obj[key] = result[key];
          return obj;
        }, {});
      return filtered;
    });

    if (groups.length > 0 || summaries.length > 0) {
      data = DataGenerator.group(results, groups, summaries);
    }

    return {
      headers,
      data,
    };
  }

  public static multipleCredential(
    container?: any,
    sources?: any,
    joins?: any,
    includes: any[] = [],
    summaries: Sumarize[] = [],
    groups: Group[] = [],
  ) {
    const headerGenerator = new HeaderGenerator();
    headerGenerator.generateProperties(sources);
    headerGenerator.addSumaries(summaries, includes);
    headerGenerator.addGroup(groups);

    const results = Object.keys(container).reduce((acc, key, index, arr) => {
      const filterSources = sources
        .filter((source) => String(source.credential.id) == key)
        .map((source) => String(source.id));
      if (arr.length == 1) {
        acc = container[key];
      } else if (index == 0 && arr.length > 1) {
        const dataOne = container[key];
        const dataTwo = container[arr[index + 1]];
        const [findJoin] = joins.filter((join) => {
          const { left, right } = join;
          return (
            (filterSources.includes(left.datasourceId) &&
              !filterSources.includes(right.datasourceId)) ||
            (!filterSources.includes(left.datasourceId) &&
              filterSources.includes(right.datasourceId))
          );
        });
        acc = this.compareCollection(findJoin, dataOne, dataTwo);
      } else if (index + 1 != arr.length) {
        const next = container[arr[index + 1]];
        const [findJoin] = joins.filter((join) => {
          const { left, right } = join;
          return (
            (filterSources.includes(left.datasourceId) &&
              !filterSources.includes(right.datasourceId)) ||
            (!filterSources.includes(left.datasourceId) &&
              filterSources.includes(right.datasourceId))
          );
        });
        acc = this.compareCollection(findJoin, acc, next);
      }
      return acc;
    }, []);

    let data = results.map((result) => {
      const filtered = Object.keys(result)
        .filter((key) =>
          headerGenerator.properties.some((property) => property.field === key),
        )
        .reduce((obj, key) => {
          obj[key] = result[key];
          return obj;
        }, {});
      return filtered;
    });

    if (groups.length > 0 || summaries.length > 0) {
      data = DataGenerator.group(results, groups, summaries);
    }

    headerGenerator.addDataType(data);
    const headers = headerGenerator.headers;

    return {
      headers,
      data,
    };
  }

  public static compareCollection(join?: any, dataOne?: any, dataTwo?: any) {
    const { type, left, right } = join
      ? join
      : { type: null, left: null, right: null };
    if (type == 'left') {
      return dataOne.map((dtOne) => {
        const [filterDtTwo] = dataTwo.filter(
          (dtTwo) =>
            dtOne[`${left.entity}_${left.property}`] ==
            dtTwo[`${right.entity}_${right.property}`],
        );
        if (filterDtTwo) {
          return {
            ...dtOne,
            ...filterDtTwo,
          };
        } else {
          const temp = Object.keys(dataTwo[0]).reduce((accKey, key) => {
            accKey[`${key}`] = null;
            return accKey;
          }, {});
          return {
            ...dtOne,
            ...temp,
          };
        }
      });
    } else if (type == 'right') {
      return dataTwo.map((dtTwo) => {
        const [filterDtOne] = dataOne.filter(
          (dtOne) =>
            dtOne[`${left.entity}_${left.property}`] ==
            dtTwo[`${right.entity}_${right.property}`],
        );
        if (filterDtOne) {
          return {
            ...filterDtOne,
            ...dtTwo,
          };
        } else {
          const temp = Object.keys(dataOne[0]).reduce((accKey, key) => {
            accKey[`${key}`] = null;
            return accKey;
          }, {});
          return {
            ...temp,
            ...dtTwo,
          };
        }
      });
    } else if (type == 'inner') {
      return dataOne
        .map((dtOne) => {
          return dataTwo.reduce((accDtTwo, dtTwo) => {
            if (
              dtOne[`${left.entity}_${left.property}`] ==
              dtTwo[`${right.entity}_${right.property}`]
            ) {
              accDtTwo.push({
                ...dtOne,
                ...dtTwo,
              });
            }
            return accDtTwo;
          }, []);
        })
        .flat(1);
    } else {
      return dataOne
        .map((dtOne) => {
          return dataTwo.map((dtTwo) => {
            return {
              ...dtOne,
              ...dtTwo,
            };
          });
        })
        .flat(1);
    }
  }
}
