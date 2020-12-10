sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (CoreService, Sorter, Filter, FilterOperator) {
	"use strict";

	var PpaService = CoreService.extend("com.bayer.tender.ppa.service.PpaService", {

		/**
		 * Constructor
		 * @param {*} model 
		 */
		constructor: function (model) {
			CoreService.call(this, model);
		},

		/**
		 * Get a specific Brand
		 * @param {*} sCountryCode 
		 * @param {*} sBrandId 
		 * @param {*} sDivision 
		 */
		getBrand: function (sCountryCode, iBrandId, sDivision) {

			//Path to read
			var sPath = "/Brands";

			//FILTER COUNTRY CODE
			var oCountryFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			//FILTER BRANDID
			var oBrandFilter = new Filter({
				path: 'BrandId',
				operator: FilterOperator.EQ,
				value1: iBrandId
			});

			//FILTER DIVISION
			var oDivisionFilter = new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: sDivision
			});

			//Parameters
			var mParameters = {
				filters: [oCountryFilter, oBrandFilter, oDivisionFilter]
			};

			//call back-end
			return this.odata(sPath).get(mParameters);

		},

		/**
		 * Get products of brand
		 * @param {*} sCountryCode 
		 * @param {*} sBrandId 
		 * @param {*} sDivision 
		 */
		getProducts: function (sCountryCode, iBrandId, sDivision) {

			//Path to read
			var sPath = "/Products";

			//FILTER COUNTRY CODE
			var oCountryFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			//FILTER BRANDID
			var oBrandFilter = new Filter({
				path: 'BrandId',
				operator: FilterOperator.EQ,
				value1: iBrandId
			});

			//FILTER DIVISION
			var oDivisionFilter = new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: sDivision
			});

			//Parameters
			var mParameters = {
				filters: [oCountryFilter, oBrandFilter, oDivisionFilter]
			};

			//call back-end
			return this.odata(sPath).get(mParameters);

		},

		/**
		 * Get policy per product
		 * @param {*} sProductPolicyId 
		 */
		getProductPolicy: function(sProductPolicyId){
			var sPath = "/Policies";
			
			var sKey = this.model.createKey(sPath, {
				ID: sProductPolicyId,
			});

			var mParameters = {
				urlParameters: {
					"$expand": "PolicyPrices/Channel"
				}
			};

			return this.odata(sKey).get(mParameters);
		},

		/**
		 * Retrieves a list of latest pricing approval requests from the backend
		 */
		getApprovals: function (sCountryCode, sBrandId, sDivision) {

			var aFilters = [];
		
			var oCountryCodeFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var oBrandId = new Filter({
				path: 'BrandId',
				operator: FilterOperator.EQ,
				value1: sBrandId
			});

			var oDivision = new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: sDivision
			});

			aFilters.push(oCountryCodeFilter);
			aFilters.push(oBrandId);
			aFilters.push(oDivision);

			var mParameters = {
				filters: aFilters,
				urlParameters: {
					"$expand": "CountryApprover"
				}
			};

			return this.odata("/Approvals").get(mParameters);
		},

		getCountryApprovers: function (sCountryCode, sDivision){

			var sPath = '/CountryApprovers';
			var aFilters = [];
		
			var oCountryCodeFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var oDivision = new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: sDivision
			});

			//Parameters
			var mParameters = {
				filters: [oCountryCodeFilter, oDivision]
			};

			//call back-end
			return this.odata(sPath).get(mParameters);
		},

		getApproverTypes: function (sCountryCode){

			var sPath = '/ApproverTypes';
			var aFilters = [];
		
			var oCountryCodeFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			aFilters.push(oCountryCodeFilter);

			//Parameters
			var mParameters = {
				filters: aFilters,
				urlParameters: {
					"$expand": "CountryApprovers"
				}
			};

			//call back-end
			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Retrieves a list of countries for the logged on user
		 */
		getUserCountries: function(){
			var sPath = "/UserCountry";
			var mParameters = {
				urlParameters: {
					"$expand": "Country"
				}
			};
			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Retrieves a list of divisions
		 */
		getDivisions: function(){
			var sPath = "/Divisions";
			return this.odata(sPath).get();
		},

		
		/**
		 * Retrieves a list of channels
		 */
		getChannels: function(sCountryCode){

			var sPath = "/Channels";

			var aFilters = [];
		
			var oCountryCodeFilter = new Filter({
				path: 'ChannelCountry',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			aFilters.push(oCountryCodeFilter);

			//Parameters
			var mParameters = {
				filters: aFilters
			};

			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Creates an approval request entry in the backend
		 */
		createApprovalRequest: function (oApprovalRequest) {

			let data = oApprovalRequest.getJSON();

			// remove the "ID" from the request as this is automatically generated by the framework
			delete data["ID"];

			return this.odata("/Approvals").post(data);
		},

		/**
		 * Updates an approval request entry in the backend
		 */
		updateApprovalRequest: function (oApprovalRequest) {

			const sKey = this.model.createKey("/Approvals", {
				ID: oApprovalRequest.iD
			});

			let data = oApprovalRequest.getJSON();

			return this.odata(sKey).put(data);
		},

		/**
		 * Creates a Policy
		 */
		createPolicy: function (oPolicy) {

			let data = oPolicy.getExpandedJSON();
			return this.odata("/Policies").post(data);
			
		},

		/**
		 * Updates a Policy
		 */
		updatePolicy: function (oPolicy) {

			const sKey = this.model.createKey("/Policies", {
				ID: oPolicy.iD
			});

			let data = oPolicy.getExpandedJSON();

			return this.odata(sKey).put(data);
		},

		/** 
     * Get BrandPolicy 
		 * @param {*} sCountryCode 
		 * @param {*} sBrandId 
		 * @param {*} sDivision 
		 */
		getBrandPolicy: function(sCountryCode, iBrandId, sDivision){
			//Path to read
			var sPath = "/BrandPolicies";

			//FILTER COUNTRY CODE
			var oCountryFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			//FILTER BRANDID
			var oBrandFilter = new Filter({
				path: 'BrandId',
				operator: FilterOperator.EQ,
				value1: iBrandId
			});

			//FILTER DIVISION
			var oDivisionFilter = new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: sDivision
			});

			//Parameters
			var mParameters = {
				filters: [oCountryFilter, oBrandFilter, oDivisionFilter]
			};

			//call back-end
			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Creates a brand policy entry in the backend
		 */
		createBrandPolicy: function (oBrandPolicy) {

			let data = oBrandPolicy.getJSON();

			return this.odata("/BrandPolicies").post(data);
		},

		/**
		 * Updates a brand policy entry in the backend
		 */
		updateBrandPolicy: function (oBrandPolicy) {

			const sKey = this.model.createKey("/BrandPolicies", {
				ID: oBrandPolicy.iD
			});

			let data = oBrandPolicy.getJSON();

			return this.odata(sKey).put(data);
		},


	});
	return PpaService;
});