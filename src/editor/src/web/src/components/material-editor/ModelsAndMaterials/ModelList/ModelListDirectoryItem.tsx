import { FunctionComponent } from "react";
import { FolderIcon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";

import { ListItem } from "@app/components/common/ListItem";

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
    <ListItem
      label={directory.name}
      Icon={FolderIcon}
      onClick={() => {
        setCurrentDirectory([...currentDirectory, directory.name]);
      }}
    />
  );
});
