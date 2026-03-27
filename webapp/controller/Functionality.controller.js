
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/base/Log"
], function (
	BaseController,
	PlDacConst,
	JSONModel,
	MessageToast,
	Log
) {
	"use strict";
	return BaseController.extend("pl.dac.apps.fnconfig.controller.Functionality", {

		/**
		 * Controller initialization lifecycle hook.
		 *
		 * This method is called automatically when the controller is instantiated.
		 * It performs the initial setup for the Functionality view by:
		 *
		 * 1. Retrieving the router instance from the owner component.
		 * 2. Attaching the `_onRouteMatched` handler to the route defined by
		 *    `PlDacConst.ROUTE_PATH_FUNCTIONALITY`. This ensures that `_onRouteMatched`
		 *    is executed whenever the route is navigated to.
		 *
		 * Dependencies:
		 * - OwnerComponent router
		 * - PlDacConst.ROUTE_PATH_FUNCTIONALITY (route name constant)
		 *
		 * @function onInit
		 * @public
		 * @override
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		lArr: new Array(),
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute(PlDacConst.ROUTE_PATH_FUNCTIONALITY).attachPatternMatched(this._onRouteMatched, this);
		},

		/**
		 * Route match event handler for the Functionality view.
		 *
		 * This method is executed whenever the `PlDacConst.ROUTE_PATH_FUNCTIONALITY`
		 * route is matched. It initializes the view model and triggers a backend
		 * function import to fetch the current functionality implementation status.
		 *
		 * Processing steps:
		 * 1. Initializes the `viewModel` as an empty JSONModel to hold function data.
		 * 2. Hides the global BusyIndicator to unblock the UI.
		 * 3. Calls the OData function import `/Func_Imp_Get_Status` with the GET method.
		 *    - On success: populates `viewModel` with `oData.results`.
		 *    - On error: logs the backend error using `Log.error`.
		 *
		 * Dependencies:
		 * - Default OData model (`sap.ui.model.odata.v2.ODataModel`)
		 * - viewModel (JSONModel) for storing function data
		 * - sap.ui.core.BusyIndicator
		 * - sap.base.Log for error logging
		 *
		 * @function _onRouteMatched
		 * @private
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
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
					Log.error("Function import failed:" + oError);

				}
			});
			if (!this.getOwnerComponent().oActionTreeTable) {
				this.getOwnerComponent().oActionTreeTable = oView.getParent().getParent().getAggregation("_beginColumnNav").getAggregation("pages")[0].getContent()[0].getContent()[0];
			}
			var oTree = this.getOwnerComponent().oActionTreeTable;
			oTree.attachUpdateFinished(function () {
				var lArr = this.lArr, aExpandedNodes, iExpand;
				aExpandedNodes = oTree.getItems();
				for (iExpand = 0; iExpand < aExpandedNodes.length; iExpand++) {
					for (var i = 0; i < lArr.length; i++) {
						if (aExpandedNodes[iExpand].getTitle() == lArr[i].getTitle()) {
							oTree.onItemExpanderPressed(aExpandedNodes[iExpand], true);
						}
					}
				}
				oTree.setBusy(false);
			}.bind(this));
		},

		/**
		 * Handles the switch toggle event to update the status of a functionality.
		 *
		 * This method is triggered when the user changes the state of a switch in the UI.
		 * It calls an OData function import to update the backend status of the selected functionality.
		 *
		 * Processing steps:
		 * 1. Retrieves the context object (`oCtx`) bound to the switch's `state`.
		 * 2. Constructs URL parameters for the function import:
		 *    - `FunctionalityType` – the type of functionality being updated.
		 *    - `Status` – the new status of the functionality.
		 * 3. Sets the view as busy to block UI interactions.
		 * 4. Calls the OData function import `/Func_Imp_Set_Status` using POST:
		 *    - On success:
		 *      • Clears the busy state.
		 *      • Calls `_loadActionSet()` on the first page of the begin column to refresh actions.
		 *      • Shows a localized success message using `MessageToast`.
		 *    - On error:
		 *      • Clears the busy state.
		 *      • Logs the error using `Log.error`.
		 *
		 * Dependencies:
		 * - OData model (`sap.ui.model.odata.v2.ODataModel`) for function imports
		 * - i18n ResourceBundle for localized messages
		 * - MessageToast for user feedback
		 * - sap.base.Log for error logging
		 * - `_loadActionSet()` method in the page controller
		 *
		 * @function onSwitchChange
		 * @public
		 * @param {sap.ui.base.Event} oEvent - The event object for the switch toggle.
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onSwitchChange: function (oEvent) {
			var oCtx, oURLParameters, aExpandedNodes, iExpand, oView = this.getView(), oModel = oView.getModel();
			oCtx = oEvent.getSource().getBinding("state").getContext().getObject();

			oURLParameters = {
				"FunctionalityType": oCtx.FunctionalityType,
				"Status": oCtx.Status
			};

			this.lArr = new Array();
			oView.setBusy(true);
			oModel.callFunction("/Func_Imp_Set_Status", {
				method: "POST", // Or "POST" depending on your function import's HTTP method
				urlParameters: oURLParameters,
				success: function (oData,oResponse) {
					
					oView.setBusy(false);

					aExpandedNodes = this.getOwnerComponent().oActionTreeTable.getItems();
					for (iExpand = 0; iExpand < aExpandedNodes.length; iExpand++) {
						if (aExpandedNodes[iExpand].getExpanded()) {
							this.lArr.push(aExpandedNodes[iExpand]);
						}
					}
					this.getOwnerComponent().oActionTreeTable.getBinding("items").refresh();
					this.getOwnerComponent().oActionTreeTable.setBusy(true);
					MessageToast.show(JSON.parse(oResponse.headers["sap-message"]).message);
				}.bind(this),
				error: function (oError) {

					oView.setBusy(false);
					Log.error("Function import failed:" + oError)

				}
			});
		},

		/**
		 * Lifecycle hook executed after the Functionality view has been rendered.
		 *
		 * This method is automatically called by the SAPUI5 framework once the
		 * view's DOM is fully loaded and rendered.
		 *
		 * Current implementation:
		 * - Hides the global BusyIndicator to unblock the UI after rendering.
		 *
		 * Dependencies:
		 * - sap.ui.core.BusyIndicator
		 *
		 * @function onAfterRendering
		 * @public
		 * @override
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		}
	});
});