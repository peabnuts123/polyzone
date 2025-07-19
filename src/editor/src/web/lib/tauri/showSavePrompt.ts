import { save, type SaveDialogOptions } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

/**
 * Show a Tauri save-file dialog, prompting for a filepath, then write the data to that filepath.
 * @param data Contents of the file to write.
 * @param options Options for the save dialog.
 */
export async function showSavePrompt(data: Uint8Array, options: Partial<SaveDialogOptions> = {}): Promise<void> {
  const savePath = await save({
    title: "Save",
    ...options,
  });
  if (!savePath) return;

  await writeFile(savePath, data);
}
