import {SC2DataManager} from "SC2DataManager";
import {ModUtils} from "./Utils";
import {ModInfo} from "./ModLoader";
import {LogWrapper} from "./ModLoadController";
import {
    parseRange,
    parseVersion,
    satisfies
} from './SemVer/InfiniteSemVer';


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
                    if (!satisfies(parseVersion(this.gModUtils.version).version, parseRange(d.version))) {
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
                if (!satisfies(parseVersion(mod2.bootJson.version).version, parseRange(d.version))) {
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
                    if (d.modName === 'GameVersion') {
                        // skip
                        continue;
                    }
                    if (d.modName === 'ModLoader') {
                        if (!satisfies(parseVersion(this.gModUtils.version).version, parseRange(d.version))) {
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
                    if (!satisfies(parseVersion(mod2.bootJson.version).version, parseRange(d.version))) {
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

    checkGameVersion(gameVersion: string) {
        const modCache = this.gSC2DataManager.getModLoader().modCache;
        let allOk = true;
        for (const mod of modCache.values()) {
            if (mod.bootJson.dependenceInfo) {
                const n = mod.bootJson.dependenceInfo.find(T => T.modName === 'GameVersion');
                if (n) {
                    if (!satisfies(parseVersion(gameVersion).version, parseRange(n.version))) {
                        console.error('DependenceChecker.checkGameVersion() not satisfies', [mod.bootJson.name, n.version, gameVersion]);
                        this.log.error(`DependenceChecker.checkGameVersion() not satisfies: mod[${mod.bootJson.name}] need gameVersion[${n.version}] but gameVersion is [${gameVersion}].`);
                        allOk = false;
                    } else {
                        console.log('DependenceChecker.checkGameVersion() satisfies', [mod.bootJson.name, n.version, gameVersion]);
                        this.log.log(`DependenceChecker.checkGameVersion() satisfies: mod[${mod.bootJson.name}] need gameVersion[${n.version}] and gameVersion satisfies [${gameVersion}].`);
                    }
                }
            }
        }
        return allOk;
    }
}
