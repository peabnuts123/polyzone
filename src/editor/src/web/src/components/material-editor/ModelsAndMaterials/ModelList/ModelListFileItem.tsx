import type { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { MeshAssetData } from "@lib/project/data/assets";
import { useAssetDrag } from "@app/interactions/assets";
import { ListItem } from "@app/components/common/ListItem";
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
  const fileName = file.model.baseName;
  const AssetIcon = getIconForAssetType(file.model.type);

  return (
    <ListItem
      label={fileName}
      Icon={AssetIcon}
      classNames="cursor-grab"
      onClick={onClick}
      innerRef={DragSource}
    />
  );
});
