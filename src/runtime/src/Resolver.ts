import { FileToolsOptions } from '@babylonjs/core/Misc/fileTools';
import { IFileSystem } from './filesystem';
import { canonicalisePath, stripProtocolFromUri } from './util';

/**
 * Wrapper around Babylon URL resolving to read files from
 * a cartridge's virtual file system instead of external URLs.
 */
class Resolver {
  private fileSystems: Map<string, IFileSystem>;

  constructor() {
    FileToolsOptions.PreprocessUrl = this.resolve.bind(this);
    this.fileSystems = new Map();
  }

  /**
   * Process URLs from Babylon. References to files in the matching
   * {@link AssetDb} (determined by a URL protocol prefix) will by resolved through that, otherwise URLs
   * will be unmodified.
   * @param url The URL to resolve.
   */
  public resolve(url: string): string {
    for (const [protocol, fileSystem] of this.fileSystems) {
      if (url.startsWith(protocol)) {
        // @NOTE crazy bug in browsers (!) non-http protocols are not parsed correctly,
        //  so we must strip the protocol off the URL. See: https://issues.chromium.org/issues/40063064
        const canonical = canonicalisePath(stripProtocolFromUri(url));
        return fileSystem.getUrlForPath(canonical);
      }
    }

    // No matching asset DB, return unmodified URL
    return url;
  }

  /**
   * Register a file system that will be used to resolve Urls for a given a URL protocol.
   * @param protocol Url protocol prefix like `runtime://`
   * @param fileSystem File system! for resolving Urls with this protocol
   */
  public registerFileSystem(fileSystem: IFileSystem): void {
    if (this.fileSystems.has(fileSystem.resolverProtocol)) {
      console.error(`fileSystem is already registered in Resolver: ${fileSystem.resolverProtocol}`);
    }
    this.fileSystems.set(fileSystem.resolverProtocol, fileSystem);
  }

  public deregisterFileSystem(protocol: string): void {
    this.fileSystems.delete(protocol);
  }

  public deregisterAllFileSystems(): void {
    this.fileSystems.clear();
  }
}

export default new Resolver();
