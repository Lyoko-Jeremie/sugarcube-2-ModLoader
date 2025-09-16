import type {} from '../src/BeforeSC2/global';


window.modUtils.getModZip('GameOriginalImagePack').zip.file('img/clothes/handheld/gymbag/right_gray.png').async('base64').then((base64String) => {
    console.log(base64String);
});
