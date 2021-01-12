sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Policy"
], function (BaseObject, Policy) {
    "use strict";

    var brandPolicy = BaseObject.extend("com.bayer.tender.ppa.model.BrandPolicy", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            //keep channels
            if(data && data.channels){
                this.setChannels(data.channels);
            }

            if (data) {
                //copy array's manually to objects
                data.ProductPolicies && this.setProductPolicies(data.ProductPolicies.results);
            }
        },

        /**
         * get Channels
         * @param {*} aChannels 
         */
        getChannels: function(){
            return this.channels || [];
        },

        /**
         * set channels
         * @param {*} aChannels 
         */
        setChannels: function(aChannels){
            if(aChannels){
                this.channels = aChannels;
            }
        },

        setProductPolicies: function (productPolicy) {
            if(productPolicy){
                this.productPolicies = productPolicy.map(policy => {
                    //set channels on policy
                    policy["channels"] = this.getChannels();
                    return new Policy(policy);
                });
            }
        },

        getProductPolicies: function () {
            return this.productPolicies || [];
        },

        getProductPolicy: function (productPackId) { 
            if(productPackId){
                return this.getProductPolicies().find(policy => policy.productPackId === productPackId);
            } 
        },

        setProductPolicy: function (oPolicy) { 
            try {
                if(oPolicy){
                    this.setProductPolicyByProductPackId(oPolicy.productPackId,oPolicy);
                }  
            }catch(err) {
                throw new Error(err);
            }
        },

        setProductPolicyByProductPackId: function (productPackId, oPolicy) {
            try {
                const oldPolicyIndex = this.getProductPolicies().findIndex(policy => policy.productPackId === productPackId);
                this.getProductPolicies()[oldPolicyIndex] = oPolicy;
            }
            catch(err) {
                throw new Error(err);
            }
        },
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            return this.getJSONObject([
                "iD", 
                "validFrom",
                "validTo",
                "countryCode",
                "division",
                "brandId",
                "status"
            ]);
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });

    return brandPolicy;
});