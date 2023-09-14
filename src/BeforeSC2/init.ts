import {SC2DataManager} from "./SC2DataManager";
import {ModUtils} from "./Utils";


// @ts-ignore
window.modSC2DataManager = new SC2DataManager();
// @ts-ignore
window.modUtils = new ModUtils(window.modSC2DataManager);


