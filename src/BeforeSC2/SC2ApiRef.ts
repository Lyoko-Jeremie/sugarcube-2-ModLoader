import {SC2DataManager} from "./SC2DataManager";

export type throwErrorType = (place: Node, message: string, source?: string) => boolean;

export interface SC2Passage {
    title: string;
    tags: string[];
    element: any | undefined;
    domId: string;
    classes: string[];
    readonly  className: string;
    readonly  text: string;
    description: () => string;
    processText: () => string;
    render: (options: any) => DocumentFragment;

}

export namespace SC2Passage {

    export function getExcerptFromNode(node: Node, count: string): string {
        // type placeholder
        return "";
    }

    export function getExcerptFromText(text: string, count: string): string {
        // type placeholder
        return "";
    }

}

export interface SC2Story {
    load: () => void;
    init: () => void;
    readonly title: string;
    readonly domId: string;
    readonly  ifId: string;
    add: (passage: SC2Passage) => boolean;
    has: (title: string) => boolean;
    get: CallableFunction;
    getAllInit: () => any[];
    getAllRegular: () => any;
    getAllScript: () => any[];
    getAllStylesheet: () => any[];
    getAllWidget: () => any[];
    lookup: CallableFunction;
    lookupWith: CallableFunction;
}

export interface SC2MacroContext {
    self: SC2MacroContext;
    parent: SC2MacroContext;
    passageObj: SC2Passage;
    name: string;
    displayName: string;
    args: string[];
    payload: string | any;
    source: string;
    parser: any;

    readonly  output: string;
    readonly  shadows: any[];
    readonly  shadowView: any[];
    readonly  debugView: any;

    contextHas: (filter: any) => boolean;
    contextSelect: (filter: any) => SC2MacroContext | undefined;
    contextSelectAll: () => SC2MacroContext [];
    addShadow: (...names: string[]) => void;
    createShadowWrapper: (callback: Function, doneCallback: Function, startCallback: Function) => ((...args: any[]) => void);
    createDebugView: (name: string, title: string) => any;
    removeDebugView: () => void;

    error: (message: string, source?: string) => ReturnType<throwErrorType>;
}

export interface SC2MacroObject {
    isWidget: boolean | undefined;
    tags: string[] | undefined;
    handler: (this: SC2MacroContext) => any;
}

export interface SC2MacroTags {
    register: (parent: string, bodyTags: string | string[]) => void;
    unregister: (parent: string) => void;
    has: (parent: string) => boolean;
    get: (parent: string) => string[];
}

export interface SC2Macro {
    add: (name: string | string[], def: SC2MacroContext) => void;
    delete: (name: string | string[]) => void;
    isEmpty: () => boolean;
    has: (name: string) => boolean;
    get: (name: string) => undefined | SC2MacroContext;
    init: (handler: string) => void;
    tags: SC2MacroTags;
}

export interface SC2Scripting {
    parse: (rawCodeString: string) => string;
    evalJavaScript: (code: string, output?: any, data?: any) => string;
    evalTwineScript: (code: string, output?: any, data?: any) => string;
}

export interface SC2Wikifier {
    passageObj: SC2Passage;
    source: string;
    options: any;
    nextMatch: number;
    output: any;

    subWikify: (output: Node, terminator: string | RegExp, options: any, passageObj: SC2Passage) => void;
    outputText: (destination: Node, startPos: number, endPos: number) => void;


    // call stack trace system
    _callDepth: number;
    _passageTitleLast: string;
    _passageObjLast: SC2Passage | undefined;
    _lastPassageQ: { passageObj: SC2Passage, passageTitle: string }[];
}


export namespace SC2Wikifier {

    // export interface Option {
    //
    // }
    // export interface Parser {
    //
    // }

    export function lastPassageQPush(passageObj: SC2Passage, passageTitle: string): number {
        // type placeholder
        return 0;
    }

    export function lastPassageQPop(): number {
        // type placeholder
        return 0;
    }

    export function lastPassageQSize(): number {
        // type placeholder
        return 0;
    }

    export function lastPassageQFront(): [number, SC2Passage] {
        // type placeholder
        return [0, {} as SC2Passage];
    }

    export function lastPassageQBack(): [number, SC2Passage] {
        // type placeholder
        return [0, {} as SC2Passage];
    }

    export function getLastPossiblePassageTitle(): string {
        // type placeholder
        return "";
    }

    export function getPassageTitleLast(): string {
        // type placeholder
        return "";
    }

    export function getPassageObjLast(): SC2Passage {
        // type placeholder
        return {} as SC2Passage;
    }

    export function wikifyEval(text: string, passageObj?: SC2Passage, passageTitle?: string): DocumentFragment {
        // type placeholder
        return document.createDocumentFragment();
    }

    export function createInternalLink(destination: DocumentFragment, passage: SC2Passage, text: string, callback: Function): DocumentFragment {
        // type placeholder
        return document.createDocumentFragment();
    }

    export function createExternalLink(destination: DocumentFragment, url: string, text: string): DocumentFragment {
        // type placeholder
        return document.createDocumentFragment();
    }

    export function isExternalLink(link: string): boolean {
        // type placeholder
        return false;
    }

}

export interface SC2ApiType {
    State: any;
    Story: SC2Story;
    Util: any;
    Wikifier: SC2Wikifier;
    Config: any;
    Engine: any;
    Macro: SC2Macro;
    Scripting: SC2Scripting;
    Setting: any;
    Save: any;
    Passage: SC2Passage;

}

export class SC2ApiRef {
    constructor(
        public gSC2DataManager: SC2DataManager,
    ) {
    }

    isInit = false;

    init() {
    }

}
