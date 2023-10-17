import {SC2DataManager} from "./SC2DataManager";
import {LogWrapper} from "./ModLoadController";

export type HtmlTagSrcHookType = (el: HTMLImageElement | HTMLElement, mlSrc: string) => Promise<boolean>;

export class HtmlTagSrcHook {
    logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
    ) {
        this.logger = gSC2DataManager.getModUtils().getLogger();
    }

    private hookTable: Map<string, HtmlTagSrcHookType> = new Map<string, HtmlTagSrcHookType>();

    public addHook(hookKey: string, hook: HtmlTagSrcHookType) {
        if (this.hookTable.has(hookKey)) {
            console.error(`HtmlTagSrcHook: addHook: hookKey already exist!`, [hookKey, hook]);
            this.logger.error(`HtmlTagSrcHook: addHook: hookKey[${hookKey}] already exist!`);
        }
        this.hookTable.set(hookKey, hook);
    }

    public async doHook(el: HTMLImageElement | HTMLElement): Promise<boolean> {
        // console.log('HtmlTagSrcHook: doHook: handing the element', [el, el.outerHTML]);
        const mlSrc = el.getAttribute('ML-src');
        if (!mlSrc) {
            console.error('HtmlTagSrcHook: doHook: no ML-src', [el, el.outerHTML]);
            this.logger.error(`HtmlTagSrcHook: doHook: no ML-src [${el.outerHTML}]`);
            return false;
        }
        // call hook to find a mod hook to handle the element
        // if all mod cannot handle, don't change the element and return false
        for (const [hookKey, hook] of this.hookTable) {
            try {
                if (await hook(el, mlSrc)) {
                    return true;
                }
            } catch (e: Error | any) {
                console.error(`HtmlTagSrcHook: doHook: call hookKey error`, [hookKey, hook, e]);
                this.logger.error(`HtmlTagSrcHook: doHook: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
            }
        }
        // if no one can handle the element, do the default action
        // recover the src
        el.setAttribute('src', mlSrc);
        return false;
    }

}

