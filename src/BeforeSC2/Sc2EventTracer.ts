import type {Passage} from "./SugarCube2";

export interface Sc2EventTracerCallback {
    // SugarCube2 引擎触发 StoryReady 事件后
    whenSC2StoryReady?: () => Promise<any>;
    // SugarCube2 引擎触发 PassageInit 事件后
    whenSC2PassageInit?: (passage: Passage) => Promise<any>;
    // SugarCube2 引擎触发 PassageStart 事件后
    whenSC2PassageStart?: (passage: Passage, content: HTMLDivElement) => Promise<any>;
    // SugarCube2 引擎触发 PassageRender 事件后
    whenSC2PassageRender?: (passage: Passage, content: HTMLDivElement) => Promise<any>;
    // SugarCube2 引擎触发 PassageDisplay 事件后
    whenSC2PassageDisplay?: (passage: Passage, content: HTMLDivElement) => Promise<any>;
    // SugarCube2 引擎触发 PassageReady 事件后
    whenSC2PassageEnd?: (passage: Passage, content: HTMLDivElement) => Promise<any>;
}

export class Sc2EventTracer {
    constructor() {
    }

    callback: Sc2EventTracerCallback[] = [];

    init() {
        window.jQuery(document).on(":storyready", async (event: Event | any) => {
            for (const x of this.callback) {
                if (x.whenSC2StoryReady) {
                    try {
                        await x.whenSC2StoryReady();
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        window.jQuery(document).on(":passageinit", async (event: Event | any) => {
            const passage: Passage = event.passage;
            for (const x of this.callback) {
                if (x.whenSC2PassageInit) {
                    try {
                        await x.whenSC2PassageInit(passage);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        window.jQuery(document).on(":passagestart", async (event: Event | any) => {
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageStart) {
                    try {
                        await x.whenSC2PassageStart(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        window.jQuery(document).on(":passagerender", async (event: Event | any) => {
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageRender) {
                    try {
                        await x.whenSC2PassageRender(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        window.jQuery(document).on(":passagedisplay", async (event: Event | any) => {
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageDisplay) {
                    try {
                        await x.whenSC2PassageDisplay(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        window.jQuery(document).on(":passageend", async (event: Event | any) => {
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageEnd) {
                    try {
                        await x.whenSC2PassageEnd(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
    }

    addCallback(cb: Sc2EventTracerCallback) {
        this.callback.push(cb);
    }


}

