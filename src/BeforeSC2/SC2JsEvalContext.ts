import {SC2DataManager} from "./SC2DataManager";

export interface SC2JsEvalContextInfo {
    // SC2 will use it with  `Scripting.evalJavaScript(_scripts[i].text, contextThis)`
    contextThis: object;
}

export class SC2JsEvalContext {
    constructor(
        public gSC2DataManager: SC2DataManager,
    ) {
    }

    contextSet: SC2JsEvalContextInfo[] = [];

    /**
     * call by SugarCube2 `Story.storyInit()`
     */
    newContext(id: string): object {
        const contextThis = {};
        const context = {
            contextThis,
        };
        this.contextSet.push(context);
        return context.contextThis;
    }

    // findValue(key: string) {
    //     const cc: SC2JsEvalContextInfo[] = [];
    //     for (const context of this.contextSet) {
    //         // es2022.object.hasOwn
    //         if (Object.hasOwn(context.contextThis, key)) {
    //             cc.push(context);
    //         }
    //     }
    //     return cc;
    // }

}

