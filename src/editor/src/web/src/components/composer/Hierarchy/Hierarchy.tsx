import type { ISceneViewController } from "@lib/composer/scene";
import type { FunctionComponent, MouseEventHandler, MouseEvent } from "react";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { PlusIcon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";
import { v4 as uuid } from 'uuid';

import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";

import { CreateGameObjectFromDefinitionMutation, CreateGameObjectType, DeleteGameObjectMutation } from "@lib/mutation/SceneView/mutations";
import { GameObjectData } from "@lib/project/data";
import { isRunningInBrowser } from "@lib/tauri";

import { gameObjectAt } from "./util";
import { HierarchyObject } from "./HierarchyObject";

interface Props {
  controller: ISceneViewController;
}

export const Hierarchy: FunctionComponent<Props> = observer(({ controller }) => {
  // Functions
  const createNewObject = (parent: GameObjectData | undefined = undefined): void => {
    const newObjectDefinition: GameObjectDefinition = {
      id: uuid(),
      name: "New Object",
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      children: [],
      components: [],
    };

    void controller.mutatorNew.apply(new CreateGameObjectFromDefinitionMutation({
      definition: newObjectDefinition,
      parent,
      type: CreateGameObjectType.CreateNew,
    }));
  };
  const deleteObject = (gameObjectData: GameObjectData): void => {
    void controller.mutatorNew.apply(new DeleteGameObjectMutation(gameObjectData));
  };
  const showContextMenu: MouseEventHandler = async (e) => {
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
  };
  const onClickBackground = (e: MouseEvent): void => {
    const isTargetBlankSpace = (e.target as HTMLElement).getAttribute('data-blank-space') === 'true';
    if (isTargetBlankSpace) {
      controller.selectionManager.deselectAll();
    }
  };

  return (
    <div className="h-full flex flex-col" data-name="Hierarchy">
      {/* Heading */}
      <div className="p-2 bg-gradient-to-b from-[blue] to-teal-500 text-white text-retro-shadow">
        <h2 className="text-lg">{controller.scene.path}</h2>
      </div>
      {/* Elements */}
      <div className="bg-slate-300 grow flex flex-col min-h-0" onContextMenu={showContextMenu}>
        <div className="flex flex-row p-2">
          <button className="button w-full" onClick={() => createNewObject()}><PlusIcon className="icon mr-1" /> New object</button>
        </div>
        <div className="px-3 flex flex-col grow overflow-y-scroll" onClick={onClickBackground} data-blank-space={true}>
          {controller.scene.objects.map((gameObject, index) => (
            <HierarchyObject
              key={gameObject.id}
              controller={controller}
              gameObject={gameObject}
              parentGameObject={undefined} // Top-level objects have no parent
              contextActions={{ createNewObject, deleteObject }}
              previousSiblingId={gameObjectAt(controller.scene.objects, index - 1)}
              nextSiblingId={gameObjectAt(controller.scene.objects, index + 1)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
