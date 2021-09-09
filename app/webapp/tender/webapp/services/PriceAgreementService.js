sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo"
], function (BaseService, Services, MomentJS, UserInfo) {
	"use strict";

	var PriceAgreementService = BaseService.extend("FAST_NS0FAST0.services.PriceAgreementService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create new delivery
		createPriceAgreement: function (oPriceAgreement) {

			//path of offer that is selected
			var sPath = "/PriceAgreements";

			//Create
			return this.odata(sPath).post(oPriceAgreement);

		},

		//create new delivery
		updatePriceAgreement: function (oPriceAgreement) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/PriceAgreements", {
				ID: oPriceAgreement.ID
			});

			//Create
			return this.odata(sPath).put(oPriceAgreement);

		},
		
	});
	return PriceAgreementService;
});