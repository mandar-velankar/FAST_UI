sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Price"
], function (BaseObject, Price) {
    "use strict";

    var product = BaseObject.extend("com.bayer.tender.uilib.model.Product", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                data.Prices && this.setPrices(data.Prices);
            }
        },

        setPrices: function (prices) {
            if (prices) {
                
                this.prices = {};

                this.prices.currency = prices.Currency;

                if(prices.RegisteredPrice && !prices.RegisteredPrice.__deferred){
                    this.prices.registeredPrice = new Price(prices.RegisteredPrice);
                }

                if(prices.MaxMarketSalesPrice && !prices.MaxMarketSalesPrice.__deferred){
                    this.prices.maxMarketSalesPrice = new Price(prices.MaxMarketSalesPrice);
                }

                if(prices.MinLostOfferPrice && !prices.MinLostOfferPrice.__deferred){
                    this.prices.minLostOfferPrice = new Price(prices.MinLostOfferPrice);
                }

                if(prices.MinMarketSalesPrice && !prices.MinMarketSalesPrice.__deferred){
                    this.prices.minMarketSalesPrice = new Price(prices.MinMarketSalesPrice);
                }

                if(prices.FloorPrice && !prices.FloorPrice.__deferred){
                    this.prices.floorPrice = new Price(prices.FloorPrice);
                }

                if(prices.MaxWonOfferPrice && !prices.MaxWonOfferPrice.__deferred){
                    this.prices.maxWonOfferPrice = new Price(prices.MaxWonOfferPrice);
                }
                
            }
        },
        getPrices: function () {
            return this.prices || [];
        },

        getProductId: function(){
            return this.productId;
        },

        getCurrency: function(){ 
            return this.prices && this.prices.currency;
        },

        getRegisteredPrice: function(){ 
            return this.prices && this.prices.registeredPrice;
        },

        getMaxMarketSalesPrice: function(){ 
            return this.prices && this.prices.MaxMarketSalesPrice;
        }
        
       
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        // getJSON: function () {
        //     return this.getJSONObject(["CountryCode", "CountryName"]);
        // },
        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });
    return product;
});