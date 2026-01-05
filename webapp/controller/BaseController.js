sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
	"sap/ui/core/Fragment"
  ],
  function (BaseController, MessageBox,Fragment) {
    "use strict";
    /**
 * Called when a view is instantiated and its controls (if available) have been created.
 * Can be used to modify the view before it is displayed, to bind event handlers, and to do other one-time initialization.
 * Store the instance of the Router class in the variable referenced by the controller.
 * Call the Router attachParternPathed event
 * @memberOf pl.dac.apps.fnconfig.controller.DataAttributes
 */
    return BaseController.extend("pl.dac.apps.fnconfig.controller.BaseController", {
	
      onInit: function () {
      },
      /** Event handler for delete button event
   *  Obtain the references oBundle from `ResourceModel`
   *  Display confirmation dialog box. If user confirmed the action then the private method _removeSelectedRecord will called
   * @public
   * @memberOf pl.dac.apps.fnconfig.controller.BaseController
  */
      onDeleteBtnPress: function () {
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

		removeSelectedRecord: function() {},
      /**
		 * ### Event handler for table selection change event ###
		 * In the view model (name="viewModel"), set the property `EditButtonEnabled` to `true`
		 * In the view model (name="viewModel"), set the property `DeleteButtonEnabled` to `true`
		 * @public 
		 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
		 */

		onTableSelectionChange: function (oEvent) {
			var oView = this.getView(),oModel = oView.getModel("viewModel"),oItem= oEvent.getParameter("listItem"),
			oSelectData = oItem.getBindingContext().getObject();
			oModel.setProperty("/EditButtonEnabled", true);
			oModel.setProperty("/DeleteButtonEnabled", true);
			if(oItem.getCustomData() && oItem.getCustomData()[0]){
				oSelectData[oItem.getCustomData()[0].getKey()] = oItem.getCustomData()[0].getValue();
			}
			oModel.setProperty("/SelectedContextData",oSelectData);

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
			var sNewValue = oEvent.getParameter("newValue"),sAttributeType;
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
					this.getView().getModel("viewModel").setProperty("/ErrorMessage", "An attribute name should begin with \""+sAttributeType+"\" followed by the specific attribute name.");
				}
			}
		},
		/* ### A Method has been defined to implement table header add attribute event.
		*  -> Add the AttributeId and Description in /Data namespace of viewModel
		*  -> Initialized the this.oAttributeDialog
		*  -> Open the this.oAttributeDialog
		*  -> Set the AttrNameEnabled property as true of viewModel
		* @param {sap.ui.base.Event} oEvent
		 */
		onAddBtnPress: function () {
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
				this.oAttributeDialog.attachAfterOpen(this._onDailogOnAfterShow, this);
				this.oAttributeDialog.open();
				
			}
		},
		onCloseDialog: function () {
			if (this.oAttributeDialog) {
				this.oAttributeDialog.close();
			}
		},
		/** ### Event handle for Edit Data Attributes Button ###
		* Retrieves the selected item from the table and obtains the binding context object, which is structured like this: {propName: value1, propName: value2} 
		* Attach the obtained binding context object to the data property of the view model(name="viewModel").
		* If the dialog fragment(this.oAttributeDialog) is already created, open it and set the property AttrNameEnabled to false in the view model(name="viewModel").
		* If the dialog fragment is not instantiated, load the fragment. In the promise completion handler, assign the instance object to this._oDataAttributeDialog
		* Make the dialog instance view-dependent and then open the dialog box.
		* In the view model (name="viewModel"), set the property `AttrNameEnabled` to `false`
		@public
		@memberOf pl.dac.apps.fnconfig.controller.DataAttributes
		*/
		onEditBtnPress: function () {
			var oView = this.getView(),oViewModel = oView.getModel("viewModel"),
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
				this.oAttributeDialog.attachAfterOpen(this._onDailogOnAfterShow, this);
				this.oAttributeDialog.open();
				
			}
			oView.getModel("viewModel").setProperty("/AttrNameEnabled", false);
		},
		/**
		 * Retrieves the reference to the current Form's elementes and stores it in the local variable `aFormElements`
		 * If the first element field is enabled, focus on it; otherwise, focus on the second element field.
		 * @param {sap.ui.base.Event} oEvent 
		 * @private
		 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
		 */
		_onDailogOnAfterShow:function(oEvent){
			var oDailog = oEvent.getSource(),
			oForm = oDailog.getContent()[0].getAggregation("form"),
			aFormElements = oForm.getAggregation("formContainers")[0].getAggregation("formElements");
			if(aFormElements[0].getAggregation("fields")[0].getEnabled()){
				aFormElements[0].getAggregation("fields")[0].focus();
			}else{
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
		onTableUpdateFinished:function(oEvent){
			var oTable = oEvent.getSource();
			oTable.removeSelections(true);
		},
		
		/** Event handler for Button Full Screen
		 *  Retrieves the reference to the current view and stores it in the local variable `oView`
		 *  Set the `layout` property of the view model(named=`layoutMode`) to `MidColumnFullScreen`.
		 *  Set the `FullScreen` property of the view model (named=`viewModel`) to `false` and `ExitFullScreen` to `true`
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
		 */
		handleFullScreen: function () {
			var oView = this.getView();
			oView.getModel("layoutMode").setProperty("/layout", "MidColumnFullScreen");
			oView.getModel("viewModel").setProperty("/FullScreen", false);
			oView.getModel("viewModel").setProperty("/ExitFullScreen", true);
		},

		
		/** Event handler for Button Exit Full Screen
		 *  Retrieves the reference to the current view and stores it in the local variable `oView`
		 *  Set the `layout` property of the view model(named=`layoutMode`) to `TwoColumnsMidExpanded`.
		 *  Set the `FullScreen` property of the view model (named=`viewModel`) to `true` and `ExitFullScreen` to `false`
		 * @public
		 * @memberOf pl.dac.apps.fnconfig.controller.BaseController
		 */
		handleExitFullScreen: function () {
			var oView = this.getView();
			oView.getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
			oView.getModel("viewModel").setProperty("/FullScreen", true);
			oView.getModel("viewModel").setProperty("/ExitFullScreen", false);
		},
		/** ###### POLICY INFORCEMENT POINT */
		onEditPolicyEnforcementBtnPress: function () {
			var oView = this.getView(),
			oSelectedContextData = oView.getModel("viewModel").getProperty("/SelectedContextData");
			oSelectedContextData.IsActive = oSelectedContextData.IsActive=="X"?true:false;
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
				this.oPolicyInforcementDialog.attachAfterOpen(this._onPolicyEnforcementDialogOnAfterShow, this);
			}
			oView.getModel("viewModel").setProperty("/PolicyNameEnabled", false);
		},
		onAddPolicyEnforcementBtnPress: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/Data", { Policy: "", PolicyResult: "", IsActive: false });

			if (!this.oPolicyInforcementDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "pl.dac.apps.fnconfig.fragments.DialogPolicyInforcement", // Path to your fragment
					controller: this // Assign the current controller
				}).then(function (oDialog) {
					this.oPolicyInforcementDialog = oDialog;
					oView.addDependent(oDialog); // Add dialog as dependent of the view
					oDialog.open();
				}.bind(this));
			} else {
				this.oPolicyInforcementDialog.open();
			}
		},
		_onPolicyEnforcementDialogOnAfterShow:function(oEvent){
			var oDailog = oEvent.getSource(),
			oForm = oDailog.getContent()[0].getAggregation("form"),
			aFormElements = oForm.getAggregation("formContainers")[0].getAggregation("formElements");
			if(aFormElements[0].getAggregation("fields")[0].getEnabled()){
				aFormElements[0].getAggregation("fields")[0].focus();
			}else{
				aFormElements[2].getAggregation("fields")[0].focus();
			}
			
		},
		onSavePolicyInforcement:function(){

		},
		onCloseDialogPolicyInforcement:function(){
			if (this.oPolicyInforcementDialog) {
				this.oPolicyInforcementDialog.close();
			}
		},
		onBeforeRebindTable: function (oEvent) {
			var mBindingParams = oEvent.getParameter("bindingParams");
			mBindingParams.parameters["expand"] = "to_Policy"; 
		}

    });
  }
);
