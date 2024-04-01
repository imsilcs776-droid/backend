import axios from "axios";
import standardDeviation from "ml-array-standard-deviation";

export class InsightHelper {
  private credentialService: any
  private sageClassificationService: any
  private sageExpressionService: any
  private sageStatementService: any
  private insightService: any
  private questionService: any

  constructor(
    credentialService: any,
    sageClassificationService: any,
    sageExpressionService: any,
    sageStatementService: any,
    insightService: any,
    questionService: any,
  ) {
    this.credentialService = credentialService
    this.sageClassificationService = sageClassificationService
    this.sageExpressionService = sageExpressionService
    this.sageStatementService = sageStatementService
    this.insightService = insightService
    this.questionService = questionService
  }

  private async sage(insight: any) {
    try {
      const [credential] = await this.credentialService.readByQuery({
        fields: ["*", "dialect.*"],
        filters: {
          id: {
            _eq: insight.credential,
          },
        },
      });
  
      if (!credential) throw new Error("Can't get credential");
  
      const statements = await this.sageStatementService.readByQuery({
        fields: ["*"],
        filters: {
          dialect: {
            _eq: credential.dialect.id,
          },
        },
      });
  
      const expressions = await this.sageExpressionService.readByQuery({
        fields: ["*"],
        filters: {
          dialect: {
            _eq: credential.dialect.id,
          },
        },
      });
  
      const classifications = await this.sageClassificationService
        .readByQuery({
          filter: {
            dialect: {
              _eq: credential.dialect.id,
            },
          },
          fields: ["template.syntax", "*"],
        })
        .then((res: any[]) => {
          return res.map((classification) => {
            let {
              custom_column,
              join,
              filter,
              sort,
              summarize,
              summarize_by,
              limit_row,
              template: { syntax },
              weight,
            } = classification;
            const models = [
              custom_column,
              join,
              filter,
              sort,
              summarize,
              summarize_by,
              limit_row,
            ];
  
            if (!weight) weight = standardDeviation(models);
  
            return {
              models, // [1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07]
              weight, // std. dev
              syntax, // SELECT #columns FROM #table
            };
          });
        })
        .catch(() => undefined);
  
      const sample = {
        model: Array.from({ length: 7 }, (_v, _i) => 0),
        weight: 0,
        syntax: "",
      };
  
      if (insight.custom_columns.length > 0) sample.model[0] = 1.01;
      if (insight.join) sample.model[1] = 1.02;
      if (insight.filters.length > 0) sample.model[2] = 1.03;
      if (insight.sorts.length > 0) sample.model[3] = 1.04;
      if (insight.summarizes.length > 0) sample.model[4] = 1.05;
      if (insight.summarizes_by.length > 0) sample.model[5] = 1.06;
      if (insight.limit_row > 0) sample.model[6] = 1.07;
  
      // [1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07]
  
      sample.weight = standardDeviation(sample.model);
  
      const [distance] = classifications
        .map((d: { syntax: any; weight: number }) => {
          return {
            syntax: d.syntax,
            distance: Math.abs(d.weight - sample.weight),
          };
        })
        .sort((a: any, b: any) => a.distance - b.distance);
  
      sample.syntax = distance.syntax;
  
      if (credential.dialect.prefix_query)
        sample.syntax = `${credential.dialect.prefix_query} ${sample.syntax}`;
      if (!insight.database) throw new Error("database undefined");
      if (!insight.table) throw new Error("table undefined");
      const columns = insight.columns
        .map((d: { name: any; as: any }) => `${d.name} AS ${d.as}`)
        .join(", "); // name AS name, code AS code
      const conditions = insight.filters
        .map(
          (d: { column: any; operator: any; value: any }) =>
            `${d.column} ${d.operator} ${d.value}`
        ) // ["column_name #equal 1", "column_name2 #not_equal 2"]
        .join(" AND "); // column_name #equal 1 AND column_name2 #not_equal 2
      const orders = insight.sorts
        .map((d: { column: any; type: any }) => `${d.column} ${d.type}`)
        .join(", ");
      const summarizes_by = insight.summarizes_by.map((d: any) => `${d}`).join(", ");
      const summarizes = insight.summarizes.map((d: any) => `${d.function}("${d.column}") AS ${d.name}`).join(", ")
      const custom_columns = insight.custom_columns.map((d: any) => `${d.formula} AS ${d.name}`).join(", ")
  
      sample.syntax = sample.syntax
        .replace(/#database/g, insight.database)
        .replace(/#table/g, insight.table)
        .replace(/#columns/g, columns)
        .replace(/#conditions/g, conditions)
        .replace(/#orders/g, orders)
        .replace(/#summarizes_by/g, summarizes_by)
        .replace(/#summarizes/g, summarizes)
        .replace(/#custom_columns/g, custom_columns)
  
      for (const statement of statements) {
        sample.syntax = sample.syntax.replace(
          new RegExp(statement.placement, "g"),
          statement.name
        );
      }
  
      for (const expression of expressions) {
        sample.syntax = sample.syntax.replace(
          new RegExp(expression.placement, "g"),
          expression.expression
        );
      }
  
      if (insight.join) {
        sample.syntax = sample.syntax
          .replace(/#join_type/g, String(insight.join.join_type).toUpperCase())
          .replace(/#table/g, insight.table)
          .replace(/#left_column/g, insight.join.left_column)
          .replace(/#right_table/g, insight.join.right_table)
          .replace(/#right_column/g, insight.join.right_column);
      }
  
      if (insight.limit_row > -1)
        sample.syntax = sample.syntax.replace(
          /#limit_row/g,
          String(insight.limit_row)
        );
  
      return {
        result: sample,
        error: undefined,
      };
    } catch (err) {
      return {
        result: undefined,
        error: err as Error,
      };
    }
  }

  public async visualize(id: number) {
    try {
      // const insight = await this.insightService.readOne(id);
      const insight = await this.questionService.readOne(id);

      if (!insight) throw 'Insight not found';
      if (!insight.options?.credential) throw 'credential not found';

      const credential = await this.credentialService.readOne(insight.options?.credential, {
				fields: ["*", "dialect.*"],
      });

      const results: any = await this.sage(insight.options);

      if (results.error) throw results.error;

      const { data: dataRes } = await axios.post(
        `${credential.dialect.executor_url}/preview`,
        {
          host: credential.host,
          user: credential.username,
          password: credential.password,
          port: credential.port,
          query: results.result.syntax as string,
        }
      );

      return {
        data: {
          headers: insight.options?.columns.map((col: any) => ({ header_name: col.as, field: col.as })),
          data: dataRes.data,
        },
        message: 'The automation has been prosessed successfully.',
      };
    } catch (e: any) {
      console.log(e);
      return { success: false, message: e.message ? e.message : e };
      // return Response.errorGrpc(e);
    }
  }
}
