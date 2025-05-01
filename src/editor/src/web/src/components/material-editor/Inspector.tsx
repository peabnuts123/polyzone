import { type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { ModelMaterialEditorController } from "@lib/material-editor/model/ModelMaterialEditorController";

interface Props {
  modelMaterialEditorController: ModelMaterialEditorController;
}

export const Inspector: FunctionComponent<Props> = observer(({ modelMaterialEditorController }) => {
  // Computed state
  const selectedObject = modelMaterialEditorController.selectedMaterialName;
  const isAnyObjectSelected = selectedObject !== undefined;
  const isNoObjectSelected = selectedObject === undefined;

  return (
    <>
      <div className="p-2 bg-gradient-to-b from-[blue] to-pink-500 text-white text-retro-shadow shrink-0">
        <h2 className="text-lg">Inspector</h2>
      </div>
      <div className="bg-slate-300 h-full overflow-y-scroll grow">
        {/* No object selected */}
        {isNoObjectSelected && (
          <div className="p-2">
            <p className="italic">No material selected</p>
          </div>
        )}

        {/* At least 1 object selected */}
        {isAnyObjectSelected && (
          <>
            <div className="p-2">
              {/* Name */}
              {/* <TextInput
                label="Name"
                value={selectedObject.name}
                onChange={(newName) => {
                  if (newName && newName.trim()) {
                    sceneViewController.mutator.debounceContinuous(
                      SetGameObjectNameMutation,
                      selectedObject!,
                      () => new SetGameObjectNameMutation(selectedObject!),
                      () => ({ name: newName }),
                    );
                  }
                }}
              /> */}
              <div className="text-xl">{modelMaterialEditorController.selectedMaterialName}</div>

            </div>

            <p>TODO: Material overrides</p>
          </>
        )}
      </div>
    </>
  );
});
