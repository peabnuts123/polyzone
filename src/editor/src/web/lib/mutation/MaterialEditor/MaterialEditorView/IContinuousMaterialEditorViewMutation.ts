import { IContinuousMutation } from "../../IContinuousMutation";
import { IMaterialEditorViewMutation } from "./IMaterialEditorViewMutation";
import { MaterialEditorViewMutationArguments } from './MaterialEditorViewMutationArguments';

export interface IContinuousMaterialEditorViewMutation<TUpdateArgs> extends IMaterialEditorViewMutation, IContinuousMutation<MaterialEditorViewMutationArguments, TUpdateArgs> {
}
