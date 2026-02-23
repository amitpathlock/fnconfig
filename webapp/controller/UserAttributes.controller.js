
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Sorter",
	"sap/base/Log"
], function (
	BaseController,
	PlDacConst,
	Fragment,
	JSONModel,
	MessageBox,
	Sorter,
	Log
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
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute(PlDacConst.ROUTE_PATH_USER_ATTRIBUTE).attachPatternMatched(this._onRouteMatched, this);
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

		/**
		 * Handles the save action of the User Attribute dialog.
		 *
		 * This method validates the user input and performs either an update
		 * or create operation depending on whether the entry already exists.
		 *
		 * Processing flow:
		 *
		 * 1. Retrieves the attribute payload from `viewModel` (`/Data`).
		 * 2. Validates mandatory fields:
		 *    - AttributeId must not be empty.
		 *    - Description must not be empty.
		 *    If validation fails, the corresponding error state and message
		 *    are set in the `viewModel`, and processing is stopped.
		 *
		 * 3. Determines persistence operation:
		 *    - If the payload contains the `__metadata` property,
		 *      an OData UPDATE request is executed.
		 *    - If not, a CREATE flow is initiated via `_checkForDuplicateEntry`.
		 *
		 * 4. On successful update:
		 *    - Displays a success message.
		 *    - Refreshes the model.
		 *    - Closes the dialog.
		 *    - Clears table selections.
		 *    - Resets viewModel data and button states.
		 *
		 * 5. On update error:
		 *    - Logs the error.
		 *    - Closes the dialog.
		 *    - Displays a formatted backend error message.
		 *
		 * Dependencies:
		 * - Default OData model (sap.ui.model.odata.v2.ODataModel)
		 * - viewModel (JSONModel) for UI state and payload
		 * - i18n resource bundle for localized texts
		 * - PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH (OData entity set path)
		 * - sap.m.MessageBox
		 *
		 * @function onSaveAttributeDialog
		 * @public
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onSaveAttributeDialog: function () {
			var sPath, oEntry,
				oView = this.getView(),
				oModel = oView.getModel(),
				oBundle = oView.getModel("i18n").getResourceBundle(),
				that = this;
			oEntry = oView.getModel("viewModel").getData().Data;
			if (oEntry.AttributeId.trim() == "") {
				oView.getModel("viewModel").setProperty("/ErrorState", "Error");
				oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorEmptyField"));
				return;
			}
			if (oEntry.Description.trim() == "") {
				oView.getModel("viewModel").setProperty("/ErrorStateDesc", "Error");
				oView.getModel("viewModel").setProperty("/ErrorMessageDesc", oBundle.getText("msgErrorEmptyField"));
				return;
			}
			/**
			 * If the payload contains the `__metadata` property, proceed with an update call. If it doesn’t,initiate a create call instead.
			 */
			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {
				sPath = PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')";
				oModel.update(sPath, oEntry, {
					success: function () {
						MessageBox.success(oBundle.getText("msgUAUpdateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
						oModel.refresh();
						that.oAttributeDialog.close();
						oView.byId("idTableUserAttributes").removeSelections(true);
						//this.oAttributeTable.removeSelections(true);
						oView.getModel("viewModel").setProperty("/Data", {});
						oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
						oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
					}.bind(this),
					error: function (oError) {
						Log.error(oBundle.getText("msgUAErrorInUAUpdate") + oError);
						that.oAttributeDialog.close();
						that._displayErrorMessage(oError);
					}
				});
			} else {
				/** Initiate a create call. */
				this._checkForDuplicateEntry(PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')", oEntry);

			}
		},

		/**
		 * Creates a new User Attribute entry in the backend.
		 *
		 * This method sends a CREATE request to the OData service using the
		 * provided entry payload. It persists the new User Attribute entity
		 * to the backend entity set defined by
		 * `PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH`.
		 *
		 * On successful creation:
		 * - Displays a localized success message including the AttributeId.
		 * - Refreshes the OData model to reflect the newly created entry.
		 * - Closes the attribute dialog.
		 *
		 * On error:
		 * - Logs the backend error.
		 * - Closes the dialog.
		 * - Delegates error handling to `_displayErrorMessage`.
		 *
		 * Dependencies:
		 * - Default OData model (sap.ui.model.odata.v2.ODataModel)
		 * - i18n ResourceBundle for localized texts
		 * - sap.m.MessageBox for user feedback
		 * - PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH (entity set path constant)
		 *
		 * @function _createEntry
		 * @private
		 * @param {Object} oEntry - The User Attribute payload to be created.
		 * @param {string} oEntry.AttributeId - Unique identifier of the attribute.
		 * @param {string} oEntry.Description - Description of the attribute.
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */

		_createEntry: function (oEntry) {
			var that = this, oBundle, oView = this.getView(), oModel = oView.getModel();
			oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.create(PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgUACreateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
					this.oAttributeDialog.close();
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgUAErrorInCreate") + oError);
					that.oAttributeDialog.close();
					that._displayErrorMessage(oError);

				}
			});
		},

		/**
		 * Checks whether a User Attribute entry already exists before creation.
		 *
		 * This method performs an OData READ request for a specific entity path
		 * to determine if an entry with the same `AttributeId` already exists.
		 *
		 * Processing logic:
		 *
		 * - If the READ request succeeds:
		 *   → The entity already exists.
		 *   → Sets validation error state and localized duplicate message
		 *     in the `viewModel`.
		 *   → Moves focus back to the attribute name input field.
		 *   → Creation process is stopped.
		 *
		 * - If the READ request returns an error (typically 404 Not Found):
		 *   → The entity does not exist.
		 *   → Delegates creation to `_createEntry(oEntry)`.
		 *
		 * This method ensures uniqueness of the User Attribute identifier
		 * before issuing a CREATE request to the backend.
		 *
		 * Dependencies:
		 * - Default OData model (sap.ui.model.odata.v2.ODataModel)
		 * - viewModel (JSONModel) for validation state handling
		 * - i18n ResourceBundle for localized messages
		 * - `_createEntry` method for entity creation
		 *
		 * @function _checkForDuplicateEntry
		 * @private
		 * @param {string} sPath - OData entity path for the specific User Attribute.
		 * @param {Object} oEntry - The User Attribute payload to validate.
		 * @param {string} oEntry.AttributeId - Unique identifier of the attribute.
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		_checkForDuplicateEntry: function (sPath, oEntry) {
			var oView = this.getView(), oModel = oView.getModel(), that = this,
				oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.read(sPath, // Path to the specific entity
				{
					success: function () {
						that.oInputAttributeName.focus();
						oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorDuplicateEntry", [oEntry.AttributeId]));
						oView.getModel("viewModel").setProperty("/ErrorState", "Error");
						return;
					},
					error: function (oError) {
						Log.error("Error" + oError);
						that._createEntry(oEntry);
					}
				}
			);
		},


		/**
		 * Deletes the currently selected User Attribute record.
		 *
		 * This method retrieves the selected attribute identifier from the
		 * `viewModel` (`/SelectedContextData`) and constructs the corresponding
		 * OData entity path. It then issues a DELETE request to the backend.
		 *
		 * Processing flow:
		 *
		 * 1. Reads the selected `AttributeId` from the viewModel.
		 * 2. Builds the OData entity path using
		 *    `PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH`.
		 * 3. Executes an OData `remove` (DELETE) request.
		 *
		 * On successful deletion:
		 * - Displays a localized success message.
		 * - Refreshes the OData model.
		 * - Clears table selections.
		 * - Resets viewModel data.
		 * - Disables Edit and Delete buttons.
		 *
		 * On error:
		 * - Logs the backend error.
		 * - Delegates error handling to `_displayErrorMessage`.
		 *
		 * Dependencies:
		 * - Default OData model (sap.ui.model.odata.v2.ODataModel)
		 * - viewModel (JSONModel) for selected context and UI state
		 * - i18n ResourceBundle for localized messages
		 * - sap.m.MessageBox for user feedback
		 * - PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH (entity set path constant)
		 *
		 * @function removeSelectedRecord
		 * @public
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		removeSelectedRecord: function () {
			var sPath, oView = this.getView(), oModel = oView.getModel(), that = this,
				oBundle = oView.getModel("i18n").getResourceBundle(),
				sAttributeId = oView.getModel("viewModel").getProperty("/SelectedContextData").AttributeId;
			//	sAttributeId = oView.byId("idTableUserAttributes").getSelectedItem().getBindingContext().getObject().AttributeId;
			sPath = PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH + "('" + sAttributeId + "')";
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgUADeleteSucceful", [sAttributeId]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
					oView.byId("idTableUserAttributes").removeSelections(true);
					oView.getModel("viewModel").setProperty("/Data", {});
					oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
					oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
				},
				error: function (oError) {
					Log.error(oBundle.getText("msgUAErrorInDelete") + oError);
					that._displayErrorMessage(oError);
				}
			});
		},



		/**
		 * Extracts and displays a meaningful error message from an OData error response.
		 *
		 * This method attempts to parse the backend error response and determine
		 * the most relevant error message to display to the user.
		 *
		 * Error extraction logic:
		 *
		 * 1. If `oError.responseText` exists:
		 *    - Attempts to parse it as JSON.
		 *    - If available, extracts:
		 *        a) `error.message.value`
		 *        b) First entry from `error.errordetails[]`
		 * 2. If JSON parsing fails:
		 *    - Attempts to extract the message from an XML response body.
		 * 3. If no structured message can be determined:
		 *    - Falls back to a default generic error message.
		 *
		 * The final message is displayed using `sap.m.MessageBox.error`.
		 *
		 * This utility centralizes backend error handling to ensure consistent
		 * user feedback across create, update, and delete operations.
		 *
		 * Dependencies:
		 * - sap.m.MessageBox
		 * - sap.base.Log (Log)
		 *
		 * @function _displayErrorMessage
		 * @private
		 * @param {Object} oError - The error object returned from an OData request.
		 * @param {string} [oError.responseText] - Raw backend response body.
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		_displayErrorMessage: function (oError) {
			var message = "An unknown error occurred.";
			if (oError && oError.responseText) {
				try {
					var errorBody = JSON.parse(oError.responseText);
					if (errorBody.error && errorBody.error.message && errorBody.error.message.value) {
						message = errorBody.error.message.value;
					} else if (errorBody.error && errorBody.error.errordetails && errorBody.error.errordetails.length > 0) {
						message = errorBody.error.errordetails[0].message;
					}
				} catch (e) {
					Log.error(e);
					// Handle cases where response body might not be valid JSON
					message = $(oError.response.body).find('message').first().text();
				}
			}
			MessageBox.error(message, { styleClass: "PlDacMessageBox" }); // Display using sap.m.MessageBox
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
		}
	});
});