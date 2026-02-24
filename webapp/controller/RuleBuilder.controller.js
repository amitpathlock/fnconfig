
sap.ui.define([
	"pl/dac/apps/fnconfig/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/table/Column",
	"sap/m/Column",
	"sap/m/Text",
	"sap/m/Label",
	"sap/m/ColumnListItem",
	"pl/dac/apps/fnconfig/formatter/PLDACFormatter",
	"sap/m/MessageToast",
	"pl/dac/apps/fnconfig/control/Rule",
	"sap/base/Log",
	"sap/m/ObjectIdentifier",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"pl/dac/apps/fnconfig/helper/RuleModelHandler",
	"sap/m/Token",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/m/MessageBox",
	"sap/m/OverflowToolbarButton"
], function (
	BaseController,
	JSONModel,
	Fragment,
	UIColumn,
	Column,
	Text,
	Label,
	ColumnListItem,
	PLDACFormatter,
	MessageToast,
	Rule,
	Log,
	ObjectIdentifier,
	Filter,
	FilterOperator,
	RuleModelHandler,
	Token,
	PlDacConst,
	MessageBox,
	OverflowToolbarButton
) {
	"use strict";

	return BaseController.extend("pl.dac.apps.fnconfig.controller.RuleBuilder", {
		formatter: PLDACFormatter,
		bRuleDataUpdate: false,
		/**
		 * Controller initialization lifecycle hook.
		 * Initializes the router and attaches the pattern matched event handler for the "PolicyRules" route.
		 * 
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 */
		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("PolicyRules").attachPatternMatched(this._onRouteMatched, this);
		},
		/**
		 * Handles the route match event for "PolicyRules".
		 *
		 * When the route is triggered, this method:
		 * - Binds the view to the selected policy.
		 * - Initializes view models for UI state and rule data.
		 * - Loads operators and policy rule details.
		 * - Prepares the UI for full screen layout.
		 * - Binds the exposed attributes table to the selected policy.
		 *
		 * @param {sap.ui.base.Event} oEvent - The route matched event.
		 * @private
		 */
		_onRouteMatched: function (oEvent) {
			var oView = this.getView();
			var oModel = new JSONModel({
				FullScreen: false,
				ExitFullScreen: true,
				ExitColumn: true,
				VisibleOK: true,
				ShowNoRecordFound: false,
				Title: "Expose Attribute",
				Icon: jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/assets/expose-attribute.svg"),
				AttrErrorState: "None",
				AttrErrorMessage: "",
				DisplayRuleBtnIcon: "",
				DisplayRuleBtnText: "",
				bVisibleAddPreBlock: false,
				bVisibleAddRuleBlock: false,
				bVisibleAddCondition: false,
				Data: {
					Policy: "",
					PolicyToken: "Policy test(POl_TEST)",
					AttributeId: "",
					AttributeToken: ""
				}
			});
			var sPath = this.getView().getModel().createKey("/PolicySet", {
				Policy: oEvent.getParameter("arguments").PolicyName
			});
			oView.bindElement({
				path: sPath,
				parameters: {
				}

			});
			var oRuleModel = new JSONModel({ types: [] });
			oView.setModel(oRuleModel, "ruleModel");
			this._sPolicyName = oEvent.getParameter("arguments").PolicyName;
			oView.setModel(oModel, "viewModel");
			this.getView().setModel(new JSONModel({ types: [] }), "ruleModel");
			this._loadOperatorModel();
			this._readPolicyRulesDetails(this._sPolicyName);

			//this.onPressEditRuleBtn();
			if (this._oDialogSelection && this._oDialogSelection.getContent() && this._oDialogSelection.getContent()[0]) {

				if (oView.getModel("SingleValues")) {
					oView.getModel("SingleValues").setData([]);
				}
				if (oView.getModel("Ranges")) {
					oView.getModel("Ranges").setData([]);
				}

			}

			this.handleFullScreen();
			var oTable = oView.byId("idExposeAttributeTable");
			var oColumnListItemTemplate = new ColumnListItem({
				cells: [
					new ObjectIdentifier({ title: "{AttributeId}" }), // Bind text to the 'firstName' property
					new Text({ text: "{Description}" }),
					new OverflowToolbarButton({
						icon: "sap-icon://delete",
						type: "Reject",
						tooltip: "Delete Entry",
						press: this._onDeleteExposeAttributeInlineButtonPress.bind(this)
					}).addStyleClass("plDacRuleButtonFontSize")
				]
			});
			var oPolicy = new Filter("Policy", FilterOperator.EQ, this._sPolicyName);
			var aFilters = [oPolicy]
			oTable.bindAggregation("items", {
				path: "/ExposeAttrSet", // The main entity set
				template: oColumnListItemTemplate,
				filters: aFilters
			});

		},

		/**
		 * Loads operator configuration models from local JSON files.
		 *
		 * These models provide the list of available operators
		 * for values and ranges in rule conditions.
		 *
		 * @private
		 */
		_loadOperatorModel: function () {
			var sPathOperator, oModelOperator = new JSONModel(), oModelRangeOperator = new JSONModel();
			sPathOperator = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/Operators.json");
			oModelOperator.loadData(sPathOperator);
			this.getView().setModel(oModelOperator, "Operators");

			sPathOperator = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/OperatorsRange.json");
			oModelRangeOperator.loadData(sPathOperator);
			this.getView().setModel(oModelRangeOperator, "OperatorsRange");
		},
		/**
		 * Reads policy rule details from the backend.
		 *
		 * Calls OData to fetch all rules and conditions for the given policy.
		 * On success:
		 * - Prepares the rule model using RuleModelHandler
		 * - Loads the read-only rule view fragment
		 * On failure:
		 * - Logs the error and hides the busy indicator.
		 *
		 * @param {string} sPolicyName - The policy name to load rules for.
		 * @private
		 */
		_readPolicyRulesDetails: function (sPolicyName) {
			var oView = this.getView(), oViewModel = oView.getModel("viewModel"),
				oDataModel = oView.getModel(),
				sPath = "/PolRuleSet('" + sPolicyName + "')";
			oDataModel.read(sPath, {
				urlParameters: {
					"$expand": "to_Condition/to_Rule/to_Value,to_Condition/to_Rule/to_Value/to_ValueRange" // Expand to_Condition/to_Rule/to_Value
				},
				success: function (oData) {
					if (oData.to_Condition.results.length > 0) {
						oViewModel.setProperty("/ShowNoRecordFound", false);
						oViewModel.setProperty("/DisplayRuleBtnIcon", "sap-icon://edit");
						oViewModel.setProperty("/DisplayRuleBtnText", "Edit Rule");
						RuleModelHandler.prepareRuleModel(oView, oData.to_Condition.results);
						this._loadReadOnlyPolicyRuleFragment();
					} else {
						oViewModel.setProperty("/DisplayRuleBtnIcon", "sap-icon://add");
						oViewModel.setProperty("/DisplayRuleBtnText", "Add Rule");
						oViewModel.setProperty("/ShowNoRecordFound", true);
						oView.getModel("ruleModel").setData({ types: [] });
						this._loadReadOnlyPolicyRuleFragment();
					}

				}.bind(this),
				error: function (oError) {
					Log.error("Read failed:" + oError);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		/**
		 * Loads the read-only rule display fragment.
		 *
		 * Removes any existing blocks in the rule section and adds a
		 * read-only view generated by RuleModelHandler based on the current rule model.
		 *
		 * @private
		 */
		_loadReadOnlyPolicyRuleFragment: function () {
			var oView = this.getView(), aTypes, oSubSection = oView.byId("idRuleSubSectionBlock");

			oSubSection.removeAllBlocks();
			aTypes = oView.getModel("ruleModel").getData().types;
			aTypes = aTypes ? aTypes : [];
			oSubSection.addBlock(new sap.m.VBox({ height: "300px" }));
			oSubSection.addBlock(RuleModelHandler.createDiplayRuleReadOnly(aTypes, oView));

		},
		/**
		 * Adds a new condition block to the rule.
		 *
		 * Delegates the creation logic to RuleModelHandler and passes
		 * the current view and button source.
		 *
		 * @param {sap.ui.base.Event} oEvent - Event triggered by Add Condition button.
		 * @public
		 */
		onPressAddConditionBtn: function (oEvent) {
			RuleModelHandler.insertConditonInConditionBlock(this.getView(), oEvent.getSource());
		},

		/**
		 * Deletes a single rule row from the current condition.
		 *
		 * Delegates deletion logic to RuleModelHandler.
		 *
		 * @param {sap.ui.base.Event} oEvent - Event triggered by delete button.
		 * @public
		 */
		onPressDeleteSingleRowRule: function (oEvent) {

			RuleModelHandler.deleteInlineRule(this.getView(), oEvent.getSource());
		},

		/**
		 * Deletes the entire rule block.
		 *
		 * Delegates the deletion to RuleModelHandler which removes
		 * the complete rule from the model.
		 *
		 * @param {sap.ui.base.Event} oEvent - Event triggered by delete button.
		 * @public
		 */
		onButtonPressDeleteRuleMain: function (oEvent) {
			RuleModelHandler.deleteEntireRuleBlock(this.getView(), oEvent.getSource());
		},

		/**
		 * Handles selection from suggestion list.
		 *
		 * Updates the rule model with the selected suggestion value
		 * to ensure the rule condition is updated correctly.
		 *
		 * @param {sap.ui.base.Event} oEvent - Suggestion select event.
		 * @public
		 */
		onSuggestionItemSelected: function (oEvent) {

			RuleModelHandler.updateRuleModelWithSuggestionItem(this.getView(), oEvent.getSource(), oEvent.getParameter("selectedItem"));

		},

		/**
		 * Opens the Attribute Value Help dialog when the user requests it.
		 *
		 * This method initializes and configures the value help dialog for selecting
		 * user attributes. It sets up the dialog model, binds the OData attribute
		 * list to the table, and configures the table columns depending on the
		 * device type (desktop/table vs mobile). If the dialog is already created,
		 * it simply updates the model and reopens it.
		 *
		 * @param {sap.ui.base.Event} oEvent - The value help request event from the input field.
		 * @public
		 * @returns {void}
		 */
		onAttributeValueHelpRequested: function (oEvent) {
			var oView = this.getView(), oFilterBar, oInput = oEvent.getSource(), oColAttryName,
				oColAttrDesc, oModel = new JSONModel(oInput.getCustomData()[0].getValue()),
				that = this;
			oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				// filterContainerWidth: "10rem",
				search: function (oEvent) {
					// 4. Implement Search Logic
					var sSearchValue = oEvent.getParameter("selectionSet")[0].getValue();
					if (sSearchValue) {
						var oFilter = new sap.ui.model.Filter("AttributeId", sap.ui.model.FilterOperator.Contains, sSearchValue.toUpperCase());
						that._oVHDialogAttr.getTable().getBinding("rows").filter([oFilter]);
					} else {
						that._oVHDialogAttr.getTable().getBinding("rows").filter([]);
					}

				}
			}).addStyleClass("plDacVHFilter");
			oFilterBar.addFilterGroupItem(new sap.ui.comp.filterbar.FilterGroupItem({
				groupName: "G1",
				name: "Search",
				label: "Search",
				control: new sap.m.SearchField({
					placeholder: "Search for...",
					search: function (oEvent) {
						var sSearchValue = oEvent.getParameter("query");
						if (sSearchValue) {
							var oFilter = new sap.ui.model.Filter("AttributeId", sap.ui.model.FilterOperator.Contains, sSearchValue.toUpperCase());
							that._oVHDialogAttr.getTable().getBinding("rows").filter([oFilter]);
						} else {
							that._oVHDialogAttr.getTable().getBinding("rows").filter([]);
						}

					}
				})
			}));

			if (!this._oVHDialogAttr) {
				this._oVHDialogAttr = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.AttributeVH", this);
				oView.addDependent(this._oVHDialogAttr);
				
				this._oVHDialogAttr.setModel(oModel, "condition");
				// Set key fields for filtering in the Define Conditions Tab
				this._oVHDialogAttr.setRangeKeyFields([{
					label: "Description",
					key: "AttributeId",
					type: "string"
				}]);

				this._oVHDialogAttr.getTableAsync().then(function (oTable) {
					oTable.setModel(oView.getModel());
					oTable.setSelectionMode("Single");
					that._oVHDialogAttr.setFilterBar(oFilterBar);
					that._oVHDialogAttr.setSupportMultiselect(false);
					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/AttrSet",
							events: {
								dataReceived: function () {
									that._oVHDialogAttr.update();
								}
							}
						});
						oColAttryName = new UIColumn({ label: new Label({ text: "Attribute Name" }), template: new Text({ wrapping: false, text: "{AttributeId}" }) });
						oColAttryName.data({
							fieldName: "{AttributeId}"
						});
						oTable.addColumn(oColAttryName);

						oColAttrDesc = new UIColumn({ label: new Label({ text: "Description" }), template: new Text({ wrapping: false, text: "{Description}" }) });
						oColAttrDesc.data({
							fieldName: "Description"
						});
						oTable.addColumn(oColAttrDesc);
					}
					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/AttrSet",
							template: new ColumnListItem({
								cells: [new Label({ text: "{AttributeId}" }), new Label({ text: "{Description}" })]
							}),
							events: {
								dataReceived: function () {
									that._oVHDialogAttr.update();
								}
							}
						});
						oTable.addColumn(new Column({ header: new Label({ text: "Attribute Name" }) }));
						oTable.addColumn(new Column({ header: new Label({ text: "Description" }) }));
					}
					that._oVHDialogAttr.update();
				});
				this._oVHDialogAttr.open();

			} else {
				this._oVHDialogAttr.setModel(oModel, "condition");
				this._oVHDialogAttr.open();
			}
		},
		/**
		 * Handles the cancel action in the Attribute Value Help dialog.
		 *
		 * Simply closes the dialog without applying any selection or changes.
		 *
		 * @public
		 * @returns {void}
		 */
		onValueHelpCancelPress: function () {
			this._oVHDialogAttr.close();
		},

		/**
		 * Confirms the value selection and updates the rule model.
		 *
		 * Reads the selected values/ranges from the dialog and
		 * updates the rule model using RuleModelHandler.
		 *
		 * @public
		 */
		onValueDialogOkPress: function () {
			RuleModelHandler.updateRuleModelWithValueAndRangesSelectionData(this._oDialogSelection, this.getView());
		},

		/**
		 * Handles the confirmation of the Attribute Value Help dialog.
		 *
		 * This method retrieves the selected token from the dialog,
		 * closes the dialog, and updates the rule model with the selected
		 * attribute value using the RuleModelHandler.
		 *
		 * @param {sap.ui.base.Event} oEvent - The event fired when the user presses OK in the value help dialog.
		 * @public
		 * @returns {void}
		 */
		onAttributeValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oVHDialogAttr.close();
			RuleModelHandler.updateRuleModelWithValueHelpItem(this.getView(), aTokens[0], this._oVHDialogAttr);
		},
		/**
		 * Opens the value selection dialog based on operator type.
		 *
		 * Validates user selection for attribute and operator.
		 * Depending on operator type:
		 * - Shows value ranges for IN / BT
		 * - Shows user attributes for others
		 *
		 * Loads required models and initial values for the dialog.
		 *
		 * @param {sap.ui.base.Event} oEvent - Event triggered by pressing the value field.
		 * @public
		 */

		onShowValueDialog: function (oEvent) {
			var oView = this.getView(), oInput = oEvent.getSource(), oUserAttributeTable, oListTable;
			var oCustomData = oInput.getCustomData()[0].getValue();
			if (oCustomData.Attribute.trim() == "") {
				MessageToast.show("Please choose any attributes to continue.");
				oInput.getParent().getItems()[0].focus();
				return;
			}
			// if (oCustomData.Operator.trim() == "") {
			// 	MessageToast.show("Please choose any operator to continue.");
			// 	oInput.getParent().getItems()[1].focus();
			// 	return;
			// }
			if (!Array.isArray(oCustomData.ValueRange) && oCustomData.Value == "" && oCustomData.ValueDesc != "") {
				oCustomData.ValueRange.Operator = oCustomData.Operator;
				oCustomData.Value = oCustomData.ValueDesc;
				oCustomData.ValueRange.Value = oCustomData.Value;
			}
			var oSettingModel = new JSONModel(oCustomData);
			if (oSettingModel.getData().Operator == "IN") {
				oView.getModel("viewModel").setProperty("/DialogTitle", "Define Value Ranges");
				oView.getModel("viewModel").setProperty("/DialogIcon", "sap-icon://list");
				oView.getModel("viewModel").setProperty("/VisibleOK", true);
			} else if (oSettingModel.getData().Operator == "BT") {
				oView.getModel("viewModel").setProperty("/VisibleOK", true);
			} else {
				oView.getModel("viewModel").setProperty("/DialogTitle", "User Attributes");
				oView.getModel("viewModel").setProperty("/DialogIcon", "sap-icon://person-placeholder");
				oView.getModel("viewModel").setProperty("/VisibleOK", false);
			}
			if (!this._oDialogSelection) {
				Fragment.load({
					name: "pl.dac.apps.fnconfig.fragments.VHDialogSelection",
					controller: this
				}).then(function (oDialog) {
					this._oDialogSelection = oDialog;
					oView.addDependent(this._oDialogSelection);
					this._oDialogSelection.setModel(oSettingModel, "setting");
					oUserAttributeTable = this._oDialogSelection.getContent()[0].getAggregation("sections")[2].getItems()[0];
					oUserAttributeTable.addEventDelegate(this._userAttributeTableEventDelegate, this);
					oListTable = this._oDialogSelection.getContent()[0].getAggregation("sections")[3].getItems()[0];
					oListTable.addEventDelegate(this._listTableEventDelegate, this);
					RuleModelHandler.loadInitialModelValues(oCustomData);
					RuleModelHandler.loadValueRangeModel(oDialog, oSettingModel, oCustomData);
					RuleModelHandler.loadSingleValueModel(oDialog, oSettingModel, oCustomData);
				}.bind(this));
			} else {
				RuleModelHandler.loadInitialModelValues(oCustomData);
				RuleModelHandler.loadValueRangeModel(this._oDialogSelection, oSettingModel, oCustomData);
				RuleModelHandler.loadSingleValueModel(this._oDialogSelection, oSettingModel, oCustomData);
			}
		},

		/**
		 * Opens the dialog to add a new exposed attribute.
		 *
		 * This method prepares the view model with the current policy details,
		 * clears any previous validation errors, and resets the attribute input.
		 * It then loads the dialog fragment asynchronously (if not already loaded)
		 * and opens the dialog for the user to add a new attribute.
		 *
		 * @public
		 * @returns {void}
		 */
		onPressAddExposeAttribute: function () {
			var oView = this.getView(), oViewModel = oView.getModel("viewModel");
			oViewModel.setProperty("/Data/Policy", oView.getBindingContext().getProperty("Policy"));
			oViewModel.setProperty("/Data/PolicyToken", oView.getBindingContext().getProperty("PolicyDesc") + " (" + oView.getBindingContext().getProperty("Policy") + ")");
			oViewModel.setProperty("AttrErrorState", "None");
			oViewModel.setProperty("AttrErrorMessage", "");
			oViewModel.setProperty("/Data/AttributeId", "");

			if (!this._oExposeAttributeDialog) {
				Fragment.load({
					name: "pl.dac.apps.fnconfig.fragments.DialogExposeAttribute",
					controller: this
				}).then(function (oDialog) {
					this._oExposeAttributeDialog = oDialog;
					oView.addDependent(this._oExposeAttributeDialog);
					this._oExposeAttributeDialog.open();
				}.bind(this));
			} else {
				this._oExposeAttributeDialog.open();
			}
		},

		/**
		 * Handles the inline delete button press for an exposed attribute entry.
		 *
		 * Shows a confirmation dialog to the user. If the user confirms the deletion,
		 * the selected entry is removed via `_removeSelectedRecord`.
		 *
		 * @private
		 * @param {sap.ui.base.Event} oEvent - The press event triggered by the delete button.
		 * @returns {void}
		 */
		_onDeleteExposeAttributeInlineButtonPress: function (oEvent) {
			var that = this, oBundle = this.getView().getModel("i18n").getResourceBundle(),
				oEntry = oEvent.getSource().getBindingContext().getObject();
			MessageBox.warning(oBundle.getText("msgDeleteConfirmation"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				styleClass: "PlDacMessageBox",
				onClose: function (sAction) {
					if (sAction == "OK") {
						that._removeSelectedRecord(oEntry);
					}
				}
			});
		},

		/**
		 * Deletes the selected exposed attribute entry from the backend.
		 *
		 * Constructs the OData entity path using the Policy and AttributeId from the
		 * provided entry and calls the OData model's `remove` method.
		 *
		 * On success:
		 *   - Shows a success message to the user.
		 *   - Refreshes the OData model to update the UI.
		 *
		 * On error:
		 *   - Logs the error.
		 *   - Displays the error message using `displayErrorMessage`.
		 *
		 * @private
		 * @param {Object} oEntry - The exposed attribute entry to delete.
		 * @param {string} oEntry.Policy - Policy key of the entry.
		 * @param {string} oEntry.AttributeId - AttributeId key of the entry.
		 * @returns {void}
		 */
		_removeSelectedRecord: function (oEntry) {
			var oView = this.getView(), oBundle = oView.getModel("i18n").getResourceBundle(),
				oDataModel = oView.getModel(), sPath;
			sPath = PlDacConst.ENTITY_SET_EXPOSE_ATTRIBUTES + "(Policy='" + oEntry.Policy + "',AttributeId='" + oEntry.AttributeId + "')";
			oDataModel.remove(sPath, {
				success: function () {
					MessageBox.success(oBundle.getText("msgExposeAttributeDeleteSuccefully", [oEntry.AttributeId]), { styleClass: "PlDacMessageBox" });
					oDataModel.refresh();
				},
				error: function (oError) {
					Log.error(oBundle.getText("msgDAErrorInDelete") + oError);
					this.displayErrorMessage(oError);
				}.bind(this)
			});
		},

		/**
		 * Event handler executed just before the "Expose Attribute" dialog is opened.
		 *
		 * This method resets the dialog input state by clearing any existing text
		 * and removing all tokens from the MultiInput control.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onBeforeExposeAttributeDialogOpened
		 * @param {sap.ui.base.Event} oEvent - The event object triggered by the dialog open.
		 * @param {0} oEvent.getSource() - The dialog instance being opened.
		 * @returns {void}
		 */
		onBeforeExposeAttributeDialogOpened: function (oEvent) {
			var oDialog = oEvent.getSource(),
				oMultiInput = oDialog.getContent()[0].getAggregation("form").getFormContainers()[0].getFormElements()[1].getFields()[0];
			oMultiInput.setValue("");
			oMultiInput.removeAllTokens();
		},

		/**
		 * Handles changes in the Expose Attribute input field.
		 *
		 * This method performs validation and normalizes the input value:
		 *   - Converts the entered value to uppercase.
		 *   - Clears previous error states.
		 *   - If the value length is greater than 6, it triggers server-side validation.
		 *   - Otherwise, it marks the input as invalid and shows the appropriate error message.
		 *
		 * @param {*} oEvent - The input change event.
		 * @param {string} oEvent.getParameter("newValue") - The new value entered by the user.
		 * @returns {void}
		 */
		onExposeAttributeInputChange: function (oEvent) {
			var oBundle, oView = this.getView(), sNewValue = oEvent.getParameter("newValue"), oViewModel = oView.getModel("viewModel"),
				oInput = oEvent.getSource();
			oBundle = oView.getModel("i18n").getResourceBundle();
			oViewModel.setProperty("/AttrErrorState", "None");
			oViewModel.setProperty("/AttrErrorMessage", "");
			oInput.setValue(oInput.getValue().toUpperCase());
			if (sNewValue.length > 6) {
				this.validateAttibuteInput(sNewValue, oInput);
			} else {
				oViewModel.setProperty("/Data/AttributeId", "");
				oViewModel.setProperty("/AttrErrorState", "Error");
				if (sNewValue.length == 0) {
					oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameMandatory"));
				} else {
					oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameInvalid"));
				}
			}
		},
		/**
		 * Event handler for token updates in the Expose Attribute MultiInput field.
		 *
		 * This method responds to token add/remove actions and updates the view model's
		 * error state accordingly.
		 *
		 * - When a token is removed:
		 *   - Sets error state to "Error".
		 *   - Displays a mandatory attribute error message.
		 *   - Focuses the MultiInput control to prompt user input.
		 *
		 * - When a token is added:
		 *   - Clears any previous error state and message.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onExposeAttributeTokenUpdated
		 * @param {*} oEvent - Token update event object.
		 * @param {string} oEvent.getParameter("type") - Type of token change ("added" or "removed").
		 * @returns {void}
		 */
		onExposeAttributeTokenUpdated: function (oEvent) {
			var oBundle, oView = this.getView(), oViewModel = oView.getModel("viewModel"),
				oMultiInput = this._oExposeAttributeDialog.getContent()[0].getAggregation("form").getFormContainers()[0].getFormElements()[1].getFields()[0];
			if (oEvent.getParameter("type") == "removed") {
				oBundle = oView.getModel("i18n").getResourceBundle();
				oViewModel.setProperty("/AttrErrorState", "Error");
				oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameMandatory"));
				oMultiInput.focus();
			}
			if (oEvent.getParameter("type") == "added") {
				oViewModel.setProperty("/AttrErrorState", "None");
				oViewModel.setProperty("/AttrErrorMessage", "");
			}
		},
		/**
		 * Handles the "Value Help" request for the Expose Attribute input field.
		 *
		 * This method is triggered when the user clicks the value help icon in the
		 * Expose Attribute MultiInput field. It opens a Value Help dialog that lists
		 * available attributes from the OData service (`/AttrSet`).
		 *
		 * If the dialog is not already created, it will:
		 *   1. Instantiate the Value Help dialog fragment (`VHAttribute`).
		 *   2. Attach the dialog to the view as a dependent to ensure proper lifecycle management.
		 *   3. Configure search/filter behavior using `setRangeKeyFields` so the user can search
		 *      by AttributeId.
		 *   4. Dynamically bind the attribute table to the `AttrSet` OData entity set.
		 *   5. Create and add table columns depending on the device type:
		 *      - Desktop/tablet: `sap.ui.table.Table` with `bindRows`
		 *      - Mobile: `sap.m.Table` with `bindItems`
		 *   6. Update the dialog once data is loaded (`dataReceived` event).
		 *
		 * Once the dialog is created, it is opened. If it already exists, it is simply opened again.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onExponseAttributeVHRequested
		 * @returns {void}
		 */
		onExponseAttributeVHRequested: function () {
			var oView = this.getView(), oColAttrName, oFilterBar,
				oColAttrDesc,
				that = this;
			oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				// filterContainerWidth: "10rem",
				search: function (oEvent) {
					// 4. Implement Search Logic
					var sSearchValue = oEvent.getParameter("selectionSet")[0].getValue();
					if (sSearchValue) {
						var oFilter = new sap.ui.model.Filter("AttributeId", sap.ui.model.FilterOperator.Contains, sSearchValue.toUpperCase());
						that._oVHDialogAttribute.getTable().getBinding("rows").filter([oFilter]);
					} else {
						that._oVHDialogAttribute.getTable().getBinding("rows").filter([]);
					}

				}
			}).addStyleClass("plDacVHFilter");
			oFilterBar.addFilterGroupItem(new sap.ui.comp.filterbar.FilterGroupItem({
				groupName: "G1",
				name: "Search",
				label: "Search",
				control: new sap.m.SearchField({
					placeholder: "Search for...",
					search: function (oEvent) {
						var sSearchValue = oEvent.getParameter("query");
						if (sSearchValue) {
							var oFilter = new sap.ui.model.Filter("AttributeId", sap.ui.model.FilterOperator.Contains, sSearchValue.toUpperCase());
							that._oVHDialogAttribute.getTable().getBinding("rows").filter([oFilter]);
						} else {
							that._oVHDialogAttribute.getTable().getBinding("rows").filter([]);
						}
					}
				})
			}));
			if (!this._oVHDialogAttribute) {
				this._oVHDialogAttribute = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.VHAttribute", this);
				oView.addDependent(this._oVHDialogAttribute);
				this._oVHDialogAttribute.setRangeKeyFields([{
					label: "Description",
					key: "AttributeId",
					type: "string"
				}]);
				this._oVHDialogAttribute.getTableAsync().then(function (oTable) {
					that._oVHDialogAttribute.setFilterBar(oFilterBar);
					oTable.setModel(oView.getModel());
					oTable.setSelectionMode("Single");
					that._oVHDialogAttribute.setSupportMultiselect(false);
					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/DataAttrSet",
							events: {
								dataReceived: function () {
									that._oVHDialogAttribute.update();
								}
							}
						});
						oColAttrName = new UIColumn({ label: new Label({ text: "Attribute Name" }), template: new Text({ wrapping: false, text: "{AttributeId}" }) });
						oColAttrName.data({
							fieldName: "{AttributeId}"
						});
						oTable.addColumn(oColAttrName);

						oColAttrDesc = new UIColumn({ label: new Label({ text: "Description" }), template: new Text({ wrapping: false, text: "{Description}" }) });
						oColAttrDesc.data({
							fieldName: "Description"
						});
						oTable.addColumn(oColAttrDesc);
					}
					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/DataAttrSet",
							template: new ColumnListItem({
								cells: [new Label({ text: "{AttributeId}" }), new Label({ text: "{Description}" })]
							}),
							events: {
								dataReceived: function () {
									that._oVHDialogAttribute.update();
								}
							}
						});
						oTable.addColumn(new Column({ header: new Label({ text: "Attribute Name" }) }));
						oTable.addColumn(new Column({ header: new Label({ text: "Description" }) }));
					}
					that._oVHDialogAttribute.update();
				});
				this._oVHDialogAttribute.open();
			} else {

				this._oVHDialogAttribute.open();
			}
		},
		/**
		 * Handles the confirmation action from the Attribute Value Help dialog.
		 *
		 * This event is triggered when the user selects an attribute and presses the "OK"
		 * button in the Value Help dialog.
		 *
		 * The method performs the following actions:
		 *   1. Retrieves the selected token from the dialog event.
		 *   2. Extracts the selected attribute data from the token's custom data.
		 *   3. Updates the view model's "/Data/AttributeId" property with the selected AttributeId.
		 *   4. Refreshes the view model to propagate changes to the UI.
		 *   5. Closes the Value Help dialog.
		 *   6. Validates the selected attribute by calling validateAttibuteInput() to ensure
		 *      the attribute exists and to update the MultiInput field with a formatted token.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onValueHelpAttributeOkPress
		 * @param {*} oEvent - Event object fired from the Value Help dialog.
		 * @param {*} oEvent.getParameter("tokens") - Array of selected tokens.
		 * @returns {void}
		 */
		onValueHelpAttributeOkPress: function (oEvent) {

			var oMultiInput, oValue, aTokens = oEvent.getParameter("tokens"), oView = this.getView();
			oMultiInput = this._oExposeAttributeDialog.getContent()[0].getAggregation("form").getFormContainers()[0].getFormElements()[1].getFields()[0];
			oValue = aTokens[0].getCustomData()[0].getValue();
			oView.getModel("viewModel").setProperty("/Data/AttributeId", oValue.AttributeId);
			oView.getModel("viewModel").refresh();
			this._oVHDialogAttribute.close();
			this.validateAttibuteInput(aTokens[0].getKey(), oMultiInput);
		},

		/**
		 * Handles the cancel action from the Attribute Value Help dialog.
		 *
		 * This method closes the attribute Value Help dialog without making any changes
		 * to the input field or the view model. It is typically triggered when the user
		 * presses the "Cancel" button in the dialog.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onValueHelpAttributeCancelPress
		 * @returns {void}
		 */
		onValueHelpAttributeCancelPress: function () {

			this._oVHDialogAttribute.close();
		},
		/**
		 * Event handler for selection of an item from the Expose Attribute suggestion list.
		 *
		 * When the user selects a suggestion, this method retrieves the selected row's
		 * binding context, extracts the `AttributeId`, and triggers validation.
		 * The validation ensures the attribute exists and updates the MultiInput control
		 * with a properly formatted token.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onExposeAttrSuggestionItemSelected
		 * @param {*} oEvent - The event object fired when a suggestion is selected.
		 * @param {*} oEvent.getParameter("selectedRow") - The selected suggestion row.
		 * @returns {void}
		 */
		onExposeAttrSuggestionItemSelected: function (oEvent) {
			var oCtx = oEvent.getParameter("selectedRow").getBindingContext().getObject();
			this.validateAttibuteInput(oCtx.AttributeId, oEvent.getSource());
		},

		/**
		 * Validates whether the provided attribute exists in the backend.
		 *
		 * This method checks the entered attribute value against the OData service by
		 * reading the `/AttrSet('<ATTRIBUTE>')` entity. If the attribute is found:
		 *   - the MultiInput is cleared and updated with a token showing the attribute and description
		 *   - the view model error state is cleared
		 *   - the selected AttributeId is stored in the view model
		 *
		 * If the attribute is not found, it sets an error state and displays an error
		 * message from the i18n bundle.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function validateAttibuteInput
		 * @param {string} sAttribute - Attribute value entered by the user.
		 * @param {sap.m.MultiInput} oMultiInput - Input control that will be updated with token.
		 * @returns {void}
		 */
		validateAttibuteInput: function (sAttribute, oMultiInput) {
			var oBundle, oView = this.getView(), oDataModel = oView.getModel(),
				oViewModel = oView.getModel("viewModel"),
				sPath = "/AttrSet('" + sAttribute.toUpperCase() + "')";
			oViewModel.setProperty("/Data/AttributeId", sAttribute);
			oBundle = oView.getModel("i18n").getResourceBundle();
			oDataModel.read(sPath, {
				// Success callback function
				success: function (oData) {
					if (oData.AttributeId) {
						oMultiInput.removeAllTokens();
						oMultiInput.setValue("");
						oMultiInput.setTokens([new Token({ key: sAttribute, text: sAttribute.toUpperCase() + " (" + oData.Description + ")" })]);
						oViewModel.setProperty("/AttrErrorState", "None");
						oViewModel.setProperty("/AttrErrorMessage", "");
						oViewModel.setProperty("/Data/AttributeId", oData.AttributeId);

					} else {
						oViewModel.setProperty("/AttrErrorState", "Error");
						oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNotFound", [sAttribute]));
					}
				}.bind(this),
				// Error callback function
				error: function () {//
					// oError contains details about the error
					oViewModel.setProperty("/AttrErrorState", "Error");
					oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNotFound", [sAttribute]));

				}
			});
		},

		/**
		 * Handles the "Save" action from the Expose Attribute dialog.
		 *
		 * This method validates the entered attribute and ensures it is not empty or invalid.
		 * It performs the following steps:
		 *   1. Retrieves the input control and current dialog data from the view model.
		 *   2. Validates that AttributeId is provided and not empty.
		 *   3. Displays an error message if validation fails and sets focus back to the input.
		 *   4. If validation passes, it calls `_checkForDuplicateEntry` to verify that the
		 *      attribute is not already exposed for the selected policy.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onPressSaveDialogExposeAttribute
		 * @returns {void}
		 */
		onPressSaveDialogExposeAttribute: function () {
			var oBundle, oMultiInput, oView = this.getView(), oViewModel = oView.getModel("viewModel"), oEntry;
			oMultiInput = this._oExposeAttributeDialog.getContent()[0].getAggregation("form").getFormContainers()[0].getFormElements()[1].getFields()[0]
			//oDataModel = oView.getModel();
			oBundle = oView.getModel("i18n").getResourceBundle();
			oEntry = oViewModel.getProperty("/Data");
			if (oEntry.AttributeId != "" && oEntry.Policy != "") {
				oViewModel.setProperty("/AttrErrorState", "None");
			}
			if (oViewModel.getProperty("/Data/AttributeId") == "" || oViewModel.getProperty("/AttrErrorState") == "Error") {
				oViewModel.setProperty("/AttrErrorState", "Error");
				oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorAttributeNameMandatory"));
				oMultiInput.focus();
				return;
			} else {
				oViewModel.setProperty("/AttrErrorState", "None");
				oViewModel.setProperty("/AttrErrorMessage", "");
			}
			this._checkForDuplicateEntry(oEntry, oMultiInput);

		},
		/**
		 * Checks whether the selected attribute already exists for the selected policy.
		 *
		 * This method queries the backend OData service to ensure that the combination of
		 * Policy and AttributeId is unique. It prevents duplicate entries from being
		 * exposed for the same policy.
		 *
		 * The method performs the following actions:
		 *   1. Builds an OData filter using Policy and AttributeId.
		 *   2. Reads the Expose Attributes entity set with the combined filter.
		 *   3. If a record already exists:
		 *        - sets an error state in the view model
		 *        - displays a duplicate entry message
		 *        - focuses the MultiInput control
		 *   4. If no record exists:
		 *        - calls `_addExposeAttributeEntry` to create the new entry.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @private
		 * @function _checkForDuplicateEntry
		 * @param {Object} oEntry - Object containing the Policy and AttributeId to be added.
		 * @param {sap.m.MultiInput} oMultiInput - MultiInput control used for attribute entry.
		 * @returns {void}
		 */
		_checkForDuplicateEntry: function (oEntry, oMultiInput) {
			var oBundle, oDataModel, oViewModel, oView = this.getView(), oCombinedFilter,
				oAttribute = new Filter("AttributeId", FilterOperator.EQ, oEntry.AttributeId),
				oPolicy = new Filter("Policy", FilterOperator.EQ, oEntry.Policy);
			oDataModel = oView.getModel();
			oViewModel = oView.getModel("viewModel");
			oBundle = oView.getModel("i18n").getResourceBundle();

			oCombinedFilter = new Filter({
				filters: [oPolicy, oAttribute],
				and: true // all filters must be true (AND condition)
			});
			oDataModel.read(PlDacConst.ENTITY_SET_EXPOSE_ATTRIBUTES, {
				filters: [oCombinedFilter], // Pass the array of filters here
				success: function (oData) {
					if (oData.results && oData.results.length > 0) {
						oViewModel.setProperty("/AttrErrorState", "Error");
						oViewModel.setProperty("/AttrErrorMessage", oBundle.getText("msgErrorDuplicateEntryCombination", [oEntry.Policy + "~" + oEntry.AttributeId]));
						oMultiInput.focus();
						return;
					}
					this._addExposeAttributeEntry(oEntry);
					// Success handler: data.results contains the filtered data

				}.bind(this),
				error: function () {
					// Error handler
					//console.error(oError);
				}
			});
		},
		/**
		 * Creates a new Expose Attribute entry in the backend.
		 *
		 * This method sends a create request to the OData service to persist the selected
		 * attribute for the current policy. It performs the following steps:
		 *   1. Removes temporary UI tokens (PolicyToken and AttributeToken) from the entry object
		 *      before sending the payload to the backend.
		 *   2. Calls ODataModel.create() to add the record to the `ExposeAttributes` entity set.
		 *   3. On success:
		 *        - displays a success message with the attribute ID
		 *        - refreshes the model to update the UI list
		 *        - closes the Expose Attribute dialog
		 *   4. On error:
		 *        - logs the error
		 *        - closes the dialog
		 *        - displays an error message using `displayErrorMessage`
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @private
		 * @function _addExposeAttributeEntry
		 * @param {Object} oEntry - The Expose Attribute entry data containing Policy and AttributeId.
		 * @returns {void}
		 */
		_addExposeAttributeEntry: function (oEntry) {
			var oBundle, oView = this.getView(), oModel = oView.getModel(), sAttributeId;
			oBundle = oView.getModel("i18n").getResourceBundle();
			delete oEntry.PolicyToken;
			delete oEntry.AttributeToken;
			sAttributeId = oEntry.AttributeId;
			oModel.create(PlDacConst.ENTITY_SET_EXPOSE_ATTRIBUTES, oEntry, {
				success: function () {
					MessageBox.success(oBundle.getText("msgExposeAttrAddedSuccessfully", [sAttributeId]), { styleClass: "PlDacMessageBox" });
					oView.getModel().refresh();
					this._oExposeAttributeDialog.close();
				}.bind(this),
				error: function (oError) {
					Log.error(oBundle.getText("msgErrorInCreate") + oError);
					this._oExposeAttributeDialog.close();
					this.displayErrorMessage(oError);

				}.bind(this)
			});
		},

		/**
		 * Handles the close action of the Expose Attribute dialog.
		 *
		 * This method resets the dialog-related view model state and closes the dialog.
		 * It performs the following actions:
		 *   1. Clears any existing error state and error messages.
		 *   2. Resets the AttributeId field in the dialog data.
		 *   3. Updates the view model with the cleared data.
		 *   4. Closes the Expose Attribute dialog.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onPressCloseDialogExposeAttribute
		 * @returns {void}
		 */
		onPressCloseDialogExposeAttribute: function () {
			var oView = this.getView(), oViewModelData = oView.getModel("viewModel").getData();
			oViewModelData.AttrErrorState = "None";
			oViewModelData.AttrErrorMessage = "";
			oViewModelData.Data.AttributeId = "";
			oView.getModel("viewModel").setData(oViewModelData);
			this._oExposeAttributeDialog.close();
		},

		/**
		 * Event delegate used to handle post-rendering behavior of the User Attribute table.
		 *
		 * This delegate is attached to the table inside the dialog. After the table is
		 * rendered, it automatically selects the row that matches the current attribute
		 * value stored in the dialog settings model.
		 *
		 * The delegate performs the following actions:
		 *   1. Retrieves the "setting" model from the dialog to get the selected value.
		 *   2. Iterates through all items in the table.
		 *   3. Compares each row's AttributeId with the saved value.
		 *   4. If a match is found:
		 *        - selects the row programmatically
		 *        - sets focus to the matched row
		 *   5. Ensures that the table always reflects the currently selected value after rendering.
		 *
		 * This improves user experience by automatically highlighting the previously
		 * selected attribute when the dialog is opened or refreshed.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @private
		 * @name _userAttributeTableEventDelegate
		 * @property {function} onAfterRendering - Handler executed after the table is rendered.
		 */
		_userAttributeTableEventDelegate: {
			onAfterRendering: function (oEvent) {
				var aItems, iItem, oItemData, oCustomData, oItem;
				oCustomData = this._oDialogSelection.getModel("setting").getData();
				// This code runs after the input field is rendered and in the DOM
				aItems = oEvent.srcControl.getItems();
				if (aItems.length > 0) {
					for (iItem = 0; iItem < aItems.length; iItem++) {
						oItem = aItems[iItem];
						oItemData = oItem.getBindingContext();
						if (oItemData.getProperty("AttributeId") == oCustomData.Value) {
							oEvent.srcControl.setSelectedItem(oItem, true, true);
							oItem.focus();
							break;
						}
					}
				}
				// Handle keypress event
			}
		},

		/**
		 * Event delegate for handling the post-render behavior of the List table.
		 *
		 * This delegate is attached to the list table inside the dialog. After the table
		 * is rendered, it automatically selects the row that matches the current list
		 * value stored in the dialog settings model.
		 *
		 * The delegate performs the following actions:
		 *   1. Retrieves the current selection value from the dialog's "setting" model.
		 *   2. Iterates through all rows/items in the table.
		 *   3. Compares each row's ListId with the saved value.
		 *   4. If a match is found:
		 *        - selects the row programmatically
		 *        - sets focus to the matched row
		 *   5. Ensures that the table always reflects the currently selected list value
		 *      after rendering, improving UX when reopening the dialog.
		 *
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @private
		 * @name _listTableEventDelegate
		 * @property {function} onAfterRendering - Handler executed after the table is rendered.
		 */
		_listTableEventDelegate: {
			onAfterRendering: function (oEvent) {
				var aItems, iItem, oItemData, oCustomData, oItem;
				oCustomData = this._oDialogSelection.getModel("setting").getData();
				// This code runs after the input field is rendered and in the DOM
				aItems = oEvent.srcControl.getItems();
				if (aItems.length > 0) {
					for (iItem = 0; iItem < aItems.length; iItem++) {
						oItem = aItems[iItem];
						oItemData = oItem.getBindingContext();
						if (oItemData.getProperty("ListId") == oCustomData.Value) {
							oEvent.srcControl.setSelectedItem(oItem, true, true);
							oItem.focus();
							break;
						}
					}
				}
				// Handle keypress event
			}
		},
		/**
		 * Event handler triggered when the user presses the "Add Row" button
		 * in the Values dialog.
		 *
		 * This method delegates the action to the first content control
		 * of the selection dialog by firing the custom
		 * `addRowInSingleValue` event.
		 *
		 * @public
		 * @function onPressAddRowInValues
		 *
		 * @returns {void}
		 */
		onPressAddRowInValues: function () {
			this._oDialogSelection.getContent()[0].fireAddRowInSingleValue();
		},

		/**
		 * Event handler for adding a new single value row.
		 *
		 * This method retrieves the "SingleValues" model from the event source,
		 * appends a new empty value object to the model data array,
		 * and updates the model to reflect the changes.
		 *
		 * The new row contains:
		 *  - Operator: initialized with a blank space
		 *  - value: initialized as an empty string
		 *
		 * @public
		 * @function onAddRowInSingleValue
		 *
		 * @param {sap.ui.base.Event} oEvent - The event object triggered by
		 *                                      `addRowInSingleValue`.
		 * @returns {void}
		 */
		onAddRowInSingleValue: function (oEvent) {
			var oModel = oEvent.getSource().getModel("SingleValues");
			var aData = oModel.getData();
			aData.push({ Operator: " ", value: "" });
			oModel.setData(aData);

		},

		/**
		 * Event handler triggered when the user presses the "Add Row"
		 * button in the Value Ranges section of the dialog.
		 *
		 * This method delegates the action by firing the custom
		 * `addRowInValueRanges` event on the first content control
		 * of the selection dialog.
		 *
		 * @public
		 * @function onPressAddRowInRanges
		 *
		 * @returns {void}
		 */
		onPressAddRowInRanges: function () {
			this._oDialogSelection.getContent()[0].fireAddRowInValueRanges();
		},

		/**
		 * Event handler for adding a new value range row.
		 *
		 * This method retrieves the "Ranges" model from the event source,
		 * appends a new empty range object to the model data array,
		 * and updates the model to reflect the changes.
		 *
		 * The new row contains:
		 *  - Operator: initialized with a blank space
		 *  - Lower: initialized as an empty string (lower boundary)
		 *  - Upper: initialized as an empty string (upper boundary)
		 *
		 * @public
		 * @function onAddRowInValueRanges
		 *
		 * @param {sap.ui.base.Event} oEvent - The event object triggered by
		 *                                      `addRowInValueRanges`.
		 * @returns {void}
		 */
		onAddRowInValueRanges: function (oEvent) {
			var oModel = oEvent.getSource().getModel("Ranges");
			var oData = oModel.getData();
			oData.push({ Operator: " ", Lower: "", Upper: "" });
			oModel.setData(oData);

		},

		/**
		 * Closes the value selection dialog.
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onCloseValueDialog
		 * @returns {void}
		 */
		onCloseValueDialog: function () {
			this._oDialogSelection.close();
		},

		/**
		 * Handles the selection of a user attribute item.
		 *
		 * Retrieves the selected item's binding context data and updates
		 * the rule model accordingly using the RuleModelHandler.
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onPressUserAttributeItem
		 * @param {*} oEvent - The press event triggered by the user attribute item.
		 * @returns {void}
		 */
		onPressUserAttributeItem: function (oEvent) {
			var oSelectedItemData = oEvent.getSource()
				.getBindingContext()
				.getObject();

			RuleModelHandler.updateRuleModelWithUserAttrSelectionData(
				this.getView(),
				this._oDialogSelection,
				oSelectedItemData
			);
		},

		/**
		 * Handles switching the object page to full screen mode.
		 *
		 * Updates the view model flags controlling full screen visibility
		 * and sets the Flexible Column Layout to "EndColumnFullScreen".
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function handleFullScreen
		 * @returns {void}
		 */
		handleFullScreen: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/FullScreen", false);
			oView.getModel("viewModel").setProperty("/ExitFullScreen", true);
			oView.getModel("layoutMode").setProperty("/layout", "EndColumnFullScreen");
		},
		/**
		 * Handles the exit from full screen mode in the Flexible Column Layout.
		 *
		 * Updates the layout to "ThreeColumnsEndExpanded" and adjusts the
		 * view model properties controlling full screen state.
		 * If no policy route is defined in the "routeModel", navigates
		 * back to the "Policies" route.
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function handleExitFullScreen
		 * @returns {void}
		 */
		handleExitFullScreen: function () {
			var oView = this.getView();
			oView.getModel("layoutMode").setProperty("/layout", "ThreeColumnsEndExpanded");
			oView.getModel("viewModel").setProperty("/FullScreen", true);
			oView.getModel("viewModel").setProperty("/ExitFullScreen", false);
			if (!this.getOwnerComponent().getModel("routeModel").getProperty("/PolicyRoute")) {
				this._oRouter.navTo("Policies");
			}

		},
		/**
	 * Handles the close button press on the object page.
	 *
	 * Resets the Flexible Column Layout to "TwoColumnsMidExpanded"
	 * and navigates back to the "Policies" route.
	 *
	 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
	 * @public
	 * @function onObjectPageCloseButtonPressed
	 * @returns {void}
	 */
		onObjectPageCloseButtonPressed: function () {
			this.getView().getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
			this._oRouter.navTo("Policies");
		},
		/**
		 * Handles the action for adding a new main rule block.
		 *
		 * Delegates the rule insertion logic to the RuleModelHandler,
		 * passing the current view instance and the button source
		 * that triggered the event.
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onButtonPressAddRuleMain
		 * @param {sap.ui.base.Event} oEvent - The press event triggered by the button.
		 * @private
		 * @returns {void}
		 */
		onButtonPressAddRuleMain: function (oEvent) {
			RuleModelHandler.insertRuleInBlock(this.getView(), oEvent.getSource());
		},
		/**
		 * Handles the edit action for policy rules.
		 *
		 * Ensures that the rule model contains the required structure before
		 * switching the UI into edit mode:
		 * - If no rule types exist, loads an empty rule model.
		 * - If the first rule type is not a "Precondition", prepends an empty precondition.
		 * - If only a precondition exists, appends an empty rule.
		 *
		 * Afterwards, it destroys any existing edit fragment instance and
		 * asynchronously loads the "EditPolicyRules" fragment into the
		 * subsection block for editing.
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onPressEditRuleBtn
		 * @returns {void}
		 */
		onPressEditRuleBtn: function () {
			var oView = this.getView(), oSubSection = oView.byId("idRuleSubSectionBlock"),
				oRuleData = oView.getModel("ruleModel").getData(),
				oEmptyRuleModel, aTypes, iType, oEmptyRule, bPreCondition = false;
			if (({}).hasOwnProperty.call(oRuleData, "types") && oRuleData.types.length > 0) {
				this.bRuleDataUpdate = true;
			} else {
				this.bRuleDataUpdate = false;
			}
			oView.getModel("viewModel").setProperty("/bVisibleAddCondition", true);
			aTypes = oView.getModel("ruleModel").getData().types;
			for (iType = 0; iType < aTypes.length; iType++) {
				if (aTypes[iType].RuleType == "Precondition") {
					oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", false);
					oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", false)
					bPreCondition = true;
				}
				if (aTypes[iType].RuleType == "Rules") {
					oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", false);
				}
			}
			if (!bPreCondition) {
				oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", true);
			}
			if (oRuleData.types.length == 0) {
				oEmptyRuleModel = new JSONModel();
				oEmptyRuleModel.attachRequestCompleted(function () {
					oView.getModel("ruleModel").setData(oEmptyRuleModel.getData());
				});
				oEmptyRuleModel.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/EmptyRuleModel.json"));
			}
			if (oRuleData.types.length == 1 && oRuleData.types[0].RuleType == "Precondition") {
				oEmptyRule = new JSONModel();
				oEmptyRule.attachRequestCompleted(function () {
					oRuleData.types.push(oEmptyRule.getData());
					oView.getModel("ruleModel").setData(oRuleData);
				});
				oEmptyRule.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/EmptyRule.json"));
			}
			if (this._oEditRules) {
				this._oEditRules.destroy();
				this._oEditRules = null;
			}
			if (!this._oEditRules) {
				// Load the fragment asynchronously
				Fragment.load({
					id: this.getView().getId(), // Optional: Assign an ID to the fragment's controls
					name: "pl.dac.apps.fnconfig.fragments.EditPolicyRules", // Path to the fragment file
					controller: this // Pass the current controller for event handling
				}).then(function (oEditRules) {
					this._oEditRules = oEditRules;
					oSubSection.removeAllBlocks();
					oSubSection.addBlock(this._oEditRules);
				}.bind(this));
			} else {
				oSubSection.removeAllBlocks();
				oSubSection.addBlock(this._oEditRules);
			}
		},

		/**
		 * Event handler for the "Add Rule Block" button press.
		 *
		 * Loads an empty rule template from the application model (EmptyRule.json)
		 * and appends it to the existing ruleModel under the `/types` collection.
		 * After successfully adding the new rule block, the method updates the
		 * viewModel properties to control UI visibility:
		 *
		 * - Hides the "Add Rule Block" button
		 * - Shows the "Add Condition" section
		 *
		 * The rule template is loaded asynchronously. The rule block is added
		 * only after the JSON request has completed successfully.
		 *
		 * @function onPressAddRuleBlockBtn
		 * @memberof <YourControllerName>
		 * @public
		 * @returns {void}
		 */
		onPressAddRuleBlockBtn: function () {
			var oEmptyRuleModel, oView = this.getView(), oRuleData;
			oEmptyRuleModel = new JSONModel();
			oEmptyRuleModel.attachRequestCompleted(function () {
				oRuleData = oView.getModel("ruleModel").getData();
				oRuleData.types.push(oEmptyRuleModel.getData());
				oView.getModel("ruleModel").setData(oRuleData);
				oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", false);
				oView.getModel("viewModel").setProperty("/bVisibleAddCondition", true);
			});
			oEmptyRuleModel.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/EmptyRule.json"));
		},

		/**
		 * Event handler for the "Add Precondition Block" button press.
		 *
		 * This method creates a new JSONModel instance and asynchronously loads
		 * the precondition template from `EmptyPrecondition.json`.
		 *
		 * After the template is successfully loaded:
		 * - If no rule blocks exist (`types` array is empty), the precondition
		 *   block is added as the first entry using `push()`.
		 * - If rule blocks already exist, the precondition block is inserted
		 *   at the beginning of the `types` array using `unshift()`, ensuring
		 *   it appears before other rule blocks.
		 *
		 * The method then:
		 * - Hides the "Add Precondition Block" button by updating the `viewModel`
		 *   property `/bVisibleAddPreBlock`.
		 * - Updates the `ruleModel` with the modified rule data to refresh bindings.
		 *
		 * The operation is performed only after the JSON request completes
		 * successfully via the `requestCompleted` event.
		 *
		 * Dependencies:
		 * - ruleModel (JSONModel): Stores rule configuration data.
		 * - viewModel (JSONModel): Controls UI state and visibility.
		 *
		 * @function onPressAddPreConditionBlockBtn
		 * @memberof <YourControllerName>
		 * @public
		 * @this sap.ui.core.mvc.Controller
		 * @returns {void}
		 */
		onPressAddPreConditionBlockBtn: function () {
			var oEmptyModel, oView = this.getView(), oRuleData;
			oEmptyModel = new JSONModel();
			oEmptyModel.attachRequestCompleted(function () {
				oRuleData = oView.getModel("ruleModel").getData();
				if (oRuleData.types.length == 0) {
					oRuleData.types.push(oEmptyModel.getData());
				} else {
					oRuleData.types.unshift(oEmptyModel.getData());
				}
				oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", false);
				oView.getModel("ruleModel").setData(oRuleData);
			});
			oEmptyModel.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/EmptyPrecondition.json"));
		},
		/**
		 * Handles the save action for a policy rule.
		 *
		 * This function:
		 * 1. Retrieves the current view and OData model.
		 * 2. Collects rule data from the "ruleModel".
		 * 3. Prepares the payload for rule creation.
		 * 4. Sends a create request to the "/PolRuleSet" entity set.
		 * 5. On success:
		 *    - Displays a confirmation message.
		 *    - Reloads the policy rule details.
		 *    - Destroys the edit rules dialog/fragment.
		 *    - Loads the read-only policy rule fragment.
		 * 6. On error:
		 *    - Logs the error message.
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onPressSaveRuleBtn
		 * @returns {void}
		 */
		onPressSaveRuleBtn: function () {
			var oView = this.getView(), oDataModel = oView.getModel(),sMessage="",
				oRuleData = oView.getModel("ruleModel").getData(), oPayload;
			oPayload = RuleModelHandler.prepareRuleCreatePayload(oView, oRuleData.types);
			if (({}).hasOwnProperty.call(oPayload, "to_Condition") && oPayload.to_Condition.length == 0) {
				if (this.bRuleDataUpdate) {
					sMessage="The rule data has been deleted successfully.";
				} else {
					sMessage="No data has been provided for the save.";
				}
			}else{
				if (this.bRuleDataUpdate) {
					sMessage="The rule data has been successfully updated.";
				} else {
					sMessage="The rule data has been successfully created.";
				}
			}
			oPayload.Policy = this._sPolicyName;
			oDataModel.create("/PolRuleSet", oPayload, {
				success: function () {
					//if (this.bRuleDataUpdate) {
						MessageToast.show(sMessage);
					//} else {
					//	MessageToast.show("The rule data has been successfully created.");
					//}

					this._readPolicyRulesDetails(this.getView().getBindingContext().getObject().PolicyName);
					this._oEditRules.destroy();
					this._oEditRules = null;
					this._loadReadOnlyPolicyRuleFragment();

				}.bind(this),
				error: function (oError) {
					Log.error(oError.message)
				}
			});
		},
		/**
		 * Handles the cancel action for editing a policy rule.
		 *
		 * This function performs the following actions:
		 * 1. Reloads the policy rule details for the currently selected policy.
		 * 2. Destroys the edit rules dialog/fragment instance.
		 * 3. Resets the edit rules reference to null.
		 * 4. Loads the read-only policy rule fragment.
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 * @function onPressCancelRuleBtn
		 * @returns {void}
		 */
		onPressCancelRuleBtn: function () {
			this._readPolicyRulesDetails(this.getView().getBindingContext().getObject().PolicyName);
			this._oEditRules.destroy();
			this._oEditRules = null;
			this._loadReadOnlyPolicyRuleFragment();

		},
		/**
		 * Event handler triggered when the exposed attribute table completes its update.
		 * Updates the table header toolbar with the total count of items.
		 * 
		 * @param {*} oEvent - The update finished event object
		 * @param {*} oEvent.getSource() - The table/list that triggered the event
		 * @param {number} oEvent.getParameter("total") - The total number of items in the table
		 * @memberof pl.dac.apps.fnconfig.controller.RuleBuilder
		 * @public
		 */
		onExposedAttributeTableUpdateFinished: function (oEvent) {
			var oView = this.getView(), oBundle = oView.getModel("i18n").getResourceBundle();
			if (oEvent.getSource().getBinding("items").isLengthFinal()) {
				oEvent.getSource().getHeaderToolbar().getContent()[0].setText(oBundle.getText("titExposeAttribure", [oEvent.getParameter("total")]))
			}
		}

	});
});