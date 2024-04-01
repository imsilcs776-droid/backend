module.exports = function defineHook({ filter, action }, { database }) {
	action("roles_modules_1.items.create", async(item) => {
		const { payload, keys: [id] } = item;

		const now = new Date();

		if (payload) {
			await database('role_module_update_logs').insert({
				role_module_id: id,
				payload: JSON.stringify(payload),
				action: 'CREATE',
				created_at: now,
				updated_at: now,
			});
		}
	});

	action("roles_modules_1.items.delete", async(item) => {
		const { payload, keys: [id] } = item;

		const now = new Date();

		if (payload) {
			await database('role_module_update_logs').insert({
				role_module_id: id,
				action: 'DELETE',
				created_at: now,
				updated_at: now,
			});
		}
	});
};
