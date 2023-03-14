sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo"
], function (BaseService, Services, MomentJS, UserInfo) {
	"use strict";

	var LetterService = BaseService.extend("FAST_NS0FAST0.services.LetterService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create new letter
		createLetter: function (oLetterToSave) {

			//get model for calls
			//oLetterToSave.RETURNEDQTY = oLetterToSave.RETURNEDQTY.toString();

			//path of offer that is selected
			var sPath = "/PT_TMUDLTRS";

			//Create
			return this.odata(sPath).post(oLetterToSave);

		},

		//update existing letter
		updateLetter: function (oLetterToSave, sMethod) {

			//path of offer that is selected
			var sPath = Services.getDefaultModel().createKey("/PT_TMUDLTRS", {
				OFFERID: oLetterToSave.OFFERID,
				SKUCODE: oLetterToSave.SKUCODE,
				SNO: oLetterToSave.SNO,
				LOTID: oLetterToSave.LotID
			});

			//Update
			return this.odata(sPath).put(oLetterToSave);

		},

		//remove existing letter
		removeLetter: function (oLetterToSave, sMethod) {

			//path of offer that is selected
			var sPath = Services.getDefaultModel().createKey("/PT_TMUDLTRS", {
				OFFERID: oLetterToSave.OFFERID,
				SKUCODE: oLetterToSave.SKUCODE,
				SNO: oLetterToSave.SNO,
				LOTID: oLetterToSave.LotID
			});

			//Update
			return this.odata(sPath).delete();

		},
		
		//Converted Letter
		getConvertLetterToSave: function (oLetterSaveInfo) {

			//Convert odata to structure that can be used to save
			var oLetterToSave = {};

			//adding all fields needed for the post to deliveries
			oLetterToSave.TENDERID = oLetterSaveInfo.TENDERID;
			oLetterToSave.OFFERID = oLetterSaveInfo.OFFERID;
			oLetterToSave.COUNTRYCODE = oLetterSaveInfo.COUNTRYCODE;
			oLetterToSave.INSTITUTEID = Number(oLetterSaveInfo.INSTITUTEID);
			oLetterToSave.SNO = oLetterSaveInfo.SNO;
			oLetterToSave.SKUCODE = Number(oLetterSaveInfo.SKUCODE);
			oLetterToSave.SUBMITTEDON = moment(oLetterSaveInfo.SUBMITTEDON).utc().toDate();
			oLetterToSave.SUBMITTEDBY = oLetterSaveInfo.SUBMITTEDBY;
			oLetterToSave.ACTIVE = oLetterSaveInfo.ACTIVE;
			oLetterToSave.REASONFORLETTER = oLetterSaveInfo.REASONFORLETTER;
			oLetterToSave.QUANTITY = Number(oLetterSaveInfo.QUANTITY);
			oLetterToSave.BATCH = oLetterSaveInfo.BATCH;
			oLetterToSave.MANUFACTURINGDATE = oLetterSaveInfo.MANUFACTURINGDATE;
			oLetterToSave.EXPIRYDATE = oLetterSaveInfo.EXPIRYDATE;
			oLetterToSave.RETURNDATE = oLetterSaveInfo.RETURNDATE;
			oLetterToSave.RETURNEDQTY = Number(oLetterSaveInfo.RETURNEDQTY.toString());
			oLetterToSave.UOM = oLetterSaveInfo.UOM;
			oLetterToSave.LOTID = oLetterSaveInfo.LotID;


			return oLetterToSave;

		},
		
		//adding an empty Letter to the Product, so we can bind to it
		getEmptyLetter: function () {

			//if its null we can not bind to it
			var oEmptyLetter = {};
			
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oTender = oFastAppDataModel.getProperty("/Tender");
			
			if(oTender && oTender.GroupPurchasing !== 0){
				//This is a mandatory field in case grouppurchasing does not equal 0
				//In case the value of the dropdown is set to null, this will be the value of this field. Thus, resulting in an error upon saving.
				var sInstituteId = oFastAppDataModel.getProperty("/InstituteWithChildren/")[0].InstituteID;
			} 

			//push data for saving
			oEmptyLetter = {
				TENDERID: "",
				OFFERID: "",
				COUNTRYCODE: "",
				INSTITUTEID: sInstituteId,
				SKUCODE: null,
				LOTID: 1,
				SUBMITTEDON: moment().utc().toDate(),
				SUBMITTEDBY: UserInfo.getCWID(),
				ACTIVE: 1,
				REASONFORLETTER: "",
				QUANTITY: null,
				BATCH: "",
				MANUFACTURING: null,
				EXPIRYDATE: null,
				RETURNDATE: null,
				RETURNEDQTY: null,
				UOM: "Unit",
				SNO: 0, //database uses an autoincrement for this
				_sOperation: 'POST'
			};

			return oEmptyLetter;

		}
	});
	return LetterService;
});