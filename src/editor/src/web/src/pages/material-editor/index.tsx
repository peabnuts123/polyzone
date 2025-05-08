import type { FunctionComponent } from "react";
import { useRef } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { ArrowLeftEndOnRectangleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useLibrary } from "@lib/index";
import { DragAndDropDataProvider } from '@lib/util/drag-and-drop';
import { MaterialAssetData, MeshAssetData } from "@lib/project/data";
import { ModelsAndMaterials } from "@app/components/material-editor/ModelsAndMaterials";
import { TabBar, TabButtonProps, TabPage, TabProvider, useTabState } from "@app/components/tabs";
import { StatusBar } from "@app/components/composer/StatusBar";
import { useAssetDrop } from "@app/interactions";
import type { TabData } from "@lib/material-editor/MaterialEditorController";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { ModelView } from "@app/components/material-editor/ModelView";
import { MaterialView } from "@app/components/material-editor/MaterialView";



const MaterialEditorPageWrapper: FunctionComponent = observer(({ }) => {
  // Hooks
  const { MaterialEditorController } = useLibrary();

  return (
    <DragAndDropDataProvider>
      <TabProvider defaultTabId={MaterialEditorController.currentlyOpenTabs[0]?.id}>
        <MaterialEditorPage />
      </TabProvider>
    </DragAndDropDataProvider >
  );
});

