import { BaseMutation, IMutation } from "../IMutation";
import { SceneViewMutationArguments } from './SceneViewMutationArguments';

export interface ISceneMutation extends IMutation<SceneViewMutationArguments> {
}

export abstract class BaseSceneMutation<TMutationArgs> extends BaseMutation<SceneViewMutationArguments, TMutationArgs> {

}
