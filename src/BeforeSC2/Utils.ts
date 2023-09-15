import {SC2DataManager} from "./SC2DataManager";
import {isSafeInteger} from "lodash";
import {Twee2Passage, Twee2PassageR} from "./ModZipReader";
import {PassageDataItem, SC2DataInfo, SC2DataInfoCache} from "./SC2DataInfoCache";
import {SimulateMergeResult} from "./SimulateMerge";
import {replaceMergeSC2DataInfoCache, replaceMergeSC2DataInfoCacheForce} from "./MergeSC2DataInfoCache";

export class ModUtils {
    constructor(
        public pSC2DataManager: SC2DataManager,
    ) {
    }

    /**
     * 获取所有mod的名字
     * 以mod加载顺序为序
     */
    getModListName() {
        return this.pSC2DataManager.getModLoader().modOrder;
    }

    /**
     * 获取指定mod的信息
     * @param name ModName
     * @return ModInfo | undefined
     */
    getMod(name: string) {
        return this.pSC2DataManager.getModLoader().modCache.get(name);
    }

    /**
     * 获取指定Passage的信息
     * @param name PassageName
     * @return PassageDataItem | undefined
     */
    getPassageData(name: string) {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get(name);
    }

    /**
     * 获取所有Passage的信息
     * @return PassageDataItem[]
     */
    getAllPassageData() {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.items;
    }

    /**
     * 获取当前最新的SC2DataInfo，其中存储了所有SC2引擎的数据，包括js/css/passage
     * @return SC2DataInfo
     */
    createNewSC2DataInfoFromNow() {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch();
    }

    /**
     * 批量更新passage数据，如果存在则覆盖，如果不存在则创建
     * @param pd 需要更新的passage列表
     * @param replaceForce 强制覆盖而不提示警告
     */
    updatePassageDataMany(pd: PassageDataItem[], replaceForce: boolean = false) {
        const tt = this.pSC2DataManager.getSC2DataInfoAfterPatch();
        const ti = new SC2DataInfo('temp');
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

    /**
     * 批量更新passage数据，如果存在则覆盖，如果不存在则创建
     * @param pd 需要更新的passage列表
     * @param replaceForce 强制覆盖而不提示警告
     */
    updatePassageDataManyEarly(pd: PassageDataItem[], oldSC2Data: SC2DataInfoCache) {
        const ti = new SC2DataInfo('temp');
        ti.passageDataItems.items = pd;
        ti.passageDataItems.fillMap();

        this.pSC2DataManager.rePlacePassage(
            oldSC2Data.passageDataNodes,
            ti.passageDataItems.items.map(item => {
                return this.pSC2DataManager.makePassageNode(item);
            }),
        );

        this.pSC2DataManager.flushAfterPatchCache();
        this.pSC2DataManager.earlyResetSC2DataInfoCache();
    }

    /**
     * 更新passage数据，如果存在则覆盖，如果不存在则创建
     * @param name passageName
     * @param content passageContent
     * @param tags passageTags [] OR ['widget']
     * @param pid passagePid 默认是 0 ， 如果不是故意覆盖已有的passage那么就填 0 即可
     */
    updatePassageData(
        name: string,
        content: string,
        // tags = ['widget'] if it's a widget
        tags: string[] = [],
        pid: undefined | number = 0,
    ) {
        const rootNode = this.pSC2DataManager.rootNode;
        const passageDataNodeList = this.pSC2DataManager.passageDataNodeList;

        // remove old
        passageDataNodeList.find(T => T.getAttribute('name') === name)?.remove();

        const node = document.createElement('tw-passagedata');
        if (pid && isSafeInteger(pid) && pid > 0) {
            node.setAttribute('pid', '' + pid);
        }
        node.setAttribute('name', name);
        node.setAttribute('tags', tags?.join(' ') || '');
        // s.innerText = `:: Widgets ${T.name}${T.tags?.length > 0 ? ` [${T.tags.join(' ')}]` : ''}\n${T.content}\n`;
        node.innerText = content;
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
    getModConfictInfo(): { mod: SC2DataInfo, result: SimulateMergeResult }[] {
        return this.pSC2DataManager.getConfictResult() || [];
    }

}
