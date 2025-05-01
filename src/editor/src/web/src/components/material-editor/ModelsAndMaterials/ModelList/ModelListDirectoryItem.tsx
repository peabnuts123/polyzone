import { FunctionComponent } from "react";
import { FolderIcon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";

import { ListItemCommon } from "@app/components/composer/AssetsAndScenes"; // @TODO move?

export interface ModelListVirtualDirectory {
  id: string;
  type: 'directory';
  name: string;
}

export interface ModelListDirectoryItemProps {
  directory: ModelListVirtualDirectory;
  currentDirectory: string[];
  setCurrentDirectory: (path: string[]) => void;
}

export const ModelListDirectoryItem: FunctionComponent<ModelListDirectoryItemProps> = observer(({ directory, currentDirectory, setCurrentDirectory }) => {
  return (
    <ListItemCommon
      label={directory.name}
      Icon={FolderIcon}
      onClick={() => {
        setCurrentDirectory([...currentDirectory, directory.name]);
      }}
    />
  );
});
