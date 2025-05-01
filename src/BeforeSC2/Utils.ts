import {SC2DataManager} from "./SC2DataManager";
import {isInteger, isString} from "lodash";
import _ from "lodash";
import {getModZipReaderStaticClassRef, ModZipReader, Twee2Passage, Twee2PassageR} from "./ModZipReader";
import {PassageDataItem, SC2DataInfo, SC2DataInfoCache} from "./SC2DataInfoCache";
import {SimulateMergeResult} from "./SimulateMerge";
import {replaceMergeSC2DataInfoCache, replaceMergeSC2DataInfoCacheForce} from "./MergeSC2DataInfoCache";
import JSZip from "jszip";
import {ModBootJsonAddonPlugin, ModInfo, ModLoader} from "./ModLoader";
import {LogWrapper, ModLoadController} from "./ModLoadController";
import {AddonPluginManager} from "./AddonPlugin";
import {SemVerToolsType} from "./SemVer/InfiniteSemVer";
import {IdbKeyValRef, IdbRef} from "./IdbKeyValRef";
import {ModLoadFromSourceType} from "./ModOrderContainer";
// import {
//     enumerable,
//     sealed,
//     sealedMethod,
//     loggedMethod,
//     sealedField,
//     sealedField2,
//     ClassDecoratorUtil,
// } from "./DecoratorUtils";


// @ClassDecoratorUtil.finishClassDecorate({})
export class ModUtils {

    get version(): string {
        return '2.31.1';
    }

    constructor(
        public pSC2DataManager: SC2DataManager,
        public thisWin: Window,
    ) {
    }

    getThisWindow(): Window {
        return this.thisWin;
    }

    /**
     * 获取所有mod的名字
     * 以mod加载顺序为序
     */
    getModListName(): string[] {
        return this.pSC2DataManager.getModLoader().getModAllName();
    }

    getModListNameNoAlias(): string[] {
        return this.pSC2DataManager.getModLoader().getModCacheArray().map(T => T.mod.name);
    }

    getAnyModByNameNoAlias(name: string): ModInfo | undefined {
        return this.pSC2DataManager.getModLoader().getModCacheByNameOne(name)?.mod;
    }

    /**
     * 获取指定mod的信息
     * @param name ModName
     * @return ModInfo | undefined
     */
    getMod(name: string): ModInfo | undefined {
        return this.pSC2DataManager.getModLoader().getModCacheByAliseOne(name)?.mod;
    }

    getModAndFromInfo(name: string): undefined | { name: string, mod: ModInfo, from: ModLoadFromSourceType } {
        const m = this.pSC2DataManager.getModLoader().getModCacheByAliseOne(name);
        if (!m) {
            return undefined;
        }
        return {
            name: m.name,
            from: m.from,
            mod: m.mod,
        };
    }

    getAllModInfoByFromType(
        from: ModLoadFromSourceType,
    ): {
        name: string,
        mod: ModInfo,
        from: ModLoadFromSourceType
    }[] {
        const ml = this.pSC2DataManager.getModLoader().getModCacheByFromType(from);
        return ml.map(m => {
            return {
                name: m.name,
                from: m.from,
                mod: m.mod,
            };
        })
    }

    /**
     * 获取指定mod的Zip
     * @param modName ModName
     * @return ModZipReader | undefined
     */
    getModZip(modName: string): ModZipReader | undefined {
        return this.pSC2DataManager.getModLoader().getModCacheByAliseOne(modName)?.zip;
    }

    /**
     * 获取指定Passage的信息
     * @param name PassageName
     * @return PassageDataItem | undefined
     */
    getPassageData(name: string): PassageDataItem | undefined {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get(name);
    }

    /**
     * 获取所有Passage的信息
     * @return PassageDataItem[]
     */
    getAllPassageData(): PassageDataItem[] {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.items;
    }

    /**
     * 获取当前最新的SC2DataInfo，其中存储了所有SC2引擎的数据，包括js/css/passage
     * @return SC2DataInfo
     */
    createNewSC2DataInfoFromNow(): SC2DataInfoCache {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch();
    }

