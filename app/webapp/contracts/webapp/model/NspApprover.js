sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var nspApprover = BaseObject.extend("com.bayer.tender.contracts.model.NspApprover", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);


        },
     
        getJSON: function () {
            return json = this.getJSONObject([
                "countryCode",
                "nspApproverName"
            ]);
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
        
    });

    return nspApprover;
});