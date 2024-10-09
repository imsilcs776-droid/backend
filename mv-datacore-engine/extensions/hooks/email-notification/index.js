const axios = require('axios')

module.exports = function defineHook(
  { filter, action },
  { services, exceptions, database, env }
) {
  const { MailService, ItemsService, UsersService } = services
  const { ServiceUnavailableException, ForbiddenException } = exceptions

  console.log('notifications_directus_users.items.create !!!!!')

  action(
    'notifications_directus_users.items.create',
    async ({ payload }, context) => {
      const { email, type, message, url, notifications_id } = payload
      const { schema, accountability, database } = context

      const mailService = new MailService({ schema })

      const usersService = new UsersService({
        schema: schema,
        accountability: accountability,
      })

      const notificationService = new ItemsService('notifications', {
        schema,
        database,
        accountability,
      })

      if (!email) return

      const { full_name, email: emailFrom } = await usersService.readOne(
        accountability.user
      )

      const { subject } = await notificationService.readOne(notifications_id)

      /**
       * email assessment
       */
      if (type === 'assessment') {
        try {
          const { full_name: fn } =
            (await database('directus_users')
              .where({ email: email })
              .first()) || {}

          // await mailService.send({
          //   to: email,
          //   subject,
          //   text: subject,
          //   template: {
          //     name: 'email-assessment',
          //     data: {
          //       email: emailFrom,
          //       full_name,
          //       full_name_to: fn,
          //       url: env.NOTIFICATION_URL + '/#/document-review',
          //     },
          //   },
          // })

          const response = await axios.post(
            'http://nodered:1880/node-email',
            {
              to: email,
              subject: subject,
              text: subject,
              template: {
                name: 'email-assessment',
                data: {
                  email: emailFrom,
                  full_name: full_name,
                  full_name_to: fn,
                  url: process.env.NOTIFICATION_URL + '/#/document-review',
                },
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )

          console.log(response)
        } catch (error) {
          console.error(error)
          throw new ServiceUnavailableException(error)
        }
      } else {
        /**
         * common email
         */
        try {
          const { full_name: fn } =
            (await database('directus_users')
              .where({ email: email })
              .first()) || {}

          // await mailService.send({
          //   to: email,
          //   subject,
          //   text: subject,
          //   template: {
          //     name: 'email-notification',
          //     data: {
          //       message,
          //       full_name_to: fn,
          //       url: env.NOTIFICATION_URL + '/#' + url,
          //     },
          //   },
          // })

          const response = await axios.post(
            'http://nodered:1880/node-email',
            {
              to: email,
              subject: subject,
              text: subject,
              template: {
                name: 'email-notification',
                data: {
                  message: message,
                  full_name_to: fn,
                  url: process.env.NOTIFICATION_URL + '/#' + url,
                },
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )

          console.log(response)
        } catch (error) {
          console.error(error)
          throw new ServiceUnavailableException(error)
        }
      }

      return
    }
  )
}
