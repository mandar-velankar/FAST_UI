/* global moment:true */
sap.ui.define([
	"sap/ui/base/Object"
], function (Object) {
	"use strict";
	
	var Financial = Object.extend("FAST_NS0FAST0.model.financial", {
		
		//CONSTRUCTOR
		//-----------
				constructor: function () {
					//one model for doing calls to the back-end
					//this._oFastDataCalls = new sap.ui.model.odata.ODataModel(this._oServices.getConnectionString());
				},
				
		//GENERAL
		//-------
		
			//Local Variable
			//--------------
			
			_oServices : {}	,
		
		//GETTERS
		//-------

				//TODO: talk about better solution with Wouter
				//instead of defining "FAST_NS0FAST0/model/services" on top of this file, we set is as object
				getServices: function (){
					return this._oServices;
				},
				
		//SETTERS
		//-------
		
				//TODO: talk about better solution with Wouter
				//instead of defining "FAST_NS0FAST0/model/services" on top of this file, we set is as object
				setServices: function (oServices){
					this._oServices = oServices;
				},
				
		//LOADERS
		//-------
				
				//load Price of product again from database
				loadProductPrice: function (sOfferID, sProductCode, sActive, sActiveTier, sLotID){
					
					//Rates for country from offer currency to EUR
					var sPath = "/PT_TMBDPR(OfferID='" + sOfferID + "',ProductCode=" + sProductCode + ",Active=" + sActive + ",ActiveTier=" + sActiveTier + ",LotID=" + sLotID + "  )";

					var oDeferred = $.Deferred();
					var that = this;
							
					//get fast data calls
					var oFastDataCalls = that._oServices.getDefaultModel();
			
					oFastDataCalls.read(sPath, {
						success: function (oData, oResponse) {
							
							//let the callback be triggered
							oDeferred.resolve(oData);
							
						},
						error: function (oError) {
							//resolve, beceause we check on false to continue in correct way, if no results found
							oDeferred.resolve(false);
						}
					});
							
					//return promise so the function can check if execution is done
					return oDeferred.promise();
					
				},
		
		//CHECKERS
		//--------
				doubleComparison: function(sOriginalPrice, sNewPrice){
					var thresholdDouble = 0.000001;
					if ( (Math.abs(sNewPrice - sOriginalPrice) < thresholdDouble) ){
						return true;
					} else{
						return false;
					}
				},
				
				floatComparison: function(sValueX, sValueY){
					if( Math.round(parseFloat(Number(sValueX))) * 10000000 === Math.round(parseFloat(Number(sValueY))) * 10000000 ){
						return true;
					} else {
						return false;
					}
				},
		
				checkPriceUpdate: function(oOriginalPrices, oNewPrices){
					var that = this;
					if(
						(this.doubleComparison(oOriginalPrices.RegPrice, oNewPrices.RegPrice))/* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						&& oOriginalPrices.FOCType === oNewPrices.FOCType
						&& oOriginalPrices.FOC_ABS_PCT === oNewPrices.FOC_ABS_PCT
						//&& oOriginalPrices.FOC === oNewPrices.FOC
						&& this.floatComparison(oOriginalPrices.FOC, oNewPrices.FOC)/* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						//&& oOriginalPrices.FOCProduct_Bundled_1 === oNewPrices.FOCProduct_Bundled_1
						&& this.floatComparison(oOriginalPrices.FOCProduct_Bundled_1, oNewPrices.FOCProduct_Bundled_1)/* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						&& oOriginalPrices.FOC_ABS_PCT_Bundled_1 === oNewPrices.FOC_ABS_PCT_Bundled_1
						&& Number(oOriginalPrices.FOC_Bundled_1) === Number(oNewPrices.FOC_Bundled_1)
						&& oNewPrices.OfferPrice >= oOriginalPrices.OfferPrice /* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						&& Number(oOriginalPrices.Deductions) === Number(oNewPrices.Deductions) /* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						&& oNewPrices.NetofferPrice >= oOriginalPrices.NetofferPrice
						//&& oOriginalPrices.WholesalePrice === oNewPrices.WholesalePrice
						&& this.floatComparison(oOriginalPrices.WholesalePrice, oNewPrices.WholesalePrice)/* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						//&& oOriginalPrices.COGS === Number(oNewPrices.COGS)
						&& this.floatComparison(oOriginalPrices.COGS, oNewPrices.COGS)/* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						//&& oOriginalPrices.SpotRate === oNewPrices.SpotRate
						&& this.floatComparison(oOriginalPrices.SpotRate, oNewPrices.SpotRate)/* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						//&& oOriginalPrices.BudgetRate === oNewPrices.BudgetRate
						&& this.floatComparison(oOriginalPrices.BudgetRate, oNewPrices.BudgetRate)/* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						&& oOriginalPrices.Deductions_ABS_PCT=== oNewPrices.Deductions_ABS_PCT
						&& oNewPrices.NetPrice >= oOriginalPrices.NetPrice /* 05.03.2020 - https://trello.com/c/5kKb4VhF */
						&& oNewPrices.NetPrice_OfPaid >= oOriginalPrices.NetPrice_OfPaid /* 05.03.2020 - https://trello.com/c/5kKb4VhF */
					){
						//if price is the same (nothing changed for the prices)
						//we keep the same price update (this should be set to 0 after approval in workflow)
						//beceause you can do a change on a price, then do again a change on a price, then send for approval again
						//then do a change again after approval, if approval doesn't reset this field to 0 this wil be kept as a change
						oNewPrices.PRICE_UPDATE = oOriginalPrices.PRICE_UPDATE;
					}else{
						//if prices have changed, we take the current value
						var iApprovals_sent = that._oServices.getFastAppDataModel().getProperty("/EditOffer/APPROVALS_SENT");
						oNewPrices.PRICE_UPDATE = iApprovals_sent;
					}
					
					return oNewPrices.PRICE_UPDATE;
				},

				checkFOCUpdate: function(oOriginalPrices, oNewPrices, oProduct){
					var that = this;
					let FOCUpdate = 0;
					if(
						oOriginalPrices.FOCType === oNewPrices.FOCType
						&& oOriginalPrices.FOC_ABS_PCT === oNewPrices.FOC_ABS_PCT
						&& this.floatComparison(oOriginalPrices.FOC, oNewPrices.FOC)
						&& this.floatComparison(oOriginalPrices.FOCProduct_Bundled_1, oNewPrices.FOCProduct_Bundled_1)
						&& oOriginalPrices.FOC_ABS_PCT_Bundled_1 === oNewPrices.FOC_ABS_PCT_Bundled_1
						&& Number(oOriginalPrices.FOC_Bundled_1) === Number(oNewPrices.FOC_Bundled_1)
					){
						FOCUpdate = oProduct.MEAApprovalUpdatedFields_FOC;
					}else{
						//if prices have changed, we take the current value
						var iApprovals_sent = that._oServices.getFastAppDataModel().getProperty("/EditOffer/APPROVALS_SENT");
						FOCUpdate = iApprovals_sent;
					}
					
					return FOCUpdate;
				},

				checkPriceDeductionsUpdate: function(oOriginalPrices, oNewPrices, oProduct){
					var iApprovals_sent = this._oServices.getFastAppDataModel().getProperty("/EditOffer/APPROVALS_SENT");

					const MEAApprovalUpdatedFields = {
						Price: oNewPrices.OfferPrice >= oOriginalPrices.OfferPrice  ? oProduct.MEAApprovalUpdatedFields_Price : iApprovals_sent,
						Deductions: Number(oOriginalPrices.Deductions) === Number(oNewPrices.Deductions) ? oProduct.MEAApprovalUpdatedFields_Deductions : iApprovals_sent,

					}
					return MEAApprovalUpdatedFields;
				},

				checkMEAProductPriceFOCUpdate: function (oOriginalPrices, oNewPrices, oProduct) {
					let result = oProduct.hasUpdatedSupplyPaymentPriceValues;
					if (
						oOriginalPrices.FOCType === oNewPrices.FOCType
						&& oOriginalPrices.FOC_ABS_PCT === oNewPrices.FOC_ABS_PCT
						&& this.floatComparison(oOriginalPrices.FOC, oNewPrices.FOC)
						&& this.floatComparison(oOriginalPrices.FOCProduct_Bundled_1, oNewPrices.FOCProduct_Bundled_1)
						&& oOriginalPrices.FOC_ABS_PCT_Bundled_1 === oNewPrices.FOC_ABS_PCT_Bundled_1
						&& Number(oOriginalPrices.FOC_Bundled_1) === Number(oNewPrices.FOC_Bundled_1)
						&& oNewPrices.OfferPrice >= oOriginalPrices.OfferPrice
						&& Number(oOriginalPrices.Deductions) === Number(oNewPrices.Deductions)
					) {
						result = false;
					} else {
						result = true;
					}

					return result;
				},
				
				//check if all product prices are set for offer
				checkAllProductPricesSet: function (oOffer){
					
					var _allProductPricesSet = true;
					var aProducts = [];
					
					//if products exist for offer
					if(oOffer && oOffer.Product && oOffer.Product.results){
						
						//products
						aProducts = oOffer.Product.results;
						
						// For Brazil we don't show declined products in Financial Offer page
						// In that case we are not able to create pricecondtion for declined product
						// this filter is needed in order to check prices of the products which channel is not Decline 
						if (oOffer.CountryCode === "BR") {
							aProducts = aProducts.filter(prod => prod.ActiveProduct == 1);
							if (aProducts.length == 0) {
								_allProductPricesSet = false;
							}
						}

						//check for each product
						aProducts.forEach(function (oProduct) {
							
							//product active? (not active, = no prices to check)
							if (oProduct.ActiveProduct !== 2 && _allProductPricesSet){
								
								//check if price is set, if price is not set for 1 product, return false
								//if 1 false, all false
								//bAllPricesSet = bAllPricesSet && oProduct.Price;
                                
								if(oProduct.Price === null || oProduct.Price === undefined || oProduct.Price.NetPrice === 0 ){
									_allProductPricesSet = false;
								}
                                
							}
							
						});
						
					}else{
						_allProductPricesSet = false;	
					}

					return _allProductPricesSet;
					
				}
	                  
		//SAVERS
		//------		
				
			
	});
	return new Financial();
});