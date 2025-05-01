import { IContinuousMutation } from "../IContinuousMutation";
import { IModelMaterialMutation } from "./IModelMaterialMutation";
import { ModelMaterialMutationArguments } from './ModelMaterialMutationArguments';

export interface IContinuousModelMaterialMutation<TUpdateArgs> extends IModelMaterialMutation, IContinuousMutation<ModelMaterialMutationArguments, TUpdateArgs> {
}
