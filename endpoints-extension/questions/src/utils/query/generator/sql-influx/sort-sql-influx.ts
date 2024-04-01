export interface Sort {
  credentialId: string;
  database: string;
  entity: string;
  property: string;
  order: string;
}

export class QuerySortSQLInflux {
  public static generate(sorts: Sort[] = []): string {
    const [sort] = sorts;

    if (!sort) return '';
    return `ORDER BY "${sort.property}" ${sort.order}`;
  }
}
