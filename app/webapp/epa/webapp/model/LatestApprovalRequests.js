sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./ApprovalRequest"
], function (BaseObject, ApprovalRequest) {
    "use strict";

    var latestApprovalRequest = BaseObject.extend("com.bayer.tender.uilib.model.LatestApprovalRequest", {
        constructor: function (data) {

            this.statusList = [];
            this.overallApprovalStatus = 'Not Approved';

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                data.results && this.setApprovalRequests(data.results);
            }

            
        },

        setApprovalRequests: function (approvalRequests) {
            if (approvalRequests) {
                this.approvalRequests = approvalRequests.map(approval => new ApprovalRequest(approval));
                this.setOverallApprovalStatus(this.approvalRequests);
            }
        },

        getApprovalRequests: function () {
            return this.approvalRequests||[];
        },


        /**
         * This is the overall status for the pricing approval
         */

        getOverallApprovalStatus:function(){
            return this.overallApprovalStatus;
        },

        setOverallApprovalStatus: function (approvalRequests) {

            if (approvalRequests) {
                this.statusList = approvalRequests.map(approval => approval.approvalStatus);
            }

            if (this.statusList.length > 0 ) {
                
                const priceApproved = this.statusList.every(status => status == 'Approved');
                const awaitingApproval = this.statusList.some(status => status == 'Waiting' || status == 'Processing');
                const priceRejected = this.statusList.some(status => status == 'Rejected');

                if(priceApproved) {
                    this.overallApprovalStatus = 'Price Approved';
                }else if(awaitingApproval) {
                    this.overallApprovalStatus = 'Awaiting Approval';
                }else if(priceRejected) {
                    this.overallApprovalStatus = 'Price Rejected';
                }else{
                    this.overallApprovalStatus = 'Not Approved';
                }
                    
            }

        },

        updateOverallApprovalStatus: function(){
            this.setOverallApprovalStatus(this.approvalRequests);
        },
        
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
    return latestApprovalRequest;
});