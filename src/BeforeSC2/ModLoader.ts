import {
    every,
    get,
    has,
    isArray,
    isObject,
    isPlainObject,
    isString,
    cloneDeep,
    uniq,
    uniqBy,
    orderBy,
    isEqualWith,
} from 'lodash';
import {SC2DataInfo} from "./SC2DataInfoCache";
import {simulateMergeSC2DataInfoCache} from "./SimulateMerge";
import {
    imgWrapBase64Url,
    IndexDBLoader, LazyLoader,
    LocalLoader,
    LocalStorageLoader,
    ModZipReader,
    RemoteLoader
} from "./ModZipReader";
import {SC2DataManager} from "./SC2DataManager";
import {JsPreloader} from 'JsPreloader';
import {LogWrapper, ModLoadControllerCallback} from "./ModLoadController";
import {ReplacePatcher} from "./ReplacePatcher";
import {ModLoadFromSourceType, ModOrderContainer} from "./ModOrderContainer";
import {LRUCache} from 'lru-cache';
import JSZip from 'jszip';

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
    // origin path, replace path
    imgFileReplaceList: [string, string][];
    // file name, file content
    scriptFileList_preload: [string, string][];
    // file name, file content
    scriptFileList_earlyload: [string, string][];
    // file name, file content
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

