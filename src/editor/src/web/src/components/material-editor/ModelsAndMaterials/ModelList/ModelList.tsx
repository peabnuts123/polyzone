import type { FunctionComponent } from "react";
import { useState } from "react";
import { observer } from "mobx-react-lite";

import { toPathList } from "@polyzone/runtime/src/util";

import { useLibrary } from "@lib/index";
import { createDirView } from "@lib/util/path";
import { MeshAssetData } from "@lib/project/data/assets";
import { ListItem } from '@app/components/common/ListItem';
import { ModelListFileItem, ModelListVirtualFile } from './ModelListFileItem';
import { ModelListDirectoryItem, ModelListVirtualDirectory } from './ModelListDirectoryItem';

import { AssetType } from "@polyzone/runtime/src/cartridge";

interface Props {
  openModel: (scene: MeshAssetData) => void;
}

export const ModelList: FunctionComponent<Props> = observer(({ openModel }) => {
  // Hooks
  const { ProjectController } = useLibrary();


  // State
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);

  // Computed state
  const { assets } = ProjectController.project;
  const modelAssets = assets.getAllOfType(AssetType.Mesh);
  const modelsDirView = createDirView(
    modelAssets,
    currentDirectory,
    /* toPath: */(model) => toPathList(model.path),
    /* toFile: */(model) => ({
      id: model.id,
      type: 'file',
      model,
    } satisfies ModelListVirtualFile as ModelListVirtualFile),
    /* toDirectory: */(directoryName, model) => ({
      id: model.id,
      type: 'directory',
      name: directoryName,
    } satisfies ModelListVirtualDirectory as ModelListVirtualDirectory),
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

      {/* Models in the current folder */}
      {modelsDirView.map((item) => {
        if (item.type === 'file') {
          return (
            <ModelListFileItem
              key={item.id}
              file={item}
              onClick={() => openModel(item.model)}
            />
          );
        } else {
          return (
            <ModelListDirectoryItem
              key={item.id}
              directory={item}
              currentDirectory={currentDirectory}
              setCurrentDirectory={setCurrentDirectory}
            />
          );
        }
      })}
    </div>
  );
});
