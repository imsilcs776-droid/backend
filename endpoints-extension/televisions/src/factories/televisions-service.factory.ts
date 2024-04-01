import { TelevisionsService } from "../televisions.service";

export const televisionsServiceFactory = (
	ItemsService: any,
	req: any,
	accountability: any
) => {
	const televisionItemService = new ItemsService("televisions", {
		schema: req.schema,
		accountability: accountability,
	});

	return new TelevisionsService(televisionItemService);
}