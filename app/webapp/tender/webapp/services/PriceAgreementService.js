sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, MomentJS, UserInfo, Filter, FilterOperator) {
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

		getPriceAgreements: function(filter){
            
			let aFilters = [];

			if(filter.CountryCode){
                aFilters.push(new Filter({
					path: 'CountryCode',
					operator: FilterOperator.EQ,
					value1: filter.CountryCode
				}));
            }

            if(filter.ProductCode){
                aFilters.push(new Filter({
                    path: 'ProductPackId',
                    operator: FilterOperator.EQ,
                    value1: filter.ProductCode
                }));
            }
            
            if(filter.TenderClassification){
                aFilters.push(new Filter({
                    path: 'Tender/Classification',
                    operator: FilterOperator.EQ,
                    value1: filter.TenderClassification
                }));
            }

			if(filter.notExpiringBeforeDate){
                aFilters.push(new Filter({
                    path: 'ExpiryDate',
                    operator: FilterOperator.GE,
                    value1: filter.notExpiringBeforeDate
                }));
            }
			
			if(filter.notEqualTenderId){
                aFilters.push(new Filter({
                    path: 'TenderId',
                    operator: FilterOperator.NE,
                    value1: filter.notEqualTenderId
                }));
            }

			var mParameters = {
				filters: aFilters,
				urlParameters: {
					$expand: "Candidates,PriceConditions/PriceConditionClassification"
				}
			};


			return this.odata("/PriceAgreements").get(mParameters);
		},
		
	});
	return PriceAgreementService;
});