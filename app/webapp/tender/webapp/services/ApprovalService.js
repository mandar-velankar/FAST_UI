sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services"
], function (BaseService, Services) {
	"use strict";

	var ApprovalService = BaseService.extend("FAST_NS0FAST0.services.ApprovalService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		createApproval: function (oApprovalToSave) {

			var that = this;

			//path of offer that is selected
			var sPath = "/PT_TMAPPRST";

			//Create
			return that.odata(sPath).post(oApprovalToSave);

		},
		
		//get approvals in right format for saving
		getConvertApprovalToSave: function (oApprovalSaveInfo) {

			//Convert odata to structure that can be used to save
			var oApprovalToSave = {};

			//get information for saving
			oApprovalToSave.TenderID = oApprovalSaveInfo.TenderID;
			oApprovalToSave.OfferId = oApprovalSaveInfo.OfferId;
			oApprovalToSave.CountryCode = oApprovalSaveInfo.CountryCode;
			oApprovalToSave.productcode = oApprovalSaveInfo.productcode;
			oApprovalToSave.ApprovalContent = oApprovalSaveInfo.ApprovalContent;
			oApprovalToSave.ApproverTypeSection = oApprovalSaveInfo.ApproverTypeSection;
			oApprovalToSave.ApprovalStatus = oApprovalSaveInfo.ApprovalStatus;
			oApprovalToSave.ApproverName = oApprovalSaveInfo.ApproverName;
			oApprovalToSave.ApproverEmailID = oApprovalSaveInfo.ApproverEmailID;
			oApprovalToSave.SenderComment = oApprovalSaveInfo.SenderComment;
			oApprovalToSave.ApproverComment = oApprovalSaveInfo.ApproverComment;
			oApprovalToSave.Active = oApprovalSaveInfo.Active;
			oApprovalToSave.AP_ID = oApprovalSaveInfo.AP_ID;
			oApprovalToSave.RestoreKey = oApprovalSaveInfo.RestoreKey;
			oApprovalToSave.Submittedby = oApprovalSaveInfo.Submittedby;
			oApprovalToSave.ApproverDate = (oApprovalSaveInfo.ApproverDate === null) ? null : oApprovalSaveInfo.ApproverDate.toDate();
			oApprovalToSave.ApproverType = oApprovalSaveInfo.ApproverType;
			oApprovalToSave.FLOW_ID = oApprovalSaveInfo.FLOW_ID;
			oApprovalToSave.REQUIRED_ACTION = oApprovalSaveInfo.REQUIRED_ACTION;
			//oApprovalToSave.Statustime = (oApprovalSaveInfo.Statustime) ? moment(moment(oApprovalSaveInfo.Statustime, "YYYY-MM-dd HH:mm:SS").format("YYYY-MM-DD HH:MM:SS:00")).toDate() : null;
			oApprovalToSave.Statustime = (oApprovalSaveInfo.Statustime) ? oApprovalSaveInfo.Statustime : null;

			return oApprovalToSave;

		}
	});
	return ApprovalService;
});