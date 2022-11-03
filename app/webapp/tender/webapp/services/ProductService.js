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
					$expand: "SKU/Product,PriceAgreement,PriceCondition"
				}
			};


			return this.odata(sPath).get(mParameters);
		},

		getProductPriceAgreement: function(sCountryCode, sProductPackId){
			var sPath = "/PriceAgreements";
			let aFilters = [];

			aFilters.push(new Filter({
				path: 'ProductPackId',
				operator: FilterOperator.EQ,
				value1: sProductPackId
			}));

			aFilters.push(new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			}));

			var mParameters = {
				filters: aFilters,
				urlParameters: {
					$expand: "OfferProduct,Candidates"
				}
			};


			return this.odata(sPath).get(mParameters);
		},

		getFinancialProducts: function(offerID){
			var sPath = "/ProductPricingView";

			var oOfferIdFilter = new Filter({
				path: 'OfferID',
				operator: FilterOperator.EQ,
				value1: offerID
			});

			var mParameters = {
				filters: [oOfferIdFilter],
				urlParameters: {
					$expand: "FreeGoodsOther"
				}
			};


			return this.odata(sPath).get(mParameters);
		},

		getFinancialProduct: function(offerID, countryCode, productCode){
			var sPath = "/ProductPricingView";
			let aFilters = [];

			var oOfferIdFilter = new Filter({
				path: 'OfferID',
				operator: FilterOperator.EQ,
				value1: offerID
			});

			aFilters.push(oOfferIdFilter);

			if(countryCode){
				var oCountryCodeFilter = new Filter({
					path: 'CountryCode',
					operator: FilterOperator.EQ,
					value1: countryCode
				});
				aFilters.push(oCountryCodeFilter);
			}

			if(productCode){
				var oProductCodeFilter = new Filter({
					path: 'ProductCode',
					operator: FilterOperator.EQ,
					value1: productCode
				});
				aFilters.push(oProductCodeFilter);
			}

			var mParameters = {
				filters: aFilters,
				urlParameters: {
					$expand: "FreeGoodsOther"
				}
			};


			return this.odata(sPath).get(mParameters);
		},

		getCountryBrandProducts: function(CountryCode){
			var sPath = "/CountryBrandProducts";

			var oCountryFilter = new Filter({
				path: 'COUNTRY_CODE',
				operator: FilterOperator.EQ,
				value1: CountryCode
			});

			var mParameters = {
				filters: [oCountryFilter]
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
				ProductCode: oProductToSave.ProductCode,
                LotID: oProductToSave.LotID
			});

			//Update
			return that.odata(sPath).put(oProductToSave);

		},

        // update Country Product Pack
        updateCountryProductPack: function (countryProductPack) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of product
			var sPath = oModel.createKey("/PT_TMCTPRDPCK", {
				PRODUCTPACKID: countryProductPack.PRODUCTPACKID,
				COUNTRYCODE: countryProductPack.COUNTRYCODE
			});

            delete countryProductPack["PRODUCTPACKID"];
            delete countryProductPack["COUNTRYCODE"];
            delete countryProductPack["ACTIVERECORD"];
            delete countryProductPack["COGS"];
            delete countryProductPack["Country"];
            delete countryProductPack["Origin"];
            delete countryProductPack["ProductPack"];


			return this.odata(sPath).put(countryProductPack);

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
				ProductCode: oProductToRemove.ProductCode,
                LotID: oProductToRemove.LotID
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
            oProductToSave.AnticipatedRequestedQuantity = oProductSaveInfo.AnticipatedRequestedQuantity;
            oProductToSave.MaxPrice = oProductSaveInfo.MaxPrice;
            oProductToSave.LotID = oProductSaveInfo.LotID;
            oProductToSave.Channel = oProductSaveInfo.Channel;

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
                APPEAL: null,
                INFONEEDED: null,                                                
				_sOperation: "POST"
			};

			return oProductResult;
		}
	});
	return ProductService;
});