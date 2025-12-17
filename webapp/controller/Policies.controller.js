
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Sorter"
], function (
	Controller, Fragment, JSONModel, MessageBox,Sorter
) {
	"use strict";

	return Controller.extend("pl.dac.apps.fnconfig.controller.Policies", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("Policies").attachPatternMatched(this._onRouteMatched, this);
		},
		onEditBtnPress: function (oEvent) {
			var oView = this.getView();
			var oSelectedContextData = this.getView().byId("idTablePolicies").getSelectedItem().getBindingContext().getObject();

			oView.getModel("viewModel").setProperty("/Data", oSelectedContextData);
			if (!this._oFormUserAttrDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicy", // Path to your fragment
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
			oView.getModel("viewModel").setProperty("/Data", { PolicyName: "", PolicyDesc: "", Policy: "" });

			if (!this._oFormUserAttrDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicy", // Path to your fragment
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
			//	this.getView().byId("idSmartTablePolicies").setEnableCopy(false);
			var oBundle = this.getView().getModel("i18n").getResourceBundle();

			this.getView().setModel(new JSONModel(
				{
					Name: oBundle.getText("lblPolicyName"),
					Description: oBundle.getText("lblDescription"),
					Icon: "sap-icon://fx",
					Title: oBundle.getText("titPolicy"),
					PlaceHolder: "",
					EditButtonEnabled: false,
					Payload: {
						PolicyName: "",
						Policy: "",
						PolicyDesc: ""
					},
					PolicyNameEnabled: true,
					ErrorState: "None",
					ErrorMessage: "",
					ErrorStateDesc: "None",
					ErrorMessageDesc: "",
					DeleteButtonEnabled: false,
					FullScreen: true,
					ExitFullScreen: false,
					ExitColumn: true,
					SortOrder: 1
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
		},
		onTableSelectionChange: function (oEvent) {
			this.getView().getModel("viewModel").setProperty("/EditButtonEnabled", true);
			this.getView().getModel("viewModel").setProperty("/DeleteButtonEnabled", true);

		},
		onInputChange: function (oEvent) {
			/*var sNewValue = oEvent.getParameter("newValue");
			var oInput = oEvent.getSource();
			oInput.setValueState("None");
			this.getView().getModel("viewModel").setProperty("/ErrorState", "None");
			this.getView().getModel("viewModel").setProperty("/ErrorMessage", "");
			oInput.setValue(oInput.getValue().toUpperCase());
			oInput.setValueStateText("");
			if (sNewValue.length < 6) { // Example validation rule
				this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
				this.getView().getModel("viewModel").setProperty("/ErrorMessage", "Invalid input");
			} else {
				if (sNewValue.split(".")[0] != "USER") {
					this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
					this.getView().getModel("viewModel").setProperty("/ErrorMessage", "An attribute name should begin with \"USER.\" followed by the specific attribute name.");
				}
			}*/
		},
		onSave: function (oEvent) {
			var sPath;
			var oEntry = this.getView().getModel("viewModel").getData().Data;
			if (oEntry.PolicyName.trim() == "") {
				this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
				this.getView().getModel("viewModel").setProperty("/ErrorMessage", "The mandatory field cannot be left blank.");
				return;
			}
			if (oEntry.PolicyDesc.trim() == "") {
				this.getView().getModel("viewModel").setProperty("/ErrorStateDesc", "Error");
				this.getView().getModel("viewModel").setProperty("/ErrorMessageDesc", "The mandatory field cannot be left blank.");
				return;
			}
			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {

				sPath = "/PolicySet('" + oEntry.Policy + "')";
				this.getView().getModel().update(sPath, oEntry, {
					success: function () {
						MessageBox.success("Entry has been updated");
						this.getView().getModel().refresh();
						this._oFormUserAttrDialog.close();
					}.bind(this),
					error: function () {
						MessageBox.error("Error has occured while updating record");
					}
				});
			} else {
				sPath = '/PolicySet';
				oEntry.Policy = oEntry.PolicyName;
				this.getView().getModel().create(sPath, oEntry, {
					success: function () {
						MessageBox.success("Entry has been created");
						this.getView().getModel().refresh();
						this._oFormUserAttrDialog.close();
					}.bind(this),
					error: function () {
						MessageBox.error("Error has occured while creating record");
					}
				});
			}
		},
		onDeleteBtnPress: function () {
			var that = this,oBundle = this.getView().getModel("i18n").getResourceBundle();
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
			var sPolicy, sPath, oView = this.getView(), oModel = oView.getModel();
			sPolicy = oView.byId("idTablePolicies").getSelectedItem().getBindingContext().getObject().Policy;
			sPath = "/PolicySet('" + sPolicy + "')";
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
		onPressRuleLink: function (oEvent) {
			var sPolicyName = oEvent.getSource().getCustomData()[0].getValue();
			this.oRouter.navTo("PolicyRules", { PolicyName: sPolicyName });
			this.getView().getModel("layoutMode").setProperty("/layout", "ThreeColumnsEndExpanded");
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
		//
		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/closeColumn");
			this.oRouter.navTo("master", { layout: sNextLayout });
		},
		onSort: function () {
			var oView = this.getView(),
				aStates = [undefined, "asc", "desc"],
				iOrder = oView.getModel("viewModel").getProperty("/SortOrder");

			iOrder = (iOrder + 1) % aStates.length;
			var sOrder = aStates[iOrder];

			oView.getModel("viewModel").setProperty("/SortOrder", iOrder);
			oView.byId("idTablePolicies").getBinding("items").sort(new Sorter("PolicyName", sOrder));

		}
	});
});