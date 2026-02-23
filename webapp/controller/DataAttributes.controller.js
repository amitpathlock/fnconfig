
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/model/Sorter",
	"sap/base/Log"
], function (
	BaseController, PlDacConst, Fragment, JSONModel, MessageBox, Sorter, Log
) {
	"use strict";

	return BaseController.extend("pl.dac.apps.fnconfig.controller.DataAttributes", {
		/**
		 * Called when a view is instantiated and its controls (if available) have been created.
		 * Can be used to modify the view before it is displayed, to bind event handlers, and to do other one-time initialization.
		 * Store the instance of the Router class in the variable referenced by the controller.
		 * Call the Router attachParternPathed event
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 */
		onInit: function () {
			
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute(PlDacConst.ROUTE_PATH_DATA_ATTRIBUTE).attachPatternMatched(this._onRouteMatched, this);
			this.addAdditionalButtonIntoTheAttributeTableToolbar(this.getView().byId("idSmartTableDataAttributes"));
		},



		/**
		 * Perform Router class route match event
		 * Obtain the references oBundle from `ResourceModel`
		 * Assign the view model (named `viewModel`) with the specified properties to manage the behavior of the toggle control.
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		*/
		_onRouteMatched: function () {
			var oView = this.getView(),
				oBundle = oView.getModel("i18n").getResourceBundle();
			oView.setModel(new JSONModel(
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
					SortOrder: "asc",
					AttributeType: "DATA",
					SelectedContextData: null
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			this.oAttributeTable = oView.byId("idTableDataAttributes");
			if(this.oAttributeTable){
				this.oAttributeTable.removeSelections(true);
			}
			
		},



		/** Event handler for Save Data Attribute Button
		 * Obtain the references for the following: ODataModel from `oModel`, View from `oView`, and ResourceModel from `oBundle`
		 * Retrieve the property `Data` from the view model (name="viewModel") into a local variable called oEntry. 
		 * This oEntry will serve as the payload for the oDataModel's create and update operations.
		 * Ensure that the AttributeId and Description properties of oEntry are neither null nor empty; if they are,
		 * Set the properties ErrorState and ErrorMessage of the view model (name="viewModel") to `Error` and `the corresponding error message`, respectively and then return
		 * If the `__metadata` property exists in oEntry, the oDataModel will perform an Update operation; otherwise, it will perform a duplicate entry check.
		 * If the `__metadata` property exists in oEntry, create url path for update
		 * Execute ODataModel update method with sPath and oEntry
		 * Close the dialog box this.oAttributeDialog 
		 * @public
		 * @returns null;
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 */
		onSaveAttributeDialog: function () {
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
						this.oAttributeDialog.close();
						oView.byId("idTableDataAttributes").removeSelections(true);
						oView.getModel("viewModel").setProperty("/Data", {});
						oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
						oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
					}.bind(this),
					error: function (oError) {
						Log.error(oBundle.getText("msgErrorInUpdate") + oError);
						that.oAttributeDialog.close();
						that.displayErrorMessage(oError);

					}
				});
			} else {
				/** Initiate a create call. */
				this._checkForDuplicateEntry(PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH + "('" + oEntry.AttributeId + "')", oEntry);

			}
		},
		/** ### A Method  has been defined to create new entry ### 
		 * Obtain the references for the following: oModel from `ODataModel`, oView from `View`, and oBundle from `ResourceModel`
		 * Execute ODataModel create method with oEntry payload
		 * Close the dialog box this.oAttributeDialog 
		 * @param {} oEntry
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 */
		_createEntry: function (oEntry) {
			var that = this, oBundle, oView = this.getView(), oModel = oView.getModel();
			oBundle = oView.getModel("i18n").getResourceBundle();
			oModel.create(PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgDACreateSuccessfully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
					oView.getModel().refresh();
					this.oAttributeDialog.close();
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgErrorInCreate") + oError);
					that.oAttributeDialog.close();
					that.displayErrorMessage(oError);

				}
			});
		},
		/** ### Private Method
		 *  A Method has been defined to check for Duplicate entry
		 * @param {string} sPath
		 * @param {} oEntry
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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
					error: function () {
						that._createEntry(oEntry);
					}
				}
			);
		},


		/** ### Event handler of "sap.m.OverflowToolButton~press"
		 *  ### A Private method has been defined to implement delete selected record
		 * @param {sap.base.i18n.ResourceBundle} oBundle
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 */
		removeSelectedRecord: function () {
			var sPath, oView = this.getView(), oModel = oView.getModel(), that = this,
				oBundle = oView.getModel("i18n").getResourceBundle(),
				sAttributeId =  oView.getModel("viewModel").getProperty("/SelectedContextData").AttributeId;
			//	sAttributeId = oView.byId("idTableDataAttributes").getSelectedItem().getBindingContext().getObject().AttributeId;
			sPath = PlDacConst.ENTITY_SET_DATAATTRIBUTE_PATH + "('" + sAttributeId + "')";
			oModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgDADeleteSucceful", [sAttributeId]), { styleClass: "PlDacMessageBox" });
					oModel.refresh();
					oView.byId("idTableDataAttributes").removeSelections(true);
					oView.getModel("viewModel").setProperty("/Data", {});
					oView.getModel("viewModel").setProperty("/EditButtonEnabled", false);
					oView.getModel("viewModel").setProperty("/DeleteButtonEnabled", false);
				},
				error: function (oError) {
					Log.error(oBundle.getText("msgDAErrorInDelete") + oError);
					that.displayErrorMessage(oError);
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
		// _displayErrorMessage: function (oError) {
		// 	var message = "An unknown error occurred.";
		// 	if (oError && oError.responseText) {
		// 		try {
		// 			var errorBody = JSON.parse(oError.responseText);
		// 			if (errorBody.error && errorBody.error.message && errorBody.error.message.value) {
		// 				message = errorBody.error.message.value;
		// 			} else if (errorBody.error && errorBody.error.errordetails && errorBody.error.errordetails.length > 0) {
		// 				message = errorBody.error.errordetails[0].message;
		// 			}
		// 		} catch (e) {
		// 			Log.error(e);
		// 			// Handle cases where response body might not be valid JSON
		// 			message = $(oError.response.body).find('message').first().text();
		// 		}
		// 	}
		// 	MessageBox.error(message, { styleClass: "PlDacMessageBox" }); // Display using sap.m.MessageBox
		// },
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		}
	});
});