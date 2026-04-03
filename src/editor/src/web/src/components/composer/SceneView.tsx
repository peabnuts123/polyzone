import type { ElementType, FunctionComponent } from "react";
import { useEffect, useRef } from "react";
import { ArrowsPointingOutIcon, ArrowPathIcon, ArrowsPointingInIcon } from '@heroicons/react/24/solid';
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import cn from 'classnames';

import type { ISceneViewController } from "@lib/composer/scene";
import { CurrentSelectionTool } from "@lib/composer/scene/SelectionManager";

import { Inspector } from "./Inspector";
import { Hierarchy } from './Hierarchy';
import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";
import { CreateGameObjectFromDefinitionMutation, CreateGameObjectType, DeleteGameObjectMutation } from "@lib/mutation/SceneView/mutations";


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
        if (!isInputElement(e.target as HTMLElement | null)) {
          handleKeyPress(controller, e);
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

  const ToolButton = observer(({ tool, Icon, label }: { tool: CurrentSelectionTool, Icon: ElementType, label: string }) => {
    return (
      <button
        className={cn("button", {
          "!bg-blue-900 text-white": controller.selectionManager.currentTool === tool,
        })}
        onClick={() => controller.setCurrentTool(tool)}
      >
        <Icon className="icon mr-1" /> {label}
      </button>
    );
  });

  return (
    <div className="h-full flex flex-col" tabIndex={0} ref={tabContainerRef}>
      <div className="p-2 pt-0 bg-white flex flex-row shrink-0">
        <ToolButton tool={CurrentSelectionTool.Move} Icon={ArrowsPointingOutIcon} label="Move" />
        <ToolButton tool={CurrentSelectionTool.Rotate} Icon={ArrowPathIcon} label="Rotate" />
        <ToolButton tool={CurrentSelectionTool.Scale} Icon={ArrowsPointingInIcon} label="Scale" />
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

function handleKeyPress(controller: ISceneViewController, e: KeyboardEvent): void {
  // @TODO rebindable input system
  if (e.key === 'Escape') {
    e.preventDefault();
    /* Deselect */
    controller.selectionManager.deselectAll();
  } else if (controller.selectedObjectData !== undefined && e.key === 'd' && (e.ctrlKey || e.metaKey)) {
    /* Duplicate */
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
  } else if (controller.selectedObjectData !== undefined && (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey))) {
    /* Delete */
    e.preventDefault();
    void controller.mutatorNew.apply(
      new DeleteGameObjectMutation(controller.selectedObjectData),
    );
  } else if (e.key === '1') {
    /* Select 'Move' tool */
    e.preventDefault();
    controller.setCurrentTool(CurrentSelectionTool.Move);
  } else if (e.key === '2') {
    /* Select 'Rotate' tool */
    e.preventDefault();
    controller.setCurrentTool(CurrentSelectionTool.Rotate);
  } else if (e.key === '3') {
    /* Select 'Scale' tool */
    e.preventDefault();
    controller.setCurrentTool(CurrentSelectionTool.Scale);
  } else if (controller.selectedObject !== undefined && e.key === 'f') {
    /* Focus selected object */
    e.preventDefault();
    controller.focusObject(controller.selectedObject);
  }
}

export default SceneViewComponent;
