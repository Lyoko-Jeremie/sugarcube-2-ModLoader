export class Passage {
    get className(): string;

    get text(): string | any;

    get title(): string | any;

    description(): string | null;

    processText(): string | null;

    render(options): DocumentFragment;

    static getExcerptFromNode(node, count): string;

    static getExcerptFromText(node, count): string;
}

declare global {

    interface SugarCube {
        Passage: typeof Passage;
    }
}
