import { ConditionsService } from "../conditions.service";
import { DatabaseRepository } from "../database.repository";

export const conditionServiceFactory = (ItemsService: any, database: any, req: any) => {
	const databaseRepository = new DatabaseRepository(database);

	const entityItemService = new ItemsService("entities", {
		schema: req.schema,
		accountability: req.accountability,
	});

	const activityItemService = new ItemsService("activities", {
		schema: req.schema,
		accountability: req.accountability,
	});

	const conditionItemService = new ItemsService("conditions", {
		schema: req.schema,
		accountability: req.accountability,
	});

	const formItemService = new ItemsService("forms", {
		schema: req.schema,
		accountability: req.accountability,
	});

	return new ConditionsService(
		conditionItemService,
		activityItemService,
		entityItemService,
		formItemService,
		databaseRepository
	);
}