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


                const oFastAppDataModel = Services.getFastAppDataModel();
                const offer = oFastAppDataModel.getProperty("/SelectedOffer");

                // fetch and set PriceConditionClassification info 
                const filter = {
                    "CountryCode": offer.CountryCode,
                    "Classification": offer.Tender.Classification,
                    "Division": offer.Division,
                    "isMain": true
                };
    
                const priceConditionClassification = await this.getPriceConditionClassification(filter);
                oFastAppDataModel.setProperty("/PriceConditionClassification", priceConditionClassification);


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

        getPriceConditionClassification: async function(filter){
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


                            this.getPriceConditions(Services.getSelectedProductID()).then(response => {
                                alert("Loaded");
                                debugger;

                            });
                            
                            
						}
				}
			}
		},

        onFinancialProductPress: async function(oEvent){

            //get price conditions

            const aPriceConditions = await this.getPriceConditions(Services.getSelectedProductID());

        },

        onPriceConditionChange: function(oEvent){

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
            }.bind(this));

        },

	});
});