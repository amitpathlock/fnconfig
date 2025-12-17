
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (
	Controller,
	PlDacConst,
	JSONModel,
	MessageToast
) {
	"use strict";
	return Controller.extend("pl.dac.apps.fnconfig.controller.Functionality", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute(PlDacConst.ROUTE_PATH_FUNCTIONALITY).attachPatternMatched(this._onRouteMatched, this);
		},
		/*
		 #Event handler of sap.ui.core.routing.Route~patternMatched
		*/
		_onRouteMatched: function (oEvent) {

			var oView = this.getView(), oModel = oView.getModel();
			oView.setModel(new JSONModel([]), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			oModel.callFunction("/Func_Imp_Get_Status", {
				method: "GET", // Or "POST" depending on your function import's HTTP method
				success: function (oData, response) {
					oView.getModel("viewModel").setData(oData.results);

				},
				error: function (oError) {
					/* eslint-disable no-console */
					console.error("Function import failed:", oError);
					/* eslint-enable no-console */
				}
			});
		},
		/*
		 #Event handler of sap.m.Switch~Change
		*/
		onSwitchChange: function (oEvent) {
			var oCtx, oURLParameters, oPage, oBundle, oView = this.getView(), oModel = oView.getModel();
			oCtx = oEvent.getSource().getBinding("state").getContext().getObject();
			oPage = oView.getParent().getParent().getAggregation("_beginColumnNav").getAggregation("pages")[0];
			oURLParameters = {
				"FunctionalityType": oCtx.FunctionalityType,
				"Status": oCtx.Status
			};
			oView.setBusy(true);
			oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.callFunction("/Func_Imp_Set_Status", {
				method: "POST", // Or "POST" depending on your function import's HTTP method
				urlParameters: oURLParameters,
				success: function (oData, response) {
					oView.setBusy(false);
					oPage.getController()._loadActionSet();
					MessageToast.show(oBundle.getText("msgswitchButtonMsg"));
				},
				error: function (oError) {
					/* eslint-disable no-console */
					oView.setBusy(false);
					console.error("Function import failed:", oError);
					/* eslint-enable no-console */
				}
			});
		},
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		}
	});
});