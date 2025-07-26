import {isEqual} from 'lodash';
import {BSON} from 'bson';
// @ts-ignore
import xxhash from "xxhash-wasm";

import {
    ready,
    randombytes_buf,
    crypto_stream_xchacha20_xor_ic,
    crypto_stream_xchacha20_KEYBYTES,
    crypto_stream_xchacha20_NONCEBYTES,
    to_hex,
    to_base64,
    from_hex,
    from_base64,
    randombytes_uniform,
    crypto_pwhash,
    crypto_pwhash_SALTBYTES,
    crypto_pwhash_ALG_DEFAULT,
    crypto_pwhash_OPSLIMIT_INTERACTIVE,
    crypto_pwhash_MEMLIMIT_INTERACTIVE,
} from 'libsodium-wrappers-sumo';


// 文件结构
// 每一个部分都对齐到 BlockSize ， 不满足的数据在末尾padding随机字符串
// ----------
// block -1 : 文件头魔数 MagicNumber ：JeremieModLoader
// 三个 8byte 长度数据(bigint) : ModMeta开始位置(byte)， ModMeta结束位置(byte)， 所有文件数据开始位置(byte)
// block -1 : BSON(ModMeta)
// block 0 ~ n-1 : 文件数据部分
// block n : BSON(文件树 file tree) 文件树 被作为一个文件对待。
// 8byte xxHash64 值在文件末尾， 用于校验文件完整性 ， hash 时计算除 xxHash64 值外前面的所有数据
// ----------
// 在加密模式下，block 0 ~ n 的所有文件数据部分都使用 crypto_stream_xchacha20_xor_ic 流加密模式加密
// 文件头和 ModMeta 部分不加密， 每一个文件都对其到 BlockSize ， 而 BlockSize 是 crypto_stream_xchacha20_xor_ic 块大小
// 利用 crypto_stream_xchacha20_xor_ic 可以按块计算和解密的特性，实现随机文件访问和读取
// 加密时可以原位加密，解密时只发生一次数据拷贝
// ----------
// 可扩展性：
// 因为 ModMeta 本质上是一个二进制 json ， 可以在 ModMeta 中添加新的字段来附加较短的新数据。
// 对于较大的新的定义，可以如同 FileTree 一样在文件树中添加新的文件，并在 ModMeta 中添加对应的字段存储指向到这个文件元数据即可。
// ----------


export interface FileMeta {
    // begin block index
    b: number;
    // end block index
    e: number;
    // file length (byte)
    l: number;
}

export interface CryptoInfo {
    // xchacha20 nonce in base64 . if not crypted, it is empty string
    // if node crypted, the file ext is ( .modpack )
    // if crypted, the file ext is ( .modpack.crypt )
    Xchacha20NonceBase64: string;
    PwhashSaltBase64: string;
}

export const MagicNumber = new Uint8Array([0x4A, 0x65, 0x72, 0x65, 0x6D, 0x69, 0x65, 0x4D, 0x6F, 0x64, 0x4C, 0x6F, 0x61, 0x64, 0x65, 0x72]);
export const ModMetaProtocolVersion = 1; // Version of the mod pack protocol
export const BlockSize = 64; // default block size

export interface ModMeta {
    // magic number, 0x4A, 0x65, 0x72, 0x65, 0x6D, 0x69, 0x65, 0x4D, 0x6F, 0x64, 0x4C, 0x6F, 0x61, 0x64, 0x65, 0x72
    // to_base64(MagicNumber)
    magicNumber: string;
    // mod name
    name: string;
    // PAK file protocol version ModMetaProtocolVersion
    protocolVersion: number;
    // default: 64-byte . for xchacha20 fast lookup block
    blockSize: number;
    cryptoInfo?: CryptoInfo;
    // the file tree
    fileTreeBlock: FileMeta;
    // the boot.json file meta
    bootJsonFile: FileMeta;
    // <filepath , FileMeta>
    // dont forgot to verify the FileMeta not overlap when decompressing
    // and the filePath is relative path, not absolute path
    fileMeta: Record<string, FileMeta>;
}

