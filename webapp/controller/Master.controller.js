
sap.ui.define([
    "pl/dac/apps/fnconfig/controller/BaseController",
    "pl/dac/apps/fnconfig/const/PlDacConst",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/base/Log"
], function (
    BaseController,
    PlDacConst,
    JSONModel,
    Filter,
    FilterOperator,
    Log
) {
    "use strict";

    return BaseController.extend("pl.dac.apps.fnconfig.controller.Master", {

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
            this._oRouter = this.getOwnerComponent().getRouter();
            sap.ui.core.BusyIndicator.show();
            this._loadActionSet();
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
         * Loads the active action set from the backend and populates the view model.
         *
         * This method performs the following steps:
         * 1. Creates a filter to retrieve only actions with `Status` equal to 1.
         * 2. Reads the `PlDacConst.ENTITY_SET_ACTION_PATH` entity set with the filter,
         *    expanding the `to_ActionItem` navigation property.
         * 3. On success:
         *    - Iterates through each action and its child action items.
         *    - Constructs a hierarchical JSON structure containing:
         *        • `Name` – Action or action item text
         *        • `Icon` – Associated icon
         *        • `Target` – Navigation target
         *        • `nodes` – Child action items (if any)
         *    - Stores the structured array in a local JSON model `actionData`.
         *    - Hides the global BusyIndicator.
         * 4. On error:
         *    - Logs the error.
         *    - Hides the global BusyIndicator.
         *
         * Dependencies:
         * - Default OData model (`sap.ui.model.odata.v2.ODataModel`) from the owner component
         * - sap.ui.model.Filter and FilterOperator for filtering
         * - JSONModel for local data storage
         * - sap.ui.core.BusyIndicator for loading state
         * - sap.base.Log for error logging
         *
         * @function _loadActionSet
         * @private
         * @this sap.ui.core.mvc.Controller
         * @returns {void}
         */
        _loadActionSet: function () {
            var oFilter, aFilter, oModel = this.getOwnerComponent().getModel();
            oFilter = new Filter("Status", FilterOperator.EQ, 1);
            aFilter = [oFilter];
            oModel.read(PlDacConst.ENTITY_SET_ACTION_PATH, {
                filters: aFilter,
                urlParameters: {
                    "$expand": "to_ActionItem" // Expand to_ActionItem
                },
                success: function (oData) {
                    var lArr = [], i, j;
                    if (oData && ({}).hasOwnProperty.call(oData, "results")) {
                        for (i = 0; i < oData.results.length; i++) {
                            var lNodes = [], oNode = {};
                            for (j = 0; j < oData.results[i].to_ActionItem.results.length; j++) {
                                lNodes.push({
                                    Name: oData.results[i].to_ActionItem.results[j].Text,
                                    Icon: oData.results[i].to_ActionItem.results[j].Icon,
                                    Target: oData.results[i].to_ActionItem.results[j].Target
                                });
                            }
                            oNode["Name"] = oData.results[i].Text;
                            oNode["Icon"] = oData.results[i].Icon;
                            oNode["Target"] = oData.results[i].Target;
                            if (lNodes.length > 0) {
                                oNode["nodes"] = lNodes;
                            }
                            lArr.push(oNode);
                        }
                    } else {
                        Log.error("Error" + oData);
                    }

                    var oJSONModel = new JSONModel(lArr);
                    this.getView().setModel(oJSONModel, "actionData"); // Set local JSON model
                    sap.ui.core.BusyIndicator.hide();
                }.bind(this), // Bind 'this' to the controller context
                error: function (oError) {
                    Log.error("Read failed:" + oError);
                    sap.ui.core.BusyIndicator.hide();
                }
            });
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