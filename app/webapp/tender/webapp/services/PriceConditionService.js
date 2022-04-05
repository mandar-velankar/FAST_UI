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

        },

        convertToSaveObject: function(oPriceConditionViewObject){
            let priceConditionCode;         
            
            switch(oPriceConditionViewObject.RoyalDecree) {
                case "IncludeInPrecioNeto":
                priceConditionCode = "YLTP";
                  break;
                case "ExcludeInPrecioNeto":
                priceConditionCode = "YLTF";
                  break;
                case "No":
                priceConditionCode = "YLTF";
                  break;
                default:
                priceConditionCode = "";
              }

              oPriceConditionViewObject.PriceConditionCode = priceConditionCode;
                      
            let obj = {
                "CountryCode": oPriceConditionViewObject.CountryCode,
                "OfferID": oPriceConditionViewObject.OfferID,
                "ProductCode": oPriceConditionViewObject.ProductCode,
                "PVL": oPriceConditionViewObject.PVL,
                "Discount": oPriceConditionViewObject.Discount,
                "RoyalDecree": oPriceConditionViewObject.RoyalDecree,
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
                "PriceConditionClassification_ID": oPriceConditionViewObject.PriceConditionClassification_ID,
                "PriceAgreement_ID": oPriceConditionViewObject.PriceAgreement_ID,
                "DiscountCondition": this.convertToDiscountConditions(oPriceConditionViewObject.DiscountConditions),
                "FreeGoodsOther": this.convertToFreeGood(oPriceConditionViewObject.FreeGoodsOther)
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