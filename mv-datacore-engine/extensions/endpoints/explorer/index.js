const swaggerUi = require("swagger-ui-express");
const express = require("express");

const fs = require("fs");
const path = require("path");

module.exports = function registerEndpoint(router, { services, exceptions, env }) {
  const { SpecificationService } = services;
  const { ServiceUnavailableException } = exceptions;

  const openApiPath = path.join(process.cwd(), ".openapi.json");

  router.get("/json", async (req, res) => {
    const { isSystem } = req.query;
    let schemaType;
    if (isSystem) {
      if (isSystem.toLowerCase() === "true") schemaType = true;
      else if (isSystem.toLowerCase() === "false") schemaType = false;
    }
    const excludedPaths = ["POST:/auth/login"];
    const { ADMIN_ID, ADMIN_ROLE } = env;
    const service = new SpecificationService({
      accountability: {
        user: ADMIN_ID,
        role: ADMIN_ROLE,
        admin: true,
        app: true,
        ip: "::1",
        userAgent: "System/1.0.0",
        share: undefined,
        share_scope: undefined,
        permissions: [],
      },
      schema: req.schema,
      options: {
        isSystem: schemaType,
      },
    });
    const json = await service.oas.generate();
    const auth = [{ Auth: [] }, { bearer: [] }];
    json.components.securitySchemes.bearer = {
      scheme: "bearer",
      bearerFormat: "JWT",
      type: "http",
    };
    if (fs.existsSync(openApiPath)) {
      const openApi = JSON.parse(fs.readFileSync(openApiPath));
      json.paths = {
        ...json.paths,
        ...openApi.paths,
      };
    }
    for (const path in json.paths) {
      for (const method in json.paths[path]) {
        if (!excludedPaths.includes(`${method.toUpperCase()}:${path}`)) json.paths[path][method].security = auth;
      }
    }
    res.send(json);
  });
  router.use("/api-docs", swaggerUi.serve);
  router.get("/api-docs", async (req, res) => {
    const excludedPaths = ["POST:/auth/login"];
    const { ADMIN_ID, ADMIN_ROLE } = env;
    const service = new SpecificationService({
      accountability: {
        user: ADMIN_ID,
        role: ADMIN_ROLE,
        admin: true,
        app: true,
        ip: "::1",
        userAgent: "System/1.0.0",
        share: undefined,
        share_scope: undefined,
        permissions: [],
      },
      schema: req.schema,
    });
    const json = await service.oas.generate();
    const auth = [{ Auth: [] }, { bearer: [] }];
    json.components.securitySchemes.bearer = {
      scheme: "bearer",
      bearerFormat: "JWT",
      type: "http",
    };
    if (fs.existsSync(openApiPath)) {
      const openApi = JSON.parse(fs.readFileSync(openApiPath));
      json.paths = {
        ...json.paths,
        ...openApi.paths,
      };
    }
    for (const path in json.paths) {
      for (const method in json.paths[path]) {
        if (!excludedPaths.includes(`${method.toUpperCase()}:${path}`)) json.paths[path][method].security = auth;
      }
    }
    return swaggerUi.setup(json, null, {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    })(req, res);
  });
  router.use("/rapi-docs/assets", express.static(path.resolve(`${__dirname}/../../../node_modules/rapidoc/dist`)));
  router.use("/rapi-docs/custom.js", (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/custom.js`));
  });
  router.use("/rapi-docs/custom.css", (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/custom.css`));
  });
  router.use("/rapi-docs/logo.png", (req, res) => {
    res.sendFile(path.resolve(`${__dirname}/logo.png`));
  });
  router.get("/rapi-docs", async (req, res) => {
    const { host } = req.headers;
    res.send(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
          <script type="module" src="//${host}/explorer/rapi-docs/assets/rapidoc-min.js"></script>
        </meta>
        <link href='//${host}/explorer/rapi-docs/custom.css' rel='stylesheet'>
        <title>Rapidoc - MV Data Core</title>
      </head>
      <body>
        <rapi-doc
          ori-spec-url="//${host}/explorer/json?isSystem=false"
          spec-url=""
          persist-auth='true'
          sort-tags='true'
          allow-spec-file-download='true'
          load-fonts='false'
          id='thedoc'
          render-style='view'
          allow-spec-url-load='false'
          allow-spec-file-load='false'
        >
          <div slot="header" style="width:100%; display: flex; justify-content: space-between;">
            <div class="bold large-font">
              Machine Vision Datacore
            </div>
            <div>
              Render Style <select id="cbRenderStyle">
                <option value="view">View</option>
                <option value="read">Read</option>
                <option value="focused">Focused</option>
              </select>
            
              Schema Type <select id="cbSchemaType">
                <option value="false">User Spec</option>
                <option value="true">Sytem Spec</option>
                <option value="all">All Spec</option>
              </select>
            </div>
          </div>
          <div slot="nav-logo" style="width:100%; display: flex; flex-direction:column;">
            <div style="text-align: center; padding: 0 0 12px 0; color:#47AFE8"> Schema Display Style </div>
            <div style="display: flex;justify-content: center; margin: 2px 0">
              <button class='btn small' id="btnSchemaStyleTree">Tree</button>
              <button class='btn small' id="btnSchemaStyleTable">Table</button>
            </div>
    
            <div style="text-align: center; padding: 20px 0 12px 0; color:#47AFE8"> Theme </div>
            <div style="display: flex;justify-content: center; margin: 2px 0">
              <button class='btn small' id="btnThemeDark">Dark</button>
              <button class='btn small' id="btnThemeLight">Light</button>
            </div>
          </div>
          <div slot="logo" style="width:100%; display: flex; justify-content: center;">
            <img src="//${host}/explorer/rapi-docs/logo.png" style="width:25%; height:25%">
          </div>
        </rapi-doc>
      </body>
      <script language="javascript" src="//${host}/explorer/rapi-docs/custom.js"></script>
    </html>`);
    res.end();
  });
};
