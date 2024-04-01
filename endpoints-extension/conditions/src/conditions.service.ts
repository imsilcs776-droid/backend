import { FindAllConditionDto } from "./dto/find-all-condition.dto";
import moment from "moment";
import { createPaginationOptions } from "./utils/pagination";
import { TimestampOptions } from "./utils/timestampOptions";

export class ConditionsService {
  constructor(
    private readonly conditionItemService: any,
    private readonly activityItemService: any,
    private readonly entityItemService: any,
    private readonly formItemService: any,
    private readonly database: any,
  ) { }

  async findAll(findAllConditionDto: FindAllConditionDto) {
    const {
      businessId,
      activityId,
      type,
    } = findAllConditionDto;

    let success = true;
    let message = '';
    let data = [];
    let meta: any = {
      pagination: 0,
      limit: 0,
      totalPage: 0,
      count: 0,
    };

    const forms: any[] = [];

    let filter: any = {};

    businessId
      ? filter.business = { _eq: businessId }
      : null;
    activityId
      ? filter.activity = { _eq: activityId }
      : null;
    type ? filter.type = { _eq: type } : null;

    const activities = await this.activityItemService.readByQuery({
      fields: ["*", "flows.*", "flows.flow.*", "flows.flow.forms.*", "flows.flow.forms.form.*"],
      filter: {
        id: {
          _eq: activityId
        },
        is_active: {
          _eq: true
        }
      }
    })

    const formIds = activities
      .map((act: { flows: any[]; }) => {
        return act.flows
          .reduce((acc, item) => {
            acc.push(item.flow.forms.map((form: { form: { id: any; }; }) => form.form.id));
            return acc;
          }, [])
          .flat(1);
      })
      .flat(1);

    for (const formId of formIds) {
      const data = await this.formItemService.readOne(formId)
      data ? forms.push(data) : null;
    }

    const conditions = await this.conditionItemService.readByQuery({
      fields: ["*", "business.*", "activity.*"],
      filter
    });

    const [entity] = await this.entityItemService.readByQuery({
      filter: {
        code: {
          _eq: type.toUpperCase()
        }
      }
    })

    if (forms && forms.length > 0) {
      const [{ company, plant }] = activities;
      const result = await this.dataOfEntity({
        ...findAllConditionDto,
        entityName: entity.name,
        clause: {
          company,
          plant,
        },
      });

      success = result.success;
      message = result.message;
      meta = result.meta;
      data = result.data.map((dt: { id: any; name: any; }) => {
        const formMaps = forms
          .filter((form) => {
            const { fields, conditions } = form;
            const [field] = fields.filter((field: { properties: any; }) => {
              const { isData, filters }: any = field.properties ? field.properties : { isData: true, filters: null };
              return filters && filters.entity_name == entity.name && !isData
                ? true
                : false;
            });
            return field && conditions.length > 0 ? true : false;
          })
          .map((form) => {
            const {
              settings: { id, code, title },
              conditions,
            } = form;
            return {
              id,
              code,
              title,
              conditions,
            };
          });
        return {
          id: dt.id,
          name: dt.name,
          forms: formMaps,
          conditions: conditions
            .filter(
              (condition: { type: string; entity: any; }) =>
                condition.type == type.toUpperCase() &&
                condition.entity == dt.id,
            )
            .map((condition: { id: any; type: any; entity: any; customs: any; }) => {
              return {
                id: condition.id,
                type: condition.type,
                entityId: condition.entity,
                customs: condition.customs,
              };
            }),
        };
      });
    }

    return {
      success,
      message,
      data,
      meta,
    };
  }

