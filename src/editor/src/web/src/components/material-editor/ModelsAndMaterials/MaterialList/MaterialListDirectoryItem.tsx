import { FunctionComponent } from "react";
import { FolderIcon } from '@heroicons/react/24/outline';
import cn from 'classnames';
import { observer } from "mobx-react-lite";

import { baseName } from "@polyzone/runtime/src/util";
import { AssetType } from "@polyzone/runtime/src/cartridge";

import { MoveAssetMutation } from "@lib/mutation/Project/mutations";
import { useLibrary } from "@lib/index";
import { ListItem } from '@app/components/common/ListItem';
import { useAssetDrop } from "@app/interactions";

export interface MaterialListVirtualDirectory {
  id: string;
  type: 'directory';
  name: string;
}

export interface MaterialListDirectoryItemProps {
  directory: MaterialListVirtualDirectory;
  currentDirectory: string[];
  setCurrentDirectory: (path: string[]) => void;
}

export const MaterialListDirectoryItem: FunctionComponent<MaterialListDirectoryItemProps> = observer(({ directory, currentDirectory, setCurrentDirectory }) => {
  // Hooks
  const { ProjectController } = useLibrary();

  const [{ isDragOverThisZone }, DropTarget] = useAssetDrop(
    AssetType.Material,
    ({ assetData }) => {
      const newPath = currentDirectory
        .concat(directory.name, baseName(assetData.path))
        .join('/');
      void ProjectController.mutator.apply(new MoveAssetMutation(assetData.id, newPath));
    },
  );

  return (
    <ListItem
      label={directory.name}
      Icon={FolderIcon}
      classNames={cn({
        "bg-blue-200": isDragOverThisZone,
      })}
      onClick={() => {
        setCurrentDirectory([...currentDirectory, directory.name]);
      }}
      innerRef={DropTarget}
    />
  );
});
