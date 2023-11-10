import {SC2DataManager} from "./SC2DataManager";
import {getGlobal} from "./getGlobal";
// import {Inject4Jquery} from "./JqueryInjector";

console.log('getGlobal()', getGlobal());
console.log('getGlobal().document', getGlobal().document);
console.log('getGlobal().jQuery', getGlobal().jQuery);

const thisWin: Window = getGlobal();

thisWin.modSC2DataManager = new SC2DataManager(thisWin);
thisWin.modUtils = thisWin.modSC2DataManager.getModUtils();
thisWin.jsPreloader = thisWin.modSC2DataManager.getJsPreloader();
thisWin.modModLoadController = thisWin.modSC2DataManager.getModLoadController();
thisWin.modAddonPluginManager = thisWin.modSC2DataManager.getAddonPluginManager();
thisWin.modSC2JsEvalContext = thisWin.modSC2DataManager.getSC2JsEvalContext();

// Inject4Jquery(thisWin);

