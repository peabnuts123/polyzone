import { Unzipped } from "fflate";
import { IFileSystem, VirtualFile } from "@lopoly/engine/filesystem";


// @TODO What is the value of this thing? Is it the right abstraction?
export class CartridgeFileSystem implements IFileSystem {
  private readonly cartridgeData: Unzipped;

  public constructor(cartridgeData: Unzipped) {
    this.cartridgeData = cartridgeData;
  }

  public getUrlForPath(path: string): string {
    // Create an "object URL" that can be used to fetch the file at this path
    const file = this.readFileSync(path);
    const objectUrl = URL.createObjectURL(new Blob([file.bytes]));
    // @NOTE release object URL after 10 seconds
    // Is this chill?
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 10_000);
    return objectUrl;
  }

  public readFile(path: string): Promise<VirtualFile> {
    return Promise.resolve(this.readFileSync(path));
  }

  public readFileSync(path: string): VirtualFile {
    const fileBytes = this.cartridgeData[path];
    if (!fileBytes) {
      throw new NotFoundError(`No file found at path: '${path}'`);
    }
    return new VirtualFile(fileBytes as Uint8Array<ArrayBuffer>);
  }
}

export class NotFoundError extends Error {
}
