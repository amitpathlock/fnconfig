sap.ui.define(["sap/ui/model/json/JSONModel",
    "pl/dac/apps/fnconfig/control/Rule",
    "sap/ui/core/HTML",
    "sap/m/Panel",
    "sap/m/Toolbar",
    "sap/m/Button",
    "pl/dac/apps/fnconfig/const/PlDacConst"
],
    function (JSONModel, Rule, HTML, Panel, Toolbar, Button,PlDacConst) {
        "use strict";
        /**
     * Rule Utility Library
     * 
     * Contains helper functions to create, edit, delete and render rules
     * in a rule builder UI. This module is used by RuleBuilder controller
     * to manage rule models and dialogs.
     * 
     * @namespace pl.dac.apps.fnconfig.helper.RuleModelHandler
     */
        return {
            /**
         * Prepares a JSON model for the rule builder UI from OData results.
         * 
         * It builds a structure containing precondition rules and normal rules,
         * grouping them into `types`.
         * 
         * @param {sap.ui.core.mvc.View} oView - View instance containing models.
         * @param {Array} aResults - OData results array (Condition + Rules + Values).
         * @returns {void}
         */
            prepareRuleModel: function (oView, aResults) {
                var iResult, oCondition, oConditionRules, lRuleTypes = [],
                    lArr = [];
                for (iResult = 0; iResult < aResults.length; iResult++) {
                    if (aResults[iResult].CType == PlDacConst.PRE_CONDITION_CTYPE && iResult == 0) {
                        oCondition = {
                            RuleType: PlDacConst.PRE_CONDITION_RULE_TYPE,
                            Condition: []
                        };
                        oConditionRules = {
                            CType: "IF",
                            RuleType: PlDacConst.PRE_CONDITION_RULE_TYPE,
                            Rows:iResult+1,
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
                                    CTypeID: iResult+1,
                                    Rules: []
                                };
                                oConditionRules["Rules"] = this._prepareRuleBody(aResults[iResult], iResult+1);
                                lArr.push(oConditionRules);
                            }
                        } else {
                            oConditionRules = {
                                CType: "ELSE IF",
                                RuleType: "Rules",
                                CTypeID: iResult+1,
                                Rules: []
                            };
                            oConditionRules["Rules"] = this._prepareRuleBody(aResults[iResult], iResult+1);
                            lArr.push(oConditionRules);

                        }
                    }
                }//End of for loop
                if (lArr.length > 0) {
                    oCondition.Condition = lArr;
                    lRuleTypes.push(oCondition);
                }
                // this.createDiplayRuleReadOnly(lRuleTypes,oView.getController());
                oView.getModel("ruleModel").setData({ types: lRuleTypes });
            },

            /**
         * Creates a read-only rule display panel.
         * 
         * This method builds HTML markup dynamically to show rules in a formatted
         * block. Used for display purposes only.
         * 
         * @param {Array} lRuleTypes - Prepared rule structure from `prepareRuleModel`.
         * @param {sap.ui.core.mvc.Controller} oController - Controller instance for Edit action.
         * @returns {sap.m.Panel} Rendered panel containing HTML rule display.
         */
            createDiplayRuleReadOnly: function (lRuleTypes, oView) {
                var iRule, sBtnText, sBtnIcon, iCondition, oContent, sPolicyName, iRuleTypes, oToolbar,
                    oSubSection = oView.byId("idRuleSubSectionBlock"), aPrecondition = null, aRulesCondition = null, sPreConditon = "", sRule = "", aRules;
                for (iRuleTypes = 0; iRuleTypes < lRuleTypes.length; iRuleTypes++) {
                    if (lRuleTypes[iRuleTypes].RuleType ==PlDacConst.PRE_CONDITION_RULE_TYPE) {
                        aPrecondition = lRuleTypes[iRuleTypes].Condition;
                    } else {
                        aRulesCondition = lRuleTypes[iRuleTypes].Condition;
                    }
                }

                if (aPrecondition && aPrecondition.length > 0) {
                    sPreConditon = "<div class=\"plDacHTMLruleBlock\"><div class=\"plDacHTMLRuleTitle\">Precondition:</div>";
                    sPreConditon += "<div class=\"plDacHTMLIfblock\" ><div style=\"height: 23px;\">IF</div>";
                    for (iCondition = 0; iCondition < aPrecondition.length; iCondition++) {
                        aRules = aPrecondition[iCondition].Rules;
                        for (iRule = 0; iRule < aRules.length; iRule++) {
                            if (iRule == 0) {
                                sPreConditon += "<div class=\"plDacHTMLRuleLine\">" + aRules[iRule].Attribute + "<b style=\"margin-left:12px;margin-right:12px;\">" + aRules[iRule].Operator + "</b>" + this._mergeValues(aRules[iRule]) + "</div>";
                            } else {
                                sPreConditon += "<div class=\"plDacHTMLRuleLine\"><span style=\"margin-right:10px;\">" + aRules[iRule].ContitionType + "</span>" + aRules[iRule].Attribute + "<b style=\"margin-left:12px;margin-right:12px;\">" + aRules[iRule].Operator + "</b>" + this._mergeValues(aRules[iRule]) + "</div>";
                            }
                        }
                    }
                    sPreConditon += "</div></div>";
                    sPreConditon += "<div style=\"background:#fff;padding-left: 1rem;\">*******************************************************************</div>";
                }

                if (aRulesCondition && aRulesCondition.length > 0) {
                    sRule = "<div class=\"plDacHTMLruleBlock\"><div class=\"plDacHTMLRuleTitle\">Rule:</div>";
                    sRule += "<div class=\"plDacHTMLIfblock\" ><div style=\"height: 23px;\">IF</div>";
                    for (iCondition = 0; iCondition < aRulesCondition.length; iCondition++) {
                        aRules = aRulesCondition[iCondition].Rules;
                        if (aRulesCondition[iCondition].CType == "ELSE IF") {
                            sRule += "<div class=\"plDacHTMLRuleOR\">OR</div>";
                            sRule += "<div style=\"height: 23px;\">IF</div>";
                        }
                        for (iRule = 0; iRule < aRules.length; iRule++) {
                            if (iRule == 0) {
                                sRule += "<div class=\"plDacHTMLRuleLine\">" + aRules[iRule].Attribute + "<b style=\"margin-left:12px;margin-right:12px;\">" + aRules[iRule].Operator + "</b>" + this._mergeValues(aRules[iRule]) + "</div>";
                            } else {
                                sRule += "<div class=\"plDacHTMLRuleLine\"><span style=\"margin-right:10px;\">" + aRules[iRule].ContitionType + "</span>" + aRules[iRule].Attribute + "<b style=\"margin-left:12px;margin-right:12px;\">" + aRules[iRule].Operator + "</b>" + this._mergeValues(aRules[iRule]) + "</div>";
                            }
                        }
                    }
                    sRule += "</div></div>";
                }

                sPolicyName = oView.getElementBinding().oElementContext.getProperty("PolicyName");
                if (sPreConditon == "" && sRule == "") {
                    oContent = new sap.m.Title({
                        text: "There is no rule data available for the policy `" + sPolicyName + "`.",
                        visible: "{viewModel>/ShowNoRecordFound}"
                    });
                    oContent.addStyleClass("plDacNoRecordFound");
                    sBtnIcon = "sap-icon://add";
                    sBtnText = "Manage Rule";
                } else {
                    oContent = new HTML({
                        // The 'content' property holds the raw HTML string
                        content:
                            sPreConditon + sRule,
                        preferDOM: true // Renders the HTML as a native DOM element
                    });
                    sBtnIcon = "sap-icon://edit";
                    sBtnText = "Modify Rule";
                }
                oToolbar = new Toolbar({
                    content: [
                        new sap.m.ToolbarSpacer(), // Pushes buttons to the right
                        new Button({ text: sBtnText, icon: sBtnIcon, press: oView.getController().onPressEditRuleBtn.bind(oView.getController()) }).addStyleClass("plDacHTMLEditBtn"),
                    ]
                });
                oToolbar.addStyleClass("plDacHTMLRuleToolbar");
                oSubSection.removeAllBlocks();
                return new Panel({
                    // headerToolbar: oHeaderToolbar,
                    content: [oToolbar, oContent]
                }).addStyleClass("plDacRulePanel");
            },

            /**
         * Converts rule values and value ranges into a readable string format.
         * Used in display mode to show combined values like:
         *  - "10, 20, 30"
         *  - "10 to 20, 30 to 40"
         *
         * @param {Object} oRule - Rule object containing Value/Values/ValueRange.
         * @param {string} oRule.Operator - Operator type (e.g., EQ, BT).
         * @param {Array<Object>} oRule.Values - Array of value objects.
         * @param {Array<Object>} oRule.ValueRange - Array of range objects.
         * @returns {string} A formatted string representation of the rule values.
         */
            _mergeValues: function (oRule) {
                var aValueRange, iValueRange, bComman = false, sMergeValue = "", aValueRangeU, iValueRangeU;
                if (oRule.Operator == "BT") {

                    aValueRange = oRule.ValueRange;
                    for (iValueRange = 0; iValueRange < aValueRange.length; iValueRange++) {
                        if (iValueRange > 0) {
                            sMergeValue += ",&ensp;&ensp;";
                        }
                        sMergeValue += "<span style=\"margin-right:12px;\">" + aValueRange[iValueRange].Lower + "</span >AND<span style=\"margin-left:12px;margin-right:0;\">" + aValueRange[iValueRange].Upper + "</span>";
                    }
                    sMergeValue = this._mergeValueRangeAndValueContition(oRule.Values, oRule, sMergeValue);
                } else {
                    aValueRange = oRule.Values;
                    //var bComman = false;
                    aValueRangeU = Array.from(new Map(oRule.Values.map(item => [item.Operator, item])).values());
                    for (iValueRangeU = 0; iValueRangeU < aValueRangeU.length; iValueRangeU++) {
                        if (iValueRangeU == 0) {
                            for (iValueRange = 0; iValueRange < aValueRange.length; iValueRange++) {
                                if (aValueRangeU[iValueRangeU].Operator == aValueRange[iValueRange].Operator) {
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
                                if (aValueRangeU[iValueRangeU].Operator == aValueRange[iValueRange].Operator) {
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
            /**
             * Merges value range conditions from a rule object into a formatted HTML string.
             *
             * This function groups rule values by their `Operator` and appends them to the
             * provided `sMergeValue` string. Each operator is displayed in bold, followed by
             * its corresponding values separated by commas.
             *
             * Duplicate operators are consolidated before rendering. The output format uses
             * HTML entities and inline styles for spacing and indentation.
             *
             * @private
             * @function _mergeValueRangeAndValueContition
             *
             * @param {Array<Object>} aValueRange - (Unused parameter) Originally intended to hold value ranges.
             * @param {Object} oRule - Rule object containing a `Values` array.
             * @param {Array<Object>} oRule.Values - Array of value condition objects.
             * @param {string} oRule.Values[].Operator - The comparison operator (e.g., '=', '>', '<=', etc.).
             * @param {string|number} oRule.Values[].Value - The value associated with the operator.
             * @param {string} sMergeValue - Existing formatted string to which the value conditions will be appended.
             *
             * @returns {string} Updated HTML-formatted string containing grouped operators and their values.
             *
             * @example
             * const rule = {
             *   Values: [
             *     { Operator: "=", Value: "100" },
             *     { Operator: "=", Value: "200" },
             *     { Operator: ">", Value: "500" }
             *   ]
             * };
             *
             * const result = this._mergeValueRangeAndValueContition(null, rule, "");
             *
             * // Output (formatted HTML string):
             * // ",   =   100, 200   >   500"
             */

            _mergeValueRangeAndValueContition: function (aValueRange, oRule, sMergeValue) {
                var bComman = false, iValueRangeU, aValueRangeU, iValueRange; aValueRange = oRule.Values;
                if (aValueRange && aValueRange.length > 0) {
                    sMergeValue += ", "
                    aValueRangeU = Array.from(new Map(oRule.Values.map(item => [item.Operator, item])).values());
                    for (iValueRangeU = 0; iValueRangeU < aValueRangeU.length; iValueRangeU++) {
                        if (iValueRangeU == 0) {
                            sMergeValue += "&ensp;&ensp;<b>" + aValueRangeU[iValueRangeU].Operator + "</b>&ensp;&ensp;";
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
            /**
         * Ensures rule object has valid arrays for ValueRange and Values.
         * It also parses `ValueDesc` to fill the arrays based on operator type.
         *
         * @param {Object} oCustomData - Rule object containing Operator and ValueDesc.
         * @returns {void}
         */
            loadInitialModelValues: function (oCustomData) {
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
                        aValues = oCustomData.ValueDesc ? oCustomData.ValueDesc.split(",") : [];
                        for (iValue = 0; iValue < aValues.length; iValue++) {
                            oCustomData["Values"].push({ Operator: oCustomData.Operator, Value: aValues[iValue] });
                        }
                    }
                }
            },

            /**
        * Updates the rule model when the user selects values from the value dialog.
        * This updates the rule's `Values` or `ValueRange` arrays and updates display fields.
        *
        * @param {sap.m.Dialog} oDialog - Dialog where values are selected.
        * @param {sap.ui.core.mvc.View} oView - View that contains the ruleModel.
        * @returns {void}
        */
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
                if (oData.RuleType == PlDacConst.PRE_CONDITION_RULE_TYPE) {
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
                    aCondition = oRuleModel.types[oRuleModel.types.length - 1].Condition;
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
                    oRuleModel.types[oRuleModel.types.length - 1].Condition = aCondition;
                }
                oView.getModel("ruleModel").setData(oRuleModel);
                oView.getModel("ruleModel").refresh();
                oDialog.close();
            },

            /**
         * Updates rule model when user selects attribute/list item from selection dialog.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing the rule model.
         * @param {sap.m.Dialog} oDialog - Selection dialog.
         * @param {Object} oSelectedItemData - Selected item data from dialog.
         * @returns {void}
         */
            updateRuleModelWithUserAttrSelectionData: function (oView, oDialog, oSelectedItemData) {
                var iCondition, aCondition, iRule, oData, oRuleData;
                oData = oDialog.getModel("setting").getData();
                oDialog.close();
                oRuleData = oView.getModel("ruleModel").getData();

                if (oData.RuleType == PlDacConst.PRE_CONDITION_RULE_TYPE) {
                    aCondition = oRuleData.types[0].Condition;
                    for (iCondition = 0; iCondition < aCondition.length; iCondition++) {
                        if (aCondition[iCondition].CTypeID == oData.CondId) {
                            for (iRule = 0; iRule < aCondition[iCondition].Rules.length; iRule++) {
                                if (aCondition[iCondition].Rules[iRule].Rows == oData.Rows) {
                                    if (oSelectedItemData.AttributeId) {
                                        aCondition[iCondition].Rules[iRule].Value = oSelectedItemData.AttributeId;
                                        aCondition[iCondition].Rules[iRule].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.AttributeId + ")";
                                        aCondition[iCondition].Rules[iRule].Values = [{ Operator: oData.Operator, Value: oSelectedItemData.AttributeId }];
                                        aCondition[iCondition].Rules[iRule].ValueRange = [];
                                    } else {
                                        aCondition[iCondition].Rules[iRule].Value = oSelectedItemData.ListId;
                                        aCondition[iCondition].Rules[iRule].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.ListId + ")";
                                        aCondition[iCondition].Rules[iRule].Values = [{ Operator: oData.Operator, Value: oSelectedItemData.ListId }];
                                        aCondition[iCondition].Rules[iRule].ValueRange = [];
                                    }

                                    break;
                                }
                            }
                        }
                    }
                    oRuleData.types[0].Condition = aCondition;
                } else {
                    aCondition = oRuleData.types[oRuleData.types.length - 1].Condition;
                    for (iCondition = 0; iCondition < aCondition.length; iCondition++) {
                        if (aCondition[iCondition].CTypeID == oData.CTypeID) {
                            for (iRule = 0; iRule < aCondition[iCondition].Rules.length; iRule++) {
                                if (aCondition[iCondition].Rules[iRule].Rows == oData.Rows) {
                                    if (oSelectedItemData.AttributeId) {
                                        aCondition[iCondition].Rules[iRule].Value = oSelectedItemData.AttributeId;
                                        aCondition[iCondition].Rules[iRule].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.AttributeId + ")";
                                        aCondition[iCondition].Rules[iRule].ValueRange = [];
                                        aCondition[iCondition].Rules[iRule].Values = [{ Operator: oData.Operator, Value: oSelectedItemData.AttributeId }];

                                    } else {
                                        aCondition[iCondition].Rules[iRule].Value = oSelectedItemData.ListId;
                                        aCondition[iCondition].Rules[iRule].ValueDesc = oSelectedItemData.Description + "(" + oSelectedItemData.ListId + ")";
                                        aCondition[iCondition].Rules[iRule].ValueRange = [];
                                        aCondition[iCondition].Rules[iRule].Values = [{ Operator: oData.Operator, Value: oSelectedItemData.ListId }];

                                    }
                                    break;
                                }
                            }
                        }
                    }
                    oRuleData.types[oRuleData.types.length - 1].Condition = aCondition;
                }
                oView.getModel("ruleModel").setData(oRuleData);
            },

            /**
         * Builds precondition rule objects from OData condition response.
         * Each rule is created as a `Rule` object and filled with attribute & value data.
         *
         * @private
         * @param {Object} oCondition - OData condition object.
         * @param {number} iCondition - Index of condition block.
         * @returns {Array<Object>} Array of prepared rule objects.
         */
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
                        oRule["RuleType"] = PlDacConst.PRE_CONDITION_RULE_TYPE;
                        oRule["CondId"] = lArr[i].CondId;
                        oRule["ValueRange"] = oValue.ValueRange;
                        oRule["Values"] = oValue.Values;
                        aRules.push(oRule);
                    }
                }
                return aRules;
            },

            /**
         * Builds normal rule objects from OData condition response.
         *
         * @private
         * @param {Object} oCondition - OData condition object.
         * @param {number} iCondition - Index of condition block.
         * @returns {Array<Object>} Array of prepared rule objects.
         */
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
            /**
         * Reads values and ranges from OData value results.
         * Supports both single values and range values.
         *
         * @private
         * @param {Array<Object>} aResult - Array of value records from OData.
         * @returns {Object} Parsed value object with Value, ValueDesc, Values, ValueRange.
         */
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
                            if (sValue == "") {
                                for (i = 0; i < 2; i++) {
                                    if (sValue != "") {
                                        sValue += " to ";
                                    }
                                    sValue += lArrValueR[i].Value;
                                }
                            }

                            oValue["ValueRange"] = this._readRuleValueRangeValues(lArrValueR, oValue);
                            oValue["ValueDesc"] = sValue;
                        }
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

            /**
         * Converts raw ValueRange records into internal range structure.
         *
         * @private
         * @param {Array<Object>} aResult - Value range records.
         * @param {Object} oValue - Rule value object to be updated.
         * @returns {Array<Object>} Parsed range array.
         */
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

            /**
         * Inserts a new condition block into rule model.
         * If rule block doesn't exist, it creates one.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing ruleModel.
         * @param {sap.m.Button} oButton - Button clicked to insert condition.
         * @returns {void}
         */
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
                    oRuleData.types[oRuleData.types.length - 1] = {};
                    oRuleData.types[oRuleData.types.length - 1].Condition = new Array();
                    oRuleData.types[oRuleData.types.length - 1].Condition.push({

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
                        if (oRuleData.types[oRuleData.types.length - 1].Condition.length == 0) {
                            oRule["RuleType"] = "Rules";
                            oRule["Rows"] = 1;
                            oRuleData.types[oRuleData.types.length - 1].Condition.push({

                                CType: "IF",
                                CTypeID: 1,
                                RuleType: "Rules",
                                Rules: [
                                    oRule
                                ]
                            });
                        } else {
                            oRuleData.types[oRuleData.types.length - 1].Condition = this._reindexCondition(oRuleData.types[oRuleData.types.length - 1].Condition);

                            oRule["ContitionType"] = "OR";
                            oRule["CTypeID"] = oRuleData.types[oRuleData.types.length - 1].Condition.length + 1;
                            oRule["Rows"] = 1;
                            oRule["RuleType"] = "Rules";
                            oRuleData.types[oRuleData.types.length - 1].Condition.push({

                                CType: "ELSE IF",
                                CTypeID: oRuleData.types[oRuleData.types.length - 1].Condition.length + 1,
                                RuleType: "Rules",

                                Rules: [
                                    oRule
                                ]
                            }
                            );
                        }
                    }
                }
                oView.getModel("ruleModel").setData(oRuleData);
            },

            /**
         * Reindexes the rule rows after deletion or insertion.
         *
         * @private
         * @param {Array<Object>} aRules - Array of rules.
         * @returns {Array<Object>} Updated rule array with correct row numbers.
         */
            _reindexConditionRules: function (aRules) {
                var i;
                for (i = 0; i < aRules.length; i++) {
                    aRules[i].Rows = i + 1;
                }
                return aRules;
            },

            /**
         * Deletes an inline rule from a specific condition block.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing ruleModel.
         * @param {sap.m.Button} oButton - Button containing rule info in custom data.
         * @returns {void}
         */
            deleteInlineRule: function (oView, oButton) {
                var i, aRules, nRules = new Array(), j, aCondition, oRuleData, oValue;
                oValue = oButton.getCustomData()[0].getValue();
                oRuleData = oView.getModel("ruleModel").getData();
                if (oValue.RuleType == "Rules") {
                    aCondition = oRuleData.types[oRuleData.types.length - 1].Condition;
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
                    if (aCondition.length == 0) {
                        oRuleData.types.splice(oRuleData.types.length - 1, 1);
                        oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", true);
                        oView.getModel("viewModel").setProperty("/bVisibleAddCondition", false);
                    } else {
                        oRuleData.types[oRuleData.types.length - 1].Condition = aCondition;
                        oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", false);
                    }

                } else {
                    aCondition = oRuleData.types[0].Condition;
                    for (i = 0; i < aCondition.length; i++) {
                        if (aCondition[i].CTypeID == oValue.CondId) {
                            aRules = aCondition[i].Rules;
                            for (j = 0; j < aRules.length; j++) {
                                if (aRules[j].Rows !== oValue.Rows) {
                                    nRules.push(aRules[j]);
                                }
                            }
                            aRules = this._reindexConditionRules(nRules);

                            if (aRules.length == 0) {
                                aCondition.splice(i, 1);
                                oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", true);
                            } else {
                                aCondition[i].Rules = aRules;
                            }
                            break;
                        }
                    }
                    if (aCondition.length == 0) {
                        oRuleData.types.splice(0, 1);
                        oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", true);
                    } else {
                        oRuleData.types[0].Condition = aCondition;
                    }

                }
                oView.getModel("ruleModel").setData(oRuleData);
            },
            /**
         * Deletes an entire rule block (IF / ELSE IF).
         *
         * @param {sap.ui.core.mvc.View} oView - View containing ruleModel.
         * @param {sap.m.Button} oButton - Button containing rule info in custom data.
         * @returns {void}
         */
            deleteEntireRuleBlock: function (oView, oButton) {
                var i, nConditions = [], aCondition;
                var oValue = oButton.getCustomData()[0].getValue();
                var oRuleData = oView.getModel("ruleModel").getData();
                if (oValue.RuleType == "Rules") {
                    if (oValue.CTypeID == 0) {
                        oRuleData.types.splice(oRuleData.types.length - 1, 1);
                        oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", true);
                        oView.getModel("viewModel").setProperty("/bVisibleAddCondition", false);
                    } else {
                        aCondition = oRuleData.types[oRuleData.types.length - 1].Condition;
                        if (aCondition.length > 0 && aCondition[0].CTypeID == oValue.CTypeID) {
                            oRuleData.types.splice(oRuleData.types.length - 1, 1);
                            oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", true);
                            oView.getModel("viewModel").setProperty("/bVisibleAddCondition", false);
                        } else {
                            for (i = 0; i < aCondition.length; i++) {
                                if (aCondition[i].CTypeID == oValue.CTypeID) {
                                    aCondition.splice(i, 1);
                                }
                            }
                            if (aCondition.length == 0) {
                                oRuleData.types.splice(oRuleData.types.length - 1, 1);
                                oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", true);
                                oView.getModel("viewModel").setProperty("/bVisibleAddCondition", false);
                            } else {
                                oRuleData.types[oRuleData.types.length - 1].Condition = aCondition;
                                oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", false);
                            }
                        }

                    }
                } else {
                    aCondition = oRuleData.types[0].Condition;
                    if (oValue.CTypeID == 1 && aCondition.length == 2) {
                        oRuleData.types[oRuleData.types.length - 1].Condition = nConditions;
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
                        if (nConditions.length == 0) {
                            oRuleData.types.splice(0, 1);
                            oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", true);
                        } else {
                            oRuleData.types[0].Condition = nConditions;
                        }
                    }
                }
                oView.getModel("ruleModel").setData(oRuleData);
            },
            /**
         * Reindexes condition blocks after a delete operation.
         *
         * @private
         * @param {Array<Object>} aCondition - Array of condition blocks.
         * @returns {Array<Object>} Updated condition array.
         */
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

            /**
         * Inserts a new rule into the selected condition block.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing ruleModel.
         * @param {sap.m.Button} oButton - Button with custom data.
         * @returns {void}
         */
            insertRuleInBlock: function (oView, oButton) {
                var i, iLen, oRule, oValue, oRuleData;
                oValue = oButton.getCustomData()[0].getValue();
                oRuleData = oView.getModel("ruleModel").getData();
                // if (oRuleData.types.length == 1) {
                //  aCondition = oRuleData.types[0].Condition;
                // } else {
                aCondition = oRuleData.types[oRuleData.types.length - 1].Condition;
                // }
                if (oValue.RuleType == "Rules") {
                    //var aCondition = oRuleData.types[1].Condition;
                    for (i = 0; i < aCondition.length; i++) {
                        if (aCondition[i].CTypeID == oValue.CTypeID) {
                            aCondition[i].Rules = this._reindexConditionRules(aCondition[i].Rules);
                            iLen = aCondition[i].Rules.length;
                            oRule = {};
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
                    oRuleData.types[oRuleData.types.length - 1].Condition = aCondition;
                } else {
                    var aCondition = oRuleData.types[0].Condition;
                    for (i = 0; i < aCondition.length; i++) {
                        if (aCondition[i].CTypeID == oValue.CTypeID) {
                            aCondition[i].Rules = this._reindexConditionRules(aCondition[i].Rules);
                            oRule = {};
                            iLen = aCondition[i].Rules.length;
                            oRule["CTypeID"] = oValue.CTypeID;
                            oRule["Rows"] = iLen + 1;
                            oRule["CondId"]= oValue.CTypeID;
                            oRule["RuleType"] = PlDacConst.PRE_CONDITION_RULE_TYPE;
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

            /**
         * Updates rule model after user selects suggestion item from input.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing ruleModel.
         * @param {sap.m.Input} oInput - Input control with custom data.
         * @param {sap.ui.core.Item} oItem - Selected suggestion item.
         * @returns {void}
         */
            updateRuleModelWithSuggestionItem: function (oView, oInput, oItem) {
                var i, aCondition, j, oData, oValue, oRuleData;
                oData = oInput.getCustomData()[0].getValue();
                oValue = oItem.getBindingContext().getObject();
                oRuleData = oView.getModel("ruleModel").getData();
                if (oData.RuleType == PlDacConst.PRE_CONDITION_RULE_TYPE) {
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
                    aCondition = oRuleData.types[oRuleData.types.length - 1].Condition;
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
                    oRuleData.types[oRuleData.types.length - 1].Condition = aCondition;
                }
                oView.getModel("ruleModel").setData(oRuleData);
            },

            /**
         * Updates rule model after value help selection token is chosen.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing ruleModel.
         * @param {sap.m.Token} oToken - Selected token from value help.
         * @param {sap.m.Dialog} oDialog - Value help dialog.
         * @returns {void}
         */
            updateRuleModelWithValueHelpItem: function (oView, oToken, oDialog) {
                var i, aCondition, j, oData, oRuleData, oValue;
                oData = oDialog.getModel("condition").getData();
                oRuleData = oView.getModel("ruleModel").getData();
                oValue = oToken.getCustomData()[0].getValue();
                if (oData.RuleType == PlDacConst.PRE_CONDITION_RULE_TYPE) {
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
                    aCondition = oRuleData.types[oRuleData.types.length - 1].Condition;
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
                    oRuleData.types[oRuleData.types.length - 1].Condition = aCondition;
                }
                oView.getModel("ruleModel").setData(oRuleData);
            },

            /**
         * Loads a JSON model for Single Values selection dialog.
         *
         * @param {sap.m.Dialog} oDialog - Dialog instance.
         * @param {sap.ui.model.json.JSONModel} oSettingModel - Model containing rule settings.
         * @param {Object} oCustomData - Custom data for rule values.
         * @returns {void}
         */
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

            /**
         * Loads a JSON model for Value Ranges selection dialog.
         *
         * @param {sap.m.Dialog} oDialog - Dialog instance.
         * @param {sap.ui.model.json.JSONModel} oSettingModel - Model containing rule settings.
         * @param {Object} oCustomData - Custom data for rule ranges.
         * @returns {void}
         */
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

            /**
         * Updates the Ranges model with existing values from rule.
         *
         * @private
         * @param {sap.m.Dialog} oDialog - Dialog instance.
         * @param {Array<Object>} aValues - Existing range values.
         * @param {Array<Object>} aItems - Template range items.
         * @returns {void}
         */
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

            /**
         * Updates the Single Values model with existing values from rule.
         *
         * @private
         * @param {sap.m.Dialog} oDialog - Dialog instance.
         * @param {Array<Object>} aValues - Existing values.
         * @param {Array<Object>} aItems - Template value items.
         * @returns {void}
         */
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

            /**
        * Converts a ValueDesc string into Values or ValueRange arrays.
        *
        * This is used when user enters a free text value and it needs conversion.
        *
        * @private
        * @param {Object} oRule - Rule object containing ValueDesc.
        * @returns {Object} Updated rule object with Values or ValueRange.
        */
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

            /**
         * Converts the ruleModel into a backend payload structure.
         *
         * This payload is ready to send to the OData create API.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing current policy context.
         * @param {Array<Object>} aTypes - Array of rule types (Precondition + Rules).
         * @returns {Object} Payload object to send to backend.
         */
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
                                            for (iValueRange = 0; iValueRange < aValueRanges.length; iValueRange++) {
                                                _aValues.push({ Value: aValueRanges[iValueRange].Value, Operator: aValueRanges[iValueRange].Operator });
                                            }
                                        }
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
            }
        };
    });