import type { IModelEditorViewController } from "@lib/material-editor/model/ModelEditorViewController";
import type { IProjectController } from "@lib/project/ProjectController";

export interface ModelEditorViewMutationArguments {
  ModelEditorViewController: IModelEditorViewController;
  ProjectController: IProjectController;
}
