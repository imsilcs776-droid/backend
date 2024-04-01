module.exports = {
	async up(knex) {
		// on seed up
		return knex.transaction(async (trx) => {
			const roles = await trx('roles').select('*');
			const roleMap = {};
			for (const role of roles) {
				roleMap[role.code] = role;
			}

			const data = {
				code: 'SPRADM',
				childrens: [
					{
						code: 'LMGR',
						childrens: [
							{
								code: 'IMPL',
								childrens: [
									{
										code: 'ADMMES',
										childrens: [
											{
												code: 'USRMES',
												childrens: [],
											},
										],
									},
									{
										code: 'USRMES',
										childrens: [],
									},
								],
							},
						],
					},
				],
			};

			const datas = [];

			const createRoleParent = async (roleData) => {
				const roleParentId = roleMap[roleData.code].id;
				for (const roleChildren of roleData.childrens) {
					const roleChildrenId = roleMap[roleChildren.code].id;
					datas.push({
						parent_role: roleParentId,
						related_role: roleChildrenId,
					});

					await createRoleParent(roleChildren);
				}
			};

			await createRoleParent(data);

			await trx('role_parents').insert(datas);
		});
	},

	async down() {
		// on seed revert
	},
};
