export default {
  allEqual: (arr: any[]) => new Set(arr).size === 1,
  groupBy: <T>(
    array: T[],
    predicate: (value: T, index: number, array: T[]) => string,
    output: any
  ) =>
    array.reduce((acc, value, index, array) => {
      ;(acc[predicate(value, index, array)] ||= []).push(value)
      return acc
    }, output),
}
