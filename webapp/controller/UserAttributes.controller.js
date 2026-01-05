
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Sorter",
	"sap/base/Log"
], function (
	BaseController,
	PlDacConst,
	Fragment,
	JSONModel,
	MessageBox,
	Sorter,
	Log
) {
	"use strict";
	return BaseController.extend("pl.dac.apps.fnconfig.controller.UserAttributes", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute(PlDacConst.ROUTE_PATH_USER_ATTRIBUTE).attachPatternMatched(this._onRouteMatched, this);
		},

		/* ### A Method has been defined to implement onRouteMatched event.
		*  -> Create viewModel with relavent properties
		* @param {sap.ui.base.Event} oEvent
		 */
		_onRouteMatched: function () {
			var oView = this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();

			oView.setModel(new JSONModel(
				{
					Name: oBundle.getText("lblAttribute"),
					Description: oBundle.getText("lblDescription"),
					Icon: "sap-icon://person-placeholder",
					Title: oBundle.getText("titUserAttribute"),
					PlaceHolder: oBundle.getText("pholderUserAttribute"),
					EditButtonEnabled: false,
					Payload: {
						AttributeId: "",
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
					SortOrder: "asc",
					AttributeType: "USER",
					SelectedContextData: null
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			oView.byId("idTableUserAttributes").removeSelections(true);
		},

		/* ### A Method has been defined to implement save/update operation.
		* @param {sap.ui.base.Event} oEvent
		 */
		onSave: function () {
			var sPath, oEntry,
				oView = this.getView(),
				oModel = oView.getModel(),
				oBundle = oView.getModel("i18n").getResourceBundle(),
				that = this;
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
				sPath = PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')";
				oModel.update(sPath, oEntry, {
					success: function () {
						MessageBox.success(oBundle.getText("msgUAUpdateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
						oModel.refresh();
						that.oAttributeDialog.close();
					},
					error: function (oError) {
						Log.error(oBundle.getText("msgUAErrorInUAUpdate") + oError);
						that.oAttributeDialog.close();
						that._displayErrorMessage(oError);
					}
				});
			} else {
				/** Initiate a create call. */
				this._checkForDuplicateEntry(PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')", oEntry);

			}
		},
		/** Private Method
		 *  A Method  has been defined to create new entry
		 * @param {} oEntry
		 */
		_createEntry: function (oEntry) {
			var that = this, oBundle, oView = this.getView(), oModel = oView.getModel();
			oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.create(PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgUACreateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
					this.oAttributeDialog.close();
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgUAErrorInCreate") + oError);
					that.oAttributeDialog.close();
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
						that.oInputAttributeName.focus();
						oView.getModel("viewModel").setProperty("/ErrorMessage", oBundle.getText("msgErrorDuplicateEntry", [oEntry.AttributeId]));
						oView.getModel("viewModel").setProperty("/ErrorState", "Error");
						return;
					},
					error: function (oError) {
						Log.error("Error" + oError);
						that._createEntry(oEntry);
					}
				}
			);
		},
		/** ### Event handler of "sap.m.OverflowToolButton~press"
	 *  ### A Method has been defined to implement delete operation to table record.
	 */
		// onDeleteBtnPress: function () {
		// 	var that = this, oBundle = this.getView().getModel("i18n").getResourceBundle();
		// 	MessageBox.warning(oBundle.getText("msgDeleteConfirmation"), {
		// 		actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
		// 		emphasizedAction: MessageBox.Action.OK,
		// 		styleClass: "PlDacMessageBox",
		// 		onClose: function (sAction) {
		// 			if (sAction == "OK") {
		// 				that._removeSelectedRecord(oBundle);
		// 			}
		// 		}
		// 	});
		// },
		/** ### Event handler of "sap.m.OverflowToolButton~press"
		 *  ### A Private method has been defined to implement delete selected record
		 * @param {sap.base.i18n.ResourceBundle} oBundle
		 */
		removeSelectedRecord: function () {
			var sPath, oView = this.getView(), oModel = oView.getModel(), that = this,
				oBundle = oView.getModel("i18n").getResourceBundle(),
				sAttributeId =  oView.getModel("viewModel").getProperty("/SelectedContextData").AttributeId;
			//	sAttributeId = oView.byId("idTableUserAttributes").getSelectedItem().getBindingContext().getObject().AttributeId;
			sPath = PlDacConst.ENTITY_SET_USERATTRIBUTE_PATH + "('" + sAttributeId + "')";
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgUADeleteSucceful", [sAttributeId]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
				},
				error: function (oError) {
					Log.error(oBundle.getText("msgUAErrorInDelete") + oError);
					that._displayErrorMessage(oError);
				}
			});
		},

		/** ### Method has been defined to handle table header sort button event
		 * Event handler of "sap.m.OverflowToolbarButton~press"
		 */
		onSort: function () {
			var oView = this.getView();
			if (oView.getModel("viewModel").getProperty("/SortOrder") == "asc") {
				oView.getModel("viewModel").setProperty("/SortOrder", "desc");
				oView.byId("idTableUserAttributes").getBinding("items").sort([new Sorter("AttributeId", false)]);
			} else {
				oView.getModel("viewModel").setProperty("/SortOrder", "asc");
				oView.byId("idTableUserAttributes").getBinding("items").sort([new Sorter("AttributeId", true)]);
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