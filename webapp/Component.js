sap.ui.define([
    'sap/ui/core/UIComponent',
    'sap/ui/Device',
    'pl/dac/apps/fnconfig/model/models',
    'sap/ui/model/json/JSONModel'
],
    function (UIComponent, Device, models, JSONModel) {
        "use strict";
        return UIComponent.extend('pl.dac.apps.fnconfig.Component', {
            metadata: {
                manifest: "json"
            },
            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                /*eslint-disable*/
                UIComponent.prototype.init.apply(this, arguments);
                 /*eslint-enable*/
                this.setModel(new JSONModel({ layout: "OneColumn" }), "layoutMode");
                this.getRouter().initialize();
            }
        });
    }
);