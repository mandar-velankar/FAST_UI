sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
    //"./Price"
], function (BaseObject) {
    "use strict";

    var division = BaseObject.extend("com.bayer.tender.ppa.model.Division", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to object
            }
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
    return division;
});