import {SC2Passage} from "./SC2ApiRef";
import {SC2DataManager} from "./SC2DataManager";
import {LogWrapper} from "./ModLoadController";

// all must sync impl, and must fastest
export interface WikifyTracerCallback {
    beforePassage?: (text: string, passageTitle: string, passageObj: SC2Passage) => string;
    afterPassage?: (text: string, passageTitle: string, passageObj: SC2Passage, node: DocumentFragment) => void;
    beforeWikify?: (text: string) => string;
    afterWikify?: (text: string, node: DocumentFragment) => void;
    beforeWidget?: (text: string, widgetName: string, passageTitle?: string, passageObj?: SC2Passage) => string;
    afterWidget?: (text: string, widgetName: string, passageTitle: string | undefined, passageObj: SC2Passage | undefined, node: DocumentFragment) => void;
}

export class WikifyTracerCallbackOrder {
    beforePassage: string[] = [];
    afterPassage: string[] = [];
    beforeWikify: string[] = [];
    afterWikify: string[] = [];
    beforeWidget: string[] = [];
    afterWidget: string[] = [];

    addCallback(key: string, c: WikifyTracerCallback) {
        if (c.beforePassage) {
            this.beforePassage.push(key);
        }
        if (c.afterPassage) {
            this.afterPassage.push(key);
        }
        if (c.beforeWikify) {
            this.beforeWikify.push(key);
        }
        if (c.afterWikify) {
            this.afterWikify.push(key);
        }
        if (c.beforeWidget) {
            this.beforeWidget.push(key);
        }
        if (c.afterWidget) {
            this.afterWidget.push(key);
        }
    }

    removeCallback(key: string, c: WikifyTracerCallback) {
        if (c.beforePassage) {
            this.beforePassage.splice(this.beforePassage.indexOf(key), 1);
        }
        if (c.afterPassage) {
            this.afterPassage.splice(this.afterPassage.indexOf(key), 1);
        }
        if (c.beforeWikify) {
            this.beforeWikify.splice(this.beforeWikify.indexOf(key), 1);
        }
        if (c.afterWikify) {
            this.afterWikify.splice(this.afterWikify.indexOf(key), 1);
        }
        if (c.beforeWidget) {
            this.beforeWidget.splice(this.beforeWidget.indexOf(key), 1);
        }
        if (c.afterWidget) {
            this.afterWidget.splice(this.afterWidget.indexOf(key), 1);
        }
    }
}

export class WikifyTracerCallbackCount {
    beforePassage = 0;
    afterPassage = 0;
    beforeWikify = 0;
    afterWikify = 0;
    beforeWidget = 0;
    afterWidget = 0;

    order = new WikifyTracerCallbackOrder();

    addCallback(key: string, c: WikifyTracerCallback) {
        if (c.beforePassage) {
            this.beforePassage++;
        }
        if (c.afterPassage) {
            this.afterPassage++;
        }
        if (c.beforeWikify) {
            this.beforeWikify++;
        }
        if (c.afterWikify) {
            this.afterWikify++;
        }
        if (c.beforeWidget) {
            this.beforeWidget++;
        }
        if (c.afterWidget) {
            this.afterWidget++;
        }
        this.order.addCallback(key, c);
    }

    removeCallback(key: string, c: WikifyTracerCallback) {
        if (c.beforePassage) {
            this.beforePassage--;
        }
        if (c.afterPassage) {
            this.afterPassage--;
        }
        if (c.beforeWikify) {
            this.beforeWikify--;
        }
        if (c.afterWikify) {
            this.afterWikify--;
        }
        if (c.beforeWidget) {
            this.beforeWidget--;
        }
        if (c.afterWidget) {
            this.afterWidget--;
        }
        this.order.removeCallback(key, c);
    }

