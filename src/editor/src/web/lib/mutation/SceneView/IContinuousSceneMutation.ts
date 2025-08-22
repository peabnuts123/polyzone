import { BaseContinuousMutation, IContinuousMutation } from "../IContinuousMutation";
import { ISceneMutation } from "./ISceneMutation";
import { SceneViewMutationArguments } from "./SceneViewMutationArguments";

// @TODO Remove, replace with New
export interface IContinuousSceneMutation<TUpdateArgs> extends ISceneMutation, IContinuousMutation<SceneViewMutationArguments, TUpdateArgs> {
}

export abstract class BaseContinuousSceneMutation<TMutationArgs> extends BaseContinuousMutation<SceneViewMutationArguments, TMutationArgs> {

}
