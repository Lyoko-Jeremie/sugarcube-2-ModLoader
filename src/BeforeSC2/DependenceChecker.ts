import {SC2DataManager} from "SC2DataManager";
import {satisfies, major} from 'semver';
import {ModUtils} from "./Utils";


export class DependenceChecker {
    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
    }

    check() {
        const log = this.gSC2DataManager.getModLoadController().getLog();
        const modCache = this.gSC2DataManager.getModLoader().modCache;
        let allOk = true;
        for (const mod of modCache.values()) {
            if (mod.bootJson.dependenceInfo) {
                for (const d of mod.bootJson.dependenceInfo) {
                    if (d.modName === 'ModLoader') {
                        if (!satisfies(this.gModUtils.version, d.version)) {
                            console.error('DependenceChecker.check() not satisfies ModLoader', [mod.bootJson.name, d, this.gModUtils.version]);
                            log.error(`DependenceChecker.check() not satisfies ModLoader: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find ModLoader[${this.gModUtils.version}].`);
                            allOk = false;
                            continue;
                        }
                        continue;
                    }
                    const mod2 = modCache.get(d.modName);
                    if (!mod2) {
                        console.error('DependenceChecker.check() not found mod', [mod.bootJson.name, d]);
                        log.error(`DependenceChecker.check() not found mod: mod[${mod.bootJson.name}] need mod[${d.modName}] but not find.`);
                        allOk = false;
                        continue;
                    }
                    if (!satisfies(mod2.bootJson.version, d.version)) {
                        console.error('DependenceChecker.check() not satisfies', [mod.bootJson.name, d, mod2.bootJson]);
                        log.error(`DependenceChecker.check() not satisfies: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find version[${mod2.bootJson.version}].`);
                        allOk = false;
                        continue;
                    }
                    if (major(mod2.bootJson.version) !== major(d.version)) {
                        console.warn('DependenceChecker.check() not in same major', [mod.bootJson.name, d, mod2.bootJson]);
                        log.warn(`DependenceChecker.check() not in same major: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find version[${mod2.bootJson.version}].`);
                        allOk = false;
                        continue;
                    }
                }
            }
        }
        return allOk;
    }
}