function paddingToBlockSize(data: Uint8Array, blockSize: number): {
    blocks: number,
    dataLength: number,
    paddingLength: number,
    paddedData: Uint8Array,
    paddedDataLength: number,
    filePath?: string,
} {
    let paddingLength = blockSize - (data.length % blockSize);
    let blocks = Math.ceil(data.length / blockSize);
    if (blocks > 0 && paddingLength === blockSize) {
        return {
            blocks: blocks,
            dataLength: data.length,
            paddingLength: 0,
            paddedData: data, // No padding needed
            paddedDataLength: data.length,
        }
    }
    if (blocks === 0) {
        // If the data is empty, we still need at least one block
        blocks = 1;
        paddingLength = blockSize; // Full padding for the single block
    }
    if (paddingLength < 0 || paddingLength > blockSize) {
        throw new Error(`Invalid padding length: ${paddingLength}. Data length: ${data.length}, Block size: ${blockSize}`);
    }
    const padding = new Uint8Array(paddingLength);
    for (let i = 0; i < paddingLength; i++) {
        padding[i] = randombytes_uniform(0xff); // Fill padding with random bytes
    }
    const paddedData = new Uint8Array(data.length + paddingLength);
    paddedData.set(data);
    paddedData.set(padding, data.length);
    return {
        blocks: blocks,
        dataLength: data.length,
        paddingLength: paddingLength,
        paddedData: paddedData,
        paddedDataLength: paddedData.length,
    };
}

function createFileTreeFromFileList(fileList: string[]) {
    const fileTree: Record<string, any> = {};
    for (const filePath of fileList) {
        const parts = filePath.split(/[\/\\]/);
        let current = fileTree;
        for (const part of parts) {
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        current['_f_'] = true; // Mark as a file
    }
    return fileTree;
}

// https://github.com/jungomi/xxhash-wasm/blob/5923f26411ed763044bed17a1fec33fee74e47a0/src/xxhash.js#L148
export function XxHashH64Bigint2String(h64: bigint): string {
    return h64.toString(16).padStart(16, "0");
}

export function XxHashH32Number2String(h32: bigint): string {
    return h32.toString(16).padStart(8, "0");
}

export function calcXxHash64(
    data: Uint8Array,
    xxhashApi: Awaited<ReturnType<typeof xxhash>>,
): bigint {
    const c = xxhashApi.create64();
    // calc it block by block
    const blockSize = BlockSize;
    const blocks = Math.ceil(data.length / blockSize);
    for (let i = 0; i < blocks; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, data.length);
        c.update(data.subarray(start, end));
    }
    return c.digest();
}

