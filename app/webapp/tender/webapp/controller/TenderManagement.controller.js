sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"FAST_NS0FAST0/model/services"
], function (JSONModel, Controller, MessageToast, Filter, FilterOperator, Services) {
	"use strict";

	return Controller.extend("FAST_NS0FAST0.controller.TenderManagement", {
		
		//Tender management view is there to have the flexible layout
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			this.oModel = this.oOwnerComponent.getModel();
		},
		
		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name"),
				oArguments = oEvent.getParameter("arguments"),
				that = this;

			this._updateUIElements();
			
			// Save the current route name
			this.currentRouteName = sRouteName;
			this.currentTender = oArguments.tender;
			this.currentInstitute = oArguments.institute;

			//get the tenderID/country from the navigation parameters
			var sTenderID = oEvent.getParameter("arguments").tender;
			var sCountry = oEvent.getParameter("arguments").country || "NA"; // if country is found in the link.. use NA
			var sOfferID = oEvent.getParameter("arguments").offer;
			var sTab =  oEvent.getParameter("arguments").tab || Services.getBasicInformationPageSectionID();
			var sLayout = oEvent.getParameter("arguments").layout;
/*			
			//check if we need to navigate straight to different layout, page
			if(sLayout !== "OneColumn"){
				this.oRouter.navTo("detail", {
					layout: sLayout,
					tender: sTenderID,
					offer: sOfferID,
					tab: sTab,
					country: sCountry
				});
			}
*/
			
			
			
			//if tender is selected, filter only offers visible for selected tender
			if(sTenderID && sLayout !== "OneColumn"){
				
				//refresh tenders master table (left pane)
				Services.refreshTendersMasterTable(sTenderID);
				
			}
			
		},

		onStateChanged: function (oEvent) {
			var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
				sLayout = oEvent.getParameter("layout");

			this._updateUIElements();

			// Replace the URL with the new layout if a navigation arrow was used
			if (bIsNavigationArrow) {
				this.oRouter.navTo(this.currentRouteName, {layout: sLayout, tender: this.currentTender, institute: this.currentInstitute}, true);
			}
		},

		// Update the close/fullscreen buttons visibility
		_updateUIElements: function () {
			var oModel = this.oOwnerComponent.getModel(),
				oUIState;
			this.oOwnerComponent.getHelper().then(function(oHelper) {
				oUIState = oHelper.getCurrentUIState();
				oModel.setData(oUIState);
			});
		},

		onExit: function () {
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
		}//,
		
		// handlePressConfiguration: function(oEvent) {
		// 	this.oRouter.navTo("launch");
		// },

		// handleLogoffPress: function(oEvent) {
		// 	MessageToast.show("Logoff Button Pressed");
		// },

		// handleUserItemPressed: function(oEvent) {
		// 	MessageToast.show("User Button Pressed");
		// },

		// handleSearchItemSelect: function(oEvent) {
		// 	MessageToast.show("Search Entry Selected: " + oEvent.getSource().getTitle());
		// },

		// handleShellOverlayClosed: function() {
		// 	MessageToast.show("Overlay closed");
		// },

		// handleSearchPressed: function(oEvent) {
		// 	var sQuery = oEvent.getParameter("query");
		// 	if (sQuery === "") {
		// 		return;
		// 	}

		// 	// create Overlay only once
		// 	if (!this._overlay) {
		// 		this._overlay = sap.ui.xmlfragment(
		// 			"sap.ui.unified.sample.ShellBasic.ShellOverlay",
		// 			this
		// 		);
		// 		this.getView().addDependent(this._overlay);
		// 	}

		// 	// mock data
		// 	var aResultData = [];
		// 	for (var i = 0; i < 10; i++) {
		// 		aResultData.push({
		// 							title:(i + 1) + ". " + sQuery,
		// 							text:"Lorem ipsum sit dolem"
		// 						});
		// 	}
		// 	var oData = {
		// 					searchFieldContent: sQuery,
		// 					resultData: aResultData
		// 				};
		// 	var oModel = new JSONModel();
		// 	oModel.setData(oData);
		// 	this._overlay.setModel(oModel);

		// 	// set reference to shell and open overlay
		// 	this._overlay.setShell(this.byId("myShell"));
		// 	this._overlay.open();
		// }
	});
});
