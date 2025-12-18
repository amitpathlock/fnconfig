
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Sorter",
	"sap/base/Log"
], function (
	Controller, PlDacConst, Fragment, JSONModel, MessageBox, Sorter, Log
) {
	"use strict";

	return Controller.extend("pl.dac.apps.fnconfig.controller.DataAttributes", {

		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();

			this._oRouter.getRoute(PlDacConst.ROUTE_PATH_DATA_ATTRIBUTE).attachPatternMatched(this._onRouteMatched, this);
		},
		/* ###Method has been defined to implement table header edit attribute event.
		* @param {sap.ui.base.Event} oEvent
		*/
		onEditBtnPress: function () {
			var oView = this.getView();
			var oSelectedContextData = this.getView().byId("idTableDataAttributes").getSelectedItem().getBindingContext().getObject();
			oView.getModel("viewModel").setProperty("/Data", oSelectedContextData);
			if (!this._oDataAttributeDailog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogAttribute", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this._oDataAttributeDailog = oDialog;
					oView.addDependent(oDialog); // Add dialog as dependent of the view
					oDialog.open();
				}.bind(this));
			} else {
				this._oDataAttributeDailog.open();
			}
			oView.getModel("viewModel").setProperty("/AttrNameEnabled", false);
		},
		/* ### A Method has been defined to implement table header add attribute event.
		*  -> Add the AttributeId and Description in /Data namespace of viewModel
		*  -> Initialized the this._oDataAttributeDailog
		*  -> Open the this._oDataAttributeDailog
		*  -> Set the AttrNameEnabled property as true of viewModel
		* @param {sap.ui.base.Event} oEvent
		 */
		onAddBtnPress: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/Data", { AttributeId: "", Description: "" });
			oView.getModel("viewModel").setProperty("/AttrNameEnabled", true);
			if (!this._oDataAttributeDailog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogAttribute", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this._oDataAttributeDailog = oDialog;
					oView.addDependent(oDialog); // Add dialog as dependent of the view
					oDialog.open();
				}.bind(this));
			} else {
				this._oDataAttributeDailog.open();
			}
			oView.getModel("viewModel").setProperty("/AttrNameEnabled", true);
		},
		onCloseDialog: function () {
			if (this._oDataAttributeDailog) {
				this._oDataAttributeDailog.close();
			}
		},
		/* ### A Method has been defined to implement onRouteMatched event.
		*  -> Create viewModel with relavent properties
		* @param {sap.ui.base.Event} oEvent
		 */
		_onRouteMatched: function () {

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			this.getView().setModel(new JSONModel(
				{
					Name: oBundle.getText("lblAttribute"),
					Description: oBundle.getText("lblDescription"),
					Icon: "sap-icon://product",
					Title: oBundle.getText("titDataAttribute"),
					PlaceHolder: oBundle.getText("pholderDataAttribute"),
					EditButtonEnabled: false,
					Payload: {
						DataAttrSet: "",
						Description: ""
					},
					AttrNameEnabled: true,
					ErrorState: "None",
					ErrorMessage: "",
					ErrorStateDesc: "None",
					ErrorMessageDesc: "",
					DeleteButtonEnabled: false,
					FullScreen: true,
					ExitFullScreen: false,
					ExitColumn: true,
					SortOrder: "asc"
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
		},
		/* ### A Method has been defined to implement table selection change event.
		* @param {sap.ui.base.Event} oEvent
		 */
		onTableSelectionChange: function () {
			this.getView().getModel("viewModel").setProperty("/EditButtonEnabled", true);
			this.getView().getModel("viewModel").setProperty("/DeleteButtonEnabled", true);

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
			if (sNewValue.length < 6) { // Example validation rule
				this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
				this.getView().getModel("viewModel").setProperty("/ErrorMessage", "Invalid input");
			} else {
				if (sNewValue.split(".")[0] != "DATA") {
					this.getView().getModel("viewModel").setProperty("/ErrorState", "Error");
					this.getView().getModel("viewModel").setProperty("/ErrorMessage", "An attribute name should begin with \"DATA.\" followed by the specific attribute name.");
				}
			}
		},
		/* ### A Method has been defined to implement save/update operation.
		* @param {sap.ui.base.Event} oEvent
		 */
		onSave: function () {
			var sPath, oView = this.getView(),
				oModel = oView.getModel(), oBundle = oView.getModel("i18n").getResourceBundle(), oEntry, that = this;
			oEntry = oView.getModel("viewModel").getData().Data;
			if (oEntry.AttributeId.trim() == "") {
				oView.getModel("viewModel").setProperty("/ErrorState", "Error");
				oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorEmptyField"));
				return;
			}
			if (oEntry.Description.trim() == "") {
				oView.getModel("viewModel").setProperty("/ErrorStateDesc", "Error");
				oView.getModel("viewModel").setProperty("/ErrorMessageDesc", oBundle.getText("msgErrorEmptyField"));
				return;
			}
			/**
			 * If the payload contains the `__metadata` property, proceed with an update call. If it doesn’t,initiate a create call instead.
			 */
			if (({}).hasOwnProperty.call(oEntry, "__metadata")) {
				sPath = PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')";
				oModel.update(sPath, oEntry, {
					success: function () {
						MessageBox.success(oBundle.getText("msgDAUpdateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
						oModel.refresh();
						this._oDataAttributeDailog.close();
					}.bind(this),
					error: function (oError) {
						Log.error(oBundle.getText("msgErrorInUpdate") + oError);
						that._oDataAttributeDailog.close();
						that._displayErrorMessage(oError);

					}
				});
			} else {
				/** Initiate a create call. */
				this._checkForDuplicateEntry(PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')", oEntry);

			}
		},
		/** Private Method
		 *  A Method  has been defined to create new entry
		 * @param {} oEntry
		 */
		_createEntry: function (oEntry) {
			var that = this, oBundle, oView = this.getView(), oModel = oView.getModel();
			oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.create(PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgDACreateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
					oView.getModel().refresh();
					this._oDataAttributeDailog.close();
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgErrorInCreate") + oError);
					that._oDataAttributeDailog.close();
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
						oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorDuplicateEntry", [oEntry.AttributeId]));
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
			var sPath, oView = this.getView(), oModel = oView.getModel(), that = this,
				sAttributeId = oView.byId("idTableDataAttributes").getSelectedItem().getBindingContext().getObject().AttributeId;
			sPath = PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH + "('" + sAttributeId + "')";
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgDADeleteSucceful", [sAttributeId]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
				},
				error: function (oError) {
					Log.error(oBundle.getText("msgDAErrorInDelete") + oError);
					that._displayErrorMessage(oError);
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
				oView.byId("idTableDataAttributes").getBinding("items").sort([new Sorter("AttributeId", false)]);
			} else {
				oView.getModel("viewModel").setProperty("/SortOrder", "asc");
				oView.byId("idTableDataAttributes").getBinding("items").sort([new Sorter("AttributeId", true)]);
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
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		}
	});
});