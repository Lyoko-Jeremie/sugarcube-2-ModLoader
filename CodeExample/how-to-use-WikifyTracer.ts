import type {SC2DataManager} from '../dist-BeforeSC2/SC2DataManager';
import type {ModUtils} from '../dist-BeforeSC2/Utils';
import type {SC2DataInfoCache, PassageDataItem} from "../dist-BeforeSC2/SC2DataInfoCache";
import type {SC2DataInfo} from "../dist-BeforeSC2/SC2DataInfoCache";
import type {} from '../src/BeforeSC2/global';
import {WikifyTracerCallback} from "../dist-BeforeSC2/WikifyTracer";
import {SC2Passage} from "../dist-BeforeSC2/SC2ApiRef";


const gUtils: ModUtils = window.modUtils;
const gSC2DataManager: SC2DataManager = window.modSC2DataManager;

gSC2DataManager.getWikifyTracer().addCallback('MyWikifyTracer', {
    afterPassage: (text: string, passageTitle: string, passageObj: SC2Passage, node: DocumentFragment) => {
        // this function must as fast as possible
        const passageName = passageTitle;
        // do the fast filter check first to filter out most of the passages we not cary about
        if (passageName !== '......') {
            return;
        }
        // can do something here, example change html
        // .......
        $(node).find('a');
    },
} as WikifyTracerCallback);


