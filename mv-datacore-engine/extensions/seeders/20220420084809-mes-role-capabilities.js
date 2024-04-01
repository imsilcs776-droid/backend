module.exports = {
	async up(knex) {
		// on seed up

		return knex.transaction(async (trx) => {
			const roles = [
				{
					code: 'SPRADM',
					name: 'Super Admin',
					description: 'Super Admin',
					parent: null,
					is_active: true,
					is_collapse: false,
					is_default: true,
					childrens: [
						{
							code: 'LMGR',
							name: 'License Manager',
							description: 'License Manager',
							is_active: true,
							is_collapse: false,
							is_default: true,
							childrens: [
								{
									code: 'IMPL',
									name: 'Implementor',
									description: 'Implementor',
									is_active: true,
									is_collapse: false,
									is_default: true,
									childrens: [
										{
											code: 'ADMMES',
											name: 'Admin MES',
											description: 'Admin MES',
											is_active: true,
											is_collapse: false,
											is_default: true,
											childrens: [],
										},
										{
											code: 'USRMES',
											name: 'User MES',
											description: 'User MES',
											is_active: true,
											is_collapse: false,
											is_default: true,
											childrens: [],
										},
									],
								},
							],
						},
					],
				},
			];

			const roleMap = {};

			const createRole = async (role, parentId = null) => {
				const childrens = role.childrens;
				delete role.childrens;
				const [createdRole] = await trx('roles')
					.insert({ ...role, parent: parentId, created_at: now, updated_at: now })
					.returning('id');

				roleMap[role.code] = { id: createdRole?.id ?? createRole };

				for (const children of childrens) {
					await createRole(children, createdRole?.id ?? createRole);
				}
			};

			const now = new Date();

			await createRole(roles[0]);

			const capabilities = [
				{ featureCode: 'MES02', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES03', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES05', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES06', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES06', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES14', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES18', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES22', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES23', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES24', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES25', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES26', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES27', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES29', productCode: 'MES', roleCode: 'ADMMES' },
				{ featureCode: 'MES01', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES02', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES03', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES04', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES05', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES06', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES07', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES08', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES09', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES10', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES11', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES14', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES15', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES16', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES17', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES18', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES20', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES21', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES22', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES23', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES25', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES26', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES28', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES29', productCode: 'MES', roleCode: 'IMPL' },
				{ featureCode: 'MES01', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES02', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES03', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES04', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES05', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES06', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES07', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES08', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES09', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES10', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES11', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES14', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES15', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES16', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES17', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES20', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES21', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES22', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES23', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES24', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES25', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES26', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES27', productCode: 'MES', roleCode: 'LMGR' },
				{ featureCode: 'MES01', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES02', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES14', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES18', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES22', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES25', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES26', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES27', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES28', productCode: 'MES', roleCode: 'USRMES' },
				{ featureCode: 'MES29', productCode: 'MES', roleCode: 'USRMES' },
			];

			const featureCodes = capabilities.map((capability) => capability.featureCode);
			// eslint-disable-next-line no-undef
			const uniqueFeatureCodes = [...new Set(featureCodes)];

			const features = await trx('features').select('*').whereIn('code', uniqueFeatureCodes);

			const featureMap = {};

			for (const feature of features) {
				featureMap[feature.code] = feature;
			}

			const [company] = await trx('companies').select('*');

			const [product] = await trx('products')
				.insert({
					code: 'MES',
					name: 'Manufacturing Execution System',
					description: 'This is Manufacturing Execution System',
					is_active: true,
					company: company.id,
					created_at: now,
					updated_at: now,
				})
				.returning('id');

			const capabilityDatas = [];

			for (const capability of capabilities) {
				const feature = featureMap[capability.featureCode];

				const currentRole = roleMap[capability.roleCode];

				capabilityDatas.push({
					product: product.id,
					feature: feature.id,
					role: currentRole.id,
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
