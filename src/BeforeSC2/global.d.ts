import type JQueryStatic from 'jquery/JQueryStatic';

// declare var $: JQueryStatic;
// declare var jQuery: JQueryStatic;

declare global {
    interface Window {
        jQuery: JQueryStatic;
        $: JQueryStatic;

        modSC2DataManager: SC2DataManager;
        modUtils: ModUtils;
        jsPreloader: JsPreloader;
        modModLoadController: ModLoadController;
        modAddonPluginManager: AddonPluginManager;
        modSC2JsEvalContext: SC2JsEvalContext;
    }
}
