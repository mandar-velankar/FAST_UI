sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./BrandPolicy"
], function (BaseObject, BrandPolicy) {
    "use strict";

    var aggregatedBrandPolicy = BaseObject.extend("com.bayer.tender.uilib.model.AggregatedBrandPolicy", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                data.LatestApprovedPolicy && this.setApprovedBrandPolicy(data.LatestApprovedPolicy, data.brandRolesInfo);
                data.DraftPolicy && this.setDraftBrandPolicy(data.DraftPolicy, data.brandRolesInfo);
            }
        },

        /**
         * Get ApprovedBrandPolicy
         */
        getApprovedBrandPolicy: function () {
            return this.approvedBrandPolicy;
        },

        /**
         * Set approvedBrandPolicy
         * @param {*} policy 
         */
        setApprovedBrandPolicy: function (policy, brandRolesInfo) {
            if(policy){
                this.approvedBrandPolicy = new BrandPolicy({...policy, brandRolesInfo});
            }
        },

        /**
         * Get Draft BrandPolicy
         */
        getDraftBrandPolicy: function () {
            return this.draftBrandPolicy;
        },

        /**
         * Set draftBrandPolicy
         * @param {*} policy 
         */
        setDraftBrandPolicy: function (policy, brandRolesInfo) {
            if(policy){
                this.draftBrandPolicy = new BrandPolicy({...policy, brandRolesInfo});
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
    return aggregatedBrandPolicy;
});