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

            if (data) {
                /* eslint-disable */
                    data.Comprador && !data.Comprador.__deferred && this.setBuyer(data.Comprador);
                    data.Items && !data.Items.__deferred && this.setProducts(data.Items);
                /* eslint-enable */

            }

        },

        setBuyer: function (buyer) {
            if (buyer) {
                this.buyer = new Buyer(buyer);
            }
        },

        getBuyer: function () {
            return this.buyer;
        },

        setProduct: function (products) {
            if (products) {
                this.products = products.map(prd => new Product(prd));
            }
        },

        getProduct: function () {
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
     
        // getJSON: function () {
        //     const json = this.getJSONObject([
        //         "activeRecord", 
        //         "address",
        //         "contactNo",
        //         "contactPerson",
        //         "countryCode",
        //         "distributorID",
        //         "distributorName",
        //         "fax"
        //     ]);

        //     return {
        //         ...json,
        //         DistributorID: +DistributorID
        //     }
        // },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
        
    });

    return publicMarketTender;
});