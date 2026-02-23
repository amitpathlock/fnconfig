/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require(["sap/ui/qunit/qunit-coverage",
		"pl/dac/apps/fnconfig/test/unit/AllTests"
	], function () {
		//QUnit.start();
	});
});
