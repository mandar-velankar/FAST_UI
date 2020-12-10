sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./CountryApprover",
    "./ApproverType",
    "./Approval"
], function (BaseObject, CountryApprover, ApproverType, Approval) {
    "use strict";

    var approvalRequest = BaseObject.extend("com.bayer.tender.ppa.model.ApprovalRequest", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            // BaseObject.call(this, data);

            this.status = "";
            this.approverTypes = [];
            this.submittedApprovals = [];
            this.approvals = [];
            this.brand = {};

            if (data) {
                data.brand && (this.brand = data.brand);
                data.submittedApprovals && this.setSubmittedApprovals(data.submittedApprovals);
                data.approverTypes && this.setApproverTypes(data.approverTypes);
                this.createApprovalsArray();
            }
            
        },

        setSubmittedApprovals: function(approvals){
            if(approvals && approvals instanceof Array){
                this.submittedApprovals = approvals.map(approval => new Approval(approval));
            }
        },

        setApproverTypes: function(approverTypes){
            if(approverTypes && approverTypes instanceof Array){
                this.approverTypes = approverTypes.map(approverType => {
                    const data ={
                        approverType,
                        brand: this.brand
                    };
                    return new ApproverType(data)
                });
            }
        },

        createApprovalsArray: function(){ 
            this.approverTypes.forEach(approverType => { 

                const approval = this.findApprovalByApproverTypeId(approverType.iD);

                if(approval){
                    approval.setApproverType(approverType);
                    approval.setAction("update");
                    approval.setSending(this.getSending(approverType, approval.getApprovalStatus()));
                    this.approvals.push(approval);
                }else{
                    const newApproval = new Approval();
                    newApproval.initialize();
                    newApproval.setApproverType(approverType);
                    newApproval.setAction("create");
                    newApproval.setCountryCode(this.brand.countryCode);
                    newApproval.setBrandId(this.brand.brandId);
                    newApproval.setDivision(this.brand.division);
                    newApproval.setSending(this.getSending(approverType, newApproval.getApprovalStatus()));
                    this.approvals.push(newApproval);
                }

            });

            // sets the overall status 
            this.setStatus(this.approvals);
        },

        findApprovalByApproverTypeId: function(id){
            return this.submittedApprovals.find(approval => approval.approverTypeId.indexOf(id) > -1);
        },
        
        getSending: function(approverType, approvalStatus){

            let sending = "";

			if (approverType.mandatory) {
				sending = "Yes";
			} else {
				sending = "No";
			}

			//for waiting & notification sent, it would be forced to "no"
			if (
				approvalStatus === 'Waiting' ||
				approvalStatus === "Notification Sent" ||
				approvalStatus === "Processing" ||
				approvalStatus === "Cancelling"
			) {
				sending = "No";
            }
            
            return sending
      
        },

        updateStatus: function(){
            this.setStatus(this.approvals);
        },

        setStatus: function (approvals) {

            if (approvals) {

                let statusList = approvals.map(approval => approval.getApprovalStatus());

                if (statusList.length > 0 ) {
                
                    const approved = statusList.every(status => status == 'Approved');
                    const awaiting = statusList.some(status => status == 'Waiting' || status == 'Processing');
                    const rejected = statusList.some(status => status == 'Rejected');
    
                    if(approved) {
                        this.status = 'Price Approved';
                    }else if(awaiting) {
                        this.status = 'Awaiting Approval';
                    }else if(rejected) {
                        this.status = 'Price Rejected';
                    }else{
                        this.status = 'Not Approved';
                    }
                   
                }
            }
        },

        
        
        // getJSON: function () {
        //     return this.getJSONObject(
        //         [
        //             "countryCode", 
        //             "brandId",
        //             "division",
        //             "approvalStatus",
        //             "senderComment",
        //             "approverComment",
        //             "sentBy",
        //             "approvalDate",
        //             "flowId",
        //             "requiredAction"
        //     ]);
        // }
    });
    return approvalRequest;
});