
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (
	BaseController, PlDacConst, Fragment, JSONModel
) {
	"use strict";

	return BaseController.extend("pl.dac.apps.fnconfig.controller.DataAttributes", {
		/**
		 * Controller initialization lifecycle hook.
		 *
		 * This method is called automatically when the controller is instantiated.
		 * It performs the following setup tasks:
		 *
		 * 1. Retrieves the router instance from the owner component.
		 * 2. Attaches the `_onRouteMatched` handler to the route
		 *    defined by `PlDacConst.ROUTE_PATH_DATA_ATTRIBUTE`. This ensures
		 *    `_onRouteMatched` is executed whenever the route is navigated to.
		 * 3. Adds additional custom buttons to the SmartTable toolbar for
		 *    `idSmartTableDataAttributes`.
		 *
		 * Dependencies:
		 * - OwnerComponent router
		 * - PlDacConst.ROUTE_PATH_DATA_ATTRIBUTE (route name constant)
		 * - idSmartTableDataAttributes (sap.ui.comp.smarttable.SmartTable)
		 *
		 * @function onInit
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 * @override
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onInit: function () {
			this.oEditContext = null;
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute(PlDacConst.ROUTE_PATH_DATA_ATTRIBUTE).attachPatternMatched(this._onRouteMatched, this);
			this.addAdditionalButtonIntoTheAttributeTableToolbar(this.getView().byId("idSmartTableDataAttributes"));
		},

		/**
		 * Route match event handler for the Data Attribute view.
		 *
		 * This method is executed whenever the `PlDacConst.ROUTE_PATH_DATA_ATTRIBUTE`
		 * route is matched. It initializes the view by setting up a clean `viewModel`
		 * with default values and localized texts.
		 *
		 * Processing steps:
		 * 1. Retrieves the i18n resource bundle for localized labels and placeholders.
		 * 2. Initializes the `viewModel` (JSONModel) with:
		 *    - Localized UI labels (Name, Description, Title, PlaceHolder)
		 *    - Payload structure for Data Attribute (`DataAttrSet`, `Description`)
		 *    - UI state flags (buttons, full-screen mode, sorting, validation)
		 *    - Attribute type set to `"DATA"`
		 * 3. Hides the global BusyIndicator to unblock the UI.
		 * 4. Resets selections in the data attribute table (`idTableDataAttributes`), if present.
		 *
		 * This ensures that each time the route is accessed, the view starts with
		 * a clean, predictable state.
		 *
		 * Dependencies:
		 * - i18n model (ResourceModel) for localized texts
		 * - sap.ui.core.BusyIndicator
		 * - idTableDataAttributes (sap.m.Table or sap.ui.table.Table)
		 *
		 * @function _onRouteMatched
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		_onRouteMatched: function () {
			var oView = this.getView(),
				oBundle = oView.getModel("i18n").getResourceBundle();
			oView.setModel(new JSONModel(
				{
					Name: oBundle.getText("lblAttribute"),
					Description: oBundle.getText("lblDescription"),
					Icon: "sap-icon://product",
					Title: oBundle.getText("titDataAttribute"),
					PlaceHolder: oBundle.getText("pholderDataAttribute"),
					EditButtonEnabled: false,
					AttrNameEnabled: true,
					ErrorState: "None",
					ErrorMessage: "",
					ErrorStateDesc: "None",
					ErrorMessageDesc: "",
					DeleteButtonEnabled: false,
					FullScreen: true,
					ExitFullScreen: false,
					ExitColumn: true,
					AttributeType: "DATA",
					SelectedContextData: null
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			this.oAttributeTable = oView.byId("idTableDataAttributes");
			if (this.oAttributeTable) {
				this.oAttributeTable.removeSelections(true);
			}

		},
		
		/**
		 * Lifecycle hook executed after the Data Attribute view has been rendered.
		 *
		 * This method is automatically called by the SAPUI5 framework once the
		 * view's DOM is fully loaded and rendered.
		 *
		 * Current implementation:
		 * - Hides the global BusyIndicator to ensure the UI is not blocked
		 *   after initial rendering.
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
			this.oEditContext = null;
		}
	});
});