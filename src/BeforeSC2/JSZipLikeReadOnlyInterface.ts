import JSZip from "jszip";

export interface JSZipObjectLikeReadOnlyInterface {
    async(type: 'string', a?: any): Promise<string>;

    async(type: 'base64', a?: any): Promise<string>;

    async(type: 'uint8array', a?: any): Promise<Uint8Array>;

    async(type: 'blob', a?: any): Promise<Blob>;

    get name(): string;

    get dir(): boolean;
}

// from JsZip
interface InputByType {
    base64: string;
    string: string;
    text: string;
    binarystring: string;
    array: number[];
    uint8array: Uint8Array;
    arraybuffer: ArrayBuffer;
    blob: Blob;
    // stream: NodeJS.ReadableStream;
}

// from JsZip
type InputFileFormat = InputByType[keyof InputByType] | Promise<InputByType[keyof InputByType]>;

export interface JSZipLikeReadOnlyInterface {
    file(path: string): JSZipObjectLikeReadOnlyInterface | null;

    file(path: RegExp): JSZipObjectLikeReadOnlyInterface[] | null;

    forEach(callback: (relativePath: string, file: JSZipObjectLikeReadOnlyInterface) => void): void;

    filter(predicate: (relativePath: string, file: JSZipObjectLikeReadOnlyInterface) => boolean): JSZipObjectLikeReadOnlyInterface[];

    loadAsync(data: InputFileFormat, options?: any): Promise<JSZipLikeReadOnlyInterface | undefined>;

    is_JeremieModLoader_ModPack?: boolean; // This is a specific implementation for Jeremie ModLoader ModPack

    hashString?: string;

    generateAsync?: typeof JSZip['generateAsync'];
}
