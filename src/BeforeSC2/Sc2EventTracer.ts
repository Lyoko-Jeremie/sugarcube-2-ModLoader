import type {Passage} from "./SugarCube2";
import {SC2DataManager} from "./SC2DataManager";
import {newWeakPoolRef, WeakPoolRef} from "./WeakRefPool/WeakRefPool";

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

const nWPRef = newWeakPoolRef;

export class Sc2EventTracer {
    constructor(
        public thisWin: Window,
        public gSC2DataManager: SC2DataManager,
    ) {
    }

    callback: Sc2EventTracerCallback[] = [];

    callbackLog: [string, WeakPoolRef<Sc2EventTracerCallback>, ...WeakPoolRef<any>[]][] = [];

    init() {
        this.thisWin.jQuery(this.thisWin.document).on(":storyready", (event: Event | any) => {
            // console.log('Sc2EventTracer :storyready');
            for (const x of this.callback) {
                if (x.whenSC2StoryReady) {
                    try {
                        // console.log('Sc2EventTracer :storyready callback', x);
                        this.callbackLog.push([':storyready', nWPRef(x), nWPRef(x)]);
                        x.whenSC2StoryReady();
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passageinit", (event: Event | any) => {
            // console.log('Sc2EventTracer :passageinit');
            const passage: Passage = event.passage;
            for (const x of this.callback) {
                if (x.whenSC2PassageInit) {
                    try {
                        // console.log('Sc2EventTracer :passageinit callback', x);
                        this.callbackLog.push([':passageinit', nWPRef(x), nWPRef(x), nWPRef(passage)]);
                        x.whenSC2PassageInit(passage);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passagestart", (event: Event | any) => {
            // console.log('Sc2EventTracer :passagestart');
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageStart) {
                    try {
                        // console.log('Sc2EventTracer :passagestart callback', x, passage, content);
                        this.callbackLog.push([':passagestart', nWPRef(x), nWPRef(x), nWPRef(passage), nWPRef(content)]);
                        x.whenSC2PassageStart(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passagerender", (event: Event | any) => {
            // console.log('Sc2EventTracer :passagerender');
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageRender) {
                    try {
                        // console.log('Sc2EventTracer :passagerender callback', x, passage, content);
                        this.callbackLog.push([':passagerender', nWPRef(x), nWPRef(x), nWPRef(passage), nWPRef(content)]);
                        x.whenSC2PassageRender(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passagedisplay", (event: Event | any) => {
            // console.log('Sc2EventTracer :passagedisplay');
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageDisplay) {
                    try {
                        // console.log('Sc2EventTracer :passagedisplay callback', x, passage, content);
                        this.callbackLog.push([':passagedisplay', nWPRef(x), nWPRef(x), nWPRef(passage), nWPRef(content)]);
                        x.whenSC2PassageDisplay(passage, content);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        });
        this.thisWin.jQuery(this.thisWin.document).on(":passageend", (event: Event | any) => {
            // console.log('Sc2EventTracer :passageend');
            const passage: Passage = event.passage;
            const content: HTMLDivElement = event.content;
            for (const x of this.callback) {
                if (x.whenSC2PassageEnd) {
                    try {
                        // console.log('Sc2EventTracer :passageend callback', x, passage, content);
                        this.callbackLog.push([':passageend', nWPRef(x), nWPRef(x), nWPRef(passage), nWPRef(content)]);
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

