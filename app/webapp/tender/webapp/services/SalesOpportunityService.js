sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, Filter, FilterOperator) {
	"use strict";

	var SalesOpportunityService = BaseService.extend("FAST_NS0FAST0.services.SalesOpportunityService", {

		constructor: function (model) {
			BaseService.call(this, model);
		},

		/**
		 * Fetches opportunities from the backend.
		 * @param {string} sCodigoExterno - unique code for salesopportunity
		 * @returns {promise} - a list of opportunities
		 */
		getOpportunity: function (sCodigoExterno) {
					
			var aFilters = [];

			if(sCodigoExterno){

				var oCodigoExternoFilter = new Filter({
					path: 'CodigoExterno',
					operator: FilterOperator.EQ,
					value1: sCodigoExterno
				});

				aFilters.push(oCodigoExternoFilter);
			}

			
			var mParameters = {
				filters: aFilters,
				urlParameters: {
					"$expand": "Comprador,Items"
				}
			};

			return this.odata("/PublicMarketTenders").get(mParameters);
		}
	
	});
	
	return SalesOpportunityService;
});