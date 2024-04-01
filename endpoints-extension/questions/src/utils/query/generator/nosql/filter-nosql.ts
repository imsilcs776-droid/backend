import { Operator } from '../../constant';
import { DataSource, Filter } from '../../inteface';

export class QueryGeneratorNoSQL {
  public static generateWhereNoSQL(datasources: DataSource[]) {
    const [wheres] = datasources
      .map((datasource) => {
        return this.whereBy(datasource.filters);
      })
      .filter((where) => where);

    if (wheres.length === 0) {
      return false;
    }

    return {
      $match: {
        $and: wheres,
      },
    };
  }

  private static operantion(
    property: string,
    operand: Operator,
    value: string,
  ) {
    switch (operand) {
      case Operator.EQUAL:
        return { [property]: { $eq: value } };

      case Operator.NOT_EQUAL:
        return { [property]: { $ne: value } };

      case Operator.LESS_THAN_EQUAL:
        return { [property]: { $lte: value } };

      case Operator.GREATER_THAN_EQUAL:
        return { [property]: { $gte: value } };

      case Operator.LESS_THAN:
        return { [property]: { $lt: value } };

      case Operator.GREATER_THAN:
        return { [property]: { $lte: value } };

      case Operator.LIKE:
        return { [property]: { $regex: '.*a.*', $options: 'i' } };

      case Operator.IN:
        return { [property]: { $in: value } };

      default:
        return false;
    }
  }

  private static whereBy(filters: Filter[]) {
    return filters.map((filter) => {
      const propertyAlias = filter.entity + '_' + filter.property;

      return this.operantion(
        propertyAlias,
        filter.operator as Operator,
        filter.value,
      );
    });
  }
}
