import {
    BlockSize,
    calcXxHash64, MagicNumber,
    ModPackFileReader, XxHashH64Bigint2String,
} from './ModPack';
// @ts-ignore
import xxhash, {XXHashAPI} from "xxhash-wasm";
import uint8ToBase64 from 'uint8-to-base64';

function splitAndNormalizePath(path: string): string[] {
    // Split the path by both forward and backward slashes
    let parts = path.split(/[\/\\]/);
    // Filter out any empty parts and normalize the path
    parts = parts.filter(part => part.length > 0);
    // remove .
    parts = parts.filter(part => part !== '.');
    // remove .. and when .. , remove the last element
    while (parts.includes('..')) {
        const index = parts.indexOf('..');
        if (index > 0) {
            parts.splice(index - 1, 2); // Remove the '..' and the previous part
        } else {
            parts.splice(index, 1); // If '..' is at the start, just remove it
        }
    }
    return parts;
}

// from JsZip
interface OutputByType {
    base64: string;
    string: string;
    text: string;
    binarystring: string;
    array: number[];
    uint8array: Uint8Array;
    arraybuffer: ArrayBuffer;
    blob: Blob;
    // nodebuffer: Buffer;
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

// from JsZip
interface JSZipSupport {
    arraybuffer: boolean;
    uint8array: boolean;
    blob: boolean;
    nodebuffer: boolean;
}

// from JsZip
type Compression = 'STORE' | 'DEFLATE';

// from JsZip
interface JSZipObjectOptions {
    compression: Compression;
}

export class ModPackJsZipObjectAdaptor {
    protected myPathInFileTree: string[] = [];
    protected treeLevelRef: Record<string, any>;
    protected _isFile: boolean = false;
    protected _isFolder: boolean = false;
    protected _isValid: boolean = false;

    constructor(
        filePath: string,
        protected readonly ref: ModPackFileReader,
        protected readonly parent: ModPackJsZipObjectAdaptor | undefined,
    ) {
        this.myPathInFileTree = splitAndNormalizePath(filePath);
        if (parent) {
            this.myPathInFileTree = [...parent.myPathInFileTree, ...this.myPathInFileTree];
        }
        let treeRef = this.ref.fileTreeRef;
        if (!treeRef) {
            console.log('[ModPackJsZipAdaptor] File tree reference is not initialized');
            throw new Error('[ModPackJsZipAdaptor] File tree reference is not initialized.');
        }
        for (const part of this.myPathInFileTree) {
            if (!(part in treeRef)) {
                console.log(`[ModPackJsZipAdaptor] Part "${part}" not found in file tree reference.`);
                throw new Error(`[ModPackJsZipAdaptor] Part "${part}" not found in file tree reference.`);
            }
            treeRef = treeRef[part];
            if (!treeRef) {
                console.log(`[ModPackJsZipAdaptor] Part "${part}" is not a valid reference in file tree.`);
                throw new Error(`[ModPackJsZipAdaptor] Part "${part}" is not a valid reference in file tree.`);
            }
        }
        this.treeLevelRef = treeRef;
        if (this.treeLevelRef['_f_']) {
            this._isFile = true;
            this._isFolder = false;
        } else {
            this._isFile = false;
            this._isFolder = true;
        }
        this._isValid = true;
    }

    get dir() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this._isFolder;
    }

