/*global QUnit*/

sap.ui.define([
    "pl/dac/apps/fnconfig/controller/Master.controller",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/UIComponent"
], function (MasterController, Controller, JSONModel, UIComponent) {
    "use strict";

    QUnit.module("Master Controller", {
        beforeEach: function () {
            this.oMasterController = new MasterController();
            
            // Create mocks
            this.oRouterMock = {
                navTo: sinon.stub(),
                getRoute: sinon.stub()
            };
            
            this.oComponentMock = {
                getRouter: sinon.stub().returns(this.oRouterMock)
            };
            
            sinon.stub(this.oMasterController, "getOwnerComponent").returns(this.oComponentMock);
            sinon.stub(sap.ui.core.BusyIndicator, "show");
            sinon.stub(sap.ui.core.BusyIndicator, "hide");
        },
        afterEach: function () {
            this.oMasterController.destroy();
            sap.ui.core.BusyIndicator.show.restore();
            sap.ui.core.BusyIndicator.hide.restore();
        }
    });

    QUnit.test("Should instantiate the controller", function (assert) {
        // Assert
        assert.ok(this.oMasterController, "Controller instance created");
        assert.ok(this.oMasterController instanceof Controller, "Controller is instance of sap.ui.core.mvc.Controller");
    });

    QUnit.test("Should have onInit method", function (assert) {
        // Assert
        assert.ok(typeof this.oMasterController.onInit === "function", "onInit method exists");
    });

    QUnit.test("onInit should initialize router and show busy indicator", function (assert) {
        // Arrange
        var oViewMock = {
            getModel: sinon.stub().returns({
                read: sinon.stub()
            })
        };
        sinon.stub(this.oMasterController, "getView").returns(oViewMock);
        
        // Act
        this.oMasterController.onInit();
        
        // Assert
        assert.ok(this.oMasterController.getOwnerComponent.called, "getOwnerComponent was called");
        assert.ok(sap.ui.core.BusyIndicator.show.called, "BusyIndicator.show was called");
        assert.ok(this.oMasterController._oRouter, "Router instance stored");
    });
});