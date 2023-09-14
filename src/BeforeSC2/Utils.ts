import {SC2DataManager} from "./SC2DataManager";
import {isSafeInteger} from "lodash";

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

    updatePassageData(
        name: string,
        content: string,
        // tags = ['widget'] if it's a widget
        tags: string[] = [],
        pid: undefined | number = undefined,
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

}
