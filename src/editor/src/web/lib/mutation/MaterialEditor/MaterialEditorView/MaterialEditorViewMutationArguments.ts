import type { IMaterialEditorViewController } from "@lib/material-editor/material/MaterialEditorViewController";
import type { IProjectController } from "@lib/project/ProjectController";

export interface MaterialEditorViewMutationArguments {
  MaterialEditorViewController: IMaterialEditorViewController;
  ProjectController: IProjectController;
}