    /**
     * 批量更新passage数据，如果存在则覆盖，如果不存在则创建
     * @param pd 需要更新的passage列表
     * @param replaceForce 强制覆盖而不提示警告
     */
    updatePassageDataMany(pd: PassageDataItem[], replaceForce: boolean = false) {
        const tt = this.pSC2DataManager.getSC2DataInfoAfterPatch();
        const ti = new SC2DataInfo(this.getLogger(), 'temp');
        ti.passageDataItems.items = pd;
        ti.passageDataItems.fillMap();

        let nt;
        if (replaceForce) {
            nt = replaceMergeSC2DataInfoCacheForce(tt, ti);
        } else {
            nt = replaceMergeSC2DataInfoCache(tt, ti);
        }

        this.pSC2DataManager.rePlacePassage(
            tt.passageDataNodes,
            nt.passageDataItems.items.map(item => {
                return this.pSC2DataManager.makePassageNode(item);
            }),
        );

        return this.pSC2DataManager.flushAfterPatchCache();
    }

    // /**
    //  * 批量更新passage数据，如果存在则覆盖，如果不存在则创建
    //  * @param pd 需要更新的passage列表
    //  * @param oldSC2Data 被更新的passage列表
    //  */
    // updatePassageDataManyEarly(pd: PassageDataItem[], oldSC2Data: SC2DataInfoCache) {
    //     const ti = new SC2DataInfo(this.getLogger(), 'temp');
    //     ti.passageDataItems.items = pd;
    //     ti.passageDataItems.fillMap();
    //
    //     this.pSC2DataManager.rePlacePassage(
    //         oldSC2Data.passageDataNodes,
    //         ti.passageDataItems.items.map(item => {
    //             return this.pSC2DataManager.makePassageNode(item);
    //         }),
    //     );
    //
    //     this.pSC2DataManager.flushAfterPatchCache();
    //     this.pSC2DataManager.earlyResetSC2DataInfoCache();
    // }

    replaceFollowSC2DataInfo(newSC2Data: SC2DataInfo, oldSC2DataCache: SC2DataInfoCache) {

        const newScriptNode = this.pSC2DataManager.makeScriptNode(newSC2Data);

        const newStyleNode = this.pSC2DataManager.makeStyleNode(newSC2Data);

        const newPassageDataNode = newSC2Data.passageDataItems.items.map(T => {
            return this.pSC2DataManager.makePassageNode(T);
        });

        const rootNode = this.pSC2DataManager.rootNode;

        // remove old
        for (const node of Array.from(oldSC2DataCache.styleNode)) {
            rootNode.removeChild(node);
        }
        for (const node of Array.from(oldSC2DataCache.scriptNode)) {
            rootNode.removeChild(node);
        }
        for (const node of Array.from(oldSC2DataCache.passageDataNodes)) {
            rootNode.removeChild(node);
        }

        // console.log('replaceFollowSC2DataInfo() newScriptNode', newScriptNode);
        // console.log('replaceFollowSC2DataInfo() newStyleNode', newStyleNode);
        // console.log('replaceFollowSC2DataInfo() newPassageDataNode', newPassageDataNode);

        // add new
        rootNode.appendChild(newScriptNode);
        rootNode.appendChild(newStyleNode);
        for (const node of newPassageDataNode) {
            rootNode.appendChild(node);
        }

        // update cache
        this.pSC2DataManager.flushAfterPatchCache();

        // console.log('replaceFollowSC2DataInfo() done', this.pSC2DataManager.getSC2DataInfoAfterPatch());

    }

    /**
     * 更新passage数据，如果存在则覆盖，如果不存在则创建
     * @param name passageName
     * @param content passageContent
     * @param tags passageTags [] OR ['widget']
     * @param pid passagePid 默认是 0 ， 如果不是故意覆盖已有的passage那么就填 0 即可
     * @deprecated use `CodeExample/how-to-modify-sc2data.ts` instead
     */
    updatePassageData(
        name: string,
        content: string,
        // tags = ['widget'] if it's a widget
        tags: string[] = [],
        pid: undefined | number = 0,
    ) {
        console.warn('updatePassageData() is deprecated, use `CodeExample/how-to-modify-sc2data.ts` instead');
        const rootNode = this.pSC2DataManager.rootNode;
        const passageDataNodeList = this.pSC2DataManager.passageDataNodeList;

        // remove old
        passageDataNodeList.find(T => T.getAttribute('name') === name)?.remove();

        const node = this.thisWin.document.createElement('tw-passagedata');
        if (pid && ((isInteger(pid) && pid > 0) || isString(pid))) {
            node.setAttribute('pid', '' + pid);
        }
        node.setAttribute('name', name);
        node.setAttribute('tags', tags?.join(' ') || '');
        // s.innerText = `:: Widgets ${T.name}${T.tags?.length > 0 ? ` [${T.tags.join(' ')}]` : ''}\n${T.content}\n`;
        node.textContent = content;
        rootNode.appendChild(node);

        this.pSC2DataManager.flushAfterPatchCache();
    }

