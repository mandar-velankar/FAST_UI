sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/financial",
	"sap/ui/core/Fragment",
	"com/bayer/tender/uilib/datatypes/PercentageType",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (Controller, formatter, Services, UserInfo, MomentJS, Financial, Fragment, PercentageType, Filter, FilterOperator) {
	"use strict";
	
	var bundle;

	return Controller.extend("FAST_NS0FAST0.controller.FinancialOffer_IT", {


		//Formatting functions
		formatter: formatter,
		types: {
			percent: PercentageType
		},

		onInit: function (oEvent) {

			const oViewModel = new sap.ui.model.json.JSONModel({
				delay: 0,
				selectedProductUoM: "",
			});

			this.getView().setModel(oViewModel, "finOfferView");

			//get resource bundle for translations or texts
			this._oOwnerComponent = this.getOwnerComponent();
			this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			//keep router and model locally in this controller
			this._oRouter = this._oOwnerComponent.getRouter();
			this._oModel = this._oOwnerComponent.getModel();
			bundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			this._DetailView = sap.ui.getCore().byId(this.getView().getId().split("---")[0] + "---tenderManagementDetailId");
			this._DetailController = this._DetailView.getController();

			Services.setRouterObject(this._oRouter);

			//attach the onTenderMatched method to handle routing between pages + load correct data
			this._oRouter.getRoute("master").attachPatternMatched(this._onTenderMatched, this);
			this._oRouter.getRoute("detail").attachPatternMatched(this._onTenderMatched, this);

			var oInput = this.byId("addDiscount");
			sap.ui.getCore().getMessageManager().registerObject(oInput, true);



		},

		//Navigation between TenderMaster & Detail pages routing is matched
		_onTenderMatched: async function (oEvent) {

            // This code should only for Italy
            if(Services.getSelectedCountry() !== "IT"){
                return;
            }

			// this method should only be called in case of Italy
			var sTab = oEvent.getParameter("arguments").tab || "";
			if (sTab && sTab.includes("financialOfferId_IT")) {
				await this.getCountryBrandProductsCombined();
				this.onBindingItemsFinished(oEvent, true); //TODO: check w/ Wouter if there's a more proper solution to do this, and why this method is not executed every time on view load

			
			}
			// let that = this;

			// // check if we are on the delivery tab, otherwise don't run the code after the if statement
			// if (sTab !== Services.getDeliveryTrackingPageSectionID()) {
			// 	return;
			// }


			// //get the tenderID/country from the navigation parameters
			// var sTenderID = oEvent.getParameter("arguments").tender;
			// var sCountry = oEvent.getParameter("arguments").country || "NA"; // if country is found in the link.. use NA
			// var sOfferID = oEvent.getParameter("arguments").offer;

			// //build tender path
			// var sTenderPath = "";
			// if (sTenderID) {
			// 	//example: PT_TMTEND(TenderID='SA-100-TEST-AH',Active=1)
			// 	sTenderPath = "/PT_TMTEND('" + sTenderID + "')";
			// } else {
			// 	sTenderPath = "/PT_TMTEND";
			// }

			// //keep selected tender + tender path & countrycode
			// Services.setSelectedTenderPath(sTenderPath);
			// Services.setSelectedTenderID(sTenderID);
			// Services.setSelectedCountry(sCountry);
			// Services.setSelectedOfferID(sOfferID);

		},
		getCountryBrandProductsCombined: async function(){
			//load products
			let aProducts = await this.getFinancialProducts(Services.getSelectedOfferID());

			//load countryBrandProducts
			let aCountryBrandProducts = await this.getCountryBrandProducts(Services.getSelectedCountry());

			aProducts = aProducts.map(product => {
				product.FreeGoodsOther = product.FreeGoodsOther && product.FreeGoodsOther.map(FreeGoodsOther => {
					var countryBrandProduct = aCountryBrandProducts.find(countryBrandProduct => countryBrandProduct.PRODUCT_ID === FreeGoodsOther.ProductPackId);
					FreeGoodsOther.ProductName = countryBrandProduct.PRODUCT_NAME;
					return FreeGoodsOther;
				}) || [];
				return product;
			});

			//set to fastappdata model for easy access on the view
			var oFastAppDataModel = Services.getFastAppDataModel();
			aProducts.sort((a, b) => (a.SORTER > b.SORTER) ? 1 : -1)
			oFastAppDataModel.setProperty("/ProductPricingView", aProducts);
			oFastAppDataModel.setProperty("/CountryBrandProducts", aCountryBrandProducts);
			return aProducts;
		},
		setFinancialOffer:function(){
			//Edit offer copy to move back to original values during cancel
			let sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);

//TEMP SOLUTION : for hotfix on currency problem - Currency problem due to IT view financial offer
            Services.getFastAppDataModel().setProperty("/CurrencyTEMP",  oOffer.Currency);
//TEMP SOLUTION

			//Services.getFastAppDataModel().setProperty("/EditProduct/", oProductPrice);

			let sSelectedSection = Services.getFinancialOfferPageSectionID_IT();
			Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection);

		},
		refreshFinancialTabIT: async function () {
			await this.getCountryBrandProductsCombined();
			this.setFinancialOffer();
		},

		handleValueHelp: function(oEvent){

			Services.getInstituteDistributorBrandProductsForItaly(Services.getInstituteIDofSelectedTender()).then((response) => {

				var oFastAppDataModel = Services.getFastAppDataModel();
				oFastAppDataModel.setProperty("/ItalyProducts", response.data.results);

	
			});

			var oView = this.getView();
			// create value help dialog
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = sap.ui.core.Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.SelectBrandProductList",
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}

			// open value help dialog
			this._pValueHelpDialog.then(function (oValueHelpDialog) {
				oValueHelpDialog.open();
			});

		},

		_handleValueHelpSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilters = [];
			oFilters.push(new sap.ui.model.Filter("PRODUCT_NAME", sap.ui.model.FilterOperator.Contains, sValue));
			oFilters.push(new sap.ui.model.Filter("SKUS", sap.ui.model.FilterOperator.Contains, sValue));
			oEvent.getSource().getBinding("items").filter(new sap.ui.model.Filter(oFilters, false));
		},


		_handleValueHelpClose: function (oEvent) {
			var oFastAppData = Services.getFastAppDataModel();
			var sPath = '/EditProduct/FreeGoodsOther/0';
			var oFreeGoodsOther = oFastAppData.getProperty(sPath);

			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var oInputfield = this.byId('idOtherProducts');
				oInputfield.setValue(oSelectedItem.getTitle());

				oFreeGoodsOther.ProductPackId = oSelectedItem.getBindingContext('fastAppData').getObject().PRODUCT_ID;
				oFreeGoodsOther.ProductName = oSelectedItem.getTitle();
				oFastAppData.setProperty(sPath, oFreeGoodsOther)
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		/* GETTERS */
		/**
		 * Fetches a list of Tender products from the backend
		 * @param {String} offerID, 
		 * @returns {Array} - A list of Tender products
		 */
		getFinancialProducts: async function (offerID) {
			if (offerID) {
				const response = await Services.getFinancialProducts(offerID);

				return response.data && response.data.results.map(item => {
					
					item.FreeGoodsOther = item.FreeGoodsOther && item.FreeGoodsOther.results.map(freeGoods => {
						freeGoods.UOM = item.UOM;
						return freeGoods;
					}) || [];
					
					return item;
				}) || [];
			}
			return [];
		},

		getCountryBrandProducts: async function (countryCode) {
			if (countryCode) {
				const response = await Services.getCountryBrandProducts(countryCode);
				return response.data.results;
			}
		},

		/**
		 * Event handler for the OfferProductsItaly
		 * @param {Object} event - An instance of event object
		 */
		onFinancialProductPress: function (oEvent, bBindingFinished) {

			//get context of selected price product
			let oFastAppDataModel = Services.getFastAppDataModel();
			if (!bBindingFinished) {
				const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
				this.byId("FinPricingOfferSubsection").setBindingContext(bindingContext, "fastAppData");
				this.selectedProductPricePath = bindingContext.sPath;
			} else {
				this.selectedProductPricePath = Services.getSelectedProductPath();
				let oBindingContext = this.byId("idFinancialOfferViewProduct").getItems()[parseInt(this.selectedProductPricePath.substring(this.selectedProductPricePath.lastIndexOf('/') + 1))].getBindingContext('fastAppData');
				this.byId("FinPricingOfferSubsection").setBindingContext(oBindingContext, "fastAppData");
			}

			let oProductPrice = oFastAppDataModel.getProperty(this.selectedProductPricePath);

			this._setSelectedProductUoM(oProductPrice.UOM);

			//Edit offer copy to move back to original values during cancel
			let sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
						
			//keep selected product ID
			Services.setSelectedProductID(oProductPrice.ProductCode);
			Services.setSelectedProductName(oProductPrice.ProductPackName);
			Services.setSelectedProductPath(this.selectedProductPricePath);

			//keep track of Distributor
			Services.setSelectedDistributorID(oOffer.DistributorID);

			//TEMP SOLUTION : for hotfix on currency problem - Currency problem due to IT view financial offer
            oOffer.Currency = Services.getSelectedCountry() === 'IT' ? Services.getFastAppDataModel().setProperty("/CurrencyTEMP", oOffer.Currency) : oOffer.Currency;
            //TEMP SOLUTION            
			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
			Services.getFastAppDataModel().setProperty("/EditProduct/", oProductPrice);

			let oSelectedProduct = oOffer.Product && oOffer.Product.results.length > 0 ? oOffer.Product.results[this.selectedProductPricePath.substring(this.selectedProductPricePath.lastIndexOf('/') + 1)] : null;
			if(oSelectedProduct){
				Services.getFastAppDataModel().setProperty("/EditSelectedProduct/", oSelectedProduct);
			}

			//check for approval enabled 
			var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);

			if (oOffer.Active !== 1 || oOffer.ActiveOffer !== 1) {
				bEnableApproval = false;
			}

			//toggle editable fields 
			let bEditMode = oFastAppDataModel.getProperty("/EditMode");

			//enable or disable approvalButton
			this.byId("ApprovalButtonId").setEnabled(bEnableApproval); //TODO: when this statement is executed, fastModel property "/EditMode" is set to TRUE??? WHY? 
			
			oFastAppDataModel.setProperty("/EditMode", bEditMode);

			//dynamic message logic
			this._checkTaxRate(oProductPrice);

			//calculate discounts at start
			this.calculateAdditionalDiscount();
			
		},

		_checkApprovalEnabled: function (){
			let sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID);
			var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);

			if (oOffer.Active !== 1 || oOffer.ActiveOffer !== 1) {
				bEnableApproval = false;
			}

			this.byId("ApprovalButtonId").setEnabled(bEnableApproval);

		},

		_checkTaxRate: function (oProductPrice){
			var differentRates = oProductPrice.FreeGoodsOther.filter(freeGoods =>   freeGoods.VAT !== oProductPrice.VatPerPack*100   );
			var message;
			if (differentRates.length === 0){
				message = "Merce Sconto";
			} else {
				message = "Omaggio";
			}

			const oFastAppDataModel = Services.getFastAppDataModel();
			oFastAppDataModel.setProperty(this.selectedProductPricePath + "/dynMessage", message);
			
		},


		/**
		 * Save financial offer for Italy
		 * @param {*} oEvent 
		 */
		onSaveFinancialOfferItaly: async function (oEvent) {

			//get selected product and the price values
			let oFastAppDataModel = Services.getFastAppDataModel();
			let that = this;
			let sTenderID = Services.getSelectedTenderID();
			let oOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
            //TEMP SOLUTION : for hotfix on currency problem - Currency problem due to IT view financial offer
            oOffer.Currency = Services.getFastAppDataModel().getProperty("/CurrencyTEMP");
            //TEMP SOLUTION
			let sOfferID = oOffer.OfferID;
			let sOfferPath = Services.getSelectedOfferPath();
			let sProductId = Services.getSelectedProductID();
			let aProducts = Services.getLoadedProductsForOffer(sOfferID);
			let oProduct = aProducts && aProducts.results && aProducts.results.find(prod => prod.ProductCode == sProductId);
			let oProductPrice = oFastAppDataModel.getProperty(this.selectedProductPricePath);
			let aMessages = [];

			//build old price object for additional saving to PT_TMBDPR
			let oNewPriceInfo = this.getOfferProductPrices(oOffer, oProduct, oProductPrice);

			//convert old price to save & save
			let oPriceToSave = Services.getService('Price').getConvertPriceToSave(oNewPriceInfo);
			await Services.getService('Price').updatePrice(oPriceToSave);

			let oProductPriceToSave = Services.getService('Price').getConvertProductPriceToSave(oProductPrice);
			let aMandatoryFieldsMissing = Services.getService('Price').validateProductPriceToSave(oProduct.OfferType, oProductPriceToSave, oProduct.SKU.ProductType, oPriceToSave.FOC_ABS_PCT, oPriceToSave.NetofferPrice);
			let aInvalidFieldData = Services.getService('Price').validateMonthlyFieldData(oProduct.OfferType, oProductPriceToSave, oProduct.SKU.ProductType);

			if(aMandatoryFieldsMissing.length > 0){
				let sTitle = "Mandatory fields missing";
				var sErroneousFields = "";

				aMandatoryFieldsMissing.map((mandatoryField, index) => {
					if (sErroneousFields === "") {
						sErroneousFields = mandatoryField;
					} else {
						sErroneousFields = sErroneousFields + '\n' + mandatoryField;
					}
				});

				var oMessage = {
					type: 'Error',
					title: 'Mandatory fields missing',
					description: sErroneousFields,
					subtitle: ' Mandatory fields should be filled before saving.',
					counter: 1
				}
				aMessages.push(oMessage);
			}

			if(aInvalidFieldData.length > 0){
				let sTitle = "Invalid field data";
				var sErroneousFields = "";

				aInvalidFieldData.map((invalidField, index) => {
					if (sErroneousFields === "") {
						sErroneousFields = invalidField;
					} else {
						sErroneousFields = sErroneousFields + '\n' + invalidField;
					}
				});

				var oMessage = {
					type: 'Error',
					title: 'Invalid field data',
					description: sErroneousFields,
					subtitle: 'The value should be a whole number.',
					counter: 1
				}
				aMessages.push(oMessage);
			}

			if(aMessages.length > 0){
				//Show error messages
				Services.showMessageCompositeView('Error', aMessages, 'Error');
			}

			if(aMandatoryFieldsMissing.length === 0 && aInvalidFieldData.length === 0){
				
				let oResult = await Services.getService('Price').saveProductPrice(oProductPriceToSave);
				if (oResult && oResult.data && oResult.data.ID) {
					oProductPrice.ID = oResult.data.ID;
				}
				//Update offer
				var oOfferSaveInfo = {};
				oOfferSaveInfo.OfferID = Services.getSelectedOfferID();
				oOfferSaveInfo.Currency = this.byId("idCurrency").getSelectedKey();
				oOfferSaveInfo.FOCType = this.byId("idFOCType").getSelectedKey();
				//default foc abolute or percentage is decided on first product price thats saved... so if empty, save
				if (!oOffer.DEFAULT_FOC_ABS_PCT) {
					oOfferSaveInfo.DEFAULT_FOC_ABS_PCT = 'ABS';//this.byId("idEditPriceOffer_idFocAbsPct").getSelectedKey();
				}

				//let sSetCurrency = oOfferSaveInfo.Currency;

				//update offer
				await Services.getService('Offer').updateOffer(oOfferSaveInfo).catch(function (oError) {

					//show error message
					Services.showErrorMessage(oError, "Update of offer");

					//promises must fail as well
					throw new Error(oError);

				});

				//we will load tender again after save is done
				var bLoadedCheck = false;

				$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

					//set selected offer ID
					Services.setSelectedOfferID(sOfferID);
					Services.setSelectedOfferPath(sOfferPath);

					//Selected offer binding
					var oOffer = Services.getLoadedOffer(sOfferID);
					Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);

					//switch from edit to display
					//this.byId("idCurrency").setSelectedKey(sSetCurrency);
					that._DetailController.onEditToggleButtonPress();

					//show success message
					Services.getOfferCompositeMessages().push({
						type: 'Success',
						title: 'Financial Offer Saved Successfully',
						description: 'Financial Offer Saved Successfully'
					});

					Services.showMessageCompositeView("Offer Saved", Services.getOfferCompositeMessages(), 'Success');
					Services.getOfferCompositeMessages().splice(0, Services.getOfferCompositeMessages().length);


					//refresh tenders master table (left pane)
					Services.refreshTendersMasterTable(sTenderID);

					//update approvals sent to 0 (to indicate that a change has been made to the offer data, so approvals need to be send again)
					var iApprovals_sent = oOffer.APPROVALS_SENT; //offerInfo.APPROVALS_SENT;
					Services.saveOfferApprovalSent(iApprovals_sent).catch(function (oError) {
						//Error during save
						Services.showErrorMessage(oError, "Background saving for approvals sent field");
					});

					that._checkApprovalEnabled(); // check for approval button

					//refresh data (for table)
					that.refreshFinancialTabIT();

				});
			}
		},

		//for additional saving to PT_TMBDPR
		getOfferProductPrices: function (oOffer, oProduct, oProductPrice) {

			//PT_TMBDPR
			let oNewPriceInfo = {
				TenderID: Services.getSelectedTenderID(),
				OfferID: Services.getSelectedOfferID(),
				CountryCode: Services.getSelectedCountry(),
				ProductCode: oProductPrice.ProductCode,
				SubmittedOn: moment().utc().toDate(),
				SubmittedBy: UserInfo.getCWID(),
				Active: 1,
				Tier: 0,
				VolumeFrom: 0,
				VolumeTo: 0,
				RegPrice: oProductPrice.ConsumerPriceExclPP,
				FOC: oProductPrice.FOC,
				/*(that.byId("idEditPriceOffer_idFocAbsPct").getSelectedKey() === "PCT") ? that.byId("idEditPriceOffer_idFoc").getValue() /
					100 : that.byId("idEditPriceOffer_idFoc").getValue(),*/
				FOCType: this.byId("idFOCType").getSelectedKey(), //that.byId("idEditPriceOffer_idFocType").getSelectedKey(),
				FOCStep: oProductPrice.FOCStep,
				Discount: 0,
				OfferPrice:  oProductPrice.NetofferPrice,
				StandardDiscount: oProductPrice.TotalDiscount / 100,
				AdditionalDiscount: oProductPrice.AdditionalDiscount,
				Deductions: 0,
				NetofferPrice: oProductPrice.NetofferPrice,
				BusinessCasePrice: 0,
				WholesalePrice: "",
				COGS: 0,
				SpotRate: 1,
				BudgetRate: 1,
				Scenario: 0,
				FOC_ABS_PCT: oProductPrice.FOC_ABS_PCT,
				FOCProduct_Bundled_1: null, //FOC ADDITIONAL PRODUCT
				FOC_ABS_PCT_Bundled_1: null, //FOC ADDITIONAL PROD ABSOLUTE or PERCENTAGE
				FOC_Bundled_1: null, //FOC ADDITIONAL PROD VALUE
				ActiveTier: 0,
				NetPrice: oProductPrice.NetofferPrice,
				NetPrice_OfPaid: 0,
				PRICE_UPDATE: 0
			};

			/*if(oProductPrice.ID !== null){
				oNewPriceInfo.ID = oProductPrice.ID;
			}*/

			return oNewPriceInfo;
		},

		/**
		 * Approval button on Finacial page
		 * @param {*} oEvent 
		 */
		onApprovalsPress: function (oEvent) {
			//approvals dialog will be shown
			this._DetailController.onApprovalsPress(oEvent);
		},

		calculateAdditionalDiscount: function (oEvent) {

			const consumerPrice = Services.getFastAppDataModel().getProperty(this.selectedProductPricePath);
			const sSelectedRbtn = this.byId("rbgUoM").getSelectedIndex() === 1 ? 'Unit' : this.byId("rbgUoM").getSelectedIndex() === 0 ? 'Pack' : null;

			if(oEvent){
				var netOfferPrice = oEvent.getParameter("newValue");
			} else {
				netOfferPrice = consumerPrice.NetofferPrice;
			}
			
			if(sSelectedRbtn === 'Unit'){
				var additionalDiscount = 1 - (netOfferPrice / consumerPrice.MaxPriceNhsPU);
				var totalDiscount = 1 - (netOfferPrice / consumerPrice.ConsumerPriceExclPU);

			} else if(sSelectedRbtn === 'Pack'){
				var additionalDiscount = 1 - (netOfferPrice / consumerPrice.MaxPriceNhsPP);
				var totalDiscount = 1 - (netOfferPrice / consumerPrice.ConsumerPriceExclPP);
			}
			

			this.byId("idFinalDiscount").setValue((totalDiscount*100).toFixed(2));
			this.byId("addDiscount").setValue((additionalDiscount*100).toFixed(2));
		},

		onBindingItemsFinished: function (oEvent, bInitLoad) {

            // This code should only for Italy. TODO: check why this method is also being run for Spain. This is a side effect.
            if(Services.getSelectedCountry() !== "IT"){
                return;
            }


			if (oEvent && oEvent.oSource) {
				var sSourceId = oEvent.oSource.sId
				var oProductsTable = oEvent.getSource();
			}

			if (!oProductsTable) {
				oProductsTable = this.byId("idFinancialOfferViewProduct");
			}
			let that = this;

			if ((bInitLoad || (sSourceId && sSourceId.includes('financialOfferViewId_IT'))) && !$.isEmptyObject(oProductsTable)) {
				let aItems = oProductsTable.getItems();
				
					if (aItems.length > 0) {
						if (this.selectedProductPricePath === undefined || this.selectedProductPricePath === '/ProductPricingView/0'){
							oProductsTable.setSelectedItem(aItems[0], true);
							aItems[0].setSelected(true);
							Services.setSelectedProductPath(aItems[0].getBindingContextPath());
						}
							that.onFinancialProductPress(oEvent, true);
				}
			}
		},

		onOpenProducts: function () {

			var oView = this.getView();

            //store original freegoodsother for cancellation
            const oFastAppDataModel = Services.getFastAppDataModel();
            const aCurrentFreeGoods =  oFastAppDataModel.getProperty(this.selectedProductPricePath + "/FreeGoodsOther")
            this._aCurrentFreeGoodsTemp = aCurrentFreeGoods?.map(freeGood => {
                return Object.create(freeGood);
            });

			// create dialog lazily
			if (!this.pDialog) {
				this.pDialog = Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.OtherProducts_IT",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.setModel(Services.getFastAppDataModel(), "fastAppData");
					return oDialog;
				});
			}

			this.pDialog.then(function (oDialog) {
				this.byId("FreeGoodsOtherTable").setBindingContext(this.byId("FinPricingOfferSubsection").getBindingContext("fastAppData"), "fastAppData");
				oDialog.open();
			}.bind(this));


		},
		onAddNewFreeGoods: function (event) {
			const oFastAppDataModel = Services.getFastAppDataModel();
			let selectedProductPrice = oFastAppDataModel.getProperty(this.selectedProductPricePath);
			let freeGoodsOther = oFastAppDataModel.getProperty(this.selectedProductPricePath + "/FreeGoodsOther") || [];
			freeGoodsOther.unshift({
				ProductPackId: "",
				FreeGoodsOther: "",
				FreeGoodsOther_ABS_PCT: "ABS",
				FreeGoodsOther_Step: "",
				UOM: selectedProductPrice.UOM
			});
			oFastAppDataModel.setProperty(this.selectedProductPricePath + "/FreeGoodsOther", freeGoodsOther);
		},
		onDeleteFreeGoodsOther: function (event) {
			const productPackId = event.getSource().getBindingContext("fastAppData").getProperty("ProductPackId");
			const oFastAppDataModel = Services.getFastAppDataModel();
			let freeGoodsOther = oFastAppDataModel.getProperty(this.selectedProductPricePath + "/FreeGoodsOther");

			oFastAppDataModel.setProperty(this.selectedProductPricePath + "/FreeGoodsOther", freeGoodsOther.filter(freeGoods => freeGoods.ProductPackId !== productPackId));
		},
		onProductPackChange: function (event) {
			var validatedComboBox = event.getSource(),
				selectedKey = validatedComboBox.getSelectedKey(),
				value = validatedComboBox.getValue(),
				path = event.getSource().getBindingContext("fastAppData").getPath(),
				vat = validatedComboBox.getSelectedItem().getBindingContext('fastAppData').getProperty('VAT');


			if ((!selectedKey && value) || value === "") {
				Services.getFastAppDataModel().setProperty(path + "/ProductPackIdValueState", "Error");
			} else {
				Services.getFastAppDataModel().setProperty(path + "/ProductName", value);
				Services.getFastAppDataModel().setProperty(path + "/ProductPackIdValueState", "None");
				Services.getFastAppDataModel().setProperty(path + "/VAT", vat);
			}
		},
		oApplyProducts: function () {
			const oFastAppDataModel = Services.getFastAppDataModel();

			let freeGoodsOther = oFastAppDataModel.getProperty(this.selectedProductPricePath + "/FreeGoodsOther");
			freeGoodsOther = freeGoodsOther.map(freeGoods => {
				freeGoods.FreeGoodsOtherValueState = "None";
				freeGoods.FreeGoodsOtherStepValueState = "None";

				if (!freeGoods.ProductName || freeGoods.ProductName === "") {
					freeGoods.ProductPackIdValueState = "Error";
				}

				if((freeGoods.FreeGoodsOther_ABS_PCT === 'STP' && (!freeGoods.FreeGoodsOther_Step || freeGoods.FreeGoodsOther_Step === ""))){
					freeGoods.FreeGoodsOtherStepValueState = "Error";
				}

				if ( (!freeGoods.FreeGoodsOther || freeGoods.FreeGoodsOther === "")) {
					freeGoods.FreeGoodsOtherValueState = "Error";
				}
				return freeGoods;
			});
			oFastAppDataModel.setProperty(this.selectedProductPricePath + "/FreeGoodsOther", freeGoodsOther);
			const foundError = freeGoodsOther.find(freeGoods => freeGoods.ProductPackIdValueState === "Error" || freeGoods.FreeGoodsOtherValueState === "Error");
			if (!foundError) this.byId("OtherProducts").close();



			let oProductPrice = oFastAppDataModel.getProperty(this.selectedProductPricePath);
			this._checkTaxRate(oProductPrice);


		},

        oCancelProducts: function () {
            const oFastAppDataModel = Services.getFastAppDataModel();
            oFastAppDataModel.setProperty(this.selectedProductPricePath + "/FreeGoodsOther", this._aCurrentFreeGoodsTemp);
            
            if(this.pDialog){

                this.pDialog.then(pDialog => pDialog.close());
            }
                
        },

		/**
		 * Event handler for the UoM radioButtonGroup 
		 * @param {Event} evt 
		 */
		onRbgUoMChange: function(evt){
			const selectedIndex = evt.getParameter("selectedIndex");
			const uom = selectedIndex === 0 ? "Pack" : "Unit";
			this._setSelectedProductUoM(uom);
		},

		_setSelectedProductUoM(uom){
			this.getView().getModel("finOfferView").setProperty("/selectedProductUoM", uom);
		},

		onValidateMonth: function(oEvent){
			var oControl = oEvent.getSource();
			this.validateMonthInput(oControl);
		},

		validateMonthInput: function(oControl){
			var oBinding = oControl.getBinding("value");
 			var oValue = oControl.getValue();

			try {
				if((oValue - Math.floor(oValue)) !== 0){
					oControl.setValueState(sap.ui.core.ValueState.Error);
				} else {
					oControl.setValueState(sap.ui.core.ValueState.None);
				} 
			} catch(exception){
				oControl.setValueState(sap.ui.core.ValueState.Error);
			}
		}
	});
});