sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (CoreService, Sorter, Filter, FilterOperator) {
	"use strict";

	var CatService = CoreService.extend("com.bayer.tender.contracts.service.CatService", {

		constructor: function (model) {
			CoreService.call(this, model);
        },
        
		getGroup: function (id) {
			var sKey = this.model.createKey("/Countries", {
				CountryCode: id
			});
			return this.odata(sKey).get({
				// urlParameters: {
				// 	$expand: "expand with associations"
				// }
			});
		},

		/**
		 * Retrieves a TenderContracts by ContractNumber from the backend
		 * INSTITUTE_ID eq 100163 and DISTRIBUTOR_ID eq 3147458 and CHANNEL eq 'Distributor' and LEGAL_ENTITY_CODE eq 'BLC'
		 */
		getInstituteDistributorBrandProducts: function (sCountryCode, iInstitudeId, iDistributorId, sSellingCompanyCode) {

			var oCountryCodeFilter = new Filter({
				path: 'COUNTRY_CODE',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var oInstitudeFilter = new Filter({
				path: 'INSTITUTE_ID',
				operator: FilterOperator.EQ,
				value1: iInstitudeId
			});

			var oDistributorFilter = new Filter({
				path: 'DISTRIBUTOR_ID',
				operator: FilterOperator.EQ,
				value1: iDistributorId
			});

			var oChannelFilter = new Filter({
				path: 'CHANNEL',
				operator: FilterOperator.EQ,
				value1: "Distributor"
			});

			var oSellingCompanyCodeFilter = new Filter({
				path: 'CHANNEL',
				operator: FilterOperator.EQ,
				value1: sSellingCompanyCode
			});
			

			var mParameters = {
				filters: [oCountryCodeFilter, oInstitudeFilter, oDistributorFilter, oChannelFilter, oSellingCompanyCodeFilter]
			};

			return this.odata("/InstituteDistributorBrandProduct").get(mParameters);
		},

		getCountryRegisteredPrice: function (sCountryCode, iProductId, sCurrency) {
			
			var sKey = this.model.createKey("/CountryRegisteredPrice", {
				COUNTRY_CODE: sCountryCode,
				PRODUCT_ID: iProductId,
				CURRENCY: sCurrency
			});


			return this.odata(sKey).get();
		},


    });
    
	return CatService;
});