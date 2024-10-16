import { observer } from 'mobx-react-lite';

import { AssetType, ScriptAssetData } from '@fantasy-console/runtime/src/cartridge';

import type { ScriptComponentData } from "@lib/composer/data";
import { SetGameObjectScriptComponentAssetMutation } from '@lib/mutation/scene/mutations';
import { createAssetReferenceComponentOfType } from '../AssetReference';
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

const ScriptAssetReference = createAssetReferenceComponentOfType<AssetType.Script>();

export const ScriptComponentInspector: InspectorComponent<ScriptComponentData> = observer(({ component, controller, gameObject }) => {
  const onUpdateScriptAsset = (scriptAsset: ScriptAssetData) => {
    controller.mutator.apply(
      new SetGameObjectScriptComponentAssetMutation(
        gameObject,
        component,
        scriptAsset
      )
    );
  };

  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <ScriptAssetReference
        label='Script'
        assetType={AssetType.Script}
        asset={component.scriptAsset}
        onAssetChange={onUpdateScriptAsset}
      />
    </InspectorComponentBase>
  )
});
