import JSZip from 'jszip';
import {every, get, isArray, isString} from 'lodash';
import {SC2DataInfo} from "./SC2DataInfoCache";
import {simulateMergeSC2DataInfoCache} from "./SimulateMerge";
import {LocalLoader, RemoteLoader} from "./ModZipReader";

export interface ModImg {
    // base64
    data: string;
    path: string;
}

export interface ModBootJson {
    name: string;
    version: string;
    styleFileList: string[];
    scriptFileList: string[];
    scriptFileList_perload: string[];
    scriptFileList_earlyload: string[];
    tweeFileList: string[];
    imgFileList: string[];
    // orgin path, replace path
    imgFileReplaceList: [string, string][];
}

export interface ModInfo {
    name: string;
    version: string;
    cache: SC2DataInfo;
    imgs: ModImg[];
    // orgin path, replace path
    imgFileReplaceList: [string, string][];
    // file name, file contect
    scriptFileList_perload: [string, string][];
    // file name, file contect
    scriptFileList_earlyload: [string, string][];
    bootJson: ModBootJson;
}

export enum ModDataLoadType {
    'Remote' = 'Remote',
    'Local' = 'Local',
}

export class ModLoader {

    constructor(
        public orginSC2DataInfoCache: SC2DataInfo,
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
        return simulateMergeSC2DataInfoCache(this.orginSC2DataInfoCache, mod.cache)[0];
    }

    checkModConfictList() {
        const ml = this.modOrder.map(T => this.modCache.get(T))
            .filter((T): T is ModInfo => !!T)
            .map(T => T.cache);
        return simulateMergeSC2DataInfoCache(this.orginSC2DataInfoCache, ...ml).map((T, index) => {
            return {
                mod: ml[index],
                result: T,
            };
        });
    }

    getModImgFileReplaceList() {
        // orgin path, replace
        const imgFileReplace = new Map<string, string>();
        for (const modName of this.modOrder) {
            const mod = this.getMod(modName);
            if (!mod) {
                console.error('ModLoader getModImgFileReplaceList() (!mod)');
                continue;
            }
            for (const [orgin, replace] of mod.bootJson.imgFileReplaceList) {
                if (imgFileReplace.has(orgin)) {
                    console.warn('ModLoader getModImgFileReplaceList() has duplicate orgin:',
                        [orgin],
                        ' on mod ',
                        [modName],
                        ' will be overwrite',
                    );
                }
                imgFileReplace.set(orgin, replace);
            }
        }
        return imgFileReplace;
    }

    modLocalLoader?: LocalLoader;
    modRemoteLoader?: RemoteLoader;

    public async loadMod(loadOrder: ModDataLoadType[]): Promise<boolean> {
        let ok = false;
        for (const loadType of loadOrder) {
            switch (loadType) {
                case ModDataLoadType.Remote:
                    if (!this.modRemoteLoader) {
                        this.modRemoteLoader = new RemoteLoader();
                    }
                    try {
                        ok = await this.modRemoteLoader.loadTranslateDataFromRemote() || ok;
                        this.modRemoteLoader.modList.forEach(T => {
                            if (T.modInfo) {
                                const overwrite = !this.addMod(T.modInfo);
                                if (overwrite) {
                                    this.modOrder = this.modOrder.filter(T => T !== T);
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
                        this.modLocalLoader = new LocalLoader();
                    }
                    try {
                        ok = await this.modLocalLoader.loadModDataFromValueZip() || ok;
                        this.modLocalLoader.modList.forEach(T => {
                            if (T.modInfo) {
                                const overwrite = !this.addMod(T.modInfo);
                                if (overwrite) {
                                    this.modOrder = this.modOrder.filter(T => T !== T);
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
        await this.initModEarlyLoadScript();
        return Promise.resolve(ok);
    }

    private async initModEarlyLoadScript() {
        for (const modName of this.modOrder) {
            const mod = this.getMod(modName);
            if (!mod) {
                console.error('ModLoader initModEarlyLoadScript() (!mod)');
                continue;
            }
            for (const [name, content] of mod.scriptFileList_earlyload) {
                console.log('ModLoader initModEarlyLoadScript() excute start: ', [name]);
                try {
                    const R = await Function(`return ${content}`)();
                    console.log('ModLoader initModEarlyLoadScript() excute result: ', [name], R);
                } catch (e) {
                    console.error('ModLoader initModEarlyLoadScript() excute error: ', [name], e);
                }
                console.log('ModLoader initModEarlyLoadScript() excute end: ', [name]);
            }
        }
    }
}
