sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"pl/dac/apps/fnconfig/helper/RuleBuilder",
	"sap/ui/core/Fragment",
	"sap/ui/table/Column",
	"sap/m/Column",
	"sap/m/Text",
	"sap/m/Label",
	"sap/m/ColumnListItem",
	"pl/dac/apps/fnconfig/formatter/PLDACFormatter",
	"sap/m/MessageToast",
	"pl/dac/apps/fnconfig/control/Rule",
	 "sap/base/Log"
], function (
	Controller, JSONModel, RuleBuilder, Fragment, UIColumn, Column, Text, Label, ColumnListItem, PLDACFormatter, MessageToast, 
	Rule,Log
) {
	"use strict";

	return Controller.extend("pl.dac.apps.fnconfig.controller.RuleBuilder", {
		formatter: PLDACFormatter,
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
				ShowNoRecordFound: false
			});
			var sPath = this.getView().getModel().createKey("/PolicySet", {
				Policy: oEvent.getParameter("arguments").PolicyName
			});
			oView.bindElement({
				path: sPath,
				parameters: {
				}

			});
			var sPolicyName = oEvent.getParameter("arguments").PolicyName;
			oView.setModel(oModel, "viewModel");
			oView.byId("editRuleBtn").setVisible(true);
			oView.byId("saveRuleBtn").setVisible(false);
			this.getView().setModel(new JSONModel({ types: [] }), "ruleModel");
			this._loadOperatorModel();
			this._readPolicyRulesDetails(sPolicyName);
			this._loadReadOnlyPolicyRuleFragment();
			var oModelSingleValues = new JSONModel();
			oModelSingleValues.attachRequestCompleted(function (oEvent) {
				oView.getModel("SingleValues").setData(oModelSingleValues.getData());
			});
			oModelSingleValues.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/SingleValues.json"));
			oView.setModel(oModelSingleValues, "SingleValues");
			this.handleFullScreen();

		},
		_loadOperatorModel: function () {
			var oModelOperator = new JSONModel();
			var sPathOperator = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/Operators.json");
			oModelOperator.loadData(sPathOperator);
			this.getView().setModel(oModelOperator, "Operators");
		},
		_readPolicyRulesDetails: function (sPolicyName) {
			var oView = this.getView(), that = this,
				oModel = oView.getModel(),
				sPath = "/PolicySet('" + sPolicyName + "')";
			oModel.read(sPath, {
				urlParameters: {
					"$expand": "to_Condition/to_Rule/to_Value" // Expand to_Condition/to_Rule/to_Value
				},
				success: function (oData) {
					if (oData.to_Condition.results.length > 0) {
						oView.getModel("viewModel").setProperty("/ShowNoRecordFound", false);
						//oView.byId("idNoRecordFindRuleBuilder").setVisible(false);
						that.loadRuleModel(oData.to_Condition.results);
					} else {
						oView.getModel("viewModel").setProperty("/ShowNoRecordFound", true);
						oView.setModel(new JSONModel({ types: [] }), "ruleModel");
					}

				},
				error: function (oError) {
					Log.error("Read failed:"+oError);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		loadRuleModel: function (aResults) {
			var iResult, oCondition, oConditionRules, lRuleTypes = [],
				lArr = [];
			for (iResult = 0; iResult < aResults.length; iResult++) {
				if (aResults[iResult].CType == "PRECONDITION" && iResult == 0) {
					oCondition = {
						RuleType: "Precondition",
						Condition: []
					};
					oConditionRules = {
						CType: "IF",
						RuleType: "Precondition",
						CTypeID: aResults[iResult].CondId, Rules: []
					};
					oConditionRules["Rules"] = this._buildPrecondtion(aResults[iResult], iResult, null);
					oCondition.Condition.push(oConditionRules);
					oCondition.Condition.push({
						CType: "END IF",
						CTypeID: 20,
						RuleType: "Precondition",
						Rules: []
					});
					lRuleTypes.push(oCondition);
				} else {
					if (lArr.length == 0) {
						if (aResults[iResult].CType == "IF") {
							oCondition = { RuleType: "Rules", CTypeID: 1, Condition: [] };
							oConditionRules = {
								CType: "IF", RuleType: "Rules",
								CTypeID: iResult,//aResults[iResult].CondId,
								Rules: []
							};
							oConditionRules["Rules"] = this._buildRule(aResults[iResult], iResult, null);
							lArr.push(oConditionRules);

						}
					} else {
						oConditionRules = {
							CType: "ELSE IF",
							RuleType: "Rules",
							CTypeID: iResult,//aResults[iResult].CondId,
							Rules: []
						};

						oConditionRules["Rules"] = this._buildRule(aResults[iResult], iResult, "ELSE IF");
						lArr.push(oConditionRules);
					}
				}
			}//End of for loop
			if (lArr.length > 0) {
				lArr.push({
					CType: "END IF",
					CTypeID: 20,
					RuleType: "Rules",
					Rules: []
				});
				oCondition.Condition = lArr;
				lRuleTypes.push(oCondition);
			}
			this.getView().setModel(new JSONModel({ types: lRuleTypes }), "ruleModel");
		},
		_loadReadOnlyPolicyRuleFragment: function () {
			var oView = this.getView(), oSubSection = oView.byId("idRuleSubSectionBlock");
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
		_buildRule: function (oCondition, iCondition) {
			var lArr = oCondition.to_Rule.results, i, oRule = new Rule(), aRules = [], oValue;
			if (lArr.length > 0) {
				for (i = 0; i < lArr.length; i++) {
					oValue = this._readConditionValue(lArr[i].to_Value.results);
					oRule["ContitionType"] = i == 0 ? "" : "AND";
					oRule["Attribute"] = lArr[i].AttributeId;
					oRule["AttributeDesc"] = lArr[i].Description;
					oRule["Operator"] = oValue.Operator;
					oRule["Value"] = oValue.Value;
					oRule["ValueDesc"] = oValue.ValueDesc != "" ? oValue.ValueDesc : oValue.Value;
					oRule["Rows"] = i + 1;
					oRule["CTypeID"] = iCondition;
					oRule["RuleType"] = "Rules";
					oRule["CondId"] = lArr[i].CondId;
					oRule["ValueRange"] = oValue.ValueRange;

					aRules.push(oRule);
				}
			}
			return aRules;
		},
		_buildPrecondtion: function (oCondition, iCondition) {
			var lArr = oCondition.to_Rule.results, i, oRule = new Rule(), aRules = [], oValue;
			if (lArr.length > 0) {
				for (i = 0; i < lArr.length; i++) {
					oValue = this._readConditionValue(lArr[i].to_Value.results);
					oRule["ContitionType"] = i == 0 ? "" : "AND";
					oRule["Attribute"] = lArr[i].AttributeId;
					oRule["AttributeDesc"] = lArr[i].Description;
					oRule["Operator"] = oValue.Operator;
					oRule["Value"] = oValue.Value;
					oRule["ValueDesc"] = oValue.ValueDesc != "" ? oValue.ValueDesc : oValue.Value;
					oRule["Rows"] = i + 1;
					oRule["CTypeID"] = iCondition;
					oRule["RuleType"] = "Precondition";
					oRule["CondId"] = lArr[i].CondId;
					oRule["ValueRange"] = oValue.ValueRange;

					aRules.push(oRule);
				}
			}
			return aRules;
		},
		_readConditionValue: function (aResult) {
			var oValue = {}, iResult;
			if (aResult.length > 0) {
				for (iResult = 0; iResult < aResult.length; iResult++) {
					oValue["Operator"] = aResult[iResult].Operator;
					oValue["Value"] = aResult[iResult].Value;
					oValue["ValueDesc"] = aResult[iResult].ValueDesc;
					if (({}).hasOwnProperty.call(aResult.to_ValueRange, "results")) {
						oValue["ValueRange"] = [];
					} else {
						oValue["ValueRange"] = [{ Operator: aResult[iResult].Operator, Value: aResult[iResult].Value }];
					}
				}
			}
			return oValue;
		},

		_reindexCondition: function (aCondition) {
			var i, j;
			for (i = 0; i < aCondition.length; i++) {
				aCondition[i].CTypeID = i + 1;
				for (j = 0; j < aCondition[i].Rules.length; j++) {
					aCondition[i].Rules[j].CTypeID = aCondition[i].CTypeID;
				}
			}
			return aCondition;
		},
		onPressAddConditionBtn: function (oEvent) {
			var oBtn = oEvent.getSource();
			var oValue = oBtn.getCustomData()[0].getValue();
			var oRuleData = this.getView().getModel("ruleModel").getData();
			var oRule = new Rule();
			if (oValue.RuleType == "Rules") {
				if (oRuleData.types[1].Condition.length == 0) {
					oRule["RuleType"] = "Rules";
					oRule["Rows"] = 1;
					oRuleData.types[1].Condition.push({

						CType: "IF",
						CTypeID: 1,
						RuleType: "Rules",
						Rules: [
							oRule
						]
					}
					);
					oRuleData.types[1].Condition.push({
						CType: "END IF",
						CTypeID: 200,
						Rules: []
					});
				} else {
					oRuleData.types[1].Condition = this._reindexCondition(oRuleData.types[1].Condition);
					oRuleData.types[1].Condition.pop();
					oRule["ContitionType"] = "OR";
					oRule["CTypeID"] = oRuleData.types[1].Condition.length + 1;
					oRule["Rows"] = 1;
					oRule["RuleType"] = "Rules";
					oRuleData.types[1].Condition.push({

						CType: "ELSE IF",
						CTypeID: oRuleData.types[1].Condition.length + 1,
						RuleType: "Rules",

						Rules: [
							oRule
						]
					}
					);
					oRuleData.types[1].Condition.push({
						CType: "END IF",
						CTypeID: 200,
						Rules: []
					});
				}

			} else {
				var aCondition = oRuleData.types[1].Condition;

				aCondition[0].Rules = this._reindexConditionRules(aCondition[0].Rules);
				var iLen = aCondition[0].Rules.length;
				if (iLen > 0) {
					oRule["RuleType"] = "Precondition";
					oRule["Rows"] = iLen + 1;
					oRule["CTypeID"] = 1;
					oRule["ContitionType"] = "AND";
					aCondition[0].Rules.push(oRule);

				} else {
					oRule["RuleType"] = "Precondition";
					oRule["Rows"] = iLen + 1;
					oRule["CTypeID"] = 1;
					aCondition[0].Rules.push(oRule);

				}

				oRuleData.types[0].Condition = aCondition;
			}
			this.getView().getModel("ruleModel").setData(oRuleData);
		},
		_reindexConditionRules: function (aRules) {
			var i;
			for (i = 0; i < aRules.length; i++) {
				aRules[i].Rows = i + 1;
			}
			return aRules;
		},
		onPressDeleteSingleRowRule: function (oEvent) {
			var oBtn = oEvent.getSource(), i, aRules, nRules = [], j,aCondition;
			var oValue = oBtn.getCustomData()[0].getValue();
			var oRuleData = this.getView().getModel("ruleModel").getData();
			if (oValue.RuleType == "Rules") {
				aCondition = oRuleData.types[1].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID == oValue.CTypeID) {
						aRules = aCondition[i].Rules;
						for (j = 0; j < aRules.length; j++) {
							if (aRules[j].Rows !== oValue.Rows) {
								nRules.push(aRules[j]);
							}
						}
						aRules = this._reindexConditionRules(nRules);
						aCondition[i].Rules = aRules;
						break;
					}
				}
				oRuleData.types[1].Condition = aCondition;
			} else {
				aCondition = oRuleData.types[0].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID == oValue.CTypeID) {
						aRules = aCondition[i].Rules;
						for (j = 0; j < aRules.length; j++) {
							if (aRules[j].Rows !== oValue.Rows) {
								nRules.push(aRules[j]);
							}
						}
						aRules = this._reindexConditionRules(nRules);
						aCondition[i].Rules = aRules;
						break;
					}
				}
				oRuleData.types[0].Condition = aCondition;
			}
			this.getView().getModel("ruleModel").setData(oRuleData);
		},
		onButtonPressDeleteRuleMain: function (oEvent) {
			var oView = this.getView();
			var oBtn = oEvent.getSource(), i, nConditions = [],aCondition;
			var oValue = oBtn.getCustomData()[0].getValue();
			var oRuleData = oView.getModel("ruleModel").getData();
			if (oValue.RuleType == "Rules") {
				aCondition = oRuleData.types[1].Condition;
				if (oValue.CTypeID == 1 && aCondition.length == 2) {
					oRuleData.types[1].Condition = nConditions;
				} else if (oValue.CTypeID == 1 && aCondition.length > 2) {
					for (i = 0; i < aCondition.length; i++) {
						if (aCondition[i].CTypeID != oValue.CTypeID) {
							nConditions.push(aCondition[i]);
						}
					}
					nConditions[0].CType = "IF";
					nConditions[0].CTypeID = 1;
					oRuleData.types[1].Condition = nConditions;
				} else {
					for (i = 0; i < aCondition.length; i++) {
						if (aCondition[i].CTypeID != oValue.CTypeID) {
							nConditions.push(aCondition[i]);
						}
					}
					oRuleData.types[1].Condition = nConditions;
				}
			} else {
				aCondition = oRuleData.types[0].Condition;
				if (oValue.CTypeID == 1 && aCondition.length == 2) {
					oRuleData.types[1].Condition = nConditions;
				} else if (oValue.CTypeID == 1 && aCondition.length > 2) {
					for (i = 0; i < aCondition.length; i++) {
						if (aCondition[i].CTypeID != oValue.CTypeID) {
							nConditions.push(aCondition[i]);
						}
					}
					nConditions[0].CType = "IF";
					nConditions[0].CTypeID = 1;
					oRuleData.types[0].Condition = nConditions;
				} else {
					for (i = 0; i < aCondition.length; i++) {
						if (aCondition[i].CTypeID != oValue.CTypeID) {
							nConditions.push(aCondition[i]);
						}
					}
					oRuleData.types[0].Condition = nConditions;
				}
			}
			oView.getModel("ruleModel").setData(oRuleData);
		},


		onAttributeValueHelpRequested: function (oEvent) {
			var oView = this.getView(), oInput = oEvent.getSource(), oColAttryName,
				oColAttrDesc, oModel = new JSONModel(oInput.getCustomData()[0].getValue()),
				that = this;

			if (!this.oVHDialogAttr) {

				this.oVHDialogAttr = sap.ui.xmlfragment("pl.dac.apps.fnconfig.fragments.AttributeVH", this);
				oView.addDependent(this.oVHDialogAttr);

				this.oVHDialogAttr.setModel(oModel, "condition");
				// Set key fields for filtering in the Define Conditions Tab
				this.oVHDialogAttr.setRangeKeyFields([{
					label: "Description",
					key: "AttributeId",
					type: "string"
				}]);
				this.oVHDialogAttr.getTableAsync().then(function (oTable) {
					oTable.setModel(oView.getModel());
					oTable.setSelectionMode("Single");
					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/AttrSet",
							events: {
								dataReceived: function () {
									that.oVHDialogAttr.update();
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
									that.oVHDialogAttr.update();
								}
							}
						});
						oTable.addColumn(new Column({ header: new Label({ text: "Attribute Name" }) }));
						oTable.addColumn(new Column({ header: new Label({ text: "Description" }) }));
					}
					that.oVHDialogAttr.update();
				});
				this.oVHDialogAttr.open();
				//}.bind(this));
			} else {
				//this.oVHDialogAttr.setModel(oModel, "condition");
				this.oVHDialogAttr.open();
			}
		},
		onValueHelpCancelPress: function () {
			this.oVHDialogAttr.close();
		},
		onValueDialogOkPress: function () {
			var oView = this.getView(), i, aValues = [];
			var oData = this._oRangeDialog.getModel("setting").getData();
			//	var oViewData = oView.getModel("viewModel").getData();
			var aValueRanges = this._oRangeDialog.getContent()[0].getModel("SingleValues").getData();//this._oRangeDialog.getModel("valueRangeModel").getData();
			for (i = 0; i < aValueRanges.length; i++) {
				if (aValueRanges[i].Value && aValueRanges[i].Value.trim() != "") {
					aValues.push(aValueRanges[i]);
				}
			}
			var oRuleModel = oView.getModel("ruleModel").getData(), aCondition, j;
			if (oData.RuleType == "Precondition") {
				aCondition = oRuleModel.types[0].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID === oData.CTypeID) {
						for (j = 0; j < aCondition[i].Rules.length; j++) {
							if (aCondition[i].Rules[j].Rows == oData.Rows) {
								aCondition[i].Rules[j].ValueRange = aValues;
								aCondition[i].Rules[j].Value = aValues[0].Value;
								aCondition[i].Rules[j].ValueDesc = aValues[0].Value;
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
								aCondition[i].Rules[j].ValueRange = aValues;
								aCondition[i].Rules[j].Value = aValues[0].Value;
								aCondition[i].Rules[j].ValueDesc = aValues[0].Value;
								break;
							}
						}
					}
				}
				oRuleModel.types[1].Condition = aCondition;
			}
			oView.getModel("ruleModel").setData(oRuleModel);
			oView.getModel("ruleModel").refresh();
			this._oRangeDialog.close();
		},
		onAttributeValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			var oView = this.getView();
			var oData = this.oVHDialogAttr.getModel("condition").getData();
			var oValue = aTokens[0].getCustomData()[0].getValue();
			this.oVHDialogAttr.close();
			var oRuleData = oView.getModel("ruleModel").getData();
			var i, aCondition, j;
			if (oData.RuleType == "Precondition") {
				aCondition = oRuleData.types[0].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID == oData.CTypeID) {
						for (j = 0; j < aCondition[i].Rules.length; j++) {
							if (aCondition[i].Rules[j].Rows == oData.Rows) {
								aCondition[i].Rules[j].Attribute = oValue.AttributeId;
								aCondition[i].Rules[j].AttributeDesc = oValue.Description;

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
								aCondition[i].Rules[j].Attribute = oValue.AttributeId;
								aCondition[i].Rules[j].AttributeDesc = oValue.Description;
								break;
							}
						}
					}
				}
				oRuleData.types[1].Condition = aCondition;
			}
			oView.getModel("ruleModel").setData(oRuleData);
		},
		updateSingleValuesModel: function (aValues, aItems) {
			var i;
			if (this._oRangeDialog) {
				if (!Array.isArray(aValues)) {
					aItems[0].Value = aValues.Value;
					aItems[0].Operator = aValues.Operator;
				} else {
					if (aItems.length > aValues.length) {
						for (i = 0; i < aValues.length; i++) {
							aItems[i] = aValues[i];
						}
					} else {
						aItems = aValues;
					}
				}
				this.getView().getModel("SingleValues").setData(aItems);
			}
		},
		onShowValueDialog: function (oEvent) {
			var oInput = oEvent.getSource(), oModelSingleValues, that = this, aSingleValueModel;
			var oView = this.getView();
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
			var oModel = new JSONModel(oCustomData);
			if (oModel.getData().Operator == "IN") {
				oView.getModel("viewModel").setProperty("/DialogTitle", "Define Value Ranges");
				oView.getModel("viewModel").setProperty("/DialogIcon", "sap-icon://list");
				oView.getModel("viewModel").setProperty("/VisibleOK", true);
			} else {
				oView.getModel("viewModel").setProperty("/DialogTitle", "User Attributes");
				oView.getModel("viewModel").setProperty("/DialogIcon", "sap-icon://person-placeholder");
				oView.getModel("viewModel").setProperty("/VisibleOK", false);
			}
			if (!this._oRangeDialog) {
				Fragment.load({
					name: "pl.dac.apps.fnconfig.fragments.RangeDialog",
					controller: this
				}).then(function (oDialog) {
					this._oRangeDialog = oDialog;
					oView.addDependent(this._oRangeDialog);
					this._oRangeDialog.setModel(oModel, "setting");
					oModelSingleValues = new JSONModel();
					oModelSingleValues.attachRequestCompleted(function () {
						that._oRangeDialog.getContent()[0].getModel("SingleValues").setData(oModelSingleValues.getData());
						that.updateSingleValuesModel(oCustomData.ValueRange, oModelSingleValues.getData());
						that._oRangeDialog.open();
					});
					oModelSingleValues.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/SingleValues.json"));
				}.bind(this));
			} else {
				oModelSingleValues = this._oRangeDialog.getContent()[0].getModel("SingleValues");
				aSingleValueModel = oModelSingleValues.getData();
				if (Object.entries(aSingleValueModel).length == 0) {
					oModelSingleValues.attachRequestCompleted(function () {
						that._oRangeDialog.setModel(oModel, "setting");
						that._oRangeDialog.open();
						that.updateSingleValuesModel(oCustomData.ValueRange, aSingleValueModel);
					});
					oModelSingleValues.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/SingleValues.json"));
				} else {
					this._oRangeDialog.setModel(oModel, "setting");
					this._oRangeDialog.open();
					this.updateSingleValuesModel(oCustomData.ValueRange, aSingleValueModel);
				}

			}

		},
		onBeforeOpenDialog: function () {

		},
		onPressAddRowInValues: function () {
			this._oRangeDialog.getContent()[0].addRowInValues();
		},
		onPressAddRowInRanges: function () {
			this._oRangeDialog.getContent()[0].addRowInRanges();
		},
		onCloseValueDialog: function () {
			this._oRangeDialog.close();
		},
		onPressUserAttributeItem: function (oEvent) {
			var oView = this.getView();
			var oSelectedItemData = oEvent.getSource().getBindingContext().getObject();
			var oData = this._oRangeDialog.getModel("setting").getData();
			this._oRangeDialog.close();
			var oRuleData = oView.getModel("ruleModel").getData();
			var i, aCondition, j;
			if (oData.RuleType == "Precondition") {
				aCondition = oRuleData.types[0].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID == oData.CTypeID) {
						for (j = 0; j < aCondition[i].Rules.length; j++) {
							if (aCondition[i].Rules[j].Rows == oData.Rows) {
								if (oSelectedItemData.AttributeId) {
									aCondition[i].Rules[j].Value = oSelectedItemData.AttributeId;
									aCondition[i].Rules[j].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.AttributeId + ")";
									aCondition[i].Rules[j].ValueRange = [{ Operator: "EQ", Value: oSelectedItemData.AttributeId }];
								} else {
									aCondition[i].Rules[j].Value = oSelectedItemData.ListName;
									aCondition[i].Rules[j].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.ListName + ")";
									aCondition[i].Rules[j].ValueRange = [{ Operator: "EQ", Value: oSelectedItemData.ListName }];
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
								} else {
									aCondition[i].Rules[j].Value = oSelectedItemData.ListName;
									aCondition[i].Rules[j].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.ListName + ")";
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
		},
		//
		handleClose: function () {
			this.getView().getModel("layoutMode").setProperty("/layout", "TwoColumnsMidExpanded");
		},
		onButtonPressAddRuleMain: function (oEvent) {
			var oBtn = oEvent.getSource(), i,iLen;
			var oView = this.getView();
			var oRule = [];
			var oValue = oBtn.getCustomData()[0].getValue();
			var oRuleData = oView.getModel("ruleModel").getData();
			if (oRuleData.types.length == 1) {
				aCondition = oRuleData.types[0].Condition;
			} else {
				aCondition = oRuleData.types[1].Condition;
			}
			if (oValue.RuleType == "Rules") {
				//var aCondition = oRuleData.types[1].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID == oValue.CTypeID) {
						aCondition[i].Rules = this._reindexConditionRules(aCondition[i].Rules);
						iLen = aCondition[i].Rules.length;
						oRule["CTypeID"] = oValue.CTypeID;
						oRule["Rows"] = iLen + 1;
						oRule["RuleType"] = "Rules";
						if (iLen > 0) {
							oRule["ContitionType"] = "AND";
							aCondition[i].Rules.push(oRule);
						} else {
							aCondition[i].Rules.push(oRule);
						}
					}
				}
				oRuleData.types[1].Condition = aCondition;

			} else {
				var aCondition = oRuleData.types[0].Condition;
				for (i = 0; i < aCondition.length; i++) {
					if (aCondition[i].CTypeID == oValue.CTypeID) {
						aCondition[i].Rules = this._reindexConditionRules(aCondition[i].Rules);
						iLen = aCondition[i].Rules.length;
						oRule["CTypeID"] = oValue.CTypeID;
						oRule["Rows"] = iLen + 1;
						oRule["RuleType"] = "Precondition";
						if (iLen > 0) {
							oRule["ContitionType"] = "AND";
							aCondition[i].Rules.push(oRule);
						} else {
							aCondition[i].Rules.push(oRule);
						}
					}
				}
				oRuleData.types[0].Condition = aCondition;

			}//end if
			oView.getModel("ruleModel").setData(oRuleData);
		},
		onPressEditRuleBtn: function (oEvent) {
			var oView = this.getView(), oSubSection = oView.byId("idRuleSubSectionBlock"),
				oRuleData = oView.getModel("ruleModel").getData(),
				oEmptyRuleModel, oEmptyPrecondition, oEmptyRule;
			oEvent.getSource().setVisible(false);
			oView.byId("saveRuleBtn").setVisible(true);
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
		_prepareRulePayload: function (aTypes) {
			var iType, iCondition, aCondition, iRule, aRules, _aRules, _oRule,
				oCondition, _aValues, aValueRanges, iValueRange, oView = this.getView(),
				oPayload = {}, bEmptyRule = true;
			_aRules = [];
			for (iType = 0; iType < aTypes.length; iType++) {
				aCondition = aTypes[iType].Condition;
				for (iCondition = 0; iCondition < aCondition.length; iCondition++) {
					if (aCondition[iCondition].CType != "END IF") {
						oCondition = {};
						bEmptyRule = true;
						oCondition["CondId"] = aCondition[iCondition].CTypeID;
						oCondition["to_Rule"] = [];
						aRules = aCondition[iCondition].Rules;
						for (iRule = 0; iRule < aRules.length; iRule++) {
							if (aRules[iRule].Attribute != '') {
								bEmptyRule = false;
								_oRule = {};
								_oRule["AttributeId"] = aRules[iRule].Attribute;
								_oRule["to_Value"] = [];
								_aValues = [];
								aValueRanges = aRules[iRule].ValueRange;
								if (aRules[iRule].Operator == "BT") {
									for (iValueRange = 0; iValueRange < aValueRanges.length; iValueRange++) {
										_aValues.push({ Value: aValueRanges[iValueRange].Value });
									}
								} else {
									for (iValueRange = 0; iValueRange < aValueRanges.length; iValueRange++) {
										_aValues.push({ Value: aValueRanges[iValueRange].Value, Operator: aValueRanges[iValueRange].Operator });
									}
								}
								if (aRules[iRule].ValueDesc != "" && aRules[iRule].Value == "") {
									_aValues.push({ Value: aRules[iRule].ValueDesc, Operator: aRules[iRule].Operator });
								}
								if (aRules[iRule].Operator == "BT") {
									_oRule["to_Value"].push({ Operator: aRules[iRule].Operator, to_ValueRange: _aValues });
								} else {
									for (var i = 0; i < _aValues.length; i++) {
										_oRule["to_Value"].push(_aValues[i]);
									}
								}
								oCondition["to_Rule"].push(_oRule);
							}
						}
						if (!bEmptyRule) {
							_aRules.push(oCondition);
						}
					}
				}
			}
			oPayload["to_Condition"] = _aRules;
			oPayload["Policy"] = oView.getBindingContext().getObject().PolicyName;
			return oPayload;
		},
		onPressSaveRuleBtn: function (oEvent) {
			var oView = this.getView(),
				oRuleData = oView.getModel("ruleModel").getData(), oPayload;
			oEvent.getSource().setVisible(false);
			this.getView().byId("editRuleBtn").setVisible(true);
			oPayload = this._prepareRulePayload(oRuleData.types);
			if (oPayload.to_Condition.length > 0) {
				this._readPolicyRulesDetails(oView.getBindingContext().getObject().PolicyName);
			} else {
				this._readPolicyRulesDetails(oView.getBindingContext().getObject().PolicyName);
			}
			this._loadReadOnlyPolicyRuleFragment();
		}
		// onPressAddPreconditionBlock: function () {
		// 	var oPreconditionBlock =
		// 	{
		// 		"RuleType": "Precondition",
		// 		"Condition": [
		// 			{
		// 				"CType": "IF",
		// 				"RuleType": "Precondition",
		// 				"CTypeID": "P01",
		// 				"Rules": [
		// 					{
		// 						"ContitionType": "",
		// 						"Attribute": "",
		// 						"AttributeDesc": "",
		// 						"Operator": "=",
		// 						"Value": "",
		// 						"ValueDesc": "",
		// 						"Rows": 1,
		// 						"CTypeID": 0,
		// 						"RuleType": "Precondition",
		// 						"CondId": "P01",
		// 						"ValueRange": {
		// 							"Operator": "",
		// 							"Value": ""
		// 						}
		// 					}
		// 				]
		// 			},
		// 			{
		// 				"CType": "END IF",
		// 				"CTypeID": 20,
		// 				"RuleType": "Precondition",
		// 				"Rules": []
		// 			}
		// 		]
		// 	};

		// 	var oPrecondtionData = this.getView().getModel("ruleModel").getData();
		// 	if (oPrecondtionData && oPrecondtionData.types && oPrecondtionData.types.length > 0) {
		// 		oPrecondtionData.types.unshift(oPreconditionBlock);
		// 	} else {
		// 		oPrecondtionData.types.push(oPreconditionBlock);
		// 	}
		// 	this.getView().getModel("ruleModel").setData(oPrecondtionData);
		// },
		// onPressAddRuleBlock: function () {
		// 	var oRuleBlock = {
		// 		"RuleType": "Rules",
		// 		"CTypeID": "001",
		// 		"Condition": [
		// 			{
		// 				"CType": "IF",
		// 				"RuleType": "Rules",
		// 				"CTypeID": "001",
		// 				"Rules": [
		// 					{
		// 						"ContitionType": "",
		// 						"Attribute": "",
		// 						"AttributeDesc": "",
		// 						"Operator": "=",
		// 						"Value": "",
		// 						"ValueDesc": "",
		// 						"Rows": 1,
		// 						"CTypeID": "001",
		// 						"RuleType": "Rules",
		// 						"CondId": "001",
		// 						"ValueRange": {
		// 							"Operator": "",
		// 							"Value": ""
		// 						}
		// 					}
		// 				]
		// 			},
		// 			{
		// 				"CType": "END IF",
		// 				"CTypeID": 40,
		// 				"RuleType": "Rules",
		// 				"Rules": []
		// 			}
		// 		]
		// 	};
		// 	var oRuleData = this.getView().getModel("ruleModel").getData();
		// 	if (oRuleData && oRuleData.types && oRuleData.types.length > 0) {
		// 		oRuleData.types.push(oRuleBlock);
		// 	} else {
		// 		oRuleData.types.push(oRuleBlock);
		// 	}
		// 	this.getView().getModel("ruleModel").setData(oRuleData);
		// }

	});
});