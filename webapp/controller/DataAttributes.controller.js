
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Sorter",
	"sap/base/Log"
], function (
	BaseController, PlDacConst, Fragment, JSONModel, MessageBox, Sorter, Log
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
					Payload: {
						DataAttrSet: "",
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
		 * Handles the save action for the Data Attribute dialog.
		 *
		 * This method validates user input and performs either an UPDATE or CREATE
		 * operation depending on whether the entry already exists.
		 *
		 * Processing steps:
		 * 1. Retrieves the payload from the `viewModel` (`/Data`).
		 * 2. Validates mandatory fields:
		 *    - `AttributeId` must not be empty.
		 *    - `Description` must not be empty.
		 *    If validation fails, sets the appropriate error state and message
		 *    in the `viewModel` and stops further processing.
		 *
		 * 3. Determines persistence operation:
		 *    - If the payload contains `__metadata`, it issues an OData UPDATE request.
		 *    - Otherwise, it checks for duplicates using `_checkForDuplicateEntry`
		 *      before creating a new entry.
		 *
		 * 4. On successful update:
		 *    - Displays a localized success message with the `AttributeId`.
		 *    - Refreshes the OData model.
		 *    - Closes the attribute dialog.
		 *    - Clears table selections and resets `viewModel` data.
		 *    - Disables Edit and Delete buttons.
		 *
		 * 5. On update error:
		 *    - Logs the backend error.
		 *    - Closes the dialog.
		 *    - Displays a user-friendly error message using `displayErrorMessage`.
		 *
		 * Dependencies:
		 * - Default OData model (`sap.ui.model.odata.v2.ODataModel`)
		 * - viewModel (JSONModel) for UI state and payload
		 * - i18n ResourceBundle for localized texts
		 * - PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH (OData entity set path)
		 * - sap.m.MessageBox for feedback
		 * - `_checkForDuplicateEntry` method for uniqueness validation
		 *
		 * @function onSaveAttributeDialog
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onSaveAttributeDialog: function () {
			var sPath, oView = this.getView(),
				oModel = oView.getModel(), oBundle = oView.getModel("i18n").getResourceBundle(), oEntry, that = this;
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
				sPath = PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')";
				oModel.update(sPath, oEntry, {
					success: function () {
						MessageBox.success(oBundle.getText("msgDAUpdateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
						oModel.refresh();
						this.oAttributeDialog.close();
						oView.byId("idTableDataAttributes").removeSelections(true);
						oView.getModel("viewModel").setProperty("/Data", {});
						oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
						oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
					}.bind(this),
					error: function (oError) {
						Log.error(oBundle.getText("msgErrorInUpdate") + oError);
						that.oAttributeDialog.close();
						that.displayErrorMessage(oError);

					}
				});
			} else {
				/** Initiate a create call. */
				this._checkForDuplicateEntry(PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')", oEntry);

			}
		},

		/**
		 * Creates a new Data Attribute entry in the backend.
		 *
		 * This method sends a CREATE request to the OData service using the provided
		 * `oEntry` payload, persisting a new Data Attribute entity to the backend
		 * entity set defined by `PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH`.
		 *
		 * On successful creation:
		 * - Displays a localized success message including the `AttributeId`.
		 * - Refreshes the OData model to reflect the newly created entry.
		 * - Closes the attribute dialog.
		 *
		 * On error:
		 * - Logs the backend error.
		 * - Closes the dialog.
		 * - Delegates error handling to `displayErrorMessage`.
		 *
		 * Dependencies:
		 * - Default OData model (`sap.ui.model.odata.v2.ODataModel`)
		 * - viewModel (JSONModel) for UI state (if needed)
		 * - i18n ResourceBundle for localized texts
		 * - sap.m.MessageBox for user feedback
		 * - PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH (entity set path constant)
		 *
		 * @function _createEntry
		 * @private
		 * @param {Object} oEntry - The Data Attribute payload to be created.
		 * @param {string} oEntry.AttributeId - Unique identifier of the attribute.
		 * @param {string} oEntry.Description - Description of the attribute.
		 * @this sap.ui.core.mvc.Controller
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 * @returns {void}
		 */
		_createEntry: function (oEntry) {
			var that = this, oBundle, oView = this.getView(), oModel = oView.getModel();
			oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.create(PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgDACreateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
					oView.getModel().refresh();
					this.oAttributeDialog.close();
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgErrorInCreate") + oError);
					that.oAttributeDialog.close();
					that.displayErrorMessage(oError);

				}
			});
		},

		/**
		 * Checks whether a Data Attribute entry already exists before creation.
		 *
		 * This method performs an OData `read` request for the given entity path
		 * to determine if an entry with the same `AttributeId` already exists.
		 *
		 * Processing logic:
		 * - If the READ request succeeds:
		 *   → The entity already exists.
		 *   → Sets the error state and localized duplicate message in the `viewModel`.
		 *   → Moves focus to the attribute name input field to prompt correction.
		 *   → Stops the creation process.
		 *
		 * - If the READ request fails (typically 404 Not Found):
		 *   → The entity does not exist.
		 *   → Delegates creation to `_createEntry(oEntry)`.
		 *
		 * This ensures uniqueness of the Data Attribute identifier before
		 * issuing a CREATE request to the backend.
		 *
		 * Dependencies:
		 * - Default OData model (`sap.ui.model.odata.v2.ODataModel`)
		 * - viewModel (JSONModel) for UI validation state
		 * - i18n ResourceBundle for localized messages
		 * - `_createEntry` method for entity creation
		 *
		 * @function _checkForDuplicateEntry
		 * @private
		 * @param {string} sPath - OData entity path for the specific Data Attribute.
		 * @param {Object} oEntry - The Data Attribute payload to validate.
		 * @param {string} oEntry.AttributeId - Unique identifier of the attribute.
		 * @this sap.ui.core.mvc.Controller
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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
					error: function () {
						that._createEntry(oEntry);
					}
				}
			);
		},

		/**
		 * Checks whether a Data Attribute entry already exists before creation.
		 *
		 * This method performs an OData `read` request for the given entity path
		 * to determine if an entry with the same `AttributeId` already exists.
		 *
		 * Processing logic:
		 * - If the READ request succeeds:
		 *   → The entity already exists.
		 *   → Sets the error state and localized duplicate message in the `viewModel`.
		 *   → Moves focus to the attribute name input field to prompt correction.
		 *   → Stops the creation process.
		 *
		 * - If the READ request fails (typically 404 Not Found):
		 *   → The entity does not exist.
		 *   → Delegates creation to `_createEntry(oEntry)`.
		 *
		 * This ensures uniqueness of the Data Attribute identifier before
		 * issuing a CREATE request to the backend.
		 *
		 * Dependencies:
		 * - Default OData model (`sap.ui.model.odata.v2.ODataModel`)
		 * - viewModel (JSONModel) for UI validation state
		 * - i18n ResourceBundle for localized messages
		 * - `_createEntry` method for entity creation
		 *
		 * @function _checkForDuplicateEntry
		 * @private
		 * @param {string} sPath - OData entity path for the specific Data Attribute.
		 * @param {Object} oEntry - The Data Attribute payload to validate.
		 * @param {string} oEntry.AttributeId - Unique identifier of the attribute.
		 * @this sap.ui.core.mvc.Controller
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 * @returns {void}
		 */
		removeSelectedRecord: function () {
			var sPath, oView = this.getView(), oModel = oView.getModel(), that = this,
				oBundle = oView.getModel("i18n").getResourceBundle(),
				sAttributeId = oView.getModel("viewModel").getProperty("/SelectedContextData").AttributeId;
			//	sAttributeId = oView.byId("idTableDataAttributes").getSelectedItem().getBindingContext().getObject().AttributeId;
			sPath = PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH + "('" + sAttributeId + "')";
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgDADeleteSucceful", [sAttributeId]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
					oView.byId("idTableDataAttributes").removeSelections(true);
					oView.getModel("viewModel").setProperty("/Data", {});
					oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
					oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
				},
				error: function (oError) {
					Log.error(oBundle.getText("msgDAErrorInDelete") + oError);
					that.displayErrorMessage(oError);
				}
			});
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
		}
	});
});