export async function covertFromZipMod(
    modName: string,
    filePathList: string[],
    fileReaderFunc: (filePath: string) => Promise<Uint8Array | undefined>,
    password: string | undefined = undefined,
    bootFilePath: string = 'boot.json',
) {
    await ready;
    const xxhashApi = await xxhash();

    // filePathList duplicate check
    const filePathSet = new Set(filePathList);
    filePathSet.add(bootFilePath);
    if (filePathSet.size - 1 !== filePathList.length) {
        console.error('filePathList has duplicate entries', filePathList);
        throw new Error('filePathList has duplicate entries');
    }

    // make file tree from filePathList
    const fileTree = createFileTreeFromFileList(filePathList);
    // console.log('fileTree', JSON.stringify(fileTree, null, 2));
    const fileTreeBuffer = BSON.serialize(fileTree);
    const fileTreeBufferPadded = paddingToBlockSize(
        fileTreeBuffer,
        BlockSize,
    );


    let cryptoInfo: CryptoInfo | undefined;
    if (password) {
        cryptoInfo = {} as CryptoInfo;
        const xchacha20Nonce = randombytes_buf(crypto_stream_xchacha20_NONCEBYTES, 'uint8array');
        const xchacha20NonceBase64 = to_base64(xchacha20Nonce);
        cryptoInfo['Xchacha20NonceBase64'] = xchacha20NonceBase64;
        const pwhashSalt = randombytes_buf(crypto_pwhash_SALTBYTES, 'uint8array');
        const pwhashSaltBase64 = to_base64(pwhashSalt);
        cryptoInfo['PwhashSaltBase64'] = pwhashSaltBase64;
        // const xchacha20Key = crypto_pwhash(
        //     crypto_stream_xchacha20_KEYBYTES,
        //     password ?? '',
        //     pwhashSalt,
        //     crypto_pwhash_OPSLIMIT_INTERACTIVE,
        //     crypto_pwhash_MEMLIMIT_INTERACTIVE,
        //     crypto_pwhash_ALG_DEFAULT,
        //     'uint8array',
        // );
        // // example
        // crypto_stream_xchacha20_xor_ic(
        //     '',
        //     xchacha20Nonce,
        //     0,
        //     xchacha20Key,
        //     'uint8array',
        // );
    }

    const bootFile = await fileReaderFunc(bootFilePath);
    if (!bootFile) {
        console.error(`Boot file ${bootFilePath} not found`);
        throw new Error(`Boot file ${bootFilePath} not found`);
    }
    let bootJsonFile = paddingToBlockSize(
        bootFile,
        BlockSize,
    );
    bootJsonFile['filePath'] = bootFilePath;

    const fileBlockList: ReturnType<typeof paddingToBlockSize>[] = [];
    for (const filePath of filePathList) {
        const fileData = await fileReaderFunc(filePath);
        if (!fileData) {
            console.error(`File ${filePath} not found`);
            throw new Error(`File ${filePath} not found`);
        }
        const fileBlock = paddingToBlockSize(
            fileData,
            BlockSize,
        );
        fileBlock['filePath'] = filePath;
        fileBlockList.push(fileBlock);
    }

    const modMeta: ModMeta = {
        magicNumber: to_base64(MagicNumber),
        name: modName,
        protocolVersion: ModMetaProtocolVersion,
        blockSize: BlockSize,
        cryptoInfo: cryptoInfo,
        fileTreeBlock: {
            b: 0,
            e: fileTreeBufferPadded.blocks + 0,
            l: fileTreeBufferPadded.dataLength,
        },
        bootJsonFile: {
            b: 0,
            e: bootJsonFile.blocks - 1,
            l: bootJsonFile.dataLength,
        },
        fileMeta: {},
    } satisfies ModMeta;

    const fileMetaList: FileMeta[] = [];
    let bockIndex = bootJsonFile.blocks;
    for (const fileBlock of fileBlockList) {
        const fileMeta: FileMeta = {
            b: bockIndex,
            e: bockIndex + fileBlock.blocks - 1,
            l: fileBlock.dataLength,
        };
        modMeta.fileMeta[fileBlock.filePath!] = fileMeta;
        fileMetaList.push(fileMeta);
        bockIndex += fileBlock.blocks;
    }

    modMeta.fileTreeBlock.b = bockIndex;
    modMeta.fileTreeBlock.e = bockIndex + fileTreeBufferPadded.blocks - 1;
    modMeta.fileTreeBlock.l = fileTreeBufferPadded.dataLength;
    bockIndex += fileTreeBufferPadded.blocks;

    const modMetaBuffer = BSON.serialize(modMeta);
    // console.log('modMetaBuffer length:', modMetaBuffer.length);
    // console.log(modMetaBuffer);

    const magicNumberPadded = paddingToBlockSize(MagicNumber, BlockSize);
    const modMetaBufferPadded = paddingToBlockSize(modMetaBuffer, BlockSize);

    // Calculate the total file length
    // magicNumber (16 bytes) + 8 bytes modMetaBuffer start pos + 8 bytes modMetaBuffer end pos + 8 bytes all file data start pos
    // + modMetaBuffer + (boot file data + all file data)
    const fileLength = magicNumberPadded.paddedDataLength + 8 + 8 + 8
        + modMetaBufferPadded.paddedDataLength + bootJsonFile.paddedDataLength
        + fileBlockList.reduce((acc, block) => acc + block.paddedDataLength, 0)
        + fileTreeBufferPadded.paddedDataLength
        + 8 // xxhash value (8 bytes) at the end of the file
    ;

    // console.log('fileLength', fileLength);

    const modPackBuffer = new Uint8Array(fileLength);
    // console.log('modPackBuffer.length', modPackBuffer.length);

    let offset = 0;
    // console.log('offset', offset, magicNumberPadded.paddedData.length, magicNumberPadded.paddedDataLength);
    modPackBuffer.set(magicNumberPadded.paddedData, offset);
    offset += magicNumberPadded.paddedDataLength;
    // console.log('offset', offset);
    const dataView = new DataView(modPackBuffer.buffer);
    dataView.setBigUint64(offset, BigInt(magicNumberPadded.paddedDataLength + 8 + 8 + 8), true); // modMetaBuffer start pos
    offset += 8;
    dataView.setBigUint64(offset, BigInt(magicNumberPadded.paddedDataLength + 8 + 8 + 8 + modMetaBuffer.length), true); // modMetaBuffer end pos
    offset += 8;
    // console.log('offset', offset);
    dataView.setBigUint64(offset, BigInt(magicNumberPadded.paddedDataLength + 8 + 8 + 8 + modMetaBufferPadded.paddedDataLength), true); // all file data start pos
    offset += 8;
    // console.log('offset', offset, modMetaBufferPadded.paddedData.length, modMetaBufferPadded.paddedDataLength);
    modPackBuffer.set(modMetaBufferPadded.paddedData, offset);
    offset += modMetaBufferPadded.paddedDataLength;
    // console.log('offset', offset, bootJsonFile.paddedData.length, bootJsonFile.paddedDataLength);
    modPackBuffer.set(bootJsonFile.paddedData, offset);
    offset += bootJsonFile.paddedDataLength;
    // console.log('offset for', offset);
    for (const fileBlock of fileBlockList) {
        // console.log('offset', offset, fileBlock.paddedData.length, fileBlock.paddedDataLength);
        modPackBuffer.set(fileBlock.paddedData, offset);
        offset += fileBlock.paddedDataLength;
        // console.log('offset', offset);
    }
    modPackBuffer.set(fileTreeBufferPadded.paddedData, offset);
    offset += fileTreeBufferPadded.paddedDataLength;

    if (!cryptoInfo) {
        const xxHashPos = offset;
        const hashValue = calcXxHash64(modPackBuffer.subarray(0, xxHashPos), xxhashApi);
        dataView.setBigUint64(xxHashPos, BigInt(hashValue), true); // Store the xxHash value at the end of the mod pack buffer

        return {
            modMeta: modMeta,
            modPackBuffer: modPackBuffer,
            ext: cryptoInfo ? '.modpack.crypt' : '.modpack',
            hash: hashValue,
            hashString: XxHashH64Bigint2String(hashValue),
        };
    }

    // ==========================================================================================================
    // Encrypt the modPackBuffer with xchacha20 , only the file data part , block by block , inplace encryption

    const xchacha20Nonce: Uint8Array = from_base64(cryptoInfo.Xchacha20NonceBase64);
    if (xchacha20Nonce.length !== crypto_stream_xchacha20_NONCEBYTES) {
        console.error(`Invalid xchacha20 nonce length: ${xchacha20Nonce.length}, expected: ${crypto_stream_xchacha20_NONCEBYTES}`);
        throw new Error(`Invalid xchacha20 nonce length: ${xchacha20Nonce.length}, expected: ${crypto_stream_xchacha20_NONCEBYTES}`);
    }
    const pwhashSalt: Uint8Array = from_base64(cryptoInfo.PwhashSaltBase64);
    const xchacha20Key = crypto_pwhash(
        crypto_stream_xchacha20_KEYBYTES,
        password ?? '',
        pwhashSalt,
        crypto_pwhash_OPSLIMIT_INTERACTIVE,
        crypto_pwhash_MEMLIMIT_INTERACTIVE,
        crypto_pwhash_ALG_DEFAULT,
        'uint8array',
    );

    let blockPosIndex = 0;
    const blockIndexLast = bockIndex;
    const startPos = magicNumberPadded.paddedDataLength + 8 + 8 + 8 + modMetaBufferPadded.paddedDataLength;
    for (let blockIndex = 0; blockIndex < blockIndexLast; blockIndex++) {

        const blockStartPos = startPos + blockPosIndex * BlockSize;
        const blockEndPos = blockStartPos + BlockSize;
        const blockData = modPackBuffer.subarray(blockStartPos, blockEndPos);
        if (blockData.length < BlockSize) {
            // If the last block is not full
            // this will never happen
            console.warn(`Block data length is less than block size: ${blockData.length} < ${BlockSize}`);
            throw new Error(`Block data length is less than block size: ${blockData.length} < ${BlockSize}`);
        }
        const encryptedBlock = crypto_stream_xchacha20_xor_ic(
            blockData,
            xchacha20Nonce,
            blockIndex,
            xchacha20Key,
            'uint8array',
        );
        modPackBuffer.set(encryptedBlock, blockStartPos);
        blockPosIndex++;
    }

    const xxHashPos = startPos + blockPosIndex * BlockSize;
    const hashValue = calcXxHash64(modPackBuffer.subarray(0, xxHashPos), xxhashApi);
    dataView.setBigUint64(xxHashPos, BigInt(hashValue), true); // Store the xxHash value at the end of the mod pack buffer

    return {
        modMeta: modMeta,
        modPackBuffer: modPackBuffer,
        ext: cryptoInfo ? '.modpack.crypt' : '.modpack',
        hash: hashValue,
        hashString: XxHashH64Bigint2String(hashValue),
    };

}

