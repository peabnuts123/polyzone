import type { FunctionComponent } from "react";
import { useState } from "react";
import { observer } from "mobx-react-lite";

import { useLibrary } from "@lib/index";
import { createDirView } from "@lib/util/path";
import { ListItem } from '@app/components/common/ListItem';
import { AssetDbVirtualFile, AssetListFileItem } from "./AssetListFileItem";
import { AssetDbVirtualDirectory, AssetListDirectoryItem } from "./AssetListDirectoryItem";

export const AssetList: FunctionComponent = observer(({ }) => {
  // Hooks
  const { ProjectController } = useLibrary();

  // State
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);

  // Computed state
  const { assets } = ProjectController.project;
  const assetsDirView = createDirView(
    assets.getAll(),
    currentDirectory,
    (asset) => asset.pathList,
    (asset) => ({
      id: asset.id,
      type: 'file',
      data: asset,
    } satisfies AssetDbVirtualFile as AssetDbVirtualFile),
    (directoryName, asset) => ({
      id: asset.id,
      type: 'directory',
      name: directoryName,
    } satisfies AssetDbVirtualDirectory as AssetDbVirtualDirectory),
  );


  return (
    <div className="px-2 h-full overflow-y-scroll grow">
      {/* Parent directory button */}
      {/* Only visible if you are not in the root */}
      {currentDirectory.length > 0 && (
        <ListItem
          label=".."
          onClick={() => setCurrentDirectory(currentDirectory.slice(0, currentDirectory.length - 1))}
        />
      )}
      {/* Assets in the current folder */}
      {assetsDirView.map((asset) => {
        if (asset.type === 'file') {
          return (
            <AssetListFileItem
              key={asset.id}
              asset={asset}
            />
          );
        } else {
          return (
            <AssetListDirectoryItem
              key={asset.id}
              asset={asset}
              currentDirectory={currentDirectory}
              setCurrentDirectory={setCurrentDirectory}
            />
          );
        }
      })}
    </div>
  );
});
