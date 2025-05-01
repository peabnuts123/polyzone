import type { FunctionComponent } from "react";
import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { ModelMaterialEditorController } from "@lib/material-editor/model/ModelMaterialEditorController";
import { Inspector } from './Inspector';
import { MaterialSelector } from './MaterialSelector';


interface Props {
  controller: ModelMaterialEditorController;
}

const SceneViewComponent: FunctionComponent<Props> = observer(({ controller }) => {
  // Refs
  const canvasParentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasParentRef.current) {
      canvasParentRef.current.appendChild(controller.canvas);
    }

    return controller.startBabylonView();
  }, [controller, controller.canvas]);

  return (
    <div className="h-full flex flex-col">
      <PanelGroup direction="horizontal" className="grow select-none">
        <Panel defaultSize={20} minSize={10}>
          {/* Material selector */}
          <MaterialSelector controller={controller} />
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel defaultSize={20} minSize={10} className="flex flex-col">
          {/* Inspector */}
          <Inspector modelMaterialEditorController={controller} />
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel className="flex flex-col h-full">
          {/* Viewport */}
          <div className="grow relative">
            <div className="absolute inset-0" ref={canvasParentRef}>
              {/*
                @NOTE ye-olde absolute position hacks
                Babylon HATES to be in a flex-grow element,
                  it causes it to expand the size of the canvas element every frame.
              */}
              {/* @NOTE Canvas element is inserted here */}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
});

export default SceneViewComponent;
