module.exports = function defineHook({ filter, action }, { database }) {
	action("users.update", async(item) => {
		const { payload, keys: [id] } = item;

		const now = new Date();

		try {
			const user = await database('directus_users')
				.select('directus_users.email', 'profiles.full_name')
				.join('profiles', 'directus_users.profile', 'profiles.id')
				.where('directus_users.id', id)
				.first();

			if (user && payload) {
				await database('user_update_logs').insert({
					user: id,
					payload: JSON.stringify(payload),
					email: user?.email,
					full_name: user?.full_name,
					created_at: now,
					updated_at: now,
				});
			}
		} catch (error) {
			console.log(error);
		}
	});

  filter("users.create", async (payload, meta, context) => {
    try {
      const { first_name, last_name } = payload;
      if (last_name) {
        payload.full_name = `${first_name} ${last_name}`
      } else {
        payload.full_name = `${first_name}`
      }
    } catch (_e) {}
    return payload
  })

  filter("users.update", async (payload, meta, context) => {
    const {
      first_name,
      last_name
    } = payload

    if (first_name) {
      if (last_name) {
        payload.full_name = `${first_name} ${last_name}`
      } else {
        payload.full_name = `${first_name}`
      }
    }

    return payload
  })
};