export class ModPackFileReader {
    constructor() {
    }

    get isInit(): boolean {
        return !!this.modMeta && !!this.modPackBuffer && this.modPackBuffer.length > 0;
    }

    private password?: string;
    private modMeta!: ModMeta;
    private fileDataStartPos!: bigint;
    private xchacha20Key?: Uint8Array;
    private xchacha20Nonce?: Uint8Array;
    private modPackBuffer!: Uint8Array;
    private fileTree?: Record<string, any>;
    static xxhashApi?: Awaited<ReturnType<typeof xxhash>>;
    private xxHashValue?: bigint;

    get modPackBufferSize(): number {
        if (!this.isInit) {
            throw new Error('ModPackFileReader is not initialized. Please call load() first.');
        }
        return this.modPackBuffer.length;
    }

    get modMetaInfo(): ModMeta {
        if (!this.isInit) {
            throw new Error('ModPackFileReader is not initialized. Please call load() first.');
        }
        return this.modMeta;
    }

    get hash(): bigint {
        if (!this.isInit) {
            throw new Error('ModPackFileReader is not initialized. Please call load() first.');
        }
        return this.xxHashValue!;
    }

    get hashString(): string {
        if (!this.isInit) {
            throw new Error('ModPackFileReader is not initialized. Please call load() first.');
        }
        return XxHashH64Bigint2String(this.xxHashValue!);
    }

