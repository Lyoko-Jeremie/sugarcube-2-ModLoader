import {} from 'lodash';
import {ModInfo} from "./ModLoader";
import {ModZipReader} from "./ModZipReader";
import {LogWrapper, ModLoadController} from 'ModLoadController';
import JSZip from 'jszip';
import {SC2DataManager} from "./SC2DataManager";
import {PassageTracer} from "./PassageTracer";
import {Sc2EventTracer, Sc2EventTracerCallback} from "./Sc2EventTracer";
import {Passage} from "./SugarCube2";

type AddonPluginHookType = () => Promise<any>;

export interface AddonPluginHookPoint {
    // 当前 mod 加载后 (这个hook无法拦截到，因为最早可能的hook注入点在InjectEarlyLoad)
    afterInit?: AddonPluginHookType,
    // 所有 EarlyInject 脚本插入后
    afterInjectEarlyLoad?: AddonPluginHookType,
    // 所有 mod 加载后 ， 且 LifeTimeCircleHook.afterModLoad 触发后
    afterModLoad?: AddonPluginHookType,
    // 所有 EarlyLoad 脚本执行后
    afterEarlyLoad?: AddonPluginHookType,
    // 所有 Mod 注册到 Addon 后
    afterRegisterMod2Addon?: AddonPluginHookType,
    // 所有 mod 数据覆盖到游戏前
    beforePatchModToGame?: AddonPluginHookType,
    // 所有 mod 数据覆盖到游戏后
    afterPatchModToGame?: AddonPluginHookType,
    // 所有 Preload 脚本执行后
    afterPreload?: AddonPluginHookType,
}

export type AddonPluginHookPoint_K = keyof AddonPluginHookPoint;

export type AddonPluginHookPointWhenSC2 = {
    // SugarCube2 引擎触发 StoryReady 事件后
    whenSC2StoryReady?: () => Promise<any>,
    // SugarCube2 引擎触发 PassageInit 事件后
    whenSC2PassageInit?: (passage: Passage) => Promise<any>,
    // SugarCube2 引擎触发 PassageStart 事件后
    whenSC2PassageStart?: (passage: Passage, content: HTMLDivElement) => Promise<any>,
    // SugarCube2 引擎触发 PassageRender 事件后
    whenSC2PassageRender?: (passage: Passage, content: HTMLDivElement) => Promise<any>,
    // SugarCube2 引擎触发 PassageDisplay 事件后
    whenSC2PassageDisplay?: (passage: Passage, content: HTMLDivElement) => Promise<any>,
    // SugarCube2 引擎触发 PassageReady 事件后
    whenSC2PassageEnd?: (passage: Passage, content: HTMLDivElement) => Promise<any>,
}
export type AddonPluginHookPointWhenSC2_T = AddonPluginHookPointWhenSC2;
export type AddonPluginHookPointWhenSC2_K = keyof AddonPluginHookPointWhenSC2_T;

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
// export type AddonPluginHookPointEx =
//     AddonPluginHookPoint
//     & AddonPluginHookPointExOptional
//     & AddonPluginHookPointExMustImplement
//     & AddonPluginHookPointWhenSC2;

export interface AddonPluginHookPointEx
    extends AddonPluginHookPoint, AddonPluginHookPointExOptional, AddonPluginHookPointExMustImplement, AddonPluginHookPointWhenSC2 {
}

export class AddonPlugin {
    constructor(
        public modName: string,
        public addonName: string,
        public hookPoint: AddonPluginHookPointEx,
    ) {
    }
}

export class AddonPluginManager implements Sc2EventTracerCallback {
    private addonPluginTable: AddonPlugin[] = [];

