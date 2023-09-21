import {ModBootJson} from "ModLoader";
import {SC2DataManager} from "SC2DataManager";
import JSZip from "jszip";
import {IndexDBLoader, LocalStorageLoader} from "./ModZipReader";


export interface LifeTimeCircleHook extends Partial<ModLoadControllerCallback> {

}

export interface ModLoadControllerCallback {
    canLoadThisMod(bootJson: ModBootJson, zip: JSZip): boolean;

    InjectEarlyLoad_start(modName: string, fileName: string): void;

    InjectEarlyLoad_end(modName: string, fileName: string): void;

    EarlyLoad_start(modName: string, fileName: string): void;

    EarlyLoad_end(modName: string, fileName: string): void;

    Load_start(modName: string, fileName: string): void;

    Load_end(modName: string, fileName: string): void;

    PatchModToGame_start(): void;

    PatchModToGame_end(): void;

    ReplacePatcher_start(): void;

    ReplacePatcher_end(): void;

    logError(s: string): void;

    logInfo(s: string): void;

    logWarning(s: string): void;
}

const ModLoadControllerCallback_PatchHook = [
    'PatchModToGame_start',
    'PatchModToGame_end',
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

export class ModLoadController implements ModLoadControllerCallback {

    constructor(
        public gSC2DataManager: SC2DataManager
    ) {
        ModLoadControllerCallback_ScriptLoadHook.forEach((T) => {
            this[T] = (modName: string, fileName: string) => {
                this.lifeTimeCircleHookTable.forEach((hook) => {
                    if (hook[T]) {
                        hook[T]!.apply(hook, [modName, fileName]);
                    }
                });
            };
        });
        ModLoadControllerCallback_PatchHook.forEach((T) => {
            this[T] = () => {
                this.lifeTimeCircleHookTable.forEach((hook) => {
                    if (hook[T]) {
                        hook[T]!.apply(hook, []);
                    }
                });
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

    EarlyLoad_end!: (modName: string, fileName: string) => void;
    EarlyLoad_start!: (modName: string, fileName: string) => void;
    InjectEarlyLoad_end!: (modName: string, fileName: string) => void;
    InjectEarlyLoad_start!: (modName: string, fileName: string) => void;
    Load_end!: (modName: string, fileName: string) => void;
    Load_start!: (modName: string, fileName: string) => void;
    PatchModToGame_end!: () => void;
    PatchModToGame_start!: () => void;
    ReplacePatcher_end!: () => void;
    ReplacePatcher_start!: () => void;
    logError!: (s: string) => void;
    logInfo!: (s: string) => void;
    logWarning!: (s: string) => void;

    canLoadThisMod(bootJson: ModBootJson, zip: JSZip): boolean {
        return this.lifeTimeCircleHookTable.reduce((acc, T) => {
            return acc && (T.canLoadThisMod ? T.canLoadThisMod(bootJson, zip) : true);
        }, true);
    }

    private lifeTimeCircleHookTable: LifeTimeCircleHook[] = [];

    addLifeTimeCircleHook(hook: LifeTimeCircleHook) {
        this.lifeTimeCircleHookTable.push(hook);
    }

    removeLifeTimeCircleHook(hook: LifeTimeCircleHook) {
        // TODO
    }

    clearLifeTimeCircleHook() {
        this.lifeTimeCircleHookTable = [];
    }

    listModLocalStorage() {
        return LocalStorageLoader.listMod() || [];
    }

    addModLocalStorage(name: string, modBase64String: string) {
        return LocalStorageLoader.addMod(name, modBase64String);
    }

    removeModLocalStorage(name: string) {
        return LocalStorageLoader.removeMod(name);
    }

    async checkModZipFileLocalStorage(modBase64String: string) {
        return LocalStorageLoader.checkModZipFile(modBase64String);
    }

    async listModIndexDB() {
        return IndexDBLoader.listMod() || [];
    }

    addModIndexDB(name: string, modBase64String: string) {
        return IndexDBLoader.addMod(name, modBase64String);
    }

    removeModIndexDB(name: string) {
        return IndexDBLoader.removeMod(name);
    }

    async checkModZipFileIndexDB(modBase64String: string) {
        return IndexDBLoader.checkModZipFile(modBase64String);
    }


}