    get name() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this.myPathInFileTree[this.myPathInFileTree.length - 1];
    }

    get path() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this.myPathInFileTree.join('/');
    }

    async async<T extends keyof OutputByType>(type: T, onUpdate_Useless?: any): Promise<OutputByType[T]> {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        if (!this._isFile) {
            console.error('[ModPackJsZipAdaptor] Cannot read content from a folder.');
            throw new Error('[ModPackJsZipAdaptor] Cannot read content from a folder.');
        }
        // if not crypted, the data will be a none copy data
        // if crypted, the data will be a copy data
        const data = await this.ref.getFile(this.myPathInFileTree.join('/'));
        if (!data) {
            console.error(`[ModPackJsZipAdaptor] File "${this.myPathInFileTree.join('/')}" not found in the mod pack.`);
            throw new Error(`[ModPackJsZipAdaptor] File "${this.myPathInFileTree.join('/')}" not found in the mod pack.`);
        }
        switch (type) {
            case 'base64':
                // return btoa(String.fromCharCode(...data)) as OutputByType[T];
                return uint8ToBase64.encode(data) as OutputByType[T];
            case 'string':
            case 'text':
                return new TextDecoder('utf-8').decode(data) as OutputByType[T];
            case 'binarystring':
                return Array.prototype.map.call(data, x => String.fromCharCode(x)).join('') as OutputByType[T];
            case 'array':
                return Array.from(data) as OutputByType[T];
            case 'uint8array':
                return data as OutputByType[T];
            case 'arraybuffer':
                return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as OutputByType[T];
            case 'blob':
                return new Blob([data]) as OutputByType[T];
            // case 'nodebuffer':
            //     return data as OutputByType[T]; // Node.js Buffer
            default:
                console.error(`[ModPackJsZipAdaptor] Unsupported output type: ${type}`);
                throw new Error(`[ModPackJsZipAdaptor] Unsupported output type: ${type}`);
        }
    }

    protected _files?: Record<string, ModPackJsZipObjectAdaptor>;

    get files(): Record<string, ModPackJsZipObjectAdaptor> {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        if (!this._files) {
            this._files = {};
            for (const filePath in this.treeLevelRef) {
                this._files[filePath] = new ModPackJsZipObjectAdaptor(filePath, this.ref, this);
            }
        }
        return this._files;
    }

    get isFile(): boolean {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this._isFile;
    }

    get isFolder(): boolean {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this._isFolder;
    }

    get isValid(): boolean {
        return this._isValid;
    }

    // JsZip JSZipObject.options
    get options(): JSZipObjectOptions {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return {
            compression: 'STORE',
        };
    }

    // internalStream()
}

export class ModPackFileReaderJsZipAdaptor extends ModPackFileReader {
    get is_JeremieModLoader_ModPack() {
        return true; // This is a specific implementation for Jeremie ModLoader ModPack
    }

    protected _files?: Record<string, ModPackJsZipObjectAdaptor>;

    protected _isPrepared: boolean = false;
    protected zipAdaptorPassword?: string;

    prepareSetPassword(password: string | undefined) {
        if (this.isInit) {
            console.error('[ModPackFileReaderJsZipAdaptor] Cannot set password after initialization.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] Cannot set password after initialization.');
        }
        this.zipAdaptorPassword = password;
    }

    public async prepareForZipAdaptor() {
        this._isPrepared = true;
        const fileTree = await this.getFileTree();
        const files = this.files;
    }

    get files(): Record<string, ModPackJsZipObjectAdaptor> {
        if (!this._isPrepared) {
            console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
        }
        if (!this._files) {
            this._files = {};
            for (const filePath of this.getFileList()) {
                this._files[filePath] = new ModPackJsZipObjectAdaptor(filePath, this, undefined);
            }
        }
        return this._files;
    }

    file(path: string): ModPackJsZipObjectAdaptor | null;
    file(path: RegExp): ModPackJsZipObjectAdaptor[] | null;
    file(path: string | RegExp): ModPackJsZipObjectAdaptor | ModPackJsZipObjectAdaptor[] | null {
        if (!this._isPrepared) {
            console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
        }
        if (typeof path === 'string') {
            return this.files[path] || null;
        }
        if (path instanceof RegExp) {
            const matchedFiles: ModPackJsZipObjectAdaptor[] = [];
            for (const filePath in this.files) {
                if (path.test(filePath)) {
                    matchedFiles.push(this.files[filePath]);
                }
            }
            return matchedFiles.length > 0 ? matchedFiles : null;
        }
        console.error('[ModPackFileReaderJsZipAdaptor] Invalid path type. Expected string or RegExp.');
        throw new Error('[ModPackFileReaderJsZipAdaptor] Invalid path type. Expected string or RegExp.');
    }

    // folder(path: string): ModPackJsZipObjectAdaptor | undefined {
    //     if (!this._isPrepared) {
    //         console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
    //         throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
    //     }
    //     const m = new ModPackJsZipObjectAdaptor(path, this, undefined);
    //     if (m.isValid && m.isFolder) {
    //         return m;
    //     } else {
    //         console.error(`[ModPackFileReaderJsZipAdaptor] Folder "${path}" not found or is not a folder.`);
    //         return undefined;
    //     }
    // }

