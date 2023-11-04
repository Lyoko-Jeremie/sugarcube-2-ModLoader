import {SC2DataManager} from "./SC2DataManager";
import {LogWrapper} from "./ModLoadController";

export const MainLanguageTypeEnum = [
    'en',
    'zh',
] as const;

export class LanguageManager {
    private logger: LogWrapper;

    constructor(
        public thisWin: Window,
        public gSC2DataManager: SC2DataManager,
    ) {
        this.logger = gSC2DataManager.getModUtils().getLogger();
    }

    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/language
     * https://www.rfc-editor.org/rfc/bcp/bcp47.txt
     * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
     *
     * @return https://stackoverflow.com/questions/5580876/navigator-language-list-of-all-languages
     */
    getLanguage() {
        const w = this.thisWin;
        return w.navigator.language;
    }

    mainLanguage: typeof MainLanguageTypeEnum[number] = "en";

}

