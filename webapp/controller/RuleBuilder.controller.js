
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
		_onRouteMatched: function (oEvent) {
			var oView = this.getView();
			var oModel = new JSONModel({
				FullScreen: false,
				ExitFullScreen: true,
				ExitColumn: true,
				VisibleOK: true,
				ShowNoRecordFound: false,
				Title: "Expose Attribute",
				Icon: "/assets/expose-attribute.svg",
				AttrErrorState: "None",
				AttrErrorMessage: "",
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
			this._sPolicyName = oEvent.getParameter("arguments").PolicyName;
			oView.setModel(oModel, "viewModel");
			this.getView().setModel(new JSONModel({ types: [] }), "ruleModel");
			this._loadOperatorModel();
			this._readPolicyRulesDetails(this._sPolicyName);
			this._loadReadOnlyPolicyRuleFragment();
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
						press: this.onDeleteExposeAttributeInlineButtonPress.bind(this)
					})
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
		_loadOperatorModel: function () {
			var sPathOperator, oModelOperator = new JSONModel(), oModelRangeOperator = new JSONModel();
			sPathOperator = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/Operators.json");
			oModelOperator.loadData(sPathOperator);
			this.getView().setModel(oModelOperator, "Operators");

			sPathOperator = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/OperatorsRange.json");
			oModelRangeOperator.loadData(sPathOperator);
			this.getView().setModel(oModelRangeOperator, "OperatorsRange");
		},
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
						RuleModelHandler.prepareRuleModel(oView, oData.to_Condition.results)
					} else {
						oViewModel.setProperty("/ShowNoRecordFound", true);
						oView.setModel(new JSONModel({ types: [] }), "ruleModel");
					}

				},
				error: function (oError) {
					Log.error("Read failed:" + oError);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		_loadReadOnlyPolicyRuleFragment: function () {
			var oView = this.getView(), oSubSection = oView.byId("idRuleSubSectionBlock");
			if (this._oDisplayRules) {
				this._oDisplayRules.destroy();
				this._oDisplayRules = null;
			}
			if (!this._oDisplayRules) {
				// Load the fragment asynchronously
				Fragment.load({
					id: this.getView().getId(), // Optional: Assign an ID to the fragment's controls
					name: "pl.dac.apps.fnconfig.fragments.DisplayPolicyRules", // Path to the fragment file
					controller: this // Pass the current controller for event handling
				}).then(function (oDisplayRules) {
					this._oDisplayRules = oDisplayRules;
					oSubSection.removeAllBlocks();
					oSubSection.addBlock(this._oDisplayRules);
				}.bind(this));
			} else {
				oSubSection.removeAllBlocks();
				oSubSection.addBlock(this._oDisplayRules);
			}
		},

		onPressAddConditionBtn: function (oEvent) {
			RuleModelHandler.insertConditonInConditionBlock(this.getView(), oEvent.getSource());
		},

		onPressDeleteSingleRowRule: function (oEvent) {

			RuleModelHandler.deleteInlineRule(this.getView(), oEvent.getSource());
		},
		onButtonPressDeleteRuleMain: function (oEvent) {
			RuleModelHandler.deleteEntireRuleBlock(this.getView(), oEvent.getSource());
		},

		onSuggestionItemSelected: function (oEvent) {

			RuleModelHandler.updateRuleModelWithSuggestionItem(this.getView(), oEvent.getSource(), oEvent.getParameter("selectedItem"));

		},
		
		onAttributeValueHelpRequested: function (oEvent) {
			var oView = this.getView(), oInput = oEvent.getSource(), oColAttryName,
				oColAttrDesc, oModel = new JSONModel(oInput.getCustomData()[0].getValue()),
				that = this;
			// oSearchField = new SearchField({
			// 	liveChange: function (oEvent) {
			// 		var sValue = oEvent.getParameter("newValue");
			// 		var oFilter = new Filter("name", FilterOperator.Contains, sValue);
			// 		this._oVHDialogAttr.getTable().getBinding("items").filter([oFilter]);
			// 	}.bind(this)
			// });
			if (!this._oVHDialogAttr) {
				this._oVHDialogAttr = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.AttributeVH", this);
				oView.addDependent(this._oVHDialogAttr);
			//	this._oVHDialogAttr.setFilterBar(oSearchField);
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
		onValueHelpCancelPress: function () {
			this._oVHDialogAttr.close();
		},
		onValueDialogOkPress: function () {
			var oView = this.getView(), aCondition, j, oRuleModel, i, sValuesRanges = "", aValues = [], aValueRanges, sKey = "";
			var oData = this._oDialogSelection.getModel("setting").getData();
			if (oData.Values.length > 0) {
				aValueRanges = this._oDialogSelection.getContent()[0].getModel("SingleValues").getData();
				sKey = "Values";
				for (i = 0; i < aValueRanges.length; i++) {
					if (aValueRanges[i].Value && aValueRanges[i].Value.trim() != "") {
						if (aValueRanges[i].Operator.trim() == "") {
							aValueRanges[i].Operator = "EQ";
						}
						aValues.push(aValueRanges[i]);
					}
				}
				sValuesRanges = aValues.map(oValue => oValue.Value).join(', ');
			}
			if (oData.ValueRange.length > 0) {
				aValueRanges = this._oDialogSelection.getContent()[0].getModel("Ranges").getData();
				sKey = "ValueRange";
				for (i = 0; i < aValueRanges.length; i++) {
					if (aValueRanges[i].Lower.trim() != "" && aValueRanges[i].Upper.trim() != "") {
						aValueRanges[i].Operator = "BT";
						aValues.push(aValueRanges[i]);
					}
				}
				for (i = 0; i < aValues.length; i++) {
					sValuesRanges += aValues[i].Lower + " to " + aValues[i].Upper;
					if (i < aValues.length - 1) {
						sValuesRanges += ", ";
					}
				}
			}
			oRuleModel = oView.getModel("ruleModel").getData();
			if (oData.RuleType == "Precondition") {
				aCondition = oRuleModel.types[0].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID === oData.CondId) {
						for (j = 0; j < aCondition[i].Rules.length; j++) {
							if (aCondition[i].Rules[j].Rows == oData.Rows) {
								aCondition[i].Rules[j][sKey] = aValues;
								aCondition[i].Rules[j].Value = sValuesRanges;//aValues.map(oValue => oValue.Value).join(', ') // aValues[0].Value;
								aCondition[i].Rules[j].ValueDesc = sValuesRanges;///aValues.map(oValue => oValue.Value).join(', ');//aValues[0].Value;
								break;
							}
						}
					}
				}
				oRuleModel.types[0].Condition = aCondition;
			} else {
				aCondition = oRuleModel.types[1].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID === oData.CTypeID) {
						for (j = 0; j < aCondition[i].Rules.length; j++) {
							if (aCondition[i].Rules[j].Rows == oData.Rows) {
								aCondition[i].Rules[j][sKey] = aValues;
								aCondition[i].Rules[j].Value = sValuesRanges;// aValues.map(oValue => oValue.Value).join(', ')//aValues[0].Value;
								aCondition[i].Rules[j].ValueDesc = sValuesRanges;// aValues.map(oValue => oValue.Value).join(', ')//aValues[0].Value;
								break;
							}
						}
					}
				}
				oRuleModel.types[1].Condition = aCondition;
			}
			oView.getModel("ruleModel").setData(oRuleModel);
			oView.getModel("ruleModel").refresh();
			this._oDialogSelection.close();
		},
		onAttributeValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oVHDialogAttr.close();
			RuleModelHandler.updateRuleModelWithValueHelpItem(this.getView(), aTokens[0], this._oVHDialogAttr);
		},
		onShowValueDialog: function (oEvent) {
			var oView = this.getView(), oInput = oEvent.getSource(), oUserAttributeTable, oListTable, aValues, i;
			var oCustomData = oInput.getCustomData()[0].getValue();
			if (oCustomData.Attribute.trim() == "") {
				MessageToast.show("Please choose any attributes to continue.");
				oInput.getParent().getItems()[0].focus();
				return;
			}
			if (oCustomData.Operator.trim() == "") {
				MessageToast.show("Please choose any operator to continue.");
				oInput.getParent().getItems()[1].focus();
				return;
			}
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
					if (!({}).hasOwnProperty.call(oCustomData, "ValueRange")) {
						oCustomData["ValueRange"] = new Array();
					}
					if (!({}).hasOwnProperty.call(oCustomData, "Values")) {
						oCustomData["Values"] = new Array();
					}
					if (oCustomData.Operator == "BT") {
						aValues = oCustomData.ValueDesc.split(",");
						for (i = 0; i < aValues.length; i++) {
							oCustomData["ValueRange"].push({ Operator: oCustomData.Operator, Lower: aValues[i].split("to")[0], Upper: aValues[i].split("to")[1] })
						}
					} else {

						oCustomData["Values"] = new Array();
						aValues = oCustomData.ValueDesc.split(",");
						for (i = 0; i < aValues.length; i++) {
							oCustomData["Values"].push({ Operator: oCustomData.Operator, Value: aValues[i] });
						}

					}
					if (oCustomData.Values.length > 0) {
						RuleModelHandler.loadSingleValueModel(oDialog, oSettingModel, oCustomData);
					}
					if (oCustomData.ValueRange.length > 0) {
						RuleModelHandler.loadValueRangeModel(oDialog, oSettingModel, oCustomData);
					}
				}.bind(this));
			} else {
				if (!({}).hasOwnProperty.call(oCustomData, "ValueRange")) {
					oCustomData["ValueRange"] = new Array();
				}
				if (!({}).hasOwnProperty.call(oCustomData, "Values")) {
					oCustomData["Values"] = new Array();
				}
				if (oCustomData.Operator == "BT") {
					aValues = oCustomData.ValueDesc.split(",");
					for (i = 0; i < aValues.length; i++) {
						oCustomData["ValueRange"].push({ Operator: oCustomData.Operator, Lower: aValues[i].split("to")[0], Upper: aValues[i].split("to")[1] })
					}
				} else {

					oCustomData["Values"] = new Array();
					aValues = oCustomData.ValueDesc.split(",");
					for (i = 0; i < aValues.length; i++) {
						oCustomData["Values"].push({ Operator: oCustomData.Operator, Value: aValues[i] });
					}

				}


				if (oCustomData.ValueRange.length > 0) {
					RuleModelHandler.loadValueRangeModel(this._oDialogSelection, oSettingModel, oCustomData);
				}
				if (oCustomData.Values.length > 0) {
					RuleModelHandler.loadSingleValueModel(this._oDialogSelection, oSettingModel, oCustomData);
				}
			}
		},
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
		onDeleteExposeAttributeInlineButtonPress: function (oEvent) {
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
		onBeforeExposeAttributeDialogOpened: function (oEvent) {
			var oDialog = oEvent.getSource(),
				oMultiInput = oDialog.getContent()[0].getAggregation("form").getFormContainers()[0].getFormElements()[1].getFields()[0];
			oMultiInput.setValue("");
			oMultiInput.removeAllTokens();
		},
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
		onExponseAttributeVHRequested: function () {
			var oView = this.getView(), oColAttrName,
				oColAttrDesc,
				that = this;
			if (!this._oVHDialogAttribute) {
				this._oVHDialogAttribute = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.VHAttribute", this);
				oView.addDependent(this._oVHDialogAttribute);
				this._oVHDialogAttribute.setRangeKeyFields([{
					label: "Description",
					key: "AttributeId",
					type: "string"
				}]);
				this._oVHDialogAttribute.getTableAsync().then(function (oTable) {
					oTable.setModel(oView.getModel());
					oTable.setSelectionMode("Single");
					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/AttrSet",
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
							path: "/AttrSet",
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
		onValueHelpAttributeOkPress: function (oEvent) {

			var oMultiInput, oValue, aTokens = oEvent.getParameter("tokens"), oView = this.getView();
			oMultiInput = this._oExposeAttributeDialog.getContent()[0].getAggregation("form").getFormContainers()[0].getFormElements()[1].getFields()[0];
			oValue = aTokens[0].getCustomData()[0].getValue();
			oView.getModel("viewModel").setProperty("/Data/AttributeId", oValue.AttributeId);
			oView.getModel("viewModel").refresh();
			this._oVHDialogAttribute.close();
			this.validateAttibuteInput(aTokens[0].getKey(), oMultiInput);
		},
		onValueHelpAttributeCancelPress: function () {

			this._oVHDialogAttribute.close();
		},
		onExposeAttrSuggestionItemSelected: function (oEvent) {
			var oCtx = oEvent.getParameter("selectedRow").getBindingContext().getObject();
			this.validateAttibuteInput(oCtx.AttributeId, oEvent.getSource());
		},
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
		onPressCloseDialogExposeAttribute: function () {
			var oView = this.getView(), oViewModelData = oView.getModel("viewModel").getData();
			oViewModelData.AttrErrorState = "None";
			oViewModelData.AttrErrorMessage = "";
			oViewModelData.Data.AttributeId = "";
			oView.getModel("viewModel").setData(oViewModelData);
			this._oExposeAttributeDialog.close();
		},
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
		_selectUserTableData: function (sAttributeId) {
			var aItems, oItemData, iItem, oTable = this._oDialogSelection.getContent()[0].getAggregation("sections")[2].getItems()[0];
			aItems = oTable.getItems();
			if (aItems.length > 0) {
				for (iItem = 0; iItem < aItems.length; iItem++) {
					oItemData = aItems[iItem].getBindingContext();
					if (oItemData.getProperty("AttributeId") == sAttributeId) {
						oTable.setSelectedItem(aItems[iItem], true);
						oTable.setSelectIndex
						aItems[iItem].focus();
						break;
					}
				}
			}

		},

		onPressAddRowInValues: function () {
			this._oDialogSelection.getContent()[0].addRowInValues();
		},
		onPressAddRowInRanges: function () {
			this._oDialogSelection.getContent()[0].addRowInRanges();
		},
		onCloseValueDialog: function () {
			this._oDialogSelection.close();
		},
		onPressUserAttributeItem: function (oEvent) {
			var oView = this.getView();
			var oSelectedItemData = oEvent.getSource().getBindingContext().getObject();
			var oData = this._oDialogSelection.getModel("setting").getData();
			this._oDialogSelection.close();
			var oRuleData = oView.getModel("ruleModel").getData();
			var i, aCondition, j;
			if (oData.RuleType == "Precondition") {
				aCondition = oRuleData.types[0].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID == oData.CondId) {
						for (j = 0; j < aCondition[i].Rules.length; j++) {
							if (aCondition[i].Rules[j].Rows == oData.Rows) {
								if (oSelectedItemData.AttributeId) {
									aCondition[i].Rules[j].Value = oSelectedItemData.AttributeId;
									aCondition[i].Rules[j].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.AttributeId + ")";
									aCondition[i].Rules[j].Values = [{ Operator: "EQ", Value: oSelectedItemData.AttributeId }];
									aCondition[i].Rules[j].ValueRange = [];
								} else {
									aCondition[i].Rules[j].Value = oSelectedItemData.ListId;
									aCondition[i].Rules[j].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.ListId + ")";
									aCondition[i].Rules[j].Values = [{ Operator: "EQ", Value: oSelectedItemData.ListId }];
									aCondition[i].Rules[j].ValueRange = [];
								}

								break;
							}
						}
					}
				}
				oRuleData.types[0].Condition = aCondition;
			} else {
				aCondition = oRuleData.types[1].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID == oData.CTypeID) {
						for (j = 0; j < aCondition[i].Rules.length; j++) {
							if (aCondition[i].Rules[j].Rows == oData.Rows) {
								if (oSelectedItemData.AttributeId) {
									aCondition[i].Rules[j].Value = oSelectedItemData.AttributeId;
									aCondition[i].Rules[j].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.AttributeId + ")";
									aCondition[i].Rules[j].ValueRange = [];
									aCondition[i].Rules[j].Values = [{ Operator: "EQ", Value: oSelectedItemData.AttributeId }];

								} else {
									aCondition[i].Rules[j].Value = oSelectedItemData.ListId;
									aCondition[i].Rules[j].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.ListId + ")";
									aCondition[i].Rules[j].ValueRange = [];
									aCondition[i].Rules[j].Values = [{ Operator: "EQ", Value: oSelectedItemData.ListId }];

								}
								break;
							}
						}
					}
				}
				oRuleData.types[1].Condition = aCondition;
			}
			oView.getModel("ruleModel").setData(oRuleData);

		},


		handleFullScreen: function () {
			var oView = this.getView();
			oView.getModel("viewModel").setProperty("/FullScreen", false);
			oView.getModel("viewModel").setProperty("/ExitFullScreen", true);
			oView.getModel("layoutMode").setProperty("/layout", "EndColumnFullScreen");
		},
		handleExitFullScreen: function () {
			var oView = this.getView();
			oView.getModel("layoutMode").setProperty("/layout", "ThreeColumnsEndExpanded");
			oView.getModel("viewModel").setProperty("/FullScreen", true);
			oView.getModel("viewModel").setProperty("/ExitFullScreen", false);
			if (!this.getOwnerComponent().getModel("routeModel").getProperty("/PolicyRoute")) {
				this._oRouter.navTo("Policies");
			}

		},
		//
		onObjectPageCloseButtonPressed: function () {
			this.getView().getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
			this._oRouter.navTo("Policies");
		},
		onButtonPressAddRuleMain: function (oEvent) {
			RuleModelHandler.insertRuleInBlock(this.getView(), oEvent.getSource());
		},
		onPressEditRuleBtn: function () {
			var oView = this.getView(), oSubSection = oView.byId("idRuleSubSectionBlock"),
				oRuleData = oView.getModel("ruleModel").getData(),
				oEmptyRuleModel, oEmptyPrecondition, oEmptyRule;

			//	oView.byId("saveRuleBtn").setVisible(true);
			if (oRuleData.types.length == 0) {
				oEmptyRuleModel = new JSONModel();
				oEmptyRuleModel.attachRequestCompleted(function () {
					oView.getModel("ruleModel").setData(oEmptyRuleModel.getData());
					//oView.getModel("ruleModel").setData(oRuleData);
				});
				oEmptyRuleModel.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/EmptyRuleModel.json"));

			}
			if (oRuleData.types[0] && oRuleData.types[0].RuleType != "Precondition") {
				oEmptyPrecondition = new JSONModel();
				oEmptyPrecondition.attachRequestCompleted(function () {
					oRuleData.types.unshift(oEmptyPrecondition.getData());
					oView.getModel("ruleModel").setData(oRuleData);
				});
				oEmptyPrecondition.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/EmptyPrecondition.json"));
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
			//oView.getModel("ruleModel").setData(oRuleData);
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

		onPressSaveRuleBtn: function () {
			var oView = this.getView(), oDataModel = oView.getModel(),
				oRuleData = oView.getModel("ruleModel").getData(), oPayload;
			oPayload = RuleModelHandler.prepareRuleCreatePayload(oView, oRuleData.types);
			oPayload.Policy = this._sPolicyName;
			oDataModel.create("/PolRuleSet", oPayload, {
				success: function () {
					MessageToast.show("Rule has been update!");
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