    private log: LogWrapper;
    private passageTracer: PassageTracer;
    private sc2EventTracer: Sc2EventTracer;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModLoadController: ModLoadController,
    ) {
        this.log = gModLoadController.getLog();
        this.passageTracer = this.gSC2DataManager.getPassageTracer();
        // this.passageTracer.addCallback((passageName) => {
        //     switch (passageName) {
        //         case 'Start':
        //             break;
        //         default:
        //             break;
        //     }
        // });
        this.sc2EventTracer = this.gSC2DataManager.getSc2EventTracer();
        this.sc2EventTracer.addCallback(this);
    }

    /**
     * inner use
     */
    async whenSC2StoryReady(): Promise<any> {
        await this.triggerHookWhenSC2('whenSC2StoryReady');
    }

    /**
     * inner use
     */
    async whenSC2PassageInit(passage: Passage): Promise<any> {
        await this.triggerHookWhenSC2('whenSC2PassageInit', passage);
    }

    /**
     * inner use
     */
    async whenSC2PassageStart(passage: Passage, content: HTMLDivElement): Promise<any> {
        await this.triggerHookWhenSC2('whenSC2PassageStart', passage, content);
    }

    /**
     * inner use
     */
    async whenSC2PassageRender(passage: Passage, content: HTMLDivElement): Promise<any> {
        await this.triggerHookWhenSC2('whenSC2PassageRender', passage, content);
    }

    /**
     * inner use
     */
    async whenSC2PassageDisplay(passage: Passage, content: HTMLDivElement): Promise<any> {
        await this.triggerHookWhenSC2('whenSC2PassageDisplay', passage, content);
    }

    /**
     * inner use
     */
    async whenSC2PassageEnd(passage: Passage, content: HTMLDivElement): Promise<any> {
        await this.triggerHookWhenSC2('whenSC2PassageEnd', passage, content);
    }

    /**
     * call by ModLoader (inner use)
     *
     * register a mod to addon plugin, after all mod loaded and after EarlyLoad executed.
     *
     * @param mod
     * @param modZip
     */
    async registerMod2Addon(mod: ModInfo, modZip: ModZipReader) {
        if (mod.bootJson.addonPlugin) {
            for (const p of mod.bootJson.addonPlugin) {
                const ad = this.addonPluginTable.find((a) => {
                    return a.modName === p.modName && a.addonName === p.addonName;
                });
                if (!ad) {
                    console.error('ModLoader ====== AddonPluginManager.registerMod() not found', [p, mod]);
                    this.log.error(`AddonPluginManager.registerMod() not found [${p.modName}] [${p.addonName}] on mod[${mod.name}]`);
                    continue;
                }
                if (!ad.hookPoint.registerMod) {
                    // never go there
                    console.error('AddonPluginManager.registerMod() registerMod invalid', [p, mod]);
                    this.log.error(`AddonPluginManager.registerMod() registerMod invalid [${p.modName}] [${p.addonName}] on mod[${mod.name}]`);
                    continue;
                }
                console.log('ModLoader ====== AddonPluginManager.registerMod() registerMod start', [p, mod]);
                this.log.log(`AddonPluginManager.registerMod() registerMod start: to addon [${p.modName}] [${p.addonName}] on mod[${mod.name}]`);
                try {
                    await ad.hookPoint.registerMod(p.addonName, mod, modZip);
                } catch (e: any | Error) {
                    console.error('ModLoader ====== AddonPluginManager.registerMod() registerMod error', [p, mod, e]);
                    this.log.error(`AddonPluginManager.registerMod() registerMod error: to addon [${p.modName}] [${p.addonName}] on mod[${mod.name}] [${e?.message ? e.message : e}]`);
                }
                console.log('ModLoader ====== AddonPluginManager.registerMod() registerMod end', [p, mod]);
                this.log.log(`AddonPluginManager.registerMod() registerMod end: to addon [${p.modName}] [${p.addonName}] on mod[${mod.name}]`);
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
                try {
                    zip = await addonPlugin.hookPoint.exportDataZip(zip);
                } catch (e: Error | any) {
                    console.error('exportDataZip error on addonPlugin.hookPoint', [addonPlugin], e);
                    this.log.error(`exportDataZip error on addonPlugin.hookPoint [${addonPlugin.modName}] [${addonPlugin.addonName}] [${e?.message ? e.message : e}]`)
                }
            }
        }
        return zip;
    }

    /**
     * call by ModLoader (inner use)
     * @param hook
     */
    async triggerHook(hook: AddonPluginHookPoint_K) {
        const log = this.gSC2DataManager.getModLoadController().getLog();
        for (const addonPlugin of this.addonPluginTable) {
            if (addonPlugin.hookPoint[hook]) {
                console.log(`ModLoader ====== AddonPluginManager.triggerHook() trigger hook [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] start`);
                log.log(`AddonPluginManager.triggerHook() trigger hook [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] start`);
                try {
                    await addonPlugin.hookPoint[hook]!();
                } catch (e: any | Error) {
                    console.error(`ModLoader ====== AddonPluginManager.triggerHook() error [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] `, e);
                    log.error(`AddonPluginManager.triggerHook() error [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] [${e?.message ? e.message : e}]`);
                }
                console.log(`ModLoader ====== AddonPluginManager.triggerHook() trigger hook [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] end`);
                log.log(`AddonPluginManager.triggerHook() trigger hook [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] end`);
            }
        }
    }

    /**
     * call by ModLoader (inner use)
     */
    async triggerHookWhenSC2<K extends AddonPluginHookPointWhenSC2_K>(
        hook: K,
        ...params: Parameters<NonNullable<AddonPluginHookPointWhenSC2_T[K]>>
    ) {
        const log = this.gSC2DataManager.getModLoadController().getLog();
        for (const addonPlugin of this.addonPluginTable) {
            if (addonPlugin.hookPoint[hook]) {
                // console.log(`ModLoader ====== AddonPluginManager.triggerHookWhenSC2() trigger hook [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] start`);
                // log.log(`AddonPluginManager.triggerHookWhenSC2() trigger hook [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] start`);
                try {
                    const f: ((...params: any[]) => any) = (addonPlugin.hookPoint as AddonPluginHookPointWhenSC2)[hook]!;
                    await f.call(addonPlugin.hookPoint, ...params);
                } catch (e: any | Error) {
                    console.error(`ModLoader ====== AddonPluginManager.triggerHookWhenSC2() error [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] `, e);
                    log.error(`AddonPluginManager.triggerHookWhenSC2() error [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] [${e?.message ? e.message : e}]`);
                }
                // console.log(`ModLoader ====== AddonPluginManager.triggerHookWhenSC2() trigger hook [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] end`);
                // log.log(`AddonPluginManager.triggerHookWhenSC2() trigger hook [${addonPlugin.modName}] [${addonPlugin.addonName}] [${hook}] end`);
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
     * register a addon plugin, call by addon plugin,
     * this call must be done when InjectEarlyLoad.
     *
     * 注册一个 addon plugin，由 addon plugin 调用，必须在 InjectEarlyLoad 时调用此函数注册 Addon。
     * @param modName    addon plugin's mod name
     * @param addonName  addon plugin's name
     * @param hookPoint  addon plugin's hook point
     */
    public registerAddonPlugin(modName: string, addonName: string, hookPoint: AddonPluginHookPointEx) {
        if (this.checkDuplicate(modName, addonName)) {
            console.error('ModLoader ====== AddonPluginManager.registerAddonPlugin() duplicate', [modName, addonName]);
            this.log.error(`AddonPluginManager.registerAddonPlugin() duplicate [${modName}] [${addonName}]`);
        }
        console.log('ModLoader ====== AddonPluginManager.registerAddonPlugin() ', [modName, addonName]);
        this.log.log(`AddonPluginManager.registerAddonPlugin() [${modName}] [${addonName}]`);
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

