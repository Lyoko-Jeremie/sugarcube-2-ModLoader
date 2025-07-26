import {ModBootJson, ModInfo} from "ModLoader";
import {SC2DataManager} from "SC2DataManager";
import JSZip from "jszip";
import {IndexDBLoader, LocalStorageLoader} from "./ModZipReader";
import moment from "moment/moment";
import {JSZipLikeReadOnlyInterface} from "./JSZipLikeReadOnlyInterface";


export interface LogWrapper {
    log: (s: string) => void;
    warn: (s: string) => void;
    error: (s: string) => void;
}

export interface LifeTimeCircleHook extends Partial<ModLoadControllerCallback> {

}

export interface ModLoadControllerCallback {
    /**
     * ban a mod use this, need register this hook in `InjectEarlyLoad`
     * @param bootJson
     * @param zip
     */
    canLoadThisMod(bootJson: ModBootJson, zip: JSZipLikeReadOnlyInterface): Promise<boolean>;

    /**
     * use this to modify a mod, like i18n a mod
     * @param bootJson
     * @param zip       carefully modify zip file
     * @param modInfo   you can modify the all info in there. read: [ModZipReader.init()]
     */
    afterModLoad(bootJson: ModBootJson, zip: JSZipLikeReadOnlyInterface, modInfo: ModInfo): Promise<any>;

    InjectEarlyLoad_start(modName: string, fileName: string): Promise<any>;

    InjectEarlyLoad_end(modName: string, fileName: string): Promise<any>;

    EarlyLoad_start(modName: string, fileName: string): Promise<any>;

    EarlyLoad_end(modName: string, fileName: string): Promise<any>;

    LazyLoad_start(modName: string): Promise<any>;

    LazyLoad_end(modName: string): Promise<any>;

    Load_start(modName: string, fileName: string): Promise<any>;

    Load_end(modName: string, fileName: string): Promise<any>;

    PatchModToGame_start(): Promise<any>;

    PatchModToGame_end(): Promise<any>

    /**
     * @deprecated
     */
    ReplacePatcher_start(modName: string, fileName: string): Promise<any>;

    /**
     * @deprecated
     */
    ReplacePatcher_end(modName: string, fileName: string): Promise<any>;

    /**
     * Latest Hook On ModLoader When ALL Load End
     */
    ModLoaderLoadEnd(): Promise<any>;

    /**
     * @useless useless for user
     */
    logError(s: string): void;

    /**
     * @useless useless for user
     */
    logInfo(s: string): void;

    /**
     * @useless useless for user
     */
    logWarning(s: string): void;

    exportDataZip(zip: JSZip): Promise<JSZip>;
}

export function getLogFromModLoadControllerCallback(c: ModLoadControllerCallback): LogWrapper {
    return {
        log: (s: string) => {
            c.logInfo(s);
        },
        warn: (s: string) => {
            c.logWarning(s);
        },
        error: (s: string) => {
            c.logError(s);
        },
    };
}

const ModLoadControllerCallback_PatchHook = [
    'PatchModToGame_start',
    'PatchModToGame_end',
] as const;
const ModLoadControllerCallback_ModLoader = [
    'ModLoaderLoadEnd',
] as const;
const ModLoadControllerCallback_ReplacePatch = [
    'ReplacePatcher_start',
    'ReplacePatcher_end',
] as const;
const ModLoadControllerCallback_Log = [
    'logInfo',
    'logWarning',
    'logError',
] as const;
const ModLoadControllerCallback_ScriptLoadHook = [
    'InjectEarlyLoad_start',
    'InjectEarlyLoad_end',
    'EarlyLoad_start',
    'EarlyLoad_end',
    'Load_start',
    'Load_end',
] as const;
const ModLoadControllerCallback_ScriptLazyLoadHook = [
    'LazyLoad_start',
    'LazyLoad_end',
] as const;

export interface LogRecord {
    type: 'info' | 'warning' | 'error';
    time: moment.Moment;
    message: string;
}

/**
 * ModLoader lifetime circle system,
 * mod can register hook to this system, to listen to the lifetime circle of MpdLoader and error log.
 *
 * ModLoader 生命周期系统，
 * mod 可以注册 hook 到这个系统，来监听 ModLoader 的生命周期和错误日志。
 */
export class ModLoadController implements ModLoadControllerCallback {

