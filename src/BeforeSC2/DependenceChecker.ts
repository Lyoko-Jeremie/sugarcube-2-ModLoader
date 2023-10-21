import {SC2DataManager} from "SC2DataManager";
import {ModUtils} from "./Utils";
import {ModInfo} from "./ModLoader";
import {LogWrapper} from "./ModLoadController";
import {
    parseRange,
    parseVersion,
    satisfies
} from './SemVer/InfiniteSemVer';
import {isEqual, clone} from 'lodash';


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
                if (d.modName === 'GameVersion') {
                    // skip
                    continue;
                }
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
        const modOrder = this.gSC2DataManager.getModLoader().modOrder;
        // check data state valid
        if (modCache.size !== modOrder.length) {
            // never go there
            console.error('DependenceChecker.check() modCache.size !== modOrder.length. never go there!!!', [modCache.size, modOrder.length]);
            this.log.error(`DependenceChecker.check() modCache.size !== modOrder.length. never go there!!!: modCache.size[${modCache.size}] !== modOrder.length[${modOrder.length}].`);
        }
        if (!isEqual(Array.from(modCache.keys()).sort(), clone(modOrder).sort())) {
            // never go there
            console.error('DependenceChecker.check() modCache.keys() !== modOrder. never go there!!!', [Array.from(modCache.keys()).sort(), clone(modOrder).sort()]);
            this.log.error(`DependenceChecker.check() modCache.keys() !== modOrder. never go there!!!.`);
        }
        let allOk = true;
        for (let i = 0; i !== modOrder.length; ++i) {
            const mod = modCache.get(modOrder[i]);
            if (!mod) {
                // never go there
                console.error('DependenceChecker.check() cannot find mod. never go there!!!', [modOrder[i]]);
                this.log.error(`DependenceChecker.check() cannot find mod. never go there!!!: mod[${modOrder[i]}] not found.`);
                continue;
            }
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
                    // check by order
                    const ii = modOrder.indexOf(mod2.bootJson.name);
                    if (!(ii > 0)) {
                        // never go there
                        console.error('DependenceChecker.check() cannot find mod in modOrder', [mod.bootJson.name, mod2.bootJson, modOrder]);
                        this.log.error(`DependenceChecker.check() cannot find mod in modOrder: mod[${mod.bootJson.name}] need mod[${d.modName}] but mod[${d.modName}] not find in modOrder.`);
                        continue;
                    }
                    if (!(modOrder.indexOf(mod2.bootJson.name) < i)) {
                        console.error('DependenceChecker.check() not satisfies order', [mod.bootJson.name, d, mod2.bootJson.name, mod2.bootJson, modOrder, modOrder.indexOf(mod2.bootJson.name), i]);
                        this.log.error(`DependenceChecker.check() not satisfies order: mod[${mod.bootJson.name}] need mod[${d.modName}] load before it.`);
                        allOk = false;
                        continue;
                    }
                }
            }
        }
        return allOk;
    }

    /**
     * this called by mod `CheckGameVersion`
     * because the game version only can get after game loaded
     * @param gameVersion
     */
    checkGameVersion(gameVersion: string) {
        const modCache = this.gSC2DataManager.getModLoader().modCache;
        let allOk = true;
        for (const mod of modCache.values()) {
            if (mod.bootJson.dependenceInfo) {
                const n = mod.bootJson.dependenceInfo.find(T => T.modName === 'GameVersion');
                if (n) {
                    if (!satisfies(parseVersion(gameVersion).version, parseRange(n.version), true)) {
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
