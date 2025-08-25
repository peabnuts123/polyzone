import { BaseMutation, IMutation } from "../../IMutation";
import { MaterialEditorViewMutationArguments } from './MaterialEditorViewMutationArguments';

export interface IMaterialEditorViewMutation extends IMutation<MaterialEditorViewMutationArguments> {
}

export abstract class BaseMaterialEditorViewMutation<TMutationArgs> extends BaseMutation<MaterialEditorViewMutationArguments, TMutationArgs> {
}
