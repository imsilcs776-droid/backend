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

@Endpoint('comments')
export default class DefineEndpoint {
  @Get(
    { path: '/submissions/:submission_id/status', tag: 'Comment' },
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
          in: 'params',
          name: 'submission_id',
          schema: { type: 'number' },
          required: true,
        },
      ],
    }
  )
  async commentStatus(
    @Param('submission_id') submission_id: number,
    @Context() ctx: any
  ) {
    try {
      const { database } = ctx

      const query = await database.raw(
        `
        SELECT
          a.form_field,
          bool_and(a.solved) as solved
        FROM
          form_comment_logs a
        where
          a.submission = ?
        GROUP BY
          a.form_field
      `,
        submission_id
      )

      const { rows } = query

      return {
        success: true,
        message: 'Successfully',
        data: rows,
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
