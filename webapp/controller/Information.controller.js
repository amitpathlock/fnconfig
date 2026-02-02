sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (
	Controller
) {
	"use strict";

	return Controller.extend("pl.dac.apps.fnconfig.controller.Information", {

		onInit: function () {

		},
		/**
		 * @override
		 * @returns {void|undefined}
		 */
		onAfterRendering: function () {
			var oImage = this.getView().byId("idInfoPageImg");
			oImage.setSrc(jQuery.sap.getModulePath("pl.dac.apps.fnconfig") + "/assets/icon.png");
			this._getInstallProductVersion();
		},
		_getInstallProductVersion:function(){
			var oView=this.getView(), oDataModel = oView.getModel();
			oDataModel.callFunction("/Func_Imp_Get_Version", {
			method: "GET", // Or "POST" depending on your OData service definition
			success: function(oData) {
				if(({}).hasOwnProperty.call(oData,"results") && oData.results.length>0 ){
						oView.byId("idTextProductVersion").setText(oData.results[0].Vrsio);
				}
				// Success handler: process the returned data (oData)
				
				// e.g., to bind the result to a model for display
				// var oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
				// this.getView().setModel(oJsonModel, "resultsModel");
			}.bind(this), // Use .bind(this) to access the controller's context
			error: function(oError) {
				// Error handler: handle the error (oError)
				console.error("Function Import failed: ", oError);
			}
		});
		}
	});
});