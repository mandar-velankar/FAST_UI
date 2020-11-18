sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var instituteGroup = BaseObject.extend("com.bayer.tender.uilib.model.InstituteGroup", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            this.productData = {};
            this.pricingData = {
                discount: null,
                msp: null,
                cif: null,
                approvalStatus: "Price Approved" // hard coded
            };
            this.approvals = [];
        },

        setMSP: function(value){
            if(value){
                this.pricingData.msp = Number(value);
                if(this.pricingData.cif){
                    this.calculateDiscount();
                }
            }
        },
        
        getMSP: function(){
            return this.pricingData.msp;
        },

        setCIF: function(value){
            if(value){
                this.pricingData.cif = Number(value);
                if(this.pricingData.msp){
                     this.calculateDiscount();
                }
            }
        },
        
        getCIF: function(){
            return this.pricingData.cif || 0;
        },
        
        
        getDiscount: function(){
            return this.pricingData.discount || 0;
        },
        
        setPriceApprovalStatus: function(status){
            if(status){
                this.pricingData.approvalStatus = status;
            }
        },
        
        getPriceApprovalStatus: function(){
            return this.pricingData.approvalStatus || "";
        },

        // The dicount is calculated based on the following formula
        // 1 - MSP / CIF
        calculateDiscount: function(){
            if(this.pricingData.msp && this.pricingData.cif && this.pricingData.cif != 0){
                this.pricingData.discount = Math.abs(1 - this.pricingData.msp / this.pricingData.cif);
            } 
        },

        clearPricingData: function(){
            this.pricingData = {};
        },

        
        getJSON: function () {
            // return this.getJSONObject(["CountryCode", "CountryName"]);
        },
        getAll: function () {
            // return {
            //     ...this
            // };
        }
    });
    return instituteGroup;
});