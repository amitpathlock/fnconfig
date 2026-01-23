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
		"sap/base/Log",
		"sap/m/Token"
	],
	function (BaseController, MessageBox, Fragment, UIColumn, Column, Text, Label,
		ColumnListItem, OverflowToolbarButton, ToolbarSpacer, Sorter, Log, Token) {
		"use strict";
		return BaseController.extend("pl.dac.apps.fnconfig.controller.BaseController", {
			oPolicyEnforcementTable: null,
			oAttributeTable: null,
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

			/**
			 * Event handler for the delete attribute button press event.
			 * Displays a confirmation dialog to the user before deleting the selected record.
			 * If the user confirms the action (clicks OK), the `removeSelectedRecord` method is invoked.
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
							that.removeSelectedRecord();
						}
					}
				});
			},

			/**
			 * Removes the selected record from the table.
			 * This method is called after the user confirms the deletion action in the confirmation dialog.
			 * The implementation should handle the deletion of the selected item from the data model and refresh the table binding.
			 * 
			 * @function removeSelectedRecord
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			removeSelectedRecord: function () { },

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
				var iCustomData, oView = this.getView(), oModel = oView.getModel("viewModel"), oItem = oEvent.getParameter("listItem"),
					oSelectData = oItem.getBindingContext().getObject();
				oModel.setProperty("/EditButtonEnabled", true);
				oModel.setProperty("/DeleteButtonEnabled", true);

				if (oItem.getCustomData() && oItem.getCustomData()[0]) {
					for (iCustomData = 0; iCustomData < oItem.getCustomData().length; iCustomData++) {
						oSelectData[oItem.getCustomData()[iCustomData].getKey()] = oItem.getCustomData()[iCustomData].getValue();
					}

				}
				if (({}).hasOwnProperty.call(oSelectData, "IsActive")) {
					oSelectData.IsActive = oSelectData.IsActive == "X" ? true : false;
				}
				oModel.setProperty("/SelectedContextData", oSelectData);

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
			_onAddAttributeButtonPress: function () {
				var oView = this.getView();
				oView.getModel("viewModel").setProperty("/Data", { AttributeId: "", Description: "" });
				oView.getModel("viewModel").setProperty("/AttrNameEnabled", true);
				oView.getModel("viewModel").setProperty("/ErrorState", "None");
				oView.getModel("viewModel").setProperty("/ErrorMessage", "");

				if (!this.oAttributeDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogAttribute", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this.oAttributeDialog = oDialog;
						this.oAttributeDialog.attachAfterOpen(this._onDailogOnAfterShow, this);
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						oDialog.open();

					}.bind(this));
				} else {

					this.oAttributeDialog.open();

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
				if (this.oAttributeDialog) {
					this.oAttributeDialog.close();
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
				var oView = this.getView(), oViewModel = oView.getModel("viewModel"),
					oSelectedContextData = oViewModel.getProperty("/SelectedContextData");
				oView.getModel("viewModel").setProperty("/Data", oSelectedContextData);

				if (!this.oAttributeDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogAttribute", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this.oAttributeDialog = oDialog;
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						this.oAttributeDialog.attachAfterOpen(this._onDailogOnAfterShow, this);
						oDialog.open();

					}.bind(this));
				} else {

					this.oAttributeDialog.open();

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
			addAdditionalButtonIntoTheAttributeTableToolbar: function (oSmartTable) {
				var oToolbar = oSmartTable.getToolbar();
				if (oToolbar.getContent().length == 0) {
					oToolbar.addContent(new ToolbarSpacer());
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Add",
						icon: "sap-icon://add",
						tooltip: "{i18n>txtBtnAddDataAttribute}",
						press: this._onAddAttributeButtonPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Edit",
						icon: "sap-icon://edit",
						enabled: "{viewModel>/EditButtonEnabled}",
						tooltip: "{i18n>txtBtnEditDataAttribute}",
						press: this._onEditAttributeButtonPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Delete",
						icon: "sap-icon://delete",
						enabled: "{viewModel>/DeleteButtonEnabled}",
						tooltip: "{i18n>txtBtnDelDataAttribute}",
						press: this._onDeleteAttributeButtonPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Sort",
						icon: "sap-icon://sort",
						tooltip: "Sort",
						press: this._onAttributeTableSortButtonPress.bind(this)
					}));
				}
			},
			/**
			 * Event handler for the Attributes sort button press event.
			 * Toggles the sort order of the table between ascending and descending based on the Policy field.
			 * Updates the view model with the current sort order state.
			 *
			 * @function _onAttributeTableSortButtonPress
			 * @param {sap.ui.base.Event} oEvent - The button press event object.
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * - Retrieves the table reference from the event source's parent hierarchy
			 * - Checks current sort order from view model (`/SortOrder`)
			 * - If current order is "asc":
			 *   - Sets sort order to "desc" in view model
			 *   - Sorts table by "Policy" field in descending order (false)
			 * - If current order is "desc" or not set:
			 *   - Sets sort order to "asc" in view model
			 *   - Sorts table by "Policy" field in ascending order (true)
			 * - Uses sap.ui.model.Sorter to apply sorting to the table items binding
			 */
			_onAttributeTableSortButtonPress: function (oEvent) {
				var oView = this.getView(), oViewModel = oView.getModel("viewModel"),
					oTable = oEvent.getSource().getParent().getParent();
				if (oViewModel.getProperty("/SortOrder") == "asc") {
					oViewModel.setProperty("/SortOrder", "desc");
					oTable.getBinding("items").sort([new Sorter("AttributeId", false)]);
				} else {
					oViewModel.setProperty("/SortOrder", "asc");
					oTable.getBinding("items").sort([new Sorter("AttributeId", true)]);
				}
			},


			/** ###### POLICY INFORCEMENT POINT */

			/**
			 * Event handler for the delete attribute button press event.
			 * Displays a confirmation dialog to the user before deleting the selected record.
			 * If the user confirms the action (clicks OK), the `removeSelectedRecord` method is invoked.
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
							that.removeSelectedRecord();
						}
					}
				});
			},

			/**
			 * Loads the currently selected policy enforcement table item into the view model.
			 * Copies custom data into the selected context object, normalizes `IsActive` from "X" to boolean,
			 * and stores the result in `/SelectedContextData` of the `viewModel`.
			 *
			 * @function _loadSelectedTableItemData
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_loadSelectedTableItemData: function () {
				var iCustomData, oItem, oSelectData, oModel = this.getView().getModel("viewModel");
				if (this.oPolicyEnforcementTable && this.oPolicyEnforcementTable.getSelectedItem()) {
					oItem = this.oPolicyEnforcementTable.getSelectedItem();
					oSelectData = oItem.getBindingContext().getObject();
					if (oItem.getCustomData() && oItem.getCustomData()[0]) {
						for (iCustomData = 0; iCustomData < oItem.getCustomData().length; iCustomData++) {
							oSelectData[oItem.getCustomData()[iCustomData].getKey()] = oItem.getCustomData()[iCustomData].getValue();
						}

					}
					if (({}).hasOwnProperty.call(oSelectData, "IsActive")) {
						oSelectData.IsActive = oSelectData.IsActive == "X" ? true : false;
					}

					oModel.setProperty("/SelectedContextData", oSelectData);

				}

			},
			/**
			 * Event handler for the edit policy enforcement button press event.
			 * Retrieves the selected policy enforcement record and populates the dialog with its data.
			 * Converts the IsActive property from a string ("X") to a boolean value for proper binding.
			 * Disables the policy name input field since editing an existing policy name is not allowed.
			 * Loads and displays the policy enforcement dialog fragment if not already instantiated.
			 *
			 * @function _onEditPolicyEnforcementBtnPress
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_onEditPolicyEnforcementButtonPress: function () {
				var oView = this.getView(), oSelectedContextData, oViewModel = oView.getModel("viewModel");

				this._loadSelectedTableItemData();
				oSelectedContextData = oView.getModel("viewModel").getProperty("/SelectedContextData");
				oViewModel.setProperty("/Data", oSelectedContextData);
				oViewModel.setProperty("/ErrorMessage", "");
				oViewModel.setProperty("/ErrorState", "None");
				oViewModel.setProperty("/PolicyNameEnabled", false);
				if (oViewModel.getProperty("/VisibleAttribute")) {
					oViewModel.setProperty("/AttributeNameEnabled", false);
				}
				this.clearValidationError();
				if (!this.oPolicyInforcementDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this.oPolicyInforcementDialog = oDialog;
						//	this.oPolicyInforcementDialog.attachAfterOpen(this._onPolicyEnforcementDialogOnAfterShow, this);
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						oDialog.open();
					}.bind(this));
				} else {
					this.oPolicyInforcementDialog.open();
				}
				oView.getModel("viewModel").setProperty("/PolicyNameEnabled", false);

			},

			/**
			 * Event handler for the add policy enforcement button press event.
			 * Initializes the dialog for creating a new policy enforcement record with empty values.
			 * Sets up the view model with default data and enables the policy name input field.
			 * Clears any previous error states in the view model.
			 * Loads and displays the policy enforcement dialog fragment if not already instantiated.
			 *
			 * @function _onAddPolicyEnforcementBtnPress
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_onAddPolicyEnforcementBtnPress: function () {
				var oView = this.getView(), oViewModel = oView.getModel("viewModel");
				oViewModel.setProperty("/Data", { Policy: "", PolicyResult: "", IsActive: false });
				oViewModel.setProperty("/PolicyNameEnabled", true);
				oViewModel.setProperty("/ErrorState", "None");
				oViewModel.setProperty("/ErrorMessage", "");
				oViewModel.setProperty("/AttrErrorState", "None");
				oViewModel.setProperty("/AttrErrorMessage", "");
				oViewModel.setProperty("/PolicyNameEnabled", true);
				if (oViewModel.getProperty("/VisibleAttribute")) {
					oViewModel.setProperty("/AttributeNameEnabled", true);
				}
				this.clearValidationError();
				if (!this.oPolicyInforcementDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this.oPolicyInforcementDialog = oDialog;
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						this.oPolicyNameInput = oView.byId("idPEPPolicyName");
						oDialog.open();

					}.bind(this));
				} else {
					this.oPolicyNameInput = oView.byId("idPEPPolicyName");
					this.oPolicyInforcementDialog.open();
				}
			},
			clearValidationError: function () { },
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
				var oDailog = oEvent.getSource(), oView = this.getView(),oViewModel =oView.getModel("viewModel"), oData = oViewModel.getProperty("/Data"),
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
					aFormElements[0].getAggregation("fields")[0].setTokens([new Token({ key: oData.Policy.split("~")[0], text: oData.PolicyName + " (" + oData.PolicyDesc + ")" })])
					if (({}).hasOwnProperty.call(oData, "AttributeId")) {
						this._validateAttibuteInput(oData.AttributeId);
					}
				}
			},
			onSavePolicyInforcement: function () {

			},

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
				if (this.oPolicyInforcementDialog) {
					//if (this.oPolicyEnforcementTable.getSelectedItem()) {
					//	oView.getModel("viewModel").setProperty("/SelectedContextData", this.oPolicyEnforcementTable.getSelectedItem().getBindingContext().getObject());
					//}
					oView.byId("idPEPPolicyName").setValue("");
					this.oPolicyInforcementDialog.close();
					this.oPolicyEnforcementTable.removeSelections(true);
					if (this.oPolicyNameInput) {
						this.oPolicyNameInput.removeAllTokens();
					}
				}
				this.clearValidationError();
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
				var oValue, aTokens = oEvent.getParameter("tokens"), oView = this.getView();
				oValue = aTokens[0].getCustomData()[0].getValue();
				oView.getModel("viewModel").setProperty("/Data/PolicyDesc", oValue.PolicyDesc);

				oView.getModel("viewModel").refresh();
				this._oVHDialog.close();
				this.validatePolicyInput(aTokens[0].getKey());
			},
			/**
			 * Validates a policy identifier by checking if it exists in the OData service.
			 * Reads the policy data from the backend and updates the UI accordingly.
			 * On success, clears error states and populates the policy description field.
			 * On error, sets error state and displays the error message.
			 *
			 * @function validatePolicyInput
			 * @param {string} sPolicy - The policy identifier to validate against the PolicySet entity.
			 * @public
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
			validatePolicyInput: function (sPolicy) {
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
			 *   5. Sort Button - triggers sort functionality
			 * - All buttons are configured with appropriate icons, text, tooltips, and press event handlers
			 * - Edit and Delete buttons are bound to the view model's button enable state
			 */
			addAdditionalButtonIntoThePolicyEnforcementTableToolbar: function (oSmartTable) {
				var oToolbar = oSmartTable.getToolbar();
				if (oToolbar.getContent().length == 0) {
					oToolbar.addContent(new ToolbarSpacer());
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Add",
						icon: "sap-icon://add",
						tooltip: "{i18n>txtPolEnforcementAddBtnTooltip}",
						press: this._onAddPolicyEnforcementBtnPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Edit",
						icon: "sap-icon://edit",
						enabled: "{viewModel>/EditButtonEnabled}",
						tooltip: "{i18n>txtPolEnforcementEditBtnTooltip}",
						press: this._onEditPolicyEnforcementButtonPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Delete",
						icon: "sap-icon://delete",
						enabled: "{viewModel>/DeleteButtonEnabled}",
						tooltip: "{i18n>txtPolEnforcementDelBtnTooltip}",
						press: this._onDeletePolicyEnforcementButtonPress.bind(this)
					}));
					oToolbar.addContent(new OverflowToolbarButton({
						text: "Sort",
						icon: "sap-icon://sort",
						tooltip: "Sort",
						press: this._onPolicyEnforcementSortButtonPress.bind(this)
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
			 * Event handler for the Policy Enforcement sort button press event.
			 * Toggles the sort order of the table between ascending and descending based on the Policy field.
			 * Updates the view model with the current sort order state.
			 *
			 * @function _onPolicyEnforcementSortButtonPress
			 * @param {sap.ui.base.Event} oEvent - The button press event object.
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 *
			 * @description
			 * - Retrieves the table reference from the event source's parent hierarchy
			 * - Checks current sort order from view model (`/SortOrder`)
			 * - If current order is "asc":
			 *   - Sets sort order to "desc" in view model
			 *   - Sorts table by "Policy" field in descending order (false)
			 * - If current order is "desc" or not set:
			 *   - Sets sort order to "asc" in view model
			 *   - Sorts table by "Policy" field in ascending order (true)
			 * - Uses sap.ui.model.Sorter to apply sorting to the table items binding
			 */
			_onPolicyEnforcementSortButtonPress: function (oEvent) {
				var oView = this.getView(), oViewModel = oView.getModel("viewModel"),
					oTable = oEvent.getSource().getParent().getParent();
				if (oViewModel.getProperty("/SortOrder") == "asc") {
					oViewModel.setProperty("/SortOrder", "desc");
					oTable.getBinding("items").sort([new Sorter("Policy", false)]);
				} else {
					oViewModel.setProperty("/SortOrder", "asc");
					oTable.getBinding("items").sort([new Sorter("Policy", true)]);
				}
			},
			onPEPPolicyTokenUpdated: function (oEvent) {

				if (oEvent.getParameter("type") == "removedAll") {
					var oBundle, oView = this.getView(), oViewModel = oView.getModel("viewModel");
					oBundle = oView.getModel("i18n").getResourceBundle();
					oViewModel.setProperty("/ErrorState", "Error");
					oViewModel.setProperty("/ErrorMessage", oBundle.getText("msgErrorPolicyNameMandatory"));
					oView.byId("idPEPPolicyName").focus();
				}

			},
			onSuggestionItemSelected: function (oEvent) {
				var oView = this.getView(),
					oCtx = oEvent.getParameter("selectedRow").getBindingContext().getObject();
				//	this.oPolicyNameInput = oView.byId("idPEPPolicyName");
				oView.getModel("viewModel").setProperty("/Data/PolicyDesc", oCtx.PolicyDesc);
				oView.getModel("viewModel").setProperty("/Data/Policy", oCtx.Policy);
				this.validatePolicyInput(oCtx.Policy);
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
			 *   - Calls `validatePolicyInput()` to check if the policy exists in the backend
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
					this.validatePolicyInput(sNewValue.toUpperCase());
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
