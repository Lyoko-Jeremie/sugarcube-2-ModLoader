import type {} from '../src/BeforeSC2/global';

async function getImageFromMode(imagePath: string) {
    // const imageBase64String = await window.modUtils.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(imagePath);
    const imageBase64String = await window.modUtils.getImage(imagePath);
}


