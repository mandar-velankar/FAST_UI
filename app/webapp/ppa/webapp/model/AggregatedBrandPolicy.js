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
                data.LatestApprovedPolicy && this.setApprovedBrandPolicy(data.LatestApprovedPolicy);
                data.DraftPolicy && this.setDraftBrandPolicy(data.DraftPolicy);
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
        setApprovedBrandPolicy: function (policy) {
            if(policy){
                this.approvedBrandPolicy = new BrandPolicy(policy);
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
        setDraftBrandPolicy: function (policy) {
            if(policy){
                this.draftBrandPolicy = new BrandPolicy(policy);
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