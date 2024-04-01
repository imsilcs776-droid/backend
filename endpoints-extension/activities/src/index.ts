import {
  Body,
  Context,
  Endpoint,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@mv-data-core/decorator'
import type { ActivityDTO } from './interfaces'

@Endpoint('activities')
export default class DefineEndpoint {
  @Post(
    { path: '/', tag: 'Activities' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      request: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          icon: {
            type: 'string',
          },
          company: {
            type: 'number',
          },
          plant: {
            type: 'number',
          },
          department: {
            type: 'number',
          },
          business: {
            type: 'number',
          },
          type: {
            type: 'string',
          },
          frequency: {
            type: 'number',
          },
          is_active: {
            type: 'boolean',
          },
        },
      },
    }
  )
  async create(
    @Req() req: any,
    @Context() ctx: any,
    @Body() body: ActivityDTO
  ) {
    const { business } = body
    const {
      services: { ItemsService },
    } = ctx
    const activityService = new ItemsService('activities', {
      schema: req.schema,
      accountability: req.accountability,
    })
    const approvalService = new ItemsService('approvals', {
      schema: req.schema,
      accountability: req.accountability,
    })
    const createdActivityId = await activityService.createOne(body)
    await approvalService.createOne({
      business,
      activity: createdActivityId,
    })
    return {
      success: true,
      message: 'Activity created',
    }
  }

  @Get(
    { path: '/:id', tag: 'Activities' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'number',
          },
          required: true,
        },
      ],
    }
  )
  async detail(@Req() req: any, @Context() ctx: any, @Param('id') id: number) {
    const TYPES: { [entityName: string]: string } = {
      SECTOR: 'sectors',
      PLANT: 'plants',
      DEPARTMENT: 'departments',
      LINE: 'lines',
      PROCESS: 'processes',
      MACHINE: 'machines',
    }
    const {
      services: { ItemsService },
      exceptions: { InvalidQueryException },
    } = ctx

    const activityService = new ItemsService('activities', {
      schema: req.schema,
      accountability: req.accountability,
    })

    const formMapService = new ItemsService('form_maps', {
      schema: req.schema,
      accountability: req.accountability,
    })

    const activities = await activityService.readByQuery({
      fields: [
        '*',
        'business.id',
        'business.name',
        'department.id',
        'department.code',
        'department.name',
        'plant.id',
        'plant.code',
        'plant.name',
        'plant.description',
        'company.id',
        'company.code',
        'company.name',
        'forms.id',
        'forms.forms_id.id',
        'forms.forms_id.code',
        'forms.forms_id.title',
        'forms.forms_id.description',
        'forms.activities_id',
        'template.id',
        'template.name',
      ],
      filter: {
        id: {
          _eq: id,
        },
      },
    })

    if (activities.length === 0)
      throw new InvalidQueryException('Invalid activity id')

    const activity = activities[0]

    let formMaps = await formMapService.readByQuery({
      fields: ['*', 'form.*', 'template.id', 'template.name'],
      filter: {
        form: {
          _in: activity.forms.map((form: any) => form.forms_id?.id),
        },
      },
    })

    const formDependenciesMap = new Map()
    formMaps.forEach((mapItem: any) => {
      formDependenciesMap.set(mapItem.id, mapItem.data.dependencies)
    })

    for (const [key, value] of formDependenciesMap.entries()) {
      let dep = await formMapService.readByQuery({
        fields: ['form.id', 'form.code', 'form.title', 'form.description'],
        filter: {
          id: {
            _in: value,
          },
        },
      })
      formDependenciesMap.set(key, dep)
    }

    let formMapDetail = formMaps.map((mapItem: any) => {
      const { data, ...rest } = mapItem

      return {
        ...rest,
        additional: formDependenciesMap.get(mapItem.id),
      }
    })

    activity.formMaps = formMapDetail

    const zones = []
    if (activity.zones) {
      for (const { type, entity_ids } of activity.zones) {
        const entityName = TYPES[type as string]

        if (entityName) {
          const itemsService = new ItemsService(entityName, {
            schema: req.schema,
            accountability: req.accountability,
          })
          const items = await itemsService.readByQuery({
            fields: ['id', 'name', 'code'],
            filter: {
              id: {
                _in: entity_ids,
              },
            },
          })
          zones.push({
            type,
            entities: items,
          })
        }
      }
    }
    activity.zones = zones

    // activity.approval_id = activity.approvals.length > 0 ? activity.approvals[0] : null;
    delete activity.approvals

    return {
      success: true,
      message: 'Activity detail',
      data: activity,
    }
  }

  @Patch(
    { path: '/bulk', tag: 'Activities' },
    {
      responses: [
        {
          200: {
            description: 'Description',
            responseType: 'object',
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      request: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            // tags: {
            //   type: "array",
            //   items: {
            //     type: "string",
            //   },
            // },
            // icon: {
            //   type: "string",
            // },
            // company: {
            //   type: "number",
            // },
            // plant: {
            //   type: "number",
            // },
            // department: {
            //   type: "number",
            // },
            // business: {
            //   type: "number",
            // },
            // type: {
            //   type: "string",
            // },
            // frequency: {
            //   type: "number",
            // },
            // is_active: {
            //   type: "boolean",
            // },
            dependencies: {
              type: 'array',
              items: {
                type: 'number',
              },
            },
          },
        },
      },
    }
  )
  async bulkUpdate(
    @Req() req: any,
    @Context() ctx: any,
    @Body() bodies: ActivityDTO
  ) {
    const {
      services: { ItemsService },
    } = ctx
    const activityService = new ItemsService('activities', {
      schema: req.schema,
      accountability: req.accountability,
    })

    if (bodies instanceof Array) {
      for (const body of bodies) {
        const { id, dependencies, name, description } = body
        const activityBaseDTO: any = {}

        if (dependencies) activityBaseDTO.dependencies = dependencies
        if (name) activityBaseDTO.name = name
        if (description) activityBaseDTO.description = description

        await activityService.updateOne(id, activityBaseDTO)
      }
      return {
        success: true,
        message: 'Patching activities successfully.',
        data: null,
      }
    } else {
      return {
        success: false,
        message: 'Wrong format.',
        data: null,
      }
    }
  }
}
