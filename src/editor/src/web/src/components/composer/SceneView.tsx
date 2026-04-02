import type { FunctionComponent } from "react";
import { useEffect, useRef } from "react";
import { ArrowsPointingOutIcon, ArrowPathIcon, ArrowsPointingInIcon } from '@heroicons/react/24/solid';
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";


import type { ISceneViewController } from "@lib/composer/scene";
import { CurrentSelectionTool } from "@lib/composer/scene/SelectionManager";

import { Inspector } from "./Inspector";
import { Hierarchy } from './Hierarchy';
import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";
import { CreateGameObjectFromDefinitionMutation, CreateGameObjectType } from "@lib/mutation/SceneView/mutations";


interface Props {
  controller: ISceneViewController;
}

const SceneViewComponent: FunctionComponent<Props> = observer(({ controller }) => {
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
      const onCopy = (e: ClipboardEvent): void => {
        const inputElementFocused = isInputElement(e.target as HTMLElement | null);
        if (!inputElementFocused && controller.selectedObjectData !== undefined) {
          e.preventDefault();

          /* Copy */
          const selectedObjectDefinition = controller.selectedObjectData.toDefinition();
          e.clipboardData!.setData('application/x-polyzone-gameobject', JSON.stringify(selectedObjectDefinition));
          e.clipboardData!.setData('application/json', JSON.stringify(selectedObjectDefinition, null, 2));
          e.clipboardData!.setData('text/plain', JSON.stringify(selectedObjectDefinition, null, 2));
        }
      };
      const onPaste = (e: ClipboardEvent): void => {
        const inputElementFocused = isInputElement(e.target as HTMLElement | null);
        if (!inputElementFocused) {
          e.preventDefault();
          const pasteData = e.clipboardData!.getData('application/x-polyzone-gameobject');
          if (pasteData?.trim() !== '') {
            try {
              /* Paste */
              const gameObjectDefinition = JSON.parse(pasteData) as GameObjectDefinition;
              gameObjectDefinition.name = `${gameObjectDefinition.name} copy`;
              void controller.mutatorNew.apply(
                new CreateGameObjectFromDefinitionMutation({
                  definition: gameObjectDefinition,
                  parent: controller.selectedObjectData,
                  type: CreateGameObjectType.Paste,
                }),
              );
            } catch (e) {
              console.error(`Failed to parse 'application/x-polyzone-gameobject' data: `, e);
            }
          }
        }
      };
      const onKeyDown = (e: KeyboardEvent): void => {
        // @TODO rebindable input system
        if (e.key === 'Escape') {
          e.preventDefault();
          /* Deselect */
          controller.selectionManager.deselectAll();
        } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
          /* Duplicate */
          if (controller.selectedObjectData !== undefined) {
            e.preventDefault();
            const selectedObjectDefinition = controller.selectedObjectData.toDefinition();
            const parentObjectData = controller.scene.getGameObjectParent(controller.selectedObjectData.id);
            void controller.mutatorNew.apply(
              new CreateGameObjectFromDefinitionMutation({
                definition: selectedObjectDefinition,
                parent: parentObjectData,
                siblingTarget: {
                  gameObjectId: selectedObjectDefinition.id,
                  type: 'after',
                },
                type: CreateGameObjectType.Duplicate,
              }),
            );
          }
        }
      };
      tabContainerElement.addEventListener('copy', onCopy);
      tabContainerElement.addEventListener('paste', onPaste);
      tabContainerElement.addEventListener('keydown', onKeyDown);
      return () => {
        tabContainerElement.removeEventListener('copy', onCopy);
        tabContainerElement.removeEventListener('paste', onPaste);
        tabContainerElement.removeEventListener('keydown', onKeyDown);
      };
    }
  }, []);

  return (
    <div className="h-full flex flex-col" tabIndex={0} ref={tabContainerRef}>
      <div className="p-2 pt-0 bg-white flex flex-row shrink-0">
        <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Move)}><ArrowsPointingOutIcon className="icon mr-1" /> Move</button>
        <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Rotate)}><ArrowPathIcon className="icon mr-1" /> Rotate</button>
        <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Scale)}><ArrowsPointingInIcon className="icon mr-1" /> Scale</button>
      </div>
      <PanelGroup direction="horizontal" className="grow select-none">
        <Panel defaultSize={20} minSize={10}>
          {/* Hierarchy */}
          <Hierarchy controller={controller} />
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
        <PanelResizeHandle className="drag-separator" />
        <Panel defaultSize={20} minSize={10} className="flex flex-col">
          {/* Inspector */}
          <Inspector sceneViewController={controller} />
        </Panel>
      </PanelGroup>
    </div>
  );
});

export default SceneViewComponent;
