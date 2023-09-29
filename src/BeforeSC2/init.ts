import {SC2DataManager} from "./SC2DataManager";
import {Inject4Jquery} from "./JqueryInjector";


// @ts-ignore
window.modSC2DataManager = new SC2DataManager(window);
// @ts-ignore
window.modUtils = window.modSC2DataManager.getModUtils();
// @ts-ignore
window.jsPreloader = window.modSC2DataManager.getJsPreloader();
// @ts-ignore
window.modModLoadController = window.modSC2DataManager.getModLoadController();
// @ts-ignore
window.modAddonPluginManager = window.modSC2DataManager.getAddonPluginManager();
// @ts-ignore
window.modSC2JsEvalContext = window.modSC2DataManager.getSC2JsEvalContext();

Inject4Jquery(window);

