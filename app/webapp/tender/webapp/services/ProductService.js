sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, MomentJS, UserInfo, Filter, FilterOperator) {
	"use strict";

	var ProductService = BaseService.extend("FAST_NS0FAST0.services.ProductService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},


		/**
		 * Fetches tender products from the backend
		 * @param {String} sTenderID - 
		 * @returns {Array} - a list of products for a given tender
		 */
		 getTenderProducts:function(sTenderID){
			
			var sPath = "/PT_TMOFPR";

			var oTenderIdFilter = new Filter({
				path: 'TenderID',
				operator: FilterOperator.EQ,
				value1: sTenderID
			});


			var mParameters = {
				filters: [oTenderIdFilter],
				urlParameters: {
					$expand: "SKU/Product"
				}
			};


			return this.odata(sPath).get(mParameters);
		},

		getFinancialProducts: function(offerID){
			var sPath = "/OfferProductsItaly";

			var oOfferIdFilter = new Filter({
				path: 'OfferID',
				operator: FilterOperator.EQ,
				value1: offerID
			});


			var oActiveFilter = new Filter({
				path: 'Active',
				operator: FilterOperator.EQ,
				value1: 1
			});


			var mParameters = {
				filters: [oOfferIdFilter, oActiveFilter]
			};


			return this.odata(sPath).get(mParameters);
		},
		
		//create new product
		createProduct: function (oProductToSave) {

			//that is this
			var that = this;

			//path of offer that is selected
			var sPath = "/PT_TMOFPR";

			//Create
			return that.odata(sPath).post(oProductToSave);

		},

		//create new product
		updateProduct: function (oProductToSave, sMethod) {

			//that is this
			var that = this;

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of product
			var sPath = oModel.createKey("/PT_TMOFPR", {
				OfferID: oProductToSave.OfferID,
				Active: oProductToSave.Active,
				ProductCode: oProductToSave.ProductCode
			});

			//Update
			return that.odata(sPath).put(oProductToSave);

		},
		
		removeProduct: function (oProductToRemove) {

			//that is this
			var that = this;

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/PT_TMOFPR", {
				OfferID: oProductToRemove.OfferID,
				Active: oProductToRemove.Active,
				ProductCode: oProductToRemove.ProductCode
			});

			//remove
			return that.odata(sPath).delete();

		},
		
		//Convert Product info to save in the database. (View binding is an extended version)
		getConvertProductToSave: function (oProductSaveInfo) {

			//Convert odata to structure that can be used to save
			var oProductToSave = {};

			oProductToSave.TenderID = oProductSaveInfo.TenderID;

			//Lets be sure that the offerID of the product matches the offerID of the Offer
			//Reason only on saving we are sure that the Sellingcompany is defined
			//and after saving it should always be the same as the offer
			var oOfferSaveInfo = Services.getOfferSaveInfo();
			oProductToSave.OfferID = oOfferSaveInfo.OfferID;

			oProductToSave.CountryCode = oProductSaveInfo.CountryCode;
			oProductToSave.SubmittedOn = moment().utc().toDate();
			oProductToSave.SubmittedBy = UserInfo.getCWID();
			oProductToSave.Active = Number(oProductSaveInfo.Active);
			oProductToSave.ProductCode = Number(oProductSaveInfo.ProductCode);
			oProductToSave.Reference = oProductSaveInfo.Reference;
			oProductToSave.AlternateOfferYN = oProductSaveInfo.AlternateOfferYN;
			oProductToSave.RequestedVolume = Number(oProductSaveInfo.RequestedVolume);
			oProductToSave.UnitPerPack = oProductSaveInfo.UnitPerPack;
			oProductToSave.SampleYN = oProductSaveInfo.SampleYN;
			oProductToSave.SampleQuantity = Number(oProductSaveInfo.SampleQuantity);
			oProductToSave.DocumentsRequired = oProductSaveInfo.DocumentsRequired;
			oProductToSave.FirstShipment = oProductSaveInfo.FirstShipment;
			oProductToSave.NoofLots = Number(oProductSaveInfo.NoofLots);
			oProductToSave.IntervalBetweenShipments = Number(oProductSaveInfo.IntervalBetweenShipments);
			//NoOfTier not used
			//DiscOrOffer not used
			oProductToSave.PaymentTerms = oProductSaveInfo.PaymentTerms;
			oProductToSave.DistributorID = Number(oProductSaveInfo.DistributorID);
			//SNo not used
			oProductToSave.ActiveProduct = Number(oProductSaveInfo.ActiveProduct);
			oProductToSave.Comment = oProductSaveInfo.Comment;
			oProductToSave.INCOTerms = oProductSaveInfo.INCOTerms;
			oProductToSave.SORTER = Number(oProductSaveInfo.SORTER);
			oProductToSave.DEFAULT_COMMISSION_RATE = oProductSaveInfo.DEFAULT_COMMISSION_RATE;
			oProductToSave.SUPPLY_UPDATE = (oProductSaveInfo.SUPPLY_UPDATE) ? Number(oProductSaveInfo.SUPPLY_UPDATE) : null;
			oProductToSave.PAYMENT_UPDATE = (oProductSaveInfo.PAYMENT_UPDATE) ? Number(oProductSaveInfo.PAYMENT_UPDATE) : null;
			oProductToSave.Line = oProductSaveInfo.Line;
			oProductToSave.PricingPolicyCluster = oProductSaveInfo.PricingPolicyCluster;
			oProductToSave.MinInvoiceAmount = oProductSaveInfo.MinInvoiceAmount ? Number(oProductSaveInfo.MinInvoiceAmount) : 0;
			oProductToSave.DeliveryConditions = oProductSaveInfo.DeliveryConditions;
			oProductToSave.OfferType = oProductSaveInfo.OfferType;
			//oProductToSave.SKU = oProductSaveInfo.SKU;

			return oProductToSave;

		},
		
		//get empty product result
		getEmptyProductResult: function () {
			var oProductResult = {
				OFFERID: null,
				PRODUCTCODE: null,
				PRODUCT: null,
				ERRORINSUBMISSION: null,
				OUTCOME: null,
				UOM: null,
				AWARDEDQTY: null,
				REASON: null,
				COMMENT: null,
				AWARDEDCOMPANY: null,
				AWARDEDPRICE: null,
				CURRENCY: null,
				OutcomeLevel: null,
				_sOperation: "POST"
			};

			return oProductResult;
		}
	});
	return ProductService;
});