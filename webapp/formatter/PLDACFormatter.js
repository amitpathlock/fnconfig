sap.ui.define([], function () {
    "use strict";
    return {
        // Example formatter: formats a status code to a human-readable text
        handleRangDialogUserAttrTblVisiblity: function (sOperator) {
            if (sOperator == "IN") {
                return false;
            }
            return true;
        },
        handleRangDialogRangeTblVisiblity: function (sOperator) {
            if (sOperator == "IN") {
                return true;
            }
            return false;
        },
        handleANDOperatorVisibility: function (sValue) {
            if (sValue == "AND") {
                return true;
            }
            return false;
        },
        handVisibilityConditionTypeIfElse: function (sValue) {
            if (sValue == "ELSE IF") {
                return true;
            }
            return false;
        },
        displayVisibilityConditionTypeEndIfPIF: function (sValue) {
            if (sValue == "PIF") {
                return false;
            }
            return true;
        },
        handVisibilityConditionTypeEndIf: function (sValue) {
            if (sValue == "END IF") {
                return true;
            }
            return false;
        },
        handleConditionText: function (sValue) {
            if (sValue == "PIF") {
                return "";
            }
            return sValue;
        },
        displayVisibilityConditionPIF: function (sValue) {
            if (sValue == "PIF") {
                return false;
            }
            return true;
        },
        handVisibilityConditionTypeIf: function (sValue) {
            if (sValue == "IF" || sValue == "PIF") {
                return true;
            }
            return false;
        },
        handleTitleElseIFVisibile: function (sValue) {
            if (sValue == "ELSE IF") {
                return true;
            }
            return false;
        },
        handleANDVisibility: function (sValue) {
            if (sValue == "AND" || sValue == "OR") {
                return false;
            }
            return true;
        },
        handDeleleVisibility: function () {
            //if(sRuleType=="Precondition"){
            //	return false;
            //}
            return true;
        },
        hasAddConditionBtnEnabled: function (sConditionType, oContext) {
            if (oContext && oContext.RuleType == "Precondition" && oContext.Condition.length > 1) {
                return false;
            }
            return true;
        },

        displayHandleIFVisibility: function (sConditionType, sRuleTtpe) {
            if (sRuleTtpe == "Precondition") {
                return false;
            }
            return true;
        },
        displayViewHandleElseIFBlockVisiblity: function (sRuleType, sConditionType) {
            if (sRuleType == "Rules" && sConditionType == "ELSE IF") {
                return true;
            }
            return false;
        },
        // eslint-disable-next-line no-dupe-keys
        handleConditionText: function (sConditionType, sRuleTtpe) {
            if (sRuleTtpe == "Precondition" && sConditionType == "IF") {
                return "";
            }
            return sConditionType;
        },

        displayViewHandleIFBlockVisiblity: function (sConditionType, sRuleTtpe) {
            if (sConditionType == "AND") {
                return false;
            }
            if ((sRuleTtpe == "Precondition" && sConditionType == "IF") || (sRuleTtpe == "Precondition" && sConditionType == "END IF")) {
                return false;
            }
            if (sRuleTtpe == "Rules" && sConditionType == "ELSE IF") {
                return false;
            }
            return true;
        },
        editViewHandleIFBlockVisiblity: function (sConditionType) {
            if (sConditionType == "IF") {
                return true;
            }
            return false;
        },
        handleVisibilityConditionAND: function (sConditionType) {

            if (sConditionType == "AND") {
                return true;
            }

            return false;
        },
        editViewHandleEndIfVisiblity: function (sConditionType, sRuleTtpe) {
            if (sConditionType == "END IF" && sRuleTtpe == "Rules") {
                return true;
            }
            return false;
        },
        editViewHandleANDOperatorVisiblity: function (sConditionType, sRuleTtpe) {
            if (sConditionType == "AND" && (sRuleTtpe == "Rules" || sRuleTtpe == "Precondition")) {
                return true;
            }
            return false;
        },
        editViewHandleELSEIFVisiblity: function (sConditionType, sRuleTtpe) {
            if (sRuleTtpe == "Precondition") { return false ;}
            if (sConditionType == "ELSE IF" && sRuleTtpe == "Rules") {
                return true;
            }
            return false;
        }

    };
});