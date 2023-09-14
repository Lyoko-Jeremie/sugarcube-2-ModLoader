import {SC2DataInfo, SC2DataInfoCache} from './SC2DataInfoCache';
import {ModDataLoadType, ModInfo, ModLoader} from "./ModLoader";
import {cloneDeep} from "lodash";
import {
    concatMergeSC2DataInfoCache,
    normalMergeSC2DataInfoCache,
    replaceMergeSC2DataInfoCache
} from "./MergeSC2DataInfoCache";

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


    orginSC2DataInfoCache?: SC2DataInfoCache;

    getSC2DataInfoCache() {
        if (!this.orginSC2DataInfoCache) {
            this.orginSC2DataInfoCache = new SC2DataInfoCache(
                'orgin',
                Array.from(this.scriptNode),
                Array.from(this.styleNode),
                Array.from(this.passageDataNodeList) as HTMLElement[],
            );
        }
        return this.orginSC2DataInfoCache;
    }

    modLoader?: ModLoader;

    getModLoader() {
        if (!this.modLoader) {
            this.modLoader = new ModLoader(this.getSC2DataInfoCache());
        }
        return this.modLoader;
    }


    async startInit() {
        await this.getModLoader().loadMod([ModDataLoadType.Remote, ModDataLoadType.Local]);
        const confictResult = this.getModLoader().checkModConfictList();
        console.log('mod confictResult', confictResult.map(T => {
            return {
                name: T.mod.dataSource,
                style: Array.from(T.result.styleFileItems.conflict),
                script: Array.from(T.result.scriptFileItems.conflict),
                passage: Array.from(T.result.passageDataItems.conflict),
            };
        }));
        this.patchModToGame();
    }

    patchModToGame() {
        const modCache = this.getModLoader().modCache;
        const modOrder = this.getModLoader().modOrder;
        const orginSC2DataInfoCache = cloneDeep(this.getSC2DataInfoCache());

        // concat mod
        const em = normalMergeSC2DataInfoCache(
            new SC2DataInfo('EmptyMod'),
            ...modOrder.map(T => modCache.get(T))
                .filter((T): T is ModInfo => !!T)
                .map(T => T.cache)
        );

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

        // then replace orgin
        const modSC2DataInfoCache = replaceMergeSC2DataInfoCache(
            orginSC2DataInfoCache,
            em,
        );

        const newScriptNode = modSC2DataInfoCache.scriptFileItems.items.map(T => {
            const s = document.createElement('script');
            s.type = 'text/twine-javascript';
            s.role = 'script';
            s.id = 'twine-user-script';
            s.innerText = T.content;
            return s;
        });
        const newStyleNode = modSC2DataInfoCache.styleFileItems.items.map(T => {
            const s = document.createElement('style');
            s.type = 'text/twine-css';
            s.id = 'twine-user-stylesheet';
            s.role = 'stylesheet';
            s.innerText = T.content;
            return s;
        });
        const newPassageDataNode = modSC2DataInfoCache.passageDataItems.items.map(T => {
            const s = document.createElement('tw-passagedata');
            if (T.id && T.id > 0) {
                s.setAttribute('pid', '' + T.id);
            }
            s.setAttribute('name', T.name);
            s.setAttribute('tags', T.tags.join(' '));
            if (T.position) {
                s.setAttribute('position', T.position);
            }
            if (T.size) {
                s.setAttribute('size', T.size);
            }
            s.innerText = T.content;
            return s;
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
        for (const node of newStyleNode) {
            rootNode.appendChild(node);
        }
        for (const node of newScriptNode) {
            rootNode.appendChild(node);
        }
        for (const node of newPassageDataNode) {
            rootNode.appendChild(node);
        }
    }

}
