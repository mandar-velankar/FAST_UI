
sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, UserInfo, MomentJS, Filter, FilterOperator) {
	"use strict";

	var DistributorBrandPolicyService = BaseService.extend("FAST_NS0FAST0.services.DistributorBrandPolicyService", {
        
		constructor: function (model) {
			BaseService.call(this, model);
		},

        /**
         * Get Aggregated Distributor Brand Policy
         * @param {String} sDistributorID Distributor id for who we get the policy
         * @param {String} sBrandID Brand id for who we get the policy 
         * @returns {Object} Country 
         */
		getAggregatedDistributorBrandPolicy: function (sDistributorID,sBrandID) {

                var sPath = "/AggregatedDistributorBrandPolicies";
    
                var aFilters = [];

                //Add Brand
                if(sBrandID){
                    aFilters.push(new Filter({
                        path: 'BrandId',
                        operator: FilterOperator.EQ,
                        value1: sBrandID
                    }));
                }


                //Add Distributor
                if(sDistributorID){
                    aFilters.push(new Filter({
                        path: 'DistributorId',
                        operator: FilterOperator.EQ,
                        value1: sDistributorID
                    }));
                }

    
                var mParameters = {
                    filters: aFilters
                };
    
                return this.odata(sPath).get(mParameters);

        }

	});

	return DistributorBrandPolicyService;

});