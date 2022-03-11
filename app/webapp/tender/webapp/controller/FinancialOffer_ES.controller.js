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

	return Controller.extend("FAST_NS0FAST0.controller.FinancialOffer_ES", {


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

		},

		//Navigation between TenderMaster & Detail pages routing is matched
		_onTenderMatched: async function (oEvent) {

            // This code should only for Spain
            if(Services.getSelectedCountry() !== "ES"){
                return;
            }

			// this method should only be called in case of Spain
			var sTab = oEvent.getParameter("arguments").tab || "";
			if (sTab && sTab.includes("financialOfferId_ES")) {


                await this.getCountryBrandProductsCombined();

				this.onBindingItemsFinished(oEvent, true); //TODO: check w/ Wouter if there's a more proper solution to do this, and why this method is not executed every time on view load

                // get price conditions
                const priceConditionViews = await this.getPriceConditionView();
                Services.getFastAppDataModel().setProperty("/PriceConditionView", priceConditionViews);

                
                // get PriceConditionClassification
                const priceConditionClassification = await this.getPriceConditionClassification();
                Services.getFastAppDataModel().setProperty("/PriceConditionClassification", priceConditionClassification);


			}

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

        getPriceConditionView: async function(){

            const offer = Services.getFastAppDataModel().getProperty("/SelectedOffer");

            const filter = {
                "CountryCode": offer.CountryCode,
                "Classification": offer.Tender.Classification,
                "Division": offer.Division,
                "OfferID": offer.OfferID
            };

			let priceConditionViews = await Services.getService("PriceCondition").getPriceConditionView(filter);
            

            return priceConditionViews.data.results;

        },
        
		setFinancialOffer:function(){
			//Edit offer copy to move back to original values during cancel
			let sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
			//Services.getFastAppDataModel().setProperty("/EditProduct/", oProductPrice);

			let sSelectedSection = Services.getFinancialOfferPageSectionID_ES();
			Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection);

		},
		refreshFinancialTabES: async function () {
			await this.getCountryBrandProductsCombined();
			this.setFinancialOffer();
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

        getPriceConditionClassification: async function(){

            const oFastAppDataModel = Services.getFastAppDataModel();
            const offer = oFastAppDataModel.getProperty("/SelectedOffer");
            const filter = {
                "CountryCode": offer.CountryCode,
                "Classification": offer.Tender.Classification,
                "Division": offer.Division,
                "isMain": true
            };

            const priceConditionClassificationResponse = await Services.getService('PriceCondition').getPriceConditionClassification(filter);
            return priceConditionClassificationResponse.data && priceConditionClassificationResponse.data.results;
        },

        getPriceConditions: async function(productCode){

            const filter = {
                "CountryCode": Services.getSelectedCountry(),
                "OfferID": Services.getSelectedOfferID(),
                "ProductCode": productCode
            };

            const priceConditionResponse = await Services.getService('PriceCondition').getPriceCondition(filter);
            return priceConditionResponse.data && priceConditionResponse.data.results;
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


		/**
		 * Save financial offer for Italy
		 * @param {*} oEvent 
		 */
		onSaveFinancialOfferSpain: async function (oEvent) {
            debugger;
		},

		/**
		 * Approval button on Finacial page
		 * @param {*} oEvent 
		 */
		onApprovalsPress: function (oEvent) {
			//approvals dialog will be shown
			this._DetailController.onApprovalsPress(oEvent);
		},

		onBindingItemsFinished: function (oEvent, bInitLoad) {
			// This code should only for Spain. TODO: check why this method is also being run for Spain. This is a side effect.
            if(Services.getSelectedCountry() !== "ES"){
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

			if ((bInitLoad || (sSourceId && sSourceId.includes('financialOfferViewId_ES'))) && !$.isEmptyObject(oProductsTable)) {
				let aItems = oProductsTable.getItems();
				
					if (aItems.length > 0) {
						if (this.selectedProductPricePath === undefined || this.selectedProductPricePath === '/ProductPricingView/0'){

							oProductsTable.setSelectedItem(aItems[0], true);
							aItems[0].setSelected(true);

                            // set selected product
                            let prdObj = aItems[0].getBindingContext("fastAppData").getObject();
							Services.setSelectedProductPath(aItems[0].getBindingContextPath());
                            Services.setSelectedProductName(prdObj.ProductPackName);
                            Services.setSelectedProductID(prdObj.ProductCode);


                            let selectedProduct = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(), Services.getSelectedProductID());
                            Services.getFastAppDataModel().setProperty("/SelectedOffer/SelectedProduct",selectedProduct);
                            
                            
						}
				}
			}
		},

        onFinancialProductPress: async function(oEvent){

            //get price conditions

            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
			let oFastAppDataModel = Services.getFastAppDataModel();
            
            const aPriceConditions = await this.getPriceConditions(Services.getSelectedProductID());
            
            this.selectedProductPricePath = bindingContext.sPath;
            let oProductPrice = oFastAppDataModel.getProperty(this.selectedProductPricePath);

        },

        onPriceConditionChange: function(oEvent){

            const sConditionType = oEvent.getSource().getSelectedItem().getText();
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const selectedPriceConditionsIndex = priceConditions.findIndex(item => item.ConditionType === sConditionType);
            const bindingPath = "/PriceConditionView/".concat(selectedPriceConditionsIndex);

            const vBox = this.byId("idPriceConditionVbox");
            vBox.removeAllItems();

            const sFragmentPath = "FAST_NS0FAST0.view.fragments.priceConditions"; 
            let sFragmentName = oEvent.getParameter("selectedItem").getText().split(" ").join("");

            Fragment.load({
                id: this.getView().getId(),
                name: sFragmentPath.concat(".",sFragmentName),
                controller: this
            }).then(function (oFragment) {
                oFragment.forEach(item => vBox.addItem(item));
                vBox.bindElement({ path: bindingPath, model: "fastAppData" });
            }.bind(this));

        },

        /** Free goods other event handlers */
        onOpenProducts: function () {

			var oView = this.getView();

			// create dialog lazily
			if (!this.pDialog) {
				this.pDialog = Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.OtherProducts_ES",
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
                RoyalDecree: "",
                FOCMinAmount: 0,
                FOCBonus: 0,
                PotentialGeneratedSavings: 0,
                UOM: selectedProductPrice.UOM
			});
			oFastAppDataModel.setProperty(this.selectedProductPricePath + "/FreeGoodsOther", freeGoodsOther);
            
            const oFreeGoodsOtherTable = this.byId("FreeGoodsOtherTable");
            const vBox = this.byId("idFOCVbox");
            oFreeGoodsOtherTable.bindElement({ path: this.selectedProductPricePath, model: "fastAppData" });
            vBox.bindElement({ path: this.selectedProductPricePath, model: "fastAppData" });
            
            oFastAppDataModel.updateBindings();            
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
				freeGoods.FreeGoodsOtherFOCMinAmountValueState = "None";
                freeGoods.FOCBonusValueState = "None";

				if (!freeGoods.FOCMinAmount || freeGoods.FOCMinAmount === "" || freeGoods.FOCMinAmount === 0) {
					freeGoods.ProductPackIdValueState = "Error";
				}

                if (!freeGoods.FOCBonus || freeGoods.FOCBonus === "" || freeGoods.FOCBonus === 0) {
					freeGoods.ProductPackIdValueState = "Error";
				}

				return freeGoods;
			});
			oFastAppDataModel.setProperty(this.selectedProductPricePath + "/FreeGoodsOther", freeGoodsOther);
			const foundError = freeGoodsOther.find(freeGoods => freeGoods.FreeGoodsOtherFOCMinAmountValueState === "Error" || freeGoods.FOCBonusValueState === "Error");
			if (!foundError) this.byId("OtherProducts").close();
		},

        handleValueHelp: function(oEvent){ //TODO: change to spain

			Services.getInstituteDistributorBrandProductsForSpain(Services.getInstituteIDofSelectedTender()).then((response) => {
				var oFastAppDataModel = Services.getFastAppDataModel();
				oFastAppDataModel.setProperty("/SpainProducts", response.data.results);

	
			});

			var oView = this.getView();
			// create value help dialog
			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = sap.ui.core.Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.SelectBrandProductListSpain",
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
			var sPath = this.selectedProductPricePath + "/FreeGoodsOther/0"
			var oFreeGoodsOther = oFastAppData.getProperty(sPath);

			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var oInputfield = this.byId('idOtherProducts');
				oInputfield.setValue(oSelectedItem.getTitle());

				oFreeGoodsOther.ProductPackId = parseInt(oSelectedItem.getDescription());
				oFreeGoodsOther.ProductName = oSelectedItem.getTitle();
				oFastAppData.setProperty(sPath, oFreeGoodsOther)
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

        /*Calculations*/
        calculatePotentialSavings: function(oEvent){
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const bindingPath = "/PriceConditionView/".concat(focIndex);
            const priceConditionViewObject = Services.getFastAppDataModel().getProperty(bindingPath);

            const bonusAmount = Number(oEvent.getSource().getValue());
            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const freeGoodsObject = bindingContext.getObject();
            
            let potentialSaving = "";

            if(priceConditionViewObject.RoyalDecree !== null && priceConditionViewObject.RoyalDecree === 'Yes'){
                potentialSaving = bonusAmount * priceConditionViewObject.PVL * (1 - freeGoodsObject.RoyalDecreePercentage);                
            } else {
                potentialSaving = bonusAmount * priceConditionViewObject.PVL;
            }

            freeGoodsObject.PotentialGeneratedSavings = potentialSaving; 
            bindingContext.getModel().updateBindings();           
        }    
    });
});