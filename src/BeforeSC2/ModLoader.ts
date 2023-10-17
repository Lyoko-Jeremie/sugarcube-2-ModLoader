import {every, get, has, isArray, isObject, isPlainObject, isString, cloneDeep} from 'lodash';
import {SC2DataInfo} from "./SC2DataInfoCache";
import {simulateMergeSC2DataInfoCache} from "./SimulateMerge";
import {
    imgWrapBase64Url,
    IndexDBLoader,
    LocalLoader,
    LocalStorageLoader,
    ModZipReader,
    RemoteLoader
} from "./ModZipReader";
import {SC2DataManager} from "./SC2DataManager";
import {JsPreloader} from 'JsPreloader';
import {LogWrapper, ModLoadControllerCallback} from "./ModLoadController";
import {ReplacePatcher} from "./ReplacePatcher";
import {LRUCache} from 'lru-cache';

export interface IModImgGetter {
    /**
     * @return Promise<string>   base64 img string
     */
    getBase64Image(): Promise<string>;
}

export const StaticModImgLruCache = new LRUCache<string, string>({
    max: 100,
    ttl: 1000 * 60 * 30,
    dispose: (value: string, key: string, reason: LRUCache.DisposeReason) => {
        console.log('ModImgLruCache dispose', [value], [reason]);
    },
    updateAgeOnGet: true,
    updateAgeOnHas: true,
});

export class ModImgGetterDefault implements IModImgGetter {
    constructor(
        public zip: ModZipReader,
        public imgPath: string,
        public logger: LogWrapper,
    ) {
    }

    // imgCache?: string;

