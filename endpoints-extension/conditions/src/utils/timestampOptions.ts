import moment from "moment";

export class TimestampOptions {
  lowerThan: string | null;
  greaterThan: string | null;

  constructor(request: any) {
    const { lowerThan, greaterThan } = request;
    this.lowerThan = lowerThan
      ? moment(lowerThan as string).format("YYYY-MM-DD HH:mm:ss")
      : null;
    this.greaterThan = greaterThan
      ? moment(greaterThan as string).format("YYYY-MM-DD HH:mm:ss")
      : null;
  }
}
