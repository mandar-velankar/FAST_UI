sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (CoreService, Sorter, Filter, FilterOperator) {
	"use strict";

	var SoaService = CoreService.extend("com.bayer.tender.salesopportunity.service.SoaService", {

		constructor: function (model) {
			CoreService.call(this, model);
        },

		/**
		 * Fetches opportunities from the backend.
		 * @param {string} sPublicationDate - 
		 * @returns {promise} - a list of opportunities
		 */
		getOpportunities: function (sPublicationDate) {
			
			var aFilters = [];

			if(sPublicationDate){

				var oPublicationDateFilter = new Filter({
					path: 'PublicationDate',
					operator: FilterOperator.EQ,
					value1: sPublicationDate
				});

				aFilters.push(oPublicationDateFilter);
			}

			
			var mParameters = {
				filters: aFilters,
				urlParameters: {
					"$expand": "Comprador,Items"
				}
			};

			return this.odata("/PublicMarketTenders").get(mParameters);
		},

		saveOpportunity: function(opportunity){

			const data = opportunity.getAll();

			return this.odata("/PublicMarketTenders").put(data);

		},

		/* get a new Tender ID */
		getNewTenderID: function(){
			//get selected country
			var sCountry = 'CL';

			const sKey = this.model.createKey("/CountryTenderNo", {
				COUNTRY_CODE: sCountry
			});

			return this.odata(sKey).get();
		},


    });
    
	return SoaService;
});