import { Summarize } from '../query/constant';
import { Group, Sumarize } from '../query/inteface';
import * as _ from 'lodash';

export class DataGenerator {
  public static group(
    results: any[] = [],
    groups: Group[] = [],
    summaries: Sumarize[] = [],
  ) {
    const holder = [];

    groups.forEach((group) => {
      const column = `${group.entity}_${group.property}`;

      if (summaries.length > 0) {
        summaries.forEach((summary) => {
          const result = _.chain(results)
            .groupBy(column)
            .map((value, key) => ({
              [`group_${group.entity}_${group.property}`]: key,
              [`summary_${summary.entity}_${summary.property}`]: this.summarize(
                value,
                summary,
              ),
            }))
            .value();

          holder.push(...result);
        });
      } else {
        const result = _.chain(results)
          .groupBy(column)
          .map((value, key) => ({
            [`group_${group.entity}_${group.property}`]: key,
          }))
          .value();

        holder.push(...result);
      }
    });
    return holder;
  }

  public static summarize(values: number[] = [], sumarize: Sumarize) {
    if (values.length === 0) return null;
    switch (sumarize.summary) {
      case Summarize.AVERAGE:
        return _.meanBy(values, `${sumarize.entity}_${sumarize.property}`);

      case Summarize.SUM:
        return _.sumBy(values, `${sumarize.entity}_${sumarize.property}`);

      case Summarize.COUNT:
        return values.length;

      default:
        return null;
    }
  }
}
