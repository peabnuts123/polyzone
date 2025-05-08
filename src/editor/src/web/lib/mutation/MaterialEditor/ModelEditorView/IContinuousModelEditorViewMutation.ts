import { IContinuousMutation } from "../../IContinuousMutation";
import { IModelEditorViewMutation } from "./IModelEditorViewMutation";
import { ModelEditorViewMutationArguments } from './ModelEditorViewMutationArguments';

export interface IContinuousModelEditorViewMutation<TUpdateArgs> extends IModelEditorViewMutation, IContinuousMutation<ModelEditorViewMutationArguments, TUpdateArgs> {
}
