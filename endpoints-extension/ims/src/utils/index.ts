export * from './date-operation.util'
import array from './array-operation.util'
export { array, format2dgt }

function format2dgt(num: any) {
  if (!num) return '00'
  if (num < 100) {
    return num.toString().padStart(2, '0')
  } else {
    return num
  }
}
