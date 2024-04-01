const MONTH_NAME = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTH_NUMBER = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
];
export class DateOperation {
  public static getDate(dateTime: any, addDay = 0, addMonth = 0, addYear = 0) {
    const date = new Date(dateTime);
    if (addDay != 0) {
      date.setDate(date.getDate() + addDay);
    }
    if (addMonth != 0) {
      date.setMonth(date.getMonth() + addMonth);
    }
    if (addYear != 0) {
      date.setFullYear(date.getFullYear() + addYear);
    }
    const year = date.getFullYear();
    const month = MONTH_NUMBER[date.getMonth()];
    const day = date.getDate();
    return `${year}-${month}-${day}`;
  }

  public static getDateTime(
    dateTime: any,
    addDay = 0,
    addMonth = 0,
    addYear = 0,
    addSecond = 0,
    addMinute = 0,
    addHour = 0,
  ) {
    const date = new Date(dateTime);
    if (addDay != 0) {
      date.setDate(date.getDate() + addDay);
    }
    if (addMonth != 0) {
      date.setMonth(date.getMonth() + addMonth);
    }
    if (addYear != 0) {
      date.setFullYear(date.getFullYear() + addYear);
    }
    if (addSecond != 0) {
      date.setSeconds(date.getSeconds() + addSecond);
    }
    if (addMinute != 0) {
      date.setMinutes(date.getMinutes() + addMinute);
    }
    if (addHour != 0) {
      date.setHours(date.getHours() + addHour);
    }
    return date;
  }

  public static getTimePicker(dateTime: any, addTime?: any, unitTime?: any) {
    const date = new Date(dateTime);

    if (unitTime && unitTime.toUpperCase() == 'HOUR') {
      date.setHours(date.getHours() + addTime ? addTime : 0);
    } else if (unitTime && unitTime.toUpperCase() == 'MINUTE') {
      date.setMinutes(date.getMinutes() + addTime ? addTime : 0);
    }

    return `${this.convertHour(date.getHours())}:${this.convertMinute(
      date.getMinutes(),
    )}`;
  }

  private static convertHour(hour: any) {
    if (hour < 10) return `0${hour}`;
    return hour;
  }

  private static convertMinute(minute: any) {
    if (minute < 10) return `0${minute}`;
    return minute;
  }

  public static getFullDate(d: Date) {
    if (typeof d == "string") {
      d = new Date(d);
      const result = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}T${d
        .getHours()
        .toString()
        .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
      return result;
    } else if (d) {
      const result = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}T${d
        .getHours()
        .toString()
        .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
      return result;
    }
    return d;
  }
}
