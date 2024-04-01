import { Body, Context, Delete, Endpoint, Get, Param, Post, Query, Req } from "@mv-data-core/decorator";
import { MeetingHelper } from "./helpers";
import type { InstantMeetingStartDTO, MeetingStartDTO, MeetingStateDTO, MeetingStopDTO, MeettingDTO } from "./interfaces";
import { DateOperation } from './utils';

@Endpoint("meetings")
export default class DefineEndpoint {
  @Post(
    { path: "", tag: "Meeting" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                },
                company: {
                  type: "number",
                },
                period_type: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                topic: {
                  type: "string",
                },
                event_date: {
                  type: "string",
                  format: "date-time",
                },
                duration: {
                  type: "number",
                },
                repeat_type: {
                  type: "string",
                },
                repetition: {
                  type: "object",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          company: {
            type: "number",
          },
          title: {
            type: "string",
          },
          topic: {
            type: "string",
          },
          event_date: {
            type: "string",
            format: "date-time",
          },
          duration: {
            type: "number",
          },
          repeat_type: {
            type: "string",
          },
          repetition: {
            type: "object",
          },
          attendees: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    }
  )
  async create(@Req() req: any, @Context() ctx: any, @Body() body: MeettingDTO) {
    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException },
    } = ctx;
    const { attendees, ...payload } = body;

    if (!Array.isArray(attendees)) throw new InvalidPayloadException("Attendees must be array");

    const meetingService = new ItemsService("meetings", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const meetingStateService = new ItemsService("meeting_states", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const statusService = new ItemsService("statuses", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const meetingAttendeesService = new ItemsService("meeting_attendees", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const { user: userId } = req.accountability;
    payload.created_by = userId;
    payload.period_type = "PERIODIC";

    const meetingId = await meetingService.createOne(payload);

    const meetingAttendeePromise: Promise<unknown>[] = [];
    for (const attendee of attendees) {
      meetingAttendeePromise.push(
        meetingAttendeesService.createOne({
          meeting: meetingId,
          user: attendee,
        })
      );
    }

    await Promise.all(meetingAttendeePromise);

    const meetingHelper = new MeetingHelper(meetingService, meetingStateService, statusService);

    const meeting = {
      id: meetingId,
      ...body,
    };

    await meetingHelper.computeState(meeting, true);

    return {
      success: true,
      message: "Meeting created",
      data: meeting,
    };
  }

  @Post(
    { path: "/start", tag: "Meeting" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                },
                company: {
                  type: "number",
                },
                period_type: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                topic: {
                  type: "string",
                },
                event_date: {
                  type: "string",
                  format: "date-time",
                },
                duration: {
                  type: "number",
                },
                repeat_type: {
                  type: "string",
                },
                repetition: {
                  type: "object",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          meeting_id: {
            type: "number",
          },
          attendances: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    }
  )
  async startMeeting(@Req() req: any, @Context() ctx: any, @Body() body: MeetingStartDTO) {
    const { attendances, meeting_id } = body;

    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException, InvalidQueryException },
    } = ctx;

    if (!Array.isArray(attendances)) throw new InvalidPayloadException("Attendances must be array");

    const meetingService = new ItemsService("meetings", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const meetingStateService = new ItemsService("meeting_states", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const statusService = new ItemsService("statuses", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const meetingAttendancesService = new ItemsService("meeting_attendances", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [meetingState]: [MeetingStateDTO] = await meetingStateService.readByQuery({
      filter: {
        meeting: {
          _eq: meeting_id,
        },
      },
    });

    if (!meetingState) throw new InvalidPayloadException(`Meeting not found`);

    const [meeting] = await meetingService.readByQuery({
      filter: {
        id: {
          _eq: meeting_id,
        },
      },
    });

    if (meeting) {
      const now = new Date();
      const { from_date, to_date } = meetingState;
      const dFromDate = new Date(`${from_date}`);
      const dToDate = new Date(`${to_date}`);
      if (dFromDate <= now && dToDate >= now) {
        const [ongoingMeetingStatus] = await statusService.readByQuery({
          filter: {
            category: {
              _eq: "MEETING",
            },
            code: {
              _eq: "GOING",
            },
            is_active: {
              _eq: true,
            },
            deleted_at: {
              _null: true,
            },
          },
        });

        const updateState: Partial<MeetingStateDTO> = {};
        updateState.status = ongoingMeetingStatus.id;
        updateState.start_date = now;
        await meetingStateService.updateOne(meetingState.id, updateState);
        const meetingAttendancesPromise: Promise<unknown>[] = [];
        for (const attendance of attendances) {
          meetingAttendancesPromise.push(
            meetingAttendancesService.createOne({
              meeting_state: meetingState.id,
              user: attendance,
            })
          );
        }
        await Promise.all(meetingAttendancesPromise);

        const { data } = await DefineEndpoint.getMovementDetail(req, ctx, meetingState.id as number);

        return {
          success: true,
          data,
        };
      } else {
        throw new InvalidQueryException("You cannot start this meeting because the current time is out of schedule.");
      }
    } else {
      throw new InvalidQueryException(`Meeting with id ${meeting_id} not found`);
    }
  }

  @Post(
    { path: "/start/instant", tag: "Meeting" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                },
                company: {
                  type: "number",
                },
                period_type: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                topic: {
                  type: "string",
                },
                event_date: {
                  type: "string",
                  format: "date-time",
                },
                duration: {
                  type: "number",
                },
                repeat_type: {
                  type: "string",
                },
                repetition: {
                  type: "object",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          company: {
            type: "number",
          },
          title: {
            type: "string",
          },
          topic: {
            type: "string",
          },
          attendances: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    }
  )
  async startInstantMeeting(@Req() req: any, @Context() ctx: any, @Body() body: InstantMeetingStartDTO) {
    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException, ServiceUnavailableException },
    } = ctx;

    const meetingService = new ItemsService("meetings", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const meetingStateService = new ItemsService("meeting_states", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const statusService = new ItemsService("statuses", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const meetingAttendeeService = new ItemsService("meeting_attendees", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const meetingAttendanceService = new ItemsService("meeting_attendances", {
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      const { company, topic, title, attendances } = body;

      if (!Array.isArray(attendances)) throw new InvalidPayloadException("Attendances must be array");

      const now = new Date();

      const meetingBaseDTO: any = {};
      meetingBaseDTO.company = company;
      meetingBaseDTO.period_type = 'INSTANT';
      meetingBaseDTO.title = title;
      meetingBaseDTO.topic = topic;
      meetingBaseDTO.event_date = now;
      const meetingId = await meetingService.createOne(meetingBaseDTO);

      const meetingAttendeePromise: Promise<unknown>[] = [];
      for (const attendee of attendances) {
        meetingAttendeePromise.push(
          meetingAttendeeService.createOne({
            meeting: meetingId,
            user: attendee,
          })
        );
      }

      await Promise.all(meetingAttendeePromise);

      if (meetingId) {
        const [status] = await statusService.readByQuery({
          filter: { 
            category: { _eq: 'MEETING' },
            code: { _eq: 'GOING' },
            is_active: { _eq: true }, 
          },
        });
        const meetingStateBaseDTO: any = {};
        meetingStateBaseDTO.meeting = meetingId;
        meetingStateBaseDTO.initial_date = now;
        meetingStateBaseDTO.from_date = now;
        meetingStateBaseDTO.start_date = now;
        meetingStateBaseDTO.status = status ? status.id : null;
        const stateId = await meetingStateService.createOne(meetingStateBaseDTO);

        const meetingAttendancePromise: Promise<unknown>[] = [];
        for (const attendee of attendances) {
          meetingAttendancePromise.push(
            meetingAttendanceService.createOne({
              meeting_state: stateId,
              user: attendee,
            })
          );
        }

        await Promise.all(meetingAttendancePromise);
        
        const data = await DefineEndpoint.getMovementDetail(req, ctx, stateId);
        return {
          success: true,
          message: 'Meeting is started successfully.',
          data
        }
      } else {
        return {
          success: false,
          message: "Error while create meeting",
          data: null
        }
      }
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message ?? error);
    }
  }

  @Post(
    { path: "/stop", tag: "Meeting" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean"
                },
                message: {
                  type: "string"
                },
                data: {
                  type: "object",
                  properties: {
                    id: {
                      type: "number",
                    },
                    company: {
                      type: "number",
                    },
                    period_type: {
                      type: "string",
                    },
                    title: {
                      type: "string",
                    },
                    topic: {
                      type: "string",
                    },
                    event_date: {
                      type: "string",
                      format: "date-time",
                    },
                    duration: {
                      type: "number",
                    },
                    repeat_type: {
                      type: "string",
                    },
                    repetition: {
                      type: "object",
                    },
                  }
                }
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          meeting_id: {
            type: "number",
          },
          note: {
            type: "string",
          },
        },
      },
    }
  )
  async stopMeeting(@Req() req: any, @Context() ctx: any, @Body() body: MeetingStopDTO) {
    const { note, meeting_id } = body;

    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException, InvalidQueryException },
    } = ctx;

    const meetingService = new ItemsService("meetings", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const meetingStateService = new ItemsService("meeting_states", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const statusService = new ItemsService("statuses", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [meetingState]: [MeetingStateDTO] = await meetingStateService.readByQuery({
      filter: {
        meeting: {
          _eq: meeting_id,
        },
      },
    });

    if (!meetingState) throw new InvalidPayloadException(`Meeting not found`);

    const [meeting]: [MeettingDTO] = await meetingService.readByQuery({
      filter: {
        id: {
          _eq: meeting_id,
        },
      },
    });

    if (meeting) {
      const now = new Date();
      const [stopMeetingStatus] = await statusService.readByQuery({
        filter: {
          category: {
            _eq: "MEETING",
          },
          code: {
            _eq: "PASSD",
          },
          is_active: {
            _eq: true,
          },
          deleted_at: {
            _null: true,
          },
        },
      });
      const updateState: Partial<MeetingStateDTO> = {
        note,
        status: stopMeetingStatus ? stopMeetingStatus.id : null,
        stop_date: DateOperation.getFullDate(now),
        is_active: false
      }

      await meetingStateService.updateOne(meetingState.id, updateState)

      if (meeting.period_type == 'PERIODIC') {
        const meetingHelper = new MeetingHelper(meetingService,meetingStateService,statusService)
        await meetingHelper.computeState(meeting, false, meetingState)
      }

      return {
        success: true,
        message: 'Meeting is stoped successfully.',
        data: meeting
      }
    } else {
      throw new InvalidQueryException(`Meeting with id ${meeting_id} not found`);
    }
  }

  @Delete(
    { path: "/cancel/:stateId", tag: "Meeting" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean"
                },
                message: {
                  type: "string"
                },
                data: {
                  type: "object",
                  properties: {
                    id: {
                      type: "number",
                    },
                    company: {
                      type: "number",
                    },
                    period_type: {
                      type: "string",
                    },
                    title: {
                      type: "string",
                    },
                    topic: {
                      type: "string",
                    },
                    event_date: {
                      type: "string",
                      format: "date-time",
                    },
                    duration: {
                      type: "number",
                    },
                    repeat_type: {
                      type: "string",
                    },
                    repetition: {
                      type: "object",
                    },
                  }
                }
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "path",
          name: "stateId",
          schema: {
            type: "number"
          },
          required: true
        }
      ]
    }
  )
  async cancelMeeting(@Req() req: any, @Context() ctx: any, @Param("stateId") stateId: number) {

    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException, InvalidQueryException },
    } = ctx;

    const meetingService = new ItemsService("meetings", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const meetingStateService = new ItemsService("meeting_states", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const statusService = new ItemsService("statuses", {
      schema: req.schema,
      accountability: req.accountability,
    });

    const [meetingState]: [MeetingStateDTO] = await meetingStateService.readByQuery({
      filter: {
        id: {
          _eq: stateId,
        },
      },
    });

    if (!meetingState) throw new InvalidPayloadException(`Meeting not found`);

    const [meeting]: [MeettingDTO] = await meetingService.readByQuery({
      filter: {
        id: {
          _eq: meetingState.meeting,
        },
      },
    });

    if (meeting) {
        const now = new Date();
        const { from_date, to_date } = meetingState;
        const dFromDate = new Date(from_date)
        const dToDate = new Date(to_date)
        if (dFromDate <= now && dToDate >= now) {
          const [cancelMeetingStatus] = await statusService.readByQuery({
            filter: {
              category: {
                _eq: 'MEETING'
              },
              code: {
                _eq: 'CANCE'
              },
              is_active: {
                _eq: true
              },
              deleted_at: {
                _null: true
              },
            }
          });

          const updateState: Partial<MeetingStateDTO> = {
            status: cancelMeetingStatus ? cancelMeetingStatus.id : null
          }

          await meetingStateService.updateOne(stateId, updateState)

          const meetingHelper = new MeetingHelper(meetingService, meetingStateService, statusService)
          await meetingHelper.computeState(meeting, false, meetingState);

          return {
            success: true,
            message: 'Meeting is stoped successfully.',
            data: meeting,
          };
        } else {
          throw new InvalidQueryException('You cannot cancel this meeting because the current time is out of schedule.')
        }
    } else {
      throw new InvalidQueryException('The meeting has been deleted.')
    }
  }

  @Get(
    { path: "/movement", tag: "Meeting" },
    {
      responses: [
        {
          200: {
            description: "Response get array of object classification",
            responseType: "array",
            schema: "Classification",
          },
        },
      ],
      parameters: [
        {
          in: "query",
          name: "meeting",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "period_type",
          required: false,
          schema: {
            type: "string",
            enum: ["PERIODIC", "INSTANT"],
          },
        },
        {
          in: "query",
          name: "filter_by",
          required: false,
          schema: {
            type: "string",
            enum: ["title"],
          },
        },
        {
          in: "query",
          name: "search",
          schema: { type: "string" },
          required: false,
        },
        {
          in: "query",
          name: "repeat_type",
          required: false,
          schema: {
            type: "string",
            enum: ['NO-REPEAT', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'],
          },
        },
        {
          in: "query",
          name: "status_codes",
          required: false,
          description: "SCHED|CANCE|PASSD|GOING",
          schema: {
            // type: "string",
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        {
          in: "query",
          name: "pagination",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "limit",
          schema: { type: "number" },
          required: false,
        },
        {
          in: "query",
          name: "lower_than",
          required: false,
          schema: { type: "string" },
          description: "YYYY-MM-DD HH:mm:ss",
        },
        {
          in: "query",
          name: "greater_than",
          required: false,
          schema: { type: "string" },
          description: "YYYY-MM-DD HH:mm:ss",
        },
      ],
    }
  )
  async getMovement(
    @Req() req: any,
    @Context() context: any,
    @Query('pagination') pagination: number,
    @Query('limit') limit: number,
    @Query('filter_by') filter_by: string,
    @Query('search') search: string,
    @Query('repeat_type') repeat_type: string,
    @Query('status_codes') status_codes: string[],
    @Query('meeting') meeting: number,
    @Query('period_type') period_type: string,
    @Query('lower_than') lower_than: string,
    @Query('greater_than') greater_than: string,
  ) {
    const {
      services: { ItemsService, MetaService },
      exceptions: { ServiceUnavailableException },
      env
    } = context;

    const {
      ADMIN_ID,
      ADMIN_ROLE,
    } = env;

    const accountability = {
      user: ADMIN_ID,
      role: ADMIN_ROLE,
      admin: true,
      app: true,
      ip: '::1',
      userAgent: 'System/1.0.0',
      share: undefined,
      share_scope: undefined,
      permissions: []
    };

    const meetingService = new ItemsService("meetings", {
      schema: req.schema,
      accountability,
    });
    const meetingStateService = new ItemsService("meeting_states", {
      schema: req.schema,
      accountability,
    });
    const statusService = new ItemsService("statuses", {
      schema: req.schema,
      accountability,
    });

    const metaService = new MetaService({
      schema: req.schema,
      accountability,
    });

    const meetingHelper = new MeetingHelper(meetingService, meetingStateService, statusService);

    try {
      await meetingHelper.populateState();

      const meetingFilter: any = {};
      const stateFilter: any = {};
  
      if (filter_by) meetingFilter[filter_by] = { _contains: search ?? '' };
      if (repeat_type) meetingFilter.repeat_type = { _eq: repeat_type };
  
      if (period_type) {
        meetingFilter.period_type = { _eq: period_type.toUpperCase() };
      } else {
        meetingFilter.period_type = { _eq: 'PERIODIC' };
      }
  
      if (status_codes) {
        const codes = status_codes instanceof Array ? status_codes : [String(status_codes)];
        const statuses = await statusService.readByQuery({
          filter: {
            code: { _in: codes },
            is_active: { _eq: true },
            category: { _eq: 'MEETING' },
          },
        });
  
        if (statuses.length > 0) {
          stateFilter.status = { _in: statuses.map((status: any) => status.id) };
        } else {
          return {
            success: false,
            message: 'Status code not found.',
            data: [],
          };
        }
      }
  
      if (Object.keys(meetingFilter).length > 0) {
        const meetings = await meetingService.readByQuery({ filter: meetingFilter });
        stateFilter.meeting = { _in: meetings.map((dt: any) => dt.id) };
      }

      if (lower_than) stateFilter.from_date = { _between: [greater_than ? DateOperation.getDateTime(greater_than) : new Date(), DateOperation.getDateTime(lower_than)] }
      
      if (meeting) stateFilter.meeting = { _eq: meeting };

      const sanitizedQuery = {
        fields: [
          "*", 
          "meeting.*", 
          "meeting.attendees.user.*", 
          "meeting.attendees.user.profile.*",
          "meeting.attendees.user.department.*",
          "meeting.attendees.user.job.*",
          "meeting.attendees.user.level.*",
          "attendances.user.*", 
          "attendances.user.profile.*", 
          "attendances.user.department.*",
          "attendances.user.job.*",
          "attendances.user.level.*",
          "status.*" ,
        ],
        filter: stateFilter,
        limit,
        offset: pagination && limit ? 1 : undefined,
        page: pagination,
        meta: ['count','total_page','current_page','limit'],
      };
  
      let data = await meetingStateService.readByQuery(sanitizedQuery);
      const meta = await metaService.getMetaForQuery("meeting_states", sanitizedQuery);
  
      data = data.map((state: any) => {
        const { meeting, status } = state;
        return {
          id: meeting?.id ?? '',
          title: meeting?.title ?? '',
          topic: meeting?.topic ?? '',
          duration: meeting?.duration ?? '',
          company_id: meeting?.company ?? '',
          repeat_type: meeting?.repeat_type ?? '',
          repetition: meeting?.repetition ?? '',
          attendees: meeting?.attendees ? meeting?.attendees.map((atd: any) => ({ 
            id: atd.user.id, 
            id_number: atd.user?.profile?.id_number ?? null, 
            full_name: atd.user?.profile?.full_name ? atd.user?.profile?.full_name : atd.user?.profile?.first_name ? `${atd.user?.profile?.first_name} ${atd.user?.profile?.last_name}` : atd.user?.first_name ? `${atd.user?.first_name} ${atd.user?.last_name}` : '',
            photo: atd.user?.profile?.photo ?? null,
            cover: atd.user?.profile?.cover ?? null,
            department: atd.user?.department ?? null,
            job: atd.user?.job ?? null,
            level: atd.user?.level ?? null,
          })) : [],
          state_id: state.id,
          from_date: state.from_date,
          to_date: state.to_date,
          start_date: state.start_date,
          stop_date: state.stop_date,
          attendances: state.attendances.map((atd: any) => ({
            id: atd.user.id, 
            id_number: atd.user?.profile?.id_number ?? null, 
            full_name: atd.user?.profile?.full_name ? atd.user?.profile?.full_name : atd.user?.profile?.first_name ? `${atd.user?.profile?.first_name} ${atd.user?.profile?.last_name}` : atd.user?.first_name ? `${atd.user?.first_name} ${atd.user?.last_name}` : '',
            photo: atd.user?.profile?.photo ?? null,
            cover: atd.user?.profile?.cover ?? null,
            department: atd.user?.department ?? null,
            job: atd.user?.job ?? null,
            level: atd.user?.level ?? null,
          })),
          note: state.note,
          status: status,
          created_at: meeting?.created_at ?? null,
          updated_at: meeting?.updated_at ?? null,
        };
      });

      return {
        success: true,
        message: "Successfully Get Data",
        data,
        meta,
      }
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message ?? error);
    }
  }

  @Get(
    {
      path: "/movement/:stateId",
      tag: "Meeting",
    },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                },
                company: {
                  type: "number",
                },
                period_type: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                topic: {
                  type: "string",
                },
                event_date: {
                  type: "string",
                  format: "date-time",
                },
                duration: {
                  type: "number",
                },
                repeat_type: {
                  type: "string",
                },
                repetition: {
                  type: "object",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: "path",
          name: "stateId",
          schema: {
            type: "number",
          },
          required: true,
        },
      ],
    }
  )
  async movementDetail(@Param("stateId") stateId: number, @Req() req: any, @Context() ctx: any) {
    return DefineEndpoint.getMovementDetail(req, ctx, stateId);
  }

  static async getMovementDetail(req: any, ctx: any, stateId: number) {
    const {
      services: { ItemsService },
      exceptions: { InvalidQueryException },
      env
    } = ctx;

    const {
      ADMIN_ID,
      ADMIN_ROLE,
    } = env;

    const accountability = {
      user: ADMIN_ID,
      role: ADMIN_ROLE,
      admin: true,
      app: true,
      ip: '::1',
      userAgent: 'System/1.0.0',
      share: undefined,
      share_scope: undefined,
      permissions: []
    };

    const meetingService = new ItemsService("meetings", {
      schema: req.schema,
      accountability,
    });
    const meetingStateService = new ItemsService("meeting_states", {
      schema: req.schema,
      accountability,
    });

    const [meetingState]: [MeetingStateDTO] = await meetingStateService.readByQuery({
      filter: {
        id: {
          _eq: stateId,
        },
      },
      fields: [
        "id",
        "initial_date",
        "from_date",
        "to_date",
        "end_date",
        "next_date",
        "start_date",
        "stop_date",
        "note",
        "meeting",
        "additional",
        "attendances.user.id",
        "attendances.user.profile.id_number",
        "attendances.user.profile.full_name",
        "attendances.user.profile.photo.id",
        "attendances.user.profile.photo.filename_disk",
        "attendances.user.department.id",
        "attendances.user.department.name",
        "attendances.user.department.code",
        "attendances.user.job.id",
        "attendances.user.job.name",
        "attendances.user.job.code",
        "attendances.user.level.id",
        "attendances.user.level.name",
        "attendances.user.level.code",
        "status.id",
        "status.name",
        "status.code",
        "status.description",
      ],
    });

    if (!meetingState) throw new InvalidQueryException(`State with id ${stateId} not found`);

    const { meeting: meetingId } = meetingState;

    const [meeting]: [MeettingDTO] = await meetingService.readByQuery({
      filter: {
        id: {
          _eq: meetingId,
        },
      },
      fields: [
        "id",
        "title",
        "topic",
        "duration",
        "company",
        "repeat_type",
        "attendees.user.id",
        "attendees.user.profile.id_number",
        "attendees.user.profile.full_name",
        "attendees.user.profile.photo.id",
        "attendees.user.profile.photo.filename_disk",
        "attendees.user.department.id",
        "attendees.user.department.name",
        "attendees.user.department.code",
        "attendees.user.job.id",
        "attendees.user.job.name",
        "attendees.user.job.code",
        "attendees.user.level.id",
        "attendees.user.level.name",
        "attendees.user.level.code",
        "created_at",
      ],
    });

    if (!meeting) throw new InvalidQueryException(`Meeting with id ${meetingId} not found`);

    return {
      success: true,
      data: {
        ...meeting,
        ...meetingState,
      },
    };
  }
}
