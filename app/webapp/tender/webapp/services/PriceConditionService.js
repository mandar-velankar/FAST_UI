sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, MomentJS, UserInfo, Filter, FilterOperator) {
	"use strict";

	return BaseService.extend("FAST_NS0FAST0.services.PriceConditionService", {

		constructor: function (model) {
			BaseService.call(this, model);
		},
		

        getPriceCondition: function(filter){
            
			let aFilters = [];

			aFilters.push(new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: filter.CountryCode
			}));

			aFilters.push(new Filter({
				path: 'OfferID',
				operator: FilterOperator.EQ,
				value1: filter.OfferID
			}));

            aFilters.push(new Filter({
				path: 'ProductCode',
				operator: FilterOperator.EQ,
				value1: filter.ProductCode
			}));

            

			var mParameters = {
				filters: aFilters,
				urlParameters: {
					$expand: "DiscountCondition,PricingConditionClassification"
				}
			};


			return this.odata("/PriceCondition").get(mParameters);
		},

		createPriceCondition: function (oPriceCondition) {
			return this.odata("/PriceCondition").post(oPriceCondition);
		},

		updatePriceCondition: function (oPriceCondition) {
			const oModel = Services.getDefaultModel();
			const sPath = oModel.createKey("/PriceCondition", {
				ID: oPriceCondition.ID
			});

			return this.odata(sPath).put(oPriceCondition);
		},


        getPricingConditionClassification: function(filter){
            
			let aFilters = [];

			aFilters.push(new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: filter.CountryCode
			}));

			aFilters.push(new Filter({
				path: 'Classification',
				operator: FilterOperator.EQ,
				value1: filter.Classification
			}));

            aFilters.push(new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: filter.Division
			}));

            aFilters.push(new Filter({
				path: 'isMain',
				operator: FilterOperator.EQ,
				value1: filter.isMain
			}));

            

			var mParameters = {
				filters: aFilters
			};


			return this.odata("/PricingConditionClassification").get(mParameters);
		},
		
	});
});