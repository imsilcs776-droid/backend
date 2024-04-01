export class QueryLimitNoSQL {
  public static generate(limitRow: number) {
    if (!limitRow) return false;
    return { $limit: Number(limitRow) };
  }
}
