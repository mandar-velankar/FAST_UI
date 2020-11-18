sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (CoreService, Sorter, Filter, FilterOperator) {
	"use strict";

	var EpaService = CoreService.extend("com.bayer.tender.epa.service.EpaService", {
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
		 * Retrieves a list of latest pricing approval requests from the backend
		 */
		getLatestApprovalRequests: function (sCountryCode, sInstituteGroupId, sProductPackId, sDivision) {

			var aFilters = [];
		
			var oCountryCodeFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var oInstituteGroupId = new Filter({
				path: 'InstituteGroupId',
				operator: FilterOperator.EQ,
				value1: sInstituteGroupId
			});

			var oProductPackId = new Filter({
				path: 'ProductPackId',
				operator: FilterOperator.EQ,
				value1: sProductPackId
			});

			var oDivision = new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: sDivision
			});

			aFilters.push(oCountryCodeFilter);
			aFilters.push(oInstituteGroupId);
			aFilters.push(oProductPackId);
			aFilters.push(oDivision);

			var mParameters = {
				filters: aFilters,
				urlParameters: {
					"$expand": "CountryApprover"
				}
			};

			return this.odata("/LatestApprovals").get(mParameters);
		},

		/**
		 * Creates an approval request entry in the backend
		 */
		createApprovalRequest: function (oApprovalRequest) {

			let data = oApprovalRequest.getJSON();
			data.ProductPackId = parseInt(data.ProductPackId);
			data.InstituteGroupId = parseInt(data.InstituteGroupId);
			data.ApproverTypeSection = parseInt(data.ApproverTypeSection);

			return this.odata("/LatestApprovals").post(data);
		},

		/**
		 * Saves pricing approval requests
		 */
		saveApprovals: function(){

		},

		/**
		 * Retrieves a list of divisions for a given country from the backend
		 */
		getDivisionsForCountry: function(sCountryCode){

			var oCountryCodeFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var sExpand = 
				"Brands/Products/Prices/RegisteredPrice" +
				",Brands/Products/Prices/MaxMarketSalesPrice" +
				",Brands/Products/Prices/MinMarketSalesPrice" +
				",Brands/Products/Prices/FloorPrice" +
				",Brands/Products/Prices/MaxWonOfferPrice" +
				",Brands/Products/Prices/MinLostOfferPrice";

			var mParameters = {
				filters: [oCountryCodeFilter],
				urlParameters: {
					"$expand": sExpand
				}
			};

			return this.odata("/DivisionsForCountry").get(mParameters);
		},

		/**
		 * Retrieves a list of Institute Groups from the backend
		 */
		getInstituteGroups: function(){

			var mParameters = {
				urlParameters: {
					"$orderby": "Name asc"
				}
			};

			return this.odata("/InstituteGroup").get(mParameters);
		},

		/**
		 * Retrieves a list of Institute Groups from the backend
		 */
		getInstitutes: function(iInstituteGroupId){

			var sKey = this.model.createKey("/InstituteGroup", {
				Id: iInstituteGroupId
			});
			

			var mParameters = {
				urlParameters: {
					"$expand": "Institute"
				}
			};

			return this.odata(sKey + "/Institutes").get(mParameters);
		},

		/**
		 * Retrieves latest institute group price
		 */
		getInstituteGroupPriceLatest:function(iInstituteGroupId,iProductPackId){

			var aFilters = [];

			var oInstituteGroupId = new Filter({
				path: 'InstituteGroupId',
				operator: FilterOperator.EQ,
				value1: Number(iInstituteGroupId)
			});

			var oProductPackId = new Filter({
				path: 'ProductPackId',
				operator: FilterOperator.EQ,
				value1: Number(iProductPackId)
			});


			aFilters.push(oInstituteGroupId);
			aFilters.push(oProductPackId);


			var mParameters = {
				filters: aFilters
			};
			

			return this.odata("/InstituteGroupPriceLatest").get(mParameters);
		},

		/**
		 * Creates an Institute Group Price in the backend
		 */
		createInstituteGroupPrice: function (oPrice) {

			return this.odata("/InstituteGroupPrice").post(oPrice);
		},

	});
	return EpaService;
});