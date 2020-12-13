sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseState",
	"../model/Brand",
	"../model/BrandPolicy",
	"../model/AggregatedBrandPolicy",
	"../model/Product",
  	"../model/Country",
	"../model/Division",
	"../model/Channel",
	"../model/Policy",
	"../model/Price",
	"../model/ApprovalRequest",
	"../model/CountryApprover"
], function (BaseState, Brand, BrandPolicy, AggregatedBrandPolicy, Product, Country, Division, Channel, Policy, Price, ApprovalRequest, CountryApprover) {
	"use strict";
	var ppaState = BaseState.extend("com.bayer.tender.ppa.state.PpaState", {
		constructor: function (oService) {
			//data that will be available on the view
			this.data = {
				brand: {},
				brandPolicy: {},
				aggregatedBrandPolicy: {},
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

		// Get brand policy
		getBrandPolicy: function (sCountryCode, sBrandId, sDivision) {
			this.setProperty("brandPolicy", new BrandPolicy());
			return this.getService().getBrandPolicy(sCountryCode, sBrandId, sDivision).then((response) => {
				this.setProperty("brandPolicy", new BrandPolicy(response.data.results[0]));				
				return this.getProperty("brandPolicy");
			});
		},

		//Get brand policy by ID
		getBrandPolicyById: function (id) {
			return this.getService().getBrandPolicyById(id);
		},

		//Get Aggregated Brand Policy
		getAggregatedBrandPolicy: function (sCountryCode, sBrandId, sDivision) {
			this.setProperty("aggregatedBrandPolicy", new AggregatedBrandPolicy());
			return this.getService().getAggregatedBrandPolicy(sCountryCode, sBrandId, sDivision).then(async (response) => {
				const result = response.data.results[0];
				//if(result){

					
					//fromDate 
					let oNewFromDate = new Date()
					oNewFromDate.setHours(0,0,0,0);

					//toDate 
					let oNewToDate = new Date("9999-12-31")
					oNewToDate.setHours(0,0,0,0);

					// Convert to UTC time
					const timeOffsetInMS = oNewToDate.getTimezoneOffset() * 60000;
					oNewToDate.setTime(oNewToDate.getTime() - timeOffsetInMS);

					// get approved brand policy
					const newBrandPolicy = {
						data : {
							ValidFrom       : oNewFromDate,
							ValidTo         : oNewToDate,
							CountryCode     : sCountryCode,
							Division        : sDivision,
							BrandId         : sBrandId,
							Status          : "Draft"
						}
					};

					//get draft brand policy (if non exists, we create an empty BrandPolicy structure + empty product policy Structure)
					const draft = result && result.IDDraft ? await this.getBrandPolicyById(result.IDDraft) : newBrandPolicy;			// if there is no draft product policy yet, create an empty one
					
					//If products policies are not existing, we create for each product an empty policy
					if(!draft.data.ProductPolicies){
						draft.data["ProductPolicies"] = {};
						draft.data.ProductPolicies["results"] = [];
					}

					if(draft && draft.data && draft.data.ProductPolicies.results.length !== this.data.products.length){

						 const aProductPolicies = draft.data.ProductPolicies.results;

						 let newProducts = this.data.products.map(product => {

							//does product already exist?
							const prodPack = aProductPolicies.find(prod => prod.ProductPackId === product.productPackId);
							
							if(prodPack){
								return prodPack;
							}else{
								let oEmptyProductPolicy = {
									CountryCode : product.countryCode,
									Division : product.division,
									BrandId : product.brandId,
									ProductPackId : product.productPackId,
									Currency : product.currency,
									MspStatus : product.mspStatus,
									NspStatus : product.nspStatus,
									BrandPolicy_ID : result && result.IDDraft ? result.IDDraft : null
								};
								return oEmptyProductPolicy;
							}

						});

						draft.data.ProductPolicies.results = newProducts;

					}

					// get approved brand policy
					const approved = result && result.IDLatestApproved ? await this.getBrandPolicyById(result.IDLatestApproved) : null;

					//add channels so they can be used to build price fields
					approved && approved.data && (approved.data["channels"] = this.data.channels);
					draft && draft.data && (draft.data["channels"] = this.data.channels);

					let newAggregated = {
						BrandId: sBrandId, 
						CountryCode: sCountryCode,
						Division: sDivision,
						IDDraft: null,
						IDLatestApproved: null
					}

					const aggregatedObj = result || newAggregated;
	
					const data = {
						...aggregatedObj,
						LatestApprovedPolicy: approved && approved.data,
						DraftPolicy: draft && draft.data
					};

					this.setProperty("aggregatedBrandPolicy", new AggregatedBrandPolicy(data));				
					return this.getProperty("aggregatedBrandPolicy");
				//}
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

		getProductNameById: function (sProductPackId){
			if(sProductPackId){
				let aProducts = this.getProperty("products");
				let aProduct = aProducts.filter(product => product.productPackId === sProductPackId);
				return aProduct[0].productName; //should always be one
			}
		},

		setSelectedProduct: function(product){
			this.setProperty("selectedProduct", product);
		},

		getSelectedProduct: function(){
			return this.getProperty("selectedProduct");
		},

		// /**
		//  * Get Policy for product
		//  * @param {*} sProductPolicyId 
		//  * @returns {} Promise
		//  */
		getProductPolicy: function (sProductPolicyId) {

		 	if(sProductPolicyId){
		 		return this.getService().getProductPolicy(sProductPolicyId).then((PolicyResponse) => {
		 			let oPolicy = new Policy(PolicyResponse.data);
		 			oPolicy.setChannels(this.data.channels);
		 			this.setProperty("draftProductPolicy", oPolicy);
		 			return this.getProperty("draftProductPolicy");
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

		 		this.setProperty("draftProductPolicy", oNewPolicy);
		 		return Promise.resolve(this.getProperty("draftProductPolicy"));

		 	}
			
		},
		
		getSelectedProductPolicy: function(){

			const selectedProduct = this.getSelectedProduct();
			const approvedProductPolicy = this.data.aggregatedBrandPolicy.getApprovedBrandPolicy() && this.data.aggregatedBrandPolicy.getApprovedBrandPolicy().getProductPolicy(selectedProduct.productPackId);
			const draftProductPolicy = this.data.aggregatedBrandPolicy.getDraftBrandPolicy() && this.data.aggregatedBrandPolicy.getDraftBrandPolicy().getProductPolicy(selectedProduct.productPackId);

			const data = {
				...selectedProduct,
				approvedProductPolicy: approvedProductPolicy || {},
				draftProductPolicy: draftProductPolicy,
			};

			this.setSelectedProduct(data);

			return Promise.resolve(this.getProperty("selectedProduct"));
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
				const countries = results.map(country => new Country(country.Country));
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
		savePrices: function (sCase, oDraftProductPolicy){

			//Selected Product, its product policy
			//let oDraftProductPolicy = this.getSelectedProduct().draftProductPolicy; //this.data.aggregatedBrandPolicy.draftBrandPolicy; //this.data.productPolicy;
			
			//match prices from UI structured object to actual price object
			oDraftProductPolicy.matchPrices();

			//set status to draft
			switch(sCase) {
				case "MSP":
					oDraftProductPolicy.mspStatus = "Draft";
				  break;
				case "NSP":
					oDraftProductPolicy.nspStatus = "Draft";
				  break;
				default:
				  // code block
			}
			
			//if id exists, update, otherwise create
			if(!oDraftProductPolicy.iD){
				return this.createPolicy(oDraftProductPolicy);
			}else{
				return this.updatePolicy(oDraftProductPolicy);
			}			
    },

		createBrandPolicy: function (oBrandPolicy) {
			return this.getService().createBrandPolicy(oBrandPolicy);
		},

		updateBrandPolicy: function (oBrandPolicy) {
			return this.getService().updateBrandPolicy(oBrandPolicy);
		},

		//saving the BrandPolicy
		saveBrandPolicy: function(){

			//Get draft & get approved
			let oAggregatedBrandPolicy = this.data.aggregatedBrandPolicy;
			let oDraftBrandPolicy    = this.data.aggregatedBrandPolicy.getDraftBrandPolicy();
			let oApprovedBrandPolicy = this.data.aggregatedBrandPolicy.getApprovedBrandPolicy();
			let promises = [];

        	//1. if latest approved version exist, we should update its validTo date = (effective date - 1sec)
            if(oApprovedBrandPolicy && oApprovedBrandPolicy.iD){
				var newValidToDate = new Date(oDraftBrandPolicy.validFrom.getFullYear(), oDraftBrandPolicy.validFrom.getMonth(), oDraftBrandPolicy.validFrom.getDate() - 1, 23,59,59);

				// Convert to UTC time
				const timeOffsetInMS = newValidToDate.getTimezoneOffset() * 60000;
				newValidToDate.setTime(newValidToDate.getTime() - timeOffsetInMS);

                oApprovedBrandPolicy.validTo = newValidToDate;
                promises.push(this.updateBrandPolicy(oApprovedBrandPolicy));
			};

			//2. does draft exist
			if(oDraftBrandPolicy.iD){
				//do we have a brand in draft
				promises.push(this.updateBrandPolicy(oDraftBrandPolicy));
			}else{
				//create new draft
				promises.push(this.createBrandPolicy(oDraftBrandPolicy));
				
			}

			return Promise.all(promises);

		},

		setBrandPolicyEffectiveDate: function(date){
			this.data.aggregatedBrandPolicy.getDraftBrandPolicy().validFrom = date;
			//this.data.brandPolicy.validFrom = date;
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