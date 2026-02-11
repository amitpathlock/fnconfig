sap.ui.define(["sap/ui/model/json/JSONModel",
    "pl/dac/apps/fnconfig/control/Rule",
    "sap/ui/core/HTML",
    "sap/m/Panel",
    "sap/m/Toolbar",
    "sap/m/Button"
],
    function (JSONModel, Rule, HTML, Panel, Toolbar, Button) {
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
                    oCondition.Condition = lArr;
                    lRuleTypes.push(oCondition);
                }
                // this.createDiplayRuleReadOnly(lRuleTypes,oView.getController());
                oView.setModel(new JSONModel({ types: lRuleTypes }), "ruleModel");
            },
            createDiplayRuleReadOnly: function (lRuleTypes, oController) {
                var iRule, iCondition, iRuleTypes, oToolbar, aPrecondition = null, aRulesCondition = null, sPreConditon = "", sRule = "", aRules;
                for (iRuleTypes = 0; iRuleTypes < lRuleTypes.length; iRuleTypes++) {
                    if (lRuleTypes[iRuleTypes].RuleType == "Precondition") {
                        aPrecondition = lRuleTypes[iRuleTypes].Condition;
                    } else {
                        aRulesCondition = lRuleTypes[iRuleTypes].Condition;
                    }
                }

                if (aPrecondition && aPrecondition.length > 0) {
                    sPreConditon = "<div class=\"plDacHTMLruleBlock\"><div class=\"plDacHTMLRuleTitle\">Precondition:</div>";
                    sPreConditon += "<div class=\"plDacHTMLIfblock\" ><div>IF</div>";
                    for (iCondition = 0; iCondition < aPrecondition.length; iCondition++) {
                        aRules = aPrecondition[iCondition].Rules;
                        for (iRule = 0; iRule < aRules.length; iRule++) {
                            if (iRule == 0) {
                                sPreConditon += "<div class=\"plDacHTMLRuleLine\">" + aRules[iRule].Attribute + "<b style=\"margin-left:12px;margin-right:12px;\">" + aRules[iRule].Operator + "</b>" + this._mergeValues(aRules[iRule]) + "</div>";
                            } else {
                                sPreConditon += "<div class=\"plDacHTMLRuleLine\"><span style=\"padding-left:1rem;\">" + aRules[iRule].ContitionType + "</span>" + aRules[iRule].Attribute + "<b style=\"margin-left:12px;margin-right:12px;\">" + aRules[iRule].Operator + "</b>" + this._mergeValues(aRules[iRule]) + "</div>";
                            }
                        }
                    }
                    sPreConditon += "</div></div>";
                }

                if (aRulesCondition && aRulesCondition.length > 0) {
                    sRule = "<div class=\"plDacHTMLruleBlock\"><div class=\"plDacHTMLRuleTitle\">Rule:</div>";
                    sRule += "<div class=\"plDacHTMLIfblock\" ><div>IF</div>";
                    for (iCondition = 0; iCondition < aRulesCondition.length; iCondition++) {
                        aRules = aRulesCondition[iCondition].Rules;
                        if (aRulesCondition[iCondition].CType == "ELSE IF") {
                            sRule += "<div class=\"plDacHTMLRuleOR\">OR</div>";
                            sRule += "<div>IF</div>";
                        }
                        for (iRule = 0; iRule < aRules.length; iRule++) {
                            if (iRule == 0) {
                                sRule += "<div class=\"plDacHTMLRuleLine\">" + aRules[iRule].Attribute + "<b style=\"margin-left:12px;margin-right:12px;\">" + aRules[iRule].Operator + "</b>" + this._mergeValues(aRules[iRule]) + "</div>";
                            } else {
                                sRule += "<div class=\"plDacHTMLRuleLine\"><span style=\"padding-left:1rem;\">" + aRules[iRule].ContitionType + "</span>" + aRules[iRule].Attribute + "<b style=\"margin-left:12px;margin-right:12px;\">" + aRules[iRule].Operator + "</b>" + this._mergeValues(aRules[iRule]) + "</div>";
                            }
                        }
                    }
                    sRule += "</div></div>";
                }
                oToolbar = new Toolbar({
                    content: [
                        new sap.m.ToolbarSpacer(), // Pushes buttons to the right
                        new Button({ text: "Edit Rule", icon: "sap-icon://edit", press: oController.onPressEditRuleBtn.bind(oController) }).addStyleClass("plDacHTMLEditBtn"),
                    ]
                });
                oToolbar.addStyleClass("plDacHTMLRuleToolbar");
                return new Panel({
                    // headerToolbar: oHeaderToolbar,
                    content: [oToolbar, new HTML({
                        // The 'content' property holds the raw HTML string
                        content:
                            sPreConditon + sRule,
                        preferDOM: true // Renders the HTML as a native DOM element
                    })]
                });
            },
            _mergeValues: function (oRule) {
                var aValueRange, iValueRange, sMergeValue = "", aValueRangeU, iValueRangeU;
                if (oRule.Operator == "BT") {
                    aValueRange = oRule.ValueRange;
                    for (iValueRange = 0; iValueRange < aValueRange.length; iValueRange++) {
                        if (iValueRange > 0) {
                            sMergeValue += ",&ensp;&ensp;";
                        }
                        sMergeValue += "<span style=\"margin-right:12px;\">" + aValueRange[iValueRange].Lower + "</span >AND<span style=\"margin-left:12px;margin-right:0;\">" + aValueRange[iValueRange].Upper + "</span>";
                    }
                } else {
                    aValueRange = oRule.Values;
                    var bComman = false;
                    aValueRangeU = Array.from(new Map(oRule.Values.map(item => [item.Operator, item])).values());
                    for (iValueRangeU = 0; iValueRangeU < aValueRangeU.length; iValueRangeU++) {
                        if (iValueRangeU == 0) {
                            for (iValueRange = 0; iValueRange < aValueRange.length; iValueRange++) {
                                if (aValueRange[iValueRangeU].Operator == aValueRange[iValueRange].Operator) {
                                    if (bComman) {
                                        sMergeValue += ",&ensp;&ensp;";
                                    }
                                    sMergeValue += aValueRange[iValueRange].Value;
                                    bComman = true;
                                }

                            }
                        } else {
                            sMergeValue += "<span style=\"margin-left:1rem;\"><b>" + aValueRangeU[iValueRangeU].Operator + "</b></span>";
                            bComman = false;
                            for (iValueRange = 0; iValueRange < aValueRange.length; iValueRange++) {
                                if (aValueRange[iValueRangeU].Operator == aValueRange[iValueRange].Operator) {
                                    if (bComman) {
                                        sMergeValue += ",&ensp;&ensp;";
                                    }
                                    sMergeValue += aValueRange[iValueRange].Value;
                                    bComman = true;
                                }

                            }
                        }
                    }
                }
                return sMergeValue;
            },
            initialModelValues: function (oCustomData) {
                var aValues, iValue;
                if (!({}).hasOwnProperty.call(oCustomData, "ValueRange")) {
                    oCustomData["ValueRange"] = new Array();
                }
                if (!({}).hasOwnProperty.call(oCustomData, "Values")) {
                    oCustomData["Values"] = new Array();
                }
                if (oCustomData.Operator == "BT") {
                    if (oCustomData["ValueRange"].length == 0) {
                        if (oCustomData.ValueDesc && oCustomData.ValueDesc.trim() != "" && oCustomData.ValueDesc.split(",").length > 1) {
                            aValues = oCustomData.ValueDesc.split(",");
                            for (iValue = 0; iValue < aValues.length; iValue++) {
                                oCustomData["ValueRange"].push({ Operator: oCustomData.Operator, Lower: aValues[iValue].split("to")[0], Upper: aValues[iValue].split("to")[1] })
                            }
                        }
                    }
                } else {

                    if (oCustomData["Values"].length == 0) {
                        aValues = oCustomData.ValueDesc.split(",");
                        for (iValue = 0; iValue < aValues.length; iValue++) {
                            oCustomData["Values"].push({ Operator: oCustomData.Operator, Value: aValues[iValue] });
                        }
                    }
                }
            },
            updateRuleModelWithValueAndRangesSelectionData: function (oDialog, oView) {
                var oData, aCondition, iCondition, iRule, oRuleModel, iValueRanges, sValuesRanges = "", aValues = [], aValueRanges, sKey = "";
                oData = oDialog.getModel("setting").getData();
                //if (oData.Values.length > 0) {
                aValueRanges = oDialog.getContent()[0].getModel("SingleValues").getData();
                sKey = "Values";
                for (iValueRanges = 0; iValueRanges < aValueRanges.length; iValueRanges++) {
                    if (aValueRanges[iValueRanges].Value && aValueRanges[iValueRanges].Value.trim() != "") {
                        if (aValueRanges[iValueRanges].Operator.trim() == "") {
                            aValueRanges[iValueRanges].Operator = "EQ";
                        }
                        aValues.push(aValueRanges[iValueRanges]);
                    }
                }
                if (aValues.length > 0) {
                    sValuesRanges = aValues[0].Value;
                } else {
                    aValueRanges = oDialog.getContent()[0].getModel("Ranges").getData();
                    sKey = "ValueRange";
                    for (iValueRanges = 0; iValueRanges < aValueRanges.length; iValueRanges++) {
                        if (aValueRanges[iValueRanges].Lower.trim() != "" && aValueRanges[iValueRanges].Upper.trim() != "") {
                            aValueRanges[iValueRanges].Operator = "BT";
                            aValues.push(aValueRanges[iValueRanges]);
                        }
                    }
                    if (aValues.length > 0) {
                        sValuesRanges = aValues[0].Lower + " to " + aValues[0].Upper;
                    }
                }
                oRuleModel = oView.getModel("ruleModel").getData();
                if (oData.RuleType == "Precondition") {
                    aCondition = oRuleModel.types[0].Condition;
                    for (iCondition = 0; iCondition < aCondition.length; iCondition++) {
                        if (aCondition[iCondition].CTypeID === oData.CondId) {
                            for (iRule = 0; iRule < aCondition[iCondition].Rules.length; iRule++) {
                                if (aCondition[iCondition].Rules[iRule].Rows == oData.Rows) {
                                    aCondition[iCondition].Rules[iRule][sKey] = aValues;
                                    aCondition[iCondition].Rules[iRule].Value = sValuesRanges;//aValues.map(oValue => oValue.Value).join(', ') // aValues[0].Value;
                                    aCondition[iCondition].Rules[iRule].ValueDesc = sValuesRanges;///aValues.map(oValue => oValue.Value).join(', ');//aValues[0].Value;
                                    break;
                                }
                            }
                        }
                    }
                    oRuleModel.types[0].Condition = aCondition;
                } else {
                    aCondition = oRuleModel.types[1].Condition;
                    for (iCondition = 0; iCondition < aCondition.length; iCondition++) {
                        if (aCondition[iCondition].CTypeID === oData.CTypeID) {
                            for (iRule = 0; iRule < aCondition[iCondition].Rules.length; iRule++) {
                                if (aCondition[iCondition].Rules[iRule].Rows == oData.Rows) {
                                    aCondition[iCondition].Rules[iRule][sKey] = aValues;
                                    aCondition[iCondition].Rules[iRule].Value = sValuesRanges;// aValues.map(oValue => oValue.Value).join(', ')//aValues[0].Value;
                                    aCondition[iCondition].Rules[iRule].ValueDesc = sValuesRanges;// aValues.map(oValue => oValue.Value).join(', ')//aValues[0].Value;
                                    break;
                                }
                            }
                        }
                    }
                    oRuleModel.types[1].Condition = aCondition;
                }
                oView.getModel("ruleModel").setData(oRuleModel);
                oView.getModel("ruleModel").refresh();
                oDialog.close();
            },
            updateRuleModelWithUserAttrSelectionData: function (oView, oDialog, oSelectedItemData) {
                var iCondition, aCondition, iRule,oData,oRuleData;
                oData = oDialog.getModel("setting").getData();
                oDialog.close();
                oRuleData = oView.getModel("ruleModel").getData();
                
                if (oData.RuleType == "Precondition") {
                    aCondition = oRuleData.types[0].Condition;
                    for (iCondition = 0; iCondition < aCondition.length; iCondition++) {
                        if (aCondition[iCondition].CTypeID == oData.CondId) {
                            for (iRule = 0; iRule < aCondition[iCondition].Rules.length; iRule++) {
                                if (aCondition[iCondition].Rules[iRule].Rows == oData.Rows) {
                                    if (oSelectedItemData.AttributeId) {
                                        aCondition[iCondition].Rules[iRule].Value = oSelectedItemData.AttributeId;
                                        aCondition[iCondition].Rules[iRule].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.AttributeId + ")";
                                        aCondition[iCondition].Rules[iRule].Values = [{ Operator: "EQ", Value: oSelectedItemData.AttributeId }];
                                        aCondition[iCondition].Rules[iRule].ValueRange = [];
                                    } else {
                                        aCondition[iCondition].Rules[iRule].Value = oSelectedItemData.ListId;
                                        aCondition[iCondition].Rules[iRule].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.ListId + ")";
                                        aCondition[iCondition].Rules[iRule].Values = [{ Operator: "EQ", Value: oSelectedItemData.ListId }];
                                        aCondition[iCondition].Rules[iRule].ValueRange = [];
                                    }

                                    break;
                                }
                            }
                        }
                    }
                    oRuleData.types[0].Condition = aCondition;
                } else {
                    aCondition = oRuleData.types[1].Condition;
                    for (iCondition = 0; iCondition < aCondition.length; iCondition++) {
                        if (aCondition[iCondition].CTypeID == oData.CTypeID) {
                            for (iRule = 0; iRule< aCondition[iCondition].Rules.length; iRule++) {
                                if (aCondition[iCondition].Rules[iRule].Rows == oData.Rows) {
                                    if (oSelectedItemData.AttributeId) {
                                        aCondition[iCondition].Rules[iRule].Value = oSelectedItemData.AttributeId;
                                        aCondition[iCondition].Rules[iRule].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.AttributeId + ")";
                                        aCondition[iCondition].Rules[iRule].ValueRange = [];
                                        aCondition[iCondition].Rules[iRule].Values = [{ Operator: "EQ", Value: oSelectedItemData.AttributeId }];

                                    } else {
                                        aCondition[iCondition].Rules[iRule].Value = oSelectedItemData.ListId;
                                        aCondition[iCondition].Rules[iRule].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.ListId + ")";
                                        aCondition[iCondition].Rules[iRule].ValueRange = [];
                                        aCondition[iCondition].Rules[iRule].Values = [{ Operator: "EQ", Value: oSelectedItemData.ListId }];

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
            _preparePreconditionRuleBody: function (oCondition, iCondition) {
                var lArr = oCondition.to_Rule.results, i, oRule, aRules = [], oValue;
                if (lArr.length > 0) {
                    for (i = 0; i < lArr.length; i++) {
                        oRule = new Rule();
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
                var oValue = {}, iResult, i, sValue = "", lArrValue = new Array(), lArrValueR = new Array();
                if (aResult.length > 0) {
                    if (aResult.length > 1) {
                        for (iResult = 0; iResult < aResult.length; iResult++) {
                            if (iResult == 0) {
                                oValue["Operator"] = aResult[iResult].Operator;
                            }
                            if (aResult[iResult].Operator == "BT") {
                                //sValue = aResult[iResult].Value;
                                if (({}).hasOwnProperty.call(aResult[iResult].to_ValueRange, "results") && aResult[iResult].to_ValueRange.results.length > 0) {
                                    for (i = 0; i < aResult[iResult].to_ValueRange.results.length; i++) {
                                        lArrValueR.push(aResult[iResult].to_ValueRange.results[i]);
                                    }
                                }

                            } else {
                                if (iResult == 0) {
                                    sValue = aResult[iResult].Value;
                                    oValue["Operator"] = aResult[iResult].Operator;
                                }
                                lArrValue.push({ Operator: aResult[iResult].Operator, Value: aResult[iResult].Value, ValueDesc: aResult[iResult].ValueDesc })
                            }

                        }
                        oValue["Value"] = sValue;
                        oValue["ValueDesc"] = sValue;
                        oValue["Values"] = lArrValue;
                        oValue["ValueRange"] = [];
                        if (lArrValueR.length > 0) {
                            for (i = 0; i < 2; i++) {
                                if (sValue != "") {
                                    sValue += " to ";
                                }
                                sValue += lArrValueR[i].Value;
                            }
                            oValue["ValueRange"] = this._readRuleValueRangeValues(lArrValueR, oValue);
                            oValue["ValueDesc"] = sValue;
                        }
                        // if (({}).hasOwnProperty.call(aResult[iResult].to_ValueRange, "results") && aResult[iResult].to_ValueRange.results.length > 0) {

                        // }
                        // else {
                        //     oValue["Values"] = [{ Operator: aResult[iResult].Operator, Value: aResult[iResult].Value }];
                        // }
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
                for (var i = 0; i < oRuleData.types.length; i++) {
                    if (oRuleData.types[i].RuleType == "Rules") {
                        oValue = oRuleData.types[i];
                    }
                }
                var oRule = new Rule();
                if (!oValue) {
                    oRule["RuleType"] = "Rules";
                    oRule["Rows"] = 1;
                    oRuleData.types[1] = {};
                    oRuleData.types[1].Condition = new Array();
                    oRuleData.types[1].Condition.push({

                        CType: "IF",
                        CTypeID: 1,
                        RuleType: "Rules",
                        Rules: [
                            oRule
                        ]
                    }
                    );
                } else {
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
                            // oRuleData.types[1].Condition.push({
                            //     CType: "END IF",
                            //     CTypeID: 200,
                            //     Rules: []
                            // });
                        } else {
                            oRuleData.types[1].Condition = this._reindexCondition(oRuleData.types[1].Condition);
                            //                    oRuleData.types[1].Condition.pop();
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
                            // oRuleData.types[1].Condition.push({
                            //     CType: "END IF",
                            //     CTypeID: 200,
                            //     RuleType: "Rules",
                            //     Rules: []
                            // });
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
                            if (aRules.length > 0) {
                                aCondition[i].Rules = aRules;

                            } else {
                                aCondition.splice(i, 1);
                            }

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
                        if ((aValues[i].split("to")[0] && aValues[i].split("to")[0].trim() != "") && (aValues[i].split("to")[1] && aValues[i].split("to")[1].trim() != "")) {
                            oRule["ValueRange"].push({ Operator: oRule.Operator, Lower: aValues[i].split("to")[0], Upper: aValues[i].split("to")[1] })
                        }
                    }
                } else {
                    aValues = oRule.ValueDesc.split(",");
                    for (i = 0; i < aValues.length; i++) {
                        if (aValues[i] && aValues[i].trim() != "") {
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
                            oCondition["CondId"] = Number.isFinite(aCondition[iCondition].CTypeID) ? String(aCondition[iCondition].CTypeID) : aCondition[iCondition].CTypeID;
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
                                                _aValues.push({ Lower: aValueRanges[iValueRange].Lower, Upper: aValueRanges[iValueRange].Upper });
                                            }
                                        } else {
                                            // var lArrValueDesc = aRules[iRule].ValueDesc.split(",");
                                            // if (lArrValueDesc.length > aValueRanges.length) {
                                            //     aValueRanges = this._updateValuesWithValueDesc(lArrValueDesc, aValueRanges, true);
                                            // } else {
                                            //     aValueRanges = this._updateValuesWithValueDesc(lArrValueDesc, aValueRanges, false);
                                            // }
                                            for (iValueRange = 0; iValueRange < aValueRanges.length; iValueRange++) {
                                                _aValues.push({ Value: aValueRanges[iValueRange].Value, Operator: aValueRanges[iValueRange].Operator });
                                            }
                                        }
                                    }

                                    if (aRules[iRule].ValueDesc != "" && aRules[iRule].Value == "") {
                                        _aValues.push({ Value: aRules[iRule].ValueDesc, Operator: aRules[iRule].Operator });
                                    }
                                    if (aRules[iRule].Operator == "BT") {
                                        for (var k = 0; k < _aValues.length; k++) {
                                            _oRule = {};
                                            _oRule["AttributeId"] = aRules[iRule].Attribute;
                                            _oRule["to_Value"] = [];
                                            _oRule["to_Value"].push({ Operator: aRules[iRule].Operator, to_ValueRange: [{ Value: _aValues[k].Lower }, { Value: _aValues[k].Upper }] });
                                            oCondition["to_Rule"].push(_oRule);
                                        }

                                    } else {
                                        for (var i = 0; i < _aValues.length; i++) {
                                            _oRule["to_Value"].push(_aValues[i]);
                                        }
                                        oCondition["to_Rule"].push(_oRule);
                                    }

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
            _updateValuesWithValueDesc: function (aDesc, aValues, bAddition) {
                var i, j, bMatched = false, lArr = new Array(), aFinalValues = new Array();
                if (bAddition) {
                    for (i = 0; i < aDesc.length; i++) {
                        bMatched = false;
                        for (j = 0; j < aValues.length; j++) {
                            if (aDesc[i].trim() == aValues[j].Value) {
                                bMatched = true;
                                break;
                            }
                        }
                        if (!bMatched) {
                            lArr.push({ Value: aDesc[i].trim(), Operator: "EQ", ValueDesc: "" });
                        }
                    }
                    aFinalValues = aValues.concat(lArr);
                } else {
                    for (i = 0; i < aDesc.length; i++) {
                        for (j = 0; j < aValues.length; j++) {
                            if (aDesc[i].trim() == aValues[j].Value) {
                                aFinalValues.push(aValues[j]);
                                break;
                            }
                        }
                    }
                }
                return aFinalValues;
            }
        };

    });