const MaterialEditorPage: FunctionComponent = observer(({ }) => {
  // Hooks
  const { MaterialEditorController } = useLibrary();
  const TabState = useTabState();

  // Store tab state in ref to avoid capturing it in a closure
  const TabStateRef = useRef<typeof TabState>(undefined!);
  TabStateRef.current = TabState;

  // Computed state
  const noTabsOpen = MaterialEditorController.currentlyOpenTabs.length === 0;
  const [{ isDragOverThisZone: isModelDragOverThisZone }, ModelDropTarget] = useAssetDrop(
    AssetType.Mesh,
    ({ assetData: modelData }) => {
      openModelOrMaterialInAppropriateTab(modelData, true);
    },
  );
  const [{ isDragOverThisZone: isMaterialDragOverThisZone }, MaterialDropTarget] = useAssetDrop(
    AssetType.Material,
    ({ assetData: materialData }) => {
      openModelOrMaterialInAppropriateTab(materialData, true);
    },
  );
  const isDragOverThisZone = isModelDragOverThisZone || isMaterialDragOverThisZone;

  // Functions
  const createNewTab = (): TabData => {
    const newTabData = MaterialEditorController.openNewTab();

    setTimeout(() =>
      TabState.setCurrentTabPageId(newTabData.id),
    );
    return newTabData;
  };

  const closeTab = (tabId: string): void => {
    // Take note of some things before closing the tab
    const isClosingCurrentlyActiveTab = TabState.currentTabPageId === tabId;
    let oldTabIndex = MaterialEditorController.currentlyOpenTabs.findIndex((tab) => tab.id === tabId);

    MaterialEditorController.closeTab(tabId);

    if (MaterialEditorController.currentlyOpenTabs.length === 0) {
      // If there's no tabs left - clear out the active tab
      TabState.setCurrentTabPageId(undefined);
    } else if (isClosingCurrentlyActiveTab) {
      // Switch to the next tab if you're closing this tab (do nothing otherwise)

      // Clamp `oldTabIndex` to valid range
      if (oldTabIndex >= MaterialEditorController.currentlyOpenTabs.length) {
        oldTabIndex = MaterialEditorController.currentlyOpenTabs.length - 1;
      }
      const nextTab = MaterialEditorController.currentlyOpenTabs[oldTabIndex];
      setTimeout(() => {
        TabState.setCurrentTabPageId(nextTab.id);
      });
    }
  };

  const openModelOrMaterialInAppropriateTab = (modelOrMaterial: MeshAssetData | MaterialAssetData, allowReplace: boolean = false): void => {
    // If target is already open - switch to tab
    const existingModelTab = MaterialEditorController.currentlyOpenTabs.find((tab) => tab.type === 'model' && tab.modelEditorController?.model.id === modelOrMaterial.id);
    const existingMaterialTab = MaterialEditorController.currentlyOpenTabs.find((tab) => tab.type === 'material' && tab.materialEditorController?.materialAssetData.id === modelOrMaterial.id);
    if (existingModelTab !== undefined || existingMaterialTab !== undefined) {
      // @NOTE At least one of the the values must be defined
      TabState.setCurrentTabPageId((existingModelTab?.id || existingMaterialTab?.id)!);
      return;
    }

    // If current tab is empty (or replaceable), replace current tab,
    // Otherwise, open a new tab
    let targetTabId: string;
    if (TabState.currentTabPageId !== undefined && (MaterialEditorController.isTabEmpty(TabState.currentTabPageId) || allowReplace)) {
      // The selected tab is empty (or replaceable) - load into this tab
      targetTabId = TabState.currentTabPageId;
    } else {
      // No tab open / the current tab has a model loaded - load into a new tab
      const newTabData = createNewTab();
      targetTabId = newTabData.id;
    }

    if (modelOrMaterial.type === AssetType.Mesh) {
      void MaterialEditorController.loadModelForTab(targetTabId, modelOrMaterial);
    } else if (modelOrMaterial.type === AssetType.Material) {
      void MaterialEditorController.loadMaterialForTab(targetTabId, modelOrMaterial);
    } else {
      throw new Error(`Unimplemented asset type ${(modelOrMaterial as { type: any }).type}`);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex items-center w-full justify-between py-1 px-2">
        {/* Exit */}
        <Link href="/" className="button"><ArrowLeftEndOnRectangleIcon className="icon mr-1" /> Exit</Link>
      </header>

      <TabBar tabs={[
        ...MaterialEditorController.currentlyOpenTabs.map((tab) => {
          let tabName: string;
          if (tab.type === 'model') {
            tabName = tab.modelEditorController.model.baseName;
          } else if (tab.type === 'material') {
            tabName = tab.materialEditorController.materialAssetData.baseName;
          } else {
            tabName = "Nothing selected";
          }

          return ({
            type: 'page',
            tabId: tab.id,
            innerContent: (
              <>
                <span className="mr-2">{tabName}</span>

                <div
                  role="button"
                  tabIndex={0}
                  className="hover:bg-pink-400 p-1 inline-flex justify-center items-center"
                  onClick={() => closeTab(tab.id)}
                >
                  <XMarkIcon className="icon w-4" />
                </div>
              </>
            ),
          }) satisfies TabButtonProps as TabButtonProps;
        }),
        {
          type: 'action',
          innerContent: (
            <>
              <PlusIcon className="icon w-4" />
            </>
          ),
          onClick: createNewTab,
        },
      ]} />

      <PanelGroup direction="vertical">
        <Panel defaultSize={75} minSize={25}>
          <div
            ref={(element) => {
              ModelDropTarget.current = element;
              MaterialDropTarget.current = element;
            }}
            className="w-full h-full relative"
          >
            {/* Overlay for scene drag drop */}
            {isDragOverThisZone &&
              <div className="w-full h-full absolute inset-0 bg-blue-300 opacity-50 z-[1]"></div>
            }
            {noTabsOpen && (
              <div className="flex flex-col justify-center items-center h-full">
                <h1 className="text-h2">No open tabs!</h1>
                <p>You gonna do something about ? 👀</p>
              </div>
            )}

            {MaterialEditorController.currentlyOpenTabs.map((tab) => (
              <TabPage tabId={tab.id} key={tab.id}>
                {tab.type === 'model' ? (
                  <>
                    <ModelView controller={tab.modelEditorController} />
                  </>
                ) : tab.type === 'material' ? (
                  <>
                    <MaterialView controller={tab.materialEditorController} />
                  </>
                ) : (
                  <div className="flex flex-col justify-center items-center h-full">
                    <h1 className="text-h2">Nothing loaded</h1>
                  </div>
                )}
              </TabPage>
            ))}
          </div>
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel minSize={10}>
          <ModelsAndMaterials
            openModel={openModelOrMaterialInAppropriateTab}
            openMaterial={openModelOrMaterialInAppropriateTab}
          />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </>
  );
});

export default MaterialEditorPageWrapper;
