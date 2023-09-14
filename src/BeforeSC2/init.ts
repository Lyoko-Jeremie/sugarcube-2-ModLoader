import {SC2DataManager} from "./SC2DataManager";
import {ModUtils} from "./Utils";
import {JsPreloader} from "./JsPreloader";


// @ts-ignore
window.modSC2DataManager = new SC2DataManager();
// @ts-ignore
window.modUtils = new ModUtils(window.modSC2DataManager);
// @ts-ignore
window.jsPreloader = new JsPreloader(window.modSC2DataManager, window.modUtils);


