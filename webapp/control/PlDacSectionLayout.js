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
                },
                value: {
                    type: "string",
                    defaultValue: ""
                }
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
                },
                addRowInSingleValue: {
                    enablePreventDefault: true
                },
                addRowInValueRanges: {
                    enablePreventDefault: true
                }
            }
        },
        /* =========================================================== */
        /* Lifecycle                                                   */
        /* =========================================================== */
        init: function () {
            this._loadOperatorsModel();
        },
        _loadOperatorsModel: function () {
            var oModel = new JSONModel();
            var sPath = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/OperatorsSV.json");
            oModel.loadData(sPath);
            this.setModel(oModel, "OperatorsSV");
        },
        renderer: {
            render: function (oRm, oControl) { /////// Render the control

                var aSections = oControl.getSections();

                // ---------- HEADER ----------
                oRm.openStart("ul", oControl)
                    .class("plDacSections")
                    .openEnd();

                aSections.forEach(function (oSection, iIndex) {

                    oRm.openStart("li")
                        .class(iIndex === 0 ? " plDacSection plDacSectionSelected" : "plDacSection")
                        .openEnd();

                    oRm.openStart("a")
                        .attr("data-key", iIndex)
                        .openEnd();

                    var oFirstItem = oSection.getItems()[0];

                    oRm.renderControl(new Icon({
                        src: oFirstItem.data("icon")
                    }));

                    oRm.text(oFirstItem.data("title"));

                    oRm.close("a");
                    oRm.close("li");

                });
                oRm.close("ul");

                // ---------- CONTENT ----------
                aSections.forEach(function (oSection, iIndex) {
                    oRm.openStart("div")
                        .class("plDacSectionItem")
                        .openEnd();
                    if (iIndex === 2) {
                        var oItem = oSection.getItems()[0];
                        oItem.addStyleClass("plDacDialogTable");
                        oItem.setAlternateRowColors(true);
                        oItem.setMode("SingleSelectLeft");
                    }
                    oRm.renderControl(oSection);
                    oRm.close("div");
                });
            }
        },

        _handleOnSectionClick: function (oEvent) {
            var iIndex, $target = $(oEvent.target);
            if($target.is("span")){
                iIndex = parseInt($target.parent().attr("data-key"), 10);
            }else{
                iIndex = parseInt($target.attr("data-key"), 10);
            }
            this._updateVisibleOK(iIndex);
            this._switchSection(iIndex);
        },
        _updateVisibleOK: function (iIndex) {
            var bVisible = (iIndex === 0 || iIndex === 1);
            this.getParent()
                .getModel("viewModel")
                .setProperty("/VisibleOK", bVisible);
        },
        _switchSection: function (iIndex) {
            var aContents, $sections, oDom = this.getParent().getDomRef();
            if (!oDom) return;
            aContents = oDom.querySelectorAll("div.plDacSectionItem");
            $sections = this.$().find(".plDacSection a");
            $(".plDacSection").removeClass("plDacSectionSelected");
            $sections.removeClass("plDacSectionSelected");
            $sections.eq(iIndex).addClass("plDacSectionSelected");
            aContents.forEach(function (el, idx) {
                el.style.display = idx === iIndex ? "block" : "none";
            });

        },
        onAfterRendering: function () {
            var oParent, aSections, aContents, oDom = this.getParent().getDomRef();
            if (!oDom) return; // ensure the control is rendered

            // Grab all sections (navigation headers) and content divs
            aSections = oDom.querySelectorAll(".plDacSection");
            aContents = oDom.querySelectorAll("div.plDacSectionItem");

            // Hide all content divs except the first one
            aContents.forEach(function (el, idx) {
                el.style.display = idx === 0 ? "block" : "none";
            });

            // Ensure the first section is selected by default
            aSections.forEach(function (el, idx) {
                if (idx === 0) {
                    el.classList.add("plDacSectionSelected");
                } else {
                    el.classList.remove("plDacSectionSelected");
                }

                // Remove any existing click handler before adding new one
                el.removeEventListener("click", this._handleOnSectionClickBound);
            }, this);

            // Bind the click handler (store bound function for removal later)
            this._handleOnSectionClickBound = this._handleOnSectionClick.bind(this);
            aSections.forEach(function (el) {
                el.addEventListener("click", this._handleOnSectionClickBound);
            }, this);

            // Set VisibleOK to true
            oParent = this.getParent();
            if (oParent) {
                var oViewModel = oParent.getModel("viewModel");
                if (oViewModel) {
                    oViewModel.setProperty("/VisibleOK", true);
                }
            }

            // Apply initial state based on model data
            this._applyInitialState();

        },
        _applyInitialState: function () {

            var $sections, iIndex, oSettingData, aContents, oParent = this.getParent(), oDom = oParent.getDomRef();
            oSettingData = oParent.getModel("setting").getData();
            aContents = oDom.querySelectorAll("div.plDacSectionItem");
            $sections = this.$().find(".plDacSection");

            iIndex = 0;

            if (oSettingData.Operator === "BT") {
                iIndex = 1;
            } else if (oSettingData.Value) {

                var sPrefix = oSettingData.Value.split(".")[0];

                if (sPrefix === "USER") {
                    iIndex = 2;
                } else if (sPrefix === "LIST") {
                    iIndex = 3;
                }
            }
            // Hide all content divs except the idx==iIndex
            aContents.forEach(function (el, idx) {
                el.style.display = idx === iIndex ? "block" : "none";
            });

            $sections.removeClass("plDacSectionSelected")
                .eq(iIndex).addClass("plDacSectionSelected");

            if (oSettingData.Operator !== "BT") {
                this._loadRangesModel();
            }
        },
        _loadRangesModel: function () {
            var oModel = new JSONModel();
            var sPath = jQuery.sap.getModulePath("pl.dac.apps.fnconfig", "/model/Ranges.json");
            oModel.loadData(sPath);
            this.setModel(oModel, "Ranges");
        }
    });
});