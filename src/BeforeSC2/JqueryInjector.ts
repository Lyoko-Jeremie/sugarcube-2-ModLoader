/*
 * try to use jQ.ready to hook the init to run before SC2, but failed
 */

// import $ from "expose-loader?exposes=$,jQuery!jquery";
// import $ from 'jquery';

// http://api.jquery.com/jQuery.holdReady/

export function Inject4Jquery(thisWin: Window) {

    console.log('JqueryInjector ============= Inject4Jquery()');
    thisWin.$.holdReady(true);
    // thisWin.jQuery = $;
    // thisWin.$ = $;

    thisWin.$(async () => {
        try {
            console.log('JqueryInjector ============= startInit()');
            await thisWin.modSC2DataManager.startInit();
            console.log('JqueryInjector ============= startLoad()');
            await thisWin.jsPreloader.startLoad();
        } catch (e) {
            console.error('Inject4Jquery', e);
        }
        thisWin.$.holdReady(false);
    });
}
