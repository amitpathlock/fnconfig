sap.ui.define([], function (
) {
    "use strict";

    return class Rule {
        constructor() {
            this.ContitionType = "";
                this.Attribute = "";
                this.AttributeDesc = "";
                this.Operator = "";
                this.Value = "";
                this.ValueDesc = "";
                this.ValueRange = [];
                this.Rows = 0;
                this.CTypeID = 1;
                this.RuleType = "";
        }
    };
});