import { Context, Endpoint, Get, Req, Param } from '@mv-data-core/decorator'

@Endpoint('departments')
export default class DefineEndpoint {
  @Get(
    { path: '/relates', tag: 'departments' },
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
  async departments(@Context() ctx: any, @Req() req: any) {
    try {
      const { database } = ctx

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
          pt.path,
          CASE
            WHEN (position('reg' in LOWER(pt.name_path))) > 0 THEN true
            ELSE false
          END as is_regional
        FROM
          (
            SELECT
              *
            FROM
              mt_departments_cte AS n
            ORDER BY
              n.id ASC
          ) as pt
      `
      const { rows: data } = await database.raw(query)

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
    { path: '/:id/relates', tag: 'departments' },
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
  async department(
    @Context() ctx: any,
    @Req() req: any,
    @Param('id') id: number
  ) {
    try {
      const { database } = ctx

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
          pt.path,
          CASE
            WHEN (position('reg' in LOWER(pt.name_path))) > 0 THEN true
            ELSE false
          END as is_regional
        FROM
          (
            SELECT
              *
            FROM
              mt_departments_cte AS n
            WHERE n.id = ${id}
            ORDER BY
              n.id ASC
          ) as pt
      `
      const {
        rows: [departmentParent],
      } = await database.raw(query)
      const { is_regional, path = '' } = departmentParent
      let regionalHead = { id: null }
      let divTech = { id: null }
      let sisman = { id: null }
      if (is_regional) {
        regionalHead = (await database('mt_departments')
          .select('mt_departments.id')
          .whereNull('mt_departments.deleted_at')
          .whereIn('mt_departments.id', path.split('->'))
          .where('mt_departments.code', 'like', 'RH%')
          .first()) || { id: null }

        if (regionalHead.id) {
          divTech = (await database('mt_departments')
            .select('mt_departments.id')
            .whereNull('mt_departments.deleted_at')
            .where('mt_departments.parent', regionalHead.id)
            .where('mt_departments.code', 'like', 'TKNK%')
            .first()) || { id: null }

          if (divTech.id) {
            sisman = (await database('mt_departments')
              .select('mt_departments.id')
              .whereNull('mt_departments.deleted_at')
              .where('mt_departments.parent', divTech.id)
              .where('mt_departments.code', 'like', 'STMN%')
              .first()) || { id: null }
          }
        }
      }

      return {
        success: true,
        message: 'Successfully',
        regionalHead,
        data: {
          ...departmentParent,
          regional: {
            regional_head: regionalHead.id,
            div_tech: divTech.id,
            sisman: sisman.id,
          },
          head_office: {},
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
}
