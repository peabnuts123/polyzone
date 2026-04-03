import type { FunctionComponent } from "react";
import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import type { IModelEditorViewController } from "@lib/material-editor/model/ModelEditorViewController";
import { Inspector } from './Inspector';
import { MaterialSelector } from './MaterialSelector';


interface Props {
  controller: IModelEditorViewController;
}

export const ModelView: FunctionComponent<Props> = observer(({ controller }) => {
  // Refs
  const canvasParentRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasParentRef.current) {
      canvasParentRef.current.appendChild(controller.canvas);
    }

    return controller.startBabylonView();
  }, [controller, controller.canvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const isInputElement = (el: HTMLElement | null): boolean => {
      return !!el && (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement
      );
    };

    const tabContainerElement = tabContainerRef.current;
    if (tabContainerElement) {
      const onKeyDown = (e: KeyboardEvent): void => {
        if (!isInputElement(e.target as HTMLElement | null)) {
          if (e.key === 'f') {
            /* Focus model */
            e.preventDefault();
            controller.focusModel();
          }
        }
      };
      tabContainerElement.addEventListener('keydown', onKeyDown);
      return () => {
        tabContainerElement.removeEventListener('keydown', onKeyDown);
      };
    }
  }, []);

  return (
    <div className="h-full flex flex-col" ref={tabContainerRef}>
      <PanelGroup direction="horizontal" className="grow select-none">
        <Panel defaultSize={20} minSize={10}>
          {/* Material selector */}
          <MaterialSelector controller={controller} />
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel defaultSize={20} minSize={10} className="flex flex-col">
          {/* Inspector */}
          <Inspector modelEditorViewController={controller} />
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
