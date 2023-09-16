import {PassageDataItem, SC2DataInfo, SC2DataInfoCache} from './SC2DataInfoCache';
import {ModDataLoadType, ModInfo, ModLoader} from "./ModLoader";
import {cloneDeep} from "lodash";
import {
    concatMergeSC2DataInfoCache,
    normalMergeSC2DataInfoCache,
    replaceMergeSC2DataInfoCache
} from "./MergeSC2DataInfoCache";
import {SimulateMergeResult} from "./SimulateMerge";

export class SC2DataManager {

    get rootNode() {
        return document.getElementsByTagName('tw-storydata')[0];
    }

    get styleNode() {
        return this.rootNode.getElementsByTagName('style');
    }

    get scriptNode() {
        return this.rootNode.getElementsByTagName('script');
    }

    get passageDataNodeList() {
        return Array.from(this.rootNode.getElementsByTagName('tw-passagedata'));
    }

    checkSC2Data() {
        const rNodes = document.getElementsByTagName('tw-storydata');
        if (!rNodes) {
            console.error('checkSC2Data() (!rNodes)');
            return false;
        }
        if (rNodes.length !== 1) {
            console.error('checkSC2Data() (rNodes.length !== 1)');
            return false;
        }
        const rNode = rNodes[0];
        const stNodes = rNode.getElementsByTagName('style');
        if (!stNodes) {
            console.error('checkSC2Data() (!stNodes)');
            return false;
        }
        if (stNodes.length !== 1) {
            console.error('checkSC2Data() (stNodes.length !== 1)');
            return false;
        }
        const stNode = stNodes[0];
        const scNodes = rNode.getElementsByTagName('script');
        if (!scNodes) {
            console.error('checkSC2Data() (!scNodes)');
            return false;
        }
        if (scNodes.length !== 1) {
            console.error('checkSC2Data() (scNodes.length !== 1)');
            return false;
        }
        const passageDataNodes = rNode.getElementsByTagName('tw-storydata');
        if (!passageDataNodes) {
            console.error('checkSC2Data() (!passageDataNodes)');
            return false;
        }
        if (passageDataNodes.length < 1) {
            console.error('checkSC2Data() (passageDataNodes.length < 1)');
            return false;
        }
        const nn = Array.from(rNode.childNodes).map((T) => T.nodeName).filter(T => T.toUpperCase() !== 'TW-PASSAGEDATA');
        if (nn.length !== 2) {
            console.warn('checkSC2Data() (nn.length !== 2) some addtion unkown node in tw-storydata');
        }
        return true;
    }

    createNewSC2DataInfoFromNow(): SC2DataInfo {
        return new SC2DataInfoCache(
            'orgin',
            Array.from(this.scriptNode),
            Array.from(this.styleNode),
            Array.from(this.passageDataNodeList) as HTMLElement[],
        );
    }

    /**
     * 用于缓存原始的没有经过任何修改的原始的原版SC2Data
     * never set it to undefined OR overwrite it
     * @private
     */
    private orginSC2DataInfoCache?: SC2DataInfoCache;

    earlyResetSC2DataInfoCache() {
        // keep orginSC2DataInfoCache valid
        this.getSC2DataInfoCache();
        // this.orginSC2DataInfoCache = undefined;
        // this.getSC2DataInfoCache();
        this.flushAfterPatchCache();
    }

    /**
     * 读取原始的没有被修改过的SC2Data，
     * 对于mod来说，如无必要不要使用这里的数据，
     * 特别是合并时不要使用此处的数据作为数据源，而是使用 getSC2DataInfoAfterPatch()，否则会覆盖之前的mod的修改，导致之前的修改无效
     */
    getSC2DataInfoCache() {
        if (!this.orginSC2DataInfoCache) {
            this.orginSC2DataInfoCache = new SC2DataInfoCache(
                'orgin',
                Array.from(this.scriptNode),
                Array.from(this.styleNode),
                Array.from(this.passageDataNodeList) as HTMLElement[],
            );
        }
        console.log('getSC2DataInfoCache() this.orginSC2DataInfoCache', this.orginSC2DataInfoCache);
        return this.orginSC2DataInfoCache;
    }

    private modLoader?: ModLoader;

    getModLoader() {
        if (!this.modLoader) {
            this.modLoader = new ModLoader(this);
        }
        return this.modLoader;
    }


    private confictResult?: { mod: SC2DataInfo, result: SimulateMergeResult }[];

    async startInit() {
        await this.getModLoader().loadMod([ModDataLoadType.Remote, ModDataLoadType.Local]);
        this.confictResult = this.getModLoader().checkModConfictList();
        console.log('mod confictResult', this.confictResult.map(T => {
            return {
                name: T.mod.dataSource,
                style: Array.from(T.result.styleFileItems.conflict),
                script: Array.from(T.result.scriptFileItems.conflict),
                passage: Array.from(T.result.passageDataItems.conflict),
            };
        }));
        this.patchModToGame();
    }

    getConfictResult() {
        return this.confictResult;
    }

    private cSC2DataInfoAfterPatchCache?: SC2DataInfoCache;

    /**
     * 获取最新的SC2Data，此处获得的是之前的mod修改后的最新的SC2Data数据，
     * 此处使用了缓存，如果修改了SC2Data，请调用 flushAfterPatchCache() 来清除缓存，重新从html中读取最新的SC2Data
     */
    getSC2DataInfoAfterPatch() {
        // keep orginSC2DataInfoCache valid
        this.getSC2DataInfoCache();
        if (!this.cSC2DataInfoAfterPatchCache) {
            this.cSC2DataInfoAfterPatchCache = new SC2DataInfoCache(
                'orgin',
                Array.from(this.scriptNode),
                Array.from(this.styleNode),
                Array.from(this.passageDataNodeList) as HTMLElement[],
            );
        }
        return this.cSC2DataInfoAfterPatchCache;
    }

