import { Group, Sumarize } from '../../inteface';

export class QueryGroupBySQL {
  public static generate(summaries: Sumarize[] = [], groups: Group[] = []) {
    const [group] = groups;
    const [summary] = summaries;

    if (!group) return '';
    if (!summary) return '';

    return (
      `GROUP BY ` +
      groups.map((group) => `"${group.entity}"."${group.property}"`)
    );
  }
}
