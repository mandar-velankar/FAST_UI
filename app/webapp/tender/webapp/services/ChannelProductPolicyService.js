
sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, UserInfo, MomentJS, Filter, FilterOperator) {
	"use strict";

	var ChannelProductPolicyService = BaseService.extend("FAST_NS0FAST0.services.ChannelProductPolicyService", {
        
		constructor: function (model) {
			BaseService.call(this, model);
		},

        /**
         * Get Channel Product Policy
         * @param {String} sCountryCode Country Code
         * @param {String} sChannelName Channel Name 
         * @param {String} sProductPackID Product Pack
         * @returns {Object} ChannelProductPolicy
         */
		getChannelProductPolicy: function (sCountryCode,sChannelName,sProductPackID) {

                var sPath = "/ChannelProductPolicies";
    
                var aFilters = [];

                //Add CountryCode
                if(sCountryCode){
                    aFilters.push(new Filter({
                        path: 'CountryCode',
                        operator: FilterOperator.EQ,
                        value1: sCountryCode
                    }));
                }

                //Add ChannelName
                if(sChannelName){
                    aFilters.push(new Filter({
                        path: 'ChannelName',
                        operator: FilterOperator.EQ,
                        value1: sChannelName
                    }));
                }

                //Add ProductPackId
                 if(sProductPackID){
                    aFilters.push(new Filter({
                        path: 'ProductPackID',
                        operator: FilterOperator.EQ,
                        value1: sProductPackID
                    }));
                }
    
                var mParameters = {
                    filters: aFilters
                };
    
                return this.odata(sPath).get(mParameters);

        }

	});

	return ChannelProductPolicyService;

});