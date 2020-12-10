sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
    //"./Price"
], function (BaseObject) {
    "use strict";

    var product = BaseObject.extend("com.bayer.tender.uilib.model.Product", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                //data.Prices && this.setPrices(data.Prices);
            }
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