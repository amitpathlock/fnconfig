
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
		/**
		 * Controller initialization lifecycle hook.
		 * 
		 * @public
		 * @override
		 * @returns {void}
		 * 
		 * @description
		 * This method is automatically called when the controller is instantiated and performs initial setup:
		 * - Retrieves the router instance from the owner component
		 * - Attaches the _onRouteMatched handler to the "DataRestriction" route's pattern matched event
		 * - Adds an additional button to the policy enforcement table toolbar by calling addAddintionButtonIntoThePolicyEnforcementTableToolbar
		 * 
		 * @example
		 * /// Automatically called by the UI5 framework during controller instantiation
		 */
		onInit: function () {
			this.setMaskingPatternVisibility(false);
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("DataRestriction").attachPatternMatched(this._onRouteMatched, this);
			this.addAdditionalButtonIntoThePolicyEnforcementTableToolbar(this.getView().byId("idSmartTablePOPRestriction"));
		},
		onBeforePEPDataRestrictionExport: function (oEvent) {
			var mExportSettings = oEvent.getParameter("exportSettings");

			var aColumns = mExportSettings.workbook.columns;

			// Define your desired order by column 'property' or 'label'
			var aDesiredOrder = ["to_Policy/PolicyName", "to_Policy/PolicyDesc", "IsActive", "PolicyResult"];
			var aReorderedColumns = [];
			aDesiredOrder.forEach(function (sProperty) {
				var oColumn = aColumns.find(function (oCol) {
					return oCol.property === sProperty;
				});
				if (oColumn) {
					aReorderedColumns.push(oColumn);
				}
			});

			// Add any other columns that are part of the original export but not in the specific order
			// (optional, depending on your requirement)

			// Assign the newly ordered array back to the export configuration
			mExportSettings.workbook.columns = aReorderedColumns
			// Check if the configuration and columns exist
			if (mExportSettings && mExportSettings.workbook.columns) {
				// Iterate over the columns and change the label property
				mExportSettings.workbook.columns.forEach(function (oColumn) {
					// Use a switch statement or if/else if to target specific properties
					switch (oColumn.property) {
						case "to_Policy/PolicyDesc":
							oColumn.label = "Policy Description"; // Set the new column name
							oColumn.width =27;
							break;
						case "to_Policy/PolicyName":
							oColumn.width =27;
						// Add more cases as needed for other columns
					}
				});
			}
		},
		/**
		 * Route matched event handler for the DataRestriction route.
		 * 
		 * @private
		 * @returns {void}
		 * 
		 * @description
		 * This method initializes the view when the DataRestriction route is matched by:
		 * - Retrieving the i18n resource bundle for localized text
		 * - Creating and setting a JSON view model with initial UI state properties including:
		 *   - Labels for policy name and description
		 *   - Icon and title for the page
		 *   - Button enable/disable states (Edit, Delete)
		 *   - Error state properties
		 *   - Sort order and visibility flags
		 *   - Selected context data placeholder
		 * - Hiding the busy indicator
		 * - Storing a reference to the policy enforcement table
		 * 
		 * @fires sap.ui.core.routing.Route#patternMatched
		 * 
		 * @example
		 * // Automatically invoked when navigating to DataRestriction route
		 * this._oRouter.getRoute("DataRestriction").attachPatternMatched(this._onRouteMatched, this);
		 */
		_onRouteMatched: function () {
			var oView = this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();
			this.getView().setModel(new JSONModel(
				{
					Name: oBundle.getText("lblPolicyName"),
					Description: oBundle.getText("lblDescription"),
					Icon: "sap-icon://shield",
					Title: oBundle.getText("titPolInforcementDataRestriction"),
					PlaceHolder: "",
					EditButtonEnabled: false,
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
					VisibleAttribute: false
				}
			), "viewModel");
			sap.ui.core.BusyIndicator.hide();
			//this.oPolicyEnforcementTable = oView.byId("idTableDataRestrictionEnforcement");
		},
	

		/**
		 * Event handler triggered when a link is pressed in the table to view assigned attributes.
		 * 
		 * @public
		 * @param {sap.ui.base.Event} oEvent - The event object from the pressed link
		 * @returns {void}
		 * 
		 * @description
		 * This method opens a popover displaying assigned attributes for a policy by:
		 * - Retrieving the event source button and custom data (context and policy info)
		 * - Extracting the policy name from custom data and adding it to the context object
		 * - Loading the AssignedAttrPopver fragment if not already loaded
		 * - Loading policy attribute data via _loadPopOverData method
		 * - Opening the popover anchored to the pressed button
		 * - Reusing the existing popover instance if already created
		 * 
		 * @example
		 * /// Triggered when user clicks on assigned attributes link in the table
		 * /// <Link press=".onPressLink" customData="...">
		 */
		onPressLink: function (oEvent) {
			this._oButton = oEvent.getSource();
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
					//this._oPopover.openBy(this._oButton);
				}.bind(this));
			} else {
				sap.ui.getCore().byId("idAssignedAttribures").setBusy(true);
				this._loadPopOverData(oCtx);

			}
		},
		/**
		 * Loads and displays assigned attribute data for a policy in the popover.
		 * 
		 * @private
		 * @param {object} oCtx - The context object containing policy information
		 * @param {string} oCtx.Policy - The policy identifier to load attributes for
		 * @param {string} oCtx.PolicyName - The policy name to display in the popover
		 * @returns {void}
		 * 
		 * @description
		 * This method retrieves assigned attributes for a specific policy by:
		 * - Constructing the OData path for the DataRestrictionEnforcementSet entity
		 * - Reading the entity with expanded to_Attr navigation property
		 * - Creating a JSON model with the policy name and attribute items
		 * - Setting the model on the popover as "popOverModel"
		 * - Logging errors if the read operation fails
		 * 
		 * @example
		 * this._loadPopOverData({
		 *   Policy: "POLICY001",
		 *   PolicyName: "Data Restriction Policy"
		 * });
		 */
		_loadPopOverData: function (oCtx) {
			var oModel = this.getView().getModel(), sPath;
			sPath = "/DataRestrictionEnforcementSet(Policy='" + oCtx.Policy + "')";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "to_Attr,to_Policy" // Expand to_ActionItem
				},
				success: function (oData) {
					sap.ui.getCore().byId("idAssignedAttribures").setBusy(false);
					if(this._oPopover.getModel("popOverModel")){
						this._oPopover.getModel("popOverModel").setData({ PolicyName: oCtx.PolicyName, PolicyDesc: oData.to_Policy.PolicyDesc, items: oData.to_Attr.results });
					}else{
						this._oPopover.setModel(new JSONModel({ PolicyName: oCtx.PolicyName, PolicyDesc: oData.to_Policy.PolicyDesc, items: oData.to_Attr.results }), "popOverModel");
					}
					this._oPopover.openBy(this._oButton);
				}.bind(this),
				error: function (oError) {
					Log.error("Error reading policy details:" + oError);
				}
			});
		},
		
		onAfterCloseAssignedAttributePopOver:function(){
			this._oPopover.destroy();
			this._oPopover=null;
		},
		/**
		 * Lifecycle hook called after the controller's view is rendered.
		 * 
		 * @public
		 * @override
		 * @returns {void}
		 * 
		 * @description
		 * This method is automatically invoked after the view has been rendered and ensures
		 * the busy indicator is hidden to prevent unnecessary loading overlays from remaining visible.
		 * 
		 * @example
		 * /// Automatically called by the UI5 framework after view rendering
		 */
		onAfterRendering: function () {
			sap.ui.core.BusyIndicator.hide();
		}
	});
});