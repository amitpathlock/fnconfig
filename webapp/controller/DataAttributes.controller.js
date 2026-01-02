
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
		},
		
		/** ### Event handle for Edit Data Attributes Button ###
		* Retrieves the selected item from the table and obtains the binding context object, which is structured like this: {propName: value1, propName: value2} 
		* Attach the obtained binding context object to the data property of the view model(name="viewModel").
		* If the dialog fragment(this._oDataAttributeDailog) is already created, open it and set the property AttrNameEnabled to false in the view model(name="viewModel").
		* If the dialog fragment is not instantiated, load the fragment. In the promise completion handler, assign the instance object to this._oDataAttributeDialog
		* Make the dialog instance view-dependent and then open the dialog box.
		* In the view model (name="viewModel"), set the property `AttrNameEnabled` to `false`
		@public
		@memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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
		/**
		 * ### Event handle for Edit Data Attributes Button ###
		 * Attach the empty object to the data property of the view model(name="viewModel").
		 * In the view model (name="viewModel"), set the property `AttrNameEnabled` to `true`
		 * If the dialog fragment(this._oDataAttributeDailog) is already created, open it and set the property `AttrNameEnabled` to `true` in the view model(name="viewModel").
		 * If the dialog fragment is not instantiated, load the fragment. In the promise completion handler, assign the instance object to this._oDataAttributeDialog
		 * Make the dialog instance view-dependent and then open the dialog box.
		 * In the view model (name="viewModel"), set the property `AttrNameEnabled` to `true`
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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
		/** 
		 *  Perform dialog close button event
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 */
		onCloseDialog: function () {
			if (this._oDataAttributeDailog) {
				this._oDataAttributeDailog.close();
			}
		},
		
		/**
		 * Perform Router class route match event
		 * Obtain the references oBundle from `ResourceModel`
		 * Assign the view model (named `viewModel`) with the specified properties to manage the behavior of the toggle control.
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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
		/**
		 * ### Event handler for table selection change event ###
		 * In the view model (name="viewModel"), set the property `EditButtonEnabled` to `true`
		 * In the view model (name="viewModel"), set the property `DeleteButtonEnabled` to `true`
		 * @public 
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		 */

		onTableSelectionChange: function () {
			this.getView().getModel("viewModel").setProperty("/EditButtonEnabled", true);
			this.getView().getModel("viewModel").setProperty("/DeleteButtonEnabled", true);

		},
		/* ### A Method has been defined to implement input live change.
		* @param {sap.ui.base.Event} oEvent
		 */

		/**
		 * ### Event handler for input changed ###
		 * Retrieve the value of the parameter `newValue` from `oEvent`.
		 * Assign the current event source (which is `sap.m.Input`) to the controller reference variable `this.__oInput`.
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
		
		/** Event handler for Save Data Attribute Button
		 * Obtain the references for the following: ODataModel from `oModel`, View from `oView`, and ResourceModel from `oBundle`
		 * Retrieve the property `Data` from the view model (name="viewModel") into a local variable called oEntry. 
		 * This oEntry will serve as the payload for the oDataModel's create and update operations.
		 * Ensure that the AttributeId and Description properties of oEntry are neither null nor empty; if they are,
		 * Set the properties ErrorState and ErrorMessage of the view model (name="viewModel") to `Error` and `the corresponding error message`, respectively and then return
		 * If the `__metadata` property exists in oEntry, the oDataModel will perform an Update operation; otherwise, it will perform a duplicate entry check.
		 * If the `__metadata` property exists in oEntry, create url path for update
		 * Execute ODataModel update method with sPath and oEntry
		 * Close the dialog box this._oDataAttributeDailog 
		 * @public
		 * @returns null;
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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
		/** ### A Method  has been defined to create new entry ### 
		 * Obtain the references for the following: oModel from `ODataModel`, oView from `View`, and oBundle from `ResourceModel`
		 * Execute ODataModel create method with oEntry payload
		 * Close the dialog box this._oDataAttributeDailog 
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
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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
		
		/** Event handler for delete button event
		 *  Obtain the references oBundle from `ResourceModel`
		 *  Display confirmation dialog box. If user confirmed the action then the private method _removeSelectedRecord will called
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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
		 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
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