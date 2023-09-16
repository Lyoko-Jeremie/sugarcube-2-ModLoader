import {SC2DataManager} from "./SC2DataManager";
import {ModUtils} from "./Utils";

export class JsPreloader {
    constructor(
        public pSC2DataManager: SC2DataManager,
        public modUtils: ModUtils,
    ) {
    }

    async startLoad(): Promise<any> {
        console.log('ModLoader ====== JsPreloader startLoad() start');
        // keep orginSC2DataInfoCache valid, keep it have the unmodified vanilla data
        this.pSC2DataManager.getSC2DataInfoCache();
        for (const modName of this.modUtils.getModListName()) {
            const mod = this.modUtils.getMod(modName);
            if (!mod) {
                console.error('ModLoader ====== JsPreloader startLoad() mod not found: ', modName);
                return;
            }
            for (const T of mod.scriptFileList_preload) {
                console.log('ModLoader ====== JsPreloader startLoad() excute start: ', [T[0]]);
                try {
                    const R = await Function(`return ${T[1]}`)();
                    console.log('ModLoader ====== JsPreloader startLoad() excute result: ', [T[0]], R);
                } catch (e) {
                    console.error('ModLoader ====== JsPreloader startLoad() excute error: ', [T[0]], e);
                }
                console.log('ModLoader ====== JsPreloader startLoad() excute end: ', [T[0]]);
            }
        }
    }
}

