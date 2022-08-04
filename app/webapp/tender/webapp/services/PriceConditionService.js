sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, MomentJS, UserInfo, Filter, FilterOperator) {
	"use strict";

	return BaseService.extend("FAST_NS0FAST0.services.PriceConditionService", {

		constructor: function (model) {
			BaseService.call(this, model);
		},
		

        getPriceCondition: function(filter){
            
			let aFilters = [];

			aFilters.push(new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: filter.CountryCode
			}));

			aFilters.push(new Filter({
				path: 'OfferID',
				operator: FilterOperator.EQ,
				value1: filter.OfferID
			}));

            aFilters.push(new Filter({
				path: 'ProductCode',
				operator: FilterOperator.EQ,
				value1: filter.ProductCode
			}));

            

			var mParameters = {
				filters: aFilters,
				urlParameters: {
					$expand: "DiscountCondition,PriceConditionClassification"
				}
			};


			return this.odata("/PriceCondition").get(mParameters);
		},

        getRoyalDecree: function(productPackID){
            
			let aFilters = [];

			aFilters.push(new Filter({
				path: 'ProductPackID',
				operator: FilterOperator.EQ,
				value1: productPackID
			}));

            // for info see https://trello.com/c/Wn9WZJfO/2439-foc-pop-up-adjustment
			// aFilters.push(new Filter({
			// 	path: 'CustomerGroup',
			// 	operator: FilterOperator.EQ,
			// 	value1: customerGroup
			// }));

            aFilters.push(new Filter({
				path: 'ValidTo',
				operator: FilterOperator.EQ,
				value1: '9999-12-31'
			}));

			var mParameters = {
				filters: aFilters,
			};


			return this.odata("/RoyalDecreePercentage").get(mParameters);
		},

		createPriceCondition: function (oPriceCondition) {
			return this.odata("/PriceCondition").post(oPriceCondition);
		},

		updatePriceCondition: function (oPriceCondition) {
			const oModel = Services.getDefaultModel();
			const sPath = oModel.createKey("/PriceCondition", {
				ID: oPriceCondition.ID
			});

			return this.odata(sPath).put(oPriceCondition);
		},

        upsertPriceCondition: function(oPriceCondition){

            if(oPriceCondition.ID){
                return this.updatePriceCondition(oPriceCondition);
            }

            return this.createPriceCondition(oPriceCondition);

            // let sPath = "/PriceCondition";
            // if(oPriceCondition.ID){
            //     sPath = oModel.createKey("/PriceCondition", {
            //         ID: oPriceCondition.ID
            //     });
            // }
			// return this.odata(sPath).put(oPriceCondition);
        },

        deletePriceCondition: function (oPriceCondition) {
            const oModel = Services.getDefaultModel();
			const sPath = oModel.createKey("/PriceCondition", {
				ID: oPriceCondition.ID
			});
			return this.odata(sPath).delete();
		},

        convertToSaveObject: function(oPriceConditionViewObject,tab){
            let priceConditionCode;         
            let convertedPVL;
            let convertedConfPrice;
            if(tab === "PA"){
                convertedPVL = oPriceConditionViewObject.PVL;
                convertedConfPrice = oPriceConditionViewObject.ConfidentialPrice;
            } else {
                switch(oPriceConditionViewObject.ConditionType) {
                    case "Precio Neto":
                        priceConditionCode = "YLTF";
                        if(oPriceConditionViewObject.RoyalDecree === "Yes" && !oPriceConditionViewObject.RoyalDecreeIncl){
                            priceConditionCode = "YLTP";
                        }
                        break;
                    case "Descuento Comercial":
                        priceConditionCode = "YL60";
                        break;
                    case "Descuento Especial":
                        priceConditionCode = "YDC0";
                        break;
                    case "Rappel":
                        priceConditionCode = "YAW1";
                        break;
                    case "FOC":
                        priceConditionCode = "YA01";
                        break;
                    default:
                        oPriceConditionViewObject.PriceConditionCode && (priceConditionCode = oPriceConditionViewObject.PriceConditionCode) ||  (priceConditionCode = ""); // used when creating continued/revised offer
                }

                oPriceConditionViewObject.PriceConditionCode = priceConditionCode;

                let instType = Services.getFastAppDataModel().getData().Tender.Institute.InstituteType;
                let packFactor =  Services.getFastAppDataModel().getData()?.ProductPricingView?.[0].PACKFACTOR;
                let UOM = Services.getFastAppDataModel().getData()?.ProductPricingView?.[0].UOM;

                if(UOM === "Unit"){
                    convertedPVL = oPriceConditionViewObject.PVL / packFactor;
                    convertedConfPrice = oPriceConditionViewObject.YLAP / packFactor;
                } else {
                    convertedPVL = oPriceConditionViewObject.PVL;
                    convertedConfPrice = oPriceConditionViewObject.YLAP;
                }

                if(instType === "Private Account"){
                    convertedConfPrice = null;
                    
                } 
            }
                      
            let obj = {
                "CountryCode": oPriceConditionViewObject.CountryCode,
                "OfferID": oPriceConditionViewObject.OfferID,
                "ProductCode": oPriceConditionViewObject.ProductCode,
                "PVL": convertedPVL,
                "ConfidentialPrice":  convertedConfPrice || oPriceConditionViewObject.ConfidentialPrice, // oPriceConditionViewObject.ConfidentialPrice used when creating continued/revised offer
                "Discount": oPriceConditionViewObject.Discount,
                "RoyalDecree": oPriceConditionViewObject.RoyalDecree,
                "RoyalDecreeValue": oPriceConditionViewObject.RoyalDecreeValue,
                "RoyalDecreeIncl": oPriceConditionViewObject.RoyalDecreeIncl,
                "StandardDiscount": oPriceConditionViewObject.StandardDiscount,
                "AdditionalDiscount": oPriceConditionViewObject.AdditionalDiscount,
                "NetPriceWithoutTaxBeforeDeductionRD": oPriceConditionViewObject.NetPriceWithoutTaxBeforeDeductionRD,
                "NetPriceWithoutTaxAfterDeductionRD": oPriceConditionViewObject.NetPriceWithoutTaxAfterDeductionRD,
                "NetPriceWithTaxAfterDeductionRD": oPriceConditionViewObject.NetPriceWithTaxAfterDeductionRD,
                "NetPriceWithoutTax": oPriceConditionViewObject.NetPriceWithoutTax,
                "NetPriceWithTax": oPriceConditionViewObject.NetPriceWithTax,
                "MaximumPrice": oPriceConditionViewObject.MaximumPrice,
                "Tax": oPriceConditionViewObject.Tax,
                "Liquidation": oPriceConditionViewObject.Liquidation,
                "RefundDate": oPriceConditionViewObject.RefundDate,
                "PriceConditionCode": oPriceConditionViewObject.PriceConditionCode,
                "MonthlyRentPerUnit":oPriceConditionViewObject.MonthlyRentPerUnit,
                "AnnualValue": oPriceConditionViewObject.AnnualValue,
                "PriceConditionClassification_ID": oPriceConditionViewObject.PriceConditionClassification_ID,
                "PriceAgreement_ID": oPriceConditionViewObject.PriceAgreement_ID,
                "DiscountCondition": tab === "PA" ? oPriceConditionViewObject.DiscountConditions : this.convertToDiscountConditions(oPriceConditionViewObject.DiscountConditions),
                "FreeGoodsOther": tab === "PA" ? oPriceConditionViewObject.FreeGoodsOther : this.convertToFreeGood(oPriceConditionViewObject.FreeGoodsOther),
                "ReferencePriceAgreement": oPriceConditionViewObject.ReferencePriceAgreement,
                "Settlement_ID":oPriceConditionViewObject.Settlement_ID
            }
            
            // add the ID if it exists
            // depending on the use case, the ID or the ExistingPriceConditionID will exist in the oPriceConditionViewObject
            // here we make sure to use that ID
            if(oPriceConditionViewObject.ID){
                obj = {
                    "ID": oPriceConditionViewObject.ID,
                    ...obj
                }
            }

            if(oPriceConditionViewObject.ExistingPriceConditionID){
                obj = {
                    "ID": oPriceConditionViewObject.ExistingPriceConditionID,
                    ...obj
                }
            }

            return obj;

        },

        convertToDiscountConditions: function(aDiscountCondition){

            if(aDiscountCondition && Array.isArray(aDiscountCondition)){
                return aDiscountCondition.map(condition => {
                    delete condition['Tax'];
                    return condition;
                });
            }

            return null;

        },

        convertToFreeGood: function(aFreeGoodsOther){

            if(aFreeGoodsOther && Array.isArray(aFreeGoodsOther)){
                return aFreeGoodsOther.map(freegood => {
                    delete freegood['FOCBonusValueState'];
                    delete freegood['FreeGoodsOtherFOCMinAmountValueState'];
                    delete freegood['ProductName'];
                    return freegood;
                });
            }

            return null;

        },


        getPriceConditionClassification: function(filter){
            
			let aFilters = [];

			aFilters.push(new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: filter.CountryCode
			}));

			aFilters.push(new Filter({
				path: 'Classification',
				operator: FilterOperator.EQ,
				value1: filter.Classification
			}));

            aFilters.push(new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: filter.Division
			}));
            
            if(filter.ProductTypes && Array.isArray(filter.ProductTypes)){
                const orFilters = filter.ProductTypes.map(type => new Filter("ProductType", sap.ui.model.FilterOperator.EQ, type));
                aFilters.push(new Filter(orFilters, false));
            }
            
            if(filter.isMain){
                aFilters.push(new Filter({
                    path: 'isMain',
                    operator: FilterOperator.EQ,
                    value1: filter.isMain
                }));
            }
            

			var mParameters = {
				filters: aFilters
			};


			return this.odata("/PriceConditionClassification").get(mParameters);
		},

        getPriceConditionView: function(filter){
            
			let aFilters = [];

			aFilters.push(new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: filter.CountryCode
			}));

			aFilters.push(new Filter({
				path: 'Classification',
				operator: FilterOperator.EQ,
				value1: filter.Classification
			}));

            aFilters.push(new Filter({
				path: 'Division',
				operator: FilterOperator.EQ,
				value1: filter.Division
			}));

            if(filter.ProductCode){
                aFilters.push(new Filter({
                    path: 'ProductCode',
                    operator: FilterOperator.EQ,
                    value1: filter.ProductCode
                }));
            }
            
            if(filter.OfferID){
                aFilters.push(new Filter({
                    path: 'OfferID',
                    operator: FilterOperator.EQ,
                    value1: filter.OfferID
                }));
            }

			var mParameters = {
				filters: aFilters
			};


			return this.odata("/PriceConditionView").get(mParameters);
		},


        getDiscountConditions: function(filter){
            
			let aFilters = [];

            if(filter.PriceConditionID){
                aFilters.push(new Filter({
                    path: 'PriceCondition_ID',
                    operator: FilterOperator.EQ,
                    value1: filter.PriceConditionID
                }));
            }

			var mParameters = {
				filters: aFilters
			};


			return this.odata("/DiscountCondition").get(mParameters);
		},

        getFocs: function(filter){
            
			let aFilters = [];

            if(filter.PriceConditionID){
                aFilters.push(new Filter({
                    path: 'PriceCondition_ID',
                    operator: FilterOperator.EQ,
                    value1: filter.PriceConditionID
                }));
            }

			var mParameters = {
				filters: aFilters
			};


			return this.odata("/FreeGoodsOther").get(mParameters);
		},
		
	});
});