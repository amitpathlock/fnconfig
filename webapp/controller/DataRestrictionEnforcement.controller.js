
sap.ui.define([
	"sap/ui/core/mvc/Controller",
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
	Controller, PlDacConst, Fragment, JSONModel, MessageBox, UIColumn, Column, Text, Label,
	ColumnListItem, Sorter, Log
) {
	"use strict";

	return Controller.extend("pl.dac.apps.fnconfig.controller.DataRestrictionEnforcement", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("DataRestriction").attachPatternMatched(this._onRouteMatched, this);
		},
		onEditBtnPress: function () {
			var oView = this.getView();
			var oSelectedContextData = this.getView().byId("idTableDataRestrictionEnforcement").getSelectedItem().getBindingContext().getObject();
			oSelectedContextData.IsActive = oSelectedContextData.IsActive == "" ? false : true;
			oView.getModel("viewModel").setProperty("/Data", oSelectedContextData);
			if (!this._oPolEnforcementRestrictionDailog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this._oPolEnforcementRestrictionDailog = oDialog;
					oView.addDependent(this._oPolEnforcementRestrictionDailog); // Add dialog as dependent of the view
					this._oPolEnforcementRestrictionDailog.open();
					this._validatePolicyInput(oSelectedContextData.Policy);
				}.bind(this));
			} else {
				this._oPolEnforcementRestrictionDailog.open();
				this._validatePolicyInput(oSelectedContextData.Policy);
			}
			oView.getModel("viewModel").setProperty("/PolicyNameEnabled", false);
		},
		onAddBtnPress: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/Data", { Policy: "", PolicyResult: "", IsActive: false });
			oView.getModel("viewModel").setProperty("/PolicyNameEnabled", true);
			if (!this._oPolEnforcementRestrictionDailog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this._oPolEnforcementRestrictionDailog = oDialog;
					oView.addDependent(oDialog); // Add dialog as dependent of the view
					oDialog.open();
				}.bind(this));
			} else {
				this._oPolEnforcementRestrictionDailog.open();

			}
		},
		onCloseDialog: function () {
			if (this._oPolEnforcementRestrictionDailog) {
				this._oPolEnforcementRestrictionDailog.close();
			}
		},
		_onRouteMatched: function () {

			// this.getView().byId("idSmartTablePOPRestriction").setEnableCopy(false);
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
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
					SortOrder: "asc"
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
		},
		/* ### A Method has been defined to handle table row selection change event.
		* @param {sap.ui.base.Event} oEvent
		 */
		onTableSelectionChange: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/EditButtonEnabled", true);
			oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", true);

		},
		// #region Value Help Dialog standard use case with filter bar without filter suggestions
		onValueHelpRequested: function () {
			var oColPolicyName, oColPolicyDesc, that = this, oView = this.getView();
			this._oPolicyDescription = oView.byId("idPolicyDescription");
			this._oPolicyNameInput = oView.byId("idPolicyName");
			if (!this.oVHDialog) {
				this.oVHDialog = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.ValueHelp", this);
				oView.addDependent(this.oVHDialog);
				this.oVHDialog.setRangeKeyFields([{
					label: "PolicyDesc",
					key: "Polciy",
					type: "string"
				}]);
				this.oVHDialog.getTableAsync().then(function (oTable) {
					oTable.setModel(that.getView().getModel());
					oTable.setSelectionMode("Single");
					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/PolicySet",
							events: {
								dataReceived: function () {
									that.oVHDialog.update();
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
									that.oVHDialog.update();
								}
							}
						});
						oTable.addColumn(new Column({ header: new Label({ text: "Policy" }) }));
						oTable.addColumn(new Column({ header: new Label({ text: "Description" }) }));
					}
					that.oVHDialog.update();
				});
				this.oVHDialog.open();
			} else {
				this.oVHDialog.open();
			}
		},
		/* ### A Method has been defined to handle ValueHelp ok button press.
		* @param {sap.ui.base.Event} oEvent
		 */
		onValueHelpOkPress: function (oEvent) {
			var oValue, aTokens = oEvent.getParameter("tokens"), oView = this.getView();
			oValue = aTokens[0].getCustomData()[0].getValue();
			oView.getModel("viewModel").setProperty("/Data/PolicyDesc", oValue.PolicyDesc);
			oView.getModel("viewModel").refresh();
			this._oPolicyNameInput.setValue(aTokens[0].getKey());
			this.oVHDialog.close();
			this._validatePolicyInput(aTokens[0].getKey());
		},
		/* ### A Method has been defined to handle ValueHelp cancel buttton press event.
		*/
		onValueHelpCancelPress: function () {
			this.oVHDialog.close();
		},

		/* ### A Method has been defined to implement save/update operation.
		*/
		onSave: function () {
			var sPath;
			var oEntry = this.getView().getModel("viewModel").getData().Data;
			if (oEntry.Policy.trim() == "") {
				this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
				this.getView().getModel("viewModel").setProperty("/ErrorMessage", "The mandatory field cannot be left blank.");
				return;
			}
			delete oEntry.PolicyDesc;

			delete oEntry.to_Policy;

			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {
				delete oEntry.__metadata;
				sPath = PlDacConst.ENTITY_SET_DATARESTRICTIONENFORCEMENT + "('" + oEntry.Policy + "')";
				this.getView().getModel().update(sPath, oEntry, {
					success: function () {
						MessageBox.success("Entry has been updated");
						this.getView().getModel().refresh();
						this._oPolEnforcementRestrictionDailog.close();
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
		/** Private Method
		 *  A Method  has been defined to create new entry
		 * @param {} oEntry
		 */
		_createEntry: function (oEntry) {
			var that = this, oBundle, oView = this.getView(), oModel = oView.getModel();
			oEntry.IsActive = oEntry.IsActive == true ? 'X' : '';
			oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.create(PlDacConst.ENTITY_SET_DATARESTRICTIONENFORCEMENT, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgPolEnforcementSuccessful", [oEntry.Policy]), { styleClass: "PlDacMessageBox" });
					oView.getModel().refresh();
					this._oPolEnforcementRestrictionDailog.close();
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgErrorInCreate") + oError);
					that._oPolEnforcementRestrictionDailog.close();
					that._displayErrorMessage(oError);
				}
			});
		},
		/** ### Private Method
		 *  A Method has been defined to check for Duplicate entry
		 * @param {string} sPath
		 * @param {} oEntry
		 */
		_checkForDuplicateEntry: function (sPath, oEntry) {
			var oView = this.getView(), oModel = oView.getModel(), that = this,
				oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.read(sPath, // Path to the specific entity
				{
					success: function () {
						that.__oInput.focus();
						oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorDuplicateEntry", [oEntry.Policy]));
						oView.getModel("viewModel").setProperty("/ErrorState", "Error");
						return;
					},
					error: function () {
						that._createEntry(oEntry);
					}
				}
			);
		},


		/** ### Event handler of "sap.m.OverflowToolButton~press"
		 *  ### A Method has been defined to implement delete operation to table record.
		 */
		onDeleteBtnPress: function () {
			var that = this, oBundle = this.getView().getModel("i18n").getResourceBundle();
			MessageBox.warning(oBundle.getText("msgDeleteConfirmation"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				styleClass: "PlDacMessageBox",
				onClose: function (sAction) {
					if (sAction == "OK") {
						that._removeSelectedRecord(oBundle);
					}
				}
			});
		},
		/** ### Event handler of "sap.m.OverflowToolButton~press"
		 *  ### A Private method has been defined to implement delete selected record
		 * @param {sap.base.i18n.ResourceBundle} oBundle
		 */
		_removeSelectedRecord: function (oBundle) {
			var oView = this.getView(), oModel = oView.getModel(), sPolicyName, sPath, that = this;
			sPolicyName = oView.byId("idTableDataRestrictionEnforcement").getSelectedItem().getBindingContext().getObject().Policy;
			sPath = PlDacConst.ENTITY_SET_DATARESTRICTIONENFORCEMENT + "('" + sPolicyName + "')";
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgPolEnforcementDeleteSucceful", [sPolicyName]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
				},
				error: function (oError) {
					Log.error(oBundle.getText("msgDAErrorInDelete") + oError);
					that._displayErrorMessage(oError);
				}
			});
		},
		/* ### A Method has been defined to implement input live change.
		* @param {sap.ui.base.Event} oEvent
		 */
		onInputChange: function (oEvent) {
			var sNewValue = oEvent.getParameter("newValue");
			this.__oInput = oEvent.getSource();
			this.__oInput.setValueState("None");
			this.getView().getModel("viewModel").setProperty("/ErrorState", "None");
			this.getView().getModel("viewModel").setProperty("/ErrorMessage", "");
			this.__oInput.setValue(this.__oInput.getValue().toUpperCase());
			this.__oInput.setValueStateText("");
			if (sNewValue.length > 6) {
				this._validatePolicyInput(sNewValue);
			}
		},
		onSuggestionItemSelected: function (oEvent) {
			var oView = this.getView(),
				oCtx = oEvent.getParameter("selectedRow").getBindingContext().getObject();
			oView.getModel("viewModel").setProperty("/Data/PolicyDesc", oCtx.PolicyDesc);
			this._validatePolicyInput(oCtx.Policy);
		},
		/* ### A Method has been defined to add expand parameter in mBindingParams .
		* @param {sap.ui.base.Event} oEvent
		 */
		onBeforeRebindTable: function (oEvent) {
			var mBindingParams = oEvent.getParameter("bindingParams");
			mBindingParams.parameters["expand"] = "to_Policy";
		},
		_validatePolicyInput: function (sValue) {
			var oView = this.getView(), oModel = oView.getModel(), that = this,
				sPath = "/PolicySet('" + sValue + "')",
				bInputEditable = oView.getModel("viewModel").getProperty("/PolicyNameEnabled");
			// Example validation rule
			oModel.read(sPath, {
				// Success callback function
				success: function (oData) {
					// oData contains the retrieved data
					if(bInputEditable){
						that.__oInput.focus();
					}
					oView.byId("idPolicyDescription").setValue(oData.PolicyDesc);
					// If reading an entity set, oData.results will contain an array of entities
					if (oData.PolicyDesc) {
						oView.getModel("viewModel").setProperty("/ErrorState", "None");
						oView.getModel("viewModel").setProperty("/ErrorMessage", "");
					}
				},
				// Error callback function
				error: function (oError) {
					// oError contains details about the error
					oView.byId("idPolicyDescription").setValue("");
					oView.getModel("viewModel").setProperty("/ErrorState", "Error");
					oView.getModel("viewModel").setProperty("/ErrorMessage", JSON.parse(oError.responseText).error.message.value);
				}
			});
		},
		/* ### A Method has been defined to handle assigned attribures link press event.
		* @param {sap.ui.base.Event} oEvent
		 */
		onPressLink: function (oEvent) {
			var oButton = oEvent.getSource();
			var oCtx = oEvent.getSource().getCustomData()[0].getBindingContext().getObject();
			if (!this._oPopover) {
				Fragment.load({
					name: "pl.dac.apps.fnconfig.fragments.AssignedAttrPopver",
					controller: this
				}).then(function (oPopover) {
					this._oPopover = oPopover;
					this.getView().addDependent(this._oPopover);
					this._loadPopOverData(oCtx);
					this._oPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._loadPopOverData(oCtx);
				this._oPopover.openBy(oButton);
			}
		},
		/* ### A Method has been defined to read assigned attribures data.
		* @param {} oCtx
		 */
		_loadPopOverData: function (oCtx) {

			var oModel = this.getView().getModel(), sPath;

			sPath = "/DataRestrictionEnforcementSet(Policy='" + oCtx.Policy + "')";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "to_Attr" // Expand to_ActionItem
				},
				success: function (oData) {
					var oModel = new JSONModel({ PolicyName: oCtx.Policy, items: oData.to_Attr.results });
					this._oPopover.setModel(oModel, "popOverModel");
				}.bind(this),
				error: function (oError) {
					
					Log.error("Error reading policy details:"+ oError);
					
				}
			});
		},
		/** ### Method has been defined to handle full sreen button event
		 * Event handler of "sap.m.OverflowToolbarButton~press"
		 */
		handleFullScreen: function () {
			var oView = this.getView();
			oView.getModel("layoutMode").setProperty("/layout", "MidColumnFullScreen");
			oView.getModel("viewModel").setProperty("/FullScreen", false);
			oView.getModel("viewModel").setProperty("/ExitFullScreen", true);
		},
		/** ### Method has been defined to handle exit full sreen button event
		 * Event handler of "sap.m.OverflowToolbarButton~press"
		 */
		handleExitFullScreen: function () {
			var oView = this.getView();
			oView.getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
			oView.getModel("viewModel").setProperty("/FullScreen", true);
			oView.getModel("viewModel").setProperty("/ExitFullScreen", false);
		},
		/*###Event handler of "sap.m.OverflowTolbarButton~press"
		* ### A method has been defined to implement sorting in the Data Attribute table based on the AttributeId.
		*/
		onSort: function () {
			var oView = this.getView();
			if (oView.getModel("viewModel").getProperty("/SortOrder") == "asc") {
				oView.getModel("viewModel").setProperty("/SortOrder", "desc");
				oView.byId("idTableDataRestrictionEnforcement").getBinding("items").sort([new Sorter("Policy", false)]);
			} else {
				oView.getModel("viewModel").setProperty("/SortOrder", "asc");
				oView.byId("idTableDataRestrictionEnforcement").getBinding("items").sort([new Sorter("Policy", true)]);
			}
		},
		/** Private method
		 * ### A method has been defined to show an error message when an exception occurs ###
		 * ### during CRUD operations in the OData Model.
		 * @param {} oError
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
		/* ### A Method has been redefined to hide BusyIndicator .
		* @param {sap.ui.base.Event} oEvent
		 */

		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		}
	});
});