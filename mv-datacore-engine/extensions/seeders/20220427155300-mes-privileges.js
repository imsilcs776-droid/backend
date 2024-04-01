module.exports = {
	async up(knex) {
		// on seed up
		return knex.transaction(async (trx) => {
			const [role] = await trx('roles').where('code', '=', 'SPRADM');
			const [product] = await trx('products');
			const [user] = await trx('directus_users').where('email', '=', 'superadmin@mail.com');

			await trx('Privileges').insert({
				user: user?.id,
				product: product?.id,
				role: role?.id,
			});
		});
	},

	async down() {
		// on seed revert
	},
};
