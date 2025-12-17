
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/table/Column",
	"sap/m/Column",
	"sap/m/Text",
	"sap/m/Label",
	"sap/m/ColumnListItem",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (
	Controller, Fragment, JSONModel, MessageBox, UIColumn, Column, Text, Label, ColumnListItem, Filter, FilterOperator
) {
	"use strict";

	return Controller.extend("pl.dac.apps.fnconfig.controller.DataRestrictionEnforcement", {
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("DataMasking").attachPatternMatched(this._onRouteMatched, this);
		},
		onEditBtnPress: function (oEvent) {
			var oView = this.getView();
			var oSelectedContextData = this.getView().byId("idTableDataMaskingEnforcement").getSelectedItem().getBindingContext().getObject();

			oView.getModel("viewModel").setProperty("/Data", oSelectedContextData);
			if (!this._oFormUserAttrDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this._oFormUserAttrDialog = oDialog;
					oView.addDependent(oDialog); // Add dialog as dependent of the view
					oDialog.open();
				}.bind(this));
			} else {
				this._oFormUserAttrDialog.open();
			}
			oView.getModel("viewModel").setProperty("/PolicyNameEnabled", false);
		},
		onAddBtnPress: function (oEvent) {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/Data", { Policy: "", PolicyResult: "", IsActive: false });

			if (!this._oFormUserAttrDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this._oFormUserAttrDialog = oDialog;
					oView.addDependent(oDialog); // Add dialog as dependent of the view
					oDialog.open();
				}.bind(this));
			} else {
				this._oFormUserAttrDialog.open();
			}
		},
		onCloseDialog: function () {
			if (this._oFormUserAttrDialog) {
				this._oFormUserAttrDialog.close();
			}
		},
		_onRouteMatched: function (oEvent) {
			sap.ui.core.BusyIndicator.hide();
			//this.getView().byId("idSmartTablePOPRestriction").setEnableCopy(false);
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
					ExitColumn: true
				}
			), "viewModel");
			this.oVHDialogP = Fragment.load({
				//	id: oView.getId(),
				name: "pl.dac.apps.fnconfig.fragments.ValueHelp", // Path to your fragment
				controller: this // Assign the current controller
			}).then(function (oDialog) {
				return oDialog;

			});
		},
		onTableSelectionChange: function (oEvent) {
			this.getView().getModel("viewModel").setProperty("/EditButtonEnabled", true);
			this.getView().getModel("viewModel").setProperty("/DeleteButtonEnabled", true);

		},
		// #region Value Help Dialog standard use case with filter bar without filter suggestions
		onValueHelpRequested: function () {
			var oColPolicyName, oColPolicyDesc;
			this._oPolicyNameInput = this.getView().byId("idPolicyName");

			this.oVHDialogP.then(function (oVHDialog) {
				this.oVHDialog = oVHDialog;
				this.getView().addDependent(oVHDialog);
				// Set key fields for filtering in the Define Conditions Tab
				oVHDialog.setRangeKeyFields([{
					label: "Polciy",
					key: "Polciy",
					type: "string"
				}]);
				oVHDialog.getTableAsync().then(function (oTable) {
					oTable.setModel(this.getView().getModel());
					oTable.setSelectionMode("Single");
					oTable.removeAllColumns();
					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/PolicySet",
							events: {
								dataReceived: function () {
									oVHDialog.update();
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
									oVHDialog.update();
								}
							}
						});
						oTable.addColumn(new Column({ header: new Label({ text: "Policy" }) }));
						oTable.addColumn(new Column({ header: new Label({ text: "Description" }) }));
					}
					oVHDialog.update();
				}.bind(this));
				oVHDialog.open();
			}.bind(this));
		},
		loadFragment: function (oData) {
			var oView = this.getView(), that = this;
			Fragment.load({
				id: oView.getId(),
				name: oData.Name, // Path to your fragment
				controller: that // Assign the current controller
			}).then(function (oDialog) {
				return oDialog;

			});
		},
		onValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oPolicyNameInput.setValue(aTokens[0].getKey());
			this.oVHDialog.close();
			this._validatePolicyInput(aTokens[0].getKey());
		},

		onValueHelpCancelPress: function () {
			this.oVHDialog.close();
		},

		onValueHelpAfterClose: function () {
			//this.oVHDialog.destroy();
		},
		onSave: function (oEvent) {
			var sPath;
			var oEntry = this.getView().getModel("viewModel").getData().Data;
			if (oEntry.Policy.trim() == "") {
				this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
				this.getView().getModel("viewModel").setProperty("/ErrorMessage", "The mandatory field cannot be left blank.");
				return;
			}

			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {

				sPath = "/DataMaskingEnforcementSet('" + oEntry.PolicyName + "')";
				this.getView().getModel().update(sPath, oEntry, {
					success: function () {
						MessageBox.success("Entry has been updated");
						this.getView().getModel().refresh();
						this._oFormUserAttrDialog.close();
					}.bind(this),
					error: function (e) {
						MessageBox.error("Error has occured while updating record");
					}
				});
			} else {
				sPath = '/DataMaskingEnforcementSet';
				this.getView().getModel().create(sPath, oEntry, {
					success: function () {
						MessageBox.success("Entry has been created");
						this.getView().getModel().refresh();
						this._oFormUserAttrDialog.close();
					}.bind(this),
					error: function (e) {
						MessageBox.error("Error has occured while creating record");
					}
				});
			}
		},
		onDeleteBtnPress: function () {
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
		_removeSelectedRecord: function () {
			var oView = this.getView(), oModel = oView.getModel(), sPolicyName, sPath;
			sPolicyName = oView.byId("idTableDataMaskingEnforcement").getSelectedItem().getBindingContext().getObject().PolicyName;
			sPath = "/DataMaskingEnforcementSet('" + sPolicyName + "')";
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success("Entry has been deleted");
					oModel.refresh();
				},
				error: function () {
					MessageBox.error("Error has occured while removing record");
				}
			});
		},
		onInputChange: function (oEvent) {
			var sNewValue = oEvent.getParameter("newValue");
			var oInput = oEvent.getSource();
			oInput.setValueState("None");
			this.getView().getModel("viewModel").setProperty("/ErrorState", "None");
			this.getView().getModel("viewModel").setProperty("/ErrorMessage", "");
			oInput.setValue(oInput.getValue().toUpperCase());
			oInput.setValueStateText("");
			if (sNewValue.length > 6) {
				this._validatePolicyInput(sNewValue);
			}
		},
		_validatePolicyInput: function (sValue) {
			var oModel = this.getView().getModel();
			var sPath = "/PolicySet('" + sValue + "')";
			// Example validation rule
			oModel.read(sPath, {
				// Success callback function
				success: function (oData, oResponse) {
					// oData contains the retrieved data
					this.getView().byId("idPolicyDescription").setValue(oData.PolicyDesc);
					// If reading an entity set, oData.results will contain an array of entities
					if (oData.results) {
						this.getView().getModel("viewModel").setProperty("/ErrorState", "None");
						this.getView().getModel("viewModel").setProperty("/ErrorMessage", "");
					}
				}.bind(this),
				// Error callback function
				error: function (oError) {
					// oError contains details about the error

					this.getView().byId("idPolicyDescription").setValue("");
					this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
					this.getView().getModel("viewModel").setProperty("/ErrorMessage", JSON.parse(oError.responseText).error.message.value);
				}.bind(this)
			});
		},
		onPressLink: function (oEvent) {
			var oButton = oEvent.getSource();
			var oCtx = oEvent.getSource().getCustomData()[0].getBindingContext().getObject();
			//var sPolicyName = oEvent.getSource().getCustomData()[0].getValue();
			if (!this._oPopover) {
				Fragment.load({
					name: "pl.dac.apps.fnconfig.fragments.AssignedAttrPopver",
					controller: this
				}).then(function (oPopover) {
					this._oPopover = oPopover;
					this.getView().addDependent(this._oPopover);
					this._loadPopOverData(oCtx);
					//this._oPopover.bindElement("/ProductCollection/0");
					this._oPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._loadPopOverData(oCtx);
				this._oPopover.openBy(oButton);
			}
		},
		_loadPopOverData: function (oCtx) {
			var oModel = this.getView().getModel(), sPath;
			sPath = "/DataMaskingEnforcementSet(Policy='" + oCtx.Policy + "')";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "to_Attr"// Expand to_ActionItem
				},
				success: function (oData, oResponse) {

					var oModel = new JSONModel({ PolicyName: oCtx.Policy, items: oData.to_Attr.results });
					this._oPopover.setModel(oModel, "popOverModel");

				}.bind(this),
				error: function (oError) {
					/* eslint-disable no-console */
					console.error("Error reading policy details:", oError);
					/* eslint-enable no-console */
				}
			});
		},
		handleFullScreen: function () {
			this.getView().getModel("layoutMode").setProperty("/layout", "MidColumnFullScreen");
			this.getView().getModel("viewModel").setProperty("/FullScreen", false);
			this.getView().getModel("viewModel").setProperty("/ExitFullScreen", true);
		},
		handleExitFullScreen: function () {
			this.getView().getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getView().getModel("viewModel").setProperty("/FullScreen", true);
			this.getView().getModel("viewModel").setProperty("/ExitFullScreen", false);
		},
		onAfterRendering: function (oEvent) {
			this.getView().getModel().refresh();
		}
	});
});