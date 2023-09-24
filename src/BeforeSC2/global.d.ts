import type JQueryStatic from 'jquery/JQueryStatic';

declare global {
    interface Window {
        jQuery: JQueryStatic;
    }
}
