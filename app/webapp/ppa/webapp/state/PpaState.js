sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseState",
	"../model/Brand",
	"../model/BrandPolicy",
	"../model/Product",
  	"../model/Country",
	"../model/Division",
	"../model/Channel",
	"../model/Policy",
	"../model/Price",
	"../model/ApprovalRequest",
	"../model/CountryApprover"
], function (BaseState, Brand, BrandPolicy, Product, Country, Division, Channel, Policy, Price, ApprovalRequest, CountryApprover) {
	"use strict";
	var ppaState = BaseState.extend("com.bayer.tender.ppa.state.PpaState", {
		constructor: function (oService) {
			//data that will be available on the view
			this.data = {
				brand: {},
				brandPolicy: {},
				products: [],
				selectedProduct: {},
				countries: [],
				divisions: [],
				productPolicy: {}, 
				approvalRequest: {},
				editMode: false,
				mspPanelExpanded: false,
				nspPanelExpanded: false
			};

			this.ppaService = oService;
			BaseState.call(this);
		},

		//get Service to database
		getService: function () {
			return this.ppaService;
		},

		/**
		 * Set a edit mode
		 * @param {*} bEditMode 
		 */
		setEditMode: function (bEditMode){
			this.setProperty("editMode", bEditMode);
		},

		/**
		 * Set panel Expanded
		 * @param {*} bExpanded 
		 */
		setMspPanelExpanded: function (bExpanded){
			this.setProperty("mspPanelExpanded", bExpanded);
		},

		/**
		 * Set panel Expanded
		 * @param {*} bExpanded 
		 */
		setNspPanelExpanded: function (bExpanded){
			this.setProperty("nspPanelExpanded", bExpanded);
		},

		setMspExpandable: function (bExpanded){
			this.setProperty("mspPanelExpandable", bExpanded);
		},

		setNspExpandable: function (bExpanded){
			this.setProperty("nspPanelExpandable", bExpanded);
		},

		//Get selected brand
		getBrand: function (sCountryCode, sBrandId, sDivision) {
			this.setProperty("brand", new Brand());
			return this.getService().getBrand(sCountryCode, sBrandId, sDivision).then((brandResponse) => {
				this.setProperty("brand", new Brand(brandResponse.data.results[0]));
				return this.getProperty("brand");
			});
		},

		//Get brand policy
		getBrandPolicy: function (sCountryCode, sBrandId, sDivision) {
			this.setProperty("brandPolicy", new BrandPolicy());
			return this.getService().getBrandPolicy(sCountryCode, sBrandId, sDivision).then((response) => {
				this.setProperty("brandPolicy", new BrandPolicy(response.data.results[0]));				
				return this.getProperty("brandPolicy");
			});
		},

		/**
		 * Get the corresponding products for the selected brand
		 * @param {*} sCountryCode 
		 * @param {*} sBrandId 
		 * @param {*} sDivision 
		 */
		getProducts: function (sCountryCode, sBrandId, sDivision) {
			this.setProperty("products", new Product());
			return this.getService().getProducts(sCountryCode, sBrandId, sDivision).then((ProductResponse) => {
				let aProducts = ProductResponse.data.results.map((product) => new Product(product));
				this.setProperty("products", aProducts);
				return this.getProperty("products");
			});
		},

		setSelectedProduct: function(product){
			this.setProperty("selectedProduct", product);
		},

		getSelectedProduct: function(){
			return this.getProperty("selectedProduct");
		},

		/**
		 * Get Policy for product
		 * @param {*} sProductPolicyId 
		 * @returns {} Promise
		 */
		getProductPolicy: function (sProductPolicyId) {

			if(sProductPolicyId){
				return this.getService().getProductPolicy(sProductPolicyId).then((PolicyResponse) => {
					let oPolicy = new Policy(PolicyResponse.data);
					oPolicy.setChannels(this.data.channels);
					this.setProperty("productPolicy", oPolicy);
					return this.getProperty("productPolicy");
				});
			}else{
				
				//for creating with empty Policy structure (to be able to create)
				let oSelectedProduct = this.getSelectedProduct();
				let oPolicy = {
					//iD : "",
					countryCode : oSelectedProduct.countryCode,
					division : oSelectedProduct.division,
					brandId : oSelectedProduct.brandId,
					productPackId : oSelectedProduct.productPackId,
					currency : oSelectedProduct.currency,
					mspStatus : oSelectedProduct.mspStatus,
					nspStatus : oSelectedProduct.nspStatus,
					channels : this.data.channels
				}

				let oNewPolicy = new Policy(oPolicy);
				//oNewPolicy.setChannels(this.data.channels);

				this.setProperty("productPolicy", oNewPolicy);
				return Promise.resolve(this.getProperty("productPolicy"));

			}
			
		},

		getSelectedProductPolicy: function(){
			return this.getProperty("productPolicy");
		},

		/**
		 * Get the corresponding products for the selected brand
		 * @param {*} sCountryCode 
		 * @param {*} sBrandId 
		 * @param {*} sProductPackId 
		 * @param {*} sDivision 
		 */
		getApprovals: function(sCountryCode, sBrandId, sDivision){
			return this.getService().getApprovals(sCountryCode, sBrandId, sDivision);
		},

		// /**
		//  * Get the country approvers
		//  * @param {*} sCountryCode  
		//  * @param {*} sDivision 
		//  */
		// getCountryApprovers: function(sCountryCode, sDivision){
		// 	this.setProperty("countryApprovers", []);

		// 	return this.getService().getCountryApprovers(sCountryCode, sDivision).then((response) => {
		// 		let aCountryApprovers = response.data.results.map((countryApprover) => new CountryApprover(countryApprover));
		// 		this.setProperty("countryApprovers", aCountryApprovers);
		// 		return this.getProperty("countryApprovers");
		// 	});
		// },

		/**
		 * Returns a list of approvals which must be created in the backend
		 * For all listed on screen	if Send='Yes' -> take approval into account	
		 */

		getApprovalsToBeSent: function(){
			return this.data.approvalRequest.approvals.filter(approval => approval.sending === 'Yes');
		},

		/**
		 * Returns a list of approvals which must be canceled in the backend
		 * For all listed on screen	if status='processing' -> take approval into account	
		 */
		getApprovalsToBeCanceled: function(){
			return this.data.approvalRequest.approvals.filter(approval => approval.getApprovalStatus().indexOf('Processing') > -1 );
		},

		/**
		 * Get the approver types
		 * @param {*} sCountryCode
		 */
		getApproverTypes: function(sCountryCode){
			return this.getService().getApproverTypes(sCountryCode);
		},

		/**
		 * Get the needed entities from the backend and create a ApproverRequest object
		 * @param {*} oBrand
		 */
		getApprovalRequest: async function(oBrand){ 

			this.setProperty("approvalRequest", new ApprovalRequest());

			const approverTypes = await this.getApproverTypes(oBrand.countryCode);
			const submittedApprovals = await this.getApprovals(oBrand.countryCode, oBrand.brandId, oBrand.division)

			const data = {
				approverTypes: approverTypes.data.results,
				submittedApprovals: submittedApprovals.data.results,
				brand: oBrand
			};

			this.setProperty("approvalRequest", new ApprovalRequest(data));

			return this.getProperty("approvalRequest");

		},

		/**
		 * Retrieves a list of countries for the logged on user
		 */
		getUserCountries: function(){
			this.setProperty("countries", []);
			return this.getService().getUserCountries().then(response => {
				const results = response.data.results;
				const countries = results.map(counry => new Country(counry.Country));
				this.setProperty("countries", countries);
				return this.getProperty("countries");
			});
		},

		/**
		 * Retrieves a list of divisions
		 */
		getDivisions: function(){
			this.setProperty("divisions", []);
			return this.getService().getDivisions().then(response => {
				const results = response.data.results;
				const divisions = results.map(division => new Division(division));
				this.setProperty("divisions", divisions);
				return this.getProperty("divisions");
			});
		},

		/**
		 * Retrieves a list of channels
		 */
		getChannels: function(sCountryCode){
			this.setProperty("channels", []);
			return this.getService().getChannels(sCountryCode).then(response => {
				const results = response.data.results;
				const channels = results.map(channel => new Channel(channel));
				this.setProperty("channels", channels);
				return this.getProperty("channels");
			});
		},

		/**
		 * Create a new policy with corresponding prices
		 * @param {*} oPolicy 
		 */
		createPolicy: function (oPolicy){
			return this.getService().createPolicy(oPolicy);
		},

		/**
		 * Update the policy with corresponding prices
		 * @param {*} oPolicy 
		 */
		updatePolicy: function (oPolicy){
			return this.getService().updatePolicy(oPolicy);
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

		updateApprovalRequest: function (oApprovalRequest) {
			return this.getService().updateApprovalRequest(oApprovalRequest);
		},


		//saving prices (all prices will be saved or updated)
		savePrices: function (sCase){

			//Selected Product, its product policy
			let oProductPolicy = this.data.productPolicy;
			
			//match prices from UI structured object to actual price object
			oProductPolicy.matchPrices();

			//set status to draft
			switch(sCase) {
				case "MSP":
					oProductPolicy.mspStatus = "Draft";
				  break;
				case "NSP":
					oProductPolicy.nspStatus = "Draft";
				  break;
				default:
				  // code block
			}
			
			//if id exists, update, otherwise create
			if(!oProductPolicy.iD){
				return this.createPolicy(oProductPolicy);
			}else{
				return this.updatePolicy(oProductPolicy);
			}			
    },

		createBrandPolicy: function (oBrandPolicy) {
			return this.getService().createBrandPolicy(oBrandPolicy);
		},

		updateBrandPolicy: function (oBrandPolicy) {
			return this.getService().updateBrandPolicy(oBrandPolicy);
		},

		saveEffectiveDate: function(){
			if(this.data.brandPolicy.iD){
				return this.updateBrandPolicy(this.data.brandPolicy);
			}else{

				this.data.brandPolicy.countryCode = this.data.brand.countryCode;
				this.data.brandPolicy.division = this.data.brand.division;
				this.data.brandPolicy.brandId = this.data.brand.brandId;

				return this.createBrandPolicy(this.data.brandPolicy);
			}
		},

		setBrandPolicyEffectiveDate: function(date){
			this.data.brandPolicy.effectiveDate = date;
		},

		//saving approvals (cancel or send will have different statusses)
		sendApprovals: function (sApprovalStatus) {

			let msgSuccess = '';
			let msgWarning = '';
			let msgError = '';
			let approvals = []

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
					approvals = this.getApprovalsToBeCanceled();
					break;
			  }

			if(approvals.length > 0){


				let promises = approvals.map(approval => {

					const action = approval.getAction();
					
					approval.setApprovalStatus(sApprovalStatus);
					this.updateModel();

					switch(action){
						case "create":
							return this.createApprovalRequest(approval);
						case "update":
							return this.updateApprovalRequest(approval);

					}
					
					this.updateOverallApprovalStatus();
					sap.m.MessageBox.success(msgSuccess, {});
				});

				return Promise.all(promises).then(() => {
					this.updateOverallApprovalStatus();
					sap.m.MessageBox.success(msgSuccess, {});
				});

			}else{
				sap.m.MessageBox.warning(msgWarning, {});
				return Promise.resolve("Warning");
			}

		},

		updateOverallApprovalStatus: function(){
			this.data.approvalRequest.updateStatus();
			this.updateModel();
		},
    
		/**
		 * Checks if an object is empty
		 * @param {*} obj 
		 */
		isEmpty: function(obj) {
			for(var key in obj) {
				if(obj.hasOwnProperty(key))
					return false;
			}
			return true;
		}
    
	});

	return ppaState;

});