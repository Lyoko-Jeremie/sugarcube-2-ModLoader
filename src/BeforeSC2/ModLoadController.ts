import {ModBootJson} from "ModLoader";
import {SC2DataManager} from "SC2DataManager";
import JSZip from "jszip";
import {IndexDBLoader, LocalStorageLoader} from "./ModZipReader";


export interface LogWrapper {
    log: (s: string) => void;
    warn: (s: string) => void;
    error: (s: string) => void;
}

export interface LifeTimeCircleHook extends Partial<ModLoadControllerCallback> {

}

export interface ModLoadControllerCallback {
    canLoadThisMod(bootJson: ModBootJson, zip: JSZip): boolean;

    InjectEarlyLoad_start(modName: string, fileName: string): Promise<any>;

    InjectEarlyLoad_end(modName: string, fileName: string): Promise<any>;

    EarlyLoad_start(modName: string, fileName: string): Promise<any>;

    EarlyLoad_end(modName: string, fileName: string): Promise<any>;

    Load_start(modName: string, fileName: string): Promise<any>;

    Load_end(modName: string, fileName: string): Promise<any>;

    PatchModToGame_start(): Promise<any>;

    PatchModToGame_end(): Promise<any>

    ReplacePatcher_start(modName: string, fileName: string): Promise<any>;

    ReplacePatcher_end(modName: string, fileName: string): Promise<any>;

    ModLoaderLoadEnd(): Promise<any>;

    logError(s: string): void;

    logInfo(s: string): void;

    logWarning(s: string): void;
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
                for (const hook of this.lifeTimeCircleHookTable) {
                    if (hook[T]) {
                        await hook[T]!.apply(hook, [modName, fileName]);
                    }
                }
            };
        });
        ModLoadControllerCallback_PatchHook.forEach((T) => {
            this[T] = async () => {
                for (const hook of this.lifeTimeCircleHookTable) {
                    if (hook[T]) {
                        await hook[T]!.apply(hook, []);
                    }
                }
            };
        });
        ModLoadControllerCallback_ModLoader.forEach((T) => {
            this[T] = async () => {
                for (const hook of this.lifeTimeCircleHookTable) {
                    if (hook[T]) {
                        await hook[T]!.apply(hook, []);
                    }
                }
            };
        });
        ModLoadControllerCallback_ReplacePatch.forEach((T) => {
            this[T] = async (modName: string, fileName: string) => {
                for (const hook of this.lifeTimeCircleHookTable) {
                    if (hook[T]) {
                        await hook[T]!.apply(hook, [modName, fileName]);
                    }
                }
            };
        });
        ModLoadControllerCallback_Log.forEach((T) => {
            this[T] = (s: string) => {
                this.lifeTimeCircleHookTable.forEach((hook) => {
                    if (hook[T]) {
                        hook[T]!.apply(hook, [s]);
                    }
                });
            };
        });
    }

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

    canLoadThisMod(bootJson: ModBootJson, zip: JSZip): boolean {
        return this.lifeTimeCircleHookTable.reduce((acc, T) => {
            return acc && (T.canLoadThisMod ? T.canLoadThisMod(bootJson, zip) : true);
        }, true);
    }

    private lifeTimeCircleHookTable: LifeTimeCircleHook[] = [];

    public addLifeTimeCircleHook(hook: LifeTimeCircleHook) {
        this.lifeTimeCircleHookTable.push(hook);
    }

    public removeLifeTimeCircleHook(hook: LifeTimeCircleHook) {
        // TODO
    }

    public clearLifeTimeCircleHook() {
        this.lifeTimeCircleHookTable = [];
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

    public async listModIndexDB() {
        return IndexDBLoader.listMod() || [];
    }

    public addModIndexDB(name: string, modBase64String: string) {
        return IndexDBLoader.addMod(name, modBase64String);
    }

    public removeModIndexDB(name: string) {
        return IndexDBLoader.removeMod(name);
    }

    public async checkModZipFileIndexDB(modBase64String: string) {
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
