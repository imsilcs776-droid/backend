import { Group } from '../../inteface';

export class QuerySelectSQL {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public static generate(
    selection: string[],
    summary: string[] = [],
    groups: Group[] = [],
  ) {
    if (summary.length > 0) {
      const selectGroup = groups.map(
        (group) =>
          `"${group.entity}"."${group.property}" AS "group_${group.entity}_${group.property}"`,
      );
      return [...summary, ...selectGroup];
    }
    return selection;
  }
}
