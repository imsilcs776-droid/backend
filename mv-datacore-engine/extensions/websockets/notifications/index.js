const { v4 } = require('uuid');

module.exports = ({
  socket, // for listenning event with socket
  database, // get knex database instance
  socketServer, // for emitting event
  logger, // logging
}) => {
  socket.on('CREATE_NOTIF', async ({message,subject,users,url}) => {
    const idNotif = v4()
    await database('notifications').insert({
      id: idNotif,
      message,
      subject,
      created_at: new Date(),
      url
    });

    const notifUsers = users.map(user=> ({
      notifications_id: idNotif,
      directus_users_id: user,
    }))

    await database('notifications_directus_users').insert(notifUsers);
    await socketServer.emit(`BROADCAST`, {message,subject,users})
    logger.info(`There are some message to ${subject}`)
  })
}