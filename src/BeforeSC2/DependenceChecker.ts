import {SC2DataManager} from "SC2DataManager";
import {satisfies} from 'semver';
import {ModUtils} from "./Utils";
import {ModInfo} from "./ModLoader";
import {LogWrapper} from "./ModLoadController";


export class DependenceChecker {
    log: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.log = this.gSC2DataManager.getModLoadController().getLog();
    }

    checkFor(mod: ModInfo): boolean {
        const modCache = this.gSC2DataManager.getModLoader().modCache;
        if (mod.bootJson.dependenceInfo) {
            for (const d of mod.bootJson.dependenceInfo) {
                if (d.modName === 'ModLoader') {
                    if (!satisfies(this.gModUtils.version, d.version)) {
                        console.error('DependenceChecker.checkFor() not satisfies ModLoader', [mod.bootJson.name, d, this.gModUtils.version]);
                        this.log.error(`DependenceChecker.checkFor(${mod.bootJson.name}) not satisfies ModLoader: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find ModLoader[${this.gModUtils.version}].`);
                        return false;
                    }
                    return true;
                }
                const mod2 = modCache.get(d.modName);
                if (!mod2) {
                    console.error('DependenceChecker.checkFor() not found mod before', [mod.bootJson.name, d]);
                    this.log.error(`DependenceChecker.checkFor(${mod.bootJson.name}) not found mod: mod[${mod.bootJson.name}] need mod[${d.modName}] but not find.`);
                    return false;
                }
                if (!satisfies(mod2.bootJson.version, d.version)) {
                    console.error('DependenceChecker.checkFor() not satisfies', [mod.bootJson.name, d, mod2.bootJson]);
                    this.log.error(`DependenceChecker.checkFor(${mod.bootJson.name}) not satisfies: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find version[${mod2.bootJson.version}].`);
                    return false;
                }
            }
        }
        return true;
    }

    check() {
        const modCache = this.gSC2DataManager.getModLoader().modCache;
        let allOk = true;
        // TODO check by order
        for (const mod of modCache.values()) {
            if (mod.bootJson.dependenceInfo) {
                for (const d of mod.bootJson.dependenceInfo) {
                    if (d.modName === 'ModLoader') {
                        if (!satisfies(this.gModUtils.version, d.version)) {
                            console.error('DependenceChecker.check() not satisfies ModLoader', [mod.bootJson.name, d, this.gModUtils.version]);
                            this.log.error(`DependenceChecker.check() not satisfies ModLoader: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find ModLoader[${this.gModUtils.version}].`);
                            allOk = false;
                            continue;
                        }
                        continue;
                    }
                    const mod2 = modCache.get(d.modName);
                    if (!mod2) {
                        console.error('DependenceChecker.check() not found mod', [mod.bootJson.name, d]);
                        this.log.error(`DependenceChecker.check() not found mod: mod[${mod.bootJson.name}] need mod[${d.modName}] but not find.`);
                        allOk = false;
                        continue;
                    }
                    if (!satisfies(mod2.bootJson.version, d.version)) {
                        console.error('DependenceChecker.check() not satisfies', [mod.bootJson.name, d, mod2.bootJson]);
                        this.log.error(`DependenceChecker.check() not satisfies: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find version[${mod2.bootJson.version}].`);
                        allOk = false;
                        continue;
                    }
                }
            }
        }
        return allOk;
    }
}
