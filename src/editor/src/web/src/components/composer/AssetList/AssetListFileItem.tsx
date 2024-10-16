import { FunctionComponent } from "react";
import { AssetDbVirtualFile, AssetType } from "@fantasy-console/runtime/src/cartridge";
import { DocumentIcon, DocumentTextIcon, PhotoIcon, CubeIcon } from '@heroicons/react/24/outline'
import cn from 'classnames';
import { observer } from "mobx-react-lite";

import { AssetListItemCommon } from './AssetListItemCommon';
import { useAssetDrag } from "@app/interactions/assets";


export interface AssetListFileItemProps {
  asset: AssetDbVirtualFile;
}

export const AssetListFileItem: FunctionComponent<AssetListFileItemProps> = observer(({ asset }) => {
  let AssetIcon = getIconForAssetType(asset.data.type);

  // Drag and drop hook
  let [{ }, DragSource] = useAssetDrag(asset.data);

  return (
    <AssetListItemCommon
      asset={asset}
      Icon={AssetIcon}
      classNames={cn("cursor-grab")}
      innerRef={DragSource}
    />
  );
});


export function getIconForAssetType(assetType: AssetType) {
  switch (assetType) {
    case AssetType.Mesh:
      return CubeIcon;
    case AssetType.Script:
      return DocumentTextIcon;
    case AssetType.Texture:
      return PhotoIcon;
    default:
      return DocumentIcon;
  }
}