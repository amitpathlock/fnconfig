
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
			 *   5. Sort Button - triggers sort functionality
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
					press: this._onAddPolicyPolAdminButtonPress.bind(this)
				}));
				oToolbar.addContent(new OverflowToolbarButton({
					text: "Edit",
					icon: "sap-icon://edit",
					enabled: "{viewModel>/EditButtonEnabled}",
					tooltip: "{i18n>toolTipEditPolicy}",
					press: this._onEditPolicyPoladminButtonPress.bind(this)
				}));
				oToolbar.addContent(new OverflowToolbarButton({
					text: "Delete",
					icon: "sap-icon://delete",
					enabled: "{viewModel>/DeleteButtonEnabled}",
					tooltip: "{i18n>toolTipDelPolicy}",
					press: this._onDeletePolicyPolAdminButtonPress.bind(this)
				}));
				
			}
		},
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
		_onEditPolicyPoladminButtonPress: function () {
			var oView = this.getView();
			var oSelectedContextData =oView.byId("idTablePolAdminPolicies").getSelectedItem().getBindingContext().getObject();

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
	
		onCloseDialog: function () {
			var oView = this.getView();
			if (this._oDialogPolAdminPolicies) {
				this._oDialogPolAdminPolicies.close();
				oView.byId("idTablePolAdminPolicies").removeSelections(true);
			}
		},
		_onRouteMatched: function () {
			
			var oView=this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();

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
		onTableSelectionChange: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/EditButtonEnabled", true);
			oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", true);

		},
	
		onSavePolAdminPolicy: function () {
			var oBundle,sPath, oView = this.getView(), oViewModel = oView.getModel("viewModel"),
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
						MessageBox.success(oBundle.getText("msgPolicyUpdateSuccessful",[oEntry.PolicyName]));
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
				this._checkForDuplicateEntry(PlDacConst.ENTITY_SET_POLICIES + "(" + oEntry.Policy + ")", oEntry);
				
			}
		},
		onBeforePolAdminPolicyDialogOpened: function () {
			this._removelAllValidationError();
		},
		onAfterPolAdminPolicyDialogOpen:function(oEvent){
			var oDailog = oEvent.getSource(),
				oForm = oDailog.getContent()[0].getAggregation("form"),
				aFormElements = oForm.getAggregation("formContainers")[0].getAggregation("formElements");
			if (aFormElements[0].getAggregation("fields")[0].getEnabled()) {
				aFormElements[0].getAggregation("fields")[0].focus();
			} else {
				aFormElements[1].getAggregation("fields")[0].focus();
			}
		},
		_removelAllValidationError:function(){
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/PolNameErrorMessage", "");
			oView.getModel("viewModel").setProperty("/PolNameErrorState", "None");
			oView.getModel("viewModel").setProperty("/PolDescErrorMessage", "");
			oView.getModel("viewModel").setProperty("/PolDescErrorState", "None");
					
		},
		_checkForDuplicateEntry: function (sPath, oEntry) {
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
		onPolicyNameInputLiveChange:function(oEvent){
			var sNewValue = oEvent.getParameter("newValue");
			if(sNewValue){
				oEvent.getSource().setValue(sNewValue.toUpperCase());
			}
		},
		_createEntry:function(oEntry){
			var oView=this.getView(),oDataModel = oView.getModel(),oBundle = oView.getModel("i18n").getResourceBundle();
			oDataModel.create(PlDacConst.ENTITY_SET_POLICIES, oEntry, {
					success: function () {
						MessageBox.success(oBundle.getText("msgPolicyCreatedSuccessful",[oEntry.PolicyName]));
						oDataModel.refresh();
						this._oDialogPolAdminPolicies.close();
					}.bind(this),
					error: function () {
						MessageBox.error("Error has occured while creating record");
					}
				});
		},
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
		_removeSelectedRecord: function () {
			var sPolicy, sPath, oView = this.getView(), oModel = oView.getModel();
			sPolicy = oView.byId("idTablePolAdminPolicies").getSelectedItem().getBindingContext().getObject().Policy;
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
			alert("Not Implemented");
			//var sPolicyName = oEvent.getSource().getCustomData()[0].getValue();
			//this._oRouter.navTo("PolicyRules", { PolicyName: sPolicyName });
			//this.getView().getModel("layoutMode").setProperty("/layout", "ThreeColumnsEndExpanded");
		}
		// handleFullScreen: function () {
		// 	this.getView().getModel("layoutMode").setProperty("/layout", "MidColumnFullScreen");
		// 	this.getView().getModel("viewModel").setProperty("/FullScreen", false);
		// 	this.getView().getModel("viewModel").setProperty("/ExitFullScreen", true);

		// },
		// handleExitFullScreen: function () {
		// 	this.getView().getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
		// 	this.getView().getModel("viewModel").setProperty("/FullScreen", true);
		// 	this.getView().getModel("viewModel").setProperty("/ExitFullScreen", false);
		// },
		//
		// handleClose: function () {
		// 	//var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/closeColumn");
		// 	//this._oRouter.navTo("master", { layout: sNextLayout });
		// },
	
	});
});