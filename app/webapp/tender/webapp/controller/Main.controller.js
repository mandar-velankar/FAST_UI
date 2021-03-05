sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"FAST_NS0FAST0/model/services"
], function(JSONModel, Controller, Services) {
	"use strict";

	return Controller.extend("FAST_NS0FAST0.controller.Main", {
		onInit: function() {
			//store the component in this controller
			this.oOwnerComponent = this.getOwnerComponent();
			
			//attach method to on route match
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRoutePatternMatched(this.fnHandleRoutePatternMatched, this);
		},
		
		//on route match
		fnHandleRoutePatternMatched: function(oEvent) {
			var oParameters = oEvent.getParameters();
			if (oParameters.name !== "launch") {
				//following code should only be performed when tiles are to be shown (main.view is called) 
				return;
			}
			
			//build image model to show images on the view (binding the source)
			var oRootPath = jQuery.sap.getModulePath("FAST_NS0FAST0.images");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: oRootPath,
			});
			this.getView().setModel(oImageModel, "imageModel");

		},

		//Tile tender management
		onTileTenderManagementPress: function(evt) {
			
			var that = this;
			
			// instantiate loading dialog
			var oLoadingTenderMasterDialog = Services.getLoadingTenderMasterDialog();
			
			//check loading
			if (oLoadingTenderMasterDialog) {
				oLoadingTenderMasterDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
				Services.setLoadingTenderMasterDialog(oLoadingTenderMasterDialog);
			}
		
			// open loading dialog
			oLoadingTenderMasterDialog.open();
					
			//TenderManagement screen
			this.getOwnerComponent().getRouter().navTo("master", {
				country: "NA",
				layout: "OneColumn"
			});
			
		},
		
		//Tile tender manager press
		onTileTenderManagerDashPress: function(oEvent) {
			window.open("https://emea.tableau.intranet.cnb/#/site/FASTTM/views/TenderManagerDashboard/OfferSubmissions?:iid=2"); //check where to store constants
		},

		//Tile Caliber Connect press
		onTileCaliberConnectPress: function (oEvent) {
			window.open("https://emea.tableau.intranet.cnb/#/site/BME/views/TenderSalesReport/TenderSales?:iid=1"); //check where to store constants
		},

		//tile transactional dash press
		onTileTransDashPress: function(oEvent) {
			//window.open("https://emea.tableau.intranet.cnb/#/site/FASTTM/views/TenderManagementDashboardv1_1_20191024/Submissions"); //check where to store constants
			window.open("https://emea.tableau.intranet.cnb/#/site/FASTTM/views/TenderManagementDashboardPROD/Submissions");
			
		},
		
		onTileUserManagementPress: function(oEvent){
			window.open("https://emea.tableau.intranet.cnb/#/site/FASTTM/views/TenderManagerDashboardv1_1_20181127/OfferSubmissions?:iid=4"); //check where to store constants
		},


	});
});