import * as fs from 'fs';

export class CronTaskHelper {
    private cronTaskService: any;
		private cronTaskLogService: any;
		private productService: any;
		private companyService: any;
		private flowService: any;
		private flowMapService: any;
		private activityService: any;

		private SUFFIX = 'crontask';
  
    constructor(
      cronTaskService: any,
			cronTaskLogService: any,
			productService: any,
			companyService: any,
			flowService: any,
			flowMapService: any,
			activityService: any,
    ) {
      this.cronTaskService = cronTaskService;
			this.cronTaskLogService = cronTaskLogService;
			this.productService = productService;
			this.companyService = companyService;
			this.flowService = flowService;
			this.flowMapService = flowMapService;
			this.activityService = activityService;
    }
  
    public async addCronJob(cronId: string, properties: any) {
			const { company, hour, minute } = properties;
			// const job = new CronJob(`${minute} ${hour} * * * *`, async () => {
			// 	await this.cronTaskService.populateTask({
			// 		cronId,
			// 		companyId: company,
			// 		isManual: false
			// 	});
			// });
	
			// this.taskSchedulerService.getSchedulerRegister().addCronJob(`${cronId}#${SUFFIX}`, job);
			// job.start();

			await this.initTask({
				cronId,
				companyId: company,
				isManual: false,
				hour,
				minute,
			});
	
			// this.logger.warn(`job ${cronId}#${SUFFIX} added!`);
			console.log(`job ${cronId}#${this.SUFFIX} added!`);
		}

		public async initTask(properties: any) {
			const { cronId, companyId, isManual, hour, minute } = properties;
			const dirName = `${this.SUFFIX}-${cronId}`;
			fs.readFile('./templates/index.js', 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
        // const val = 1;
        let result = data.replace(/-cronId/g, `${cronId}`);
        result = result.replace(/-companyId/g, `${companyId}`);
        result = result.replace(/-isManual/g, `${isManual}`);
        // result = result.replace(/-userId/g, "null");
				result = result.replace(/-hour/g, `${hour}`);
				result = result.replace(/-minute/g, `${minute}`);
        
        fs.mkdirSync(`./extensions/hooks/${dirName}`)

        fs.writeFile(`./extensions/hooks/${dirName}/index.js`, result, 'utf8', function (err) {
           if (err) return console.log(err);
        });
      });
		}

		public async populateTask(properties: any) {
			const { cronId, companyId, isManual, userId }: any = properties ? properties : {};
			const cronTaskLogBaseDTO: any = {};
			cronTaskLogBaseDTO.company = companyId;
			cronTaskLogBaseDTO.reference = cronId ? cronId : null;
			cronTaskLogBaseDTO.is_manual = isManual ? isManual : false;
			cronTaskLogBaseDTO.start_date = new Date();
			cronTaskLogBaseDTO.created_by = isManual ? userId : 0;

			let product: any = null;
			const products = await this.productService.readByQuery({ filter: { code: { _eq: 'MES' } } });
			[product] = products;

			await this.populateDeleteFlow(companyId, product);
			await this.populateUpdateFlow(companyId, product);
			
			cronTaskLogBaseDTO.end_date = new Date();
			return await this.cronTaskLogService.createOne(cronTaskLogBaseDTO);
		}

		private async populateDeleteFlow(companyId: any, product?: any) {
			let flowMaps: any = [];
			let flowIds: any = [];
			// const { data: flows }: any = await this.flowService.findAll({
			// 	message: {
			// 		query: {
			// 			isDeleted: true,
			// 			companyId,
			// 			productId: (product) ? product.id : 0
			// 		},
			// 	},
			// });

			const flows = await this.flowService.readByQuery({});
	
			if (flows.length > 0) {
				flowIds = flows.map((flow: any) => flow.id);
				flowMaps = await this.flowMapService.readByQuery({
					filter: {
						flow: { _in: flowIds },
					},
				});
			}
	
			if (flowIds.length > 0) {
				// const { data: activities } = await this.activityService.findAll({
				// 	deletedAt: null,
				// 	companyId: Number(companyId),
				// 	$or: [
				// 		{ 'flows.id': { $in: flowIds } },
				// 	],
				// }, {
				// 	isTransform: false
				// });
				const activities = await this.activityService.readByQuery({});
	
				for (const activity of activities) {
					const activityBaseDTO: any = {};
					const [flow] = activity.flows.filter((flow: any) =>
						flowIds.includes(flow.id),
					);
					if (flow) {
						activityBaseDTO.flows = activity.flows.filter(
							(flow: any) => !flowIds.includes(flow.id),
						).map((flow: any) => ({ flow: { id: flow.id } }));
						activityBaseDTO.nodes = [];
						activityBaseDTO.connectors = [];
						await this.activityService.updateOne(activity.id, activityBaseDTO);
	
						for (const flowMap of flowMaps.filter(
							(dt: any) => String(dt.activityId) == String(activity._id),
						)) {
							const flowMapBaseDTO: any = {};
							flowMapBaseDTO.data = {
								...flowMap.data,
								dependencies: [],
							};
							// await this.flowMapService.update(flowMap.id, flowMapBaseDTO);
							await this.flowMapService.updateOne(flowMap.id, flowMapBaseDTO);
						}
					}
				}
			}
		}
	
		private async populateUpdateFlow(companyId: any, product?: any) {
			// const { data: flows }: any = await this.flowService.findAll({
			// 	message: {
			// 		query: {
			// 			companyId,
			// 			productId: (product) ? product.id : 0
			// 		},
			// 	},
			// });
			const flows = await this.flowService.readByQuery({});
	
			if (flows.length > 0) {
				// const { data: activities } = await this.activityService.findAll({
				// 	deletedAt: null,
				// 	companyId: Number(companyId),
				// 	'flows.id': { $in: flows.map(dt => dt.id) },
				// }, {
				// 	isTransform: false
				// });
				const activities = await this.activityService.readByQuery({});
	
				for (const activity of activities) {
					const activityBaseDTO: any = {};
					// activityBaseDTO.flows = flows.filter((flow: any) => {
					// 	const [filterActFlow] = activity.flows.filter((item: any) => item.id == flow.id);
					// 	return filterActFlow ? true : false;
					// }).map((flow: any) => {
					// 	const [filterActFlow] = activity.flows.filter(dt => dt.id == flow.id);
					// 	return {
					// 		id: flow.id,
					// 		forms: flow.forms.map((form) => {
					// 			const [filterActForm] = (filterActFlow) ? filterActFlow.forms.filter(dt => dt.id == form.id) : [];
					// 			if (filterActForm) {
					// 				return {
					// 					...filterActForm
					// 				}
					// 			} else {
					// 				return {
					// 					id: form.id,
					// 					templateId: null,
					// 					period: {
					// 						every: null,
					// 						unit: null,
					// 						times: null
					// 					}
					// 				}
					// 			}
					// 		})
					// 	}
					// });
					activityBaseDTO.flows = flows.filter((flow: any) => {
						const [filterActFlow] = activity.flows.filter((item: any) => item.id === flow.id);
						return filterActFlow ? true : false;
					}).map((flow: any) => ({ flow: { id: flow.id } }))
					
					await this.activityService.updateOne(activity.id, activityBaseDTO);
				}
			}
		}

		public async deleteTask(id: number) {
			try {
				const dirName = `${this.SUFFIX}-${id}`;
				fs.rmSync(`./extensions/hooks/${dirName}`, { recursive: true, force: true });

				return { success: true, message: "Successfully Delete Cron Task!" }
			} catch (error: any) {
				console.log(error);
				return { success: false, message: error.message ? error.message : error };
			}
		}
  }