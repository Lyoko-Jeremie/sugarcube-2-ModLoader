// 文件结构
// 每一个部分都对齐到 BlockSize ， 不满足的数据在末尾padding随机字符串
// ----------
// block -1 : 文件头魔数 MagicNumber ：JeremieModLoader
// block -1 : 包括三个 8byte 长度数据(bigint) : ModMeta开始位置(byte)， ModMeta结束位置(byte)， 所有文件数据开始位置(byte)
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
