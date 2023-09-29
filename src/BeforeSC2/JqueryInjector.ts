import jq from 'jquery';


export function Inject4Jquery(thisWin: Window) {
    thisWin.jQuery = jq;

    thisWin.jQuery(async () => {
        console.log('JqueryInjector ============= startInit()');
        await thisWin.modSC2DataManager.startInit();
        console.log('JqueryInjector ============= startLoad()');
        await thisWin.jsPreloader.startLoad();
    });
}
