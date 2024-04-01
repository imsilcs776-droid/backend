import { RestrictionsService } from "../restrictions.service";

export const restrictionServiceFactory = (ItemsService: any, req: any) => {
	const productItemService = new ItemsService("products", {
		schema: req.schema,
		accountability: req.accountability,
	});

	const restrictionItemService = new ItemsService("restrictions", {
		schema: req.schema,
		accountability: req.accountability,
	});

	const markItemService = new ItemsService("marks", {
		schema: req.schema,
		accountability: req.accountability,
	});

	const menuBarItemService = new ItemsService("menu_bars", {
		schema: req.schema,
		accountability: req.accountability,
	});

	const statusItemService = new ItemsService("statuses", {
		schema: req.schema,
		accountability: req.accountability,
	});

	const productFeaturesItemService = new ItemsService("product_features", {
		schema: req.schema,
		accountability: req.accountability,
	});

	return new RestrictionsService(
		productItemService,
		restrictionItemService,
		markItemService,
		menuBarItemService,
		statusItemService,
		productFeaturesItemService
	);
}
