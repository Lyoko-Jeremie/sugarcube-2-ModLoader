import JSZip from "jszip";
import {every, get, isArray, isString} from "lodash";
import {SC2DataInfo} from "./SC2DataInfoCache";
import {ModBootJson, ModInfo} from "./ModLoader";

export function Twee2Passage(s: string) {
    // match:
    //      :: Widgets Bodywriting Objects [widget]
    //      :: Widgets Bodywriting Objects
    //      :: Widgets Bodywriting Objects [widget asdasd]
    const r = s.split(/^(:: +(Widgets) +([^:"\\/\n\[\]]+)(?:(?: +\[((?:\w+ *)+)\] *)?|))$/gm);
    // ['xxx', ':: Widgets Bodywriting Objects [widget]', 'Widgets', 'Bodywriting Objects', 'widget', 'xxx']
    const rr: { name: string, tags: string[], contect: string }[] = [];
    for (let i = 0; i < r.length; i++) {
        if (r[i] === 'Widgets') {
            rr.push({
                name: r[i++],
                tags: r[i++].split(' '),
                contect: r[i++],
            });
        }
    }
    return r;
}


export class ModZipReader {
    constructor(
        public zip: JSZip,
    ) {
    }

    modInfo?: ModInfo;

    validateBootJson(bootJ: any): bootJ is ModBootJson {
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
            && every(get(bootJ, 'imgFileReplaceList'), isString);
    }

    modBootFilePath = 'boot.json';

    replaceImgWithBase64String(s: string) {
        this.modInfo?.imgs.forEach(T => {
            s = s.replace(T.path, T.data);
        });
    }

    async init() {
        const bootJsonFile = this.zip.file(this.modBootFilePath);
        if (!bootJsonFile) {
            console.log('ModZipReader init() cannot find :', this.modBootFilePath);
            return false;
        }
        const bootJson = await bootJsonFile.async('string')
        const bootJ = JSON.parse(bootJson);
        console.log('ModZipReader init() bootJ', bootJ);
        if (this.validateBootJson(bootJ)) {
            this.modInfo = {
                name: bootJ.name,
                version: bootJ.version,
                cache: new SC2DataInfo(bootJ.name),
                imgs: [],
                imgFileReplaceList: [],
                bootJson: bootJ,
            };

            // load file
            for (const imgRPath of bootJ.imgFileReplaceList) {
                const imgFile = this.zip.file(imgRPath[1]);
                if (imgFile) {
                    const data = await imgFile.async('string');
                    this.modInfo.imgFileReplaceList.push([
                        imgRPath[0],
                        data,
                    ]);
                } else {
                    console.warn('cannot get imgFileReplaceList file from mod zip:', [this.modInfo.name, imgFile])
                }
            }
            for (const imgPath of bootJ.imgFileList) {
                const imgFile = this.zip.file(imgPath);
                if (imgFile) {
                    const data = await imgFile.async('string');
                    this.modInfo.imgs.push({
                        data,
                        path: imgPath,
                    });
                } else {
                    console.warn('cannot get imgFileList file from mod zip:', [this.modInfo.name, imgPath])
                }
            }
            for (const stylePath of bootJ.styleFileList) {
                const styleFile = this.zip.file(stylePath);
                if (styleFile) {
                    const data = await styleFile.async('string');
                    this.replaceImgWithBase64String(data);
                    this.modInfo.cache.styleFileItems.items.push({
                        name: stylePath,
                        content: data,
                        id: 0,
                    });
                } else {
                    console.warn('cannot get styleFileList file from mod zip:', [this.modInfo.name, stylePath])
                }
            }
            for (const tweePath of bootJ.tweeFileList) {
                const imgFile = this.zip.file(tweePath);
                if (imgFile) {
                    const data = await imgFile.async('string');
                    const tp = Twee2Passage(data);
                    console.log('Twee2Passage', tp);
                    // <<widget "variablesStart2">>
                    const isWidget = /<<widget\W+"([^ "]+)"\W*>>/.test(data);
                    this.replaceImgWithBase64String(data);
                    this.modInfo.cache.passageDataItems.items.push({
                        name: tweePath,
                        content: data,
                        id: 0,
                        tags: isWidget ? ['widget'] : [],
                    });
                } else {
                    console.warn('cannot get tweeFileList file from mod zip:', [this.modInfo.name, tweePath])
                }
            }
            for (const scPath of bootJ.scriptFileList) {
                const scFile = this.zip.file(scPath);
                if (scFile) {
                    const data = await scFile.async('string');
                    this.replaceImgWithBase64String(data);
                    this.modInfo.cache.scriptFileItems.items.push({
                        name: scPath,
                        content: data,
                        id: 0,
                    });
                } else {
                    console.warn('cannot get scriptFileList file from mod zip:', [this.modInfo.name, scPath])
                }
            }

            return true;
        }
        return false;
    }
}

export class LocalLoader {
    modDataValueZipListPath = 'modDataValueZipList';

    modList: ModZipReader[] = [];

    async loadModDataFromValueZip(): Promise<boolean> {
        if ((window as any)[this.modDataValueZipListPath]) {
            console.log('loadModDataFromValueZip() DataValueZip', [(window as any)[this.modDataValueZipListPath]]);

            const modDataValueZipList: undefined | string[] = (window as any)[this.modDataValueZipListPath];
            if (modDataValueZipList && isArray(modDataValueZipList) && modDataValueZipList.every(isString)) {

                // modDataValueZipList: base64[]
                for (const modDataValueZip of modDataValueZipList) {
                    try {
                        const m = await JSZip.loadAsync(modDataValueZip, {base64: true}).then(zip => {
                            return new ModZipReader(zip);
                        });
                        if (await m.init()) {
                            this.modList.push(m);
                        }
                    } catch (E) {
                        console.error(E);
                    }
                }

                return Promise.resolve(true);
            }
        }
        return Promise.resolve(false);
    }
}

export class RemoteLoader {

    modList: ModZipReader[] = [];

    modDataRemoteListPath = 'modList.json';

    async loadTranslateDataFromRemote(): Promise<boolean> {
        const modList: undefined | string[] = await fetch(this.modDataRemoteListPath).then(T => T.json()).catch(E => {
            console.error(E);
            return undefined;
        });

        if (modList && isArray(modList) && modList.every(isString)) {

            // modList: filePath[]
            for (const modFileZipPath of modList) {
                try {
                    const m = await fetch(modFileZipPath)
                        .then(T => T.blob())
                        .then(T => JSZip.loadAsync(T))
                        .then(zip => {
                            return new ModZipReader(zip);
                        });
                    if (await m.init()) {
                        this.modList.push(m);
                    }
                } catch (E) {
                    console.error(E);
                }
            }

            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

}