    async getBase64Image() {
        const cache = StaticModImgLruCache.get(this.imgPath);
        if (cache) {
            return cache;
        }
        const imgFile = this.zip.zip.file(this.imgPath);
        if (imgFile) {
            const data = await imgFile.async('base64');
            const imgCache = imgWrapBase64Url(this.imgPath, data);
            StaticModImgLruCache.set(this.imgPath, imgCache);
            return imgCache;
        }
        console.error(`ModImgGetterDefault getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
        this.logger.error(`ModImgGetterDefault getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
        return Promise.reject(`ModImgGetterDefault getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
    }

}

export interface ModImg {
    // base64
    // data: string;

    // () => Promise<base64 string>
    getter: IModImgGetter;
    path: string;
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
    addonPlugin?: ModBootJsonAddonPlugin[];
    dependenceInfo?: DependenceInfo[];
}

export interface ModInfo {
    name: string;
    version: string;
    cache: SC2DataInfo;
    imgs: ModImg[];
    // orgin path, replace path
    imgFileReplaceList: [string, string][];
    // file name, file contect
    scriptFileList_preload: [string, string][];
    // file name, file contect
    scriptFileList_earlyload: [string, string][];
    // file name, file contect
    scriptFileList_inject_early: [string, string][];
    replacePatcher: ReplacePatcher[];
    bootJson: ModBootJson;
}

export enum ModDataLoadType {
    'Remote' = 'Remote',
    'Local' = 'Local',
    'LocalStorage' = 'LocalStorage',
    'IndexDB' = 'IndexDB',
}

export class ModLoader {
    logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public modLoadControllerCallback: ModLoadControllerCallback,
        public thisWin: Window,
    ) {
        this.logger = this.gSC2DataManager.getModUtils().getLogger();
    }

    modReadCache: Map<string, ModInfo> = new Map<string, ModInfo>();
    modCache: Map<string, ModInfo> = new Map<string, ModInfo>();

    getMod(modName: string) {
        return this.modCache.get(modName);
    }

    getModRead(modName: string) {
        return this.modReadCache.get(modName);
    }

    private addMod(m: ModInfo) {
        const overwrite = this.modReadCache.get(m.name);
        if (overwrite) {
            console.error('ModLoader addMod() has duplicate name: ', [m.name], ' will be overwrite');
        }
        this.modReadCache.set(m.name, m);
        return !overwrite;
    }

    modReadOrder: string[] = [];
    modOrder: string[] = [];

    checkModConflict2Root(modName: string) {
        const mod = this.getMod(modName);
        if (!mod) {
            console.error('ModLoader checkModConflictOne() (!mod)');
            return undefined;
        }
        return simulateMergeSC2DataInfoCache(this.gSC2DataManager.getSC2DataInfoAfterPatch(), mod.cache)[0];
    }

    checkModConflictList() {
        const ml = this.modOrder.map(T => this.modCache.get(T))
            .filter((T): T is ModInfo => !!T)
            .map(T => T.cache);
        return simulateMergeSC2DataInfoCache(this.gSC2DataManager.getSC2DataInfoAfterPatch(), ...ml).map((T, index) => {
            return {
                mod: ml[index],
                result: T,
            };
        });
    }

    // getModImgFileReplaceList() {
    //     // orgin path, replace
    //     const imgFileReplace = new Map<string, string>();
    //     for (const modName of this.modOrder) {
    //         const mod = this.getMod(modName);
    //         if (!mod) {
    //             console.error('ModLoader getModImgFileReplaceList() (!mod)');
    //             continue;
    //         }
    //         for (const [orgin, replace] of mod.bootJson.imgFileReplaceList) {
    //             if (imgFileReplace.has(orgin)) {
    //                 console.warn('ModLoader getModImgFileReplaceList() has duplicate orgin:',
    //                     [orgin],
    //                     ' on mod ',
    //                     [modName],
    //                     ' will be overwrite',
    //                 );
    //             }
    //             imgFileReplace.set(orgin, replace);
    //         }
    //     }
    //     return imgFileReplace;
    // }

    private modIndexDBLoader?: IndexDBLoader;
    private modLocalStorageLoader?: LocalStorageLoader;
    private modLocalLoader?: LocalLoader;
    private modRemoteLoader?: RemoteLoader;

    getModZip(modName: string) {
        const order = cloneDeep(this.loadOrder).reverse();
        for (const loadType of order) {
            switch (loadType) {
                case ModDataLoadType.Remote:
                    if (this.modRemoteLoader) {
                        const mod = this.modRemoteLoader.getZipFile(modName);
                        if (mod) {
                            return mod;
                        }
                    }
                    break;
                case ModDataLoadType.Local:
                    if (this.modLocalLoader) {
                        const mod = this.modLocalLoader.getZipFile(modName);
                        if (mod) {
                            return mod;
                        }
                    }
                    break;
                case ModDataLoadType.LocalStorage:
                    if (this.modLocalStorageLoader) {
                        const mod = this.modLocalStorageLoader.getZipFile(modName);
                        if (mod) {
                            return mod;
                        }
                    }
                    break;
                case ModDataLoadType.IndexDB:
                    if (this.modIndexDBLoader) {
                        const mod = this.modIndexDBLoader.getZipFile(modName);
                        if (mod) {
                            return mod;
                        }
                    }
                    break;
            }
        }
        return undefined;
    }

    public getIndexDBLoader() {
        return this.modIndexDBLoader;
    }

    public getLocalStorageLoader() {
        return this.modLocalStorageLoader;
    }

    public getLocalLoader() {
        return this.modLocalLoader;
    }

    public getRemoteLoader() {
        return this.modRemoteLoader;
    }

    loadOrder: ModDataLoadType[] = [];

    public async loadMod(loadOrder: ModDataLoadType[]): Promise<boolean> {
        this.loadOrder = loadOrder
        let ok = false;
        this.modReadOrder = [];
        const addModeZip = (T: ModZipReader) => {
            if (T.modInfo) {
                const overwrite = !this.addMod(T.modInfo);
                if (overwrite) {
                    this.modReadOrder = this.modReadOrder.filter(T1 => T1 !== T.modInfo!.name);
                }
                this.gSC2DataManager.getDependenceChecker().checkFor(T.modInfo);
                this.modReadOrder.push(T.modInfo.name);
            }
        };
        for (const loadType of this.loadOrder) {
            switch (loadType) {
                case ModDataLoadType.Remote:
                    if (!this.modRemoteLoader) {
                        this.modRemoteLoader = new RemoteLoader(this.modLoadControllerCallback);
                    }
                    try {
                        ok = await this.modRemoteLoader.load() || ok;
                        this.modRemoteLoader.modList.forEach(T => addModeZip(T));
                    } catch (e) {
                        console.error(e);
                    }
                    break;
                case ModDataLoadType.Local:
                    if (!this.modLocalLoader) {
                        this.modLocalLoader = new LocalLoader(this.modLoadControllerCallback, this.thisWin);
                    }
                    try {
                        ok = await this.modLocalLoader.load() || ok;
                        this.modLocalLoader.modList.forEach(T => addModeZip(T));
                    } catch (e) {
                        console.error(e);
                    }
                    break;
                case ModDataLoadType.LocalStorage:
                    if (!this.modLocalStorageLoader) {
                        this.modLocalStorageLoader = new LocalStorageLoader(this.modLoadControllerCallback);
                    }
                    try {
                        ok = await this.modLocalStorageLoader.load() || ok;
                        this.modLocalStorageLoader.modList.forEach(T => addModeZip(T));
                    } catch (e) {
                        console.error(e);
                    }
                    break;
                case ModDataLoadType.IndexDB:
                    if (!this.modIndexDBLoader) {
                        this.modIndexDBLoader = new IndexDBLoader(this.modLoadControllerCallback);
                    }
                    try {
                        ok = await this.modIndexDBLoader.load() || ok;
                        this.modIndexDBLoader.modList.forEach(T => addModeZip(T));
                    } catch (e) {
                        console.error(e);
                    }
                    break;
                default:
                    console.error('ModLoader loadTranslateData() unknown loadType:', [loadType]);
            }
        }
        await this.initModInjectEarlyLoadInDomScript();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterInjectEarlyLoad');
        await this.triggerAfterModLoad();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterModLoad');
        await this.initModEarlyLoadScript();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterEarlyLoad');
        await this.registerMod2Addon();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterRegisterMod2Addon');
        return Promise.resolve(ok);
    }

    private async registerMod2Addon() {
        for (const modName of this.modOrder) {
            const mod = this.getMod(modName);
            if (!mod) {
                // never go there
                console.error('ModLoader ====== initModInjectEarlyLoadScript() (!mod)');
                continue;
            }
            const zip = this.getModZip(modName);
            if (!zip) {
                // never go there
                console.error('ModLoader ====== initModInjectEarlyLoadScript() (!zip)');
                continue;
            }
            for (const modZipReader of zip) {
                await this.gSC2DataManager.getAddonPluginManager().registerMod2Addon(mod, modZipReader);
            }
        }
    }

    protected async triggerAfterModLoad() {
        for (const modName of this.modOrder) {
            const modInfo = this.getModRead(modName);
            const zips = this.getModZip(modName);
            if (!modInfo || !zips) {
                // never go there
                console.error(`ModLoader ====== triggerAfterModLoad() (!m || !zips) mod not find: [${modName}]. never go there.`);
                continue;
            }
            const bootJson = modInfo.bootJson;
            const zip = zips[0];
            await this.modLoadControllerCallback.afterModLoad(bootJson, zip.zip, modInfo);
        }
    }

    protected async filterModCanLoad(modeList: string[]) {
        const canLoadList: string[] = [];
        for (const modName of modeList) {
            const m = this.getModRead(modName);
            const zips = this.getModZip(modName);
            if (!m || !zips) {
                // never go there
                console.error(`ModLoader ====== initModInjectEarlyLoadScript() (!m || !zips) mod not find: [${modName}]. never go there.`);
                continue;
            }
            const bootJ = m.bootJson;
            const zip = zips[0];
            if (!await this.modLoadControllerCallback.canLoadThisMod(bootJ, zip.zip)) {
                console.warn(`ModLoader ====== ModZipReader init() Mod [${m.name}] be banned.`);
                this.logger.warn(`ModLoader ====== ModZipReader init() Mod [${m.name}] be banned.`);
            } else {
                canLoadList.push(modName);
            }
        }
        return canLoadList;
    }

    private async initModInjectEarlyLoadInDomScript() {
        this.modOrder = [];
        this.modCache.clear();
        let toLoadModeList = cloneDeep(this.modReadOrder);
        while (toLoadModeList.length > 0) {
            const nowMod = toLoadModeList.shift();
            if (!nowMod) {
                // never go there
                console.error('ModLoader ====== initModInjectEarlyLoadInDomScript() (!nowMod). never go there.');
                continue;
            }
            const mod = this.getModRead(nowMod);
            if (!mod) {
                // never go there
                console.error('ModLoader ====== initModInjectEarlyLoadScript() (!mod)');
                continue;
            }
            const modName = mod.name;
            this.modOrder.push(modName);
            this.modCache.set(modName, mod);
            for (const [name, content] of mod.scriptFileList_inject_early) {
                console.log('ModLoader ====== initModInjectEarlyLoadScript() inject start: ', [modName], [name]);
                await this.gSC2DataManager.getModLoadController().InjectEarlyLoad_start(modName, name);
                const script = this.thisWin.document.createElement('script');
                script.innerHTML = content;
                script.setAttribute('scriptName', (name));
                script.setAttribute('modName', (modName));
                script.setAttribute('stage', ('InjectEarlyLoad'));
                if (this.gSC2DataManager) {
                    // insert before SC2 data rootNode
                    this.gSC2DataManager?.rootNode.before(script);
                } else {
                    // or insert to head
                    console.warn('ModLoader ====== initModInjectEarlyLoadScript() gSC2DataManager is undefined, insert to head');
                    this.thisWin.document.head.appendChild(script);
                }
                console.log('ModLoader ====== initModInjectEarlyLoadScript() inject end: ', [modName], [name]);
                await this.gSC2DataManager.getModLoadController().InjectEarlyLoad_end(modName, name);
            }
            // check ban
            toLoadModeList = await this.filterModCanLoad(toLoadModeList);
        }
    }

    private async initModEarlyLoadScript() {
        for (const modName of this.modOrder) {
            const mod = this.getMod(modName);
            if (!mod) {
                console.error('ModLoader ====== initModEarlyLoadScript() (!mod)');
                continue;
            }
            for (const [name, content] of mod.scriptFileList_earlyload) {
                console.log('ModLoader ====== initModEarlyLoadScript() excute start: ', [modName], [name]);
                await this.gSC2DataManager.getModLoadController().EarlyLoad_start(modName, name);
                try {
                    // const R = await Function(`return ${content}`)();
                    const R = await JsPreloader.JsRunner(
                        content,
                        name,
                        modName,
                        'EarlyLoadScript',
                        this.gSC2DataManager,
                        this.thisWin,
                    );
                    console.log('ModLoader ====== initModEarlyLoadScript() excute result: ', [modName], [name], R);
                } catch (e) {
                    console.error('ModLoader ====== initModEarlyLoadScript() excute error: ', [modName], [name], e);
                }
                console.log('ModLoader ====== initModEarlyLoadScript() excute end: ', [modName], [name]);
                await this.gSC2DataManager.getModLoadController().EarlyLoad_end(modName, name);
                this.logger.log(`ModLoader ========= version: [${this.gSC2DataManager.getModUtils().version}]`);
            }
        }
    }
}
