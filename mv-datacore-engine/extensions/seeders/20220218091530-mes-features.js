module.exports = {
	async up(knex) {
    // on seed up
    const now = new Date()
    const datas = [
      {
        parent: null,
        name: "(Super Admin) Manage Role",
        code: "MES00",
        description: "Manage Role (Recommended for Super Admin only!)",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Business Process Builder",
        code: "MES01",
        description: "Business Process Builder",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Manage Action Plan",
        code: "MES02",
        description: "Manage Action Plan",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "MDP App Admin",
        code: "MES03",
        description: "MDP App Admin",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Organization",
        code: "MES04",
        description: "Master - Organization",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - User",
        code: "MES05",
        description: "Master - User",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Plant",
        code: "MES06",
        description: "Master - Plant",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Area",
        code: "MES07",
        description: "Master - Area",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Sector",
        code: "MES08",
        description: "Master - Sector",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Line",
        code: "MES09",
        description: "Master - Line",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Process",
        code: "MES10",
        description: "Master - Process",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Machine",
        code: "MES11",
        description: "Master - Machine",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Import Data - Plant",
        code: "MES12",
        description: "Import Data - Plant",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Import Data - Organization & User	",
        code: "MES13",
        description: "Import Data - Organization & User	",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Manage Position",
        code: "MES14",
        description: "Manage Position",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Manage Tier",
        code: "MES15",
        description: "Manage Tier",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Manage Shift",
        code: "MES16",
        description: "Manage Shift",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Manage Device",
        code: "MES17",
        description: "Manage Device",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Approval Setting",
        code: "MES18",
        description: "Approval Setting",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "MDP App (Dashboard)",
        code: "MES19",
        description: "MDP App (Dashboard)",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Assets",
        code: "MES20",
        description: "Master - Assets",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Master - Downtime",
        code: "MES21",
        description: "Master - Downtime",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "TV Admin - File Library",
        code: "MES22",
        description: "TV Admin - File Library",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "TV Admin - Manage TV",
        code: "MES23",
        description: "TV Admin - Manage TV",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "TV Admin - Manage View",
        code: "MES24",
        description: "TV Admin - Manage View",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "TV Admin - Manage Parameter",
        code: "MES25",
        description: "TV Admin - Manage Parameter",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "TV Admin - Safety Piramid	",
        code: "MES26",
        description: "TV Admin - Safety Piramid	",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "TV Admin - Manage Meeting",
        code: "MES27",
        description: "TV Admin - Manage Meeting",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Manage Business Process",
        code: "MES28",
        description: "Manage Business Process",
        created_at: now,
        updated_at: now
      },
      {
        parent: null,
        name: "Manage Auto Report",
        code: "MES29",
        description: "Manage Auto Report",
        created_at: now,
        updated_at: now
      },
    ];
		
    return knex("features").insert(datas);
	},

	async down(knex) {
    // on seed revert
		
	},
};
