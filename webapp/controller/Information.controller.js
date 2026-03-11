sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/base/Log"
], function (
	Controller,Log
) {
	"use strict";
	/**
	 * Controller: Information
	 *
	 * This controller manages the Information page of the application.
	 * Responsibilities include:
	 * - Setting the page image icon.
	 * - Fetching and displaying the installed product version.
	 *
	 * @namespace pl.dac.apps.fnconfig.controller.Information
	 */
	return Controller.extend("pl.dac.apps.fnconfig.controller.Information", {

		/**
		 * Lifecycle hook executed when the controller is instantiated.
		 *
		 * Currently performs no specific initialization.
		 *
		 * @function onInit
		 * @public
		 * @override
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onInit: function () {

		},
		
		/**
		 * Lifecycle hook executed after the view has been rendered.
		 *
		 * Processing steps:
		 * 1. Retrieves the image control (`idInfoPageImg`) and sets its `src` property
		 *    to the local icon asset.
		 * 2. Calls `_getInstallProductVersion` to fetch and display the installed
		 *    product version from the backend.
		 *
		 * Dependencies:
		 * - jQuery.sap.getModulePath for resolving local module paths
		 * - `_getInstallProductVersion` for version retrieval
		 *
		 * @function onAfterRendering
		 * @public
		 * @override
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onAfterRendering: function () {
			var oImage = this.getView().byId("idInfoPageImg");
			oImage.setSrc(jQuery.sap.getModulePath("pl.dac.apps.fnconfig") + "/assets/icon.png");
			this._getInstallProductVersion();
		},

		/**
		 * Fetches the installed product version from the backend via OData function import.
		 *
		 * Processing steps:
		 * 1. Calls the OData function import `/Func_Imp_Get_Version` using GET.
		 * 2. On success:
		 *    - Checks that the response contains results.
		 *    - Updates the `idTextProductVersion` text control with the version value.
		 * 3. On error:
		 *    - Logs the error using `Log.error`.
		 *
		 * Dependencies:
		 * - OData model for function import
		 * - sap.base.Log for error logging
		 * - View controls: `idTextProductVersion`
		 *
		 * @function _getInstallProductVersion
		 * @private
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		_getInstallProductVersion:function(){
			var oView=this.getView(), oDataModel = oView.getModel();
			oDataModel.callFunction("/Func_Imp_Get_Version", {
			method: "GET", // Or "POST" depending on your OData service definition
			success: function(oData) {
				if(({}).hasOwnProperty.call(oData,"results") && oData.results.length>0 ){
						oView.byId("idTextProductVersion").setText(oData.results[0].Vrsio);
				}
			}.bind(this), // Use .bind(this) to access the controller's context
			error: function(oError) {
				Log.error("Function import failed:"+ oError);
			}
		});
		}
	});
});