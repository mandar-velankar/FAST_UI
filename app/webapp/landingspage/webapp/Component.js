// if (location.hostname.indexOf("localhost") > -1) {
// 	jQuery.sap.registerModulePath("com.bayer.tender.ppa", "/ppa/webapp");
// 	jQuery.sap.registerModulePath("com.bayer.tender.epa", "/epa/webapp");
// 	jQuery.sap.registerModulePath("com.bayer.tender.contracts", "/contracts/webapp");
// 	// jQuery.sap.registerModulePath("com.bayer.tender.uilib", "/uilib/src/com/bayer/tender/uilib"); 
// 	sap.ui.getCore().loadLibrary("com.bayer.tender.uilib", "/uilib/src/com/bayer/tender/uilib");
// 	jQuery.sap.registerModulePath("FAST_NS0FAST0", "/tender/webapp");
// } else {
	jQuery.sap.registerModulePath("com.bayer.tender.ppa", "/ppa");
	jQuery.sap.registerModulePath("com.bayer.tender.epa", "/epa");
	jQuery.sap.registerModulePath("com.bayer.tender.contracts", "/contracts");
	// jQuery.sap.registerModulePath("com.bayer.tender.uilib", "/uilib"); 
	sap.ui.getCore().loadLibrary("com.bayer.tender.uilib", "/uilib");
	jQuery.sap.registerModulePath("FAST_NS0FAST0", "/tender");
