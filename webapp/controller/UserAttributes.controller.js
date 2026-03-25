
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (
	BaseController,
	PlDacConst,
	Fragment,
	JSONModel
) {
	"use strict";
	return BaseController.extend("pl.dac.apps.fnconfig.controller.UserAttributes", {

		/**
		 * Lifecycle hook executed when the controller is initialized.
		 *
		 * This method performs the initial setup of the controller by:
		 *
		 * 1. Retrieving the application router instance from the owner component.
		 * 2. Attaching the `_onRouteMatched` handler to the
		 *    `ROUTE_PATH_USER_ATTRIBUTE` route pattern match event.
		 * 3. Enhancing the SmartTable toolbar by adding additional custom
		 *    buttons via `addAdditionalButtonIntoTheAttributeTableToolbar`.
		 *
		 * This ensures that:
		 * - The view is properly initialized when the corresponding route is accessed.
		 * - The user attribute table toolbar contains required custom actions.
		 *
		 * Dependencies:
		 * - OwnerComponent router configuration
		 * - PlDacConst.ROUTE_PATH_USER_ATTRIBUTE (route name constant)
		 * - idSmartTableUserAttribute (sap.ui.comp.smarttable.SmartTable)
		 *
		 * @function onInit
		 * @public
		 * @override
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onInit: function () {
			this.oEditContext = null;
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute(PlDacConst.ROUTE_PATH_USER_ATTRIBUTE).attachPatternMatched(this._onRouteMatched, this);
			this.addAdditionalButtonIntoTheAttributeTableToolbar(this.getView().byId("idSmartTableUserAttribute"));
		},

		/**
		 * Route match event handler.
		 *
		 * This method is executed when the associated route is matched.
		 * It initializes and resets the view state by:
		 *
		 * 1. Retrieving the i18n resource bundle for localized texts.
		 * 2. Creating and assigning a new `viewModel` (JSONModel) containing:
		 *    - UI labels and placeholders (localized)
		 *    - Default payload structure for attribute data
		 *    - Initial UI control states (buttons, fullscreen mode, sorting, etc.)
		 * 3. Hiding the global BusyIndicator once initialization is complete.
		 * 4. Resetting table selections for the user attributes table, if present.
		 *
		 * The method ensures that the view is always loaded with a clean,
		 * predictable initial state whenever the route is accessed.
		 *
		 * Model Structure (viewModel):
		 * - Name, Description, Title – localized UI texts
		 * - Payload – attribute data object (AttributeId, Description)
		 * - UI state flags – Edit/Delete buttons, FullScreen mode, etc.
		 * - Validation state – ErrorState and ErrorMessage fields
		 *
		 * Dependencies:
		 * - i18n model (ResourceModel) for localized texts
		 * - sap.ui.core.BusyIndicator
		 * - idTableUserAttributes (sap.m.Table or sap.ui.table.Table)
		 *
		 * @function _onRouteMatched
		 * @private
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		_onRouteMatched: function () {
			var oView = this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();

			oView.setModel(new JSONModel(
				{
					Name: oBundle.getText("lblAttribute"),
					Description: oBundle.getText("lblDescription"),
					Icon: "sap-icon://person-placeholder",
					Title: oBundle.getText("titUserAttribute"),
					PlaceHolder: oBundle.getText("pholderUserAttribute"),
					EditButtonEnabled: false,
					Payload: {
						AttributeId: "",
						Description: ""
					},
					AttrNameEnabled: true,
					ErrorState: "None",
					ErrorMessage: "",
					ErrorStateDesc: "None",
					ErrorMessageDesc: "",
					DeleteButtonEnabled: false,
					FullScreen: true,
					ExitFullScreen: false,
					ExitColumn: true,
					SortOrder: "asc",
					AttributeType: "USER",
					SelectedContextData: null
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			this.oAttributeTable = oView.byId("idTableUserAttributes");
			if (this.oAttributeTable) {
				this.oAttributeTable.removeSelections(true);
			}

		},

		/** Event handler for `onTableUpdateFinished` table event
			 * Retrieves the reference to the current table and stores it in the local variable `oTable`
			 * Invoke the `removeSelections` method on the table and pass in a parameter of `true`.
			 * @param {sap.ui.base.Event} oEvent 
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.EnvAttribute
			 */
		onTableUpdateFinished: function (oEvent) {
			var oTable = oEvent.getSource(), aItems, iItem, oCtx, oSingleSelect;
			oTable.setBusy(false);
			oTable.removeSelections(true);
			aItems = oTable.getItems();
			for (iItem = 0; iItem < aItems.length; iItem++) {
				oSingleSelect = aItems[iItem].getSingleSelectControl();
				oCtx = aItems[iItem].getBindingContext();
				if (oCtx.getProperty("PreDefined") == "X") {
					oSingleSelect.setEditable(false);
					oSingleSelect.addStyleClass("not-allowed");
					oSingleSelect.setTooltip("Selection is disabled because it is not permitted for predefined");
				}
			}

		},

		/**
		 * Lifecycle hook executed after the view has been rendered.
		 *
		 * This method is called automatically by the SAPUI5 framework
		 * once the view's DOM is fully loaded and rendered.
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