import { RestrictionRegenerateBaseDTO } from "./dto/restriction.dto";
import { restrictions as restrictionsData } from "./data/restriction.data";
import { topMenus } from "./data/top-menu.data";
import { MarkBaseDTO } from "./dto/mark.dto";
import { MenuBarBaseDTO } from "./dto/menu-bar.dto";

export class RestrictionsService {
	constructor(
		private productItemService: any,
		private restrictionItemService: any,
		private markItemService: any,
		private menuBarItemService: any,
		private statusItemService: any,
		private productFeaturesItemService: any
	) { }

	async regenerate(userId: number, body: RestrictionRegenerateBaseDTO) {
		try {
			const { company } = body;
			let product: any = null;

			if (company) {
				const productsPromise: any = this.productItemService.readByQuery({
					filter: {
						code: {
							_eq: 'MES',
						},
					},
				});

				const restrictionsPromise = this.restrictionItemService.readByQuery({
					filter: {
						company: {
							_eq: company,
						},
					},
				});

				const [
					products,
					restrictions,
				] = await Promise.all([
					productsPromise,
					restrictionsPromise,
				]);

				[product] = products;

				if (restrictions.length && product) {
					const now = new Date();

					const markspromise = this.markItemService.readByQuery({
						filter: {
							company: {
								_eq: company,
							},
						},
					});

					const menuBarsPromise = this.menuBarItemService.readByQuery({
						filter: {
							company: {
								_eq: company,
							},
						},
					});

					const statusesPromise = this.statusItemService.readByQuery({
						filter: {
							code: {
								_eq: 'ALW02',
							},
							category: {
								_eq: 'RESTRICTION',
							},
						},
					});

					const productFeaturesPromise = this.productFeaturesItemService.readByQuery({
						filter: {
							product: {
								_eq: product.id,
							}
						},
						fields: ["feature.id"]
					});

					const [
						marks,
						menuBars,
						statuses,
						productFeatures
					] = await Promise.all([
						markspromise,
						menuBarsPromise,
						statusesPromise,
						productFeaturesPromise
					]);

					const [status] = statuses || [];

					const feature = productFeatures.map((productFeature: { feature: any; }) => productFeature.feature);

					const restrictionDataLoop = async () => {
						const newRestrictions = [];

						for (const restriction of restrictionsData) {
							const [filterRestriction] = restrictions.filter(
								(dt: { entity: any; }) => dt.entity == restriction.entity,
							);
							if (filterRestriction) continue;
							restriction.company = company;
							restriction.created_by = userId;
							restriction.created_at = now;
							restriction.updated_at = now;
							restriction.settings = restriction.settings.map((set: any) => {
								return {
									...set,
									status: status ? status.id : null,
								};
							});

							newRestrictions.push(restriction);
						}

						return newRestrictions;
					}

					const featureLoop = async () => {
						const newMarks = [];

						for (const item of feature) {
							const [filterMark] = marks.filter((dt: { feature: any; }) => dt.feature == item.id) || [];
							if (filterMark) continue;
							const markBaseDTO = new MarkBaseDTO();
							markBaseDTO.company = company;
							markBaseDTO.feature = item.id;
							markBaseDTO.created_by = userId;

							newMarks.push(markBaseDTO);
						}

						return newMarks;
					}

					const topMenusLoop = async () => {
						const newMenuBars = [];

						for (const item of topMenus) {
							const [menuBar] = menuBars.filter((dt: { category: string; additional: { code: string; }; }) => dt.category == item.category && dt.additional && item.additional && dt.additional.code == item.additional.code) || []
							if (!menuBar) {
								const menuBarDTO = new MenuBarBaseDTO();
								menuBarDTO.company = Number(company);
								menuBarDTO.plants = item.plants;
								menuBarDTO.roles = item.roles;
								menuBarDTO.category = item.category;
								menuBarDTO.sub_menus = item.sub_menus;
								menuBarDTO.name = item.name;
								menuBarDTO.icon = item.icon;
								menuBarDTO.menu_shown = item.menu_shown;
								menuBarDTO.icon_shown = item.icon_shown;
								menuBarDTO.is_badge = item.is_badge;
								menuBarDTO.source_badge = item.source_badge;
								menuBarDTO.cluster = item.cluster;
								menuBarDTO.menu = item.menu;
								menuBarDTO.endpoint = item.endpoint;
								menuBarDTO.is_active = item.is_active;
								menuBarDTO.additional = item.additional;
								menuBarDTO.created_by = userId;

								newMenuBars.push(menuBarDTO);
							}
						}

						return newMenuBars;
					}

					const [
						newRestrictions,
						newMarks,
						newMenuBars
					] = await Promise.all([
						restrictionDataLoop(),
						featureLoop(),
						topMenusLoop()
					]);

					await Promise.all([
						this.restrictionItemService.createMany(newRestrictions),
						this.markItemService.createMany(newMarks),
						this.menuBarItemService.createMany(newMenuBars)
					])

					return {
						success: true,
						message: 'Data has been processing.',
						data: null,
					};
				} else {
					return {
						success: false,
						message: 'Data not found.',
						data: null,
					};
				}
			} else {
				return {
					success: false,
					message: 'Data not found.',
					data: null,
				};
			}
		} catch (error) {
			throw error;
		}
	}
}