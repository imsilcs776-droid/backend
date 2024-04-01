import { Summarize } from '../../constant';
import { Sumarize } from '../../inteface';

export class QuerySummarySQL {
  public static generate(summaries: Sumarize[] = []) {
    const query = summaries.map((context) => {
      switch (context.summary) {
        case Summarize.AVERAGE:
          return `ROUND( AVG( "${context.entity}"."${context.property}" ), 2 ) AS "summary_${context.entity}_${context.property}"`;

        case Summarize.COUNT:
          return `COUNT(*) AS "summary_${context.entity}_${context.property}"`;

        case Summarize.SUM:
          return `SUM( "${context.entity}"."${context.property}" ) AS "summary_${context.entity}_${context.property}"`;

        default:
          return '';
      }
    });

    return query;
  }
}
