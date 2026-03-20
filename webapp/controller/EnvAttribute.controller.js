
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
	return BaseController.extend("pl.dac.apps.fnconfig.controller.EnvAttribute", {

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
			this._oRouter.getRoute(PlDacConst.ROUTE_PATH_ENV_ATTRIBUTE).attachPatternMatched(this._onRouteMatched, this);
			this.addAdditionalButtonIntoTheAttributeTableToolbar(this.getView().byId("idSmartTableEnvAttribute"));
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
					Icon: "sap-icon://world",
					Title: oBundle.getText("titEnvAttribute"),
					PlaceHolder: oBundle.getText("pholderEnvAttribute"),
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
					AttributeType: "ENV"
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			this.oAttributeTable = oView.byId("idTableUserAttributes");
			if (this.oAttributeTable) {
				this.oAttributeTable.removeSelections(true);
			}

		},
		onBeforeRebindTable: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams");
			if (oBindingParams.parameters.select) {
				if (!oBindingParams.parameters.select.includes("PreDefined")) {
					oBindingParams.parameters.select = oBindingParams.parameters.select + ",PreDefined";
				}

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

		// /**
		//  * Handles the save action for the Attribute dialog.
		//  *
		//  * This function validates the input fields of the attribute dialog, 
		//  * checks for pending changes in the model, and submits changes 
		//  * using batch requests. It also handles success and error responses 
		//  * from the OData model.
		//  *
		//  * Validation:
		//  *  - Checks that the "AttributeId" field is not empty.
		//  *  - Checks that the "Description" field is not empty.
		//  *  - Sets error states and messages in the "viewModel" if validation fails.
		//  *
		//  * Change Handling:
		//  *  - If `this.oEditContext` is null, sets deferred group "createAttribute".
		//  *  - Otherwise, sets deferred group "changeAttribute" and checks for pending changes.
		//  *  - Shows a message if there are no changes to submit.
		//  *
		//  * OData Submission:
		//  *  - Uses batch mode to submit changes to the OData model.
		//  *  - On success, shows a success MessageBox based on the OData response and closes the dialog.
		//  *  - On error, closes the dialog and displays an error message.
		//  *
		//  * @function
		//  * @memberof pl.dac.apps.fnconfig.controller.EnvAttribute
		//  * @example
		//  * // Trigger save when the user clicks "Save" in the dialog
		//  * this.onSaveAttributeDialog();
		//  */
		// onSaveAttributeDialog: function () {
		// 	var oContext,
		// 		oView = this.getView(),
		// 		oModel = oView.getModel(),
		// 		oBundle = oView.getModel("i18n").getResourceBundle(),
		// 		that = this;
		// 	oContext = this.oAttributeDialog.getBindingContext();
		// 	if (oContext.getProperty("AttributeId").trim() == "") {
		// 		oView.getModel("viewModel").setProperty("/ErrorState", "Error");
		// 		oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorResultNameMandatory"));
		// 		this.oAttributeDialog.getContent()[0].getContent()[1].focus()
		// 		return;
		// 	}

		// 	if (oContext.getProperty("Description").trim() == "") {
		// 		oView.getModel("viewModel").setProperty("/ErrorStateDesc", "Error");
		// 		oView.getModel("viewModel").setProperty("/ErrorMessageDesc", oBundle.getText("msgErrorResultNameMandatory"));
		// 		this.oAttributeDialog.getContent()[0].getContent()[3].focus()
		// 		return;
		// 	}
		// 	if (this.oEditContext == null) {
		// 		oModel.setDeferredGroups(["createAttribute"]);
		// 	} else {
		// 		oModel.setDeferredGroups(["changeAttribute"]);
		// 		var oChanges = oModel.getPendingChanges();
		// 		var sPath = oContext.getPath();
		// 		var bHasChanges = Object.keys(oChanges).some(function (sKey) {
		// 			return sKey.indexOf(sPath.replace("/", "")) === 0;
		// 		});

		// 		if (!bHasChanges) {
		// 			sap.m.MessageToast.show(oBundle.getText("msgUpdateNoChanges"));
		// 			return;
		// 		}
		// 	}
		// 	oModel.setUseBatch(true);
		// 	oModel.submitChanges({
		// 		success: function (oData) {
		// 			if (({}).hasOwnProperty.call(oData, "__batchResponses") && ({}).hasOwnProperty.call(oData.__batchResponses[0], "__changeResponses")) {
		// 				if (oData.__batchResponses[0].__changeResponses[0].statusCode == "201") {
		// 					MessageBox.success(JSON.parse(oData.__batchResponses[0].__changeResponses[0].headers["sap-message"]).message);
		// 					that.oAttributeDialog.close();
		// 					oView.byId("idTableEnvAttributes").removeSelections(true);
		// 					oView.byId("idTableEnvAttributes").setBusy(false);
		// 					return;
		// 				}
		// 				if (oData.__batchResponses[0].__changeResponses[0].statusCode == "204") {
		// 					MessageBox.success(JSON.parse(oData.__batchResponses[0].__changeResponses[0].headers["sap-message"]).message);
		// 					that.oAttributeDialog.close();
		// 					oView.byId("idTableEnvAttributes").removeSelections(true);
		// 					oView.byId("idTableEnvAttributes").setBusy(false);
		// 					return;
		// 				}
		// 			} else if (({}).hasOwnProperty.call(oData, "__batchResponses")) {
		// 				if (oData.__batchResponses[0].response.statusCode == "409") {
		// 					that.oInputAttributeName.focus();
		// 					oView.getModel("viewModel").setProperty("/ErrorMessage", JSON.parse(oData.__batchResponses[0].response.body).error.message.value);
		// 					oView.getModel("viewModel").setProperty("/ErrorState", "Error");
		// 				}
		// 			}
		// 		},
		// 		error: function (oError) {
		// 			that.oAttributeDialog.close();
		// 			that.displayErrorMessage(oError);
		// 		}
		// 	});
		// },

		// /**
		//  * Removes the currently selected record from the OData model.
		//  *
		//  * This method:
		//  * 1. Retrieves the path of the selected record from `oEditContext`.
		//  * 2. Sends a DELETE request to the OData service.
		//  * 3. Handles the success response by:
		//  *    - Displaying a success message (from `sap-message` header if available).
		//  *    - Refreshing the model.
		//  *    - Clearing table selections.
		//  *    - Resetting the view model properties (data and button states).
		//  * 4. Handles errors by logging and displaying an error message.
		//  *
		//  * @function
		//  * @name removeSelectedRecord
		//  * @memberof YourController
		//  *
		//  * @throws {Error} Throws an error if deletion fails and cannot be handled by `_displayErrorMessage`.
		//  *
		//  * @example
		//  * // Deletes the selected record in the UI
		//  * this.removeSelectedRecord();
		//  */
		// removeSelectedRecord: function () {
		// 	var sPath, oView = this.getView(), oModel = oView.getModel(), that = this,
		// 		oBundle = oView.getModel("i18n").getResourceBundle();
		// 	sPath = this.oEditContext.getPath();
		// 	oModel.remove(sPath, {
		// 		groupId: "deleteGroup",
		// 		success: function (oData, oResponse) {
		// 			MessageBox.success(JSON.parse(oResponse.headers["sap-message"]).message, { styleClass: "PlDacMessageBox" });
		// 			oModel.refresh();
		// 			oView.byId("idTableEnvAttributes").removeSelections(true);
		// 			oView.getModel("viewModel").setProperty("/Data", {});
		// 			oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
		// 			oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
		// 		},
		// 		error: function (oError) {
		// 			Log.error(oBundle.getText("msgUAErrorInDelete") + oError);
		// 			that.displayErrorMessage(oError);
		// 		}
		// 	});
		// },		

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
		 * @this pl.dac.apps.fnconfig.controller.EnvAttribute
		 * @returns {void}
		 */
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
			this.oEditContext = null;
		}
	});
});