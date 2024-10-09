import { Body, Context, Endpoint, Post, Req } from "@mv-data-core/decorator";
import { RestrictionRegenerateBaseDTO } from "./dto/restriction.dto";
import { regenerateRestrictionProperty } from "./swagger-schemas/regenerate/regenerate-restriction-property.schema";
import { regenerateRestrictionPayload } from "./swagger-schemas/regenerate/regenerate-restriction-payload.schema";
import { RestrictionsService } from "./restrictions.service";
import { restrictionServiceFactory } from "./factories/restriction-service.factory";

@Endpoint("restrictions")
export default class DefineEndpoint {
	@Post(regenerateRestrictionProperty, regenerateRestrictionPayload)
	async regenerate(
		@Req() req: any,
		@Context() ctx: any,
		@Body() body: RestrictionRegenerateBaseDTO,
	) {
		const {
			services: { ItemsService },
		} = ctx;
		const { user: userId } = req.accountability;

		const restrictionsService = restrictionServiceFactory(ItemsService, req);

		try {
			const regeneratedRestrictions = await restrictionsService.regenerate(userId, body);

			return regeneratedRestrictions;
		} catch (error) {
			throw error;
		}
	}
}


