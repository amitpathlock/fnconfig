
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "pl/dac/apps/fnconfig/const/PlDacConst",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (
    Controller,
    PlDacConst,
    JSONModel,
    Filter,
    FilterOperator
) {
    "use strict";

    return Controller.extend("pl.dac.apps.fnconfig.controller.Master", {
        onInit: function () {
            this._oRouter = this.getOwnerComponent().getRouter();
            sap.ui.core.BusyIndicator.show();
            this._loadActionSet();
        },
        /*
         #Event handler of sap.ui.core.routing.Route~patternMatched
        */
        _onRouteMatched: function (oEvent) {

            sap.ui.core.BusyIndicator.hide();
        },
        /** ## Method has been defined for handle
         * Event handler of "sap.m.Tree~selectionChange"
         * @param {sap.ui.base.Event} oEvent
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
         * A Private methed defines for create tree action item set
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
                    var oJSONModel = new JSONModel(lArr);
                    this.getView().setModel(oJSONModel, "actionData"); // Set local JSON model
                    sap.ui.core.BusyIndicator.hide();
                }.bind(this), // Bind 'this' to the controller context
                error: function (oError) {
                    // Error occurred during data retrieval
                    /* eslint-disable no-console */
                    console.error("Read failed:", oError);
                    /* eslint-enable no-console */
                    sap.ui.core.BusyIndicator.hide();
                }
            });
        },

        onAfterRendering: function () {
            if (!hasher.getHashAsArray()[1] || hasher.getHashAsArray()[1] == PlDacConst.ROUTE_PATH_INFO) {
                this._oRouter.navTo(PlDacConst.ROUTE_PATH_INFO);

            }
            this.getView().getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
        }
    });
});