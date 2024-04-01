import { Body, Context, Endpoint, Get, Param, Post, Req } from "@mv-data-core/decorator";
import { QuestionDTO } from "./dto/question.dto";
import { QuestionAgregate } from "./interfaces/question-agregate.interface";
import { VirtualAgregate } from "./interfaces/virtual-agregate.interface";
import { Switcher } from "./patterns/switcher/switcher";
import { visualizeQuestionPayload, visualizeQuestionProperties } from "./swagger-schemas/visualize";
import { errorResponse } from "./utils/responses/error.util";
import { Message } from "./utils/responses/messages.utils";
import { successResponse } from "./utils/responses/success.util";

@Endpoint("questions")
export default class DefineEndpoint {
	@Post(visualizeQuestionProperties, visualizeQuestionPayload)
	async visualize(@Req() req: any, @Context() ctx: any, @Param("id") id: number, @Body() body: QuestionDTO) {
		try {
			const { filters, groups, limit, sorts, summarizes } = body;

			let question = {} as QuestionAgregate;

			if (filters || groups || limit || sorts || summarizes) {
				question = body as QuestionAgregate;
			} else {
				question = await this.questionService.findCompleteAggregation(id);
			}

			const virtualId = question.table.virtual_id;

			const virtual: VirtualAgregate =
				await this.virtualService.findCompleteAggregationEX(String(virtualId));

			if (!virtual) throw new Error("virtual doesn't exist");

			const switcher = new Switcher(virtual);
			switcher.injectWith(this.virtualService);
			switcher.doAddSetting(question);
			const populated = await switcher.doPopulate();

			return successResponse(populated, Message.SHOWEDLIST);
		} catch (error: any) {
			return errorResponse(error.message || error);
		}
	}
}