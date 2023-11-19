import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {every, get, has, isArray, isObject, isString} from 'lodash';
import JSON5 from 'json5';

// export async function img2base64Url(fPath: string) {
//     const img = await promisify(fs.readFile)(fPath);
//     const base64 = img.toString('base64');
//     const ext = path.extname(fPath);
//     return `data:image/${ext};base64,${base64}`;
// }

async function listFilesIteratively(dir: string): Promise<string[]> {
    let filesToReturn: string[] = [];
    let stack = [dir];

    while (stack.length) {
        const currentPath = stack.pop();
        if (!currentPath) continue;

        const stat = await fs.promises.stat(currentPath);

        if (stat.isDirectory()) {
            const files = await fs.promises.readdir(currentPath);
            for (const file of files) {
                stack.push(path.join(currentPath, file));
            }
        } else {
            filesToReturn.push(currentPath.replaceAll('\\', '/'));
        }
    }

    return filesToReturn;
}

export interface ModBootJson {
    name: string;
    version: string;
    styleFileList: string[];
    scriptFileList: string[];
    scriptFileList_preload?: string[];
    scriptFileList_earlyload?: string[];
    scriptFileList_inject_early?: string[];
    tweeFileList: string[];
    imgFileList: string[];
    replacePatchList?: string[];
    additionFile: string[];
    additionBinaryFile: string[];
    additionDir: string[];
    addonPlugin?: ModBootJsonAddonPlugin[];
    dependenceInfo?: DependenceInfo[];
}

export interface ModBootJsonAddonPlugin {
    modName: string;
    addonName: string;
    modVersion: string;
    params?: any[] | { [key: string]: any };
}

export function checkModBootJsonAddonPlugin(v: any): v is ModBootJsonAddonPlugin {
    let c: boolean = isString(get(v, 'modName'))
        && isString(get(v, 'addonName'))
        && isString(get(v, 'modVersion'));
    if (c && has(v, 'params')) {
        c = c && (isArray(get(v, 'params')) || isObject(get(v, 'params')));
    }
    if (!c) {
        console.error('checkModBootJsonAddonPlugin(v) failed.', v, [
            isString(get(v, 'modName')),
            isString(get(v, 'addonName')),
            isString(get(v, 'modVersion')),
            has(v, 'params') ? (isArray(get(v, 'params')) || isObject(get(v, 'params'))) : true,
        ]);
    }
    return c;
}

export interface DependenceInfo {
    modName: string;
    version: string;
}

export function checkDependenceInfo(v: any): v is DependenceInfo {
    return isString(get(v, 'modName'))
        && isString(get(v, 'version'));
}

