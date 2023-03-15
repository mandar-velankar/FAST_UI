sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, MomentJS, UserInfo, Filter, FilterOperator) {
	"use strict";

	var BrazilContractService = BaseService.extend("FAST_NS0FAST0.services.BrazilContractService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},

		getContracts: function(filter){
            
			let aFilters = [];

			/*if(filter.notExpiringBeforeDate){
                aFilters.push(new Filter({
                    path: 'ExpiryDate',
                    operator: FilterOperator.GE,
                    value1: filter.notExpiringBeforeDate
                }));
            }*/
			
			if(filter.TenderID){
                aFilters.push(new Filter({
                    path: 'TenderID',
                    operator: FilterOperator.EQ,
                    value1: filter.TenderID
                }));
            }

			if(filter.OfferID){
                aFilters.push(new Filter({
                    path: 'OfferID',
                    operator: FilterOperator.EQ,
                    value1: filter.OfferID
                }));
            }

			if(filter.ID){
				aFilters.push(new Filter({
					path: 'ID',
					operator: FilterOperator.EQ,
					value1: filter.ID
				}))
			}

			var mParameters = {
				filters: aFilters
			};

			return this.odata("/Contracts").get(mParameters);
		},
		
	});
	return BrazilContractService;
});