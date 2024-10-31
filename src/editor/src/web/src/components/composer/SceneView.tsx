import type { FunctionComponent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon, ChevronDownIcon, ArrowTurnDownRightIcon, ArrowsPointingOutIcon, ArrowPathIcon, ArrowsPointingInIcon, TrashIcon } from '@heroicons/react/24/solid'
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import cn from 'classnames';

import type { SceneViewController } from "@lib/composer/scene";
import { CurrentSelectionTool } from "@lib/composer/scene/SelectionManager";
import type { GameObjectData } from "@lib/composer/data";
import { CreateBlankGameObjectMutation, DeleteGameObjectMutation } from "@lib/mutation/scene/mutations";

import { Inspector } from "./Inspector";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { isRunningInBrowser } from "@lib/tauri";


interface Props {
  controller: SceneViewController;
}

const SceneViewComponent: FunctionComponent<Props> = observer(({ controller }) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    return controller.startBabylonView(canvas);
  }, [controller]);

  // Functions
  const createNewObject = (parent: GameObjectData | undefined = undefined) => {
    controller.mutator.apply(new CreateBlankGameObjectMutation(parent));
  }
  const deleteObject = (gameObjectData: GameObjectData) => {
    controller.mutator.apply(new DeleteGameObjectMutation(gameObjectData));
  };

  const showContextMenu = async (e: React.MouseEvent) => {
    // @NOTE Skip context menu in browser
    if (isRunningInBrowser()) return;

    e.preventDefault();
    e.stopPropagation();

    const menuItems = await Promise.all([
      MenuItem.new({
        text: 'Create new object',
        action: () => {
          createNewObject();
        },
      }),
    ]);

    const menu = await Menu.new({
      items: menuItems,
    });

    await menu.popup();
  }

  return (
    <PanelGroup direction="horizontal" className="h-full select-none">
      <Panel defaultSize={20} minSize={10}>
        {/* Hierarchy */}
        <div className="p-2 bg-gradient-to-b from-[blue] to-teal-500 text-white text-retro-shadow">
          <h2 className="text-lg">{controller.scene.path}</h2>
        </div>
        <div className="p-3 bg-slate-300 h-full" onContextMenu={showContextMenu}>
          <button className="button" onClick={() => createNewObject()}>New Object</button>
          {controller.scene.objects.map((gameObject, index) => (
            <SceneHierarchyObject key={index} gameObject={gameObject} controller={controller} contextActions={{ createNewObject, deleteObject }} />
          ))}
        </div>
      </Panel>
      <PanelResizeHandle className="drag-separator" />
      <Panel className="flex flex-col h-full">
        {/* Viewport */}
        <div className="p-2 bg-slate-300 flex flex-row shrink-0">
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Move)}><ArrowsPointingOutIcon className="icon mr-1" /> Move</button>
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Rotate)}><ArrowPathIcon className="icon mr-1" /> Rotate</button>
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Scale)}><ArrowsPointingInIcon className="icon mr-1" /> Scale</button>
        </div>
        <div className="grow relative">
          <div className="absolute inset-0">
            {/*
              @NOTE ye-olde absolute position hacks
              Babylon HATES to be in a flex-grow element,
                it causes it to expand the size of the canvas element every frame.
            */}
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
          </div>
        </div>
      </Panel>
      <PanelResizeHandle className="drag-separator" />
      <Panel defaultSize={20} minSize={10} className="flex flex-col">
        {/* Inspector */}
        <Inspector sceneViewController={controller} />
      </Panel>
    </PanelGroup>
  );
});

interface SceneHierarchyObjectProps {
  controller: SceneViewController;
  gameObject: GameObjectData;
  contextActions: {
    createNewObject: (parent?: GameObjectData | undefined) => void;
    deleteObject: (gameObject: GameObjectData) => void;
  };
  indentLevel?: number;
}
const SceneHierarchyObject: FunctionComponent<SceneHierarchyObjectProps> = observer(({ gameObject, indentLevel, controller, contextActions }) => {
  // Default `indentLevel` to 0 if not provided
  indentLevel ??= 0;

  // State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Computed state
  const hasChildren = gameObject.children.length > 0;
  const isSelected = controller.selectedObject === gameObject;

  const showContextMenu = async (e: React.MouseEvent) => {
    // @NOTE Skip context menu in browser
    if (isRunningInBrowser()) return;

    e.preventDefault();
    e.stopPropagation();

    const menuItems = await Promise.all([
      MenuItem.new({
        text: 'Create new object',
        action: () => {
          contextActions.createNewObject();
        },
      }),
      MenuItem.new({
        text: 'Create new child object',
        action: () => {
          contextActions.createNewObject(gameObject);
        },
      }),
      MenuItem.new({
        text: 'Delete object',
        action: () => {
          contextActions.deleteObject(gameObject);
        },
      }),
      // MenuItem.new({
      //   text: 'Delete',
      //   action: async () => {
      //     console.log(`[Action] Delete`);
      //   },
      // }),
      // PredefinedMenuItem.new({ item: 'Separator' }),
      // MenuItem.new({
      //   text: 'Duplicate',
      //   action: async () => {
      //     console.log(`[Action] Duplicate`);
      //   },
      // }),
      // PredefinedMenuItem.new({ item: 'Separator' }),
      // MenuItem.new({
      //   text: 'Export',
      //   action: async () => {
      //     console.log(`[Action] Export`);
      //   },
      // }),
    ]);

    const menu = await Menu.new({
      items: menuItems,
    });

    await menu.popup();
  }

  const onClickDelete = (e: MouseEvent) => {
    e.stopPropagation();
    contextActions.deleteObject(gameObject);
  }

  return (
    <>
      <div
        style={{ paddingLeft: `${indentLevel * 10}px` }}
        className={cn("w-full cursor-pointer flex flex-row")}
        onClick={() => controller.selectionManager.select(gameObject)}
        onContextMenu={showContextMenu}
      >
        <button className={cn("grow text-left hover:bg-blue-300 focus:bg-blue-300", { '!bg-blue-400': isSelected })}>
          <span className="mr-1">
            {hasChildren ? (
              <span onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? (
                  <ChevronRightIcon className="icon" />
                ) : (
                  <ChevronDownIcon className="icon" />
                )}
              </span>
            ) : (
              <ArrowTurnDownRightIcon className="icon opacity-20" />
            )}
          </span>
          {gameObject.name}
        </button>

        {isSelected && (
          <button className="bg-blue-400 hover:bg-blue-500 focus:bg-blue-500 active:bg-blue-600 px-2" onClick={onClickDelete}>
            <TrashIcon className="icon w-4" />
          </button>
        )}
      </div>

      {hasChildren && !isCollapsed && (
        gameObject.children.map((gameObject, index) => (
          <SceneHierarchyObject key={index} gameObject={gameObject} indentLevel={indentLevel + 1} controller={controller} contextActions={contextActions} />
        ))
      )}
    </>
  )
});

export default SceneViewComponent;
