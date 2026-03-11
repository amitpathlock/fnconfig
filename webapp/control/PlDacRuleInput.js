sap.ui.define([
    "sap/m/Input",
    "sap/m/InputRenderer",
    "sap/ui/core/Icon"
], function (
    Input,
    InputRenderer,
    Icon
) {
    "use strict";
    /**
     * Constructor for a custom Input control with an integrated value-help icon.
     *
     * @class
     * Extended sap.m.Input that displays a value-help icon next to the input field
     * and fires a custom event when the icon is pressed.
     *
     * @extends sap.m.Input
     *
     * @author Amit Kumar
     * @version 1.0.0
     *
     * @alias pl.dac.apps.fnconfig.control.PlDacRuleInput
     */
    return Input.extend("pl.dac.apps.fnconfig.control.PlDacRuleInput", {
        metadata: {
            /**
            * Control properties.
            */
            properties: {
                /**
                * Defines the width of the control.
                *
                * @type {sap.ui.core.CSSSize}
                * @default "100%"
                */
                width: {
                    type: "sap.ui.core.CSSSize",
                    defaultValue: "100%"
                }

            },
            /**
             * Hidden aggregations used internally.
             */
            aggregations: {
                /**
                * Internal value-help icon.
                *
                * @type {sap.ui.core.Icon}
                * @private
                */
                _vhIcon: {
                    type: "sap.ui.core.Icon",
                    multiple: false,
                    visibility: "hidden"
                }
            },
            /**
             * Control events.
             */
            events: {
                /**
                 * Fired when the value-help icon is pressed.
                 *
                 * @param {sap.ui.base.Event} event
                 * The press event of the icon.
                 */
                showValueDialog: {
                    enablePreventDefault: true
                }
            }
        },
        /**
         * Initializes the control and creates the value-help icon.
         *
         * @public
         */
        init: function () {
            Input.prototype.init.apply(this, arguments);
            const oIcon = new Icon({
                src: "sap-icon://value-help",
                press: function (oEvent) {
                    /**
                    * Fires the showValueDialog event.
                    */
                    this.fireShowValueDialog({ event: oEvent });
                }.bind(this)
            });
            oIcon.addStyleClass("plDacRuleInputIcon");
            this.setAggregation("_vhIcon", oIcon);
        },
        /**
        * Cleans up internal resources.
        *
        * @public
        */
        exit: function () {
            this.destroyAggregation("_vhIcon");
        },
        renderer: {
            /**
             * Renders the HTML for the control.
             *
             * @param {sap.ui.core.RenderManager} oRm RenderManager instance
             * @param {pl.dac.apps.fnconfig.control.PlDacRuleInput} oControl The control instance
             */
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.class("plDacRuleInput");
                oRm.style("width", oControl.getWidth());
                oRm.openEnd();

                // Render the base Input control
                InputRenderer.render(oRm, oControl);

                // Render the value help icon
                oRm.renderControl(oControl.getAggregation("_vhIcon"));

                oRm.close("div");
            }
        }
    });
});