    public async checkHash(modPackBuffer: Uint8Array) {
        const xxhashApi = ModPackFileReader.xxhashApi ?? await xxhash();
        ModPackFileReader.xxhashApi = xxhashApi;
        const dataView = new DataView(this.modPackBuffer.buffer);
        const xxHashValue = dataView.getBigUint64(dataView.byteLength - 8, true);
        const hashValue = calcXxHash64(this.modPackBuffer.subarray(0, this.modPackBuffer.length - 8), xxhashApi);
        console.log('[ModPackFileReader] xxHashValue:', XxHashH64Bigint2String(xxHashValue));
        console.log('[ModPackFileReader] hashValue:', XxHashH64Bigint2String(hashValue));
        if (xxHashValue !== hashValue) {
            console.error(`[ModPackFileReader] Invalid xxHash value: ${XxHashH64Bigint2String(xxHashValue)}, expected: ${XxHashH64Bigint2String(hashValue)}`);
            return false;
        }
        this.xxHashValue = xxHashValue;
        return true;
    }

    public async load(modPackBuffer: Uint8Array, password?: string): Promise<ModMeta> {
        await ready;
        const xxhashApi = ModPackFileReader.xxhashApi ?? await xxhash();
        ModPackFileReader.xxhashApi = xxhashApi;

        this.modPackBuffer = modPackBuffer;
        this.password = password;

        const magicNumberLength = Math.ceil(MagicNumber.length / BlockSize) * BlockSize; // Ensure magic number is padded to block size
        if (this.modPackBuffer.length < magicNumberLength + 8 + 8 + 8) {
            throw new Error('Mod pack buffer is too short to contain mod meta');
        }
        const magicNumber = this.modPackBuffer.subarray(0, MagicNumber.length);
        if (!magicNumber.every((value, index) => value === MagicNumber[index])) {
            throw new Error('Invalid magic number in mod pack buffer');
        }

        if (!await this.checkHash(this.modPackBuffer)) {
            console.error('[ModPackFileReader] Mod pack hash check failed');
            throw new Error('[ModPackFileReader] Mod pack hash check failed');
        }

        // const modMetaStartPos = magicNumberLength + 8 + 8 + 8; // magic
        const dataView = new DataView(this.modPackBuffer.buffer);
        const modMetaBufferStartPos = dataView.getBigUint64(magicNumberLength, true);
        const modMetaBufferEndPos = dataView.getBigUint64(magicNumberLength + 8, true);
        const fileDataStartPos = dataView.getBigUint64(magicNumberLength + 8 + 8, true);
        const modMetaBufferLength = modMetaBufferEndPos - modMetaBufferStartPos;
        // console.log('[ModPackFileReader] modMetaBufferStartPos:', modMetaBufferStartPos);
        // console.log('[ModPackFileReader] modMetaBufferEndPos:', modMetaBufferEndPos);
        // console.log('[ModPackFileReader] fileDataStartPos:', fileDataStartPos);
        // console.log('[ModPackFileReader] modMetaBufferLength:', modMetaBufferLength);
        if (modMetaBufferEndPos + modMetaBufferLength > this.modPackBuffer.length) {
            console.error('[ModPackFileReader] Mod buffer is too short');
            throw new Error('[ModPackFileReader] Mod buffer is too short');
        }
        const modMetaBuffer = this.modPackBuffer.subarray(Number(modMetaBufferStartPos), Number(modMetaBufferEndPos));
        // console.log('[ModPackFileReader] modMetaBuffer length:', modMetaBuffer.length);
        // console.log(modMetaBuffer);
        const modMeta = BSON.deserialize(modMetaBuffer) as ModMeta;
        // console.log('[ModPackFileReader] modMeta:', modMeta);
        // console.log('[ModPackFileReader] modMeta.magicNumber:', from_base64(modMeta.magicNumber));
        if (!from_base64(modMeta.magicNumber).every((value, index) => value === MagicNumber[index])) {
            console.error('[ModPackFileReader] Invalid magic number in mod meta');
            throw new Error('[ModPackFileReader] Invalid magic number in mod meta');
        }

        this.modMeta = modMeta;

        // check ModMeta valid
        if (modMeta.protocolVersion !== ModMetaProtocolVersion) {
            console.error(`[ModPackFileReader] Invalid mod meta protocol version: ${modMeta.protocolVersion}, expected: ${ModMetaProtocolVersion}`);
            throw new Error(`[ModPackFileReader] Invalid mod meta protocol version: ${modMeta.protocolVersion}, expected: ${ModMetaProtocolVersion}`);
        }
        if (modMeta.blockSize <= 0 || modMeta.blockSize > 1024 * 1024 * 64 || modMeta.blockSize % 2 !== 0) {
            console.error(`[ModPackFileReader] Invalid block size: ${modMeta.blockSize}`);
            throw new Error(`[ModPackFileReader] Invalid block size: ${modMeta.blockSize}`);
        }
        if (modMeta.bootJsonFile.b < 0 || modMeta.bootJsonFile.e < modMeta.bootJsonFile.b || modMeta.bootJsonFile.l <= 0) {
            console.error(`[ModPackFileReader] Invalid boot json file meta: ${JSON.stringify(modMeta.bootJsonFile)}`);
            throw new Error(`[ModPackFileReader] Invalid boot json file meta: ${JSON.stringify(modMeta.bootJsonFile)}`);
        }
        for (const [filePath, fileMeta] of Object.entries(modMeta.fileMeta)) {
            if (fileMeta.b < 0 || fileMeta.e < fileMeta.b || fileMeta.l <= 0) {
                console.error(`[ModPackFileReader] Invalid file meta for ${filePath}: ${JSON.stringify(fileMeta)}`);
                throw new Error(`[ModPackFileReader] Invalid file meta for ${filePath}: ${JSON.stringify(fileMeta)}`);
            }
        }

        // check fileMeta not overlap
        const fileMetaList = Object.values(modMeta.fileMeta);
        fileMetaList.sort((a, b) => a.b - b.b); // Sort by begin index
        for (let i = 0; i < fileMetaList.length - 1; i++) {
            const current = fileMetaList[i];
            const next = fileMetaList[i + 1];
            if (current.e >= next.b) {
                console.error(`[ModPackFileReader] File meta overlap detected between ${JSON.stringify(current)} and ${JSON.stringify(next)}`);
                throw new Error(`[ModPackFileReader] File meta overlap detected between ${JSON.stringify(current)} and ${JSON.stringify(next)}`);
            }
        }

        let xchacha20Key;
        let xchacha20Nonce;
        if (modMeta.cryptoInfo && password) {
            if (!modMeta.cryptoInfo.Xchacha20NonceBase64 || !modMeta.cryptoInfo.PwhashSaltBase64) {
                console.error('[ModPackFileReader] Crypto info is incomplete');
                throw new Error('[ModPackFileReader] Crypto info is incomplete');
            }
            xchacha20Nonce = from_base64(modMeta.cryptoInfo.Xchacha20NonceBase64);
            if (xchacha20Nonce.length !== crypto_stream_xchacha20_NONCEBYTES) {
                console.error(`[ModPackFileReader] Invalid xchacha20 nonce length: ${xchacha20Nonce.length}, expected: ${crypto_stream_xchacha20_NONCEBYTES}`);
                throw new Error(`[ModPackFileReader] Invalid xchacha20 nonce length: ${xchacha20Nonce.length}, expected: ${crypto_stream_xchacha20_NONCEBYTES}`);
            }
            const pwhashSalt = from_base64(modMeta.cryptoInfo.PwhashSaltBase64);
            if (pwhashSalt.length !== crypto_pwhash_SALTBYTES) {
                console.error(`[ModPackFileReader] Invalid pwhash salt length: ${pwhashSalt.length}, expected: ${crypto_pwhash_SALTBYTES}`);
                throw new Error(`[ModPackFileReader] Invalid pwhash salt length: ${pwhashSalt.length}, expected: ${crypto_pwhash_SALTBYTES}`);
            }

            xchacha20Key = crypto_pwhash(
                crypto_stream_xchacha20_KEYBYTES,
                password,
                pwhashSalt,
                crypto_pwhash_OPSLIMIT_INTERACTIVE,
                crypto_pwhash_MEMLIMIT_INTERACTIVE,
                crypto_pwhash_ALG_DEFAULT,
                'uint8array',
            );
        }

        // ok
        this.modMeta = modMeta;
        this.fileDataStartPos = fileDataStartPos;
        this.xchacha20Key = xchacha20Key;
        this.xchacha20Nonce = xchacha20Nonce;
        return modMeta;
    }

