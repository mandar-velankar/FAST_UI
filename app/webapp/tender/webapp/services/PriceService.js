sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo"
], function (BaseService, Services, MomentJS, UserInfo) {
	"use strict";

	var PriceService = BaseService.extend("FAST_NS0FAST0.services.PriceService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create new product
		createPrice: function (oPriceToSave) {

			//that is this
			var that = this;

			//path of offer that is selected
			var sPath = "/PT_TMBDPR";

			//Create
			return that.odata(sPath).post(oPriceToSave);

		},

		createProductPrice: function(oProductPrice){
			var that = this;
			var sPath = "/ProductPricing";

			//create
			return that.odata(sPath).post(oProductPrice);
		},

		//create new product
		updatePrice: function (oPriceToSave) {

			//that is this
			var that = this;

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of price
			var sPath = oModel.createKey("/PT_TMBDPR", {
				OfferID: oPriceToSave.OfferID,
				ProductCode: oPriceToSave.ProductCode,
				Active: oPriceToSave.Active,
				ActiveTier: oPriceToSave.ActiveTier
			});

			//Create
			return that.odata(sPath).put(oPriceToSave);

		},

		updateProductPrice: function(oProductPrice){
			var that = this;

			//get model for calls
			var oModel = Services.getDefaultModel();

			var sPath = oModel.createKey("/ProductPricing", {
				ID: oProductPrice.ID,
				OfferID: oProductPrice.OfferID,
				ProductCode: oProductPrice.ProductCode,
				CountryCode: oProductPrice.CountryCode
			});

			//update
			return that.odata(sPath).put(oProductPrice);
		},

		/**
		 * Save product price detirmines what needs to be done
		 * @param {object} oProductPrice product price to save
		 * @returns {object} returns 
		 */
		saveProductPrice: function(oProductPrice){

			//is the ID filled (= already saved)
			if(oProductPrice.ID){
	
				return this.updateProductPrice(oProductPrice);

			}else{

				return this.createProductPrice(oProductPrice);

			}

		},

		//Convert Price info to save in the database. (View binding is an extended version)
		getConvertProductPriceToSave: function (oProductPriceSaveInfo) {

			//Convert odata to structure that can be used to save
			var oProductPriceToSave = {};

    		//TODO FreeGoodsOther: Association to FreeGoodsOther;

			//If ID is not existing do not store in object to create
			if(oProductPriceSaveInfo.ID){
				oProductPriceToSave.ID = oProductPriceSaveInfo.ID;
			}
			oProductPriceToSave.OfferID = oProductPriceSaveInfo.OfferID;
			oProductPriceToSave.ProductCode = oProductPriceSaveInfo.ProductCode;
			oProductPriceToSave.CountryCode = oProductPriceSaveInfo.CountryCode;
			oProductPriceToSave.Warranty = (oProductPriceSaveInfo.Warranty === null) ? null : oProductPriceSaveInfo.Warranty.toString();
			oProductPriceToSave.AgreementDuration = Number(oProductPriceSaveInfo.AgreementDuration);
			oProductPriceToSave.MonthlyRent = (oProductPriceSaveInfo.MonthlyRent === null) ? null : oProductPriceSaveInfo.MonthlyRent.toString();
			oProductPriceToSave.MonthsPerInvoice = Number(oProductPriceSaveInfo.MonthsPerInvoice);
			oProductPriceToSave.ContractStartDate = moment().utc().toDate();
			oProductPriceToSave.ValueOfDevices = (oProductPriceSaveInfo.ValueOfDevices === null) ? null : oProductPriceSaveInfo.ValueOfDevices.toString();
			oProductPriceToSave.StatusOfDevice = (oProductPriceSaveInfo.StatusOfDevice === null) ? null : oProductPriceSaveInfo.StatusOfDevice.toString();
			oProductPriceToSave.FreeGoodsSame = (oProductPriceSaveInfo.FreeGoodsSame === null) ? null : oProductPriceSaveInfo.FreeGoodsSame.toString();
			oProductPriceToSave.FreeGoodsSame_ABS_PCT = oProductPriceSaveInfo.FreeGoodsSame_ABS_PCT;
			oProductPriceToSave.MinContractual = (oProductPriceSaveInfo.MinContractual === null) ? null : oProductPriceSaveInfo.MinContractual.toString();
			oProductPriceToSave.MinAnnPurch = (oProductPriceSaveInfo.MinAnnPurch === null) ? null : oProductPriceSaveInfo.MinAnnPurch.toString();
			oProductPriceToSave.AdditionalDiscount = (oProductPriceSaveInfo.AdditionalDiscount === null) ? null : oProductPriceSaveInfo.AdditionalDiscount.toString();
			oProductPriceToSave.FOC_ABS_PCT = (oProductPriceSaveInfo.FOC_ABS_PCT === null) ? null : oProductPriceSaveInfo.FOC_ABS_PCT.toString();

			return oProductPriceToSave;

		},
		
		//Convert Price info to save in the database. (View binding is an extended version)
		getConvertPriceToSave: function (oPriceSaveInfo) {

			//Convert odata to structure that can be used to save
			var oPriceToSave = {};

			//Lets be sure that the offerID of the product matches the offerID of the Offer
			//Reason only on saving we are sure that the Sellingcompany is defined
			//and after saving it should always be the same as the offer
			var oOfferSaveInfo = Services.getOfferSaveInfo();
			if (oOfferSaveInfo.OfferID) {
				var sOfferID = oOfferSaveInfo.OfferID;
			} else {
				sOfferID = oPriceSaveInfo.OfferID;
			}
			
			oPriceToSave.TenderID = oPriceSaveInfo.TenderID;
			oPriceToSave.OfferID = sOfferID;
			oPriceToSave.CountryCode = oPriceSaveInfo.CountryCode;
			oPriceToSave.ProductCode = oPriceSaveInfo.ProductCode;
			oPriceToSave.SubmittedOn = moment().utc().toDate();
			oPriceToSave.SubmittedBy = UserInfo.getCWID();
			oPriceToSave.Active = Number(oPriceSaveInfo.Active);
			oPriceToSave.Tier = Number(oPriceSaveInfo.Tier);
			oPriceToSave.VolumeFrom = Number(oPriceSaveInfo.VolumeFrom);
			oPriceToSave.VolumeTo = Number(oPriceSaveInfo.VolumeTo);			
			oPriceToSave.RegPrice = (oPriceSaveInfo.RegPrice === null) ? null : oPriceSaveInfo.RegPrice.toString();
			oPriceToSave.FOC = (oPriceSaveInfo.FOC === null) ? null : oPriceSaveInfo.FOC.toString();
			oPriceToSave.FOCType = oPriceSaveInfo.FOCType;
			oPriceToSave.Discount = (oPriceSaveInfo.Discount === null) ? null : oPriceSaveInfo.Discount.toString();
			oPriceToSave.OfferPrice = (oPriceSaveInfo.OfferPrice === null) ? null : oPriceSaveInfo.OfferPrice.toString();
			oPriceToSave.Deductions = (oPriceSaveInfo.Deductions === null) ? null : oPriceSaveInfo.Deductions.toString();
			oPriceToSave.StandardDiscount = (oPriceSaveInfo.StandardDiscount === null) ? null : oPriceSaveInfo.StandardDiscount.toString();
			oPriceToSave.AdditionalDiscount = (oPriceSaveInfo.AdditionalDiscount === null) ? null : oPriceSaveInfo.AdditionalDiscount.toString();
			oPriceToSave.NetofferPrice = (oPriceSaveInfo.NetofferPrice === null) ? null : oPriceSaveInfo.NetofferPrice.toString();
			oPriceToSave.BusinessCasePrice = (oPriceSaveInfo.BusinessCasePrice === null) ? null : oPriceSaveInfo.BusinessCasePrice.toString();
			oPriceToSave.WholesalePrice = oPriceSaveInfo.WholesalePrice;
			oPriceToSave.COGS = (oPriceSaveInfo.COGS === null) ? null : oPriceSaveInfo.COGS.toString();
			oPriceToSave.SpotRate = (oPriceSaveInfo.SpotRate === null) ? null : oPriceSaveInfo.SpotRate.toString();
			oPriceToSave.BudgetRate = (oPriceSaveInfo.BudgetRate === null) ? null : oPriceSaveInfo.BudgetRate.toString();
			oPriceToSave.Scenario = Number(oPriceSaveInfo.Scenario);
			oPriceToSave.FOC_ABS_PCT = oPriceSaveInfo.FOC_ABS_PCT;
			oPriceToSave.FOC_Bundled_1 = (oPriceSaveInfo.FOC_Bundled_1 === null) ? null : oPriceSaveInfo.FOC_Bundled_1.toString();
			oPriceToSave.FOC_ABS_PCT_Bundled_1 = oPriceSaveInfo.FOC_ABS_PCT_Bundled_1;
			oPriceToSave.FOCProduct_Bundled_1 = Number(oPriceSaveInfo.FOCProduct_Bundled_1);
			oPriceToSave.ActiveTier = Number(oPriceSaveInfo.ActiveTier);
			oPriceToSave.NetPrice = (oPriceSaveInfo.NetPrice === null) ? null : oPriceSaveInfo.NetPrice.toString();
			oPriceToSave.NetPrice_OfPaid = (oPriceSaveInfo.NetPrice_OfPaid === null) ? null : oPriceSaveInfo.NetPrice_OfPaid.toString();
			oPriceToSave.PRICE_UPDATE = Number(oPriceSaveInfo.PRICE_UPDATE);

			if(oPriceSaveInfo.ID) {
				oPriceToSave.ID = oPriceSaveInfo.ID;
			}

			return oPriceToSave;

		}
	});
	return PriceService;
});