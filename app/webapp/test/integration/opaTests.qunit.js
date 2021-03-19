/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"com/bayer/tender/landingspage/test/integration/AllJourneys"
	], function() {
		QUnit.start();
	});
});