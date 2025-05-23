import { IAssetData, AssetType } from './cartridge';
import { CoreModules } from './core.g';
import { VirtualFile } from './filesystem';

// @TODO lol uhhhhhhhhhhhhhhhh
const SCRIPT_PATH_PREFIX = `scripts/`;

type ModuleGetterFn = (...args: unknown[]) => void;

/**
 * Metadata of a script module
 */
interface ModuleDefinition {
  id: string;
  dependencies: string[];
  getter: ModuleGetterFn;
}

/**
 * A script module.
 * It's `unknown` because users could literally export anything.
 * Just a vanity type for declarative purposes.
 */
export type Module = unknown;

/**
 * Utility class for the engine to load script modules at runtime
 * (e.g. custom game object components).
 * Reads AMD modules.
 */
export class ScriptLoader {
  private moduleDefinitions: Record<string, ModuleDefinition> = {};
  private modulesBeingLoaded: Record<string, ModuleDefinition> = {};
  private moduleCache: Record<string, Module> = {};

  public constructor() {
    // Magic module definitions
    /* require */
    this.moduleCache['require'] = () => { throw new Error(`Nested require is not supported, it should not be necessary`); };
    /* core modules */
    CoreModules.forEach((coreModule) => {
      this.moduleCache[coreModule.name] = coreModule.module;
    });
  }

  /**
   * Load a script module from a {@link VirtualFile} into the cache.
   * @param scriptFile The script file to load.
   */
  public loadModule(scriptAsset: IAssetData, file: VirtualFile): void {
    if (scriptAsset.type !== AssetType.Script) {
      throw new Error(`Cannot load non-script asset as module: ${scriptAsset}`);
    }

    const moduleId = this.pathToModuleId(scriptAsset.path);
    if (this.moduleDefinitions[moduleId] !== undefined) {
      // @TODO just no-op / warn
      throw new Error(`Tried to load duplicate module: ${scriptAsset.path}`);
    }

    let moduleDefinition: ModuleDefinition = undefined!;
    // @NOTE use magic "source map" keyword `sourceURL` to make script show up in devtools sources under `cartridge/`
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
    new Function('define', `"use strict";\n${file.textContent}\n//# sourceURL=cartridge/${scriptAsset.path}`)(this.defineModule.bind(this, (result) => {
      moduleDefinition = result;
    }));

    if (moduleDefinition === undefined) {
      throw new Error("Defining module did not produce a result");
    } else {
      moduleDefinition.id = moduleId;
      console.log(`Loaded module '${moduleId}' (from path: '${scriptAsset.path}')`, moduleDefinition);
      this.moduleDefinitions[moduleId] = moduleDefinition;
    }
  }

  /**
   * Get the default-exported module of a (previously loaded) script file.
   * @param scriptAsset The script file to get the module of.
   */
  /*
    @TODO this could just be cached and async, removing the need
    to pre-load all the modules
   */
  public getModule(scriptAsset: IAssetData): Module {
    if (scriptAsset.type !== AssetType.Script) {
      throw new Error(`Cannot get module for non-script file: ${scriptAsset}`);
    }
    const moduleId = this.pathToModuleId(scriptAsset.path);
    return this.getModuleById(moduleId);
  }

  /**
   * Get the default export of the module with the id `moduleId`.
   * @param moduleId Id of the module to get.
   */
  private getModuleById(moduleId: string): Module {
    if (this.moduleCache[moduleId] === undefined) {
      // This module needs to be loaded
      if (this.modulesBeingLoaded[moduleId] !== undefined) {
        // Module is already being loaded (but has not resolved yet)
        // @TODO add a stack parameter to show the cycle
        throw new Error(`Cyclic dependency detected, cannot load module ${moduleId}`);
      } else {
        // Load this module
        const moduleDefinition = this.moduleDefinitions[moduleId];

        if (moduleDefinition === undefined) {
          throw new Error(`Cannot get module with ID '${moduleId}'. No module with this ID has been loaded yet.`);
        }

        // Mark module as being loaded
        this.modulesBeingLoaded[moduleId] = moduleDefinition;

        // Resolve module's dependencies (load them if they haven't been loaded)
        const module: Module = {};
        const dependencies = moduleDefinition.dependencies.map((dependencyId) => {
          if (dependencyId === 'exports') {
            // @NOTE magic dependency id for declaring the module's contents on
            return module;
          } else {
            return this.getModuleById(dependencyId);
          }
        });

        moduleDefinition.getter.call(undefined, ...dependencies);

        // Mark module as no-longer being loaded, store in cache
        delete this.modulesBeingLoaded[moduleId];
        this.moduleCache[moduleId] = module;
      }
    }

    return this.moduleCache[moduleId];
  }

  /**
   * Convert a file path to a module ID.
   */
  private pathToModuleId(path: string): string {
    // Strip prefix (if present)
    if (path.indexOf(SCRIPT_PATH_PREFIX) === 0) {
      // Replace with relative import (./)
      path = path.replace(SCRIPT_PATH_PREFIX, './');
    } else throw new Error(`Unrecognised; path does not contain magic prefix: ${path}`);

    // Strip file extension (if any)
    const extMatch = /(\.[^.]*)$/.exec(path);
    return path.substring(0, path.length - (extMatch !== null ? extMatch[1].length : 0));
  }

  /**
   * Injected into AMD modules as the `define` constant.
   * @param callback For sending the module definition back to the calling context
   * @param args Args passed into the function, by the script being loaded
   */
  private defineModule(callback: (result: ModuleDefinition) => void, ...args: any[]): void {
    let moduleName: string | undefined;
    let dependencies: string[];
    let moduleFn: ModuleGetterFn;
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    if (args.length == 2) {
      // @NOTE @ASSUMPTION params are (dependencies, definition)
      dependencies = args[0];
      moduleFn = args[1];
    } else {
      // @NOTE @ASSUMPTION params are (name, dependencies, definition)
      moduleName = args[0];
      dependencies = args[1];
      moduleFn = args[2];
    }
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */

    callback({
      id: moduleName || "<undefined>",
      dependencies,
      getter: moduleFn,
    } satisfies ModuleDefinition);
  }
}
