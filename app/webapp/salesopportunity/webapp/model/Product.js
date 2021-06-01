sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var product = BaseObject.extend("com.bayer.tender.salesopportunity.model.Product", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

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

    return product;
});