    getFileList(): string[] {
        const fileList: string[] = [];
        for (const filePath in this.modMeta.fileMeta) {
            if (this.modMeta.fileMeta.hasOwnProperty(filePath)) {
                fileList.push(filePath);
            }
        }
        return fileList;
    }

    protected async getFileByMeta(fileMeta: FileMeta, filePath: string): Promise<Uint8Array | undefined> {
        await ready;

        const fileStartPos = Number(this.fileDataStartPos) + fileMeta.b * this.modMeta.blockSize;
        const fileEndPos = fileStartPos + fileMeta.l;
        if (fileEndPos > this.modPackBuffer.length) {
            console.error(`[ModPackFileReader] File ${filePath} end position exceeds mod pack buffer length`);
            throw new Error(`[ModPackFileReader] File ${filePath} end position exceeds mod pack buffer length`);
        }
        if (!(this.xchacha20Key && this.xchacha20Nonce)) {
            // If the mod pack is not encrypted, we can read the file data directly
            const fileData = this.modPackBuffer.subarray(fileStartPos, fileEndPos);
            if (fileData.length !== fileMeta.l) {
                console.error(`[ModPackFileReader] File ${filePath} data length mismatch: expected ${fileMeta.l}, got ${fileData.length}`);
                throw new Error(`[ModPackFileReader] File ${filePath} data length mismatch: expected ${fileMeta.l}, got ${fileData.length}`);
            }
            return fileData;
        }

        // If the mod pack is encrypted, we need to decrypt the file data block by block
        const fileStartBlockIndex = fileMeta.b;
        const fileEndBlockIndex = fileMeta.e;
        if (fileStartBlockIndex < 0 || fileEndBlockIndex < fileStartBlockIndex || fileEndBlockIndex >= this.modPackBuffer.length / this.modMeta.blockSize) {
            console.error(`[ModPackFileReader] Invalid file block index for ${filePath}: start ${fileStartBlockIndex}, end ${fileEndBlockIndex}`);
            throw new Error(`[ModPackFileReader] Invalid file block index for ${filePath}: start ${fileStartBlockIndex}, end ${fileEndBlockIndex}`);
        }
        const fileData = new Uint8Array(Number(fileEndBlockIndex - fileStartBlockIndex + 1) * this.modMeta.blockSize);
        let offset = 0;
        for (let blockIndex = fileStartBlockIndex; blockIndex <= fileEndBlockIndex; blockIndex++) {
            const blockStartPos = Number(this.fileDataStartPos) + blockIndex * this.modMeta.blockSize;
            const blockEndPos = blockStartPos + this.modMeta.blockSize;
            if (blockEndPos > this.modPackBuffer.length) {
                console.error(`[ModPackFileReader] Block ${blockIndex} end position exceeds mod pack buffer length`);
                throw new Error(`[ModPackFileReader] Block ${blockIndex} end position exceeds mod pack buffer length`);
            }
            const blockData = this.modPackBuffer.subarray(blockStartPos, blockEndPos);
            if (blockData.length !== this.modMeta.blockSize) {
                console.error(`[ModPackFileReader] Block ${blockIndex} data length mismatch: expected ${this.modMeta.blockSize}, got ${blockData.length}`);
                throw new Error(`[ModPackFileReader] Block ${blockIndex} data length mismatch: expected ${this.modMeta.blockSize}, got ${blockData.length}`);
            }
            const decryptedBlockData = crypto_stream_xchacha20_xor_ic(
                blockData,
                this.xchacha20Nonce,
                blockIndex,
                this.xchacha20Key,
                'uint8array',
            );
            // console.log('offset', offset);
            // console.log('fileData', fileData.length);
            // console.log('decryptedBlockData', decryptedBlockData.length);
            fileData.set(decryptedBlockData, offset);
            offset += decryptedBlockData.length;
        }
        // Check if the decrypted file data length matches the expected length
        if (offset < fileMeta.l) {
            console.error(`[ModPackFileReader] Decrypted file ${filePath} data length mismatch: expected ${fileMeta.l}, got ${offset}`);
            throw new Error(`[ModPackFileReader] Decrypted file ${filePath} data length mismatch: expected ${fileMeta.l}, got ${offset}`);
        }
        // Return the decrypted file data
        return fileData.subarray(0, fileMeta.l); // Trim to the expected length
    }

