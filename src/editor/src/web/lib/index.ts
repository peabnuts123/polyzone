import { createContext, useContext, useState } from 'react';

import { ApplicationDataController } from './application/ApplicationDataController';
import { MutationController } from './mutation/MutationController';
import { ProjectController, type IProjectController } from "./project/ProjectController";
import { ComposerController, type IComposerController } from "./composer/ComposerController";
import { MaterialEditorController, type IMaterialEditorController } from './material-editor/MaterialEditorController';

export interface Library {
  ApplicationDataController: ApplicationDataController;
  MutationController: MutationController;
  ProjectController: IProjectController;
  ComposerController: IComposerController;
  MaterialEditorController: IMaterialEditorController;
  unloadProject: () => void,
  onPageUnload: () => void;
}

/* eslint-disable react-hooks/rules-of-hooks */ // I guess eslint is sad because the function is not called `use____()`
export function createLibrary(): Library {

  // Poor-man's dependency injection
  const [applicationDataController, _setApplicationDataController] = useState<ApplicationDataController>(() => new ApplicationDataController());
  const [mutationController, setMutationController] = useState<MutationController>(() => new MutationController());
  const [projectController, setProjectController] = useState<IProjectController>(() => new ProjectController(applicationDataController, mutationController));
  const [composerController, setComposerController] = useState<IComposerController>(() => new ComposerController(projectController, mutationController));
  const [materialEditorController, setMaterialEditorController] = useState<IMaterialEditorController>(() => new MaterialEditorController(projectController, mutationController));

  return {
    ApplicationDataController: applicationDataController,
    MutationController: mutationController,
    ProjectController: projectController,
    ComposerController: composerController,
    MaterialEditorController: materialEditorController,
    unloadProject() {
      projectController.onDestroy();
      composerController.onDestroy();
      materialEditorController.onDestroy();

      // @NOTE be careful you don't accidentally leave dangling copies of old instances
      // laying around when constructing new ones (e.g. injected references to old values)
      // i.e. pay attention to the order you construct these values
      const newMutationController = new MutationController();
      const newProjectController = new ProjectController(applicationDataController, newMutationController);
      const newComposerController = new ComposerController(newProjectController, newMutationController);
      const newMaterialEditorController = new MaterialEditorController(newProjectController, newMutationController);
      setMutationController(newMutationController);
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
