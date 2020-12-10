sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
    //"./Price"
], function (BaseObject) {
    "use strict";

    var approval = BaseObject.extend("com.bayer.tender.ppa.model.Approval", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            this.approverTypeId = "";
            this.sending = "";
            this.action = ""; // update/create => if an approval object already exists in the database, we need to update that record, otherwise we need to create one

            if (data) { 
                //copy array's manually to objects
                data.CountryApprover && this.setApproverTypeId(data.CountryApprover.ApproverType_ID);
            }
        },

        setCountryCode: function(countryCode){
            if(countryCode){
                this.countryCode = countryCode;
            }
        },

        setBrandId: function(brandId){
            if(brandId){
                this.brandId = brandId;
            }
        },

        setDivision: function(division){
            if(division){
                this.division = division;
            }
        },

        getSending: function(){
            return this.sending;
        },

        setSending: function(sending){
            if(sending){
                this.sending = sending;
            }
        },

        getAction: function(){
            return this.action;
        },

        setAction: function(action){
            if(action){
                this.action = action;
            }
        },

        getApprovalStatus: function(){
            return this.approvalStatus;
        },

        setApprovalStatus: function(status){
            if(status){
                this.approvalStatus = status;
            }
        },

        getApproverTypeId: function(){
            return this.approverTypeId;
        },

        setApproverTypeId: function(approverTypeId){
            if(approverTypeId){
                this.approverTypeId = approverTypeId;
            }
        },

        setApproverType: function(approverType){
            if(approverType){
                this.approverType = approverType;
            }
        },

        /**
         * Creates an empty Approval object
         */
        initialize: function(){

            const obj = {
                "approvalStatus": "",
                "approverComment": "",
                "approverTypeId": "",
                "brandId": "",
                "busy": false,
                "countryApprover_ID": null,
                "countryCode": "",
                "division": "",
                "flowId": "",
                "iD": "",
                "requiredAction": "",
                "senderComment": "",
                "sentBy": ""
            };

            return BaseObject.call(this, obj);

        },

        // setCountryApprovers: function(countryApprovers){
        //     if(countryApprovers){
        //         // filter the CountryApprovers based on the selected brand. This is necessary to filter out irrelevant records from the Approvals dropdown
        //         const filteredCountryApprovers = countryApprovers.filter(approver => (approver.countryCode === this.brand.countryCode) && (approver.division === this.brand.division));
        //         this.countryApprovers = filteredCountryApprovers;
        //     } 
        // },

        // getCountryApprovers: function(){
        //     return this.countryApprovers;
        // },
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            return this.getJSONObject([
                "iD", 
                "countryCode", 
                "brandId", 
                "division", 
                "approvalStatus", 
                "senderComment", 
                "approverComment", 
                "sentBy", 
                "approvalDate",
                "flowId",
                "requiredAction",
                "countryApprover_ID"
            ]);
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });
    return approval;
});