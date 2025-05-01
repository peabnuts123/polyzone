import type { FunctionComponent } from "react";
import { useRef } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { ArrowLeftEndOnRectangleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useLibrary } from "@lib/index";
import { DragAndDropDataProvider } from '@lib/util/drag-and-drop';
import { MeshAssetData } from "@lib/project/data";
import { ModelsAndMaterials } from "@app/components/material-editor/ModelsAndMaterials";
import { TabBar, TabButtonProps, TabPage, TabProvider, useTabState } from "@app/components/tabs";
import { StatusBar } from "@app/components/composer/StatusBar";
import { useAssetDrop } from "@app/interactions";
import type { TabData } from "@lib/material-editor/MaterialEditorController";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import ModelView from "@app/components/material-editor/ModelView";



const ComposerPageWrapper: FunctionComponent = observer(({ }) => {
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
  const [{ isDragOverThisZone }, DropTarget] = useAssetDrop(
    AssetType.Mesh,
    ({ assetData: modelData }) => {
      const TabState = TabStateRef.current;
      if (TabState.currentTabPageId === undefined) {
        // No tab open - we must first open a tab to load the model into
        const newTabData = createNewTab();
        void MaterialEditorController.loadModelForTab(newTabData.id, modelData);
      } else {
        // If model is already open - switch to tab
        const existingTabForScene = MaterialEditorController.currentlyOpenTabs.find((tab) => tab.modelEditorController?.model.id === modelData.id);
        if (existingTabForScene !== undefined) {
          TabState.setCurrentTabPageId(existingTabForScene.id);
          return;
        } else {
          // Replace the current tab
          void MaterialEditorController.loadModelForTab(TabState.currentTabPageId, modelData);
        }
      }
    },
  );

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

  const openModelInAppropriateTab = (model: MeshAssetData): void => {
    // If model is already open - switch to tab
    const existingTabForScene = MaterialEditorController.currentlyOpenTabs.find((tab) => tab.modelEditorController?.model.id === model.id);
    if (existingTabForScene !== undefined) {
      TabState.setCurrentTabPageId(existingTabForScene.id);
      return;
    }

    const currentlyFocusedTabData = MaterialEditorController.currentlyOpenTabs.find((tab) => tab.id === TabState.currentTabPageId);

    // If current tab is empty, replace current tab,
    // Otherwise, open a new tab
    if (TabState.currentTabPageId !== undefined && currentlyFocusedTabData?.modelEditorController === undefined) {
      // The selected tab is empty - load into this tab
      void MaterialEditorController.loadModelForTab(TabState.currentTabPageId, model);
    } else {
      // No tab open / the current tab has a model loaded - load into a new tab
      const newTabData = createNewTab();
      void MaterialEditorController.loadModelForTab(newTabData.id, model);
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
        ...MaterialEditorController.currentlyOpenTabs.map((tab) => ({
          type: 'page',
          tabId: tab.id,
          innerContent: (
            <>
              <span className="mr-2">{tab.modelEditorController?.model.baseName || "No model selected"}</span>

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
        }) satisfies TabButtonProps as TabButtonProps),
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
            ref={DropTarget}
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
                {tab.modelEditorController ? (
                  <>
                    <ModelView controller={tab.modelEditorController} />
                  </>
                ) : (
                <div className="flex flex-col justify-center items-center h-full">
                  <h1 className="text-h2">Interface goes here</h1>
                </div>
                )}
              </TabPage>
            ))}
          </div>
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel minSize={10}>
          <ModelsAndMaterials openModel={openModelInAppropriateTab} />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </>
  );
});

export default ComposerPageWrapper;
