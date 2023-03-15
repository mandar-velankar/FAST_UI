sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, UserInfo, MomentJS, Filter, FilterOperator) {
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
		//EFRCL-217931-Italy - Tender expiry date field
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
			oTenderToSave.BiddingTypeLevel1 = oTenderSaveInfo.BiddingTypeLevel1;
			oTenderToSave.BiddingTypeLevel2 = oTenderSaveInfo.BiddingTypeLevel2;
			oTenderToSave.BiddingTypeLevel3 = oTenderSaveInfo.BiddingTypeLevel3;
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
			//EFRCL-217931-Italy - Tender expiry date field
			oTenderToSave.TerminationDate = oTenderSaveInfo.TerminationDate;
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
            /* Spain */
            oTenderToSave.PORTAL = oTenderSaveInfo.PORTAL;
            oTenderToSave.CONTENT = oTenderSaveInfo.CONTENT;
            oTenderToSave.TENDER_TYPE_2_ID = oTenderSaveInfo.TENDER_TYPE_2_ID;

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
			oNewTender.BiddingTypeLevel1 = "";
			oNewTender.BiddingTypeLevel2 = "";
			oNewTender.BiddingTypeLevel3 = "";
			oNewTender.HighValue = "";
			oNewTender.OfferStartDate = "";
			oNewTender.IbizID = "";
			oNewTender.PublicNotice = "";
			oNewTender.TenderName = "";
			oNewTender.InstituteID = "";
			oNewTender.TenderChannel = "";
			oNewTender.GroupPurchasing = "";
			oNewTender.PublicationDate = "";
			oNewTender.TerminationDate = "";
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
            oNewTender.PORTAL = "";
            oNewTender.CONTENT = "";
            oNewTender.TENDER_TYPE_2_ID = "";

			return oNewTender;

		},

		/**
		 * Fetches country information from the backend
		 * @param {String} sCountryCode 
		 * @returns {Object} Country
		 */
		getCountryInfo: function(sCountryCode){ 
			
			var sPath = "/PT_TMCTRY";

			var oTenderFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var mParameters = {
				filters: [oTenderFilter]
			};

			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Get the next offer number for the tender
		 * @param {*} sTenderID 
		 * @returns 
		 */
		getNextTenderOfferNo: function(sTenderID){
			var sPath = "/TenderOffers";

			var oFilter = new Filter({
				path: 'TENDERID',
				operator: FilterOperator.EQ,
				value1: sTenderID
			});

			var mParameters = {
				filters: [oFilter]
			};

			return this.odata(sPath).get(mParameters);			
		},


		//create CountrySpecificInformation
		createCountrySpecificInformation: function (data) {

			if(!data){
				return;
			}

			//path of offer that is selected
			var sPath = "/CountrySpecificInformation";

			
			return this.odata(sPath).post(data);

		},

		//update existing CountrySpecificInformation
		updateCountrySpecificInformation: function (countrySpecificInformation) {

			if(!countrySpecificInformation){
				return;
			}

			const data = {
				Institute: countrySpecificInformation.Institute,
				TenderReference: countrySpecificInformation.TenderReference,
				PublicationDate: countrySpecificInformation.PublicationDate,
				ClosingDate: countrySpecificInformation.ClosingDate
			}	

			const oModel = Services.getDefaultModel();

			//path of offer that is selected
			const sPath = oModel.createKey("/CountrySpecificInformation", {
				TenderID: countrySpecificInformation.TenderID,
				CountryCode: countrySpecificInformation.CountryCode,
				
			});

			//Update
			return this.odata(sPath).put(data);

		},


		saveTenderRegions: function(tenderID, regionIDs){

			const regions = regionIDs.map(id => {
				return {
					"TenderID": tenderID,
					"RegionID": id
				};
			});

			const data = {
				"TenderID": tenderID,
				"Regions": regions
			}

			if(tenderID){
				const sKey = this.model.createKey("/TenderRegions", {
					TenderID: tenderID
				});
	
				return this.odata(sKey).put(data);
			}

		},

		getTenderRegions: function(tenderID){

            var sPath = "/TenderRegions";

			var oFilter = new Filter({
				path: 'TenderID',
				operator: FilterOperator.EQ,
				value1: tenderID
			});

			var mParameters = {
				urlParameters:{
                    filters: [oFilter],
					$expand:"Regions/Region"
				}
			};

			return this.odata(sPath).get(mParameters);

		},



		notifyIbiz: function (workflowID, directIndirect, lineNumbers) {

			const payload = {
				"ibizWorkflowID": workflowID,
				"directIndirect": directIndirect,
				"lineNumbers": lineNumbers
			};

			//Create
			return this.odata("/notifyIbiz").post(payload);

		},

		sendApprovalToIbiz: function (workflowID, offerStatus, comment) {

			const payload = {
				"ibizWorkflowID": workflowID,
				"offerStatus": offerStatus,
				"comment": comment
			};

			//Create
			return this.odata("/sendApprovalToIbiz").post(payload);

		},

	});
	
	return TenderService;
});