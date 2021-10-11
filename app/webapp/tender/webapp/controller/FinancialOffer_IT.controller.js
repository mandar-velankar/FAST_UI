sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min"
], function (Controller, formatter, Services, UserInfo, MomentJS) {
	"use strict";

	return Controller.extend("FAST_NS0FAST0.controller.FinancialOffer_IT", {

		//Formatting functions
		formatter: formatter,

		onInit: function (oEvent) {

			//get resource bundle for translations or texts
			this._oOwnerComponent = this.getOwnerComponent();
			this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			//keep router and model locally in this controller
			this._oRouter = this._oOwnerComponent.getRouter();
			this._oModel = this._oOwnerComponent.getModel();
			
			this._DetailView = sap.ui.getCore().byId(this.getView().getId().split("---")[0]+"---tenderManagementDetailId");
			this._DetailController = this._DetailView.getController();

			Services.setRouterObject(this._oRouter);

			//attach the onTenderMatched method to handle routing between pages + load correct data
			this._oRouter.getRoute("master").attachPatternMatched(this._onTenderMatched, this);
			this._oRouter.getRoute("detail").attachPatternMatched(this._onTenderMatched, this);


		},

		//Navigation between TenderMaster & Detail pages routing is matched
		_onTenderMatched: async function (oEvent) {

			// this method should only be called in case of Italy
			 var sTab = oEvent.getParameter("arguments").tab || "";
			 if(sTab && sTab.includes("financialOfferId_IT")){

				//load products
				let aProducts = await this.getFinancialProducts(Services.getSelectedOfferID());

				//set to fastappdata model for easy access on the view
				var oFastAppDataModel = Services.getFastAppDataModel();
				oFastAppDataModel.setProperty("/OfferProductsItaly", aProducts);
			 }
			// let that = this;

			// // check if we are on the delivery tab, otherwise don't run the code after the if statement
			// if (sTab !== Services.getDeliveryTrackingPageSectionID()) {
			// 	return;
			// }

			
			// //get the tenderID/country from the navigation parameters
			// var sTenderID = oEvent.getParameter("arguments").tender;
			// var sCountry = oEvent.getParameter("arguments").country || "NA"; // if country is found in the link.. use NA
			// var sOfferID = oEvent.getParameter("arguments").offer;
			
			// //build tender path
			// var sTenderPath = "";
			// if (sTenderID) {
			// 	//example: PT_TMTEND(TenderID='SA-100-TEST-AH',Active=1)
			// 	sTenderPath = "/PT_TMTEND('" + sTenderID + "')";
			// } else {
			// 	sTenderPath = "/PT_TMTEND";
			// }
			
			// //keep selected tender + tender path & countrycode
			// Services.setSelectedTenderPath(sTenderPath);
			// Services.setSelectedTenderID(sTenderID);
			// Services.setSelectedCountry(sCountry);
			// Services.setSelectedOfferID(sOfferID);

		},

		/* GETTERS */
		/**
		 * Fetches a list of Tender products from the backend
		 * @param {String} offerID, 
		 * @returns {Array} - A list of Tender products
		 */
		 getFinancialProducts: async function(offerID) { 
			if(offerID){
				const response = await Services.getFinancialProducts(offerID);
				return response.data.results;
			}
		},

		/**
		 * Event handler for the OfferProductsItaly
		 * @param {Object} event - An instance of event object
		 */
		onDetailPress: function(oEvent){

			const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
			this.byId("idFinPricingOfferSubsection").setBindingContext(bindingContext, "fastAppData");
		},

		onSaveFinancialOfferItaly: function(oEvent){
			var oFastAppDataModel = Services.getFastAppDataModel();
		}

	});
});