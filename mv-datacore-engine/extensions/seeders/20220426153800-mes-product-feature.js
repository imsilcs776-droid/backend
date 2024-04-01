module.exports = {
	async up(knex) {
		// on seed up
		return knex.transaction(async (trx) => {
			const now = new Date();
			const datas = [];

			const products = await trx('products');
			const features = await trx('features');

			for (const product of products) {
				for (const feature of features) {
					datas.push({
						product: product.id,
						feature: feature.id,
						created_at: now,
						updated_at: now,
					});
				}
			}

			await trx('product_features').insert(datas);
		});
	},

	async down() {
		// on seed revert
	},
};
