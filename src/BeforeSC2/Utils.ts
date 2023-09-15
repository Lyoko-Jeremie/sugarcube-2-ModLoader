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

    getModListName() {
        return this.pSC2DataManager.getModLoader().modOrder;
    }

    getMod(name: string) {
        return this.pSC2DataManager.getModLoader().modCache.get(name);
    }

    getPassageData(name: string) {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.map.get(name);
    }

    getAllPassageData(name: string) {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.items;
    }

    createNewSC2DataInfoFromNow() {
        return this.pSC2DataManager.getSC2DataInfoAfterPatch();
    }

    updatePassageDataMany(pd: PassageDataItem[], replaceForce: boolean = false) {
        const tt = this.pSC2DataManager.getSC2DataInfoAfterPatch();
        const ti = new SC2DataInfo('temp');
        ti.passageDataItems.items = pd;
        ti.passageDataItems.fillMap();

        if (replaceForce) {
            const nt = replaceMergeSC2DataInfoCacheForce(tt, ti);
        } else {
            const nt = replaceMergeSC2DataInfoCache(tt, ti);
        }

        this.pSC2DataManager.rePlacePassage(
            tt.passageDataNodes,
            ti.passageDataItems.items.map(item => {
                return this.pSC2DataManager.makePassageNode(item);
            }),
        );

    }

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

    splitPassageFromTweeFile(fileString: string): Twee2PassageR[] {
        return Twee2Passage(fileString);
    }

    getConfictInfo(): { mod: SC2DataInfo, result: SimulateMergeResult }[] {
        return this.pSC2DataManager.getConfictResult() || [];
    }

}
