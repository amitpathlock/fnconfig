sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/m/MessageBox",
		"sap/ui/core/Fragment",
		"sap/ui/table/Column",
		"sap/m/Column",
		"sap/m/Text",
		"sap/m/Label",
		"sap/m/ColumnListItem"
	],
	function (BaseController, MessageBox, Fragment, UIColumn, Column, Text, Label, ColumnListItem) {
		"use strict";
		/**
	 * Called when a view is instantiated and its controls (if available) have been created.
	 * Can be used to modify the view before it is displayed, to bind event handlers, and to do other one-time initialization.
	 * Store the instance of the Router class in the variable referenced by the controller.
	 * Call the Router attachParternPathed event
	 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
	 */
		return BaseController.extend("pl.dac.apps.fnconfig.controller.BaseController", {
			oPolicyEnforcementTable: null,
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
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onDeleteAttributeButtonPress: function () {
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
			removeSelectedRecord: function () { },// eslint-disable-line

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
				var oView = this.getView(), oModel = oView.getModel("viewModel"), oItem = oEvent.getParameter("listItem"),
					oSelectData = oItem.getBindingContext().getObject();
				oModel.setProperty("/EditButtonEnabled", true);
				oModel.setProperty("/DeleteButtonEnabled", true);
				if (oItem.getCustomData() && oItem.getCustomData()[0]) {
					oSelectData[oItem.getCustomData()[0].getKey()] = oItem.getCustomData()[0].getValue();
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
				var sNewValue = oEvent.getParameter("newValue"), sAttributeType;
				this.oInputAttributeName = oEvent.getSource();
				sAttributeType = this.oInputAttributeName.getCustomData()[0].getValue();
				this.oInputAttributeName.setValueState("None");
				this.getView().getModel("viewModel").setProperty("/ErrorState", "None");
				this.getView().getModel("viewModel").setProperty("/ErrorMessage", "");
				this.oInputAttributeName.setValue(this.oInputAttributeName.getValue().toUpperCase());
				this.oInputAttributeName.setValueStateText("");
				if (sNewValue.length < 6) { // Example validation rule
					this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
					this.getView().getModel("viewModel").setProperty("/ErrorMessage", "Invalid input");
				} else {
					if (sNewValue.split(".")[0] != sAttributeType) {
						this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
						this.getView().getModel("viewModel").setProperty("/ErrorMessage", "An attribute name should begin with \"" + sAttributeType + "\" followed by the specific attribute name.");
					}
				}
			},
			/**
			 * Event handler for the add attribute button press event.
			 * Initializes the dialog for creating a new attribute with empty values.
			 * Sets up the view model with default data and enables the attribute name input field.
			 * Loads and displays the attribute dialog fragment if not already instantiated.
			 *
			 * @function onAddAttributeButtonPress
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onAddAttributeButtonPress: function () {
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
			 * @function onEditAttributeButtonPress
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onEditAttributeButtonPress: function () {
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

			/** ###### POLICY INFORCEMENT POINT */

				/**
			 * Event handler for the delete attribute button press event.
			 * Displays a confirmation dialog to the user before deleting the selected record.
			 * If the user confirms the action (clicks OK), the `removeSelectedRecord` method is invoked.
			 * 
			 * @function onDeletePolicyEnforcementButtonPress
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onDeletePolicyEnforcementButtonPress:function(){
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
			_loadSelectedTableItemData:function(){
				var oItem,oSelectData,oModel = this.getView().getModel("viewModel");
				if(this.oPolicyEnforcementTable && this.oPolicyEnforcementTable.getSelectedItem()){
					oItem = this.oPolicyEnforcementTable.getSelectedItem();
					oSelectData = oItem.getBindingContext().getObject();
					if (oItem.getCustomData() && oItem.getCustomData()[0]) {
						oSelectData[oItem.getCustomData()[0].getKey()] = oItem.getCustomData()[0].getValue();
					}
					oSelectData.IsActive = oSelectData.IsActive == "X" ? true : false;
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
			 * @function onEditPolicyEnforcementBtnPress
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onEditPolicyEnforcementButtonPress: function () {
				var oView = this.getView(),oSelectedContextData;
				
				this._loadSelectedTableItemData();
				oSelectedContextData = oView.getModel("viewModel").getProperty("/SelectedContextData");
				oView.getModel("viewModel").setProperty("/Data", oSelectedContextData);
				if (!this.oPolicyInforcementDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this.oPolicyInforcementDialog = oDialog;
						this.oPolicyInforcementDialog.attachAfterOpen(this._onPolicyEnforcementDialogOnAfterShow, this);
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
			 * @function onAddPolicyEnforcementBtnPress
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onAddPolicyEnforcementBtnPress: function () {
				var oView = this.getView();
				oView.getModel("viewModel").setProperty("/Data", { Policy: "", PolicyResult: "", IsActive: false });
				oView.getModel("viewModel").setProperty("/PolicyNameEnabled", true);
				oView.getModel("viewModel").setProperty("/ErrorState", "None");
				oView.getModel("viewModel").setProperty("/ErrorMessage", "");
				if (!this.oPolicyInforcementDialog) {
					Fragment.load({
						id: oView.getId(),
						name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
						controller: this // Assign the current controller
					}).then(function (oDialog) {
						this.oPolicyInforcementDialog = oDialog;
						this.oPolicyInforcementDialog.attachAfterOpen(this._onPolicyEnforcementDialogOnAfterShow, this);
						oView.addDependent(oDialog); // Add dialog as dependent of the view
						oDialog.open();

					}.bind(this));
				} else {
					this.oPolicyInforcementDialog.open();
				}
			},

			/**
			 * Private event handler called when the policy enforcement dialog is opened.
			 * Sets focus to the first enabled form field, or to the third field if the first is disabled.
			 * Retrieves the form elements from the dialog and manages focus management for better UX.
			 *
			 * @function _onPolicyEnforcementDialogOnAfterShow
			 * @param {sap.ui.base.Event} oEvent - The afterOpen event object from the dialog.
			 * @private
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			_onPolicyEnforcementDialogOnAfterShow: function (oEvent) {
				var oDailog = oEvent.getSource(),
					oForm = oDailog.getContent()[0].getAggregation("form"),
					aFormElements = oForm.getAggregation("formContainers")[0].getAggregation("formElements");
				if (aFormElements[0].getAggregation("fields")[0].getEnabled()) {
					aFormElements[0].getAggregation("fields")[0].focus();
				} else {
					aFormElements[2].getAggregation("fields")[0].focus();
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
					if (this.oPolicyEnforcementTable.getSelectedItem()) {
						oView.getModel("viewModel").setProperty("/SelectedContextData", this.oPolicyEnforcementTable.getSelectedItem().getBindingContext().getObject());
					}
					this.oPolicyInforcementDialog.close();
				}
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
			 * - Retrieves the policy name input control reference and stores it in `this._oPolicyNameInputInput`
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
				this._oPolicyNameInputInput = oView.byId("idPolicyName");
				if (!this._oVHDialog) {
					this._oVHDialog = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.ValueHelp", this);
					oView.addDependent(this._oVHDialog);
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
							oColPolicyName = new UIColumn({ label: new Label({ text: "Policy Name" }), template: new Text({ wrapping: false, text: "{Policy}" }) });
							oColPolicyName.data({
								fieldName: "{Policy}"
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
									cells: [new Label({ text: "{Policy}" }), new Label({ text: "{PolicyDesc}" })]
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
				this._oPolicyNameInputInput.setValue(aTokens[0].getKey());
				this._oVHDialog.close();
				
				this._validatePolicyInput(aTokens[0].getKey());
			},
			validatePolicyInput:function(sKey){},// eslint-disable-line
			/**
			 * Event handler for the Value Help Dialog cancel action.
			 * Closes the Value Help Dialog without applying any selection.
			 *
			 * @function onValueHelpCancelPress
			 * @public
			 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
			 * @returns {void}
			 */
			onValueHelpCancelPress: function () {
				this._oVHDialog.close();
			}
		});
	}
);
