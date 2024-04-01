const { v4 } = require('uuid');
const { generateHash } = require('mv-data-core/utils/generate-hash');

module.exports = {
	async up(knex) {
		// on seed up
		return knex.transaction(async (trx) => {
			const [adminRole] = await trx('directus_roles');
			const [company] = await trx('companies');

			const userData = {
				id: v4(),
				first_name: 'Super',
				last_name: 'Admin',
				email: 'superadmin@mail.com',
				password: await generateHash('123456'),
				role: adminRole?.id,
				status: 'active',
				company: company?.id,
			};

			const [profile] = await trx('Profiles')
				.insert({
					full_name: `${userData.first_name} ${userData.last_name}`,
					first_name: userData.first_name,
					last_name: userData.last_name,
					email: userData.email,
					id_number: 'SPRADM',
					phone: '082112344321',
					address: 'Some address',
					post_code: '123456',
					gender: 'MALE',
					religion: 'ISLAM',
				})
				.returning('id');

			userData.profile = profile?.id ?? profile;

			await trx('directus_users').insert(userData);
		});
	},

	async down() {
		// on seed revert
	},
};