    public async getFile(filePath: string): Promise<Uint8Array | undefined> {
        if (!this.modMeta.fileMeta[filePath]) {
            console.warn(`[ModPackFileReader] File ${filePath} not found in mod meta`);
            return undefined;
        }
        const fileMeta = this.modMeta.fileMeta[filePath];
        return this.getFileByMeta(fileMeta, filePath);
    }

    public async readFile(filePath: string): Promise<Uint8Array | undefined> {
        return this.getFile(filePath);
    }

    public async getBootJson(): Promise<Uint8Array | undefined> {
        await ready;
        return this.getFileByMeta(this.modMeta.bootJsonFile, 'boot.json');
    }

    public async getFileTree(): Promise<Record<string, any> | undefined> {
        await ready;
        if (this.fileTree) {
            return this.fileTree;
        }
        const fileTreeBuffer = await this.getFileByMeta(this.modMeta.fileTreeBlock, 'fileTree');
        if (!fileTreeBuffer) {
            console.warn('[ModPackFileReader] File tree not found in mod meta');
            return undefined;
        }
        try {
            const fileTree = BSON.deserialize(fileTreeBuffer) as Record<string, any>;
            this.fileTree = fileTree;
            return fileTree;
        } catch (error) {
            console.error('[ModPackFileReader] Failed to deserialize file tree:', error);
            throw error;
        }
    }

