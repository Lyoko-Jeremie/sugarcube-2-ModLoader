import {ModMeta} from "./ModMeta";

export interface ModPackFileReaderInterface {
    isInit: boolean;
    modPackBufferSize: number;
    modMetaInfo: ModMeta;
    hash: bigint;
    hashString: string;
    fileTreeRef: Record<string, any> | undefined;

    progressCallback?: (progress: number) => any | Promise<any>;

    load(modPackBuffer: Uint8Array, password?: string): Promise<ModMeta>;

    checkHash(modPackBuffer: Uint8Array): Promise<boolean>;

    getFileTree(): Record<string, any> | undefined;

    getFileList(): string[];

    getFile(filePath: string): Promise<Uint8Array | undefined>;

    readFile(filePath: string): Promise<Uint8Array | undefined>;

    getBootJson(): Promise<Uint8Array | undefined>;

    checkValid(): Promise<boolean>;
}
