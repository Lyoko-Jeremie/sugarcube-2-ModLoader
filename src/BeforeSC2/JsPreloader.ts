import {SC2DataManager} from "./SC2DataManager";
import {ModUtils} from "./Utils";
import {LogWrapper} from "./ModLoadController";

export class StackLike<T> {
    private _data: T[] = [];

    push(v: T) {
        this._data.push(v);
    }

    pop(): T | undefined {
        return this.empty ? undefined : this._data.pop();
    }

    peek(): T | undefined {
        return this.empty ? undefined : this._data[this._data.length - 1];
    }

    get length(): number {
        return this._data.length;
    }

    get data(): T[] {
        return this._data;
    }

    get empty(): boolean {
        return this._data.length === 0;
    }

    clear() {
        this._data = [];
    }

}

export class JsPreloader {
    logger: LogWrapper;

    constructor(
        public pSC2DataManager: SC2DataManager,
        public modUtils: ModUtils,
        public thisWin: Window,
    ) {
        this.logger = pSC2DataManager.getModLoadController().getLog();
    }

    startLoadCalled = false;

    async startLoad(): Promise<any> {
        if (this.startLoadCalled) {
            console.warn('ModLoader ====== JsPreloader startLoad() already called');
            this.logger.warn('ModLoader ====== JsPreloader startLoad() already called');
            return;
        }
        this.startLoadCalled = true;
        console.log('ModLoader ====== JsPreloader startLoad() start');
        this.logger.log('ModLoader ====== JsPreloader startLoad() start');
        // keep originSC2DataInfoCache valid, keep it have the unmodified vanilla data
        this.pSC2DataManager.initSC2DataInfoCache();
        for (const modName of this.modUtils.getModListName()) {
            const mod = this.modUtils.getMod(modName);
            if (!mod) {
                console.error('ModLoader ====== JsPreloader startLoad() mod not found: ', modName);
                this.logger.error(`ModLoader ====== JsPreloader startLoad() mod not found: [${modName}]`);
                return;
            }
            for (const T of mod.scriptFileList_preload) {
                console.log('ModLoader ====== JsPreloader startLoad() excute start: ', [T[0]]);
                this.logger.log(`ModLoader ====== JsPreloader startLoad() excute start: [${T[0]}]`);
                await this.pSC2DataManager.getModLoadController().Load_start(modName, T[0]);
                try {
                    // const R = await Function(`return ${T[1]}`)();
                    const R = await this.JsRunner(
                        T[1],
                        T[0],
                        modName,
                        'JsPreloader',
                        this.pSC2DataManager,
                        this.thisWin,
                        this.logger,
                    );
                    console.log('ModLoader ====== JsPreloader startLoad() excute result: ', [T[0]], R);
                    this.logger.log(`ModLoader ====== JsPreloader startLoad() excute result: [${T[0]} ${R}]`);
                } catch (e: any | Error) {
                    console.error('ModLoader ====== JsPreloader startLoad() excute error: ', [T[0]], e);
                    this.logger.error(`ModLoader ====== JsPreloader startLoad() excute error: [${T[0]} ${e?.message ? e.message : e}]`);
                }
                console.log('ModLoader ====== JsPreloader startLoad() excute end: ', [T[0]]);
                this.logger.log(`ModLoader ====== JsPreloader startLoad() excute end: [${T[0]}]`);
                await this.pSC2DataManager.getModLoadController().Load_end(modName, T[0]);
            }
        }
        console.log('ModLoader ====== JsPreloader startLoad() clean');
        this.logger.log('ModLoader ====== JsPreloader startLoad() clean');
        this.pSC2DataManager.cleanAllCacheAfterModLoadEnd();
        console.log('ModLoader ====== JsPreloader startLoad() end');
        this.logger.log('ModLoader ====== JsPreloader startLoad() end');
        this.pSC2DataManager.getPassageTracer().init();
        this.pSC2DataManager.getSc2EventTracer().init();
        if (!this.pSC2DataManager.getModLoader().checkModCacheData()) {
            console.error('ModLoader ====== JsPreloader startLoad() checkData() failed. Data consistency check failed.');
            this.logger.error('ModLoader ====== JsPreloader startLoad() checkData() failed. Data consistency check failed.');
        }
        if (!this.pSC2DataManager.getModLoader().checkModCacheUniq()) {
            console.error('ModLoader ====== JsPreloader startLoad() checkNameUniq() failed. Data consistency check failed.');
            this.logger.error('ModLoader ====== JsPreloader startLoad() checkNameUniq() failed. Data consistency check failed.');
        }
        await this.pSC2DataManager.getAddonPluginManager().triggerHook('afterPreload');
        this.logger.log('ModLoader ====== ModLoader Start End. To Start SugarCube2 Engine.....');
        await this.pSC2DataManager.getModLoadController().ModLoaderLoadEnd();
    }

    runningMod: StackLike<string> = new StackLike<string>();

    async JsRunner(content: string, name: string, modName: string, stage: string, pSC2DataManager: SC2DataManager, thisWin: Window, logger: LogWrapper) {
        try {
            this.runningMod.push(modName);

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
                    // logger.log(`ModLoader ====== JsRunner ${name} ${modName} ${stage} ok`);
                    thisWin.document.removeEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
                    thisWin.document.removeEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
                    resolve(EV.detail.R);
                };
                const ce = (EV: any) => {
                    // console.error('ModLoader ====== JsRunner ${name} ${modName} ${stage} error', EV);
                    // logger.error(`ModLoader ====== JsRunner ${name} ${modName} ${stage} error`);
                    thisWin.document.removeEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
                    thisWin.document.removeEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
                    reject(EV.detail.E);
                };
                thisWin.document.addEventListener(`JsRunner:ok:${stage}-${modName}-${name}`, co);
                thisWin.document.addEventListener(`JsRunner:error:${stage}-${modName}-${name}`, ce);
            });

            console.log(`ModLoader ====== JsRunner ${name} ${modName} ${stage} start`);
            logger.log(`ModLoader ====== JsRunner ${name} ${modName} ${stage} start`);

            if (pSC2DataManager) {
                // insert before SC2 data rootNode
                pSC2DataManager?.rootNode.before(script);
            } else {
                // or insert to head
                console.warn('ModLoader ====== JsRunner() pSC2DataManager is undefined, insert to head');
                logger.warn('ModLoader ====== JsRunner() pSC2DataManager is undefined, insert to head');
                thisWin.document.head.appendChild(script);
            }

            this.runningMod.pop();
            return p;
        } catch (e) {
            this.runningMod.pop();
            throw e;
        }
    }

}

