sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/core/Icon",
    "sap/ui/model/json/JSONModel"
], function (
    Control, Icon, JSONModel
) {
    "use strict";

    return Control.extend("pl.dac.apps.fnconfig.control.PlDacSectionLayout", {
        metadata: {
            properties: {
                width: {
                    type: "string",
                    defaultValue: "100%"
                }, /// setting default width
                value: {
                    type: "string",
                    defaultValue: ""
                }/// for Cordova plug-in recognition object
            },
            aggregations: {
                sections: {
                    type: "sap.ui.core.Control",
                    multiple: true,
                    singularName: "section"
                }
            },
            events: {
                onSelectSection: {
                    enablePreventDefault: true
                }
            }
        },
        init: function () {
            var oModelOperator = new JSONModel();
            var sPathOperator = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/Operators.json");
            oModelOperator.loadData(sPathOperator);
            this.setModel(oModelOperator, "Operators");
        },
        renderer: {
            render: function (oRm, oControl) { /////// Render the control
                oRm.write("<ul");
                oRm.addClass("plDacSections");
                oRm.writeStyles();
                oRm.writeClasses(oControl);
                oRm.writeControlData(oControl);
                oRm.write(">");
                $(oControl.getSections()).each(function (i, _item) {
                    oRm.write("<li");
                    oRm.addClass("plDacSection");
                    oRm.writeStyles();
                    oRm.writeControlData(oControl);
                    oRm.write(">");
                    oRm.write("<a data-key=" + i);
                    if (i == 0) {
                        oRm.addClass("plDacSectionSelected");
                    }
                    oRm.writeStyles();
                    oRm.writeClasses(oControl);
                    oRm.writeControlData(oControl);
                    oRm.write(">");
                    oRm.renderControl(new Icon({ src: _item.getItems()[0].data("icon") }));
                    oRm.write(_item.getItems()[0].data("title"));
                    oRm.write("</a>");
                    oRm.write("</li>");
                });
                oRm.write("</ul>");
                $(oControl.getSections()).each(function (i, _item){
                    oRm.write("<div");
                    oRm.addClass("plDacSectionItem");
                    oRm.writeStyles();
                    oRm.writeClasses(oControl);
                    oRm.writeControlData(oControl);
                    oRm.write(">");
                    oRm.renderControl(_item);
                    oRm.write("</div>");
                });
            }
        },
        addRowInValues: function () {
            var oData = this.getModel("SingleValues").getData();
            oData.push({ "Operator": " ", "value": "" });
            this.getModel("SingleValues").setData(oData);
        },
        addRowInRanges: function () {
            var oData = this.getModel("Ranges").getData();
            oData.push({ "Operator": " ", "Lower": "", "Upper": "" });
            this.getModel("Ranges").setData(oData);
        },
        handleOnSectionClick: function (oEvent) {
            var idx = $(oEvent.currentTarget).attr("data-key");
            if (idx == "0" || idx == "1") {
                this.getParent().getModel("viewModel").setProperty("/VisibleOK", true);
            } else {
                this.getParent().getModel("viewModel").setProperty("/VisibleOK", false);
            }
            $(".plDacSection").removeClass("plDacSectionSelected");
            $(oEvent.currentTarget).addClass("plDacSectionSelected");
            $(".plDacSectionItem").each(function (i, element) {
                if (i == idx) {
                    $(this).css('display', 'block');
                } else {
                    $(this).css('display', 'none');
                }
            });
        },
        onAfterRendering: function (evt) {
            evt.preventDefault();
            $(".plDacSectionItem").each(function (idx, element) {
                if (idx > 0) {
                    $(this).css('display', 'none');
                }
            });
            $(".plDacSection").on("click", this.handleOnSectionClick.bind(this));
            this.getParent().getModel("viewModel").setProperty("/VisibleOK", true);
            var oData = this.getParent().getModel("setting").getData();
          //  var items = oData.ValueRange;
            if (oData.ValueRange.length > 0) {
                var idx = 0;
                if (!oData.ValueRange[0].Lower) {
                    //
                } else {
                    //
                }
                $(".plDacSectionItem").each(function (i, element) {
                    if (i == idx) {
                        $(this).css('display', 'block');
                    } else {
                        $(this).css('display', 'none');
                    }
                });
                $(".plDacSection").removeClass("plDacSectionSelected");
                $(".plDacSection").each(function (i, element) {
                    if (i == idx) {
                        $(this).addClass("plDacSectionSelected");
                    }
                });
            } else {
                if (oData.Value != "") {
                    var idx = null;
                    if (oData.Value.split(".")[0] == "USER") {
                        idx = 2;
                    }
                    if (oData.Value.split(".")[0] == "LIST") {
                        idx = 3;
                    }
                    if (idx != null) {
                        $(".plDacSectionItem").each(function (i, element) {
                            if (i == idx) {
                                $(this).css('display', 'block');
                            } else {
                                $(this).css('display', 'none');
                            }
                        });
                        $(".plDacSection").removeClass("plDacSectionSelected");
                        $(".plDacSection").each(function (i, element) {
                            if (i == idx) {
                                $(this).addClass("plDacSectionSelected");
                            }
                        });
                    }
                }
                var oModelRanges = new JSONModel();
                var sPathRanges = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/Ranges.json");
                oModelRanges.loadData(sPathRanges);
                this.setModel(oModelRanges, "Ranges");
            }
        }
    });
});