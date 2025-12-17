sap.ui.define([
    "sap/m/Input",
    "sap/ui/core/Icon",
    "sap/m/FlexItemData"
], function (
    Input, Icon, FlexItemData
) {
    "use strict";

    return Input.extend("pl.dac.apps.fnconfig.control.PlDacRuleInput", {
        metadata: {
            properties: {
                width: {
                    type: "string",
                    defaultValue: "100%"
                }, /// setting default width
                value: {
                    type: "string",
                    defaultValue: ""
                }/// for Cordova plug-in recognition object
            },
            aggregations: {
                _vhicon: {
                    type: "sap.ui.core.Icon",
                    multiple: false,
                    visibility: "hidden"
                }
            },
            events: {
                showValueDialog: {
                    enablePreventDefault: true
                }
            }
        },
        init: function () {
            var _vhicon = new Icon({
                src: "sap-icon://value-help",
                press: function (oEvent) {
                    this.fireShowValueDialog({ event: oEvent });
                }.bind(this)
            });
            _vhicon.addStyleClass("plDacRuleInputIcon");
            this.setAggregation("_vhicon", _vhicon);
        },
        renderer: {
            render: function (oRm, oControl) { /////// Render the control
                oRm.write("<div");
                oRm.writeControlData(oControl);
                oRm.addClass("plDacRuleInput");////// Render control data
                oRm.writeStyles();
                oRm.write(">");
                sap.m.InputRenderer.render(oRm, oControl); //// pass the control to base renderer
                oRm.renderControl(oControl.getAggregation("_vhicon")); /// pass aggregated control for rendering
                oRm.write("</div>");
            }
        }
    });
});