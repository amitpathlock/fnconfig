
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/base/Log"
], function (
	Controller,
	PlDacConst,
	JSONModel,
	MessageToast,
	Log
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
		_onRouteMatched: function () {

			var oView = this.getView(), oModel = oView.getModel();
			oView.setModel(new JSONModel([]), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			oModel.callFunction("/Func_Imp_Get_Status", {
				method: "GET", // Or "POST" depending on your function import's HTTP method
				success: function (oData) {
					oView.getModel("viewModel").setData(oData.results);

				},
				error: function (oError) {
					Log.error("Function import failed:"+ oError);
					
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
				success: function () {
					oView.setBusy(false);
					oPage.getController()._loadActionSet();
					MessageToast.show(oBundle.getText("msgswitchButtonMsg"));
				},
				error: function (oError) {
				
					oView.setBusy(false);
					Log.error("Function import failed:"+oError)
					
				}
			});
		},
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		}
	});
});