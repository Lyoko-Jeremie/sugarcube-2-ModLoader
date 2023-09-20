import {ModBootJson} from "ModLoader";
import {SC2DataManager} from "SC2DataManager";
import JSZip from "jszip";
import {IndexDBLoader, LocalStorageLoader} from "./ModZipReader";


export interface LifeTimeCircleHook extends ModLoadControllerCallback {

}

export interface ModLoadControllerCallback {
    canLoadThisMod(bootJson: ModBootJson, zip: JSZip): boolean;
}

export class ModLoadController implements ModLoadControllerCallback {

    constructor(
        public gSC2DataManager: SC2DataManager
    ) {
    }

    canLoadThisMod(bootJson: ModBootJson, zip: JSZip): boolean {
        return this.lifeTimeCircleHookTable.reduce((acc, T) => {
            return acc && T.canLoadThisMod(bootJson, zip);
        }, true);
    }

    lifeTimeCircleHookTable: LifeTimeCircleHook[] = [];

    addLifeTimeCircleHook(hook: LifeTimeCircleHook) {
        this.lifeTimeCircleHookTable.push(hook);
    }

    removeLifeTimeCircleHook(hook: LifeTimeCircleHook) {

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

