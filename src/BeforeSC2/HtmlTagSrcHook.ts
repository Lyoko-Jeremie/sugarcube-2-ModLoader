import {SC2DataManager} from "./SC2DataManager";
import {LogWrapper} from "./ModLoadController";

export type HtmlTagSrcHookType = (el: HTMLImageElement | HTMLElement, mlSrc: string, field: string) => Promise<boolean>;
export type HtmlTagSrcReturnModeHookType = (mlSrc: string) => Promise<[boolean, string]>;

/**
 * this class replace html image tag src/href attribute ,
 * redirect the image request to a mod like `ImgLoaderHooker` to load the image.
 */
export class HtmlTagSrcHook {
    logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
    ) {
        this.logger = gSC2DataManager.getModUtils().getLogger();
    }

    private hookTable: Map<string, HtmlTagSrcHookType> = new Map<string, HtmlTagSrcHookType>();
    private hookReturnModeTable: Map<string, HtmlTagSrcReturnModeHookType> = new Map<string, HtmlTagSrcReturnModeHookType>();

    public addHook(hookKey: string, hook: HtmlTagSrcHookType) {
        if (this.hookTable.has(hookKey)) {
            console.error(`[HtmlTagSrcHook] addHook: hookKey already exist!`, [hookKey, hook]);
            this.logger.error(`[HtmlTagSrcHook] addHook: hookKey[${hookKey}] already exist!`);
        }
        this.hookTable.set(hookKey, hook);
    }

    public addReturnModeHook(hookKey: string, hook: HtmlTagSrcReturnModeHookType) {
        if (this.hookReturnModeTable.has(hookKey)) {
            console.error(`[HtmlTagSrcHook] addReturnModeHook: hookKey already exist!`, [hookKey, hook]);
            this.logger.error(`[HtmlTagSrcHook] addReturnModeHook: hookKey[${hookKey}] already exist!`);
        }
        this.hookReturnModeTable.set(hookKey, hook);
    }

    public async doHook(el: HTMLImageElement | HTMLElement, field: string = 'src'): Promise<boolean> {
        // console.log('[HtmlTagSrcHook] doHook: handing the element', [el, el.outerHTML]);
        const mlSrc = el.getAttribute(`ML-${field}`);
        if (!mlSrc) {
            console.error(`[HtmlTagSrcHook] doHook: no ML-${field}`, [el, el.outerHTML]);
            this.logger.error(`[HtmlTagSrcHook] doHook: no ML-${field} [${el.outerHTML}]`);
            return false;
        }
        // call hook to find a mod hook to handle the element
        // if all mod cannot handle, don't change the element and return false
        for (const [hookKey, hook] of this.hookReturnModeTable) {
            try {
                const r = await hook(mlSrc);
                if (r[0]) {
                    el.setAttribute(field, r[1]);
                    return true;
                }
            } catch (e: Error | any) {
                console.error(`[HtmlTagSrcHook] doHookCallback: call hookKey error`, [hookKey, hook, e]);
                this.logger.error(`[HtmlTagSrcHook] doHookCallback: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
            }
        }
        for (const [hookKey, hook] of this.hookTable) {
            try {
                if (await hook(el, mlSrc, field)) {
                    return true;
                }
            } catch (e: Error | any) {
                console.error(`[HtmlTagSrcHook] doHook: call hookKey error`, [hookKey, hook, e]);
                this.logger.error(`[HtmlTagSrcHook] doHook: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
            }
        }
        // console.log('[HtmlTagSrcHook] doHook: cannot handing the element', [el, el.outerHTML]);
        // if no one can handle the element, do the default action
        // recover the [field]
        el.setAttribute(field, mlSrc);
        return false;
    }

    public async doHookCallback(src: string, callback: (src: string) => any): Promise<[boolean, any]> {
        // console.log('[HtmlTagSrcHook] doHookCallback: handing src', [src]);
        if (!src) {
            console.error(`[HtmlTagSrcHook] doHookCallback: no src`, [src]);
            this.logger.error(`[HtmlTagSrcHook] doHookCallback: no src [${src}]`);
            return [false, await callback(src)];
        }
        // call hook to find a mod hook to handle the element
        // if all mod cannot handle, don't change the element and return false
        for (const [hookKey, hook] of this.hookReturnModeTable) {
            try {
                const r = await hook(src);
                if (r[0]) {
                    return [true, await callback(r[1])];
                }
            } catch (e: Error | any) {
                console.error(`[HtmlTagSrcHook] doHookCallback: call hookKey error`, [hookKey, hook, e]);
                this.logger.error(`[HtmlTagSrcHook] doHookCallback: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
            }
        }
        // if no one can handle the element, do the default action
        // recover the [field]
        return [false, await callback(src)];
    }

    async requestImageBySrc(src: string) {
        // console.log('[HtmlTagSrcHook] requestImageBySrc: handing src', [src]);
        if (!src) {
            console.error(`[HtmlTagSrcHook] requestImageBySrc: no src`, [src]);
            this.logger.error(`[HtmlTagSrcHook] requestImageBySrc: no src [${src}]`);
            return undefined;
        }
        // call hook to find a mod hook to handle the image
        for (const [hookKey, hook] of this.hookReturnModeTable) {
            try {
                const r = await hook(src);
                if (r[0]) {
                    return r[1];
                }
            } catch (e: Error | any) {
                console.error(`[HtmlTagSrcHook] requestImageBySrc: call hookKey error`, [hookKey, hook, e]);
                this.logger.error(`[HtmlTagSrcHook] requestImageBySrc: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
            }
        }
        // if no one can handle the element, do the default action
        return undefined;
    }

}

