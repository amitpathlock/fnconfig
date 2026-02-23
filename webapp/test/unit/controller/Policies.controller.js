/*global QUnit*/
sap.ui.define([
    "pl/dac/apps/fnconfig/controller/Policies.controller",
    "sap/ui/core/mvc/View",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel"
], function (PoliciesController, View, JSONModel, ODataModel) {
    "use strict";

    QUnit.module("Policies Controller", {
        beforeEach: function () {
             this.oTable = {
                removeSelections: sinon.stub(),
                getSelectedItem: sinon.stub(),
                getBinding: sinon.stub().returns({
                    sort: sinon.stub()
                })
            };
            
            // Create controller instance
            this.oController = new PoliciesController();
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
            this.oView = new View({});
       //     this.oView.byId = sinon.stub();

            sinon.stub(this.oController, "getOwnerComponent").returns(this.oComponentMock);
            sinon.stub(this.oController, "getView").returns(this.oView);
       
        //     // Mock models
            this.oDataModel = sinon.createStubInstance(ODataModel);
            this.oViewModel = new JSONModel();
             this.oResourceBundleStub = {
                getText: sinon.stub()
            };
            this.oResourceBundleStub.getText.withArgs("msgErrorPolicyNameMandatory").returns("The mandatory field cannot be left blank!");
            this.oResourceBundleStub.getText.withArgs("msgErrorInUpdate").returns("Error in update: ");
            var oI18nModelStub = {
                getResourceBundle: sinon.stub().returns(this.oResourceBundleStub)
            };

            this.oView.setModel(this.oDataModel);
            this.oView.setModel(this.oViewModel, "viewModel");
            this.oView.setModel(oI18nModelStub, "i18n");
           //  sinon.stub(this.oView, "byId").withArgs("idTablePolAdminPolicies").returns(this.oTable);
        //     // Mock router
        //      this.oComponentMock = {
        //         getRouter: sinon.stub().returns(this.oRouterMock),
        //         getModel: sinon.stub()
        //     };
            //idTablePolAdminPolicies
        //    sinon.stub(this.oController, "getOwnerComponent").returns(this.oComponentMock);
        },

        afterEach: function () {
            this.oView.destroy();
            this.oController.destroy();
            sinon.restore();
        }
    });

    // Test onInit
    QUnit.test("Should initialize controller correctly", function (assert) {
        // Arrange
        var oSmartTable = {
            getToolbar: sinon.stub().returns({
                getContent: sinon.stub().returns([]),
                addContent: sinon.stub()
            })
        };
        sinon.stub(this.oView, "byId").returns(oSmartTable);

        // Act
        this.oController.onInit();

        // Assert
        assert.ok(this.oController._oRouter, "Router should be initialized");
        assert.ok(this.oRouterMock.getRoute.calledWith("Policies"), "Route should be attached");
    });

    // Test table selection change
    QUnit.test("Should enable edit and delete buttons on selection", function (assert) {
        var oSmartTable = {
            getToolbar: sinon.stub().returns({
                getContent: sinon.stub().returns([]),
                addContent: sinon.stub()
            })
        };
        sinon.stub(this.oView, "byId").returns(oSmartTable);
        // Arrange
        this.oController.onInit();
        this.oViewModel.setProperty("/EditButtonEnabled", false);
        this.oViewModel.setProperty("/DeleteButtonEnabled", false);

        // Act
        this.oController.onTableSelectionChange();

        // Assert
        assert.strictEqual(this.oViewModel.getProperty("/EditButtonEnabled"), true, 
            "Edit button should be enabled");
        assert.strictEqual(this.oViewModel.getProperty("/DeleteButtonEnabled"), true, 
            "Delete button should be enabled");
    });

    // Test Add Policy button press
    QUnit.test("Should open dialog with empty data on add", function (assert) {
        // Arrange
        var done = assert.async();
        this.oViewModel.setData({ Data: {} });

        // Act
        this.oController._onAddPolicyPolAdminButtonPress();

        // Assert
        setTimeout(function () {
            var oData = this.oViewModel.getProperty("/Data");
            assert.strictEqual(oData.PolicyName, "", "PolicyName should be empty");
            assert.strictEqual(oData.PolicyDesc, "", "PolicyDesc should be empty");
            assert.strictEqual(this.oViewModel.getProperty("/PolicyNameEnabled"), true, 
                "PolicyName field should be enabled");
            done();
        }.bind(this), 100);
    });

    // Test Edit Policy button press
    QUnit.test("Should open dialog with selected data on edit", function (assert) {
        // Arrange
        var oMockData = {
            PolicyName: "TEST_POLICY",
            PolicyDesc: "Test Description",
            Policy: "TEST_POLICY"
        };
        
        var oTable = {
            getSelectedItem: sinon.stub().returns({
                getBindingContext: sinon.stub().returns({
                    getObject: sinon.stub().returns(oMockData)
                })
            }),
            removeSelections: sinon.stub()
        };
        
        sinon.stub(this.oView, "byId").returns(oTable);

        // Act
        this.oController._onEditPolicyPoladminButtonPress();

        // Assert
        assert.deepEqual(this.oViewModel.getProperty("/Data"), oMockData, 
            "Selected data should be set in viewModel");
        assert.strictEqual(this.oViewModel.getProperty("/PolicyNameEnabled"), false, 
            "PolicyName field should be disabled");
    });

    // Test Save validation - empty PolicyName
    QUnit.test("Should show error when PolicyName is empty", function (assert) {
        // Arrange
        this.oViewModel.setProperty("/Data", {
            PolicyName: "",
            PolicyDesc: "Test"
        });
        
        var oInput = {
            focus: sinon.spy()
        };
        sinon.stub(this.oView, "byId").returns(oInput);

        // Act
        this.oController.onSavePolAdminPolicy();

        // Assert
        assert.strictEqual(this.oViewModel.getProperty("/PolNameErrorState"), "Error", 
            "Error state should be set");
        assert.ok(oInput.focus.called, "Focus should be set on PolicyName field");
    });

    // Test Save validation - empty PolicyDesc
    QUnit.test("Should show error when PolicyDesc is empty", function (assert) {
        // Arrange
        this.oViewModel.setProperty("/Data", {
            PolicyName: "TEST",
            PolicyDesc: ""
        });
        
        var oInput = {
            focus: sinon.spy()
        };
        sinon.stub(this.oView, "byId").returns(oInput);

        // Act
        this.oController.onSavePolAdminPolicy();

        // Assert
        assert.strictEqual(this.oViewModel.getProperty("/PolDescErrorState"), "Error", 
            "Error state should be set");
        assert.ok(oInput.focus.called, "Focus should be set on PolicyDesc field");
    });

    // Test Policy Name uppercase conversion
    QUnit.test("Should convert policy name to uppercase on live change", function (assert) {
        // Arrange
        var oInput = {
            setValue: sinon.spy()
        };
        var oEvent = {
            getParameter: sinon.stub().returns("test_policy"),
            getSource: sinon.stub().returns(oInput)
        };

        // Act
        this.oController.onPolicyNameInputLiveChange(oEvent);

        // Assert
        assert.ok(oInput.setValue.calledWith("TEST_POLICY"), 
            "Value should be converted to uppercase");
    });

    // Test Dialog close
    QUnit.test("Should close dialog and clear selection", function (assert) {
        // Arrange
        this.oController._oDialogPolAdminPolicies = {
            close: sinon.spy()
        };
        
        var oTable = {
            removeSelections: sinon.spy()
        };
        sinon.stub(this.oView, "byId").returns(oTable);

        // Act
        this.oController.onClosePolAdminPolicyDialog();

        // Assert
        assert.ok(this.oController._oDialogPolAdminPolicies.close.called, 
            "Dialog should be closed");
        assert.ok(oTable.removeSelections.calledWith(true), 
            "Table selections should be cleared");
        assert.strictEqual(this.oViewModel.getProperty("/EditButtonEnabled"), false, 
            "Edit button should be disabled");
        assert.strictEqual(this.oViewModel.getProperty("/DeleteButtonEnabled"), false, 
            "Delete button should be disabled");
    });

    // Test validation error removal
    QUnit.test("Should remove all validation errors", function (assert) {
        // Arrange
        this.oViewModel.setProperty("/PolNameErrorState", "Error");
        this.oViewModel.setProperty("/PolDescErrorState", "Error");

        // Act
        this.oController._removelAllValidationError();

        // Assert
        assert.strictEqual(this.oViewModel.getProperty("/PolNameErrorState"), "None", 
            "PolicyName error state should be cleared");
        assert.strictEqual(this.oViewModel.getProperty("/PolDescErrorState"), "None", 
            "PolicyDesc error state should be cleared");
    });
});