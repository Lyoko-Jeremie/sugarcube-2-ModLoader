import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {every, get, has, isArray, isString} from 'lodash';

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
    scriptFileList_perload?: string[];
    scriptFileList_earlyload?: string[];
    tweeFileList: string[];
    imgFileList: string[];
    addstionFile: string[];
    imgFileReplaceList: [string, string][];
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
        && every(get(bootJ, 'imgFileList'), isString)
        && isArray(get(bootJ, 'imgFileReplaceList'))
        && every(get(bootJ, 'imgFileReplaceList'), T => isArray(T) && T.length === 2 && isString(T[0]) && isString(T[1]))
        // useless file
        && isArray(get(bootJ, 'addstionFile'))
        && every(get(bootJ, 'addstionFile'), isString)
        // optional
        && (has(bootJ, 'scriptFileList_perload') ?
            (isArray(get(bootJ, 'scriptFileList_perload')) && every(get(bootJ, 'scriptFileList_perload'), isString)) : true)
        && (has(bootJ, 'scriptFileList_earlyload') ?
            (isArray(get(bootJ, 'scriptFileList_earlyload')) && every(get(bootJ, 'scriptFileList_earlyload'), isString)) : true);
}

// NOTE: 同一个 twee 文件只能包含一个 passage ， 文件要以 passage 命名
//       zip 中的图片在加载后会将脚本中所有引用图片的路径替换为图片的 base64url ，故建议尽量使得图片路径`唯一`，以免错误替换

;(async () => {
    console.log('process.argv.length', process.argv.length);
    console.log('process.argv', process.argv);
    const bootJsonFilePath = process.argv[2];
    console.log('bootJsonFilePath', bootJsonFilePath);
    if (!bootJsonFilePath) {
        console.error('no bootJsonFilePath');
        return;
    }
    const bootJsonF = await promisify(fs.readFile)(bootJsonFilePath, {encoding: 'utf-8'});

    const bootJson = JSON.parse(bootJsonF);

    if (!validateBootJson(bootJson)) {
        console.error('(!validateBootJson(bootJsonF)), json format invalid.');
        return;
    }

    bootJson;

    // create zip
    var zip = new JSZip();
    for (const imgPath of bootJson.imgFileList) {
        const imgBase64Url = await img2base64Url(imgPath);
        zip.file(imgPath, imgBase64Url);
    }
    for (const tweePath of bootJson.tweeFileList) {
        const tweeFile = await promisify(fs.readFile)(tweePath, {encoding: 'utf-8'});
        zip.file(tweePath, tweeFile);
    }
    for (const stylePath of bootJson.styleFileList) {
        const styleFile = await promisify(fs.readFile)(stylePath, {encoding: 'utf-8'});
        zip.file(stylePath, styleFile);
    }
    for (const scriptPath of bootJson.scriptFileList) {
        const scriptFile = await promisify(fs.readFile)(scriptPath, {encoding: 'utf-8'});
        zip.file(scriptPath, scriptFile);
    }
    for (const scriptPath of bootJson.addstionFile) {
        const scriptFile = await promisify(fs.readFile)(scriptPath, {encoding: 'utf-8'});
        zip.file(scriptPath, scriptFile);
    }
    if (bootJson.scriptFileList_perload) {
        for (const scriptPath of bootJson.scriptFileList_perload) {
            const scriptFile = await promisify(fs.readFile)(scriptPath, {encoding: 'utf-8'});
            zip.file(scriptPath, scriptFile);
        }
    }
    if (bootJson.scriptFileList_earlyload) {
        for (const scriptPath of bootJson.scriptFileList_earlyload) {
            const scriptFile = await promisify(fs.readFile)(scriptPath, {encoding: 'utf-8'});
            zip.file(scriptPath, scriptFile);
        }
    }
    zip.file('boot.json', JSON.stringify(bootJson, undefined, ' '));
    const zipBase64 = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: {level: 9},
    });

    await promisify(fs.writeFile)(bootJson.name + '.mod.zip', zipBase64, {encoding: 'utf-8'});

})();
