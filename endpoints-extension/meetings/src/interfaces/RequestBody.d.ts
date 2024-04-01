export interface MeettingDTO {
  id?: number;
  period_type: "PERIODIC" | "INSTANT";
  company: number;
  title: string;
  topic: string;
  event_date: Date;
  duration: number;
  repeat_type: "NO-REPEAT" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  attendees?: string[];
  created_by?: string;
  repetition?: any;
}

export interface MeetingStateDTO {
  id?: number;
  meeting: number;
  initial_date: Date | string;
  from_date: Date | string;
  to_date: Date | string;
  next_date: Date | string;
  start_date: Date | string;
  end_date: Date | string;
  stop_date: Date | string;
  additional: any;
  status: number;
  attendances: string[];
  note?: string;
  is_active: boolean;
}

export interface MeetingStartDTO {
  meeting_id: number;
  attendances: string[];
}

export interface InstantMeetingStartDTO {
  company: number;
  title: string;
  topic: string;
  attendances: string[];
}

export interface MeetingStopDTO {
  meeting_id: number;
  note: string;
}
