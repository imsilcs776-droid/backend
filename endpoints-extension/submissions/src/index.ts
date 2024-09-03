import {
  Body,
  Context,
  Endpoint,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Res,
} from '@mv-data-core/decorator'

@Endpoint('submissions')
export default class DefineEndpoint {
  @Get(
    { path: '/last', tag: 'Submissions' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: 'query',
          name: 'form_id',
          schema: {
            type: 'number',
          },
          required: true,
        },
      ],
    }
  )
  async detail(
    @Req() req: any,
    @Query('form_id') form_id: number,
    @Context() ctx: any
  ) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = ctx

    const submissionService = new ItemsService('submissions', {
      schema: req.schema,
      accountability: req.accountability,
    })

    try {
      const submission = await submissionService.readByQuery({
        filter: {
          form: {
            _eq: Number(form_id),
          },
        },
        sort: ['-submission_number'],
      })

      return {
        success: true,
        message: 'Successfully get last submission',
        data: submission[0],
      }
    } catch (error: any) {
      throw new ServiceUnavailableException(error?.message ?? error)
    }
  }

  @Get(
    { path: '/:submission_id/data', tag: 'Submissions' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async submissionData(
    @Req() req: any,
    @Param('submission_id') submissionId: number,
    @Context() ctx: any
  ) {
    const {
      exceptions: { ServiceUnavailableException },
      database,
    } = ctx

    try {
      /**
       * find submission data
       */
      const {
        data: { detail },
      } = (await database('submissions')
        .select('submissions.data')
        .where('submissions.id', submissionId)
        .first()) || { data: { detail: {} } }

      const data = Object.keys(detail).reduce((acc: any, ctx: string) => {
        acc[ctx] = detail[ctx].value
        return acc
      }, {})

      return {
        success: true,
        message: 'Successfully get last submission',
        data,
      }
    } catch (error: any) {
      throw new ServiceUnavailableException(error?.message ?? error)
    }
  }

  @Get(
    { path: '/:submission_id/officers', tag: 'Submissions' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async officers(
    @Context() ctx: any,
    @Req() req: any,
    @Param('submission_id') submissionId: number
  ) {
    const { database } = ctx

    try {
      const { id, version } =
        (await database('file_publishers')
          .select('file_publishers.id', 'document_metas.version')
          .join(
            'document_metas',
            'document_metas.submission',
            'file_publishers.submission'
          )
          .join('statuses', 'statuses.id', 'file_publishers.status')
          .where('file_publishers.submission', submissionId)
          .where('statuses.code', 'PUBLS')
          .first()) || {}

      if (!id) {
        return {
          success: true,
          message: 'this submission not yet publish',
          data: {},
        }
      }

      if (version > 1) {
        const createdByQuery = await database('form_logs')
          .select(
            'form_logs.id',
            'statuses.name as status',
            'form_logs.reject_number',
            'approve_orders.order',
            'form_logs.created_at',
            'form_logs.assignee_log'
          )
          .join('statuses', 'statuses.id', 'form_logs.status')
          .join(
            'approve_orders',
            'approve_orders.id',
            'form_logs.approve_order'
          )
          .where('form_logs.submission', submissionId)
          .where('approve_orders.order', 1)
          .whereNull('approve_orders.deleted_at')
          .orderBy('form_logs.created_at', 'desc')
          .limit(1)

        const higestReject = database('form_logs AS fl')
          .max('fl.reject_number')
          .where('fl.submission', submissionId)
          .as('max_number_reject')

        const checkedByQuery = await database('form_logs')
          .select(
            'form_logs.id',
            'statuses.name as status',
            'form_logs.reject_number',
            'approve_orders.order',
            'form_logs.created_at',
            'form_logs.assignee_log'
          )
          .join('statuses', 'statuses.id', 'form_logs.status')
          .join(
            'approve_orders',
            'approve_orders.id',
            'form_logs.approve_order'
          )
          .join(
            higestReject,
            'max_number_reject.max',
            'form_logs.reject_number'
          )
          .where('form_logs.submission', submissionId)
          .where('approve_orders.order', 2)
          // .where('statuses.code', 'APPRD')
          .whereNull('approve_orders.deleted_at')
          .orderBy('form_logs.reject_number', 'desc')

        const approveByQuery = await database('form_logs')
          .select(
            'form_logs.id',
            'statuses.name as status',
            'form_logs.reject_number',
            'approve_orders.order',
            'form_logs.created_at',
            'form_logs.assignee_log'
          )
          .join('statuses', 'statuses.id', 'form_logs.status')
          .join(
            'approve_orders',
            'approve_orders.id',
            'form_logs.approve_order'
          )
          .where('form_logs.submission', submissionId)
          .where('approve_orders.order', 3)
          .whereNull('approve_orders.deleted_at')
          .orderBy('form_logs.reject_number', 'desc')
          .orderBy('form_logs.created_at', 'desc')
          .limit(1)

        const publisedByQuery = await database('form_logs')
          .select(
            'form_logs.id',
            'statuses.name as status',
            'form_logs.reject_number',
            'approve_orders.order',
            'form_logs.created_at',
            'form_logs.assignee_log'
          )
          .join('statuses', 'statuses.id', 'form_logs.status')
          .join(
            'approve_orders',
            'approve_orders.id',
            'form_logs.approve_order'
          )
          .where('form_logs.submission', submissionId)
          .whereNull('approve_orders.deleted_at')
          .orderBy('form_logs.reject_number', 'desc')
          .orderBy('form_logs.created_at', 'desc')
          .orderBy('approve_orders.order', 'desc')
          .limit(2)

        const data = {
          created_by: createdByQuery.map((a: any) => {
            return {
              ...a,
              is_replacement: 0,
              full_name: a.assignee_log.full_name,
              job_title: a.assignee_log?.full_name?.split('#')[1]?.trim(),
            }
          }),
          checked_by: checkedByQuery.map((a: any) => {
            return {
              ...a,
              is_replacement: 0,
              job_title: a.assignee_log?.full_name?.split('#')[1]?.trim(),
              full_name: a.assignee_log.full_name,
            }
          }),
          approved_by: approveByQuery.map((a: any) => {
            return {
              ...a,
              is_replacement: 0,
              job_title: a.assignee_log?.full_name?.split('#')[1]?.trim(),
              full_name: a.assignee_log.full_name,
            }
          }),
          published_by: publisedByQuery
            .sort((a: any, b: any) => {
              return a.order - b.order
            })
            .map((a: any) => {
              return {
                ...a,
                is_replacement: 0,
                job_title: a.assignee_log?.full_name?.split('#')[1]?.trim(),
                full_name: a.assignee_log.full_name,
              }
            }),
        }

        return {
          success: true,
          message: 'Successfully Get Submission Officer',
          data,
        }
      }

      const createdByQuery = await database('form_logs')
        .select(
          'form_logs.id',
          'statuses.name as status',
          'form_logs.reject_number',
          'approve_orders.order',
          'form_logs.created_at',
          // database.raw(
          //   "CONCAT(CAST('Staff ' AS VARCHAR), document_logs.department_name) as job_title"
          // ),
          'directus_users.i_job_name as job_title',
          database.raw("CAST('0' AS INTEGER) as is_replacement"),
          'directus_users.full_name as officer'
        )
        .join('statuses', 'statuses.id', 'form_logs.status')
        .join('directus_users', 'directus_users.id', 'form_logs.created_by')
        .join('document_logs', 'document_logs.form_log', 'form_logs.id')
        .join('approve_orders', 'approve_orders.id', 'form_logs.approve_order')
        .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
        .join('form_assesors', function (qb: any) {
          qb.on('form_assesors.form_actor', '=', 'form_actors.id')
          qb.on('form_assesors.submission', '=', 'form_logs.submission')
        })
        .where('form_logs.submission', submissionId)
        .where('approve_orders.order', 1)
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .whereNull('form_assesors.deleted_at')
        .orderBy('form_logs.reject_number', 'desc')
        .limit(1)

      const higestReject = database('form_logs AS fl')
        .max('fl.reject_number')
        .where('fl.submission', submissionId)
        .as('max_number_reject')

      const assesorLatestSubQuery = database
        .select('*')
        .from(
          database('form_assesors')
            .select(
              'form_assesors.*',
              database.raw(
                'ROW_NUMBER() OVER (PARTITION BY ??, ?? ORDER BY ?? DESC) as row_num',
                ['form_actor', 'submission', 'created_at'] // Assuming `created_at` is the correct column to order by
              )
            )
            .where('form_assesors.submission', submissionId) // Filter by submissionId in the subquery
            .as('fa')
        )
        .where('row_num', 1) // Filter to keep only the first row (latest)
        .as('ffa')

      const checkedByQuery = await database('form_logs')
        .select(
          'form_logs.id',
          'statuses.name as status',
          'form_logs.reject_number',
          'approve_orders.order',
          'form_logs.created_at',
          // 'document_logs.job_title',
          database.raw(
            'CASE WHEN ffa.replaced IS NOT NULL THEN user_rep.i_job_name ELSE user_ass.i_job_name END AS job_title'
          ),
          database.raw(
            "CASE WHEN ffa.replaced IS NOT NULL THEN CAST('1' AS INTEGER) ELSE CAST('0' AS INTEGER) END AS is_replacement"
          ),
          database.raw(
            'CASE WHEN ffa.replaced IS NOT NULL THEN user_rep.full_name ELSE user_ass.full_name END AS officer'
          )
        )
        .join('statuses', 'statuses.id', 'form_logs.status')
        .join('approve_orders', 'approve_orders.id', 'form_logs.approve_order')
        .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
        .join(assesorLatestSubQuery, function (qb: any) {
          qb.on('ffa.form_actor', '=', 'form_actors.id')
          qb.on('ffa.submission', '=', 'form_logs.submission')
        })
        .leftJoin('directus_users as user_ass', 'user_ass.id', 'ffa.officer')
        .leftJoin('directus_users as user_rep', 'user_rep.id', 'ffa.replaced')
        .join('document_logs', 'document_logs.form_log', 'form_logs.id')
        .join(higestReject, 'max_number_reject.max', 'form_logs.reject_number')
        .where('form_logs.submission', submissionId)
        .where('approve_orders.order', 2)
        .where('statuses.code', 'APPRD')
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .whereNull('ffa.deleted_at')
        .orderBy('form_logs.reject_number', 'desc')

      const approveByQuery = await database('form_logs')
        .select(
          'form_logs.id',
          'statuses.name as status',
          'form_logs.reject_number',
          'approve_orders.order',
          'form_logs.created_at',
          // 'document_logs.job_title',
          database.raw(
            'CASE WHEN form_assesors.replaced IS NOT NULL THEN user_rep.i_job_name ELSE user_ass.i_job_name END AS job_title'
          ),
          database.raw(
            "CASE WHEN form_assesors.replaced IS NOT NULL THEN CAST('1' AS INTEGER) ELSE CAST('0' AS INTEGER) END AS is_replacement"
          ),
          database.raw(
            'CASE WHEN form_assesors.replaced IS NOT NULL THEN user_rep.full_name ELSE user_ass.full_name END AS officer'
          )
        )
        .join('statuses', 'statuses.id', 'form_logs.status')
        .join('approve_orders', 'approve_orders.id', 'form_logs.approve_order')
        .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
        .join('form_assesors', function (qb: any) {
          qb.on('form_assesors.form_actor', '=', 'form_actors.id')
          qb.on('form_assesors.submission', '=', 'form_logs.submission')
        })
        .leftJoin(
          'directus_users as user_ass',
          'user_ass.id',
          'form_assesors.officer'
        )
        .leftJoin(
          'directus_users as user_rep',
          'user_rep.id',
          'form_assesors.replaced'
        )
        .join('document_logs', 'document_logs.form_log', 'form_logs.id')
        .where('form_logs.submission', submissionId)
        .where('approve_orders.order', 3)
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .whereNull('form_assesors.deleted_at')
        .orderBy('form_logs.reject_number', 'desc')
        .orderBy('form_logs.created_at', 'desc')
        .limit(1)

      const publisedByQuery = await database('form_logs')
        .select(
          'form_logs.id',
          'statuses.name as status',
          'form_logs.reject_number',
          'approve_orders.order',
          'form_logs.created_at',
          // 'document_logs.job_title',
          database.raw(
            'CASE WHEN form_assesors.replaced IS NOT NULL THEN user_rep.i_job_name ELSE user_ass.i_job_name END AS job_title'
          ),
          database.raw(
            "CASE WHEN form_assesors.replaced IS NOT NULL THEN CAST('1' AS INTEGER) ELSE CAST('0' AS INTEGER) END AS is_replacement"
          ),
          database.raw(
            'CASE WHEN form_assesors.replaced IS NOT NULL THEN user_rep.full_name ELSE user_ass.full_name END AS officer'
          )
        )
        .join('statuses', 'statuses.id', 'form_logs.status')
        .join('approve_orders', 'approve_orders.id', 'form_logs.approve_order')
        .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
        .join('form_assesors', function (qb: any) {
          qb.on('form_assesors.form_actor', '=', 'form_actors.id')
          qb.on('form_assesors.submission', '=', 'form_logs.submission')
        })
        .leftJoin(
          'directus_users as user_ass',
          'user_ass.id',
          'form_assesors.officer'
        )
        .leftJoin(
          'directus_users as user_rep',
          'user_rep.id',
          'form_assesors.replaced'
        )
        .join('document_logs', 'document_logs.form_log', 'form_logs.id')
        .where('form_logs.submission', submissionId)
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .whereNull('form_assesors.deleted_at')
        .orderBy('form_logs.reject_number', 'desc')
        .orderBy('form_logs.created_at', 'desc')
        .orderBy('approve_orders.order', 'desc')
        .limit(2)

      const data = {
        created_by: createdByQuery,
        checked_by: checkedByQuery,
        approved_by: approveByQuery,
        published_by: publisedByQuery.sort((a: any, b: any) => {
          return a.order - b.order
        }),
      }

      return {
        // higestReject,
        success: true,
        message: 'Successfully Get Submission Officer',
        data,
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message ?? error,
      }
    }
  }

  @Get(
    { path: '/:submission_id/document-logs', tag: 'Submissions' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async documentLogs(
    @Context() ctx: any,
    @Req() req: any,
    @Param('submission_id') submissionId: number
  ) {
    const { database } = ctx

    try {
      const { id } =
        (await database('form_logs')
          .select('form_logs.id')
          .join('statuses', 'statuses.id', 'form_logs.status')
          .where('form_logs.submission', submissionId)
          .where('statuses.code', 'PUBLS')
          .first()) || {}

      if (!id) {
        return {
          success: true,
          message: 'this submission not yet publish',
          data: {},
        }
      }

      const dataSubmission =
        (await database('submissions')
          .select('submissions.data')
          .where('submissions.id', submissionId)
          .first()) || {}

      const { detail } = dataSubmission.data || {}
      const {
        judul,
        description,
        department,
        directorate,
        division,
        applicableFor,
        departments = [],
        units = [],
      } = Object.keys(detail).reduce((acc: any, ctx: string) => {
        if (ctx === 'judul') {
          acc[ctx] = detail[ctx].value
        }
        if (ctx.toLowerCase().includes('deskripsi')) {
          acc['description'] = detail[ctx].value
        }
        if (ctx === 'penomoran_dokumen') {
          const {
            department = [],
            directorate,
            division,
            applicableFor,
            units = [],
          } = detail[ctx].value || {}

          acc.units = units.map((unit: any) => unit.id)
          acc.departments = department.map((dep: any) => dep.id)
          acc.directorate = directorate?.id || null
          acc.division = division?.id || null
          acc.applicableFor = applicableFor?.code || null
        }
        return acc
      }, {})

      const { reject_number } =
        (await database('form_logs')
          .select('form_logs.reject_number')
          .where('form_logs.submission', submissionId)
          .groupBy('form_logs.reject_number')
          .orderBy('form_logs.reject_number', 'desc')
          .first()) || {}

      enum apprType {
        ORDER = 'ORDER',
        MANAGER = 'Manager',
        DH = 'Department Head',
        GH = 'Group Head',
        DVH = 'Division Head',
        BP = 'Bagaian Pengelola',
        NONE = '',
      }

      const officers =
        (await database('form_logs')
          .select(
            'form_logs.id',
            'form_logs.reject_number',
            'approve_orders.order',
            'form_logs.created_at',
            'mt_jobs.description as i_job_title',
            database.raw(
              `CASE
                WHEN approve_orders.order = 1 THEN mt_departments.description
                WHEN form_assesors.replaced IS NOT NULL THEN mt_d_rep.description ELSE mt_d_ass.description END AS department`
            ),
            database.raw(
              "CASE WHEN form_assesors.replaced IS NOT NULL THEN CAST('1' AS INTEGER) ELSE CAST('0' AS INTEGER) END AS is_replacement"
            ),
            database.raw(
              'CASE WHEN form_assesors.replaced IS NOT NULL THEN user_rep.full_name ELSE user_ass.full_name END AS officer'
            )
          )
          .join(
            'approve_orders',
            'approve_orders.id',
            'form_logs.approve_order'
          )
          .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
          .join('form_assesors', function (qb: any) {
            qb.on('form_assesors.form_actor', '=', 'form_actors.id')
            qb.on('form_assesors.submission', '=', 'form_logs.submission')
          })
          .leftJoin(
            'directus_users as user_ass',
            'user_ass.id',
            'form_assesors.officer'
          )
          .leftJoin(
            'directus_users as user_rep',
            'user_rep.id',
            'form_assesors.replaced'
          )
          .leftJoin(
            'directus_users',
            'directus_users.id',
            'form_logs.created_by'
          )
          .leftJoin(
            'mt_departments as mt_d_ass',
            'mt_d_ass.id',
            'user_ass.department'
          )
          .leftJoin(
            'mt_departments as mt_d_rep',
            'mt_d_rep.id',
            'user_rep.department'
          )
          .leftJoin(
            'mt_departments',
            'mt_departments.id',
            'directus_users.department'
          )
          .leftJoin('mt_jobs', 'mt_jobs.id', 'directus_users.job')
          .where('form_logs.submission', submissionId)
          .where('form_logs.reject_number', reject_number)
          .whereNull('approve_orders.deleted_at')
          .whereNull('form_actors.deleted_at')
          .whereNull('form_assesors.deleted_at')
          .orderBy('form_logs.created_at', 'asc')) || []

      const data = officers.map((officer: any, i: number) => {
        const unitCount = units.length
        const depCount = departments.length

        let approver = apprType.NONE
        if (officer.order === 2) {
          if (reject_number) {
            if (units > Number(i) - 1) {
              approver = apprType.MANAGER
            } else if (department > Number(i) - 1) {
              approver = apprType.DH
            } else if (units + department > Number(i) - 1) {
              approver = apprType.DH
            }
          } else {
            if (units > Number(i)) {
              approver = apprType.MANAGER
            } else if (department > Number(i)) {
              approver = apprType.DH
            } else if (units + department > Number(i)) {
              approver = apprType.DH
            }
          }
        }

        const disposeSameWord = (apprType: apprType, jobTitle: string) => {
          const removerWords = apprType.toLowerCase().split(' ')
          const stringWords = jobTitle.toLowerCase().split(' ')

          const uniqueWords = stringWords.filter(
            (word) => !removerWords.includes(word)
          )

          return uniqueWords.join(' ')
        }

        const isHolding =
          applicableFor === 'KP0' || applicableFor === 'PI0' ? 1 : 0
        let jobTitle = ''
        if (officer.order === 2) {
          jobTitle = `${approver} ${
            disposeSameWord(approver, officer.department) || ''
          }`
        } else if (isHolding && officer.order === 3) {
          jobTitle = `${apprType.GH} ${
            disposeSameWord(approver, officer.department) || ''
          }`
        } else if (!isHolding && officer.order === 3) {
          jobTitle = `${apprType.DVH} ${officer.department || ''}`
        } else if (isHolding && officer.order > 3) {
          jobTitle = `${apprType.GH} ${apprType.BP} ${officer.department || ''}`
        } else if (!isHolding && officer.order > 3) {
          jobTitle = `${apprType.DVH} ${officer.department || ''}`
        }

        return {
          officer: officer.officer,
          reject_number,
          department_name: officer.department,
          job_title: jobTitle,
          i_job_title: officer.i_job_title,
          is_replacement: officer.is_replacement,
          department_count: depCount,
          unit_count: unitCount,
          order: officer.order,
          checked_by: approver || apprType.ORDER,
          is_holding: isHolding,
          form_log: officer.id,
        }
      })

      return {
        success: true,
        message: 'Successfully Get Submission Officer',
        data: data,
        test: {
          judul,
          description,
          department,
          directorate,
          division,
          applicableFor,
          departments,
          units,
        },
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message ?? error,
      }
    }
  }

  @Get(
    { path: '/:submission_id/officers/:form_logs_id', tag: 'Submissions' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async officerDetail(
    @Context() ctx: any,
    @Req() req: any,
    @Param('submission_id') submissionId: number,
    @Param('form_logs_id') formLogId: number
  ) {
    const { database } = ctx

    try {
      const { id } =
        (await database('form_logs')
          .select('form_logs.id')
          .join('statuses', 'statuses.id', 'form_logs.status')
          .where('form_logs.submission', submissionId)
          .where('statuses.code', 'PUBLS')
          .first()) || {}

      if (!id) {
        return {
          success: true,
          message: 'this submission not yet publish',
          data: {},
        }
      }

      const data =
        (await database('form_logs')
          .select(
            'form_logs.id',
            'form_logs.reject_number',
            'approve_orders.order',
            'form_logs.created_at as approved_at',
            'file_publishers.created_at as published_at',
            'file_publishers.document_number',
            'document_metas.judul as title',
            'document_logs.job_title as officer_job_title_department',
            database.raw(
              'CASE WHEN form_assesors.replaced IS NOT NULL THEN mt_j_rep.description ELSE mt_j_ass.description END AS officer_job_title'
            ),
            database.raw(
              "CASE WHEN form_assesors.replaced IS NOT NULL THEN CAST('1' AS INTEGER) ELSE CAST('0' AS INTEGER) END AS is_replacement"
            ),
            database.raw(
              'CASE WHEN form_assesors.replaced IS NOT NULL THEN user_rep.full_name ELSE user_ass.full_name END AS officer'
            ),
            'user_ass.full_name as assigned_officer',
            'user_rep.full_name as replacement_officer'
          )
          .join(
            'approve_orders',
            'approve_orders.id',
            'form_logs.approve_order'
          )
          .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
          .join('form_assesors', function (qb: any) {
            qb.on('form_assesors.form_actor', '=', 'form_actors.id')
            qb.on('form_assesors.submission', '=', 'form_logs.submission')
          })
          .join(
            'file_publishers',
            'file_publishers.submission',
            'form_logs.submission'
          )
          .join(
            'document_metas',
            'document_metas.id',
            'file_publishers.document_meta'
          )
          .leftJoin(
            'directus_users as user_ass',
            'user_ass.id',
            'form_assesors.officer'
          )
          .leftJoin(
            'directus_users as user_rep',
            'user_rep.id',
            'form_assesors.replaced'
          )
          .leftJoin('document_logs', 'document_logs.form_log', 'form_logs.id')
          .leftJoin('mt_jobs as mt_j_ass', 'mt_j_ass.id', 'user_ass.job')
          .leftJoin('mt_jobs as mt_j_rep', 'mt_j_rep.id', 'user_rep.job')
          .where('form_logs.submission', submissionId)
          .where('form_logs.id', formLogId)
          .whereNull('approve_orders.deleted_at')
          .whereNull('form_actors.deleted_at')
          .whereNull('form_assesors.deleted_at')
          .first()) || {}

      return {
        success: true,
        message: 'Successfully Get Submission Officer',
        data,
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message ?? error,
      }
    }
  }
}