    checkDataValid() {
        // order data length must === count
        let ok = true;
        if (this.order.beforePassage.length !== this.beforePassage) {
            console.error('WikifyTracerCallbackCount.checkDataValid: beforePassage length not match', [this.order.beforePassage, this.beforePassage]);
            ok = false;
        }
        if (this.order.afterPassage.length !== this.afterPassage) {
            console.error('WikifyTracerCallbackCount.checkDataValid: afterPassage length not match', [this.order.afterPassage, this.afterPassage]);
            ok = false;
        }
        if (this.order.beforeWikify.length !== this.beforeWikify) {
            console.error('WikifyTracerCallbackCount.checkDataValid: beforeWikify length not match', [this.order.beforeWikify, this.beforeWikify]);
            ok = false;
        }
        if (this.order.afterWikify.length !== this.afterWikify) {
            console.error('WikifyTracerCallbackCount.checkDataValid: afterWikify length not match', [this.order.afterWikify, this.afterWikify]);
            ok = false;
        }
        if (this.order.beforeWidget.length !== this.beforeWidget) {
            console.error('WikifyTracerCallbackCount.checkDataValid: beforeWidget length not match', [this.order.beforeWidget, this.beforeWidget]);
            ok = false;
        }
        if (this.order.afterWidget.length !== this.afterWidget) {
            console.error('WikifyTracerCallbackCount.checkDataValid: afterWidget length not match', [this.order.afterWidget, this.afterWidget]);
            ok = false;
        }
        return ok;
    }
}

