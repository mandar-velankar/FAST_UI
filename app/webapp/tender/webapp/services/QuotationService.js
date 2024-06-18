sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services,Filter,FilterOperator) {
	"use strict";

	var QuotationService = BaseService.extend("FAST_NS0FAST0.services.QuotationService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		createQuotation: function (oQuotationToSave) {

			//path of offer that is selected
			var sPath = "/PT_TMQUTO";

			//Create
			return this.odata(sPath).post(oQuotationToSave);
		},

		//update existing quotation
		updateQuotation: function (oQuotationToSave) {

			//create path
			var sPath = Services.getDefaultModel().createKey("/PT_TMQUTO", {
				OfferID: oQuotationToSave.OfferID,
				Active: oQuotationToSave.Active,
				OfferDate: oQuotationToSave.OfferDate
			});

			//Update
			return this.odata(sPath).put(oQuotationToSave);

		},
		
		getConvertQuotationToSave: function (oQuotationSaveInfo) {

			//Convert odata to structure that can be used to save
			var oQuotationToSave = oQuotationSaveInfo;
			oQuotationToSave.OfferDate = moment.utc(oQuotationSaveInfo.OfferDate).toDate(); 
			//oQuotationToSave.OfferValidity = moment.utc(oQuotationSaveInfo.OfferValidity).toDate(); 
			oQuotationToSave.SubmittedOn = moment.utc(oQuotationSaveInfo.SubmittedOn).toDate(); 
			return oQuotationToSave;
		
		},

		getWordTemplates:function(countryCode){
			///v2/tender/WordTemplateCountry?$expand=WordTemplates&$filter=countryCode%20eq%20%27IT%27
			return this.odata("/WordTemplateCountry").get({urlParameters:{"$expand":"WordTemplates"},filters:[new Filter({path:"countryCode",operator:FilterOperator.EQ,value1:countryCode})]});
		},
		getTHQuotationDelevery: function (offerID) {
			return this.odata("/THQuotationDelevery").get({filters:[new Filter({path:"OfferID",operator:FilterOperator.EQ,value1:offerID})]})
		},
		updateTHQuotationDelevery: function (item) {
			const sPath = Services.getDefaultModel().createKey("/THQuotationDelevery", {
				ID: item.ID,
			});
			return this.odata(sPath).put(item)
		},
		createTHQuotationDelevery: function (item) {
			return this.odata("/THQuotationDelevery").post(item)
		},
		removeTHQuotationDelevery: function (item) {
			const sPath = Services.getDefaultModel().createKey("/THQuotationDelevery", {
				ID: item.ID,
			});
			return this.odata(sPath).delete()
			
		}
	});
	return QuotationService;
});