import type { FunctionComponent, MouseEventHandler } from "react";
import { useState } from "react";
import { PlusIcon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";
import cn from 'classnames';

import { baseName, toPathList } from "@polyzone/runtime/src/util";

import { useLibrary } from "@lib/index";
import { CreateNewMaterialAssetMutation, MoveAssetMutation } from "@lib/mutation/Project/mutations";
import { createDirView } from "@lib/util/path";
import { MaterialAssetData } from "@lib/project/data";
import { useAssetDrop } from "@app/interactions";
import { ListItem } from '@app/components/common/ListItem';
import { CreateNewMaterialListFileItem, MaterialListFileItem, MaterialListVirtualFile } from './MaterialListFileItem';
import { MaterialListDirectoryItem, MaterialListVirtualDirectory } from './MaterialListDirectoryItem';
import { AssetType } from "@polyzone/runtime/src/cartridge/archive";

interface Props {
  openMaterial: (material: MaterialAssetData) => void;
}

export const MaterialList: FunctionComponent<Props> = observer(({ openMaterial: openMaterial }) => {
  // Hooks
  const { ProjectController } = useLibrary();

  // State
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);
  const [tempCreatePath, setTempCreatePath] = useState<string | undefined>(undefined);

  // Computed state
  const { assets } = ProjectController.project;
  const materialAssets = assets.getAllOfType(AssetType.Material);
  const materialsDirView = createDirView(
    materialAssets,
    currentDirectory,
    /* toPath: */(material) => toPathList(material.path),
    /* toFile: */(material) => ({
      id: material.id,
      type: 'file',
      material,
    } satisfies MaterialListVirtualFile as MaterialListVirtualFile),
    /* toDirectory: */(directoryName, material) => ({
      id: material.id,
      type: 'directory',
      name: directoryName,
    } satisfies MaterialListVirtualDirectory as MaterialListVirtualDirectory),
  );
  const [{ isDragOverThisZone: isDragOverParentDirectory }, ParentDirectoryDropTarget] = useAssetDrop(
    AssetType.Material,
    ({ assetData }) => {
      const newPath = currentDirectory.slice(0, currentDirectory.length - 1)
        .concat(baseName(assetData.path))
        .join('/');
      void ProjectController.mutator.apply(new MoveAssetMutation(assetData.id, newPath));
    },
  );

  // Functions
  const onClickNewMaterial: MouseEventHandler = () => {
    const namesInCurrentDirectory = materialsDirView.filter((item) => item.type === 'file').map((item) => baseName(item.material.path));
    const isUniqueName = (name: string): boolean => {
      return !namesInCurrentDirectory.some((otherName) => otherName.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0);
    };
    let newMaterialName = "new material";
    let deduplicationNumber = 1;
    while (!isUniqueName(`${newMaterialName}.pzmat`)) {
      newMaterialName = `new material ${deduplicationNumber++}`;
    }

    const newMaterialPath = [...currentDirectory, `${newMaterialName}.pzmat`].join('/');
    setTempCreatePath(newMaterialPath);
  };

  const onFinishedNamingNewMaterial = (newMaterialPath: string): void => {
    setTempCreatePath(undefined);
    void ProjectController.mutator.apply(new CreateNewMaterialAssetMutation(newMaterialPath));
  };

  const onCancelCreateNewMaterial = (): void => {
    setTempCreatePath(undefined);
  };

  return (
    <div className="px-2 h-full overflow-y-scroll grow">
      <button
        className="button"
        onClick={onClickNewMaterial}
      >
        <PlusIcon className="icon mr-1" /> New material
      </button>

      {/* @TODO scroll should start here */}

      {/* Parent directory button */}
      {/* Only visible if you are not in the root */}
      {currentDirectory.length > 0 && (
        <ListItem
          label=".."
          onClick={() => setCurrentDirectory(currentDirectory.slice(0, currentDirectory.length - 1))}
          classNames={cn({
            "bg-blue-200": isDragOverParentDirectory,
          })}
          innerRef={ParentDirectoryDropTarget}
        />
      )}

      {/* Assets in the current folder */}
      {materialsDirView.map((item) => {
        if (item.type === 'file') {
          return (
            <MaterialListFileItem
              key={item.id}
              file={item}
              onClick={() => openMaterial(item.material)}
            />
          );
        } else {
          return (
            <MaterialListDirectoryItem
              key={item.id}
              directory={item}
              currentDirectory={currentDirectory}
              setCurrentDirectory={setCurrentDirectory}
            />
          );
        }
      })}

      {/* New material slot */}
      {tempCreatePath && (
        <CreateNewMaterialListFileItem
          newPath={tempCreatePath}
          onCreate={onFinishedNamingNewMaterial}
          onCancel={onCancelCreateNewMaterial}
        />
      )}
    </div>
  );
});
