interface Sort {
  credentialId: string;
  database: string;
  entity: string;
  property: string;
  order: string | 'ASC' | 'DESC';
}
export class QuerySortNoSQL {
  public static generate(sorts: Sort[] = []) {
    const [sort] = sorts;

    if (!sort) return false;
    const propertyAlias = `${sort.entity.toLowerCase()}_${sort.property.toLowerCase()}`;

    if (sort.order === 'ASC') return { $sort: { [propertyAlias]: 1 } };
    if (sort.order === 'DESC') return { $sort: { [propertyAlias]: -1 } };

    return false;
  }
}
