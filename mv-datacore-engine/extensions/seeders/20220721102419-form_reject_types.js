module.exports = {
  async up(knex) {
    // on seed up
    const now = new Date();
    const datas = [
      {
        code: "RVSI",
        name: "Revisi",
        description: "Tolak untuk direvisi",
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        code: "TDKLT",
        name: "Tidak lanjut",
        description: "Tidak dilanjutkan",
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        code: "RJDSP",
        name: "Tolak Disposisi",
        description: "Tolak Disposisi",
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ];
    return knex("form_reject_types").insert(datas);
  },

  async down(knex) {
    // on seed revert
  },
};
