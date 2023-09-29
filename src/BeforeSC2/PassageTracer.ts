type whenPassageCome = (passageName: string) => void;

export class PassageTracer {
    constructor(public thisWin: Window) {
    }

    init() {
        this.thisWin.jQuery(this.thisWin.document).on(":passageend", () => {
            this.newPassageCome();
        });
    }

    private whenPassageComeCallback: whenPassageCome[] = [];

    addCallback(cb: whenPassageCome) {
        this.whenPassageComeCallback.push(cb);
    }

    newPassageCome() {
        const pe = Array.from(this.thisWin.document.getElementsByClassName('passage'));
        if (pe.length !== 1) {
            console.log('newPassageCome() (pe.length !== 0)', pe);
            return;
        }
        const p: HTMLDivElement = pe[0] as HTMLDivElement;
        const dpName = p.getAttribute('data-passage');
        if (!dpName) {
            console.log('newPassageCome() (!dpName)', p);
            return;
        }
        console.log('newPassageCome() dpName', dpName);
        for (let i = 0; i < this.whenPassageComeCallback.length; i++) {
            const cb = this.whenPassageComeCallback[i];
            cb(dpName);
        }
    }

}
