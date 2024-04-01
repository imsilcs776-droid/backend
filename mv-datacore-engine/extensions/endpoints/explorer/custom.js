document.addEventListener("DOMContentLoaded", function () {
  const ls = localStorage.getItem("setting-rapidoc") || "{}";
  const setting = JSON.parse(ls);
  const loadConfig = () => {
    setting.theme = typeof setting.theme === "string" ? setting.theme : "dark";
    document.getElementById("thedoc").setAttribute("theme", setting.theme);
    setting.schemaStyle = typeof setting.schemaStyle === "string" ? setting.schemaStyle : "tree";
    document.getElementById("thedoc").setAttribute("schema-style", setting.schemaStyle);
    setting.renderStyle = typeof setting.renderStyle === "string" ? setting.renderStyle : "view";
    document.getElementById("thedoc").setAttribute("render-style", setting.renderStyle);
    document.getElementById("cbRenderStyle").value = setting.renderStyle;
    setting.renderStyle = typeof setting.renderStyle === "string" ? setting.renderStyle : "view";
    document.getElementById("thedoc").setAttribute("render-style", setting.renderStyle);
    document.getElementById("cbRenderStyle").value = setting.renderStyle;
    const currentSpecUrl = document.getElementById("thedoc").getAttribute("ori-spec-url");
    const arrCurrentSpecUrl = currentSpecUrl.split("?");
    setting.schemaType = typeof setting.schemaType === "string" ? setting.schemaType : "false";
    let specUrl = arrCurrentSpecUrl[0];
    if (setting.schemaType === "true") {
      specUrl += "?isSystem=true";
    } else if (setting.schemaType === "false") {
      specUrl += "?isSystem=false";
    }
    document.getElementById("thedoc").setAttribute("spec-url", specUrl);
  };
  loadConfig();
  const saveConfig = (data) => {
    localStorage.setItem("setting-rapidoc", JSON.stringify(data));
  };
  document.getElementById("btnSchemaStyleTree").addEventListener("click", function () {
    document.getElementById("thedoc").setAttribute("schema-style", "tree");
    setting.schemaStyle = "tree";
    saveConfig(setting);
  });
  document.getElementById("btnSchemaStyleTable").addEventListener("click", function () {
    document.getElementById("thedoc").setAttribute("schema-style", "table");
    setting.schemaStyle = "table";
    saveConfig(setting);
  });
  document.getElementById("btnThemeDark").addEventListener("click", function () {
    document.getElementById("thedoc").setAttribute("theme", "dark");
    setting.theme = "dark";
    saveConfig(setting);
  });
  document.getElementById("btnThemeLight").addEventListener("click", function () {
    document.getElementById("thedoc").setAttribute("theme", "light");
    setting.theme = "light";
    saveConfig(setting);
  });
  document.getElementById("cbRenderStyle").addEventListener("change", function () {
    const value = this.value;
    document.getElementById("thedoc").setAttribute("render-style", value);
    setting.renderStyle = value;
    saveConfig(setting);
  });
  document.getElementById("cbSchemaType").addEventListener("change", function () {
    const currentSpecUrl = document.getElementById("thedoc").getAttribute("spec-url");
    const arrCurrentSpecUrl = currentSpecUrl.split("?");
    const value = this.value;
    let specUrl = arrCurrentSpecUrl[0];
    if (value === "true") {
      specUrl += "?isSystem=true";
    } else if (value === "false") {
      specUrl += "?isSystem=false";
    }
    document.getElementById("thedoc").setAttribute("spec-url", specUrl);
    setting.schemaType = value;
    saveConfig(setting);
  });
});
