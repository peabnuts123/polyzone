import type * as TauriDialog from '@tauri-apps/plugin-dialog';
import { MockHandlerWith1Arg, throwUnhandled } from '../util';
import { Paths } from '../config';

export const DefaultTauriPluginDialogMockModuleConfig = {
  mockOpenCartridgePath: `${Paths.MagicFileRoot}/${Paths.MockCartridgeFile}`,
  mockOpenProjectPath: `${Paths.MagicFileRoot}/${Paths.MockProjectFile}`,
  mockSaveCartridgePath: `${Paths.MagicFileRoot}/${Paths.MockCartridgeFile}`,
  mockSaveProjectPath: `${Paths.MagicFileRoot}/${Paths.MockProjectFile}`,
};
export let TauriPluginDialogMockModuleConfig = {
  ...DefaultTauriPluginDialogMockModuleConfig,
};

export class TauriPluginDialogMockModule {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public static handle(action: string, args: any) {
    switch (action) {
      case 'open':
        return this.open(args);
      case 'save':
        return this.save(args);
      default:
        throw throwUnhandled(`[TauriPluginDialogMockModule] (handle) Unimplemented action. (action='${action}') args: `, args);
    }
  }

  private static open: MockHandlerWith1Arg<'options', typeof TauriDialog.open> = ({ options }) => {
    if (options?.filters?.some((filter) => filter.extensions.includes('pzcart'))) {
      return TauriPluginDialogMockModuleConfig.mockOpenCartridgePath;
    } else if (options?.filters?.some((filter) => filter.extensions.includes('pzproj'))) {
      return TauriPluginDialogMockModuleConfig.mockOpenProjectPath;
    }
    throw throwUnhandled(`[TauriPluginDialogMockModule] (open) Unhandled request. options: `, options);
  };

  private static save: MockHandlerWith1Arg<'options', typeof TauriDialog.save> = ({ options }) => {
    if (options?.filters?.some((filter) => filter.extensions.includes('pzcart'))) {
      return TauriPluginDialogMockModuleConfig.mockSaveCartridgePath;
    } else if (options?.filters?.some((filter) => filter.extensions.includes('pzproj'))) {
      return TauriPluginDialogMockModuleConfig.mockSaveProjectPath;
    }
    throw throwUnhandled(`[TauriPluginDialogMockModule] (save) Unhandled request. options: `, options);
  };

  public static resetConfig(): void {
    TauriPluginDialogMockModuleConfig = {
      ...DefaultTauriPluginDialogMockModuleConfig,
    };
  }
}