// `modReadOrder`/`modReadCache` the read mod from zip file
// `modOrder`/`modCache` the mod filter by the `filterModCanLoad`
// `modLazyOrder`/`modLazyCache` the mod that Lazy load by a mod programming
// `modLazyWaiting` the mod that Lazy load by a mod programming but not load yet
export class ModLoader {
    logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public modLoadControllerCallback: ModLoadControllerCallback,
        public thisWin: Window,
    ) {
        this.logger = this.gSC2DataManager.getModUtils().getLogger();
    }

    private modReadCache: ModOrderContainer = new ModOrderContainer();
    private modCache: ModOrderContainer = new ModOrderContainer();
    private modLazyCache: Map<string, ModInfo> = new Map<string, ModInfo>();

    // getMod(modName: string) {
    //     return this.modCache.getByNameOne(modName);
    // }

    // getModCache() {
    //     return this.modCache;
    // }

    /**
     * O(2n)
     */
    getModCacheOneArray() {
        return this.modCache.get_One_Array();
    }

    /**
     O(n)
     */
    getModCacheArray() {
        return this.modCache.get_Array();
    }

    /**
     O(1)
     */
    getModCacheMap() {
        return this.modCache.get_One_Map();
    }

    checkModCacheData() {
        return this.modCache.checkData();
    }

    checkModCacheUniq() {
        return this.modCache.checkNameUniq();
    }

    getModCacheByNameOne(modName: string) {
        return this.modCache.getByNameOne(modName);
    }

    getModReadCache() {
        return this.modReadCache;
    }

    // private addMod(m: ModZipReader, from: ModLoadFromSourceType) {
    //     const overwrite = this.modReadCache.getHasByName(m.modInfo!.name);
    //     if (overwrite) {
    //         console.error('ModLoader addMod() has duplicate name: ', [m.modInfo!.name], ' will be overwrite');
    //         this.logger.error(`ModLoader addMod() has duplicate name: [${m.modInfo!.name}] will be overwrite`);
    //     }
    //     this.modReadCache.insertReplace(m, from);
    //     this.modReadCache.checkNameUniq();
    //     return !overwrite;
    // }

    private modLazyOderRecord: string[] = [];
    private modLazyWaiting: string[] = [];

    // checkModConflict2Root(modName: string) {
    //     const mod = this.getModCacheByNameOne(modName);
    //     if (!mod) {
    //         console.error('ModLoader checkModConflictOne() (!mod)');
    //         this.logger.error(`ModLoader checkModConflictOne() (!mod)`);
    //         return undefined;
    //     }
    //     return simulateMergeSC2DataInfoCache(this.gSC2DataManager.getSC2DataInfoAfterPatch(), mod.mod.cache)[0];
    // }

    checkModConflictList() {
        const ml = this.modCache.order.map(T => T.mod)
            .filter((T): T is ModInfo => !!T)
            .map(T => T.cache);
        return simulateMergeSC2DataInfoCache(this.gSC2DataManager.getSC2DataInfoAfterPatch(), ...ml).map((T, index) => {
            return {
                mod: ml[index],
                result: T,
            };
        });
    }

    private modIndexDBLoader?: IndexDBLoader;
    private modLocalStorageLoader?: LocalStorageLoader;
    private modLocalLoader?: LocalLoader;
    private modRemoteLoader?: RemoteLoader;
    private modLazyLoader?: LazyLoader;

    getModZip(modName: string) {
        const order = cloneDeep(this.loadOrder).reverse();
        const nn = this.modCache.getByName(modName);
        if (!nn) {
            return undefined;
        }
        const kk = order.find(T => nn?.has(T));
        if (!kk) {
            return undefined;
        }
        return nn.get(kk)!.zip;
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

    private addModeReadZip(T: ModZipReader, from: ModLoadFromSourceType) {
        if (T.modInfo) {
            const overwrite = !this.modReadCache.getHasByName(T.modInfo.name);
            if (overwrite) {
                this.modReadCache.deleteAll(T.modInfo.name);
            }
            // // this is invalid
            // this.gSC2DataManager.getDependenceChecker().checkFor(T.modInfo);
            this.modReadCache.pushBack(T, from);
            this.modReadCache.checkNameUniq();
        }
    }

    public async loadMod(loadOrder: ModDataLoadType[]): Promise<boolean> {
        this.loadOrder = loadOrder;
        let ok = false;
        for (const loadType of this.loadOrder) {
            switch (loadType) {
                case ModDataLoadType.Remote:
                    if (!this.modRemoteLoader) {
                        this.modRemoteLoader = new RemoteLoader(this.modLoadControllerCallback);
                    }
                    try {
                        ok = await this.modRemoteLoader.load() || ok;
                        this.modRemoteLoader.modList.forEach(T => this.addModeReadZip(T, loadType));
                    } catch (e: Error | any) {
                        console.error(e);
                        this.logger.error(`ModLoader loadMod() RemoteLoader load error: ${e?.message ? e.message : e}`);
                    }
                    break;
                case ModDataLoadType.Local:
                    if (!this.modLocalLoader) {
                        this.modLocalLoader = new LocalLoader(this.modLoadControllerCallback, this.thisWin);
                    }
                    try {
                        ok = await this.modLocalLoader.load() || ok;
                        this.modLocalLoader.modList.forEach(T => this.addModeReadZip(T, loadType));
                    } catch (e: Error | any) {
                        console.error(e);
                        this.logger.error(`ModLoader loadMod() LocalLoader load error: ${e?.message ? e.message : e}`);
                    }
                    break;
                case ModDataLoadType.LocalStorage:
                    if (!this.modLocalStorageLoader) {
                        this.modLocalStorageLoader = new LocalStorageLoader(this.modLoadControllerCallback);
                    }
                    try {
                        ok = await this.modLocalStorageLoader.load() || ok;
                        this.modLocalStorageLoader.modList.forEach(T => this.addModeReadZip(T, loadType));
                    } catch (e: Error | any) {
                        console.error(e);
                        this.logger.error(`ModLoader loadMod() LocalStorageLoader load error: ${e?.message ? e.message : e}`);
                    }
                    break;
                case ModDataLoadType.IndexDB:
                    if (!this.modIndexDBLoader) {
                        this.modIndexDBLoader = new IndexDBLoader(this.modLoadControllerCallback);
                    }
                    try {
                        ok = await this.modIndexDBLoader.load() || ok;
                        this.modIndexDBLoader.modList.forEach(T => this.addModeReadZip(T, loadType));
                    } catch (e: Error | any) {
                        console.error(e);
                        this.logger.error(`ModLoader loadMod() IndexDBLoader load error: ${e?.message ? e.message : e}`);
                    }
                    break;
                default:
                    console.error('ModLoader loadTranslateData() unknown loadType:', [loadType]);
                    this.logger.error(`ModLoader loadTranslateData() unknown loadType: [${loadType}]`);
            }
        }
        await this.initModInjectEarlyLoadInDomScript();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterInjectEarlyLoad');
        await this.triggerAfterModLoad();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterModLoad');
        if (!this.modCache.checkData()) {
            console.error('ModLoader loadMod() modCache.checkData() failed. Data consistency check failed.');
            this.logger.error(`ModLoader loadMod() modCache.checkData() failed. Data consistency check failed.`);
        }
        if (!this.modCache.checkNameUniq()) {
            console.error('ModLoader loadMod() modCache.checkNameUniq() failed. Data consistency check failed.');
            this.logger.error(`ModLoader loadMod() modCache.checkNameUniq() failed. Data consistency check failed.`);
        }
        await this.initModEarlyLoadScript();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterEarlyLoad');
        await this.registerMod2Addon();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterRegisterMod2Addon');
        return Promise.resolve(ok);
    }

    private async registerMod2Addon() {
        for (const mod of this.modCache.get_Array()) {
            const modZipReader = mod.zip;
            await this.gSC2DataManager.getAddonPluginManager().registerMod2Addon(mod.mod, modZipReader);
        }
    }

    protected async triggerAfterModLoad() {
        for (const mod of this.modCache.get_Array()) {
            const modInfo = mod.mod;
            const modZipReader = mod.zip;
            const bootJson = modInfo.bootJson;
            await this.modLoadControllerCallback.afterModLoad(bootJson, modZipReader.zip, modInfo);
        }
    }

    // call the `canLoadThisMod` to filter mod.
    protected async filterModCanLoad(modeList: string[]) {
        const canLoadList: string[] = [];
        for (const modName of modeList) {
            const m = this.getModReadCache().getByNameOne(modName);
            if (!m) {
                // never go there
                console.error(`ModLoader ====== initModInjectEarlyLoadScript() (!m) mod not find. never go there.`, [modName, modeList, canLoadList, m]);
                this.logger.error(`ModLoader ====== initModInjectEarlyLoadScript() (!m) mod not find: [${modName}]. never go there.`);
                continue;
            }
            const bootJ = m.mod.bootJson;
            const zip = m.zip;
            if (!await this.modLoadControllerCallback.canLoadThisMod(bootJ, zip.zip)) {
                console.warn(`ModLoader ====== ModZipReader init() Mod [${m.name}] be banned.`);
                this.logger.warn(`ModLoader ====== ModZipReader init() Mod [${m.name}] be banned.`);
            } else {
                canLoadList.push(modName);
            }
        }
        return canLoadList;
    }

    public async lazyRegisterNewMod(modeZip: JSZip) {
        if (!this.modLazyLoader) {
            this.modLazyLoader = new LazyLoader(this.modLoadControllerCallback);
        }
        try {
            const m = await this.modLazyLoader.add(modeZip);
            if (m.modInfo) {
                this.modLazyCache.set(m.modInfo.name, m.modInfo);
                this.modLazyWaiting.push(m.modInfo.name);
                return true;
            } else {
                console.error('ModLoader loadMod() LazyLoader load error: modInfo not found', [m]);
                this.logger.error(`ModLoader loadMod() LazyLoader load error: modInfo not found`);
            }
        } catch (e: Error | any) {
            console.error(e);
            this.logger.error(`ModLoader loadMod() LazyLoader load error: ${e?.message ? e.message : e}`);
        }
        return false;
    }

    private async do_initModInjectEarlyLoadInDomScript(modName: string, mod: ModInfo) {
        for (const [name, content] of mod.scriptFileList_inject_early) {
            console.log('ModLoader ====== do_initModInjectEarlyLoadInDomScript() inject start: ', [modName], [name]);
            this.logger.log(`ModLoader ====== do_initModInjectEarlyLoadInDomScript() inject start: [${modName}] [${name}]`);
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
                console.warn('ModLoader ====== do_initModInjectEarlyLoadInDomScript() gSC2DataManager is undefined, insert to head');
                this.logger.warn(`ModLoader ====== do_initModInjectEarlyLoadInDomScript() gSC2DataManager is undefined, insert to head`);
                this.thisWin.document.head.appendChild(script);
            }
            console.log('ModLoader ====== do_initModInjectEarlyLoadInDomScript() inject end: ', [modName], [name]);
            this.logger.log(`ModLoader ====== do_initModInjectEarlyLoadInDomScript() inject end: [${modName}] [${name}]`);
            await this.gSC2DataManager.getModLoadController().InjectEarlyLoad_end(modName, name);
        }
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
                this.logger.error(`ModLoader ====== initModInjectEarlyLoadInDomScript() (!nowMod). never go there.`);
                continue;
            }
            const mod = this.getModRead(nowMod);
            if (!mod) {
                // never go there
                console.error('ModLoader ====== initModInjectEarlyLoadScript() (!mod)');
                this.logger.error(`ModLoader ====== initModInjectEarlyLoadScript() (!mod)`);
                continue;
            }
            const modName = mod.name;
            this.modOrder.push(modName);
            this.modCache.set(modName, mod);
            await this.do_initModInjectEarlyLoadInDomScript(modName, mod);
            // check ban
            // the `canLoadThisMod` will be call in `filterModCanLoad`
            // a mod only can ban the mods that load after it.
            // any mod loaded cannot be banned, because it's `InjectEarlyLoad` already be injected and run.
            toLoadModeList = await this.filterModCanLoad(toLoadModeList);
        }
    }

    private async do_initModEarlyLoadScript(modName: string, mod: ModInfo) {
        for (const [name, content] of mod.scriptFileList_earlyload) {
            console.log('ModLoader ====== initModEarlyLoadScript() excute start: ', [modName], [name]);
            this.logger.log(`ModLoader ====== initModEarlyLoadScript() excute start: [${modName}] [${name}]`);
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
                    this.logger,
                );
                console.log('ModLoader ====== initModEarlyLoadScript() excute result: ', [modName], [name], R);
                this.logger.log(`ModLoader ====== initModEarlyLoadScript() excute result: [${modName}] [${name}] [${R}]`);
            } catch (e) {
                console.error('ModLoader ====== initModEarlyLoadScript() excute error: ', [modName], [name], e);
                this.logger.error(`ModLoader ====== initModEarlyLoadScript() excute error: [${modName}] [${name}] [${e}]`);
            }
            console.log('ModLoader ====== initModEarlyLoadScript() excute end: ', [modName], [name]);
            this.logger.log(`ModLoader ====== initModEarlyLoadScript() excute end: [${modName}] [${name}]`);
            await this.gSC2DataManager.getModLoadController().EarlyLoad_end(modName, name);
            this.logger.log(`ModLoader ========= version: [${this.gSC2DataManager.getModUtils().version}]`);
        }
    }

    private async initModEarlyLoadScript() {
        let toLoadModList = cloneDeep(this.modOrder);
        for (const modName of this.modOrder) {
            const mod = this.getMod(modName);
            if (!mod) {
                console.error('ModLoader ====== initModEarlyLoadScript() (!mod)');
                this.logger.error(`ModLoader ====== initModEarlyLoadScript() (!mod)`);
                continue;
            }
            await this.do_initModEarlyLoadScript(modName, mod);
            // to load lazy mod if this mod inject lazy mod
            // `tryInitWaitingLazyLoadMod` will change `modOrder` , so we receive the new list from it
            toLoadModList = await this.tryInitWaitingLazyLoadMod(modName, toLoadModList);
        }
    }

    private async tryInitWaitingLazyLoadMod(byModName: string, toLoadModList: string[]) {
        if (this.modLazyWaiting.length > 0) {
            await this.gSC2DataManager.getModLoadController().LazyLoad_start(byModName);
            let canOverwriteMod = new Set([byModName].concat(cloneDeep(this.modLazyWaiting)));
            // filter ban
            this.modLazyWaiting = await this.filterModCanLoad(this.modLazyWaiting);

            if (uniq(this.modOrder).length !== this.modOrder.length) {
                // never go there
                console.error('ModLoader ====== tryInitWaitingLazyLoadMod() pre check duplicate mod in modOrder. never go there.', [byModName, this.modOrder]);
                this.logger.error(`ModLoader ====== tryInitWaitingLazyLoadMod() pre check duplicate mod in modOrder. never go there.`);
            }

            // split by NowMod
            // the lazy mod and it overwrote mod will insert after the NowMod
            const nowModPos = this.modOrder.indexOf(byModName);
            const loadedMod = this.modOrder.slice(0, nowModPos);
            const pendingMod = this.modOrder.slice(nowModPos + 1);

            let nowLoadingMod: string[] = [byModName];

            // mod can call add lazy mod on this loop,
            // so we must process the case that overwrite itself.
            // the `canOverwriteMod` is the mod that can overwrite,
            // because in some case , user can load same name mod again and again to do some magic to hidden info.
            while (this.modLazyWaiting.length > 0) {
                // remember the loading mod info, then pop-front it
                const modName = this.modLazyWaiting.shift()!;
                this.modLazyOderRecord.push(modName);
                const mod = this.modLazyCache.get(modName);
                if (!mod) {
                    // never go there
                    console.error('ModLoader ====== tryInitWaitingLazyLoadMod() (!mod)');
                    this.logger.error(`ModLoader ====== tryInitWaitingLazyLoadMod() (!mod)`);
                    continue;
                }
                // warning overwrite, but user can in-place overwrite self
                if (this.modOrder.indexOf(modName) >= 0) {
                    if (canOverwriteMod.has(modName)) {
                        console.log('ModLoader ====== tryInitWaitingLazyLoadMod() mod already loaded:', [byModName, modName, this.modOrder]);
                        this.logger.log(`ModLoader ====== tryInitWaitingLazyLoadMod() mod already loaded: [${modName}]. when LazyLoad by [${byModName}] . ` +
                            ' be carefully, this will case unexpected behavior .');
                    } else {
                        console.warn('ModLoader ====== tryInitWaitingLazyLoadMod() mod already loaded:', [byModName, modName, this.modOrder]);
                        this.logger.warn(`ModLoader ====== tryInitWaitingLazyLoadMod() mod already loaded: [${modName}]. when LazyLoad by [${byModName}] . ` +
                            'are you sure you want overwrite the mod that was loaded ? this will case unexpected behavior !!!');
                    }
                }
                if (this.modCache.has(modName)) {
                    if (canOverwriteMod.has(modName)) {
                        console.log('ModLoader ====== tryInitWaitingLazyLoadMod() mod already loaded:', [byModName, modName, this.modCache]);
                        this.logger.log(`ModLoader ====== tryInitWaitingLazyLoadMod() mod already loaded: [${modName}]. when LazyLoad by [${byModName}] . ` +
                            ' be carefully, this will case unexpected behavior .');
                    } else {
                        console.warn('ModLoader ====== tryInitWaitingLazyLoadMod() mod already loaded:', [byModName, modName, this.modCache]);
                        this.logger.warn(`ModLoader ====== tryInitWaitingLazyLoadMod() mod already loaded: [${modName}]. when LazyLoad by [${byModName}] . ` +
                            'are you sure you want overwrite the mod that was loaded ? this will case unexpected behavior !!!');
                    }
                }

                this.gSC2DataManager.getDependenceChecker().checkFor(mod);

                // overwrite loaded mod
                // user can overwrite loaded mod, but this is unusual case
                if (loadedMod.indexOf(modName) >= 0) {
                    console.warn('ModLoader ====== tryInitWaitingLazyLoadMod() overwrite loaded mod:', [byModName, modName, loadedMod, pendingMod, nowLoadingMod]);
                    this.logger.warn(`ModLoader ====== tryInitWaitingLazyLoadMod() overwrite loaded mod: [${modName}]. when LazyLoad by [${byModName}] . ` +
                        'are you sure you want overwrite a mod that was loaded ? ' +
                        'this is unusual case , will cause js conflict and memory incorrect , and will case unexpected behavior !!!');
                    loadedMod.splice(loadedMod.indexOf(modName), 1);
                }
                // replace pending mod
                // means, the later mod we will overwrite and load early
                if (pendingMod.indexOf(modName) >= 0) {
                    console.warn('ModLoader ====== tryInitWaitingLazyLoadMod() overwrite later mod:', [byModName, modName, loadedMod, pendingMod, nowLoadingMod]);
                    this.logger.warn(`ModLoader ====== tryInitWaitingLazyLoadMod() overwrite later mod: [${modName}]. when LazyLoad by [${byModName}] . ` +
                        'are you sure you want overwrite and early load the mod that need later load ? ' +
                        'this is unusual case , will broken mod order system , and will case unexpected behavior !!!');
                    pendingMod.splice(pendingMod.indexOf(modName), 1);
                }
                // loop overwrite lazy mod in this loop
                // user can overwrite self in this loop multi time
                if (nowLoadingMod.indexOf(modName) >= 0) {
                    console.log('ModLoader ====== tryInitWaitingLazyLoadMod() overwrite loaded lazy mod:', [byModName, modName, loadedMod, pendingMod, nowLoadingMod]);
                    this.logger.log(`ModLoader ====== tryInitWaitingLazyLoadMod() overwrite loaded lazy mod: [${modName}]. when LazyLoad by [${byModName}] . ` +
                        'are you sure you want overwrite a mod that was loaded in lazy load ? ' +
                        'carefully use this feature, otherwise will case unexpected behavior !!!');
                    nowLoadingMod.splice(nowLoadingMod.indexOf(modName), 1);
                }
                nowLoadingMod.push(modName);

                this.modCache.set(modName, mod);

                await this.do_initModInjectEarlyLoadInDomScript(modName, mod);
                await this.do_initModEarlyLoadScript(modName, mod);
                // next
                // user add lazy mod in this loop will be added into the end of `modLazyWaiting`
                // and maybe add duplicate mod, there maybe case duplicate load, so we must filter it.
                // in this special case, the duplicate mod will be overwritten by the last one, but will early load in the first one order.
                this.modLazyWaiting = await this.filterModCanLoad(uniq(this.modLazyWaiting));
                this.modLazyWaiting.forEach(T => canOverwriteMod.add(T));
            }

            // rebuild `modOrder`
            this.modOrder = loadedMod.concat(nowLoadingMod).concat(pendingMod);

            if (uniq(this.modOrder).length !== this.modOrder.length) {
                // never go there
                console.error('ModLoader ====== tryInitWaitingLazyLoadMod() post check duplicate mod in modOrder. never go there.', [byModName, this.modOrder]);
                this.logger.error(`ModLoader ====== tryInitWaitingLazyLoadMod() post check duplicate mod in modOrder. never go there.`);
            }

            await this.gSC2DataManager.getModLoadController().LazyLoad_end(byModName);

            return pendingMod;
        }
        return toLoadModList;
    }

}
