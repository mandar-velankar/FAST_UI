sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var institute = BaseObject.extend("com.bayer.tender.contracts.model.Institute", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);


        },

        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            const json = this.getJSONObject([
                "countryCode",
                "instituteID",
                "instituteName"
            ]);

            return {
                ...json,
                InstituteID: +json.InstituteID,
            }
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
        
    });

    return institute;
});