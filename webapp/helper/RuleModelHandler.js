sap.ui.define(["sap/ui/model/json/JSONModel",
    "pl/dac/apps/fnconfig/control/Rule",
    "sap/ui/core/HTML",
    "sap/m/Panel",
    "sap/m/Toolbar",
    "sap/m/Button",
    "pl/dac/apps/fnconfig/const/PlDacConst"
],
    function (JSONModel,
        Rule,
        HTML,
        Panel,
        Toolbar,
        Button,
        PlDacConst) {
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
                            Rows: iResult + 1,
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
                                    CTypeID: iResult + 1,
                                    Rules: []
                                };
                                oConditionRules["Rules"] = this._prepareRuleBody(aResults[iResult], iResult + 1);
                                lArr.push(oConditionRules);
                            }
                        } else {
                            oConditionRules = {
                                CType: "ELSE IF",
                                RuleType: "Rules",
                                CTypeID: iResult + 1,
                                Rules: []
                            };
                            oConditionRules["Rules"] = this._prepareRuleBody(aResults[iResult], iResult + 1);
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

            _handleDataClassificationMultipleValues: function (aValues) {
                if (!Array.isArray(aValues) || aValues.length === 0) return "";

                const formatBT = (item) =>
                    `${item.Low} AND ${item.High}`;

                const wrap = (option, content) =>
                    `<span><b>${option}</b></span><span style='color:#107e3e;'>${content}</span>`;

                // Single value case
                if (aValues.length === 1) {
                    const item = aValues[0];
                    const content = item.Options === "BT"
                        ? formatBT(item)
                        : item.Low;

                    return wrap(item.Options, content);
                }

                // Group by Options (instead of Operator — assuming that's what you intended)
                const grouped = aValues.reduce((acc, item) => {
                    if (!acc[item.Options]) acc[item.Options] = [];
                    acc[item.Options].push(item);
                    return acc;
                }, {});

                // Build content
                let sContent = "";

                Object.keys(grouped).forEach(option => {
                    const values = grouped[option];

                    const content = values.map(item =>
                        option === "BT"
                            ? formatBT(item)
                            : item.Low
                    ).join(", ");

                    sContent += wrap(option, content);
                });

                return sContent;
            },
            createDataClassificationRuleReadOnly: function (aRules, oDialog) {
                if (!Array.isArray(aRules) || !oDialog) return;

                const wrapLine = (content, extraClass = "") =>
                    `<div class='plDacHTMLRuleLine ${extraClass}'>${content}</div>`;

                const label = (text, color) =>
                    `<span style='color:${color};font-weight:600;'>${text}</span>`;

                const span = (text, style = "") =>
                    `<span ${style}>${text}</span>`;

                let sContent = "";
                sContent = "<div style='color:#354a5f;font-size:14px;font-weight:600;margin-bottom: 2px;'>Attribute ID: " + oDialog.data("AttributeId") + "</div>";
                sContent += `<div style='color:#354a5f'>${"*".repeat(98)}</div>`;
                aRules.forEach((rule, ruleIndex) => {
                    sContent += `<div class='plDacDCRules'><b> Rule : ${ruleIndex + 1} </b></div>`;

                    const conditions = rule?.to_Condition?.results || [];

                    conditions.forEach((condition, condIndex) => {
                        const attributes = condition?.to_AttributeId?.results || [];

                        // IF / OR block
                        if (condIndex === 0) {
                            sContent += wrapLine(label("IF", "#0a6ed1"), "mb-0");
                        } else {
                            sContent += wrapLine(label("OR", "#e9730c"));
                            sContent += wrapLine(label("IF", "#0a6ed1"));
                        }

                        attributes.forEach((attr, attrIndex) => {
                            const values = attr?.to_Rule?.results || "";
                            const attrHtml =
                                span(attr.AttributeId) +
                                span(this._handleDataClassificationMultipleValues(values));

                            if (attrIndex === 0) {
                                sContent += wrapLine(attrHtml);
                            } else {
                                sContent += wrapLine(
                                    label("AND", "#e9730c") + attrHtml
                                );
                            }
                        });
                    });

                    // THEN block
                    sContent += wrapLine(
                        label("THEN", "#107e3e") +
                        span(rule.DclAttribute) +
                        span("<b>EQ</b>") +
                        span(rule.DclAttrVal, "style='color:#107e3e;'")
                    );

                    // Divider
                    sContent += `<div style='color:#354a5f'>${".".repeat(136)}</div>`;
                });

                oDialog.setBusy(false);
                oDialog.addContent(new HTML({ content: sContent, preferDOM: true }));
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
            createDisplayRuleReadOnly: function (lRuleTypes, oView) {
                var oSubSection = oView.byId("idRuleSubSectionBlock"),
                    aPreconditions = [],
                    aRulesConditions = [],
                    sPolicyName = oView.getElementBinding().getBoundContext().getProperty("PolicyName"),
                    sPreConditionHTML = "",
                    sRulesHTML = "";

                // Separate preconditions and rules
                lRuleTypes.forEach(function (ruleType) {
                    if (ruleType.RuleType === PlDacConst.PRE_CONDITION_RULE_TYPE) {
                        aPreconditions = aPreconditions.concat(ruleType.Condition || []);
                    } else {
                        aRulesConditions = aRulesConditions.concat(ruleType.Condition || []);
                    }
                });

                // Helper function to build rule line HTML
                var buildRuleLine = function (rule, showConditionType) {
                    var lineHTML = "";
                    if (showConditionType) {
                        lineHTML += `<div class="plDacHTMLRuleLine">
                            <span class="plDacConditionType" style="color: #e9730c;font-weight:600;">${rule.ContitionType}</span>`;
                    } else {
                        lineHTML += `<div class="plDacHTMLRuleLine">`;
                    }

                    if (rule.Attribute.includes("DATA.CLASS")) {
                        lineHTML += `<span><a href="#" class="plDacDataClassification" title="Click here to view the classification rules">${rule.Attribute}</a></span>`;
                    } else {
                        lineHTML += '<span>' + rule.Attribute + '</span>';
                    }

                    lineHTML += `<span><b class="plDacOperator">${rule.Operator}</b></span>${this._mergeValues(rule)}</div>`;
                    return lineHTML;
                }.bind(this);


                // Build Precondition HTML
                if (aPreconditions.length > 0) {
                    sPreConditionHTML = `<div class="plDacHTMLruleBlock">
                                <div class="plDacHTMLRuleTitle">Precondition:</div>
                                <div class="plDacHTMLIfblock">
                                    <div class="plDacIfTitle" style="margin-bottom:4px;color: #0a6ed1;font-weight:600;">IF</div>`;
                    aPreconditions.forEach(function (condition) {
                        condition.Rules.forEach(function (rule, index) {
                            sPreConditionHTML += buildRuleLine(rule, index > 0);
                        });
                    });
                    sPreConditionHTML += `</div></div>
                              <div class="plDacRuleSeparator"></div>`;
                }

                // Build Rules HTML
                if (aRulesConditions.length > 0) {
                    sRulesHTML = `<div class="plDacHTMLruleBlock">
                        <div class="plDacHTMLRuleTitle">Rule:</div>
                        <div class="plDacHTMLIfblock">
                            <div class="plDacIfTitle" style="margin-bottom:4px;color: #0a6ed1;font-weight:600;">IF</div>`;
                    aRulesConditions.forEach(function (condition) {
                        if (condition.CType === "ELSE IF") {
                            sRulesHTML += `<div class="plDacHTMLRuleOR" style="color: #e9730c;font-weight:600;">OR</div><div class="plDacIfTitle" style="margin-bottom:4px;color: #0a6ed1;font-weight:600;">IF</div>`;
                        }
                        condition.Rules.forEach(function (rule, index) {
                            sRulesHTML += buildRuleLine(rule, index > 0);
                        });
                    });
                    sRulesHTML += `</div></div>`;
                }

                if (sPreConditionHTML != "") {
                    sPreConditionHTML += `<div style='color:#354a5f;padding-left:12px;margin-top:3px;'>${"*".repeat(140)}</div>`;;
                }
                // Determine content and toolbar
                var oContent, sBtnText, sBtnIcon;
                if (!sPreConditionHTML && !sRulesHTML) {
                    oContent = new sap.m.Title({
                        text: `There is no rule data available for the policy "${sPolicyName}".`,
                        visible: "{viewModel>/ShowNoRecordFound}"
                    }).addStyleClass("plDacNoRecordFound");
                    sBtnIcon = "sap-icon://add";
                    sBtnText = "Manage Rule";
                } else {
                    oContent = new sap.ui.core.HTML({
                        content: sPreConditionHTML + sRulesHTML,
                        preferDOM: true
                    });
                    sBtnIcon = "sap-icon://edit";
                    sBtnText = "Modify Rule";
                }

                var oToolbar = new sap.m.Toolbar({
                    content: [
                        new sap.m.ToolbarSpacer(),
                        new sap.m.Button({
                            text: sBtnText,
                            icon: sBtnIcon,
                            press: oView.getController().onPressEditRuleBtn.bind(oView.getController())
                        }).addStyleClass("plDacHTMLEditBtn")
                    ]
                }).addStyleClass("plDacHTMLRuleToolbar");

                oSubSection.removeAllBlocks();

                var oPanel = new sap.m.Panel({
                    content: [oToolbar, oContent]
                }).addStyleClass("plDacRulePanel");

                // Event binding for all DATA.CLASS links
                oPanel.addEventDelegate({
                    onAfterRendering: function () {
                        document.querySelectorAll(".plDacDataClassification").forEach(function (el) {
                            el.onclick = function (oEvent) {
                                oEvent.preventDefault();
                                oView.getController().displayDataClassificationRules(oEvent.target.innerHTML);
                            };
                        });
                    }
                });

                return oPanel;
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
                let sMergeValue = "";

                // Case 1: "Between" operator
                if (oRule.Operator === "BT") {
                    sMergeValue = oRule.ValueRange
                        .map(range =>
                            `<span style="margin-right:12px; color: #107e3e;">${range.Lower}</span>` +
                            `AND` +
                            `<span style="margin-left:12px;margin-right:0;">${range.Upper}</span>`
                        )
                        .join(",&ensp;&ensp;");

                    // Merge with additional value conditions if needed
                    sMergeValue = this._mergeValueRangeAndValueContition(oRule.Values, oRule, sMergeValue);

                } else {
                    // Case 2: Other operators
                    // Group values by Operator
                    const groupedValues = oRule.Values.reduce((acc, { Operator, Value }) => {
                        if (!acc[Operator]) acc[Operator] = [];
                        acc[Operator].push(Value);
                        return acc;
                    }, {});

                    const operators = Object.keys(groupedValues);
                    sMergeValue = operators.map((op, index) => {
                        const valuesHTML = groupedValues[op]
                            .map(val => `<span style="color: #107e3e;margin-right:2px;">${val}</span>`)
                            .join(",&ensp;");

                        return index === 0
                            ? valuesHTML
                            : `<span style="margin-left:1rem;"><b>${op}</b></span>${valuesHTML}`;
                    }).join("");
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
                const oSettingData = oDialog.getModel("setting").getData();
                const oContent = oDialog.getContent()[0];

                let aValues = [];
                let sKey = "Values";
                let sValueDisplay = "";

                // --- Helper to check non-empty string ---
                const isNotEmpty = (val) => val && val.trim() !== "";

                // --- Get Single Values ---
                const aSingleValues = oContent.getModel("SingleValues").getData() || [];

                aValues = aSingleValues
                    .filter(item => isNotEmpty(item.Value))
                    .map(item => ({
                        ...item,
                        Operator: isNotEmpty(item.Operator) ? item.Operator : "EQ"
                    }));

                if (aValues.length > 0) {
                    sValueDisplay = aValues[0].Value;
                } else {
                    // --- Fallback to Ranges ---
                    const aRanges = oContent.getModel("Ranges").getData() || [];
                    sKey = "ValueRange";

                    aValues = aRanges
                        .filter(item => isNotEmpty(item.Lower) && isNotEmpty(item.Upper))
                        .map(item => ({
                            ...item,
                            Operator: "BT"
                        }));

                    if (aValues.length > 0) {
                        sValueDisplay = `${aValues[0].Lower} to ${aValues[0].Upper}`;
                    }
                }

                if (aValues.length === 0) {
                    oDialog.close();
                    return;
                }

                const oRuleModel = oView.getModel("ruleModel");
                const oRuleData = oRuleModel.getData();

                // --- Decide condition set ---
                const isPreCondition = oSettingData.RuleType === PlDacConst.PRE_CONDITION_RULE_TYPE;
                const aTypes = oRuleData.types;
                const oTargetType = isPreCondition ? aTypes[0] : aTypes[aTypes.length - 1];

                const sCondIdKey = isPreCondition ? "CondId" : "CTypeID";
                const sCondIdValue = oSettingData[sCondIdKey];

                // --- Update matching rule ---
                const oCondition = oTargetType.Condition.find(
                    cond => cond.CTypeID === sCondIdValue
                );

                if (oCondition) {
                    const oRule = oCondition.Rules.find(
                        rule => rule.Rows === oSettingData.Rows
                    );

                    if (oRule) {
                        oRule[sKey] = aValues;
                        oRule.Operator = aValues[0].Operator;
                        oRule.Value = sValueDisplay;
                        oRule.ValueDesc = sValueDisplay;
                    }
                }

                // --- Refresh model ---
                oRuleModel.setData(oRuleData);
                oRuleModel.refresh();

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
            updateRuleModelWithAttrSelectionData: function (oView, oDialog, oSelectedItemData) {
                const oData = oDialog?.getModel("setting")?.getData();
                const oRuleModel = oView?.getModel("ruleModel");
                const oRuleData = oRuleModel?.getData();

                if (!oData || !oRuleData || !oRuleData.types?.length) {
                    return;
                }

                oDialog.close();

                const iTypeIndex = (oData.RuleType === PlDacConst.PRE_CONDITION_RULE_TYPE)
                    ? 0
                    : oRuleData.types.length - 1;

                const aCondition = oRuleData.types[iTypeIndex]?.Condition || [];
                const sCTypeID = oData.CTypeID || oData.CTypeID;

                const oCondition = aCondition.find(c => c.CTypeID === sCTypeID);
                if (!oCondition) return;

                const oRule = oCondition.Rules?.find(r => r.Rows === oData.Rows);
                if (!oRule) return;

                // Determine value source
                const sValue = oSelectedItemData.AttributeId ?? oSelectedItemData.ListId;
                const sDescription = oSelectedItemData.Description || "";

                // Update rule
                Object.assign(oRule, {
                    Value: sValue,
                    ValueDesc: `${sDescription}(${sValue})`,
                    Values: [{ Operator: oData.Operator, Value: sValue }],
                    ValueRange: []
                });

                // Persist changes
                oRuleModel.setData(oRuleData);
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
                const rules = oCondition?.to_Rule?.results || [];

                return rules.map((item, index) => {
                    const oValue = this._readRuleConditionValue(item?.to_Value?.results || []);

                    return {
                        ContitionType: index === 0 ? "" : "AND",
                        Attribute: item.AttributeId,
                        AttributeDesc: item.Description,
                        Operator: oValue.Operator,
                        Value: oValue.Value,
                        ValueDesc: oValue.ValueDesc || oValue.Value,
                        Rows: index + 1,
                        CTypeID: iCondition,
                        RuleType: PlDacConst.PRE_CONDITION_RULE_TYPE,
                        CondId: item.CondId,
                        ValueRange: oValue.ValueRange,
                        Values: oValue.Values
                    };
                });
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
                const rules = oCondition?.to_Rule?.results || [];

                return rules.map((item, index) => {
                    const oValue = this._readRuleConditionValue(item?.to_Value?.results || []);
                    const oRule = new Rule();

                    Object.assign(oRule, {
                        ContitionType: index === 0 ? "" : "AND",
                        Attribute: item.AttributeId,
                        AttributeDesc: item.Description,
                        Operator: oValue.Operator,
                        Value: oValue.Value,
                        ValueDesc: oValue.ValueDesc || oValue.Value,
                        Rows: index + 1,
                        CTypeID: iCondition,
                        RuleType: "Rules",
                        CondId: item.CondId,
                        ValueRange: oValue.ValueRange,
                        Values: oValue.Values
                    });

                    return oRule;
                });
            },
            
            /**
         * Reads values and ranges from OData value results.
         * Supports both single values and range values.
         *
         * @private
         * @param {Array<Object>} aResult - Array of value records from OData.
         * @returns {Object} Parsed value object with Value, ValueDesc, Values, ValueRange.
         */
            _readRuleConditionValue: function (aResult = []) {
                const oValue = {
                    Operator: "",
                    Value: "",
                    ValueDesc: "",
                    Values: [],
                    ValueRange: []
                };

                if (!aResult.length) return oValue;

                const getRangeResults = (item) =>
                    item?.to_ValueRange?.results?.length ? item.to_ValueRange.results : [];

                // Multiple results
                if (aResult.length > 1) {
                    let sValue = "";
                    let rangeValues = [];

                    aResult.forEach((item, index) => {
                        if (index === 0) {
                            oValue.Operator = item.Operator;
                        }

                        if (item.Operator === "BT") {
                            rangeValues.push(...getRangeResults(item));
                        } else {
                            if (index === 0) {
                                sValue = item.Value;
                            }

                            oValue.Values.push({
                                Operator: item.Operator,
                                Value: item.Value,
                                ValueDesc: item.ValueDesc
                            });
                        }
                    });

                    oValue.Value = sValue;
                    oValue.ValueDesc = sValue;

                    if (rangeValues.length) {
                        if (!sValue) {
                            sValue = rangeValues
                                .slice(0, 2)
                                .map(v => v.Value)
                                .join(" to ");
                        }

                        oValue.ValueRange = this._readRuleValueRangeValues(rangeValues, oValue);
                        oValue.ValueDesc = sValue;
                    }

                    return oValue;
                }

                // Single result
                const item = aResult[0];
                oValue.Operator = item.Operator;
                oValue.Value = item.Value;
                oValue.ValueDesc = item.ValueDesc;

                const rangeResults = getRangeResults(item);

                if (rangeResults.length) {
                    oValue.ValueRange = this._readRuleValueRangeValues(rangeResults, oValue);
                } else {
                    oValue.Values = [{
                        Operator: item.Operator,
                        Value: item.Value
                    }];
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
                const ranges = [];
                let lower = 0;

                aResult.forEach((item, index) => {
                    if ((index + 1) % 2 === 0) {
                        // Create range object
                        ranges.push({
                            Operator: "BT",
                            Lower: lower,
                            Upper: item.Value
                        });

                        // Update oValue.Value string
                        if (!oValue.Value) {
                            oValue.Value = `${lower} to ${item.Value}`;
                        } else {
                            oValue.Value += `, ${lower} to ${item.Value}`;
                        }

                        lower = 0; // Reset lower for next range
                    } else {
                        lower = item.Value;
                    }
                });

                return ranges;
            },
            
            /**
         * Inserts a new condition block into rule model.
         * If rule block doesn't exist, it creates one.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing ruleModel.
         * @param {sap.m.Button} oButton - Button clicked to insert condition.
         * @returns {void}
         */
            insertConditionInConditionBlock: function (oView, oButton) {
                var oValue = oButton.getCustomData()[0].getValue();
                var oRuleData = oView.getModel("ruleModel").getData();

                // Find existing 'Rules' type if oValue is not provided
                if (!oValue) {
                    for (var i = 0; i < oRuleData.types.length; i++) {
                        if (oRuleData.types[i].RuleType === "Rules") {
                            oValue = oRuleData.types[i];
                            break;
                        }
                    }
                }

                var oRule = new Rule();
                oRule.RuleType = "Rules";
                oRule.Rows = 1;

                // Ensure last type exists
                if (!oRuleData.types[oRuleData.types.length - 1]) {
                    oRuleData.types[oRuleData.types.length - 1] = {};
                }
                var lastType = oRuleData.types[oRuleData.types.length - 1];

                // Ensure 'Condition' array exists
                if (!Array.isArray(lastType.Condition)) {
                    lastType.Condition = [];
                }

                if (!oValue) {
                    // If no value found, add initial IF condition
                    lastType.Condition.push({
                        CType: "IF",
                        CTypeID: 1,
                        RuleType: "Rules",
                        Rules: [oRule]
                    });
                } else if (oValue.RuleType === "Rules") {
                    // Reindex existing conditions
                    lastType.Condition = this._reindexCondition(lastType.Condition);

                    var newCTypeID = lastType.Condition.length + 1;
                    oRule.CTypeID = newCTypeID;
                    lastType.Condition.push({
                        CType: lastType.Condition.length === 0 ? "IF" : "ELSE IF",
                        CTypeID: newCTypeID,
                        RuleType: "Rules",
                        Rules: [oRule]
                    });
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
                return aRules.map((rule, index) => {
                    rule.Rows = index + 1;
                    return rule;
                });
            },
           

            /**
         * Deletes an inline rule from a specific condition block.
         *
         * @param {sap.ui.core.mvc.View} oView - View containing ruleModel.
         * @param {sap.m.Button} oButton - Button containing rule info in custom data.
         * @returns {void}
         */
           
            deleteInlineRule: function (oView, oButton) {
                const oValue = oButton.getCustomData()[0].getValue();
                const oRuleData = oView.getModel("ruleModel").getData();
                let lastTypeIndex, aCondition;

                // Determine the type block to operate on
                if (oValue.RuleType === "Rules") {
                    lastTypeIndex = oRuleData.types.length - 1;
                    aCondition = oRuleData.types[lastTypeIndex].Condition;
                } else {
                    lastTypeIndex = 0;
                    aCondition = oRuleData.types[0].Condition;
                }

                // Process the relevant condition
                for (let i = 0; i < aCondition.length; i++) {
                    const cond = aCondition[i];
                    const idMatch = (oValue.RuleType === "Rules") ? cond.CTypeID === oValue.CTypeID
                        : cond.CTypeID === oValue.CondId;
                    if (idMatch) {
                        // Keep only rules not matching the row to delete
                        cond.Rules = this._reindexConditionRules(
                            cond.Rules.filter(rule => rule.Rows !== oValue.Rows)
                        );

                        // If no rules remain, remove the condition
                        if (cond.Rules.length === 0) {
                            aCondition.splice(i, 1);
                        }
                        break;
                    }
                }

                // Update type block visibility and remove empty type if needed
                if (aCondition.length === 0) {
                    oRuleData.types.splice(lastTypeIndex, 1);
                    if (oValue.RuleType === "Rules") {
                        oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", true);
                        oView.getModel("viewModel").setProperty("/bVisibleAddCondition", false);
                    } else {
                        oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", true);
                    }
                } else {
                    oRuleData.types[lastTypeIndex].Condition = aCondition;
                    if (oValue.RuleType === "Rules") {
                        oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", false);
                    }
                }

                // Update the model
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
                const oValue = oButton.getCustomData()[0].getValue();
                const oRuleData = oView.getModel("ruleModel").getData();
                let targetTypeIndex = oValue.RuleType === "Rules" ? oRuleData.types.length - 1 : 0;
                let aCondition = oRuleData.types[targetTypeIndex]?.Condition || [];
                let nConditions = [];

                if (oValue.RuleType === "Rules") {
                    if (oValue.CTypeID === 0 || (aCondition[0]?.CTypeID === oValue.CTypeID)) {
                        // Remove entire type block
                        oRuleData.types.splice(targetTypeIndex, 1);
                        oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", true);
                        oView.getModel("viewModel").setProperty("/bVisibleAddCondition", false);
                    } else {
                        // Remove only the specific condition
                        aCondition = aCondition.filter(cond => cond.CTypeID !== oValue.CTypeID);

                        if (aCondition.length === 0) {
                            oRuleData.types.splice(targetTypeIndex, 1);
                            oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", true);
                            oView.getModel("viewModel").setProperty("/bVisibleAddCondition", false);
                        } else {
                            oRuleData.types[targetTypeIndex].Condition = aCondition;
                            oView.getModel("viewModel").setProperty("/bVisibleAddRuleBlock", false);
                        }
                    }
                } else {
                    // Non-"Rules" type
                    if (oValue.CTypeID === 1 && aCondition.length > 1) {
                        nConditions = aCondition.filter(cond => cond.CTypeID !== oValue.CTypeID);
                        if (nConditions.length > 0) {
                            nConditions[0].CType = "IF";
                            nConditions[0].CTypeID = 1;
                            oRuleData.types[targetTypeIndex].Condition = nConditions;
                        } else {
                            oRuleData.types.splice(targetTypeIndex, 1);
                            oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", true);
                        }
                    } else {
                        nConditions = aCondition.filter(cond => cond.CTypeID !== oValue.CTypeID);
                        if (nConditions.length === 0) {
                            oRuleData.types.splice(targetTypeIndex, 1);
                            oView.getModel("viewModel").setProperty("/bVisibleAddPreBlock", true);
                        } else {
                            oRuleData.types[targetTypeIndex].Condition = nConditions;
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
                const oValue = oButton.getCustomData()[0].getValue();
                const oRuleData = oView.getModel("ruleModel").getData();

                // Determine which type block to operate on
                const targetTypeIndex = oValue.RuleType === "Rules"
                    ? oRuleData.types.length - 1
                    : 0;

                const aCondition = oRuleData.types[targetTypeIndex].Condition;

                // Find the condition to insert into
                for (let i = 0; i < aCondition.length; i++) {
                    if (aCondition[i].CTypeID === oValue.CTypeID) {
                        // Reindex existing rules
                        aCondition[i].Rules = this._reindexConditionRules(aCondition[i].Rules);
                        const iLen = aCondition[i].Rules.length;

                        // Create new rule
                        const oRule = {
                            CTypeID: oValue.CTypeID,
                            Rows: iLen + 1,
                            RuleType: oValue.RuleType === "Rules"
                                ? "Rules"
                                : PlDacConst.PRE_CONDITION_RULE_TYPE
                        };

                        if (iLen > 0) {
                            oRule.ContitionType = "AND"; // Keep typo for backward compatibility
                        }

                        // Push new rule into condition
                        aCondition[i].Rules.push(oRule);
                        break; // Condition found, exit loop
                    }
                }

                // Update model
                oRuleData.types[targetTypeIndex].Condition = aCondition;
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
                const { RuleType, CTypeID, Rows } = oInput.getCustomData()[0].getValue();
                const { AttributeId, Description } = oItem.getBindingContext().getObject();
                const oRuleData = oView.getModel("ruleModel").getData();

                // Select the type to update: first type for pre-condition, last type otherwise
                const typeIndex = (RuleType === PlDacConst.PRE_CONDITION_RULE_TYPE)
                    ? 0
                    : oRuleData.types.length - 1;

                const conditions = oRuleData.types[typeIndex].Condition;

                // Find the matching condition
                const condition = conditions.find(c => c.CTypeID === CTypeID);
                if (condition) {
                    // Find the matching rule within the condition
                    const rule = condition.Rules.find(r => r.Rows === Rows);
                    if (rule) {
                        rule.Attribute = AttributeId;
                        rule.AttributeDesc = `${Description} (${AttributeId})`;
                    }
                }

                // Update the model
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
                const oData = oDialog.getModel("condition").getData();
                const oValue = oToken.getCustomData()[0].getValue();
                const oRuleData = oView.getModel("ruleModel").getData();

                // Determine type index: first type for pre-condition, last type otherwise
                const typeIndex = (oData.RuleType === PlDacConst.PRE_CONDITION_RULE_TYPE)
                    ? 0
                    : oRuleData.types.length - 1;

                const conditions = oRuleData.types[typeIndex].Condition;

                // Find the matching condition
                const condition = conditions.find(c => c.CTypeID === oData.CTypeID);
                if (condition) {
                    // Find the matching rule within the condition
                    let rule = condition.Rules.find(r => r.Rows === oData.Rows);
                    if (rule) {
                        rule.Attribute = oValue.AttributeId;
                        rule.AttributeDesc = `${oValue.Description} (${oValue.AttributeId})`;
                    }
                }

                // Update the model
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
                if (!oDialog) return;

                let updatedItems;

                if (!Array.isArray(aValues)) {
                    // Single value range
                    updatedItems = [{
                        Lower: aValues.Min.trim(),
                        Upper: aValues.Max.trim(),
                        Operator: aValues.Operator
                    }];
                } else {
                    // Multiple ranges
                    if (aItems.length > aValues.length) {
                        updatedItems = aItems.map((item, index) => aValues[index] || item);
                    } else {
                        updatedItems = [...aValues];
                    }
                }

                // Update the model
                oDialog.getContent()[0].getModel("Ranges").setData(updatedItems);
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
                if (!oDialog) return;

                let updatedItems;

                if (!Array.isArray(aValues)) {
                    // Single value
                    updatedItems = [{
                        Value: aValues.Value,
                        Operator: aValues.Operator
                    }];
                } else {
                    // Multiple values
                    if (aItems.length > aValues.length) {
                        updatedItems = aValues.map((val, index) => ({
                            ...val,
                            Value: val.Value.trim()
                        }));
                        // Preserve extra existing items if any
                        for (let i = aValues.length; i < aItems.length; i++) {
                            updatedItems.push(aItems[i]);
                        }
                    } else {
                        updatedItems = aValues.map(val => ({ ...val, Value: val.Value.trim() }));
                    }
                }

                // Update the model
                oDialog.getContent()[0].getModel("SingleValues").setData(updatedItems);
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
                oRule.ValueRange = [];
                oRule.Values = [];

                const aValues = oRule.ValueDesc.split(",");

                if (oRule.Operator === "BT") {
                    oRule.ValueRange = aValues
                        .map(v => v.split("to").map(s => s.trim()))
                        .filter(([lower, upper]) => lower && upper)
                        .map(([lower, upper]) => ({
                            Operator: oRule.Operator,
                            Lower: lower,
                            Upper: upper
                        }));
                } else {
                    oRule.Values = aValues
                        .map(v => v.trim())
                        .filter(v => v)
                        .map(v => ({
                            Operator: oRule.Operator,
                            Value: v
                        }));
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
                const oPayload = { to_Condition: [] };

                aTypes.forEach(type => {
                    type.Condition.forEach(cond => {
                        if (cond.CType === "END IF") return;

                        const oCondition = {
                            CondId: Number.isFinite(cond.CTypeID) ? String(cond.CTypeID) : cond.CTypeID,
                            to_Rule: []
                        };

                        let hasRules = false;

                        cond.Rules.forEach(rule => {
                            if (!rule.Attribute) return;

                            hasRules = true;

                            // Ensure ValueRange/Values exist
                            if (!rule.hasOwnProperty.call("ValueRange") && !rule.hasOwnProperty.call("Values")) {
                                rule = this._createRangesAndValues(rule);
                            }

                            const valueRanges = rule.ValueRange.length ? rule.ValueRange : rule.Values;
                            if (!valueRanges) return;

                            if (rule.Operator === "BT") {
                                valueRanges.forEach(vr => {
                                    oCondition.to_Rule.push({
                                        AttributeId: rule.Attribute,
                                        to_Value: [{
                                            Operator: rule.Operator,
                                            to_ValueRange: [{ Value: vr.Lower }, { Value: vr.Upper }]
                                        }]
                                    });
                                });
                            } else {
                                oCondition.to_Rule.push({
                                    AttributeId: rule.Attribute,
                                    to_Value: valueRanges.map(v => ({ Value: v.Value, Operator: v.Operator }))
                                });
                            }
                        });

                        if (hasRules) {
                            oPayload.to_Condition.push(oCondition);
                        }
                    });
                });

                oPayload.Policy = oView.getBindingContext().getObject().PolicyName;

                return oPayload;
            }
        };
    });