import JSZip from "jszip";
import {every, get, has, isArray, isString} from "lodash";
import {get as keyval_get, set as keyval_set, del as keyval_del, createStore, UseStore, setMany} from 'idb-keyval';
import {SC2DataInfo} from "./SC2DataInfoCache";
import {ModBootJson, ModInfo} from "./ModLoader";
import {ModLoadControllerCallback} from "./ModLoadController";

export interface Twee2PassageR {
    name: string;
    tags: string[];
    contect: string;
};

export function Twee2Passage(s: string): Twee2PassageR[] {
    // match:
    //      :: Widgets Bodywriting Objects [widget]
    //      :: Widgets Bodywriting Objects
    //      :: Widgets Bodywriting Objects [widget asdasd]
    const r = s.split(/^(:: +((?:[^:"\\/\n\r\[\] ]+ *)+)(?:(?: +\[((?:\w+ *)+)\] *)?|))$/gm);
    // console.log('Twee2Passage split ', r, [s]);
    // ['xxx', ':: Widgets Bodywriting Objects [widget]', 'Widgets', 'Bodywriting Objects', 'widget', 'xxx']
    const rr: Twee2PassageR[] = [];
    for (let i = 0; i < r.length; i++) {
        if (r[i].startsWith(':: ')) {
            rr.push({
                name: r[++i],
                tags: r[++i]?.split(' ') || [],
                contect: r[++i],
            });
        }
    }
    return rr;
}


export class ModZipReader {
    constructor(
        public zip: JSZip,
        public loaderBase: LoaderBase,
        public modLoadControllerCallback: ModLoadControllerCallback,
    ) {
    }

    modInfo?: ModInfo;

    getModInfo() {
        return this.modInfo;
    }

    getZipFile() {
        return this.zip;
    }

    static validateBootJson(bootJ: any): bootJ is ModBootJson {
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
            // optional
            && (has(bootJ, 'scriptFileList_preload') ?
                (isArray(get(bootJ, 'scriptFileList_preload')) && every(get(bootJ, 'scriptFileList_preload'), isString)) : true)
            && (has(bootJ, 'scriptFileList_earlyload') ?
                (isArray(get(bootJ, 'scriptFileList_earlyload')) && every(get(bootJ, 'scriptFileList_earlyload'), isString)) : true)
            && (has(bootJ, 'scriptFileList_inject_early') ?
                (isArray(get(bootJ, 'scriptFileList_inject_early')) && every(get(bootJ, 'scriptFileList_inject_early'), isString)) : true);
    }

    static modBootFilePath = 'boot.json';

    replaceImgWithBase64String(s: string) {
        this.modInfo?.imgs.forEach(T => {
            s = s.replace(T.path, T.data);
        });
    }

    async init() {
        const bootJsonFile = this.zip.file(ModZipReader.modBootFilePath);
        if (!bootJsonFile) {
            console.log('ModLoader ====== ModZipReader init() cannot find :', ModZipReader.modBootFilePath);
            return false;
        }
        const bootJson = await bootJsonFile.async('string')
        const bootJ = JSON.parse(bootJson);
        // console.log('ModZipReader init() bootJ', bootJ);
        // console.log('ModZipReader init() bootJ', this.validateBootJson(bootJ));
        // console.log('ModZipReader init() bootJ', [
        //     bootJ
        //     , isString(get(bootJ, 'name'))
        //     , get(bootJ, 'name').length > 0
        //     , isString(get(bootJ, 'version'))
        //     , get(bootJ, 'version').length > 0
        //     , isArray(get(bootJ, 'styleFileList'))
        //     , every(get(bootJ, 'styleFileList'), isString)
        //     , isArray(get(bootJ, 'scriptFileList'))
        //     , every(get(bootJ, 'scriptFileList'), isString)
        //     , isArray(get(bootJ, 'tweeFileList'))
        //     , every(get(bootJ, 'tweeFileList'), isString)
        //     , isArray(get(bootJ, 'imgFileList'))
        //     , every(get(bootJ, 'imgFileList'), isString)
        //     , isArray(get(bootJ, 'imgFileReplaceList'))
        //     , every(get(bootJ, 'imgFileReplaceList'), T => isArray(T) && T.length === 2 && isString(T[0]) && isString(T[1]))
        // ]);
        if (ModZipReader.validateBootJson(bootJ)) {
            if (!this.modLoadControllerCallback.canLoadThisMod(bootJ, this.zip)) {
                console.log('ModLoader ====== ModZipReader init() this mod be filted by ModLoadController:', bootJ);
                return false;
            }
            this.modInfo = {
                name: bootJ.name,
                version: bootJ.version,
                cache: new SC2DataInfo(bootJ.name),
                imgs: [],
                imgFileReplaceList: [],
                scriptFileList_preload: [],
                scriptFileList_earlyload: [],
                scriptFileList_inject_early: [],
                bootJson: bootJ,
            };
            this.loaderBase.addZipFile(bootJ.name, this);

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
            this.modInfo.cache.styleFileItems.fillMap();
            for (const tweePath of bootJ.tweeFileList) {
                const imgFile = this.zip.file(tweePath);
                if (imgFile) {
                    const data = await imgFile.async('string');
                    const tp = Twee2Passage(data);
                    // console.log('Twee2Passage', tp, [data]);
                    for (const p of tp) {
                        this.replaceImgWithBase64String(p.contect);
                        this.modInfo.cache.passageDataItems.items.push({
                            name: p.name,
                            content: p.contect,
                            id: 0,
                            tags: p.tags,
                        });
                    }


                    // {
                    //     // <<widget "variablesStart2">>
                    //     const isWidget = /<<widget\W+"([^ "]+)"\W*>>/.test(data);
                    //     this.replaceImgWithBase64String(data);
                    //     this.modInfo.cache.passageDataItems.items.push({
                    //         name: tweePath,
                    //         content: data,
                    //         id: 0,
                    //         tags: isWidget ? ['widget'] : [],
                    //     });
                    // }
                } else {
                    console.warn('cannot get tweeFileList file from mod zip:', [this.modInfo.name, tweePath])
                }
            }
            this.modInfo.cache.passageDataItems.fillMap();
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
            this.modInfo.cache.scriptFileItems.fillMap();

            // optional
            if (has(bootJ, 'scriptFileList_preload')) {
                for (const scPath of bootJ.scriptFileList_preload) {
                    const scFile = this.zip.file(scPath);
                    if (scFile) {
                        const data = await scFile.async('string');
                        this.modInfo.scriptFileList_preload.push([scPath, data]);
                    } else {
                        console.warn('cannot get scriptFileList_preload file from mod zip:', [this.modInfo.name, scPath])
                    }
                }
            }
            if (has(bootJ, 'scriptFileList_earlyload')) {
                for (const scPath of bootJ.scriptFileList_earlyload) {
                    const scFile = this.zip.file(scPath);
                    if (scFile) {
                        const data = await scFile.async('string');
                        this.modInfo.scriptFileList_earlyload.push([scPath, data]);
                    } else {
                        console.warn('cannot get scriptFileList_earlyload file from mod zip:', [this.modInfo.name, scPath])
                    }
                }
            }
            if (has(bootJ, 'scriptFileList_inject_early')) {
                for (const scPath of bootJ.scriptFileList_inject_early) {
                    const scFile = this.zip.file(scPath);
                    if (scFile) {
                        const data = await scFile.async('string');
                        this.modInfo.scriptFileList_inject_early.push([scPath, data]);
                    } else {
                        console.warn('cannot get scriptFileList_earlyload file from mod zip:', [this.modInfo.name, scPath])
                    }
                }
            }

            console.log('ModLoader ====== ModZipReader init() modInfo', this.modInfo);
            return true;
        }
        return false;
    }
}

export class LoaderBase {
    modList: ModZipReader[] = [];
    modZipList: Map<string, ModZipReader[]> = new Map<string, ModZipReader[]>();

    constructor(
        public modLoadControllerCallback: ModLoadControllerCallback,
    ) {
    }

    getZipFile(name: string) {
        return this.modZipList.get(name);
    }

    addZipFile(name: string, zip: ModZipReader) {
        if (this.modZipList.has(name)) {
            this.modZipList.get(name)!.push(zip);
            return;
        }
        this.modZipList.set(name, [zip]);
    }

    async load(): Promise<boolean> {
        throw new Error('LoaderBase load() not implement');
    }
}

export class LocalStorageLoader extends LoaderBase {

    static modDataLocalStorageZipList = 'modDataLocalStorageZipList';

    async load(): Promise<boolean> {

        const listFile = localStorage.getItem(LocalStorageLoader.modDataLocalStorageZipList);
        if (!listFile) {
            return Promise.resolve(false);
        }
        let list: string[];
        try {
            list = JSON.parse(listFile);
        } catch (e) {
            console.error(e);
            return Promise.resolve(false);
        }
        if (!(isArray(list) && list.every(isString))) {
            return Promise.resolve(false);
        }

        console.log('ModLoader ====== LocalStorageLoader load() list', list);

        // modDataBase64ZipStringList: base64[]
        for (const zipPath of list) {
            const base64ZipString = localStorage.getItem(LocalStorageLoader.calcModNameKey(zipPath));
            if (!base64ZipString) {
                console.error('ModLoader ====== LocalStorageLoader load() cannot get zipPath:', zipPath);
                continue;
            }
            try {
                const m = await JSZip.loadAsync(base64ZipString, {base64: true}).then(zip => {
                    return new ModZipReader(zip, this, this.modLoadControllerCallback);
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

    static listMod() {
        const ls = localStorage.getItem(this.modDataLocalStorageZipList);
        if (!ls) {
            console.log('ModLoader ====== LocalStorageLoader listMod() cannot find modDataLocalStorageZipList');
            return undefined;
        }
        try {
            const l = JSON.parse(ls);
            console.log('ModLoader ====== LocalStorageLoader listMod() modDataLocalStorageZipList', l);
            if (Array.isArray(l) && l.every(isString)) {
                return l;
            }
        } catch (e) {
            console.error(e);
        }
        console.log('ModLoader ====== LocalStorageLoader listMod() modDataLocalStorageZipList Invalid');
        return undefined;
    }

    static calcModNameKey(name: string) {
        return `modDataLocalStorageZip:${name}`;
    }

    static addMod(name: string, modBase64String: string) {
        let l = new Set(this.listMod() || []);
        const k = this.calcModNameKey(name);
        l.add(name);
        localStorage.setItem(k, modBase64String);
        localStorage.setItem(this.modDataLocalStorageZipList, JSON.stringify(Array.from(l)));
    }

    static removeMod(name: string) {
        let l = this.listMod() || [];
        l = l.filter(T => T !== name);
        const k = this.calcModNameKey(name);
        localStorage.setItem(this.modDataLocalStorageZipList, JSON.stringify(l));
        localStorage.removeItem(k);
    }

    // get bootJson from zip
    static async checkModZipFile(modBase64String: string) {
        try {
            const zip = await JSZip.loadAsync(modBase64String, {base64: true});
            const bootJsonFile = zip.file(ModZipReader.modBootFilePath);
            if (!bootJsonFile) {
                console.log('ModLoader ====== LocalStorageLoader checkModeZipFile() cannot find bootJsonFile:', ModZipReader.modBootFilePath);
                return `bootJsonFile ${ModZipReader.modBootFilePath} Invalid`;
            }
            const bootJson = await bootJsonFile.async('string')
            const bootJ = JSON.parse(bootJson);
            if (ModZipReader.validateBootJson(bootJ)) {
                return bootJ;
            }
            return `bootJson Invalid`;
        } catch (E: any) {
            console.error('checkModZipFile', E);
            return Promise.reject(E);
        }
    }

}

export class IndexDBLoader extends LoaderBase {

    static dbName: string = 'ModLoader_IndexDBLoader';
    static storeName: string = 'ModLoader_IndexDBLoader';

    static modDataIndexDBZipList = 'modDataIndexDBZipList';

    customStore: UseStore;

    constructor(
        public modLoadControllerCallback: ModLoadControllerCallback,
    ) {
        super(modLoadControllerCallback);
        this.customStore = createStore(IndexDBLoader.dbName, IndexDBLoader.storeName);
    }

    async load(): Promise<boolean> {

        const listFile = await keyval_get(IndexDBLoader.modDataIndexDBZipList, this.customStore);
        if (!listFile) {
            return Promise.resolve(false);
        }
        let list: string[];
        try {
            list = JSON.parse(listFile);
        } catch (e) {
            console.error(e);
            return Promise.resolve(false);
        }
        if (!(isArray(list) && list.every(isString))) {
            return Promise.resolve(false);
        }

        console.log('ModLoader ====== IndexDBLoader load() list', list);

        // modDataBase64ZipStringList: base64[]
        for (const zipPath of list) {
            const base64ZipString = await keyval_get(IndexDBLoader.calcModNameKey(zipPath), this.customStore);
            if (!base64ZipString) {
                console.error('ModLoader ====== IndexDBLoader load() cannot get zipPath:', zipPath);
                continue;
            }
            try {
                const m = await JSZip.loadAsync(base64ZipString, {base64: true}).then(zip => {
                    return new ModZipReader(zip, this, this.modLoadControllerCallback);
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

    static async listMod() {
        const ls = await keyval_get(IndexDBLoader.modDataIndexDBZipList, createStore(IndexDBLoader.dbName, IndexDBLoader.storeName));
        if (!ls) {
            console.log('ModLoader ====== IndexDBLoader listMod() cannot find modDataIndexDBZipList');
            return undefined;
        }
        try {
            const l = JSON.parse(ls);
            console.log('ModLoader ====== IndexDBLoader listMod() modDataIndexDBZipList', l);
            if (Array.isArray(l) && l.every(isString)) {
                return l;
            }
        } catch (e) {
            console.error(e);
        }
        console.log('ModLoader ====== IndexDBLoader listMod() modDataIndexDBZipList Invalid');
        return undefined;
    }

    static calcModNameKey(name: string) {
        return `modDataIndexDBZip:${name}`;
    }

    static async addMod(name: string, modBase64String: string) {
        let l = new Set(await this.listMod() || []);
        const k = this.calcModNameKey(name);
        l.add(name);
        const db = createStore(IndexDBLoader.dbName, IndexDBLoader.storeName);
        await setMany([
            [k, modBase64String],
            [this.modDataIndexDBZipList, JSON.stringify(Array.from(l))],
        ], db);
        // await keyval_set(k, modBase64String, db);
        // await keyval_set(this.modDataIndexDBZipList, JSON.stringify(Array.from(l)), db);
    }

    static async removeMod(name: string) {
        let l = await this.listMod() || [];
        l = l.filter(T => T !== name);
        const db = createStore(IndexDBLoader.dbName, IndexDBLoader.storeName);
        const k = this.calcModNameKey(name);
        await keyval_set(this.modDataIndexDBZipList, JSON.stringify(l), db);
        await keyval_del(k, db);
    }

    // get bootJson from zip
    static async checkModZipFile(modBase64String: string) {
        try {
            const zip = await JSZip.loadAsync(modBase64String, {base64: true});
            const bootJsonFile = zip.file(ModZipReader.modBootFilePath);
            if (!bootJsonFile) {
                console.log('ModLoader ====== IndexDBLoader checkModeZipFile() cannot find bootJsonFile:', ModZipReader.modBootFilePath);
                return `bootJsonFile ${ModZipReader.modBootFilePath} Invalid`;
            }
            const bootJson = await bootJsonFile.async('string')
            const bootJ = JSON.parse(bootJson);
            if (ModZipReader.validateBootJson(bootJ)) {
                return bootJ;
            }
            return `bootJson Invalid`;
        } catch (E: any) {
            console.error('checkModZipFile', E);
            return Promise.reject(E);
        }
    }

}

export class Base64ZipStringLoader extends LoaderBase {

    constructor(
        public modLoadControllerCallback: ModLoadControllerCallback,
        // base64ZipStringList: base64[]
        public base64ZipStringList: string[],
    ) {
        super(modLoadControllerCallback);
    }

    async load(): Promise<boolean> {

        // modDataBase64ZipStringList: base64[]
        for (const base64ZipString of this.base64ZipStringList) {
            try {
                const m = await JSZip.loadAsync(base64ZipString, {base64: true}).then(zip => {
                    return new ModZipReader(zip, this, this.modLoadControllerCallback);
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

export class LocalLoader extends LoaderBase {
    modDataValueZipListPath = 'modDataValueZipList';


    async load(): Promise<boolean> {
        if ((window as any)[this.modDataValueZipListPath]) {
            console.log('ModLoader ====== LocalLoader load() DataValueZip', [(window as any)[this.modDataValueZipListPath]]);

            const modDataValueZipList: undefined | string[] = (window as any)[this.modDataValueZipListPath];
            if (modDataValueZipList && isArray(modDataValueZipList) && modDataValueZipList.every(isString)) {

                // modDataValueZipList: base64[]
                for (const modDataValueZip of modDataValueZipList) {
                    try {
                        const m = await JSZip.loadAsync(modDataValueZip, {base64: true}).then(zip => {
                            return new ModZipReader(zip, this, this.modLoadControllerCallback);
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

export class RemoteLoader extends LoaderBase {

    modDataRemoteListPath = 'modList.json';

    async load(): Promise<boolean> {
        const modList: undefined | string[] = await fetch(this.modDataRemoteListPath).then(T => T.json()).catch(E => {
            console.error(E);
            return undefined;
        });
        console.log('ModLoader ====== RemoteLoader load() modList', modList);

        if (modList && isArray(modList) && modList.every(isString)) {

            // modList: filePath[]
            for (const modFileZipPath of modList) {
                try {
                    const m = await fetch(modFileZipPath)
                        .then(T => T.blob())
                        .then(T => JSZip.loadAsync(T))
                        .then(zip => {
                            return new ModZipReader(zip, this, this.modLoadControllerCallback);
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

