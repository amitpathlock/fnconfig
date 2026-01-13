/*global QUnit*/

sap.ui.define([
	"pl/dac/apps/fnconfig/controller/Master.controller",
	"pl/dac/apps/fnconfig/controller/BaseController",
	"pl/dac/apps/fnconfig/const/PlDacConst",
	"sap/ui/core/mvc/View",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/base/Log"
], function (
	MasterController,
	BaseController,
	PlDacConst,
	View,
	JSONModel,
	ODataModel,
	Log
) {
	"use strict";

	QUnit.module("Master Controller - Initialization", {
		beforeEach: function () {
			// Create controller instance
			this.oController = new MasterController();

			// Create mock router
			this.oRouterMock = {
				navTo: sinon.stub(),
				getRoute: sinon.stub().returns({
					attachPatternMatched: sinon.stub()
				})
			};

			// Create mock component
			this.oComponentMock = {
				getRouter: sinon.stub().returns(this.oRouterMock),
				getModel: sinon.stub()
			};

			// Create mock view
			this.oViewMock = new View({});
			this.oLayoutModel = new JSONModel({ layout: "OneColumn" });
			this.oActionDataModel = new JSONModel([]);

			// Stub controller methods
			sinon.stub(this.oController, "getOwnerComponent").returns(this.oComponentMock);
			sinon.stub(this.oController, "getView").returns(this.oViewMock);
		//	this.oODataModel = new ODataModel("/sap/opu/odata/sap/SERVICE/");
		//	this.oViewMock.setModel(this.oODataModel);
			// Stub global hasher
			window.hasher = {
				getHashAsArray: sinon.stub().returns([])
			};

			// Stub BusyIndicator
			sinon.stub(sap.ui.core.BusyIndicator, "show");
			sinon.stub(sap.ui.core.BusyIndicator, "hide");

			// Stub _loadActionSet to prevent actual OData call during init
			sinon.stub(this.oController, "_loadActionSet");
		},
		afterEach: function () {
			this.oController.destroy();
			this.oViewMock.destroy();
			this.oLayoutModel.destroy();
			this.oActionDataModel.destroy();
			sap.ui.core.BusyIndicator.show.restore();
			sap.ui.core.BusyIndicator.hide.restore();
			delete window.hasher;
		}
	});

	QUnit.test("Should instantiate the controller", function (assert) {
		// Assert
		assert.ok(this.oController, "Controller instance created");
		assert.ok(this.oController instanceof BaseController, "Controller extends BaseController");
	});

	QUnit.test("onInit should initialize router and show busy indicator", function (assert) {
		// Act
		this.oController.onInit();

		// Assert
		assert.ok(this.oController.getOwnerComponent.called, "getOwnerComponent was called");
		assert.ok(this.oComponentMock.getRouter.called, "Router was retrieved from component");
		assert.ok(sap.ui.core.BusyIndicator.show.called, "BusyIndicator.show was called");
		assert.ok(this.oController._loadActionSet.called, "_loadActionSet was called");
		assert.ok(this.oController._oRouter, "Router instance stored in _oRouter");
	});

	QUnit.module("Master Controller - Route Matched", {
		beforeEach: function () {
			this.oController = new MasterController();
			sinon.stub(sap.ui.core.BusyIndicator, "hide");
		},
		afterEach: function () {
			this.oController.destroy();
			sap.ui.core.BusyIndicator.hide.restore();
		}
	});

	QUnit.test("_onRouteMatched should hide busy indicator", function (assert) {
		// Act
		this.oController._onRouteMatched();

		// Assert
		assert.ok(sap.ui.core.BusyIndicator.hide.calledOnce, "BusyIndicator.hide was called once");
	});

	QUnit.module("Master Controller - Selection Change", {
		beforeEach: function () {
			this.oController = new MasterController();

			// Create mock router
			this.oRouterMock = {
				navTo: sinon.stub()
			};
			this.oController._oRouter = this.oRouterMock;

			// Create mock view and models
			this.oViewMock = new View({});
			this.oLayoutModel = new JSONModel({ layout: "OneColumn" });
			sinon.stub(this.oViewMock, "getModel").returns(this.oLayoutModel);
			sinon.stub(this.oController, "getView").returns(this.oViewMock);

			// Stub hasher
			window.hasher = {
				getHashAsArray: sinon.stub().returns(["", "OldTarget"])
			};

			// Stub BusyIndicator
			sinon.stub(sap.ui.core.BusyIndicator, "show");
		},
		afterEach: function () {
			this.oController.destroy();
			this.oViewMock.destroy();
			this.oLayoutModel.destroy();
			sap.ui.core.BusyIndicator.show.restore();
			delete window.hasher;
		}
	});

	QUnit.test("onSelectionChange should navigate to target and set layout", function (assert) {
		// Arrange
		var oContextData = {
			Name: "Test Action",
			Icon: "sap-icon://home",
			Target: "Info"
		};

		var oEventMock = {
			getParameter: sinon.stub().returns({
				getBinding: sinon.stub().returns({
					getContext: sinon.stub().returns({
						getObject: sinon.stub().returns(oContextData)
					})
				})
			})
		};

		// Act
		this.oController.onSelectionChange(oEventMock);

		// Assert
		assert.equal(this.oLayoutModel.getProperty("/layout"), "TwoColumnsMidExpanded",
			"Layout was set to TwoColumnsMidExpanded");
		assert.ok(this.oRouterMock.navTo.calledWith("Info"),
			"Router.navTo was called with correct target");
	});

	QUnit.test("onSelectionChange should show busy indicator when navigating to different route", function (assert) {
		// Arrange
		var oContextData = {
			Target: "NewTarget"
		};

		var oEventMock = {
			getParameter: sinon.stub().returns({
				getBinding: sinon.stub().returns({
					getContext: sinon.stub().returns({
						getObject: sinon.stub().returns(oContextData)
					})
				})
			})
		};

		// Act
		this.oController.onSelectionChange(oEventMock);

		// Assert
		assert.ok(sap.ui.core.BusyIndicator.show.called, "BusyIndicator.show was called");
	});

	QUnit.test("onSelectionChange should not navigate when target is empty", function (assert) {
		// Arrange
		var oContextData = {
			Target: ""
		};

		var oEventMock = {
			getParameter: sinon.stub().returns({
				getBinding: sinon.stub().returns({
					getContext: sinon.stub().returns({
						getObject: sinon.stub().returns(oContextData)
					})
				})
			})
		};

		// Act
		this.oController.onSelectionChange(oEventMock);

		// Assert
		assert.ok(this.oRouterMock.navTo.notCalled, "Router.navTo was not called");
	});

	QUnit.module("Master Controller - Load Action Set", {
		beforeEach: function () {
			this.oController = new MasterController();

			// Mock OData model
			this.oODataModelMock = {
				read: sinon.stub()
			};

			// Mock component
			this.oComponentMock = {
				getModel: sinon.stub().returns(this.oODataModelMock),
				getRouter: sinon.stub().returns({})
			};

			// Mock view
			this.oViewMock = new View({});
			sinon.stub(this.oViewMock, "setModel");

			sinon.stub(this.oController, "getOwnerComponent").returns(this.oComponentMock);
			sinon.stub(this.oController, "getView").returns(this.oViewMock);

			// Stub BusyIndicator
			sinon.stub(sap.ui.core.BusyIndicator, "hide");

			// Restore the _loadActionSet stub if it exists
			if (this.oController._loadActionSet.restore) {
				this.oController._loadActionSet.restore();
			}
		},
		afterEach: function () {
			this.oController.destroy();
			this.oViewMock.destroy();
			sap.ui.core.BusyIndicator.hide.restore();
		}
	});

	QUnit.test("_loadActionSet should successfully load and parse action data", function (assert) {
		// Arrange
		var done = assert.async();
		var oMockData = {
			results: [
				{
					Text: "Parent Action",
					Icon: "sap-icon://home",
					Target: "Info",
					to_ActionItem: {
						results: [
							{
								Text: "Child Action 1",
								Icon: "sap-icon://navigation-right-arrow",
								Target: "DataAttributes"
							},
							{
								Text: "Child Action 2",
								Icon: "sap-icon://navigation-down-arrow",
								Target: "UserAttributes"
							}
						]
					}
				}
			]
		};
		//sinon.spy(this.oODataModelMock, "read");
		//  var oRemoveStub = sinon.stub(this.oODataModel, "read",function(sPath, mParams) {
        //     mParams.success(oMockData);
        // });
		//this.oODataModelMock.read.callsFake(function (sPath, mParameters) {
		//	mParameters.success(oMockData);
		//});
this.oODataModelMock.read.yieldsTo('success', oMockData);
		// Act
		this.oController._loadActionSet();

		// Assert
		setTimeout(function () {
			assert.ok(this.oODataModelMock.read.calledOnce, "OData read was called");
			assert.ok(this.oODataModelMock.read.calledWith(PlDacConst.ENTITY_SET_ACTION_PATH),
				"Read was called with correct entity set path");
			assert.ok(this.oViewMock.setModel.calledOnce, "View model was set");
			assert.ok(sap.ui.core.BusyIndicator.hide.called, "BusyIndicator.hide was called");

			var oModelArg = this.oViewMock.setModel.getCall(0).args[0];
			var sModelName = this.oViewMock.setModel.getCall(0).args[1];
			assert.equal(sModelName, "actionData", "Model was set with correct name");
			assert.ok(oModelArg instanceof JSONModel, "Model is a JSONModel");

			var aData = oModelArg.getData();
			assert.equal(aData.length, 1, "One parent action item exists");
			assert.equal(aData[0].Name, "Parent Action", "Parent action name is correct");
			assert.equal(aData[0].nodes.length, 2, "Two child actions exist");

			done();
		}.bind(this), 100);
	});

	QUnit.test("_loadActionSet should handle error gracefully", function (assert) {
		// Arrange
		var done = assert.async();
		var oError = { message: "Network error" };
		sinon.stub(Log, "error");
		this.oODataModelMock.read.yieldsTo('success', oError);
		// this.oODataModelMock.read.callsFake(function (sPath, mParameters) {
		// 	mParameters.error(oError);
		// });

		// Act
		this.oController._loadActionSet();

		// Assert
		setTimeout(function () {
			assert.ok(Log.error.called, "Log.error was called");
			assert.ok(sap.ui.core.BusyIndicator.hide.called, "BusyIndicator.hide was called even on error");
			Log.error.restore();
			done();
		}, 100);
	});

	QUnit.module("Master Controller - After Rendering", {
		beforeEach: function () {
			this.oController = new MasterController();

			// Mock router
			this.oRouterMock = {
				navTo: sinon.stub()
			};
			this.oController._oRouter = this.oRouterMock;

			// Mock view and models
			this.oViewMock = new View({});
			this.oLayoutModel = new JSONModel({ layout: "OneColumn" });
			sinon.stub(this.oViewMock, "getModel").returns(this.oLayoutModel);
			sinon.stub(this.oController, "getView").returns(this.oViewMock);

			// Stub hasher
			window.hasher = {
				getHashAsArray: sinon.stub()
			};
		},
		afterEach: function () {
			this.oController.destroy();
			this.oViewMock.destroy();
			this.oLayoutModel.destroy();
			delete window.hasher;
		}
	});

	QUnit.test("onAfterRendering should navigate to Info when no hash exists", function (assert) {
		// Arrange
		window.hasher.getHashAsArray.returns([]);

		// Act
		this.oController.onAfterRendering();

		// Assert
		assert.ok(this.oRouterMock.navTo.calledWith(PlDacConst.ROUTE_PATH_INFO),
			"Router navigated to Info route");
		assert.equal(this.oLayoutModel.getProperty("/layout"), "TwoColumnsMidExpanded",
			"Layout was set to TwoColumnsMidExpanded");
	});

	QUnit.test("onAfterRendering should navigate to Info when current route is Info", function (assert) {
		// Arrange
		window.hasher.getHashAsArray.returns(["", PlDacConst.ROUTE_PATH_INFO]);

		// Act
		this.oController.onAfterRendering();

		// Assert
		assert.ok(this.oRouterMock.navTo.calledWith(PlDacConst.ROUTE_PATH_INFO),
			"Router navigated to Info route");
	});

	QUnit.test("onAfterRendering should not navigate when hash exists and is not Info", function (assert) {
		// Arrange
		window.hasher.getHashAsArray.returns(["", "DataAttributes"]);

		// Act
		this.oController.onAfterRendering();

		// Assert
		assert.ok(this.oRouterMock.navTo.notCalled,
			"Router.navTo was not called");
		assert.equal(this.oLayoutModel.getProperty("/layout"), "TwoColumnsMidExpanded",
			"Layout was still set to TwoColumnsMidExpanded");
	});

	QUnit.test("onAfterRendering should always set layout to TwoColumnsMidExpanded", function (assert) {
		// Arrange
		window.hasher.getHashAsArray.returns(["", "SomeRoute"]);

		// Act
		this.oController.onAfterRendering();

		// Assert
		assert.equal(this.oLayoutModel.getProperty("/layout"), "TwoColumnsMidExpanded",
			"Layout was set correctly");
	});
});