    flushAfterPatchCache() {
        this.cSC2DataInfoAfterPatchCache = undefined;
        this.getSC2DataInfoAfterPatch();
    }

    patchModToGame() {
        const modCache = this.getModLoader().modCache;
        const modOrder = this.getModLoader().modOrder;
        this.cSC2DataInfoAfterPatchCache = undefined;
        const orginSC2DataInfoCache = cloneDeep(this.getSC2DataInfoAfterPatch());
        // console.log('modCache', modCache);

        // concat mod
        console.log('concat mod');
        const em = normalMergeSC2DataInfoCache(
            new SC2DataInfo('EmptyMod'),
            ...modOrder.map(T => modCache.get(T))
                .filter((T): T is ModInfo => !!T)
                .map(T => T.cache)
        );
        console.log('em', em);

        // replace orgin img
        for (const imgRPath of this.getModLoader().getModImgFileReplaceList()) {
            em.passageDataItems.items.forEach(T => {
                T.content = T.content.replace(imgRPath[0], imgRPath[1]);
            });
            em.styleFileItems.items.forEach(T => {
                T.content = T.content.replace(imgRPath[0], imgRPath[1]);
            });
            em.scriptFileItems.items.forEach(T => {
                T.content = T.content.replace(imgRPath[0], imgRPath[1]);
            });
        }

        // console.log('orginSC2DataInfoCache', orginSC2DataInfoCache.passageDataItems.items.length);
        // then replace orgin
        const modSC2DataInfoCache = replaceMergeSC2DataInfoCache(
            orginSC2DataInfoCache,
            em,
        );
        // console.log('modSC2DataInfoCache', modSC2DataInfoCache.passageDataItems.items.length);

        const newScriptNode = this.makeScriptNode(modSC2DataInfoCache);

        const newStyleNode = this.makeStyleNode(modSC2DataInfoCache);

        // console.log('modSC2DataInfoCache.passageDataItems.items', modSC2DataInfoCache.passageDataItems.items);

        const newPassageDataNode = modSC2DataInfoCache.passageDataItems.items.map(T => {
            return this.makePassageNode(T);
        });

        const rootNode = this.rootNode;
        const styleNode = this.styleNode;
        const scriptNode = this.scriptNode;
        const passageDataNodeList = this.passageDataNodeList;

        // remove old
        for (const node of Array.from(styleNode)) {
            rootNode.removeChild(node);
        }
        for (const node of Array.from(scriptNode)) {
            rootNode.removeChild(node);
        }
        for (const node of Array.from(passageDataNodeList)) {
            rootNode.removeChild(node);
        }

        // add new
        rootNode.appendChild(newScriptNode);
        rootNode.appendChild(newStyleNode);
        for (const node of newPassageDataNode) {
            rootNode.appendChild(node);
        }

        // update cache
        this.flushAfterPatchCache();
    }

    makePassageNode(T: PassageDataItem) {
        const s = document.createElement('tw-passagedata');
        if (T.id && T.id > 0) {
            s.setAttribute('pid', '' + T.id);
        }
        s.setAttribute('name', T.name);
        // console.log('tags', T.tags);
        s.setAttribute('tags', T.tags?.join(' ') || '');
        if (T.position) {
            s.setAttribute('position', T.position);
        }
        if (T.size) {
            s.setAttribute('size', T.size);
        }
        // s.innerText = `:: Widgets ${T.name}${T.tags?.length > 0 ? ` [${T.tags.join(' ')}]` : ''}\n${T.content}\n`;
        s.innerText = T.content;
        return s;
    }

    makeStyleNode(sc: SC2DataInfo) {
        const newStyleNodeContent = sc.styleFileItems.items.reduce((acc, T) => {
            return acc + `/* twine-user-stylesheet #${T.id}: "${T.name}" */\n${T.content}\n`;
        }, '');
        const newStyleNode = document.createElement('style');
        newStyleNode.setAttribute('type', 'text/twine-css');
        newStyleNode.setAttribute('role', 'stylesheet');
        newStyleNode.setAttribute('id', 'twine-user-stylesheet');
        newStyleNode.innerHTML = newStyleNodeContent;
        return newStyleNode;
    }

    makeScriptNode(sc: SC2DataInfo) {
        const newScriptNodeContent = sc.scriptFileItems.items.reduce((acc, T) => {
            return acc + `/* twine-user-script #${T.id}: "${T.name}" */\n${T.content}\n`;
        }, '');
        const newScriptNode = document.createElement('script');
        newScriptNode.setAttribute('type', 'text/twine-javascript');
        newScriptNode.setAttribute('role', 'script');
        newScriptNode.setAttribute('id', 'twine-user-script');
        newScriptNode.innerHTML = newScriptNodeContent;
        return newScriptNode;
    }

    rePlacePassage(toRemovePassageDataNodeList: Element[], toAddPassageDataNodeList: Element[],) {
        console.log('rePlacePassage()', toRemovePassageDataNodeList, toAddPassageDataNodeList);
        const rootNode = this.rootNode;
        console.log('rePlacePassage() rootNode', rootNode);
        for (const node of toRemovePassageDataNodeList) {
            const rn = rootNode.removeChild(node);
            if (!rn) {
                console.log('rePlacePassage() (!rn)', [node]);
            }
        }
        for (const node of toAddPassageDataNodeList) {
            const an = rootNode.appendChild(node);
            if (!an) {
                console.log('rePlacePassage() (!an)', [node]);
            }
        }
    }

}