    forEach(callback: (relativePath: string, file: ModPackJsZipObjectAdaptor) => void): void {
        if (!this._isPrepared) {
            console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
        }
        for (const filePath in this.files) {
            const file = this.files[filePath];
            if (file.isValid) {
                callback(filePath, file);
            } else {
                console.error(`[ModPackFileReaderJsZipAdaptor] File "${filePath}" is not valid.`);
            }
        }
    }

    filter(predicate: (relativePath: string, file: ModPackJsZipObjectAdaptor) => boolean): ModPackJsZipObjectAdaptor[] {
        if (!this._isPrepared) {
            console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
        }
        const result: ModPackJsZipObjectAdaptor[] = [];
        for (const filePath in this.files) {
            const file = this.files[filePath];
            if (file.isValid && predicate(filePath, file)) {
                result.push(file);
            }
        }
        return result;
    }

    get support(): JSZipSupport {
        return {
            arraybuffer: true,
            uint8array: true,
            blob: true,
            nodebuffer: false, // Node.js Buffer is not supported in browser environment
        };
    }

    public static async checkByHash(modPackBuffer: Uint8Array) {

        const magicNumberLength = Math.ceil(MagicNumber.length / BlockSize) * BlockSize; // Ensure magic number is padded to block size
        if (modPackBuffer.length < magicNumberLength + 8 + 8 + 8) {
            return false; // Ensure buffer is large enough for magic number, xxHash, and size
        }
        const magicNumber = modPackBuffer.subarray(0, MagicNumber.length);
        if (!magicNumber.every((value, index) => value === MagicNumber[index])) {
            return false;
        }

        const xxhashApi = ModPackFileReader.xxhashApi ?? await xxhash();
        ModPackFileReader.xxhashApi = xxhashApi;
        const dataView = new DataView(modPackBuffer.buffer);
        const xxHashValue = dataView.getBigUint64(dataView.byteLength - 8, true);
        const hashValue = calcXxHash64(modPackBuffer.subarray(0, modPackBuffer.length - 8), xxhashApi);
        console.log('[ModPackFileReader] xxHashValue:', XxHashH64Bigint2String(xxHashValue));
        console.log('[ModPackFileReader] hashValue:', XxHashH64Bigint2String(hashValue));
        if (xxHashValue !== hashValue) {
            console.error(`[ModPackFileReader] Invalid xxHash value: ${XxHashH64Bigint2String(xxHashValue)}, expected: ${XxHashH64Bigint2String(hashValue)}`);
            return false;
        }
        return true;
    }

    public async loadAsync(data: InputFileFormat, options?: any & {
        password?: string,
        base64?: boolean,
    }): Promise<ModPackFileReaderJsZipAdaptor | undefined> {
        let dataI = await data;
        let readData;
        if (options?.base64 && typeof dataI === 'string') {
            // base64 string, decode it
            readData = Uint8Array.from(atob(dataI), c => c.charCodeAt(0));
        } else if (typeof dataI === 'string') {
            // check type
            //     base64: string;
            //     string: string;
            //     text: string;
            //     binarystring: string;

            if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(dataI)) {
                // base64
                readData = Uint8Array.from(atob(dataI), c => c.charCodeAt(0));
            } else {
                try {
                    // text / string
                    readData = new TextEncoder().encode(dataI);
                } catch (e) {
                    // is binarystring
                    readData = Uint8Array.from(dataI, char => char.charCodeAt(0));
                }
            }
        } else if (dataI instanceof Uint8Array || dataI instanceof ArrayBuffer) {
            // already in binary format
            readData = new Uint8Array(dataI);
        } else if (dataI instanceof Blob) {
            // Blob, read as binary
            readData = new Uint8Array(await dataI.arrayBuffer());
        } else if (Array.isArray(dataI)) {
            // array of numbers
            readData = new Uint8Array(dataI);
        } else {
            console.error('[ModPackFileReaderJsZipAdaptor] Unsupported data type for loading.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] Unsupported data type for loading.');
        }

        if (!await ModPackFileReaderJsZipAdaptor.checkByHash(readData)) {
            return undefined;
        }

        this.prepareSetPassword(options?.password);

        await this.load(readData, this.zipAdaptorPassword);
        await this.prepareForZipAdaptor();
        return this;
    }
}

