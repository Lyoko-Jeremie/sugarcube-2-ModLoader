import {} from 'lodash';
import {ModInfo} from "./ModLoader";
import {ModZipReader} from "./ModZipReader";
import {ModLoadController} from 'ModLoadController';
import JSZip from 'jszip';

type  AddonPluginHookType = () => Promise<any>;

const AddonPluginHookPoint_KL = [
    'afterInit',
    'afterModLoad',
    'afterInjectEarlyLoad',
    'afterEarlyLoad',
    'afterPatchModToGame',
    'afterPreload',
    'whenSC2StoryReady',
    'whenSC2PassageInit',
    'whenSC2PassageStart',
    'whenSC2PassageRender',
    'whenSC2PassageDisplay',
    'whenSC2PassageEnd',
] as const;

type AddonPluginHookPoint_K = typeof AddonPluginHookPoint_KL[number];

export type AddonPluginHookPoint = {
    [key in AddonPluginHookPoint_K]?: AddonPluginHookType;
}

export interface AddonPluginHookPointEx extends AddonPluginHookPoint {
    registerMod(addonName: string, mod: ModInfo, modZip: ModZipReader): Promise<any>;

    exportDataZip(zip: JSZip): Promise<JSZip>;
}

export class AddonPlugin {
    constructor(
        public modName: string,
        public addonName: string,
        public hookPoint: AddonPluginHookPointEx,
    ) {
    }
}

export class AddonPluginManager {
    private addonPluginTable: AddonPlugin[] = [];

    constructor(
        public gModLoadController: ModLoadController,
    ) {
    }

    async registerMod(mod: ModInfo, modZip: ModZipReader) {
        if (mod.bootJson.addonPlugin) {
            for (const p of mod.bootJson.addonPlugin) {
                const ad = this.addonPluginTable.find((a) => {
                    return a.modName === p.modName && a.addonName === p.addonName;
                });
                if (!ad) {
                    console.error('AddonPluginManager.registerMod() not found', [p, mod]);
                    continue;
                }
                if (!ad.hookPoint.registerMod) {
                    // never go there
                    console.error('AddonPluginManager.registerMod() not found registerMod', [p, mod]);
                    continue;
                }
                await ad.hookPoint.registerMod(p.addonName, mod, modZip);
            }
        }
    }

    async exportDataZip(zip: JSZip): Promise<JSZip> {
        for (const addonPlugin of this.addonPluginTable) {
            if (addonPlugin.hookPoint.exportDataZip) {
                zip = await addonPlugin.hookPoint.exportDataZip(zip);
            }
        }
        return zip;
    }

    public async triggerHook(hook: AddonPluginHookPoint_K) {
        for (const addonPlugin of this.addonPluginTable) {
            if (addonPlugin.hookPoint[hook]) {
                await addonPlugin.hookPoint[hook]!();
            }
        }
    }

    public checkDuplicate(modName: string, addonName: string): boolean {
        return !!this.addonPluginTable.find((addonPlugin) => {
            return addonPlugin.modName === modName && addonPlugin.addonName === addonName;
        });
    }

    public registerAddonPlugin(addonPlugin: AddonPlugin) {
        if (this.checkDuplicate(addonPlugin.modName, addonPlugin.addonName)) {
            console.error('AddonPluginManager.registerAddonPlugin() duplicate', addonPlugin);
        }
        this.addonPluginTable.push(addonPlugin);
    }

    public getAddonPlugin(modName: string, addonName: string): AddonPlugin | undefined {
        return this.addonPluginTable.find((addonPlugin) => {
            return addonPlugin.modName === modName && addonPlugin.addonName === addonName;
        });
    }
}

