sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var mspApprover = BaseObject.extend("com.bayer.tender.contracts.model.MspApprover", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);


        },
     
        getJSON: function () {
            return json = this.getJSONObject([
                "countryCode",
                "mspApproverName"
            ]);
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
        
    });

    return mspApprover;
});