export class WikifyTracer {
    private logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
    ) {
        this.logger = gSC2DataManager.getModUtils().getLogger();
    }

    private callbackTable: Map<string, WikifyTracerCallback> = new Map<string, WikifyTracerCallback>();
    private callbackOrder: string[] = [];
    private callbackCount = new WikifyTracerCallbackCount();

    public addCallback(key: string, callback: WikifyTracerCallback) {
        if (this.callbackTable.has(key)) {
            console.warn('WikifyTracer.addCallback: key already exists', [key, callback, this.callbackTable.get(key)]);
            this.logger.warn(`WikifyTracer.addCallback: key already exists [${key}]`,);
            this.callbackCount.removeCallback(key, this.callbackTable.get(key)!);
            this.callbackOrder.splice(this.callbackOrder.indexOf(key), 1);
        }
        this.callbackTable.set(key, callback);
        this.callbackOrder.push(key);
        this.callbackCount.addCallback(key, callback);
        if (!this.callbackCount.checkDataValid()) {
            // never go there
            console.error('WikifyTracer.addCallback: checkDataValid failed', [this.callbackTable, this.callbackOrder, this.callbackCount]);
            this.logger.error(`WikifyTracer.addCallback: checkDataValid failed`);
        }
    }

    beforePassage(text: string, passageTitle: string, passageObj: SC2Passage): string {
        // console.log('beforePassage', [passageTitle, passageObj, text]);
        if (this.callbackCount.beforePassage === 0) {
            // short stop
            return text;
        }
        for (const key of this.callbackCount.order.beforePassage) {
            const callback = this.callbackTable.get(key);
            if (!callback) {
                // never go there
                console.error('WikifyTracer.beforePassage: key not found', [key, this.callbackOrder, this.callbackTable]);
                continue;
            }
            if (callback.beforePassage) {
                try {
                    text = callback.beforePassage(text, passageTitle, passageObj);
                } catch (e: Error | any) {
                    console.error('WikifyTracer.beforePassage', [key, callback, [text, passageTitle, passageObj], e]);
                }
            } else {
                // never go there
                console.error('WikifyTracer.beforePassage: callback.beforePassage not found', [key, this.callbackCount, this.callbackOrder, this.callbackTable]);
            }
        }
        return text;
    }

    afterPassage(text: string, passageTitle: string, passageObj: SC2Passage, node: DocumentFragment) {
        // console.log('afterPassage', [passageTitle, passageObj, text]);
        if (this.callbackCount.afterPassage === 0) {
            // short stop
            return;
        }
        for (const key of this.callbackCount.order.afterPassage) {
            const callback = this.callbackTable.get(key);
            if (!callback) {
                // never go there
                console.error('WikifyTracer.afterPassage: key not found', [key, this.callbackOrder, this.callbackTable]);
                continue;
            }
            if (callback.afterPassage) {
                try {
                    callback.afterPassage(text, passageTitle, passageObj, node);
                } catch (e: Error | any) {
                    console.error('WikifyTracer.afterPassage', [key, callback, [text, passageTitle, passageObj], e]);
                }
            } else {
                // never go there
                console.error('WikifyTracer.afterPassage: callback.beforePassage not found', [key, this.callbackCount, this.callbackOrder, this.callbackTable]);
            }
        }
    }

    beforeWikify(text: string): string {
        // console.log('beforeWikify', [text]);
        if (this.callbackCount.beforeWikify === 0) {
            // short stop
            return text;
        }
        for (const key of this.callbackCount.order.beforeWikify) {
            const callback = this.callbackTable.get(key);
            if (!callback) {
                // never go there
                console.error('WikifyTracer.beforeWikify: key not found', [key, this.callbackOrder, this.callbackTable]);
                continue;
            }
            if (callback.beforeWikify) {
                try {
                    text = callback.beforeWikify(text);
                } catch (e: Error | any) {
                    console.error('WikifyTracer.beforeWikify', [key, callback, [text], e]);
                }
            } else {
                // never go there
                console.error('WikifyTracer.beforeWikify: callback.beforePassage not found', [key, this.callbackCount, this.callbackOrder, this.callbackTable]);
            }
        }
        return text;
    }

    afterWikify(text: string, node: DocumentFragment) {
        // console.log('afterWikify', [text]);
        if (this.callbackCount.afterWikify === 0) {
            // short stop
            return;
        }
        for (const key of this.callbackCount.order.afterWikify) {
            const callback = this.callbackTable.get(key);
            if (!callback) {
                // never go there
                console.error('WikifyTracer.afterWikify: key not found', [key, this.callbackOrder, this.callbackTable]);
                continue;
            }
            if (callback.afterWikify) {
                try {
                    callback.afterWikify(text, node);
                } catch (e: Error | any) {
                    console.error('WikifyTracer.afterWikify', [key, callback, [text], e]);
                }
            } else {
                // never go there
                console.error('WikifyTracer.afterWikify: callback.beforePassage not found', [key, this.callbackCount, this.callbackOrder, this.callbackTable]);
            }
        }
    }

    beforeWidget(text: string, widgetName: string, passageTitle?: string, passageObj?: SC2Passage): string {
        // console.log('beforeWidget', [widgetName, passageTitle, passageObj, text]);
        if (this.callbackCount.beforeWidget === 0) {
            // short stop
            return text;
        }
        for (const key of this.callbackCount.order.beforeWikify) {
            const callback = this.callbackTable.get(key);
            if (!callback) {
                // never go there
                console.error('WikifyTracer.beforeWidget: key not found', [key, this.callbackOrder, this.callbackTable]);
                continue;
            }
            if (callback.beforeWidget) {
                try {
                    text = callback.beforeWidget(text, widgetName, passageTitle, passageObj);
                } catch (e: Error | any) {
                    console.error('WikifyTracer.beforeWidget', [key, callback, [text, widgetName, passageTitle, passageObj], e]);
                }
            } else {
                // never go there
                console.error('WikifyTracer.beforeWidget: callback.beforePassage not found', [key, this.callbackCount, this.callbackOrder, this.callbackTable]);
            }
        }
        return text;
    }

    afterWidget(text: string, widgetName: string, passageTitle: string | undefined, passageObj: SC2Passage | undefined, node: DocumentFragment) {
        // console.log('afterWidget', [widgetName, passageTitle, passageObj, text]);
        if (this.callbackCount.afterWidget === 0) {
            // short stop
            return;
        }
        for (const key of this.callbackCount.order.afterWidget) {
            const callback = this.callbackTable.get(key);
            if (!callback) {
                // never go there
                console.error('WikifyTracer.afterWidget: key not found', [key, this.callbackOrder, this.callbackTable]);
                continue;
            }
            if (callback.afterWidget) {
                try {
                    callback.afterWidget(text, widgetName, passageTitle, passageObj, node);
                } catch (e: Error | any) {
                    console.error('WikifyTracer.afterWidget', [key, callback, [text, widgetName, passageTitle, passageObj], e]);
                }
            } else {
                // never go there
                console.error('WikifyTracer.afterWidget: callback.beforePassage not found', [key, this.callbackCount, this.callbackOrder, this.callbackTable]);
            }
        }
    }

}
