import {ModLoader} from "ModLoader";
import {SC2DataManager} from "SC2DataManager";


export class ModLoadController {
    public modLoader: ModLoader;

    constructor(
        public gSC2DataManager: SC2DataManager
    ) {
        this.modLoader = this.gSC2DataManager.getModLoader();
    }


}

