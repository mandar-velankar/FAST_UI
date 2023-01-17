sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, Filter, FilterOperator) {
	"use strict";

	var ResultService = BaseService.extend("FAST_NS0FAST0.services.ResultService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create new result
		createResult: function (oResultToSave) {

			//path of offer that is selected
			var sPath = "/PT_TMTRRES";

			//Create
			return this.odata(sPath).post(oResultToSave);

		},

		//update existing result
		updateResult: function (oResultToSave) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of price
			var sPath = oModel.createKey("/PT_TMTRRES", {
				OfferID: oResultToSave.OfferID,
				ProductCode: oResultToSave.ProductCode,
				LotID: oResultToSave.LotID,
			});

			//oResultToSave.AwardedPrice = parseFloat(oResultToSave.AwardedPrice);

			//Create
			return this.odata(sPath).put(oResultToSave);

		},

		getBrazilContractStatuses: function () {
			return this.odata("/ContractStatuses").get();
		},

		createBrazilContract: function (contract) {
			return this.odata("/Contracts").post(contract);
		},

		createBrazilContractProduct: function (product) {
			return this.odata("/ContractProducts").post(product);
		}
	});
	return ResultService;
});