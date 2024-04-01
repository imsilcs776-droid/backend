import { MenusService } from "../menus.service";

export const menusServiceFactory = (
	ItemsService: any,
	MetaService: any,
	req: any,
	accountability: any
) => {
	const menuItemService = new ItemsService("menus", {
		schema: req.schema,
		accountability: accountability,
	});

	const metaService = new MetaService({
		schema: req.schema,
		accountability: accountability,
	});


	return new MenusService(
		menuItemService,
		metaService
	);
}