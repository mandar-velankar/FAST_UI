sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, MomentJS, UserInfo, Filter, FilterOperator) {
	"use strict";

	return BaseService.extend("FAST_NS0FAST0.services.TenderHistoryService", {

		constructor: function (model) {
			BaseService.call(this, model);
		},

        getTenderHistoryItaly: function(filter){

			let andFilters = [];
            let orFilters = [];

            if(filter.InstituteId){
                andFilters.push(new Filter({
                    path: 'INSTITUTE_ID',
                    operator: FilterOperator.EQ,
                    value1: filter.InstituteId
                }));
            }

            if(Array.isArray(filter.Outcome) && filter.Outcome.length){
                filter.Outcome.forEach(element => {
                    orFilters.push(new Filter({
                    path: 'OUTCOME',
                    operator: FilterOperator.EQ,
                    value1: element
                    }));
                });   
                andFilters.push(new sap.ui.model.Filter(orFilters, false));
            }
            			
            if(filter.ProductId){
                andFilters.push(new Filter({
                    path: 'PRODUCT_ID',
                    operator: FilterOperator.EQ,
                    value1: filter.ProductId
                }));
            }

            if(filter.CountryCode){
                andFilters.push(new Filter({
                    path: 'COUNTRY_CODE',
                    operator: FilterOperator.EQ,
                    value1: filter.CountryCode
                }));
            }

			var mParameters = {
				filters: andFilters
			};

            return this.odata("/TenderHistory").get(mParameters);
		},


	});
});