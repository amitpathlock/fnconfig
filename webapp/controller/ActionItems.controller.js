
sap.ui.define([
    "pl/dac/apps/fnconfig/controller/BaseController",
    "pl/dac/apps/fnconfig/const/PlDacConst"
], function (
    BaseController,
    PlDacConst
) {
    "use strict";

    return BaseController.extend("pl.dac.apps.fnconfig.controller.ActionItems", {

        /**
         * Controller initialization lifecycle hook.
         *
         * This method is executed automatically when the controller is instantiated.
         * It performs the initial setup for the view by:
         *
         * 1. Retrieving the router instance from the owner component.
         * 2. Showing the global BusyIndicator to indicate loading.
         * 3. Loading the initial set of actions by calling `_loadActionSet()`.
         *
         * Dependencies:
         * - OwnerComponent router
         * - sap.ui.core.BusyIndicator
         * - `_loadActionSet()` method for initializing the action data
         *
         * @function onInit
         * @public
         * @override
         * @this sap.ui.core.mvc.Controller
         * @returns {void}
         */
        onInit: function () {
            var oView = this.getView();
            this.getOwnerComponent().oActionTreeTable = oView.getContent()[0].getContent()[0]; // Tree table
            this._oRouter = this.getOwnerComponent().getRouter();
        },

        /**
         * Handles the selection change event in a master list.
         *
         * This method is triggered when a user selects an item in the list.
         * It performs navigation and layout adjustments based on the selected item.
         *
         * Processing steps:
         * 1. Retrieves the binding context of the selected list item to get its data.
         * 2. Sets the layout mode to `"TwoColumnsMidExpanded"` in the `layoutMode` model.
         * 3. If the selected item has a non-empty `Target` property:
         *    - Shows the BusyIndicator if the current URL hash differs from the target.
         *    - Navigates to the target route using the router.
         *
         * Dependencies:
         * - Router instance (`this._oRouter`) for navigation
         * - `layoutMode` JSONModel for controlling layout
         * - sap.ui.core.BusyIndicator for showing loading state
         * - hasher library to check the current URL hash
         *
         * @function onSelectionChange
         * @public
         * @param {sap.ui.base.Event} oEvent - Event object from the selection change
         * @this sap.ui.core.mvc.Controller
         * @returns {void}
         */
        onSelectionChange: function (oEvent) {
            var oContextData = oEvent.getParameter("listItem").getBinding("icon").getContext().getObject();
            this.getView().getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");

            if (oContextData.Target != "") {
                if (hasher.getHashAsArray()[1] && hasher.getHashAsArray()[1] != oContextData.Target.trim()) {
                    sap.ui.core.BusyIndicator.show();
                }
                this._oRouter.navTo(oContextData.Target.trim());
            }
        },


        /**
         * Lifecycle hook executed after the view has been rendered.
         *
         * This method is automatically called by the SAPUI5 framework once the
         * view's DOM is fully loaded. It performs post-rendering navigation
         * and layout setup:
         *
         * Processing steps:
         * 1. Checks the current URL hash using the `hasher` library:
         *    - If there is no second hash segment or it equals `PlDacConst.ROUTE_PATH_INFO`,
         *      navigates to the `ROUTE_PATH_INFO` route using the router.
         * 2. Updates the `layoutMode` JSON model to `"TwoColumnsMidExpanded"` to
         *    ensure the master-detail layout is expanded in the mid column.
         *
         * Dependencies:
         * - Router instance (`this._oRouter`) for navigation
         * - `layoutMode` JSONModel for controlling the layout
         * - hasher library for URL hash inspection
         *
         * @function onAfterRendering
         * @public
         * @override
         * @this sap.ui.core.mvc.Controller
         * @returns {void}
         */
        onAfterRendering: function () {
            if (!hasher.getHashAsArray()[1] || hasher.getHashAsArray()[1] == PlDacConst.ROUTE_PATH_INFO) {
                this._oRouter.navTo(PlDacConst.ROUTE_PATH_INFO);

            }
            this.getView().getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
        }
    });
});