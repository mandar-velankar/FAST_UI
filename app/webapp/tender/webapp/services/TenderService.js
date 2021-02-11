sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
], function (BaseService, Services, UserInfo, MomentJS) {
	"use strict";

	var TenderService = BaseService.extend("FAST_NS0FAST0.services.TenderService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create new tender
		createTender: function (oTenderToSave) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = "/PT_TMTEND";

			//TODO convert dates for odataV2, should be removed after dates are handeled in the same way everywhere
			// oTenderToSave.PublicationDate = moment(oTenderToSave.PublicationDate).toDate();
			// oTenderToSave.BidDueDate = moment(oTenderToSave.BidDueDate).toDate();
			// oTenderToSave.AwardDate = moment(oTenderToSave.AwardDate).toDate();
			// oTenderToSave.NextPublicationDye = moment(oTenderToSave.NextPublicationDye).toDate();
			oTenderToSave.SubmittedOn = moment().utc().toDate();
			oTenderToSave.SubmittedBy = UserInfo.getCWID();

			//Create
			return new Promise(function (resolve, reject) {
				oModel.create(sPath, oTenderToSave, {
					success: function (oData, oResponse) {
						resolve(oData);
					},
					error: function (oError) {
						//show error message
						Services.showErrorMessage(oError, "Saving of basic tender");

						//let the callback be triggered
						reject(oError);
					}
				});
			});

		},

		//update existing tender
		updateTender: function (oTenderToSave, sMethod) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/PT_TMTEND", {
				TenderID: oTenderToSave.TenderID
			});

			//Update
			return new Promise(function (resolve, reject) {
				oModel.update(sPath, oTenderToSave, {
					method: sMethod,
					success: function (oData, oResponse) {
						resolve(oData);
						// oDeferred.resolve(oData);
					},
					error: function (oError) {

						//show error message
						Services.showErrorMessage(oError, "Update of basic tender");

						//let the callback be triggered
						reject(oError);

					}
				});
			});

		},
		
		//basic info for tender to save
		getConvertTenderToSave: function (oTenderSaveInfo) {

			//Convert odata to structure that can be used to save
			var oTenderToSave = {};

			oTenderToSave.TenderID = oTenderSaveInfo.TenderID;
			oTenderToSave.CountryCode = oTenderSaveInfo.CountryCode;
			oTenderToSave.ToolID = Number(oTenderSaveInfo.ToolID);
			oTenderToSave.TenderNo = Number(oTenderSaveInfo.TenderNo);
			oTenderToSave.CloneTenderID = oTenderSaveInfo.CloneTenderID;
			oTenderToSave.SubmittedOn = oTenderSaveInfo.SubmittedOn;
			oTenderToSave.SubmittedBy = oTenderSaveInfo.SubmittedBy;
			oTenderToSave.Active = Number(oTenderSaveInfo.Active);
			oTenderToSave.Classification = oTenderSaveInfo.Classification;
			oTenderToSave.BindingTypeLevel1 = oTenderSaveInfo.BindingTypeLevel1;
			oTenderToSave.BindingTypeLevel2 = oTenderSaveInfo.BindingTypeLevel2;
			oTenderToSave.BindingTypeLevel3 = oTenderSaveInfo.BindingTypeLevel3;
			oTenderToSave.HighValue = oTenderSaveInfo.HighValue;
			oTenderToSave.OfferStartDate = oTenderSaveInfo.OfferStartDate;
			oTenderToSave.IbizID = oTenderSaveInfo.IbizID;
			oTenderToSave.PublicNotice = oTenderSaveInfo.PublicNotice;
			oTenderToSave.TenderName = oTenderSaveInfo.TenderName;
			oTenderToSave.InstituteID = Number(oTenderSaveInfo.InstituteID);
			oTenderToSave.TenderChannel = oTenderSaveInfo.TenderChannel;
			oTenderToSave.GroupPurchasing = Number(oTenderSaveInfo.GroupPurchasing);
			oTenderToSave.PublicationDate = oTenderSaveInfo.PublicationDate;
			oTenderToSave.BidDueDate = oTenderSaveInfo.BidDueDate;
			oTenderToSave.AwardDate = oTenderSaveInfo.AwardDate;
			oTenderToSave.NextPublicationDye = oTenderSaveInfo.NextPublicationDye;
			oTenderToSave.ContractLength = Number(oTenderSaveInfo.ContractLength);
			oTenderToSave.ContractExtenseion = Number(oTenderSaveInfo.ContractExtenseion);
			oTenderToSave.TenderStatus = oTenderSaveInfo.TenderStatus;
			oTenderToSave.ManualSaveStatus = oTenderSaveInfo.ManualSaveStatus;
			oTenderToSave.FoldersCreated = Number(oTenderSaveInfo.FoldersCreated);
			oTenderToSave.TENDER_TYPE_ID = Number(oTenderSaveInfo.TENDER_TYPE_ID);
			/* Mexico */
			oTenderToSave.CONTRACT_TYPE_ID = Number(oTenderSaveInfo.CONTRACT_TYPE_ID);
			oTenderToSave.SALES_TYPE_ID = Number(oTenderSaveInfo.SALES_TYPE_ID);
			oTenderToSave.TENDER_ORIGIN_ID = Number(oTenderSaveInfo.TENDER_ORIGIN_ID);
			/* End of mexico */
			/* Thailand */
			oTenderToSave.PROCUREMENT_METHOD_ID = oTenderSaveInfo.PROCUREMENT_METHOD_ID;
			oTenderToSave.PROCUREMENT_REASON = oTenderSaveInfo.PROCUREMENT_REASON;
			/* End of Thailand */

			return oTenderToSave;
		},

		//get new tender object to bind to TODO - fill all fields and use them all for binding to new Tender... at this moment only dates are used
		getEmptyTender: function () {

			var oNewTender = {};

			oNewTender.TenderID = "";
			oNewTender.CountryCode = "";
			oNewTender.ToolID = "";
			oNewTender.TenderNo = "";
			oNewTender.CloneTenderID = "";
			oNewTender.SubmittedOn = "";
			oNewTender.SubmittedBy = "";
			oNewTender.Active = 1;
			oNewTender.Classification = "";
			oNewTender.BindingTypeLevel1 = "";
			oNewTender.BindingTypeLevel2 = "";
			oNewTender.BindingTypeLevel3 = "";
			oNewTender.HighValue = "";
			oNewTender.OfferStartDate = "";
			oNewTender.IbizID = "";
			oNewTender.PublicNotice = "";
			oNewTender.TenderName = "";
			oNewTender.InstituteID = "";
			oNewTender.TenderChannel = "";
			oNewTender.GroupPurchasing = "";
			oNewTender.PublicationDate = "";
			oNewTender.BidDueDate = "";
			oNewTender.AwardDate = "";
			oNewTender.NextPublicationDye = "";
			oNewTender.ContractLength = 12;
			oNewTender.ContractExtenseion = 0;
			oNewTender.TenderStatus = "";
			oNewTender.ManualSaveStatus = "";
			oNewTender.FoldersCreated = "";
			oNewTender.TENDER_TYPE_ID = "";
			oNewTender.SALES_TYPE_ID = "";
			oNewTender.TENDER_ORIGIN_ID = "";
			oNewTender.CONTRACT_TYPE_ID = "";

			return oNewTender;

		},
	});
	
	return TenderService;
});