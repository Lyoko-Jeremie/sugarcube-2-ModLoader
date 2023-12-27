import {SC2DataManager} from "SC2DataManager";
import {ModUtils} from "./Utils";
import {ModInfo} from "./ModLoader";
import {LogWrapper} from "./ModLoadController";
import {
    parseRange,
    parseVersion,
    satisfies
} from './SemVer/InfiniteSemVer';
import {findIndex} from 'lodash';
import {ModOrderContainer, ModOrderItem} from "./ModOrderContainer";

export class InfiniteSemVerApi {
    parseRange = parseRange;
    parseVersion = parseVersion;
    satisfies = satisfies;
}

export class DependenceChecker {
    log: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.log = this.gSC2DataManager.getModLoadController().getLog();
    }

    public getInfiniteSemVerApi() {
        return new InfiniteSemVerApi();
    }

    /**
     * 检查指定mod是否满足指定mod集合作为前序mod的依赖关系
     *
     * check if the mod satisfies the dependencies of the specified mod set as the previous mod
     *
     * @param {ModInfo} mod - The mod to check for dependencies.
     * @param {ModOrderContainer[]} modCaches - An array of mod order containers.
     * @return {boolean} - Returns true if the mod satisfies its dependencies, false otherwise.
     */
    checkFor(mod: ModInfo, modCaches: ModOrderContainer[]): boolean {
        let isOk = true;
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
                        isOk = false;
                    }
                    continue;
                }
                const find: ModOrderItem[] = [];
                for (const modCache of modCaches) {
                    const fr = modCache.getByName(d.modName);
                    fr?.forEach(T => find.push(T));
                }
                if (find.length === 0) {
                    console.error('DependenceChecker.checkFor() not found mod before', [mod.bootJson.name, d]);
                    this.log.error(`DependenceChecker.checkFor(${mod.bootJson.name}) not found mod: mod[${mod.bootJson.name}] need mod[${d.modName}] but not find.`);
                    isOk = false;
                    continue;
                }
                for (const mod2 of find) {
                    if (!satisfies(parseVersion(mod2.mod.bootJson.version).version, parseRange(d.version))) {
                        console.error('DependenceChecker.checkFor() not satisfies', [mod.bootJson.name, d, mod2.mod.bootJson]);
                        this.log.error(`DependenceChecker.checkFor(${mod.bootJson.name}) not satisfies: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find version[${mod2.mod.bootJson.version}] from[${mod2.from}].`);
                        isOk = false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * 检查整个加载完毕的mod列表是否满足依赖约束
     *
     * Checks the dependencies of the mod order and verifies if they are satisfied.
     *
     * @return {boolean} - Returns true if all dependencies are satisfied, otherwise returns false.
     */
    check() {
        const modOrder = this.gSC2DataManager.getModLoader().getModCacheOneArray();
        const modCache = this.gSC2DataManager.getModLoader().getModCacheMap();
        // // check data state valid
        // if (modCache.size !== modOrder.length) {
        //     // never go there
        //     console.error('DependenceChecker.check() modCache.size !== modOrder.length. never go there!!!', [modCache.size, modOrder.length]);
        //     this.log.error(`DependenceChecker.check() modCache.size !== modOrder.length. never go there!!!: modCache.size[${modCache.size}] !== modOrder.length[${modOrder.length}].`);
        // }
        // if (!isEqual(Array.from(modCache.keys()).sort(), clone(modOrder).sort())) {
        //     // never go there
        //     console.error('DependenceChecker.check() modCache.keys() !== modOrder. never go there!!!', [Array.from(modCache.keys()).sort(), clone(modOrder).sort()]);
        //     this.log.error(`DependenceChecker.check() modCache.keys() !== modOrder. never go there!!!.`);
        // }
        let allOk = true;
        for (let i = 0; i !== modOrder.length; ++i) {
            const mod = modOrder[i].mod;
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
                    const mod2 = modCache.get(d.modName)?.mod;
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
                    const ii = findIndex(modOrder, T => T.name === mod2.bootJson.name);
                    if (!(ii >= 0)) {
                        // never go there
                        console.error('DependenceChecker.check() cannot find mod in modOrder. never go there.', [mod.bootJson.name, mod2.bootJson, modOrder, ii]);
                        this.log.error(`DependenceChecker.check() cannot find mod in modOrder: mod[${mod.bootJson.name}] need mod[${d.modName}] but mod[${d.modName}] not find in modOrder. never go there.`);
                        continue;
                    }
                    if (!(ii < i)) {
                        console.error('DependenceChecker.check() not satisfies order', [mod.bootJson.name, d, mod2.bootJson.name, mod2.bootJson, modOrder, ii, i]);
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
        const modArray = this.gSC2DataManager.getModLoader().getModCacheOneArray();
        let allOk = true;
        for (const mod of modArray) {
            if (mod.mod.bootJson.dependenceInfo) {
                const n = mod.mod.bootJson.dependenceInfo.find(T => T.modName === 'GameVersion');
                if (n) {
                    if (!satisfies(parseVersion(gameVersion).version, parseRange(n.version), true)) {
                        console.error('DependenceChecker.checkGameVersion() not satisfies', [mod.mod.bootJson.name, n.version, gameVersion]);
                        this.log.error(`DependenceChecker.checkGameVersion() not satisfies: mod[${mod.mod.bootJson.name}] need gameVersion[${n.version}] but gameVersion is [${gameVersion}].`);
                        allOk = false;
                    } else {
                        console.log('DependenceChecker.checkGameVersion() satisfies', [mod.mod.bootJson.name, n.version, gameVersion]);
                        this.log.log(`DependenceChecker.checkGameVersion() satisfies: mod[${mod.mod.bootJson.name}] need gameVersion[${n.version}] and gameVersion satisfies [${gameVersion}].`);
                    }
                }
            }
        }
        return allOk;
    }
}
