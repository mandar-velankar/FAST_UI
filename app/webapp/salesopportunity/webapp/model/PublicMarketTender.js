sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "../model/Buyer",
    "../model/Product"
], function (BaseObject, Buyer, Product) {
    "use strict";

    const publicMarketTender = BaseObject.extend("com.bayer.tender.salesopportunity.model.PublicMarketTender", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            /* eslint-disable */
            if (data) {
               
                    data.Buyer && !data.Buyer.__deferred && this.setBuyer(data.Buyer);
                    data.Items && !data.Items.__deferred && this.setProducts(data.Items.results);
               
            }

            this["Items"] && delete this["Items"];
            /* eslint-enable */
        },

        setBuyer: function (buyer) {
            if (buyer) {
                this.buyer = new Buyer(buyer);
            }
        },

        getBuyer: function () {
            return this.buyer;
        },

        setProducts: function (products) {
            if (products) {
                this.products = products.map(prd => new Product(prd));
            }
        },

        getProducts: function () {
            return this.products || [];
        },
        
        /*
        distributorIDChanged:function(state,event){
            console.log("onChagned ditributor id");
        },
        */

        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            return this.getJSONObject([
                "advertisingOfferStatus", 
                "awardDate", 
                "awardMinutesURL", 
                "awardNumber", 
                "awardNumberOfBidders", 
                "awardType", 
                "bidClosingDays", 
                "busy", 
                "callType", 
                "claimsAmount", 
                "closingDate", 
                "codeType", 
                "codigoExterno", 
                "buyer_ID", 
                "contract", 
                "contractDurationTime", 
                "contractDurationType", 
                "contractingProhibition", 
                "createdAt", 
                "currency", 
                "datePubAnswers", 
                "deliveryAddress", 
                "description", 
                "economicOpeningActDate", 
                "estimate", 
                "estimatedAwardDate", 
                "estimatedJustificationAmount", 
                "finalDate", 
                "financingSource", 
                "isBaseType", 
                "isRenewable", 
                "justificationAdvertising", 
                "modality", 
                "name", 
                "notified", 
                "outsourcing", 
                "paymentType", 
                "publicationDate", 
                "reason", 
                "renewalTimePeriod", 
                "renewalTimeValue", 
                "responsibleContractEmail", 
                "responsibleContractName", 
                "responsibleContractPhone", 
                "responsiblePaymentEmail", 
                "responsiblePaymentName", 
                "stages", 
                "startDate", 
                "stateCode", 
                "stateSteps", 
                "status", 
                "technicalOpeningActDate", 
                "tenderContractUnitTime", 
                "tenderType", 
                "termExtension", 
                "unitEvaluationTime", 
                "unitTime", 
                "unitTimeContractDuration", 
                "visibilityAmount", 
                "visitAddress", 
                "works"
            ]);
        },

        getAll: function () {
            return {
                ...this.getJSON(),
                Buyer: this.getBuyer().getJSON(),
                Items: this.getProducts().map(item => item.getJSON())
            };
        }
        
    });

    return publicMarketTender;
});