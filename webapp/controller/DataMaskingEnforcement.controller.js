
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/table/Column",
	"sap/m/Column",
	"sap/m/Text",
	"sap/m/Label",
	"sap/m/ColumnListItem",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/base/Log",
	"sap/m/Token",
	"sap/ui/model/Sorter"
], function (
	BaseController, PlDacConst, Fragment, JSONModel, MessageBox, UIColumn, Column, Text, Label,
	ColumnListItem, Filter, FilterOperator, Log, Token,Sorter
) {
	"use strict";

	return BaseController.extend("pl.dac.apps.fnconfig.controller.DataMaskingEnforcement", {
		/**
		 * Controller initialization lifecycle hook.
		 * 
		 * @public
		 * @override
		 * @returns {void}
		 * 
		 * @description
		 * This method is automatically called when the controller is instantiated and performs initial setup:
		 * - Retrieves the router instance from the owner component
		 * - Attaches the _onRouteMatched handler to the "DataMasking" route's pattern matched event
		 * - Adds an additional button to the policy enforcement table toolbar by calling addAddintionButtonIntoThePolicyEnforcementTableToolbar
		 * 
		 * @example
		 * /// Automatically called by the UI5 framework during controller instantiation
		 */
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("DataMasking").attachPatternMatched(this._onRouteMatched, this);
			this.addAdditionalButtonIntoThePolicyEnforcementTableToolbar(this.getView().byId("idSmartTableDataMaskingEnforcement"));
		},
		/**
		 * Route matched event handler for the DataMasking route.
		 * 
		 * @private
		 * @returns {void}
		 * 
		 * @description
		 * This method initializes the view when the DataMasking route is matched by:
		 * - Hiding the busy indicator
		 * - Retrieving the i18n resource bundle for localized text
		 * - Creating and setting a JSON view model with initial UI state properties including:
		 *   - Labels for policy name, description, and attribute
		 *   - Icon and title for the page
		 *   - Button enable/disable states (Edit, Delete)
		 *   - Error state properties for both attribute and general errors
		 *   - Selected context data placeholder
		 *   - Visibility flag for attribute field
		 * - Storing a reference to the policy enforcement table
		 * 
		 * @fires sap.ui.core.routing.Route#patternMatched
		 * 
		 * @example
		 * /// Automatically invoked when navigating to DataMasking route
		 * this._oRouter.getRoute("DataMasking").attachPatternMatched(this._onRouteMatched, this);
		 */
		_onRouteMatched: function () {
			sap.ui.core.BusyIndicator.hide();
			//this.getView().byId("idSmartTablePOPRestriction").setEnableCopy(false);
			var oView = this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();
			oView.setModel(new JSONModel(
				{
					Name: oBundle.getText("lblPolicyName"),
					Description: oBundle.getText("lblDescription"),
					Attribute: "Attribute",
					Icon: "sap-icon://hide",
					Title: oBundle.getText("titPolInforcementDataMasking"),
					PlaceHolder: "",
					EditButtonEnabled: false,
					Payload: {
						AttributeName: "",
						Description: ""
					},
					PolicyNameEnabled: true,
					AttrErrorState: "None",
					AttrErrorMessage: "",
					ActionErrorState: "None",
					ActionErrorMessage: "",
					ErrorState: "None",
					ErrorMessage: "",
					ErrorStateDesc: "None",
					ErrorMessageDesc: "",
					DeleteButtonEnabled: false,
					Action: "Action",
					FullScreen: true,
					ExitFullScreen: false,
					ExitColumn: true,
					SelectedContextData: null,
					VisibleAttribute: true,
					AttributeNameEnabled: true
				}
			), "viewModel");
			this.oPolicyEnforcementTable = oView.byId("idTableDataMaskingEnforcement");
		},
		onBeforePEPDataMaskingExport: function (oEvent) {
			var mExportSettings = oEvent.getParameter("exportSettings");

			var aColumns = mExportSettings.workbook.columns;

			// Define your desired order by column 'property' or 'label'
			var aDesiredOrder = ["to_Policy/PolicyName", "to_Policy/PolicyDesc", "AttributeId", "IsActive", "PolicyResult"];
			var aReorderedColumns = [];
			aDesiredOrder.forEach(function (sProperty) {
				var oColumn = aColumns.find(function (oCol) {
					return oCol.property === sProperty;
				});
				if (oColumn) {
					aReorderedColumns.push(oColumn);
				}
			});

			// Add any other columns that are part of the original export but not in the specific order
			// (optional, depending on your requirement)

			// Assign the newly ordered array back to the export configuration
			mExportSettings.workbook.columns = aReorderedColumns
			// Check if the configuration and columns exist
			if (mExportSettings && mExportSettings.workbook.columns) {
				// Iterate over the columns and change the label property
				mExportSettings.workbook.columns.forEach(function (oColumn) {
					// Use a switch statement or if/else if to target specific properties
					switch (oColumn.property) {
						case "to_Policy/PolicyDesc":
							oColumn.label = "PolicyDesc"; // Set the new column name
							break;
						// Add more cases as needed for other columns
					}
				});
			}
		},
		onPEPAttributeTokenUpdated: function (oEvent) {
			if (oEvent.getParameter("type") == "removedAll" || oEvent.getParameter("type") == "removed") {
				var oBundle, oView = this.getView(), oViewModel = oView.getModel("viewModel");
				oBundle = oView.getModel("i18n").getResourceBundle();
				oViewModel.setProperty("/AttrErrorState", "Error");
				oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameMandatory"));
				oView.byId("idPEPAttributes").focus();
			}
		},
		/**
		 * Saves or updates a data masking policy enforcement entry in the OData model.
		 * 
		 * @public
		 * @returns {void}
		 * 
		 * @description
		 * This method handles both create and update operations for data masking policy enforcement entries by:
		 * - Validating that the policy field is not empty
		 * - Cleaning up unnecessary navigation properties (PolicyDesc, PolicyName, to_Policy, to_Attr)
		 * - Converting IsActive boolean to 'X' (true) or '' (false)
		 * - Checking for __metadata to determine if it's an update or create operation:
		 *   - If __metadata exists: Performs an UPDATE operation on existing entry
		 *   - If __metadata doesn't exist: Calls _checkForDuplicateEntry to validate and CREATE new entry
		 * - Displaying success/error messages based on operation result
		 * - Refreshing the UI, closing dialog, and resetting button states on success
		 * 
		 * @fires sap.m.MessageBox#success - Shows success message on update
		 * @fires sap.m.MessageBox#error - Shows error message on failure
		 * 
		 * @example
		* /// Called when user clicks save button in policy enforcement dialog
		* /// <Button text="Save" press=".onSavePolicyInforcement">
		*/
		onSavePolicyInforcement: function () {
			var oBundle, oEntry, sPolicyName, sUriKey, sPath, oView = this.getView(), oViewModel = oView.getModel("viewModel");
			oEntry = oViewModel.getData().Data;
			oBundle = oView.getModel("i18n").getResourceBundle();
			if (oViewModel.getProperty("/ErrorState") == "Error") {
				oView.byId("idPEPPolicyName").focus();
				return;
			}
			if (oViewModel.getProperty("/AttrErrorState") == "Error") {
				oView.byId("idPEPAttributes").focus();
				return;
			}
			if (oEntry.Policy.trim() == "") {
				oViewModel.setProperty("/ErrorState", "Error");
				oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorPolicyNameMandatory"));
				oView.byId("idPEPPolicyName").focus();
				return;
			}
			if (!({}).hasOwnProperty.call(oEntry, "AttributeId") || oEntry.AttributeId.trim() == "") {
				oViewModel.setProperty("/AttrErrorState", "Error");
				oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameMandatory"));
				oView.byId("idPEPAttributes").focus();
				return;
			}
			if (oEntry.PolicyResult == "") {
				oViewModel.setProperty("/ActionErrorState", "Error");
				oViewModel.setProperty("/ActionErrorMessage", oBundle.getText("msgErrorResultNameMandatory"));
				oView.byId("idPEPActionResult").focus();
				return;
			}
			sPolicyName = oEntry.PolicyName + "~" + oEntry.AttributeId;

			delete oEntry.to_Policy;
			delete oEntry.to_Attr;
			oEntry.Policy = oEntry.Policy.split("~")[0];
			oEntry.IsActive = oEntry.IsActive ? "X" : "";
			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {
				delete oEntry.PolicyDesc;
				delete oEntry.PolicyName;
				delete oEntry.__metadata;
				sUriKey = oEntry.Policy + "~" + oEntry.AttributeId;
				sPath = "/DataMaskingEnforcementSet('" + sUriKey + "')";
				oView.getModel().update(sPath, oEntry, {
					success: function () {
						MessageBox.success(oBundle.getText("msgPoEnforcementUpdateSuccessfully", [sPolicyName]));
						oViewModel.setProperty("/Data", {});
						this.oPolicyInforcementDialog.close();
						this.oPolicyEnforcementTable.removeSelections(true);
						oViewModel.setProperty("/EditButtonEnabled", false);
						oViewModel.setProperty("/DeleteButtonEnabled", false);
						oView.getModel().refresh();
					}.bind(this),
					error: function (e) {
						Log.error(e);
						MessageBox.error("Error has occured while updating record");
					}
				});
			} else {
				this._checkForDuplicateEntry(PlDacConst.ENTITY_SET_DATAMASKINGENFORCEMENT + "('" + oEntry.Policy + "')", oEntry);
			}
		},
		clearValidationError: function () {
			var oView = this.getView(), oViewModel = oView.getModel("viewModel");
			oViewModel.setProperty("/ErrorState", "None");
			oViewModel.setProperty("/ErrorMessage", "");
			oViewModel.setProperty("/AttrErrorState", "None");
			oViewModel.setProperty("/AttrErrorMessage", "");
			oViewModel.setProperty("/ActionErrorState", "None");
			oViewModel.setProperty("/ActionErrorMessage", "");
		},
		/**
		 * Event handler triggered when the attribute value help is requested.
		 * 
		 * @public
		 * @returns {void}
		 * 
		 * @description
		 * This method creates and displays a value help dialog for selecting attributes by:
		 * - Creating the PEPAttributeVH fragment dialog if it doesn't exist yet
		 * - Adding the dialog as a dependent to the view
		 * - Configuring range key fields with AttributeId
		 * - Getting the table asynchronously and binding it to the AttrSet entity
		 * - Setting up columns for Attribute Name and Description
		 * - Supporting both desktop (sap.ui.table.Table) and mobile (sap.m.Table) table types
		 * - Opening the dialog for attribute selection
		 * - Reusing the existing dialog instance if already created
		 * 
		 * @example
		 * /// Called when user clicks on value help icon for attribute input
		 * /// <Input valueHelpRequest=".onPEPAttributeVHRequested">
		 */
		onPEPAttributeVHRequested: function () {
			var oView = this.getView(), oColAttrName,
				oColAttrDesc,
				that = this;
			if (!this._oPEPAttributeVHDialog) {
				this._oPEPAttributeVHDialog = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.PEPAttributeVH", this);
				oView.addDependent(this._oPEPAttributeVHDialog);
				this._oPEPAttributeVHDialog.setRangeKeyFields([{
					label: "Description",
					key: "AttributeId",
					type: "string"
				}]);
				this._oPEPAttributeVHDialog.getTableAsync().then(function (oTable) {
					oTable.setModel(oView.getModel());
					oTable.setSelectionMode("Single");
					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/AttrSet",
							events: {
								dataReceived: function () {
									that._oPEPAttributeVHDialog.update();
								}
							}
						});
						oColAttrName = new UIColumn({ label: new Label({ text: "Attribute Name" }), template: new Text({ wrapping: false, text: "{AttributeId}" }) });
						oColAttrName.data({
							fieldName: "{AttributeId}"
						});
						oTable.addColumn(oColAttrName);

						oColAttrDesc = new UIColumn({ label: new Label({ text: "Description" }), template: new Text({ wrapping: false, text: "{Description}" }) });
						oColAttrDesc.data({
							fieldName: "Description"
						});
						oTable.addColumn(oColAttrDesc);
					}
					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/AttrSet",
							template: new ColumnListItem({
								cells: [new Label({ text: "{AttributeId}" }), new Label({ text: "{Description}" })]
							}),
							events: {
								dataReceived: function () {
									that._oPEPAttributeVHDialog.update();
								}
							}
						});
						oTable.addColumn(new Column({ header: new Label({ text: "Attribute Name" }) }));
						oTable.addColumn(new Column({ header: new Label({ text: "Description" }) }));
					}
					that._oPEPAttributeVHDialog.update();
				});
				this._oPEPAttributeVHDialog.open();
			} else {

				this._oPEPAttributeVHDialog.open();
			}
		},
		/**
		 * Event handler triggered when the cancel button is pressed in the attribute value help dialog.
		 * 
		 * @public
		 * @returns {void}
		 * 
		 * @description
		 * This method closes the attribute value help dialog without making any selection or changes.
		 * 
		 * @example
		 * /// Called when user clicks cancel button in the value help dialog
		 * /// <Button text="Cancel" press=".onPEPAttributeVHCancelPress">
		 */
		onPEPAttributeVHCancelPress: function () {
			this._oPEPAttributeVHDialog.close();
		},
		/**
		 * Event handler triggered when the OK button is pressed in the attribute value help dialog.
		 * 
		 * @public
		 * @param {*} oEvent - The event object containing selected tokens
		 * @param {*} oEvent.getParameter("tokens") - Array of selected tokens from the value help
		 * @returns {void}
		 * 
		 * @description
		 * This method processes the selected attribute from the value help dialog by:
		 * - Extracting the selected token and its custom data value
		 * - Setting the PolicyDesc property in the view model
		 * - Refreshing the view model to update the UI
		 * - Closing the attribute value help dialog
		 * - Validating the selected attribute by calling _validateAttibuteInput
		 * 
		 * @example
		 * /// Called when user confirms attribute selection in the value help dialog
		 * /// <ValueHelpDialog ok=".onPEPAttributeVHOkPress">
		 */
		onPEPAttributeVHOkPress: function (oEvent) {
			var oValue, aTokens = oEvent.getParameter("tokens"), oView = this.getView();
			oValue = aTokens[0].getCustomData()[0].getValue();
			oView.getModel("viewModel").setProperty("/Data/PolicyDesc", oValue.PolicyDesc);
			oView.getModel("viewModel").refresh();
			this._oPEPAttributeVHDialog.close();
			this._validateAttibuteInput(aTokens[0].getKey());
		},
		/**
		 * Event handler triggered when a suggestion item is selected from the attribute input field.
		 * 
		 * @public
		 * @param {*} oEvent - The event object containing selection data
		 * @param {*} oEvent.getParameter("selectedRow") - The selected row from the suggestion list
		 * @returns {void}
		 * 
		 * @description
		 * This method handles the selection of an attribute from the suggestion list by:
		 * - Retrieving the selected attribute context object from the binding context
		 * - Extracting the AttributeId from the context
		 * - Calling _validateAttibuteInput to validate the selected attribute
		 * 
		 * @example
		 * /// Automatically called when user selects an attribute from suggestion list
		 * /// <Input showSuggestion="true" suggestionItemSelected=".onPEPAttributeSuggestionItemSelected">
		 */
		onPEPAttributeSuggestionItemSelected: function (oEvent) {
			var oCtx = oEvent.getParameter("selectedRow").getBindingContext().getObject();
			this._validateAttibuteInput(oCtx.AttributeId);
		},
		/**
		 * Validates the selected attribute by reading its details from the OData service.
		 * 
		 * @private
		 * @param {string} sAttribute - The attribute ID to validate
		 * @returns {void}
		 * 
		 * @description
		 * This method validates an attribute input by:
		 * - Setting the AttributeId in the view model
		 * - Constructing the OData path to read the attribute details from AttrSet
		 * - Reading the attribute entity from the OData service
		 * - On success:
		 *   - Creating a token with attribute ID and description
		 *   - Setting the token on the attribute input control
		 *   - Clearing attribute error state and message
		 *   - Updating the view model with the validated AttributeId
		 * - On error:
		 *   - Setting the attribute error state to "Error"
		 *   - Displaying the error message from the OData response
		 * 
		 * @example
		 * this._validateAttibuteInput("ATTR001");
		 */
		_validateAttibuteInput: function (sAttribute) {
			var oBundle, oView = this.getView(), oDataModel = oView.getModel(),
				oViewModel = oView.getModel("viewModel"),
				sPath = "/AttrSet('" + sAttribute.toUpperCase() + "')";
			oViewModel.setProperty("/Data/AttributeId", sAttribute);
			oBundle = oView.getModel("i18n").getResourceBundle();
			oDataModel.read(sPath, {
				// Success callback function
				success: function (oData) {
					if (oData.Description) {
						oView.byId("idPEPAttributes").setValue("");
						oView.byId("idPEPAttributes").setTokens([new Token({ key: sAttribute, text: sAttribute.toUpperCase() + " (" + oData.Description + ")" })]);
						oViewModel.setProperty("/AttrErrorState", "None");
						oViewModel.setProperty("/AttrErrorMessage", "");
						oViewModel.setProperty("/Data/AttributeId", oData.AttributeId);
						if (oView.byId("idPEPPolicyName").getTokens()[0]) {
							oViewModel.setProperty("/Data/Policy", oView.byId("idPEPPolicyName").getTokens()[0].getKey());
						}

					} else {
						oViewModel.setProperty("/AttrErrorState", "Error");
						oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNotFound", [sAttribute]));
					}
				}.bind(this),
				// Error callback function
				error: function () {//
					// oError contains details about the error
					oViewModel.setProperty("/AttrErrorState", "Error");
					oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNotFound", [sAttribute]));

				}
			});
		},
		/**
		 * Checks if a data masking policy enforcement entry already exists before creating a new one.
		 * 
		 * @private
		 * @param {string} sPath - The OData path (unused in this implementation)
		 * @param {object} oEntry - The entry object to be created if no duplicate exists
		 * @param {string} oEntry.Policy - The policy identifier to check for duplicates
		 * @param {string} oEntry.AttributeId - The attribute identifier to check for duplicates
		 * @returns {void}
		 * 
		 * @description
		 * This method validates that a policy enforcement entry with the same policy and attribute combination doesn't already exist by:
		 * - Converting IsActive status from 'X' to boolean in the view model
		 * - Creating filters for Policy and AttributeId
		 * - Reading the DataMaskingEnforcementSet entity with filters and expanded to_Policy navigation
		 * - Displaying an error message if a duplicate policy-attribute combination is found
		 * - Calling _createEntry to create the entry if no duplicate exists
		 * - Setting focus to the policy name input field if duplicate is found
		 * - Clearing error state on read failure
		 * 
		 * @example
		 * this._checkForDuplicateEntry(
		 *   "DataMaskingEnforcementSet('POLICY001')",
		 *   { Policy: "POLICY001", AttributeId: "ATTR001", IsActive: true }
		 * );
		 */
		_checkForDuplicateEntry: function (sPath, oEntry) {
			var oView = this.getView(), oModel = oView.getModel(), oViewModel = oView.getModel("viewModel"),
				oBundle = oView.getModel("i18n").getResourceBundle(), oPolicy, aFilters, oAttribute;
			oViewModel.getProperty("/Data/IsActive") == "X" ? oViewModel.setProperty("/Data/IsActive", true) : oViewModel.setProperty("/Data/IsActive", false);
			oPolicy = new Filter("Policy", FilterOperator.EQ, oEntry.Policy.split("~")[0]);
			oAttribute = new Filter("AttributeId", FilterOperator.EQ, oEntry.AttributeId);
			aFilters = [oPolicy, oAttribute];
			oModel.read("/DataMaskingEnforcementSet", // Path to the specific entity
				{
					filters: aFilters,
					urlParameters: {
						"$expand": "to_Policy" // Expand to_ActionItem
					},
					success: function (oData) {
						if (oData && oData.results.length > 0) {
							oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorDuplicateEntry", [oData.results[0].to_Policy.PolicyName + "~" + oEntry.AttributeId]));
							oViewModel.setProperty("/ErrorState", "Error");
							this.oPolicyNameInput.focus();
						} else {
							this._createEntry(oEntry);
						}
						return;
					}.bind(this),
					error: function () {
						oViewModel.setProperty("/ErrorMessage", "");
						oViewModel.setProperty("/ErrorState", "None");
						this._createEntry(oEntry);
					}.bind(this)
				}
			);
		},
		/**
		 * Event handler triggered when the attribute name input value changes.
		 * 
		 * @public
		 * @param {*} oEvent - The event object containing the new input value
		 * @param {string} oEvent.getParameter("newValue") - The new value entered in the input field
		 * @returns {void}
		 * 
		 * @description
		 * This method handles live changes to the attribute name input by:
		 * - Clearing the attribute error state and message
		 * - Converting the input value to uppercase
		 * - Triggering validation via _validateAttibuteInput if the value length exceeds 6 characters
		 * 
		 * @example
		 * /// Automatically called when user types in the attribute input field
		 * /// <Input liveChange=".onPEPAttributeNameInputChange">
		 */
		onPEPAttributeNameInputChange: function (oEvent) {
			var oBundle, oView = this.getView(), sNewValue = oEvent.getParameter("newValue"), oViewModel = oView.getModel("viewModel"),
				oInput = oEvent.getSource();
			oBundle = oView.getModel("i18n").getResourceBundle();
			oViewModel.setProperty("/AttrErrorState", "None");
			oViewModel.setProperty("/AttrErrorMessage", "");
			oInput.setValue(oInput.getValue().toUpperCase());
			if (sNewValue.length > 6) {
				this._validateAttibuteInput(sNewValue);
			} else {
				oViewModel.setProperty("/Data/Policy", "");
				oViewModel.setProperty("/AttrErrorState", "Error");
				if (sNewValue.length == 0) {
					oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameMandatory"));
				} else {
					oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameInvalid"));
				}
			}
		},
		/**
		 * Creates a new data masking enforcement entry in the OData model.
		 * 
		 * @private
		 * @param {object} oEntry - The entry object containing policy enforcement data to be created
		 * @param {string} oEntry.Policy - The policy identifier
		 * @param {string} oEntry.AttributeId - The attribute identifier for masking
		 * @param {boolean|string} oEntry.IsActive - Active status flag (converted to 'X' or '')
		 * @returns {void}
		 * 
		 * @description
		 * This method creates a new data masking policy enforcement entry by:
		 * - Converting the IsActive boolean flag to 'X' (true) or '' (false)
		 * - Making a POST request to the DataMaskingEnforcementSet entity
		 * - Showing success/error messages based on the operation result
		 * - Refreshing the UI and clearing selections on success
		 * - Closing the policy enforcement dialog
		 * - Resetting button states (Edit, Delete) to disabled
		 * - Displaying error messages via displayErrorMessage on failure
		 * 
		 * @example
		 * this._createEntry({
		 *   Policy: "POLICY001",
		 *   AttributeId: "ATTR001",
		 *   IsActive: true
		 * });
		 */
		_createEntry: function (oEntry) {
			var sMSGUri, oBundle, oView = this.getView(), oDataModel = oView.getModel(), oViewModel = oView.getModel("viewModel");
			oEntry.IsActive = oEntry.IsActive == true ? 'X' : '';
			oBundle = oView.getModel("i18n").getResourceBundle();
			// if (oViewModel.getProperty("/SelectedContextData") && oViewModel.getProperty("/SelectedContextData").PolicyName) {
			// 	sMSGUri = oViewModel.getProperty("/SelectedContextData").PolicyName + "~" + oEntry.AttributeId;
			// } else {
			sMSGUri = oEntry.PolicyName + "~" + oEntry.AttributeId;
			//}
			delete oEntry.PolicyDesc;
			delete oEntry.PolicyName;
			oDataModel.create(PlDacConst.ENTITY_SET_DATAMASKINGENFORCEMENT, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgPolEnforcementSuccessful", [sMSGUri]), { styleClass: "PlDacMessageBox" });
					this.oPolicyEnforcementTable.removeSelections(true);
					oViewModel.setProperty("/Data", {});
					this.oPolicyInforcementDialog.close();
					this.oPolicyEnforcementTable.removeSelections(true);
					oViewModel.setProperty("/EditButtonEnabled", false);
					oViewModel.setProperty("/DeleteButtonEnabled", false);
					oDataModel.refresh();
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgErrorInCreate") + oError);
					this.oPolicyInforcementDialog.close();
					this.displayErrorMessage(oError);
				}.bind(this)
			});
		},
		/**
		 * Removes the selected data masking enforcement policy record from the OData model.
		 * 
		 * @public
		 * @returns {void}
		 * 
		 * @description
		 * This method deletes the currently selected data masking policy enforcement record by:
		 * - Retrieving the selected item's PolicyName from the table's binding context
		 * - Constructing the OData path for the specific policy entry in DataMaskingEnforcementSet
		 * - Executing a DELETE operation on the OData model
		 * - Displaying success message and refreshing the UI on successful deletion
		 * - Clearing table selections and resetting view model data
		 * - Resetting button states (Edit, Delete) to disabled
		 * - Displaying error message if the deletion fails
		 * 
		 * @fires sap.m.MessageBox#success - Shows success message on deletion
		 * @fires sap.m.MessageBox#error - Shows error message if deletion fails
		 * 
		 * @example
		 * /// Called when user confirms deletion of selected record
		 * this.removeSelectedRecord();
		 */
		removeSelectedRecord: function () {
			var sMSGUri, oView = this.getView(), oDataModel = oView.getModel(), oCTx, oBundle = oView.getModel("i18n").getResourceBundle(),
				oViewModel = oView.getModel("viewModel"), sUriKey, sPath;
			oCTx = oView.byId("idTableDataMaskingEnforcement").getSelectedItem().getBindingContext().getObject();

			sUriKey = oCTx.Policy.split("~").length > 1 ? oCTx.Policy : oCTx.Policy + "~" + oCTx.AttributeId;
			if (oViewModel.getProperty("/SelectedContextData") && oViewModel.getProperty("/SelectedContextData").PolicyName) {
				sMSGUri = oViewModel.getProperty("/SelectedContextData").PolicyName + "~" + oCTx.AttributeId;
			} else {
				sMSGUri = oCTx.Policy + "~" + oCTx.AttributeId;
			}
			sPath = "/DataMaskingEnforcementSet('" + sUriKey + "')";
			oDataModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgPolEnforcementDeleteSucceful", [sMSGUri]), { styleClass: "PlDacMessageBox" });
					this.oPolicyEnforcementTable.removeSelections(true);
					oViewModel.setProperty("/Data", {});
					oViewModel.setProperty("/EditButtonEnabled", false);
					oViewModel.setProperty("/DeleteButtonEnabled", false);
					oDataModel.refresh();
				}.bind(this),
				error: function () {
					MessageBox.error("Error has occured while removing record");
				}
			});
		},
		/**
		 * Lifecycle hook called after the controller's view is rendered.
		 * 
		 * @public
		 * @override
		 * @returns {void}
		 * 
		 * @description
		 * This method is automatically invoked after the view has been rendered and refreshes
		 * the OData model to ensure the UI displays the latest data from the backend.
		 * 
		 * @example
		 * /// Automatically called by the UI5 framework after view rendering
		 */
		onAfterRendering: function () {
			this.getView().getModel().refresh();
		}
	});
});