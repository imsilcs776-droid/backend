module.exports = function defineHook({ schedule, action }, { database }) {
	schedule('* -minute -hour * * *', async () => {
		// const { cronId, companyId, isManual, userId }: any = properties ? properties : {};
		const cronId = -cronId;
		const companyId = -companyId;
		const isManual = -isManual;
		const userId = -userId;
    const cronTaskLogBaseDTO = {};
    cronTaskLogBaseDTO.company = companyId;
    cronTaskLogBaseDTO.reference = cronId ? cronId : null;
    cronTaskLogBaseDTO.is_manual = isManual ? isManual : false;
    cronTaskLogBaseDTO.start_date = new Date();
    cronTaskLogBaseDTO.created_by = isManual ? userId : 0;

		let flowMaps = [];
    let flowIds = [];
		const flows = await database('flows').select('*');

    if (flows.length > 0) {
      flowIds = flows.map((flow) => flow.id);
			flowMaps = await database('flow_maps').select('*');
    }

    if (flowIds.length > 0) {
			let activities = await database('activities as a')
				.leftJoin('activities_flows as af', 'af.activity', 'a.id')
				.leftJoin('flows as f', 'f.id', 'af.flow')
				.select(
					'a.id',
					'a.name',
					'f.id as flowId',
					'f.name as flowName',
				);

			const processedActivities = [];

			activities.map((act) => {
				const findAct = processedActivities.find((pact) => pact.id === act.id);
				if (findAct) {
					processedActivities.flows.push({ id: act.flowId, name: act.flowName });
				} else {
					const flowLists = [];
					if (act.flowId || act.flowName) flowLists.push({ id: act.flowId, name: act.flowName });
					processedActivities.push({ ...act, flows: flowLists });
				}
			});

      for (const activity of processedActivities) {
        const activityBaseDTO = {};
        const [flow] = activity.flows.filter((flow) =>
          flowIds.includes(flow.id),
        );
        if (flow) {
					const actFlows = activity.flows.filter(
            (flow) => !flowIds.includes(flow.id),
          ).map((flow) => ({ activity: activity.id, flow: flow.id }));
					activityBaseDTO.nodes = [];
					activityBaseDTO.connectors = [];
					await database('activities').where('id', activity.id).update(activityBaseDTO);
					await database('activities_flows').where('id', activity.id).del();
					if (actFlows.length > 0) await database('activities_flows').insert(actFlows);

          for (const flowMap of flowMaps.filter(
            (dt) => dt.activity == activity.id,
          )) {
            const flowMapBaseDTO = {};
            flowMapBaseDTO.data = {
              ...JSON.parse(flowMap.data),
              dependencies: [],
            };
						await database('flow_maps').where('id', flowMap.id).update(flowMapBaseDTO);
          }
        }
      }
    }


    // await this.populateUpdateFlow(companyId, product);
    
    cronTaskLogBaseDTO.end_date = new Date();
    // return await this.cronTaskLogService.create(cronTaskLogBaseDTO);
		await database('cron_task_logs').insert(cronTaskLogBaseDTO);
		console.log('Successfully create cront task log');
	});
};
