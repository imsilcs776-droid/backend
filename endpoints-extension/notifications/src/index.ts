import { Body, Context, Endpoint, Req, Post } from '@mv-data-core/decorator'
import { item } from './helpers'
import type { NotificationDTO, NotificationDepartmentDTO } from './interfaces'
import { v4 } from 'uuid'
import providers from './providers'

@Endpoint('notifications')
export default class DefineEndpoint {
  @Post(
    {
      path: '/users',
      tag: 'Notifications',
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
          subject: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
          url: {
            type: 'string',
          },
          users: {
            type: 'array',
            example: ['user1', 'user2', 'user3'],
          },
        },
      },
    }
  )
  async notificationsAdd(
    @Req() req: any,
    @Body() body: NotificationDTO,
    @Context() ctx: any
  ) {
    try {
      /**
       * get email target
       */

      const {
        services: { UsersService, ItemsService },
        database,
        env,
      } = ctx
      const { id: idUser } = await item.getUser({ req, UsersService })

      const { message, subject, url, users = [] } = body || {}

      const idNotif = v4()

      if (!users.length) throw new Error('Users is required')

      const userData = await database('directus_users')
        .select('directus_users.id', 'directus_users.email')
        .whereIn('directus_users.id', users)

      const [{ id: idNotification }] = await database('notifications')
        .insert({
          id: idNotif,
          created_by: idUser,
          created_at: new Date(),
          message,
          subject,
          url,
        })
        .returning('id')

      const usersBody = users.map((user) => {
        const { email } = userData.find((dt: { id: string }) => dt.id === user)
        return {
          notifications_id: idNotification,
          directus_users_id: user,
          email,
          message,
          subject,
          url,
        }
      })

      for (const userBody of usersBody) {
        await item.setItem({
          req,
          ItemsService,
          name: 'notifications_directus_users',
          body: userBody,
        })
        const mqttResult = await providers.client.post('/api/v4/mqtt/publish', {
          topic: userBody.directus_users_id,
          payload: JSON.stringify({
            message,
            subject,
            url,
          }),
          qos: 2,
          retain: false,
          clientid: 'datacore',
        })
        console.log(mqttResult)
      }

      return {
        success: true,
        message: 'Successfully Submit',
      }
    } catch (error: any) {
      console.log(error)
      return {
        success: false,
        message: error?.message || error,
      }
    }
  }

  @Post(
    {
      path: '/departments',
      tag: 'Notifications',
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
          subject: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
          url: {
            type: 'string',
          },
          department: {
            type: 'number',
          },
        },
      },
    }
  )
  async notificationsDepartment(
    @Req() req: any,
    @Body() body: NotificationDepartmentDTO,
    @Context() ctx: any
  ) {
    try {
      /**
       * get email target
       */

      const {
        services: { UsersService },
        database,
      } = ctx
      const { id: idUser } = await item.getUser({ req, UsersService })

      const { message, subject, url, department = [] } = body || {}

      const idNotif = v4()

      if (!department) throw new Error('department is required')

      const userData = await database('directus_users')
        .select('directus_users.id', 'directus_users.email')
        .where('directus_users.department', department)

      const [{ id: idNotification }] = await database('notifications')
        .insert({
          id: idNotif,
          created_by: idUser,
          created_at: new Date(),
          message,
          subject,
          url,
        })
        .returning('id')

      const usersBody = userData.map((user: any) => {
        return {
          notifications_id: idNotification,
          directus_users_id: user.id,
          message,
          url,
        }
      })

      for (const userBody of usersBody) {
        const notifUsersId = v4()
        await database('notifications_directus_users').insert({
          ...userBody,
          id: notifUsersId,
        })
      }

      await providers.client.post('/api/v4/mqtt/publish', {
        topic: `dept/${department}`,
        payload: JSON.stringify({
          message,
          subject,
          url,
        }),
        qos: 2,
        retain: false,
        clientid: 'datacore',
      })

      return {
        success: true,
        message: 'Successfully Submit',
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