    get fileTreeRef() {
        return this.fileTree;
    }

    public async checkValid(): Promise<boolean> {
        await ready;
        try {
            // Check if modMeta is loaded
            if (!this.modMeta) {
                console.error('[ModPackFileReader] Mod meta not loaded');
                return false;
            }
            // Check if fileDataStartPos is set
            if (this.fileDataStartPos === undefined) {
                console.error('[ModPackFileReader] File data start position not set');
                return false;
            }
            // Check if xchacha20Key and xchacha20Nonce are set if password is provided
            if (this.password && !(this.xchacha20Key && this.xchacha20Nonce)) {
                console.error('[ModPackFileReader] Xchacha20 key or nonce not set');
                console.log('[ModPackFileReader] password', this.password);
                console.log('[ModPackFileReader] xchacha20Key', this.xchacha20Key);
                console.log('[ModPackFileReader] xchacha20Nonce', this.xchacha20Nonce);
                return false;
            }
            if (!this.password && (this.xchacha20Key || this.xchacha20Nonce)) {
                console.error('[ModPackFileReader] Xchacha20 key or nonce set without password');
                console.log('[ModPackFileReader] password', this.password);
                console.log('[ModPackFileReader] xchacha20Key', this.xchacha20Key);
                console.log('[ModPackFileReader] xchacha20Nonce', this.xchacha20Nonce);
                return false;
            }
            const boot = await this.getBootJson();
            if (!boot) {
                console.error('[ModPackFileReader] Boot JSON not loaded');
                return false;
            }
            // check file tree compare with file list
            const fileTree = await this.getFileTree();
            if (!fileTree) {
                console.error('[ModPackFileReader] File tree not loaded');
                return false;
            }
            const fileList = this.getFileList();
            const fileTreeCheck = createFileTreeFromFileList(fileList);
            if (!isEqual(fileTree, fileTreeCheck)) {
                console.error('[ModPackFileReader] File tree does not match file list');
                console.error('File tree:', JSON.stringify(fileTree, null, 2));
                console.error('File tree check:', JSON.stringify(fileTreeCheck, null, 2));
                return false;
            }
            // If all checks passed, return true
            return true;
        } catch (error) {
            console.error('[ModPackFileReader] Error checking validity:', error);
            return false;
        }
    }
}
