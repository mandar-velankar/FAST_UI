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


		getInstituteDistributorBrandProducts: function (sCountryCode, aInstitutes, iDistributorId, sSellingCompanyCode) {

			var oCountryCodeFilter = new Filter({
				path: 'COUNTRY_CODE',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var aInstituteFilters = aInstitutes.map(inst => {

				return new Filter({
					path: 'INSTITUTE_ID',
					operator: FilterOperator.EQ,
					value1: inst.instituteID
				});

			}); 

			var oInstituteFilter = new Filter({
				filters: aInstituteFilters,
				and: false
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

			// var oSellingCompanyCodeFilter = new Filter({
			// 	path: 'CHANNEL',
			// 	operator: FilterOperator.EQ,
			// 	value1: sSellingCompanyCode
			// });
			

			var mParameters = {
				filters: [oCountryCodeFilter, oInstituteFilter, oDistributorFilter, oChannelFilter ]
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

		getCountryTenderBrands: function (sCountryCode) {
			
			var aFilters = [];

			if(sCountryCode){

				var oCountryCodeFilter = new Filter({
					path: 'COUNTRYCODE',
					operator: FilterOperator.EQ,
					value1: sCountryCode
				});

				aFilters.push(oCountryCodeFilter);
			}

			
			var mParameters = {
				filters: aFilters
			};

			return this.odata("/CountryTenderBrands").get(mParameters);
		},

        getAppConfig: function (sCountryCode, sEnvironment) {
			
			var aFilters = [];

			if(sCountryCode){

				var oCountryCodeFilter = new Filter({
					path: 'CountryCode',
					operator: FilterOperator.EQ,
					value1: sCountryCode
				});

				aFilters.push(oCountryCodeFilter);
			}

            if(sEnvironment){

				var oEnvironmentFilter = new Filter({
					path: 'Environment',
					operator: FilterOperator.EQ,
					value1: sEnvironment
				});

				aFilters.push(oEnvironmentFilter);
			}

            aFilters.push(new Filter({
                path: 'ApplicationName',
                operator: FilterOperator.EQ,
                value1: "Contract"}));
			
			var mParameters = {
				filters: aFilters
			};

			return this.odata("/AppConfig").get(mParameters);
		},

    });
    
	return CatService;
});