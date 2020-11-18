sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var sellingCompany = BaseObject.extend("com.bayer.tender.contracts.model.SellingCompany", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

        },
       
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            const json =  this.getJSONObject([
                "authorizedSignatory1", 
                "authorizedSignatory2",
                "bankDetails",
                "legalEntityCode",
                "legalEntityID",
                "legalEntityName",
                "letterhead",
                "remarks"
            ]);

            return {
                ...json,
                LegalEntityID: +LegalEntityID
            }
        },
        
        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });

    return sellingCompany;
});