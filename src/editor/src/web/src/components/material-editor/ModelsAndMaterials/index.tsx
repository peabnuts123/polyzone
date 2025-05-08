import type { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { MaterialAssetData, MeshAssetData } from "@lib/project/data/assets";
import { TabProvider, TabBar, TabPage } from "@app/components/tabs";
import { ModelList } from "./ModelList";
import { MaterialList } from "./MaterialList";

interface Props {
  openModel: (scene: MeshAssetData) => void;
  openMaterial: (material: MaterialAssetData) => void;
}


export const ModelsAndMaterials: FunctionComponent<Props> = observer(({ openModel, openMaterial }) => {
  return (
    <TabProvider defaultTabId="models">
      <div className="h-full flex flex-col">
        <div className="pt-2 bg-gradient-to-b from-[blue] to-cyan-400 shrink-0 ">
          <TabBar tabs={[
            {
              type: 'page',
              tabId: 'models',
              label: "Models",
            },
            {
              type: 'page',
              tabId: 'materials',
              label: "Shared Materials",
            },
          ]} />
        </div>

        <TabPage tabId="models">
          <ModelList openModel={openModel} />
        </TabPage>

        <TabPage tabId="materials">
          <div className="px-2 h-full overflow-y-scroll grow">
            <MaterialList openMaterial={openMaterial} />
          </div>
        </TabPage>
      </div>
    </TabProvider>
  );
});
