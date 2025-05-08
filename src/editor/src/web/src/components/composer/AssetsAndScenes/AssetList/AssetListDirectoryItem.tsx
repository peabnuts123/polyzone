import { FunctionComponent } from "react";
import { FolderIcon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";

import { ListItem } from '@app/components/common/ListItem';

export interface AssetDbVirtualDirectory {
  id: string;
  type: 'directory';
  name: string;
}

export interface AssetListDirectoryItemProps {
  asset: AssetDbVirtualDirectory;
  currentDirectory: string[];
  setCurrentDirectory: (path: string[]) => void;
}

export const AssetListDirectoryItem: FunctionComponent<AssetListDirectoryItemProps> = observer(({ asset, currentDirectory, setCurrentDirectory }) => {
  return (
    <ListItem
      label={asset.name}
      Icon={FolderIcon}
      onClick={() => {
        setCurrentDirectory([...currentDirectory, asset.name]);
      }}
    />
  );
});
