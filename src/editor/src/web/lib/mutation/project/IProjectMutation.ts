import { BaseMutation, IMutation } from "../IMutation";
import { ProjectMutationArguments } from "./ProjectMutationArguments";

export interface IProjectMutation extends IMutation<ProjectMutationArguments> {
}
export abstract class BaseProjectMutation<TMutationArgs> extends BaseMutation<ProjectMutationArguments, TMutationArgs> {
}
