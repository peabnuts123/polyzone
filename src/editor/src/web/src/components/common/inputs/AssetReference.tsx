import { FunctionComponent } from "react";
import cn from 'classnames';
import { observer } from "mobx-react-lite";
import { TrashIcon } from '@heroicons/react/24/solid';

import { AssetType } from "@polyzone/runtime/src/cartridge";

import { useLibrary } from "@lib/index";
import { showModal } from '@lib/modal';
import { AssetDataOfType } from "@lib/project/data/AssetData";
import { useAssetDrop } from "@app/interactions/assets";
import { AssetReferenceModalAssetReference, AssetReferenceModalData, AssetReferenceResultPayload } from "@app/pages/modal/asset-reference";
import { getIconForAssetType } from "@app/components/composer/AssetsAndScenes/AssetList";

interface CommonProps<TAssetType extends AssetType> {
  label: string;
  assetType: TAssetType;
  asset: AssetDataOfType<TAssetType> | undefined;
  onAssetChange?: (asset: AssetDataOfType<TAssetType> | undefined) => void;
  className?: string;
  enabled?: boolean;
}

interface SimpleProps<TAssetType extends AssetType> extends CommonProps<TAssetType> {

}

interface TogglableProps<TAssetType extends AssetType> extends CommonProps<TAssetType> {
  togglable: true;
  onEnabledChange?: (newValue: boolean) => void;
}

export type AssetReferenceProps<TAssetType extends AssetType> = SimpleProps<TAssetType> | TogglableProps<TAssetType>;

export function createAssetReferenceComponentOfType<TAssetType extends AssetType>(): FunctionComponent<AssetReferenceProps<TAssetType>> {
  const AssetReference: FunctionComponent<AssetReferenceProps<TAssetType>> = observer((props) => {
    const {
      label,
      assetType,
      asset,
      className,
    } = props;

    const isTogglable = 'togglable' in props;

    // Prop defaults
    const enabled = props.enabled !== undefined ? props.enabled : true;
    const onAssetChange = props.onAssetChange ?? (() => { });
    const onEnabledChange = (isTogglable && props.onEnabledChange ? props.onEnabledChange : () => { });

    const { ProjectController } = useLibrary();

    // Computed state
    const AssetIcon = getIconForAssetType(assetType);
    const hasAsset = asset !== undefined;

    // Drag and drop hook
    const [{ isDragOverThisZone }, DropTarget] = useAssetDrop<TAssetType, HTMLButtonElement>(assetType,
      /* @NOTE On drop */
      ({ assetData }) => onAssetChange(assetData),
    );

    // Functions
    const onClickDelete = (): void => {
      onAssetChange(undefined);
    };
    const onClickAssetButton = async (): Promise<void> => {
      // Map asset data into modal data
      const assets = ProjectController.project.assets.getAll()
        .filter((asset) => asset.type === assetType)
        .map((assetData) => ({
          id: assetData.id,
          type: assetData.type as TAssetType,
          name: assetData.baseName,
          path: assetData.pathList,
        } satisfies AssetReferenceModalAssetReference<TAssetType>));

      // Show modal
      const result = await showModal<AssetReferenceModalData<TAssetType>, AssetReferenceResultPayload>(
        '/modal/asset-reference',
        { assets },
      );

      // Handle result from modal
      if (result.selected) {
        // User selected an asset in the modal
        // Resolve asset ID back into full AssetData instance
        console.log(`[AssetReference] (onClickAssetButton) Selected asset: ${result.assetId}`);
        const selectedAsset = ProjectController.project.assets.findById(result.assetId) as AssetDataOfType<TAssetType>;
        onAssetChange(selectedAsset);
      } else {
        // User cancelled
        console.log(`[AssetReference] (onClickAssetButton) Modal cancelled.`);
      }
    };

    return (
      <div className={className}>
        <div>
          <label className="font-bold flex flex-row items-center">
            {isTogglable && (
              <input
                type="checkbox"
                className="mr-2 w-4 h-4"
                checked={enabled}
                onChange={(e) => onEnabledChange(e.target.checked)}
              />
            )}
            {label}
          </label>
        </div>
        <div className="flex flex-row">
          {/* Asset icon */}
          <div className={cn(
            "flex bg-blue-300 justify-center items-center p-2",
            {
              "opacity-30": !enabled,
            },
          )}>
            <AssetIcon className="icon" />
          </div>

          {/* Asset reference / name */}
          <button
            ref={DropTarget}
            className={cn(
              "w-full p-2 bg-white overflow-scroll whitespace-nowrap cursor-pointer text-left overflow-ellipsis disabled:opacity-30",
              {
                "!bg-blue-300": isDragOverThisZone,
                'italic': !hasAsset,
              })}
            onClick={onClickAssetButton}
            disabled={!enabled}
          >
            {hasAsset ? (
              asset.path
            ) : (
              "No asset assigned"
            )}
          </button>

          {/* Delete icon */}
          {hasAsset && (
            <button
              className="flex bg-white hover:bg-blue-300 active:bg-blue-500 justify-center items-center p-2 cursor-pointer"
              onClick={onClickDelete}
            >
              <TrashIcon className="icon w-4" />
            </button>
          )}
        </div>
      </div>
    );
  });
  return AssetReference;
}
