import { Payload } from "@mv-data-core/decorator/dist/esm/utils"
import { visualizeQuestionParameters } from "./parameters.schema"
import { visualizeQuestionResponses } from "./response.schema"


export const visualizeQuestionProperties: {
	path: string;
	tag: string;
	isIndependentRoute?: boolean | undefined;
} = {
	path: "/visualize-ex/:id",
	tag: "Question"
}

export const visualizeQuestionPayload: Payload = {
	responses: visualizeQuestionResponses,
	parameters: visualizeQuestionParameters
}
