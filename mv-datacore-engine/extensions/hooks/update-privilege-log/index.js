module.exports = function defineHook({ filter, action }, { database }) {
	action("Privileges.items.update", async(item) => {
		const { payload, keys: [id] } = item;

		const now = new Date();

		if (payload) {
			await database('privilege_update_logs').insert({
				privilege: id,
				payload: JSON.stringify(payload),
				created_at: now,
				updated_at: now,
			});
		}
	});
};
