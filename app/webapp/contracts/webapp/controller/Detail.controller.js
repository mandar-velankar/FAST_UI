sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"../model/datatypes/RequestedVolume",
	"../model/datatypes/CommissionRate",
	"../model/datatypes/OfferPrice",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/Token",
	"sap/m/Tokenizer",
], function (BaseController, JSONModel, formatter, RequestedVolume, CommissionRate, OfferPrice, mobileLibrary, Filter, FilterOperator, MessageToast, Token, Tokenizer) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.contracts.controller.Detail", {

		formatter: formatter,
		customTypes: {
			RequestedVolume,
			CommissionRate,
			OfferPrice
		},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {

			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy : false,
				delay : 0
			});

			// wire in the MessageManager for input validation for the custom types
			//const oRequestedVolume = this.byId("idRequestedVolume");
			//sap.ui.getCore().getMessageManager().registerObject(oRequestedVolume, true);
			const oCommissionRate = this.byId("idNspPerUnit");
			sap.ui.getCore().getMessageManager().registerObject(oCommissionRate, true);	

			this.i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			this.ctrState = this.getOwnerComponent().getState(this.getOwnerComponent().CTR);
			this.setModel(this.ctrState.getModel(), "ctr");
			this.oObjectPageLayout = this.byId("DetailPage");
			this.ctrState.setDetailPage(this.oObjectPageLayout);
			
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");
			
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress : function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
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
			this.sContractNumber =  oEvent.getParameter("arguments").objectId;
			this.sSectionParameter =  oEvent.getParameter("arguments").section;
			//this.sSectionParameter = this.ctrState.getSelectedSection();
			//if(this.sSectionParameter === null){
				this.sSectionParameter =  oEvent.getParameter("arguments").section;
			//}
			this.sProductIdParameter = oEvent.getParameter("arguments").productId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.oObjectPageLayout.setShowFooter(false);	
			//this.resetProductTables();

			//make detail sections invisible (only if navigation to productId happens, this will trigger sections to be visible again)
			var oDetail = this.getView();
			this.byId("idProductDetailSection").setVisible(false);
			
			// this.getModel().metadataLoaded().then( function() {
			// 	var sObjectPath = this.getModel().createKey("Contracts", {
			// 		ID :  sObjectId
			// 	});
			// 	this._bindView("/" + sObjectPath);
			// }.bind(this));

			//Load contract details
			this.getContractDetails(this.sContractNumber, false).then(() => {
				this.ctrState.setSelectedSection(this.sSectionParameter); //keep selected section
				this.ctrState.setEditEnabled();
				this.ctrState.setDeleteEnabled(false);

				//if selected product is available, re-select
				var aProducts = this.ctrState.getCurrentContract().getProducts();

				//probably a temp fix, but currently does the trick. It seems that whenever a new product is being added on a new contract, the sorter assigned is 1 instead of 0.
				//this implies that for some specific cases no product can be found, thus it can't be defaulted. 
				var oFirstProduct = aProducts.find(product => product.sorter == 0);

				//if this product can't be found, search for the product with sorter == 1
				if(!oFirstProduct){
					oFirstProduct = aProducts.find(product => product.sorter == 1);
				}

				//this.sProductIdParameter = (this.sProductIdParameter !== undefined) ? this.sProductIdParameter : (oFirstProduct ? oFirstProduct.productPackId || oFirstProduct.productCode : null);
				this.sProductIdParameter = this.sProductIdParameter || (oFirstProduct && ( oFirstProduct.productPackId || oFirstProduct.productCode ) ) || null;
				if(this.sProductIdParameter){
					this._selectProductInTable(this.sSectionParameter, this.sProductIdParameter);
				}
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});


		},
		
		resetProductTables: function() {
			//var oDetailView = this.getView("detail");
			//var oDeliveryView = oDetailView.byId("deliveryTrackingProductsViewId"); //subview of detail view

			//two possible table depending on section we are on
			const oContractProductsTable = this.byId("ProductsTableID");
			//const oDeliveryProductsTable = oDeliveryView.byId("idDeliveryTrackViewProductTable");

			/*var oSelectedItem = oDeliveryProductsTable.getSelectedItem();
			if(oSelectedItem){
				oSelectedItem.setSelected(false);
				oSelectedItem.setActive(false);
			}	*/

			oSelectedItem = oContractProductsTable.getSelectedItem();
			if(oSelectedItem){
				oSelectedItem.setSelected(false);
				oSelectedItem.setActive(false);
			}
		},

		/**
		 * Load all data for the contract details
		 * @param {} sContractNumber 
		 */
		getContractDetails: function(sContractNumber, bHardRefresh){
			this.getView().setBusy(true);
			
			return this.ctrState.getContractDetails(sContractNumber, bHardRefresh)
			.then(() => {
				//if current contract is available, load distributors & sellingcompanies
				this.getDistributors(this.ctrState.getCurrentContract().countryCode);
				this.getCountryCurrencies(this.ctrState.getCurrentContract().countryCode);
				this.getSellingCompanies(this.ctrState.getCurrentContract().countryCode);
				this.getChannels();
				this.getInstituteDistributorBrandProducts();

				//hide warning message
				if(this.ctrState.getCurrentContract().channel==="OTC"){
					this.byId("msgWarningEdit").setVisible(false);
				}else{
					this.byId("msgWarningEdit").setVisible(true);
				}
				

				//all loaded correctly, set busy indicator false
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Get list of distributors based on the country of the selected contract 
		 * @param {*} sCountryCode 
		 */
		getDistributors: function(sCountryCode){
			this.getView().setBusy(true);
			this.ctrState.getDistributors(sCountryCode)
			.then(() => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		getCountryCurrencies: function(sCountryCode){
			this.getView().setBusy(true);
			this.ctrState.getCountryCurrencies(sCountryCode)
			.then(() => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Get list of selling companies
		 * @param {*} sObjectPath 
		 */
		getSellingCompanies: function(sCountryCode){
			this.getView().setBusy(true);
			this.ctrState.getSellingCompanies(sCountryCode)
			.then(() => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Get channels for contracts
		 */
		getChannels: function(){
			this.getView().setBusy(true);
			this.ctrState.getChannels()
			.then(() => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Get list of InstituteDistributorBrandProducts 
		 */
		getInstituteDistributorBrandProducts: function(){
			this.getView().setBusy(true);
			this.ctrState.getInstituteDistributorBrandProducts()
			.then(() => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
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
				sObjectId = oObject.ContractId,
				sObjectName = oObject.Contract,
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
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

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
		 * Go to edit mode
		 */
		onEditModePress: function(oEvent){
			
			this.ctrState.setEditMode(true);
			this.oObjectPageLayout.setShowFooter(true);	
			this.byId("idProductDetailSection").setVisible(false);

			//this.hideDeliveryTrackingTab();
			//this.hideContractDetailsTab();

			this.ctrState.setPrevSelectedDistributorID(this.ctrState.getCurrentContract().distributorId);
			this.ctrState.setPrevSelectedSellingCompID(this.ctrState.getCurrentContract().sellingCompanyCode);
			this.ctrState.setPrevSelectedProduct(this.ctrState.getCurrentContract().getSelectedProduct());
		},

		/*hideDeliveryTrackingTab: function(){
			const selectedTab = this.byId("DetailPage").getSelectedSection().split("-").pop();
			if(selectedTab === "contractInformationId" && !this.ctrState.data.editModeContract){
				this.ctrState.setEditModeContract(true);
			}else{
				this.ctrState.setEditModeContract(false);
			}
		},*/

		/*hideContractDetailsTab: function(){
			const selectedTab = this.byId("DetailPage").getSelectedSection().split("-").pop();
			if(selectedTab === this.ctrState.getDeliverySectionId() && !this.ctrState.data.editModeDelivery){
				//this.ctrState.setEditModeDelivery(true);
			} else {
				this.ctrState.setEditModeDelivery(false);
			}
			
		},*/

		onDeleteTenderPress: function(oEvent){

			var that = this;
			var oCtrState = this.ctrState;
			var oRouter = this.getRouter();

			sap.m.MessageBox.warning("Are you sure you want to continue deleting this contract? All contract information will be lost", {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				styleClass: "sapUiSizeCompact",
				onClose: function (sAction) {
					if (sAction === "YES") {
						var oContract = oCtrState.getCurrentContract();
						oContract.enabled = false;

						//set products + deliveries/letters to enabled false
						for(var product in oContract.products){
							var oProduct = oContract.products[product];
							oProduct.enabled = false;

							/*for(var delivery in oProduct.Deliveries){
								oProduct.Deliveries[delivery].enabled = false;
							}

							for(var letter in oProduct.Letters){
								oProduct.Letters[letter].enabled = false;
							}*/

						}
						
						//update contract to enabled false
						oCtrState.updateContract(oContract).then((values) => {

							//refresh contracts list before navigating to it
							that.refreshContracts().then((values) => {
								
								//show message saying contract is deleted
								that.getView().setBusy(false);
								var msg = 'Contract is deleted.';
								MessageToast.show(msg);
								
								//navigating back to the master list
								oRouter.navTo("master");
								
							});

						});
						

					} else {
						//Do nothing and close the popup
					}
				}
			});
		},

		/**
		 * Set selected product
		 * @param {*} oEvent 
		 */
		onProductItemSelect: function(oEvent){
			const oSelectedItem = oEvent.getSource() instanceof sap.m.ColumnListItem ? oEvent.getSource() : oEvent.getSource().getSelectedItem();
			const oSelectedProduct = oSelectedItem.getBindingContext("ctr").getObject();
			const oCtrState = this.ctrState;

			this.ctrState.setSelectedProduct(oSelectedProduct);

			if(this.ctrState.getCurrentContract().getSelectedProduct()){
				this.byId("idProductDetailSection").setVisible(true);
			}

			const oProductsTable = this.byId("ProductsTableID");
			if (oProductsTable.getItems()){

				var iIndex = parseInt(oEvent.getParameter("id").substring(oEvent.getParameter("id").lastIndexOf('-') + 1));

				if (oCtrState.getProductItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					let oProduct = oProductsTable.getItems()[oCtrState.getProductItemEdit()];
					if (oProduct) {
						var aCells = oProduct.getCells();
						aCells.forEach(function (oCell, index) {
							try{
								oCell.setProperty("enabled", false);
							} catch (err){

							}
						});

						oCtrState.setProductItemEdit(-1);
					}
				}

				//now set the other line in edit mode
				let oProduct = oProductsTable.getItems()[iIndex];
				if (oProduct) {
					var aCells = oProduct.getCells();
					aCells.forEach(function (oCell, index) {
						try{
							if(!(oCell.getId()).includes('idNspPerUnit')){
								oCell.setProperty("enabled", oCtrState.data.editMode);
							}
						} catch(err) {

						}
					});

					oCtrState.setProductItemEdit(iIndex);
				}
			}
		},


		/**
		 * Confirm Product
		 */
		onConfirmProduct: function(oEvent){
			this.byId("idProductDetailSection").setVisible(false);
			//this.ctrState.setLetterItemEdit(-1);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		handleClose: function(oEvent){
			// this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			var that = this;

			if(that.ctrState.getProperty("editMode")){
				sap.m.MessageBox.warning("Are you sure you want to discard your changes?", {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					styleClass: "sapUiSizeCompact",
					onClose: function (sAction) {
						if (sAction === "YES") {
							that.onFooterCancelPress(oEvent);
							that.getRouter().navTo("master");
						} else {
							//do nothing and stay on page
						}
					}
				});
			} else {
				that.getRouter().navTo("master");
			}
		},

		/**
		 * Save changes
		 */
		onFooterSavePress: function(oEvent){ 
			//get current selected product
			var oSelectedProduct = this.ctrState.getCurrentContract().getSelectedProduct();
			//var oDeliveriesView  = this.getView("deliveryTrackingDeliveriesViewId");
			//var oLettersView     = this.getView("deliveryTrackingLettersViewId");

			//What are we saving, Contract or Delivery
			switch(this.ctrState.getSelectedSection()) {
				case this.ctrState.getContractSectionId():
					// validate 
					const bValid = this._validateProductForSaving();

					if(bValid){
						// save current contract
						this.getView().setBusy(true);
						this.ctrState.setEditMode(false);

						//re-select product
						if(oSelectedProduct){
							this.ctrState.getCurrentContract().setSelectedProduct(oSelectedProduct);
							this._selectProductInTable(this.ctrState.getSelectedSection(), oSelectedProduct.productPackId);
						}

						this.ctrState.saveCurrentContract().then((values) => {
							this.byId("idProductDetailSection").setVisible(false);
							this.getView().setBusy(false);
							var msg = 'Contract is saved.';
							MessageToast.show(msg);

							//go back to display mode
							//this.hideContractDetailsTab();
							this.oObjectPageLayout.setShowFooter(false);
						});
					}else{
						return;
					}
					
				  break;
				
				default:
				  // code block
			}
			
		},

		_switchTableLineDisplay: function(oTable, iLine){
			oTable.removeSelections();

			//another line is currently in edit mode. Set this back to display first.
			var oRow = oTable.getItems()[iLine];
			if (oRow) {
				var aCells = oRow.getCells();
				aCells.forEach(function (oCell, index) {
					oCell.setProperty("enabled", false);
				});
			}
		},

		_validateProductForSaving: function(){ 
			const products = this.ctrState.getCurrentContract().getProducts();
			const productsNotValidForSaving = products.filter(product => !this._isValidForSaving(product));

			if(productsNotValidForSaving.length > 0 ){

				let productNames = productsNotValidForSaving.map(product => product.product.pRODUCTPACKNAME);
				sap.m.MessageBox.error(`You must fill in all the mandatory fields for the following products: \n\n ${productNames.join()}`);

				return false;
			}

			return true;
		},

		_isValidForSaving: function(product){
			if(product){
				const unit = product.unit;
				const mspPerUnit = product.mspPerUnit;
				//const nspPerUnit = product.nspPerUnit;
				const mspApprovedByName = product.mspApprovedByName;
				const nspApprovedByName = product.nspApprovedByName;
				const mspApprovedByRole = product.mspApprovedByRole;
				const nspApprovedByRole = product.nspApprovedByRole;

				if(!unit || !mspPerUnit || !mspApprovedByName || !nspApprovedByName || !mspApprovedByRole || !nspApprovedByRole){
					return false;
				}

				return true;
			}
		},


		/**
		 * Cancel edit mode
		 */
		onFooterCancelPress: function(oEvent){
			//restore currentContract with backup
			//this.ctrState.restoreBackupCurrentContract();

			//get current contract number
			var sContractNumber = this.ctrState.getCurrentContract().contractNumber;

			//get current selected product
			var oSelectedProduct = this.ctrState.getCurrentContract().getSelectedProduct();
			var oPrevSelectedProduct = this.ctrState.getPrevSelectedProduct();

			//Load contract details again from database
			this.getContractDetails(this.sContractNumber, true).then(() => {

				//go back to display
				this.ctrState.setEditMode(false);

				//re-select product
				if(oSelectedProduct){
					this.ctrState.getCurrentContract().setSelectedProduct(oSelectedProduct);
					this._selectProductInTable(this.ctrState.getSelectedSection(), oSelectedProduct.productPackId);
					this.ctrState.setPrevSelectedProduct();
				}
				
				//make detail sections invisible
				
				this.byId("idProductDetailSection").setVisible(false);
				/*if(this.ctrState.getCurrentContract().getSelectedProduct()){
					this.byId("idProductDetailSection").setVisible(true);
				}*/

				//go back to display mode
				//this.hideContractDetailsTab();
				this.oObjectPageLayout.setShowFooter(false);
				
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});

		},

		/**
		 * On change distributor
		 */
		onChangeDistributor: function (oEvent){
			var that = this; 
			const oSelectedItem = oEvent.getParameter("selectedItem");
			const distributor = oSelectedItem.getBindingContext("ctr").getObject();
			const oDistributorInput = this.byId("idDistributor");
			var oCtrState = this.ctrState;
			var distributorId = oCtrState.getCurrentContract().distributorId;
			const products = this.ctrState.getCurrentContract().getProducts();

			if (products.length > 0) {

				/*const bContainsDeliveriesOrLetters = this.validateProductRemoval(products);

				if(bContainsDeliveriesOrLetters){
					this._showContainsDeliveriesOrLetters();
					oDistributorInput.setSelectedKey(oCtrState.getPrevSelectedDistributorID());
				}else{*/
					sap.m.MessageBox.warning("Are you sure you want to change the Distributor? Existing products will be removed.", {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						styleClass: "sapUiSizeCompact",
						onClose: function (sAction) {
							if (sAction === "YES") {
								oCtrState.setPrevSelectedDistributorID(oDistributorInput.getSelectedKey());
								oCtrState.updateDistributor(distributor);
								oCtrState.clearProducts();
								oCtrState.resetSelectedProduct();
								that.onConfirmProduct();
							} else {
								oDistributorInput.setSelectedKey(oCtrState.getPrevSelectedDistributorID());
							}
						}
					});
				//}
			} else {
				oCtrState.setPrevSelectedDistributorID(oDistributorInput.getSelectedKey());
				this.ctrState.updateDistributor(distributor);
				this.ctrState.clearProducts();
			};
		},

		/**
		 * On change selling company
		 */		
		onChangeSellingCompany: function (oEvent){

			const oSelectedItem = oEvent.getParameter("selectedItem");
			const sellingCompany = oSelectedItem.getBindingContext("ctr").getObject();
			const oSellingCompInput = this.byId("idSellingCompany");
			var oCtrState = this.ctrState;
			var sellingcompId = oCtrState.getCurrentContract().sellingCompanyCode;
			const products = this.ctrState.getCurrentContract().getProducts();

			if (products.length > 0) {

				/*const bContainsDeliveriesOrLetters = this.validateProductRemoval(products);

				if(bContainsDeliveriesOrLetters){
					this._showContainsDeliveriesOrLetters();
					oDistributorInput.setSelectedKey(oCtrState.getPrevSelectedDistributorID());
				}else{*/
					sap.m.MessageBox.warning("Are you sure you want to change the selling company? Existing products will be removed.", {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						styleClass: "sapUiSizeCompact",
						onClose: function (sAction) {
							if (sAction === "YES") {
								oCtrState.setPrevSelectedSellingCompID(oSellingCompInput.getSelectedKey());
								oCtrState.updateSellingCompany(sellingCompany);
								oCtrState.clearProducts();
								that.onConfirmProduct();
							} else {
								oSellingCompInput.setSelectedKey(oCtrState.getPrevSelectedSellingCompanyID());
							}
						}
					});
				//}				
			} else {
				oCtrState.setPrevSelectedDistributorID(oDistributorInput.getSelectedKey());
				this.ctrState.updateSellingCompany(sellingCompany);
				this.ctrState.clearProducts();
			}
		},

		onCalculateNspPrice: function(oEvent){
			/* Data retrieval for calculation*/
			let oModel = this.getModel('ctr');
			let sSelectedFocType = oModel.getProperty('/currentContract/selectedProduct/fOCType');
			let sSelectedFocAbsPct = oModel.getProperty('/currentContract/selectedProduct/fOC_ABS_PCT');
			let sQuantity =  (oEvent.getSource().sId).includes('idQuantity') ? parseFloat(oEvent.getParameter("value")) : oModel.getProperty('/currentContract/selectedProduct/product/quantity');
			let sMspPrice =  (oEvent.getSource().sId).includes('idMspPerUnit') ? parseFloat(oEvent.getParameter("value")) : oModel.getProperty('/currentContract/selectedProduct/mspPerUnit');
			let sFocAmount = (oEvent.getSource().sId).includes('focDiscount') ? parseFloat(oEvent.getParameter("value")) : oModel.getProperty('/currentContract/selectedProduct/focDiscount');

			/* Calculate intermediate values */
			let sTotalQuantity = parseFloat(sSelectedFocType === 'ADD' ? (parseInt(sQuantity) + (sSelectedFocAbsPct === 'FOC 2' ? Math.floor((sQuantity * sFocAmount) / 100) : sFocAmount)) : sQuantity);
			let sFocQuantity = parseFloat(sSelectedFocAbsPct === 'FOC 2' ? (Math.floor((sQuantity * sFocAmount) / 100)) : sFocAmount);
			let sPaidQuantity = parseFloat(sSelectedFocType === 'ADD' ? sQuantity : Math.floor(sQuantity - sFocQuantity));
			let sPaidAmount = parseFloat(sPaidQuantity * sMspPrice);
			let sNspPrice = (sPaidAmount / sTotalQuantity).toFixed(2);

			if(sNspPrice && sNspPrice !== 'NaN'){
				oModel.setProperty('/currentContract/selectedProduct/nspPerUnit', sNspPrice);
			}
		},

		/*_showContainsDeliveriesOrLetters: function(){
			sap.m.MessageBox.error("This action can not be performed. Some products still contain deliveries or letters.");
		},*/

		validateProductRemoval: function(products){
			if(!products){
				return;
			}

			/*if(products instanceof Array){
				const aProductsWithDeliveriesOrLetters = products.filter(product => (product.getDeliveries().length > 0 || product.getLetters().length > 0));
				return aProductsWithDeliveriesOrLetters.length > 0;
			}else{
				if(products.getEnabledDeliveries().length > 0){
					return products.getEnabledDeliveries();
				}else if(products.getEnabledLetters().length > 0){
					return products.getEnabledLetters();
				}
			}*/
		},

		/**
		 * Navigating between tabs
		 * @param {*} oEvent 
		 */
		onNavigate: function (oEvent){
			
			/* Keeping product selection consistent between both tabs : this will now be handled by navTo routing & selecting a product*/
			//this.onNavigateReselectProduct(oEvent);

			/* Keep selected section to use in state */
			this.setSelectedSection(oEvent);
			
      		//change url parameters
			var oRouter = this.getRouter();
			
			//product selected
			var oSelectedProduct = this.ctrState.getCurrentContract().getSelectedProduct();
			if(oSelectedProduct){
				//TODO why is it one time productPackId & other time productCode, this should always be the same
				var sProductId = oSelectedProduct && oSelectedProduct.productPackId || oSelectedProduct.productCode;
			}else{
				sProductId = null;
			}
			
			//make detail sections invisible
			var oDetail = this.getView();

			oRouter.navTo("object", {
				objectId : this.ctrState.getCurrentContract().contractNumber,
				section : this.ctrState.getSelectedSection(),
				productId : sProductId
			});
			
		},

		//depending on the section that is selected, we select the correct product
		_selectProductInTable: function(sSelectedSection, sProductId){
			
			//that is this
			var that = this;
			//var oDetailView = that.getView("detail");

			//two possible table depending on section we are on
			const oContractProductsTable = that.byId("ProductsTableID");

			//check wich section is open
			switch(sSelectedSection) {
				case that.ctrState.getContractSectionId():
					  
					// Contract should be selected in delivery table
					var aContractProducts = oContractProductsTable.getItems();
					  
				  	//Select again the same product
					aContractProducts.forEach(function (oProductLine) {

						//get product data
						var sPath = oProductLine.getBindingContextPath();
						var oProduct = that.getView().getModel("ctr").getProperty(sPath)

						//if this is the product that needs to be selected (TODO: productcode vs productpackid?)
						if (oProduct.productPackId === Number(sProductId) || oProduct.productCode === Number(sProductId)) {
							//select product
							oContractProductsTable.setSelectedItem(oProductLine, true);
							oProductLine.setSelected(true);
							oProductLine.setActive(true);
							oProductLine.firePress();
							oProductLine.setActive(true);
						}

					});					
				  break;

				default:
				  // code block
			}

		},
		
		/*  this will now be handled by navTo routing & selecting a product
		//Reselect selected item from other tab
		onNavigateReselectProduct: function (oEvent) {
			const oViewDeliveryProducts = this.getView("deliveryTrackingProductsViewId").byId("deliveryTrackingProductsViewId").byId("idDeliveryTrackViewProductTable");
			const oViewDetailProducts = this.byId("ProductsTableID");

			if((oEvent.getSource().getSelectedSection()).includes("deliveryTrackingId")) {
				// Navigating to the delivery tab. Get the current selected product in the Detail tab, and pass it on to the delivery products table 
				if(oViewDetailProducts.getSelectedItem()){
					const sDetailViewSelectedProduct = oViewDetailProducts.getSelectedItem().sId;

					if(sDetailViewSelectedProduct){
						var iIndex = parseInt(sDetailViewSelectedProduct.substring(sDetailViewSelectedProduct.lastIndexOf('-') + 1));
						var aProducts = oViewDeliveryProducts.getItems();
	
						oViewDeliveryProducts.setSelectedItem(aProducts[iIndex], true);
						aProducts[iIndex].setSelected(true);
					}
				}
			} else if((oEvent.getSource().getSelectedSection()).includes("contractInformationId")){
				// Navigating to the detail tab. Get the current selected product in the deliveries tab, and pass it on to the detail products table
				if(oViewDeliveryProducts.getSelectedItem()){
					var sDeliverySelectedProduct = oViewDeliveryProducts.getSelectedItem().sId;
					if(sDeliverySelectedProduct){
						var iIndex = parseInt(sDeliverySelectedProduct.substring(sDeliverySelectedProduct.lastIndexOf('-') + 1));
						var aProducts = oViewDetailProducts.getItems();

						oViewDetailProducts.setSelectedItem(aProducts[iIndex], true);
						aProducts[iIndex].setSelected(true);
					}
				}
			}
		},
		*/

		setSelectedSection: function(oEvent){
			//keep delivery tracking as selected section in state
			/*if((oEvent.getSource().getSelectedSection()).includes("deliveryTrackingId")){
				this.ctrState.setSelectedSection("deliveryTrackingId");
			}*/

			//keep delivery tracking as selected section in state
			if((oEvent.getSource().getSelectedSection()).includes("contractInformationId")){
				this.ctrState.setSelectedSection("contractInformationId");
			}
		},

		onCreateProduct: function(oEvent){

			const oProductsTable = this.byId("ProductsTableID");
			//oProductsTable.removeSelections();

			if (oProductsTable.getItems() && this.ctrState.data.editMode){
				var iIndex = parseInt(oEvent.getParameter("id").substring(oEvent.getParameter("id").lastIndexOf('-') + 1));

				if (this.ctrState.getProductItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					let oProduct = oProductsTable.getItems()[this.ctrState.getProductItemEdit()];
					if (oProduct) {
						var aCells = oProduct.getCells();
						aCells.forEach(function (oCell, index) {
							try{
								oCell.setProperty("enabled", false);
							} catch (err){

							}
						});

						this.ctrState.setProductItemEdit(-1);
					}
				}
			}

			this._getAddProductDialog().open();
		},

		onDeleteProduct: function(oEvent){
			const oSelectedItem = oEvent.getParameter("listItem");
			const selectedProduct = oSelectedItem.getBindingContext("ctr").getObject();
			const userAction = selectedProduct.userAction;

			let oProductsDetail = this.byId("idProductDetailSection");

			/*const containsDeliveriesOrLetters = this.validateProductRemoval(selectedProduct);

			if(containsDeliveriesOrLetters && containsDeliveriesOrLetters.length > 0){
				sap.m.MessageBox.error("This action can not be performed. This roduct still contains deliveries or letters.");
				return;
			}*/

			if(userAction === "create"){
				// remove product from the state
				this.ctrState.removeProductFromCurrentContract(selectedProduct);
			}else{
				// only soft delete -> enabled = false
				this.ctrState.softDeleteProduct(selectedProduct);
			}

			// refresh 
			oEvent.getSource().getBinding("items").refresh(true);
			this.ctrState.setLetterItemEdit(-1);
			oProductsDetail.setVisible(false);
		},

		onAddProductDialogConfirm: function(oEvent){
			var oProductsTable = this.byId("ProductsTableID");
			let oProductsDetail = this.byId("idProductDetailSection");

			//sort again by refresh items binding
			oProductsTable.getBinding("items").refresh(true);
			oProductsDetail.setVisible(false);

			this._getAddProductDialog().close();
		},

		_getAddProductDialog : function () { 

			if (!this._oAddProductDialog) {
				this._oAddProductDialog = sap.ui.xmlfragment(this.getView().getId(), "com.bayer.tender.contracts.view.fragments.AddProduct", this);
			  	this.getView().addDependent(this._oAddProductDialog);
			}

			// refresh ProductsOutput table binding
			const oTable = this.byId("idListProductsOutput");
			oTable.getBinding("items").refresh(true);

			return this._oAddProductDialog;
		 },

		 //move product up
		moveUp: function () {
			this.moveSelectedItem("Up");
		},
		//move product down
		moveDown: function () {
			this.moveSelectedItem("Down");
		},

		//move selected item
		moveSelectedItem: function (sDirection) {
			const oListOutput = this.byId("idListProductsOutput");

			this.getSelectedItemContext(oListOutput, function (oSelectedItemContext, iSelectedItemIndex) {
				var iSiblingItemIndex = iSelectedItemIndex + (sDirection === "Up" ? -1 : 1);
				var oSiblingItem = oListOutput.getItems()[iSiblingItemIndex];
				var oSiblingItemContext = oSiblingItem && oSiblingItem.getBindingContext("ctr");
				if (!oSiblingItemContext) {
					return;
				}

				// swap the selected and the siblings rank
				var oProductsModel = oListOutput.getModel("ctr");
				var iSiblingItemRank = oSiblingItemContext.getProperty("sorter");
				var iSelectedItemRank = oSelectedItemContext.getProperty("sorter");

				oProductsModel.setProperty("sorter", iSiblingItemRank, oSelectedItemContext);
				oProductsModel.setProperty("sorter", iSelectedItemRank, oSiblingItemContext);

				//sort again by refresh items binding
				oListOutput.getBinding("items").refresh(true);

				// after move select the sibling
				oListOutput.getItems()[iSiblingItemIndex].setSelected(true);
			});
		},

		getSelectedItemContext: function(oTable, fnCallback) {
			var aSelectedItems = oTable.getSelectedItems();
			var oSelectedItem = aSelectedItems[0];

			if (!oSelectedItem) {
				sap.m.MessageToast.show("Please select a row!");
				return;
			}

			var oSelectedContext = oSelectedItem.getBindingContext("ctr");
			if (oSelectedContext && fnCallback) {
				var iSelectedIndex = oTable.indexOfItem(oSelectedItem);
				fnCallback(oSelectedContext, iSelectedIndex, oTable);
			}

			return oSelectedContext;
      
		},

		/**
		 * Get an element from a sub-view of the detail view (subsections) - if you can't reach it directly
		 * @param {*} sSubSectionViewId 
		 * @param {*} sId 
		 */
		/*getControlFromDeliverySection: function(sSubSectionViewId,sId){
			//that is this
			var that = this;
			var oDetailView = that.getView("detail");
			var oDeliveryView = oDetailView.byId(sSubSectionViewId); //subview of detail view

			//get element from deliveryView
			if(oDeliveryView){
				return oDeliveryView.byId(sId);
			}
		},*/

		/** Refreshing list of contracts */
		refreshContracts: function(){
			this.getView().setBusy(true);
			return this.ctrState.getContracts(true)
			.then(() => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		//Select Brand: when you click on the F4 for Brands on adding a product to the offer of the tender
		brandNameList_f4: function () { 

			const that = this;

			if (!this._valueHelpSelectBrandDialog) {
				this._valueHelpSelectBrandDialog = new sap.m.SelectDialog(this.createId("idValueHelpSelectBrandDialog"), {
					title: this.i18n.getText("brandnme"),
					multiSelect: true,
					rememberSelections: true,
					items: {
						path: "ctr>/currentContract/uniqueBrands",
						template: new sap.m.StandardListItem({
							title: "{ctr>BRAND_NAME}",
							description: "{ctr>BRAND_ID}",
							selected: "{ctr>SELECTED}"
						})
					},
					liveChange: function (oEvent) {
						var sValue = oEvent.getParameter("value");
						var oFilter = new sap.ui.model.Filter("BRAND_NAME", sap.ui.model.FilterOperator.Contains, sValue);
						oEvent.getSource().getBinding("items").filter([oFilter]);
					},
					confirm: function (oEvent) {
						that._handleCloseBrandNameList(oEvent);
					},
					cancel: function (oEvent) {
						that._handleCloseBrandNameList(oEvent);
					}
				});
			}

			this.getView().addDependent(this._valueHelpSelectBrandDialog);
			this._valueHelpSelectBrandDialog.open();

		},

		_handleCloseBrandNameList: function (oEvent) { 

			var that = this;

			//selected brands
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {

				MessageToast.show("The following brands where selected: " + aContexts.map(function (oContext) {
					return oContext.getObject().BRAND_NAME;
				}).join(", "));

				//get multi input box
				var oBrandList = this.byId("idBrandList");
				var aBrandTokens = [];
				var aBrands = [];

				//push the selected brands 
				aContexts.map(function (oContext) {

					var oToken = new Token({
						text: oContext.getObject().BRAND_NAME,
						key: oContext.getObject().BRAND_ID
					});
					aBrandTokens.push(oToken);

					//Brands for filtering
					var oBrand = {
						BRAND_ID: oContext.getObject().BRAND_ID
					}
					aBrands.push(oBrand);

				});

				//add the array of tokens to the multi input
				oBrandList.setTokens(aBrandTokens);

				const aFilteredBrandProducts = this.filterBrandProducts(aBrands);
				this.ctrState.setProductCollection(aFilteredBrandProducts);

			} else {

				MessageToast.show("No new item was selected.");

			}
			// oEvent.getSource().getBinding("items").filter([]);
		},

		//Filter brand products to find only the products of the selected brand
		filterBrandProducts: function(aBrands){
			const aBrandProducts = this.ctrState.getCurrentContract().instituteDistributorBrandProducts;
			const aFilteredBrandProducts = aBrandProducts.filter(
				(elem) => aBrands.find(({
					BRAND_ID
				}) => elem.BRAND_ID === BRAND_ID)
			);

			return aFilteredBrandProducts;
		},

		//When the user is adding or removing a token
		onBrandTokenChange: function (oEvent) {

			var that = this;
			// var oFastAppDataModel = Services.getFastAppDataModel();

			//get multi input box
			var oBrandList = this.byId("idBrandList");
			// var oDefaultModel = Services.getDefaultModel();

			
			//Brands already existing in the multi input field
			that._aBrandTokens = oBrandList.getTokens();

			//added brands
			if (oEvent.getParameter('type') === Tokenizer.TokenUpdateType.Added) {
				var aBrandsAdded = oEvent.getParameter("addedTokens");
				aBrandsAdded.forEach(function (iIndex, oBrandToken) {
					that._aBrandTokens.push(oBrandToken);
				});

				// deselect removed brand
				const addedBrand = this.ctrState.getUniqueBrandById(aBrandsAdded[0].getKey());
				addedBrand.SELECTED = true;
				this.ctrState.updateModel();
			}

			//removed brands
			if (oEvent.getParameter('type') === Tokenizer.TokenUpdateType.Removed) {
				var aBrandsRemoved = oEvent.getParameter("removedTokens");
				aBrandsRemoved.forEach(function (oRemovedBrandToken, iIndex) {
					that._aBrandTokens = $.grep(that._aBrandTokens, function (oBrandToken) {
						return oBrandToken.getProperty("key") != oRemovedBrandToken.getProperty("key");
					});
				});

				// deselect removed brand
				const removedBrand = this.ctrState.getUniqueBrandById(aBrandsRemoved[0].getKey());
				removedBrand.SELECTED = false;
				this.ctrState.updateModel();
			}


			//load products for list
			if (that._aBrandTokens && that._aBrandTokens.length > 0) {

				const aBrands = [];
				that._aBrandTokens.map(token => {
					//Brands for filtering
					var oBrand = {
						BRAND_ID: token.getKey()
					}
					aBrands.push(oBrand);
				});

				const aFilteredBrandProducts = this.filterBrandProducts(aBrands);
				this.ctrState.setProductCollection(aFilteredBrandProducts);

			} else {
				//clearing
				var aEmpty = [];
				this.ctrState.setProductCollection(aEmpty);
			}

		},

		onPressAddProductToOutputList: function(){ 
			const oSourceTable = this.byId("idListProductsInput");
			const oSelectedItems = oSourceTable.getSelectedItems();
			const oSelectedProducts = oSelectedItems.map(item => item.getBindingContext("ctr").getObject());

			oSelectedProducts.map(this.addSelectedProductToTarget.bind(this));

		},

		//TODO async & await not supported in all browsers (IE not supported), (we could use the transpiler in the yaml file (compared to tender app))
		addSelectedProductToTarget: async function(product) { 
			const productPackId = product.PRODUCT_ID;

			// get the registered price for a fiven product
			const registeredPrice = await this.getCountryRegisteredPrice(product);
			product["COUNTRY_REGISTERED_PRICE"] = registeredPrice.data;

			const bProductIsAlreadyAddedToTheTargetTable = this.ctrState.getCurrentContract().getProductByProductPackId(productPackId);

			if(bProductIsAlreadyAddedToTheTargetTable && !bProductIsAlreadyAddedToTheTargetTable.enabled){
				bProductIsAlreadyAddedToTheTargetTable.enabled = true;

				// update binding
				this.byId("idListProductsOutput").getBinding("items").refresh(true);
			}else if(!bProductIsAlreadyAddedToTheTargetTable){
				this.ctrState.getCurrentContract().addProduct(product);
				this.ctrState.updateModel();
			}else {
				sap.m.MessageBox.show(`Product(${product.PRODUCT_NAME}) is already added.`, {
					title: "Error",
					icon: sap.m.MessageBox.Icon.ERROR
				});
			}
		},

		getCountryRegisteredPrice: function(product){

			if(product){
				const iProductId = +product.PRODUCT_ID;
				const sCurrency = this.ctrState.getCurrentContract().currency;
				const sCountryCode = this.ctrState.getCurrentContract().countryCode;

				return this.ctrState.getCountryRegisteredPrice(sCountryCode, iProductId, sCurrency).catch((error) => {
					//if no registerd price can be found.. we use empty discount & registered price will be saved as 0
					var oEmpty = { 
						data: {
							"COUNTRY_CODE": sCountryCode,
							"PRODUCT_ID": iProductId,
							"UOM": "Unit",
							"CURRENCY": sCurrency,
							"REGISTERED_PRICE": "0"
						}
					}
					return oEmpty;//Promise.Resolve(oEmpty);
				});

			
				// return new Promise(this.ctrState.getCountryRegisteredPrice(sCountryCode, iProductId, sCurrency).then((value) => {
				// 	//if registered price is found
				// 	return Promise.resolve(value);
				// }).catch((error) => {
				// 	//if no registerd price can be found.. we use empty
				// 	var oEmpty = {
				// 			"COUNTRY_CODE": sCountryCode,
				// 			"PRODUCT_ID": iProductId,
				// 			"UOM": "Unit",
				// 			"CURRENCY": sCurrency,
				// 			"REGISTERED_PRICE": "0"
				// 	}
				// 	return Promise.Resolve(oEmpty);
				// }));
				

			}
		},

		onPressRemoveProductFromOutputList:function(){
			const oTargetTable = this.byId("idListProductsOutput");
			const oSelectedItem = oTargetTable.getSelectedItem();
			const oSelectedProduct = oSelectedItem.getBindingContext("ctr").getObject();
			const userAction = oSelectedProduct.userAction;

			if(userAction === "create"){
				// remove product from the state
				this.ctrState.removeProductFromCurrentContract(oSelectedProduct);
			}else{
				// only soft delete -> enabled = false
				this.ctrState.softDeleteProduct(oSelectedProduct);
			}

			// refresh 
			oTargetTable.getBinding("items").refresh(true);

		},

		onOfferPriceChange: function(oEvent){

			const price = oEvent.getParameter("value");
			const product = oEvent.getSource().getBindingContext("ctr").getObject();

			product.calculateDiscount();

			this.ctrState.updateModel();
			
		},

		_onFolderButtonPress: function(oEvent){
			let oContract = this.ctrState.getCurrentContract();
			let url = "https://bayergroup.sharepoint.com/:f:/r/sites/FASTSystem/Shared%20Documents/Documents_Library/Countries/$CountryCode/$ContractNumber";
			
			url = url.replace("$CountryCode", oContract.countryCode);
			url = url.replace("$ContractNumber", oContract.contractNumber);
			window.open(url);
		}
		
	});

});