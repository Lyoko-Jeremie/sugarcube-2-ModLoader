import {SC2DataInfoCache} from './SC2DataInfoCache';
import {ModLoader} from "./ModLoader";

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

}
