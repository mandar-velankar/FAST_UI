sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var institute = BaseObject.extend("com.bayer.tender.uilib.model.Institute", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                // data && this.setInstituteGroups(data.results);

                
            }
        },
        // setInstituteGroups: function (instituteGroups) {
        //     if (instituteGroups) {
        //         this.instituteGroups = instituteGroups.map((instituteGroup) => new ApprovalRequest(approval));
        //     }
        // },
        // getInstituteGroups: function () {
        //     return this.approvalRequests||[];
        // },
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
        // countryNameChanged: function (state, event) {
        //     console.log("country name changed");
        //     //do something when countryCode changes in the view/ui
        // },
        getJSON: function () {
            // return this.getJSONObject(["CountryCode", "CountryName"]);
        },
        getAll: function () {
            // return {
            //     ...this
            // };
        }
    });
    return institute;
});