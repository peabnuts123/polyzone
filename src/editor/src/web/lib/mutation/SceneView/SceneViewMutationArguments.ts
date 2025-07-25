import type { ISceneViewController } from "@lib/composer/scene/SceneViewController";
import type { IProjectController } from "@lib/project/ProjectController";

export interface SceneViewMutationArguments {
  SceneViewController: ISceneViewController;
  ProjectController: IProjectController;
}
