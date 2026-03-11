sap.ui.define([
    "pl/dac/apps/fnconfig/controller/UserAttributes.controller",
    "sap/ui/base/ManagedObject",
    "sap/ui/core/mvc/View",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageBox",
     "sap/ui/comp/smarttable/SmartTable"
], function(
    UserAttributesController,
    ManagedObject,
    View,
    JSONModel,
    ODataModel,
    MessageBox,
    SmartTable
) {
    "use strict";

    QUnit.module("UserAttributes Controller", {
        beforeEach: function() {
            // Create controller instance
            this.oController = new UserAttributesController();
            
            // Create mock view
           this.oViewStub = new View({});
            
            // Create mock models
            this.oViewModel = new JSONModel({
                Name: "Attribute",
                Description: "Description",
                Icon: "sap-icon://person-placeholder",
                Title: "User Attribute",
                PlaceHolder: "Enter User Attribute",
                EditButtonEnabled: false,
                Payload: {
                    AttributeId: "",
                    Description: ""
                },
                AttrNameEnabled: true,
                ErrorState: "None",
                ErrorMessage: "",
                ErrorStateDesc: "None",
                ErrorMessageDesc: "",
                DeleteButtonEnabled: false,
                FullScreen: true,
                ExitFullScreen: false,
                ExitColumn: true,
                SortOrder: "asc",
                AttributeType: "USER",
                SelectedContextData: null,
                Data: {}
            });
            this.oTable = {
                removeSelections: sinon.stub(),
                getSelectedItem: sinon.stub(),
                getBinding: sinon.stub().returns({
                    sort: sinon.stub()
                })
            };
            this.oI18nModel = new JSONModel({
                lblAttribute: "Attribute",
                lblDescription: "Description",
                titUserAttribute: "User Attribute",
                pholderUserAttribute: "Enter User Attribute",
                msgErrorEmptyField: "Field cannot be empty",
                msgErrorDuplicateEntry: "Duplicate entry: {0}",
                msgUAUpdateSuccessfully: "Attribute {0} updated successfully",
                msgUACreateSuccessfully: "Attribute {0} created successfully",
                msgUADeleteSucceful: "Attribute {0} deleted successfully",
                msgUAErrorInUAUpdate: "Error updating attribute",
                msgUAErrorInCreate: "Error creating attribute",
                msgUAErrorInDelete: "Error deleting attribute",
                msgDeleteConfirmation: "Are you sure you want to delete?"
            });
            this.oResourceBundleStub = {
                getText: sinon.stub()
            };
            this.oResourceBundleStub.getText.returnsArg(0); // Returns the key as value
            this.oResourceBundleStub.getText.withArgs("msgErrorEmptyField").returns("Field cannot be empty");
            this.oResourceBundleStub.getText.withArgs("msgErrorInUpdate").returns("Error in update: ");
             this.oResourceBundleStub.getText.withArgs("msgErrorDuplicateEntry").returns("An entry with the name 'EXISTING_ATTR' already exists!");
            
            var oI18nModelStub = {
                getResourceBundle: sinon.stub().returns(this.oResourceBundleStub)
            };
            this.oODataModel = new ODataModel("/sap/opu/odata/sap/SERVICE/");
            sinon.stub(this.oController, "getView").returns(this.oViewStub);
            // Set up view with models

           // this.oView.setModel(this.oViewModel, "viewModel");
          //  this.oView.setModel(this.oI18nModel, "i18n");
          //  this.oView.setModel(this.oODataModel);
            
            // Stub view methods
          //  sinon.stub(this.oController, "getView").returns(this.oView);
             this.oViewStub.setModel(this.oViewModel, "viewModel");
             this.oViewStub.setModel(oI18nModelStub, "i18n");
             this.oViewStub.setModel(this.oODataModel);
            this.oSmartTable = new SmartTable("idTableUserAttributes", {
            entitySet: "DataAttributeSet",
            tableType: "ResponsiveTable",
            showRowCount: true,
            enableAutoBinding: false
            });
            
            this.oViewStub.addContent(this.oSmartTable);
          //  sinon.stub(this.oViewStub, "byId").withArgs("idTableUserAttributes").returns(this.oSmartTable);
            // Mock getOwnerComponent
            // this.oOwnerComponent = {
            //     getRouter: sinon.stub().returns({
            //         getRoute: sinon.stub().returns({
            //             attachPatternMatched: sinon.stub()
            //         })
            //     })
            // };
            // sinon.stub(this.oController, "getOwnerComponent").returns(this.oOwnerComponent);
            var oRouterStub = {
                getRoute: sinon.stub().returns({
                    attachPatternMatched: sinon.stub()
                })
            };
            sinon.stub(this.oController, "getOwnerComponent").returns({
                getRouter: sinon.stub().returns(oRouterStub)
            });

            
            // Mock addAddintionButtonIntoTheAttributeTableToolbar
            sinon.stub(this.oController, "addAddintionButtonIntoTheAttributeTableToolbar");
            
            // Mock table
            
            sinon.stub(this.oViewStub, "byId").withArgs("idTableUserAttributes").returns(this.oTable);
          //  sinon.stub(this.oViewStub, "getModel").withArgs("viewModel").returns(this.oViewModel);
        },
        afterEach: function() {
            this.oController.destroy();
            this.oViewStub.destroy();
            this.oViewModel.destroy();
            this.oI18nModel.destroy();
        }
    });

    QUnit.test("Should initialize controller", function(assert) {
        // Act
        this.oController.onInit();
      //  debugger;
        // Assert
        assert.ok(this.oController.getOwnerComponent.called, "getOwnerComponent was called");
        assert.ok(this.oController.addAddintionButtonIntoTheAttributeTableToolbar.called, 
            "addAddintionButtonIntoTheAttributeTableToolbar was called");
    });

    QUnit.test("Should handle route matched event", function(assert) {
        // Arrange
        var oBusyIndicatorStub = sinon.stub(sap.ui.core.BusyIndicator, "hide");
        
        // Act
        this.oController._onRouteMatched();
        
        // Assert
        assert.ok(oBusyIndicatorStub.called, "BusyIndicator.hide was called");
        assert.ok(this.oTable.removeSelections.called, "Table selections were removed");
        var oViewModel = this.oViewStub.getModel("viewModel");
        assert.strictEqual(oViewModel.getProperty("/SortOrder"), "asc", "Sort order is set to asc");
        
        // Cleanup
        oBusyIndicatorStub.restore();
    });

    QUnit.test("Should validate empty AttributeId on save", function(assert) {
        // Arrange
        this.oViewModel.setProperty("/Data", {
            AttributeId: "",
            Description: "Test Description"
        });
        
        // Act
        this.oController.onSaveAttributeDialog();
        
        // Assert
        assert.strictEqual(this.oViewModel.getProperty("/ErrorState"), "Error", 
            "Error state is set for empty AttributeId");
        assert.strictEqual(this.oViewModel.getProperty("/ErrorMessage"), "Field cannot be empty",
            "Error message is set correctly");
    });

    QUnit.test("Should validate empty Description on save", function(assert) {
        // Arrange
        this.oViewModel.setProperty("/Data", {
            AttributeId: "TEST_ATTR",
            Description: ""
        });
        
        // Act
        this.oController.onSaveAttributeDialog();
        
        // Assert
        assert.strictEqual(this.oViewModel.getProperty("/ErrorStateDesc"), "Error",
            "Error state is set for empty Description");
        assert.strictEqual(this.oViewModel.getProperty("/ErrorMessageDesc"), "Field cannot be empty",
            "Error message for description is set correctly");
    });

    QUnit.test("Should update existing entry successfully", function(assert) {
        // Arrange
        var done = assert.async();
        var oEntry = {
            AttributeId: "TEST_ATTR",
            Description: "Test Description",
            __metadata: {}
        };
        this.oViewModel.setProperty("/Data", oEntry);
        
        var oUpdateStub = sinon.stub(this.oODataModel, "update",function(sPath, oData, mParams) {
            mParams.success();
        });
        
        var oMessageBoxStub = sinon.stub(MessageBox, "success");
        this.oController.oAttributeDialog = { close: sinon.stub() };
        
        // Act
        this.oController.onSaveAttributeDialog();
        
        // Assert
        setTimeout(function() {
            assert.ok(oUpdateStub.called, "OData update was called");
            assert.ok(oMessageBoxStub.called, "Success message was shown");
            assert.ok(this.oController.oAttributeDialog.close.called, "Dialog was closed");
            
            // Cleanup
            oUpdateStub.restore();
            oMessageBoxStub.restore();
            done();
        }.bind(this), 100);
    });

    QUnit.test("Should create new entry successfully", function(assert) {
        // Arrange
        var done = assert.async();
        var oEntry = {
            AttributeId: "NEW_ATTR",
            Description: "New Description"
        };
        this.oViewModel.setProperty("/Data", oEntry);
        
        var oReadStub = sinon.stub(this.oODataModel, "read",function(sPath, mParams) {
            mParams.error({ statusCode: 404 });
        });
        
        var oCreateStub = sinon.stub(this.oODataModel, "create",function(sPath, oData, mParams) {
            mParams.success();
        });
        
        var oMessageBoxStub = sinon.stub(MessageBox, "success");
        this.oController.oAttributeDialog = { close: sinon.stub() };
        this.oController.oInputAttributeName = { focus: sinon.stub() };
        
        // Act
        this.oController.onSaveAttributeDialog();
        
        // Assert
        setTimeout(function() {
            assert.ok(oReadStub.called, "OData read was called to check for duplicates");
            assert.ok(oCreateStub.called, "OData create was called");
            assert.ok(oMessageBoxStub.called, "Success message was shown");
            
            // Cleanup
            oReadStub.restore();
            oCreateStub.restore();
            oMessageBoxStub.restore();
            done();
        }.bind(this), 100);
    });

    QUnit.test("Should detect duplicate entry", function(assert) {
        // Arrange
        var done = assert.async();
        var oEntry = {
            AttributeId: "EXISTING_ATTR",
            Description: "Description"
        };
        
        var oReadStub = sinon.stub(this.oODataModel, "read",function(sPath, mParams) {
            mParams.success(oEntry);
        });
        
        this.oController.oInputAttributeName = { focus: sinon.stub() };
        
        // Act
        this.oController._checkForDuplicateEntry("/UserAttributeSet('EXISTING_ATTR')", oEntry);
        
        // Assert
        setTimeout(function() {
            assert.strictEqual(this.oViewModel.getProperty("/ErrorState"), "Error",
                "Error state is set for duplicate entry");
            assert.ok(this.oViewModel.getProperty("/ErrorMessage").indexOf("EXISTING_ATTR") > -1,
                "Error message contains the duplicate attribute ID");
            assert.ok(this.oController.oInputAttributeName.focus.called, "Focus is set to input field");
            
            // Cleanup
            oReadStub.restore();
            done();
        }.bind(this), 100);
    });

    QUnit.test("Should remove selected record successfully", function(assert) {
        // Arrange
        var done = assert.async();
        this.oViewModel.setProperty("/SelectedContextData", {
            AttributeId: "TEST_ATTR"
        });
        
        var oRemoveStub = sinon.stub(this.oODataModel, "remove",function(sPath, mParams) {
            mParams.success();
        });
        
        var oMessageBoxStub = sinon.stub(MessageBox, "success");
        
        // Act
        this.oController.removeSelectedRecord();
        
        // Assert
        setTimeout(function() {
            assert.ok(oRemoveStub.called, "OData remove was called");
            assert.ok(oMessageBoxStub.called, "Success message was shown");
            assert.ok(this.oTable.removeSelections.called, "Table selections were cleared");
            assert.strictEqual(this.oViewModel.getProperty("/EditButtonEnabled"), false,
                "Edit button is disabled");
            assert.strictEqual(this.oViewModel.getProperty("/DeleteButtonEnabled"), false,
                "Delete button is disabled");
            
            // Cleanup
            oRemoveStub.restore();
            oMessageBoxStub.restore();
            done();
        }.bind(this), 100);
    });

    QUnit.test("Should sort table in ascending order", function(assert) {
        // Arrange
        this.oViewModel.setProperty("/SortOrder", "desc");
        
        // Act
        this.oController.onSort();
        
        // Assert
        assert.strictEqual(this.oViewModel.getProperty("/SortOrder"), "asc",
            "Sort order changed to ascending");
        assert.ok(this.oTable.getBinding.called, "Table binding was accessed");
    });

    QUnit.test("Should sort table in descending order", function(assert) {
        // Arrange
        this.oViewModel.setProperty("/SortOrder", "asc");
        
        // Act
        this.oController.onSort();
        
        // Assert
        assert.strictEqual(this.oViewModel.getProperty("/SortOrder"), "desc",
            "Sort order changed to descending");
        assert.ok(this.oTable.getBinding.called, "Table binding was accessed");
    });

    QUnit.test("Should display error message from OData error", function(assert) {
        // Arrange
        var oError = {
            responseText: JSON.stringify({
                error: {
                    message: {
                        value: "Custom error message"
                    }
                }
            })
        };
        
        var oMessageBoxStub = sinon.stub(MessageBox, "error");
        
        // Act
        this.oController.displayErrorMessage(oError);
        
        // Assert
        assert.ok(oMessageBoxStub.calledWith("Custom error message"),
            "Error message is displayed correctly");
        
        // Cleanup
        oMessageBoxStub.restore();
    });

    QUnit.test("Should hide busy indicator on after rendering", function(assert) {
        // Arrange
        var oBusyIndicatorStub = sinon.stub(sap.ui.core.BusyIndicator, "hide");
        
        // Act
        this.oController.onAfterRendering();
        
        // Assert
        assert.ok(oBusyIndicatorStub.called, "BusyIndicator.hide was called");
        
        // Cleanup
        oBusyIndicatorStub.restore();
    });
});