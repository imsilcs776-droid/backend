import { MeetingStateDTO, MeettingDTO } from '../interfaces';
import { DateOperation } from '../utils';

export class MeetingHelper {
  private meetingService: any
  private meetingStateService: any
  private statusService: any
  constructor(
    meetingService: any,
    meetingStateService: any,
    statusService: any
  ) {
    this.meetingService = meetingService
    this.meetingStateService = meetingStateService
    this.statusService = statusService
  }

  public async computeState(meeting: MeettingDTO, initial?: boolean, state?: MeetingStateDTO) {
    const {
      event_date,
      duration,
      repeat_type,
      repetition
    } = meeting

    const now = new Date()
    const [scheduleMeetingStatus] = await this.statusService.readByQuery({
      filter: {
        category: {
          _eq: 'MEETING'
        },
        is_active: {
          _eq: true
        },
        code: {
          _eq: 'SCHED'
        },
        deleted_at: {
          _null: true
        }
      }
    })
    const meetingState: Partial<MeetingStateDTO> = {}
    if (initial) {
      const arrangeDate = this.computePeriod(repeat_type, repetition, event_date, duration);
      console.log({
        arrangeDate
      })
      meetingState.meeting = meeting.id;
      meetingState.initial_date = DateOperation.getFullDate(event_date);
      meetingState.from_date = DateOperation.getFullDate(arrangeDate.fromDate);
      meetingState.to_date = DateOperation.getFullDate(arrangeDate.toDate);
      meetingState.next_date = DateOperation.getFullDate(arrangeDate.nextDate);
      meetingState.end_date = DateOperation.getFullDate(arrangeDate.endDate);
      meetingState.additional = arrangeDate.additional;
      meetingState.status = scheduleMeetingStatus ? scheduleMeetingStatus.id : null;
      await this.meetingStateService.createOne(meetingState)
    } else {
      if (state) {
        const lastMeetingState: MeetingStateDTO = await this.meetingStateService.readOne(state.id)
        const arrangeDate = this.computePeriod(repeat_type, repetition, new Date(lastMeetingState.next_date), duration);
        meetingState.meeting = meeting.id;
        meetingState.initial_date = event_date;
        meetingState.from_date = arrangeDate.fromDate;
        meetingState.to_date = arrangeDate.toDate;
        meetingState.next_date = arrangeDate.nextDate;
        meetingState.end_date = arrangeDate.endDate;
        meetingState.additional = arrangeDate.additional;
        meetingState.status = scheduleMeetingStatus ? scheduleMeetingStatus.id : null;

        if (repeat_type == 'CUSTOM') {
          const { end_date, additional } = lastMeetingState;
          if (additional && additional.occurences == additional.counter) {
            return false;
          } else if (additional) {
            meetingState.additional = {
              ...additional,
              counter: additional.counter ? parseInt(additional.counter + 1) : undefined
            }
          }
  
          if (end_date && end_date < now) {
            return false;
          }
        }
        await this.meetingStateService.createOne(meetingState)
      }
    }
    return true;
  }

  private computePeriod(type: string, repetition: any, eventDate: Date, duration: number): { fromDate: Date; toDate: Date; nextDate: Date; endDate: Date; additional: any; } {
    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    let nextDate: Date | null = null;
    let endDate: Date | null = null;
    let additional: any = null;

    fromDate = eventDate;
    toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
    if (type.toUpperCase() == 'DAILY') {
      nextDate = DateOperation.getDateTime(fromDate, 1);
    } else if (type.toUpperCase() == 'WEEKLY') {
      nextDate = DateOperation.getDateTime(fromDate, 7);
    } else if (type.toUpperCase() == 'MONTHLY') {
      nextDate = DateOperation.getDateTime(fromDate, 0, 1);
    } else if (type.toUpperCase() == 'YEARLY') {
      nextDate = DateOperation.getDateTime(fromDate, 0, 0, 1);
    } else if (type.toUpperCase() == 'CUSTOM') {
      return this.computeCustomPeriod(repetition, eventDate, duration);
    }

    return {
      fromDate: new Date(eventDate),
      toDate,
      nextDate: nextDate as any,
      endDate: endDate as any,
      additional
    };
  }

  private computeCustomPeriod(repetition: any, eventDate: Date, duration: number) {
    let fromDate: any = null;
    let toDate: any = null;
    let nextDate: any = null;
    let endDate: any = null;
    let additional: any = null;
    const { value, unit, day }: any = repetition && repetition.every ? repetition.every : {};
    const { type, occurences, date }: any = repetition && repetition.ends ? repetition.ends : {};
 
    if (unit.toUpperCase() == 'DAY') {
      fromDate = new Date(eventDate);
      toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
      nextDate = DateOperation.getDateTime(fromDate, Number(value));
    } else if (unit.toUpperCase() == 'WEEK') {
      // tempDate = this.computeDateOfWeekByDay(new Date(eventDate), day);
      fromDate = new Date(eventDate);
      toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
      nextDate = DateOperation.getDateTime(fromDate, (Number(value) * 7));
    } else if (unit.toUpperCase() == 'MONTH') {
      fromDate = new Date(eventDate);
      toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
      nextDate = DateOperation.getDateTime(fromDate, 0, Number(value));
    } else if (unit.toUpperCase() == 'YEAR') {
      fromDate = new Date(eventDate);
      toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
      nextDate = DateOperation.getDateTime(fromDate, 0, 0, Number(value));
    }

    if (type && type.toUpperCase() == 'ON') {
      endDate = date;
    } else if (type && type.toUpperCase() == 'AFTER') {
      additional = {
        occurences: occurences ? Number(occurences) : null,
        counter: 1
      }
    }

    return {
      fromDate,
      toDate,
      nextDate,
      endDate,
      additional,
    };
  }

