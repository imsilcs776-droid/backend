// import { MeetingStateDTO, MeettingDTO } from '../interfaces';
import { DateOperation } from '../utils';
import * as fs from "fs";
import * as ExcelHelper from 'xlsx-js-style';
import { Adapter, Insight } from '../interfaces';
import axios from "axios";
import standardDeviation from "ml-array-standard-deviation";
import { marked } from 'marked';
import sanitizeHTML from 'sanitize-html';

const DIRECTORY = './downloads';

interface CustomStyle {
  readonly workSheet: any;
  readonly firstRow: any;
  readonly defaultStyle: any;
}

interface CustomCell {
  readonly workSheet: any;
  readonly cells: any;
}

export class AutomationHelper {
  private questionService: any
  private virtualService: any
  private credentialService: any
  private sageClassificationService: any
  private sageExpressionService: any
  private sageStatementService: any
  private userService: any
  private automationService: any
  private automationLogService: any
  private automationHandlerService: any
  private mailService: any
  private insightService: any

  constructor(
    questionService: any,
    virtualService: any,
    credentialService: any,
    sageClassificationService: any,
    sageExpressionService: any,
    sageStatementService: any,
    userService: any,
    automationService: any,
    automationLogService: any,
    automationHandlerService: any,
    mailService: any,
    insightService: any,
  ) {
    this.questionService = questionService
    this.virtualService = virtualService
    this.credentialService = credentialService
    this.sageClassificationService = sageClassificationService
    this.sageExpressionService = sageExpressionService
    this.sageStatementService = sageStatementService
    this.userService = userService
    this.automationService = automationService
    this.automationLogService = automationLogService
    this.automationHandlerService = automationHandlerService
    this.mailService = mailService
    this.insightService = insightService
  }

  // public async computeState(meeting: any, initial?: boolean, state?: any) {
  //   const {
  //     event_date,
  //     duration,
  //     repeat_type,
  //     repetition
  //   } = meeting

  //   const now = new Date()
  //   const [scheduleMeetingStatus] = await this.statusService.readByQuery({
  //     filter: {
  //       category: {
  //         _eq: 'MEETING'
  //       },
  //       is_active: {
  //         _eq: true
  //       },
  //       code: {
  //         _eq: 'SCHED'
  //       },
  //       deleted_at: {
  //         _null: true
  //       }
  //     }
  //   })
  //   const meetingState: Partial<any> = {}
  //   if (initial) {
  //     const arrangeDate = this.computePeriod(repeat_type, repetition, event_date, duration);
  //     meetingState.meeting = meeting.id;
  //     meetingState.initial_date = event_date;
  //     meetingState.from_date = arrangeDate.fromDate;
  //     meetingState.to_date = arrangeDate.toDate;
  //     meetingState.next_date = arrangeDate.nextDate;
  //     meetingState.end_date = arrangeDate.endDate;
  //     meetingState.additional = arrangeDate.additional;
  //     meetingState.status = scheduleMeetingStatus ? scheduleMeetingStatus.id : null;
  //     await this.meetingStateService.createOne(meetingState)
  //   } else {
  //     if (state) {
  //       const lastMeetingState: any = await this.meetingStateService.readOne(state.id)
  //       const arrangeDate = this.computePeriod(repeat_type, repetition, lastMeetingState.next_date, duration);
  //       meetingState.meeting = meeting.id;
  //       meetingState.initial_date = event_date;
  //       meetingState.from_date = arrangeDate.fromDate;
  //       meetingState.to_date = arrangeDate.toDate;
  //       meetingState.next_date = arrangeDate.nextDate;
  //       meetingState.end_date = arrangeDate.endDate;
  //       meetingState.additional = arrangeDate.additional;
  //       meetingState.status = scheduleMeetingStatus ? scheduleMeetingStatus.id : null;

  //       if (repeat_type == 'CUSTOM') {
  //         const { end_date, additional } = lastMeetingState;
  //         if (additional && additional.occurences == additional.counter) {
  //           return false;
  //         } else if (additional) {
  //           meetingState.additional = {
  //             ...additional,
  //             counter: additional.counter ? parseInt(additional.counter + 1) : undefined
  //           }
  //         }
  
  //         if (end_date && end_date < now) {
  //           return false;
  //         }
  //       }
  //       await this.meetingStateService.createOne(meetingState)
  //     }
  //   }
  //   return true;
  // }

