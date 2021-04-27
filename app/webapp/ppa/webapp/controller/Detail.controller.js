sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"../model/datatypes/Price",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter"
], function (BaseController, JSONModel, formatter, Price, mobileLibrary,  Filter, Sorter) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.ppa.controller.Detail", {

		formatter: formatter,
		customTypes: {
			Price
		},


		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			this.ppaState = this.getOwnerComponent().getState(this.getOwnerComponent().PPA);
			this.setModel(this.ppaState.getModel(), "ppa");
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			
			var oDateModel = new sap.ui.model.json.JSONModel({
				minDate: new Date(),
				enabled: false
			});	
			this.getView().setModel(oDateModel, "dateModel");
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */


		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished : function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function (oEvent) {
			
			//catch parameters from URL & keep on controller
			this.currentCountryCode = oEvent.getParameter("arguments").CountryCode;
			this.currentBrandId =  oEvent.getParameter("arguments").BrandId;
			this.currentDivision = oEvent.getParameter("arguments").Division;

			// Close panels when you select a new brand (this forces you to first select a product)
			this.closePricingPanels();

			//set layout as split view
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

			//show the details page data
			this.showDetail();

		},

		/**
		 * Close panels when you select a new brand (this forces you to first select a product)
		 */
		closePricingPanels: function(){
			this.ppaState.setMspPanelExpanded(false);
			this.ppaState.setNspPanelExpanded(false);
			this.ppaState.setMspExpandable(false);
			this.ppaState.setNspExpandable(false);
		},

		/**
		 * Show details page data
		 */
		showDetail:function(){

			//default edit mode is false
			this.ppaState.setEditMode(false);
			this.getModel().metadataLoaded().then(async () => {

					//clearing selections
					//this._clearSelections();

					//this.sCountryCode = oSelectedInstituteGroup.CountryCode;
					//this.sInstituteGroupId = instituteGroupId;

					// get Institutes and Divisions for a given Country and Institute Group
					// this.getBrand(this.currentCountryCode, this.currentBrandId, this.currentDivision);
					// this.getProducts(this.currentCountryCode, this.currentBrandId, this.currentDivision);
					// this.getCountryApprovers(this.currentCountryCode, this.currentDivision);
					// this.getApproverTypes(this.currentCountryCode);
					// this.getApprovals(this.currentCountryCode, this.currentBrandId, this.currentDivision);

					await this.getChannels(this.currentCountryCode);

					this.getBrand(this.currentCountryCode, this.currentBrandId, this.currentDivision).then(async brand => {
						
						await this.getActiveBrandPolicy(this.currentCountryCode, this.currentBrandId, this.currentDivision);

						brand["brandPolicyId"] = this.ppaState.data.brandPolicy.iD;

						this.ppaState.getApprovalRequest(brand);
						this.getAggregatedBrandPolicy(this.currentCountryCode, this.currentBrandId, this.currentDivision);
					});
					
					this.getProducts(this.currentCountryCode, this.currentBrandId, this.currentDivision);

					//reset selected product when switching between brands
					this.ppaState.setSelectedProduct({});
					let oProductsTable = this.byId("idProductsTable");

					// //products table
					if(oProductsTable){
						oProductsTable.removeSelections(true)
					}

			});
		},

		/**
		 * When product is selected in product table
		 * @param {*} oEvent 
		 */
		onProductItemSelect:function(oEvent){

			//set waiting screen
			this.getView().setBusy(true);

			// //get products table
			let oProductsTable = this.byId("idProductsTable");
			var selectedProduct = {};
			
			// //products table
			if(oProductsTable){
			
			// 	//get products & selected path
				let aProducts = oProductsTable.getItems();
				//let sPathSelectedItem = oEvent.getSource().getBindingContextPath();
				selectedProduct = this.getView().getModel('ppa').getProperty(oProductsTable.getSelectedItem().getBindingContextPath());
			// 	let sProductPolicyId = this.ppaState.getModel().getProperty(sPathSelectedItem).iD ? this.ppaState.getModel().getProperty(sPathSelectedItem).iD : null;

			// 	// Load the corresponding Product Policy
			// 	this.ppaState.getProductPolicy(sProductPolicyId);
				
			}

			if(this.byId("idEffectiveDate").getDateValue() || this.byId("idLatestApprEffectiveDate").getDateValue()){

				//const selectedProduct = oEvent.getSource().getBindingContext("ppa").getObject();
				//const selectedProduct;
				this.ppaState.setSelectedProduct(selectedProduct);

					//Load the aggregated Brand Policy & store the draft & latestapproved product policy
				this.ppaState.getSelectedProductPolicy().then(() => {
					this.getActiveBrandPolicy(this.currentCountryCode, this.currentBrandId, this.currentDivision).then(() => {
						// Set panel panels expanded
						this.ppaState.setMspPanelExpanded(true);
						this.ppaState.setNspPanelExpanded(true);
						this.ppaState.setMspExpandable(true);
						this.ppaState.setNspExpandable(true);
						this.calculatePriceDifferenceProductSelect(this.ppaState.getSelectedProduct());
						this.getView().setBusy(false);
					}).catch((error) => {
						this.getView().setBusy(false);
					});
				}).catch((error) => {
					this.getView().setBusy(false);
				});
			} else {
				const msgWarningEffectiveDate = 'Please enter an effective date before creating a new policy.';
				sap.m.MessageBox.warning(msgWarningEffectiveDate, {});
				oProductsTable.removeSelections(true)
				this.getView().setBusy(false);
			}

			// Load the corresponding Product Policy
			// this.ppaState.getProductPolicy(selectedProduct.policyId).then(() => {
			// 	// Set panel panels expanded
			// 	this.ppaState.setMspPanelExpanded(true);
			// 	this.ppaState.setNspPanelExpanded(true);
			// 	this.ppaState.setMspExpandable(true);
			// 	this.ppaState.setNspExpandable(true);
			// 	this.getView().setBusy(false);
			// }).catch((error) => {
			// 	this.getView().setBusy(false);
			// });

			
	
		},

		calculatePriceDifferenceProductSelect: function(selectedProduct){

			//product selected?
			if(selectedProduct.productPackId){ 

				const approvedMspPolicyPrices = selectedProduct.approvedProductPolicy.mspPrices;
				const approvedNspPolicyPrices = selectedProduct.approvedProductPolicy.nspPrices;
				const draftMspPolicyPrices = selectedProduct.draftProductPolicy.mspPrices;
				const draftNspPolicyPrices = selectedProduct.draftProductPolicy.nspPrices;

				if(approvedMspPolicyPrices && approvedNspPolicyPrices){
					for(let mspPriceType in draftMspPolicyPrices ) {
						if(draftMspPolicyPrices[mspPriceType] || approvedMspPolicyPrices[mspPriceType] ){
							selectedProduct.MspPricePercDiff[mspPriceType] = this.calculatePriceDifference(+draftMspPolicyPrices[mspPriceType], +approvedMspPolicyPrices[mspPriceType]) + "%";
						}
					}

					for(let nspPriceType in draftNspPolicyPrices ) {
						if(draftMspPolicyPrices[nspPriceType] || approvedMspPolicyPrices[nspPriceType] ){
							selectedProduct.NspPricePercDiff[nspPriceType] = this.calculatePriceDifference(+draftNspPolicyPrices[nspPriceType], +approvedNspPolicyPrices[nspPriceType]) + "%";
						}
					}
				}

				this.ppaState.updateModel();

			}
		},

		/**
		 * Get Channels
		 * @param {*} sCountryCode 
		 */
		getChannels: function (sCountryCode) {
			this.getView().setBusy(true);
			return this.ppaState.getChannels(sCountryCode).then(() => {
				this.getView().setBusy(false);
			}).catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Get Brand
		 * @param {*} sCountryCode 
		 * @param {*} iBrandId 
		 * @param {*} sDivision 
		 */
		getBrand: function (sCountryCode, iBrandId, sDivision) {
			this.getView().setBusy(true);
			return this.ppaState.getBrand(sCountryCode, iBrandId, sDivision).then((brand) => {
				this.getView().setBusy(false);
				return brand;
				// this.onChangeDate();
				// this._bindSpecifySelect();
			}).catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		// /**
		//  * Get ActiveBrandPolicy: the one that is active till the end of time 9999()
		//  * @param {*} sCountryCode 
		//  * @param {*} iBrandId 
		//  * @param {*} sDivision 
		//  */
		getActiveBrandPolicy: function (sCountryCode, iBrandId, sDivision) {
			this.getView().setBusy(true);
			return this.ppaState.getActiveBrandPolicy(sCountryCode, iBrandId, sDivision).then((brandPolicy) => {
				this.ppaState.addBrandPolicyIdToApprovalRequestApprovals(brandPolicy.iD);
				this.getView().setBusy(false);
				return brandPolicy;
			}).catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Get AggregatedBrandPolicy
		 * @param {*} sCountryCode 
		 * @param {*} iBrandId 
		 * @param {*} sDivision 
		 */
		getAggregatedBrandPolicy: function (sCountryCode, iBrandId, sDivision) {
			this.getView().setBusy(true);
			return this.ppaState.getAggregatedBrandPolicy(sCountryCode, iBrandId, sDivision).then((brandPolicy) => {
				this.getView().setBusy(false);
				return brandPolicy;
			}).catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Get corresponding Products for brand
		 * @param {*} sCountryCode 
		 * @param {*} iBrandId 
		 * @param {*} sDivision 
		 */
		getProducts: function (sCountryCode, iBrandId, sDivision) {
			this.getView().setBusy(true);
			return this.ppaState.getProducts(sCountryCode, iBrandId, sDivision).then(() => {
				this.getView().setBusy(false);
				// this.onChangeDate();
				// this._bindSpecifySelect();
			}).catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		// /**sCountryCode, sProductPackId, sBrandId, sDivision
		//  * Get corresponding Products for brand
		//  * @param {*} sCountryCode 
		//  * @param {*} iBrandId 
		//  * @param {*} sProductPackId
		//  * @param {*} sDivision 
		//  */
		// getApprovals: function (sCountryCode, iBrandId, sDivision) {
		// 	this.getView().setBusy(true);
		// 	this.ppaState.getApprovals(sCountryCode, iBrandId, sDivision).then((response) => {
		// 		this.getView().setBusy(false);
		// 	}).catch((error) => {
		// 		console.error(error);
		// 		this.getView().setBusy(false);
		// 		this.getRouter().getTargets().display("detailObjectNotFound");
		// 		this.getOwnerComponent().oListSelector.clearMasterListSelection();
		// 	});
		// },

		/**sCountryCode, sDivision
		 * Get country approvers
		 * @param {*} sCountryCode 
		 * @param {*} sDivision 
		 */
		getCountryApprovers: function (sCountryCode, sDivision) {
			this.getView().setBusy(true);
			this.ppaState.getCountryApprovers(sCountryCode, sDivision).then(() => {
				this.getView().setBusy(false);
			}).catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**sCountryCode, sDivision
		 * Get country approvers
		 * @param {*} sCountryCode
		 */
		getApproverTypes: function (sCountryCode) {
			this.getView().setBusy(true);
			this.ppaState.getApproverTypes(sCountryCode).then(() => {
				this.getView().setBusy(false);
			}).catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView : function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path : sObjectPath,
				events: {
					change : this._onBindingChange.bind(this),
					dataRequested : function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange : function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.BrandId,
				sObjectName = oObject.BrandId,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded : function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/* Approval section logic*/
		onApprovalItemDetail: function(oEvent){
			
			// Set the binding context from the selected appoval
			let oCtx = oEvent.getSource().getBindingContext("ppa");
			let oDetailForm = this.byId("idApprovalDetailForm");
			oDetailForm.setBindingContext(oCtx, "ppa");

			oDetailForm.setVisible(true);
		},

		onConfirmApproval: function(oEvent){
			this.byId("idApprovalDetailForm").setVisible(false);
		},
		
		onApprovalItemSelect: function(oEvent){
			var oApprovalsTable = this.byId("idMandatoryTable");
		},
		/* End of Approval section logic */

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout",  this.getModel("appView").getProperty("/previousLayout"));
			}
		},

		/**
		 * Send button handler for the approvals table
		 * send approvals = save to database & change status
		 * @param {Object} oEvent object
		 */
		onSendApprovals: function(oEvent){

			var that = this;

			//show loading screen
			let bApprovalsValid = this.onValidateApprovals();
			let aProductsNotValid = this.onValidatePricesAtApproval();

			const aProductPolicyWithNspPricesHighterThanMspPrices = this.getProductPolicyWithNspPricesHighterThanMspPrices();
			
			
			if(bApprovalsValid){

				// check if there are any products with NSP prices higher than the MSP prices
				if(aProductPolicyWithNspPricesHighterThanMspPrices.length > 0 ){
					
					let productPackIDs = aProductPolicyWithNspPricesHighterThanMspPrices.map(product => product.productPackId);
					let productNames = productPackIDs.map(productPackID => this.ppaState.getProductNameById(productPackID));
	
					sap.m.MessageBox.error(`Prices for the following products have NSP values higher than the MSP values, which is not allowed. \n\n ${productNames.join('\n')}`);
	
				}else if(aProductsNotValid.length > 0 ){

					let productNames = aProductsNotValid.map(product => product);
	
					//add products list
					sap.m.MessageBox.warning(`Prices for the following products are missing. Do you want to continue? \n\n ${productNames.join('\n')}`, {
						actions: ["Continue", sap.m.MessageBox.Action.CANCEL],
						emphasizedAction: "Continue",
						onClose: function(sAction){
							switch(sAction){
								case "Continue" : that._sendApprovals(); break;
								case "CANCEL"   : that.getView().setBusy(false); break;
								default: break;
							}
						}
					});

				}else {
						that._sendApprovals();
				}
			}else{
				//show error
				sap.m.MessageBox.error("Comments can not be longer then 500 characters");					
			}

			//});
			// TODO: check if setCancelApprovalsPressed is necessary - is not used at the moment
			// Keep track that we pressed Send Approval button
			// this.ppaState.setSendApprovalsPressed(true);

		},

		_sendApprovals: function(){

			this.getView().setBusy(true);

			//save Approvals (&status)
			this.ppaState.sendApprovals("Processing").then(msgSuccess => {
				//Reload master list so status is updated
				this.refreshMasterViewBrandListBinding();

				// reload the Approvals to get the latest data from the backend.
				this.refreshApprovals();
				
				this.getView().setBusy(false);

				sap.m.MessageBox.success(msgSuccess, {});
			}).catch(err => {
				sap.m.MessageBox.warning(err, {});
				this.getView().setBusy(false);
			});

			//disable edit mode
			this.ppaState.setEditMode(false);

			
		},

		//are the approvals valid to be send?..
		onValidateApprovals: function (){
			
			let bApprovalsValid = true;
			let aApprovalsToBeSent = this.ppaState.getApprovalsToBeSent();

			aApprovalsToBeSent.map(approval=>{

				//comment can not be longer then 500
				if(approval.senderComment){
					bApprovalsValid = approval.senderComment.length > 499 ? false : bApprovalsValid;
				}
					
				//comment can not be longer then 500
				if(approval.approverComment){
					bApprovalsValid = approval.approverComment.length > 499 ? false : bApprovalsValid;
				}
				
				return approval;
			})

			return bApprovalsValid;
			
			
		},

		onValidatePricesAtApproval: function(){

			let aInvalidProducts = [];

			//validate if all products have prices assigned
			let oDraftBrandPolicy = this.ppaState.data.aggregatedBrandPolicy.draftBrandPolicy;

			//let promises = oDraftBrandPolicy.productPolicies.map(oProductPolicy => {
			if(oDraftBrandPolicy){
				oDraftBrandPolicy.productPolicies.forEach(oProductPolicy => {
					if(oProductPolicy && oProductPolicy.policyPrices.length > 0 ){
						for(let i = 0; i < oProductPolicy.policyPrices.length; i++){
							if(oProductPolicy.policyPrices[i].price === '0' || oProductPolicy.policyPrices[i] === null || oProductPolicy.policyPrices[i].price === ""){
								aInvalidProducts.push(this.ppaState.getProductNameById(oProductPolicy.productPackId));
								break;
							}
						}
					} else {
						aInvalidProducts.push(this.ppaState.getProductNameById(oProductPolicy.productPackId));
					}
				});
			}


			return aInvalidProducts;
		},

		/**
		 * Returns a list of products containing prices with NSP values greater than the MSP value
		 * @return {Array} a list of products
		 */
		getProductPolicyWithNspPricesHighterThanMspPrices: function(){

			const aProductPolicies = this.ppaState.data.aggregatedBrandPolicy.draftBrandPolicy.productPolicies;

			if(aProductPolicies && aProductPolicies.length > 0){

				return aProductPolicies.filter(policy => {

					const msp = policy.getMspPrices();
					const nsp = policy.getNspPrices();
					let isNspHigher = false;

					for (const [key, value] of Object.entries(msp)) { 
						
						if(+nsp[key] > +value){ 

							console.log(`${key}: MSP = ${value} NSP = ${nsp[key]}`);

							isNspHigher = true;
							break;
						}
					}

					return isNspHigher;

				});

			}

			return [];

		},

		/**
		 * Cancel button handler for the approvals table
		 */
		onCancelApprovals: function(oEvent){

			//show loading screen
			this.getView().setBusy(true);

			if (!this.currentCountryCode || !this.currentBrandId || !this.currentDivision) {
				sap.m.MessageBox.warning("No brand selected. Please select a brand from the brands section.", {});
				return;
			}

			// TODO: check if setCancelApprovalsPressed is necessary - is not used at the moment
			// Keep track that we pressed Send Approval button
			this.ppaState.setCancelApprovalsPressed(true);

			//save Approvals (&status)
			this.ppaState.sendApprovals("Cancelling").then(() => {
				//Reload master list so status is updated
				this.refreshMasterViewBrandListBinding();

				this.getView().setBusy(false);
			});

			//disable edit mode
			this.ppaState.setEditMode(false);
		},

		onEditModePress: function(oEvent){
			this.ppaState.setEditMode(true);
		},

		onEditModeMSP: function(oEvent){

			if(this.checkEffectiveDateChanged()){
				if(!this.ppaState.isEmpty(this.ppaState.getSelectedProduct().draftProductPolicy)){
					this.setMspEditMode(true);
					this.setNspEditMode(false);
					this.ppaState.setMspPanelExpanded(true);
					this.byId("idBtnEditMspPolicy").setEnabled(false);
					this.byId("idBtnEditNspPolicy").setEnabled(false);
				}
			}
		},

		onEditModeNSP: function(oEvent){

			if(this.checkEffectiveDateChanged()){
				if(!this.ppaState.isEmpty(this.ppaState.getSelectedProduct().draftProductPolicy)){
					this.setMspEditMode(false);
					this.setNspEditMode(true);
					this.ppaState.setNspPanelExpanded(true);
					this.byId("idBtnEditMspPolicy").setEnabled(false);
					this.byId("idBtnEditNspPolicy").setEnabled(false);
				}
			}
		},

		checkEffectiveDateChanged: function(){
			let dEffectiveDate = new Date(this.getView().getModel('ppa').getProperty("/aggregatedBrandPolicy/draftBrandPolicy/validFrom")).toDateString();
			let LatestApprovalEffectiveDate = new Date(this.ppaState.data.brand.validFrom).toDateString();

			if(dEffectiveDate && ( !LatestApprovalEffectiveDate || LatestApprovalEffectiveDate <= dEffectiveDate)) {
				return true
			} else {
				const msgErrorEffectiveDate = 'Please enter a new effective date before entering a new pricing policy.';
				sap.m.MessageBox.error(msgErrorEffectiveDate, {});

				return false;
			}	
      
		},

		onCancelMSP: function(oEvent){
			// reload the corresponding Product Policy
			const policyId = this.ppaState.getSelectedProduct().draftProductPolicy.iD;

			//show loading screen
			this.getView().setBusy(true);

			this.ppaState.getProductPolicy(policyId).then(() => {
				this.setMspEditMode(false);
				this.byId("idBtnEditNspPolicy").setEnabled(true);
				this.byId("idBtnEditMspPolicy").setEnabled(true);

				// clear the input values states which are in error
				this.clearPricingPolicyValueStates("MSP");

				this.calculatePriceDifferenceProductSelect(this.ppaState.getSelectedProduct());

				this.getView().setBusy(false);
			});

			
		},

		onCancelNSP: function(oEvent){
			// reload the corresponding Product Policy
			const policyId = this.ppaState.getSelectedProduct().draftProductPolicy.iD;

			//show loading screen
			this.getView().setBusy(true);

			this.ppaState.getProductPolicy(policyId).then(() => {
				this.setNspEditMode(false);
				this.byId("idBtnEditNspPolicy").setEnabled(true);
				this.byId("idBtnEditMspPolicy").setEnabled(true);

				// clear the input values states which are in error
				this.clearPricingPolicyValueStates("NSP");

				this.calculatePriceDifferenceProductSelect(this.ppaState.getSelectedProduct());

				this.getView().setBusy(false);
			});
			
		},

		clearPricingPolicyValueStates: function(sSection){
			const aInputObjects = this.getView().getControlsByFieldGroupId(sSection);
			aInputObjects.map(oInput => { 
				oInput.setValueState("None");
				oInput.setValueStateText();
			});
		},

		setMspEditMode: function(bMode){
			if(!this.ppaState.isEmpty(this.ppaState.getSelectedProduct().draftProductPolicy)){
				this.ppaState.getSelectedProduct().draftProductPolicy.setMspEditMode(bMode);
				this.ppaState.updateModel();
			}
		},

		setNspEditMode: function(bMode){
			if(!this.ppaState.isEmpty(this.ppaState.getSelectedProduct().draftProductPolicy)){
				this.ppaState.getSelectedProduct().draftProductPolicy.setNspEditMode(bMode);
				this.ppaState.updateModel();
			}
		},
		/**
		 * Save Prices MSP
		 * @param {} oEvent 
		 */
		onSaveMSP: function(oEvent){

			//show loading screen
			this.getView().setBusy(true);

			let oDraftProductPolicy = this.ppaState.getSelectedProduct().draftProductPolicy;

			//save prices
			this.savePrices("MSP", oDraftProductPolicy).then(() => {
				
				//Reload policy so status is shown & PolicyID will be captured
				this.onRefreshPolicyPress();
				
				//Reload master list so status is updated
				this.refreshMasterViewBrandListBinding();

				//Display mode MSP
				this.setMspEditMode(false);
				this.byId("idBtnEditMspPolicy").setEnabled(true);
				this.byId("idBtnEditNspPolicy").setEnabled(true);
				
				//Close panels 
				this.ppaState.setMspPanelExpanded(false);
				this.ppaState.setNspPanelExpanded(false);
				
				//show loading screen
				this.getView().setBusy(false);
				
				//Success message
				const msgSuccess = 'MSP Prices have been saved.';
				sap.m.MessageBox.success(msgSuccess, {});

			});

		},
		/**
		 * Save Prices NSP
		 * @param {*} oEvent 
		 */
		onSaveNSP:  function(oEvent){

			//show loading screen
			this.getView().setBusy(true);

			let oDraftProductPolicy = this.ppaState.getSelectedProduct().draftProductPolicy;

			//save prices
			this.savePrices("NSP", oDraftProductPolicy).then(() => {

				//Reload policy so status is shown & PolicyID will be captured
				this.onRefreshPolicyPress();

				//Reload master list so status is updated
				this.refreshMasterViewBrandListBinding();
				
				//Display mode NSP
				this.setNspEditMode(false);
				this.byId("idBtnEditNspPolicy").setEnabled(true);
				this.byId("idBtnEditMspPolicy").setEnabled(true);

				//Close panels 
				this.ppaState.setMspPanelExpanded(false);
				this.ppaState.setNspPanelExpanded(false);

				//show loading screen
				this.getView().setBusy(false);

				//Success message
				const msgSuccess = 'NSP Prices have been saved.';
				sap.m.MessageBox.success(msgSuccess, {});
			});
		},

		/**
		* Save prices as a whole
		*/
		savePrices: function(sCase, oDraftProductPolicy){
			//Save prices
			return this.ppaState.savePrices(sCase, oDraftProductPolicy);
		},

		/**
		 * Refresh button handler for the approvals table
		 */
		onRefreshApprovalsPress: function(){
			this.refreshApprovals();
		},

		refreshApprovals: function(){

			if (!this.currentCountryCode || !this.currentBrandId || !this.currentDivision) {
				sap.m.MessageBox.warning("No brand selected. Please select a brand from the brands section.", {});
				return;
			}

			const oTable = this.byId("idMandatoryTable");
			oTable.setBusyIndicatorDelay(0);
			oTable.setBusy(true);

			//this.getApprovals(this.currentCountryCode, this.currentBrandId, this.currentDivision);
			this.ppaState.getApprovalRequest(this.ppaState.data.brand).then(() => oTable.setBusy(false));

		},

		onRefreshPolicyPress: function(){

			//show loading screen
			this.getView().setBusy(true);

			if (!this.currentCountryCode || !this.currentBrandId || !this.currentDivision) {
				
				sap.m.MessageBox.warning("No brand selected. Please select a brand from the brands section.", {});
				this.getView().setBusy(false);
				return;

			}
			
			//reload aggregated Policy (so id's are filled from back-end)
			this.ppaState.getAggregatedBrandPolicy(this.currentCountryCode, this.currentBrandId, this.currentDivision).then(() => {

				//reload Products
				this.getProducts(this.currentCountryCode, this.currentBrandId, this.currentDivision).then(() => {
					
					
					//get Product Table & selected product within table
					let oProductsTable = this.byId("idProductsTable");
					if(oProductsTable.getSelectedItem()){

						let oSelectedProduct = this.getView().getModel('ppa').getProperty(oProductsTable.getSelectedItem().getBindingContextPath());		
						//this.ppaState.setSelectedProduct(oSelectedProduct);
						
						this.getView().setBusy(false);
					
						// Load the corresponding Product Policy ==> allready done by using the aggregated
						this.ppaState.getProductPolicy(oSelectedProduct.policyId).then(() => {
							this.getView().setBusy(false);
						}).catch((error) => {
							this.getView().setBusy(false);
						});
						

					}
				}).catch((error) => {
					console.error(error);
					this.getView().setBusy(false);
					this.getRouter().getTargets().display("detailObjectNotFound");
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
				});

			});
		},

		onEditEffctvDate: function(oEvent){
			this.setEffectiveDateEditMode(true);

			//EffectiveDate
			let dEffectiveDate = this.byId("idEffectiveDate").getDateValue();
			if(dEffectiveDate){
				this.ppaState.setPreviousEffDate(dEffectiveDate);
			} /*else {
				this.byId("idEffectiveDate").setDateValue(new Date());
			}*/
		},


		onSaveEffctvDate: function(){
			
			//show busy indicator
			sap.ui.core.BusyIndicator.show(0);
			this.setEffectiveDateEditMode(false);

			//EffectiveDate
			//let dEffectiveDate = this.byId("idEffectiveDate").getDateValue();
			let dEffectiveDate = this.getView().getModel('ppa').getProperty("/aggregatedBrandPolicy/draftBrandPolicy/validFrom");

			// Convert EffectiveDate to UTC time
			//const timeOffsetInMS = dEffectiveDate.getTimezoneOffset() * 60000;
			//dEffectiveDate.setTime(dEffectiveDate.getTime() - timeOffsetInMS);

			this.ppaState.setBrandPolicyEffectiveDate(dEffectiveDate);

			//Save Brand Policy
			this.ppaState.saveBrandPolicy().then((response) => {

				//get draft version
				const draftPolicy  = response.find(res => res.data.Status.indexOf("Draft") > -1);

				// after creating a new draft BrandPolicy update the ApprovalRequest object
				this.ppaState.updateApprovalRequestWithDraftPolicy(draftPolicy);

				//load full data again (otherwise we have to re-create the empty productPolicy here)
				this.ppaState.getAggregatedBrandPolicy(draftPolicy.data.CountryCode, draftPolicy.data.BrandId, draftPolicy.data.Division).then((brandPolicy) => {
					//refresh brandpolicy & brand
					this.getActiveBrandPolicy(this.currentCountryCode, this.currentBrandId, this.currentDivision);
					this.getBrand(this.currentCountryCode, this.currentBrandId, this.currentDivision);

					// Change the approval statuses to 'Not Sent' 
					//this.ppaState.setAndUpdateApprovalRequestStatuses("Not Sent");
					this.refreshMasterViewBrandListBinding();

					if(this.ppaState.data.aggregatedBrandPolicy.getApprovedBrandPolicy()){
						this.calculatePriceReduction(0, 0, false);

						this.ppaState.saveDraftPolicyPricesForAllProducts().then((response) => {
							this.refreshApprovals();
							this.handleEffectiveDateUpdate();
						});
					} else {
						this.handleEffectiveDateUpdate();
					}
				});

			});

		},

		handleEffectiveDateUpdate: function(){
			this.closePricingPanels();
			this.getProducts(this.currentCountryCode, this.currentBrandId, this.currentDivision).then((producs) => {

				let oProductsTable = this.byId("idProductsTable");

				// //products table
				if(oProductsTable){
					oProductsTable.removeSelections(true)
				}
		
				//Success message
				sap.ui.core.BusyIndicator.hide();
				const msgSuccess = 'Effective date has been updated.';
				sap.m.MessageBox.success(msgSuccess, {});

			});
		},

		refreshMasterViewBrandListBinding: function(){
			const _oComponent = this.getOwnerComponent();
			const oList = _oComponent.oListSelector._oList;
			const oListBinding = oList.getBinding("items");
			oListBinding.refresh(true);
		},

		onCancelEffctvDate: function(){
			this.setEffectiveDateEditMode(false);
			// refresh BrandPolicy and Brand
			this.getActiveBrandPolicy(this.currentCountryCode, this.currentBrandId, this.currentDivision);
			this.getBrand(this.currentCountryCode, this.currentBrandId, this.currentDivision);
			this.getView().getModel("dateModel").setProperty("/enabled", false);

			//EffectiveDate
			let dPrevEffDate = this.ppaState.getPreviousEffDate();
			if(!Date.parse(dPrevEffDate)){
				this.byId("idEffectiveDate").setDateValue();
			} else {
				this.byId("idEffectiveDate").setDateValue(dPrevEffDate);
			}

		},

		setEffectiveDateEditMode: function(bEnabled){
			this.byId("idBtnEditEffctvDate").setEnabled(!bEnabled);
			this.byId("idEffectiveDate").setEnabled(bEnabled);
			this.byId("idBtnSaveEffctvDate").setVisible(bEnabled);
			this.byId("idBtnCancelEffctvDate").setVisible(bEnabled);
		},

		validatePrice: function(oEvent){

			const sPath = oEvent.getSource().getBindingPath("value").split("/").pop();
			const sChannel  = oEvent.getSource().getBindingPath("value").split("/").pop().split("_").pop();
			const sPanel = oEvent.getSource().getBindingPath("value").split("/")[3];
			const sSection = sPanel.substr(0,3).toUpperCase();

			// const vBox = oEvent.getSource().getParent();
			// const aVboxInputObjects = vBox.getItems().filter(oInput => oInput.getMetadata()._sClassName.indexOf("sap.m.Input") > -1);
			// const sPanel = oEvent.getSource().getBindingPath("value").split("/")[3];
			const aInputObjects = this.getView().getControlsByFieldGroupId([sSection,sChannel]);
			const oSaveBtn = sPanel.indexOf("mspPrices") > -1 ? this.byId("idBtnSaveMSP") : this.byId("idBtnSaveNSP");
			
			let bValid = true;
			let aValidations = aInputObjects.map(oInput => this.validateInput(oInput));
			// bValid = this.validateInput(oEvent.getSource());
			let bInValid = aValidations.find(valid => valid === false);

			if(typeof bInValid !== "undefined" && !bInValid){
				bValid = false;
			}

			// toogle the save button 
			oSaveBtn.setEnabled(bValid);

			this.calculatePriceDifferenceProductSelect(this.ppaState.getSelectedProduct());
			
		},

		validateInput: function(oInput){ 

			const priceType = new this.customTypes.Price();
			const sPath = oInput.getBindingPath("value").split("/").pop();
			const sPanel = oInput.getBindingPath("value").split("/")[3];
			const sChannel  = oInput.getBindingPath("value").split("/").pop().split("_").pop();
			const sRole = oInput.getBindingPath("value").split("/").pop().split("_")[0];
			const price = +priceType.parseValue(oInput.getValue());
			const policyPrices = sPanel.indexOf("mspPrices") > -1 ? this.ppaState.getSelectedProduct().draftProductPolicy.mspPrices : this.ppaState.getSelectedProduct().draftProductPolicy.nspPrices;

			// const approvedPolicyPrices = sPanel.indexOf("mspPrices") > -1 ? this.ppaState.getSelectedProduct().approvedProductPolicy.mspPrices : this.ppaState.getSelectedProduct().approvedProductPolicy.nspPrices;
			// //const percDifferences = sPanel.indexOf("mspPrices") > -1 ? this.ppaState.getSelectedProduct().MspPricePercDiff : this.ppaState.getSelectedProduct().NspPricePercDiff;
			// if(sPanel.indexOf("mspPrices") > -1){
			// 	if(approvedPolicyPrices){
			// 		this.ppaState.getSelectedProduct().MspPricePercDiff[sPath] = Math.round(this.calculatePriceDifference(price, Number(approvedPolicyPrices[sPath]))) + "%";
			// 	}
			// } else {
			// 	if(approvedPolicyPrices){
			// 		this.ppaState.getSelectedProduct().NspPricePercDiff[sPath] = Math.round(this.calculatePriceDifference(price, Number(approvedPolicyPrices[sPath]))) + "%";
			// 	}
			// }
			//const priceDifferencePerc = Math.round(this.calculatePriceDifference(price, Number(approvedPolicyPrices[sPath]))) + "...%";
			const sPriceType = sPanel.indexOf("mspPrices") > -1 ? "msp" : "nsp";

			let bValid = true;

			// we need to set the price here because the new price is not yet available in the state at this moment.
			policyPrices[sPath] = price;
			//percDifferences[sPath] = Math.round(this.calculatePriceDifference(price, Number(approvedPolicyPrices[sPath]))) + "...%";

			const selectedProduct = this.ppaState.getSelectedProduct();
			const listPrice = +selectedProduct.listPrice;

			const isChannelPriceValid = this.validateChannelPrices(sPriceType, sChannel, sRole);
			const isRolPriceValid = this.validateRolePrices(sRole, sChannel);
			
			if(price > listPrice){
				bValid = false;
				oInput.setValueState("Error");
				oInput.setValueStateText("The value must be lower or equal to the list price.");
			}else if(!isChannelPriceValid.valid){
				bValid = false;
				oInput.setValueState("Error");
				oInput.setValueStateText(isChannelPriceValid.msg);
			}else if(!isRolPriceValid.valid){
				bValid = true;
				oInput.setValueState("Warning");
				oInput.setValueStateText(isRolPriceValid.msg);
			}else{
				oInput.setValueState("None");
				oInput.setValueStateText();
			}

			return bValid;
		},

		calculatePriceDifference: function(sDraftPrice, sValidatedPrice){

			if(sValidatedPrice > 0){
				return Math.round((sDraftPrice - sValidatedPrice) / sValidatedPrice * 100);
			}

			return 0;
			
		},

		validateChannelPrices: function(sPriceType, sChannel, sRole){

			let bValid = true;
			let msg = "";

			const oChannelPrices = this.ppaState.getSelectedProduct().draftProductPolicy.getPricesForChannelByPriceType(sPriceType,sChannel);

			switch(sRole){
				case "CDH":
					if(oChannelPrices["CDH"] > oChannelPrices["HBU"]){
						msg = "CDH price must be lower than the HBU price";
						bValid = false;
					}else if(oChannelPrices["CDH"] > oChannelPrices["NSMSMFM"]){
						msg = "CDH price must be lower than the NSM/SM/FM price";
						bValid = false;
					}
					break;
				case "HBU":
					if(oChannelPrices["HBU"] > oChannelPrices["NSMSMFM"]){
						msg = "HBU price must be lower than the NSM/SM/FM price";
						bValid = false;
					}
					break;
				default: break;
			}

			return {
				"valid": bValid,
				"msg": msg
			};

		},

		validateRolePrices: function(sRole, sChannel){

			let bValid = false;
			let msg = "";

			const oRolPrices = this.ppaState.getSelectedProduct().draftProductPolicy.getPricesForChannelByRole(sRole, sChannel);

			if(oRolPrices["NSP_Price"] > oRolPrices["MSP_Price"]){
				msg = "NSP price is higher than the MSP price";
			}else{
				bValid = true;
			}

			return {
				"valid": bValid,
				"msg": msg
			};

		},

		// 
		// Price Reduction Methods
		// 

		onEditPriceReduction: function(){
			this.setPriceReductionEditMode(true);
		},

		setPriceReductionEditMode: function(bEnabled){
			this.byId("idBtnEditPriceReduction").setEnabled(!bEnabled);
			this.byId("idMspPriceReductionInput").setEnabled(bEnabled);
			this.byId("idNspPriceReductionInput").setEnabled(bEnabled);
			this.byId("idBtnSavePriceReduction").setVisible(bEnabled);
			this.byId("idBtnCancelPriceReduction").setVisible(bEnabled);
		},

		onSavePriceReduction: function(oEvent){

			const bApprovedProductPolicies = this.ppaState.data.aggregatedBrandPolicy.getApprovedBrandPolicy();

			if(!bApprovedProductPolicies){
				sap.m.MessageBox.error("There are no approved product policies available.\nPrice reduction can't be calculated");
				return;
			}
			
			this.setPriceReductionEditMode(false);
			sap.ui.core.BusyIndicator.show(0);

			const mspReductionPercentage = +this.byId("idMspPriceReductionInput").getValue();
			const nspReductionPercentage = +this.byId("idNspPriceReductionInput").getValue();
			this.calculatePriceReduction(mspReductionPercentage, nspReductionPercentage, true);
			this.saveDraftPolicyPricesForAllProducts();
			
			let oProductsTable = this.byId("idProductsTable");

			// //products table
			this.closePricingPanels();
			if(oProductsTable){
				oProductsTable.removeSelections(true);
			}
		},

		/**
		 * Calculates price reduction for all products
		 */
		calculatePriceReduction: function(mspReductionPercentage, nspReductionPercentage, bUpdateStatus){

			const draftProductPolicies = this.ppaState.data.aggregatedBrandPolicy.getDraftBrandPolicy().getProductPolicies();

			// update the draft product policy status
			if(bUpdateStatus){
				this.updateProductPolicyStatus(draftProductPolicies, mspReductionPercentage, nspReductionPercentage);
			}

			if(this.ppaState.data.aggregatedBrandPolicy.getApprovedBrandPolicy()){
				const approvedProductPolicies =  this.ppaState.data.aggregatedBrandPolicy.getApprovedBrandPolicy().getProductPolicies();

				for(let i=0; i < approvedProductPolicies.length; i++){

					const apporvedMspPrices = approvedProductPolicies[i].getMspPrices();
					const apporvedNspPrices = approvedProductPolicies[i].getNspPrices();
					const draftMspPrices = draftProductPolicies[i].getMspPrices();
					const draftNspPrices = draftProductPolicies[i].getNspPrices();

					this.applyReduction(mspReductionPercentage, apporvedMspPrices, draftMspPrices);
					this.applyReduction(nspReductionPercentage, apporvedNspPrices, draftNspPrices);

				}
			}
			
			this.ppaState.updateModel();
			this.calculatePriceDifferenceProductSelect(this.ppaState.getSelectedProduct());
		},

		updateProductPolicyStatus: function(aProductPolicies, mspReductionPercentage, nspReductionPercentage){ 

			aProductPolicies.map(draftProductPolicy => {

				//if MSP reduction is applied --> msp = draft
				if(mspReductionPercentage >= 0){
					draftProductPolicy.mspStatus = 'Draft';
				}else{
					//if not yet on draft, then we could say that status will be set from Approved to "No Policy yet"
					if(draftProductPolicy.mspStatus !== 'Draft'){
						draftProductPolicy.mspStatus = 'No Policy yet';
					}
				}
	
				//if NSP reduction is applied --> nsp = draft
				if(nspReductionPercentage >= 0){
					draftProductPolicy.nspStatus = 'Draft';
				}else{
					//if not yet on draft, then we could say that status will be set from Approved to "No Policy yet"
					if(draftProductPolicy.mspStatus !== 'Draft'){
						draftProductPolicy.nspStatus = 'No Policy yet';
					}
				}

			});

		},

		/**
		 * Applies price reduction to the approved prices and 
		 * updates the draft prices accordingly based on the reduction percentage
		 */
		applyReduction: function(reductionPercentage, apporvedPrices, draftPrices){
			if(reductionPercentage >= 0){
				for (const rol_channel in apporvedPrices) {
					let price = +apporvedPrices[rol_channel];
					if(price > 0){
						//draftPrices[rol_channel] = (+apporvedPrices[rol_channel] / (1 + reductionPercentage / 100)).toFixed(2); // two digits after the comma
						draftPrices[rol_channel] = (+apporvedPrices[rol_channel] - (apporvedPrices[rol_channel] * reductionPercentage / 100)).toFixed(2);
					}
				}
			}			
		},

		saveDraftPolicyPricesForAllProducts: function(){
			// save reduction 
			this.ppaState.saveDraftPolicyPricesForAllProducts().then(() => { 

				//rebuild the aggregation object so we have all id's channels .. correctly refreshed & set
				this.getAggregatedBrandPolicy(this.currentCountryCode, this.currentBrandId, this.currentDivision).then(() => {
					//reload products so status is up to date in product table
					this.getProducts(this.currentCountryCode, this.currentBrandId, this.currentDivision).then(() => {
						
						//Reload master list so status is updated
						this.refreshMasterViewBrandListBinding();

						//show success message
						sap.ui.core.BusyIndicator.hide();
						sap.m.MessageBox.success("Price reduction successfully saved");
						this.clearPriceReductionInputFields();				
					});
				});

			});
		},

		onCancelPriceReduction: function(oEvent){
			this.setPriceReductionEditMode(false);
			this.clearPriceReductionInputFields();
			
		},

		clearPriceReductionInputFields: function(){
			this.byId("idMspPriceReductionInput").setValue();
			this.byId("idNspPriceReductionInput").setValue();
		},

		handleEffectiveDateChange: function(oInput){
			this.validateEffectiveDate(oInput);
		},

		validateEffectiveDate: function(oInput){ 
			
			let bValid = true;
			const sDraftDate = oInput.oSource.getDateValue();
			const ApprovedPolicyValidFrom = this.ppaState.data.aggregatedBrandPolicy.approvedBrandPolicy ? this.ppaState.data.aggregatedBrandPolicy.approvedBrandPolicy.validFrom : undefined;

			if(ApprovedPolicyValidFrom){
				if(sDraftDate <= ApprovedPolicyValidFrom){
					bValid = false;
					oInput.oSource.setValueState("Error");
					oInput.oSource.setValueStateText("The new effective date should be higher than the currently approved valid from date.");
				}else{
					oInput.oSource.setValueState("None");
					oInput.oSource.setValueStateText();
				}
			}
			
			this.getView().getModel("dateModel").setProperty("/enabled", bValid);

			return bValid;
		},

		//Text input field on approval
		handleLiveChange: function (oEvent) {
			var oTextArea = oEvent.getSource(),
				iValueLength = oTextArea.getValue().length,
				iMaxLength = oTextArea.getMaxLength(),
				sState = iValueLength > iMaxLength ? "Error" : "None";
		
			oTextArea.setValueState(sState);
		}


    
	});

});