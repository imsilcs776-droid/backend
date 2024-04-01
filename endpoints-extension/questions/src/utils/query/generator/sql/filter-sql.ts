import { Operator } from '../../constant';
import { DataSource, Filter } from '../../inteface';

export class QueryWhereSQL {
  public static generate(datasources: DataSource[]) {
    const wheres = datasources
      .map((datasource) => {
        return this.whereBy(datasource.filters);
      })
      .filter((where) => where);

    if (wheres.length === 0) {
      return '';
    }

    return 'WHERE ' + wheres.join(` AND `);
  }

  private static operation(column: string, operator: Operator, value: string) {
    if (operator === Operator.EQUAL && (value === 'NULL' || value === 'null')) {
      return `${column} IS NULL`
    }

    switch (operator) {
      case Operator.EQUAL:
        return `${column} = '${value}'`;

      case Operator.NOT_EQUAL:
        return `${column} <> '${value}'`;

      case Operator.LESS_THAN_EQUAL:
        return `${column} <= '${value}'`;

      case Operator.GREATER_THAN_EQUAL:
        return `${column} >= '${value}'`;

      case Operator.LESS_THAN:
        return `${column} < '${value}'`;

      case Operator.GREATER_THAN:
        return `${column} > '${value}'`;

      case Operator.LIKE:
        return `${column} ILIKE '%${value}%'`;

      case Operator.IN:
        return `${column} IN '${value}'`;

      case Operator.BETWEEN:
        return `${column} BETWEEN '${value}'`;

      default:
        return false;
    }
  }

  private static whereBy(filters: Filter[] = []) {
    const wheres = filters.map((filter) => {
      return this.operation(
        `"${filter.entity}"."${filter.property}"`,
        filter.operator as Operator,
        filter.value,
      );
    });

    return wheres.join(` AND `);
  }
}
