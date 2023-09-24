import {} from 'lodash';
import {ModInfo} from "./ModLoader";
import {ModZipReader} from "./ModZipReader";
import {LogWrapper, ModLoadController} from 'ModLoadController';
import JSZip from 'jszip';
import {SC2DataManager} from "./SC2DataManager";

type  AddonPluginHookType = () => Promise<any>;

const AddonPluginHookPoint_KL = [
    // // 当前 mod 加载后
    // 'afterInit',
    // // 所有 mod 加载后
    // 'afterModLoad',
    // 所有 EarlyInject 脚本插入后
    'afterInjectEarlyLoad',
    // 所有 EarlyLoad 脚本执行后
    'afterEarlyLoad',
    // 所有 mod 数据覆盖到游戏后
    'afterPatchModToGame',
    // 所有 Preload 脚本执行后
    'afterPreload',
    // SugarCube2 引擎触发 StoryReady 事件后
    'whenSC2StoryReady',
    // SugarCube2 引擎触发 PassageInit 事件后
    'whenSC2PassageInit',
    // SugarCube2 引擎触发 PassageStart 事件后
    'whenSC2PassageStart',
    // SugarCube2 引擎触发 PassageRender 事件后
    'whenSC2PassageRender',
    // SugarCube2 引擎触发 PassageDisplay 事件后
    'whenSC2PassageDisplay',
    // SugarCube2 引擎触发 PassageReady 事件后
    'whenSC2PassageEnd',
] as const;

type AddonPluginHookPoint_K = typeof AddonPluginHookPoint_KL[number];

export type AddonPluginHookPoint = {
    [key in AddonPluginHookPoint_K]?: AddonPluginHookType;
}

export type AddonPluginHookPointExOptional = {
    /**
     * registerMod() will be called when export debug data, this is a chance to export addon data for debug, like when addon change data in memory
     *
     * registerMod() 会在导出 debug data 时被调用，这是导出 addon 数据的机会，比如当 addon 在内存中改变了数据。
     * 举个例子，衣服扩展框架可以收集所有衣服mod的数据，统一在文件或内存中修改衣服数据，如果是在文件中修改那么会被默认导出，但如果是在内存中修改，则最好使用这个 hook 来导出数据以便 debug
     *
     * @optional
     * @param zip the zip file to storage debug data
     * @return   return the same zip file or a new zip file, recommend return the same zip file
     */
    exportDataZip?: (zip: JSZip) => Promise<JSZip>;
};
export type AddonPluginHookPointExMustImplement = {
    /**
     * registerMod() will be called when mod loaded and that mod require this addon, addon can read info from mod and do something
     *
     * registerMod() 会在 mod 加载完毕并且 mod 需要这个 addon 时被调用，addon 可以从 mod 读取信息并做一些事情。
     * 举个例子，衣服扩展框架可以在这里读取衣服mod的数据，然后统一修改衣服数据，这样就可以避免多个不同的衣服mod前后修改衣服数组导致意外损坏衣服数组的数据。
     * @mustImplement
     * @param addonName the mod require this addon
     * @param mod       the mod info
     * @param modZip    the mod zip file reader
     */
    registerMod: (addonName: string, mod: ModInfo, modZip: ModZipReader) => Promise<any>;
};

/**
 * AddonPluginHookPointEx is a interface for addon plugin to implement API Hook,
 * addon plugin can implement any hook, but must implement registerMod(),
 * addon can impl more API in there, to let mod call it to get more function.
 *
 * AddonPluginHookPointEx 是 addon plugin 用来实现 API Hook 的接口，
 * addon plugin 可以实现任何 hook，但是必须实现 registerMod()，
 * addon 可以在里面实现更多 API，让 mod 调用它来获得更多功能。
 */
export interface AddonPluginHookPointEx extends AddonPluginHookPoint, AddonPluginHookPointExOptional, AddonPluginHookPointExMustImplement {
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

    private log: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModLoadController: ModLoadController,
    ) {
        this.log = gModLoadController.getLog();
    }

    /**
     * call by ModLoader (inner use)
     * @param mod
     * @param modZip
     */
    async registerMod(mod: ModInfo, modZip: ModZipReader) {
        if (mod.bootJson.addonPlugin) {
            for (const p of mod.bootJson.addonPlugin) {
                const ad = this.addonPluginTable.find((a) => {
                    return a.modName === p.modName && a.addonName === p.addonName;
                });
                if (!ad) {
                    console.error('AddonPluginManager.registerMod() not found', [p, mod]);
                    this.log.error(`AddonPluginManager.registerMod() not found [${p.modName}] [${p.addonName}] on mod[${mod.name}]`);
                    continue;
                }
                if (!ad.hookPoint.registerMod) {
                    // never go there
                    console.error('AddonPluginManager.registerMod() registerMod invalid', [p, mod]);
                    this.log.error(`AddonPluginManager.registerMod() registerMod invalid [${p.modName}] [${p.addonName}] on mod[${mod.name}]`);
                    continue;
                }
                await ad.hookPoint.registerMod(p.addonName, mod, modZip);
            }
        }
    }

    /**
     * call by ModLoader (inner use)
     * @param zip
     */
    async exportDataZip(zip: JSZip): Promise<JSZip> {
        for (const addonPlugin of this.addonPluginTable) {
            if (addonPlugin.hookPoint.exportDataZip) {
                zip = await addonPlugin.hookPoint.exportDataZip(zip);
            }
        }
        return zip;
    }

    /**
     * call by ModLoader (inner use)
     * @param hook
     */
    async triggerHook(hook: AddonPluginHookPoint_K) {
        for (const addonPlugin of this.addonPluginTable) {
            if (addonPlugin.hookPoint[hook]) {
                await addonPlugin.hookPoint[hook]!();
            }
        }
    }

    /**
     * check if a addon plugin is duplicate
     * @param modName
     * @param addonName
     */
    public checkDuplicate(modName: string, addonName: string): boolean {
        return !!this.addonPluginTable.find((addonPlugin) => {
            return addonPlugin.modName === modName && addonPlugin.addonName === addonName;
        });
    }

    /**
     * register a addon plugin, call by addon plugin
     *
     * 注册一个 addon plugin，由 addon plugin 调用
     * @param modName    addon plugin's mod name
     * @param addonName  addon plugin's name
     * @param hookPoint  addon plugin's hook point
     */
    public registerAddonPlugin(modName: string, addonName: string, hookPoint: AddonPluginHookPointEx) {
        if (this.checkDuplicate(modName, addonName)) {
            console.error('AddonPluginManager.registerAddonPlugin() duplicate', [modName, addonName]);
            this.log.error(`AddonPluginManager.registerAddonPlugin() duplicate [${modName}] [${addonName}]`);
        }
        this.addonPluginTable.push(new AddonPlugin(modName, addonName, hookPoint));
    }

    /**
     * get a addon plugin, call by mod
     *
     * 获取一个 addon plugin，由 mod 调用。 mod 可以读取 addon plugin 的 hookPoint 来调用 addon plugin 的 API
     * @param modName    addon plugin's mod name
     * @param addonName  addon plugin's name
     */
    public getAddonPlugin(modName: string, addonName: string): AddonPluginHookPointEx | undefined {
        return this.addonPluginTable.find((addonPlugin) => {
            return addonPlugin.modName === modName && addonPlugin.addonName === addonName;
        })?.hookPoint;
    }
}

