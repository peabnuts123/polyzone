import { createContext, useContext, useState } from 'react';

import { ApplicationDataController } from './application/ApplicationDataController';
import { ProjectController, type IProjectController } from "./project/ProjectController";
import { ComposerController, type IComposerController } from "./composer/ComposerController";
import { MaterialEditorController, type IMaterialEditorController } from './material-editor/MaterialEditorController';

export interface Library {
  ApplicationDataController: ApplicationDataController
  ProjectController: IProjectController;
  ComposerController: IComposerController;
  MaterialEditorController: IMaterialEditorController;
  unloadProject: () => void,
  onPageUnload: () => void;
}

/* eslint-disable react-hooks/rules-of-hooks */ // I guess eslint is sad because the function is not called `use____()`
export function createLibrary(): Library {

  // Poor-man's dependency injection
  const [applicationDataController, _setApplicationDataController] = useState<ApplicationDataController>(new ApplicationDataController());
  const [projectController, setProjectController] = useState<IProjectController>(new ProjectController(applicationDataController));
  const [composerController, setComposerController] = useState<IComposerController>(new ComposerController(projectController));
  const [materialEditorController, setMaterialEditorController] = useState<IMaterialEditorController>(new MaterialEditorController(projectController));

  return {
    ApplicationDataController: applicationDataController,
    ProjectController: projectController,
    ComposerController: composerController,
    MaterialEditorController: materialEditorController,
    unloadProject() {
      projectController.onDestroy();
      composerController.onDestroy();
      materialEditorController.onDestroy();

      // @NOTE be careful you don't accidentally leave dangling copies of old instances
      // laying around when construction new ones
      const newProjectController = new ProjectController(applicationDataController);
      const newComposerController = new ComposerController(newProjectController);
      const newMaterialEditorController = new MaterialEditorController(newProjectController);
      setProjectController(newProjectController);
      setComposerController(newComposerController);
      setMaterialEditorController(newMaterialEditorController);
    },
    onPageUnload() {
      projectController.onDestroy();
      composerController.onDestroy();
      materialEditorController.onDestroy();
    },
  };
}
/* eslint-enable react-hooks/rules-of-hooks */

export const LibraryContext = createContext<Library>(undefined!);
export const useLibrary = (): Library => useContext(LibraryContext);
