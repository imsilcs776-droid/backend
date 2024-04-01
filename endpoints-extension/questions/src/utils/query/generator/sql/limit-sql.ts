export class QueryLimitSQL {
  public static generate(limitRow: number): string {
    if (!limitRow) return '';
    return `LIMIT ${limitRow}`;
  }
}
