sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./CountryApprover"
], function (BaseObject, CountryApprover) {
    "use strict";

    var approvalRequest = BaseObject.extend("com.bayer.tender.uilib.model.ApprovalRequest", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                data.CountryApprover && this.setCountryApprovers(data.CountryApprover.results);

                this.setSending(data.ApprovalStatus, data.ApproverTypeSection);
            }
        },
        
        setSending: function(approvalStatus, approverTypeSection){

            this.sending = "";

			if (approverTypeSection === 1) {
				this.sending = "Yes";
			} else {
				this.sending = "No";
			}

			//for waiting & notification sent, it would be forced to "no"
			if (
				approvalStatus === 'Waiting' ||
				approvalStatus === "Notification Sent" ||
				approvalStatus === "Processing" ||
				approvalStatus === "Cancelling"
			) {
				this.sending = "No";
			}
      
        },

        setCountryApprovers: function (approvers) {
            if (approvers) {
                this.countryApprovers = approvers.map((approver) => new CountryApprover(approver));
            }
        },
        getCountryApprovers: function () {
            return this.countryApprovers || [];
        },

        setApprovalStatus: function (status) {
            if (status) {
                this.approvalStatus = status;
            }
        },

        getApprovalStatus: function () {
            return this.approvalStatus;
        },

        setStatusTime: function (timestamp) {
            if (timestamp) {
                this.statusTime = new Date(timestamp);
            }
        },

        getStatusTime: function () {
            return this.statusTime;
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
            return this.getJSONObject(
                [
                    "countryCode", 
                    "instituteGroupId",
                    "productPackId",
                    "approverEmailId", 
                    "approverType", 
                    "statusTime", 
                    "division",
                    "approverTypeSection",
                    "approvalStatus",
                    "senderComment",
                    "approverComment",
                    "sentBy",
                    "approvalDate",
                    "flowId",
                    "requiredAction"
            ]);
        }

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });
    return approvalRequest;
});