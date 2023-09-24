import {SC2DataManager} from "SC2DataManager";
import {satisfies} from 'semver';


export class DependenceChecker {
    constructor(
        public gSC2DataManager: SC2DataManager,
    ) {
    }

    check() {
        const log = this.gSC2DataManager.getModLoadController().getLog();
        const modCache = this.gSC2DataManager.getModLoader().modCache;
        let allOk = true;
        for (const mod of modCache.values()) {
            if (mod.bootJson.dependenceInfo) {
                for (const d of mod.bootJson.dependenceInfo) {
                    const mod2 = modCache.get(d.modName);
                    if (!mod2) {
                        console.error('DependenceChecker.check() not found mod', [mod.bootJson.name, d]);
                        log.error(`DependenceChecker.check() not found mod: mod[${mod.bootJson.name}] need mod[${d.modName}] but not find.`);
                        allOk = false;
                        continue;
                    }
                    if (!satisfies(mod2.bootJson.version, d.version)) {
                        console.error('DependenceChecker.check() not satisfies', [mod.bootJson.name, d]);
                        log.error(`DependenceChecker.check() not satisfies: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find version[${mod2.bootJson.version}].`);
                        allOk = false;
                        continue;
                    }
                }
            }
        }
        return allOk;
    }
}
