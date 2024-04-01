import { Summarize } from '../../constant';
import { Group, Sumarize } from '../../inteface';

/**
 * example output
 *
 *
 *   $group: {
 *    _id: {
 *       'group_production-order_sku': '$production-order_sku',
 *       'group_production-order_productionnumber': '$production-order_productionnumber',
 *    },
 *     summary_production-order_usia: { $sum: '$production-order_usia' },
 *   },
 */

export class QueryGroupSummaryNoSQL {
  public static generate(
    groups: Group[] = [],
    summaries: Sumarize[] = [],
    selection: { [key: string]: string },
  ) {
    if (groups.length === 0 && summaries.length === 0) return false;

    const query = {
      $group: {
        _id: {},
      },
    };

    groups.forEach((group) => {
      const keysOfSelection = Object.keys(selection) || [];
      const matchKey = keysOfSelection.find(
        (key) =>
          key.toLocaleLowerCase().includes(group.entity.toLowerCase()) &&
          key.toLocaleLowerCase().includes(group.property.toLowerCase()),
      );
      query.$group._id[`group_${matchKey}`] = `$${matchKey}`;
    });

    summaries.forEach((summary) => {
      const keysOfSelection = Object.keys(selection) || [];
      const matchKey = keysOfSelection.find(
        (key) =>
          key.toLocaleLowerCase().includes(summary.entity.toLowerCase()) &&
          key.toLocaleLowerCase().includes(summary.property.toLowerCase()),
      );
      query.$group[`summary_${matchKey}`] = this.summaryQuery(
        summary,
        matchKey,
      );
    });

    return query;
  }

  public static generateProjection(
    groups: Group[] = [],
    summaries: Sumarize[] = [],
    selection: { [key: string]: string },
  ) {
    if (groups.length === 0 && summaries.length === 0) return false;

    const query = {
      $project: {},
    };

    groups.forEach((group) => {
      const keysOfSelection = Object.keys(selection) || [];
      const matchKey = keysOfSelection.find(
        (key) =>
          key.toLocaleLowerCase().includes(group.entity.toLowerCase()) &&
          key.toLocaleLowerCase().includes(group.property.toLowerCase()),
      );
      query.$project[`group_${matchKey}`] = `$_id.group_${matchKey}`;
    });

    summaries.forEach((summary) => {
      const keysOfSelection = Object.keys(selection) || [];
      const matchKey = keysOfSelection.find(
        (key) =>
          key.toLocaleLowerCase().includes(summary.entity.toLowerCase()) &&
          key.toLocaleLowerCase().includes(summary.property.toLowerCase()),
      );
      query.$project[`summary_${matchKey}`] = `$summary_${matchKey}`;
    });

    return query;
  }

  private static summaryQuery(summaryContext: Sumarize, matchKey: string) {
    switch (summaryContext.summary) {
      case Summarize.AVERAGE:
        return {
          $avg: `$${matchKey}`,
        };

      case Summarize.COUNT:
        return {
          $sum: 1,
        };

      case Summarize.SUM:
        return {
          $sum: `$${matchKey}`,
        };

      default:
        return false;
    }
  }
}
