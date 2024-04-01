module.exports = {
	async up(knex) {
    // on seed up
    const now = new Date();
		
    return knex("companies").insert({
			code: "LANIUS",
			name: "PT. Lanius Inovasi Indonesia",
			description: "PT. Lanius Inovasi Indonesia",
			is_active: true,
		});
	},

	async down(knex) {
    // on seed revert
	},
};