  // private computePeriod(type: string, repetition: any, eventDate: Date, duration: number) {
  //   let fromDate: any = null;
  //   let toDate: any = null;
  //   let nextDate: any = null;
  //   let endDate: any = null;
  //   let additional: any = null;

  //   fromDate = eventDate;
  //   toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
  //   if (type.toUpperCase() == 'DAILY') {
  //     nextDate = DateOperation.getDateTime(fromDate, 1);
  //   } else if (type.toUpperCase() == 'WEEKLY') {
  //     nextDate = DateOperation.getDateTime(fromDate, 7);
  //   } else if (type.toUpperCase() == 'MONTHLY') {
  //     nextDate = DateOperation.getDateTime(fromDate, 0, 1);
  //   } else if (type.toUpperCase() == 'YEARLY') {
  //     nextDate = DateOperation.getDateTime(fromDate, 0, 0, 1);
  //   } else if (type.toUpperCase() == 'CUSTOM') {
  //     return this.computeCustomPeriod(repetition, eventDate, duration);
  //   }

  //   return {
  //     fromDate,
  //     toDate,
  //     nextDate,
  //     endDate,
  //     additional
  //   };
  // }

  public computePeriod(eventDate: any, interval: any, initial?: any) {
      const { unit, value } = interval;
      let startDate: any = null;
      let nextDate: any = null;
      startDate = eventDate;
      if (unit.toUpperCase() == 'HOURS') {
          nextDate = DateOperation.getDateTime(startDate, 0, 0, 0, 0, 0, Number(value));
      } else if (unit.toUpperCase() == 'DAYS') {
          nextDate = DateOperation.getDateTime(startDate, Number(value));
      } else if (unit.toUpperCase() == 'WEEKS') {
          nextDate = DateOperation.getDateTime(startDate, (Number(value) * 7));
      } else if (unit.toUpperCase() == 'MONTHS') {
          nextDate = DateOperation.getDateTime(startDate, 0, Number(value));
      } else if (unit.toUpperCase() == 'YEARS') {
          nextDate = DateOperation.getDateTime(startDate, 0, 0, Number(value));
      }

      return {
          startDate,
          nextDate
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
      fromDate = eventDate;
      toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
      nextDate = DateOperation.getDateTime(fromDate, Number(value));
    } else if (unit.toUpperCase() == 'WEEK') {
      // tempDate = this.computeDateOfWeekByDay(eventDate, day);
      fromDate = eventDate;
      toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
      nextDate = DateOperation.getDateTime(fromDate, (Number(value) * 7));
    } else if (unit.toUpperCase() == 'MONTH') {
      fromDate = eventDate;
      toDate = DateOperation.getDateTime(fromDate, 0, 0, 0, 0, Number(duration), 0);
      nextDate = DateOperation.getDateTime(fromDate, 0, Number(value));
    } else if (unit.toUpperCase() == 'YEAR') {
      fromDate = eventDate;
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

  private computeBorder(border: any, group: any) {
      const [width, style, color] = border.split(" ");
      if (style && style.toUpperCase() == 'SOLID') {
          const type = width ? Number(width.substring(0, 1)) : 1;
          return {
              top: group == 'ALL' || group == 'TOP' ? { style: type == 1 ? 'thin' : type == 2 ? 'medium' : type == 3 ? 'thick' : '', color: { rgb: color.replace('#', '') } } : undefined,
              bottom: group == 'ALL' || group == 'BOTTOM' ? { style: type == 1 ? 'thin' : type == 2 ? 'medium' : type == 3 ? 'thick' : '', color: { rgb: color.replace('#', '') } } : undefined,
              left: group == 'ALL' || group == 'LEFT' ? { style: type == 1 ? 'thin' : type == 2 ? 'medium' : type == 3 ? 'thick' : '', color: { rgb: color.replace('#', '') } } : undefined,
              right: group == 'ALL' || group == 'RIGHT' ? { style: type == 1 ? 'thin' : type == 2 ? 'medium' : type == 3 ? 'thick' : '', color: { rgb: color.replace('#', '') } } : undefined,

          }
      } else if (style && style.toUpperCase() == 'DASHED') {
          return {
              top: group == 'ALL' || group == 'TOP' ? { style: 'dashed', color: { rgb: color.replace('#', '') } } : undefined,
              bottom: group == 'ALL' || group == 'BOTTOM' ? { style: 'dashed', color: { rgb: color.replace('#', '') } } : undefined,
              left: group == 'ALL' || group == 'LEFT' ? { style: 'dashed', color: { rgb: color.replace('#', '') } } : undefined,
              right: group == 'ALL' || group == 'RIGHT' ? { style: 'dashed', color: { rgb: color.replace('#', '') } } : undefined,

          }
      } else if (style && style.toUpperCase() == 'DOTTED') {
          return {
              top: group == 'ALL' || group == 'TOP' ? { style: 'dotted', color: { rgb: color.replace('#', '') } } : undefined,
              bottom: group == 'ALL' || group == 'BOTTOM' ? { style: 'dotted', color: { rgb: color.replace('#', '') } } : undefined,
              left: group == 'ALL' || group == 'LEFT' ? { style: 'dotted', color: { rgb: color.replace('#', '') } } : undefined,
              right: group == 'ALL' || group == 'RIGHT' ? { style: 'dotted', color: { rgb: color.replace('#', '') } } : undefined,

          }
      } else {
          return {
              top: group == 'ALL' || group == 'TOP' ? { style: 'medium', color: { rgb: color.replace('#', '') } } : undefined,
              bottom: group == 'ALL' || group == 'BOTTOM' ? { style: 'medium', color: { rgb: color.replace('#', '') } } : undefined,
              left: group == 'ALL' || group == 'LEFT' ? { style: 'medium', color: { rgb: color.replace('#', '') } } : undefined,
              right: group == 'ALL' || group == 'RIGHT' ? { style: 'medium', color: { rgb: color.replace('#', '') } } : undefined,
          }
      }
  }

  private setupBorder(style: any) {
      const { 
          border,
          borderTop,
          borderBottom,
          borderLeft,
          borderRight
      }: any = style;
      let setup: any = {};
      if (border) {
          setup = { ...setup, ...this.computeBorder(border, 'ALL') };
      } 
      if (borderTop) {
          setup = { ...setup, ...this.computeBorder(borderTop, 'TOP') };
      } 
      if (borderBottom) {
          setup = { ...setup, ...this.computeBorder(borderBottom, 'BOTTOM') };
      }
      if (borderLeft) {
          setup = { ...setup, ...this.computeBorder(borderLeft, 'LEFT') };
      }
      if (borderRight) {
          setup = { ...setup, ...this.computeBorder(borderRight, 'RIGHT') };
      }

      return setup;
  }

  private excelStyleMapper(cell: any, style: object) {
      const { 
          textAlign,
          backgroundColor, 
          fontFamily, 
          fontWeight,
          fontStyle,
          fontSize, 
          color,
          textDecoration,
          verticalAlign
      }: any = style;

      let font: any = {};
      let alignment: any = {};
      let border: any = {};

      // Configure font
      fontFamily ? font['name'] = fontFamily : null;
      fontSize ? font['sz'] = fontSize : null;
      fontWeight && fontWeight.toUpperCase() == 'BOLD' ? font['bold'] = true : null;
      fontStyle && fontStyle.toUpperCase() == 'BOLD' ? font['italic'] = true : null;
      color ? font['color'] = { rgb: color.replace('#', '') } : null;
      textDecoration && textDecoration.toUpperCase() == 'UNDERLINE' ? font['underline'] = true : null;
      textDecoration && textDecoration.toUpperCase() == 'LINE-THROUGH' ? font['strike'] = true : null;

      // Configure alignment
      textAlign ? alignment['horizontal'] = textAlign.toLowerCase() : null;
      verticalAlign && verticalAlign.toUpperCase() == 'MIDDLE' ? alignment['vertical'] = 'center' : verticalAlign ? alignment['vertical'] = verticalAlign.toLowerCase() : null;
      
      // Configure border
      border = this.setupBorder(style);

      let setup: any = null;
      if (cell && cell.hasOwnProperty('s')) {
          setup = {
              ...cell,
              s: {
                  ...cell.s,
                  font: cell['s'].hasOwnProperty('font') ? {
                      ...cell.s.font,
                      ...font
                  } : {
                      ...font
                  },
                  alignment: cell['s'].hasOwnProperty('alignment') ? {
                      ...cell.s.alignment,
                      ...alignment
                  } : {
                      ...alignment
                  },
                  border: cell['s'].hasOwnProperty('border') ? {
                      ...cell.s.border,
                      ...border
                  } : {
                      ...border
                  }
              }
          }
      } else {
          setup = {
              ...cell,
              s: {
                  font: { ...font },
                  alignment: { ...alignment }
              }
          }
      }

      if (backgroundColor) {
          setup.s['fill'] = { fgColor: { rgb: backgroundColor.replace('#', '') } };
      }
      return setup;
  }

  private parseStyle(customStyle: CustomStyle) {
      let { workSheet, defaultStyle, firstRow } = customStyle;
      const row = Number(firstRow.substring(1));
      
      if (defaultStyle) {
          const { header, body } = defaultStyle;
          Object.keys(workSheet).filter(key => key != '!ref').map(key => {
              if (Number(key.substring(1)) == row && !workSheet[`${key}`].hasOwnProperty('s')) {
                  workSheet[key] = this.excelStyleMapper(workSheet[key], header);
              } else if (Number(key.substring(1)) > row && !workSheet[`${key}`].hasOwnProperty('s')) {
                  workSheet[key] = this.excelStyleMapper(workSheet[key], body);
              }
              return key;
          });
      }

      return workSheet;
  }

  private parseCell(customCell: CustomCell) {
      let { workSheet, cells } = customCell;

      for (const item of cells) {
          const { cell_range, action, properties } = item;
          const [startCell, endCell] = cell_range ? cell_range.split(':') : [];
          if (action && action.toUpperCase() == 'MERGE' && startCell && endCell) {
              workSheet['!merges'] = [
                  {
                      s: ExcelHelper.utils.decode_cell(startCell),
                      e: ExcelHelper.utils.decode_cell(endCell),
                  }
              ]
          } else if (action && action.toUpperCase() == 'FORMAT') {
              if (startCell && endCell && String(startCell) != String(endCell)) {
                  const range = ExcelHelper.utils.decode_range(`${cell_range}`);
                  for(let R = range.s.r; R <= range.e.r; ++R) {
                      for(let C = range.s.c; C <= range.e.c; ++C) {
                          const cellAddress = {c:C, r:R};
                          const cellRef = ExcelHelper.utils.encode_cell(cellAddress);
                          workSheet[`${cellRef}`] = workSheet.hasOwnProperty(`${cellRef}`) ? { ...workSheet[`${cellRef}`], ...this.excelStyleMapper(workSheet[`${cellRef}`], properties) } : { ...this.excelStyleMapper(workSheet[`${cellRef}`], properties) }
                      }
                  }
              } else {
                  workSheet[`${startCell}`] = workSheet.hasOwnProperty(`${startCell}`) ? { ...workSheet[`${startCell}`], ...this.excelStyleMapper(workSheet[`${startCell}`], properties) } : { ...this.excelStyleMapper(workSheet[`${startCell}`], properties) };
              }
          } else if (action && action.toUpperCase() == 'CELLSAVE') {
              const { value } = properties;
              workSheet[`${startCell}`] = workSheet.hasOwnProperty(`${startCell}`) ? { ...workSheet[`${startCell}`], t: 's', v: value ? value : '' } : { t: 's', v: value ? value : '' };
          }
      }
      
      return workSheet;
  }

  private async sage(insight: any) {
    try {
      const [credential] = await this.credentialService.readByQuery({
        fields: ["*", "dialect.*"],
        filters: {
          id: {
            _eq: insight.credential,
          },
        },
      });
  
      if (!credential) throw new Error("Can't get credential");
  
      const statements = await this.sageStatementService.readByQuery({
        fields: ["*"],
        filters: {
          dialect: {
            _eq: credential.dialect.id,
          },
        },
      });
  
      const expressions = await this.sageExpressionService.readByQuery({
        fields: ["*"],
        filters: {
          dialect: {
            _eq: credential.dialect.id,
          },
        },
      });
  
      const classifications = await this.sageClassificationService
        .readByQuery({
          filter: {
            dialect: {
              _eq: credential.dialect.id,
            },
          },
          fields: ["template.syntax", "*"],
        })
        .then((res: any[]) => {
          return res.map((classification) => {
            let {
              custom_column,
              join,
              filter,
              sort,
              summarize,
              summarize_by,
              limit_row,
              template: { syntax },
              weight,
            } = classification;
            const models = [
              custom_column,
              join,
              filter,
              sort,
              summarize,
              summarize_by,
              limit_row,
            ];
  
            if (!weight) weight = standardDeviation(models);
  
            return {
              models, // [1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07]
              weight, // std. dev
              syntax, // SELECT #columns FROM #table
            };
          });
        })
        .catch(() => undefined);
  
      const sample = {
        model: Array.from({ length: 7 }, (_v, _i) => 0),
        weight: 0,
        syntax: "",
      };
  
      if (insight.custom_columns.length > 0) sample.model[0] = 1.01;
      if (insight.join) sample.model[1] = 1.02;
      if (insight.filters.length > 0) sample.model[2] = 1.03;
      if (insight.sorts.length > 0) sample.model[3] = 1.04;
      if (insight.summarizes.length > 0) sample.model[4] = 1.05;
      if (insight.summarizes_by.length > 0) sample.model[5] = 1.06;
      if (insight.limit_row > 0) sample.model[6] = 1.07;
  
      // [1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07]
  
      sample.weight = standardDeviation(sample.model);
  
      const [distance] = classifications
        .map((d: { syntax: any; weight: number }) => {
          return {
            syntax: d.syntax,
            distance: Math.abs(d.weight - sample.weight),
          };
        })
        .sort((a: any, b: any) => a.distance - b.distance);
  
      sample.syntax = distance.syntax;
  
      if (credential.dialect.prefix_query)
        sample.syntax = `${credential.dialect.prefix_query} ${sample.syntax}`;
      if (!insight.database) throw new Error("database undefined");
      if (!insight.table) throw new Error("table undefined");
      const columns = insight.columns
        .map((d: { name: any; as: any }) => `${d.name} AS ${d.as}`)
        .join(", "); // name AS name, code AS code
      const conditions = insight.filters
        .map(
          (d: { column: any; operator: any; value: any }) =>
            `${d.column} ${d.operator} ${d.value}`
        ) // ["column_name #equal 1", "column_name2 #not_equal 2"]
        .join(" AND "); // column_name #equal 1 AND column_name2 #not_equal 2
      const orders = insight.sorts
        .map((d: { column: any; type: any }) => `${d.column} ${d.type}`)
        .join(", ");
      const summarizes_by = insight.summarizes_by.map((d: any) => `${d}`).join(", ");
      const summarizes = insight.summarizes.map((d: any) => `${d.function}("${d.column}") AS ${d.name}`).join(", ")
      const custom_columns = insight.custom_columns.map((d: any) => `${d.formula} AS ${d.name}`).join(", ")
  
      sample.syntax = sample.syntax
        .replace(/#database/g, insight.database)
        .replace(/#table/g, insight.table)
        .replace(/#columns/g, columns)
        .replace(/#conditions/g, conditions)
        .replace(/#orders/g, orders)
        .replace(/#summarizes_by/g, summarizes_by)
        .replace(/#summarizes/g, summarizes)
        .replace(/#custom_columns/g, custom_columns)
  
      for (const statement of statements) {
        sample.syntax = sample.syntax.replace(
          new RegExp(statement.placement, "g"),
          statement.name
        );
      }
  
      for (const expression of expressions) {
        sample.syntax = sample.syntax.replace(
          new RegExp(expression.placement, "g"),
          expression.expression
        );
      }
  
      if (insight.join) {
        sample.syntax = sample.syntax
          .replace(/#join_type/g, String(insight.join.join_type).toUpperCase())
          .replace(/#table/g, insight.table)
          .replace(/#left_column/g, insight.join.left_column)
          .replace(/#right_table/g, insight.join.right_table)
          .replace(/#right_column/g, insight.join.right_column);
      }
  
      if (insight.limit_row > -1)
        sample.syntax = sample.syntax.replace(
          /#limit_row/g,
          String(insight.limit_row)
        );
  
      return {
        result: sample,
        error: undefined,
      };
    } catch (err) {
      return {
        result: undefined,
        error: err as Error,
      };
    }
  }

  private async insight(id: number, customInsight: Insight) {
    try {
      // const insight = await this.insightService.readOne(id);
      const insight = await this.questionService.readOne(id);

      if (!insight) throw 'Insight not found';
      if (!insight.options?.credential) throw 'credential not found';

      const credential = await this.credentialService.readOne(insight.options?.credential, {
				fields: ["*", "dialect.*"],
      });

      const results: any = await this.sage({ ...insight.options, ...customInsight });

      if (results.error) throw results.error;

      const { data: dataRes } = await axios.post(
        `${credential.dialect.executor_url}/preview`,
        {
          host: credential.host,
          user: credential.username,
          password: credential.password,
          port: credential.port,
          query: results.result.syntax as string,
        }
      );

      return {
        data: {
          headers: insight.options?.columns.map((col: any) => ({ header_name: col.as, field: col.as })),
          data: dataRes.data,
        },
        message: 'Succesfully get detail',
      };
    } catch (e) {
      return e;
      // return Response.errorGrpc(e);
    }
  }

  private async visualize(id: number) {
    try {
      // const insight = await this.insightService.readOne(id);
      const insight = await this.questionService.readOne(id);

      if (!insight) throw 'Insight not found';
      if (!insight.options?.credential) throw 'credential not found';

      const credential = await this.credentialService.readOne(insight.options?.credential, {
				fields: ["*", "dialect.*"],
      });

      const results: any = await this.sage(insight.options);

      if (results.error) throw results.error;

      const { data: dataRes } = await axios.post(
        `${credential.dialect.executor_url}/preview`,
        {
          host: credential.host,
          user: credential.username,
          password: credential.password,
          port: credential.port,
          query: results.result.syntax as string,
        }
      );

      return {
        data: {
          headers: insight.options?.columns.map((col: any) => ({ header_name: col.as, field: col.as })),
          data: dataRes.data,
        },
        message: 'Succesfully get detail',
      };
    } catch (e) {
      return e;
      // return Response.errorGrpc(e);
    }
  }

  public async computeSources(fileName: any, sources: any, extension?: any, additional?: any) {
    try {
      const { default_style, custom_cells, isToBlob }: any = additional ? additional : {};
      
      if (!fs.existsSync(DIRECTORY)) {
          fs.mkdirSync(DIRECTORY);
      }

      const sheets = sources.reduce((acc: any, source: any) => {
          if (acc.length <= 0) {
              acc.push(source.sheet_name);
          } else if (!acc.includes(source.sheet_name)) {
              acc.push(source.sheet_name);
          }
          return acc;
      }, []);

      const workBook = ExcelHelper.utils.book_new();

      if (sheets.length <= 0) {
          ExcelHelper.utils.book_append_sheet(workBook, ExcelHelper.utils.json_to_sheet([]), `Sheet 1`);
      }

      for (const sheet of sheets) {
          let workSheet = ExcelHelper.utils.json_to_sheet([]);
          const dataSources = sources.filter((source: any) => source.sheet_name === sheet);
          
          for (const dataSource of dataSources) {
              const filters: any = [];
              let collections: any = [];
              const { startDate, endDate }: any = dataSource.filter ? dataSource.filter  : {};
              if (startDate) {
                  filters.push({
                      property: 'created_at',
                      operator: '>=',
                      value: new Date(startDate)
                  })
              }
              if (endDate) {
                  filters.push({
                      property: 'created_at',
                      operator: '<=',
                      value: new Date(endDate)
                  })
              }

              if (dataSource.source && (dataSource.source.toUpperCase() == 'QUESTION' || dataSource.source.toUpperCase() == 'QUESTION')) {
                  let question: any = await this.visualize(dataSource.reference);
                  if (filters.length > 0) {
                      question = await this.insight(dataSource.reference, { filters });
                  }
                  
                  const { headers, data }: any = question?.data ? question?.data : {};
                  collections = (data || []).map((dt: any) => {
                      const temp = Object.keys(dt).reduce((acc, key) => {
                          const [header] = headers.filter((header: any) => header.field == key);
                          acc = {
                              ...acc,
                              [`${header.header_name}`]: dt[key]
                          }
                          return acc;
                      }, {})
                      return temp;
                  })
              }
              ExcelHelper.utils.sheet_add_json(workSheet, collections, { origin: `${dataSource.first_row}` });
              workSheet = this.parseStyle({
                  workSheet,
                  firstRow: dataSource.first_row,
                  defaultStyle: default_style,
              });
          }
          workSheet = this.parseCell({
              workSheet,
              cells: custom_cells ? custom_cells.filter((custom: any) => custom.sheet_name === sheet) : []
          });

          ExcelHelper.utils.book_append_sheet(workBook, workSheet, `${sheet}`);
      }

      return new Promise((resolve, reject) => {
          try {
            if (isToBlob) {
              const data = ExcelHelper.write(workBook, {type: 'buffer'})
              resolve(data)
            } else {
              ExcelHelper.writeFile(workBook, `${DIRECTORY}/${fileName}`);
              resolve(`${DIRECTORY}/${fileName}`)
            }
          } catch (e) {
            reject(null)
          }
      });
    } catch (error) {
      console.log(error);
    }
  }

  private md(str: string): string {
    return sanitizeHTML(marked(str));
  }

  private async computeAutomation(properties: any) {
    try {
      const { isManual, automation, path } = properties;
      if (isManual) {
        const { subject, message, method, recipients } = properties;
        const users = await this.userService.readByQuery({
          filter: {
            id: {
              _in: recipients,
            },
          },
        });

        console.log(path);

        if (users.length > 0) {
          if (method && method.toUpperCase() == 'EMAIL') {
            await this.mailService.send({
              template: {
                name: 'base',
                data: {
                  html: message ? this.md(message) : '',
                },
              },
              to: users.map((user: any) => user.email),
              subject: subject,
              attachments: [
                {
                  filename: `${automation.title.split(' ').join('_')}.${automation.extension ? automation.extension.toLowerCase() : 'xlsx'}`,
                  content: path,
                },
              ],
            })
          }
        }
      } else {
        const automationData = await this.automationService.readOne(automation.id, {
          fields: ["*", "recipients.*"]
        });
    
        if (automationData) {
          const { subject, message, method, recipients } = automationData;
    
          if (recipients.length > 0) {
            if (method && method.toUpperCase() == 'EMAIL') {
              await this.mailService.send({
                template: {
                  name: 'base',
                  data: {
                    html: message ? this.md(message) : '',
                  },
                },
                to: recipients.map((user: any) => user.email),
                subject: subject,
              })
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
    
  }

  public async removeFile(path: any) {
      return new Promise((resolve, reject) => {
          fs.unlinkSync(`${path}`);
          resolve('Deleting file has been successfully.');
      })
  }

  public async populateTask(properties: any) {
    try {
      const { isManual }: any = properties ? properties : {};
      const automationLogBaseDTO: any = {};
      if (isManual) {
        const { automation, userId, recipients, method, subject, message, startDate, endDate } = properties;
        automationLogBaseDTO.company = automation.company;
        automationLogBaseDTO.reference = automation ? automation.id : null;
        automationLogBaseDTO.is_manual = true;
        automationLogBaseDTO.start_date = new Date();
        automationLogBaseDTO.method = method.toUpperCase();
        automationLogBaseDTO.recipients = recipients.map((rcp: string) => ({ user: { id: rcp } }));
        automationLogBaseDTO.subject = subject;
        automationLogBaseDTO.message = message;
        automationLogBaseDTO.sources = automation.sources.map((source: any) => {
          return {
            ...source,
            filter: {
              startDate: startDate ? new Date(startDate) : undefined,
              endDate: endDate ? new Date(endDate) : undefined
            }
          }
        });
        automationLogBaseDTO.extension = automation.extension;
        automationLogBaseDTO.file_name = `${automation.title.split(' ').join('_')}#${DateOperation.getDate(automationLogBaseDTO.start_date)}_${DateOperation.getTimePicker(automationLogBaseDTO.start_date).split(':').join('-')}.${automation.extension ? automation.extension.toLowerCase() : 'xlsx'}`;

        // Generating a file
        const path: any = await this.computeSources(automationLogBaseDTO.fileName, automationLogBaseDTO.sources, automation.extension ? automation.extension : 'XLSX', automation ? { ...automation.additional, isToBlob: true } : { isToBlob: true });

        // Process sending a automation of report
        let response: any = null;
        if (path) {
          response = await this.computeAutomation({
            ...properties,
            path
          });
          // await this.removeFile(`${path}`);
        } else {
          response = 'Generating file has been failed.';
        }

        automationLogBaseDTO.response = response;
        automationLogBaseDTO.endDate = new Date();
        await this.automationLogService.createOne(automationLogBaseDTO);
      } else {
        return new Promise(async (resolve, reject) => {
          const { data: handlers, success, message } = await this.automationHandlerService.findAll({
            filter: {
              isActive: {
                _eq: true
              },
              startDate: {
                _lte: new Date()
              },
            }
          });

          if (handlers.length > 0) {
            const automations = await this.automationService.readByQuery({
              filter: {
                id: {
                  _in: handlers.map((handler: any) => handler.automationId),
                },
              },
            });
            // const { data: automations } = await this.findAll({
            //   _id: { $in: handlers.map(handler => Types.ObjectId(handler.automationId)) }
            // }, {
            //   isTransform: false
            // });

            for (const handler of handlers) {
              const [automation] = automations.filter((automation: any) => automation._id == handler.automationId);
              automationLogBaseDTO.company = automation ? automation.company : null;
              automationLogBaseDTO.reference = automation ? automation.id : null;
              automationLogBaseDTO.is_manual = false;
              automationLogBaseDTO.start_date = new Date();
              automationLogBaseDTO.sources = automation ? automation.sources : [];
              automationLogBaseDTO.extension = automation ? automation.extension : '';
              automationLogBaseDTO.file_name = automation ? `${automation.title.split(' ').join('_')}#${DateOperation.getDate(automationLogBaseDTO.start_date)}_${DateOperation.getTimePicker(automationLogBaseDTO.start_date).split(':').join('-')}.${automation.extension ? automation.extension.toLowerCase() : 'xlsx'}` : '';

              // Generating a file
              const path: any = await this.computeSources(automationLogBaseDTO.fileName, automation.sources, automation.extension ? automation.extension : 'XLSX', automation ? { ...automation.additional, isToBlob: true } : { isToBlob: true });

              // Process sending a automation of report
              let response: any = null;
              if (path) {
                response = await this.computeAutomation({ 
                  automationId: handler.automationId,
                  path
                });
                
                // await this.removeFile(`${path}`);
              } else {
                response = 'Generating file has been failed.';
              }
            
              automationLogBaseDTO.response = response;
              automationLogBaseDTO.endDate = new Date();
              await this.automationLogService.createOne(automationLogBaseDTO);

              // if (success) {
              const { startDate, nextDate } = this.computePeriod(handler.nextDate, automation ? automation.interval : null);
              const automationHandlerDTO: any = {};
              automationHandlerDTO.startDate = startDate;
              automationHandlerDTO.nextDate = nextDate;
              await this.automationHandlerService.updateOne(handler.id, automationHandlerDTO);
              // }
            }
          }
          resolve({
            success,
            message,
            data: handlers
          });
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  public async start(id: number) {
    const automation = await this.automationService.readOne(id);

    if (automation) {
      const { interval, start_date: event_date } = automation;
      let handler: any = null;
      let success: any = false;
      // ({ data:handler } = await this.automationHandlerService.readByQuery({
      //   automationId: Types.ObjectId(automation.id)
      // }));
      [ handler ] = await this.automationHandlerService.readByQuery({
        filter: {
          automation: {
            _eq: id,
          },
        },
      });
      if (!handler) {
        const { startDate, nextDate } = this.computePeriod(event_date, interval);
        const automationHandlerDTO : any = {};
        automationHandlerDTO.automation = automation.id;
        automationHandlerDTO.initial_date = startDate;
        automationHandlerDTO.start_date = startDate;
        automationHandlerDTO.next_date = nextDate;
        automationHandlerDTO.is_active = true;

        handler = await this.automationHandlerService.createOne(automationHandlerDTO);
        if (handler) success = true;

        return {
          success,
          message: success ? 'This automation has been started successfully.' : 'This automation has been started unsuccessfully.',
          data: handler
        }
      } else if (handler && !handler.is_active) {
        const { startDate, nextDate } = this.computePeriod(handler.next_date, interval);
        const automationHandlerDTO: any = handler;
        automationHandlerDTO.startDate = startDate;
        automationHandlerDTO.nextDate = nextDate;
        automationHandlerDTO.isActive = true;
        
        handler = await this.automationHandlerService.updateOne(handler.id, automationHandlerDTO);
        if (handler) success = true;

        return {
          success,
          message: success ? 'This automation has been re-started successfully.' : 'This automation has been re-started unsuccessfully.',
          data: handler
        }
      } else if (handler && handler.is_active) {
        return {
          success: false,
          message: 'This automation has ever been activated.',
          data: null
        }
      }     
    }

    return {
      success: false,
      message: "Automation Not Found",
      data: automation
    }
  }
}
