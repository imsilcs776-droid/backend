module.exports = function defineHook({ filter, action }, { database, services, schema, exceptions, logger, getSchema }) {
  const { CollectionsService, ItemsService, FieldsService, RelationsService } = services;
  const { InvalidPayloadException } = exceptions;

  action("submissions.items.create", async (meta, context) => {
    const { schema, accountability } = context;

		const formService = new ItemsService("forms", {
			schema,
      database,
      accountability,
		});
    
    try {
			const compare = (post, operator, value) => {
				switch (operator) {
					case '>':   return post > value;
					case '<':   return post < value;
					case '>=':  return post >= value;
					case '<=':  return post <= value;
					case '=':  return post == value;
					case '!=':  return post != value;
					case '===': return post === value;
					case '!==': return post !== value;
				}
			};

			const id = meta.key;

			const payload = meta.payload;

			const data = payload.data?.detail ?? {};

			const mappedData = {};
			Object.keys(data).map(key => {
				const { classifications, unit } = data[key];
				mappedData[key] = data[key].value;
				if (classifications && Array.isArray(classifications)) {
					let classificationVal = null;
					for (const classify of classifications) {
						const { treshold, name } = classify;
						if (compare(data[key].value, treshold?.operator, treshold?.value)) {
							classificationVal = name;
							break;
						}
					}
					mappedData[`${key}_classification`] = classificationVal;
				}
				if (unit && unit?.enabled && unit?.name) {
					mappedData[`${key}_unit`] = unit?.name
				}
			});
			mappedData.submission = id;

			const form = await formService.readOne(payload.form);
			if (!form) throw new Error('Form Not Found!');

			const dynSubmissionService = new ItemsService(form.code, {
				schema,
				database,
				accountability,
			});

			await dynSubmissionService.createOne(mappedData);
    } catch (error) {
			console.log(error);
      throw new InvalidPayloadException(error?.message ? error?.message : error);
    }
  });

	action("submissions.items.update", async (meta, context) => {
    const { schema, accountability } = context;

		const formService = new ItemsService("forms", {
			schema,
      database,
      accountability,
		});

		const submissionService = new ItemsService("submissions", {
			schema,
      database,
      accountability,
		});
    
    try {
			const compare = (post, operator, value) => {
				switch (operator) {
					case '>':   return post > value;
					case '<':   return post < value;
					case '>=':  return post >= value;
					case '<=':  return post <= value;
					case '=':  return post == value;
					case '!=':  return post != value;
					case '===': return post === value;
					case '!==': return post !== value;
				}
			};

			const payload = meta.payload;
			const [id] = meta.keys;

			const data = payload.data?.detail ?? {};

			const submission = await await submissionService.readOne(id);
			if (!submission) throw new Error('Submission Not Found!');

			const mappedData = {};
			Object.keys(data).map(key => {
				const { classifications, unit } = data[key];
				mappedData[key] = data[key].value;
				if (classifications && Array.isArray(classifications)) {
					let classificationVal = null;
					for (const classify of classifications) {
						const { treshold, name } = classify;
						if (compare(data[key].value, treshold?.operator, treshold?.value)) {
							classificationVal = name;
							break;
						}
					}
					mappedData[`${key}_classification`] = classificationVal;
				}
				if (unit && unit?.enabled && unit?.name) {
					mappedData[`${key}_unit`] = unit?.name
				}
			});
			mappedData.submission = id;

			const form = await formService.readOne(submission.form);
			if (!form) throw new Error('Form Not Found!');

			const dynSubmissionService = new ItemsService(form.code, {
				schema,
				database,
				accountability,
			});

			const [dynamicCollection] = await dynSubmissionService.readByQuery({
				filter: {
					submission: { _eq: +id },
				}
			});
			if (!dynamicCollection) throw new Error(`Collection ${form.code} Not Found!`);

			await dynSubmissionService.updateOne(dynamicCollection.id, mappedData);

    } catch (error) {
			console.log(error);
      throw new InvalidPayloadException(error?.message ? error?.message : error);
    }
  });
};
