sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/m/MessageBox",
		"sap/ui/core/Fragment",
		"sap/ui/table/Column",
		"sap/m/Column",
		"sap/m/Text",
		"sap/m/Label",
		"sap/m/ColumnListItem",
		"sap/m/OverflowToolbarButton",
		"sap/m/ToolbarSpacer",
		"sap/ui/model/Sorter",
		"sap/ui/core/CustomData",
		"sap/base/Log",
		"sap/m/Token"
	],
	function (BaseController, MessageBox, Fragment, UIColumn, Column, Text, Label,
		ColumnListItem, OverflowToolbarButton, ToolbarSpacer, Sorter, CustomData, Log, Token) {
		"use strict";
		return BaseController.extend("pl.dac.apps.fnconfig.controller.BaseController", {
			oPolicyEnforcementTable: null,
			oEditContext: null,
			_bShowMaskPattern: false,
			_oAttributeTable: null,
			oAttributeTable: null,
			oActionTreeTable:null,
			/**
			 * Controller initialization method called when the view is instantiated.
			 * Can be used to modify the view before it is displayed, bind event handlers, and perform one-time initialization.
			 * 
			 * @function onInit
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onInit: function () {
			},
			setMaskingPatternVisibility(bVisible){
				this._bShowMaskPattern = bVisible;
			},
			/**
			 * Event handler for the delete attribute button press event.
			 * Displays a confirmation dialog to the user before deleting the selected record.
			 * If the user confirms the action (clicks OK), the `_removeSelectedRecord` method is invoked.
			 * 
			 * @function onDeleteAttributeButtonPress
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_onDeleteAttributeButtonPress: function () {
				var that = this, oBundle = this.getView().getModel("i18n").getResourceBundle();
				MessageBox.warning(oBundle.getText("msgDeleteConfirmation"), {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.OK,
					styleClass: "PlDacMessageBox",
					onClose: function (sAction) {
						if (sAction == "OK") {
							that._removeSelectedRecord();
						}
					}
				});
			},


			/**
			 * Event handler for table selection change event.
			 * Enables the Edit and Delete buttons when a row is selected.
			 * Updates the view model with the selected item's binding context data.
			 * 
			 * @function onTableSelectionChange
			 * @param {*} oEvent - The selection change event object.
			 * {sap.m.ListItem} oEvent.getParameter("listItem") - The selected list item.
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */

			onTableSelectionChange: function (oEvent) {
				var oView = this.getView(), oModel = oView.getModel("viewModel"), oItem = oEvent.getParameter("listItem");
				oModel.setProperty("/EditButtonEnabled", true);
				oModel.setProperty("/DeleteButtonEnabled", true);
				this.oEditContext = oItem.getBindingContext();
			},
			/**
			 * ### Event handler for input changed ###
			 * Retrieve the value of the parameter `newValue` from `oEvent`.
			 * Assign the current event source (which is `sap.m.Input`) to the controller reference variable `this.oInputAttributeName`.
			 * Set the current input state to `None`, indicating that there is no error.
			 * In the view model (named `viewModel`), update the property `ErrorState` to `None`.
			 * In the view model, set the property `ErrorMessage` to an empty string.
			 * Convert the current input value to uppercase.
			 * Set the input value state text to an empty string.
			 * Check if the length of the input value is less than 6; if so, display an input error.
			 * Check if the input value does not start with "DATA"; if it doesn't, display an error.
			 * @param {sap.ui.base.Event} oEvent 
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
			*/
			onInputChange: function (oEvent) {
				var oView = this.getView(), sNewValue = oEvent.getParameter("newValue"), sAttributeType;
				this.oInputAttributeName = oEvent.getSource();
				sAttributeType = this.oInputAttributeName.getCustomData()[0].getValue();
				this.oInputAttributeName.setValueState("None");
				oView.getModel("viewModel").setProperty("/ErrorState", "None");
				oView.getModel("viewModel").setProperty("/ErrorMessage", "");
				this.oInputAttributeName.setValue(this.oInputAttributeName.getValue().toUpperCase());
				this.oInputAttributeName.setValueStateText("");
				if (sNewValue.length < 6) { // Example validation rule
					oView.getModel("viewModel").setProperty("/ErrorState", "Error");
					oView.getModel("viewModel").setProperty("/ErrorMessage", "Invalid input");
				} else {
					if (sNewValue.split(".")[0] != sAttributeType) {
						oView.getModel("viewModel").setProperty("/ErrorState", "Error");
						oView.getModel("viewModel").setProperty("/ErrorMessage", "An attribute name should begin with \"" + sAttributeType + "\" followed by the specific attribute name.");
					}
				}
			},
			/**
			 * Event handler for the add attribute button press event.
			 * Initializes the dialog for creating a new attribute with empty values.
			 * Sets up the view model with default data and enables the attribute name input field.
			 * Loads and displays the attribute dialog fragment if not already instantiated.
			 *
			 * @function _onAddAttributeButtonPress
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_onAddAttributeButtonPress: function (oEvent) {
				var oView = this.getView(), oContext, aCustomData = oEvent.getSource().getCustomData(),
					oDataModel = oView.getModel();
				oView.getModel("viewModel").setProperty("/AttrNameEnabled", true);
				oView.getModel("viewModel").setProperty("/ErrorState", "None");
				oView.getModel("viewModel").setProperty("/ErrorMessage", "");
				oContext = oDataModel.createEntry("/" + aCustomData[0].getValue(), {
					properties: {
						AttributeId: "",
						Description: ""
					}
				});
				this.oEditContext = null;
				if (!this._oAttributeDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogAttribute", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this._oAttributeDialog = oDialog;
						this._oAttributeDialog.setBindingContext(oContext);
						this._oAttributeDialog.attachAfterOpen(this._onDailogOnAfterShow, this);
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						oDialog.open();

					}.bind(this));
				} else {
					this._oAttributeDialog.setBindingContext(oContext);
					this._oAttributeDialog.open();
				}
			},

			/**
			 * Event handler for closing the attribute dialog.
			 * Closes the attribute dialog if it has been instantiated.
			 * 
			 * @function onCloseAttributeDialog
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onCloseAttributeDialog: function () {
				var oView= this.getView();
				if (this._oAttributeDialog) {
					this._oAttributeDialog.close();
					if(this.oEditContext){
						oView.getModel().resetChanges([this.oEditContext.getPath()]);
					}
					oView.getModel().deleteCreatedEntry(this._oPolicyInforcementDialog.getBindingContext());
					oView.getModel().refresh();
					
				}
			},
			/**
			 * Event handler for the edit attribute button press event.
			 * Retrieves the selected attribute from the table and populates the dialog with its data.
			 * Disables the attribute name input field since editing an existing attribute name is not allowed.
			 * Loads and displays the attribute dialog fragment if not already instantiated.
			 *
			 * @function _onEditAttributeButtonPress
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_onEditAttributeButtonPress: function () {
				var oView = this.getView(), oViewModel = oView.getModel("viewModel");
				oViewModel.setProperty("/PatternAttributeId", "");
				oViewModel.setProperty("/PatternAttributeDesc", "");
				oViewModel.setProperty("/MaskPattern", "");
				this.oEditContext.getProperty("IsActive") == "" ? false : true;
				if (!this._oAttributeDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogAttribute", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this._oAttributeDialog = oDialog;
						this._oAttributeDialog.setBindingContext(this.oEditContext);
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						this._oAttributeDialog.attachAfterOpen(this._onDailogOnAfterShow, this);
						oDialog.open();

					}.bind(this));
				} else {

					this._oAttributeDialog.open();
					this._oAttributeDialog.setBindingContext(this.oEditContext);

				}
				oView.getModel("viewModel").setProperty("/AttrNameEnabled", false);
			},
			/**
			 * Private event handler called when the attribute dialog is opened.
			 * Sets focus to the first enabled form field, or to the second field if the first is disabled.
			 * Retrieves the form elements from the dialog and manages focus management for better UX.
			 *
			 * @function _onDailogOnAfterShow
			 * @param {sap.ui.base.Event} oEvent - The afterOpen event object from the dialog.
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_onDailogOnAfterShow: function (oEvent) {
				var oDailog = oEvent.getSource(),
					oForm = oDailog.getContent()[0].getAggregation("form"),
					aFormElements = oForm.getAggregation("formContainers")[0].getAggregation("formElements");
				if (aFormElements[0].getAggregation("fields")[0].getEnabled()) {
					aFormElements[0].getAggregation("fields")[0].focus();
				} else {
					aFormElements[1].getAggregation("fields")[0].focus();
				}

			},

			/** Event handler for `onTableUpdateFinished` table event
			 * Retrieves the reference to the current table and stores it in the local variable `oTable`
			 * Invoke the `removeSelections` method on the table and pass in a parameter of `true`.
			 * @param {sap.ui.base.Event} oEvent 
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 */
			onTableUpdateFinished: function (oEvent) {
				var oTable = oEvent.getSource();
				oTable.removeSelections(true);
				oTable.setBusy(false);
			},

			/**
			 * Event handler for the full screen button press event.
			 * Switches the view layout to full screen mode for the middle column.
			 * Updates the view model to hide the full screen button and show the exit full screen button.
			 *
			 * @function handleFullScreen
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			handleFullScreen: function () {
				var oView = this.getView();
				oView.getModel("layoutMode").setProperty("/layout", "MidColumnFullScreen");
				oView.getModel("viewModel").setProperty("/FullScreen", false);
				oView.getModel("viewModel").setProperty("/ExitFullScreen", true);
			},


			/**
			 * Event handler for the exit full screen button press event.
			 * Switches the view layout back to two column mode with the middle column expanded.
			 * Updates the view model to show the full screen button and hide the exit full screen button.
			 *
			 * @function handleExitFullScreen
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			handleExitFullScreen: function () {
				var oView = this.getView();
				oView.getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
				oView.getModel("viewModel").setProperty("/FullScreen", true);
				oView.getModel("viewModel").setProperty("/ExitFullScreen", false);
			},
			/**
			 * Adds action buttons (Add, Edit, Delete) to the Attribute SmartTable toolbar.
			 * This method dynamically populates the toolbar with overflow buttons if it hasn't been initialized yet.
			 * The buttons are bound to their respective event handlers and include proper icons, tooltips, and enable/disable states.
			 *
			 * @function addAdditionalButtonIntoTheAttributeTableToolbar
			 * @param {sap.ui.comp.smarttable.SmartTable} oSmartTable - The SmartTable control whose toolbar should be enhanced with action buttons.
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * - Retrieves the toolbar from the provided SmartTable
			 * - Checks if the toolbar is empty (not yet initialized)
			 * - If empty, adds the following controls in sequence:
			 *   1. ToolbarSpacer - for spacing
			 *   2. Add Button - opens the add attribute dialog via `onAddAttributeButtonPress`
			 *   3. Edit Button - opens the edit attribute dialog via `_onEditAttributeButtonPress` (enabled based on selection)
			 *   4. Delete Button - deletes selected attribute via `_onDeleteAttributeButtonPress` (enabled based on selection)
			 * - All buttons are configured with appropriate icons, text, tooltips (i18n-based), and press event handlers
			 * - Edit and Delete buttons are bound to the view model's `/EditButtonEnabled` and `/DeleteButtonEnabled` properties
			 * - Tooltips are bound to i18n keys: `txtBtnAddDataAttribute`, `txtBtnEditDataAttribute`, `txtBtnDelDataAttribute`
			 */
			addAdditionalButtonIntoTheAttributeTableToolbar: function (oSmartTable) {
				var oToolbar = oSmartTable.getToolbar();
				this._oAttributeTable = oSmartTable.getTable();
				if (oToolbar.getContent().length == 0) {
					oToolbar.addContent(new ToolbarSpacer());
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Add",
						icon: "sap-icon://add",
						tooltip: "{i18n>txtBtnAddAttribute}",
						customData: [
							new CustomData({
								key: "entitySet",
								value: oSmartTable.getEntitySet()
							})
						],
						press: this._onAddAttributeButtonPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Edit",
						icon: "sap-icon://edit",
						enabled: "{viewModel>/EditButtonEnabled}",
						tooltip: "{i18n>txtBtnEditAttribute}",
						customData: [
							new CustomData({
								key: "entitySet",
								value: oSmartTable.getEntitySet()
							})
						],
						press: this._onEditAttributeButtonPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Delete",
						icon: "sap-icon://delete",
						enabled: "{viewModel>/DeleteButtonEnabled}",
						tooltip: "{i18n>txtBtnDelAttribute}",
						press: this._onDeleteAttributeButtonPress.bind(this)
					}));

				}
			},
			getPolicyInforcementDialog:function(){
				return this._oPolicyInforcementDialog;
			},
			onSwitchStateChanged: function (oEvent) {
				var oView = this.getView(), oDataModel = oView.getModel(),
					oContext = this._oPolicyInforcementDialog.getBindingContext();
				oDataModel.setProperty(oContext.getPath() + "/IsActive", oEvent.getParameter("state") ? "X" : "");
			},
			formatEnforcementStatus: function (IsActive) {
				if (typeof (IsActive) == "string") {
					return IsActive == "X";
				}
				return IsActive;

			},
			/**
			 * Handles the save action for the Attribute dialog.
			 *
			 * This function validates the input fields of the attribute dialog, 
			 * checks for pending changes in the model, and submits changes 
			 * using batch requests. It also handles success and error responses 
			 * from the OData model.
			 *
			 * Validation:
			 *  - Checks that the "AttributeId" field is not empty.
			 *  - Checks that the "Description" field is not empty.
			 *  - Sets error states and messages in the "viewModel" if validation fails.
			 *
			 * Change Handling:
			 *  - If `this.oEditContext` is null, sets deferred group "createAttribute".
			 *  - Otherwise, sets deferred group "changeAttribute" and checks for pending changes.
			 *  - Shows a message if there are no changes to submit.
			 *
			 * OData Submission:
			 *  - Uses batch mode to submit changes to the OData model.
			 *  - On success, shows a success MessageBox based on the OData response and closes the dialog.
			 *  - On error, closes the dialog and displays an error message.
			 *
			 * @function
			 * @memberof pl.dac.apps.fnconfig.controller.EnvAttribute
			 * @example
			 * // Trigger save when the user clicks "Save" in the dialog
			 * this.onSaveAttributeDialog();
			 */
			onSaveAttributeDialog: function () {
				var oContext,
					oView = this.getView(),
					oModel = oView.getModel(),
					oBundle = oView.getModel("i18n").getResourceBundle();
				oContext = this._oAttributeDialog.getBindingContext();
				if (oContext.getProperty("AttributeId").trim() == "") {
					oView.getModel("viewModel").setProperty("/ErrorState", "Error");
					oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorResultNameMandatory"));
					this._oAttributeDialog.getContent()[0].getContent()[1].focus()
					return;
				}

				if (oContext.getProperty("Description").trim() == "") {
					oView.getModel("viewModel").setProperty("/ErrorStateDesc", "Error");
					oView.getModel("viewModel").setProperty("/ErrorMessageDesc", oBundle.getText("msgErrorResultNameMandatory"));
					this._oAttributeDialog.getContent()[0].getContent()[3].focus()
					return;
				}
				if (this.oEditContext == null) {

					oModel.createEntry(oContext.getPath(), {
						properties: oContext.getObject(),
						groupId: "createAttribute"
					});
				} else {
					var oChanges = oModel.getPendingChanges();
					var sPath = oContext.getPath();
					var bHasChanges = Object.keys(oChanges).some(function (sKey) {
						return sKey.indexOf(sPath.replace("/", "")) === 0;
					});

					if (!bHasChanges) {
						sap.m.MessageToast.show(oBundle.getText("msgUpdateNoChanges"));
						return;
					}
				}
				oModel.submitChanges({
					success: function (oData) {
						if (({}).hasOwnProperty.call(oData, "__batchResponses") && ({}).hasOwnProperty.call(oData.__batchResponses[0], "__changeResponses")) {
							if (oData.__batchResponses[0].__changeResponses[0].statusCode == "201") {
								MessageBox.success(JSON.parse(oData.__batchResponses[0].__changeResponses[0].headers["sap-message"]).message, { contentWidth: "480px" });
								this._oAttributeDialog.close();
								this._oAttributeTable.getBinding("items").refresh();
								this._oAttributeTable.removeSelections(true);
								this._oAttributeTable.setBusy(false);
								return;
							}
							if (oData.__batchResponses[0].__changeResponses[0].statusCode == "204") {
								MessageBox.success(JSON.parse(oData.__batchResponses[0].__changeResponses[0].headers["sap-message"]).message, { contentWidth: "480px" });
								this._oAttributeDialog.close();
								this._oAttributeTable.getBinding("items").refresh();
								this._oAttributeTable.removeSelections(true);
								this._oAttributeTable.setBusy(false);
								this._oAttributeTable.getBinding("items").refresh().refresh();
								return;
							}
						} else if (({}).hasOwnProperty.call(oData, "__batchResponses")) {
							if (oData.__batchResponses[0].response.statusCode == "409") {
								this.oInputAttributeName.focus();
								oView.getModel("viewModel").setProperty("/ErrorMessage", JSON.parse(oData.__batchResponses[0].response.body).error.message.value);
								oView.getModel("viewModel").setProperty("/ErrorState", "Error");
							}
						}
					}.bind(this),
					error: function (oError) {
						this._oAttributeDialog.close();
						this.displayErrorMessage(oError);
					}.bind(this)
				});
			},

			/** ###### POLICY INFORCEMENT POINT */

			/**
			 * Event handler for the delete attribute button press event.
			 * Displays a confirmation dialog to the user before deleting the selected record.
			 * If the user confirms the action (clicks OK), the `_removePEPSelectedRecord` method is invoked.
			 * 
			 * @function _onDeletePolicyEnforcementButtonPress
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_onDeletePolicyEnforcementButtonPress: function () {
				var that = this, oBundle = this.getView().getModel("i18n").getResourceBundle();
				MessageBox.warning(oBundle.getText("msgDeleteConfirmation"), {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.OK,
					styleClass: "PlDacMessageBox",
					onClose: function (sAction) {
						if (sAction == "OK") {
							that._removePEPSelectedRecord();
						}
					}
				});
			},
			/**
			 * Removes the currently selected record from the OData model.
			 *
			 * This method:
			 * 1. Retrieves the path of the selected record from `oEditContext`.
			 * 2. Sends a DELETE request to the OData service.
			 * 3. Handles the success response by:
			 *    - Displaying a success message (from `sap-message` header if available).
			 *    - Refreshing the model.
			 *    - Clearing table selections.
			 *    - Resetting the view model properties (data and button states).
			 * 4. Handles errors by logging and displaying an error message.
			 *
			 * @function
			 * @name _removeSelectedRecord
			 * @memberof YourController
			 *
			 * @throws {Error} Throws an error if deletion fails and cannot be handled by `_displayErrorMessage`.
			 *
			 * @example
			 * // Deletes the selected record in the UI
			 * this._removeSelectedRecord();
			 */
			_removeSelectedRecord: function () {
				var sPath, oView = this.getView(),
					oDataModel = oView.getModel(),
					oBundle = oView.getModel("i18n").getResourceBundle();
				sPath = this.oEditContext.getPath();
				oDataModel.remove(sPath, {
					groupId: "deleteGroup",
					success: function (oData, oResponse) {
						MessageBox.success(JSON.parse(oResponse.headers["sap-message"]).message, { styleClass: "PlDacMessageBox", contentWidth: "480px" });
						this._oAttributeTable.removeSelections(true);
						oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
						oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
						this._oAttributeTable.getBinding("items").refresh();
						this._oAttributeTable.setBusy(false);
					}.bind(this),
					error: function (oError) {
						Log.error(oBundle.getText("msgUAErrorInDelete") + oError);
						this.displayErrorMessage(oError);
					}.bind(this)
				});
			},
			/**
			 * Event handler for editing an existing Policy Enforcement entry.
			 *
			 * This function prepares the UI and dialog for editing a selected policy.
			 * It disables certain fields (e.g., Policy Name and Attribute) to prevent
			 * modification of key identifiers and resets validation states before
			 * opening the dialog.
			 *
			 * Workflow:
			 * 1. Reset validation states:
			 *    - Clear error messages and set error states to "None"
			 * 2. Disable editing of immutable fields:
			 *    - Policy Name is always disabled
			 *    - Attribute fields are disabled if visible
			 * 3. If attribute section is visible:
			 *    - Clear pattern-related properties
			 *    - Load masking pattern details based on Attribute ID
			 * 4. Clear any existing validation errors
			 * 5. Load and open the dialog fragment:
			 *    - If dialog is not yet created, load it asynchronously using `Fragment.load`
			 *    - Bind the dialog to the existing selected context (`this.oEditContext`)
			 *    - Add dialog as a dependent of the view
			 *    - Open the dialog
			 * 6. If dialog already exists:
			 *    - Rebind it to the edit context
			 *    - Open it directly
			 * 7. Ensure Policy Name field remains disabled in the ViewModel
			 *
			 * @function _onEditPolicyEnforcementButtonPress
			 * @memberof pl.dac.apps.fnconfig.controller.BaseController
			 *
			 * @returns {void}
			 *
			 * @example
			 * // Triggered when user clicks "Edit Policy Enforcement"
			 * this._onEditPolicyEnforcementButtonPress();
			 *
			 * @see sap.ui.core.Fragment#load
			 */
			_onEditPolicyEnforcementButtonPress: function () {
				var oView = this.getView(), oViewModel = oView.getModel("viewModel");
				oViewModel.setProperty("/ErrorMessage", "");
				oViewModel.setProperty("/ErrorState", "None");
				oViewModel.setProperty("/PolicyNameEnabled", false);
				if (oViewModel.getProperty("/VisibleAttribute")) {
					oViewModel.setProperty("/AttributeNameEnabled", false);
					oViewModel.setProperty("/PatternAttributeId", "");
					oViewModel.setProperty("/PatternAttributeDesc", "");
					oViewModel.setProperty("/MaskPattern", "");
					this.loadMaskingPatternDetailsByAttributeId();
				}
				this._clearValidationError();
				if (!this._oPolicyInforcementDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this._oPolicyInforcementDialog = oDialog;
						this._oPolicyInforcementDialog.setBindingContext(this.oEditContext);
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						this._updateSwitchState(this.oEditContext,oView);
						oDialog.open();
					}.bind(this));
				} else {
					this._oPolicyInforcementDialog.setBindingContext(this.oEditContext);
					this._oPolicyInforcementDialog.open();
					this._updateSwitchState(this.oEditContext,oView);
				}
				oView.getModel("viewModel").setProperty("/PolicyNameEnabled", false);

			},

			_updateSwitchState:function(oContext,oView){
				var  oData = oContext.getObject();
				if(oData.IsActive=="X"){
					oView.byId("idPEPState").setState(true);
				}else{
					oView.byId("idPEPState").setState(false);
				}
			},

			/**
			 * Event handler for adding a new Policy Enforcement entry.
			 *
			 * This function initializes a new entry in the OData model and opens
			 * the Policy Enforcement dialog for user input. It also resets validation
			 * states and prepares the UI for a fresh create operation.
			 *
			 * Workflow:
			 * 1. Retrieve required models and event data:
			 *    - View and ViewModel
			 *    - OData model
			 *    - Entity set name from button custom data
			 * 2. Create a new entry in the OData model using `createEntry` with default values:
			 *    - Policy: empty string
			 *    - PolicyResult: empty string
			 *    - IsActive: false
			 * 3. Reset UI state:
			 *    - Enable policy name and attribute fields (if applicable)
			 *    - Clear all error states and messages
			 *    - Clear previous validation errors
			 * 4. Load and open the dialog fragment:
			 *    - If dialog is not yet created, load it asynchronously using `Fragment.load`
			 *    - Bind the dialog to the newly created context
			 *    - Add dialog as a dependent of the view
			 *    - Store reference to Policy Name input field
			 *    - Open the dialog
			 * 5. If dialog already exists:
			 *    - Rebind it to the new context
			 *    - Open the dialog directly
			 *
			 * @function _onAddPolicyEnforcementBtnPress
			 * @memberof pl.dac.apps.fnconfig.controller.BaseController
			 *
			 * @param {sap.ui.base.Event} oEvent - The press event triggered by the Add button.
			 * @param {sap.ui.core.Control} oEvent.getSource - مصدر الحدث (الزر) الذي يحتوي على البيانات المخصصة.
			 *
			 * @returns {void}
			 *
			 * @example
			 * // Triggered when user clicks "Add Policy Enforcement"
			 * this._onAddPolicyEnforcementBtnPress(oEvent);
			 *
			 * @see sap.ui.model.odata.v2.ODataModel#createEntry
			 * @see sap.ui.core.Fragment#load
			 */
			_onAddPolicyEnforcementBtnPress: function (oEvent) {
				var oView = this.getView(), oViewModel = oView.getModel("viewModel"),
					oContext, oDataModel = oView.getModel(), aCustomData = oEvent.getSource().getCustomData();

				oContext = oDataModel.createEntry("/" + aCustomData[0].getValue(), {
					properties: {
						Policy: "",
						PolicyResult: "",
						IsActive: false
					}
				});
				oViewModel.setProperty("/PolicyNameEnabled", true);
				oViewModel.setProperty("/ErrorState", "None");
				oViewModel.setProperty("/ErrorMessage", "");
				oViewModel.setProperty("/AttrErrorState", "None");
				oViewModel.setProperty("/AttrErrorMessage", "");
				oViewModel.setProperty("/PolicyNameEnabled", true);
				if (oViewModel.getProperty("/VisibleAttribute")) {
					oViewModel.setProperty("/AttributeNameEnabled", true);
				}
				this._clearValidationError();
				if (!this._oPolicyInforcementDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this._oPolicyInforcementDialog = oDialog;
						this._oPolicyInforcementDialog.setBindingContext(oContext);
						this._updateSwitchState(oContext,oView);
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						this.oPolicyNameInput = oView.byId("idPEPPolicyName");
						oDialog.open();

					}.bind(this));
				} else {
					this.oPolicyNameInput = oView.byId("idPEPPolicyName");
					this._oPolicyInforcementDialog.setBindingContext(oContext);
					this._updateSwitchState(oContext,oView);
					this._oPolicyInforcementDialog.open();
				}
			},

			/**
			 * Handles the save operation for Policy Enforcement data.
			 *
			 * This function performs validation checks on user inputs such as Policy name,
			 * Attributes, and Action Result before submitting changes to the backend model.
			 * Depending on whether the operation is a create or update, it prepares the data
			 * accordingly and submits it using batch requests.
			 *
			 * Workflow:
			 * 1. Validate mandatory fields:
			 *    - Policy name must not be empty
			 *    - Attribute (if present) must not be empty
			 *    - Policy result must not be empty
			 * 2. Set active flag ("X" or "") based on boolean value.
			 * 3. Determine if the operation is:
			 *    - Create: Uses `createEntry` with groupId "createPEP"
			 *    - Update: Checks for pending changes before submission
			 * 4. Submit changes via `submitChanges`
			 * 5. Handle response:
			 *    - 201: Successfully created
			 *    - 204: Successfully updated
			 *    - 409/480/500: Backend error handling with message display
			 * 6. Reset UI state and refresh model after success
			 *
			 * @function onSavePolicyInforcement
			 * @memberof pl.dac.apps.fnconfig.controller.BaseController
			 *
			 * @returns {void}
			 *
			 * @throws {Error} Triggers UI error states instead of throwing exceptions when validation fails.
			 *
			 * @example
			 * // Trigger save action from UI (e.g., button press)
			 * this.onSavePolicyInforcement();
			 *
			 * @see sap.ui.model.odata.v2.ODataModel#createEntry
			 * @see sap.ui.model.odata.v2.ODataModel#submitChanges
			 */
			onSavePolicyInforcement: function () {
				var oBundle, sPath, oView = this.getView(),
					oViewModel = oView.getModel("viewModel"), sActive = "", oChanges,
					oContext, oDataModel;
				oBundle = oView.getModel("i18n").getResourceBundle();
				oContext = this._oPolicyInforcementDialog.getBindingContext(),
					oDataModel = oView.getModel();

				if (oViewModel.getProperty("/ErrorState") == "Error") {
					oView.byId("idPEPPolicyName").focus();
					return;
				}
				if (oViewModel.getProperty("/AttrErrorState") == "Error") {
					oView.byId("idPEPAttributes").focus();
					return;
				}
				if (oContext.getProperty("Policy").trim() == "") {
					oViewModel.setProperty("/ErrorState", "Error");
					oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorPolicyNameMandatory"));
					oView.byId("idPEPPolicyName").focus();
					return;
				}
				if (({}).hasOwnProperty.call(oContext.getObject(), "AttributeId") && oContext.getObject().AttributeId.trim() == "") {
					oViewModel.setProperty("/AttrErrorState", "Error");
					oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameMandatory"));
					oView.byId("idPEPAttributes").focus();
					return;
				}
				if (oContext.getProperty("PolicyResult") == "") {
					oViewModel.setProperty("/ActionErrorState", "Error");
					oViewModel.setProperty("/ActionErrorMessage", oBundle.getText("msgErrorResultNameMandatory"));
					oView.byId("idPEPActionResult").focus();
					return;
				}

				sActive = oContext.getProperty("IsActive") ? "X" : "";


				oDataModel.setProperty(oContext.getPath() + "/IsActive", sActive);
				if (this.oEditContext == null) {
					var oData =  oContext.getObject();
					if(oView.byId("idPEPState").getState()){
						oData.IsActive="X";
					}else{
						oData.IsActive="";
					}
					oDataModel.createEntry(oContext.getPath(), {
						properties: oData,
						groupId: "createPEP"
					});
				} else {
					oChanges = oDataModel.getPendingChanges();
					sPath = oContext.getPath();
					var bHasChanges = Object.keys(oChanges).some(function (sKey) {
						return sKey.indexOf(sPath.replace("/", "")) === 0;
					});

					if (!bHasChanges) {
						sap.m.MessageToast.show(oBundle.getText("msgUpdateNoChanges"));
						return;
					}
				}
				oDataModel.submitChanges({
					success: function (oData) {
						if (({}).hasOwnProperty.call(oData, "__batchResponses") && ({}).hasOwnProperty.call(oData.__batchResponses[0], "__changeResponses")) {
							if (oData.__batchResponses[0].__changeResponses[0].statusCode == "201") {
								MessageBox.success(JSON.parse(oData.__batchResponses[0].__changeResponses[0].headers["sap-message"]).message, { contentWidth: "480px" });
								this._oPolicyInforcementDialog.close()
								this.oPolicyEnforcementTable.getBinding("items").refresh();
								this.oPolicyEnforcementTable.removeSelections(true);
								oViewModel.setProperty("/EditButtonEnabled", false);
								oViewModel.setProperty("/DeleteButtonEnabled", false);
								return;
							}
							if (oData.__batchResponses[0].__changeResponses[0].statusCode == "204") {
								MessageBox.success(JSON.parse(oData.__batchResponses[0].__changeResponses[0].headers["sap-message"]).message, { contentWidth: "480px" });
								this._oPolicyInforcementDialog.close()
								this.oPolicyEnforcementTable.getBinding("items").refresh();
								this.oPolicyEnforcementTable.removeSelections(true);
								oViewModel.setProperty("/EditButtonEnabled", false);
								oViewModel.setProperty("/DeleteButtonEnabled", false);
								return;
							}
						} else if (({}).hasOwnProperty.call(oData, "__batchResponses")) {
							if (oData.__batchResponses[0].response.statusCode == "409" || oData.__batchResponses[0].response.statusCode == "500" || oData.__batchResponses[0].response.statusCode == "400") {

								this.oPolicyNameInput.focus();
								oView.getModel("viewModel").setProperty("/ErrorMessage", JSON.parse(oData.__batchResponses[0].response.body).error.message.value);
								oView.getModel("viewModel").setProperty("/ErrorState", "Error");
							}
						}
					}.bind(this),
					error: function (oError) {
						this._oPolicyInforcementDialog.close();
						this.displayErrorMessage(oError);
					}.bind(this)
				});


			},

			/**
			 * Deletes the selected Policy Enforcement record from the OData model.
			 *
			 * This function removes the currently selected entry using its binding context path.
			 * It sends a delete request to the backend and handles both success and error responses.
			 *
			 * Workflow:
			 * 1. Retrieve:
			 *    - View and OData model
			 *    - i18n resource bundle for localized messages
			 *    - Path of the selected record from `this.oEditContext`
			 * 2. Call `oModel.remove` with the selected path and groupId "deleteGroup"
			 * 3. On successful deletion:
			 *    - Parse and display success message from response header (`sap-message`)
			 *    - Clear table selections
			 *    - Disable Edit and Delete buttons in the ViewModel
			 *    - Refresh the model to reflect changes
			 * 4. On error:
			 *    - Log the error message
			 *    - Display error message using a custom handler
			 *
			 * @function _removePEPSelectedRecord
			 * @memberof pl.dac.apps.fnconfig.controller.BaseController
			 *
			 * @returns {void}
			 *
			 * @example
			 * // Triggered when user confirms deletion of a selected record
			 * this._removePEPSelectedRecord();
			 *
			 * @see sap.ui.model.odata.v2.ODataModel#remove
			 */
			_removePEPSelectedRecord: function () {
				var sPath, oView = this.getView(),
					oDataModel = oView.getModel(),
					oBundle = oView.getModel("i18n").getResourceBundle();
				sPath = this.oEditContext.getPath();
				oDataModel.remove(sPath, {
					groupId: "deleteGroup",
					success: function (oData, oResponse) {
						MessageBox.success(JSON.parse(oResponse.headers["sap-message"]).message, { styleClass: "PlDacMessageBox", contentWidth: "480px" });
						this.oPolicyEnforcementTable.removeSelections(true)
						oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
						oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
						this.oPolicyEnforcementTable.getBinding("items").refresh();
						this.oPolicyEnforcementTable.setBusy(false);
					}.bind(this),
					error: function (oError) {
						Log.error(oBundle.getText("msgUAErrorInDelete") + oError);
						this.displayErrorMessage(oError);
					}.bind(this)
				});
			},

			/**
			 * Clears all validation error states and messages in the ViewModel.
			 *
			 * This utility function resets the UI validation state for Policy Enforcement
			 * form fields, ensuring that no previous error indicators or messages remain.
			 *
			 * Workflow:
			 * 1. Retrieve the View and its associated ViewModel
			 * 2. Reset all validation-related properties:
			 *    - Policy error state and message
			 *    - Attribute error state and message
			 *    - Action (result) error state and message
			 *
			 * This is typically called before opening dialogs or re-validating inputs
			 * to ensure a clean UI state.
			 *
			 * @function _clearValidationError
			 * @memberof pl.dac.apps.fnconfig.controller.BaseController
			 *
			 * @returns {void}
			 *
			 * @example
			 * // Clear validation before opening a dialog
			 * this._clearValidationError();
			 */
			_clearValidationError: function () {
				var oView = this.getView(), oViewModel = oView.getModel("viewModel");
				oViewModel.setProperty("/ErrorState", "None");
				oViewModel.setProperty("/ErrorMessage", "");
				oViewModel.setProperty("/AttrErrorState", "None");
				oViewModel.setProperty("/AttrErrorMessage", "");
				oViewModel.setProperty("/ActionErrorState", "None");
				oViewModel.setProperty("/ActionErrorMessage", "");
			},
			/**
			 * Private event handler called when the policy enforcement dialog is opened.
			 * Sets focus to the first enabled form field, or to the third field if the first is disabled.
			 * Retrieves the form elements from the dialog and manages focus management for better UX.
			 *
			 * @function onBeforePEPDialogOpened
			 * @param {sap.ui.base.Event} oEvent - The afterOpen event object from the dialog.
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onBeforePEPDialogOpened: function (oEvent) {
				var oDailog = oEvent.getSource(), oView = this.getView(), oViewModel = oView.getModel("viewModel"),
					oForm = oDailog.getContent()[0].getAggregation("form"),
					aFormElements = oForm.getAggregation("formContainers")[0].getAggregation("formElements");

				if (aFormElements[0].getAggregation("fields")[0].getEnabled()) {
					aFormElements[0].getAggregation("fields")[0].focus();
					if (oViewModel.getProperty("/VisibleAttribute")) {
						aFormElements[1].getAggregation("fields")[0].removeAllTokens();
						oViewModel.setProperty("/AttrErrorState", "None");
						oViewModel.setProperty("/AttrErrorMessage", "");
					}
				} else {
					aFormElements[2].getAggregation("fields")[0].focus();
					aFormElements[0].getAggregation("fields")[0].setValue("");
					this._realPolicyDescription(this.oEditContext.getObject().Policy.split("~")[0], aFormElements[0].getAggregation("fields")[0]);
					//	aFormElements[0].getAggregation("fields")[0].setTokens([new Token({ key: this.oEditContext.getObject().Policy.split("~")[0], text: oData.PolicyName + " (" + oData.PolicyDesc + ")" })])
					if (({}).hasOwnProperty.call(this.oEditContext.getObject(), "AttributeId")) {
						this.validateAttibuteInput(this.oEditContext.getObject().AttributeId);
						this.loadMaskingPatternDetailsByAttributeId();
					}
				}
			},
			_realPolicyDescription: function (sPolicy, oInput) {
				var oView = this.getView(), oDataModel = oView.getModel();
				oDataModel.read("/PolicySet('" + sPolicy + "')", {
					urlParameters: { "$select": "Policy,PolicyName,PolicyDesc" },
					success: function (oData) {
						oInput.setTokens([new Token({ key: oData.Policy, text: oData.PolicyName + " (" + oData.PolicyDesc + ")" })]);
					},
					error: function (oError) {
						this.displayErrorMessage(oError);
					}.bind(this)
				});
			},
			loadMaskingPatternDetailsByAttributeId: function () { },
			validateAttibuteInput: function (sAttributeId) { sAttributeId; },


			/**
			 * Event handler for closing the policy enforcement dialog.
			 * Restores the view model with the selected policy enforcement item's binding context data if an item is selected.
			 * Closes the policy enforcement dialog if it has been instantiated.
			 *
			 * @function onCloseDialogPolicyInforcement
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onCloseDialogPolicyInforcement: function () {
				var oView = this.getView();
				if (this._oPolicyInforcementDialog) {

					oView.byId("idPEPPolicyName").setValue("");
					this._oPolicyInforcementDialog.close();
					this.oPolicyEnforcementTable.removeSelections(true);
					if (this.oPolicyNameInput) {
						this.oPolicyNameInput.removeAllTokens();
					}
					if(this.oEditContext){
						oView.getModel().resetChanges([this.oEditContext.getPath()]);
					}
					oView.getModel().deleteCreatedEntry(this._oPolicyInforcementDialog.getBindingContext());
					this.oPolicyEnforcementTable.getBinding("items").refresh();
				}
				this._clearValidationError();
			},
			/**
			 * Event handler for the SmartTable `beforeRebindTable` event.
			 * Ensures related Policy data is expanded when the table's OData binding is (re)bound.
			 *
			 * @function onBeforeRebindTable
			 * @param {*} oEvent - The beforeRebindTable event object.
			 * @param {object} oEvent.getParameter("bindingParams") - The binding parameters object passed by the event (modified in-place).
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onBeforeRebindTable: function (oEvent) {
				var mBindingParams = oEvent.getParameter("bindingParams");
				mBindingParams.parameters["expand"] = "to_Policy";
				mBindingParams.parameters["select"] = mBindingParams.parameters["select"] + ",Policy,to_Policy/PolicyDesc";
			},
			/**
			 * Event handler called before the Policy Enforcement Point (PEP) dialog is closed.
			 * Resets the view model button states and clears the policy name input tokens.
			 * This cleanup ensures the UI is in a consistent state after the dialog closes.
			 *
			 * @function onBeforePEPDialogClosed
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * - Retrieves the current view reference
			 * - Disables Edit and Delete buttons by setting view model properties:
			 *   - `/EditButtonEnabled` → false
			 *   - `/DeleteButtonEnabled` → false
			 * - Clears all tokens from the policy name input field (idPEPPolicyName)
			 * 
			 * This method is typically triggered by the dialog's `beforeClose` event to ensure
			 * proper cleanup and prevent stale UI states when the dialog is reopened.
			 */
			onBeforePEPDialogClosed: function () {
				var oView = this.getView();
				oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
				oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
				this.getView().byId("idPEPPolicyName").removeAllTokens();
			},
			/**
			 * Event handler for the Value Help Dialog request.
			 * Initializes and displays a Value Help Dialog for policy selection.
			 * Sets up the dialog with OData binding for PolicySet, configures columns for desktop and mobile,
			 * and manages dialog lifecycle (creation, opening, and reuse).
			 *
			 * @function onValueHelpRequested
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * - Retrieves the policy name input control reference and stores it in `this.oPolicyNameInput`
			 * - Creates a new Value Help Dialog fragment if not already instantiated
			 * - Sets up range key fields for filtering
			 * - Binds the dialog table to the OData `/PolicySet` path
			 * - For desktop tables: adds Policy Name and Description columns using sap.ui.table.Column
			 * - For mobile tables: adds Policy Name and Description columns using sap.m.Column
			 * - Adds the dialog as a dependent of the view
			 * - Opens the dialog for user selection
			 */
			onValueHelpRequested: function () {
				var oColPolicyName, oColPolicyDesc, that = this, oView = this.getView();

				if (!this._oVHDialog) {
					this._oVHDialog = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.ValueHelp", this);
					oView.addDependent(this._oVHDialog);
					this.oPolicyNameInput = oView.byId("idPEPPolicyName");
					this._oVHDialog.setRangeKeyFields([{
						label: "PolicyDesc",
						key: "Polciy",
						type: "string"
					}]);
					this._oVHDialog.getTableAsync().then(function (oTable) {
						oTable.setModel(that.getView().getModel());
						oTable.setSelectionMode("Single");
						that._oVHDialog.setSupportMultiselect(false);
						// For Desktop and tabled the default table is sap.ui.table.Table
						if (oTable.bindRows) {
							// Bind rows to the ODataModel and add columns
							oTable.bindAggregation("rows", {
								path: "/PolicySet",
								events: {
									dataReceived: function () {
										that._oVHDialog.update();
									}
								}
							});
							oColPolicyName = new UIColumn({ label: new Label({ text: "Policy Name" }), template: new Text({ wrapping: false, text: "{PolicyName}" }) });
							oColPolicyName.data({
								fieldName: "{PolicyName}"
							});
							oTable.addColumn(oColPolicyName);

							oColPolicyDesc = new UIColumn({ label: new Label({ text: "Description" }), template: new Text({ wrapping: false, text: "{PolicyDesc}" }) });
							oColPolicyDesc.data({
								fieldName: "PolicyDesc"
							});
							oTable.addColumn(oColPolicyDesc);
						}
						// For Mobile the default table is sap.m.Table
						if (oTable.bindItems) {
							// Bind items to the ODataModel and add columns
							oTable.bindAggregation("items", {
								path: "/PolicySet",
								template: new ColumnListItem({
									cells: [new Label({ text: "{PolicyName}" }), new Label({ text: "{PolicyDesc}" })]
								}),
								events: {
									dataReceived: function () {
										that._oVHDialog.update();
									}
								}
							});
							oTable.addColumn(new Column({ header: new Label({ text: "Policy" }) }));
							oTable.addColumn(new Column({ header: new Label({ text: "Description" }) }));
						}
						that._oVHDialog.update();
					});
					this._oVHDialog.open();
				} else {
					this._oVHDialog.open();
				}
			},
			/**
			 * @ui5ignore
			 * Event handler for the Value Help Dialog OK button press event.
			 * Retrieves the selected token(s) from the dialog and extracts the policy information.
			 * Updates the view model with the selected policy description and name.
			 * Closes the Value Help Dialog and validates the selected policy input.
			 *
			 * @function onValueHelpOkPress
			 * @param {*} oEvent - The OK button press event object from the Value Help Dialog.
			 * {sap.m.Token[]} oEvent.getParameter("tokens") - Array of selected tokens from the dialog.
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 * 
			 */
			onValueHelpOkPress: function (oEvent) {
				var oValue, aTokens = oEvent.getParameter("tokens"), oContext, oView = this.getView(),
					oDataModel = oView.getModel();
				oValue = aTokens[0].getCustomData()[0].getValue();
				//oView.getModel("viewModel").setProperty("/Data/PolicyDesc", oValue.PolicyDesc);
				oContext = this._oPolicyInforcementDialog.getBindingContext();
				oDataModel.setProperty(oContext.getPath() + "/Policy", oValue.Policy);
				oView.getModel("viewModel").setProperty("/ErrorState", "None");
				oView.getModel("viewModel").setProperty("/ErrorMessage", "");
				oView.getModel("viewModel").refresh();
				this._oVHDialog.close();
				this._validatePolicyInput(aTokens[0].getKey());
			},
			/**
			 * Validates a policy identifier by checking if it exists in the OData service.
			 * Reads the policy data from the backend and updates the UI accordingly.
			 * On success, clears error states and populates the policy description field.
			 * On error, sets error state and displays the error message.
			 *
			 * @function _validatePolicyInput
			 * @param {string} sPolicy - The policy identifier to validate against the PolicySet entity.
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * - Constructs OData path: `/PolicySet('{sPolicy}')`
			 * - Makes an OData read request to validate the policy
			 * - Success callback:
			 *   - Sets focus to policy name input if field is editable
			 *   - Updates policy description field with retrieved `PolicyDesc` value
			 *   - Clears error state (`/ErrorState` → "None", `/ErrorMessage` → "")
			 * - Error callback:
			 *   - Clears policy description field
			 *   - Sets error state (`/ErrorState` → "Error")
			 *   - Displays error message from OData response
			 */
			_validatePolicyInput: function (sPolicy) {
				var oBundle, oView = this.getView(), oDataModel = oView.getModel(),
					oViewModel = oView.getModel("viewModel"),
					sPath = "/PolicySet('" + sPolicy + "')",
					bInputEditable = oViewModel.getProperty("/PolicyNameEnabled");
				oViewModel.setProperty("/Data/Policy", sPolicy);
				oBundle = oView.getModel("i18n").getResourceBundle();
				// Example validation rule
				oDataModel.read(sPath, {
					// Success callback function
					success: function (oData) {
						// oData contains the retrieved data
						if (bInputEditable) {
							this.oPolicyNameInput.focus();
						}
						oView.byId("idPEPPolicyName").setValue("");
						oViewModel.setProperty("/Data/PolicyName", oData.PolicyName);
						oView.byId("idPEPPolicyName").setTokens([new Token({ key: sPolicy, text: oData.PolicyName + " (" + oData.PolicyDesc + ")" })]);
						// If reading an entity set, oData.results will contain an array of entities
						if (oData.PolicyDesc) {
							oViewModel.setProperty("/ErrorState", "None");
							oViewModel.setProperty("/ErrorMessage", "");
						}
					}.bind(this),
					// Error callback function
					error: function () {
						// oError contains details about the error
						//oView.byId("idPEPPolicyDescription").setText("");
						oViewModel.getProperty("/Data/Policy", "");
						oViewModel.setProperty("/ErrorState", "Error");//
						oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorPolicyNotFound", [sPolicy]));
					}
				});
			},
			/**
			 * Event handler for the Value Help Dialog cancel action.
			 * Closes the Value Help Dialog without applying any selection.
			 *
			 * @function onValueHelpCancelPress
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onPolEnfocementPolcyVHCancelPress: function () {
				this._oVHDialog.close();
			},
			/**
			 * Adds action buttons (Add, Edit, Delete, Sort) to the Policy Enforcement SmartTable toolbar.
			 * This method dynamically populates the toolbar with overflow buttons if it hasn't been initialized yet.
			 * The buttons are bound to their respective event handlers and include proper icons, tooltips, and enable/disable states.
			 *
			 * @function addAddintionButtonIntoThePolicyEnforcementTableToolbar
			 * @param {sap.ui.comp.smarttable.SmartTable} oSmartTable - The SmartTable control whose toolbar should be enhanced with action buttons.
			 * @public
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
			addAdditionalButtonIntoThePolicyEnforcementTableToolbar: function (oSmartTable) {
				var oToolbar = oSmartTable.getToolbar();
				this.oPolicyEnforcementTable = oSmartTable.getTable();
				if (oToolbar.getContent().length == 0) {
					oToolbar.addContent(new ToolbarSpacer());
					if (this._bShowMaskPattern) {
						var btn = new OverflowToolbarButton({
							text: "Mask Pattern",
							tooltip: "{i18n>txtMaskingPattern}",
							enabled: "{viewModel>/EditButtonEnabled}",
							press: this.getView().getController()._onManageMaskingPatternBtnPress.bind(this)
						});
						//	btn.setIcon(jQuery.sap.getModulePath("pl.dac.apps.fnconfig") + "/assets/pattern.svg")
						btn.addStyleClass("plDacMaskingPattern");
						oToolbar.addContent(btn);
					}
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Add",
						icon: "sap-icon://add",
						tooltip: "{i18n>txtPolEnforcementAddBtnTooltip}",
						customData: [
							new CustomData({
								key: "entitySet",
								value: oSmartTable.getEntitySet()
							})
						],
						press: this._onAddPolicyEnforcementBtnPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Edit",
						icon: "sap-icon://edit",
						enabled: "{viewModel>/EditButtonEnabled}",
						tooltip: "{i18n>txtPolEnforcementEditBtnTooltip}",
						customData: [
							new CustomData({
								key: "entitySet",
								value: oSmartTable.getEntitySet()
							})
						],
						press: this._onEditPolicyEnforcementButtonPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Delete",
						icon: "sap-icon://delete",
						enabled: "{viewModel>/DeleteButtonEnabled}",
						tooltip: "{i18n>txtPolEnforcementDelBtnTooltip}",
						press: this._onDeletePolicyEnforcementButtonPress.bind(this)
					}));

				}
			},


			/**
			 * Displays an error message to the user by parsing OData error responses.
			 * Extracts error messages from various possible locations in the error object and displays them in a MessageBox.
			 * Handles both JSON-formatted error responses and XML-formatted responses as fallback.
			 *
			 * @function displayErrorMessage
			 * @param {object} oError - The error object returned from OData operations.
			 * @param {string} [oError.responseText] - The response text containing error details in JSON or XML format.
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * Error extraction priority:
			 * 1. Attempts to parse `oError.responseText` as JSON
			 * 2. Looks for error message in `errorBody.error.message.value`
			 * 3. Falls back to `errorBody.error.errordetails[0].message`
			 * 4. If JSON parsing fails, extracts message from XML using jQuery selector
			 * 5. Defaults to "An unknown error occurred." if no error details found
			 * - Logs parsing errors using sap.base.Log
			 * - Displays the final error message using sap.m.MessageBox with custom style class "PlDacMessageBox"
			 */
			displayErrorMessage: function (oError) {
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
			 * Event handler triggered when policy tokens are updated (added or removed).
			 * 
			 * @public
			 * @param {*} oEvent - The token update event object
			 * @param {} oEvent.getParameter("type") - The type of token update ("removed", "removedAll", "added", etc.)
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 * 
			 * @description
			 * This method handles token updates for the policy input field by:
			 * - Checking if the update type is "removedAll" or "removed"
			 * - When tokens are removed:
			 *   - Setting the policy error state to "Error"
			 *   - Displaying a mandatory field error message
			 *   - Setting focus back to the policy name input field
			 * 
			 * This ensures that the policy field remains mandatory and provides immediate
			 * feedback when the user removes the selected policy.
			 * 
			 * @example
			 * /// Automatically called when tokens are added/removed from the MultiInput
			 * /// <MultiInput tokenUpdate=".onPEPPolicyTokenUpdated">
			 */
			onPEPPolicyTokenUpdated: function (oEvent) {

				if (oEvent.getParameter("type") == "removedAll" || oEvent.getParameter("type") == "removed") {
					var oBundle, oView = this.getView(), oViewModel = oView.getModel("viewModel");
					oBundle = oView.getModel("i18n").getResourceBundle();
					oViewModel.setProperty("/ErrorState", "Error");
					oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorPolicyNameMandatory"));
					oView.byId("idPEPPolicyName").focus();
				}

			},
			/**
			 * Event handler triggered when a suggestion item is selected from the policy name input field.
			 * 
			 * @public
			 * @param {*} oEvent - The suggestion item selection event object
			 * @param {} oEvent.getParameter("selectedRow") - The selected row from the suggestion list
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 * 
			 * @description
			 * This method handles the selection of a policy from the suggestion list by:
			 * - Retrieving the selected policy context object from the binding context
			 * - Extracting the PolicyDesc and Policy properties from the context
			 * - Updating the view model with the selected policy description and identifier
			 * - Calling _validatePolicyInput to validate and process the selected policy
			 * 
			 * This provides a convenient way for users to select policies from the auto-suggestion
			 * dropdown without having to open the full value help dialog.
			 * 
			 * @example
			 * /// Automatically called when user selects a policy from suggestion list
			 * /// <MultiInput showSuggestion="true" suggestionItemSelected=".onSuggestionItemSelected">
			 */
			onSuggestionItemSelected: function (oEvent) {
				var oView = this.getView(), oContext, oDataModel = oView.getModel(),
					oCtx = oEvent.getParameter("selectedRow").getBindingContext().getObject();
				oContext = this._oPolicyInforcementDialog.getBindingContext();
				oDataModel.setProperty(oContext.getPath() + "/Policy", oCtx.Policy);
				oView.getModel("viewModel").setProperty("/ErrorState", "None");
				oView.getModel("viewModel").setProperty("/ErrorMessage", "");
				this._validatePolicyInput(oCtx.Policy);
			},
			/**
			 * Event handler for the policy name input change event.
			 * Validates and formats the policy name input as the user types.
			 * Converts input to uppercase and triggers validation when the input length exceeds 6 characters.
			 *
			 * @function onPolicyNameInputChange
			 * @param {*} oEvent - The input change event object.
			 * @param {string} oEvent.getParameter("newValue") - The new value entered by the user.
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * - Retrieves the new input value from the event
			 * - Clears any existing error states on the input control and view model
			 * - Converts the input value to uppercase
			 * - Clears the value state text
			 * - If the input length exceeds 6 characters:
			 *   - Calls `_validatePolicyInput()` to check if the policy exists in the backend
			 * - Updates view model properties:
			 *   - `/ErrorState` → "None"
			 *   - `/ErrorMessage` → ""
			 */
			onPolicyNameInputChange: function (oEvent) {
				var oView = this.getView(), oBundle, sNewValue = oEvent.getParameter("newValue"), oViewModel = oView.getModel("viewModel"),
					oInput = oEvent.getSource();
				oBundle = oView.getModel("i18n").getResourceBundle();
				oViewModel.setProperty("/ErrorState", "None");
				oViewModel.setProperty("/ErrorMessage", "");
				oInput.setValue(oInput.getValue().toUpperCase());
				this.oPolicyNameInput = oInput;
				if (sNewValue.length > 6) {
					this._validatePolicyInput(sNewValue.toUpperCase());
				} else {
					oViewModel.setProperty("/Data/Policy", "");
					oViewModel.setProperty("/ErrorState", "Error");
					if (sNewValue.length == 0) {
						oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorPolicyNameMandatory"));
					} else {
						oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorPolicyNameInvalid"));
					}
				}
			}
		});
	}
);
