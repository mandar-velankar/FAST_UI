sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min"
], function (BaseService, Services, MomentJS) {
	"use strict";

	var GroupPurchasingService = BaseService.extend("FAST_NS0FAST0.services.GroupPurchasingService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create group purchasing
		createGroupPurchasing: function (oGroupPurchasing) {

			//path of price
			var sPath = "/PT_OFGRPUR";

			//Create
			return this.odata(sPath).post(oGroupPurchasing);

		},

		//update existing group purchasing
		updateGroupPurchasing: function (oGroupPurchasing) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of price
			var sPath = oModel.createKey("/PT_OFGRPUR", {
				OfferID: oGroupPurchasing.OfferID,
				Active: 1,
				ProductCode: oGroupPurchasing.ProductCode,
				InstituteID: oGroupPurchasing.InstituteID
			});

			//Create
			return this.odata(sPath).put(oGroupPurchasing);

		},
		
		//removing group purchasing
		removeGroupPurchasing: function (oGroupPurchasing) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of price
			var sPath = oModel.createKey("/PT_OFGRPUR", {
				OfferID: oGroupPurchasing.OfferID,
				Active: 1,
				ProductCode: oGroupPurchasing.ProductCode,
				InstituteID: oGroupPurchasing.InstituteID
			});

			//Create
			return this.odata(sPath).delete();

		},
		
		//convert group purchasing to Save
		getConvertGroupPurchasingToSave: function (oGroupPurchasing) {

			//Convert odata to structure that can be used to save
			var oGroupPurchasingToSave = {};

			oGroupPurchasingToSave.TenderID = oGroupPurchasing.TenderID;
			oGroupPurchasingToSave.OfferID = oGroupPurchasing.OfferID;
			oGroupPurchasingToSave.RegionCode = oGroupPurchasing.RegionCode;
			oGroupPurchasingToSave.CountryCode = oGroupPurchasing.CountryCode;
			oGroupPurchasingToSave.SubmittedOn = moment(oGroupPurchasing.SubmittedOn).utc().toDate();
			oGroupPurchasingToSave.SubmittedBy = oGroupPurchasing.SubmittedBy;
			oGroupPurchasingToSave.Active = oGroupPurchasing.Active;
			oGroupPurchasingToSave.ProductCode = oGroupPurchasing.ProductCode;
			oGroupPurchasingToSave.InstituteID = oGroupPurchasing.InstituteID;
			oGroupPurchasingToSave.DistributorID = oGroupPurchasing.DistributorID;
			oGroupPurchasingToSave.Requested = parseInt(oGroupPurchasing.Requested);
			oGroupPurchasingToSave.KeyForRestore = oGroupPurchasing.KeyForRestore;

			return oGroupPurchasingToSave;
		},
	});
	return GroupPurchasingService;
});