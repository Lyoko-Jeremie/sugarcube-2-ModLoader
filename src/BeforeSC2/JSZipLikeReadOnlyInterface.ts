import JSZip from "jszip";
import type {ModPackFileReaderJsZipAdaptor} from "./ModPack/ModPackJsZipAdaptor";

export interface JSZipObjectLikeReadOnlyInterface {
    async<T extends OutputType>(type: T, onUpdate?: any): Promise<OutputByType[T]>;

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
interface OutputByType {
    base64: string;
    string: string;
    // text: string;
    // binarystring: string;
    // array: number[];
    uint8array: Uint8Array;
    // arraybuffer: ArrayBuffer;
    blob: Blob;
    // nodebuffer: Buffer;
}

// from JsZip
export type InputFileFormat = InputByType[keyof InputByType] | Promise<InputByType[keyof InputByType]>;

export type OutputType = keyof OutputByType;

export interface JSZipLikeReadOnlyInterface {
    file(path: string): JSZipObjectLikeReadOnlyInterface | null;

    file(path: RegExp): JSZipObjectLikeReadOnlyInterface[] | null;

    forEach(callback: (relativePath: string, file: JSZipObjectLikeReadOnlyInterface) => void): void;

    filter(predicate: (relativePath: string, file: JSZipObjectLikeReadOnlyInterface) => boolean): JSZipObjectLikeReadOnlyInterface[];

    loadAsync(data: InputFileFormat, options?: any): Promise<JSZipLikeReadOnlyInterface | undefined>;

    is_JeremieModLoader_ModPack?: boolean; // This is a specific implementation for Jeremie ModLoader ModPack

    hashString?: string;

    generateAsync?: typeof JSZip['generateAsync'];

    get files(): Record<string, JSZipObjectLikeReadOnlyInterface>;
}

export function isModPackFileReaderJsZipAdaptor(
    obj: any,
): obj is ModPackFileReaderJsZipAdaptor {
    return obj.is_JeremieModLoader_ModPack;
}
