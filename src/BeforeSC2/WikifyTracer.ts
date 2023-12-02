import {SC2Passage} from "./SC2ApiRef";
import {SC2DataManager} from "./SC2DataManager";

export class WikifyTracer {
    constructor(
        public gSC2DataManager: SC2DataManager,
    ) {
    }

    beforePassage(text: string, passageTitle: string, passageObj: SC2Passage): string {
        // console.log('beforePassage', [passageTitle, passageObj, text]);
        return text;
    }

    afterPassage(text: string, passageTitle: string, passageObj: SC2Passage) {
        // console.log('afterPassage', [passageTitle, passageObj, text]);
    }

    beforeWikify(text: string): string {
        // console.log('beforeWikify', [text]);
        return text;
    }

    afterWikify(text: string) {
        // console.log('afterWikify', [text]);
    }

    beforeWidget(text: string, widgetName: string, passageTitle?: string, passageObj?: SC2Passage): string {
        // console.log('beforeWidget', [widgetName, passageTitle, passageObj, text]);
        return text;
    }

    afterWidget(text: string, widgetName: string, passageTitle?: string, passageObj?: SC2Passage) {
        // console.log('afterWidget', [widgetName, passageTitle, passageObj, text]);
    }

}
