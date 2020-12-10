sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseState",
	"../model/Group",
	"../model/LatestApprovalRequests",
	"../model/DivisionsForCountry",
	"../model/InstituteGroup",
	"../model/Institute"
], function (BaseState, Group, LatestApprovalRequests, DivisionsForCountry, InstituteGroup, Institute) {
	"use strict";
	var epaState = BaseState.extend("com.bayer.tender.epa.state.EpaState", {
		constructor: function (oService) {
			//data used for the view
			// this.data = ObservableSlim.create({
			this.data = {
				group: new Group(),
				latestApprovalRequests: new LatestApprovalRequests(),
				divisionsForCountry: new DivisionsForCountry(),
				currentInstituteGroup: new InstituteGroup(),
				editMode: false
				//pricing: new Pricing()
			};
			// , true, (changes) => {
			// 	this.updateModel();
			// });
			this.epaService = oService;
			BaseState.call(this);
		},
		getService: function () {
			return this.epaService;
		},

		setEditMode: function (sEditMode){
			this.setProperty("editMode", sEditMode);
		},

		getGroup: function (id) {
			this.setProperty("group", new Group());
			return this.getService().getGroup(id).then((groupResponse) => {
				this.setProperty("group", new Group(groupResponse.data));
				return this.getProperty("group");
			});
		},
		setNewLatestApprovalRequest:function(){
			this.setProperty("latestApprovalRequests",new LatestApprovalRequests());
		},
		setNewCurrentInstituteGroup:function(){
			this.setProperty("currentInstituteGroup",new InstituteGroup());
		},
		getLatestApprovalRequests: function(sCountryCode, sInstituteGroupId, sProductPackId, sDivision){
			this.setProperty("latestApprovalRequests", new LatestApprovalRequests());
			return this.getService().getLatestApprovalRequests(sCountryCode, sInstituteGroupId, sProductPackId, sDivision).then((response) => {
				this.setProperty("latestApprovalRequests", new LatestApprovalRequests(response.data));
				return this.getProperty("latestApprovalRequests");
			});
		},
		getDivisionsForCountry: function(sCountryCode){
			this.setProperty("divisionsForCountry", new DivisionsForCountry());
			return this.getService().getDivisionsForCountry(sCountryCode).then((response) => {
				this.setProperty("divisionsForCountry", new DivisionsForCountry(response.data));
				return this.getProperty("divisionsForCountry");
			});
		},
		setNewDivisionsForCountry:function(){
			this.setProperty("divisionsForCountry",new DivisionsForCountry());
		},

		getInstituteGroups: function(){
			this.setProperty("instituteGroups", []);
			return this.getService().getInstituteGroups().then((response) => {
				this.setProperty("instituteGroups", response.data.results.map((instituteGroup) => new InstituteGroup(instituteGroup)));
				return this.getProperty("instituteGroups");
			});
		},

		/**
		 * Fetches MSP and NSP for a given institute group
		 * @param {} iInstituteGroupId 
		 * @param {*} iProductPackId 
		 */
		getInstituteGroupPriceLatest: function(iInstituteGroupId,iProductPackId){
			
			return this.getService().getInstituteGroupPriceLatest(iInstituteGroupId,iProductPackId).then((response) => {
				
				if(response.data.results.length > 0){
					let oInstituteGroup = this.getInstituteGroupById(iInstituteGroupId);
					oInstituteGroup.setMSP(response.data.results[0].MSP);
					oInstituteGroup.setNSP(response.data.results[0].NSP);
					this.updateModel();
				}

				return response.data.results;

			});
		},

		getInstituteGroupById: function(iInstituteGroupId){
			if(iInstituteGroupId){
				return this.data.instituteGroups.find(instituteGroup => instituteGroup.id == iInstituteGroupId);
			}
		},

		getCurrentInstituteGroup: function(){
			if(this.getProperty("currentInstituteGroup")){
				return this.getProperty("currentInstituteGroup");
			}
		},

		setCurrentInstituteGroupById: function(iInstituteGroupId){
			if(iInstituteGroupId){
				var oInstituteGroup = this.getInstituteGroupById(iInstituteGroupId);
				this.setProperty("currentInstituteGroup", oInstituteGroup);
			}
		},

		setProduct: function(oProduct){
			this.getCurrentInstituteGroup().productData = oProduct;
			this.updateModel();
		},

		setPricing: function(oPricing){
			this.getCurrentInstituteGroup().pricingData = oPricing;
			this.updateModel();
		},

		getInstitutes: function(iInstituteGroupId){
			var oInstituteGroup = this.getInstituteGroupById(iInstituteGroupId);
			oInstituteGroup.institutes = [];
			return this.getService().getInstitutes(iInstituteGroupId).then((response) => {
				oInstituteGroup.institutes = response.data.results.map((institute) => new Institute(institute.Institute));
				this.updateModel(true);
				return oInstituteGroup.institutes;
			});
		},

		// Send approvals button is pressed
		setSendApprovalsPressed: function (bBoolean) {
			this.setProperty("_bSendApprovalsPressed", bBoolean);
			this.setProperty("_bCancelApprovalsPressed", false);
		},

		// Cancel approvals button is pressed
		setCancelApprovalsPressed: function (bBoolean) {
			this.setProperty("_bCancelApprovalsPressed", bBoolean);
			this.setProperty("_bSendApprovalsPressed", false);
		},

		createApprovalRequest: function (oApprovalRequest) {
			return this.getService().createApprovalRequest(oApprovalRequest);
		},

		createInstituteGroupPrice: function (oPrice) {
			return this.getService().createInstituteGroupPrice(oPrice);
		},

		/**
		 * Returns a list of approvals which must be created in the backend
		 * For all listed on screen	if Send='Yes' -> take approval into account	
		 */
		getApprovalsToBeSent: function(){
			return this.data.latestApprovalRequests.approvalRequests.filter(approval => approval.sending === 'Yes');
		},

		//saving approvals (cancel or send will have different statusses)
		sendApprovals: function (sApprovalStatus) {

			let msgSuccess = '';
			let msgWarning = '';
			let msgError = '';
			let approvals = [];

			// Approval Status
			// External process sets status for each approval request as either => "Waiting", "Approved", "Rejected"
			switch(sApprovalStatus) {
				case 'Processing':
					msgSuccess = 'Approvals succesfully sent for processing..';
					msgWarning = 'Nothing to send. Please select approvals to send.';
					approvals = this.getApprovalsToBeSent();
					break;
				case 'Cancelling':
					msgSuccess = 'Approvals succesfully sent for cancelling..';
					msgWarning = 'Nothing to cancel. Please select approvals to send.';
					approvals = this.data.latestApprovalRequests.approvalRequests;
					break;
			  }

			if(approvals.length > 0){

				let statusTime = Date.now();

				let promises = approvals.map(approval => {
					// change status
					approval.setApprovalStatus(sApprovalStatus);
					approval.setStatusTime(statusTime);
					this.updateModel();
					return this.createApprovalRequest(approval);
				});

				return Promise.all(promises).then(() => {
					this.updateOverallApprovalStatus();
					sap.m.MessageBox.success(msgSuccess, {});
				});

			}else{
				sap.m.MessageBox.warning(msgWarning, {});
			}

		},

		updateOverallApprovalStatus: function(){
			this.data.latestApprovalRequests.updateOverallApprovalStatus();
			this.updateModel();
		},

		clearCurrentInstituteGroupPricingData: function(){
			this.getCurrentInstituteGroup().clearPricingData();
			this.updateModel();
		},

		calculateDiscount: function(){
			this.getCurrentInstituteGroup().calculateDiscount();
			this.updateModel();
		}
	});

	return epaState;

});