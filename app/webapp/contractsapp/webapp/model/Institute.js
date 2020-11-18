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
                "activeRecord", 
                "countryCode",
                "customerID",
                "iNSTITUTE_HIERARCHY_ID",
                "instituteID",
                "instituteName",
                "instituteType"
            ]);

            return {
                ...json,
                InstituteID: +InstituteID,
                CustomerID: +CustomerID,
                INSTITUTE_HIERARCHY_ID: +INSTITUTE_HIERARCHY_ID
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