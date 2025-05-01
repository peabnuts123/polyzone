import type { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { baseName } from "@polyzone/runtime/src/util";

import { MeshAssetData } from "@lib/project/data/assets";
import { useAssetDrag } from "@app/interactions/assets";
import { ListItemCommon } from "@app/components/composer/AssetsAndScenes"; // @TODO move?
import { getIconForAssetType } from "@app/components/composer/AssetsAndScenes/AssetList";


export interface ModelListVirtualFile {
  id: string;
  type: 'file';
  model: MeshAssetData;
}

export interface ModelListFileItemProps {
  file: ModelListVirtualFile;
  onClick?: () => void;
}

export const ModelListFileItem: FunctionComponent<ModelListFileItemProps> = observer(({ file, onClick }) => {
  // Prop defaults
  onClick ??= () => { };

  // Hooks
  const [{ }, DragSource] = useAssetDrag(file.model);

  // Computed state
  const fileName = baseName(file.model.path);
  const AssetIcon = getIconForAssetType(file.model.type);

  return (
    <ListItemCommon
      label={fileName}
      Icon={AssetIcon}
      classNames="cursor-grab"
      onClick={onClick}
      innerRef={DragSource}
    />
  );
});
