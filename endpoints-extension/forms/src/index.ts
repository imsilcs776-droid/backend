import { Body, Context, Endpoint, Patch, Post, Req } from "@mv-data-core/decorator";
import { IDirectusField, IDirectusRelation } from "./interfaces";
import type { IForm, FormMapDTO } from "./interfaces";

@Endpoint("forms")
export default class DefineEndpoint {
  @Post(
    { path: "/", tag: "Forms" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                msg: {
                  type: "string",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
      },
    }
  )
  async create(@Body() body: IForm, @Context() ctx: any, @Req() req: any) {
    const {
      exceptions: { InvalidPayloadException },
      services: { CollectionsService, RelationsService, ItemsService },
      getSchema,
    } = ctx;
    
    try {
      const { active_version, versions, code: collection } = body;

      if (!active_version || !versions || !collection) throw new InvalidPayloadException("Payload not valid");

      const activeVersion = versions.find((version) => version.id === active_version);

      if (!activeVersion) throw new InvalidPayloadException("Active version not found");

      const collectionService = new CollectionsService({
        schema: req.schema,
        accountability: req.accountability,
      });

      const formService = new ItemsService("forms", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const fields: IDirectusField[] = [
        {
          field: "id",
          type: "uuid",
          meta: { hidden: true, readonly: true, interface: "input", special: ["uuid"] },
          schema: { is_primary_key: true, length: 36, has_auto_increment: false },
        },
        {
          field: "created_by",
          type: "uuid",
          meta: {
            special: ["user-created"],
            interface: "select-dropdown-m2o",
            options: { template: "{{avatar.$thumbnail}} {{first_name}} {{last_name}}" },
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
            options: { template: "{{avatar.$thumbnail}} {{first_name}} {{last_name}}" },
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
      ];
      const relations: IDirectusRelation[] = [
        { collection, field: "created_by", related_collection: "directus_users", schema: {} },
        { collection, field: "updated_by", related_collection: "directus_users", schema: {} },
      ];
      const { sections } = activeVersion;
      for (const section of sections) {
        for (const field of section.fields) {
          let prop: IDirectusField;
          if (field.identifier == "long-text") {
            prop = {
              field: field.name,
              type: "text",
              schema: {},
              meta: {
                interface: "input-multiline",
                special: null,
                required: field?.properties?.validator?.required || false,
                options: { placeholder: field?.properties?.decorator?.placeholder, clear: true },
              },
            };
            fields.push(prop);
          } else if (field.identifier == "range-time" || field.identifier == "range-date" || field.identifier == "date-time-range") {
            prop = {
              field: field.name,
              type: "json",
              schema: {},
              meta: { interface: "input-code", special: ["json"], required: field?.properties?.validator?.required || false },
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
          } else if (field.identifier == "number") {
            prop = {
              field: field.name,
              type: "integer",
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
          } else if (field.identifier == "timer" || field.identifier == "time-picker") {
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
          } else if (field.identifier == "text") {
            prop = {
              field: field.name,
              type: "string",
              schema: {},
              meta: {
                interface: "input",
                special: null,
                options: { placeholder: field?.properties?.decorator?.placeholder },
                required: field?.properties?.validator?.required || false,
              },
            };
            fields.push(prop);
          } else if (field.identifier == "camera-based" || field.identifier == "file-image-upload") {
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
            relations.push({
              collection,
              field: field.name,
              meta: { sort_field: null },
              related_collection: "directus_files",
              schema: {
                on_delete: "SET NULL",
              },
            });
          }
        }
      }

      const collectionPayload = {
        collection,
        fields,
        meta: { is_soft_delete: true, schema: "submission" },
        schema: {},
      };
      const collectionKey = await collectionService.createOne(collectionPayload);
      const record = await collectionService.readOne(collectionKey);

      // create relation created by and updated by
      const newSchema = await getSchema({
        accountability: req.accountability,
      });
      const relationService = new RelationsService({
        schema: newSchema,
        accountability: req.accountability,
      });
      for (const relation of relations) {
        await relationService.createOne(relation);
      }

      await formService.createOne(body);

      return {
        data: record,
      };
    } catch (error: any) {
      return { success: false, message: error?.message ?? error }; 
    }
  }


  @Patch(
    { path: "/bulk", tag: "Forms" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                message: {
                  type: "string",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "number",
            },
            dependencies: {
              type: "array",
              items: {
                type: "number",
              },
            },
          },
        }
      },
    }
  )
  async bulkUpdate(@Req() req: any, @Context() ctx: any, @Body() body: FormMapDTO) {
    const {
      services: { ItemsService },
    } = ctx;
    const formMapService = new ItemsService("form_maps", {
      schema: req.schema,
      accountability: req.accountability,
    });

    if (body instanceof Array) {
      for (const item of body) {
        const formMapUpdateData = {
          data: {
            dependencies: item.dependencies
          }
        }

        await formMapService.updateOne(item.id, formMapUpdateData);
      }
      return {
        success: true,
        message: 'Patching activities successfully.',
        data: null,
      };
    } else {
      return {
        success: false,
        message: 'Wrong format.',
        data: null,
      };
    }
  }
}
