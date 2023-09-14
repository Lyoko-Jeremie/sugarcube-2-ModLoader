import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {every, get, isArray, isString} from 'lodash';

export async function img2base64Url(fPath: string) {
    const img = await promisify(fs.readFile)(fPath);
    const base64 = img.toString('base64');
    const ext = path.extname(fPath);
    return `data:image/${ext};base64,${base64}`;
}

export interface ModBootJson {
    name: string;
    version: string;
    styleFileList: string[];
    scriptFileList: string[];
    tweeFileList: string[];
    imgFileList: string[];
}

export function validateBootJson(bootJ: any): bootJ is ModBootJson {
    return bootJ
        && isString(get(bootJ, 'name'))
        && get(bootJ, 'name').length > 0
        && isString(get(bootJ, 'version'))
        && get(bootJ, 'version').length > 0
        && isArray(get(bootJ, 'styleFileList'))
        && every(get(bootJ, 'styleFileList'), isString)
        && isArray(get(bootJ, 'scriptFileList'))
        && every(get(bootJ, 'scriptFileList'), isString)
        // && isArray(get(bootJ, 'scriptFileList_Postload'))
        // && every(get(bootJ, 'scriptFileList_Postload'), isString)
        && isArray(get(bootJ, 'tweeFileList'))
        && every(get(bootJ, 'tweeFileList'), isString)
        && isArray(get(bootJ, 'imgFileList'))
        && every(get(bootJ, 'imgFileList'), isString);
}

// NOTE: 同一个 twee 文件只能包含一个 passage ， 文件要以 passage 命名
//       zip 中的图片在加载后会将脚本中所有引用图片的路径替换为图片的 base64url ，故建议尽量使得图片路径`唯一`，以免错误替换

;(async () => {

    // create zip
    var zip = new JSZip();
    zip.file('i18nCnObj.json', JSON.stringify(data, undefined, ' '));
    const zipBase64 = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: {level: 9},
    });

})();
