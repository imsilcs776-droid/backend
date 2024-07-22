import {
  Body,
  Context,
  Endpoint,
  Get,
  Param,
  Query,
  Req,
  Post,
  Put,
  Delete,
} from '@mv-data-core/decorator'
import { item, markdown } from './helpers'
import { array } from './utils'
import type { CreateSubmissionDTO, SubmissionDTO } from './interfaces'
import { v4 } from 'uuid'

@Endpoint('workflows')
export default class DefineEndpoint {
  @Get(
    { path: '/queryTest', tag: 'test' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async queryTest(@Context() ctx: any, @Req() req: any) {
    const {
      services: { UsersService, ItemsService },
      database,
      // env,
    } = ctx

    const {
      id: userId,
      email,
      full_name,
      pegawai,
    } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()
    try {
      /**
       * WARNIG!!
       * contain IMS
       */

      const userLog = await trx('directus_users')
        .select(
          'directus_users.id',
          'directus_users.first_name',
          'directus_users.last_name',
          'directus_users.email',
          'directus_users.avatar',
          'directus_users.external_identifier',
          'directus_users.full_name',
          'directus_users.nip',
          'directus_users.created_at',
          'directus_users.updated_at',
          'directus_users.i_department_code',
          'directus_users.i_com_code',
          'directus_users.i_job_code',
          'directus_users.i_job_name',
          'directus_users.i_werk',
          'directus_users.i_id',
          'directus_users.i_endda',
          'directus_users.nip_new',
          'directus_users.source',
          'directus_users.pegawai',
          'mt_departments.name as department_name',
          'mt_departments.code as department_code'
        )
        .join(
          'mt_departments',
          'mt_departments.id',
          'directus_users.department'
        )
        .where('directus_users.id', userId)
        .first()

      return {
        success: true,
        message: 'Successfully test query',
        userLog,
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
    { path: '/todo-fills', tag: 'Workflow' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
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
          name: 'business_id',
          schema: { type: 'number' },
          required: true,
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'number' },
          required: false,
        },
      ],
    }
  )
  /**
   * TODO: add type no nned reviwer no status complates
   */
  async todoFillDev(
    @Req() req: any,
    @Query('business_id') business_id: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Context() ctx: any
  ) {
    try {
      if (!business_id) {
        throw new Error('Business is required')
      }

      const {
        services: { ItemsService, UsersService },
        database,
      } = ctx

      const { id } = await item.getUser({ req, UsersService })

      /**
       * find high order in activities and form
       */
      const submissions = await database('submissions')
        .max('submissions.submission_number', { as: 'highOrder' })
        .select('submissions.activity', 'submissions.form')
        .join('activities', 'activities.id', 'submissions.activity')
        .whereNull('activities.deleted_at')
        .where('submissions.business', business_id)
        .where('submissions.user_created', id)
        .groupBy('submissions.activity', 'submissions.form')

      const filledFormActivity = submissions
        /**
         * find filled form in activity
         */
        .reduce((accumulator: any[], currentValue: any) => {
          const { form, activity } = currentValue || {}
          const isTaken = accumulator.some(
            (acc: any) => acc.activity === activity
          )
          const orders = submissions
            .filter((sub: any) => sub.activity === activity)
            .map((sub: any) => sub.highOrder)
          const highOrder = Math.max(...orders)
          if (!isTaken) {
            accumulator.push({ form, highOrder, activity })
          }

          return accumulator
        }, [])

      /**
       * find high order in activities and form
       */
      const activities = await database('activities')
        .select(
          'activities.id'
          // 'activities.name',
          // 'activities.icon',
          // 'activities.tags',
          // 'activities.description'
        )
        .distinctOn('activities.id')
        .join('approve_orders', 'approve_orders.activity', 'activities.id')
        .join('form_actors', function (qb: any) {
          qb.on('form_actors.id', '=', 'approve_orders.assign_to')
          qb.andOnVal('form_actors.name', '=', 'Data Input')
        })
        .join(
          'form_actors_roles',
          'form_actors_roles.form_actors_id',
          'form_actors.id'
        )
        .join('Privileges', 'Privileges.role', 'form_actors_roles.roles_id')
        .join('directus_users', 'Privileges.user', 'directus_users.id')
        .whereNull('activities.deleted_at')
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .where('activities.business', business_id)
        .where('directus_users.id', id)

      if (!activities.length) {
        return {
          success: true,
          message: 'not found',
          data: [],
        }
      }

      const params = {
        activitiesParams: {
          fields: [
            'id',
            'name',
            'icon',
            'tags',
            'description',
            'forms.forms_id.id',
            'forms.forms_id.code',
            'forms.forms_id.active_version',
            'forms.forms_id.active_version_code',
            'forms.forms_id.title',
            'forms.forms_id.description',
            'forms.forms_id.versions',
            'forms.forms_id.tags',
            'approve_orders.approve_to.name',
            'approve_orders.assign_to.name',
            'approve_orders.id',
          ],
          filter: {
            _and: [
              {
                id: {
                  _in: activities.map((activitiy: any) => activitiy.id),
                },
              },
            ],
          },
          limit,
          page,
          meta: '*',
        },
      }
      const results = await item.getItem({
        req,
        ItemsService,
        name: 'activities',
        params: params.activitiesParams,
      })

      console.log(results)
      // return { activities, results, params }
      const data = results
        .map((res: any) => {
          const {
            id,
            name,
            icon,
            tags,
            description,
            forms,
            approve_orders = [],
          } = res
          const formFilledIds = filledFormActivity
            .filter((fill: any) => id === fill.activity)
            .map((fill: any) => fill.form)

          let isEqual = false
          if (formFilledIds.length > 1) {
            const orders = filledFormActivity.map((ff: any) => ff.highOrder)
            isEqual = array.allEqual(orders)
          }

          const formTofills = forms
            .map((form: any) => ({
              ...form.forms_id,
            }))
            .filter((form: any) => {
              if (isEqual) return true
              return !formFilledIds.some((fillId: number) => fillId === form.id)
            })
          const approve_order = approve_orders.filter((appOdr: any) => {
            return appOdr.assign_to?.name === 'Data Input'
          })

          return {
            forms: formTofills,
            activity: {
              id,
              name,
              icon,
              tags,
              description,
              approve_order,
            },
          }
        })
        /**
         * remove empty form
         */
        .filter(({ forms }: any) => forms instanceof Array && forms.length)

      return {
        results,
        success: true,
        message: 'Successfully Get Form to Fill',
        // lastLogQuery,
        // filledFormActivity,
        // submissions,
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
    { path: '/todo-reviews', tag: 'Workflow' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
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
          name: 'business_id',
          schema: { type: 'number' },
          required: true,
        },
        {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          required: false,
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'include_data',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'submission_ids',
          schema: { type: 'array' },
          required: false,
        },
        /**
         * WARNING !
         * containt IMS
         */
        {
          in: 'query',
          name: 'department_division',
          schema: { type: 'number' },
          required: false,
        },
        /**
         * WARNING !
         * containt IMS
         */
        {
          in: 'query',
          name: 'department_directorat',
          schema: { type: 'number' },
          required: false,
        },
        /**
         * WARNING !
         * containt IMS
         */
        {
          in: 'query',
          name: 'departments',
          schema: { type: 'array' },
          required: false,
        },
        {
          in: 'query',
          name: 'units',
          schema: { type: 'array' },
          required: false,
        },
        /**
         * WARNING !
         * containt IMS
         */
        {
          in: 'query',
          name: 'ruang_lingkup',
          schema: { type: 'string' },
          required: false,
        },
      ],
    }
  )
  async todoReview(
    @Req() req: any,
    @Query('business_id') business_id: number,
    @Query('search') search: string,
    @Query('include_data') includeData: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('submission_ids') submissionIds: number[],
    /**
     * WARNING !
     * containt IMS
     */
    @Query('department_division') departmentDivision: number,
    @Query('department_directorat') departmentDirectorat: number,
    @Query('departments') departments: number[],
    @Query('units') units: number[],
    @Query('ruang_lingkup') ruangLingkup: string,
    /**
     *
     */
    @Context() ctx: any
  ) {
    try {
      if (!business_id) {
        throw new Error('Business is required')
      }

      const {
        services: { ItemsService, UsersService },
        database,
      } = ctx

      const { id } = await item.getUser({ req, UsersService })

      // const logOfficerQuery = database('submissions')
      //   .select('submissions.id as id')
      //   /**
      //    * ims
      //    */
      //   .join('document_metas', 'document_metas.submission', 'submissions.id')
      //   /**
      //    *
      //    */
      //   .join('statuses', 'statuses.id', 'submissions.status')
      //   .join('form_logs', 'form_logs.id', 'submissions.current_form_log')
      //   .join('approve_orders', 'approve_orders.id', 'form_logs.next_order')
      //   .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
      //   .join('form_assesors', function (qb: any) {
      //     qb.on('form_assesors.form_actor', '=', 'form_actors.id')
      //     qb.on('form_assesors.submission', '=', 'form_logs.submission')
      //   })
      //   .whereNull('statuses.deleted_at')
      //   .whereNull('approve_orders.deleted_at')
      //   .whereNull('form_actors.deleted_at')
      //   .whereNull('form_assesors.deleted_at')
      //   .where('statuses.code', '<>', 'REJCT')
      //   .where('statuses.code', '<>', 'COMPL')
      //   .where('form_assesors.officer', id)
      //   .where('submissions.business', business_id)
      //   /**
      //    * ims
      //    */
      //   .whereNull('document_metas.deleted_at')

      const logOfficerQuery = database('submissions')
        .select('submissions.id as id')
        .join('document_metas', 'document_metas.submission', 'submissions.id')
        .join('statuses', 'statuses.id', 'submissions.status')
        .join('form_logs', 'form_logs.id', 'submissions.current_form_log')
        .join('approve_orders', 'approve_orders.id', 'form_logs.next_order')
        .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
        .join(
          database('form_assesors')
            .select('*')
            .where(
              'id',
              database.raw(
                '(SELECT MAX(fa2.id) FROM form_assesors AS fa2 WHERE fa2.form_actor = form_assesors.form_actor AND fa2.submission = form_assesors.submission)'
              )
            )
            .as('form_assesors_max'),
          function (qb: any) {
            qb.on('form_assesors_max.form_actor', '=', 'form_actors.id')
            qb.on('form_assesors_max.submission', '=', 'form_logs.submission')
          }
        )
        .whereNull('statuses.deleted_at')
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .whereNull('form_assesors_max.deleted_at')
        .where('statuses.code', '<>', 'REJCT')
        .where('statuses.code', '<>', 'COMPL')
        .where('form_assesors_max.officer', id)
        .where('submissions.business', business_id)
        .whereNull('document_metas.deleted_at')

      if (search) {
        logOfficerQuery.where('document_metas.judul', 'ilike', `%${search}%`)
      }
      if (submissionIds instanceof Array && submissionIds.length) {
        logOfficerQuery.whereIn('submissions.id', submissionIds)
      }

      if (departmentDivision) {
        logOfficerQuery.where(
          'document_metas.department_division',
          departmentDivision
        )
      }

      if (departmentDirectorat) {
        logOfficerQuery.where(
          'document_metas.department_directorat',
          departmentDirectorat
        )
      }

      if (
        departments &&
        typeof departments === 'object' &&
        departments instanceof Array &&
        departments.length > 0
      ) {
        logOfficerQuery.join(
          'document_departments',
          'document_departments.submission',
          'submissions.id'
        )
        logOfficerQuery.whereIn('document_departments.department', departments)
      } else if (departments) {
        logOfficerQuery.join(
          'document_departments',
          'document_departments.submission',
          'submissions.id'
        )
        logOfficerQuery.where('document_departments.department', departments)
      } else {
        logOfficerQuery.leftJoin(
          'document_departments',
          'document_departments.submission',
          'submissions.id'
        )
      }

      if (
        units &&
        typeof units === 'object' &&
        units instanceof Array &&
        units.length > 0
      ) {
        logOfficerQuery.join(
          'document_units',
          'document_units.submission',
          'submissions.id'
        )
        logOfficerQuery.whereIn('document_units.unit', units)
      } else if (units) {
        logOfficerQuery.join(
          'document_units',
          'document_units.submission',
          'submissions.id'
        )
        logOfficerQuery.where('document_units.unit', units)
      } else {
        logOfficerQuery.leftJoin(
          'document_units',
          'document_units.submission',
          'submissions.id'
        )
      }

      if (ruangLingkup) {
        logOfficerQuery.where(
          'document_metas.area_numbering_apply',
          ruangLingkup
        )
      }

      // console.log(logOfficerQuery.toString())
      // const logOfficer = await logOfficerQuery.groupBy(
      //   'submissions.current_form_log'
      // )

      /**
       * menggunakan submission karena form assesor lama tidak mempunyai form log
       */
      const submissions = await logOfficerQuery.groupBy('submissions.id')

      // return logOfficer2.toString()
      const logSubmissionIds = [...submissions.map(({ id }: any) => id)]

      const lastLogs = await database
        .with('a', (qb: any) => {
          qb.select(
            'submission',
            'id',
            'created_at',
            database.raw(
              'ROW_NUMBER() OVER (PARTITION BY submission ORDER BY created_at DESC) as rank'
            )
          )
            .from('form_logs')
            .whereIn('submission', [...logSubmissionIds])
        })
        .select('*')
        .from('a')
        .where('a.rank', 1)
        .orderBy('a.id', 'desc')

      const lastLogIds = [...lastLogs.map(({ id }: any) => id)]

      const params = {
        formLogParam: {
          filter: {
            _and: [{ id: { _in: [...new Set(lastLogIds)] } }],
          },
          sort: ['-id'],
          fields: [
            'activity.id',
            'activity.name',
            'activity.icon',
            'activity.tags',
            'activity.description',
            'form.id',
            'form.code',
            'form.active_version',
            'form.active_version_code',
            'form.title',
            'form.description',
            'form.versions',
            'form.tags',
            'status',
            'status.id',
            'status.code',
            'status.name',
            'submission_number',
            'submission',
            'created_at',
            'created_by.first_name',
            'created_by.last_name',
            'created_by.email',
            'created_by.id',
            'created_by.full_name',
            'reject_type.code',
            'next_order.id',
            'next_order.assign_to.id',
            'next_order.assign_to.name',
            'next_order.assign_to.approve_capability.editable',
            'next_order.assign_to.approve_capability.rejectable',
            'next_order.assign_to.approve_capability.revisable',
            'next_order.assign_to.approve_capability.disposable',
            'next_order.approve_to',
          ],
        },
      } as any

      if (includeData == 1) {
        params.formLogParam.fields.push('data')
      }

      if (limit) {
        params.formLogParam.page = 1
        params.formLogParam.limit = limit
      }

      if (limit && page) {
        params.formLogParam.page = page
        params.formLogParam.limit = limit
      }

      const data = await item.getItem({
        req,
        ItemsService,
        name: 'form_logs',
        params: params.formLogParam,
      })

      /**
       * remove reject type "tidak lanjut" dan type "revisi"
       */
      const datas = data
        .filter((dt: any) => {
          const { code } = dt.reject_type || {}

          if (code === 'TDKLT') {
            return false
          }

          if (code === 'RVSI') {
            return false
          }

          return true
        })
        .map((dt: any) => {
          const { approve_to, id, assign_to } = dt.next_order || {}
          const { detail } = dt.data || {}

          /**
           * add is_last_order
           */
          let is_last_order = false
          if (!approve_to) {
            is_last_order = true
          }
          dt.next_order = { id, approve_to, is_last_order, assign_to }

          if (detail) {
            dt.data = Object.keys(detail).reduce((acc: any, ctx: string) => {
              acc[ctx] = detail[ctx].value
              return acc
            }, {})
          }

          return dt
        })

      return {
        success: true,
        message: 'Successfully Get Form to Review',
        data: datas,
        meta: {
          total_count: lastLogs.length,
          filter_count: lastLogs.length,
          page: params.formLogParam?.page || 0,
          limit: params.formLogParam?.limit || 0,
        },
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message || error,
      }
    }
  }

  @Get(
    { path: '/todo-revises', tag: 'Workflow' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
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
          name: 'search',
          schema: { type: 'string' },
          required: false,
        },
        {
          in: 'query',
          name: 'business_id',
          schema: { type: 'number' },
          required: true,
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'include_data',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'submission_ids',
          schema: { type: 'array' },
          required: false,
        },
        /**
         * WARNING !
         * containt IMS
         */
        {
          in: 'query',
          name: 'department_division',
          schema: { type: 'number' },
          required: false,
        },
        /**
         * WARNING !
         * containt IMS
         */
        {
          in: 'query',
          name: 'department_directorat',
          schema: { type: 'number' },
          required: false,
        },
        /**
         * WARNING !
         * containt IMS
         */
        {
          in: 'query',
          name: 'departments',
          schema: { type: 'array' },
          required: false,
        },
        {
          in: 'query',
          name: 'units',
          schema: { type: 'array' },
          required: false,
        },
        /**
         * WARNING !
         * containt IMS
         */
        {
          in: 'query',
          name: 'ruang_lingkup',
          schema: { type: 'string' },
          required: false,
        },
      ],
    }
  )
  async todoRevises(
    @Req() req: any,
    @Query('search') search: string,
    @Query('business_id') business_id: number,
    @Query('submission_ids') submissionIds: number[],
    @Query('include_data') includeData: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
    /**
     * WARNING !
     * containt IMS
     */
    @Query('department_division') departmentDivision: number,
    @Query('department_directorat') departmentDirectorat: number,
    @Query('ruang_lingkup') ruangLingkup: string,
    @Query('departments') departments: number[],
    @Query('units') units: number[],
    /**
     *
     */ @Context() ctx: any
  ) {
    try {
      if (!business_id) {
        throw new Error('Business is required')
      }

      const {
        services: { ItemsService, UsersService },
        database,
      } = ctx

      const { id } = await item.getUser({ req, UsersService })

      const lastLogQuery = database('submissions')
        .select('submissions.id as id')
        /**
         * ims
         */
        .join('document_metas', 'document_metas.submission', 'submissions.id')
        /**
         *
         */
        .join('statuses', 'statuses.id', 'submissions.status')
        .join('form_logs', 'form_logs.id', 'submissions.current_form_log')
        .join(
          'form_reject_types',
          'form_reject_types.id',
          'form_logs.reject_type'
        )
        .join('approve_orders', 'approve_orders.id', 'form_logs.approve_order')
        .join(
          'form_rejections',
          'form_rejections.approve_order',
          'form_logs.approve_order'
        )
        .join('form_actors', 'form_rejections.reject_to', 'form_actors.id')
        .join(
          database('form_assesors')
            .select('*')
            .where(
              'id',
              database.raw(
                '(SELECT MAX(fa2.id) FROM form_assesors AS fa2 WHERE fa2.form_actor = form_assesors.form_actor AND fa2.submission = form_assesors.submission)'
              )
            )
            .as('form_assesors_max'),
          function (qb: any) {
            qb.on('form_assesors_max.form_actor', '=', 'form_actors.id')
            qb.on('form_assesors_max.submission', '=', 'form_logs.submission')
          }
        )
        .whereNull('statuses.deleted_at')
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .whereNull('form_assesors_max.deleted_at')
        .where('submissions.business', business_id)
        .where('form_reject_types.code', 'RVISI')
        .where('statuses.code', 'REJCT')
        .where('statuses.code', '<>', 'COMPL')
        .where('form_assesors_max.officer', id)
        /**
         * ims
         */
        .whereNull('document_metas.deleted_at')

      console.log(id)

      if (search) {
        lastLogQuery.where('document_metas.judul', 'ilike', `%${search}%`)
      }
      if (departmentDivision) {
        lastLogQuery.where(
          'document_metas.department_division',
          departmentDivision
        )
      }

      if (departmentDirectorat) {
        lastLogQuery.where(
          'document_metas.department_directorat',
          departmentDirectorat
        )
      }

      if (
        departments &&
        typeof departments === 'object' &&
        departments instanceof Array &&
        departments.length > 0
      ) {
        lastLogQuery.join(
          'document_departments',
          'document_departments.submission',
          'submissions.id'
        )
        lastLogQuery.whereIn('document_departments.department', departments)
      } else if (departments) {
        lastLogQuery.join(
          'document_departments',
          'document_departments.submission',
          'submissions.id'
        )
        lastLogQuery.where('document_departments.department', departments)
      } else {
        lastLogQuery.leftJoin(
          'document_departments',
          'document_departments.submission',
          'submissions.id'
        )
      }

      if (
        units &&
        typeof units === 'object' &&
        units instanceof Array &&
        units.length > 0
      ) {
        lastLogQuery.join(
          'document_units',
          'document_units.submission',
          'submissions.id'
        )
        lastLogQuery.whereIn('document_units.unit', units)
      } else if (units) {
        lastLogQuery.join(
          'document_units',
          'document_units.submission',
          'submissions.id'
        )
        lastLogQuery.where('document_units.unit', units)
      } else {
        lastLogQuery.leftJoin(
          'document_units',
          'document_units.submission',
          'submissions.id'
        )
      }

      if (ruangLingkup) {
        lastLogQuery.where('document_metas.area_numbering_apply', ruangLingkup)
      }

      console.log(lastLogQuery.toString())

      if (submissionIds instanceof Array && submissionIds.length) {
        lastLogQuery.whereIn('submissions.id', submissionIds)
      }
      lastLogQuery.groupBy('submissions.id')

      // console.log(await lastLogQuery.toString())
      // const lastLog = await lastLogQuery
      const totalCount = await database
        .select(database.raw('COUNT(a.id) as total'))
        .from(lastLogQuery.distinctOn('id').as('a'))
        .first()

      const submissions = await lastLogQuery

      // return logOfficer2.toString()
      const logSubmissionIds = [...submissions.map(({ id }: any) => id)]

      const lastLogs = await database
        .with('a', (qb: any) => {
          qb.select(
            'submission',
            'id',
            'created_at',
            database.raw(
              'ROW_NUMBER() OVER (PARTITION BY submission ORDER BY created_at DESC) as rank'
            )
          )
            .from('form_logs')
            .whereIn('submission', [...logSubmissionIds])
        })
        .select('*')
        .from('a')
        .where('a.rank', 1)
        .orderBy('a.id', 'desc')

      const lastLogIds = [...lastLogs.map(({ id }: any) => id)]

      const params = {
        formLogParam: {
          filter: {
            _and: [{ id: { _in: [...new Set(lastLogIds)] } }],
          },
          fields: [
            'activity.id',
            'activity.name',
            'activity.icon',
            'activity.tags',
            'activity.description',
            'form.id',
            'form.code',
            'form.active_version',
            'form.active_version_code',
            'form.title',
            'form.description',
            'form.versions',
            'form.tags',
            'status',
            'status.id',
            'status.code',
            'status.name',
            'submission_number',
            'submission',
            'created_at',
            'created_by.first_name',
            'created_by.last_name',
            'created_by.email',
            'created_by.id',
            'created_by.full_name',
            'next_order.id',
            'next_order.assign_to.approve_capability.editable',
            'next_order.assign_to.approve_capability.rejectable',
            'next_order.assign_to.approve_capability.revisable',
            'next_order.assign_to.approve_capability.disposable',
            'reason',
          ],
        },
      } as any

      if (includeData == 1) {
        params.formLogParam.fields.push('data')
      }

      if (limit) {
        params.formLogParam.page = 1
        params.formLogParam.limit = limit
      }

      if (limit && page) {
        params.formLogParam.page = page
        params.formLogParam.limit = limit
      }

      const data = await item.getItem({
        req,
        ItemsService,
        name: 'form_logs',
        params: params.formLogParam,
      })

      const datas = data.map((dt: any) => {
        const { detail } = dt.data || {}

        if (detail) {
          dt.data = Object.keys(detail).reduce((acc: any, ctx: string) => {
            acc[ctx] = detail[ctx].value
            return acc
          }, {})
        }

        return dt
      })

      return {
        success: true,
        message: 'Successfully Get Form to Review',
        data: datas,
        meta: {
          total_count: totalCount.total,
          filter_count: totalCount.total,
          page: params.formLogParam?.page || 0,
          limit: params.formLogParam?.limit || 0,
        },
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message || error,
      }
    }
  }

  @Get(
    { path: '/approve-orders/:approve_order/approvers', tag: 'Workflow' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
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
          name: 'page',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'number' },
          required: false,
        },
      ],
    }
  )
  async approvers(
    @Req() req: any,
    @Param('approve_order') approveOrderId: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Context() ctx: any
  ) {
    try {
      const { database } = ctx
      /**
       *  find last insert of form log
       *  rolesDatas = {
       *    roles_id: number
       *    child_id: number
       *  }
       */
      const rolesDatas = await database('approve_orders')
        .select('form_actors_roles.roles_id')
        .join('form_actors', 'form_actors.id', 'approve_orders.approve_to')
        .join(
          'form_actors_roles',
          'form_actors.id',
          'form_actors_roles.form_actors_id'
        )
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .where('approve_orders.id', approveOrderId)

      const roleIds = [
        ...new Set(
          rolesDatas
            .map(({ roles_id }: any) => roles_id)
            .filter((roles_id: any) => roles_id)
        ),
      ]

      const approver_options_query = database('Privileges')
        .select(
          'directus_users.id',
          'directus_users.first_name',
          'directus_users.last_name',
          'Profiles.photo'
        )
        .distinctOn('directus_users.id')
        .join('directus_users', 'Privileges.user', 'directus_users.id')
        .leftJoin('Profiles', 'directus_users.profile', 'Profiles.id')
        .whereIn('Privileges.role', roleIds)

      const disposition_options_query = database('Privileges')
        .select(
          'directus_users.id',
          'directus_users.first_name',
          'directus_users.last_name',
          'Profiles.photo'
        )
        .distinctOn('directus_users.id')
        .join('directus_users', 'Privileges.user', 'directus_users.id')
        .leftJoin('Profiles', 'directus_users.profile', 'Profiles.id')

      if (page && limit) {
        approver_options_query.limit(limit).offset((page - 1) * limit)

        disposition_options_query.limit(limit).offset((page - 1) * limit)
      }

      const disposition_options = await disposition_options_query
      const approver_options = await approver_options_query

      return {
        success: true,
        message: 'Successfully Get Form to Review',
        data: {
          disposition_options,
          approver_options,
        },
        meta: {
          page,
          limit,
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
    { path: '/approver-type', tag: 'Workflow' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
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
          name: 'submission',
          schema: { type: 'number' },
          required: false,
        },
      ],
    }
  )
  async approverType(
    @Req() req: any,
    @Query('submission') submission: number,
    @Context() ctx: any
  ) {
    try {
      const { database } = ctx
      enum apprType {
        ORDER = 'ORDER',
        MANAGER = 'MANAGER',
        DH = 'DH',
      }
      /**
       *  find last insert of form log
       *  rolesDatas = {
       *    roles_id: number
       *    child_id: number
       *  }
       */

      if (!submission)
        return {
          success: true,
          message: 'Successfully Approver Type',
          data: {
            order: 1,
            approver: apprType.ORDER,
            quota: 0,
            reject_count: 0,
          },
        }

      const { data, order } =
        (await database('form_logs')
          .select('form_logs.data', 'approve_orders.order')
          .join('approve_orders', 'approve_orders.id', 'form_logs.next_order')
          .where('form_logs.submission', submission)
          .orderBy('form_logs.id', 'desc')
          .first()) || {}
      const { detail } = data || {}

      console.log(
        database('form_logs')
          .select('form_logs.data', 'approve_orders.order')
          .join('approve_orders', 'approve_orders.id', 'form_logs.next_order')
          .where('form_logs.submission', submission)
          .orderBy('form_logs.id', 'desc')
          .toString()
      )

      // if (!detail) throw new Error("missing detail data");

      const { department, units } = Object.keys(detail).reduce(
        (acc: any, ctx: string) => {
          if (ctx === 'penomoran_dokumen') {
            const { department = [], units = [] } = detail[ctx].value || {}

            acc.department = department.length
            acc.units = units.length
          }
          return acc
        },
        {}
      )

      console.log(units, department)

      const { quota, reject_number } =
        (await database('form_logs')
          .select(
            database.raw('COUNT(form_logs.id) as quota'),
            'form_logs.reject_number'
          )
          .where('form_logs.submission', submission)
          .groupBy('form_logs.reject_number')
          .orderBy('form_logs.reject_number', 'desc')
          .first()) || {}

      // console.log(units, department, order, {quota})

      let approver = apprType.ORDER

      if (order === 2) {
        if (reject_number > 0) {
          if (department === Number(quota) - 1 && units === 0) {
            approver = apprType.ORDER
          } else if (units > Number(quota) - 1) {
            approver = apprType.MANAGER
          } else if (department > Number(quota) - 1) {
            approver = apprType.DH
          } else if (units + department > Number(quota) - 1) {
            approver = apprType.DH
          }
        } else {
          if (department === Number(quota) && units === 0) {
            approver = apprType.ORDER
          } else if (units > Number(quota)) {
            approver = apprType.MANAGER
          } else if (department > Number(quota)) {
            approver = apprType.DH
          } else if (units + department > Number(quota)) {
            approver = apprType.DH
          }
        }
      }

      return {
        success: true,
        message: 'Successfully Approver Type',
        data: {
          units,
          department,
          reject_count: reject_number,
          order: order,
          approver: approver,
          quota: Number(quota),
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

  @Post(
    {
      path: '/activities/:activity_id/submissions',
      tag: 'Workflow',
    },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],

      request: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
          },
          form: {
            type: 'number',
          },
          assign_to: {
            require: true,
            type: 'string',
          },
          send_email: {
            type: 'number',
          },
          draft_id: {
            type: 'number',
          },
          replaced: {
            type: 'string',
          },
          /**
           * WARNING
           * contain ims
           */
          is_revice: {
            type: 'number',
          },
          submission_revice: {
            type: 'number',
          },
          repo_revice: {
            type: 'number',
          },
        },
      },
    }
  )
  async postSubmission(
    @Req() req: any,
    @Body() body: CreateSubmissionDTO,
    @Param('activity_id') activity: string,
    @Context() ctx: any
  ) {
    const {
      data,
      assign_to: assignToUserId,
      replaced,
      form,
      send_email,
      is_revice,
      submission_revice,
      draft_id,
      repo_revice,
    } = body || {}

    const {
      services: { UsersService, ItemsService },
      database,
      // env,
    } = ctx

    if (!assignToUserId) {
      throw new Error('assign_to is required')
    }

    const {
      id: userId,
      email,
      full_name,
      pegawai,
    } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()
    try {
      /**
       * WARNIG!!
       * contain IMS
       */

      const userLog = await trx('directus_users')
        .select(
          'directus_users.id',
          'directus_users.first_name',
          'directus_users.last_name',
          'directus_users.email',
          'directus_users.avatar',
          'directus_users.external_identifier',
          'directus_users.full_name',
          'directus_users.nip',
          'directus_users.created_at',
          'directus_users.updated_at',
          'directus_users.i_department_code',
          'directus_users.i_com_code',
          'directus_users.i_job_code',
          'directus_users.i_job_name',
          'directus_users.i_werk',
          'directus_users.i_id',
          'directus_users.i_endda',
          'directus_users.nip_new',
          'directus_users.source',
          'directus_users.pegawai',
          'mt_departments.name as department_name',
          'mt_departments.code as department_code'
        )
        .join(
          'mt_departments',
          'mt_departments.id',
          'directus_users.department'
        )
        .where('directus_users.id', userId)
        .first()

      const { detail } = data || {}
      const {
        judul,
        description,
        directorate,
        division,
        applicableFor,
        documentNumber,
        departments = [],
        units = [],
        deptsLog,
        divLog,
        dirLog,
        unitsLog,
        areaLog,
        isReviceFromDraft = false,
        lastRevice,
      } = Object.keys(detail).reduce((acc: any, ctx: string) => {
        if (ctx === 'judul') {
          acc[ctx] = detail[ctx].value
        }
        if (ctx.toLowerCase().includes('deskripsi')) {
          acc['description'] = detail[ctx].value
        }

        if (ctx.toLowerCase().includes('evaluasi_dan_riwayat_perubahan')) {
          const reviceHistories = detail[ctx].value || []
          acc.isReviceFromDraft = reviceHistories.length > 0
          acc.lastRevice = reviceHistories
            .map((revice: any) => {
              const getDocNum =
                revice.hasilEvaluasiDanRiwayatPerubahan.split('dengan nomor')
              const [text, docNum] = getDocNum
              return docNum
            })
            .filter(Boolean) // Filter out undefined or null values
            .pop() // Get the last document number
        }
        if (ctx === 'penomoran_dokumen') {
          const {
            department = [],
            units = [],
            directorate,
            division,
            applicableFor,
            documentNumber,
          } = detail[ctx].value || {}

          acc.departments = department.map((dep: any) => dep.id)
          acc.units = units.map((unit: any) => unit.id)
          acc.directorate = directorate?.id || null
          acc.division = division?.id || null
          acc.applicableFor = applicableFor?.id || null
          acc.documentNumber = documentNumber || null

          acc.deptsLog = department
          acc.divLog = division
          acc.dirLog = directorate
          acc.unitsLog = units
          acc.areaLog = applicableFor
        }
        return acc
      }, {})

      const now = new Date()
      now.setSeconds(now.getSeconds() - 30)

      let reviceIdFromRepo
      if (isReviceFromDraft && lastRevice) {
        const revice =
          (await trx('repo_document_submissions')
            .select('id')
            .where('number', lastRevice)
            .first()) || {}
        reviceIdFromRepo = revice?.id || ''
      }

      const { id: lastSubmissionId, judul: judulLastSubmission } =
        (await trx('submissions')
          .select('submissions.id', 'document_metas.judul')
          .join('document_metas', 'document_metas.submission', 'submissions.id')
          .where('submissions.user_created', userId)
          .where('submissions.date_created', '>', now)
          .first()) || {}

      if (judulLastSubmission === judul) {
        console.error(
          'judulLastSubmission',
          judulLastSubmission,
          lastSubmissionId
        )
        throw new Error('Judul sudah digunakan')
      }

      /**
       * get statuses id
       */
      const [{ id: statusesId }] = await trx('statuses')
        .select('statuses.id')
        .where('statuses.code', 'WAITN')

      /**
       * get current approveOrderId
       */
      const {
        id: approveOrderId,
        order,
        approve_to: approveTo,
        assign_to: assignTo,
        business,
        company,
        plant,
      } = (await trx('approve_orders')
        .select(
          'approve_orders.id',
          'approve_orders.order',
          'approve_orders.approve_to',
          'approve_orders.assign_to',
          'activities.business',
          'activities.company',
          'activities.plant'
        )
        .join('form_actors', 'form_actors.id', 'approve_orders.assign_to')
        .leftJoin('activities', 'approve_orders.activity', 'activities.id')
        .whereNull('approve_orders.deleted_at')
        .whereNull('form_actors.deleted_at')
        .whereNull('activities.deleted_at')
        .where('form_actors.name', 'Data Input')
        .where('approve_orders.activity', activity)
        .first()) || { id: null }

      if (!approveOrderId) throw new Error('approve_orders not found')

      /**
       * get next approveOrderId
       */
      const { id: nextApproveOrderId, name: reviewerActorName } = (await trx(
        'approve_orders'
      )
        .select('approve_orders.id', 'form_actors.name')
        .join('form_actors', 'form_actors.id', 'approve_orders.assign_to')
        .whereNull('form_actors.deleted_at')
        .whereNull('approve_orders.deleted_at')
        .where('approve_orders.activity', activity)
        .where('approve_orders.order', order + 1)
        .first()) || {
        id: null,
      }

      /**
       * get last submission
       */
      const { submission_number: lastSubNumber } = (await trx('submissions')
        .select('submissions.submission_number')
        .orderBy('submission_number', 'desc')
        .where('submissions.activity', activity)
        .where('submissions.form', form)
        .first()) || { submission_number: 0 }

      /**
       * add new submissions
       */
      const [
        {
          id: submissionId,
          company: submissionCompany,
          plant: submissionPlant,
          activity: submissionActivity,
          business: submissionBusiness,
          form: submissionForm,
        },
      ] = await trx('submissions')
        .insert({
          data,
          date_created: new Date(),
          date_updated: new Date(),
          form,
          submission_number: lastSubNumber + 1,
          user_created: userId,
          company,
          plant,
          business,
          activity,
          /**
           * WARNING
           * revise contain ims
           */
          revise: !!is_revice || !!isReviceFromDraft,
          submission_revice,
          status: statusesId,
          repo_revice: repo_revice || reviceIdFromRepo,
          com_code: pegawai || 'PLND',
        })
        .returning('*')

      /**
       * add new form log
       */
      const [{ id: idLog }] = await trx('form_logs')
        .insert({
          activity: submissionActivity,
          business: submissionBusiness,
          company: submissionCompany,
          created_by: userId,
          form: submissionForm,
          plant: submissionPlant,
          submission_number: lastSubNumber + 1,
          status: statusesId,
          created_at: new Date(),
          submission: submissionId,
          approve_order: approveOrderId,
          next_order: nextApproveOrderId,
          data,
          assignee_log: userLog,
        })
        .returning('id')

      await trx('submissions')
        .where({ id: submissionId })
        .update({ current_form_log: idLog })

      await trx('form_assesors').insert([
        // {
        //   created_by: userId,
        //   created_at: new Date(),
        //   updated_at: new Date(),
        //   submission: submissionId,
        //   form_actor: assignTo,
        //   officer: userId,
        //   disposer: false,
        //   // form_log: idLog,
        //   replaced,
        // },
        {
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          submission: submissionId,
          form_actor: approveTo,
          officer: assignToUserId,
          disposer: false,
          replaced,
        },
      ])

      if (draft_id) {
        await trx('submission_drafts')
          .where({ id: draft_id })
          .update({ deleted_at: new Date() })
      }

      // console.log({
      //   depts_log: deptsLog,
      //   div_log: divLog,
      //   dir_log: dirLog,
      //   units_log: unitsLog,
      //   area_log: areaLog,
      // })

      // return {
      //   depts_log: deptsLog,
      //   div_log: divLog,
      //   dir_log: dirLog,
      //   units_log: unitsLog,
      //   area_log: areaLog,
      // }

      const idMeta = v4()
      await trx('document_metas').insert({
        id: idMeta,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
        submission: submissionId,
        judul: judul,
        department_division: division,
        department_directorat: directorate,
        // department: department,
        description: description,
        document_number_draft: documentNumber,
        /**
         * WARNING
         * contain IMS
         */
        area_numbering_apply: applicableFor,
        code: 'PROBIS345',
        com_code: pegawai || 'PLND',
        depts_log: JSON.stringify(deptsLog),
        div_log: JSON.stringify(divLog),
        dir_log: JSON.stringify(dirLog),
        units_log: JSON.stringify(unitsLog),
        area_log: JSON.stringify(areaLog),
        version: 2,
      })

      if (departments && departments.length) {
        const docDeps = departments.map((depId: number) => {
          return {
            id: v4(),
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            department: depId,
            submission: submissionId,
            document_meta: idMeta,
          }
        })
        await trx('document_departments').insert(docDeps)
      }

      if (units.length) {
        await trx.raw('DELETE FROM document_units WHERE submission = ?', [
          submissionId,
        ])
        const docUnit = units.map((unitId: number) => {
          return {
            id: v4(),
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            unit: unitId,
            submission: submissionId,
            document_meta: idMeta,
          }
        })
        await trx('document_units').insert(docUnit)
      }

      if (send_email == 1) {
        /**
         * send email
         */

        const message = markdown.text({
          email,
          full_name,
          userId,
          time: new Date(),
          url: 'ims-dev.machinevision.global',
        })
        /**
         * get email target
         */
        const { email: targetEmail } = await trx('directus_users')
          .select('directus_users.email')
          .where('directus_users.id', assignToUserId)
          .first()

        const idNotif = v4()
        const [{ id: idNotification }] = await trx('notifications')
          .insert({
            id: idNotif,
            message,
            subject: reviewerActorName,
            url: '/document-review',
            created_at: new Date(),
          })
          .returning('id')

        await trx.commit()

        console.log(idNotification)

        await item.setItem({
          req,
          ItemsService,
          name: 'notifications_directus_users',
          body: {
            type: 'assessment',
            notifications_id: idNotification,
            subject: reviewerActorName,
            url: '/document-review',
            email: targetEmail,
            message,
            directus_users_id: assignToUserId,
          },
        })
      } else {
        await trx.commit()
      }

      return {
        success: true,
        message: 'Successfully Submit',
        data: { submission_id: submissionId },
      }
    } catch (error: any) {
      console.log(error)
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Delete(
    {
      path: '/activities/:activity_id/submissions/:submission_id',
      tag: 'Workflow',
    },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async deleteSubmission(
    @Req() req: any,
    @Param('activity_id') activity: string,
    @Param('submission_id') submission: string,
    @Context() ctx: any
  ) {
    const { database } = ctx

    const trx = await database.transaction()
    try {
      /**
       * WARNIG!!
       * contain IMS
       */

      await trx('form_assesors')
        .where('form_assesors.submission', submission)
        .del()
      await trx('document_metas')
        .where('document_metas.submission', submission)
        .del()
      await trx('form_comment_logs')
        .where('form_comment_logs.submission', submission)
        .del()
      await trx('document_departments')
        .where('document_departments.submission', submission)
        .del()
      await trx('document_units')
        .where('document_units.submission', submission)
        .del()
      await trx('form_logs').where('form_logs.submission', submission).del()
      await trx('submissions').where('submissions.id', submission).del()

      await trx.commit()

      return {
        success: true,
        message: 'Successfully Cancel Submission',
        // data: { submission_id: submissionId },
      }
    } catch (error: any) {
      console.log(error)
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Put(
    {
      path: '/activities/:activity_id/submissions/:submission_id/:submission_number',
      tag: 'Workflow',
    },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],

      request: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
          },
          status: {
            type: 'number',
          },
          reject_type: {
            type: 'string',
          },
          dispose_to: {
            type: 'string',
          },
          assign_to: {
            type: 'string',
          },
          replaced: {
            type: 'string',
          },
          approve_order: {
            type: 'string',
          },
          reason: {
            type: 'string',
          },
          send_email: {
            type: 'number',
          },
          draft_id: {
            type: 'number',
          },
        },
      },
    }
  )
  /**
   * TODO: update dispsto tu null when approved
   */
  async putSubmission(
    @Req() req: any,
    @Body() body: SubmissionDTO,
    @Param('submission_id') submissionId: string,
    @Param('activity_id') activity: string,
    @Param('submission_number') submission_number: string,
    @Context() ctx: any
  ) {
    const {
      data,
      status,
      approve_order,
      dispose_to,
      assign_to: assignToUserId,
      replaced,
      reject_type,
      reason,
      send_email,
      draft_id,
    } = body || {}

    const {
      services: { ItemsService, UsersService },
      database,
      env,
    } = ctx

    const {
      id: userId,
      email,
      full_name,
    } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()
    try {
      const userLog = await trx('directus_users')
        .select(
          'directus_users.id',
          'directus_users.first_name',
          'directus_users.last_name',
          'directus_users.email',
          'directus_users.avatar',
          'directus_users.external_identifier',
          'directus_users.full_name',
          'directus_users.nip',
          'directus_users.created_at',
          'directus_users.updated_at',
          'directus_users.i_department_code',
          'directus_users.i_com_code',
          'directus_users.i_job_code',
          'directus_users.i_job_name',
          'directus_users.i_werk',
          'directus_users.i_id',
          'directus_users.i_endda',
          'directus_users.nip_new',
          'directus_users.source',
          'directus_users.pegawai',
          'mt_departments.name as department_name',
          'mt_departments.code as department_code'
        )
        .join(
          'mt_departments',
          'mt_departments.id',
          'directus_users.department'
        )
        .where('directus_users.id', userId)
        .first()
      /**
       * get statuses id
       */
      const [{ code: currentStatusCode }] = await trx('statuses')
        .select('statuses.code')
        .where('statuses.id', status)
        .whereNull('statuses.deleted_at')

      /**
       * get aprover to and order from last form_logs
       *
       * order for get next approver
       * approveTo for update actorassignToUserId
       */
      const { code: lastcode, reject_number } = await trx('form_logs')
        .select('statuses.code', 'form_logs.reject_number')
        .join('approve_orders', 'approve_orders.id', 'form_logs.approve_order')
        .join('statuses', 'statuses.id', 'form_logs.status')
        .whereNull('approve_orders.deleted_at')
        .whereNull('statuses.deleted_at')
        .where('form_logs.submission', submissionId)
        .where('form_logs.submission_number', submission_number)
        .orderBy('form_logs.created_at', 'desc')
        .first()
      /**
       * get current approveOrderId
       */
      const {
        id: currentAppOrderId,
        order: currentOrder,
        approve_to: approveTo,
        assign_to: assignTo,
      } = await trx('approve_orders')
        .select(
          'approve_orders.id',
          'approve_orders.order',
          'approve_orders.approve_to',
          'approve_orders.assign_to'
        )
        .whereNull('approve_orders.deleted_at')
        .where('approve_orders.id', approve_order)
        .where('approve_orders.activity', activity)
        .first()

      let nextOrder
      if (currentStatusCode === 'DISPS') {
        nextOrder = currentAppOrderId

        await trx('form_assesors').insert({
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          submission: submissionId,
          form_actor: assignTo,
          officer: dispose_to ?? assignToUserId,
          disposer: !!dispose_to,
          replaced,
        })
      }

      /**
       * status status revised kembali ke pertama
       */
      if (currentStatusCode === 'RVSED') {
        const { id: revisedApproveOrderId, assign_to } = (await await trx(
          'approve_orders'
        )
          .select('approve_orders.id', 'approve_orders.assign_to')
          .whereNull('approve_orders.deleted_at')
          .where('approve_orders.activity', activity)
          .where('approve_orders.order', 2)
          .first()) || {
          id: null,
        }

        await trx('form_assesors').insert({
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          submission: submissionId,
          form_actor: assign_to,
          officer: dispose_to ?? assignToUserId,
          disposer: !!dispose_to,
          replaced,
        })

        nextOrder = revisedApproveOrderId
      }
      if (currentStatusCode === 'APPRD' || currentStatusCode === 'WAITN') {
        const { id: approveApproveOrderId, assign_to } = (await await trx(
          'approve_orders'
        )
          .select('approve_orders.id', 'approve_orders.assign_to')
          .whereNull('approve_orders.deleted_at')
          .where('approve_orders.activity', activity)
          .where('approve_orders.order', currentOrder + 1)
          .first()) || {
          id: null,
        }
        nextOrder = approveApproveOrderId

        console.log('assign_to', assign_to)

        await trx('form_assesors').insert({
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          submission: submissionId,
          form_actor: assign_to,
          officer: dispose_to ?? assignToUserId,
          disposer: !!dispose_to,
          replaced,
        })
      }
      if (currentStatusCode === 'COMPL') {
        nextOrder = null
      }

      console.log('nextOrder', nextOrder, currentStatusCode, currentOrder)

      /**
       * update form actor
       * if type
       *  REJCT = reject
       *  DISPS = disposisi
       *  APPRD = approve
       */

      /**
       * v2 disposisi no need remove form_assesors
       */
      // if (lastcode === 'DISPS') {
      //   await trx('form_assesors')
      //     .where({ submission: submissionId, form_actor: approveTo })
      //     .del()
      // }

      /**
       * update submission
       */
      const [
        {
          id,
          company: submissionCompany,
          plant: submissionPlant,
          activity: submissionActivity,
          business: submissionBusiness,
          form: submissionForm,
        },
      ] = await trx('submissions')
        .where({ id: submissionId })
        .update({ data, status })
        .returning('*')

      if (!id) throw new Error('Submission Failed')

      /**
       * add new form log
       */
      const [{ id: idLog }] = await trx('form_logs')
        .insert({
          activity: submissionActivity,
          business: submissionBusiness,
          company: submissionCompany,
          created_by: userId,
          form: submissionForm,
          plant: submissionPlant,
          submission_number,
          status,
          created_at: new Date(),
          submission: submissionId,
          approve_order: approve_order,
          next_order: nextOrder,
          reject_type,
          data,
          reason,
          reject_number,
          assignee_log: userLog,
        })
        .returning('id')

      await trx('submissions')
        .where({ id: submissionId })
        .update({ current_form_log: idLog })

      if (draft_id) {
        await trx('submission_drafts')
          .where({ id: draft_id })
          .update({ deleted_at: new Date() })
      }

      /**
       * WARNIG!!
       * contain IMS
       */

      const { detail } = data || {}
      const {
        judul,
        description,
        department,
        directorate,
        division,
        applicableFor,
        departments = [],
        units = [],
        deptsLog,
        divLog,
        dirLog,
        unitsLog,
        areaLog,
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
          acc.applicableFor = applicableFor?.id || null

          acc.deptsLog = department
          acc.divLog = division
          acc.dirLog = directorate
          acc.unitsLog = units
          acc.areaLog = applicableFor
        }
        return acc
      }, {})

      const [{ id: metaId }] = await trx('document_metas')
        .update({
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          judul: judul,
          department_division: division,
          department_directorat: directorate,
          // department: department,
          description: description,
          code: `${directorate}#${division}#${department}#${applicableFor}`,
          /**
           * WARNING
           * contain IMS
           */
          area_numbering_apply: applicableFor,
          depts_log: JSON.stringify(deptsLog),
          div_log: JSON.stringify(divLog),
          dir_log: JSON.stringify(dirLog),
          units_log: JSON.stringify(unitsLog),
          area_log: JSON.stringify(areaLog),
        })
        .where({ submission: submissionId })
        .returning('*')

      if (departments.length) {
        await trx.raw('DELETE FROM document_departments WHERE submission = ?', [
          submissionId,
        ])
        const docDeps = departments.map((depId: number) => {
          return {
            id: v4(),
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            department: depId,
            submission: submissionId,
            document_meta: metaId,
          }
        })
        await trx('document_departments').insert(docDeps)
      }

      if (units.length) {
        await trx.raw('DELETE FROM document_units WHERE submission = ?', [
          submissionId,
        ])
        const docUnit = units.map((unitId: number) => {
          return {
            id: v4(),
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            unit: unitId,
            submission: submissionId,
            document_meta: metaId,
          }
        })
        await trx('document_units').insert(docUnit)
      }

      if (send_email == 1 && nextOrder) {
        /**
         * send email
         */

        /**
         * get next naorder name
         */
        const { name: reviewerActorName } = (await trx('approve_orders')
          .select('form_actors.name')
          .join('form_actors', 'form_actors.id', 'approve_orders.assign_to')
          .whereNull('form_actors.deleted_at')
          .whereNull('approve_orders.deleted_at')
          .where('approve_orders.id', nextOrder)
          .first()) || {
          name: '',
        }

        const message = markdown.text({
          email,
          full_name,
          userId,
          time: new Date(),
          url: 'ims-dev.machinevision.global',
        })
        /**
         * get email target
         */
        const { email: targetEmail } =
          (await trx('directus_users')
            .select('directus_users.email')
            .where('directus_users.id', assignToUserId || dispose_to)
            .first()) || {}

        const idNotif = v4()
        const [{ id: idNotification }] = await trx('notifications')
          .insert({
            id: idNotif,
            message,
            subject: reviewerActorName,
            url: '/document-review',
            created_at: new Date(),
          })
          .returning('id')

        await trx.commit()

        console.log(idNotification)

        await item.setItem({
          req,
          ItemsService,
          name: 'notifications_directus_users',
          body: {
            type: 'assessment',
            notifications_id: idNotification,
            subject: reviewerActorName,
            url: '/document-review',
            email: targetEmail,
            message,
            directus_users_id: assignToUserId,
          },
        })
      } else {
        await trx.commit()
      }

      return {
        success: true,
        message: 'Successfully Submit',
      }
    } catch (error: any) {
      console.log(error)
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Put(
    {
      path: '/activities/:activity_id/submissions/:submission_id/:submission_number/reject',
      tag: 'Workflow',
    },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],

      request: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
          },
          status: {
            type: 'number',
          },
          reject_type: {
            type: 'string',
          },
          assign_to: {
            type: 'string',
          },
          approve_order: {
            type: 'string',
          },
          reason: {
            type: 'string',
          },
          send_email: {
            type: 'number',
          },
        },
      },
    }
  )
  /**
   * TODO: update dispsto tu null when approved
   */
  async putRejactSubmission(
    @Req() req: any,
    @Body() body: SubmissionDTO,
    @Param('submission_id') submissionId: string,
    @Param('activity_id') activity: string,
    @Param('submission_number') submission_number: string,
    @Context() ctx: any
  ) {
    const {
      data,
      status,
      approve_order,
      dispose_to,
      assign_to: assignToUserId,
      reject_type,
      reason,
      send_email,
    } = body || {}

    const {
      services: { ItemsService, UsersService },
      database,
      env,
    } = ctx

    const {
      id: userId,
      email,
      full_name,
    } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()
    try {
      const userLog = await trx('directus_users')
        .select(
          'directus_users.id',
          'directus_users.first_name',
          'directus_users.last_name',
          'directus_users.email',
          'directus_users.avatar',
          'directus_users.external_identifier',
          'directus_users.full_name',
          'directus_users.nip',
          'directus_users.created_at',
          'directus_users.updated_at',
          'directus_users.i_department_code',
          'directus_users.i_com_code',
          'directus_users.i_job_code',
          'directus_users.i_job_name',
          'directus_users.i_werk',
          'directus_users.i_id',
          'directus_users.i_endda',
          'directus_users.nip_new',
          'directus_users.source',
          'directus_users.pegawai',
          'mt_departments.name as department_name',
          'mt_departments.code as department_code'
        )
        .join(
          'mt_departments',
          'mt_departments.id',
          'directus_users.department'
        )
        .where('directus_users.id', userId)
        .first()

      /**
       * get statuses id
       */
      const [{ code: currentStatusCode = 'REJCT' }] = await trx('statuses')
        .select('statuses.code')
        .where('statuses.id', status)
        .whereNull('statuses.deleted_at')

      const { code: currentRejectType } =
        (await trx('form_reject_types')
          .select('form_reject_types.code')
          .where('form_reject_types.id', reject_type)
          .whereNull('form_reject_types.deleted_at')
          .first()) || {}

      let nextOrder
      let formActor

      if (currentStatusCode === 'REJCT' && currentRejectType === 'RVISI') {
        const { id: revisedApproveOrderId, assign_to } = (await trx(
          'approve_orders'
        )
          .select('approve_orders.id', 'approve_orders.assign_to')
          .whereNull('approve_orders.deleted_at')
          .where('approve_orders.activity', activity)
          .where('approve_orders.order', 1)
          .first()) || {
          id: null,
        }
        formActor = assign_to

        console.log('assign_to', assign_to, revisedApproveOrderId)
        await trx('form_assesors').insert({
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          submission: submissionId,
          officer: assignToUserId,
          form_actor: assign_to,
        })

        nextOrder = revisedApproveOrderId
      } else if (
        currentStatusCode === 'REJCT' &&
        currentRejectType === 'TDKLT'
      ) {
        nextOrder = null
      } else {
        throw new Error('invalid Reject code')
      }

      /**
       * update form actor
       * if type
       *  REJCT = reject
       *  DISPS = disposisi
       *  APPRD = approve
       */
      // await trx('form_assesors').where({ submission: submissionId }).del()

      /**
       * update submission
       */
      const [
        {
          id,
          company: submissionCompany,
          plant: submissionPlant,
          activity: submissionActivity,
          business: submissionBusiness,
          form: submissionForm,
        },
      ] = await trx('submissions')
        .where({ id: submissionId })
        .update({ data, status })
        .returning('*')

      if (!id) throw new Error('Submission Failed')

      const { reject_number } =
        (await database('form_logs')
          .select('form_logs.reject_number')
          .where('form_logs.submission', submissionId)
          .orderBy('form_logs.id', 'desc')
          .first()) || {}

      /**
       * add new form log
       */
      const [{ id: idLog }] = await trx('form_logs')
        .insert({
          activity: submissionActivity,
          business: submissionBusiness,
          company: submissionCompany,
          created_by: userId,
          form: submissionForm,
          plant: submissionPlant,
          submission_number,
          status,
          created_at: new Date(),
          submission: submissionId,
          approve_order: approve_order,
          next_order: nextOrder,
          reject_type,
          data,
          reason,
          reject_number: reject_number + 1,
          assignee_log: userLog,
        })
        .returning('id')

      // await trx('form_assesors')
      //   .update({ form_log: idLog })
      //   .where('id', '=', function (qb: any) {
      //     qb.select('id')
      //       .from('form_assesors')
      //       .where('submission', submissionId)
      //       .orderBy('id', 'desc')
      //       .limit(1)
      //   })

      await trx('submissions')
        .where({ id: submissionId })
        .update({ current_form_log: idLog })

      /**
       * WARNIG!!
       * contain IMS
       */

      const { detail } = data || {}
      const {
        judul,
        description,
        department,
        directorate,
        division,
        applicableFor,
        departments,
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
            department,
            directorate,
            division,
            applicableFor,
            units = [],
          } = detail[ctx].value || {}

          if (
            department &&
            typeof department === 'object' &&
            department.length
          ) {
            acc.departments = department.map((dep: any) => dep.id)
            acc.department = null
          } else if (
            department &&
            typeof department === 'object' &&
            !department.length
          ) {
            acc.departments = []
            acc.department = department?.id || null
          }

          acc.units = units.map((unit: any) => unit.id)
          acc.department = department?.id || null
          acc.directorate = directorate?.id || null
          acc.division = division?.id || null
          acc.applicableFor = applicableFor?.id || null
        }
        return acc
      }, {})

      const [{ id: metaId }] = await trx('document_metas')
        .update({
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          judul: judul,
          department_division: division,
          department_directorat: directorate,
          // department: department,
          description: description,
          code: `${directorate}#${division}#${department}#${applicableFor}`,
          /**
           * WARNING
           * contain IMS
           */
          area_numbering_apply: applicableFor,
        })
        .where({ submission: submissionId })
        .returning('*')

      // console.log('departments', departments)

      if (departments.length) {
        await trx.raw('DELETE FROM document_departments WHERE submission = ?', [
          submissionId,
        ])
        const docDeps = departments.map((depId: number) => {
          return {
            id: v4(),
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            department: depId,
            submission: submissionId,
            document_meta: metaId,
          }
        })
        await trx('document_departments').insert(docDeps)
      }

      if (units.length) {
        await trx.raw('DELETE FROM document_units WHERE submission = ?', [
          submissionId,
        ])
        const docUnit = units.map((unitId: number) => {
          return {
            id: v4(),
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            unit: unitId,
            submission: submissionId,
            document_meta: metaId,
          }
        })
        await trx('document_units').insert(docUnit)
      }

      const rejection = {
        id: v4(),
        approve_order,
        description,
        type: reject_type,
        reject_to: formActor,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      }
      await trx('form_rejections').insert(rejection)

      if (send_email == 1 && nextOrder) {
        /**
         * send email
         */

        /**
         * get next naorder name
         */
        const { name: reviewerActorName } = (await trx('approve_orders')
          .select('form_actors.name')
          .join('form_actors', 'form_actors.id', 'approve_orders.assign_to')
          .whereNull('form_actors.deleted_at')
          .whereNull('approve_orders.deleted_at')
          .where('approve_orders.id', nextOrder)
          .first()) || {
          name: '',
        }

        const message = markdown.text({
          email,
          full_name,
          userId,
          time: new Date(),
          url: 'ims-dev.machinevision.global',
        })
        /**
         * get email target
         */
        const { email: targetEmail } =
          (await trx('directus_users')
            .select('directus_users.email')
            .where('directus_users.id', assignToUserId || dispose_to)
            .first()) || {}

        const idNotif = v4()
        const [{ id: idNotification }] = await trx('notifications')
          .insert({
            id: idNotif,
            message,
            subject: reviewerActorName,
            url: '/document-review',
            created_at: new Date(),
          })
          .returning('id')

        await trx.commit()

        console.log(idNotification)

        await item.setItem({
          req,
          ItemsService,
          name: 'notifications_directus_users',
          body: {
            type: 'assessment',
            notifications_id: idNotification,
            subject: reviewerActorName,
            url: '/document-review',
            email: targetEmail,
            message,
            directus_users_id: assignToUserId,
          },
        })
      } else {
        await trx.commit()
      }

      return {
        success: true,
        message: 'Successfully Submit',
      }
    } catch (error: any) {
      console.log(error)
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Put(
    {
      path: '/submissions/:submission_id/reject-force',
      tag: 'Workflow',
    },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      request: {
        type: 'object',
        properties: {
          send_email: {
            type: 'number',
          },
        },
      },
    }
  )
  async putRejectForceSubmission(
    @Body() body: any,
    @Req() req: any,
    @Param('submission_id') submissionId: string,
    @Context() ctx: any
  ) {
    const { send_email, reason } = body || {}
    const {
      services: { ItemsService, UsersService },
      database,
    } = ctx

    const {
      id: userId,
      email,
      full_name,
    } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()
    try {
      const userLog = await trx('directus_users')
        .select(
          'directus_users.id',
          'directus_users.first_name',
          'directus_users.last_name',
          'directus_users.email',
          'directus_users.avatar',
          'directus_users.external_identifier',
          'directus_users.full_name',
          'directus_users.nip',
          'directus_users.created_at',
          'directus_users.updated_at',
          'directus_users.i_department_code',
          'directus_users.i_com_code',
          'directus_users.i_job_code',
          'directus_users.i_job_name',
          'directus_users.i_werk',
          'directus_users.i_id',
          'directus_users.i_endda',
          'directus_users.nip_new',
          'directus_users.source',
          'directus_users.pegawai',
          'mt_departments.name as department_name',
          'mt_departments.code as department_code'
        )
        .join(
          'mt_departments',
          'mt_departments.id',
          'directus_users.department'
        )
        .where('directus_users.id', userId)
        .first()
      const { submission_number, activity, data } =
        (await trx('submissions')
          .select(
            'submissions.submission_number',
            'submissions.activity',
            'submissions.data'
          )
          .where('submissions.id', submissionId)
          .first()) || {}

      const { id: reject_type } =
        (await trx('form_reject_types')
          .select('form_reject_types.code', 'form_reject_types.id')
          .where('form_reject_types.code', 'RVISI')
          .whereNull('form_reject_types.deleted_at')
          .first()) || {}

      /**
       * get statuses id
       */
      const { id: statusId = 16 } =
        (await trx('statuses')
          .select('statuses.id')
          .where('statuses.code', 'REJCT')
          .whereNull('statuses.deleted_at')
          .first()) || {}

      const {
        id: revisedApproveOrderId,
        assign_to,
        created_by,
      } = (await trx('form_logs')
        .select(
          'approve_orders.id',
          'approve_orders.assign_to',
          'form_logs.created_by'
        )
        .join('approve_orders', 'approve_orders.id', 'form_logs.approve_order')
        .whereNull('approve_orders.deleted_at')
        .where('form_logs.submission', submissionId)
        .where('approve_orders.activity', activity)
        .where('approve_orders.order', 1)
        .orderBy('form_logs.created_at', 'asc')
        .first()) || {
        id: null,
      }
      const formActor = assign_to
      const nextOrder = revisedApproveOrderId

      /**
       * update form actor
       * if type
       *  REJCT = reject
       *  DISPS = disposisi
       *  APPRD = approve
       */
      // await trx('form_assesors').where({ submission: submissionId }).del()

      /**
       * update submission
       */
      const [
        {
          id,
          company: submissionCompany,
          plant: submissionPlant,
          activity: submissionActivity,
          business: submissionBusiness,
          form: submissionForm,
        },
      ] = await trx('submissions')
        .where({ id: submissionId })
        .update({ status: statusId })
        .returning('*')

      if (!id) throw new Error('Submission Failed')

      const { reject_number, approve_order } =
        (await database('form_logs')
          .select('form_logs.reject_number', 'form_logs.approve_order')
          .where('form_logs.submission', submissionId)
          .orderBy('form_logs.id', 'desc')
          .first()) || {}

      /**
       * add new form log
       */
      const [{ id: idLog }] = await trx('form_logs')
        .insert({
          activity: submissionActivity,
          business: submissionBusiness,
          company: submissionCompany,
          created_by: userId,
          form: submissionForm,
          plant: submissionPlant,
          submission_number,
          status: statusId,
          created_at: new Date(),
          submission: submissionId,
          approve_order: approve_order,
          next_order: nextOrder,
          reject_type,
          data,
          reason: reason ?? 'Reject by admin',
          reject_number: reject_number + 1,
          assignee_log: userLog,
        })
        .returning('id')

      // await trx('form_assesors')
      //   .update({ form_log: idLog })
      //   .where('id', '=', function (qb: any) {
      //     qb.select('id')
      //       .from('form_assesors')
      //       .where('submission', submissionId)
      //       .orderBy('id', 'desc')
      //       .limit(1)
      //   })

      await trx('form_assesors').insert({
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
        submission: submissionId,
        officer: created_by,
        form_actor: formActor,
      })

      await trx('submissions')
        .where({ id: submissionId })
        .update({ current_form_log: idLog })

      /**
       * WARNIG!!
       * contain IMS
       */

      const { detail } = data || {}
      const {
        judul,
        description,
        department,
        directorate,
        division,
        applicableFor,
        departments,
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
            department,
            directorate,
            division,
            applicableFor,
            units = [],
          } = detail[ctx].value || {}

          if (
            department &&
            typeof department === 'object' &&
            department.length
          ) {
            acc.departments = department.map((dep: any) => dep.id)
            acc.department = null
          } else if (
            department &&
            typeof department === 'object' &&
            !department.length
          ) {
            acc.departments = []
            acc.department = department?.id || null
          }

          acc.units = units.map((unit: any) => unit.id)
          acc.department = department?.id || null
          acc.directorate = directorate?.id || null
          acc.division = division?.id || null
          acc.applicableFor = applicableFor?.id || null
        }
        return acc
      }, {})

      const [{ id: metaId }] = await trx('document_metas')
        .update({
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          judul: judul,
          department_division: division,
          department_directorat: directorate,
          // department: department,
          description: description,
          code: `${directorate}#${division}#${department}#${applicableFor}`,
          /**
           * WARNING
           * contain IMS
           */
          area_numbering_apply: applicableFor,
        })
        .where({ submission: submissionId })
        .returning('*')

      // console.log('departments', departments)

      if (departments.length) {
        await trx.raw('DELETE FROM document_departments WHERE submission = ?', [
          submissionId,
        ])
        const docDeps = departments.map((depId: number) => {
          return {
            id: v4(),
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            department: depId,
            submission: submissionId,
            document_meta: metaId,
          }
        })
        await trx('document_departments').insert(docDeps)
      }

      if (units.length) {
        await trx.raw('DELETE FROM document_units WHERE submission = ?', [
          submissionId,
        ])
        const docUnit = units.map((unitId: number) => {
          return {
            id: v4(),
            created_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            unit: unitId,
            submission: submissionId,
            document_meta: metaId,
          }
        })
        await trx('document_units').insert(docUnit)
      }

      const rejection = {
        id: v4(),
        approve_order,
        description,
        type: reject_type,
        reject_to: formActor,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      }
      await trx('form_rejections').insert(rejection)

      if (send_email == 1 && nextOrder) {
        /**
         * send email
         */

        /**
         * get next naorder name
         */
        const { name: reviewerActorName } = (await trx('approve_orders')
          .select('form_actors.name')
          .join('form_actors', 'form_actors.id', 'approve_orders.assign_to')
          .whereNull('form_actors.deleted_at')
          .whereNull('approve_orders.deleted_at')
          .where('approve_orders.id', nextOrder)
          .first()) || {
          name: '',
        }

        const message = markdown.text({
          email,
          full_name,
          userId,
          time: new Date(),
          url: 'ims-dev.machinevision.global',
        })
        /**
         * get email target
         */
        const { email: targetEmail } =
          (await trx('directus_users')
            .select('directus_users.email')
            .where('directus_users.id', created_by)
            .first()) || {}

        const idNotif = v4()
        const [{ id: idNotification }] = await trx('notifications')
          .insert({
            id: idNotif,
            message,
            subject: reviewerActorName,
            url: '/document-revise',
            created_at: new Date(),
          })
          .returning('id')

        await trx.commit()

        console.log(idNotification)

        await item.setItem({
          req,
          ItemsService,
          name: 'notifications_directus_users',
          body: {
            type: 'assessment',
            notifications_id: idNotification,
            subject: reviewerActorName,
            url: '/document-revise',
            email: targetEmail,
            message,
            directus_users_id: created_by,
          },
        })
      } else {
        await trx.commit()
      }

      return {
        success: true,
        message: 'Successfully Reject',
      }
    } catch (error: any) {
      console.log(error)
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Put(
    {
      path: '/submissions/:submission_id/reject-end',
      tag: 'Workflow',
    },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      request: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
          },
        },
      },
    }
  )
  async putRejectEndSubmission(
    @Body() body: any,
    @Req() req: any,
    @Param('submission_id') submissionId: string,
    @Context() ctx: any
  ) {
    const { reason } = body || {}
    const {
      services: { UsersService },
      database,
    } = ctx

    const { id: userId } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()
    try {
      const userLog = await trx('directus_users')
        .select(
          'directus_users.id',
          'directus_users.first_name',
          'directus_users.last_name',
          'directus_users.email',
          'directus_users.avatar',
          'directus_users.external_identifier',
          'directus_users.full_name',
          'directus_users.nip',
          'directus_users.created_at',
          'directus_users.updated_at',
          'directus_users.i_department_code',
          'directus_users.i_com_code',
          'directus_users.i_job_code',
          'directus_users.i_job_name',
          'directus_users.i_werk',
          'directus_users.i_id',
          'directus_users.i_endda',
          'directus_users.nip_new',
          'directus_users.source',
          'directus_users.pegawai',
          'mt_departments.name as department_name',
          'mt_departments.code as department_code'
        )
        .join(
          'mt_departments',
          'mt_departments.id',
          'directus_users.department'
        )
        .where('directus_users.id', userId)
        .first()
      const { submission_number, activity, data } =
        (await trx('submissions')
          .select(
            'submissions.submission_number',
            'submissions.activity',
            'submissions.data'
          )
          .where('submissions.id', submissionId)
          .first()) || {}

      const { id: reject_type } =
        (await trx('form_reject_types')
          .select('form_reject_types.code', 'form_reject_types.id')
          .where('form_reject_types.code', 'TDKLT')
          .whereNull('form_reject_types.deleted_at')
          .first()) || {}

      /**
       * get statuses id
       */
      const { id: statusId = 16 } =
        (await trx('statuses')
          .select('statuses.id')
          .where('statuses.code', 'REJCT')
          .whereNull('statuses.deleted_at')
          .first()) || {}

      const formActor = null
      const nextOrder = null

      /**
       * update form actor
       * if type
       *  REJCT = reject
       *  DISPS = disposisi
       *  APPRD = approve
       */

      /**
       * update submission
       */
      const [
        {
          id,
          company: submissionCompany,
          plant: submissionPlant,
          activity: submissionActivity,
          business: submissionBusiness,
          form: submissionForm,
        },
      ] = await trx('submissions')
        .where({ id: submissionId })
        .update({ status: statusId })
        .returning('*')

      if (!id) throw new Error('Submission Failed')

      const { reject_number, approve_order } =
        (await database('form_logs')
          .select('form_logs.reject_number', 'form_logs.approve_order')
          .where('form_logs.submission', submissionId)
          .orderBy('form_logs.id', 'desc')
          .first()) || {}

      /**
       * add new form log
       */
      const [{ id: idLog }] = await trx('form_logs')
        .insert({
          activity: submissionActivity,
          business: submissionBusiness,
          company: submissionCompany,
          created_by: userId,
          form: submissionForm,
          plant: submissionPlant,
          submission_number,
          status: statusId,
          created_at: new Date(),
          submission: submissionId,
          approve_order: approve_order,
          next_order: nextOrder,
          reject_type,
          data,
          reason: reason ?? 'Reject by admin',
          reject_number: reject_number + 1,
          assignee_log: userLog,
        })
        .returning('id')

      await trx('submissions')
        .where({ id: submissionId })
        .update({ current_form_log: idLog })

      /**
       * WARNIG!!
       * contain IMS
       */

      const rejection = {
        id: v4(),
        approve_order,
        description: reason,
        type: reject_type,
        reject_to: formActor,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      }
      await trx('form_rejections').insert(rejection)

      await trx.commit()

      return {
        success: true,
        message: 'Successfully Reject',
      }
    } catch (error: any) {
      console.log(error)
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Put(
    {
      path: '/submissions/:submission_id/reject-roleback',
      tag: 'Workflow',
    },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async putRejectRolbackSubmission(
    @Param('submission_id') submissionId: string,
    @Context() ctx: any
  ) {
    const { database } = ctx

    const trx = await database.transaction()
    try {
      await trx('form_assesors')
        .where('id', '=', function (qb: any) {
          qb.select('id')
            .from('form_assesors')
            .where('submission', submissionId)
            .orderBy('id', 'desc')
            .limit(1)
        })
        .del()

      await trx('form_logs')
        .where('id', '=', function (qb: any) {
          qb.select('id')
            .from('form_logs')
            .where('submission', submissionId)
            .orderBy('id', 'desc')
            .limit(1)
        })
        .del()

      await trx.commit()

      return {
        success: true,
        message: 'Successfully Rolback',
      }
    } catch (error: any) {
      console.log(error)
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Put(
    {
      path: '/submissions/:submission_id/assesor-replace',
      tag: 'Workflow',
    },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      request: {
        type: 'object',
        properties: {
          officer_replacer_id: {
            type: 'string',
          },
          form_logs_id: {
            type: 'string',
          },
          approve_order_id: {
            type: 'string',
          },
          status: {
            type: 'string',
          },
        },
      },
    }
  )
  async putAssesorReplaceSubmission(
    @Body() body: any,
    @Param('submission_id') submissionId: string,
    @Context() ctx: any
  ) {
    const { approve_order_id, officer_replacer_id, form_logs_id, status } =
      body || {}
    const { database } = ctx

    if (!(approve_order_id && officer_replacer_id && form_logs_id && status)) {
      throw new Error(
        'approve_order_id, officer_replacer_id, form_logs_id, status is required'
      )
    }

    const trx = await database.transaction()
    try {
      const { order, activity } =
        (await trx('approve_orders').where('id', approve_order_id).first()) ||
        {}

      const { id: statusId } =
        (await trx('statuses').select('*').where('code', status).first()) || {}

      // console.log(
      //   'sts',
      //   statusId,
      //   status,
      //   approve_order_id,
      //   officer_replacer_id
      // )

      const { id: next_order } =
        (await trx('approve_orders')
          .where('order', order + 1)
          .where('activity', activity)
          .first()) || {}

      await trx('form_logs')
        .where({
          submission: submissionId,
          id: form_logs_id,
        })
        .update({
          created_by: officer_replacer_id,
          approve_order: approve_order_id,
          next_order: next_order,
          status: statusId,
        })

      // const { assign_to } =
      //   (await trx('approve_orders')
      //     .select('approve_orders.assign_to')
      //     .where({
      //       id: approve_order_id,
      //     })
      //     .first()) || {}

      // await trx('form_assesors')
      //   .where({
      //     submission: submissionId,
      //     form_actor: assign_to,
      //     form_log: form_logs_id,
      //   })
      //   .update({ officer: officer_replacer_id })

      await trx.commit()

      return {
        success: true,
        message: 'Successfully Replace',
      }
    } catch (error: any) {
      console.log(error)
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Get(
    { path: '/submissions/:submission_id/history', tag: 'Workflow' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async submissionHistory(
    @Param('submission_id') submission_id: number,
    @Context() ctx: any
  ) {
    try {
      if (!submission_id) {
        throw new Error('submission_id is required')
      }

      const result = await ctx
        .database('form_logs')
        .select(
          'form_logs.created_at',
          'form_logs.id as log_id',
          'directus_users.id as user_id',
          'directus_users.first_name',
          'directus_users.last_name',
          'directus_users.full_name',
          'statuses.code as status_code',
          'statuses.name as status_name',
          'approve_orders.id as order_id',
          'form_actors.id as assign_to_id',
          'form_actors.name as assign_to_name'
        )
        .join('statuses', 'statuses.id', 'form_logs.status')
        .join('directus_users', 'directus_users.id', 'form_logs.created_by')
        .join('approve_orders', 'approve_orders.id', 'form_logs.approve_order')
        .join('form_actors', 'form_actors.id', 'approve_orders.assign_to')
        .where('form_logs.submission', submission_id)
        .orderBy('form_logs.id', 'desc')

      return {
        data: result,
        success: true,
        message: 'Successfully Replace',
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message || error,
      }
    }
  }

  @Delete(
    { path: '/form_logs/:form_logs_id', tag: 'Workflow' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async formLogDelete(
    @Param('form_logs_id') form_logs_id: number,
    @Context() ctx: any
  ) {
    try {
      if (!form_logs_id) {
        throw new Error('submission_id is required')
      }

      const result =
        (await ctx
          .database('form_logs')
          .select(
            'form_logs.id as log_id',
            'form_logs.created_at',
            'form_logs.submission',
            'form_assesors.id as assesor_id'
          )
          .join(
            'approve_orders',
            'approve_orders.id',
            'form_logs.approve_order'
          )
          .join('form_actors', 'form_actors.id', 'approve_orders.assign_to')
          .join('form_assesors', function (qb: any) {
            qb.on('form_logs.submission', '=', 'form_assesors.submission')
            qb.on('form_logs.created_by', '=', 'form_assesors.created_by')
            qb.on('approve_orders.approve_to', '=', 'form_assesors.form_actor')
          })
          .where('form_logs.id', form_logs_id)
          .first()) || {}

      if (result.assesor_id) {
        await ctx.database('form_assesors').where('id', result.assesor_id).del()
      }

      if (result.log_id) {
        await ctx.database('form_logs').where('id', result.log_id).del()
      }

      return {
        data: result,
        success: true,
        message: 'Successfully delete',
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message || error,
      }
    }
  }

  @Delete(
    { path: '/submissions/:submission_id', tag: 'Workflow' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                msg: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    }
  )
  async submissionDelete(
    @Param('submission_id') submission_id: number,
    @Context() ctx: any
  ) {
    try {
      if (!submission_id) {
        throw new Error('submission_id is required')
      }

      const result = await ctx
        .database('submissions')
        .where('id', submission_id)
        .del()

      return {
        data: result,
        success: true,
        message: 'Successfully Replace',
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message || error,
      }
    }
  }
}
