
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
	"sap/ui/model/Sorter",
	"sap/base/Log"
], function (
	BaseController, PlDacConst, Fragment, JSONModel, MessageBox, UIColumn, Column, Text, Label,
	ColumnListItem, Sorter, Log
) {
	"use strict";

	return BaseController.extend("pl.dac.apps.fnconfig.controller.DataRestrictionEnforcement", {
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
		 * - Attaches the _onRouteMatched handler to the "DataRestriction" route's pattern matched event
		 * - Adds an additional button to the policy enforcement table toolbar by calling addAddintionButtonIntoThePolicyEnforcementTableToolbar
		 * 
		 * @example
		 * /// Automatically called by the UI5 framework during controller instantiation
		 */
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("DataRestriction").attachPatternMatched(this._onRouteMatched, this);
			this.addAdditionalButtonIntoThePolicyEnforcementTableToolbar(this.getView().byId("idSmartTablePOPRestriction"));
		},
		onBeforePEPDataRestrictionExport: function (oEvent) {
			var mExportSettings = oEvent.getParameter("exportSettings");

			var aColumns = mExportSettings.workbook.columns;

			// Define your desired order by column 'property' or 'label'
			var aDesiredOrder = ["to_Policy/PolicyName", "to_Policy/PolicyDesc", "IsActive", "PolicyResult"];
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
							oColumn.label = "Policy Description"; // Set the new column name
							oColumn.width =27;
							break;
						case "to_Policy/PolicyName":
							oColumn.width =27;
						// Add more cases as needed for other columns
					}
				});
			}
		},
		/**
		 * Route matched event handler for the DataRestriction route.
		 * 
		 * @private
		 * @returns {void}
		 * 
		 * @description
		 * This method initializes the view when the DataRestriction route is matched by:
		 * - Retrieving the i18n resource bundle for localized text
		 * - Creating and setting a JSON view model with initial UI state properties including:
		 *   - Labels for policy name and description
		 *   - Icon and title for the page
		 *   - Button enable/disable states (Edit, Delete)
		 *   - Error state properties
		 *   - Sort order and visibility flags
		 *   - Selected context data placeholder
		 * - Hiding the busy indicator
		 * - Storing a reference to the policy enforcement table
		 * 
		 * @fires sap.ui.core.routing.Route#patternMatched
		 * 
		 * @example
		 * // Automatically invoked when navigating to DataRestriction route
		 * this._oRouter.getRoute("DataRestriction").attachPatternMatched(this._onRouteMatched, this);
		 */
		_onRouteMatched: function () {
			var oView = this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();
			this.getView().setModel(new JSONModel(
				{
					Name: oBundle.getText("lblPolicyName"),
					Description: oBundle.getText("lblDescription"),
					Icon: "sap-icon://locked",
					Title: oBundle.getText("titPolInforcementDataRestriction"),
					PlaceHolder: "",
					EditButtonEnabled: false,
					Payload: {
						AttributeName: "",
						Description: ""
					},
					PolicyNameEnabled: true,
					ErrorState: "None",
					ErrorMessage: "",
					ErrorStateDesc: "None",
					ErrorMessageDesc: "",
					DeleteButtonEnabled: false,
					Action: "Action",
					FullScreen: true,
					ExitFullScreen: false,
					ExitColumn: true,
					SortOrder: "asc",
					SelectedContextData: null,
					VisibleAttribute: false
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			this.oPolicyEnforcementTable = oView.byId("idTableDataRestrictionEnforcement");
		},
		/**
		 * Saves or updates a policy enforcement entry in the OData model.
		 * 
		 * @public
		 * @returns {void}
		 * 
		 * @description
		 * This method handles both create and update operations for policy enforcement entries by:
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
			var sPolicyName, oBundle, sPath, oEntry, oView = this.getView(), oViewModel = oView.getModel("viewModel");
			oEntry = oViewModel.getData().Data;
			oBundle = oView.getModel("i18n").getResourceBundle();
			if (oViewModel.getProperty("/ErrorState") == "Error") {
				oView.byId("idPEPPolicyName").focus();
				return;
			}
			if (oEntry.Policy.trim() == "") {
				oViewModel.setProperty("/ErrorState", "Error");
				oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorPolicyNameMandatory"));
				oView.byId("idPEPPolicyName").focus();
				return;
			}
			if (oEntry.PolicyResult == "") {
				oViewModel.setProperty("/ActionErrorState", "Error");
				oViewModel.setProperty("/ActionErrorMessage", oBundle.getText("msgErrorResultNameMandatory"));
				oView.byId("idPEPActionResult").focus();
				return;
			}
			sPolicyName = oEntry.PolicyName;
			delete oEntry.PolicyDesc;
			delete oEntry.PolicyName;
			delete oEntry.to_Policy;
			delete oEntry.to_Attr;
			//oView.byId("idPEPIsActive")
			oEntry.IsActive = oEntry.IsActive ? "X" : "";
			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {
				delete oEntry.__metadata;
				sPath = PlDacConst.ENTITY_SET_DATARESTRICTIONENFORCEMENT + "('" + oEntry.Policy + "')";
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
				/** Initiate a create call. */
				this._checkForDuplicateEntry(PlDacConst.ENTITY_SET_DATARESTRICTIONENFORCEMENT + "('" + oEntry.Policy + "')", oEntry);
			}
		},
		/**
		 * Creates a new data restriction enforcement entry in the OData model.
		 * 
		 * @private
		 * @param {object} oEntry - The entry object containing policy enforcement data to be created
		 * @param {string} oEntry.Policy - The policy identifier
		 * @param {boolean|string} oEntry.IsActive - Active status flag (converted to 'X' or '')
		 * @returns {void}
		 * 
		 * @description
		 * This method creates a new policy enforcement entry by:
		 * - Converting the IsActive boolean flag to 'X' (true) or '' (false)
		 * - Making a POST request to the DataRestrictionEnforcementSet entity
		 * - Showing success/error messages based on the operation result
		 * - Refreshing the UI and clearing selections on success
		 * 
		 * @example
		 * this._createEntry({
		 *   Policy: "POLICY001",
		 *   IsActive: true,
		 *   Description: "Sample policy"
		 * });
 */
		_createEntry: function (oEntry) {
			var that = this, oBundle, oView = this.getView(), oDataModel = oView.getModel(),
				oViewModel = oView.getModel("viewModel");
			oEntry.IsActive = oEntry.IsActive == true ? 'X' : '';
			oBundle = oView.getModel("i18n").getResourceBundle();
			oDataModel.create(PlDacConst.ENTITY_SET_DATARESTRICTIONENFORCEMENT, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgPolEnforcementSuccessful", [oEntry.Policy]), { styleClass: "PlDacMessageBox" });
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
					that.oPolicyInforcementDialog.close();
					that.displayErrorMessage(oError);
				}
			});
		},
		/**
		 * Checks if a policy enforcement entry already exists before creating a new one.
		 * 
		 * @private
		 * @param {string} sPath - The OData path to check for existing entry (e.g., "DataRestrictionEnforcementSet('POLICY001')")
		 * @param {object} oEntry - The entry object to be created if no duplicate exists
		 * @param {string} oEntry.Policy - The policy identifier to check for duplicates
		 * @returns {void}
		 * 
		 * @description
		 * This method validates that a policy enforcement entry doesn't already exist by:
		 * - Converting IsActive status from 'X' to boolean in the view model
		 * - Reading the OData entity with expanded to_Policy navigation
		 * - Displaying an error message if a duplicate policy is found
		 * - Calling _createEntry to create the entry if no duplicate exists or on read error
		 * - Setting focus back to the policy name input field after validation
		 * 
		 * @example
		 * this._checkForDuplicateEntry(
		 *   "DataRestrictionEnforcementSet('POLICY001')",
		 *   { Policy: "POLICY001", IsActive: true }
		 * );
		 */
		_checkForDuplicateEntry: function (sPath, oEntry) {
			var oView = this.getView(), oModel = oView.getModel(), that = this,
				oBundle = oView.getModel("i18n").getResourceBundle();
			oView.getModel("viewModel").getProperty("/Data/IsActive") == "X" ? oView.getModel("viewModel").setProperty("/Data/IsActive", true) : oView.getModel("viewModel").setProperty("/Data/IsActive", false);
			oModel.read(sPath, // Path to the specific entity
				{
					urlParameters: {
						"$expand": "to_Policy" // Expand to_ActionItem
					},
					success: function (oData) {
						if (oData && oData.Policy != "" && ({}).hasOwnProperty.call(oData, "to_Policy") && oData.to_Policy.PolicyName != "") {
							oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorDuplicateEntry", [oData.to_Policy.PolicyName]));
							oView.getModel("viewModel").setProperty("/ErrorState", "Error");
						} else {
							that._createEntry(oEntry);
						}
						that.oPolicyNameInput.focus();
						return;
					},
					error: function () {
						that.oPolicyNameInput.setValueState("None");
						that.oPolicyNameInput.setValueStateText("");
						that._createEntry(oEntry);
					}
				}
			);
		},
		/**
		 * Removes the selected data restriction enforcement policy record from the OData model.
		 * 
		 * @public
		 * @returns {void}
		 * 
		 * @description
		 * This method deletes the currently selected policy enforcement record by:
		 * - Retrieving the selected policy name from the view model's SelectedContextData
		 * - Constructing the OData path for the specific policy entry
		 * - Executing a DELETE operation on the OData model
		 * - Displaying success message and refreshing the UI on successful deletion
		 * - Clearing table selections and resetting button states
		 * - Displaying error message if the deletion fails
		 * 
		 * @fires sap.m.MessageBox#success - Shows success message with deleted policy name
		 * @fires sap.m.MessageBox#error - Shows error message if deletion fails
		 * 
		 * @example
		 * // Called when user confirms deletion of selected record
		 * this.removeSelectedRecord();
		 */
		removeSelectedRecord: function () {
			var oView = this.getView(), oModel = oView.getModel(), sPath, that = this,
				oBundle = oView.getModel("i18n").getResourceBundle(),
				sPolicyName = oView.getModel("viewModel").getProperty("/SelectedContextData").Policy;
			sPath = PlDacConst.ENTITY_SET_DATARESTRICTIONENFORCEMENT + "('" + sPolicyName + "')";
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgPolEnforcementDeleteSucceful", [sPolicyName]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
					that.oPolicyEnforcementTable.removeSelections(true);
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
		 * Event handler triggered when a suggestion item is selected from the policy input field.
		 * 
		 * @public
		 * @param {*} oEvent - The event object containing selection data
		 * @param {*} oEvent.getParameter("selectedRow") - The selected row from the suggestion list
		 * @returns {void}
		 * 
		 * @description
		 * This method handles the selection of a policy from the suggestion list by:
		 * - Retrieving the selected policy context object from the binding context
		 * - Setting the PolicyDesc property in the view model with the selected policy's description
		 * - Triggering validation for the selected policy using validatePolicyInput
		 * 
		 * @example
		 * /// Automatically called when user selects a policy from suggestion list
		 * /// <Input showSuggestion="true" suggestionItemSelected=".onSuggestionItemSelected">
		 */
		onSuggestionItemSelected: function (oEvent) {
			var oView = this.getView(),
				oCtx = oEvent.getParameter("selectedRow").getBindingContext().getObject();
			oView.getModel("viewModel").setProperty("/Data/PolicyDesc", oCtx.PolicyDesc);
			this.validatePolicyInput(oCtx.Policy);
		},
		/**
		 * Event handler triggered when a link is pressed in the table to view assigned attributes.
		 * 
		 * @public
		 * @param {sap.ui.base.Event} oEvent - The event object from the pressed link
		 * @returns {void}
		 * 
		 * @description
		 * This method opens a popover displaying assigned attributes for a policy by:
		 * - Retrieving the event source button and custom data (context and policy info)
		 * - Extracting the policy name from custom data and adding it to the context object
		 * - Loading the AssignedAttrPopver fragment if not already loaded
		 * - Loading policy attribute data via _loadPopOverData method
		 * - Opening the popover anchored to the pressed button
		 * - Reusing the existing popover instance if already created
		 * 
		 * @example
		 * /// Triggered when user clicks on assigned attributes link in the table
		 * /// <Link press=".onPressLink" customData="...">
		 */
		onPressLink: function (oEvent) {
			this._oButton = oEvent.getSource();
			var oPolicy = oEvent.getSource().getCustomData()[1].getValue();
			var oCtx = oEvent.getSource().getCustomData()[0].getBindingContext().getObject();
			oCtx["PolicyName"] = oPolicy.PolicyName;
			if (!this._oPopover) {
				Fragment.load({
					name: "pl.dac.apps.fnconfig.fragments.AssignedAttrPopver",
					controller: this
				}).then(function (oPopover) {
					this._oPopover = oPopover;
					this.getView().addDependent(this._oPopover);
					this._loadPopOverData(oCtx);
					//this._oPopover.openBy(this._oButton);
				}.bind(this));
			} else {
				sap.ui.getCore().byId("idAssignedAttribures").setBusy(true);
				this._loadPopOverData(oCtx);

			}
		},
		/**
		 * Loads and displays assigned attribute data for a policy in the popover.
		 * 
		 * @private
		 * @param {object} oCtx - The context object containing policy information
		 * @param {string} oCtx.Policy - The policy identifier to load attributes for
		 * @param {string} oCtx.PolicyName - The policy name to display in the popover
		 * @returns {void}
		 * 
		 * @description
		 * This method retrieves assigned attributes for a specific policy by:
		 * - Constructing the OData path for the DataRestrictionEnforcementSet entity
		 * - Reading the entity with expanded to_Attr navigation property
		 * - Creating a JSON model with the policy name and attribute items
		 * - Setting the model on the popover as "popOverModel"
		 * - Logging errors if the read operation fails
		 * 
		 * @example
		 * this._loadPopOverData({
		 *   Policy: "POLICY001",
		 *   PolicyName: "Data Restriction Policy"
		 * });
		 */
		_loadPopOverData: function (oCtx) {
			var oModel = this.getView().getModel(), sPath;
			sPath = "/DataRestrictionEnforcementSet(Policy='" + oCtx.Policy + "')";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "to_Attr,to_Policy" // Expand to_ActionItem
				},
				success: function (oData) {
					sap.ui.getCore().byId("idAssignedAttribures").setBusy(false);
					if(this._oPopover.getModel("popOverModel")){
						this._oPopover.getModel("popOverModel").setData({ PolicyName: oCtx.PolicyName, PolicyDesc: oData.to_Policy.PolicyDesc, items: oData.to_Attr.results });
					}else{
						this._oPopover.setModel(new JSONModel({ PolicyName: oCtx.PolicyName, PolicyDesc: oData.to_Policy.PolicyDesc, items: oData.to_Attr.results }), "popOverModel");
					}
					this._oPopover.openBy(this._oButton);
				}.bind(this),
				error: function (oError) {
					Log.error("Error reading policy details:" + oError);
				}
			});
		},
		clearValidationError: function () {
			var oView = this.getView(), oViewModel = oView.getModel("viewModel");
			oViewModel.setProperty("/ErrorState", "None");
			oViewModel.setProperty("/ErrorMessage", "");
			oViewModel.setProperty("/ActionErrorState", "None");
			oViewModel.setProperty("/ActionErrorMessage", "");
		},
		onAfterCloseAssignedAttributePopOver:function(){
			this._oPopover.destroy();
			this._oPopover=null;
		},
		/**
		 * Lifecycle hook called after the controller's view is rendered.
		 * 
		 * @public
		 * @override
		 * @returns {void}
		 * 
		 * @description
		 * This method is automatically invoked after the view has been rendered and ensures
		 * the busy indicator is hidden to prevent unnecessary loading overlays from remaining visible.
		 * 
		 * @example
		 * /// Automatically called by the UI5 framework after view rendering
		 */
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		}
	});
});