import { BaseContinuousMutation, IContinuousMutation } from "../../IContinuousMutation";
import { IMaterialEditorViewMutation } from "./IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from './MaterialEditorViewMutationArguments';

export interface IContinuousMaterialEditorViewMutation<TMutationArgs> extends IMaterialEditorViewMutation, IContinuousMutation<MaterialEditorViewMutationArguments, TMutationArgs> {
}

export abstract class BaseContinuousMaterialEditorViewMutation<TMutationArgs> extends BaseContinuousMutation<MaterialEditorViewMutationArguments, TMutationArgs> {
}