    constructor(
        public gSC2DataManager: SC2DataManager
    ) {
        ModLoadControllerCallback_ScriptLoadHook.forEach((T) => {
            this[T] = async (modName: string, fileName: string) => {
                for (const [id, hook] of this.lifeTimeCircleHookTable) {
                    try {
                        if (hook[T]) {
                            await hook[T]!.apply(hook, [modName, fileName]);
                        }
                    } catch (e: any | Error) {
                        console.error('ModLoadController', [T, id, e]);
                        this.logError(`ModLoadController ${T} ${id} ${e?.message ? e.message : e}`);
                    }
                }
            };
        });
        ModLoadControllerCallback_ScriptLazyLoadHook.forEach((T) => {
            this[T] = async (modName: string) => {
                for (const [id, hook] of this.lifeTimeCircleHookTable) {
                    try {
                        if (hook[T]) {
                            await hook[T]!.apply(hook, [modName]);
                        }
                    } catch (e: any | Error) {
                        console.error('ModLoadController', [T, id, e]);
                        this.logError(`ModLoadController ${T} ${id} ${e?.message ? e.message : e}`);
                    }
                }
            };
        });
        ModLoadControllerCallback_PatchHook.forEach((T) => {
            this[T] = async () => {
                for (const [id, hook] of this.lifeTimeCircleHookTable) {
                    try {
                        if (hook[T]) {
                            await hook[T]!.apply(hook, []);
                        }
                    } catch (e: any | Error) {
                        console.error('ModLoadController', [T, id, e]);
                        this.logError(`ModLoadController ${T} ${id} ${e?.message ? e.message : e}`);
                    }
                }
            };
        });
        ModLoadControllerCallback_ModLoader.forEach((T) => {
            this[T] = async () => {
                for (const [id, hook] of this.lifeTimeCircleHookTable) {
                    try {
                        if (hook[T]) {
                            await hook[T]!.apply(hook, []);
                        }
                    } catch (e: any | Error) {
                        console.error('ModLoadController', [T, id, e]);
                        this.logError(`ModLoadController ${T} ${id} ${e?.message ? e.message : e}`);
                    }
                }
            };
        });
        ModLoadControllerCallback_ReplacePatch.forEach((T) => {
            this[T] = async (modName: string, fileName: string) => {
                for (const [id, hook] of this.lifeTimeCircleHookTable) {
                    try {
                        if (hook[T]) {
                            await hook[T]!.apply(hook, [modName, fileName]);
                        }
                    } catch (e: any | Error) {
                        console.error('ModLoadController', [T, id, e]);
                        this.logError(`ModLoadController ${T} ${id} ${e?.message ? e.message : e}`);
                    }
                }
            };
        });
        ModLoadControllerCallback_Log.forEach((T) => {
            this[T] = (s: string) => {
                let logOutput = false;
                for (const [id, hook] of this.lifeTimeCircleHookTable) {
                    try {
                        if (hook[T]) {
                            hook[T]!.apply(hook, [s]);
                            logOutput = true;
                        }
                    } catch (e: any | Error) {
                        // must never throw error
                        console.error('ModLoadController', [T, id, e]);
                    }
                }
                if (!logOutput) {
                    switch (T) {
                        case "logInfo":
                            this.logRecordBeforeAnyLogHookRegister.push({
                                type: 'info',
                                time: moment(),
                                message: s,
                            });
                            break;
                        case "logWarning":
                            this.logRecordBeforeAnyLogHookRegister.push({
                                type: 'warning',
                                time: moment(),
                                message: s,
                            });
                            break;
                        case "logError":
                            this.logRecordBeforeAnyLogHookRegister.push({
                                type: 'error',
                                time: moment(),
                                message: s,
                            });
                            break;
                    }
                }
            };
        });

        this.logInfo(`ModLoader ========= version: [${gSC2DataManager.getModUtils().version}]`);
    }

    public logRecordBeforeAnyLogHookRegister: LogRecord[] = [];

    LazyLoad_end!: (modName: string) => Promise<any>;
    LazyLoad_start!: (modName: string) => Promise<any>;
    EarlyLoad_end!: (modName: string, fileName: string) => Promise<any>;
    EarlyLoad_start!: (modName: string, fileName: string) => Promise<any>;
    InjectEarlyLoad_end!: (modName: string, fileName: string) => Promise<any>;
    InjectEarlyLoad_start!: (modName: string, fileName: string) => Promise<any>;
    Load_end!: (modName: string, fileName: string) => Promise<any>;
    Load_start!: (modName: string, fileName: string) => Promise<any>;
    PatchModToGame_end!: () => Promise<any>;
    PatchModToGame_start!: () => Promise<any>;
    ReplacePatcher_end!: (modName: string, fileName: string) => Promise<any>;
    ReplacePatcher_start!: (modName: string, fileName: string) => Promise<any>;
    logError!: (s: string) => void;
    logInfo!: (s: string) => void;
    logWarning!: (s: string) => void;
    ModLoaderLoadEnd!: () => Promise<any>;

