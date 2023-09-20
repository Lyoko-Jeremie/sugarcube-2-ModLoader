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
                    // const R = await Function(`return ${T[1]}`)();
                    const R = await JsPreloader.JsRunner(T[1], T[0], modName, 'JsPreloader', this.pSC2DataManager);
                    console.log('ModLoader ====== JsPreloader startLoad() excute result: ', [T[0]], R);
                } catch (e) {
                    console.error('ModLoader ====== JsPreloader startLoad() excute error: ', [T[0]], e);
                }
                console.log('ModLoader ====== JsPreloader startLoad() excute end: ', [T[0]]);
            }
        }
        console.log('ModLoader ====== JsPreloader startLoad() clean');
        this.pSC2DataManager.cleanAllCacheAfterModLoadEnd();
        console.log('ModLoader ====== JsPreloader startLoad() end');
    }

    static async JsRunner(content: string, name: string, modName: string, stage: string, pSC2DataManager: SC2DataManager) {
        const script = document.createElement('script');

        script.innerHTML = `(async () => {return ${content}\n})()
        .then((R)=>{
         console.log('ModLoader ====== JsRunner ${name} ${modName} ${stage} end');
         document.dispatchEvent(new CustomEvent('${
            `JsRunner:ok:${stage}-${modName}-${name}`
        }', {"detail":{"R":R}}));})
        .catch((e)=>{
         console.error('ModLoader ====== JsRunner ${name} ${modName} ${stage} error',e);
         document.dispatchEvent(new CustomEvent('${
            `JsRunner:error:${stage}-${modName}-${name}`
        }', {"detail":{"E":e}}));});`;

        script.setAttribute('scriptName', (name));
        script.setAttribute('modName', (modName));
        script.setAttribute('stage', (stage));
        const p = new Promise<any>((resolve, reject) => {
            const co = (EV: any) => {
                // console.log('ModLoader ====== JsRunner ${name} ${modName} ${stage} ok', EV);
                document.removeEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
                document.removeEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
                resolve(EV.detail.R);
            };
            const ce = (EV: any) => {
                // console.log('ModLoader ====== JsRunner ${name} ${modName} ${stage} error', EV);
                document.removeEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
                document.removeEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
                reject(EV.detail.E);
            };
            document.addEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
            document.addEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
        });

        console.log(`ModLoader ====== JsRunner ${name} ${modName} ${stage} start`);
        if (pSC2DataManager) {
            // insert before SC2 data rootNode
            pSC2DataManager?.rootNode.before(script);
        } else {
            // or insert to head
            console.warn('ModLoader ====== JsRunner() pSC2DataManager is undefined, insert to head');
            document.head.appendChild(script);
        }

        return p;
    }

}

