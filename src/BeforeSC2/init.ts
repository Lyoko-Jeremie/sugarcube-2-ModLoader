import {SC2DataManager} from "./SC2DataManager";
import {ModUtils} from "./Utils";
import {JsPreloader} from "./JsPreloader";


// @ts-ignore
window.modSC2DataManager = new SC2DataManager();
// @ts-ignore
window.modUtils = new ModUtils(window.modSC2DataManager);
// @ts-ignore
window.jsPreloader = new JsPreloader(window.modSC2DataManager, window.modUtils);
// @ts-ignore
window.modModLoadController = window.modSC2DataManager.getModLoadController();
// @ts-ignore
window.modAddonPluginManager = window.modSC2DataManager.getAddonPluginManager();
// @ts-ignore
window.modSC2JsEvalContext = window.modSC2DataManager.getSC2JsEvalContext();