    async canLoadThisMod(bootJson: ModBootJson, zip: JSZipLikeReadOnlyInterface): Promise<boolean> {
        for (const [hookId, hook] of this.lifeTimeCircleHookTable) {
            try {
                if (hook.canLoadThisMod) {
                    const r = await hook.canLoadThisMod(bootJson, zip);
                    if (!r) {
                        console.warn(`ModLoadController canLoadThisMod() mod [${bootJson.name}] be banned by [${hookId}]`);
                        this.getLog().warn(`ModLoadController canLoadThisMod() mod [${bootJson.name}] be banned by [${hookId}]`);
                        return false;
                    }
                }
            } catch (e: Error | any) {
                console.error('ModLoadController canLoadThisMod()', [hookId, e]);
                this.getLog().error(`ModLoadController canLoadThisMod() ${hookId} ${e?.message ? e.message : e}`);
            }
        }
        return true;
    }

    async afterModLoad(bootJson: ModBootJson, zip: JSZipLikeReadOnlyInterface, modInfo: ModInfo): Promise<any> {
        for (const [id, hook] of this.lifeTimeCircleHookTable) {
            try {
                if (hook.afterModLoad) {
                    await hook.afterModLoad(bootJson, zip, modInfo);
                }
            } catch (e: Error | any) {
                console.error('ModLoadController afterModLoad()', [id, e]);
                this.getLog().error(`ModLoadController afterModLoad() ${id} ${e?.message ? e.message : e}`);
            }
        }
    }

    /**
     * call by ModLoaderGui (inner use)
     * @param zip
     */
    async exportDataZip(zip: JSZip): Promise<JSZip> {
        for (const [id, hook] of this.lifeTimeCircleHookTable) {
            try {
                if (hook.exportDataZip) {
                    zip = await hook.exportDataZip(zip);
                }
            } catch (e: any | Error) {
                console.error('ModLoadController exportDataZip()', e);
                this.logError(`ModLoadController exportDataZip() ${e?.message ? e.message : e}`);
            }
        }
        return zip;
    }

    private lifeTimeCircleHookTable: Map<string, LifeTimeCircleHook> = new Map<string, LifeTimeCircleHook>();

    public addLifeTimeCircleHook(id: string, hook: LifeTimeCircleHook) {
        if (this.lifeTimeCircleHookTable.has(id)) {
            console.error(`ModLoadController addLifeTimeCircleHook() id [${id}] already exists.`);
            this.logError(`ModLoadController addLifeTimeCircleHook() id [${id}] already exists.`);
        }
        this.lifeTimeCircleHookTable.set(id, hook);
    }

    public removeLifeTimeCircleHook(hook: LifeTimeCircleHook) {
        for (const [id, h] of this.lifeTimeCircleHookTable) {
            if (h === hook) {
                this.lifeTimeCircleHookTable.delete(id);
                return;
            }
        }
        console.error('ModLoadController removeLifeTimeCircleHook() hook not found.');
        this.logError('ModLoadController removeLifeTimeCircleHook() hook not found.');
    }

    public clearLifeTimeCircleHook() {
        this.lifeTimeCircleHookTable.clear();
    }

    public listModLocalStorage() {
        return LocalStorageLoader.listMod() || [];
    }

    public addModLocalStorage(name: string, modBase64String: string) {
        return LocalStorageLoader.addMod(name, modBase64String);
    }

    public removeModLocalStorage(name: string) {
        return LocalStorageLoader.removeMod(name);
    }

    public async checkModZipFileLocalStorage(modBase64String: string) {
        return LocalStorageLoader.checkModZipFile(modBase64String);
    }

    public async overwriteModIndexDBModList(modeList: string[]) {
        await IndexDBLoader.setModList(modeList);
    }

    public async overwriteModIndexDBHiddenModList(modeList: string[]) {
        await IndexDBLoader.setHiddenModList(modeList);
    }

    public async listModIndexDB() {
        return await IndexDBLoader.listMod() || [];
    }

    public async loadHiddenModList() {
        return await IndexDBLoader.loadHiddenModList() || [];
    }

    public addModIndexDB(name: string, modBase64String: string | Uint8Array) {
        return IndexDBLoader.addMod(name, modBase64String);
    }

    public removeModIndexDB(name: string) {
        return IndexDBLoader.removeMod(name);
    }

    public async checkModZipFileIndexDB(modBase64String: string | Uint8Array) {
        return IndexDBLoader.checkModZipFile(modBase64String);
    }

    public getLog(): LogWrapper {
        return {
            log: (s: string) => {
                this.logInfo(s);
            },
            warn: (s: string) => {
                this.logWarning(s);
            },
            error: (s: string) => {
                this.logError(s);
            },
        };
    }

}