  public async dataOfEntity(req: any) {
    const getForeignKey = async (entityName: any) => {
      const syntaxSQL = `SELECT obj.name AS FK_NAME,
        sch.name AS [schema_name],
        tab1.name AS [table],
        col1.name AS [fk_columns],
        tab2.name AS [table_name],
        col2.name AS [referenced_column]
    FROM sys.foreign_key_columns fkc
    INNER JOIN sys.objects obj
        ON obj.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables tab1
        ON tab1.object_id = fkc.parent_object_id
    INNER JOIN sys.schemas sch
        ON tab1.schema_id = sch.schema_id
    INNER JOIN sys.columns col1
        ON col1.column_id = parent_column_id AND col1.object_id = tab1.object_id
    INNER JOIN sys.tables tab2
        ON tab2.object_id = fkc.referenced_object_id
    INNER JOIN sys.columns col2
        ON col2.column_id = referenced_column_id AND col2.object_id = tab2.object_id
    WHERE tab1.name = '${entityName}'
        `;
      return await this.database.raw(syntaxSQL);
    };

    const index = async (req: any) => {
      try {
        const { filterBy, search, entityName, ids, clause } = req;

        const paginationOptions = createPaginationOptions(req);
        const timestamp = new TimestampOptions(req);

        let syntaxSQL: string;
        let result: any = [];
        let resultsCount: { count: number }[] = [{ count: 0 }];

        if (entityName) {
          const associations: any = await getForeignKey(entityName);
          let joinClause: any = "";
          let selectJoinClause: any = "";
          let whereClause: any = "";
          let paginationClause = "";
          if (ids?.length > 0) {
            whereClause
              ? (whereClause += ` AND "${entityName}"."id" IN (${ids}) `)
              : (whereClause = `WHERE "${entityName}"."id" IN (${ids}) `);
          }

          if (clause) {
            let key: any;
            let value: any;
            for ([key, value] of Object.entries(clause)) {
              /**
               * for handle key like "addtional.code"
               */

              const nestedkeys = key
                .split(".")
                .map((nestedkey: string, index: number) => {
                  if (index === 0) {
                    return `"${nestedkey}"`;
                  }

                  if (index >= 1) {
                    return `'${nestedkey}'`;
                  }
                  return nestedkey;
                })
                .join("->>");

              if (!whereClause) {
                whereClause = `WHERE "${entityName}".${nestedkeys} = ${!isNaN(value) ? value : "'" + value + "'"
                  } `;
              } else {
                whereClause += ` AND "${entityName}".${nestedkeys} = ${!isNaN(value) ? value : "'" + value + "'"
                  } `;
              }
            }
          }

          if (paginationOptions.pagination) {
            paginationClause = `LIMIT ${paginationOptions.limit} OFFSET ${paginationOptions.offset}`;
          }

          if (
            typeof filterBy !== "undefined" &&
            typeof search !== "undefined"
          ) {
            whereClause
              ? (whereClause += ` AND "${entityName}"."${filterBy}" ILIKE '%${search}%' `)
              : (whereClause = `WHERE "${entityName}"."${filterBy}" ILIKE '%${search}%' `);
          }

          if (timestamp.lowerThan) {
            whereClause
              ? (whereClause += ` AND "${entityName}"."updated_at" <= '${moment(
                timestamp.lowerThan
              ).format("YYYY-MM-DD HH:mm:ss")}'`)
              : (whereClause = `WHERE "${entityName}"."updated_at" <= '${moment(
                timestamp.lowerThan
              ).format("YYYY-MM-DD HH:mm:ss")}'`);
          }

          if (timestamp.lowerThan) {
            whereClause
              ? (whereClause += ` AND "${entityName}"."updated_at" >= '${moment(
                timestamp.lowerThan
              ).format("YYYY-MM-DD HH:mm:ss")}'`)
              : (whereClause = `WHERE "${entityName}"."updated_at" >= '${moment(
                timestamp.lowerThan
              ).format("YYYY-MM-DD HH:mm:ss")}'`);
          }

          for (const { table_name, fk_columns } of associations.filter(
            (dt: any) => dt.fk_columns != "created_by" && dt.fk_columns != "user_created" && dt.fk_columns != "user_updated" && dt.table_name != "directus_files"
          )) {
            const [columnAlias]: any = fk_columns.split("Id");
            const tableAlias: any = `${table_name}_right`;
            joinClause += `LEFT JOIN "${table_name}" AS "${tableAlias}" ON "${tableAlias}"."id" = "${entityName}"."${fk_columns}" `;
            if (!selectJoinClause) {
              selectJoinClause = `, "${tableAlias}"."id" as "${columnAlias}.id", "${tableAlias}"."name" as "${columnAlias}.name" `;
            } else {
              selectJoinClause += `, "${tableAlias}"."id" as "${columnAlias}.id", "${tableAlias}"."name" as "${columnAlias}.name" `;
            }
          }

          //Filter deleted data
          if (!whereClause) {
            whereClause = `WHERE "${entityName}"."deleted_at" IS NULL `
          } else {
            whereClause += ` AND "${entityName}"."deleted_at" IS NULL `
          }

          syntaxSQL = `SELECT "${entityName}".* ${selectJoinClause} FROM "${entityName}" ${joinClause} ${whereClause} ${paginationClause};`;

          result = await this.database.raw(syntaxSQL);

          const countQuery = `SELECT count(DISTINCT("${entityName}"."id")) AS "count" FROM "${entityName}" ${joinClause} ${whereClause}`;
          resultsCount = await this.database.raw(countQuery);
        } else {
          throw "plase add entityName in query";
        }

        const meta = {
          pagination: paginationOptions.pagination,
          limit: paginationOptions.limit,
          count: resultsCount[0]?.count || 0,
          totalPage: Math.ceil(resultsCount[0]?.count || 0 / paginationOptions.limit)
        };

        return {
          data: result.map((dt: any) => {
            const temp = Object.keys(dt)
              .filter((key) => key.split(".").length > 1)
              .reduce((acc: any, key: any) => {
                const [objKey, child] = key.split(".");
                if (acc && acc.hasOwnProperty(objKey)) {
                  acc[objKey][child] = dt[key];
                } else {
                  acc = {
                    ...acc,
                    [objKey]: {
                      [child]: dt[key]
                    }
                  };
                }
                delete dt[key];
                return acc;
              }, {});
            dt = {
              ...dt,
              ...temp
            };
            return dt;
          }),
          message: "Success",
          success: true,
          meta
        };
      } catch (e: any) {
        return {
          success: false,
          message: e
        };
      }
    };
    return await index(req);
  }
}