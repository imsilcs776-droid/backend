module.exports = function defineHook(
  { filter, action },
  { database, services, schema, exceptions, logger, getSchema }
) {
  const { CollectionsService, ItemsService, FieldsService, RelationsService } =
    services;
  const { InvalidPayloadException } = exceptions;

  filter("forms.items.create", async (payload, meta, context) => {
    const { schema, accountability } = context;

    try {
      const { active_version, versions, code: collection } = payload;

      if (!active_version || !versions || !collection)
        throw new InvalidPayloadException("Payload not valid");

      const activeVersion = versions.find(
        (version) => version.id === active_version
      );

      if (!activeVersion)
        throw new InvalidPayloadException("Active version not found");

      const collectionService = new CollectionsService({
        schema: schema,
        accountability: accountability,
      });

      const fields = [
        {
          field: "id",
          type: "uuid",
          meta: {
            hidden: true,
            readonly: true,
            interface: "input",
            special: ["uuid"],
          },
          schema: {
            is_primary_key: true,
            length: 36,
            has_auto_increment: false,
          },
        },
        {
          field: "created_by",
          type: "uuid",
          meta: {
            special: ["user-created"],
            interface: "select-dropdown-m2o",
            options: {
              template: "{{avatar.$thumbnail}} {{first_name}} {{last_name}}",
            },
            display: "user",
            readonly: true,
            hidden: true,
            width: "half",
          },
          schema: {},
        },
        {
          field: "created_at",
          type: "timestamp",
          meta: {
            special: ["date-created"],
            interface: "datetime",
            readonly: true,
            hidden: true,
            width: "half",
            display: "datetime",
            display_options: { relative: true },
          },
          schema: {},
        },
        {
          field: "updated_by",
          type: "uuid",
          meta: {
            special: ["user-updated"],
            interface: "select-dropdown-m2o",
            options: {
              template: "{{avatar.$thumbnail}} {{first_name}} {{last_name}}",
            },
            display: "user",
            readonly: true,
            hidden: true,
            width: "half",
          },
          schema: {},
        },
        {
          field: "updated_at",
          type: "timestamp",
          meta: {
            special: ["date-updated"],
            interface: "datetime",
            readonly: true,
            hidden: true,
            width: "half",
            display: "datetime",
            display_options: { relative: true },
          },
          schema: {},
        },
        {
          field: "deleted_at",
          type: "timestamp",
          meta: {
            special: ["date-deleted"],
            interface: "datetime",
            readonly: false,
            hidden: true,
            width: "half",
            display: "datetime",
            display_options: { relative: true },
          },
          schema: {},
        },
        {
          field: "submission",
          type: "integer",
          meta: {
            interface: "select-dropdown-m2o",
            special: ["m2o"],
          },
          schema: {},
        },
      ];
      const relations = [
        {
          collection,
          field: "created_by",
          related_collection: "directus_users",
          schema: {},
        },
        {
          collection,
          field: "updated_by",
          related_collection: "directus_users",
          schema: {},
        },
        {
          collection,
          field: "submission",
          related_collection: "submissions",
          meta: {
            sort_field: null,
          },
          schema: {
            on_delete: "SET NULL",
          },
        },
      ];
      const { sections } = activeVersion;
      for (const section of sections) {
        let filteredFields = section.fields.filter(
          (field) =>
            !field.is_duplicate ||
            field.is_duplicate === null ||
            field.is_duplicate === false
        );
        filteredFields = filteredFields.filter((field) => field);
        for (const field of filteredFields) {
          let prop;

          // * NOTE: Generate prop based on identifier
          if (field.identifier == "long-text") {
            prop = {
              field: field.name,
              type: "text",
              schema: {},
              meta: {
                interface: "input-multiline",
                special: null,
                required: field?.properties?.validator?.required || false,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                  clear: true,
                },
              },
            };
            fields.push(prop);
          } else if (
            field.identifier == "range-time" ||
            field.identifier == "range-date" ||
            field.identifier == "date-time-range" ||
            field.identifier == "location-input"
          ) {
            prop = {
              field: field.name,
              type: "json",
              schema: {},
              meta: {
                interface: "input-code",
                special: ["json"],
                required: field?.properties?.validator?.required || false,
              },
            };
            fields.push(prop);
          } else if (field.identifier == "check-box") {
            prop = {
              field: field.name,
              type: "boolean",
              schema: {},
              meta: {
                interface: "boolean",
                special: ["boolean"],
                options: { label: field?.properties?.decorator?.label },
                required: field?.properties?.validator?.required || false,
              },
            };
            fields.push(prop);

            prop = {
              field: `${field.name}_classification`,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: false,
              },
            };
            fields.push(prop);
          } else if (field.identifier == "number") {
            prop = {
              field: field.name,
              type: "float",
              schema: { default_value: "0" },
              meta: {
                interface: "input",
                special: null,
                required: field?.properties?.validator?.required || false,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                  min: field?.properties?.decorator?.min || 0,
                  max: field?.properties?.decorator?.max || 0,
                },
              },
            };
            fields.push(prop);

            prop = {
              field: `${field.name}_classification`,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: false,
              },
            };
            fields.push(prop);
          } else if (
            field.identifier == "timer" ||
            field.identifier == "time-picker"
          ) {
            prop = {
              field: field.name,
              type: "time",
              schema: {},
              meta: {
                interface: "datetime",
                special: null,
                required: field?.properties?.validator?.required || false,
                options: {
                  includeSeconds: false,
                },
              },
            };
            fields.push(prop);

            prop = {
              field: `${field.name}_classification`,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: false,
              },
            };
            fields.push(prop);
          } else if (field.identifier == "date-time-picker") {
            prop = {
              field: field.name,
              type: "datetime",
              schema: {},
              meta: {
                interface: "datetime",
                special: null,
                required: field?.properties?.validator?.required || false,
                options: {
                  includeSeconds: false,
                },
              },
            };
            fields.push(prop);

            prop = {
              field: `${field.name}_classification`,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: false,
              },
            };
            fields.push(prop);
          } else if (field.identifier == "drop-down") {
            prop = {
              field: field.name,
              type: "string",
              schema: {},
              meta: {
                interface: "select-dropdown",
                special: null,
                options: {
                  choices: field?.properties?.decorator?.items || [],
                  allowNone: true,
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: true,
              },
            };
            fields.push(prop);

            prop = {
              field: `${field.name}_classification`,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: false,
              },
            };
            fields.push(prop);
          } else if (field.identifier == "multiple-choice") {
            prop = {
              field: field.name,
              type: "string",
              schema: {},
              meta: {
                interface: "select-radio",
                special: null,
                options: {
                  choices: field?.properties?.decorator?.items || [],
                  allowNone: true,
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: true,
              },
            };
            fields.push(prop);

            prop = {
              field: `${field.name}_classification`,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: false,
              },
            };
            fields.push(prop);
          } else if (field.identifier == "scale-input") {
            prop = {
              field: field.name,
              type: "integer",
              schema: {},
              meta: {
                interface: "slider",
                special: null,
                options: {
                  minValue: field?.properties?.decorator?.min || 0,
                  stepInterval: 1,
                  maxValue: field?.properties?.decorator?.max || 0,
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: field?.properties?.validator?.required || false,
              },
            };
            fields.push(prop);

            prop = {
              field: `${field.name}_classification`,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: false,
              },
            };
            fields.push(prop);
          } else if (field.identifier == "date-picker") {
            prop = {
              field: field.name,
              type: "date",
              schema: {},
              meta: {
                interface: "datetime",
                special: null,
                required: field?.properties?.validator?.required || false,
              },
            };
            fields.push(prop);
          } else if (
            field.identifier == "text" ||
            field.identifier == "collection"
          ) {
            prop = {
              field: field.name,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: field?.properties?.validator?.required || false,
              },
            };
            fields.push(prop);
          } else if (
            field.identifier == "camera-based" ||
            field.identifier == "file-image-upload"
          ) {
            prop = {
              field: field.name,
              type: "uuid",
              schema: {},
              meta: {
                interface: "file",
                special: ["file"],
                required: field?.properties?.validator?.required || false,
              },
            };
            fields.push(prop);
            // relations.push({
            //   collection,
            //   field: field.name,
            //   meta: { sort_field: null },
            //   related_collection: "directus_files",
            //   schema: {
            //     on_delete: "SET NULL",
            //   },
            // });
          } else {
            prop = {
              field: field.name,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: {
                  placeholder: field?.properties?.decorator?.placeholder,
                },
                required: field?.properties?.validator?.required || false,
              },
            };
            fields.push(prop);
          }

          // * NOTE: Check and Generate Unit
          if (field.properties?.unit?.enabled && field.properties?.unit?.name) {
            fields.push({
              field: `${field.name}_unit`,
              type: "integer",
              schema: { default_value: null },
              meta: {
                interface: "input",
              },
            });
          }
        }
      }

      const collectionPayload = {
        collection,
        fields,
        meta: {
          is_soft_delete: true,
          schema: "public",
          is_submission_form: true,
          tags: ["form-builder"],
        },
        schema: {},
      };
      const collectionKey = await collectionService.createOne(
        collectionPayload
      );
      const record = await collectionService.readOne(collectionKey);

      // * NOTE : create relation created by and updated by
      const newSchema = await getSchema({
        accountability: accountability,
      });
      const relationService = new RelationsService({
        schema: newSchema,
        accountability: accountability,
      });
      for (const relation of relations) {
        await relationService.createOne(relation);
      }

      return payload;
    } catch (error) {
      console.log(error);
      throw new InvalidPayloadException(
        error?.message ? error?.message : error
      );
    }
  });

  filter("forms.items.delete", async (payload, meta, context) => {
    const [id] = payload;
    const { schema, accountability } = context;
    const collectionService = new CollectionsService({
      schema,
      database,
      accountability,
    });
    const formService = new ItemsService("forms", {
      schema,
      database,
      accountability,
    });
    const form = await formService.readOne(id);

    const { code: formCode } = form;
    try {
      await collectionService.deleteOne(formCode, {
        deleteds: ["form_versions", "form_sections", "form_fields"],
      });
    } catch (_e) {
      logger.warn(`Collection ${formCode} doesn't exist`);
    }
  });

  action("forms.items.update", async (meta, context) => {
    const { accountability } = context;
    let { schema } = context;

    try {
      // function
      const addField = async (collection, field) => {
        const fieldsService = new FieldsService({
          schema,
          database,
          accountability,
        });
        const res = await fieldsService.createField(collection, field);
        if (
          field.type === "boolean" ||
          field.type === "integer" ||
          field.type === "integer" ||
          field.type === "time" ||
          field.type === "integer" ||
          (field.type === "string" &&
            (field.meta?.interface === "select-dropdown" ||
              field.meta?.interface === "select-radio")) ||
          field.type === "datetime" ||
          field.type === "float"
        ) {
          await fieldsService.createField(collection, {
            field: `${field.field}_classification`,
            type: "string",
            schema: {},
            meta: {
              interface: "input",
              special: null,
              options: {
                placeholder: field?.properties?.decorator?.placeholder,
              },
              required: false,
            },
          });
        }
        schema = await getSchema();
      };
      const updateField = async (collection, field) => {
        const fieldsService = new FieldsService({
          schema,
          database,
          accountability,
        });
        const res = await fieldsService.updateField(collection, field);
        schema = await getSchema();
      };
      const convertField = (collection, field) => {
        const fieldData = {
          prop: null,
          relation: null,
        };
        const propRequired =
          (field.properties.validator && field.properties.validator.required) ||
          false;
        const propPlaceHolder =
          (field.properties.decorator &&
            field.properties.decorator.placeholder) ||
          "";
        const propLabel =
          (field.properties.decorator && field.properties.decorator.label) ||
          "";
        const defaultViewData =
          (field.properties.decorator &&
            field.properties.decorator.defaultView) ||
          null;

        // * NOTE: Generate prop based on identifier
        if (field.identifier == "long-text") {
          fieldData.prop = {
            field: field.name,
            type: "text",
            schema: {},
            meta: {
              interface: "input-multiline",
              special: null,
              required: propRequired,
              options: { placeholder: propPlaceHolder, clear: true },
            },
          };
        } else if (
          field.identifier == "range-time" ||
          field.identifier == "range-date" ||
          field.identifier == "date-time-range" ||
          field.identifier == "location-input"
        ) {
          fieldData.prop = {
            field: field.name,
            type: "json",
            schema: {},
            meta: {
              interface: "input-code",
              special: ["json"],
              required: propRequired,
            },
          };
        } else if (field.identifier == "check-box") {
          fieldData.prop = {
            field: field.name,
            type: "boolean",
            schema: {},
            meta: {
              interface: "boolean",
              special: ["boolean"],
              options: { label: propLabel },
              required: propRequired,
            },
          };
        } else if (field.identifier == "number") {
          fieldData.prop = {
            field: field.name,
            type: "float",
            schema: { default_value: "0" },
            meta: {
              interface: "input",
              special: null,
              required: propRequired,
              options: {
                placeholder: propPlaceHolder,
                min:
                  (field.properties.decorator &&
                    field.properties.decorator.min) ||
                  0,
                max:
                  (field.properties.decorator &&
                    field.properties.decorator.max) ||
                  0,
              },
            },
          };
        } else if (
          field.identifier == "timer" ||
          field.identifier == "time-picker"
        ) {
          fieldData.prop = {
            field: field.name,
            type: "time",
            schema: {},
            meta: {
              interface: "datetime",
              special: null,
              required: propRequired,
              options: {
                includeSeconds: false,
              },
            },
          };
        } else if (field.identifier == "date-time-picker") {
          fieldData.prop = {
            field: field.name,
            type: "datetime",
            schema: {},
            meta: {
              interface: "datetime",
              special: null,
              required: propRequired,
              options: {
                includeSeconds: false,
              },
            },
          };
        } else if (field.identifier == "drop-down") {
          fieldData.prop = {
            field: field.name,
            type: "string",
            schema: {},
            meta: {
              interface: "select-dropdown",
              special: null,
              options: {
                choices:
                  (field.properties.decorator &&
                    field.properties.decorator.items) ||
                  [],
                allowNone: true,
                placeholder: propPlaceHolder,
              },
              required: true,
            },
          };
        } else if (field.identifier == "multiple-choice") {
          fieldData.prop = {
            field: field.name,
            type: "string",
            schema: {},
            meta: {
              interface: "select-radio",
              special: null,
              options: {
                choices:
                  (field.properties.decorator &&
                    field.properties.decorator.items) ||
                  [],
                allowNone: true,
                placeholder: propPlaceHolder,
              },
              required: true,
            },
          };
        } else if (field.identifier == "scale-input") {
          fieldData.prop = {
            field: field.name,
            type: "integer",
            schema: {},
            meta: {
              interface: "slider",
              special: null,
              options: {
                minValue:
                  (field.properties.decorator &&
                    field.properties.decorator.min) ||
                  0,
                stepInterval: 1,
                maxValue:
                  (field.properties.decorator &&
                    field.properties.decorator.max) ||
                  0,
                placeholder: propPlaceHolder,
              },
              required: propRequired,
            },
          };
        } else if (field.identifier == "date-picker") {
          fieldData.prop = {
            field: field.name,
            type: "date",
            schema: {},
            meta: {
              interface: "datetime",
              special: null,
              required: propRequired,
            },
          };
        } else if (
          field.identifier == "text" ||
          field.identifier == "collection"
        ) {
          fieldData.prop = {
            field: field.name,
            type: "string",
            schema: {},
            meta: {
              interface: "input",
              special: null,
              options: { placeholder: propPlaceHolder },
              required: propRequired,
            },
          };
        } else if (
          field.identifier == "camera-based" ||
          field.identifier == "file-image-upload"
        ) {
          fieldData.prop = {
            field: field.name,
            type: "uuid",
            schema: {},
            meta: {
              interface: "file",
              special: ["file"],
              required: propRequired,
            },
          };
          fieldData.relation = {
            collection,
            field: field.name,
            meta: { sort_field: null },
            related_collection: "directus_files",
            schema: {
              on_delete: "SET NULL",
            },
          };
        } else {
          fieldData.prop = {
            field: field.name,
            type: "string",
            schema: {},
            meta: {
              interface: "input",
              special: null,
              options: { placeholder: propPlaceHolder },
              required: propRequired,
            },
          };
        }
        // * Backup Location Input
        // else if (field.identifier == "location-input") {
        //   const defaultView = {
        //     center: {
        //       lng: -80.88293150848199,
        //       lat: 2.842170943040401e-14
        //     },
        //     zoom: -0.3706434003783814,
        //     bearing: 0,
        //     pitch: 0,
        //   };
        //   fieldData.prop = {
        //     field: field.name,
        //     type: "geometry.Point",
        //     schema: {},
        //     meta: {
        //       interface: "map",
        //       special: null,
        //       required: propRequired,
        //       options: {
        //         defaultView: defaultViewData ? defaultViewData : defaultView,
        //         geometryType: "Point",
        //       }
        //     },
        //   };
        // }
        // * Backup POI
        // else if (field.identifier == "poi-input") {
        //   fieldData.prop = {
        //     field: field.name,
        //     type: "geometry.Point",
        //     schema: {},
        //     meta: {
        //       interface: "map",
        //       special: null,
        //       options: {

        //         geometryType: "Point",
        //       }
        //     },
        //   };
        // }
        return fieldData;
      };
      const checkAndGenerateUnit = async (collection, field) => {
        const fieldsService = new FieldsService({
          schema,
          database,
          accountability,
        });
        if (field.properties?.unit?.enabled && field.properties?.unit?.name) {
          const fieldData = await fieldsService.readOne(
            collection,
            `${field.name}_unit`
          );
          if (fieldData.schema === null) {
            await fieldsService.createField(collection, {
              field: `${field.name}_unit`,
              type: "integer",
              schema: { default_value: null },
              meta: {
                interface: "input",
              },
            });
          }
        }
      };

      const { keys: ids } = meta;
      if (ids.length == 1) {
        const formService = new ItemsService("forms", {
          schema,
          database,
          accountability,
        });

        const formFieldService = new ItemsService("form_fields", {
          schema: schema,
          database,
          accountability: accountability,
        });

        const formSectionService = new ItemsService("form_sections", {
          schema: schema,
          accountability: accountability,
        });

        const fieldService = new FieldsService({
          schema,
          database,
          accountability,
        });

        const form = await formService.readOne(ids[0], {
          fields: [
            "*",
            "versions.*",
            "versions.sections.*",
            "versions.sections.fields.*",
          ],
        });

        let formFields = form.versions
          .map((version) =>
            version.sections.map((section) =>
              section.fields.map((field) => {
                if (
                  !field.is_duplicate ||
                  field.is_duplicate === null ||
                  field.is_duplicate === false
                )
                  return field;
              })
            )
          )
          .flat(2);

        formFields = formFields.filter((formField) => formField);

        const { active_version, versions, code: collection } = meta.payload;
        const currentFields = await fieldService.readAll(collection);
        const currentFieldsMap = {};
        const notIncludedFields = [
          "id",
          "created_at",
          "updated_at",
          "deleted_at",
          "created_by",
          "updated_by",
        ];
        for (const field of currentFields) {
          if (!notIncludedFields.includes(field.field))
            currentFieldsMap[field.field] = field;
        }

        if (!active_version || !versions || !collection)
          throw new InvalidPayloadException("Payload not valid");

        const activeVersion = versions.find(
          (version) => version.id === active_version
        );

        if (!activeVersion) {
          throw new InvalidPayloadException("Active version not found");
        } else {
          const fields = [];
          const relations = [
            {
              collection,
              field: "created_by",
              related_collection: "directus_users",
              schema: {},
            },
            {
              collection,
              field: "updated_by",
              related_collection: "directus_users",
              schema: {},
            },
          ];

          const activeField = {};
          const additionalField = {};
          for (const field of formFields) {
            const fieldData = convertField(collection, field);
            if (!currentFieldsMap[field.name]) {
              if (fieldData.prop) {
                if (!additionalField[field.name])
                  additionalField[field.name] = fieldData.prop;

                if (fieldData.relation) relations.push(fieldData.relation);

                await checkAndGenerateUnit(collection, field);
              }
            } else {
              // * Note: update existing field
              if (fieldData.prop) {
                await updateField(collection, fieldData.prop);
              }

              // * Note: keep classification field
              if (
                fieldData.prop.type === "boolean" ||
                fieldData.prop.type === "integer" ||
                fieldData.prop.type === "integer" ||
                fieldData.prop.type === "time" ||
                fieldData.prop.type === "integer" ||
                (fieldData.prop.type === "string" &&
                  (fieldData.prop.meta?.interface === "select-dropdown" ||
                    fieldData.prop.meta?.interface === "select-radio")) ||
                fieldData.prop.type === "datetime"
              ) {
                if (!activeField[`${field.name}_classification`])
                  activeField[`${field.name}_classification`] = 1;
                else
                  activeField[`${field.name}_classification`] =
                    activeField[`${field.name}_classification`] + 1;
              }
              if (!activeField[field.name]) activeField[field.name] = 1;
              else activeField[field.name] = activeField[field.name] + 1;

              // * Note: keep unit field
              if (
                field.properties?.unit?.enabled &&
                field.properties?.unit?.name
              ) {
                activeField[`${field.name}_unit`] =
                  activeField[`${field.name}_unit`] ?? 1;
                await checkAndGenerateUnit(collection, field);
              }
            }
          }
          activeField["submission"] = 1;

          // * NOTE: Add New Fields
          for (const fieldName of Object.keys(additionalField)) {
            await addField(collection, additionalField[fieldName]);
          }

          // * NOTE: Delete Fields
          for (const field in currentFieldsMap) {
            if (!activeField[field]) {
              await fieldService.deleteField(collection, field);
              schema = await getSchema();
            }
          }

          await formSectionService.deleteByQuery({
            filter: {
              version: { _null: true },
            },
          });

          // TODO: Fix this code, because return error 'reference constraint'
          // await formFieldService.deleteByQuery({
          //   filter: {
          //     section: { _null: true },
          //     version: { _null: true },
          //   }
          // });

          return meta.payload;
        }
      }
    } catch (error) {
      console.log(error);
      throw new InvalidPayloadException(
        error?.message ? error?.message : error
      );
    }
  });
};