  public async populateState() {
    const meetings = await this.meetingService.readByQuery({
      filter: {
        period_type: {
          _eq: 'PERIODIC',
        },
      },
    });

    if (meetings.length > 0) {
      const now = new Date();
      const [status] = await this.statusService.readByQuery({
        filter: {
          category: {
            _eq: 'MEETING',
          },
          code: {
            _eq: 'SCHED',
          },
          is_active: {
            _eq: true,
          },
        },
      });
      const states = await this.meetingStateService.readByQuery({
        filter: {
          meeting: {
            _in: meetings.map((meeting: any) => meeting.id),
          },
          status: {
            _eq: status ? status.id : null,
          },
          is_active: {
            _eq: true,
          },
          to_date: {
            _lt: now
          },
        },
      });

      const meetingStateBaseDTO: any = {};
      for (const state of states) {
        try {
          const [meeting] = meetings.filter((meeting: any) => meeting.id === state.meeting);
          const { duration, repeat_type, repetition }: any = meeting ? meeting : {};
          const updateStateDTO: any = {};
          updateStateDTO.is_active = false;
          await this.meetingStateService.updateOne(state.id, updateStateDTO);

          const nextDate = this.computeNextDate(now, state.nextDate, repeat_type, repetition);
          const arrangeDate = this.computePeriod(repeat_type, repetition, nextDate, duration);
          meetingStateBaseDTO.meeting = state.meeting;
          meetingStateBaseDTO.initial_date = state.initial_date;
          meetingStateBaseDTO.end_date = state.end_date;
          meetingStateBaseDTO.from_date = arrangeDate.fromDate;
          meetingStateBaseDTO.to_date = arrangeDate.toDate;
          meetingStateBaseDTO.next_date = arrangeDate.nextDate;
          meetingStateBaseDTO.status = status ? status.id : null;

          if (repeat_type == 'CUSTOM') {
            const { end_date, additional } = state;
            if (additional && additional.occurences == additional.counter) {
              continue;
            } else if (additional) {
              meetingStateBaseDTO.additional = {
                ...additional,
                counter: additional.counter ? parseInt(additional.counter + 1) : undefined
              }
            }

            if (end_date && end_date < now) {
              continue;
            }
          }
          await this.meetingStateService.create(meetingStateBaseDTO);
        } catch(e) {
          console.log(e);
        }
      }
    }
  }

  private computeNextDate(current: any, nextDate: any, type: any, repetition?: any): any {
    const temp: any = DateOperation.getDateTime(`${DateOperation.getDate(current)} ${DateOperation.getTimePicker(nextDate)}:00`);
    
    if (type.toUpperCase() == 'DAILY') {
      return nextDate < temp ? temp : nextDate;
    } else if (type.toUpperCase() == 'WEEKLY') { 
      if (nextDate < temp) {
        return this.computeNextDate(current, DateOperation.getDateTime(nextDate, 7), type, repetition)
      } else {
        return nextDate;
      }
    } else if (type.toUpperCase() == 'MONTHLY') { 
      if (nextDate < temp) {
        return this.computeNextDate(current, DateOperation.getDateTime(nextDate, 0, 1), type, repetition)
      } else {
        return nextDate;
      }
    } else if (type.toUpperCase() == 'YEARLY') {
      if (nextDate < temp) {
        return this.computeNextDate(current, DateOperation.getDateTime(nextDate, 0, 0, 1), type, repetition)
      } else {
        return nextDate;
      } 
    } else if (type.toUpperCase() == 'CUSTOM') {
      const { value, unit, day }: any = repetition && repetition.every ? repetition.every : {};
      if (unit.toUpperCase() == 'DAY') {
        if (nextDate < temp) {
          return this.computeNextDate(current, DateOperation.getDateTime(nextDate, Number(value)), type, repetition)
        } else {
          return nextDate;
        }
      }  else if (unit.toUpperCase() == 'WEEK') {
        if (nextDate < temp) {
          return this.computeNextDate(current, DateOperation.getDateTime(nextDate, (Number(value) * 7)), type, repetition)
        } else {
          return nextDate;
        }
      } else if (unit.toUpperCase() == 'MONTH') {
        if (nextDate < temp) {
          return this.computeNextDate(current, DateOperation.getDateTime(nextDate, 0, Number(value)), type, repetition)
        } else {
          return nextDate;
        }
      } else if (unit.toUpperCase() == 'YEAR') {
        if (nextDate < temp) {
          return this.computeNextDate(current, DateOperation.getDateTime(nextDate, 0, 0, Number(value)), type, repetition)
        } else {
          return nextDate;
        }
      }
    }
  }
}
