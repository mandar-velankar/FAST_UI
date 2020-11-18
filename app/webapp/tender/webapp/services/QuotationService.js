sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services"
], function (BaseService, Services) {
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
		
		}
	});
	return QuotationService;
});