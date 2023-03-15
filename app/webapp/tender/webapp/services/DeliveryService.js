sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo"
], function (BaseService, Services, MomentJS, UserInfo) {
	"use strict";

	var DeliveryService = BaseService.extend("FAST_NS0FAST0.services.DeliveryService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create new delivery
		createDelivery: function (oDeliveryToSave) {

			//path of offer that is selected
			var sPath = "/PT_TMDLVTR";

			//Create
			return this.odata(sPath).post(oDeliveryToSave);

		},
		
		//update existing delivery
		updateDelivery: function (oDeliveryToSave, sMethod) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/PT_TMDLVTR", {
				OfferID: oDeliveryToSave.OfferID,
				ProductCode: oDeliveryToSave.ProductCode,
				SNo: oDeliveryToSave.SNo,
				LotID: oDeliveryToSave.LotID
			});

			//Update
			return this.odata(sPath).put(oDeliveryToSave);

		},
		
		//remove existing delivery
		removeDelivery: function (oDeliveryToSave, sMethod) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/PT_TMDLVTR", {
				OfferID: oDeliveryToSave.OfferID,
				ProductCode: oDeliveryToSave.ProductCode,
				SNo: oDeliveryToSave.SNo,
				LotID: oDeliveryToSave.LotID
			});

			//Update
			return this.odata(sPath).delete();

		},
		
		//Converted Deleverie
		getConvertDeliveryToSave: function (oDeliverySaveInfo) {

			//Convert odata to structure that can be used to save
			var oDeliverieToSave = {};

			oDeliverieToSave.TenderID = oDeliverySaveInfo.TenderID;
			oDeliverieToSave.OfferID = oDeliverySaveInfo.OfferID;
			oDeliverieToSave.CountryCode = oDeliverySaveInfo.CountryCode;
			oDeliverieToSave.InstituteID = oDeliverySaveInfo.InstituteID ? Number(oDeliverySaveInfo.InstituteID) : Services.getLoadedTender().InstituteID;
			oDeliverieToSave.SNo = Number(oDeliverySaveInfo.SNo);
			oDeliverieToSave.SKUCode = oDeliverySaveInfo.SKUCode;
			oDeliverieToSave.SubmittedOn = moment(oDeliverySaveInfo.SubmittedOn).utc().toDate();
			oDeliverieToSave.SubmittedBy = oDeliverySaveInfo.SubmittedBy;
			oDeliverieToSave.Active = Number(oDeliverySaveInfo.Active);
			oDeliverieToSave.LocalOrDirectDelivery = oDeliverySaveInfo.LocalOrDirectDelivery;
			oDeliverieToSave.PlannedInAPO = oDeliverySaveInfo.PlannedInAPO;
			oDeliverieToSave.RequestedDeliveryDate = oDeliverySaveInfo.RequestedDeliveryDate;
			oDeliverieToSave.RequestedQuantity = oDeliverySaveInfo.RequestedQuantity.toString();
			oDeliverieToSave.ActualDeliveryDate = oDeliverySaveInfo.ActualDeliveryDate;
			oDeliverieToSave.ActualDeliveryQuantity = oDeliverySaveInfo.ActualDeliveryQuantity.toString();
    // EHQUT OTT - 105262-Adding new 3 fields for delivery tracking tab 
            oDeliverieToSave.ActualDeliveredProduct=oDeliverySaveInfo.ActualDeliveredProduct;
            oDeliverieToSave.ActualDeliveredProductQty=oDeliverySaveInfo.ActualDeliveredProductQty;
            oDeliverieToSave.LocalDeliveryNoteNo=oDeliverySaveInfo.LocalDeliveryNoteNo;
    // EHQUT OTT - 105262-Adding new 3 fields for delivery tracking tab 
            oDeliverieToSave.Penalty = oDeliverySaveInfo.Penalty;
			oDeliverieToSave.PenaltyValue = oDeliverySaveInfo.PenaltyValue;
			oDeliverieToSave.Currency = oDeliverySaveInfo.Currency;
			oDeliverieToSave.PenaltyReason = oDeliverySaveInfo.PenaltyReason;
			oDeliverieToSave.UndertakingLetters = oDeliverySaveInfo.UndertakingLetters;
			oDeliverieToSave.Compensated = oDeliverySaveInfo.Compensated;
			oDeliverieToSave.CompensationComment = oDeliverySaveInfo.CompensationComment;
			oDeliverieToSave.ProductCode = Number(oDeliverySaveInfo.ProductCode);
			oDeliverieToSave.PaidOrFree = oDeliverySaveInfo.PaidOrFree;
			oDeliverieToSave.PO = oDeliverySaveInfo.PO;
			oDeliverieToSave.InvoiceNo = oDeliverySaveInfo.InvoiceNo;
			oDeliverieToSave.Contract = oDeliverySaveInfo.Contract;
			oDeliverieToSave.PoDate = oDeliverySaveInfo.PoDate;
			oDeliverieToSave.LotID = oDeliverySaveInfo.LotID;

			return oDeliverieToSave;

		},
		
		//getting an empty Delivery
		getEmptyDelivery: function () {

			//if its null we can not bind to it
			var oEmptyDelivery = {};
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oTender = oFastAppDataModel.getProperty("/Tender");
			
			if(oTender && oTender.GroupPurchasing !== 0){
				//This is a mandatory field in case grouppurchasing does not equal 0
				//In case the value of the dropdown is set to null, this will be the value of this field. Thus, resulting in an error upon saving.
				var sInstituteId = oFastAppDataModel.getProperty("/InstituteWithChildren/")[0].InstituteID;
			} 

			//push data for saving
			oEmptyDelivery = {
				TenderID: "",
				OfferID: "",
				CountryCode: "",
				InstituteID: sInstituteId,
				SKUCode: null,
				LotID: 1,
				SubmittedOn: moment().utc().toDate(),
				SubmittedBy: UserInfo.getCWID(),
				Active: 1,
				LocalOrDirectDelivery: "D",
				PlannedInAPO: "Yes",
				RequestedDeliveryDate: null,
				RequestedQuantity: null,
				ActualDeliveryDate: null,
				ActualDeliveryQuantity: null,
                ActualDeliveredProduct:null,
                ActualDeliveredProductQty:null,
                LocalDeliveryNoteNo:null,
				Penalty: "No",
				PenaltyValue: null,
				Currency: null,
				PenaltyReason: null,
				UndertakingLetters: "No",
				Compensated: "No",
				CompensationComment: null,
				ProductCode: null,
				PaidOrFree: "Paid",
				PO: null,
				InvoiceNo: null,
				SNo: 0,
				Contract: "",
				PoDate: null, //database uses an autoincrement for this
				_sOperation: 'POST'
			};

			return oEmptyDelivery;

		}
	});
	return DeliveryService;
});