    /**
     * 从一个twee文件中分离出多个passage，工具函数
     * @param fileString 文件内容字符串
     */
    splitPassageFromTweeFile(fileString: string): Twee2PassageR[] {
        return Twee2Passage(fileString);
    }

    /**
     * 获取mod冲突及覆盖的计算结果，可获知mod之间是否有互相覆盖的情况，如果没有mod则返回空数组
     *
     * 注意，此处只能获取模拟计算mod添加的文件互相的冲突关系，且不包含mod的js动态修改的内容，实际结果可能与这里不一致，
     *
     * @return { mod: SC2DataInfo, result: SimulateMergeResult }[]
     *              mod    mod添加的内容，其中 dataSource 是 modName
     *              result 覆盖结果，其中的 ResultItem[conflict] (Set<string>) 就是互相覆盖的部分的名字（passageName或js/css文件名）
     */
    getModConflictInfo(): { mod: SC2DataInfo, result: SimulateMergeResult }[] {
        return this.pSC2DataManager.getConflictResult() || [];
    }

    /**
     * 将字符串对正则表达式转义，用于直接将字符串用在正则表达式匹配前的消毒处理
     * @param pattern   需要转义的字符串
     * @return string   转义后的字符串
     */
    escapedPatternString(pattern: string): string {
        return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 尝试在指定位置附近替换字符串
     * @param content       原始字符串
     * @param searchString  需要查找的字符串
     * @param replaceString     需要替换的字符串
     * @param positionHint      查找的位置
     * @param tolerance1        第一阶快速查找容差 见 @ref tryStringSearch
     * @param tolerance2Negative    第二阶正则查找（负方向）容差 见 @ref tryStringSearch
     * @param tolerance2Positive    第二阶正则查找（正方向）容差 见 @ref tryStringSearch
     * @return  string  替换后的字符串
     */
    tryStringReplace(content: string,
                     searchString: string,
                     replaceString: string,
                     positionHint: number,
                     tolerance1: number = 0,
                     tolerance2Negative: number = 0,
                     tolerance2Positive: number = 0,
    ): string {
        let s = content;
        const to = replaceString;
        const pStart = this.tryStringSearch(
            content,
            searchString,
            positionHint,
            tolerance1,
            tolerance2Negative,
            tolerance2Positive,
        );
        if (pStart) {
            s = s.substring(0, pStart) + to + s.substring(pStart + s.length);
        } else {
            console.warn('tryStringReplace() cannot find',
                [[content], [searchString], [replaceString], positionHint, tolerance1, tolerance2Negative, tolerance2Positive]);
        }
        return s;
    }

    /**
     * 尝试在指定位置附近查找字符串
     * @param content  原始字符串
     * @param searchString  需要查找的字符串
     * @param positionHint  查找的位置
     * @param tolerance1    第一阶快速查找容差，（常数字符串比对），如果为0则不使用。此方法可在正负tolerance1个位置范围下查找
     * @param tolerance2Negative    第二阶正则查找（负方向）容差，（正则字符串比对）。
     * @param tolerance2Positive    第二阶正则查找（正方向）容差，（正则字符串比对）。如果正负都为0则不使用。此方法可在正负tolerance2Negative个位置范围下查找。
     * @return  number  查找到的位置，如果没有找到则返回undefined
     */
    tryStringSearch(content: string,
                    searchString: string,
                    positionHint: number,
                    tolerance1: number = 0,
                    tolerance2Negative: number = 0,
                    tolerance2Positive: number = 0,
    ): number | undefined {
        let s = content;
        const from = searchString;
        const pos = positionHint;
        if (s.substring(pos, pos + from.length) === from) {
            return pos;
        }
        if (tolerance1 > 0) {
            for (let i = pos - tolerance1; i <= pos + tolerance1; i++) {
                if (s.substring(i, i + from.length) === from) {
                    return i;
                }
            }
        }
        if (tolerance2Negative !== 0 || tolerance2Positive !== 0) {
            try {
                let re: RegExp | undefined = new RegExp(this.escapedPatternString(from), '');
                // re.lastIndex = pos;
                const startPos = Math.max(0, pos - tolerance2Negative);
                const endPos = Math.min(s.length, pos + from.length + tolerance2Positive);
                const mm = re.exec(s.substring(startPos, endPos));
                if (mm) {
                    const pStart = startPos + mm.index;
                    const pEnd = pStart + from.length;
                    // s = s.substring(0, pStart) + to + s.substring(pEnd);
                    return pStart;
                }
                re = undefined;
                return undefined;
            } catch (e) {
                console.error(e);
            }
        }
        return undefined;
    }

    /**
     * 在指定位置插入字符串
     * @param content  原始字符串
     * @param insertString  需要插入的字符串
     * @param position  插入的位置
     * @return string   插入后的字符串
     */
    insertStringInPosition(content: string, insertString: string, position: number): string {
        return content.slice(0, position) + insertString + content.slice(position);
    }

    getLodash() {
        return _;
    }

    getModLoadController(): ModLoadController {
        return this.pSC2DataManager.getModLoadController();
    }

    getModLoader(): ModLoader {
        return this.pSC2DataManager.getModLoader();
    }

    getAddonPluginManager(): AddonPluginManager {
        return this.pSC2DataManager.getAddonPluginManager();
    }

    getLogger(): LogWrapper {
        return this.getModLoadController().getLog();
    }

    async lazyRegisterNewModZipData(data: ArgumentTypes<typeof JSZip.loadAsync>[0], options?: JSZip.JSZipLoadOptions) {
        console.log('lazyRegisterNewModZipData', data);
        try {
            const zip = await JSZip.loadAsync(data, options);
            return await this.pSC2DataManager.getModLoader().lazyRegisterNewMod(zip);
        } catch (e: Error | any) {
            console.error(e);
            this.getLogger().error(`lazyRegisterNewMod() error:[${e?.message ? e.message : e}]`);
            return false;
        }
    }

    getNowRunningModName(): string | undefined {
        return this.pSC2DataManager.getJsPreloader().runningMod.peek();
    }

    getSemVerTools() {
        return new SemVerToolsType();
    }

    getModZipReaderStaticClassRef = getModZipReaderStaticClassRef;

    async getImage(imagePath: string): Promise<string | undefined> {
        const imageBase64String = await this.pSC2DataManager.getHtmlTagSrcHook().requestImageBySrc(imagePath);
        return imageBase64String;
    }

    getLanguageManager() {
        return this.pSC2DataManager.getLanguageManager();
    }

    getNowMainLanguage(): 'en' | 'zh' | string {
        return this.getLanguageManager().mainLanguage;
    }

    getIdbKeyValRef() {
        return new IdbKeyValRef();
    }

    getIdbRef() {
        return new IdbRef();
    }

    /**
     *
     * const modAddonPluginsParams = window.modUtils.getAddonParamsFromModInfo(modInfo, 'BeautySelectorAddon', 'BeautySelectorAddon');
     *
     * @param modInfo   params 2 of registerMod callback
     * @param addonPluginModName params 1 of registerAddonPlugin
     * @param addonName  params 2 of registerAddonPlugin
     */
    getAddonParamsFromModInfo<P>(modInfo: ModInfo, addonPluginModName: string, addonName: string): P | undefined;
    getAddonParamsFromModInfo(modInfo: ModInfo, addonPluginModName: string, addonName: string): ModBootJsonAddonPlugin['params'] | undefined ;
    getAddonParamsFromModInfo<P extends any>(modInfo: ModInfo, addonPluginModName: string, addonName: string): P | ModBootJsonAddonPlugin['params'] | undefined {
        return modInfo?.bootJson?.addonPlugin?.find(T => T.modName === addonPluginModName && T.addonName === addonName)?.params;
    }

}

// https://stackoverflow.com/questions/51851677/how-to-get-argument-types-from-function-in-typescript
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
