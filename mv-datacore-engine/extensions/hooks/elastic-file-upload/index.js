const path = require("path");
const fse = require("fs-extra");
const axios = require("axios");

module.exports = function defineHook(
  { filter, action },
  { database, env, logger }
) {
  action("files.upload", async (item) => {
    const { payload, key: id } = item;

    if (env.ELASTIC_SEARCH_ENABLED == true) {
      const baseURL = env.ELASTIC_SEARCH_BASE_URL;
      const mimetypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/pdf",
        "application/msword",
      ];
      if (payload && mimetypes.includes(payload.type)) {
        const filePath = path.resolve(
          path.join(env.STORAGE_LOCAL_ROOT, payload.filename_disk)
        );
        const base64 = await fse.readFile(filePath, "base64");

        try {
          await axios.post(
            `${baseURL}/${env.ELASTIC_SEARCH_INDEX}/_doc/${id}?pipeline=document_64_to_text`,
            {
              filename: payload.filename_download,
              data: base64,
              meta: {
                id,
                title: payload.title,
                filename_disk: payload.filename_disk,
              },
              is_global_document: payload.is_global_document || true,
            },
            {
              auth: {
                username: env.ELASTICSEARCH_USERNAME,
                password: env.ELASTICSEARCH_PASSWORD,
              }
            }
          );
          logger.info(
            `File ${payload.filename_download} saved to elastic search`
          );
        } catch (_e) {
          logger.error(
            `Failed to save ${payload.filename_download} to elastic search`
          );
        }
      }
    }
  });

  action("files.delete", async (item) => {
    const { keys } = item;

    if (env.ELASTIC_SEARCH_ENABLED == true) {
      const baseURL = env.ELASTIC_SEARCH_BASE_URL;
      for (const key of keys) {
        try {
          await axios.delete(
            `${baseURL}/${env.ELASTIC_SEARCH_INDEX}/_doc/${key.toLowerCase()}`
          );
        } catch {}
      }
    }
  });
};
