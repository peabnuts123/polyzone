import { BaseMutation, IMutation } from "../../IMutation";
import { ModelEditorViewMutationArguments } from './ModelEditorViewMutationArguments';

export interface IModelEditorViewMutation extends IMutation<ModelEditorViewMutationArguments> {
}

export abstract class BaseModelEditorViewMutation<TMutationArgs = void> extends BaseMutation<ModelEditorViewMutationArguments, TMutationArgs> {
}
