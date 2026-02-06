sap.ui.define(["sap/ui/model/json/JSONModel",
    "pl/dac/apps/fnconfig/control/Rule"
],
    function (JSONModel, Rule) {
        "use strict";

        return {

            prepareRuleModel: function (oView, aResults) {
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
                        oConditionRules["Rules"] = this._preparePreconditionRuleBody(aResults[iResult], iResult);
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
                                    CType: "IF",
                                    RuleType: "Rules",
                                    CTypeID: iResult,
                                    Rules: []
                                };
                                oConditionRules["Rules"] = this._prepareRuleBody(aResults[iResult], iResult);
                                lArr.push(oConditionRules);
                            }
                        } else {
                            oConditionRules = {
                                CType: "ELSE IF",
                                RuleType: "Rules",
                                CTypeID: iResult,
                                Rules: []
                            };
                            oConditionRules["Rules"] = this._prepareRuleBody(aResults[iResult], iResult,);
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
                oView.setModel(new JSONModel({ types: lRuleTypes }), "ruleModel");
            },
            _preparePreconditionRuleBody: function (oCondition, iCondition) {
                var lArr = oCondition.to_Rule.results, i, oRule = new Rule(), aRules = [], oValue;
                if (lArr.length > 0) {
                    for (i = 0; i < lArr.length; i++) {
                        oValue = this._readRuleConditionValue(lArr[i].to_Value.results);
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
                        oRule["Values"] = oValue.Values;
                        aRules.push(oRule);
                    }
                }
                return aRules;
            },
            _prepareRuleBody: function (oCondition, iCondition) {
                var lArr = oCondition.to_Rule.results, i, oRule, aRules = [], oValue;
                if (lArr.length > 0) {
                    for (i = 0; i < lArr.length; i++) {
                        oValue = this._readRuleConditionValue(lArr[i].to_Value.results);
                        oRule = new Rule();
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
                        oRule["Values"] = oValue.Values;
                        aRules.push(oRule);
                    }
                }
                return aRules;
            },
            _readRuleConditionValue: function (aResult) {
                var oValue = {}, iResult, sValue = "", lArrValue = new Array();
                if (aResult.length > 0) {
                    if (aResult.length > 1) {
                        for (iResult = 0; iResult < aResult.length; iResult++) {
                            oValue["Operator"] = aResult[iResult].Operator;
                            sValue += aResult[iResult].Value;
                            if (iResult < aResult.length - 1) {
                                sValue += ", ";
                            }
                            lArrValue.push({ Operator: aResult[iResult].Operator, Value: aResult[iResult].Value, ValueDesc: aResult[iResult].ValueDesc })
                        }
                        oValue["Value"] = sValue;
                        oValue["ValueDesc"] = sValue;
                        oValue["Values"] = lArrValue;
                        oValue["ValueRange"] = [];
                    } else {
                        for (iResult = 0; iResult < aResult.length; iResult++) {
                            oValue["Operator"] = aResult[iResult].Operator;
                            oValue["Value"] = aResult[iResult].Value;
                            oValue["ValueDesc"] = aResult[iResult].ValueDesc;
                            oValue["Values"] = [];
                            oValue["ValueRange"] = [];
                            if (({}).hasOwnProperty.call(aResult[iResult].to_ValueRange, "results") && aResult[iResult].to_ValueRange.results.length > 0) {
                                oValue["ValueRange"] = this._readRuleValueRangeValues(aResult[iResult].to_ValueRange.results, oValue);
                            }
                            else {
                                oValue["Values"] = [{ Operator: aResult[iResult].Operator, Value: aResult[iResult].Value }];
                            }
                        }
                    }
                }
                return oValue;
            },
            _readRuleValueRangeValues: function (aResult, oValue) {
                var i = 0, lArr = new Array(), nMin = 0;
                for (i = 0; i < aResult.length; i++) {
                    if ((i + 1) % 2 == 0) {
                        lArr.push({ Operator: "BT", Lower: nMin, Upper: aResult[i].Value });
                        if (!oValue["Value"]) {
                            oValue["Value"] = nMin + " to " + aResult[i].Value;
                        } else {
                            oValue["Value"] = oValue["Value"] + ", ";
                        }
                        nMin = 0;
                    } else {
                        nMin = aResult[i].Value;
                    }
                }
                return lArr;
            },
            insertConditonInConditionBlock: function (oView, oButton) {
                //var oBtn = oEvent.getSource();
                var oValue = oButton.getCustomData()[0].getValue();
                var oRuleData = oView.getModel("ruleModel").getData();
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
                            RuleType: "Rules",
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
                oView.getModel("ruleModel").setData(oRuleData);
            },
            _reindexConditionRules: function (aRules) {
                var i;
                for (i = 0; i < aRules.length; i++) {
                    aRules[i].Rows = i + 1;
                }
                return aRules;
            },
            deleteInlineRule: function (oView, oButton) {
                var i, aRules, nRules = [], j, aCondition, oRuleData, oValue;
                oValue = oButton.getCustomData()[0].getValue();
                oRuleData = oView.getModel("ruleModel").getData();
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
                oView.getModel("ruleModel").setData(oRuleData);
            },
            deleteEntireRuleBlock: function (oView, oButton) {
                var i, nConditions = [], aCondition;
                var oValue = oButton.getCustomData()[0].getValue();
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
            insertRuleInBlock: function (oView, oButton) {
                var i, iLen, oRule = [], oValue, oRuleData;
                oValue = oButton.getCustomData()[0].getValue();
                oRuleData = oView.getModel("ruleModel").getData();
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
            updateRuleModelWithSuggestionItem: function (oView, oInput, oItem) {
                var i, aCondition, j, oData, oValue, oRuleData;
                oData = oInput.getCustomData()[0].getValue();
                oValue = oItem.getBindingContext().getObject();
                oRuleData = oView.getModel("ruleModel").getData();
                if (oData.RuleType == "Precondition") {
                    aCondition = oRuleData.types[0].Condition;
                    for (i = 0; i < aCondition.length; i++) {
                        if (aCondition[i].CTypeID == oData.CTypeID) {
                            for (j = 0; j < aCondition[i].Rules.length; j++) {
                                if (aCondition[i].Rules[j].Rows == oData.Rows) {
                                    aCondition[i].Rules[j].Attribute = oValue.AttributeId;
                                    aCondition[i].Rules[j].AttributeDesc = oValue.Description + " (" + oValue.AttributeId + ")";
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
                                    aCondition[i].Rules[j].AttributeDesc = oValue.Description + " (" + oValue.AttributeId + ")";
                                    break;
                                }
                            }
                        }
                    }
                    oRuleData.types[1].Condition = aCondition;
                }
                oView.getModel("ruleModel").setData(oRuleData);
            },
            updateRuleModelWithValueHelpItem: function (oView, oToken, oDialog) {
                var i, aCondition, j, oData, oRuleData, oValue;
                oData = oDialog.getModel("condition").getData();
                oRuleData = oView.getModel("ruleModel").getData();
                oValue = oToken.getCustomData()[0].getValue();
                if (oData.RuleType == "Precondition") {
                    aCondition = oRuleData.types[0].Condition;
                    for (i = 0; i < aCondition.length; i++) {
                        if (aCondition[i].CTypeID == oData.CTypeID) {
                            for (j = 0; j < aCondition[i].Rules.length; j++) {
                                if (aCondition[i].Rules[j].Rows == oData.Rows) {
                                    aCondition[i].Rules[j].Attribute = oValue.AttributeId;
                                    aCondition[i].Rules[j].AttributeDesc = oValue.Description + " (" + oValue.AttributeId + ")";

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
                                    aCondition[i].Rules[j].AttributeDesc = oValue.Description + " (" + oValue.AttributeId + ")";
                                    break;
                                }
                            }
                        }
                    }
                    oRuleData.types[1].Condition = aCondition;
                }
                oView.getModel("ruleModel").setData(oRuleData);
            },
            loadSingleValueModel: function (oDialog, oSettingModel, oCustomData) {
                var oModelSingleValues;
                oModelSingleValues = new JSONModel();
                oDialog.getContent()[0].setModel(oModelSingleValues, "SingleValues");
                oModelSingleValues.attachRequestCompleted(function (oEvent) {
                    oDialog.setModel(oSettingModel, "setting");
                    oDialog.open();
                    this._updateSingleValuesModel(oDialog, oCustomData.Values, oEvent.getSource().getData());
                }.bind(this));
                oModelSingleValues.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/SingleValues.json"));
            },
            loadValueRangeModel: function (oDialog, oSettingModel, oCustomData) {
                var oModelRanges;
                oModelRanges = new JSONModel();
                oDialog.getContent()[0].setModel(oModelRanges, "Ranges");
                oModelRanges.attachRequestCompleted(function (oEvent) {
                    oDialog.setModel(oSettingModel, "setting");
                    oDialog.open();
                    this._updateRangesValue(oDialog, oCustomData.ValueRange, oEvent.getSource().getData());
                }.bind(this));
                oModelRanges.loadData(jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/Ranges.json"));
            },
            _updateRangesValue: function (oDialog, aValues, aItems) {
                var i, oData;
                if (oDialog) {
                    if (!Array.isArray(aValues)) {
                        aItems[0].Lower = aValues.Min.trim();
                        aItems[0].Upper = aValues.Max.trim();
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
                    oData = aItems;
                    oDialog.getContent()[0].getModel("Ranges").setData(oData);
                }
            },
            _updateSingleValuesModel: function (oDialog, aValues, aItems) {
                var i, oData;
                if (oDialog) {
                    if (!Array.isArray(aValues)) {
                        aItems[0].Value = aValues.Value;
                        aItems[0].Operator = aValues.Operator;
                    } else {
                        if (aItems.length > aValues.length) {
                            for (i = 0; i < aValues.length; i++) {
                                aValues[i].Value = aValues[i].Value.trim();
                                aItems[i] = aValues[i];
                            }
                        } else {
                            aItems = aValues;
                        }
                    }
                    oData = aItems;
                    oDialog.getContent()[0].getModel("SingleValues").setData(oData);
                }
            },
            _createRangesAndValues: function (oRule) {
                var i, aValues;
                oRule["ValueRange"] = new Array();
                oRule["Values"] = new Array();
                if (oRule.Operator == "BT") {  
                    aValues = oRule.ValueDesc.split(",");
                    for (i = 0; i < aValues.length; i++) {
                        if((aValues[i].split("to")[0] && aValues[i].split("to")[0].trim()!="") &&(aValues[i].split("to")[1] && aValues[i].split("to")[1].trim()!="")){
                            oRule["ValueRange"].push({ Operator: oRule.Operator, Lower: aValues[i].split("to")[0], Upper: aValues[i].split("to")[1] })
                        }
                    }
                } else {
                    aValues = oRule.ValueDesc.split(",");
                    for (i = 0; i < aValues.length; i++) {
                        if(aValues[i] && aValues[i].trim()!=""){
                            oRule["Values"].push({ Operator: oRule.Operator, Value: aValues[i] });
                        }   
                    }
                }
                return oRule;
            },
            prepareRuleCreatePayload: function (oView, aTypes) {
                var iType, iCondition, aCondition, iRule, aRules, _aRules, _oRule,
                    oCondition, _aValues, aValueRanges, iValueRange,
                    oPayload = {}, bEmptyRule = true;
                _aRules = [];
                for (iType = 0; iType < aTypes.length; iType++) {
                    aCondition = aTypes[iType].Condition;
                    for (iCondition = 0; iCondition < aCondition.length; iCondition++) {
                        if (aCondition[iCondition].CType != "END IF") {
                            oCondition = {};
                            bEmptyRule = true;
                            oCondition["CondId"] = Number.isFinite(aCondition[iCondition].CTypeID)?String(aCondition[iCondition].CTypeID):aCondition[iCondition].CTypeID;
                            oCondition["to_Rule"] = [];
                            aRules = aCondition[iCondition].Rules;
                            for (iRule = 0; iRule < aRules.length; iRule++) {
                                if (aRules[iRule].Attribute != '') {
                                    bEmptyRule = false;
                                    _oRule = {};
                                    _oRule["AttributeId"] = aRules[iRule].Attribute;
                                    _oRule["to_Value"] = [];
                                    _aValues = [];
                                    if (!({}).hasOwnProperty.call(aRules[iRule], "ValueRange") && !({}).hasOwnProperty.call(aRules[iRule], "Values")) {
                                        aRules[iRule] = this._createRangesAndValues(aRules[iRule]);
                                    }
                                    aValueRanges = aRules[iRule].ValueRange.length > 0 ? aRules[iRule].ValueRange : aRules[iRule].Values;
                                    if (aValueRanges) {
                                        if (aRules[iRule].Operator == "BT") {
                                            for (iValueRange = 0; iValueRange < aValueRanges.length; iValueRange++) {
                                                _aValues.push({ Lower: aValueRanges[iValueRange].Lower,Upper: aValueRanges[iValueRange].Upper });
                                            }
                                        } else {
                                            for (iValueRange = 0; iValueRange < aValueRanges.length; iValueRange++) {
                                                _aValues.push({ Value: aValueRanges[iValueRange].Value, Operator: aValueRanges[iValueRange].Operator });
                                            }
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
            }
        };

    });