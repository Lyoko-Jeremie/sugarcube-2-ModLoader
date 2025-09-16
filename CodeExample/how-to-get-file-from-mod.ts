import type {} from '../src/BeforeSC2/global';

// get a file from a mod and read it as base64 string
window.modUtils.getModZip('GameOriginalImagePack').zip.file('img/clothes/handheld/gymbag/right_gray.png').async('base64').then((base64String) => {
    console.log(base64String);
});

// get all files in a mod
window.modUtils.getModZip('GameOriginalImagePack').zip.files;

// 请注意，因为需要同时支持 JsZip 和 ModPack 。 故不能假定 `getModZip().zip` 获取到的一定是 JsZip 对象。
// 可以通过 `getModZip().zip.is_JeremieModLoader_ModPack` 来判断是否为 ModPack 。
// ModLoader 已经尽可能实现了对齐的公有接口，但仍然可能存在差异。且 ModPack 不支持 internalStream 等 JsZip 私有接口。
// 在非加密编码的 ModPack 中，使用 `.zip.file('xxxxxxx').async('arraybuffer')` 可以直接访问内存中的原始二进制数据块，可以配合 for 循环逐字节访问来最小化内存占用，
