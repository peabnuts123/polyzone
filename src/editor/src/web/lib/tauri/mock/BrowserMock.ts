import { Paths } from "./config";
import {
  PolyZoneMockModule,
  PolyZoneMockModuleConfig,
  TauriPluginDialogMockModule,
  TauriPluginDialogMockModuleConfig,
  TauriPluginEventMockModule,
  TauriPluginEventMockModuleConfig,
  TauriPluginFsMockModule,
  TauriPluginFsMockModuleConfig,
  TauriPluginMenuMockModule,
  TauriPluginMenuMockModuleConfig,
  TauriPluginPathMockModule,
  TauriPluginPathMockModuleConfig,
  TauriPluginWebviewMockModule,
  TauriPluginWebviewMockModuleConfig,
  TauriPluginWindowMockModule,
  TauriPluginWindowMockModuleConfig,
} from "./modules";
import { throwUnhandled } from "./util";

interface TauriPluginCommand {
  isPlugin: true;
  plugin: string;
  action: string;
}
interface TauriPlainCommand {
  isPlugin: false;
  command: string;
}
type ParsedTauriCommand = TauriPluginCommand | TauriPlainCommand;

export const TauriMockConfig = {
  get polyzone() { return PolyZoneMockModuleConfig; },
  get dialog() { return TauriPluginDialogMockModuleConfig; },
  get event() { return TauriPluginEventMockModuleConfig; },
  get fs() { return TauriPluginFsMockModuleConfig; },
  get menu() { return TauriPluginMenuMockModuleConfig; },
  get path() { return TauriPluginPathMockModuleConfig; },
  get webview() { return TauriPluginWebviewMockModuleConfig; },
  get window() { return TauriPluginWindowMockModuleConfig; },
};

/**
 * A class that mocks the Tauri APIs when running in the browser, at least
 * good enough for the app to run somewhat.
 */
export class BrowserMock {
  public constructor() {
    BrowserMock.resetConfig();
  }

  public handle(cmd: string, args: any): any | Promise<any> {
    const parsed = this.parseCommand(cmd);
    // console.log(`[DEBUG] [BrowserMock] (handle) parsed: `, parsed, args);

    if (parsed.isPlugin) {
      switch (parsed.plugin) {
        case 'dialog':
          return TauriPluginDialogMockModule.handle(parsed.action, args);
        case 'path':
          return TauriPluginPathMockModule.handle(parsed.action, args);
        case 'fs':
          return TauriPluginFsMockModule.handle(parsed.action, args);
        case 'event':
          return TauriPluginEventMockModule.handle(parsed.action, args);
        case 'webview':
          return TauriPluginWebviewMockModule.handle(parsed.action, args);
        case 'window':
          return TauriPluginWindowMockModule.handle(parsed.action, args);
        case 'menu':
          return TauriPluginMenuMockModule.handle(parsed.action, args);
        default:
          throw throwUnhandled(`[BrowserMock] (handle) Unimplemented plugin. (plugin='${parsed.plugin}') (action='${parsed.action}') args: `, args);
      }
    } else {
      switch (parsed.command) {
        // @TODO Consider making this more like an array of things that "might" handle the command (return bool)
        case 'create_cartridge':
        case 'start_watching_project_files':
        case 'stop_watching_project_assets':
        case 'load_project':
        case 'unload_project':
        case 'hash_data':
        case 'notify_project_file_updated':
          return PolyZoneMockModule.handle(parsed.command, args);
        default:
          throw throwUnhandled(`[BrowserMock] (handle) Unimplemented module. (module='${parsed.command}') args: `, args);
      }
    }
  }

  private parseCommand(cmd: string): ParsedTauriCommand {
    // `cmd` looks like: "plugin:dialog|open"
    const match = /^plugin:(\w+)\|(\w+)$/.exec(cmd);
    if (match !== null) {
      return {
        isPlugin: true,
        plugin: match[1]!,
        action: match[2]!,
      } satisfies TauriPluginCommand;
    } else {
      return {
        isPlugin: false,
        command: cmd,
      } satisfies TauriPlainCommand;
    }
  }

  public mockConvertFileSrc(filePath: string, _protocol: string = 'asset'): string {
    return filePath.replace(Paths.MagicFileRoot, window.location.origin);
  }

  public static resetConfig(): void {
    PolyZoneMockModule.resetConfig();
    TauriPluginDialogMockModule.resetConfig();
    TauriPluginEventMockModule.resetConfig();
    TauriPluginFsMockModule.resetConfig();
    TauriPluginMenuMockModule.resetConfig();
    TauriPluginPathMockModule.resetConfig();
    TauriPluginWebviewMockModule.resetConfig();
    TauriPluginWindowMockModule.resetConfig();
  }
}
