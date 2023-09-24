import {every, get, has, isArray, isObject, isPlainObject, isString} from 'lodash';
import {SC2DataInfo} from "./SC2DataInfoCache";
import {simulateMergeSC2DataInfoCache} from "./SimulateMerge";
import {IndexDBLoader, LocalLoader, LocalStorageLoader, RemoteLoader} from "./ModZipReader";
import {SC2DataManager} from "./SC2DataManager";
import {JsPreloader} from 'JsPreloader';
import {ModLoadControllerCallback} from "./ModLoadController";
import {ReplacePatcher} from "./ReplacePatcher";

export interface ModImg {
    // base64
    data: string;
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

    constructor(
        public gSC2DataManager: SC2DataManager,
        public modLoadControllerCallback: ModLoadControllerCallback,
    ) {
    }

    modCache: Map<string, ModInfo> = new Map<string, ModInfo>();

    getMod(modName: string) {
        return this.modCache.get(modName);
    }

    addMod(m: ModInfo) {
        const overwrite = this.modCache.get(m.name);
        if (overwrite) {
            console.error('ModLoader addMod() has duplicate name: ', [m.name], ' will be overwrite');
        }
        this.modCache.set(m.name, m);
        return !overwrite;
    }

    modOrder: string[] = [];

    checkModConfict2Root(modName: string) {
        const mod = this.getMod(modName);
        if (!mod) {
            console.error('ModLoader checkModConfictOne() (!mod)');
            return undefined;
        }
        return simulateMergeSC2DataInfoCache(this.gSC2DataManager.getSC2DataInfoAfterPatch(), mod.cache)[0];
    }

    checkModConfictList() {
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

    // public getModZipLoader() {
    //     return this.modLocalLoader || this.modRemoteLoader;
    // }

    getModZip(modName: string) {
        if (this.modIndexDBLoader) {
            const mod = this.modIndexDBLoader.getZipFile(modName);
            if (mod) {
                return mod;
            }
        }
        if (this.modLocalStorageLoader) {
            const mod = this.modLocalStorageLoader.getZipFile(modName);
            if (mod) {
                return mod;
            }
        }
        if (this.modRemoteLoader) {
            const mod = this.modRemoteLoader.getZipFile(modName);
            if (mod) {
                return mod;
            }
        }
        if (this.modLocalLoader) {
            const mod = this.modLocalLoader.getZipFile(modName);
            if (mod) {
                return mod;
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

    public async loadMod(loadOrder: ModDataLoadType[]): Promise<boolean> {
        let ok = false;
        this.modOrder = [];
        for (const loadType of loadOrder) {
            switch (loadType) {
                case ModDataLoadType.Remote:
                    if (!this.modRemoteLoader) {
                        this.modRemoteLoader = new RemoteLoader(this.modLoadControllerCallback);
                    }
                    try {
                        ok = await this.modRemoteLoader.load() || ok;
                        this.modRemoteLoader.modList.forEach(T => {
                            if (T.modInfo) {
                                const overwrite = !this.addMod(T.modInfo);
                                if (overwrite) {
                                    this.modOrder = this.modOrder.filter(T1 => T1 !== T.modInfo!.name);
                                }
                                this.modOrder.push(T.modInfo.name);
                            }
                        });
                    } catch (e) {
                        console.error(e);
                    }
                    break;
                case ModDataLoadType.Local:
                    if (!this.modLocalLoader) {
                        this.modLocalLoader = new LocalLoader(this.modLoadControllerCallback);
                    }
                    try {
                        ok = await this.modLocalLoader.load() || ok;
                        this.modLocalLoader.modList.forEach(T => {
                            if (T.modInfo) {
                                const overwrite = !this.addMod(T.modInfo);
                                if (overwrite) {
                                    this.modOrder = this.modOrder.filter(T1 => T1 !== T.modInfo!.name);
                                }
                                this.modOrder.push(T.modInfo.name);
                            }
                        });
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
                        this.modLocalStorageLoader.modList.forEach(T => {
                            if (T.modInfo) {
                                const overwrite = !this.addMod(T.modInfo);
                                if (overwrite) {
                                    this.modOrder = this.modOrder.filter(T1 => T1 !== T.modInfo!.name);
                                }
                                this.modOrder.push(T.modInfo.name);
                            }
                        });
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
                        this.modIndexDBLoader.modList.forEach(T => {
                            if (T.modInfo) {
                                const overwrite = !this.addMod(T.modInfo);
                                if (overwrite) {
                                    this.modOrder = this.modOrder.filter(T1 => T1 !== T.modInfo!.name);
                                }
                                this.modOrder.push(T.modInfo.name);
                            }
                        });
                    } catch (e) {
                        console.error(e);
                    }
                    break;
                default:
                    console.error('ModLoader loadTranslateData() unknown loadType:', [loadType]);
            }
        }
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterModLoad');
        this.initModInjectEarlyLoadInDomScript();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterInjectEarlyLoad');
        await this.initModEarlyLoadScript();
        await this.gSC2DataManager.getAddonPluginManager().triggerHook('afterEarlyLoad');
        return Promise.resolve(ok);
    }

    private initModInjectEarlyLoadInDomScript() {
        for (const modName of this.modOrder) {
            const mod = this.getMod(modName);
            if (!mod) {
                console.error('ModLoader ====== initModInjectEarlyLoadScript() (!mod)');
                continue;
            }
            for (const [name, content] of mod.scriptFileList_inject_early) {
                console.log('ModLoader ====== initModInjectEarlyLoadScript() inject start: ', [modName], [name]);
                this.gSC2DataManager.getModLoadController().InjectEarlyLoad_start(modName, name);
                const script = document.createElement('script');
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
                    document.head.appendChild(script);
                }
                console.log('ModLoader ====== initModInjectEarlyLoadScript() inject end: ', [modName], [name]);
                this.gSC2DataManager.getModLoadController().InjectEarlyLoad_end(modName, name);
            }
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
                this.gSC2DataManager.getModLoadController().EarlyLoad_start(modName, name);
                try {
                    // const R = await Function(`return ${content}`)();
                    const R = await JsPreloader.JsRunner(content, name, modName, 'EarlyLoadScript', this.gSC2DataManager);
                    console.log('ModLoader ====== initModEarlyLoadScript() excute result: ', [modName], [name], R);
                } catch (e) {
                    console.error('ModLoader ====== initModEarlyLoadScript() excute error: ', [modName], [name], e);
                }
                console.log('ModLoader ====== initModEarlyLoadScript() excute end: ', [modName], [name]);
                this.gSC2DataManager.getModLoadController().EarlyLoad_end(modName, name);
            }
        }
    }
}
