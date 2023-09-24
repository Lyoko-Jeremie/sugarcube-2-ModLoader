import type JQueryStatic from 'jquery/JQueryStatic';

declare global {
    interface Window {
        jQuery: JQueryStatic;

        modSC2DataManager: SC2DataManager;
        modUtils: ModUtils;
        jsPreloader: JsPreloader;
        modModLoadController: ModLoadController;
        modAddonPluginManager: AddonPluginManager;
        modSC2JsEvalContext: SC2JsEvalContext;
    }
}
