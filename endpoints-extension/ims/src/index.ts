import { Client } from 'pg'
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
} from '@mv-data-core/decorator'
import { item } from './helpers'
import { type SearchDTO, type SubmissionDTO } from './interfaces'
import { v4 } from 'uuid'
import { format2dgt } from './utils'
import client from './providers'

@Endpoint('ims')
export default class DefineEndpoint {
  @Get(
    { path: '/file-publisers/lite', tag: 'IMS/file-publisers' },
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
          name: 'query',
          schema: { type: 'string' },
          required: false,
        },
        {
          in: 'query',
          name: 'business_id',
          schema: { type: 'array' },
          items: { type: 'number' },
          required: true,
        },
        {
          in: 'query',
          name: 'department_division',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'department_directorat',
          schema: { type: 'number' },
          required: false,
        },
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
        {
          in: 'query',
          name: 'cangkupan_wilayah',
          schema: { type: 'string' },
          required: false,
        },
        {
          in: 'query',
          name: 'status_code',
          schema: { type: 'string' },
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
          name: 'page',
          schema: { type: 'number' },
          required: false,
        },
      ],
    }
  )
  async fileFublisersLite(
    @Context() ctx: any,
    @Req() req: any,
    @Query('business_id') business_Id: number[],
    @Query('query') query: string,
    @Query('cangkupan_wilayah') wilayah: string,
    @Query('status_code') statusCode: string,
    @Query('department_division') departmentDivision: number,
    @Query('department_directorat') departmentDirectorat: number,
    @Query('departments') departments: number[],
    @Query('units') units: number[],
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 1
  ) {
    try {
      if (!business_Id) {
        throw new Error('Business is required')
      }

      const businessIds =
        business_Id instanceof Array ? business_Id : [business_Id]
      const {
        services: { UsersService },
        database,
      } = ctx

      const { id: userId, instansi } = await item.getUser({ req, UsersService })

      const documentDepQuery = database('document_departments')
        .select(
          database.raw(
            `'document_departments.submission', json_agg((SELECT x FROM (SELECT mt_departments.id, mt_departments.code,mt_departments.name) AS x)) as departments`
          ),
          'document_departments.submission'
        )
        .join(
          'mt_departments',
          'mt_departments.id',
          'document_departments.department'
        )
        .whereNotNull('document_departments.submission')
        .whereNull('document_departments.deleted_at')
        .groupBy('document_departments.submission')

      const documentUnitQuery = database('document_units')
        .select(
          database.raw(
            `'document_units.submission', json_agg((SELECT x FROM (SELECT mt_departments.id, mt_departments.code,mt_departments.name) AS x)) as units`
          ),
          'document_units.submission'
        )
        .join('mt_departments', 'mt_departments.id', 'document_units.unit')
        .whereNotNull('document_units.submission')
        .groupBy('document_units.submission')

      /**
       * find complated submission
       */
      const submissionsQuery = database('submissions')
        .select(
          'submissions.id as submission',
          'submissions.activity',
          'submissions.form',
          'submissions.submission_number',
          'submissions.date_created',
          'directus_users.full_name as uploader',
          'statuses.code',
          'file_publishers.folder',
          'file_publishers.id as file_publisher_id',
          'file_publishers.document_number',
          'file_publishers.revision_number',
          'file_publishers.division_number',
          'document_metas.judul',
          'document_metas.description',
          'document_metas.department_division',
          'document_metas.department_directorat',
          'document_metas.department',
          'document_metas.document_number_draft',
          'department_division.name as department_division_name',
          'department_directorat.name as department_directorat_name',
          'department.name as department_name',
          'document_metas.area_numbering_apply',
          'area_numbering_applies.name as area_numbering_apply_name',
          'Businesses.name as businesses_name',
          'Businesses.id as businesses_id',
          'dd.departments',
          'du.units'
        )
        .join('document_metas', 'document_metas.submission', 'submissions.id')
        .leftJoin(
          'mt_departments as department_division',
          'department_division.id',
          'document_metas.department_division'
        )
        .leftJoin(
          'mt_departments as department_directorat',
          'department_directorat.id',
          'document_metas.department_directorat'
        )
        .leftJoin(
          'mt_departments as department',
          'department.id',
          'document_metas.department'
        )
        .leftJoin(
          'area_numbering_applies',
          'area_numbering_applies.id',
          'document_metas.area_numbering_apply'
        )
        .join('directus_users', 'directus_users.id', 'submissions.user_created')
        .join('forms', 'forms.id', 'submissions.form')
        .join('Businesses', 'Businesses.id', 'submissions.business')
        .join('statuses', 'statuses.id', 'submissions.status')
        .leftJoin(
          'file_publishers',
          'file_publishers.document_meta',
          'document_metas.id'
        )
        .where('submissions.com_code', instansi)
        .whereNull('Businesses.deleted_at')
        .whereNull('statuses.deleted_at')
        .whereNull('file_publishers.deleted_at')
        .whereNull('document_metas.deleted_at')
        .whereIn('submissions.business', businessIds)

      if (query) {
        submissionsQuery.where('document_metas.judul', 'ilike', `%${query}%`)
      }

      if (wilayah) {
        submissionsQuery.where('document_metas.area_numbering_apply', wilayah)
      }

      if (statusCode) {
        submissionsQuery.where('statuses.code', statusCode)
      } else {
        submissionsQuery.where('statuses.code', 'COMPL')
      }

      if (departmentDivision) {
        submissionsQuery.where(
          'document_metas.department_division',
          departmentDivision
        )
      }

      if (departmentDirectorat) {
        submissionsQuery.where(
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
        submissionsQuery.join(
          documentDepQuery.as('dd'),
          'dd.submission',
          'submissions.id'
        )
        documentDepQuery.whereIn('document_departments.department', departments)
      } else if (departments) {
        submissionsQuery.join(
          documentDepQuery.as('dd'),
          'dd.submission',
          'submissions.id'
        )
        documentDepQuery.where('document_departments.department', departments)
      } else {
        submissionsQuery.leftJoin(
          documentDepQuery.as('dd'),
          'dd.submission',
          'submissions.id'
        )
      }

      if (
        units &&
        typeof units === 'object' &&
        units instanceof Array &&
        units.length > 0
      ) {
        submissionsQuery.join(
          documentUnitQuery.as('du'),
          'du.submission',
          'submissions.id'
        )
        documentUnitQuery.whereIn('document_units.unit', units)
      } else if (units) {
        submissionsQuery.join(
          documentUnitQuery.as('du'),
          'du.submission',
          'submissions.id'
        )
        documentUnitQuery.where('document_units.unit', units)
      } else {
        submissionsQuery.leftJoin(
          documentUnitQuery.as('du'),
          'du.submission',
          'submissions.id'
        )
      }

      console.log(submissionsQuery.toString())
      const { count } =
        (await database
          .from(database.raw(`(${submissionsQuery.clone()}) as a`))
          .count()
          .first()) || {}

      submissionsQuery.limit(limit).offset((page - 1) * limit)

      const total_page = limit ? Math.ceil(count / limit) : null
      const submissions = await submissionsQuery

      return {
        success: true,
        message: 'Successfully Get file publisher',
        data: submissions,
        meta: {
          count: Number(count),
          total_page,
          current_page: page,
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
    { path: '/file-publisers', tag: 'IMS/file-publisers' },
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
          name: 'query',
          schema: { type: 'string' },
          required: false,
        },
        {
          in: 'query',
          name: 'business_id',
          schema: { type: 'array' },
          items: { type: 'number' },
          required: true,
        },
        // {
        //   in: 'query',
        //   name: 'department_division',
        //   schema: { type: 'number' },
        //   required: true,
        // },
        // {
        //   in: 'query',
        //   name: 'department_directorat',
        //   schema: { type: 'number' },
        //   required: true,
        // },
        {
          in: 'query',
          name: 'department',
          schema: { type: 'number' },
          required: false,
        },
      ],
    }
  )
  async fileFublisers(
    @Query('business_id') business_Id: number[],
    @Query('query') query: string,
    // @Query('department_division') department_division: number,
    // @Query('department_directorat') department_directorat: number,
    @Query('department') departmentId: number,
    @Context() ctx: any,
    @Req() req: any
  ) {
    try {
      if (!business_Id) {
        throw new Error('Business is required')
      }

      const businessIds =
        business_Id instanceof Array ? business_Id : [business_Id]
      const {
        database,
        services: { ItemsService },
      } = ctx

      /**
       * find complated submission
       */
      const submissionsQuery = database('submissions')
        .select(
          'submissions.id as submission',
          'submissions.activity',
          'submissions.form',
          'submissions.submission_number',
          'submissions.date_created',
          'directus_users.full_name as uploader',
          'statuses.code',
          'file_publishers.folder',
          'file_publishers.id as file_publisher_id',
          'file_publishers.document_number',
          'file_publishers.revision_number',
          'file_publishers.department_division',
          'file_publishers.division_number',
          'Businesses.name as businesses_name',
          'Businesses.id as businesses_id',
          'form_logs.id as current_form_log'
        )
        .join('directus_users', 'directus_users.id', 'submissions.user_created')
        .join('forms', 'forms.id', 'submissions.form')
        .join('Businesses', 'Businesses.id', 'submissions.business')
        .join('form_logs', 'form_logs.submission', 'submissions.id')
        .join('statuses', 'statuses.id', 'form_logs.status')
        .leftJoin(
          'file_publishers',
          'file_publishers.submission',
          'submissions.id'
        )
        .whereNull('Businesses.deleted_at')
        .whereNull('statuses.deleted_at')
        .whereNull('file_publishers.deleted_at')
        .whereIn('submissions.business', businessIds)
        .where('statuses.code', 'COMPL')

      const submissions = await submissionsQuery

      const logIds = submissions.map(
        ({ current_form_log }: any) => current_form_log
      )

      const params = {
        filter: { _and: [{ id: { _in: logIds } }] },
        fields: [
          'id',
          'data',
          'submission',
          'submission',
          'submission_number',
          'status.code',
          'status.name',
          'status.id',
          'created_by.id',
          'created_by.avatar.filename_download',
          'created_by.profile.email',
          'created_by.profile.full_name',
          'created_by.job.name',
          'created_by.job.id',
          'approve_order.id',
          'approve_order.order',
          'approve_order.assign_to.name',
          'approve_order.assign_to.id',
        ],
      }
      const submissionsLogs = await item.getItem({
        req,
        ItemsService,
        name: 'form_logs',
        params: params,
      })

      const data = submissions
        .map((element: any) => {
          /**
           * add is publised
           */
          const { file_publisher_id, submission, current_form_log } =
            element || {}
          if (file_publisher_id) {
            element.is_published = true
          } else {
            element.is_published = false
          }

          /**
           * add logs
           */
          const current_form_log_data = submissionsLogs.find(
            (submissionsLog: any) => {
              return (
                submissionsLog.submission === submission &&
                submissionsLog.id === current_form_log
              )
            }
          )

          const { data } = current_form_log_data || {}
          const { detail } = data || {}
          if (detail) {
            current_form_log_data.data = Object.keys(detail).reduce(
              (acc: any, ctx: string) => {
                acc[ctx] = detail[ctx].value
                return acc
              },
              {}
            )

            const { department, directorate, division } =
              current_form_log_data?.data?.penomoran_dokumen || {}
            current_form_log_data.department = department?.id || null
            current_form_log_data.directorate = directorate?.id || null
            current_form_log_data.division = division?.id || null
          }

          return {
            ...element,
            current_form_log_data,
            // ...dockumentData,
          }
        })
        .filter((submission: any) => {
          if (!query && !departmentId) return true

          const { department, directorate, division } =
            submission?.current_form_log_data || {}
          const { judul } = submission?.current_form_log_data?.data || {}

          if (departmentId && query) {
            return (
              (department == departmentId ||
                directorate == departmentId ||
                division == departmentId) &&
              judul.toLowerCase().includes(query.toLowerCase())
            )
          }

          if (departmentId) {
            return (
              department == departmentId ||
              directorate == departmentId ||
              division == departmentId
            )
          }

          if (judul && query) {
            return judul.toLowerCase().includes(query.toLowerCase())
          }

          return false
        })

      return {
        success: true,
        message: 'Successfully Get Form to Fill',
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
    {
      path: '/file-publisers/:id/related/users',
      tag: 'IMS/file-publisers',
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
  async filePubliserRelatedUser(
    @Param('id') filePubId: string,
    @Context() ctx: any,
    @Req() req: any
  ) {
    try {
      const {
        services: { ItemsService },
        database,
      } = ctx

      /**
       * find file_publishers data
       */
      const { id, data } =
        (await database('file_publishers')
          .select('file_publishers.id', 'submissions.data')
          .join('submissions', 'submissions.id', 'file_publishers.submission')
          .whereNull('file_publishers.deleted_at')
          .where('file_publishers.id', filePubId)
          .first()) || {}

      if (!id) throw new Error('not found')
      if (!data) throw new Error('related data not found')

      const { detail } = data || {}

      if (!detail) throw new Error('related data not found')

      const dataSet = Object.keys(detail).reduce((acc: any, ctx: string) => {
        acc[ctx] = detail[ctx].value
        return acc
      }, {})

      const {
        formulir_terkait = [],
        prosedur_terkait = [],
        referensi_kebijakan = [],
        instruksi_kerja_terkait = [],
      } = dataSet || {}

      const dataSetDocuments = [
        ...formulir_terkait,
        ...prosedur_terkait,
        ...referensi_kebijakan,
        ...instruksi_kerja_terkait,
      ]
        .map((dataSetDocument) => {
          const { directorate_code, division_code, departement_code } =
            dataSetDocument

          return [directorate_code, division_code, departement_code]
        })
        .flat()
        .filter((value) => value)

      const userData = await database('directus_users')
        .select(
          'directus_users.id',
          'directus_users.email',
          'directus_users.full_name',
          'mt_departments.name as department'
        )
        .distinctOn('directus_users.id')
        .join(
          'mt_departments',
          'mt_departments.id',
          'directus_users.department'
        )
        .whereIn('mt_departments.code', dataSetDocuments)

      return {
        success: true,
        message: 'Successfully Get file publish related user',
        // dataSet,
        // dataSetDocuments,
        data: userData,
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
    {
      path: '/file-publisers/:id/related/departments',
      tag: 'IMS/file-publisers',
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
  async filePubliserRelatedDepartments(
    @Param('id') filePubId: string,
    @Context() ctx: any,
    @Req() req: any
  ) {
    try {
      const {
        services: { ItemsService },
        database,
      } = ctx

      /**
       * find file_publishers data
       */
      const { id, data } =
        (await database('file_publishers')
          .select('file_publishers.id', 'submissions.data')
          .join('submissions', 'submissions.id', 'file_publishers.submission')
          .whereNull('file_publishers.deleted_at')
          .where('file_publishers.id', filePubId)
          .first()) || {}

      if (!id) throw new Error('not found')
      if (!data) throw new Error('related data not found')

      const { detail } = data || {}

      if (!detail) throw new Error('related data not found')

      const dataSet = Object.keys(detail).reduce((acc: any, ctx: string) => {
        acc[ctx] = detail[ctx].value
        return acc
      }, {})

      const {
        formulir_terkait = [],
        prosedur_terkait = [],
        referensi_kebijakan = [],
        instruksi_kerja_terkait = [],
      } = dataSet || {}

      const dataSetDocuments = [
        ...formulir_terkait,
        ...prosedur_terkait,
        ...referensi_kebijakan,
        ...instruksi_kerja_terkait,
      ]
        .map((dataSetDocument) => {
          const { directorate_code, division_code, departement_code } =
            dataSetDocument

          return [directorate_code, division_code, departement_code]
        })
        .flat()
        .filter((value) => value)

      const departmentData = await database('mt_departments')
        .select('mt_departments.*')
        .whereIn('mt_departments.code', dataSetDocuments)

      return {
        success: true,
        message: 'Successfully Get File publish related department',
        // dataSet,
        // dataSetDocuments,
        data: departmentData,
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
    {
      path: '/file-publisers/document-count',
      tag: 'IMS/file-publisers',
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
      parameters: [
        {
          in: 'query',
          name: 'submission_id',
          schema: { type: 'number' },
          required: true,
        },
        {
          in: 'query',
          name: 'business_id',
          schema: { type: 'number' },
          required: true,
        },
        {
          in: 'query',
          name: 'used_to',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'is_repo',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'is_revice',
          schema: { type: 'number' },
          required: false,
        },
      ],
    }
  )
  async fileFubliserCount(
    @Query('submission_id') submissionId: number,
    @Query('business_id') business_id: number,
    @Query('used_to') usedTo: number,
    @Query('is_repo') isRepo: number,
    @Query('is_revice') isRevice: number,
    @Context() ctx: any
  ) {
    /**
     * change document number from repo revice into new version
     */
    function parseDocumentNumber(docNumber: any) {
      try {
        // Split by '/' to separate sections
        const sections = docNumber.split('/')
        const [dir, div, area] = docNumber.split('/')

        // Split the third section by '.' to extract DD, XX, ZZ, and CC
        const [procedure_code, procedure_number, ik_number, formulir_number] =
          sections[2].split('.')

        // Get revision number from the last section and increment it
        let revision_number = parseInt(sections[3].split('-')[0], 10) + 1

        // Extract the year from the original document number
        // const year = sections[3].split('-')[1]
        const year = new Date().getFullYear()

        // Update the document number with the incremented revision number and dynamic year
        const updatedDocumentNumber = `${sections[0]}/${sections[1]}/${sections[2]
          }/${revision_number.toString().padStart(2, '0')}-${year}`

        return {
          document_number: updatedDocumentNumber, // Updated document number
          formulir_number: parseInt(formulir_number, 10), // CC (converted to number)
          procedure_number: parseInt(procedure_number, 10), // XX (converted to number)
          ik_number: parseInt(ik_number, 10), // ZZ (converted to number)
          revision_number: revision_number, // Incremented VV
          directorate_code: dir, // Directorate code
          division_code: div, // Division code
          area_code: area, // Department code
        }
      } catch (error) {
        throw new Error('Invalid document number format')
      }
    }

    if (!submissionId) {
      throw new Error('Submission is required')
    }

    const { database } = ctx

    const enum countType {
      PROCEDUR = 3,
      IK = 4,
      FORMULIR = 5,
      FORMULIR_NO_IK = 55,
    }
    try {
      const { data: submissionData, id } = (await database('submissions')
        .select('data', 'id')
        .where('submissions.id', submissionId)
        .first()) || { data: {} }

      if (!id) throw new Error('invalid submission id')

      // return submissionData

      const {
        division: divisionSub,
        applicableFor: applicableForSub,
        procedure_number,
        ik_number,
        formulir_number,
      } = submissionData?.detail?.penomoran_dokumen?.value || {}

      const div = divisionSub.code ?? 'PI0'
      const dirDiv = `${divisionSub.code}/${applicableForSub?.code || 'PI0'}`
      // return dirDiv
      let repoCountQuery
      let countQuery
      if (countType.PROCEDUR === usedTo) {
        countQuery = database('file_publishers')
          .max('file_publishers.procedure_number', {
            as: 'max_count',
          })
          .join('submissions', 'submissions.id', 'file_publishers.submission')
          .whereNull('file_publishers.deleted_at')
          .where('submissions.business', business_id)
          .where('file_publishers.document_number', 'like', '%PD%')
          .where('file_publishers.document_number', 'like', div + '%')

        repoCountQuery = database('repo_document_submissions')
          .max('repo_document_submissions.number_in_pd', {
            as: 'max_count_repo',
          })
          .where('repo_document_submissions.number', 'like', '%PD%')
          .where('repo_document_submissions.number', 'like', div + '%')

        const { max_count } = (await countQuery.first()) || { max_count: 0 }

        /**
         * get from repo
         */
        const { max_count_repo } = (await repoCountQuery.first()) || {
          max_count_repo: 0,
        }
        const highestNumber = Math.max(...[max_count, max_count_repo])
        let revisionNumber = 0
        let documentnumberOld = ''

        /**
         * tidak revisi
         *
         * @before
         * SPGI/PI0/PD.09.00.00/2
         * @after
         * SPGI/PI0/PD.10.00.00/00
         */
        if (!isRevice) {
          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/PD.${format2dgt(
                highestNumber + 1
              )}.00.00/${format2dgt(null)}`,
              pd: format2dgt(highestNumber + 1),
              ik: format2dgt(null),
              fm: format2dgt(null),
              revision: format2dgt(null),
            },
          }
        }

        const {
          division,
          numberProbis,
          year,
          numberIk,
          numberForm,
          revision,
          applicableFor,
        } = submissionData?.detail?.penomoran_dokumen?.value?.old || {}

        documentnumberOld = `${division.code}/${applicableFor?.code || 'PI0'
          }/PD.${format2dgt(numberProbis)}.${format2dgt(numberIk)}.${format2dgt(
            numberForm
          )}/${format2dgt(revision)}-${year}`

        if (isRevice && division?.code !== divisionSub?.code) {
          /**
           * revisi pindah dir
           *
           * DIVISIBARU/PI0/PD.COUNT_TERTINGGI_DIDIVISI_BARU.00.00/00
           *
           * @old
           * SHSE/PI0/PD.09.00.00/04
           * @new
           * SPGI/PI0/PD.01.00.00/00
           *
           */
          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/PD.${format2dgt(
                highestNumber + 1
              )}.00.00/${format2dgt(null)}`,
              pd: format2dgt(highestNumber + 1),
              ik: format2dgt(null),
              fm: format2dgt(null),
              revision: format2dgt(null),
            },
          }
        } else if (isRevice && !isRepo) {
          /**
           * revisi no repo
           *
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.00.00/01
           * @new
           * SPGI/PI0/PD.09.00.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.revision_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', numberProbis)
            .where('file_publishers.document_number', 'like', '%PD%')
            .where('file_publishers.document_number', 'like', div + '%')
            .groupBy('file_publishers.procedure_number')
            .first()) || { maxRevision: 0 }
          revisionNumber = maxRevision + 1
          console.log('MX', maxRevision)

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/PD.${format2dgt(
                numberProbis
              )}.00.00/${format2dgt(revisionNumber)}`,
              pd: format2dgt(numberProbis),
              ik: format2dgt(null),
              fm: format2dgt(null),
              revision: format2dgt(revisionNumber),
            },
          }
        } else if (isRevice && isRepo) {
          /**
           * revisi repo
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.00.00/01
           * @new
           * SPGI/PI0/PD.09.00.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.revision_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', numberProbis)
            .where('file_publishers.document_number', 'like', '%PD%')
            .where('file_publishers.document_number', 'like', div + '%')
            .groupBy('file_publishers.procedure_number')
            .first()) || { maxRevision: 0 }
          console.log('MX revisi repo', maxRevision)

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/PD.${format2dgt(
                numberProbis
              )}.00.00/${format2dgt(maxRevision + 1)}`,
              pd: format2dgt(numberProbis),
              ik: format2dgt(null),
              fm: format2dgt(null),
              revision: format2dgt(maxRevision + 1),
            },
          }
        }
      }

      if (countType.IK === usedTo) {
        console.log('DISINI', procedure_number, dirDiv)
        if (procedure_number === undefined) {
          return {
            success: false,
            message: 'procedure_number is required when IK',
            data: {
              document_number_old: '00',
              document_number: `${dirDiv}/PD.${format2dgt(
                0
              )}.00.00/${format2dgt(null)}`,
              pd: format2dgt(0),
              ik: format2dgt(0),
              fm: format2dgt(0),
              revision: format2dgt(0),
            },
          }
        }

        countQuery = database('file_publishers')
          .max('file_publishers.ik_number', {
            as: 'max_count',
          })
          .join('submissions', 'submissions.id', 'file_publishers.submission')
          .whereNull('file_publishers.deleted_at')
          .where('submissions.business', business_id)
          .where('file_publishers.document_number', 'like', '%IK%')
          .where('file_publishers.document_number', 'like', div + '%')
          .where('file_publishers.procedure_number', procedure_number)

        // console.log('DISINI', procedure_number, dirDiv, countQuery.toString())

        repoCountQuery = database('repo_document_submissions')
          .max('repo_document_submissions.number_in_ik', {
            as: 'max_count_repo',
          })
          .where('repo_document_submissions.number', 'like', '%IK%')
          .where('repo_document_submissions.number', 'like', div + '%')
          .where('repo_document_submissions.number_in_pd', procedure_number)

        const { max_count } = (await countQuery.first()) || {
          max_count: 0,
        }
        /**
         * get from repo
         */
        const { max_count_repo } = (await repoCountQuery.first()) || {
          max_count_repo: 0,
        }
        const highestNumber = Math.max(...[max_count, max_count_repo])
        let revisionNumber = 0
        let documentnumberOld = ''

        /**
         * tidak revisi
         *
         * @before
         * SPGI/PI0/PD.09.01.00/2
         * @after
         * SPGI/PI0/PD.09.02.00/00
         */
        if (!isRevice) {
          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/IK.${format2dgt(procedure_number)}.${highestNumber + 1
                }.00/${format2dgt(null)}`,
              pd: format2dgt(procedure_number),
              ik: format2dgt(highestNumber + 1),
              fm: format2dgt(null),
              revision: format2dgt(null),
            },
          }
        }

        const isHaveOld = submissionData?.detail?.penomoran_dokumen?.value?.old

        /**
         * Fix case document number tidak standard
         */
        if (!isHaveOld) {
          const riwayats =
            submissionData?.detail?.evaluasi_dan_riwayat_perubahan?.value || []
          const docNum = riwayats
            .sort((a: any, b: any) => a.revisiKe - b.revisiKe)
            .map((revice: any) => {
              const getDocNum =
                revice.hasilEvaluasiDanRiwayatPerubahan.split('dengan nomor')
              const [text, docNum] = getDocNum
              return docNum?.trim()
            })
            .filter(Boolean) // Filter out undefined or null values
            .pop() // Get the last document number

          const dataDoc = parseDocumentNumber(docNum)

          /**
           * revisi repo
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.01.00/01
           * @new
           * SPGI/PI0/PD.09.01.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.ik_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', dataDoc.procedure_number)
            .where('file_publishers.ik_number', dataDoc.ik_number)
            .where('file_publishers.document_number', 'like', '%IK%')
            .where('file_publishers.document_number', 'like', div + '%')
            .first()) || { maxRevision: 0 }

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: docNum,
              document_number: `${dirDiv}/IK.${format2dgt(
                dataDoc.procedure_number
              )}.${format2dgt(dataDoc.ik_number)}.00/${format2dgt(
                maxRevision + 1
              )}`,
              pd: format2dgt(dataDoc.procedure_number),
              ik: format2dgt(dataDoc.ik_number),
              fm: format2dgt(null),
              revision: format2dgt(maxRevision + 1),
            },
          }
        }

        const {
          division,
          numberProbis,
          year,
          numberIk,
          numberForm,
          revision,
          applicableFor,
        } = submissionData?.detail?.penomoran_dokumen?.value?.old || {}

        documentnumberOld = `${division.code}/${applicableFor?.code || 'PI0'
          }/PD.${format2dgt(numberProbis)}.${format2dgt(numberIk)}.${format2dgt(
            numberForm
          )}/${format2dgt(revision)}-${year}`

        if (isRevice && !isRepo) {
          /**
           * revisi no repo
           *
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.01.00/01
           * @new
           * SPGI/PI0/PD.09.01.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.ik_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', numberProbis)
            .where('file_publishers.ik_number', ik_number)
            .where('file_publishers.document_number', 'like', '%IK%')
            .where('file_publishers.document_number', 'like', div + '%')
            .first()) || { maxRevision: 0 }
          revisionNumber = maxRevision + 1
          console.log('MX', maxRevision)

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/IK.${format2dgt(
                numberProbis
              )}.${format2dgt(ik_number)}.00/${format2dgt(revisionNumber)}`,
              pd: format2dgt(numberProbis),
              ik: format2dgt(ik_number),
              fm: format2dgt(null),
              revision: format2dgt(revisionNumber),
            },
          }
        } else if (isRevice && isRepo) {
          /**
           * revisi repo
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.01.00/01
           * @new
           * SPGI/PI0/PD.09.01.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.ik_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', numberProbis)
            .where('file_publishers.ik_number', ik_number)
            .where('file_publishers.document_number', 'like', '%IK%')
            .where('file_publishers.document_number', 'like', div + '%')
            .first()) || { maxRevision: 0 }
          console.log('MX revisi repo', maxRevision)

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/IK.${format2dgt(
                numberProbis
              )}.${format2dgt(ik_number)}.00/${format2dgt(revisionNumber)}`,
              pd: format2dgt(numberProbis),
              ik: format2dgt(ik_number),
              fm: format2dgt(null),
              revision: format2dgt(revisionNumber),
            },
          }
        }
      }

      if (countType.FORMULIR === usedTo) {
        if (procedure_number === undefined || ik_number === undefined) {
          return {
            success: false,
            message: 'procedure_number and ik_number is required when FORMULIR',
            data: {
              document_number_old: '00',
              document_number: `${dirDiv}/PD.${format2dgt(
                0
              )}.00.00/${format2dgt(null)}`,
              pd: format2dgt(0),
              ik: format2dgt(0),
              fm: format2dgt(0),
              revision: format2dgt(0),
            },
          }
        }
        countQuery = database('file_publishers')
          .max('file_publishers.ik_number', {
            as: 'max_count',
          })
          .join('submissions', 'submissions.id', 'file_publishers.submission')
          .whereNull('file_publishers.deleted_at')
          .where('submissions.business', business_id)
          .where('file_publishers.document_number', 'like', '%FM%')
          .where('file_publishers.document_number', 'like', div + '%')
          .where('file_publishers.procedure_number', procedure_number)
          .where('file_publishers.ik_number', ik_number)

        repoCountQuery = database('repo_document_submissions')
          .max('repo_document_submissions.number_in_ik', {
            as: 'max_count_repo',
          })
          .where('repo_document_submissions.number', 'like', '%FM%')
          .where('repo_document_submissions.number', 'like', div + '%')
          .where('repo_document_submissions.number_in_pd', procedure_number)
          .where('repo_document_submissions.number_in_ik', ik_number)

        const { max_count } = (await countQuery.first()) || {
          max_count: 0,
        }

        /**
         * get from repo
         */
        const { max_count_repo } = (await repoCountQuery.first()) || {
          max_count_repo: 0,
        }
        const highestNumber = Math.max(...[max_count, max_count_repo])
        let revisionNumber = 0
        let documentnumberOld = ''

        /**
         * tidak revisi
         *
         * @before
         * SPGI/PI0/PD.09.01.01/02
         * @after
         * SPGI/PI0/PD.09.01.02/00
         */
        if (!isRevice) {
          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/FM.${format2dgt(
                procedure_number
              )}.${ik_number}.${highestNumber + 1}/${format2dgt(null)}`,
              pd: format2dgt(procedure_number),
              ik: format2dgt(ik_number),
              fm: format2dgt(highestNumber + 1),
              revision: format2dgt(null),
            },
          }
        }

        const {
          division,
          numberProbis,
          year,
          numberIk,
          numberForm,
          revision,
          applicableFor,
        } = submissionData?.detail?.penomoran_dokumen?.value?.old || {}
        console.log(divisionSub, division)

        documentnumberOld = `${division.code}/${applicableFor?.code || 'PI0'
          }/FM.${format2dgt(numberProbis)}.${format2dgt(numberIk)}.${format2dgt(
            numberForm
          )}/${format2dgt(revision)}-${year}`

        if (isRevice && !isRepo) {
          /**
           * revisi no repo
           *
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.01.00/01
           * @new
           * SPGI/PI0/PD.09.01.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.formulir_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', numberProbis)
            .where('file_publishers.ik_number', ik_number)
            .where('file_publishers.formulir_number', formulir_number)
            .where('file_publishers.document_number', 'like', '%FM%')
            .where('file_publishers.document_number', 'like', div + '%')
            .first()) || { maxRevision: 0 }
          revisionNumber = maxRevision + 1
          console.log('MX', maxRevision)

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/IK.${format2dgt(
                numberProbis
              )}.${format2dgt(ik_number)}.${formulir_number}/${format2dgt(
                revisionNumber
              )}`,
              pd: format2dgt(numberProbis),
              ik: format2dgt(ik_number),
              fm: format2dgt(formulir_number),
              revision: format2dgt(revisionNumber),
            },
          }
        } else if (isRevice && isRepo) {
          /**
           * revisi repo
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.01.00/01
           * @new
           * SPGI/PI0/PD.09.01.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.formulir_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', numberProbis)
            .where('file_publishers.ik_number', ik_number)
            .where('file_publishers.formulir_number', formulir_number)
            .where('file_publishers.document_number', 'like', '%FM%')
            .where('file_publishers.document_number', 'like', div + '%')
            .first()) || { maxRevision: 0 }
          revisionNumber = maxRevision + 1
          console.log('MX revisi repo', maxRevision)

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/IK.${format2dgt(
                numberProbis
              )}.${format2dgt(ik_number)}.${formulir_number}/${format2dgt(
                revisionNumber
              )}`,
              pd: format2dgt(numberProbis),
              ik: format2dgt(ik_number),
              fm: format2dgt(formulir_number),
              revision: format2dgt(revisionNumber),
            },
          }
        }
      }

      if (countType.FORMULIR === usedTo && !ik_number) {
        if (procedure_number === undefined) {
          return {
            success: false,
            message: 'procedure_number and ik_number is required when FORMULIR',
            data: {
              document_number_old: '00',
              document_number: `${dirDiv}/PD.${format2dgt(
                0
              )}.00.00/${format2dgt(null)}`,
              pd: format2dgt(0),
              ik: format2dgt(0),
              fm: format2dgt(0),
              revision: format2dgt(0),
            },
          }
        }
        countQuery = database('file_publishers')
          .max('file_publishers.ik_number', {
            as: 'max_count',
          })
          .join('submissions', 'submissions.id', 'file_publishers.submission')
          .whereNull('file_publishers.deleted_at')
          .where('submissions.business', business_id)
          .where('file_publishers.document_number', 'like', '%FM%')
          .where('file_publishers.document_number', 'like', div + '%')
          .where('file_publishers.procedure_number', procedure_number)
          .where('file_publishers.ik_number', 0)

        repoCountQuery = database('repo_document_submissions')
          .max('repo_document_submissions.number_in_ik', {
            as: 'max_count_repo',
          })
          .where('repo_document_submissions.number', 'like', '%FM%')
          .where('repo_document_submissions.number', 'like', div + '%')
          .where('repo_document_submissions.number_in_pd', procedure_number)
          .where('repo_document_submissions.number_in_ik', 0)

        const { max_count } = (await countQuery.first()) || {
          max_count: 0,
        }

        /**
         * get from repo
         */
        const { max_count_repo } = (await repoCountQuery.first()) || {
          max_count_repo: 0,
        }
        const highestNumber = Math.max(...[max_count, max_count_repo])
        let revisionNumber = 0
        let documentnumberOld = ''

        /**
         * tidak revisi
         *
         * @before
         * SPGI/PI0/PD.09.01.01/02
         * @after
         * SPGI/PI0/PD.09.01.02/00
         */
        if (!isRevice) {
          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/FM.${format2dgt(
                procedure_number
              )}.${ik_number}.${highestNumber + 1}/${format2dgt(null)}`,
              pd: format2dgt(procedure_number),
              ik: format2dgt(ik_number),
              fm: format2dgt(highestNumber + 1),
              revision: format2dgt(null),
            },
          }
        }

        const {
          division,
          numberProbis,
          year,
          numberIk,
          numberForm,
          revision,
          applicableFor,
        } = submissionData?.detail?.penomoran_dokumen?.value?.old || {}
        console.log(divisionSub, division)

        documentnumberOld = `${division.code}/${applicableFor?.code || 'PI0'
          }/FM.${format2dgt(numberProbis)}.${format2dgt(numberIk)}.${format2dgt(
            numberForm
          )}/${format2dgt(revision)}-${year}`

        if (isRevice && !isRepo) {
          /**
           * revisi no repo
           *
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.01.00/01
           * @new
           * SPGI/PI0/PD.09.01.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.formulir_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', numberProbis)
            .where('file_publishers.ik_number', 0)
            .where('file_publishers.formulir_number', formulir_number)
            .where('file_publishers.document_number', 'like', '%FM%')
            .where('file_publishers.document_number', 'like', div + '%')
            .first()) || { maxRevision: 0 }
          revisionNumber = maxRevision + 1
          console.log('MX', maxRevision)

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/IK.${format2dgt(
                numberProbis
              )}.${format2dgt(ik_number)}.${formulir_number}/${format2dgt(
                revisionNumber
              )}`,
              pd: format2dgt(numberProbis),
              ik: format2dgt(ik_number),
              fm: format2dgt(formulir_number),
              revision: format2dgt(revisionNumber),
            },
          }
        } else if (isRevice && isRepo) {
          /**
           * revisi repo
           * DIVISI_LAMA/PI0/PD.COUNT_LAMA.00.00/REVISI_BARU
           *
           * @old
           * SPGI/PI0/PD.09.01.00/01
           * @new
           * SPGI/PI0/PD.09.01.00/02
           */
          const { maxRevision } = (await database('file_publishers')
            .max('file_publishers.formulir_number', {
              as: 'maxRevision',
            })
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .whereNull('file_publishers.deleted_at')
            .where('submissions.business', business_id)
            .where('file_publishers.procedure_number', numberProbis)
            .where('file_publishers.ik_number', 0)
            .where('file_publishers.formulir_number', formulir_number)
            .where('file_publishers.document_number', 'like', '%FM%')
            .where('file_publishers.document_number', 'like', div + '%')
            .first()) || { maxRevision: 0 }
          revisionNumber = maxRevision + 1
          console.log('MX revisi repo', maxRevision)

          return {
            success: true,
            message: 'Successfully',
            data: {
              document_number_old: documentnumberOld,
              document_number: `${dirDiv}/IK.${format2dgt(
                numberProbis
              )}.${format2dgt(ik_number)}.${formulir_number}/${format2dgt(
                revisionNumber
              )}`,
              pd: format2dgt(numberProbis),
              ik: format2dgt(ik_number),
              fm: format2dgt(formulir_number),
              revision: format2dgt(revisionNumber),
            },
          }
        }
      }

      throw new Error('invalid parameters')
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message ?? error,
      }
    }
  }

  @Get(
    {
      path: '/file-publisers/:submission_id/histories',
      tag: 'IMS/file-publisers',
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
  async filePubliserHistories(
    @Param('submission_id') submissionId: number,
    @Context() ctx: any,
    @Req() req: any
  ) {
    try {
      const {
        services: { ItemsService },
        database,
      } = ctx

      const params = {
        filter: { _and: [{ submission: { _eq: submissionId } }] },
        sort: ['id'],
        fields: [
          'id',
          'submission',
          'submission_number',
          'status.code',
          'status.name',
          'status.id',
          'created_by.id',
          'created_by.avatar.filename_download',
          'created_by.email',
          'created_by.full_name',
          'created_by.job.name',
          'created_by.job.id',
          'approve_order.id',
          'approve_order.order',
          'created_at',
          'approve_order.assign_to.name',
          'approve_order.assign_to.id',
          'reject_number',
        ],
      }
      const formLogs = await item.getItem({
        req,
        ItemsService,
        name: 'form_logs',
        params: params,
      })

      const actorsIds = formLogs
        .map((formLog: any) => formLog.approve_order?.assign_to?.id)
        .filter((formLog: string) => formLog)

      /**
       * find origin
       */
      const assesors = await database(
        database('form_assesors')
          .select(
            'form_assesors.officer',
            database.raw(
              'CASE WHEN form_assesors.replaced IS NOT NULL THEN form_assesors.replaced ELSE form_assesors.officer END AS origin'
            ),
            'form_assesors.form_actor'
          )
          .whereNull('form_assesors.deleted_at')
          .where('form_assesors.submission', submissionId)
          .whereIn('form_assesors.form_actor', actorsIds)
          .as('assesors')
      )
        .select(
          'assesors.origin',
          'assesors.form_actor',
          'directus_users.email',
          'directus_users.full_name',
          'mt_jobs.id as job_id',
          'mt_jobs.name as job_name'
        )
        .join('directus_users', 'assesors.origin', 'directus_users.id')
        .join('mt_jobs', 'mt_jobs.id', 'directus_users.job')

      const data = formLogs.map((formLog: any) => {
        const { created_by } = formLog
        const assesor = assesors.find(
          (assesor: any) =>
            assesor.form_actor === formLog.approve_order?.assign_to?.id
        )

        if (!assesor) {
          formLog.origin = {
            avatar: null,
            id: created_by?.id,
            job: {
              name: created_by?.job?.name,
              id: created_by?.job?.id,
            },
            profile: {
              email: created_by?.email,
              full_name: created_by?.full_name,
            },
          }
          return formLog
        }

        if (assesor) {
          const origin = {
            avatar: null,
            id: assesor.origin,
            job: {
              name: assesor.job_name,
              id: assesor.job_id,
            },
            profile: {
              email: assesor.email,
              full_name: assesor.full_name,
            },
          }

          return { ...formLog, origin }
        }
      })

      return {
        success: true,
        message: 'Successfully Get Form to Fill',
        // assesors,
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

  @Post(
    {
      path: '/submissions/:submission_id/file-publisers',
      tag: 'IMS/file-publisers',
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
          send_email: {
            type: 'number',
          },
          level: {
            type: 'number',
          },
          file_publisher: {
            type: 'object',
            properties: {
              folder: {
                type: 'string',
              },
              department_division: {
                type: 'number',
              },
              document_number: {
                type: 'string',
              },
              revision_number: {
                type: 'number',
              },
              division_number: {
                type: 'number',
              },
              procedure_number: {
                type: 'number',
              },
              ik_number: {
                type: 'number',
              },
              formulir_number: {
                type: 'number',
              },
            },
          },
        },
      },
    }
  )
  async postPubliser(
    @Req() req: any,
    @Body() body: SubmissionDTO,
    @Param('submission_id') submissionId: number,
    @Context() ctx: any
  ) {
    /**
     * change document number from repo revice into new version
     */
    function parseDocumentNumber(docNumber: any) {
      try {
        // Split by '/' to separate sections
        const sections = docNumber.split('/')

        // Split the third section by '.' to extract DD, XX, ZZ, and CC
        const [procedure_code, procedure_number, ik_number, formulir_number] =
          sections[2].split('.')

        // Get revision number from the last section and increment it
        let revision_number = parseInt(sections[3].split('-')[0], 10) + 1

        // Extract the year from the original document number
        // const year = sections[3].split('-')[1]
        const year = new Date().getFullYear()

        // Update the document number with the incremented revision number and dynamic year
        const updatedDocumentNumber = `${sections[0]}/${sections[1]}/${sections[2]
          }/${revision_number.toString().padStart(2, '0')}-${year}`

        return {
          document_number: updatedDocumentNumber, // Updated document number
          formulir_number: parseInt(formulir_number, 10), // CC (converted to number)
          procedure_number: parseInt(procedure_number, 10), // XX (converted to number)
          ik_number: parseInt(ik_number, 10), // ZZ (converted to number)
          revision_number: revision_number, // Incremented VV
        }
      } catch (error) {
        throw new Error('Invalid document number format')
      }
    }

    enum Advent_type {
      PROBIS = 'PROBIS',
      REPO = 'REPO',
      REQUEST = 'REQUEST',
    }
    const { data, send_email, file_publisher, level } = body || {}

    const {
      services: { UsersService },
      database,
    } = ctx
    const { id: userId } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()

    try {
      const { document_number: dtdn } = file_publisher || { document_number: null }
      const { detail: detailData } = data || { detail: null }

      const {
        applicableFor: dtApplicableFor,
        departments: dtDepartments,
        directorate: dtDirectorate,
        division: dtDivision,
      } = Object.keys(detailData).reduce((acc: any, ctx: string) => {
        if (ctx === 'penomoran_dokumen') {
          const {
            department = [],
            directorate,
            division,
            applicableFor,
          } = detailData[ctx].value || {}

          acc.departments = department.map((dep: any) => dep.id)
          acc.directorate = directorate?.id || null
          acc.division = division?.id || null
          acc.applicableFor = applicableFor?.code || null
        }
        return acc
      }, {})

      console.log({
        applicableFor: dtApplicableFor,
        departments: dtDepartments,
        directorate: dtDirectorate,
        division: dtDivision,
      })

      if (!dtdn) {
        throw new Error('Penomoran belum lengkap: nomor dokumen tidak ada');
      }

      if (!dtApplicableFor) {
        throw new Error('Penomoran belum lengkap: area tidak ada');
      }

      if (!dtDepartments.length) {
        throw new Error('Penomoran belum lengkap: departemen tidak ada');
      }

      if (!dtDirectorate) {
        throw new Error('Penomoran belum lengkap: direktorat tidak ada');
      }

      if (!dtDivision) {
        throw new Error('Penomoran belum lengkap: divisi tidak ada');
      }

      const { number } = await trx('submissions')
        .select(
          'repo_document_submissions.number'
          // trx.raw(`
          //   CASE
          //     WHEN r.number IS NOT NULL THEN r.number
          //     WHEN s.document_number IS NOT NULL THEN s.document_number
          //     ELSE NULL
          //   END AS number
          // `)
        )
        // .join('submissions as s', 'submissions.submission_revice', 's.id')
        .join(
          'repo_document_submissions',
          'submissions.repo_revice',
          'repo_document_submissions.id'
        )
        .where('submissions.id', submissionId)
        .first() || { number: null }

      let revicePubliser = {}
      if (number) {
        revicePubliser = parseDocumentNumber(number)
      }
      /**
       * get statuses id
       */
      const [{ id: statusId }] = await trx('statuses')
        .select('statuses.id', 'statuses.code')
        .whereNull('statuses.deleted_at')
        .where('statuses.code', 'PUBLS')

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
          submission_number,
        },
      ] = await trx('submissions')
        .where({ id: submissionId })
        .update({ data, status: statusId })
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
          status: statusId,
          created_at: new Date(),
          submission: submissionId,
          data,
        })
        .returning('id')

      const [documentMeta] = await trx('document_metas')
        .returning('id')
        .select('document_metas.id')
        .where('document_metas.submission', submissionId)
        .update({ level: level ?? 0 })

      /**
       * add new file_publishers
       */
      const idFilePubliser = v4()
      await trx('file_publishers').insert({
        id: idFilePubliser,
        ...file_publisher,
        ...revicePubliser,
        submission: submissionId,
        created_at: new Date(),
        created_by: userId,
        status: statusId,
        document_meta: documentMeta?.id || null,
      })

      const [{ submission_revice, repo_revice }] = await trx('submissions')
        .where({ id: submissionId })
        .update({ current_form_log: idLog })
        .returning('*')

      if (submission_revice || repo_revice) {
        const [{ id: statusUnpub }] = await trx('statuses')
          .select('statuses.id', 'statuses.code')
          .whereNull('statuses.deleted_at')
          .where('statuses.code', 'UNPUB')
        const { id: filePubliserObsolete, business } =
          (await trx('file_publishers')
            .select('file_publishers.id', 'submissions.business')
            .join('submissions', 'submissions.id', 'file_publishers.submission')
            .where('file_publishers.submission', submission_revice)
            .first()) || {}
        const obsoleteId = v4()
        await trx('document_obsoletes').insert({
          business: business,
          id: obsoleteId,
          file_publisher: filePubliserObsolete,
          replacement_file_publisher: idFilePubliser,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: userId,
          status: statusUnpub,
          advent_type: submission_revice
            ? Advent_type.PROBIS
            : Advent_type.REPO,
        })

        await trx('document_obsolete_logs').insert({
          id: v4(),
          document_obsolete: obsoleteId,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: userId,
          status: statusUnpub,
          reason_reject:
            'Revisi ' +
            (submission_revice ? Advent_type.PROBIS : Advent_type.REPO) +
            'dari' +
            (submission_revice ? Advent_type.PROBIS : Advent_type.REPO),
        })

        await trx('file_publishers')
          .where({ submission: submission_revice })
          .update({ status: statusUnpub })

        if (repo_revice) {
          await trx('repo_document_submissions')
            .where({ id: repo_revice })
            .update({ status: statusUnpub })
        }
      }
      /**
       * get document detail
       */

      const dataSubmission =
        (await trx('submissions')
          .select('submissions.data')
          .where('submissions.id', submissionId)
          .first()) || {}

      const { detail } = dataSubmission.data || {}
      const {
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
        (await trx('form_logs')
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

      const documentLogs = officers.map((officer: any, i: number) => {
        const unitCount = units.length
        const depCount = departments.length

        let approver = ''
        if (officer.order === 2) {
          if (unitCount >= i) {
            approver = apprType.MANAGER
          } else if (depCount >= i) {
            approver = apprType.DH
          } else if (unitCount + depCount >= i) {
            approver = apprType.DH
          }
        }

        const isHolding =
          applicableFor === 'KP0' || applicableFor === 'PI0' ? 1 : 0
        let jobTitle = ''
        if (officer.order === 2) {
          jobTitle = `${approver} ${officer.department || ''}`
        } else if (isHolding && officer.order === 3) {
          jobTitle = `${apprType.GH} ${officer.department || ''}`
        } else if (!isHolding && officer.order === 3) {
          jobTitle = `${apprType.DVH} ${officer.department || ''}`
        } else if (isHolding && officer.order > 3) {
          jobTitle = `${apprType.GH} ${apprType.BP} ${officer.department || ''}`
        } else if (!isHolding && officer.order > 3) {
          jobTitle = `${apprType.DVH} ${officer.department || ''}`
        }

        return {
          id: v4(),
          officer: officer.officer,
          // reject_number,
          i_job_title: officer.i_job_title,
          department_name: officer.department,
          job_title: jobTitle,
          is_replacement: officer.is_replacement,
          department_count: depCount,
          unit_count: unitCount,
          order: officer.order,
          checked_by: approver || apprType.ORDER,
          is_holding: isHolding,
          form_log: officer.id,
        }
      })

      await trx('document_logs').insert(documentLogs)

      await trx.commit()

      return {
        data: {
          file_publisher_id: idFilePubliser,
        },
        success: true,
        message: 'Successfully Submit',
      }
    } catch (error: any) {
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Put(
    {
      path: '/submissions/:submission_id/file-publisers/:file_publiser_id',
      tag: 'IMS/file-publisers',
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
          status: {
            type: 'number',
          },
        },
      },
    }
  )
  async filePublishSwitch(
    @Req() req: any,
    @Body() body: SubmissionDTO,
    @Param('submission_id') submissionId: number,
    @Param('file_publiser_id') filePubId: string,
    @Context() ctx: any
  ) {
    const { data, status } = body || {}

    const {
      services: { UsersService },
      database,
    } = ctx

    const { id: userId } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()

    try {
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
          submission_number: submission_number,
        },
      ] = await trx('submissions')
        .where({ id: submissionId })
        .update({ status })
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
          data,
        })
        .returning('id')

      await trx('submissions')
        .where({ id: submissionId })
        .update({ current_form_log: idLog })

      await trx('file_publishers').where({ id: filePubId }).update({ status })

      // if (send_email == 1) {
      //   /**
      //    * send email
      //    */
      //   workflowHelper.sendEmail(
      //     { req, ItemsService, database },
      //     { uploader: userId, reviewer: dispose_to || assignToUserId }
      //   )
      // }

      await trx.commit()

      return {
        success: true,
        message: 'Successfully Submit',
      }
    } catch (error: any) {
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Get(
    {
      path: '/permits/file-publisers/:file_publisher_id',
      tag: 'IMS/file-publisers',
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
  async checkPermit(
    @Param('file_publisher_id') file_publisher_id: string,
    @Context() ctx: any,
    @Req() req: any
  ) {
    try {
      if (!file_publisher_id) {
        throw new Error('Business is required')
      }

      const {
        database,
        services: { UsersService },
      } = ctx

      const { id: userId, department } = await item.getUser({
        req,
        UsersService,
      })

      const permitRoles = await database('document_permit_roles').select('role')
      const roleIds = permitRoles.map((role: any) => role.role)

      console.log(roleIds)

      const { code } =
        (await database('Privileges')
          .select('roles.code')
          .join('roles', 'roles.id', 'Privileges.role')
          .whereNull('roles.deleted_at')
          .where('Privileges.user', userId)
          .whereIn('Privileges.role', [...roleIds])
          .first()) || {}

      if (code) {
        return {
          success: true,
          message: 'Successfully check',
          data: {
            permit: true,
          },
          meta: {
            description: 'permit by roles',
          },
        }
      }

      const filePubId = await database('file_publishers')
        .select('file_publishers.id')
        .whereNull('file_publishers.deleted_at')
        .where('file_publishers.department_division', department)
        .first()

      if (filePubId) {
        return {
          success: true,
          message: 'Successfully check',
          data: {
            permit: true,
          },
          meta: {
            description: 'permit by department',
          },
        }
      }

      const idPermit = await database('document_permits')
        .select('document_permits.id', 'statuses.code')
        .join('statuses', 'statuses.id', 'document_permits.status')
        .whereNull('statuses.deleted_at')
        .where('document_permits.file_publish', file_publisher_id)
        .where('document_permits.created_by', userId)
        .where('statuses.code', 'APPRD')
        .where('statuses.category', 'FORM')
        .first()

      if (idPermit) {
        return {
          success: true,
          message: 'Successfully check',
          data: {
            permit: true,
          },
          meta: {
            description: 'permit by ask',
          },
        }
      }

      const { department_division: filePubDep } =
        (await database('file_publishers')
          .select('file_publishers.department_division')
          .where('file_publishers.id', file_publisher_id)
          .first()) || {}

      /**
       * find complated submission
       */
      const query = `
         WITH
           RECURSIVE mt_departments_cte(id, name, parent, depth, path, name_path) AS (
             SELECT
               tn.id,
               tn.name,
               tn.parent,
               1 ::INT AS depth,
               tn.id ::TEXT AS path,
               tn.name ::TEXT AS name_path
             FROM
               mt_departments AS tn
             WHERE
               tn.parent IS NULL
             UNION ALL
             SELECT
               c.id,
               c.name,
               c.parent,
               p.depth + 1 AS depth,
               (p.path || '->' || c.id ::TEXT),
               (p.name_path || '->' || c.name ::TEXT)
             FROM
               mt_departments_cte AS p,
               mt_departments AS c
             WHERE
               c.parent = p.id
           )
         SELECT
           pt.id,
           pt.name,
           pt.parent,
           pt.depth,
           pt.path
         FROM
           (
             SELECT
               *
             FROM
               mt_departments_cte AS n
             WHERE n.id = ${filePubDep}
             ORDER BY
               n.id ASC
           ) as pt
       `
      const {
        rows: [departmentParent],
      } = await database.raw(query)
      const { path = '' } = departmentParent

      const departmentParents = path.split('->')

      const upperMatch = departmentParents.some(
        (dp: string) => dp === String(department)
      )

      if (upperMatch) {
        return {
          success: true,
          message: 'Successfully check',
          data: {
            permit: true,
          },
          meta: {
            description: 'permit by high department',
          },
        }
      }

      return {
        success: true,
        message: 'Successfully check',
        data: {
          permit: false,
        },
        meta: {
          description: 'denied',
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
      path: '/submissions/search',
      tag: 'IMS/submissions',
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
          query: {
            type: 'string',
          },
          departments_related: {
            type: 'array',
            items: {
              type: 'number',
            },
          },
          business: {
            type: 'number',
          },
        },
      },
    }
  )
  async submissionsSearch(
    @Req() req: any,
    @Body() body: SearchDTO,
    @Context() ctx: any
  ) {
    try {
      const { query, departments_related = [], business } = body || {}

      const { database } = ctx

      /**
       * get statuses id
       */
      const submissionsQuery = database('submissions').select(
        'submissions.id',
        'submissions.data'
      )

      if (business) {
        submissionsQuery.where('submissions.business', business)
      }

      const submissions = await submissionsQuery

      const datas = submissions
        .map((submission: any) => {
          const { detail } = submission?.data || {}
          const { id } = submission
          let dataSet
          if (detail) {
            dataSet = Object.keys(detail).reduce((acc: any, ctx: string) => {
              acc[ctx] = detail[ctx].value
              return acc
            }, {})
          }
          return { id, dataSet }
        })
        .filter((submission: any) => {
          const { judul } = submission?.dataSet || {}
          if (!query) return true

          if (judul) {
            return judul.toLowerCase().includes(query.toLowerCase())
          }

          return false
        })
        .map((submission: any) => submission.id)

      return {
        data: datas,
        success: true,
        message: 'Successfully Submit',
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
    {
      path: '/document-obsolete/request',
      tag: 'IMS/document',
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
      parameters: [
        {
          in: 'query',
          name: 'query',
          schema: { type: 'string' },
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
          name: 'page',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'advent_type',
          schema: { type: 'string' },
          required: false,
        },
        {
          in: 'query',
          name: 'created_by',
          schema: { type: 'string' },
          required: false,
        },
        {
          in: 'query',
          name: 'status',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'directorate',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'werk_directorate',
          schema: { type: 'number' },
          required: false,
        },

        {
          in: 'query',
          name: 'level',
          schema: { type: 'string' },
          required: false,
        },
        {
          in: 'query',
          name: 'instansi',
          schema: { type: 'string' },
          required: false,
        },
      ],
    }
  )
  async documentObsoleteRequest(
    @Context() ctx: any,
    @Req() req: any,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('query') query: string,
    @Query('created_by') createdBy: string,
    @Query('advent_type') adventType: string,
    @Query('status') status: number,
    @Query('directorate') dir: number,
    @Query('werk_directorate') werkDir: number,
    @Query('level') level: string,
    @Query('instansi') instansi: string
  ) {
    const {
      database,
      // services: { UsersService },
    } = ctx

    try {
      // const { id: userId } = await item.getUser({ req, UsersService })

      const ObsoleteRequest = database('document_obsoletes')
        .select(
          'statuses.name as status_name',
          'user_pubs.full_name as approved_by',
          'directus_users.full_name',
          'document_obsoletes.reason_obsolete as reason',
          'document_obsoletes.created_at',
          'document_obsoletes.advent_type',
          'file_publishers.document_number',
          'document_metas.judul as title',
          'document_metas.department_directorat as directorate',
          'mt_departments.i_com_code as werk_directorate',
          database.raw('CAST(document_metas.level AS varchar) as level'),
          'rep_document_metas.judul as replacement_title',
          'rep_file_publishers.document_number as replacement_document_number'
        )
        .join(
          'directus_users',
          'directus_users.id',
          'document_obsoletes.created_by'
        )
        .join(
          'file_publishers',
          'file_publishers.id',
          'document_obsoletes.file_publisher'
        )
        .join(
          'directus_users as user_pubs',
          'user_pubs.id',
          'file_publishers.created_by'
        )
        .join(
          'document_metas',
          'document_metas.id',
          'file_publishers.document_meta'
        )
        .join(
          'mt_departments',
          'mt_departments.id',
          'document_metas.department_directorat'
        )
        .leftJoin(
          'file_publishers as rep_file_publishers',
          'rep_file_publishers.id',
          'document_obsoletes.replacement_file_publisher'
        )
        .leftJoin(
          'document_metas as rep_document_metas',
          'rep_document_metas.id',
          'rep_file_publishers.document_meta'
        )
        .join('statuses', 'statuses.id', 'document_obsoletes.status')

      const ObsoleteRepoFromProbis = database('document_obsoletes')
        .select(
          'statuses.name as status_name',
          'directus_users.full_name as approved_by',
          'directus_users.full_name',
          'document_obsoletes.reason_obsolete as reason',
          'document_obsoletes.created_at',
          'document_obsoletes.advent_type',
          'repo_document_submissions.number as document_number',
          'repo_document_submissions.title as title',
          'repo_document_submissions.directorate as directorate',
          // 'mt_departments.i_com_code as werk_directorate',
          database.raw('CAST(NULL AS varchar) as werk_directorate'),
          database.raw('CAST(repo_type.name_type AS varchar) as level'),
          'rep_document_metas.judul as replacement_title',
          'rep_file_publishers.document_number as replacement_document_number'
        )
        .join(
          'directus_users',
          'directus_users.id',
          'document_obsoletes.created_by'
        )
        .leftJoin(
          'file_publishers as rep_file_publishers',
          'rep_file_publishers.id',
          'document_obsoletes.replacement_file_publisher'
        )
        .leftJoin(
          'document_metas as rep_document_metas',
          'rep_document_metas.id',
          'rep_file_publishers.document_meta'
        )
        .join('statuses', 'statuses.id', 'document_obsoletes.status')
        .leftJoin(
          'submissions',
          'submissions.id',
          'rep_file_publishers.submission'
        )
        .leftJoin(
          'repo_document_submissions',
          'repo_document_submissions.id',
          'submissions.repo_revice'
        )
        .leftJoin('repo_type', 'repo_type.id', 'repo_document_submissions.type')
        .where('document_obsoletes.advent_type', adventType)

      const ObsoleteRepo = database('repo_obsolete_submissions')
        .select(
          'statuses.name as status_name',
          'user_asgns.full_name as approved_by',
          'directus_users.full_name',
          'repo_obsolete_submissions.reason',
          'repo_obsolete_submissions.created_at',
          database.raw("'REPO' as advent_type"),
          'repo_document_submissions.number as document_number',
          'repo_document_submissions.title',
          'repo_document_submissions.directorate as directorate',
          'mt_departments.i_com_code as werk_directorate',
          'repo_type.name_type as level',
          'rep_repo_document_submissions.number as replacement_document_number',
          'rep_repo_document_submissions.title as replacement_title'
        )
        .join(
          'directus_users',
          'directus_users.id',
          'repo_obsolete_submissions.created_by'
        )
        .join(
          'directus_users as user_asgns',
          'user_asgns.id',
          'repo_obsolete_submissions.assigned_to'
        )
        /**
         * find title and number
         */
        .join(
          'repo_document_submissions',
          'repo_document_submissions.id',
          'repo_obsolete_submissions.repo_document_submission'
        )
        /**
         *find replacement
         */
        .leftJoin(
          'repo_document_submissions as rep_repo_document_submissions',
          'rep_repo_document_submissions.id',
          'repo_document_submissions.revised_with'
        )
        /**
         * find level
         */
        .join('repo_type', 'repo_type.id', 'repo_document_submissions.type')
        .join(
          'mt_departments',
          'mt_departments.id',
          'repo_document_submissions.directorate'
        )
        .join('statuses', 'statuses.id', 'repo_obsolete_submissions.status')

      if (dir) {
        ObsoleteRequest.where('document_metas.department_directorat', dir)
        ObsoleteRepo.where('repo_document_submissions.directorate', dir)
      }

      if (werkDir) {
        ObsoleteRequest.where('mt_departments.i_com_code', String(werkDir))
        ObsoleteRepo.where('mt_departments.i_com_code', String(werkDir))
      }

      if (level) {
        ObsoleteRequest.where('document_metas.level', Number(level) || 0)
        ObsoleteRepo.where('repo_type.name_type', `${level}`)
      }

      if (status) {
        ObsoleteRequest.where('statuses.id', status)
        ObsoleteRepo.where('statuses.id', status)
      }

      if (instansi) {
        ObsoleteRequest.where('document_metas.com_code', instansi)
        ObsoleteRepoFromProbis.where('rep_document_metas.com_code', instansi)
        ObsoleteRepo.where('repo_document_submissions.instansi', instansi)
      }

      if (query) {
        ObsoleteRequest.where((qb: any) => {
          qb.where('document_metas.judul', 'ilike', `%${query}%`)
          qb.orWhere('file_publishers.document_number', 'ilike', `%${query}%`)
        })
        ObsoleteRepo.where((qb: any) => {
          qb.where('repo_document_submissions.title', 'ilike', `%${query}%`)
          qb.orWhere('repo_document_submissions.number', 'ilike', `%${query}%`)
        })
      }

      if (createdBy) {
        ObsoleteRequest.where('document_obsoletes.created_by', createdBy)
        ObsoleteRepo.where('repo_obsolete_submissions.created_by', createdBy)
      }

      if (adventType === 'REPO') {
        ObsoleteRequest.unionAll(ObsoleteRepo)
          .unionAll(ObsoleteRepoFromProbis)
          .where('advent_type', adventType)
      } else if (adventType === 'REQUEST' || adventType === 'PROBIS') {
        ObsoleteRequest.where('document_obsoletes.advent_type', adventType)
      } else {
        ObsoleteRequest.unionAll(ObsoleteRepo)
      }

      const { count } =
        (await database
          .from(database.raw(`(${ObsoleteRequest.clone()}) as a`))
          .count()
          .first()) || {}

      if (limit && page) {
        ObsoleteRequest.limit(limit).offset((page - 1) * limit)
      }
      const total_page = limit ? Math.ceil(count / limit) : null
      const data = await ObsoleteRequest

      // console.log(ObsoleteRequest.toString())

      return {
        success: true,
        message: 'Successfully Get file publisher',
        data,
        meta: {
          page,
          limit,
          total_count: Number(count),
          total_page,
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
    {
      path: '/document-state',
      tag: 'IMS/document',
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
      parameters: [
        {
          in: 'query',
          name: 'business',
          schema: { type: 'number' },
          required: false,
        },
        {
          in: 'query',
          name: 'i_com_code',
          schema: { type: 'number' },
          required: false,
        },
      ],
    }
  )
  async documentState(
    @Context() ctx: any,
    @Query('business') business: number,
    @Query('i_com_code') iComCode: number
  ) {
    try {
      const { database } = ctx

      const query = database('submissions')
        .select(
          'submissions.id as submission_id',
          'staff_inputer.i_com_code',
          'approve_orders.order',
          'form_logs.reject_number',
          'document_metas.judul',
          'staff_inputer.full_name as staff_inputer',
          'staff_reviewer.full_name as staff_reviewer',
          'submissions.business',
          'submissions.date_created as created_at',
          'form_logs.created_at as updated_at'
        )
        .join('statuses', 'statuses.id', '=', 'submissions.status')
        .join(
          'directus_users as staff_inputer',
          'staff_inputer.id',
          '=',
          'submissions.user_created'
        )
        .join(
          'document_metas',
          'submissions.id',
          '=',
          'document_metas.submission'
        )
        .join('form_logs', 'submissions.current_form_log', '=', 'form_logs.id')
        .join(
          'directus_users as staff_reviewer',
          'staff_reviewer.id',
          '=',
          'form_logs.created_by'
        )
        .join(
          'approve_orders',
          'approve_orders.id',
          '=',
          'form_logs.approve_order'
        )
        .whereIn('approve_orders.order', [3, 4, 5, 6])
        .where('statuses.code', '<>', 'REJCT')

      if (business) {
        query.where('submissions.business', business)
      }

      if (iComCode) {
        query.where('staff_inputer.i_com_code', iComCode)
      }

      const results = await query

      const data = results.map((res: any) => {
        return {
          ...res,
          created_at_unix: new Date(res.created_at).getTime(),
          updated_at_unix: new Date(res.updated_at).getTime(),
        }
      })

      return {
        success: true,
        message: 'Successfully',
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
    {
      path: '/document-state/:submission_id/:reject_number/history',
      tag: 'IMS/document',
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
  async documentStateHistory(
    @Context() ctx: any,
    @Param('submission_id') submission_id: number,
    @Param('reject_number') reject_number: number
  ) {
    try {
      const { database } = ctx

      const results = await database('form_logs')
        .select(
          'form_logs.id as form_log_id',
          'ee.order',
          'aa.name as status',
          'uu.full_name as staff_reviewer',
          'form_logs.created_at'
        )
        .join('approve_orders as ee', 'ee.id', 'form_logs.approve_order')
        .join('form_actors as aa', 'aa.id', 'ee.assign_to')
        .join('directus_users as uu', 'uu.id', 'form_logs.created_by')
        .whereIn('ee.order', [3, 4, 5, 6])
        .where('form_logs.submission', submission_id)
        .where('form_logs.reject_number', reject_number)

      const data = results.map((res: any) => {
        return {
          ...res,
          created_at_unix: new Date(res.created_at).getTime(),
        }
      })

      return {
        success: true,
        message: 'Successfully',
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
    {
      path: '/document-state/:submission_id/incorrect-assign',
      tag: 'IMS/document',
    },
    {
      // parameters: [
      //   {
      //     in: 'query',
      //     name: 'is_sisman',
      //     schema: { type: 'number' },
      //     required: false,
      //   },
      // ],
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
  async documentIncorrectAssign(
    // @Req() req: any,
    @Context() ctx: any,
    // @Query('is_sisman') isSisman: number = 1,
    @Param('submission_id') submissionId: number
  ) {
    try {
      const {
        // services: { UsersService },
        database,
      } = ctx

      const query = database('submissions')
        .select(
          'submissions.id as submission_id',
          'staff_inputer.i_com_code',
          'approve_orders.order',
          'form_logs.reject_number',
          'document_metas.judul',
          'staff_inputer.full_name as staff_inputer',
          'staff_reviewer.full_name as staff_reviewer',
          'department_reviewer.name as department_reviewer',
          'staff_next.full_name as staff_target',
          'department_target.name as department_target',
          'department_target.code as department_target_code',
          'submissions.business',
          'submissions.date_created as created_at',
          'form_logs.created_at as updated_at'
        )
        .join('statuses', 'statuses.id', '=', 'submissions.status')
        .join(
          'directus_users as staff_inputer',
          'staff_inputer.id',
          '=',
          'submissions.user_created'
        )
        .join(
          'document_metas',
          'submissions.id',
          '=',
          'document_metas.submission'
        )
        .join('form_logs', 'submissions.current_form_log', '=', 'form_logs.id')
        .join(
          'directus_users as staff_reviewer',
          'staff_reviewer.id',
          '=',
          'form_logs.created_by'
        )
        .join(
          'mt_departments as department_reviewer',
          'department_reviewer.id',
          'staff_reviewer.department'
        )
        .join(
          'approve_orders',
          'approve_orders.id',
          '=',
          'form_logs.approve_order'
        )
        .join('form_actors', 'approve_orders.assign_to', 'form_actors.id')
        .join('form_assesors', function (qb: any) {
          qb.on('form_assesors.form_actor', '=', 'form_actors.id')
          qb.on('form_assesors.submission', '=', 'form_logs.submission')
        })
        .join(
          'directus_users as staff_next',
          'staff_next.id',
          '=',
          'form_assesors.officer'
        )
        .join(
          'mt_departments as department_target',
          'department_target.id',
          'staff_next.department'
        )
        .where('staff_inputer.i_com_code', '1000')

        // .whereNot('staff_next.full_name', 'ilike', `%Department Head%`)
        .where('statuses.code', '<>', 'REJCT')
        .where('submissions.id', submissionId)
        .first()

      const result = (await query) || {}
      const { order, department_target_code } = result

      if (order === 2) {
        /**
         * di pisah querynya agar tidak berat
         */
        const query =
          database('submissions')
            .select('submissions.data')
            .where('submissions.id', submissionId)
            .first() || {}

        const { data } = (await query) || {}

        const { detail } = data || {}

        const { departments, units } = Object.keys(detail).reduce(
          (acc: any, ctx: string) => {
            if (ctx === 'penomoran_dokumen') {
              const { department = [], units = [] } = detail[ctx].value || {}

              acc.departments = department.map((d: any) => d.code)
              acc.units = units.map((u: any) => u.code)
            }
            return acc
          },
          {}
        )

        const saveDepartment = departments.some(
          (d: any) => d === department_target_code
        )
        const saveUnit = units.some((u: any) => u === department_target_code)

        let res = {
          message: 'Correct Asign',
          data: {},
        }
        if (!(saveDepartment || saveUnit)) {
          res = { data: result, message: 'Incorrenct Asign' }
        }

        return {
          success: true,
          ...res,
        }
      } else if (order === 3) {
        /**
         * di pisah querynya agar tidak berat
         */
        const query =
          database('document_metas')
            .select('mt_departments.code')
            .join(
              'mt_departments',
              'mt_departments.id',
              'document_metas.department_division'
            )
            .where('document_metas.submission', submissionId)
            .first() || {}

        const { data } = (await query) || {}

        const { code } = data || {}

        let res = {
          message: 'Correct Asign',
          data: {},
        }
        if (code !== department_target_code) {
          res = { data: result, message: 'Incorrenct Asign' }
        }

        return {
          success: true,
          ...res,
        }
      } else if (order === 4 || order === 5) {
        let res = {
          message: 'Correct Asign',
          data: {},
        }
        if (department_target_code !== 'SIMJ') {
          res = { data: result, message: 'Incorrenct Asign' }
        }

        return {
          success: true,
          ...res,
        }
      } else if (order === 6) {
        let res = {
          message: 'Correct Asign',
          data: {},
        }
        if (department_target_code !== 'SMK3') {
          res = { data: result, message: 'Incorrenct Asign' }
        }

        return {
          success: true,
          ...res,
        }
      }

      return {
        success: true,
        message: 'Correct Asign',
        data: {},
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
      path: '/grant/:user_id',
      tag: 'IMS/roles',
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
          is_super_admin: {
            type: 'number',
          },
        },
      },
    }
  )
  async granter(
    @Req() req: any,
    @Body() body: any,
    @Param('user_id') userIdTarget: string,
    @Context() ctx: any
  ) {
    const { is_super_admin = 1 } = body || {}

    const {
      services: { UsersService },
      database,
    } = ctx
    const { id: userId } = await item.getUser({ req, UsersService })

    const trx = await database.transaction()

    try {
      /**
       * get statuses id
       */
      const [{ id: roleId }] = await trx('roles')
        .select('roles.id')
        .where('roles.code', 'SPRADM')

      const { id: idPriv } =
        (await trx('Privileges')
          .where('Privileges.role', roleId)
          .where('Privileges.user', userId)
          .first()) || {}

      if (!idPriv) {
        throw new Error('Access Denied')
      }

      let msg = 'Access Granted'
      if (Number(is_super_admin) === 1) {
        await trx('Privileges').insert({
          user: userIdTarget,
          source: 'MES-IMS',
          role: roleId,
        })
      } else {
        await trx('Privileges')
          .where('user', userIdTarget)
          .where('role', roleId)
          .del()

        msg = 'Access Revoked'
      }

      await trx.commit()

      return {
        success: true,
        message: msg,
      }
    } catch (error: any) {
      await trx.rollback(error)
      throw new Error(error?.message ?? error)
    }
  }

  @Get(
    {
      path: '/recomendation-assesor/atasan',
      tag: 'IMS/file-publisers',
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
  async recomendationAssesorAtasan(@Context() ctx: any, @Req() req: any) {
    const {
      services: { UsersService },
      database,
    } = ctx
    const {
      full_name,
      nip_new: nippNew,
      department: myDepartment,
    } = await item.getUser({
      req,
      UsersService,
    })
    try {
      if (!nippNew) throw new Error('NIPP not found')
      /**
       * jika belum ada submission akan langsung mencari atasan
       */
      const atasanLangsung = await database('peo_atasan_bawahan')
        .select(
          'directus_users.id',
          'directus_users.full_name',
          'peo_atasan_bawahan.kd_div_ats as department_code_ats',
          'peo_atasan_bawahan.kd_div as department_code'
        )
        .join(
          'directus_users',
          'directus_users.nip_new',
          'peo_atasan_bawahan.nipp_ats_baru'
        )
        .where('peo_atasan_bawahan.nipp_baru', nippNew)
        .where('directus_users.source', 'PEO')
        .where('directus_users.is_active', true)
        .orderBy('peo_atasan_bawahan.lvl', 'desc')

      return {
        data: atasanLangsung,
        meta: { me: { full_name, nippNew, myDepartment } },
        success: true,
        message: 'Successfully Get recomendation',
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
    {
      path: '/recomendation-assesor/same-level/step2',
      tag: 'IMS/file-publisers',
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
      parameters: [
        {
          in: 'query',
          name: 'submission_id',
          schema: { type: 'number' },
          required: false,
        },
      ],
    }
  )
  async recomendationAssesorSameLevel(
    @Query('submission_id') submissionId: number,
    @Context() ctx: any,
    @Req() req: any
  ) {
    const {
      services: { UsersService },
      database,
    } = ctx
    const {
      full_name,
      nip_new: nippNew,
      department: myDepartment,
    } = await item.getUser({
      req,
      UsersService,
    })
    enum apprType {
      ORDER = 'ORDER',
      MANAGER = 'MANAGER',
      DH = 'DH',
    }
    try {
      if (!nippNew) throw new Error('NIPP not found')
      if (!submissionId) throw new Error('submissionId is required')

      const atasanLangsung = await database('peo_atasan_bawahan')
        .select(
          'directus_users.id',
          'directus_users.full_name',
          'peo_atasan_bawahan.kd_div_ats as department_code'
        )
        .join(
          'directus_users',
          'directus_users.nip_new',
          'peo_atasan_bawahan.nipp_ats_baru'
        )
        .where('peo_atasan_bawahan.nipp_baru', nippNew)
        .where('directus_users.source', 'PEO')
        .orderBy('peo_atasan_bawahan.lvl', 'desc')

      if (submissionId) {
        const { data, order } =
          (await database('form_logs')
            .select('form_logs.data', 'approve_orders.order')
            .join('approve_orders', 'approve_orders.id', 'form_logs.next_order')
            .where('form_logs.submission', submissionId)
            .orderBy('form_logs.id', 'desc')
            .first()) || {}
        const { detail } = data || {}

        const { department, units, departmentIds, unitsIds } = Object.keys(
          detail
        ).reduce((acc: any, ctx: string) => {
          if (ctx === 'penomoran_dokumen') {
            const { department = [], units = [] } = detail[ctx].value || {}

            acc.department = department.length
            acc.units = units.length
            acc.departmentIds = department.map((d: any) => d.id)
            acc.unitsIds = units.map((u: any) => u.id)
          }
          return acc
        }, {})

        const { quota, reject_number } =
          (await database('form_logs')
            .select(
              database.raw('COUNT(form_logs.id) as quota'),
              'form_logs.reject_number'
            )
            .where('form_logs.submission', submissionId)
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

          if (apprType.MANAGER === approver) {
            /**
             * mencari unit yang sudah ada
             */
            const unitsDone =
              (await database('form_logs')
                .select('mt_departments.id')
                .join(
                  'directus_users',
                  'directus_users.id',
                  'form_logs.created_by'
                )
                .join(
                  'mt_departments',
                  'mt_departments.id',
                  'directus_users.department'
                )
                .join(
                  'approve_orders',
                  'approve_orders.id',
                  'form_logs.approve_order'
                )
                .where('directus_users.source', 'PEO')
                .where('form_logs.submission', submissionId)
                .where('form_logs.reject_number', reject_number)
                .where('approve_orders.order', 2)) || []
            // .where('directus_users.id', )

            const myUnit = myDepartment
            const allUnitDone = [
              ...new Set(unitsDone.map((u: any) => u.id)),
              myUnit,
            ]

            const allUnitNotDone = [...unitsIds].filter(
              (e: number) => !allUnitDone.includes(e)
            )

            // console.log(allUnitNotDone)

            /**
             * jika sudah tidak ada unit lagi yang tersisa,
             * maka akan mengembalikan atasan langsung
             */
            if (allUnitNotDone?.length === 0) {
              return {
                data: atasanLangsung,
                meta: { me: { full_name, nippNew, myDepartment } },
                success: true,
                message: 'Successfully Get recomendation',
              }
            }

            const recomendUser = await database('directus_users')
              .select(
                'id',
                'full_name',
                'department',
                'i_kd_div as department_code'
              )
              .whereIn('department', allUnitNotDone)
              .where('directus_users.is_active', true)
              .where('directus_users.source', 'PEO')

            return {
              data: recomendUser,
              meta: { me: { full_name, nippNew, myDepartment } },
              success: true,
              message: 'Successfully Get recomendation',
            }
          }

          if (apprType.DH === approver) {
            /**
             * mencari unit yang sudah ada
             */
            const unitsDone =
              (await database('form_logs')
                .select('mt_departments.id')
                .join(
                  'directus_users',
                  'directus_users.id',
                  'form_logs.created_by'
                )
                .join(
                  'mt_departments',
                  'mt_departments.id',
                  'directus_users.department'
                )
                .join(
                  'approve_orders',
                  'approve_orders.id',
                  'form_logs.approve_order'
                )
                .where('directus_users.source', 'PEO')
                .where('form_logs.submission', submissionId)
                .where('form_logs.reject_number', reject_number)
                .where('approve_orders.order', 2)) || []
            // .where('directus_users.id', )

            const myUnit = myDepartment
            const allUnitDone = [
              ...new Set(unitsDone.map((u: any) => u.id)),
              myUnit,
            ]

            const allDeptNotDone = [...departmentIds].filter(
              (e: number) => !allUnitDone.includes(e)
            )

            // console.log(allDeptNotDone)

            /**
             * jika sudah tidak ada unit lagi yang tersisa,
             * maka akan mengembalikan atasan langsung
             */
            if (allDeptNotDone?.length === 0) {
              return {
                data: atasanLangsung,
                meta: { me: { full_name, nippNew, myDepartment } },
                success: true,
                message: 'Successfully Get recomendation',
              }
            }

            const recomendUser = await database('directus_users')
              .select(
                'id',
                'full_name',
                'department',
                'i_kd_div as department_code'
              )
              .whereIn('department', allDeptNotDone)
              .where('directus_users.is_active', true)
              .where('directus_users.source', 'PEO')

            return {
              data: recomendUser,
              meta: { me: { full_name, nippNew, myDepartment } },
              success: true,
              message: 'Successfully Get recomendation',
            }
          }
        }
      }
      throw new Error("Can't find recomendation")
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message ?? error,
      }
    }
  }

  @Get(
    {
      path: '/recomendation-assesor/same-level/by-department',
      tag: 'IMS/file-publisers',
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
  async recomendationAssesorByDepartment(@Context() ctx: any, @Req() req: any) {
    const {
      services: { UsersService },
      database,
    } = ctx
    const {
      full_name,
      nip_new: nippNew,
      department: myDepartment,
    } = await item.getUser({
      req,
      UsersService,
    })
    try {
      if (!nippNew) throw new Error('NIPP not found')

      const atasanByDepartment = await database
        .with('peo_atasan_bawahan_atas', (qb: any) => {
          qb.select('kd_div_ats as kd_div')
            .from('peo_atasan_bawahan')
            .where('peo_atasan_bawahan.nipp_baru', nippNew)
            .orderBy('peo_atasan_bawahan.lvl', 'desc')
            .limit(1)
        })
        .select(
          'peo_atasan_bawahan_setara.kd_div as department_code',
          'peo_atasan_bawahan_setara.kd_div_ats as department_code_ats',
          'peo_atasan_bawahan_setara.pegawai',
          'directus_users.full_name',
          'directus_users.id'
        )
        .from('peo_atasan_bawahan_atas')
        .join(
          'peo_atasan_bawahan as peo_atasan_bawahan_setara',
          'peo_atasan_bawahan_setara.kd_div_ats',
          'peo_atasan_bawahan_atas.kd_div'
        )
        .join(
          'directus_users',
          'directus_users.nip_new',
          'peo_atasan_bawahan_setara.nipp_baru'
        )
        // .where('directus_users.instansi', instansi)
        .where('directus_users.is_active', true)
        .where('directus_users.source', 'PEO')

      return {
        data: atasanByDepartment,
        meta: { me: { full_name, nippNew, myDepartment } },
        success: true,
        message: 'Successfully Get recomendation',
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
    {
      path: '/recomendation-assesor/bawahan',
      tag: 'IMS/file-publisers',
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
  async recomendationAssesorBawahan(@Context() ctx: any, @Req() req: any) {
    const {
      services: { UsersService },
      database,
    } = ctx
    const {
      full_name,
      nip_new: nippNew,
      department: myDepartment,
    } = await item.getUser({
      req,
      UsersService,
    })
    try {
      if (!nippNew) throw new Error('NIPP not found')

      const bawahan = await database('peo_atasan_bawahan')
        .select(
          'peo_atasan_bawahan.kd_div as department_code',
          'peo_atasan_bawahan.kd_div_ats as department_code_ats',
          'peo_atasan_bawahan.pegawai',
          'directus_users.full_name',
          'directus_users.id'
        )
        .join(
          'directus_users',
          'directus_users.nip_new',
          'peo_atasan_bawahan.nipp_baru'
        )
        .where('directus_users.source', 'PEO')
        // .where('directus_users.instansi', instansi)
        .where('directus_users.is_active', true)
        .where('peo_atasan_bawahan.nipp_ats_baru', nippNew)
      return {
        data: bawahan,
        meta: { me: { full_name, nippNew, myDepartment } },
        success: true,
        message: 'Successfully Get recomendation',
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
    {
      path: '/recomendation-assesor/sisman',
      tag: 'IMS/file-publisers',
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
  async recomendationAssesorSisman(@Context() ctx: any, @Req() req: any) {
    const {
      services: { UsersService },
      database,
    } = ctx
    const {
      full_name,
      nip_new: nippNew,
      department: myDepartment,
      instansi,
    } = await item.getUser({
      req,
      UsersService,
    })
    try {
      if (!nippNew) throw new Error('NIPP not found')

      const depCodes =
        (await database('mt_sisman_grups')
          .select('kd_div')
          .where('grup', instansi)) || []

      const sismans = await database('directus_users')
        .select(
          'directus_users.full_name',
          'directus_users.id',
          'directus_users.instansi',
          'directus_users.pegawai'
        )
        .where('directus_users.source', 'PEO')
        // .where('directus_users.instansi', instansi)
        .where('directus_users.is_active', true)
        .whereIn(
          'directus_users.i_kd_div',
          depCodes.map((d: any) => d.kd_div)
        )
      return {
        data: sismans,
        meta: { me: { full_name, nippNew, myDepartment, instansi } },
        success: true,
        message: 'Successfully Get recomendation',
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
    {
      path: '/dashboard/probis',
      tag: 'IMS/dasboard',
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
      parameters: [
        {
          in: 'query',
          name: 'business',
          schema: { type: 'number' },
          required: true,
        },
        {
          in: 'query',
          name: 'company',
          schema: { type: 'string' },
          required: true,
          example: 'PLND',
        },
      ],
    }
  )
  async dashboardProbis(
    @Context() ctx: any,
    @Query('business') business: number,
    @Query('company') company: string
  ) {
    try {
      const { database } = ctx

      if (!business) throw new Error('Business parameter is required')

      const pengesahanQuery = database('submissions as b')
        .join('form_logs as c', 'b.current_form_log', 'c.id')
        .join('approve_orders as d', 'c.approve_order', 'd.id')
        .join('form_actors as e', 'd.assign_to', 'e.id')
        .whereIn('d.order', [1, 2, 3])
        .where('b.business', business)
        .groupBy('d.order', 'e.name')
        .select('e.name', 'd.order')
        .count('b.id as jumlah')

      const peninjauanQuery = database('submissions as b')
        .join('form_logs as c', 'b.current_form_log', 'c.id')
        .join('approve_orders as d', 'c.approve_order', 'd.id')
        .join('form_actors as e', 'd.assign_to', 'e.id')
        .whereIn('d.order', [4, 5, 6])
        .where('b.business', business)
        .groupBy('d.order', 'e.name')
        .select('e.name', 'd.order')
        .count('b.id as jumlah')

      const publishQuery = database('file_publishers as q')
        .join('statuses as w', 'q.status', 'w.id')
        .join('submissions as r', 'r.id', 'q.submission')
        .where('w.code', 'PUBLS')
        .where('r.business', business)
        .count('q.id as jumlah')

      if (company) {
        pengesahanQuery.where('b.com_code', company)
        peninjauanQuery.where('b.com_code', company)
        publishQuery.where('r.com_code', company)
      }

      const pengesahan = await pengesahanQuery

      const peninjauan = await peninjauanQuery

      const [publish] = (await publishQuery) || [{ jumlah: 0 }]

      const publishCount = {
        ...publish,
        name: 'Publish',
        order: null,
      }

      return {
        success: true,
        message: 'Successfully',
        data: { pengesahan, peninjauan, publish: [publishCount] },
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
