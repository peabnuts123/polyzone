import { FunctionComponent } from "react";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { DocumentIcon, DocumentTextIcon, PhotoIcon, CubeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";

import { useAssetDrag } from "@app/interactions/assets";
import { ListItem } from '@app/components/common/ListItem';
import { AssetData } from "@lib/project/data";

export interface AssetDbVirtualFile {
  id: string;
  type: 'file';
  data: AssetData;
}

export interface AssetListFileItemProps {
  asset: AssetDbVirtualFile;
}

export const AssetListFileItem: FunctionComponent<AssetListFileItemProps> = observer(({ asset }) => {
  const AssetIcon = getIconForAssetType(asset.data.type);

  // Drag and drop hook
  const [{ }, DragSource] = useAssetDrag(asset.data);

  // Computed state
  const fileName = asset.data.baseName;

  return (
    <ListItem
      label={fileName}
      Icon={AssetIcon}
      classNames="cursor-grab"
      innerRef={DragSource}
    />
  );
});


export function getIconForAssetType(assetType: AssetType): typeof CubeIcon {
  switch (assetType) {
    case AssetType.Mesh:
      return CubeIcon;
    case AssetType.Script:
      return DocumentTextIcon;
    case AssetType.Texture:
      return PhotoIcon;
    case AssetType.Material:
      return GlobeAltIcon;
    default:
      return DocumentIcon;
  }
}