export function validateBootJson(bootJ: any): bootJ is ModBootJson {
    let c = bootJ
        && isString(get(bootJ, 'name'))
        && get(bootJ, 'name').length > 0
        && isString(get(bootJ, 'version'))
        && get(bootJ, 'version').length > 0
        && isArray(get(bootJ, 'styleFileList'))
        && every(get(bootJ, 'styleFileList'), isString)
        && isArray(get(bootJ, 'scriptFileList'))
        && every(get(bootJ, 'scriptFileList'), isString)
        && isArray(get(bootJ, 'tweeFileList'))
        && every(get(bootJ, 'tweeFileList'), isString)
        && isArray(get(bootJ, 'imgFileList'))
        && every(get(bootJ, 'imgFileList'), isString);

    // optional
    if (c && has(bootJ, 'dependenceInfo')) {
        c = c && (isArray(get(bootJ, 'dependenceInfo')) && every(get(bootJ, 'dependenceInfo'), checkDependenceInfo));
    }
    if (c && has(bootJ, 'addonPlugin')) {
        c = c && (isArray(get(bootJ, 'addonPlugin')) && every(get(bootJ, 'addonPlugin'), checkModBootJsonAddonPlugin));
    }
    if (c && has(bootJ, 'replacePatchList')) {
        c = c && (isArray(get(bootJ, 'replacePatchList')) && every(get(bootJ, 'replacePatchList'), isString));
    }
    if (c && has(bootJ, 'scriptFileList_preload')) {
        c = c && (isArray(get(bootJ, 'scriptFileList_preload')) && every(get(bootJ, 'scriptFileList_preload'), isString));
    }
    if (c && has(bootJ, 'scriptFileList_earlyload')) {
        c = c && (isArray(get(bootJ, 'scriptFileList_earlyload')) && every(get(bootJ, 'scriptFileList_earlyload'), isString));
    }
    if (c && has(bootJ, 'scriptFileList_inject_early')) {
        c = c && (isArray(get(bootJ, 'scriptFileList_inject_early')) && every(get(bootJ, 'scriptFileList_inject_early'), isString));
    }

    if (!c) {
        console.error('validateBootJson(bootJ) failed.', [
            isString(get(bootJ, 'name')),
            get(bootJ, 'name').length > 0,
            isString(get(bootJ, 'version')),
            get(bootJ, 'version').length > 0,
            isArray(get(bootJ, 'styleFileList')),
            every(get(bootJ, 'styleFileList'), isString),
            isArray(get(bootJ, 'scriptFileList')),
            every(get(bootJ, 'scriptFileList'), isString),
            isArray(get(bootJ, 'tweeFileList')),
            every(get(bootJ, 'tweeFileList'), isString),
            isArray(get(bootJ, 'imgFileList')),
            every(get(bootJ, 'imgFileList'), isString),

            'dependenceInfo',
            has(bootJ, 'dependenceInfo') &&
            isArray(get(bootJ, 'dependenceInfo')) ? every(get(bootJ, 'dependenceInfo'), checkDependenceInfo) : true,

            'addonPlugin',
            has(bootJ, 'addonPlugin') &&
            isArray(get(bootJ, 'addonPlugin')) ? every(get(bootJ, 'addonPlugin'), checkModBootJsonAddonPlugin) : true,

            'replacePatchList',
            has(bootJ, 'replacePatchList') &&
            isArray(get(bootJ, 'replacePatchList')) ? every(get(bootJ, 'replacePatchList'), isString) : true,

            'scriptFileList_preload',
            has(bootJ, 'scriptFileList_preload') &&
            isArray(get(bootJ, 'scriptFileList_preload')) ? every(get(bootJ, 'scriptFileList_preload'), isString) : true,

            'scriptFileList_earlyload',
            has(bootJ, 'scriptFileList_earlyload') &&
            isArray(get(bootJ, 'scriptFileList_earlyload')) ? every(get(bootJ, 'scriptFileList_earlyload'), isString) : true,

            'scriptFileList_inject_early',
            has(bootJ, 'scriptFileList_inject_early') &&
            isArray(get(bootJ, 'scriptFileList_inject_early')) ? every(get(bootJ, 'scriptFileList_inject_early'), isString) : true,
        ]);
    }

    return c;
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
        process.exit(1);
        return;
    }
    const bootJsonF = await promisify(fs.readFile)(bootJsonFilePath, {encoding: 'utf-8'});

    const bootJson = JSON5.parse(bootJsonF);

    if (!validateBootJson(bootJson)) {
        console.error('(!validateBootJson(bootJsonF)), json format invalid.');
        process.exit(1);
        return;
    }

    bootJson;

    // create zip
    var zip = new JSZip();
    for (const imgPath of bootJson.imgFileList) {
        // const imgBase64Url = await img2base64Url(imgPath);
        // zip.file(imgPath, imgBase64Url);
        const imgFile = await promisify(fs.readFile)(imgPath);
        zip.file(imgPath, imgFile);
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
    for (const scriptPath of bootJson.additionFile) {
        const scriptFile = await promisify(fs.readFile)(scriptPath, {encoding: 'utf-8'});
        zip.file(scriptPath, scriptFile);
    }
    for (const bfPath of bootJson.additionBinaryFile || []) {
        const scriptFile = await promisify(fs.readFile)(bfPath);
        zip.file(bfPath, scriptFile, {binary: true});
    }
    if (bootJson.replacePatchList) {
        for (const patchPath of bootJson.replacePatchList) {
            const patchFile = await promisify(fs.readFile)(patchPath, {encoding: 'utf-8'});
            zip.file(patchPath, patchFile);
        }
    }
    if (bootJson.scriptFileList_preload) {
        for (const scriptPath of bootJson.scriptFileList_preload) {
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
    if (bootJson.scriptFileList_inject_early) {
        for (const scriptPath of bootJson.scriptFileList_inject_early) {
            const scriptFile = await promisify(fs.readFile)(scriptPath, {encoding: 'utf-8'});
            zip.file(scriptPath, scriptFile);
        }
    }

    if (bootJson.additionDir) {
        for (const dirPath of bootJson.additionDir) {
            const dirFiles = await listFilesIteratively(dirPath);
            console.log('dirFiles', dirFiles);
            for (const fPath of dirFiles) {
                const f = await promisify(fs.readFile)(fPath);
                zip.file(fPath, f);
            }
        }
    }

    zip.file('boot.json', JSON.stringify(bootJson, undefined, ' '));
    const zipBase64 = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: {level: 9},
    });

    await promisify(fs.writeFile)(bootJson.name + '.mod.zip', zipBase64, {encoding: 'utf-8'});

    console.log('=== Congratulation! packModZip done! Everything is ok. ===');
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
