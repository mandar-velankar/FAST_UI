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

		createProductPrice: function (oProductPrice) {
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
				LotID: oPriceToSave.LotID,
				ProductCode: oPriceToSave.ProductCode,
				Active: oPriceToSave.Active,
				ActiveTier: oPriceToSave.ActiveTier
			});

			//Create
			return that.odata(sPath).put(oPriceToSave);

		},

		updateProductPrice: function (oProductPrice) {
			var that = this;

			//get model for calls
			var oModel = Services.getDefaultModel();

			var sPath = oModel.createKey("/ProductPricing", {
				ID: oProductPrice.ID,
				OfferID: oProductPrice.OfferID,
				LotID: oProductPrice.LotID,
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
		saveProductPrice: function (oProductPrice) {

			//is the ID filled (= already saved)
			if (oProductPrice.ID) {

				return this.updateProductPrice(oProductPrice);

			} else {

				return this.createProductPrice(oProductPrice);

			}

		},

		//Convert Price info to save in the database. (View binding is an extended version)
		getConvertProductPriceToSave: function (oProductPriceSaveInfo) {

			//Convert odata to structure that can be used to save
			var oProductPriceToSave = {};

			//If ID is not existing do not store in object to create
			if (oProductPriceSaveInfo.ID) {
				oProductPriceToSave.ID = oProductPriceSaveInfo.ID;
			}
			oProductPriceToSave.OfferID = oProductPriceSaveInfo.OfferID;
			oProductPriceToSave.ProductCode = oProductPriceSaveInfo.ProductCode;
			oProductPriceToSave.CountryCode = oProductPriceSaveInfo.CountryCode;
			oProductPriceToSave.Warranty = Number(oProductPriceSaveInfo.Warranty);
			oProductPriceToSave.AgreementDuration = Number(oProductPriceSaveInfo.AgreementDuration);
			oProductPriceToSave.MonthlyRent = (oProductPriceSaveInfo.MonthlyRent === null) ? null : oProductPriceSaveInfo.MonthlyRent.toString();
			oProductPriceToSave.MonthsPerInvoice = Number(oProductPriceSaveInfo.MonthsPerInvoice);
			oProductPriceToSave.ContractStartDate = oProductPriceSaveInfo.ContractStartDate;
			oProductPriceToSave.ValueOfDevices = (oProductPriceSaveInfo.ValueOfDevices === null) ? null : oProductPriceSaveInfo.ValueOfDevices.toString();
			oProductPriceToSave.StatusOfDevice = (oProductPriceSaveInfo.StatusOfDevice === null) ? null : oProductPriceSaveInfo.StatusOfDevice.toString();
			oProductPriceToSave.MinContractual = (oProductPriceSaveInfo.MinContractual === null) ? null : oProductPriceSaveInfo.MinContractual.toString();
			oProductPriceToSave.MinAnnPurch = (oProductPriceSaveInfo.MinAnnPurch === null) ? null : oProductPriceSaveInfo.MinAnnPurch.toString();
			oProductPriceToSave.LotID = oProductPriceSaveInfo.LotID;

			if (oProductPriceSaveInfo.FreeGoodsOther) {
				oProductPriceToSave.FreeGoodsOther = oProductPriceSaveInfo.FreeGoodsOther.map(freeGoodsOther => ({
					ProductPackId: freeGoodsOther.ProductPackId,
					FreeGoodsOther_ABS_PCT: freeGoodsOther.FreeGoodsOther_ABS_PCT,
					FreeGoodsOther: freeGoodsOther.FreeGoodsOther,
					FreeGoodsOther_Step: freeGoodsOther.FreeGoodsOther_Step,
					VAT: freeGoodsOther.VAT
				}));
			}

			return oProductPriceToSave;

		},

		validateProductPriceToSave: function (sOfferType, oPriceSaveInfo, sProductType, sFocAbsPct, sNetOfferPrice) {
			let aInvalidFields = [];
			var drug = false;
			if (sProductType === "Drug") {
				drug = true;
			}
			switch (sOfferType) {
				case 'Selling':
					this.validateProductPriceSelling(oPriceSaveInfo, aInvalidFields, drug, sFocAbsPct, sNetOfferPrice);
					break;
				case 'Rental':
					this.validateProductPriceRental(oPriceSaveInfo, aInvalidFields);
					break;
				case 'Comodato':
					this.validateProductPriceComodato(oPriceSaveInfo, aInvalidFields);
					break;
				default:
					break;
			}

			return aInvalidFields;
		},

		validateMonthlyFieldData: function (sOfferType, oPriceSaveInfo, sProductType){
			let aInvalidFields = [];
			var drug = false;
			if (sProductType === "Drug") {
				drug = true;
			}
			switch (sOfferType) {
				case 'Selling':
					this.validateProductPriceSellingMonths(oPriceSaveInfo, aInvalidFields, drug);
					break;
				case 'Rental':
					this.validateProductPriceRentalMonths(oPriceSaveInfo, aInvalidFields);
					break;
				case 'Comodato':
					this.validateProductPriceComodatoMonths(oPriceSaveInfo, aInvalidFields);
					break;
				default:
					break;
			}

			return aInvalidFields;
		},
//EHQUT-OTT-175585-Status of device" field not mandatory for Radiology
		validateProductPriceSelling: function (oPriceSaveInfo, aInvalidFields, drug, sFocAbsPct, sNetOfferPrice) {
			Object.keys(oPriceSaveInfo).forEach(e => {
				
				if (((e === 'Warranty') && !drug)
					&& (oPriceSaveInfo[e] === null || oPriceSaveInfo[e] === "")) {
					aInvalidFields.push(e);
				}
			});

			if(sNetOfferPrice === null || sNetOfferPrice === ""){
				aInvalidFields.push('NetOfferPrice');
			}
		},
//EHQUT-OTT-175585-Status of device" field not mandatory for Radiology
		validateProductPriceRental: function (oPriceSaveInfo, aInvalidFields) {
			Object.keys(oPriceSaveInfo).forEach(e => {
				if (( e === 'AgreementDuration' || e === 'MonthlyRent' || e === 'MonthsPerInvoice' || e === 'ContractStartDate' || e === 'ValueOfDevices'  || e === 'FOC' )
					&& (oPriceSaveInfo[e] === null || oPriceSaveInfo[e] === "")) {
					aInvalidFields.push(e);
				}
			});
		},
//EHQUT-OTT-175585-Status of device" field not mandatory for Radiology
		validateProductPriceComodato: function (oPriceSaveInfo, aInvalidFields) {
			Object.keys(oPriceSaveInfo).forEach(e => {
				if (( e === 'AgreementDuration' || e === 'MinContractual' || e === 'MinAnnPurch' || e === 'ContractStartDate' || e === 'ValueOfDevices' )
					&& (oPriceSaveInfo[e] === null || oPriceSaveInfo[e] === "")) {
					aInvalidFields.push(e);
				}
			});
		},

		validateProductPriceSellingMonths: function (oPriceSaveInfo, aInvalidFields, drug) {
			Object.keys(oPriceSaveInfo).forEach(e => {
				
				if ((e === 'Warranty' && !drug && oPriceSaveInfo[e] !== null && oPriceSaveInfo[e] !== ""  && (oPriceSaveInfo[e] - Math.floor(oPriceSaveInfo[e])) !== 0)) {
					aInvalidFields.push(e);
				}
			});
		},

		validateProductPriceRentalMonths: function (oPriceSaveInfo, aInvalidFields) {
			Object.keys(oPriceSaveInfo).forEach(e => {
				if ((e === 'AgreementDuration' || e === 'MonthsPerInvoice' || e === 'Warranty') && (oPriceSaveInfo[e] !== null && oPriceSaveInfo[e] !== "" && (oPriceSaveInfo[e] - Math.floor(oPriceSaveInfo[e])) !== 0)){
					aInvalidFields.push(e);
				}
			});
		},

		validateProductPriceComodatoMonths: function (oPriceSaveInfo, aInvalidFields) {
			Object.keys(oPriceSaveInfo).forEach(e => {
				if ((e === 'Warranty' || e === 'AgreementDuration' || e === 'MinContractual' ) && (oPriceSaveInfo[e] !== null && oPriceSaveInfo[e] !== "" && (oPriceSaveInfo[e] - Math.floor(oPriceSaveInfo[e])) !== 0)){
					aInvalidFields.push(e);
				}
			});
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
			oPriceToSave.FOCStep = (oPriceSaveInfo.FOCStep === undefined || oPriceSaveInfo.FOCStep === null) ? null : oPriceSaveInfo.FOCStep.toString();
			oPriceToSave.FOCType = oPriceSaveInfo.FOCType;
			oPriceToSave.Discount = oPriceSaveInfo.CountryCode === 'BR' ? (parseFloat(oPriceSaveInfo.AdditionalDiscount + oPriceSaveInfo.StandardDiscount)) : (oPriceSaveInfo.Discount === null) ? null : oPriceSaveInfo.Discount.toString();
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
			oPriceToSave.LotID = oPriceSaveInfo.LotID;
			oPriceToSave.Deductions_ABS_PCT=oPriceSaveInfo.Deductions_ABS_PCT;
			//EHQUT-196575- Thailand - Change Request - INC16653808 
			if (oPriceSaveInfo.ID) {
				oPriceToSave.ID = oPriceSaveInfo.ID;
			}

			return oPriceToSave;

		}
	});
	return PriceService;
});