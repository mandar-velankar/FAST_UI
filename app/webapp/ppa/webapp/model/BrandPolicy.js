sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
], function (BaseObject) {
    "use strict";

    var brandPolicy = BaseObject.extend("com.bayer.tender.ppa.model.BrandPolicy", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            // if (data) {
            //     //copy array's manually to objects
            //     //data.Products && this.setProducts(data.Products.results);
            // }
        },
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            return this.getJSONObject([
                "iD", 
                "countryCode",
                "division",
                "brandId",
                "effectiveDate"
            ]);
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });

    return brandPolicy;
});