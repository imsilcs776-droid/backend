module.exports = {
	async up(knex) {
		// on seed up
    const now = new Date()
    const datas = [
      {
        code: 'SECTOR',
        name: 'Sectors',
        created_at: now,
        updated_at: now
      },
      {
        code: 'LINE',
        name: 'Lines',
        created_at: now,
        updated_at: now
      },
      {
        code: 'PROCESS',
        name: 'Processes',
        created_at: now,
        updated_at: now
      },
      {
        code: 'MACHINE',
        name: 'Machines',
        created_at: now,
        updated_at: now
      },
    ]
    return knex('entities').insert(datas)
	},

	async down(knex) {
    // on seed revert
		
	},
};
