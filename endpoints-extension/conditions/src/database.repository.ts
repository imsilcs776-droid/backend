export class DatabaseRepository {
  constructor(private readonly database: any) {}

  async raw(query: string) {
    return this.database.raw(query);
  }
}