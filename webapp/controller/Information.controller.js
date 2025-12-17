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
		}
	});
});