
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Sorter",
	"sap/m/ToolbarSpacer",
	"sap/m/OverflowToolbarButton",
	"pl/dac/apps/fnconfig/const/PlDacConst"
], function (
	BaseController,
	Fragment,
	JSONModel,
	MessageBox,
	Sorter,
	ToolbarSpacer,
	OverflowToolbarButton,
	PlDacConst
) {
	"use strict";

	return BaseController.extend("pl.dac.apps.fnconfig.controller.Policies", {
		/**
		 * Controller initialization lifecycle hook.
		 * Sets up the router and attaches the pattern matched handler for the Policies route.
		 * Also initializes the Policy Administrator table toolbar with action buttons.
		 *
		 * @function onInit
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves and stores the router instance from the owner component
		 * - Attaches the _onRouteMatched handler to the "Policies" route pattern matched event
		 * - Adds additional toolbar buttons (Add, Edit, Delete) to the Policy Administrator SmartTable
		 */
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("Policies").attachPatternMatched(this._onRouteMatched, this);
			this._addAddintionButtonIntoThePolicyAdministratorTableToolbar(this.getView().byId("idSmartPolAdminTable"));

		},
		/**
			 * Adds action buttons (Add, Edit, Delete, Sort) to the Policy Enforcement SmartTable toolbar.
			 * This method dynamically populates the toolbar with overflow buttons if it hasn't been initialized yet.
			 * The buttons are bound to their respective event handlers and include proper icons, tooltips, and enable/disable states.
			 *
			 * @function addAddintionButtonIntoThePolicyEnforcementTableToolbar
			 * @param {sap.ui.comp.smarttable.SmartTable} oSmartTable - The SmartTable control whose toolbar should be enhanced with action buttons.
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * - Retrieves the toolbar from the provided SmartTable
			 * - Checks if the toolbar is empty (not yet initialized)
			 * - If empty, adds the following controls in sequence:
			 *   1. ToolbarSpacer - for spacing
			 *   2. Add Button - opens the add policy enforcement dialog
			 *   3. Edit Button - opens the edit policy enforcement dialog (enabled based on selection)
			 *   4. Delete Button - deletes selected policy enforcement (enabled based on selection)
			 * - All buttons are configured with appropriate icons, text, tooltips, and press event handlers
			* - Edit and Delete buttons are bound to the view model's button enable state
		*/
		_addAddintionButtonIntoThePolicyAdministratorTableToolbar: function (oSmartTable) {
			var oToolbar = oSmartTable.getToolbar();
			if (oToolbar.getContent().length == 0) {
				oToolbar.addContent(new ToolbarSpacer());
				oToolbar.addContent(new OverflowToolbarButton({
					text: "Add",
					icon: "sap-icon://add",
					tooltip: "{i18n>toolTipAddPolicy}",
				//	press: this._onAddPolicyPolAdminButtonPress.bind(this)
				}));
				oToolbar.addContent(new OverflowToolbarButton({
					text: "Edit",
					icon: "sap-icon://edit",
					enabled: "{viewModel>/EditButtonEnabled}",
					tooltip: "{i18n>toolTipEditPolicy}",
				//	press: this._onEditPolicyPoladminButtonPress.bind(this)
				}));
				oToolbar.addContent(new OverflowToolbarButton({
					text: "Delete",
					icon: "sap-icon://delete",
					enabled: "{viewModel>/DeleteButtonEnabled}",
					tooltip: "{i18n>toolTipDelPolicy}",
				//	press: this._onDeletePolicyPolAdminButtonPress.bind(this)
				}));

			}
		},
		/**
		 * Handles the press event of the Add button in the Policy Administrator table toolbar.
		 * Opens a dialog for creating a new policy with empty initial values.
		 *
		 * @function _onAddPolicyPolAdminButtonPress
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Resets the viewModel's Data property with empty policy values (PolicyName, PolicyDesc, Policy)
		 * - Enables the policy name input field
		 * - Loads and opens the DialogPolicy fragment if not already instantiated
		 * - If dialog already exists, simply opens it
		 * - The dialog is added as a dependent to the view for proper lifecycle management
		 */
		_onAddPolicyPolAdminButtonPress: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/Data", { PolicyName: "", PolicyDesc: "", Policy: "" });
			oView.getModel("viewModel").setProperty("/PolicyNameEnabled", true);
			if (!this._oDialogPolAdminPolicies) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicy", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this._oDialogPolAdminPolicies = oDialog;
					oView.addDependent(oDialog); // Add dialog as dependent of the view
					oDialog.open();
				}.bind(this));
			} else {
				this._oDialogPolAdminPolicies.open();
			}
		},
		/**
		 * Handles the press event of the Edit button in the Policy Administrator table toolbar.
		 * Opens a dialog for editing the selected policy with pre-populated data.
		 *
		 * @function _onEditPolicyPoladminButtonPress
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves the selected item's data from the Policy Administrator table
		 * - Sets the viewModel's Data property with the selected policy data
		 * - Loads and opens the DialogPolicy fragment if not already instantiated
		 * - If dialog already exists, simply opens it
		 * - Disables the policy name input field (PolicyNameEnabled = false) to prevent editing the key field
		 * - The dialog is added as a dependent to the view for proper lifecycle management
		 */
		_onEditPolicyPoladminButtonPress: function () {
			var oView = this.getView();
			var oSelectedContextData = oView.byId("idTablePolAdminPolicies").getSelectedItem().getBindingContext().getObject();

			oView.getModel("viewModel").setProperty("/Data", oSelectedContextData);
			if (!this._oDialogPolAdminPolicies) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicy", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this._oDialogPolAdminPolicies = oDialog;
					oView.addDependent(oDialog); // Add dialog as dependent of the view
					oDialog.open();
				}.bind(this));
			} else {
				this._oDialogPolAdminPolicies.open();
			}
			oView.getModel("viewModel").setProperty("/PolicyNameEnabled", false);
		},
		/**
		 * Handles the close event of the Policy Administrator policy dialog.
		 * Closes the dialog and clears the table selection.
		 *
		 * @function onClosePolAdminPolicyDialog
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Checks if the policy dialog instance exists
		 * - Closes the dialog if it exists
		 * - Removes all selections from the Policy Administrator table
		 * - Resets the UI state after dialog closure
		 */
		onClosePolAdminPolicyDialog: function () {
			var oView = this.getView();
			if (this._oDialogPolAdminPolicies) {
				this._oDialogPolAdminPolicies.close();
				oView.byId("idTablePolAdminPolicies").removeSelections(true);
			}
		},
		/**
		 * Handles the route matched event for the Policies route.
		 * Initializes the view model with default values and configurations for the Policies view.
		 *
		 * @function _onRouteMatched
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves i18n resource bundle for localized text
		 * - Creates and sets a JSON model named "viewModel" with initial state including:
		 *   - Policy metadata (Name, Description, Icon, Title)
		 *   - UI control states (EditButtonEnabled, DeleteButtonEnabled, PolicyNameEnabled)
		 *   - Validation error states (PolNameErrorState, PolDescErrorState)
		 *   - Layout configuration (FullScreen, ExitFullScreen, ExitColumn)
		 *   - Empty payload for policy data
		 * - Hides the busy indicator after initialization
		 */
		_onRouteMatched: function () {

			var oView = this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();

			oView.setModel(new JSONModel(
				{
					Name: oBundle.getText("lblPolicyName"),
					Description: oBundle.getText("lblDescription"),
					Icon: "sap-icon://documents",
					Title: oBundle.getText("titPolicy"),
					PlaceHolder: "",
					EditButtonEnabled: false,
					Payload: {
						PolicyName: "",
						Policy: "",
						PolicyDesc: ""
					},
					PolicyNameEnabled: true,
					PolNameErrorState: "None",
					PolNameErrorMessage: "",
					PolDescErrorState: "None",
					PolDescErrorMessage: "",
					DeleteButtonEnabled: false,
					FullScreen: true,
					ExitFullScreen: false,
					ExitColumn: true,
					SortOrder: 1
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
		},
		/**
		 * Handles the before export event for Policy Administrator table.
		 * Customizes the export settings by adding, reordering, and configuring columns for Excel export.
		 *
		 * @function onBeforePolAdminPolicyExport
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @param {sap.ui.base.Event} oEvent - The event object containing export settings
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves export settings from the event parameter
		 * - Adds the PolicyDesc column to the export configuration
		 * - Reorders columns according to the desired order: ["PolicyName", "PolicyDesc"]
		 * - Customizes column properties including label and width
		 * - Sets "Policy Description" label with width of 27 for PolicyDesc column
		 * - Modifies the workbook columns array with the reordered and customized columns
		 */
		onBeforePolAdminPolicyExport: function (oEvent) {
			var mExportSettings = oEvent.getParameter("exportSettings");

			var aColumns = mExportSettings.workbook.columns;
			aColumns.push({
				label: 'Policy Description', // The header text in Excel
				property: 'PolicyDesc', // The property name in your data model
				type: "String"// The data type
			});
			// Define your desired order by column 'property' or 'label'
			var aDesiredOrder = ["PolicyName", "PolicyDesc"];
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
						case "PolicyDesc":
							oColumn.label = "Policy Description"; // Set the new column name
							oColumn.width = 27;
							break;

						// Add more cases as needed for other columns
					}
				});
			}
		},
		/**
		 * Handles the selection change event on the Policy Administrator table.
		 * Enables the Edit and Delete buttons when a row is selected.
		 *
		 * @function onTableSelectionChange
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Enables the Edit button by setting EditButtonEnabled to true in the viewModel
		 * - Enables the Delete button by setting DeleteButtonEnabled to true in the viewModel
		 * - This allows users to perform edit and delete operations on the selected policy
		 */
		onTableSelectionChange: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/EditButtonEnabled", true);
			oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", true);

		},
		/**
		 * Handles the save action for Policy Administrator policy dialog.
		 * Validates and either creates a new policy or updates an existing one.
		 *
		 * @function onSavePolAdminPolicy
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves policy data from the viewModel
		 * - Validates PolicyName field - displays error and focuses field if empty
		 * - Validates PolicyDesc field - displays error and focuses field if empty
		 * - Determines operation mode by checking for __metadata property:
		 *   - If __metadata exists: Updates existing policy via OData UPDATE
		 *   - If __metadata missing: Creates new policy after checking for duplicates
		 * - On successful update: Shows success message, clears selection, refreshes model, and closes dialog
		 * - On update error: Shows error message
		 * - For new entries: Calls _checksForDuplicateEntry to prevent duplicate policy names
		 */
		onSavePolAdminPolicy: function () {
			var oBundle, sPath, oView = this.getView(), oViewModel = oView.getModel("viewModel"),
				oDataModel = oView.getModel();
			oBundle = oView.getModel("i18n").getResourceBundle();
			var oEntry = oViewModel.getProperty("/Data");
			if (oEntry.PolicyName.trim() == "") {
				oViewModel.setProperty("/PolNameErrorState", "Error");
				oViewModel.setProperty("/PolNameErrorMessage", oBundle.getText("msgErrorPolicyNameMandatory"));
				oView.byId("idPolAdminPolName").focus();
				return;
			}
			if (oEntry.PolicyDesc.trim() == "") {
				oViewModel.setProperty("/PolDescErrorState", "Error");
				oViewModel.setProperty("/PolDescErrorMessage", oBundle.getText("msgErrorPolicyNameMandatory"));
				oView.byId("idPolAdminPolDesc").focus();
				return;
			}
			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {

				sPath = "/PolicySet('" + oEntry.Policy + "')";
				oDataModel.update(sPath, oEntry, {
					success: function () {
						MessageBox.success(oBundle.getText("msgPolicyUpdateSuccessful", [oEntry.PolicyName]));
						oView.byId("idTablePolAdminPolicies").removeSelections(true);
						oDataModel.refresh();
						this._oDialogPolAdminPolicies.close();
					}.bind(this),
					error: function () {
						MessageBox.error("Error has occured while updating record");
					}
				});
			} else {
				oEntry.Policy = oEntry.PolicyName;
				this._checksForDuplicateEntry(PlDacConst.ENTITY_SET_POLICIES + "(" + oEntry.Policy + ")", oEntry);

			}
		},
		/**
		 * Handles the before open event of the Policy Administrator policy dialog.
		 * Clears all validation errors before the dialog is displayed.
		 *
		 * @function onBeforePolAdminPolicyDialogOpened
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Calls _removelAllValidationError to reset validation states
		 * - Ensures a clean dialog state without residual error messages
		 * - Prepares the dialog for fresh user input
		 */
		onBeforePolAdminPolicyDialogOpened: function () {
			this._removelAllValidationError();
		},
		/**
		 * Handles the after open event of the Policy Administrator policy dialog.
		 * Sets focus to the appropriate input field based on its enabled state.
		 *
		 * @function onAfterPolAdminPolicyDialogOpen
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @param {sap.ui.base.Event} oEvent - The event object containing the dialog source
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves the dialog, form, and form elements from the event source
		 * - Checks if the first form field (PolicyName) is enabled
		 * - If enabled: Sets focus to the first field (typically for Add mode)
		 * - If disabled: Sets focus to the second field (typically for Edit mode where PolicyName is read-only)
		 * - Improves user experience by auto-focusing the first editable field
		 */
		onAfterPolAdminPolicyDialogOpen: function (oEvent) {
			var oDailog = oEvent.getSource(),
				oForm = oDailog.getContent()[0].getAggregation("form"),
				aFormElements = oForm.getAggregation("formContainers")[0].getAggregation("formElements");
			if (aFormElements[0].getAggregation("fields")[0].getEnabled()) {
				aFormElements[0].getAggregation("fields")[0].focus();
			} else {
				aFormElements[1].getAggregation("fields")[0].focus();
			}
		},
		/**
		 * Clears all validation error states and messages for the policy dialog form fields.
		 * Resets both PolicyName and PolicyDesc validation states to their default values.
		 *
		 * @function _removelAllValidationError
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Clears PolicyName error message and sets error state to "None"
		 * - Clears PolicyDesc error message and sets error state to "None"
		 * - Removes all visual error indicators from the form fields
		 * - Called before opening the dialog to ensure clean state
		 */
		_removelAllValidationError: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/PolNameErrorMessage", "");
			oView.getModel("viewModel").setProperty("/PolNameErrorState", "None");
			oView.getModel("viewModel").setProperty("/PolDescErrorMessage", "");
			oView.getModel("viewModel").setProperty("/PolDescErrorState", "None");

		},
		/**
		 * Checks if a policy with the same name already exists before creating a new entry.
		 * Prevents duplicate policy entries by validating against existing records.
		 *
		 * @function _checksForDuplicateEntry
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @param {string} sPath - The OData path to check for the policy entity
		 * @param {object} oEntry - The policy entry object to be created if no duplicate exists
		 * @returns {void}
		 *
		 * @description
		 * - Performs an OData READ operation to check if the policy already exists
		 * - On success (record found):
		 *   - Sets error state with duplicate entry message if policy exists
		 *   - Focuses the policy name input field
		 *   - If policy doesn't exist, proceeds to create the entry
		 * - On error (record not found):
		 *   - Clears any error messages and error states
		 *   - Proceeds to create the new entry via _createEntry
		 * - Prevents creation of duplicate policies in the system
		 */
		_checksForDuplicateEntry: function (sPath, oEntry) {
			var oView = this.getView(), oDataModel = oView.getModel(), that = this,
				oBundle = oView.getModel("i18n").getResourceBundle();
			oDataModel.read(sPath, // Path to the specific entity
				{
					success: function (oData) {
						if (oData && oData.Policy != "") {
							oView.getModel("viewModel").setProperty("/PolNameErrorMessage", oBundle.getText("msgErrorDuplicateEntry", [oData.to_Policy.PolicyName]));
							oView.getModel("viewModel").setProperty("/PolNameErrorState", "Error");
						} else {
							that._createEntry(oEntry);
						}
						that.oPolicyNameInput.focus();
						return;
					},
					error: function () {
						oView.getModel("viewModel").setProperty("/PolNameErrorMessage", "");
						oView.getModel("viewModel").setProperty("/PolNameErrorState", "None");
						that._createEntry(oEntry);
					}
				}
			);
		},
		/**
		 * Handles the live change event on the policy name input field.
		 * Automatically converts user input to uppercase for consistency.
		 *
		 * @function onPolicyNameInputLiveChange
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @param {sap.ui.base.Event} oEvent - The event object containing the input change details
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves the new value from the input field
		 * - Converts the value to uppercase if it exists
		 * - Sets the uppercase value back to the input source
		 * - Ensures consistent formatting of policy names throughout the application
		 */
		onPolicyNameInputLiveChange: function (oEvent) {
			var sNewValue = oEvent.getParameter("newValue");
			if (sNewValue) {
				oEvent.getSource().setValue(sNewValue.toUpperCase());
			}
		},
		/**
		 * Creates a new policy entry in the backend via OData service.
		 * Handles the creation of a new policy record after validation and duplicate checks.
		 *
		 * @function _createEntry
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @param {object} oEntry - The policy entry object to be created
		 * @returns {void}
		 *
		 * @description
		 * - Performs an OData CREATE operation to add the new policy to PolicySet
		 * - On success:
		 *   - Displays success message with the policy name
		 *   - Refreshes the OData model to update the table
		 *   - Closes the policy dialog
		 * - On error:
		 *   - Displays error message indicating creation failure
		 * - Called after successful duplicate entry validation
		 */
		_createEntry: function (oEntry) {
			var oView = this.getView(), oDataModel = oView.getModel(), oBundle = oView.getModel("i18n").getResourceBundle();
			oDataModel.create(PlDacConst.ENTITY_SET_POLICIES, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgPolicyCreatedSuccessful", [oEntry.PolicyName]));
					oDataModel.refresh();
					this._oDialogPolAdminPolicies.close();
				}.bind(this),
				error: function () {
					MessageBox.error("Error has occured while creating record");
				}
			});
		},
		/**
		 * Handles the press event of the Delete button in the Policy Administrator table toolbar.
		 * Displays a confirmation dialog before deleting the selected policy.
		 *
		 * @function _onDeletePolicyPolAdminButtonPress
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Displays a warning message box with delete confirmation prompt
		 * - Provides OK and CANCEL action buttons
		 * - Emphasizes the OK action for user attention
		 * - If user confirms (OK): Calls _removeSelectedRecord to delete the policy
		 * - If user cancels: Closes the dialog without any action
		 * - Prevents accidental deletion by requiring explicit user confirmation
		 */
		_onDeletePolicyPolAdminButtonPress: function () {
			var that = this, oBundle = this.getView().getModel("i18n").getResourceBundle();
			MessageBox.warning(oBundle.getText("msgDeleteConfirmation"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function (sAction) {
					if (sAction == "OK") {
						that._removeSelectedRecord();
					}
				}
			});

		},
		/**
		 * Removes the selected policy record from the backend via OData DELETE operation.
		 * Executes the actual deletion after user confirmation.
		 *
		 * @function _removeSelectedRecord
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves the selected policy item data from the Policy Administrator table
		 * - Extracts the Policy key for deletion
		 * - Constructs the OData path for the DELETE operation
		 * - Performs an OData REMOVE operation on the PolicySet
		 * - On success:
		 *   - Displays success message with policy name
		 *   - Clears table selection
		 *   - Refreshes the OData model to update the table
		 * - On error:
		 *   - Parses error response and replaces Policy ID with PolicyName for user-friendly message
		 *   - Displays formatted error message
		 * - Called after user confirms deletion in the confirmation dialog
		 */
		_removeSelectedRecord: function () {
			var oBundle,sPolicy,oSelectedItemData,sErrorMSG, sPath, oView = this.getView(), oModel = oView.getModel();
			oSelectedItemData = oView.byId("idTablePolAdminPolicies").getSelectedItem().getBindingContext().getObject();
			sPolicy = oSelectedItemData.Policy;
			sPath = "/PolicySet('" + sPolicy + "')";
			oBundle = oView.getModel("i18n").getResourceBundle()
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgPolicyDeleteSuccessful",[oSelectedItemData.PolicyName]));
					oView.byId("idTablePolAdminPolicies").removeSelections(true);
					oModel.refresh();
				},
				error: function (e) {
					sErrorMSG = JSON.parse(e.responseText).error.message.value.replace(oSelectedItemData.Policy, oSelectedItemData.PolicyName);
					MessageBox.error(sErrorMSG);
				}
			});
		},
		/**
		 * Handles the press event on the policy rules link.
		 * Navigates to the PolicyRules route and expands the layout to show the third column.
		 *
		 * @function onPressRuleLink
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.Policies
		 * @param {sap.ui.base.Event} oEvent - The event object containing the link source
		 * @returns {void}
		 *
		 * @description
		 * - Retrieves the policy name from the custom data of the event source
		 * - Navigates to the "PolicyRules" route with the PolicyName parameter
		 * - Sets the layout mode to "ThreeColumnsEndExpanded" to display policy rules in the third column
		 * - Enables drill-down navigation for viewing and managing policy rules
		 */
		onPressRuleLink: function (oEvent) {
			//alert("Not Implemented");
			//var sPolicyName = oEvent.getSource().getCustomData()[0].getValue();
			//this._oRouter.navTo("PolicyRules", { PolicyName: sPolicyName });
			//this.getView().getModel("layoutMode").setProperty("/layout", "ThreeColumnsEndExpanded");
		}
		

	});
});