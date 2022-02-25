sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo"
], function (BaseService, Services, MomentJS, UserInfo) {
	"use strict";

	var BankGuaranteeService = BaseService.extend("FAST_NS0FAST0.services.BankGuaranteeService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create new delivery
		createBankGuarantee: function (oBankGuarantee) {

			//path of offer that is selected
			var sPath = "/BankGuarantees";

			//Create
			return this.odata(sPath).post(oBankGuarantee);

		},

		//create new delivery
		updateBankGuarantee: function (oBankGuarantee) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/BankGuarantees", {
				ID: oBankGuarantee.ID
			});

			//Create
			return this.odata(sPath).put(oBankGuarantee);

		},
		
		//getting an empty Delivery
		createEmptyBankGuarantee: function (type) {

			//if its null we can not bind to it
			var oBankGuarantee = {};
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oTender = oFastAppDataModel.getProperty("/Tender");

			//push data for saving
			oBankGuarantee = {
                TenderID: oTender.TenderID,
                CountryCode: oTender.CountryCode,
                Reference: "",
                IssueDate: null,
                ClosingDate: null,
				ExpectedExpiryDate: null,
                Status: "",
                Type: type,
                GuaranteedAmount: 0,
                Currency: "",
                Comment: "",
            }

			return oBankGuarantee;

		}
	});
	return BankGuaranteeService;
});