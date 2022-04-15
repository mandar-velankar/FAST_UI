sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, MomentJS, UserInfo, Filter, FilterOperator) {
	"use strict";

	var OfferService = BaseService.extend("FAST_NS0FAST0.services.OfferService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		getPerson: function (oOffer) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/PT_TMOFRS", {
				OfferID: oOffer.OfferID
			});
			
			//Expand, filters...
			var mParameters = {
				/*
				urlParameters: {
					$expand: "PersonHasSkills"
				}
				*/
			};
			
			//Read
			return this.odata(sPath).get(mParameters);
			
		},

		/**
		 * Fetches offers from the backend
		 * @param {String} sTenderID - 
		 * @param {String} sCountryCode -  
		 * @param {String} sExpand - a list of comma separated fields to be expanded
		 * @returns {Array} - a list of active offers
		 */
		getOffers:function(sTenderID, sCountryCode, sExpand){
			
			var sPath = "/PT_TMOFRS";

			var oTenderIdFilter = new Filter({
				path: 'TenderID',
				operator: FilterOperator.EQ,
				value1: sTenderID
			});

			var oCountryCodeFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var oActiveFilter = new Filter({
				path: 'Active',
				operator: FilterOperator.EQ,
				value1: 1
			});

			var mParameters = {
				filters: [oTenderIdFilter, oCountryCodeFilter, oActiveFilter]
			};

			if(sExpand){
				mParameters['urlParameters'] = {
					$expand: sExpand
				}
			}

			return this.odata(sPath).get(mParameters);
		},

		createOffer:function(oOfferToSave){
			
			//path of offer that is selected
			var sPath = "/PT_TMOFRS";

			//Create
			return this.odata(sPath).post(oOfferToSave);
			
		},
		
		//update existing offer
		updateOffer: function (oOfferToSave) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/PT_TMOFRS", {
				OfferID: oOfferToSave.OfferID
			});

			//Update
			return this.odata(sPath).put(oOfferToSave);

		},
		
		//create offer status
		createOfferStatus: function (oOfferStatusSaveInfo) {

			//path of offer that is selected
			var sPath = "/PT_TMTNOFST";

			//Create
			return this.odata(sPath).post(oOfferStatusSaveInfo);

		},

		//update offer status
		updateOfferStatus: function (oOfferStatusSaveInfo) {

			var oModel = Services.getDefaultModel();

			//path
			var sPath = oModel.createKey("/PT_TMTNOFST", {
				TenderID: oOfferStatusSaveInfo.TenderID,
				OfferID: oOfferStatusSaveInfo.OfferID,
				Active: oOfferStatusSaveInfo.Active
			});

			//Update existing offerstatus in offer table
			return this.odata(sPath).put(oOfferStatusSaveInfo);

		},
		
		//convert offer to Save
		getConvertOfferToSave: function (oOfferSaveInfo) {

			//Convert odata to structure that can be used to save
			var oOfferToSave = {};

			oOfferToSave.TenderID = oOfferSaveInfo.TenderID;
			oOfferToSave.OfferID = oOfferSaveInfo.OfferID;
			oOfferToSave.CountryCode = oOfferSaveInfo.CountryCode;
			oOfferToSave.TenderOfferNo = Number(oOfferSaveInfo.TenderOfferNo);
			oOfferToSave.RevisedOfferNo = Number(oOfferSaveInfo.RevisedOfferNo);
			oOfferToSave.ActiveOffer = Number(oOfferSaveInfo.ActiveOffer);
			oOfferToSave.CreationDate = moment().utc().toDate();
			oOfferToSave.SubmissionDate = null; //"00000000";
			oOfferToSave.SubmittedOn = moment().utc().toDate();
			oOfferToSave.SubmittedBy = UserInfo.getCWID();
			oOfferToSave.Active = Number(oOfferSaveInfo.Active);
			oOfferToSave.DistributorID = Number(oOfferSaveInfo.DistributorID);
			oOfferToSave.InternalBidDueDate = oOfferSaveInfo.InternalBidDueDate;
			oOfferToSave.SellingCompany = oOfferSaveInfo.SellingCompany;
			oOfferToSave.ProductCount = Number(oOfferSaveInfo.ProductCount);
			oOfferToSave.Currency = oOfferSaveInfo.Currency;
			oOfferToSave.ManualSaveStatus = oOfferSaveInfo.ManualSaveStatus;
			oOfferToSave.WholesaleOffer = oOfferSaveInfo.WholesaleOffer;
			oOfferToSave.Comment = oOfferSaveInfo.Comment;
			oOfferToSave.OfferRevisionSplitNo = Number(oOfferSaveInfo.OfferRevisionSplitNo);
			oOfferToSave.NewOfferDueDate = oOfferSaveInfo.NewOfferDueDate;
			oOfferToSave.ContinuationOfferNo = Number(oOfferSaveInfo.ContinuationOfferNo);
			oOfferToSave.FOCType = oOfferSaveInfo.FOCType;
			oOfferToSave.DEFAULT_FOC_ABS_PCT = oOfferSaveInfo.DEFAULT_FOC_ABS_PCT;
			oOfferToSave.Division = oOfferSaveInfo.Division;

			return oOfferToSave;

		},
		
			//get information to save the status of an offer in the corresponding table PT_TMNOFST
		getConvertOfferStatusToSave: function (oOfferSaveInfo, sStatus) {

			var oOfferStatusSaveInfo = {};

			//when on quotation page, status is set differently (no offer to save, offer already existing in model)
			if (!oOfferSaveInfo.OfferID) {
				oOfferSaveInfo = Services.getLoadedOffer(Services.getSelectedOfferID()); //that.getDefaultModel().getProperty(sSelectedOfferPath);

			}

			//status offer
			oOfferStatusSaveInfo.TenderID = oOfferSaveInfo.TenderID;
			oOfferStatusSaveInfo.OfferID = oOfferSaveInfo.OfferID;
			oOfferStatusSaveInfo.CountryCode = oOfferSaveInfo.CountryCode;
			oOfferStatusSaveInfo.Active = oOfferSaveInfo.Active;
			oOfferStatusSaveInfo.STATUS = sStatus;
			oOfferStatusSaveInfo.Date = moment().utc().toDate();

			return oOfferStatusSaveInfo;

		},

        getProductTypeProfitability:function(sOfferId, sCountryCode){
			
			var sPath = "/ProductTypeProfitability";

			var oOfferIdFilter = new Filter({
				path: 'OfferId',
				operator: FilterOperator.EQ,
				value1: sOfferId
			});

			var oCountryCodeFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var mParameters = {
				filters: [oOfferIdFilter, oCountryCodeFilter]
			};

			return this.odata(sPath).get(mParameters);
		},

        createProductTypeProfitability: function (oProductTypeProfitability) {
			return this.odata("/ProductTypeProfitability").post(oProductTypeProfitability);
		},

		updateProductTypeProfitability: function (oProductTypeProfitability) {
			const oModel = Services.getDefaultModel();
			const sPath = oModel.createKey("/ProductTypeProfitability", {
				ID: oProductTypeProfitability.ID
			});

			return this.odata(sPath).put(oProductTypeProfitability);
		},

        upsertProductTypeProfitability: function(oProductTypeProfitability){

            if(oProductTypeProfitability.ID){
                return this.updateProductTypeProfitability(this.getConvertProductTypeProfitabilityToSave(oProductTypeProfitability));
            }

            return this.createProductTypeProfitability(this.getConvertProductTypeProfitabilityToSave(oProductTypeProfitability));

        },

        getConvertProductTypeProfitabilityToSave: function (oProfitabilitySaveInfo) {

			let oConvertedSaveInfo = {
                OfferId: Services.getSelectedOfferID(),
                CountryCode: Services.getSelectedCountry(),
                ProductType: oProfitabilitySaveInfo.ProductType,
                NPV_GrossMargin: oProfitabilitySaveInfo.GrossMargin,
                NPV_NetSales: oProfitabilitySaveInfo.NetSales,
                NPV_Cogs: oProfitabilitySaveInfo.COGS,
                Profitability: oProfitabilitySaveInfo.Profitability
            };

            if(oProfitabilitySaveInfo.ID){
                oConvertedSaveInfo.ID = oProfitabilitySaveInfo.ID
            }

            return oConvertedSaveInfo;
		},
	});
	return OfferService;
});