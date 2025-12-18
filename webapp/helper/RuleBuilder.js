sap.ui.define([],
    function () {
        "use strict";

        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            build: function (aRules) {
                var aItem = [], J = {};
                for (var i = 0; i < aRules.length; i++) {
                    var sRule = aRules[i].Rule;
                    J = {};
                    J["Type"] = aRules[i].Type;
                    J["Rule"] = this.stringToArrayRule(sRule);
                    aItem.push(J);
                }
                return aItem;
            },
            stringToArrayRule: function (sRule) {
                var j = sRule.split("AND"), nArr = [], list = [];
                for (var i = 0; i < j.length; i++) {

                    if (j[i].split("OR").length > 1) {
                        this.addItemInArray(j[i], "OR", nArr);
                    } else {
                        nArr.push(j[i]);
                    }
                    if (j.length > 1) {
                        nArr.push("AND");
                    }
                }
                for (var h = 0; h < nArr.length; h++) {
                    this.addItemInArray(nArr[h], " ", list);
                    if (nArr[h] == "OR" || nArr[h] == "AND") {
                        list.push(nArr[h]);
                    }
                }

                return list;
            },
            addItemInArray: function (sValue, sType, list) {
                var nArr, i;
                nArr = sValue.split(sType);
                for (i = 0; i < nArr.length; i++) {

                    if (nArr[i] != "") {
                        list.push(nArr[i]);
                        if (sType != " ") {
                            list.push(sType);
                        }
                    }

                }
                if (list[list.length - 1] == "OR" || list[list.length - 1] == "AND") {
                    list.pop();
                }
                return list;
            }
        };

    });