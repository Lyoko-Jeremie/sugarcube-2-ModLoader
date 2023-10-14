import type {Passage} from "./SugarCube2";
import {SC2DataManager} from "./SC2DataManager";

export interface Sc2EventTracerCallback {
    // SugarCube2 引擎触发 StoryReady 事件后
    whenSC2StoryReady?: () => any;
    // SugarCube2 引擎触发 PassageInit 事件后
    whenSC2PassageInit?: (passage: Passage) => any;
    // SugarCube2 引擎触发 PassageStart 事件后
    whenSC2PassageStart?: (passage: Passage, content: HTMLDivElement) => any;
    // SugarCube2 引擎触发 PassageRender 事件后
    whenSC2PassageRender?: (passage: Passage, content: HTMLDivElement) => any;
    // SugarCube2 引擎触发 PassageDisplay 事件后
    whenSC2PassageDisplay?: (passage: Passage, content: HTMLDivElement) => any;
    // SugarCube2 引擎触发 PassageReady 事件后
    whenSC2PassageEnd?: (passage: Passage, content: HTMLDivElement) => any;
}

export class Sc2EventTracer {
    constructor(
        public thisWin: Window,
        public gSC2DataManager: SC2DataManager,
    ) {
    }

    callback: Sc2EventTracerCallback[] = [];

    init() {
        this.thisWin.jQuery(this.thisWin.document).on(":storyready", (event: Event | any) => {
            for (const x of this.callback) {
                if (x.whenSC2StoryReady) {
                    try {
                        x.whenSC2StoryReady();
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passageinit", (event: Event | any) => {
            const passage: Passage = event.passage;
            for (const x of this.callback) {
                if (x.whenSC2PassageInit) {
                    try {
                        x.whenSC2PassageInit(passage);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passagestart", (event: Event | any) => {
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageStart) {
                    try {
                        x.whenSC2PassageStart(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passagerender", (event: Event | any) => {
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageRender) {
                    try {
                        x.whenSC2PassageRender(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passagedisplay", (event: Event | any) => {
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageDisplay) {
                    try {
                        x.whenSC2PassageDisplay(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passageend", (event: Event | any) => {
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageEnd) {
                    try {
                        x.whenSC2PassageEnd(passage, content);
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