// }
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"./model/models",
	"sap/m/MessageBox"
], function (UIComponent, Device, models,MessageBox) {
	"use strict";

	return UIComponent.extend("com.bayer.tender.landingspage.Component", {
		/* 17 minutes warning & 22 minutes message saying timeout is reached; SESSION_TIMEOUT is now 24min (default Hana timeout is 15 minutes) 5400000, //*/
		// countdownWarning: 2400000,			//1020000=17min //840000=14min	//1800000=30min	//2400000=40min	(600000,	//10 minute ) // cureent active = 14 minutes
		// resetCountdownWarning: 2400000,	//1020000=17min //840000=14min 		//1800000=30min	//2400000=40min	(600000,	//10 minute ) // cureent active = 14 minutes
		// countdownSessionEnd: 3600000,		//1140000=19min	//2400000=40min	//3600000=60min	(840000,	//14 minutes) // cureent active = 19 minutes
		// resetCountdownSessionEnd: 3600000,	//1140000=19min	//2400000=40min	//3600000=60min	(840000,	//14 minutes) // cureent active = 19 minutes

		logoutUrl: window.location.host + window.location.pathname + window.location.hash, // URL to logout page.
		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this function, the device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			//ADDED FOR SESSION TIMEOUT
			// this.setInactivityTimeoutWarning(this.countdownWarning);
			// this.setInactivityTimeoutSessionEnd(this.countdownSessionEnd);
			// this.startInactivityTimerWarning();
			// this.startInactivityTimerSessionEnd();
			/**
		   * Each time a request is issued, reset the inactivity countdown
		   */
			//fast app data model
			// var that = this;
			// this.getModel("fastData").attachRequestCompleted(function (oEvent) {
			// 	that.resetInactivityTimeoutWarning();
			// 	that.resetInactivityTimeoutSessionEnd();
			// }, this);
			// initialize the error handler with the component
			// this._oErrorHandler = new ErrorHandler(this);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler is destroyed.
		 * @public
		 * @override
		 */
		destroy: function () {
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				// eslint-disable-next-line
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		// /**
		// * Set to correspond to something less than the SESSION_TIMEOUT value that you set for your approuter
		// * @see https://help.sap.com/viewer/4505d0bdaf4948449b7f7379d24d0f0d/2.0.04/en-US/5f77e58ec01b46f6b64ee1e2afe3ead7.html
		// */

		// /**
		//  * Return number of milliseconds left till warning
		//  * @returns {countdownWarning} the countdownWarning
		//  */
		// getInactivityTimeoutWarning: function () {
		// 	return this.countdownWarning;
		// },

		// /**
		// * Return number of milliseconds left till automatic logout
		// @returns {countdownSessionEnd} the countdown session ends
		// */
		// getInactivityTimeoutSessionEnd: function () {
		// 	return this.countdownSessionEnd;
		// },

		// /**
		//  * Set number of minutes left till warning
		//  * @param {timeout_millisec} timeout_millisec timout in milisec
		//  */
		// setInactivityTimeoutWarning: function (timeout_millisec) {
		// 	this.countdownWarning = timeout_millisec;
		// 	this.resetCountdownWarning = this.countdownWarning;
		// },

		// /**
		//  * Set number of minutes left till automatic logout
		//  * @param {timeout_millisec} timeout_millisec timout in milisec
		//  */
		// setInactivityTimeoutSessionEnd: function (timeout_millisec) {
		// 	this.countdownSessionEnd = timeout_millisec;
		// 	this.resetCountdownSessionEnd = this.countdownSessionEnd;
		// },

		// /**
		//  * Set number of minutes left till automatic logout
		//  */
		// resetInactivityTimeoutWarning: function () {
		// 	this.countdownWarning = this.resetCountdownWarning;
		// },

		// /**
		//  * Set number of minutes left till automatic logout
		//  */
		// resetInactivityTimeoutSessionEnd: function () {
		// 	this.countdownSessionEnd = this.resetCountdownSessionEnd;
		// },

		// /**
		//  * Begin counting tracking inactivity warning
		//  */
		// startInactivityTimerWarning: function () {
		// 	var that = this;
		// 	this.intervalHandleWarning = setInterval(function () {
		// 		//trigger warning message for possible extending
		// 		that._inactivityCountdownWarning();
		// 	}, 10000);
		// },

		// /**
		//  * Begin counting tracking inactivity session end
		//  */
		// startInactivityTimerSessionEnd: function () {
		// 	var that = this;
		// 	this.intervalHandleSessionEnd = setInterval(function () {
		// 		//trigger session timeout message
		// 		that._inactivityCountdownSessionEnd();
		// 	}, 10000);
		// },

		// stopInactivityTimerWarning: function () {
		// 	if (this.intervalHandleWarning !== null) {
		// 		clearInterval(this.intervalHandleWarning);
		// 		this.intervalHandleWarning = null;
		// 	}
		// },

		// stopInactivityTimerSessionEnd: function () {
		// 	if (this.intervalHandleSessionEnd !== null) {
		// 		clearInterval(this.intervalHandleSessionEnd);
		// 		this.intervalHandleSessionEnd = null;
		// 	}
		// },

		// //first show a warning, user can extend session
		// _inactivityCountdownWarning: function () {
		// 	var that = this;
		// 	this.countdownWarning -= 10000;
		// 	if (this.countdownWarning <= 0) {

		// 		//stop warning
		// 		//that.resetInactivityTimeoutWarning();
		// 		that.stopInactivityTimerWarning();

		// 		//if warning is already shown, we close it first===> will this every happen? Timer is stopped?
		// 		var oSessionWarningMessage = sap.ui.getCore().byId("idSessionWarningMessage");
		// 		if (oSessionWarningMessage) {
		// 			oSessionWarningMessage.close();
		// 			oSessionWarningMessage.destroy();
		// 		}

		// 		//check if session end message is found
		// 		var oSessionSessionEndMessage = sap.ui.getCore().byId("idSessionEndMessage");

		// 		//only if session end message is not shown, we show a warning
		// 		if (!oSessionSessionEndMessage) {

		// 			//session end
		// 			MessageBox.warning("Session is ending in 5min.. Click extend to keep working in the application",
		// 				{
		// 					id: "idSessionWarningMessage",
		// 					title: "Information",
		// 					actions: ["Extend Session"],
		// 					onClose: function (sAction) {

		// 						if (sAction === "Extend Session") {

		// 							//trigger back-end
		// 							//Services.loadUserInfo();
		// 							that.getModel("fastData").callFunction("/getCurrentUser");

		// 							//start warning again
		// 							that.startInactivityTimerWarning();

		// 							//reset session end
		// 							//that.stopInactivityTimerWarning(); //we do not want to stop showing warning messages
		// 							that.resetInactivityTimeoutWarning();
		// 							//that.stopInactivityTimerSessionEnd(); //we do not want to stop timeout triggering
		// 							that.resetInactivityTimeoutSessionEnd();

		// 						}

		// 					}
		// 				}
		// 			);

		// 		}
		// 	}
		// },

		// //show message saying session has ended and user needs to login again
		// _inactivityCountdownSessionEnd: function () {
		// 	var that = this;
		// 	that .countdownSessionEnd -= 10000;

		// 	if (that.countdownSessionEnd <= 0) {

		// 		//stop timers & reset
		// 		that.stopInactivityTimerSessionEnd();
		// 		that.resetInactivityTimeoutSessionEnd();

		// 		//if warning message is still open, close it first
		// 		var oSessionWarningMessage = sap.ui.getCore().byId("idSessionWarningMessage");
		// 		if (oSessionWarningMessage) {
		// 			oSessionWarningMessage.close();
		// 			oSessionWarningMessage.destroy();
		// 		}

		// 		//show session end message
		// 		MessageBox.warning("Session has ended.. Please logon again.",
		// 			{
		// 				id: "idSessionEndMessage",
		// 				title: "Information",
		// 				actions: ["Close"],
		// 				onClose: function (sAction) {
		// 					window.location.reload(true);
		// 					//window.location = that.logoutUrl;
		// 				}
		// 			}
		// 		);

		// 	}
		// }


	});

});