/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"pl/dac/apps/fnconfig/test/unit/AllTests"
	], function () {
		//QUnit.start();
	});
});
