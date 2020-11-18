sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.bayer.tender.landingspage.controller.Landingpage", {
		onInit: function () {
			//store the component in this controller
			this.oOwnerComponent = this.getOwnerComponent();

			//attach method to on route match
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRoutePatternMatched(this.fnHandleRoutePatternMatched, this);
		},

		//on route match
		fnHandleRoutePatternMatched: function (oEvent) {
			var oParameters = oEvent.getParameters();
			// if (oParameters.name !== "launch") {
			// 	//following code should only be performed when tiles are to be shown (main.view is called) 
			// 	return;
			// }

			//build image model to show images on the view (binding the source)
			var oRootPath = jQuery.sap.getModulePath("com.bayer.tender.landingspage.images");
			var oImageModel = new JSONModel({
				path: oRootPath,
			});
			this.getView().setModel(oImageModel, "imageModel");
			
			var oTileModel = new JSONModel({
				tender: false,
				epa:false,
				contract:false
			});
			this.getView().setModel(oTileModel, "tiles");

			this.getView().getModel("fastData").metadataLoaded(true).then(function(){
				oTileModel.setProperty("/tender",true);
			});
			this.getView().getModel("epaData").metadataLoaded(true).then(function(){
				oTileModel.setProperty("/epa",true);
			});
			this.getView().getModel("contractData").metadataLoaded(true).then(function(){
				oTileModel.setProperty("/contract",true);
			});
		},

		//Tile tender management
		onTileTenderManagementPress: function (evt) {

			var that = this;

			// // instantiate loading dialog
			// var oLoadingTenderMasterDialog = Services.getLoadingTenderMasterDialog();

			// //check loading
			// if (oLoadingTenderMasterDialog) {
			// 	oLoadingTenderMasterDialog = sap.ui.xmlfragment("com.bayer.tender.landingspage.fragments.Loading", that);
			// 	Services.setLoadingTenderMasterDialog(oLoadingTenderMasterDialog);
			// }

			// // open loading dialog
			// oLoadingTenderMasterDialog.open();

			//TenderManagement screen
			// this.getOwnerComponent().getRouter().navTo("master", {
			// 	layout: "OneColumn"
			// });
			this.getOwnerComponent()
				.getRouter()
				// .navTo("tender");
				.navTo("tender", {}, {tender:{
					route: "master", parameters: {
						layout: "OneColumn"
					}
				}});

		},
		onTileEpaManagementPress: function (event) {

			this.getOwnerComponent()
				.getRouter()
				.navTo("epa");
		},

		onTileContractManagementPress: function (event) {

			this.getOwnerComponent()
				.getRouter()
				.navTo("contract");
		},
		//Tile tender manager press
		onTileTenderManagerDashPress: function (oEvent) {
			window.open("https://emea.tableau.intranet.cnb/#/site/FASTTM/views/TenderManagerDashboard/OfferSubmissions?:iid=2"); //check where to store constants
		},

		//tile transactional dash press
		onTileTransDashPress: function (oEvent) {
			//window.open("https://emea.tableau.intranet.cnb/#/site/FASTTM/views/TenderManagementDashboardv1_1_20191024/Submissions"); //check where to store constants
			window.open("https://emea.tableau.intranet.cnb/#/site/FASTTM/views/TenderManagementDashboardPROD/Submissions");

		},

		onTileUserManagementPress: function (oEvent) {
			window.open("https://emea.tableau.intranet.cnb/#/site/FASTTM/views/TenderManagerDashboardv1_1_20181127/OfferSubmissions?:iid=4"); //check where to store constants
		}
	});
});