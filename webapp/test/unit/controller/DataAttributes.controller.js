sap.ui.define([
    "pl/dac/apps/fnconfig/controller/DataAttributes.controller",
    "sap/ui/base/ManagedObject",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/View",
    "sap/m/MessageBox",
    "sap/ui/comp/smarttable/SmartTable"
   
], function (DataAttributesController, ManagedObject, JSONModel, View, MessageBox,SmartTable) {
    "use strict";


    QUnit.module("DataAttributes Controller", {
        beforeEach: function () {
            this.oController = new DataAttributesController();
            this.oViewStub = new View({});
            this.oModelStub = new JSONModel();
            this.oViewModelStub = new JSONModel();
            // Create ResourceBundle stub
        this.oResourceBundleStub = {
            getText: sinon.stub()
        };
        
        // Set default return values
        this.oResourceBundleStub.getText.returnsArg(0); // Returns the key as value
        this.oResourceBundleStub.getText.withArgs("msgErrorEmptyField").returns("Field cannot be empty");
        this.oResourceBundleStub.getText.withArgs("msgErrorInUpdate").returns("Error in update: ");
        
        var oI18nModelStub = {
            getResourceBundle: sinon.stub().returns(this.oResourceBundleStub)
        };
            
        sinon.stub(this.oController, "getView").returns(this.oViewStub);
        this.oViewStub.setModel(this.oModelStub);
        this.oViewStub.setModel(this.oViewModelStub, "viewModel");
        this.oViewStub.setModel(oI18nModelStub, "i18n");
        },
        afterEach: function () {
            this.oController.destroy();
            this.oViewStub.destroy();
            this.oModelStub.destroy();
            this.oViewModelStub.destroy();
        }
    });

    QUnit.test("Should initialize controller", function (assert) {
        // Arrange
        var oRouterStub = {
            getRoute: sinon.stub().returns({
                attachPatternMatched: sinon.stub()
            })
        };
        sinon.stub(this.oController, "getOwnerComponent").returns({
            getRouter: sinon.stub().returns(oRouterStub)
        });

        var oSmartTable = new SmartTable("idSmartTableDataAttributes", {
        entitySet: "DataAttributeSet",
        tableType: "ResponsiveTable",
        showRowCount: true,
        enableAutoBinding: false
        });
        
        this.oViewStub.addContent(oSmartTable);
        sinon.stub(this.oViewStub, "byId").withArgs("idSmartTableDataAttributes").returns(oSmartTable);
            // Act
        this.oController.onInit();
        debugger;
        // Assert
        assert.ok(this.oController._oRouter, "Router should be initialized");
    });

    QUnit.test("Should validate empty AttributeId on save", function (assert) {
        // Arrange
        var oResourceBundleStub = {
            getText: sinon.stub().returns("Error message")
        };
        var oI18nModel = new sap.ui.model.resource.ResourceModel({
            bundleName: "pl.dac.apps.fnconfig.i18n.i18n"
        });
        this.oViewStub.setModel(oI18nModel, "i18n");
        
        this.oViewModelStub.setData({
            Data: {
                AttributeId: "",
                Description: "Test"
            }
        });

        // Act
        debugger;
        this.oController.onSaveAttributeDialog();

        // Assert
        assert.strictEqual(this.oViewModelStub.getProperty("/ErrorState"), "Error", 
            "Error state should be set");
    });

    QUnit.test("Should sort table ascending to descending", function (assert) {
        // Arrange
        var oBindingStub = {
            sort: sinon.stub()
        };
        var oTableStub = {
            getBinding: sinon.stub().returns(oBindingStub)
        };
        sinon.stub(this.oViewStub, "byId").returns(oTableStub);
        
        this.oViewModelStub.setProperty("/SortOrder", "asc");

        // Act
        this.oController.onSort();

        // Assert
        assert.strictEqual(this.oViewModelStub.getProperty("/SortOrder"), "desc", 
            "Sort order should change to desc");
        assert.ok(oBindingStub.sort.calledOnce, "Sort should be called");
    });

    QUnit.test("Should display error message from OData error", function (assert) {
        // Arrange
        var oError = {
            responseText: JSON.stringify({
                error: {
                    message: {
                        value: "Test error message"
                    }
                }
            })
        };
        var oMessageBoxStub = sinon.stub(MessageBox, "error");

        // Act
        this.oController._displayErrorMessage(oError);

        // Assert
        assert.ok(oMessageBoxStub.calledWith("Test error message"), 
            "Error message should be displayed");
        
        // Cleanup
        oMessageBoxStub.restore();
    });
});