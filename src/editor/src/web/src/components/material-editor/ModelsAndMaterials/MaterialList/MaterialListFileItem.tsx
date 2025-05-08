import { useEffect, useRef, useState } from "react";
import type { ChangeEventHandler, FocusEventHandler, FunctionComponent, KeyboardEventHandler, MouseEventHandler } from "react";
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";
import { Menu, MenuItem } from "@tauri-apps/api/menu";

import { baseName, rename } from "@polyzone/runtime/src/util";
import { MaterialAssetData } from "@lib/project/data";
import { useLibrary } from "@lib/index";
import { isRunningInBrowser } from "@lib/tauri";
import { MoveAssetMutation } from "@lib/mutation/Project/mutations";
import { convertToSafeFileName } from "@lib/util/path";
import { useAssetDrag } from "@app/interactions";
import { ListItem } from '@app/components/common/ListItem';


export interface MaterialListVirtualFile {
  id: string;
  type: 'file';
  material: MaterialAssetData;
}

export interface MaterialListFileItemProps {
  file: MaterialListVirtualFile;
  onClick?: () => void;
}

export const MaterialListFileItem: FunctionComponent<MaterialListFileItemProps> = observer(({ file, onClick }) => {
  // Prop defaults
  onClick ??= () => { };

  // Hooks
  const [{ }, DragSource] = useAssetDrag(file.material);
  const { ProjectController } = useLibrary();

  // State
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  // Computed state
  const fileName = file.material.baseName;
  const fileNameWithoutExtension = fileName.replace(/\.pzmat$/, '');

  // Functions
  const showContextMenu: MouseEventHandler = async (e) => {
    // @NOTE Skip context menu in browser
    if (isRunningInBrowser()) return;

    e.preventDefault();
    e.stopPropagation();

    const menuItems = await Promise.all([
      MenuItem.new({
        text: 'Rename material',
        action: () => {
          setIsRenaming(true);
        },
      }),
    ]);

    const menu = await Menu.new({
      items: menuItems,
    });

    await menu.popup();
  };

  const onRenamed = (newBaseName: string): void => {
    setIsRenaming(false);
    if (newBaseName !== fileName) {
      const newPath = rename(file.material.path, newBaseName);
      ProjectController.mutator.apply(new MoveAssetMutation(file.material.id, newPath));
    }
  };

  return (
    isRenaming ? (
      <div
        className="w-full my-2 flex flex-row items-center p-2 border select-none bg-white"
      >
        <GlobeAltIcon className="icon mr-2 shrink-0" />
        <MaterialNameTextInput
          value={fileNameWithoutExtension}
          onFinishedEditing={onRenamed}
          onCanceledEditing={() => setIsRenaming(false)}
        />
      </div>
    ) : (
      <ListItem
        label={fileName}
        Icon={GlobeAltIcon}
        classNames="cursor-grab"
        onClick={onClick}
        onContextMenu={showContextMenu}
        innerRef={DragSource}
      />
    )
  );
});

export interface CreateNewMaterialListFileItemProps {
  newPath: string,
  onCreate: (newPath: string) => void,
  onCancel: () => void,
}
/**
 * Stripped down version of MaterialListFileItem for creating a new material.
 * Only used to name the new material, once the material is named, a real MaterialListFileItem
 * is put in its place
 */
// @TODO Identical to `CreateNewSceneListFileItem`
export const CreateNewMaterialListFileItem: FunctionComponent<CreateNewMaterialListFileItemProps> = observer(({ newPath, onCreate, onCancel }) => {
  // Computed state
  const fileName = baseName(newPath);
  const fileNameWithoutExtension = fileName.replace(/\.pzmat$/, '');

  // Functions
  const onFinishedNaming = (newBaseName: string): void => {
    const createPath = rename(newPath, newBaseName);
    onCreate(createPath);
  };

  return (
    <div
      className="w-full my-2 flex flex-row items-center p-2 border select-none bg-white"
    >
      <GlobeAltIcon className="icon mr-2 shrink-0" />
      <MaterialNameTextInput
        value={fileNameWithoutExtension}
        onFinishedEditing={onFinishedNaming}
        onCanceledEditing={onCancel}
      />
    </div>
  );
});

interface MaterialNameTextInputProps {
  value: string;
  onFinishedEditing: (newValue: string) => void;
  onCanceledEditing: () => void;
}
// @TODO Identical to `SceneNameTextInput`
const MaterialNameTextInput: FunctionComponent<MaterialNameTextInputProps> = ({ value, onFinishedEditing, onCanceledEditing }) => {
  // State
  const [inputText, setInputText] = useState<string>(`${value}`);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current === null) return;
    // Focus on component mount
    inputRef.current.focus();
  }, []);

  // Functions
  function toMaterialFileName(baseName: string): string {
    return `${baseName.trim()}.pzmat`;
  }
  const onInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const inputText = convertToSafeFileName(e.target.value);
    setInputText(inputText);
  };

  const onBlurTextInput: FocusEventHandler = () => {
    // @TODO should blur cancel or accept?
    onFinishedEditing(toMaterialFileName(inputText));
  };

  const onKeyDown: KeyboardEventHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onCanceledEditing();
    } else if (e.key === 'Enter') {
      onFinishedEditing(toMaterialFileName(inputText));
    }
  };

  return (
    <div className="flex flex-row">
      <input
        type="text"
        ref={inputRef}
        className="w-[250px] p-1"
        value={inputText}
        minLength={1}
        onChange={onInputChange}
        onBlur={onBlurTextInput}
        onKeyDown={onKeyDown}
      />
      <span>.pzmat</span>
    </div>
  );
};
