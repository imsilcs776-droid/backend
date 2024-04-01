module.exports = {
	async up(knex) {
		// on seed up
		const now = new Date();
		return knex.transaction(async (trx) => {
			const features = await trx('features').select('*');
			const [role] = await trx('roles').select('*').where('code', 'SPRADM');
			const [product] = await trx('products').select('*').where('code', 'MES');

			const capabilityDatas = [];

			for (const feature of features) {
				capabilityDatas.push({
					product: product.id,
					feature: feature.id,
					role: role.id,
					created_at: now,
					updated_at: now,
				});
			}

			await trx('capabilities').insert(capabilityDatas);
		});
	},

	async down() {
		// on seed revert
	},
};
