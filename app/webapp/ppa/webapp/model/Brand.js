sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Product"
], function (BaseObject, Product) {
    "use strict";

    var brand = BaseObject.extend("com.bayer.tender.ppa.model.Brand", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                //data.Products && this.setProducts(data.Products.results);
            }
        },

        setProducts: function (products) {
            if (products) {
                this.products = products.map((product) => new Product(product));
                this.products.unshift({}); // add an empty object -> needed for the UI
            }
        },
        getProducts: function () {
            return this.products || [];
        },
       
        
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
    return brand;
});