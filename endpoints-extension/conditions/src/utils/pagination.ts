/**
 *
 * @param req is _Request
 * @default limit = 20
 * @default pagination = 1
 */
export const createPaginationOptions = (req: any): PaginationOptions => {
  const { pagination, limit } = req;
  let formatedPage: any, formatedLimit: any;

  if (!pagination)
    return {
      distinct: true
    } as PaginationOptions;

  if (typeof pagination !== "undefined") {
    formatedPage = parseInt(pagination as string, 10) || 1;
  }
  if (typeof limit !== "undefined") {
    formatedLimit = parseInt(limit as string, 10) || 20;
  }
  const paginations = new PaginationOptions();

  if (formatedPage <= 0) {
    formatedPage = 1;
  }

  if (formatedLimit <= 0) {
    formatedLimit = 20;
  }

  if (typeof pagination !== "undefined") {
    paginations.pagination = formatedPage;
  }
  paginations.limit = formatedLimit;
  paginations.distinct = true;

  if (typeof pagination !== "undefined" && typeof limit !== "undefined") {
    paginations.offset = (formatedPage - 1) * formatedLimit;
  }

  return paginations;
};

export class PaginationOptions {
  pagination!: number;
  limit!: number;
  offset!: number;
  distinct!: boolean;
}

export class Pagination {
  pagination: number;
  limit: number;
  totalPage: number;
  count: number;
  distinct: boolean;

  constructor(total: number, paginationOptions: PaginationOptions) {
    this.pagination = Number(paginationOptions.pagination);
    this.limit = Number(paginationOptions.limit);
    this.totalPage = Math.ceil(total / paginationOptions.limit);
    this.count = total;
    this.distinct = true;
  }
}
