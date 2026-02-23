/*global QUnit*/

sap.ui.define([
    "pl/dac/apps/fnconfig/controller/DataMaskingEnforcement.controller",
    "pl/dac/apps/fnconfig/controller/BaseController",
    "pl/dac/apps/fnconfig/const/PlDacConst",
    "sap/ui/core/mvc/View",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageBox",
    "sap/m/Token",
    "sap/base/Log"
], function (
    DataMaskingEnforcementController,
    BaseController,
    PlDacConst,
    View,
    JSONModel,
    ODataModel,
    MessageBox,
    Token,
    Log
) {
    "use strict";

    QUnit.module("DataMaskingEnforcement Controller - Initialization", {
        beforeEach: function () {
            this.oController = new DataMaskingEnforcementController();

            // Mock router
            this.oRouterMock = {
                getRoute: sinon.stub().returns({
                    attachPatternMatched: sinon.stub()
                })
            };

            // Mock component
            this.oComponentMock = {
                getRouter: sinon.stub().returns(this.oRouterMock),
                getModel: sinon.stub()
            };

            // Mock view
            this.oViewMock = new View({});
            this.oViewMock.byId = sinon.stub();

            sinon.stub(this.oController, "getOwnerComponent").returns(this.oComponentMock);
            sinon.stub(this.oController, "getView").returns(this.oViewMock);
            sinon.stub(this.oController, "addAddintionButtonIntoThePolicyEnforcementTableToolbar");
        },
        afterEach: function () {
            this.oController.destroy();
            this.oViewMock.destroy();
        }
    });

    QUnit.test("Should instantiate the controller", function (assert) {
        assert.ok(this.oController, "Controller instance created");
        assert.ok(this.oController instanceof BaseController, "Controller extends BaseController");
    });

    QUnit.test("onInit should initialize router and attach route", function (assert) {
        // Arrange
        var oTableMock = {};
        this.oViewMock.byId.returns(oTableMock);

        // Act
        this.oController.onInit();

        // Assert
        assert.ok(this.oComponentMock.getRouter.called, "Router was retrieved");
        assert.ok(this.oRouterMock.getRoute.calledWith("DataMasking"), "DataMasking route was retrieved");
        assert.ok(this.oController._oRouter, "Router stored in _oRouter");
        assert.ok(this.oController.addAddintionButtonIntoThePolicyEnforcementTableToolbar.calledWith(oTableMock), 
            "Additional button added to toolbar");
    });

    QUnit.module("DataMaskingEnforcement Controller - Route Matched", {
        beforeEach: function () {
            this.oController = new DataMaskingEnforcementController();

            this.oViewMock = new View({});
            this.oResourceBundle = {
                getText: sinon.stub().returns("Test Text")
            };
            
            sinon.stub(this.oViewMock, "setModel");
            sinon.stub(this.oViewMock, "getModel").returns({
                getResourceBundle: sinon.stub().returns(this.oResourceBundle)
            });
            this.oViewMock.byId = sinon.stub().returns({});
            
            sinon.stub(this.oController, "getView").returns(this.oViewMock);
            sinon.stub(sap.ui.core.BusyIndicator, "hide");
        },
        afterEach: function () {
            this.oController.destroy();
            this.oViewMock.destroy();
            sap.ui.core.BusyIndicator.hide.restore();
        }
    });

    QUnit.test("_onRouteMatched should initialize view model", function (assert) {
        // Act
        this.oController._onRouteMatched();

        // Assert
        assert.ok(this.oViewMock.setModel.called, "View model was set");
        assert.ok(sap.ui.core.BusyIndicator.hide.called, "BusyIndicator hidden");
        
        var oModelArg = this.oViewMock.setModel.getCall(0).args[0];
        var sModelName = this.oViewMock.setModel.getCall(0).args[1];
        
        assert.equal(sModelName, "viewModel", "Model set with correct name");
        assert.ok(oModelArg instanceof JSONModel, "Model is JSONModel");
        
        var oData = oModelArg.getData();
        assert.equal(oData.EditButtonEnabled, false, "Edit button initially disabled");
        assert.equal(oData.DeleteButtonEnabled, false, "Delete button initially disabled");
        assert.equal(oData.VisibleAttribute, true, "Attribute field visible");
    });

    QUnit.module("DataMaskingEnforcement Controller - Save Policy", {
        beforeEach: function () {
            this.oController = new DataMaskingEnforcementController();

            this.oODataModelMock = {
                update: sinon.stub(),
                create: sinon.stub(),
                read: sinon.stub(),
                refresh: sinon.stub()
            };

            this.oViewModelData = {
                Data: {
                    Policy: "TEST_POLICY",
                    AttributeId: "TEST_ATTR",
                    IsActive: true
                },
                ErrorState: "None",
                ErrorMessage: "",
                AttrErrorState: "None",
                AttrErrorMessage: ""
            };

            this.oViewModelMock = new JSONModel(this.oViewModelData);
            this.oViewMock = new View({});
            
            sinon.stub(this.oViewMock, "getModel")
                .withArgs("viewModel").returns(this.oViewModelMock)
                .withArgs().returns(this.oODataModelMock);

            sinon.stub(this.oController, "getView").returns(this.oViewMock);
            
            this.oController.oPolicyInforcementDialog = {
                close: sinon.stub()
            };
            this.oController.oPolicyEnforcementTable = {
                removeSelections: sinon.stub()
            };

            sinon.stub(MessageBox, "success");
            sinon.stub(MessageBox, "error");
        },
        afterEach: function () {
            this.oController.destroy();
            this.oViewMock.destroy();
            MessageBox.success.restore();
            MessageBox.error.restore();
        }
    });

    QUnit.test("onSavePolicyInforcement should validate empty policy", function (assert) {
        // Arrange
        this.oViewModelMock.setProperty("/Data/Policy", "   ");

        // Act
        this.oController.onSavePolicyInforcement();

        // Assert
        assert.equal(this.oViewModelMock.getProperty("/ErrorState"), "Error", "Error state set");
        assert.ok(this.oViewModelMock.getProperty("/ErrorMessage").length > 0, "Error message set");
    });

    QUnit.test("onSavePolicyInforcement should update existing entry", function (assert) {
        // Arrange
        var done = assert.async();
        this.oViewModelData.Data.__metadata = { uri: "test" };
        this.oViewModelMock.setData(this.oViewModelData);

        // this.oODataModelMock.update.callsFake(function (sPath, oEntry, mParameters) {
        //     mParameters.success();
        // });
        this.oODataModelMock.update.yieldsTo('success', this.oViewModelData);
        // Act
        this.oController.onSavePolicyInforcement();

        // Assert
        setTimeout(function () {
            assert.ok(this.oODataModelMock.update.called, "Update was called");
            assert.ok(MessageBox.success.called, "Success message shown");
            assert.ok(this.oController.oPolicyInforcementDialog.close.called, "Dialog closed");
            done();
        }.bind(this), 100);
    });

    QUnit.module("DataMaskingEnforcement Controller - Attribute Validation", {
        beforeEach: function () {
            this.oController = new DataMaskingEnforcementController();

            this.oODataModelMock = {
                read: sinon.stub()
            };

            this.oViewModelMock = new JSONModel({
                Data: {
                    AttributeId: ""
                },
                AttrErrorState: "None",
                AttrErrorMessage: ""
            });

            this.oViewMock = new View({});
            this.oAttributeInput = {
                setTokens: sinon.stub()
            };

            sinon.stub(this.oViewMock, "getModel")
                .withArgs("viewModel").returns(this.oViewModelMock)
                .withArgs().returns(this.oODataModelMock);
            
            this.oViewMock.byId = sinon.stub().returns(this.oAttributeInput);
            sinon.stub(this.oController, "getView").returns(this.oViewMock);
        },
        afterEach: function () {
            this.oController.destroy();
            this.oViewMock.destroy();
        }
    });

    QUnit.test("_validateAttibuteInput should validate attribute successfully", function (assert) {
        // Arrange
        var done = assert.async();
        var oMockData = {
            AttributeId: "TEST_ATTR",
            Description: "Test Attribute Description"
        };
         this.oODataModelMock.read.yieldsTo('success', oMockData);
        // this.oODataModelMock.read.callsFake(function (sPath, mParameters) {
        //     mParameters.success(oMockData);
        // });

        // Act
        this.oController._validateAttibuteInput("TEST_ATTR");

        // Assert
        setTimeout(function () {
            assert.ok(this.oODataModelMock.read.called, "Read was called");
            assert.equal(this.oViewModelMock.getProperty("/AttrErrorState"), "None", "No error state");
            assert.equal(this.oViewModelMock.getProperty("/Data/AttributeId"), "TEST_ATTR", "AttributeId set");
            assert.ok(this.oAttributeInput.setTokens.called, "Tokens set on input");
            done();
        }.bind(this), 100);
    });

    QUnit.test("_validateAttibuteInput should handle validation error", function (assert) {
        // Arrange
        var done = assert.async();
        var oError = {
            responseText: JSON.stringify({
                error: {
                    message: {
                        value: "Attribute not found"
                    }
                }
            })
        };
         this.oODataModelMock.read.yieldsTo('success', oError);
       // this.oODataModelMock.read.callsFake(function (sPath, mParameters) {
        //    mParameters.error(oError);
       // });

        // Act
        this.oController._validateAttibuteInput("INVALID_ATTR");

        // Assert
        setTimeout(function () {
            assert.equal(this.oViewModelMock.getProperty("/AttrErrorState"), "Error", "Error state set");
            assert.equal(this.oViewModelMock.getProperty("/AttrErrorMessage"), "Attribute not found", "Error message set");
            done();
        }.bind(this), 100);
    });

    QUnit.module("DataMaskingEnforcement Controller - Delete Record", {
        beforeEach: function () {
            this.oController = new DataMaskingEnforcementController();

            this.oODataModelMock = {
                remove: sinon.stub(),
                refresh: sinon.stub()
            };

            this.oViewModelMock = new JSONModel({
                Data: {},
                EditButtonEnabled: false,
                DeleteButtonEnabled: false
            });

            this.oViewMock = new View({});
            var oSelectedItem = {
                getBindingContext: sinon.stub().returns({
                    getObject: sinon.stub().returns({
                        Policy: "TEST_POLICY",
                        AttributeId: "TEST_ATTR"
                    })
                })
            };

            this.oTableMock = {
                getSelectedItem: sinon.stub().returns(oSelectedItem),
                removeSelections: sinon.stub()
            };

            this.oViewMock.byId = sinon.stub().returns(this.oTableMock);
            
            sinon.stub(this.oViewMock, "getModel")
                .withArgs("viewModel").returns(this.oViewModelMock)
                .withArgs().returns(this.oODataModelMock);

            sinon.stub(this.oController, "getView").returns(this.oViewMock);

            this.oController.oPolicyEnforcementTable = this.oTableMock;

            sinon.stub(MessageBox, "success");
            sinon.stub(MessageBox, "error");
        },
        afterEach: function () {
            this.oController.destroy();
            this.oViewMock.destroy();
            MessageBox.success.restore();
            MessageBox.error.restore();
        }
    });

    QUnit.test("removeSelectedRecord should delete policy successfully", function (assert) {
        // Arrange
        var done = assert.async();
         this.oODataModelMock.remove.yieldsTo('success', this.oViewModelData);
      //  this.oODataModelMock.remove.callsFake(function (sPath, mParameters) {
      //      mParameters.success();
       // });

        // Act
        this.oController.removeSelectedRecord();

        // Assert
        setTimeout(function () {
            assert.ok(this.oODataModelMock.remove.called, "Remove was called");
            var sPath = this.oODataModelMock.remove.getCall(0).args[0];
            assert.ok(sPath.includes("TEST_POLICY~TEST_ATTR"), "Correct URI key used");
            assert.ok(MessageBox.success.called, "Success message shown");
            assert.ok(this.oTableMock.removeSelections.called, "Table selections cleared");
            done();
        }.bind(this), 100);
    });
});