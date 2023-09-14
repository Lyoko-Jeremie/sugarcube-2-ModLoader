import {SC2DataManager} from "./SC2DataManager";
import {ModUtils} from "./Utils";

export class JsPreloader {
    constructor(
        public pSC2DataManager: SC2DataManager,
        public modUtils: ModUtils,
    ) {
    }

    startLoad() {
        this.modUtils.getModListName().forEach(modName => {
            const mod = this.modUtils.getMod(modName);
            if (!mod) {
                console.error('JsPreloader startLoad() mod not found: ', modName);
                return;
            }
            mod.scriptFileList_perload.forEach(T => {
                console.log('JsPreloader startLoad() excute start: ', [T[0]]);
                try {
                    Function(T[1])();
                } catch (e) {
                    console.error('JsPreloader startLoad() excute error: ', [T[0]], e);
                }
                console.log('JsPreloader startLoad() excute end: ', [T[0]]);
            });
        });
    }
}

