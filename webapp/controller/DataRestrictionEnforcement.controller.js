
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
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("DataRestriction").attachPatternMatched(this._onRouteMatched, this);
			this.addAddintionButtonIntoThePolicyEnforcementTableToolbar(this.getView().byId("idSmartTablePOPRestriction"));
		},
		// onEditBtnPress: function () {
		// 	var oView = this.getView();
		// 	var oSelectedContextData = this.getView().byId("idTableDataRestrictionEnforcement").getSelectedItem().getBindingContext().getObject();
		// 	oSelectedContextData.IsActive = oSelectedContextData.IsActive == "" ? false : true;
		// 	oView.getModel("viewModel").setProperty("/Data", oSelectedContextData);
		// 	if (!this.oPolicyInforcementDialog) {
		// 		Fragment.load({
		// 			id: oView.getId(),
		// 			name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
		// 			controller: this // Assign the current controller
		// 		}).then(function (oDialog) {
		// 			this.oPolicyInforcementDialog = oDialog;
		// 			oView.addDependent(this.oPolicyInforcementDialog); // Add dialog as dependent of the view
		// 			this.oPolicyInforcementDialog.open();
		// 			this._validatePolicyInput(oSelectedContextData.Policy);
		// 		}.bind(this));
		// 	} else {
		// 		this.oPolicyInforcementDialog.open();
		// 		this._validatePolicyInput(oSelectedContextData.Policy);
		// 	}
		// 	oView.getModel("viewModel").setProperty("/PolicyNameEnabled", false);
		// },
		// onAddBtnPress: function () {
		// 	var oView = this.getView();
		// 	oView.getModel("viewModel").setProperty("/Data", { Policy: "", PolicyResult: "", IsActive: false });
		// 	oView.getModel("viewModel").setProperty("/PolicyNameEnabled", true);
		// 	if (!this.oPolicyInforcementDialog) {
		// 		Fragment.load({
		// 			id: oView.getId(),
		// 			name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
		// 			controller: this // Assign the current controller
		// 		}).then(function (oDialog) {
		// 			this.oPolicyInforcementDialog = oDialog;
		// 			oView.addDependent(oDialog); // Add dialog as dependent of the view
		// 			oDialog.open();
		// 		}.bind(this));
		// 	} else {
		// 		this.oPolicyInforcementDialog.open();

		// 	}
		// },
		// onCloseDialog: function () {
		// 	if (this.oPolicyInforcementDialog) {
		// 		this.oPolicyInforcementDialog.close();
		// 	}
		// },
		_onRouteMatched: function () {
			var oView=this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();
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
					SelectedContextData:null
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			this.oPolicyEnforcementTable = oView.byId("idTableDataRestrictionEnforcement");
		},
		
		// #region Value Help Dialog standard use case with filter bar without filter suggestions
		// onValueHelpRequested: function () {
		// 	var oColPolicyName, oColPolicyDesc, that = this, oView = this.getView();
		// 	this._oPolicyNameInputInput = oView.byId("idPolicyName");
		// 	if (!this._oVHDialog) {
		// 		this._oVHDialog = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.ValueHelp", this);
		// 		oView.addDependent(this._oVHDialog);
		// 		this._oVHDialog.setRangeKeyFields([{
		// 			label: "PolicyDesc",
		// 			key: "Polciy",
		// 			type: "string"
		// 		}]);
		// 		this._oVHDialog.getTableAsync().then(function (oTable) {
		// 			oTable.setModel(that.getView().getModel());
		// 			oTable.setSelectionMode("Single");
		// 			// For Desktop and tabled the default table is sap.ui.table.Table
		// 			if (oTable.bindRows) {
		// 				// Bind rows to the ODataModel and add columns
		// 				oTable.bindAggregation("rows", {
		// 					path: "/PolicySet",
		// 					events: {
		// 						dataReceived: function () {
		// 							that._oVHDialog.update();
		// 						}
		// 					}
		// 				});
		// 				oColPolicyName = new UIColumn({ label: new Label({ text: "Policy Name" }), template: new Text({ wrapping: false, text: "{Policy}" }) });
		// 				oColPolicyName.data({
		// 					fieldName: "{Policy}"
		// 				});
		// 				oTable.addColumn(oColPolicyName);

		// 				oColPolicyDesc = new UIColumn({ label: new Label({ text: "Description" }), template: new Text({ wrapping: false, text: "{PolicyDesc}" }) });
		// 				oColPolicyDesc.data({
		// 					fieldName: "PolicyDesc"
		// 				});
		// 				oTable.addColumn(oColPolicyDesc);
		// 			}
		// 			// For Mobile the default table is sap.m.Table
		// 			if (oTable.bindItems) {
		// 				// Bind items to the ODataModel and add columns
		// 				oTable.bindAggregation("items", {
		// 					path: "/PolicySet",
		// 					template: new ColumnListItem({
		// 						cells: [new Label({ text: "{Policy}" }), new Label({ text: "{PolicyDesc}" })]
		// 					}),
		// 					events: {
		// 						dataReceived: function () {
		// 							that._oVHDialog.update();
		// 						}
		// 					}
		// 				});
		// 				oTable.addColumn(new Column({ header: new Label({ text: "Policy" }) }));
		// 				oTable.addColumn(new Column({ header: new Label({ text: "Description" }) }));
		// 			}
		// 			that._oVHDialog.update();
		// 		});
		// 		this._oVHDialog.open();
		// 	} else {
		// 		this._oVHDialog.open();
		// 	}
		// },
		/* ### A Method has been defined to handle ValueHelp ok button press.
		* @param {sap.ui.base.Event} oEvent
		 */
		
		/* ### A Method has been defined to handle ValueHelp cancel buttton press event.
		*/
		//,

		/* ### A Method has been defined to implement save/update operation.
		*/
		onSavePolicyInforcement: function () {
			var sPath,oView=this.getView(),oModel = oView.getModel("viewModel");
			var oEntry = oModel.getData().Data;
			if (oEntry.Policy.trim() == "") {
				oModel.setProperty("/ErrorState", "Error");
				oModel.setProperty("/ErrorMessage", "The mandatory field cannot be left blank.");
				return;
			}
			delete oEntry.PolicyDesc;
			delete oEntry.PolicyName;
			delete oEntry.to_Policy;
			delete oEntry.to_Attr;
			oEntry.IsActive = oEntry.IsActive?"X":"";
			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {
				delete oEntry.__metadata;
				
				
				sPath = PlDacConst.ENTITY_SET_DATARESTRICTIONENFORCEMENT + "('" + oEntry.Policy + "')";
				this.getView().getModel().update(sPath, oEntry, {
					success: function () {
						MessageBox.success("Entry has been updated");
						oView.getModel().refresh();
						this.oPolicyInforcementDialog.close();
						oModel.setProperty("/Data", {});
						this.oPolicyEnforcementTable.removeSelections(true);
						oModel.setProperty("/EditButtonEnabled", false);
						oModel.setProperty("/DeleteButtonEnabled", false);
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
					this.oPolicyEnforcementTable.removeSelections(true);
					oView.getModel().refresh();
					this.oPolicyInforcementDialog.close();
					
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgErrorInCreate") + oError);
					that.oPolicyInforcementDialog.close();
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
						that.oPolicyNameInput.focus();
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


		
		removeSelectedRecord: function () {
			var oView = this.getView(), oModel = oView.getModel(), sPath, that = this,
			oBundle = oView.getModel("i18n").getResourceBundle(),
			sPolicyName =  oView.getModel("viewModel").getProperty("/SelectedContextData").Policy;
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
					that._displayErrorMessage(oError);
				}
			});
		},
		/* ### A Method has been defined to implement input live change.
		* @param {sap.ui.base.Event} oEvent
		 */
		onInputChange: function (oEvent) {
			var sNewValue = oEvent.getParameter("newValue");
			this.oPolicyNameInput = oEvent.getSource();
			this.oPolicyNameInput.setValueState("None");
			this.getView().getModel("viewModel").setProperty("/ErrorState", "None");
			this.getView().getModel("viewModel").setProperty("/ErrorMessage", "");
			this.oPolicyNameInput.setValue(this.oPolicyNameInput.getValue().toUpperCase());
			this.oPolicyNameInput.setValueStateText("");
			if (sNewValue.length > 6) {
				this.validatePolicyInput(sNewValue);
			}
		},
		onSuggestionItemSelected: function (oEvent) {
			var oView = this.getView(),
				oCtx = oEvent.getParameter("selectedRow").getBindingContext().getObject();
			oView.getModel("viewModel").setProperty("/Data/PolicyDesc", oCtx.PolicyDesc);
			this.validatePolicyInput(oCtx.Policy);
		},
		/* ### A Method has been defined to add expand parameter in mBindingParams .
		* @param {sap.ui.base.Event} oEvent
		 */
		// onBeforeRebindTable: function (oEvent) {
		// 	var mBindingParams = oEvent.getParameter("bindingParams");
		// 	mBindingParams.parameters["expand"] = "to_Policy";
		// },
		validatePolicyInput: function (sValue) {
			var oView = this.getView(), oModel = oView.getModel(), that = this,
				sPath = "/PolicySet('" + sValue + "')",
				bInputEditable = oView.getModel("viewModel").getProperty("/PolicyNameEnabled");
			// Example validation rule
			oModel.read(sPath, {
				// Success callback function
				success: function (oData) {
					// oData contains the retrieved data
					if(bInputEditable){
						that.oPolicyNameInput.focus();
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
					var oModel = new JSONModel({ PolicyName: oCtx.PolicyName, items: oData.to_Attr.results });
					this._oPopover.setModel(oModel, "popOverModel");
				}.bind(this),
				error: function (oError) {
					
					Log.error("Error reading policy details:"+ oError);
					
				}
			});
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