import { Body, Context, Delete, Endpoint, Get, Param, Patch, Post, Query, Req, Res } from "@mv-data-core/decorator";
import { ApiExtensionContext, Filter } from "@mv-data-core/shared/types";
import axios from "axios";

interface IBody {
  collection_name: string;
  ids: number[];
  payload: any;
}

const nameNormalizaion = (name: string) => {
  if (/^\d/.test(name)) {
    return `Normalized-${name}`
  }
  return name
}

@Endpoint("datacore/entities")
export default class DefineEndpoint {
  @Get(
    { path: "", tag: "Datacore Entity", description: "To Get list items of collection" },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "collection_name",
          in: "query",
          description: "Collection Name",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
    }
  )
  async gets(@Req() req: any, @Context() context: ApiExtensionContext, @Query("collection_name") collectionName: string) {
    const {
      services: { ItemsService, MetaService },
      exceptions: { InvalidPayloadException, InvalidQueryException },
    } = context;

    if (!collectionName) throw new InvalidQueryException("Collection Name is Required");

    const collectionService = new ItemsService(collectionName, {
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      const datas = await collectionService.readByQuery(req.sanitizedQuery);
      const metaService = new MetaService({
        accountability: req.accountability,
        schema: req.schema,
      });
      const meta = await metaService.getMetaForQuery(collectionName, req.sanitizedQuery);
      return {
        success: true,
        data: datas,
        meta: {
          ...meta,
          collectionName
        }
      };
    } catch (_e) {
      console.log(_e)
      throw new InvalidPayloadException(`Failed to get data`);
    }
  }

  @Patch(
    { path: "", tag: "Datacore Entity", description: "To Update item/s of collection" },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
                data: {
                  type: "array",
                  items: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          collection_name: {
            type: "string",
          },
          ids: {
            type: "array",
            items: {
              type: "number",
            },
          },
          payload: {
            type: "object",
          },
        },
      },
    }
  )
  async update(@Req() req: any, @Context() context: ApiExtensionContext, @Body() bodies: IBody) {
    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException },
    } = context;

    const { collection_name: collectionName, ids, payload } = bodies;

    if (!collectionName) throw new InvalidPayloadException("Collection Name is Required");
    if (!ids) throw new InvalidPayloadException("Ids is Required");
    if (!payload) throw new InvalidPayloadException("Payload is Required");

    const collectionService = new ItemsService(collectionName, {
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      const results = await collectionService.updateMany(ids, payload);
      const meta = {
        collectionName
      }
      return {
        success: true,
        data: results,
        meta
      };
    } catch (_e) {
      throw new InvalidPayloadException(`Failed to update data`);
    }
  }

  @Post(
    { path: "", tag: "Datacore Entity", description: "To Create item/s of collection" },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          collection_name: {
            type: "string",
          },
          payload: {
            type: "object",
          },
        },
      },
    }
  )
  async create(@Req() req: any, @Context() context: ApiExtensionContext, @Body() bodies: IBody) {
    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException },
    } = context;

    const { collection_name: collectionName, payload } = bodies;

    if (!collectionName) throw new InvalidPayloadException("Collection Name is Required");
    if (!payload) throw new InvalidPayloadException("Payload is Required");

    const collectionService = new ItemsService(collectionName, {
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      let results;
      if (Array.isArray(payload)) {
        results = await collectionService.createMany(payload);
      } else {
        results = await collectionService.createOne(payload);
      }
      const meta = {
        collectionName
      }
      return {
        success: true,
        data: results,
        meta
      };
    } catch (_e) {
      throw new InvalidPayloadException(`Failed to create data`);
    }
  }

  @Delete(
    { path: "", tag: "Datacore Entity", description: "To Delete item/s of collection" },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          collection_name: {
            type: "string",
          },
          ids: {
            type: "array",
            items: {
              type: "number",
            },
          },
        },
      },
    }
  )
  async delete(@Req() req: any, @Context() context: ApiExtensionContext, @Body() bodies: IBody) {
    const {
      services: { ItemsService },
      exceptions: { InvalidPayloadException },
    } = context;

    const { collection_name: collectionName, ids } = bodies;

    if (!collectionName) throw new InvalidPayloadException("Collection Name is Required");
    if (!ids) throw new InvalidPayloadException("Ids is Required");

    const collectionService = new ItemsService(collectionName, {
      schema: req.schema,
      accountability: req.accountability,
    });

    try {
      let results = await collectionService.deleteMany(ids);
      const meta = {
        collectionName
      }
      return {
        success: true,
        data: results,
        meta
      };
    } catch (_e) {
      throw new InvalidPayloadException(`Failed to delete data`);
    }
  }

  @Get(
    { path: "/mermaid-erd/collection/:collectionName", tag: "Datacore Entity", description: "To Get Mermaid Erd by collection" },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "collectionName",
          in: "path",
          description: "Collection Name",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          name: "lineColor",
          in: "query",
          description: "The color of line",
          schema: {
            type: "string",
          },
        },
      ],
    }
  )
  async getERDbyCollection(
    @Res() res: any,
    @Context() context: ApiExtensionContext,
    @Param("collectionName") collectionName: string,
    @Query("lineColor") lineColor: string
  ) {
    const {
      services: { CollectionsService, FieldsService, RelationsService, ItemsService },
      exceptions: { InvalidQueryException, ServiceUnavailableException },
      getSchema,
      env,
    } = context;

    const { KROKI_SERVER } = env;

    if (!lineColor) lineColor = "white"

    if (!KROKI_SERVER) throw new ServiceUnavailableException("Kroki Server unavailable");

    if (!collectionName) throw new InvalidQueryException("Collection Name is Required");

    const schema = await getSchema();

    const collectionService = new CollectionsService({
      schema,
    });

    const fieldService = new FieldsService({
      schema,
    });

    const relationService = new RelationsService({
      schema,
    });

    const fields = await fieldService.readAll();

    const relations = await relationService.readByQuery({
      includeSystemTable: false,
      includeUndefinedMeta: false,
      query: {
        filter: {
          _or: [
            {
              one_collection: {
                _eq: collectionName,
              },
            },
            {
              many_collection: {
                _eq: collectionName,
              },
            },
          ],
        },
      },
    });

    const relatedCollections: string[] = [];

    for (const relation of relations) {
      if (relation.collection && relation.related_collection) {
        relatedCollections.push(relation.collection);
        relatedCollections.push(relation.related_collection);
      }
    }

    const collections = await collectionService.readByQuery({
      includeExternalTable: false,
      includeSystemTable: false,
      query: {
        filter: {
          collection: {
            _in: relatedCollections,
          },
        },
      },
    });

    const collectionFields: any = {};

    let result = `%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ff0000', 'lineColor': '${lineColor}'}}}%%\nerDiagram\n`;

    for (const collection of collections) {
      collectionFields[collection.collection] = [];
    }

    const collectionRelations: any = {};
    for (const relation of relations) {
      if (collectionFields[relation.collection] && collectionFields[relation.related_collection]) {
        const foreignKeyColumn = relation.schema.foreign_key_column;
        const column = relation.schema.column;
        if (!collectionRelations[relation.collection]) collectionRelations[relation.collection] = [];
        collectionRelations[relation.collection].push({
          one: relation.related_collection,
          many: relation.collection,
          foreignKeyColumn,
          column,
        });
      }
    }

    for (const field of fields) {
      const isPrimaryKey = field?.schema?.is_primary_key;
      let result = `${field.type}\t${nameNormalizaion(field.field)}`;
      const relationConfig = collectionRelations[field.collection] || [];
      const currentColumnRelation = relationConfig.find(
        (relation: { many: string; column: string }) => relation.many == field.collection && relation.column == field.field
      );
      if (isPrimaryKey) result += `\tPK`;
      if (currentColumnRelation) result += `\tFK`;
      if (collectionFields[field.collection]) collectionFields[field.collection].push(result);
    }

    for (const collectionName in collectionFields) {
      const fieldConfig = collectionFields[collectionName];
      const relationConfig = collectionRelations[collectionName] || [];

      result += `
        ${nameNormalizaion(collectionName)} {
          ${fieldConfig.join("\n\t\t\t")}
        }
      `;

      for (const relation of relationConfig) {
        result += `
      ${nameNormalizaion(relation.one)} o{--|| ${nameNormalizaion(relation.many)} : "${relation.one}.${relation.foreignKeyColumn} <--> ${relation.many}.${relation.column}"
      `;
      }
    }

    
    try {
      const { data: svg } = await axios.post(`${KROKI_SERVER}/mermaid/svg`, {
        diagram_source: result,
      });
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(svg);
      return res.end();
    } catch (_e) {
      console.log([_e]);
      throw new ServiceUnavailableException("Failed connect to Kroki Server");
    }
  }

  @Get(
    { path: "/:collectionName/related", tag: "Datacore Entity", description: "To Get Related Collection" },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "collectionName",
          in: "path",
          description: "Collection Name",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
    }
  )
  async getRelatedCollection(
    @Context() context: ApiExtensionContext,
    @Param("collectionName") collectionName: string,
  ) {
    const {
      services: { RelationsService },
      exceptions: { InvalidQueryException },
      getSchema,
    } = context;

    if (!collectionName) throw new InvalidQueryException("Collection Name is Required");

    const schema = await getSchema();

    const relationService = new RelationsService({
      schema,
    });

    const relations = await relationService.readByQuery({
      includeSystemTable: false,
      includeUndefinedMeta: false,
      query: {
        filter: {
          _or: [
            {
              one_collection: {
                _eq: collectionName,
              },
            },
            {
              many_collection: {
                _eq: collectionName,
              },
            },
          ],
        },
      },
    });

    const relatedCollections: string[] = [];

    for (const relation of relations) {
      if (relation.collection && relation.related_collection) {
        if (relation.collection != collectionName) relatedCollections.push(relation.collection);
        if (relation.related_collection != collectionName) relatedCollections.push(relation.related_collection);
      }
    }

    return {
      success: true,
      data: [...new Set(relatedCollections)]
    }
  }

  @Get(
    { path: "/mermaid-erd/schema/:schemaName", tag: "Datacore Entity", description: "To Get Mermaid Erd by schema" },
    {
      responses: [
        {
          200: {
            description: "Response of test connection",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          name: "schemaName",
          in: "path",
          description: "Schema Name",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          name: "lineColor",
          in: "query",
          description: "The color of line",
          schema: {
            type: "string",
          },
        },
        {
          name: "credentialId",
          in: "query",
          description: "credential id",
          schema: {
            type: "number",
          },
        },
      ],
    }
  )
  async getERDbySchema(
    @Res() res: any,
    @Context() context: ApiExtensionContext,
    @Param("schemaName") schemaName: string,
    @Query("lineColor") lineColor: string,
    @Query("credentialId") credentialId: number,
  ) {
    const {
      services: { CollectionsService, FieldsService, RelationsService },
      exceptions: { InvalidQueryException, ServiceUnavailableException },
      getSchema,
      env,
    } = context;

    const { KROKI_SERVER } = env;

    if (!lineColor) lineColor = "white"

    if (!KROKI_SERVER) throw new ServiceUnavailableException("Kroki Server unavailable");

    if (!schemaName) throw new InvalidQueryException("Schema Name is Required");

    const schema = await getSchema();

    const collectionService = new CollectionsService({
      schema,
    });

    const fieldService = new FieldsService({
      schema,
    });

    const relationService = new RelationsService({
      schema,
    });

    const fields = await fieldService.readAll();

    const filter: Filter = {
      schema: {
        _eq: schemaName
      }
    }

    if (credentialId) {
      filter.credential = {
        _eq: credentialId
      }
    }

    const collections = await collectionService.readByQuery({
      includeExternalTable: false,
      includeSystemTable: false,
      query: {
        filter
      },
    });
    const relations = await relationService.readByQuery({
      includeSystemTable: true,
      includeUndefinedMeta: false,
    });

    const collectionFields: any = {};

    let result = `%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ff0000', 'lineColor': '${lineColor}'}}}%%\nerDiagram\n`;

    for (const collection of collections) {
      collectionFields[collection.collection] = [];
    }

    const collectionRelations: any = {};
    for (const relation of relations) {
      if (collectionFields[relation.collection] && collectionFields[relation.related_collection]) {
        const foreignKeyColumn = relation.schema.foreign_key_column;
        const column = relation.schema.column;
        if (!collectionRelations[relation.collection]) collectionRelations[relation.collection] = [];
        collectionRelations[relation.collection].push({
          one: relation.related_collection,
          many: relation.collection,
          foreignKeyColumn,
          column,
        });
      }
    }

    for (const field of fields) {
      const isPrimaryKey = field?.schema?.is_primary_key;
      let result = `${field.type}\t${field.field}`;
      const relationConfig = collectionRelations[field.collection] || [];
      const currentColumnRelation = relationConfig.find(
        (relation: { many: string; column: string }) => relation.many == field.collection && relation.column == field.field
      );
      if (isPrimaryKey) result += `\tPK`;
      if (currentColumnRelation) result += `\tFK`;
      if (collectionFields[field.collection]) collectionFields[field.collection].push(result);
    }

    for (const collectionName in collectionFields) {
      const fieldConfig = collectionFields[collectionName];
      const relationConfig = collectionRelations[collectionName] || [];

      result += `
        ${collectionName} {
          ${fieldConfig.join("\n\t\t\t")}
        }
      `;

      for (const relation of relationConfig) {
        result += `
      ${relation.one} o{--|| ${relation.many} : "${relation.one}.${relation.foreignKeyColumn} <--> ${relation.many}.${relation.column}"
      `;
      }
    }

    try {
      const { data: svg } = await axios.post(`${KROKI_SERVER}/mermaid/svg`, {
        diagram_source: result,
      });
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(svg);
      return res.end();
    } catch (_e) {
      console.log([_e]);
      throw new ServiceUnavailableException("Failed connect to Kroki Server");
    }
  }
}
