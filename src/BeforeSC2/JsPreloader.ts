import {SC2DataManager} from "./SC2DataManager";
import {ModUtils} from "./Utils";

export class JsPreloader {
    constructor(
        public pSC2DataManager: SC2DataManager,
        public modUtils: ModUtils,
        public thisWin: Window,
    ) {
    }

    startLoadCalled = false;

    async startLoad(): Promise<any> {
        if (this.startLoadCalled) {
            console.warn('ModLoader ====== JsPreloader startLoad() already called');
            return;
        }
        this.startLoadCalled = true;
        console.log('ModLoader ====== JsPreloader startLoad() start');
        // keep originSC2DataInfoCache valid, keep it have the unmodified vanilla data
        this.pSC2DataManager.initSC2DataInfoCache();
        for (const modName of this.modUtils.getModListName()) {
            const mod = this.modUtils.getMod(modName);
            if (!mod) {
                console.error('ModLoader ====== JsPreloader startLoad() mod not found: ', modName);
                return;
            }
            for (const T of mod.scriptFileList_preload) {
                console.log('ModLoader ====== JsPreloader startLoad() excute start: ', [T[0]]);
                await this.pSC2DataManager.getModLoadController().Load_start(modName, T[0]);
                const log = this.pSC2DataManager.getModLoadController().getLog();
                try {
                    // const R = await Function(`return ${T[1]}`)();
                    const R = await JsPreloader.JsRunner(
                        T[1],
                        T[0],
                        modName,
                        'JsPreloader',
                        this.pSC2DataManager,
                        this.thisWin,
                    );
                    console.log('ModLoader ====== JsPreloader startLoad() excute result: ', [T[0]], R);
                } catch (e: any | Error) {
                    console.error('ModLoader ====== JsPreloader startLoad() excute error: ', [T[0]], e);
                    log.error(`ModLoader ====== JsPreloader startLoad() excute error: [${T[0]} ${e?.message ? e.message : e}]`);
                }
                console.log('ModLoader ====== JsPreloader startLoad() excute end: ', [T[0]]);
                await this.pSC2DataManager.getModLoadController().Load_end(modName, T[0]);
            }
        }
        console.log('ModLoader ====== JsPreloader startLoad() clean');
        this.pSC2DataManager.cleanAllCacheAfterModLoadEnd();
        console.log('ModLoader ====== JsPreloader startLoad() end');
        this.pSC2DataManager.getPassageTracer().init();
        this.pSC2DataManager.getSc2EventTracer().init();
        this.pSC2DataManager.getModLoadController().logInfo('ModLoader ====== ModLoader Start End. To Start SugarCube2 Engine.....');
        await this.pSC2DataManager.getModLoadController().ModLoaderLoadEnd();
    }

    static async JsRunner(content: string, name: string, modName: string, stage: string, pSC2DataManager: SC2DataManager, thisWin: Window) {
        const script = thisWin.document.createElement('script');

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
                thisWin.document.removeEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
                thisWin.document.removeEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
                resolve(EV.detail.R);
            };
            const ce = (EV: any) => {
                // console.log('ModLoader ====== JsRunner ${name} ${modName} ${stage} error', EV);
                thisWin.document.removeEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
                thisWin.document.removeEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
                reject(EV.detail.E);
            };
            thisWin.document.addEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
            thisWin.document.addEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
        });

        console.log(`ModLoader ====== JsRunner ${name} ${modName} ${stage} start`);
        if (pSC2DataManager) {
            // insert before SC2 data rootNode
            pSC2DataManager?.rootNode.before(script);
        } else {
            // or insert to head
            console.warn('ModLoader ====== JsRunner() pSC2DataManager is undefined, insert to head');
            thisWin.document.head.appendChild(script);
        }

        return p;
    }

}

