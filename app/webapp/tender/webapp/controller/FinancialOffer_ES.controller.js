sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/financial",
	"sap/ui/core/Fragment",
	"com/bayer/tender/uilib/datatypes/PercentageType",
	"com/bayer/tender/uilib/datatypes/UoMPriceType",
	"sap/ui/model/Filter",
    "sap/ui/model/FilterType",
	"sap/ui/model/FilterOperator",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Sorter"
], function (Controller, formatter, Services, UserInfo, MomentJS, Financial, Fragment, PercentageType, UoMPriceType, Filter, FilterType, FilterOperator, BusyIndicator,Sorter) {
	"use strict";
	
	var bundle;

	return Controller.extend("FAST_NS0FAST0.controller.FinancialOffer_ES", {

		//Formatting functions
		formatter: formatter,
		types: {
			percent: PercentageType,
            uomPrice: UoMPriceType
		},

		onInit: function (oEvent) {

			const oViewModel = new sap.ui.model.json.JSONModel({
				delay: 0,
				selectedProductUoM: "",
			});

			this.getView().setModel(oViewModel, "finOfferView");
            Services.getFastAppDataModel().setProperty("/ExistingAgreementInPlace", false);

			//get resource bundle for translations or texts
			this._oOwnerComponent = this.getOwnerComponent();
			this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            // Register the view with the message manager
		    sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);

			//keep router and model locally in this controller
			this._oRouter = this._oOwnerComponent.getRouter();
			this._oModel = this._oOwnerComponent.getModel();
			bundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			this._DetailView = sap.ui.getCore().byId(this.getView().getId().split("---")[0] + "---tenderManagementDetailId");
			this._DetailController = this._DetailView.getController();

			Services.setRouterObject(this._oRouter);

			//attach the onTenderMatched method to handle routing between pages + load correct data
			// this._oRouter.getRoute("master").attachPatternMatched(this._onTenderMatched, this); // is this needed? according to the routing config this will cause side effects
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

                BusyIndicator.show();

                Services.getFastAppDataModel().setProperty("/RappelRequired", false);
                Services.getFastAppDataModel().setProperty("/RappelExpanded", false);
                Services.getFastAppDataModel().setProperty("/FOCRequired", false);
                Services.getFastAppDataModel().setProperty("/FOCExpanded", false);

                //load countryBrandProducts ( needed to get productnames for FOC model)
			    let aCountryBrandProducts = await this.getCountryBrandProducts(Services.getSelectedCountry());
                Services.getFastAppDataModel().setProperty("/CountryBrandProducts", aCountryBrandProducts);

                await this.getProducts();
                await this.getProductTypeProfitability(Services.getSelectedOfferID(), Services.getSelectedCountry());

				this.onBindingItemsFinished(oEvent, true); //TODO: check w/ Wouter if there's a more proper solution to do this, and why this method is not executed every time on view load
            
                if(Services.getFastAppDataModel().getProperty('/SelectedOffer')){
                    await this.managePriceConditionClassification();
                    await this.managePriceConditions();
                    await this.calculateProfitability();
                }

                BusyIndicator.hide();
			}

		},

        /**
         * Fetches PriceConditionClassification and sets it on the model
         */
        managePriceConditionClassification: async function(){
            
            const oFastAppDataModel = Services.getFastAppDataModel();
            const offer = oFastAppDataModel.getProperty("/SelectedOffer");
            if(offer){
                const priceConditionClassification = await this.getPriceConditionClassification();
                // add empty item
                priceConditionClassification.push({
                    "ID": "99999999-9999-9999-9999-999999999999",
                    "ConditionType": "",
                    "isMain": true
                });
                Services.getFastAppDataModel().setProperty("/PriceConditionClassification", priceConditionClassification);
            }
        },

        managePriceConditions: async function(){
            BusyIndicator.show();

            // get price conditions
            const priceConditionViews = await this.getPriceConditionView();
            const tenderHistorySpain = await this.getTenderHistorySpain();
            const descuentoEspecial = priceConditionViews.find(pc => pc.ConditionType === "Descuento Especial");
            if(descuentoEspecial && !descuentoEspecial.Discount){
                descuentoEspecial.Discount = 1;
                descuentoEspecial.NetPriceWithoutTax = 0;
            } 
            Services.getFastAppDataModel().setProperty("/PriceConditionView", priceConditionViews);
            Services.getFastAppDataModel().setProperty("/TenderHistorySpain", tenderHistorySpain);

            // Manage financial offer when existing agreement is in place
            const applicableTenderCondition = await this.getApplicableTenderCondition();
            if(applicableTenderCondition){
                const applicableTenderConditionType = applicableTenderCondition?.PriceConditionClassification?.ConditionType;
                const applicablePriceConditionView = priceConditionViews.find(conditionView => conditionView.ConditionType === applicableTenderConditionType);
                this.copyAndSetApplicableTenderConditionValues(applicableTenderCondition, applicablePriceConditionView);
                Services.getFastAppDataModel().setProperty("/ExistingAgreementInPlace", true);
            }else{
                Services.getFastAppDataModel().setProperty("/ExistingAgreementInPlace", false);
            }

            // set selected key on idPriceConditionSelect
            const priceConditionClassification = Services.getFastAppDataModel().getProperty("/PriceConditionClassification");
            const existingMainPriceCondition = priceConditionViews.find(item => item.isMain && item.ExistingPriceConditionID);
            const PVLPriceCondition = priceConditionClassification.find( pcc => pcc.ConditionType === 'PVL' );
            if(existingMainPriceCondition){
                this.byId("idPriceConditionSelect").setSelectedKey(existingMainPriceCondition.PriceConditionClassificationID);
                // remove the dummy reference set in copyAndSetApplicableTenderConditionValues
                if(existingMainPriceCondition.ExistingPriceConditionID === "99999999"){
                    existingMainPriceCondition.ExistingPriceConditionID = null; 
                }
            }else if(PVLPriceCondition){
                this.byId("idPriceConditionSelect").setSelectedKey(PVLPriceCondition.ID);
            }else{
                this.byId("idPriceConditionSelect").setSelectedKey("99999999-9999-9999-9999-999999999999");
            }

            // load main fragment if main condition already exists
            const existingMainPriceConditionType = existingMainPriceCondition ? existingMainPriceCondition.ConditionType : PVLPriceCondition?PVLPriceCondition.ConditionType:"";
            this.loadMainPriceConditionFragment(existingMainPriceConditionType);

            //bind Rappel and FOC fragments 
            const rappelBindingPath = this.bindRappelFragment();
            const focBindingPath = this.bindFocFragment();
            this.bindingCurrentPrices();    

            // add DiscountCondition
            rappelBindingPath && await this.addDiscountConditions(rappelBindingPath);
            focBindingPath && await this.addFOCs(focBindingPath);

            BusyIndicator.hide();
        },

        /**
         * Edit toggle action on the Edit/View mode on the Spain FinancialOfferPage
         * @param {*} bEditMode 
         */        
        editFinancialOfferESToggle: function(bEditMode){
            if(bEditMode){
                const sSelectedMainPriceCondition = this.getView().byId('idPriceConditionSelect').getSelectedItem().getText();
                const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
                const index = priceConditions.findIndex(item => item.ConditionType === sSelectedMainPriceCondition);                
                if(index < 0) return null;
                if(sSelectedMainPriceCondition === "Descuento Comercial"){
                    let newDiscount;
                    const descuentoComercialbindingPath = "/PriceConditionView/".concat(index);
                    const dcpriceConditionViewObj = Services.getFastAppDataModel().getProperty(descuentoComercialbindingPath);
                    newDiscount = Number(dcpriceConditionViewObj.Discount) * 100;
                    this.calculateNetPricesDescuentoComercial(dcpriceConditionViewObj,newDiscount);
                }
                if(sSelectedMainPriceCondition === "Precio Neto"){
                    const precionetobindingPath = "/PriceConditionView/".concat(index);
                    const pnpriceConditionViewObj = Services.getFastAppDataModel().getProperty(precionetobindingPath); 
                    this.calculateDiscountsAndNetPricesPrecioNeto(pnpriceConditionViewObj,pnpriceConditionViewObj.NetPriceWithoutTaxBeforeDeductionRD);               
                }
                
            }
            Services.getFastAppDataModel().updateBindings();
        },
                    
        /**
         * Copy the existing condition to the main price condition and update the model
         */
        copyAndSetApplicableTenderConditionValues: function(applicableTenderCondition, applicablePriceConditionView){
            applicablePriceConditionView.AdditionalDiscount = applicableTenderCondition.AdditionalDiscount;
            applicablePriceConditionView.AnnualValue = applicableTenderCondition.AnnualValue;
            applicablePriceConditionView.CountryCode = applicableTenderCondition.CountryCode;
            applicablePriceConditionView.Discount = applicableTenderCondition.Discount;
            applicablePriceConditionView.Liquidation = applicableTenderCondition.Liquidation;
            applicablePriceConditionView.MaximumPrice = applicableTenderCondition.MaximumPrice;
            applicablePriceConditionView.MonthlyRentPerUnit = applicableTenderCondition.MonthlyRentPerUnit;
            applicablePriceConditionView.NetPriceWithTax = applicableTenderCondition.NetPriceWithTax;
            applicablePriceConditionView.NetPriceWithTaxAfterDeductionRD = applicableTenderCondition.NetPriceWithTaxAfterDeductionRD;
            applicablePriceConditionView.NetPriceWithoutTax = applicableTenderCondition.NetPriceWithoutTax;
            applicablePriceConditionView.NetPriceWithoutTaxAfterDeductionRD = applicableTenderCondition.NetPriceWithoutTaxAfterDeductionRD;
            applicablePriceConditionView.NetPriceWithoutTaxBeforeDeductionRD = applicableTenderCondition.NetPriceWithoutTaxBeforeDeductionRD;
            applicablePriceConditionView.PVL = applicableTenderCondition.PVL;
            applicablePriceConditionView.ReferencePriceAgreement = applicableTenderCondition.PriceAgreement_ID;
            applicablePriceConditionView.RefundDate = applicableTenderCondition.RefundDate;
            applicablePriceConditionView.RoyalDecree = applicableTenderCondition.RoyalDecree;
            applicablePriceConditionView.RoyalDecreeValue = applicableTenderCondition.RoyalDecreeValue;
            applicablePriceConditionView.RoyalDecreeIncl = applicableTenderCondition.RoyalDecreeIncl;
            applicablePriceConditionView.StandardDiscount = applicableTenderCondition.StandardDiscount;
            applicablePriceConditionView.Tax = applicableTenderCondition.Tax;
            const classification = Services.getFastAppDataModel().getProperty("/PriceConditionClassification")?.find(classification => classification.ConditionType === applicablePriceConditionView.ConditionType);
            applicablePriceConditionView.PriceConditionClassificationID = classification.ID;
            applicablePriceConditionView.ExistingPriceConditionID = "99999999"; // set dummy reference needed for the UI flow
        },


        /**
         * Get the existing price agreement related to a Tender classification "Tender" and 
         * check if the current Institute is a candidate/customer in the existing PriceAgreement
         * @returns {Object|null} - returns the main price condition if candidate/customer or null 
         */
         getApplicableTenderCondition: async function(){
            const currentInstituteId = Services.getFastAppDataModel().getProperty("/Tender/Institute/InstituteID");
            const existingPriceAgreement = await this.getExistingPriceAgreement();
            const isCustomer = existingPriceAgreement?.Candidates?.results.some(candidate => candidate.CandidateID === currentInstituteId);
            if(isCustomer){
                const mainCondition = existingPriceAgreement.PriceConditions.results.find(priceCondition => priceCondition.PriceConditionClassification.isMain);
                return mainCondition;
            }
            return null;
         },


         /**
         * Get the existing price agreement related to a Tender classification "Tender"
         * which is not expiring before tomorrow for the same product
         */
        getExistingPriceAgreement: async function(){
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0,0,0,0); // we only take the date into account
            const filter = {
                CountryCode: Services.getSelectedCountry(),
                ProductCode: Services.getSelectedProductID(),
                TenderClassification: "Tender",
                notExpiringBeforeDate: tomorrow,
                notEqualTenderId: Services.getSelectedTenderID() // exclude current Tender from the list
            };
            return (await Services.getService("PriceAgreement").getPriceAgreements(filter))?.data?.results[0];
        },

        /**
         * This method  sets the element binding of the Rappel fragment
         * @returns {String} - Binding path of the Rappel price condition
         */
        bindRappelFragment: function(){
            const priceConditionViews = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const rappelIndex = priceConditionViews.findIndex(item => item.ConditionType === "Rappel");
            if(rappelIndex < 0) return null;
            const rappelPriceCondition = priceConditionViews[rappelIndex];
            let instType = Services.getFastAppDataModel().getProperty("/Tender/Institute/InstituteType");
            const classification = Services.getFastAppDataModel().getProperty("/SelectedOffer/Tender/Classification");            
            if(classification === "Commercial Agreement") rappelPriceCondition.RoyalDecree = (instType === 'Public Account' || instType === 'Region(s)' || instType === 'National') && rappelPriceCondition.RoyalDecreePercentage && rappelPriceCondition.RoyalDecreePercentage !== 0 ? 'Yes' : 'No';            
            const rappelBindingPath = "/PriceConditionView/".concat(rappelIndex);
            const rappelvBox = this.byId("idRappelVbox");
            rappelvBox.bindElement({ path: rappelBindingPath, model: "fastAppData" });
            const existingPriceCondition = !!priceConditionViews[rappelIndex]?.ExistingPriceConditionID;            
            Services.getFastAppDataModel().setProperty("/RappelRequired", false);
            if(existingPriceCondition){
                Services.getFastAppDataModel().setProperty("/RappelRequired", true);                
                this.calculateRoyalDecreeAppliesAndMainConditionPrice();
            } 
            return rappelBindingPath;
        },

        /**
         * This method  sets the element binding of the Current Prices
         * @returns {String} - Binding path of the Current Prices
         */        
        bindingCurrentPrices: function(){
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const currentPricesIndex = priceConditions.findIndex(i => i.isMain);
            if(currentPricesIndex < 0) return null;
            const currentPricesBindingPath = "/PriceConditionView/".concat(currentPricesIndex);
            const currentPricesVbox = this.byId("idCurrentPricesVbox");
            currentPricesVbox.bindElement({ path: currentPricesBindingPath, model: "fastAppData" });
            const mainPriceCondition = priceConditions.find(i => i.isMain);
            if(mainPriceCondition){
                mainPriceCondition.PVLPercentageChange =  (Number(mainPriceCondition.PVL) - Number(mainPriceCondition.PriceConditionPVL)) / Number(mainPriceCondition.PriceConditionPVL);
                mainPriceCondition.ConfidentialPricePercentageChange =  (Number(mainPriceCondition.YLAP) - Number(mainPriceCondition.ConfidentialPrice)) / Number(mainPriceCondition.ConfidentialPrice);         
            }
            return currentPricesBindingPath;
        },        

        onHistoryFilterCheck: function(oEvent){
            let oFilters = [];
            let vTable = this.byId("tenderHistoryId");
            //const sConditionType = (oEvent.getSource().getId()).split("-").pop();
            const selectedProductId =  Services.getSelectedProductID();
            oFilters.push(new sap.ui.model.Filter("PRODUCT_ID", sap.ui.model.FilterOperator.EQ, selectedProductId));
            if(this.byId("currentInstituteCheckId").getSelected()){
                const currentInstituteId = Services.getFastAppDataModel().getProperty("/Tender/Institute/InstituteID");
                oFilters.push(new sap.ui.model.Filter("INSTITUTE_ID", sap.ui.model.FilterOperator.EQ, currentInstituteId));
            }
            if(this.byId("wonCheckId").getSelected()){
                oFilters.push(new sap.ui.model.Filter("OUTCOME", sap.ui.model.FilterOperator.EQ, "Won"));
            }
            if(this.byId("lossCheckId").getSelected()){
                oFilters.push(new sap.ui.model.Filter("OUTCOME", sap.ui.model.FilterOperator.EQ, "Lost"));
            }     
            
            vTable.getBinding("items")?.filter(oFilters, FilterType.Application);            
        }, 

        calculateRoyalDecreeAppliesAndMainConditionPrice: function(){
            //calculating the RoyalDecreeApplies
            const priceConditionViews = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const rappelIndex = priceConditionViews.findIndex(item => item.ConditionType === "Rappel");
            if(rappelIndex < 0) return null;
            const rappelPriceCondition = priceConditionViews[rappelIndex];
            let instType = Services.getFastAppDataModel().getProperty("/Tender/Institute/InstituteType");            
            rappelPriceCondition.RoyalDecree = (instType === 'Public Account' || instType === 'Region(s)' || instType === 'National') && rappelPriceCondition.RoyalDecreePercentage && rappelPriceCondition.RoyalDecreePercentage !== 0 ? 'Yes' : 'No';
            //calculating Main Price Condition
            const sSelectedMainPriceCondition = this.getView().byId('idPriceConditionSelect').getSelectedItem()?.getText();
            const mainPriceCondition = priceConditionViews.find(i => i.isMain &&  i.ConditionType === sSelectedMainPriceCondition);
            if(mainPriceCondition){
                if(mainPriceCondition.ConditionType === "Precio Neto")
                {
                    rappelPriceCondition.MainPrice = mainPriceCondition.NetPriceWithoutTaxAfterDeductionRD;
                }

                if(mainPriceCondition.ConditionType === "Descuento Comercial")
                {
                    rappelPriceCondition.MainPrice = mainPriceCondition.NetPriceWithoutTax;
                }

                if(mainPriceCondition.ConditionType === "Descuento Especial")
                {
                    rappelPriceCondition.MainPrice = 0;
                }

                if(mainPriceCondition.ConditionType === "Rental" || mainPriceCondition.ConditionType === "PVL")
                {
                    rappelPriceCondition.MainPrice = rappelPriceCondition.RoyalDecree === "Yes" ? mainPriceCondition.YLAP * (1 - mainPriceCondition.RoyalDecreePercentage) : (instType === 'Public Account' || instType === 'Region(s)' || instType === 'National') ? mainPriceCondition.YLAP : mainPriceCondition.PVL;                 
                }
            }            
            Services.getFastAppDataModel().updateBindings();
        },

        /**
         * This method  sets the element binding of the FOC fragment
         * @returns {String} - Binding path of the Rappel price condition
         */
        bindFocFragment: function(){
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            if(focIndex < 0) return null;
            const focBindingPath = "/PriceConditionView/".concat(focIndex);
            const focVbox = this.byId("idFOCVbox");
            focVbox.bindElement({ path: focBindingPath, model: "fastAppData" });
            const existingPriceCondition = !!priceConditions[focIndex]?.ExistingPriceConditionID;
            Services.getFastAppDataModel().setProperty("/FOCRequired", false);
            if(existingPriceCondition) Services.getFastAppDataModel().setProperty("/FOCRequired", true);
            return focBindingPath;
        },

        addDiscountConditions: async function(rappelBindingPath){
            const rappelPriceCondition = Services.getFastAppDataModel().getProperty(rappelBindingPath);
            if(rappelPriceCondition && rappelPriceCondition.ExistingPriceConditionID){
                const discountConditions = (await Services.getService("PriceCondition").getDiscountConditions({
                    PriceConditionID: rappelPriceCondition.ExistingPriceConditionID
                })).data.results;
                Services.getFastAppDataModel().setProperty(rappelBindingPath.concat("/DiscountConditions"), discountConditions);
            }
        },

        addFOCs: async function(focBindingPath){

            const focPriceCondition = Services.getFastAppDataModel().getProperty(focBindingPath);
            if(focPriceCondition && focPriceCondition.ExistingPriceConditionID){
                let focs = (await Services.getService("PriceCondition").getFocs({
                    PriceConditionID: focPriceCondition.ExistingPriceConditionID
                })).data.results;

                let aCountryBrandProducts = Services.getFastAppDataModel().getProperty("/CountryBrandProducts");

                focs = focs.map(freegood => {
                    var countryBrandProduct = aCountryBrandProducts.find(countryBrandProduct => countryBrandProduct.PRODUCT_ID === freegood.ProductPackId);
                    freegood.ProductName = countryBrandProduct?.PRODUCT_NAME;
                    return freegood;
                });


                Services.getFastAppDataModel().setProperty(focBindingPath.concat("/FreeGoodsOther"), focs);
            }   
        },

        getProducts: async function (){ 
            //load products
		    let aProducts = await this.getFinancialProducts(Services.getSelectedOfferID());
            aProducts.sort((a, b) => (a.SORTER > b.SORTER) ? 1 : -1)
            let oFastAppDataModel = Services.getFastAppDataModel();
            oFastAppDataModel.setProperty("/ProductPricingView", aProducts);

        },

        getCountryBrandFOCsCombined: async function(){
            const oFastAppDataModel = Services.getFastAppDataModel();
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const focIndex = priceConditions ? priceConditions.findIndex(item => item.ConditionType === "FOC") : -1;
            const focBindingPath = "/PriceConditionView/".concat(focIndex) + '/FreeGoodsOther';
            let aFreeGoodsOther = oFastAppDataModel.getProperty(focBindingPath);

			//load countryBrandProducts
			let aCountryBrandProducts = Services.getFastAppDataModel().getProperty("/CountryBrandProducts");
            if(aFreeGoodsOther && aFreeGoodsOther.length > 0){
                aFreeGoodsOther = aFreeGoodsOther.map(freegood => {
                    var countryBrandProduct = aCountryBrandProducts.find(countryBrandProduct => countryBrandProduct.PRODUCT_ID === freegood.ProductPackId);
                    freegood.ProductName = countryBrandProduct?.PRODUCT_NAME;
                    return freegood;
                });

                oFastAppDataModel.setProperty(focBindingPath, aFreeGoodsOther);

            }
		},

        getPriceConditionView: async function(){

            BusyIndicator.show();

            const offer = Services.getFastAppDataModel().getProperty("/SelectedOffer");
            if(offer){
                const selectedProduct = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(),Services.getSelectedProductID());

                const filter = {
                    "CountryCode": offer.CountryCode,
                    "Classification": offer.Tender.Classification,
                    "Division": offer.Division,
                    "OfferID": offer.OfferID,
                    "ProductCode": selectedProduct.ProductCode
                };

                let priceConditionViews = await Services.getService("PriceCondition").getPriceConditionView(filter);
                
                BusyIndicator.hide();
                return priceConditionViews.data.results;
            } else return null;

        },
        
        getTenderHistorySpain: async function(){

            BusyIndicator.show();

            const offer = Services.getFastAppDataModel().getProperty("/SelectedOffer");
            if(offer){
                const selectedProduct = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(),Services.getSelectedProductID());
                //const currentInstituteId = Services.getFastAppDataModel().getProperty("/Tender/Institute/InstituteID");

                const filter = {
                  //  "INSTITUTE_ID": currentInstituteId,
                   // "OfferID": offer.OfferID,
                    "ProductCode": selectedProduct.ProductCode
                    
                };

                let tenderHistorySpain = await Services.getService("PriceCondition").getTenderHistorySpain(filter);
                
                BusyIndicator.hide();
                return tenderHistorySpain.data.results;
            } else return null;

        },

		setFinancialOffer: async function(){
			//Edit offer copy to move back to original values during cancel
			let sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
			//Services.getFastAppDataModel().setProperty("/EditProduct/", oProductPrice);

			let sSelectedSection = Services.getFinancialOfferPageSectionID_ES();
			Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection);

		},
		refreshFinancialTabES: async function () {
			await this.getProducts();
            await this.getProductTypeProfitability(Services.getSelectedOfferID(), Services.getSelectedCountry());
            await this.managePriceConditionClassification();
            await this.managePriceConditions();
			this.setFinancialOffer();
            await this.calculateProfitability();
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

				return response.data && response.data.results.filter(item => item.ActiveProduct === 1 ).map(item => {
					
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

        getProductTypeProfitability: async function (sOfferId, sCountryCode){
            const oFastAppDataModel = Services.getFastAppDataModel();

            if (sOfferId, sCountryCode) {
				const response = await Services.getProductTypeProfitability(sOfferId, sCountryCode);
                oFastAppDataModel.setProperty("/ProductTypeProfitability", response.data.results);
				return response.data.results;
			}
        },

        getPriceConditionClassification: async function(){

            const oFastAppDataModel = Services.getFastAppDataModel();
            const offer = oFastAppDataModel.getProperty("/SelectedOffer");
            if(offer){
                const selectedProduct = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(),Services.getSelectedProductID());
                const productType = selectedProduct?.SKU?.ProductType;
                const filter = {
                    "CountryCode": offer.CountryCode,
                    "Classification": offer.Tender.Classification,
                    "Division": offer.Division,
                    "ProductTypes": ["All"]
                    // "isMain": true
                };

                // add Injector as filter
                if(productType === "Injector"){
                    filter.ProductTypes.push(productType);
                }

                const priceConditionClassificationResponse = await Services.getService('PriceCondition').getPriceConditionClassification(filter);
                return priceConditionClassificationResponse.data && priceConditionClassificationResponse.data.results;
            } else {
                return null;
            }
        },

        getPriceConditionViewAllProduts: async function(){
            
            const oFastAppDataModel = Services.getFastAppDataModel();
            const offer = oFastAppDataModel.getProperty("/SelectedOffer");

            const filter = {
                "CountryCode": Services.getSelectedCountry(),
                "OfferID": Services.getSelectedOfferID(),
                "Classification": offer.Tender.Classification,
                "Division": offer.Division,
            };

            const priceConditionResponse = await Services.getService('PriceCondition').getPriceConditionView(filter);
            return priceConditionResponse.data && priceConditionResponse.data.results;
        },

		_checkApprovalEnabled: function (){
			let sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID);
			var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);

			if (oOffer && (oOffer.Active !== 1 || oOffer.ActiveOffer !== 1)) {
				bEnableApproval = false;
			}

			this.byId("ApprovalButtonId").setEnabled(bEnableApproval);

		},

		/**
		 * Save financial offer for Italy
		 * @param {*} oEvent 
		 */
		onSaveFinancialOfferSpain: async function (oEvent) {

            BusyIndicator.show();

            const selectedPriceConditionViewObjects = this.getSelectedPriceConditionViewObjects();
            const aErroneousConditions = this.checkSaveFinancialOfferSpain(selectedPriceConditionViewObjects);   
            const selectedProductID = Services.getSelectedProductID();
            if(aErroneousConditions && (aErroneousConditions.length > 0)) {
                BusyIndicator.hide();                
                this.byId("ApprovalButtonId").setEnabled(false);
                sap.m.MessageBox.error(`You must fill in all the mandatory fields for the following condition(s): \n\n ${aErroneousConditions.join()}`);
                return;
            } 

            let aFieldGroupContent = sap.ui.getCore().byFieldGroupId("priceInputPrecioNeto");
            if(aFieldGroupContent.find(element => !element.sId.includes('popup') && element.getProperty('valueState') === 'Error')){
                BusyIndicator.hide();                
                this.byId("ApprovalButtonId").setEnabled(false);
                sap.m.MessageBox.error(`You must correct all errors before saving`);
                return;
            }

            else {         
                let sTenderID = "";   
                try {
                    await this.savePriceConditions(selectedPriceConditionViewObjects);

                    // Additional saving to PT_TMBDPR. The tender flow should keep working. 
                    // Thats why we need to store the basic price structure not only in the new tables but also in the PT_TMBDPR table
                    await this.savePricesToTMBDPR();

                    await this.saveProfitabilityParameters();
                    
                    var bLoadedCheck = false;
                    sTenderID = Services.getSelectedTenderID();
                    await Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck);

                    // refresh the Master list
                    Services.getDefaultModel().refresh(true);
                    
                } catch (error) {
                    throw error;
                }

                //switch from edit to display
                this._DetailController.onEditToggleButtonPress();

                //refresh tenders master table (left pane)
                Services.refreshTendersMasterTable(sTenderID);

                //update approvals sent to 0 (to indicate that a change has been made to the offer data, so approvals need to be send again)
                let sOfferID = Services.getSelectedOfferID();
                var oOffer = Services.getLoadedOffer(sOfferID);
                const iApprovals_sent = oOffer.APPROVALS_SENT; //offerInfo.APPROVALS_SENT;
                Services.saveOfferApprovalSent(iApprovals_sent).catch(function (oError) {
                    //Error during save
                    Services.showErrorMessage(oError, "Background saving for approvals sent field");
                });

                //show success message
                Services.getOfferCompositeMessages().push({
                    type: 'Success',
                    title: 'Financial Offer Saved Successfully',
                    description: 'Financial Offer Saved Successfully'
                });

                Services.showMessageCompositeView("Offer Saved", Services.getOfferCompositeMessages(), 'Success');
                Services.getOfferCompositeMessages().splice(0, Services.getOfferCompositeMessages().length);

                // enable approval button
                this._checkApprovalEnabled();

                //refresh data (for table)
                await this.refreshFinancialTabES();

                if(Services.getFastAppDataModel().getProperty("/SelectedOffer")){
                    await this.managePriceConditions();

                    let calculatedConsolidatedProfitability = this.getConsolidatedProfitability();
                    if(calculatedConsolidatedProfitability && calculatedConsolidatedProfitability.length > 0){
                        const saveProductProfitabilityPromises = calculatedConsolidatedProfitability.map(consolidatedProfitabilityObj => {
                            return Services.getService("Offer").upsertProductTypeProfitability(consolidatedProfitabilityObj);
                        });

                        await Promise.all(saveProductProfitabilityPromises);
                    }
                }

                /* default selected product to the one which was selected */
                Services.setSelectedProductID(selectedProductID);
                let aProducts = Services.getFastAppDataModel().getProperty('/SelectedOffer/Product/results');
                Services.setSelectedProductName(aProducts.find(product => product.ProductCode === selectedProductID)?.SKU?.PRODUCTPACKNAME);

                BusyIndicator.hide();
            } 
		},

        saveProfitabilityParameters: function(){
            const saveOfferDataPromises = [];
            const oFastAppDataModel = Services.getFastAppDataModel();
            const oSelectedOffer = oFastAppDataModel.getProperty('/SelectedOffer');
            let oOfferSaveInfo = {
                OfferID: Services.getSelectedOfferID(),
                ProfitabilityStartMnth: oSelectedOffer.ProfitabilityStartMnth,
                ProfitabilityAgrDur: oSelectedOffer.ProfitabilityAgrDur,
                ProfitabilityYrlyMntCost: oSelectedOffer.ProfitabilityYrlyMntCost,
                ProfitabilityDiscRate: oSelectedOffer.ProfitabilityDiscRate,
                ProfitabilityGrowthRate: oSelectedOffer.ProfitabilityGrowthRate,
            }

            if(oOfferSaveInfo){
                saveOfferDataPromises.push(Services.getService("Offer").updateOffer(oOfferSaveInfo));
            }

            return Promise.all([saveOfferDataPromises]);
        },

        savePriceConditions: function(selectedPriceConditionViewObjects){
            const savePriceConditionPromises = [];
            selectedPriceConditionViewObjects.forEach(priceConditionViewObj => {
                let requiredPriceConditionViewObject = null;
                if(priceConditionViewObj.isMain){
                    if(priceConditionViewObj.ConditionType === "PVL"){
                        priceConditionViewObj = this.calculateNetPricesPVL(priceConditionViewObj);
                    }
                    requiredPriceConditionViewObject = priceConditionViewObj;
                }else{
                    const rappelRequired = Services.getFastAppDataModel().getProperty("/RappelRequired");
                    const focRequired = Services.getFastAppDataModel().getProperty("/FOCRequired");
                    if(priceConditionViewObj.ConditionType === "Rappel" && rappelRequired){
                        requiredPriceConditionViewObject = priceConditionViewObj;
                    }
                    if(priceConditionViewObj.ConditionType === "FOC" && focRequired){
                        /**
                         * Remove non-existent fields from the FreeGoodsOther entity. These fields have been added in the user interface 
                         * and are needed for calculations. But they do not exist in the FreeGoodsOther entity and cannot be saved.
                         */
                         priceConditionViewObj.FreeGoodsOther?.forEach(item => {
                            delete item.ConfidentialPrice;
                            delete item.PVL;
                            delete item.isSameAsMainProduct;
                            delete item.packFactor;
                            delete item.UOM;
                            delete item.ProductPackIdValueState;
                            delete item.RoyalDecreePercentage;
                         });

                        requiredPriceConditionViewObject = priceConditionViewObj;
                    }
                }
                if(requiredPriceConditionViewObject){
                    const priceConditionSaveObject = Services.getService("PriceCondition").convertToSaveObject(requiredPriceConditionViewObject,"FinancialOfferPage");
                    savePriceConditionPromises.push(Services.getService("PriceCondition").upsertPriceCondition(priceConditionSaveObject));
                }
            });

            const deletePriceConditionPromises = [];
            selectedPriceConditionViewObjects.forEach(priceConditionViewObj => {
                let requiredPriceConditionViewObject = null;
                if(!priceConditionViewObj.isMain){
                    const rappelRequired = Services.getFastAppDataModel().getProperty("/RappelRequired");
                    const focRequired = Services.getFastAppDataModel().getProperty("/FOCRequired");
                    if(priceConditionViewObj.ConditionType === "Rappel" && !rappelRequired && priceConditionViewObj.ExistingPriceConditionID){
                        requiredPriceConditionViewObject = priceConditionViewObj;
                    }
                    if(priceConditionViewObj.ConditionType === "FOC" && !focRequired && priceConditionViewObj.ExistingPriceConditionID){
                        requiredPriceConditionViewObject = priceConditionViewObj;
                    }
                }
                if(requiredPriceConditionViewObject){
                    const priceConditionDeleteObject = Services.getService("PriceCondition").convertToSaveObject(priceConditionViewObj,"FinancialOfferPage");
                    deletePriceConditionPromises.push(Services.getService("PriceCondition").deletePriceCondition(priceConditionDeleteObject));
                }
            });

        
            
            const deletePreExistingMainPriceConditionPromises = this.deletePreExistingMainPriceConditions(selectedPriceConditionViewObjects);


            return Promise.all([savePriceConditionPromises,deletePriceConditionPromises,deletePreExistingMainPriceConditionPromises]);
        },

        /**
         * Delete all pre-existing main price conditions.
         * This use case can occur when the user changes the main price condition type 
         * after a main price condition was already been created
         * @returns {Array<Promise>}
         */
        deletePreExistingMainPriceConditions: function(selectedPriceConditionViewObjects){
            const allPriceConditionViews = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const mainSelectedPriceConditionView = selectedPriceConditionViewObjects.find(obj => obj.isMain);
            const preExistingPriceConditions = allPriceConditionViews.filter(condition => condition.isMain && condition.ExistingPriceConditionID)
                                                                     .filter(condition => condition.ExistingPriceConditionID !== mainSelectedPriceConditionView.ExistingPriceConditionID);
            return preExistingPriceConditions.map(condition => {
                const priceConditionDeleteObject = Services.getService("PriceCondition").convertToSaveObject(condition,"FinancialOfferPage");
                return Services.getService("PriceCondition").deletePriceCondition(priceConditionDeleteObject);
            });
        },

        savePricesToTMBDPR: async function(){

            //get selected product and the price values
			let oFastAppDataModel = Services.getFastAppDataModel();
			let sTenderID = Services.getSelectedTenderID();
			let oOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
			let sOfferID = oOffer.OfferID;
			let sOfferPath = Services.getSelectedOfferPath();
			let sProductId = Services.getSelectedProductID();
			let aProducts = Services.getLoadedProductsForOffer(sOfferID);
			let oProduct = aProducts && aProducts.results && aProducts.results.find(prod => prod.ProductCode == sProductId);
			let oProductPrice = oFastAppDataModel.getProperty(this.selectedProductPricePath);
			// let aMessages = [];


            const selectedPriceConditionViewObjects = this.getSelectedPriceConditionViewObjects();
            const oMainPriceCondition = selectedPriceConditionViewObjects.find(item => item.isMain);

			//build old price object for additional saving to PT_TMBDPR
			let oNewPriceInfo = this.getOfferProductPrices(oOffer, oProduct, oProductPrice, oMainPriceCondition);

			//convert old price to save & save
			let oPriceToSave = Services.getService('Price').getConvertPriceToSave(oNewPriceInfo);
			await Services.getService('Price').updatePrice(oPriceToSave);

            //Update offer
            var oOfferSaveInfo = {};
            oOfferSaveInfo.OfferID = Services.getSelectedOfferID();
            oOfferSaveInfo.Currency = this.byId("idCurrency").getSelectedKey();
            oOfferSaveInfo.FOCType = this.byId("idFOCType").getSelectedKey();
            //default foc abolute or percentage is decided on first product price thats saved... so if empty, save
            if (!oOffer.DEFAULT_FOC_ABS_PCT) {
                oOfferSaveInfo.DEFAULT_FOC_ABS_PCT = 'ABS';//this.byId("idEditPriceOffer_idFocAbsPct").getSelectedKey();
            }

            //update offer
            await Services.getService('Offer').updateOffer(oOfferSaveInfo).catch(function (oError) {

                //show error message
                Services.showErrorMessage(oError, "Update of offer");

                //promises must fail as well
                throw new Error(oError);

            });
        },

        //for additional saving to PT_TMBDPR
		getOfferProductPrices: function (oOffer, oProduct, oProductPrice, oMainPriceCondition) {

            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let packFactor =  oProductPrice.PACKFACTOR;
            let UOM = oProductPrice.UOM;
            let correctPrice;
            if(instType === "Private Account"){
                if(UOM === "Unit"){
                    correctPrice = oMainPriceCondition.PVL / packFactor;
                } else {
                    correctPrice = oMainPriceCondition.PVL;
                }
            } else {
                if(UOM === "Unit"){
                    correctPrice = oMainPriceCondition.YLAP / packFactor;
                } else {
                    correctPrice = oMainPriceCondition.YLAP;
                }
            }

			//PT_TMBDPR structure
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
				RegPrice: correctPrice,
				FOC: null,
				FOCType: null,
				FOCStep: null,
				Discount: oMainPriceCondition.Discount,
				OfferPrice:  oMainPriceCondition.NetPriceWithoutTaxAfterDeductionRD || oMainPriceCondition.NetPriceWithoutTax,
				StandardDiscount: oMainPriceCondition.StandardDiscount,
				AdditionalDiscount: oMainPriceCondition.AdditionalDiscount,
				Deductions: 0,
				NetofferPrice: oMainPriceCondition.NetPriceWithoutTaxAfterDeductionRD || oMainPriceCondition.NetPriceWithoutTax,
				BusinessCasePrice: 0,
				WholesalePrice: "",
				COGS: 0,
				SpotRate: 1,
				BudgetRate: 1,
				Scenario: 0,
				FOC_ABS_PCT: oProductPrice.FOC_ABS_PCT,
				FOCProduct_Bundled_1: null, 
				FOC_ABS_PCT_Bundled_1: null,
				FOC_Bundled_1: null,
				ActiveTier: 0,
				NetPrice: oMainPriceCondition.NetPriceWithoutTaxAfterDeductionRD || oMainPriceCondition.NetPriceWithoutTax,
				NetPrice_OfPaid: 0,
				PRICE_UPDATE: oOffer.APPROVALS_SENT // Mechanism to identify that approval is required again is based on this field
			};

			return oNewPriceInfo;
		},        


        /**
         * @returns {Array:Objects} - A list of price condition view objects that the user has interacted with in the UI
         */
        getSelectedPriceConditionViewObjects: function(){
            const selectedPriceConditionTypes = this.getSelectedPriceConditionTypes();
            const allPriceConditionViews = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const filteredPriceConditions = allPriceConditionViews.filter(priceCondition => {
                let conditionType = selectedPriceConditionTypes.find(ct => ct === priceCondition.ConditionType);
                if(conditionType) return conditionType;
            });

            const enhancedPriceConditions = filteredPriceConditions.map(priceCondition => {
                return priceCondition = {
                    "PriceConditionClassification_ID": this.getPriceConditionClassificationID(priceCondition.ConditionType).ID,
                    ...priceCondition
                }
            });

            return enhancedPriceConditions;
        },


        /**
         * Gets the ID of a PriceConditionClassification 
         * @param {String} sConditionType 
         * @returns {String} - UUID of the given PriceConditionClassification
         */
        getPriceConditionClassificationID: function(sConditionType){
            const priceConditionClassification = Services.getFastAppDataModel().getProperty("/PriceConditionClassification");
            return priceConditionClassification.find(item => item.ConditionType === sConditionType);
        },

        /**
         * @returns {Array:String} - A list of condition types relevant for processing
         */
        getSelectedPriceConditionTypes: function(){

            const selectedPriceConditions = [];
            const classification = Services.getFastAppDataModel().getProperty("/SelectedOffer/Tender/Classification");
            const division = Services.getFastAppDataModel().getProperty("/SelectedOffer/Division");

            const oSelectPriceCondition = this.byId("idPriceConditionSelect");

            if(oSelectPriceCondition.getSelectedItem()){
                selectedPriceConditions.push(oSelectPriceCondition.getSelectedItem().getText());
            }

            if(classification === "Commercial Agreement"){
                selectedPriceConditions.push("Rappel");
            }

            if(classification === "Commercial Agreement" && division === "Pharma" || division === "Radiology"){
                selectedPriceConditions.push("FOC");
            }

            return selectedPriceConditions;
        },

        getConsolidatedProfitability: function(){  
            let oFastAppDataModel = Services.getFastAppDataModel();
            return oFastAppDataModel.getProperty('/SelectedOffer/ConsolidatedProfitability');
        },

        checkSaveFinancialOfferSpain: function (oPriceConditions){
            const rappelRequired = Services.getFastAppDataModel().getProperty("/RappelRequired");
            const focRequired = Services.getFastAppDataModel().getProperty("/FOCRequired");
            const classification = Services.getFastAppDataModel().getProperty("/Classification");
            var aErroneousCondition = [];            

            for(let i = 0; i < oPriceConditions.length; i++){            
                if(oPriceConditions[i].ConditionType === "Precio Neto") {
                    if(!oPriceConditions[i].RoyalDecree || !oPriceConditions[i].NetPriceWithoutTaxAfterDeductionRD || (classification === 'Tender' && !oPriceConditions[i].MaximumPrice)){
                        aErroneousCondition.push(oPriceConditions[i].ConditionType);
                    }
                } else if(oPriceConditions[i].ConditionType === "Descuento Comercial"){
                    if(!oPriceConditions[i].RoyalDecree){
                        aErroneousCondition.push(oPriceConditions[i].ConditionType);
                    }
                } else if(oPriceConditions[i].ConditionType === "Descuento Especial"){
                    //no explicit checks needed
                } else if(oPriceConditions[i].ConditionType === "Rappel"){
                    if(rappelRequired && 
                        ( //!oPriceConditions[i].RoyalDecree || 
                            !oPriceConditions[i].Liquidation || 
                            // !oPriceConditions[i].onVolumeTreshhold || 
                            // !oPriceConditions[i].Discount || 
                            !oPriceConditions[i].DiscountConditions || 
                            !oPriceConditions[i].RefundDate ||
                            !oPriceConditions[i].Settlement_ID
                            )){
                        aErroneousCondition.push(oPriceConditions[i].ConditionType);
                    } // TODO: check the requirements 
                } else if(oPriceConditions[i].ConditionType === "FOC"){
                    //no explicit checks needed
                    //Dear future developer, user "focRequired" if you add a check for required fields of FOC
                    //example: if(focRequired && (!oPriceConditions[i].fieldX ||... ))
                    //May the force be with you !
                }
            }      
            
            // the main price condition should be mandatory
            const mainPriceCondition = oPriceConditions.find(i => i.isMain);

            if(!mainPriceCondition){
                aErroneousCondition.push("No main price condition selected.");
                BusyIndicator.hide();
            }

            return aErroneousCondition;
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
                            
                        that.onFinancialProductPress(oEvent, true);
                        this.selectedProductPricePath = Services.getSelectedProductPath();
				}
			}
		},

        onFinancialProductPress: async function(oEvent, bBindingFinished){
            BusyIndicator.show();
            //get context of selected price product
            let oFastAppDataModel = Services.getFastAppDataModel();
            if (!bBindingFinished) {
                const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
                this.byId("FinPricingOfferSubsection").setBindingContext(bindingContext, "fastAppData");
                this.selectedProductPricePath = bindingContext.sPath;
            } else {
                this.selectedProductPricePath = Services.getSelectedProductPath();
                if(!this.selectedProductPricePath && this.byId("idFinancialOfferViewProduct").getItems()?.length > 0){
                    this.selectedProductPricePath = '/ProductPricingView/0';
                }
                let oBindingContext = this.byId("idFinancialOfferViewProduct").getItems()[parseInt(this.selectedProductPricePath.substring(this.selectedProductPricePath.lastIndexOf('/') + 1))].getBindingContext('fastAppData');
                this.byId("FinPricingOfferSubsection").setBindingContext(oBindingContext, "fastAppData");
            }
            
			let oProductPrice = oFastAppDataModel.getProperty(this.selectedProductPricePath);
            
            //keep selected product ID
            Services.setSelectedProductID(oProductPrice.ProductCode);
            Services.setSelectedProductName(oProductPrice.ProductPackName);
			Services.setSelectedProductPath(this.selectedProductPricePath);
        
            //Edit offer copy to move back to original values during cancel
			let sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
			Services.getFastAppDataModel().setProperty("/EditProduct/", oProductPrice);

			let oSelectedProduct = oOffer?.Product && oOffer?.Product?.results?.length > 0 ? oOffer.Product.results[this.selectedProductPricePath.substring(this.selectedProductPricePath.lastIndexOf('/') + 1)] : null;
			if(oSelectedProduct){
				Services.getFastAppDataModel().setProperty("/EditSelectedProduct/", oSelectedProduct);
			}
               
            // to solve some loading issues this code is needed
            if(!bBindingFinished && oFastAppDataModel.getProperty("/SelectedOffer")){
                await this.managePriceConditionClassification();
                await this.managePriceConditions();
            } 

            // enable approval button
            this._checkApprovalEnabled();

            BusyIndicator.hide();

        },

        onPriceConditionChange: function(oEvent){
            const sConditionType = oEvent.getSource().getSelectedItem().getText();
            const classification = Services.getFastAppDataModel().getProperty("/SelectedOffer/Tender/Classification");            
            this.loadMainPriceConditionFragment(sConditionType);
            if(classification === "Commercial Agreement") this.calculateRoyalDecreeAppliesAndMainConditionPrice();
        },

        loadMainPriceConditionFragment: function(sConditionType){

            // clear the VBox first
            const vBox = this.byId("idPriceConditionVbox");
            vBox.removeAllItems();

            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const selectedPriceConditionsIndex = priceConditions.findIndex(item => item.ConditionType === sConditionType);
            const sFragmentPath = "FAST_NS0FAST0.view.fragments.priceConditions"; 
            const oFastAppDataModel = Services.getFastAppDataModel();

            if(selectedPriceConditionsIndex > -1) {
                const bindingPath = "/PriceConditionView/".concat(selectedPriceConditionsIndex);
                let sFragmentName = sConditionType.split(" ").join("");

                // add RequestedVolume from the selected product to the PriceConditionView entity.
                const requestedVolume = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(),Services.getSelectedProductID())?.RequestedVolume;
                const maxPrice = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(),Services.getSelectedProductID())?.MaxPrice;
                oFastAppDataModel.setProperty(bindingPath.concat("/RequestedVolume"), requestedVolume);
                if(sConditionType === 'Precio Neto' || sConditionType === 'Descuento Comercial'){
                    
                    if(sConditionType === 'Precio Neto'){                        
                    oFastAppDataModel.setProperty(bindingPath.concat("/MaximumPrice"), maxPrice);}

                    //check if royal decree applies for precio netto and Descuento Comercial
                    let oPrecioNettoCondition = oFastAppDataModel.getProperty(bindingPath);
                    let instType = oFastAppDataModel.getProperty('/Tender/Institute/InstituteType');
                    let discount = oPrecioNettoCondition.Discount ? oPrecioNettoCondition.Discount : 0;
                    if(oPrecioNettoCondition && !oPrecioNettoCondition.RoyalDecree) oPrecioNettoCondition.RoyalDecree = (instType === 'Public Account' || instType === 'Region(s)' || instType === 'National') && oPrecioNettoCondition.RoyalDecreePercentage && oPrecioNettoCondition.RoyalDecreePercentage !== 0 ? 'Yes' : 'No';
                    if(sConditionType === 'Descuento Comercial' && !oPrecioNettoCondition.RoyalDecreeValue && !oPrecioNettoCondition.ExistingPriceConditionID) this.calculateNetPricesDescuentoComercial(oPrecioNettoCondition,discount);
                } 
                
                Services.setSelectedPriceConditionPath(bindingPath);

                Fragment.load({
                    id: this.getView().getId(),
                    name: sFragmentPath.concat(".",sFragmentName),
                    controller: this
                }).then(function (oFragment) {
                    if(Array.isArray(oFragment)){                
                        oFragment.forEach(item => vBox.addItem(item));
                    } else {
                        vBox.addItem(oFragment);
                    }
                    vBox.bindElement({ path: bindingPath, model: "fastAppData" });
                }.bind(this));
            }

        },

        onLiveChangeNetPricesPrecioNeto: function(oEvent){
            const evt = oEvent;
            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const priceConditionViewObj = bindingContext.getObject();
            let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
            let packFactor =  oProductPrice.PACKFACTOR;
            let UOM = oProductPrice.UOM;

            const newNetPriceWithoutTaxBeforeDeductionRD = oEvent.getSource()?.getValue?.() || priceConditionViewObj.NetPriceWithoutTaxBeforeDeductionRD;
             
            // check that net price w/o tax incl royal decree is equal or lower than newMaximumPrice
            /* 
                NOTE: The if(evt.getSource().openValueStateMessage) check has been added, 
                    since we are now also calling this method from the "Royal decree included" checkbox.
                      Also, the code will throw error, as the sap.m.Select Control do not have openValueStateMessage() and closeValueStateMessage() methods. 
            */

            if(evt.getSource().openValueStateMessage){            
                if(bindingContext.getProperty('/Tender/Classification') === 'Tender'){
                    if(bindingContext.getProperty('/Tender/Institute/InstituteType') === 'Private Account' && 
                                (newNetPriceWithoutTaxBeforeDeductionRD > Number(priceConditionViewObj.MaximumPrice) || ((UOM === 'Unit' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.PVL) / packFactor )) || 
                                (UOM === 'Pack' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.PVL) ))))){
                        evt.getSource().setValueState("Error");
                        evt.getSource().setValueStateText("Net price w/o tax must be lower than the maximum price and PVL.");
                        evt.getSource().openValueStateMessage();  
                    } else if((bindingContext.getProperty('/Tender/Institute/InstituteType') === 'Public Account' || bindingContext.getProperty('/Tender/Institute/InstituteType') === 'Region(s)'  || bindingContext.getProperty('/Tender/Institute/InstituteType') === 'National') && 
                                (newNetPriceWithoutTaxBeforeDeductionRD > Number(priceConditionViewObj.MaximumPrice) || ((UOM === 'Unit' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.YLAP) / packFactor )) || 
                                (UOM === 'Pack' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.YLAP) ))))){                         
                        evt.getSource().setValueState("Error");
                        evt.getSource().setValueStateText("Net price w/o tax must be lower than the maximum price and confidential price.");
                        evt.getSource().openValueStateMessage();                    
                    }else{
                        evt.getSource().setValueState("None");
                        evt.getSource().setValueStateText("");
                        evt.getSource().closeValueStateMessage();
                    }                         
                } else if(bindingContext.getProperty('/Tender/Classification') === 'Commercial Agreement'){
                    if(bindingContext.getProperty('/Tender/Institute/InstituteType') === 'Private Account' && (UOM === 'Unit' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.PVL) / packFactor ) || 
                    (UOM === 'Pack' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.PVL) )))){
                        evt.getSource().setValueState("Error");
                        evt.getSource().setValueStateText("Net price w/o tax must be lower than PVL.");
                        evt.getSource().openValueStateMessage();
                    } else if((bindingContext.getProperty('/Tender/Institute/InstituteType') === 'Public Account' || bindingContext.getProperty('/Tender/Institute/InstituteType') === 'Region(s)'  || bindingContext.getProperty('/Tender/Institute/InstituteType') === 'National') && 
                            (UOM === 'Unit' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.YLAP) / packFactor ) || (UOM === 'Pack' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.YLAP) )))){
                        evt.getSource().setValueState("Error");
                        evt.getSource().setValueStateText("Net price w/o tax must be lower than the confidential price.");
                        evt.getSource().openValueStateMessage();
                    }else{
                            evt.getSource().setValueState("None");
                            evt.getSource().setValueStateText("");
                            evt.getSource().closeValueStateMessage();
                        }

                }else{
                        evt.getSource().setValueState("None");
                        evt.getSource().setValueStateText("");
                        evt.getSource().closeValueStateMessage(); 
                    }
                
            }
            this.calculateDiscountsAndNetPricesPrecioNeto(priceConditionViewObj,newNetPriceWithoutTaxBeforeDeductionRD);
                        
            bindingContext.getModel().updateBindings();
        
        },
                
        calculateDiscountsAndNetPricesPrecioNeto: function(priceConditionViewObj,newNetPriceWithoutTaxBeforeDeductionRD){
            /*const evt = oEvent;
            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const priceConditionViewObj = bindingContext.getObject();*/
            let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let packFactor =  oProductPrice.PACKFACTOR;
            let UOM = oProductPrice.UOM;

           /* let newNetP;
            if (oEvent.getId() === "change" || oEvent.getId() === "select"){
                newNetP = Number(priceConditionViewObj.NetPriceWithoutTaxBeforeDeductionRD);
            } else {
                 newNetP = Number(oEvent.getSource().getValue());

            }

            const newNetPriceWithoutTaxBeforeDeductionRD = newNetP;

            // check that net price w/o tax incl royal decree is equal or lower than newMaximumPrice
            /* 
                NOTE: the evt.getId() === "change" has been added, since we are now also calling this method from the "Royal decree inclusive" checkbox
                      errors will occur, as the select control does not have a value state message attribute, thus, code will dump 
            */
            /*if(bindingContext.getProperty('/Tender/Classification') === 'Tender' && newNetPriceWithoutTaxBeforeDeductionRD > priceConditionViewObj.MaximumPrice && evt.getId() === "change"){
                evt.getSource().setValueState("Error");
                evt.getSource().setValueStateText("Net price w/o tax incl royal decree must be lower than the maximum price .");
                evt.getSource().openValueStateMessage();
            } else if(bindingContext.getProperty('/Tender/Classification') === 'Commercial Agreement' && evt.getId() === "change"){
                if(bindingContext.getProperty('/Tender/Institute/InstituteType') === 'Private Account' && (UOM === 'Unit' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.PVL) / packFactor ) || (UOM === 'Pack' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.PVL) )))){
                    evt.getSource().setValueState("Error");
                    evt.getSource().setValueStateText("Net price w/o tax incl royal decree must be lower than PVL.");
                    evt.getSource().openValueStateMessage();
                } else if(bindingContext.getProperty('/Tender/Institute/InstituteType') === 'Public Account' && (UOM === 'Unit' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.YLAP) / packFactor ) || (UOM === 'Pack' && newNetPriceWithoutTaxBeforeDeductionRD > (Number(priceConditionViewObj.YLAP) )))){
                    evt.getSource().setValueState("Error");
                    evt.getSource().setValueStateText("Net price w/o tax incl royal decree must be lower than the confidential price.");
                    evt.getSource().openValueStateMessage();
                }else{
                    if(evt.getId() === "change"){
                        evt.getSource().setValueState("None");
                        evt.getSource().setValueStateText("");
                        evt.getSource().closeValueStateMessage();
                    }
                }

            }else{
                if(evt.getId() === "change"){
                    evt.getSource().setValueState("None");
                    evt.getSource().setValueStateText("");
                    evt.getSource().closeValueStateMessage(); 
                }
            }*/

            let correctPrice;
            if(instType === "Private Account"){
                if(UOM === "Unit"){
                    correctPrice = priceConditionViewObj.PVL / packFactor;
                } else {
                    correctPrice = priceConditionViewObj.PVL;
                }
            } else {
                if(UOM === "Unit"){
                    correctPrice = priceConditionViewObj.YLAP / packFactor;
                } else {
                    correctPrice = priceConditionViewObj.YLAP;
                }
            }

            const standardPrice = correctPrice * (1 - priceConditionViewObj.StandardDiscount);
            const additionalDiscount =  correctPrice > 0 ? ((standardPrice - newNetPriceWithoutTaxBeforeDeductionRD) / standardPrice).toFixed(6) : 0;

            let newNetPriceWithoutTaxAfterDeductionRD = "";
            let newNetPriceWithTaxAfterDeductionRD =  "";

            /*if(priceConditionViewObj.RoyalDecree === "IncludeInPrecioNeto"){
                newNetPriceWithoutTaxAfterDeductionRD = newNetPriceWithoutTaxBeforeDeductionRD * ( 1 - priceConditionViewObj.RoyalDecreePercentage);
            }else {
                newNetPriceWithoutTaxAfterDeductionRD = newNetPriceWithoutTaxBeforeDeductionRD;
            }

            if(priceConditionViewObj.RoyalDecree === "ExcludeInPrecioNeto"){
                newNetPriceWithTaxAfterDeductionRD = newNetPriceWithoutTaxAfterDeductionRD * ( 1 + priceConditionViewObj.Tax) * ( 1 - priceConditionViewObj.RoyalDecreePercentage);
            }else {
                newNetPriceWithTaxAfterDeductionRD = newNetPriceWithoutTaxAfterDeductionRD * ( 1 + priceConditionViewObj.Tax);
            }*/

            // set the calcualted field and update the bindings
            newNetPriceWithoutTaxAfterDeductionRD = priceConditionViewObj.RoyalDecreeIncl === true ? newNetPriceWithoutTaxBeforeDeductionRD : newNetPriceWithoutTaxBeforeDeductionRD * (1 - priceConditionViewObj.RoyalDecreePercentage);
            if(instType === 'Private Account'){
                newNetPriceWithoutTaxAfterDeductionRD = newNetPriceWithoutTaxBeforeDeductionRD;
            }
            //priceConditionViewObj.RoyalDecreeValue = priceConditionViewObj.RoyalDecreeIncl === false ? newNetPriceWithoutTaxBeforeDeductionRD * priceConditionViewObj.RoyalDecreePercentage : newNetPriceWithoutTaxBeforeDeductionRD * priceConditionViewObj.RoyalDecreePercentage / 1 - priceConditionViewObj.RoyalDecreePercentage;
            priceConditionViewObj.RoyalDecreeValue = priceConditionViewObj.RoyalDecreeIncl === true ? Number(newNetPriceWithoutTaxBeforeDeductionRD / (1 - priceConditionViewObj.RoyalDecreePercentage) - newNetPriceWithoutTaxBeforeDeductionRD).toFixed(6) : Number(newNetPriceWithoutTaxBeforeDeductionRD - newNetPriceWithoutTaxAfterDeductionRD).toFixed(6);   
            priceConditionViewObj.RoyalDecree = (instType === 'Public Account' || instType === 'Region(s)' || instType === 'National') && priceConditionViewObj.RoyalDecreePercentage && priceConditionViewObj.RoyalDecreePercentage !== 0 ? 'Yes' : 'No';
            newNetPriceWithTaxAfterDeductionRD = priceConditionViewObj.RoyalDecree === "Yes"  ? newNetPriceWithoutTaxAfterDeductionRD * (1 + priceConditionViewObj.Tax) : newNetPriceWithoutTaxBeforeDeductionRD * (1 + priceConditionViewObj.Tax);
            priceConditionViewObj.AdditionalDiscount = additionalDiscount;
            priceConditionViewObj.NetPriceWithoutTaxAfterDeductionRD = Number(newNetPriceWithoutTaxAfterDeductionRD).toFixed(6);
            priceConditionViewObj.NetPriceWithTaxAfterDeductionRD = Number(newNetPriceWithTaxAfterDeductionRD.toFixed(6));

            this.calculateRoyalDecreeAppliesAndMainConditionPrice(); 
        },

        calculateNetPricesPVL: function (priceConditionObject){
            let oFastAppDataModel = Services.getFastAppDataModel();
            let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
            let packFactor =  oProductPrice.PACKFACTOR;
            let UOM = oProductPrice.UOM;
            let factor = UOM === 'Unit' ? packFactor : 1;
            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let modelPriceCondition = oFastAppDataModel.getProperty('/PriceConditionView')?.find(priceCondition => priceCondition.OfferID === priceConditionObject.OfferID && priceCondition.ProductCode === priceConditionObject.ProductCode && priceCondition.ConditionType === priceConditionObject.ConditionType);

            priceConditionObject.NetPriceWithoutTax = instType !== "Private Account"  ? priceConditionObject.YLAP / factor : priceConditionObject.PVL / factor;
            priceConditionObject.NetPriceWithTax = Number((priceConditionObject.NetPriceWithoutTax * (1 + priceConditionObject.Tax)).toFixed(2));
            modelPriceCondition.NetPriceWithoutTax = priceConditionObject.NetPriceWithoutTax;
            modelPriceCondition.NetPriceWithTax = priceConditionObject.NetPriceWithTax;
            
            oFastAppDataModel.updateBindings(true);

            return priceConditionObject;
        },
        
        onLiveChangeNetPricesDescuentoComercial: function(oEvent){

            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const priceConditionViewObj = bindingContext.getObject();

            let newDiscount;
            if (oEvent.getId() === "change"){
               newDiscount = Number(priceConditionViewObj.Discount) * 100;
            } else {
               newDiscount = Number(oEvent.getSource().getValue());

            }
            const discount = newDiscount;
            
            this.calculateNetPricesDescuentoComercial(priceConditionViewObj,discount);

            this.calculateRoyalDecreeAppliesAndMainConditionPrice();
            
            bindingContext.getModel().updateBindings();
        },

        calculateNetPricesDescuentoComercial: function (priceConditionViewObj,discount){

            
            /*const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const priceConditionViewObj = bindingContext.getObject(); */
           
            let newNetPriceWithoutTax = "";
            
          /*  let newDiscount;
            if (oEvent.getId() === "change"){
               newDiscount = Number(priceConditionViewObj.Discount) * 100;
            } else {
               newDiscount = Number(oEvent.getSource().getValue());

            }
            const discount = newDiscount; */
            let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let packFactor =  oProductPrice.PACKFACTOR;
            let UOM = oProductPrice.UOM;
            let correctPrice;
            if(instType === "Private Account"){
                if(UOM === "Unit"){
                    correctPrice = priceConditionViewObj.PVL / packFactor;
                } else {
                    correctPrice = priceConditionViewObj.PVL;
                }
            } else {
                if(UOM === "Unit"){
                    correctPrice = priceConditionViewObj.YLAP / packFactor;
                } else {
                    correctPrice = priceConditionViewObj.YLAP;
                }
            }

            if(priceConditionViewObj.RoyalDecree === "Yes"){
                newNetPriceWithoutTax = Number(correctPrice * (1 - priceConditionViewObj.RoyalDecreePercentage) * (1 - discount / 100)).toFixed(2);
                priceConditionViewObj.RoyalDecreeValue = Number(priceConditionViewObj.YLAP * (1 - discount / 100) * priceConditionViewObj.RoyalDecreePercentage).toFixed(2);            
            }else {
                newNetPriceWithoutTax = Number(correctPrice * (1 - discount / 100)).toFixed(2);
            }

            // set the calcualted field and update the bindings
            //priceConditionViewObj.RoyalDecreeValue = newNetPriceWithoutTax * priceConditionViewObj.RoyalDecreePercentage;
            priceConditionViewObj.RoyalDecree = (instType === 'Public Account' || instType === 'Region(s)' || instType === 'National') && priceConditionViewObj.RoyalDecreePercentage && priceConditionViewObj.RoyalDecreePercentage !== 0 ? 'Yes' : 'No';
            priceConditionViewObj.NetPriceWithoutTax = newNetPriceWithoutTax;
            priceConditionViewObj.NetPriceWithTax = Number((newNetPriceWithoutTax * (1 + priceConditionViewObj.Tax)).toFixed(2))

            //bindingContext.getModel().updateBindings();
        },

        calculateProfitability: async function(){
            if(Services.getFastAppDataModel().getProperty('/SelectedOffer')){
                Services.initializeConsolidatedProfitability();
                await this.calculateProductProfitability();
                await this.calculateConsolidatedProfitability();
            }
        },

        calculateProductProfitability: async function (){
            let oProductsTable = this.byId("idFinancialOfferViewProduct");
            let oBindingContext = oProductsTable.getBindingContext('fastAppData');
            let oFastAppDataModel = Services.getFastAppDataModel();
            let productProfitabilityData = [];
            let oProductConditionView = null;

            const aOfferProducts = oFastAppDataModel.getProperty('/SelectedOffer/Product/results');  //get all products from the model
            let aPricingView = oFastAppDataModel.getProperty('/PriceConditionView'); //get all price conditions from the model
                //aPriceConditionViews = aPriceConditionViews && aPriceConditionViews.filter(priceCondition => priceCondition.ExistingPriceConditionID != null); // we only need the active ones
            let aPriceConditionViews = await this.getPriceConditionViewAllProduts();    
            let aProductPricingView = oFastAppDataModel.getProperty('/ProductPricingView');
            const oSelectedOffer = oFastAppDataModel.getProperty('/SelectedOffer'); //get selected offer

            if(oSelectedOffer){
                if (aOfferProducts && aOfferProducts.length > 0){
                    productProfitabilityData = aOfferProducts.filter(oProduct => oProduct.ActiveProduct !== 2)?.map(product => {

                        if(aPriceConditionViews && aPriceConditionViews.length > 0){
                            oProductConditionView = aPriceConditionViews.filter(priceCondition => priceCondition.ProductCode === product.SKU.PRODUCTPACKID && priceCondition.ExistingPriceConditionID !== null && priceCondition.ConditionType !== 'FOC' && priceCondition.ConditionType !== 'Rappel')[0];
                        }

                        if((oSelectedOffer.Division !== 'Radiology' && oProductConditionView && oProductConditionView.ConditionType !== 'Rental') || (oSelectedOffer.Division === 'Radiology' && oProductConditionView && oProductConditionView.ConditionType !== 'Rental' && (product.SKU.ProductType !== 'Contrast Agent' && product.SKU.ProductType !== 'Consumable'))){
                            
                            /* Calculation A
                            Only applies for all price conditions, except for rental, having offer division different then Radiology */
                            let oPriceCondition; 
                            if(aProductPricingView && aProductPricingView.length > 0){
                                oPriceCondition = aProductPricingView.filter(priceCondition => priceCondition.ProductCode === product.SKU.PRODUCTPACKID)[0];
                            } 
                            
                            let sFOCType;
                            let sFOCBonus;
                            let netPrice = 0;

                            if(oPriceCondition){ 
                                let aFreeGoodsOther = aPricingView.filter(priceCondition => priceCondition.ConditionType === 'FOC' && priceCondition.ProductCode === product.SKU.PRODUCTPACKID)[0];
                                if(aFreeGoodsOther && aFreeGoodsOther.FreeGoodsOther && aFreeGoodsOther.FreeGoodsOther.length > 0){
                                    aFreeGoodsOther = aFreeGoodsOther.FreeGoodsOther.filter(freeGood => freeGood.ProductPackId === product.SKU.PRODUCTPACKID);
                                }

                                sFOCType = oPriceCondition.FOCType;
                                sFOCBonus = aFreeGoodsOther && aFreeGoodsOther.length > 0 ? +(aFreeGoodsOther[0].FOCBonus) : 0;
                                if (oProductConditionView.ConditionType === 'PVL'){
                                    let factor = oPriceCondition.UOM === 'Unit' ? oPriceCondition.PACKFACTOR : 1;
                                    netPrice = oProductConditionView.ConfidentialPrice ? (+oProductConditionView.ConfidentialPrice / factor) : (+oProductConditionView.PVL / factor);
                                } else {
                                    netPrice = oProductConditionView.NetPriceWithoutTaxAfterDeductionRD ? +oProductConditionView.NetPriceWithoutTaxAfterDeductionRD : +oProductConditionView.NetPriceWithoutTax;
                                }
                            }
                            let requestedVolume = product.RequestedVolume;
                            let cogs = product.Cogs ? product.Cogs.COGS : 0;
                            cogs = oPriceCondition.UOM === "Unit" ? cogs / oPriceCondition.PACKFACTOR : cogs;

                            let dPaidVolume = requestedVolume - ((sFOCType === 'FOC 1' ? sFOCBonus : 0));
                            let dTotalVolume = requestedVolume + ((sFOCType === 'FOC 2' ? sFOCBonus : 0));
                            let grossSales = netPrice * dPaidVolume;
                            let netPriceWithFoc = grossSales / dTotalVolume; //rounding
                            let grossProfit = grossSales - (cogs * dTotalVolume);
                            let grossMargin = grossSales ? (grossProfit / grossSales) : 0;

                            oPriceCondition.NetofferPrice = netPrice;
                            oPriceCondition.cogsUoM = cogs;
                            oPriceCondition.GrossSales = Number(grossSales);
                            oPriceCondition.NetPriceFOC = Number(netPriceWithFoc);
                            oPriceCondition.GrossProfit = Number(grossProfit);
                            oPriceCondition.GrossMargin = grossMargin;
                            oPriceCondition.Sales_NPV = grossSales;
                            oPriceCondition.Cost_NPV = Number(cogs);

                        } else if(oSelectedOffer.Division === 'Radiology' && oProductConditionView && oProductConditionView.ConditionType === 'Rental'){
                            /* Calculation B
                                Only applies for all RENTAL price conditions, and offer division equals Radiology */
                            let dCost_Yi = [];
                            let dSales_Yi = [];
                            let oPriceCondition = aProductPricingView && aProductPricingView.length > 0 ? aProductPricingView.filter(priceCondition => priceCondition.ProductCode === product.SKU.PRODUCTPACKID)[0] : null;                               
                            let dMonthlyRentPerUnit = oProductConditionView ? oProductConditionView.MonthlyRentPerUnit : 0;
                            let dAnnualValue = oProductConditionView ? oProductConditionView.AnnualValue : 0;
                            let dAnnualUnits = product.RequestedVolume;

                            let dStartMonth = Number(oSelectedOffer.ProfitabilityStartMnth);
                            let dDiscountRate = Number(oSelectedOffer.ProfitabilityDiscRate);
                            let dMaintenanceCost = Number(oSelectedOffer.ProfitabilityYrlyMntCost);
                            let dDurationAgreementYears = Number(oSelectedOffer.ProfitabilityAgrDur);
                            let cogs = product.Cogs ? product.Cogs.COGS : 0;
                            cogs = oPriceCondition.UOM === "Unit" ? cogs / oPriceCondition.PACKFACTOR : cogs;

                            let dCost_Y1 = cogs * (dAnnualUnits) * (12 - dStartMonth + 1) / (dDurationAgreementYears * 12) + dAnnualUnits * dMaintenanceCost * (12 - dStartMonth + 1) / 12;
                            let dSales_Y1 = (dAnnualValue / 12) * (12 - dStartMonth + 1);
                            
                            for(let i = 2; i <= dDurationAgreementYears; i++){
                                //should this return an array? 
                                dCost_Yi.push(cogs * dAnnualUnits / dDurationAgreementYears + dAnnualUnits * dMaintenanceCost);
                                dSales_Yi.push(dAnnualValue);
                            }
                            
                            let costY_lastyear = cogs * (dAnnualUnits) * (dStartMonth - 1) / (dDurationAgreementYears * 12) + dAnnualUnits * dMaintenanceCost * (dStartMonth - 1) / 12;
                            let salesY_lastyear = dAnnualValue / 12 * (dStartMonth - 1);
                        
                            let dCost_NPV = dCost_Y1;
                            let dSales_NPV = dSales_Y1;
                            
                            for(let i = 2; i <= (dDurationAgreementYears); i++){
                                dCost_NPV = dCost_NPV + dCost_Yi[i-2] / ((1 + dDiscountRate)**(i-1));
                                dSales_NPV = dSales_NPV + dSales_Yi[i-2] / ((1 + dDiscountRate)**(i-1));
                            }

                            let dCost_NPV_total = dCost_NPV + costY_lastyear / ((1 + dDiscountRate)**(dDurationAgreementYears));
                            let dSales_NPV_total = dSales_NPV + salesY_lastyear / ((1 + dDiscountRate)**(dDurationAgreementYears));
                        
                            let netOfferPrice = dMonthlyRentPerUnit;
                            let netPriceWithFoc = dMonthlyRentPerUnit;
                            let grossSales = dAnnualValue;
                            let grossProfit = dSales_NPV_total - dCost_NPV_total;
                            let grossMargin = dSales_NPV_total ? grossProfit / dSales_NPV_total : 0;

                            oPriceCondition.NetofferPrice = netOfferPrice;
                            oPriceCondition.cogsUoM = cogs;
                            oPriceCondition.GrossSales = Number(grossSales);
                            oPriceCondition.NetPriceFOC = Number(netPriceWithFoc);
                            oPriceCondition.GrossProfit = Number(grossProfit);
                            oPriceCondition.GrossMargin = grossMargin;
                            oPriceCondition.Sales_NPV = dSales_NPV;
                            oPriceCondition.Cost_NPV = dCost_NPV;

                        } else if(oSelectedOffer.Division === 'Radiology' && oProductConditionView && oProductConditionView.ConditionType !== 'Rental' && (product.SKU.ProductType === 'Contrast Agent' || product.SKU.ProductType === 'Consumable')) {
                        
                            /* Calculation C
                            Only applies for all price conditions, except for rental, and offer division equals Radiology */
                            let dUnits = [];
                            let netPrice = 0;

                            let oPriceCondition = aProductPricingView && aProductPricingView.length > 0 ? aProductPricingView.filter(priceCondition => priceCondition.ProductCode === product.SKU.PRODUCTPACKID)[0] : null;   
                            if (oProductConditionView.ConditionType === 'PVL'){
                                let factor = oPriceCondition.UOM === 'Unit' ? oPriceCondition.PACKFACTOR : 1;
                                netPrice = oProductConditionView.ConfidentialPrice ? (+oProductConditionView.ConfidentialPrice / factor) : (+oProductConditionView.PVL / factor);
                            } else {
                                netPrice = oProductConditionView.NetPriceWithoutTaxAfterDeductionRD ? +oProductConditionView.NetPriceWithoutTaxAfterDeductionRD : +oProductConditionView.NetPriceWithoutTax;
                            }
                            let dAnnualUnits = product.RequestedVolume;
                            let dAnnualValue = dAnnualUnits * netPrice;
                            let cogs = product.Cogs ? product.Cogs.COGS : 0;
                            cogs = oPriceCondition.UOM === "Unit" ? cogs / oPriceCondition.PACKFACTOR : cogs;
                            
                            let dStartMonth = Number(oSelectedOffer.ProfitabilityStartMnth);
                            let dDiscountRate = Number(oSelectedOffer.ProfitabilityDiscRate);
                            let dDurationAgreementYears = Number(oSelectedOffer.ProfitabilityAgrDur);
                            let dGrowthRate = Number(oSelectedOffer.ProfitabilityGrowthRate);

                            /* units per year */
                            dUnits.push(Math.round( (dAnnualUnits * (12 - dStartMonth + 1)) / 12 ));
                            dUnits.push(Math.round( dAnnualUnits * (1 + dGrowthRate) ));

                            for(let i = 3; i <= (dDurationAgreementYears); i++){
                                dUnits.push(Math.round( dUnits[i-2] * (1 + dGrowthRate) ));
                            }

                            dUnits.push(Math.round( dUnits[dDurationAgreementYears-1] * (1 + dGrowthRate) * (dStartMonth - 1) / (dDurationAgreementYears * 12) ));
                            /* end of units per year calculation */

                            let dCost_NPV = 0;
                            let dSales_NPV = 0;
                            
                            for(let i = 0; i <= (dDurationAgreementYears); i++){
                                dCost_NPV = dCost_NPV + dUnits[i] * cogs / ((1 + dDiscountRate )**i);
                                dSales_NPV = dSales_NPV + dUnits[i] * netPrice / ((1 + dDiscountRate )**i); 
                            }

                            let grossSales = dAnnualValue;
                            let grossProfit = dSales_NPV - dCost_NPV;
                            let grossMargin = dSales_NPV ? grossProfit / dSales_NPV : 0;

                            oPriceCondition.cogsUoM = cogs;
                            oPriceCondition.GrossSales = Number(grossSales);
                            oPriceCondition.NetofferPrice = netPrice;
                            oPriceCondition.NetPriceFOC = netPrice;
                            oPriceCondition.GrossProfit = Number(grossProfit);
                            oPriceCondition.GrossMargin = grossMargin;
                            oPriceCondition.Sales_NPV = dSales_NPV;
                            oPriceCondition.Cost_NPV = dCost_NPV;
                        }
                    });

                    Services.getFastAppDataModel().updateBindings();
                }
            }
        },

        calculateConsolidatedProfitability: async function(){
            const oFastAppDataModel          = Services.getFastAppDataModel();
            const aOfferProducts             = oFastAppDataModel.getProperty('/SelectedOffer/Product/results');  //get all products from the model
            const aProductPricingView        = oFastAppDataModel.getProperty('/ProductPricingView');
            const oConsolidatedProfitability = oFastAppDataModel.getProperty('/SelectedOffer/ConsolidatedProfitability');
            const oProductTypeProfitability  = oFastAppDataModel.getProperty('/ProductTypeProfitability');
            const oSelectedOffer             = oFastAppDataModel.getProperty('/SelectedOffer');

            if(oSelectedOffer){
                var oCalculatedResultTotals = { GrossMargin: 0,
                                                NetSales: 0,
                                                COGS: 0,
                                                Profitability: 0
                                            }

                if(oConsolidatedProfitability && oConsolidatedProfitability.length > 0){
                    oConsolidatedProfitability.map(consolidatedEntry => {
                        let oCalculatedResult = {};

                        if(consolidatedEntry.ProductType === 'Contrast Agents' || consolidatedEntry.ProductType === 'Consumables' || consolidatedEntry.ProductType === 'Injectors'){
                            //calculate contract agents, consumables & injectors
                            let aProductsPerType = aOfferProducts.filter(product => product.SKU.ProductType === consolidatedEntry.ProductType.slice(0, -1) && product.ActiveProduct !== 2);
                            oCalculatedResult = this.getCalculatedProfitability(aProductsPerType, aProductPricingView);
                        } else if(consolidatedEntry.ProductType !== 'Contrast Agents' && consolidatedEntry.ProductType !== 'Consumables' && consolidatedEntry.ProductType !== 'Injectors' && consolidatedEntry.ProductType !== 'Total'){
                            //calculate any other product type
                            let aProductsPerType = aOfferProducts.filter(product => (product.SKU.ProductType !== 'Contrast Agent' && product.SKU.ProductType !== 'Injector' && product.SKU.ProductType !== 'Total' && product.SKU.ProductType !== 'Consumable')  && product.ActiveProduct !== 2);
                            oCalculatedResult = this.getCalculatedProfitability(aProductsPerType, aProductPricingView);
                        } else if(consolidatedEntry.ProductType === 'Total'){
                            //calculate totals
                            oCalculatedResult.GrossMargin = oCalculatedResultTotals.GrossMargin;
                            oCalculatedResult.NetSales = oCalculatedResultTotals.NetSales;
                            oCalculatedResult.COGS = oCalculatedResultTotals.COGS;
                            oCalculatedResult.Profitability = oCalculatedResultTotals.GrossMargin / oCalculatedResultTotals.NetSales;
                        }

                        if(consolidatedEntry.ProductType !== 'Total'){
                            //keep track of actual totals
                            oCalculatedResultTotals.GrossMargin = (Number(oCalculatedResultTotals.GrossMargin) + Number(oCalculatedResult.GrossMargin));
                            oCalculatedResultTotals.NetSales = (Number(oCalculatedResultTotals.NetSales) + Number(oCalculatedResult.NetSales));
                            oCalculatedResultTotals.COGS = (Number(oCalculatedResultTotals.COGS) + Number(oCalculatedResult.COGS));
                            //oCalculatedResultTotals.Profitability = oCalculatedResultTotals.Profitability + oCalculatedResult.Profitability;
                            //oCalculatedResultTotals.Profitability = oCalculatedResultTotals.GrossMargin / oCalculatedResultTotals.NetSales;
                        }

                        if(oProductTypeProfitability && oProductTypeProfitability.length > 0){
                            consolidatedEntry.ID = oProductTypeProfitability.filter(dbProfitability => dbProfitability.ProductType === consolidatedEntry.ProductType)[0].ID; //get the effective ID from the db entity.
                        }
                        consolidatedEntry.GrossMargin = oCalculatedResult.GrossMargin;
                        consolidatedEntry.NetSales = oCalculatedResult.NetSales;
                        consolidatedEntry.COGS = oCalculatedResult.COGS;
                        consolidatedEntry.Profitability = oCalculatedResult.Profitability;
                    });

                    Services.getFastAppDataModel().updateBindings();
                }
            }
        },

        getCalculatedProfitability: function(aProductsPerType, aProductPricingView){
            //let oConsolidatedProfitability = {};

            let npv_grossmargin = 0;
            let npv_netsales = 0;
            let npv_cogs = 0;
            let profitability = 0;

            aProductsPerType.map(product => {
                let oProductPricing; 
                if(aProductPricingView && aProductPricingView.length > 0){
                    oProductPricing = aProductPricingView.filter(productPricing => productPricing.ProductCode === product.SKU.PRODUCTPACKID)[0];

                    npv_grossmargin = npv_grossmargin + oProductPricing.GrossProfit;
                    npv_netsales = npv_netsales + (oProductPricing.Sales_NPV ? oProductPricing.Sales_NPV : 0);
                    npv_cogs = npv_cogs + (oProductPricing.Cost_NPV ? oProductPricing.Cost_NPV : 0);

                }

                profitability = npv_netsales ? npv_grossmargin / npv_netsales : 0;
            });

            return {
                GrossMargin: Number(npv_grossmargin),
                NetSales: Number(npv_netsales),
                COGS: Number(npv_cogs),
                Profitability: Number(profitability)
            }
        },

        validateMaximumPrice: function(oEvent){

            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const priceConditionViewObj = bindingContext.getObject();
            const newMaximumPrice = Number(oEvent.getSource().getValue());

            // check that net price w/o tax incl royal decree is equal or lower than newMaximumPrice
            if(priceConditionViewObj.NetPriceWithoutTaxAfterDeductionRD > newMaximumPrice){
                oEvent.getSource().setValueState("Error");
                oEvent.getSource().setValueStateText("Maximum price must be higher than the net price w/o tax incl royal decree.");
                oEvent.getSource().openValueStateMessage();
            }else{
                oEvent.getSource().setValueState("None");
                oEvent.getSource().setValueStateText("");
                oEvent.getSource().closeValueStateMessage();
            }
        },

        onChangeDiscountRate: function(oEvent){
            let value = Number((oEvent.getSource().getValue())/100);
            Services.getFastAppDataModel().setProperty('/SelectedOffer/ProfitabilityDiscRate', value);
        },

        onChangeGrowthRate: function(oEvent){
            let value = Number((oEvent.getSource().getValue())/100);
            Services.getFastAppDataModel().setProperty('/SelectedOffer/ProfitabilityGrowthRate', value);
        },

        onVolumeTreshhold: function(oEvent){

            var oView = this.getView();

            // create dialog lazily
            if (!this.pDialog) {
                this.pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "FAST_NS0FAST0.view.fragments.priceConditions.VolumeTreshhold_ES",
                    controller: this
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    oDialog.setModel(Services.getFastAppDataModel(), "fastAppData");
                    return oDialog;
                });
            }

            this.pDialog.then(function (oDialog) {
                const bindingPaths = this.getBindingPathsDiscountCondition();
                const oTable = this.byId("idVolumeTreshold");
                const priceCondition = Services.getFastAppDataModel().getProperty(bindingPaths.root);
                const existingDiscountCondition = Services.getFastAppDataModel().getProperty(bindingPaths.dc);
                let discountConditions = existingDiscountCondition && JSON.parse(JSON.stringify(existingDiscountCondition)) || [];

                if(discountConditions && discountConditions.length > 0){
                    discountConditions.map((condition) => {
                        if(!condition.Tax){
                            condition.Tax = priceCondition.Tax;
                        }

                        return condition;
                    });
                }
                Services.getFastAppDataModel().setProperty(`${bindingPaths.dc}Temp`, discountConditions);
                oTable.bindElement({ path: bindingPaths.root, model: "fastAppData" });
                oDialog.open();
            }.bind(this));

        },

        onAddNewDiscountCondition: function(oEvent){

            const bindingPath = this.byId("idVolumeTreshold").getElementBinding("fastAppData").sPath;
            const priceConditions = Services.getFastAppDataModel().getProperty(bindingPath);
            const discountConditions = Services.getFastAppDataModel().getProperty(bindingPath.concat("/DiscountConditionsTemp")) || [];

            
            discountConditions.push({
                Volume: "",
                Discount: "",
                Tax: priceConditions.Tax,
                NetPriceWithoutTax: "",
                NetPriceWithTax: "",
            });

            Services.getFastAppDataModel().setProperty(bindingPath.concat("/DiscountConditionsTemp"), discountConditions);

        },
        onSortDiscountCondition:function(){
            var view = this.getView();
			if (!this.volumeTreshholdSortingDialog) {
				this.volumeTreshholdSortingDialog = Fragment.load({
					id: this.getView().getId(),
					name: "FAST_NS0FAST0.view.fragments.priceConditions.VolumeTreshholdSorting",
					controller: this
				}).then(function (dialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    view.addDependent(dialog);
                    dialog.setModel(Services.getFastAppDataModel(), "fastAppData");
                    return dialog;
				});
			}
            this.volumeTreshholdSortingDialog.then(function(dialog){
                dialog.open();
            });
        },
        handleSortDialogDiscountConditionConfirm:function(event){
			const table = this.byId("idVolumeTreshold"),
				params = event.getParameters(),
				binding = table.getBinding("items"),
				sorters = [];

			const path = params.sortItem.getKey();
			const descending = params.sortDescending;
			sorters.push(new Sorter(path, descending,false,function(a,b){
                a = parseFloat(a);
                b = parseFloat(b);
                if( a < b ) return -1;
                if( a > b ) return 1;
                return -1;
            }));

			binding.sort(sorters);
        },
        onDeleteDiscountCondition: function(oEvent){

            const path = oEvent.getSource().getParent().getBindingContext("fastAppData").getPath();
            const bindingPath = path.slice(0, path.length - 2);
            const objIndex = path.slice(path.length - 1);
            const priceConditionViewObj = Services.getFastAppDataModel().getProperty(bindingPath);
            priceConditionViewObj.splice(objIndex, 1);

            Services.getFastAppDataModel().updateBindings();

        },

        calculateNetPricesRappel: function(oEvent){

            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const rappelIndex = priceConditions.findIndex(item => item.ConditionType === "Rappel");
            const bindingPath = "/PriceConditionView/".concat(rappelIndex);
            const priceConditionViewObj = Services.getFastAppDataModel().getProperty(bindingPath);

            const discount = Number(oEvent.getSource().getValue());
            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const discountConditionObj = bindingContext.getObject();

            let netPriceWithoutTax = "";
            let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let packFactor =  oProductPrice.PACKFACTOR;
            let UOM = oProductPrice.UOM;
            let correctPrice;
            if(instType === "Private Account"){
                if(UOM === "Unit"){
                    correctPrice = priceConditionViewObj.PVL / packFactor;
                } else {
                    correctPrice = priceConditionViewObj.PVL;
                }
            } else {
                if(UOM === "Unit"){
                    correctPrice = priceConditionViewObj.YLAP / packFactor;
                } else {
                    correctPrice = priceConditionViewObj.YLAP;
                }
            }

           /* if(priceConditionViewObj.RoyalDecree === "Yes"){
                netPriceWithoutTax = correctPrice * (1 - priceConditionViewObj.RoyalDecreePercentage) * (1 - discount / 100);
            }else {
                netPriceWithoutTax = correctPrice * (1 - discount / 100)
            } */


            // set the calcualted field and update the bindings
            discountConditionObj.NetPriceWithoutTax = Number(priceConditionViewObj.MainPrice * (1 - discount / 100)).toFixed(2);
            discountConditionObj.NetPriceWithTax = Number(discountConditionObj.NetPriceWithoutTax * (1 + priceConditionViewObj.Tax)).toFixed(2);
            /*discountConditionObj.NetPriceWithoutTax = netPriceWithoutTax;
            discountConditionObj.NetPriceWithTax = netPriceWithoutTax * (1 + priceConditionViewObj.Tax);*/

            bindingContext.getModel().updateBindings();

        },
        getBindingPathsDiscountCondition:function(){
            const priceConditionView = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const rappelIndex = priceConditionView.findIndex(item => item.ConditionType === "Rappel");
            const bindingPath = "/PriceConditionView/".concat(rappelIndex);
            const bindingPathDC = `${bindingPath}/DiscountConditions`;
            return {
                root:bindingPath,
                dc:bindingPathDC
            };
        },
        onApplyDiscountCondition: function(){
            const bindingPaths = this.getBindingPathsDiscountCondition();
            const discountConditionsTemp = JSON.parse(JSON.stringify(Services.getFastAppDataModel().getProperty(`${bindingPaths.dc}Temp`)));
            Services.getFastAppDataModel().setProperty(`${bindingPaths.dc}`, discountConditionsTemp);
            this.onCancelDiscountCondition();
        },
        onCancelDiscountCondition:function(){
            if(this.pDialog) this.pDialog.then(dialog => dialog.close());
        },


        /** Free goods other event handlers */
        onOpenProducts: function () {

			var oView = this.getView();
            
            //store original freegoodsother for cancellation
            const oFastAppDataModel = Services.getFastAppDataModel();
			const priceConditions = oFastAppDataModel.getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const bindingPath = "/PriceConditionView/".concat(focIndex);
            const aCurrentFreeGoods = oFastAppDataModel.getProperty(bindingPath + '/FreeGoodsOther');
            this._aCurrentFreeGoodsTemp = aCurrentFreeGoods?.map(freeGood => {
                return Object.create(freeGood);
            });

			// create dialog lazily
			if (!this.pDialogFoc) {
				this.pDialogFoc = Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.OtherProducts_ES",
					controller: this
				}).then(function (oDialogFoc) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialogFoc);
					oDialogFoc.setModel(Services.getFastAppDataModel(), "fastAppData");
					return oDialogFoc;
				});
			}

			this.pDialogFoc.then(function (oDialogFoc) {
                const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
                const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
                const bindingPath = "/PriceConditionView/".concat(focIndex);
                const oTable = this.byId("FreeGoodsOtherTable");
                
                oTable.bindElement({ path: bindingPath, model: "fastAppData"});
				//this.byId("FreeGoodsOtherTable").setBindingContext(this.byId("FinPricingOfferSubsection").getBindingContext("fastAppData"), "fastAppData");
				oDialogFoc.open();
			}.bind(this));


		},
        
		onAddNewFreeGoods: function (event) {
            const oFastAppDataModel = Services.getFastAppDataModel();
			const priceConditions = oFastAppDataModel.getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const bindingPath = "/PriceConditionView/".concat(focIndex);
            
			let selectedProductPrice = oFastAppDataModel.getProperty(bindingPath);
			let freeGoodsOther = oFastAppDataModel.getProperty(bindingPath + "/FreeGoodsOther") || [];
			freeGoodsOther.push({
				ProductPackId: "",
				FreeGoodsOther: "",
				FreeGoodsOther_ABS_PCT: "",
				FreeGoodsOther_Step: "",
                RoyalDecree: "",
                FOCMinAmount: 0,
                FOCBonus: 0,
                PotentialGeneratedSavings: 0
			});
			oFastAppDataModel.setProperty(bindingPath + "/FreeGoodsOther", freeGoodsOther);
            
            const oFreeGoodsOtherTable = this.byId("FreeGoodsOtherTable");
            const vBox = this.byId("idFOCVbox");
            oFreeGoodsOtherTable.bindElement({ path: bindingPath, model: "fastAppData" });
            vBox.bindElement({ path: bindingPath, model: "fastAppData" });
            
            oFastAppDataModel.updateBindings();            
		},

		onDeleteFreeGoodsOther: function (event) {
           
            const oFastAppDataModel = Services.getFastAppDataModel();
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const focBindingPath = "/PriceConditionView/".concat(focIndex) + '/FreeGoodsOther';
            const productPackId = event.getSource().getBindingContext("fastAppData").getProperty("ProductPackId");

            let aFreeGoodsOther = oFastAppDataModel.getProperty(focBindingPath);

			oFastAppDataModel.setProperty(focBindingPath, aFreeGoodsOther.filter(freeGoods => freeGoods.ProductPackId !== productPackId));
		},

		/*onProductPackChange: function (event) {
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
		},*/
        
		oApplyProducts: function () {
			const oFastAppDataModel = Services.getFastAppDataModel();
			const priceConditions = oFastAppDataModel.getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const sPath = "/PriceConditionView/".concat(focIndex) + "/FreeGoodsOther";

			let freeGoodsOther = oFastAppDataModel.getProperty(sPath);
			freeGoodsOther = (freeGoodsOther && freeGoodsOther.map(freeGoods => {
				freeGoods.FreeGoodsOtherFOCMinAmountValueState = "None";
                freeGoods.FOCBonusValueState = "None";

				if (!freeGoods.FOCMinAmount || freeGoods.FOCMinAmount === "" || freeGoods.FOCMinAmount === 0) {
					freeGoods.ProductPackIdValueState = "Error";
				}

                if (!freeGoods.FOCBonus || freeGoods.FOCBonus === "" || freeGoods.FOCBonus === 0) {
					freeGoods.ProductPackIdValueState = "Error";
				}

				return freeGoods;
			}))||[];
			oFastAppDataModel.setProperty(sPath, freeGoodsOther);
			const foundError = freeGoodsOther.find(freeGoods => freeGoods.FreeGoodsOtherFOCMinAmountValueState === "Error" || freeGoods.FOCBonusValueState === "Error");
			if (!foundError) this.byId("OtherProducts").close();
		},

        oCancelProducts: function () {
            const oFastAppDataModel = Services.getFastAppDataModel();
			const priceConditions = oFastAppDataModel.getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const bindingPath = "/PriceConditionView/".concat(focIndex);
            oFastAppDataModel.setProperty(bindingPath + '/FreeGoodsOther', this._aCurrentFreeGoodsTemp);
            
            if(this.pDialogFoc){

                this.pDialogFoc.then(pDialog => pDialog.close());
            }
                
        },

        handleValueHelp: function(oEvent){ 

            this._focIndex = (oEvent.getSource().getId()).split("-").pop();

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


		_handleValueHelpClose: async function (oEvent) {
			const oFastAppData = Services.getFastAppDataModel();
            const oTable = this.getView().byId("FreeGoodsOtherTable");
			const priceConditions = oFastAppData.getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const sPath = "/PriceConditionView/".concat(focIndex) + "/FreeGoodsOther";
            
			var oFreeGoodsOther = oFastAppData.getProperty(sPath + "/" + this._focIndex);
			var oSelectedItem = oEvent.getParameter("selectedItem");

            // add PVL, ConfidentialPrice and RoyalDecreePercentage to the selected FOC product
            // sets isSameAsMainProduct to true if FOC product and main product are the same
			if (oSelectedItem) {
                oTable.setBusy(true);
                const selectedProduct = oSelectedItem.getBindingContext('fastAppData').getObject();
                let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
                const royalDecree =  (await this.getRoyalDecree(selectedProduct.PRODUCT_ID))?.data?.results?.[0];
				var oInputfield = this.byId('idOtherProducts');
				oInputfield.setValue(oSelectedItem.getTitle());
				oFreeGoodsOther.ProductPackId = selectedProduct.PRODUCT_ID;
				oFreeGoodsOther.ProductName = oSelectedItem.getTitle();
                oFreeGoodsOther.RoyalDecree = this.getFOCRoyalDecreeValue(royalDecree?.Percentage);
                const oMostRecentMasterPrice = (await this.getMostRecentMasterPrices(selectedProduct.COUNTRY_CODE, selectedProduct.PRODUCT_ID))?.data?.results?.[0];
                if(!oMostRecentMasterPrice){
                    sap.m.MessageBox.error(`No MasterPrice was found for product: ${selectedProduct.PRODUCT_ID}. \nPlease contact the service desk.`);
                    oTable.setBusy(false);
                }
                oFreeGoodsOther.PVL = oMostRecentMasterPrice.YLLP;
                oFreeGoodsOther.ConfidentialPrice = oMostRecentMasterPrice.YLAP;
                oFreeGoodsOther.isSameAsMainProduct = Services.getSelectedProductID() === oFreeGoodsOther.ProductPackId;
                oFreeGoodsOther.RoyalDecreePercentage = royalDecree?.Percentage;
                oFreeGoodsOther.packFactor = selectedProduct.PACKFACTOR;
                oFreeGoodsOther.UOM = oProductPrice.UOM;
                oFreeGoodsOther.FOCMinAmount = 0;
                oFreeGoodsOther.FOCBonus = 0;
                oFreeGoodsOther.PotentialGeneratedSavings = 0;
				oFastAppData.setProperty(sPath, oFastAppData.getProperty(sPath));
                oTable.setBusy(false);
			}
			// oEvent.getSource().getBinding("items").filter([]); // TODO: check with Joris why this code was needed ?
		},

        /**
         * Calculate the value of the FOC Royal Decree based on specific logic
         * @returns {String} Yes/No
         */
        getFOCRoyalDecreeValue: function(royalDecreePercentage){
            const instituteType = Services.getLoadedTender().Institute.InstituteType;
            if(instituteType === "Private Account" || instituteType === "Cluster") return "No";
            if(instituteType === "Public Account" || instituteType === "Region(s)" || instituteType === "National"){
                if(royalDecreePercentage) return "Yes";
                else return "No";
            }
        },

        
        getRoyalDecree: async function(productPackID){
            return Services.getService("PriceCondition").getRoyalDecree(productPackID);
        },

        getMostRecentMasterPrices: async function(countryCode, productPackID){
            return Services.getService("PriceCondition").getMostRecentMasterPrices(countryCode, productPackID);
        },
            

        /*Calculations*/
        calculatePotentialSavings: function(oEvent){
            // user inserted bonus amount
            const bonusAmount = Number(oEvent.getSource().getValue());

            // selected FOC record that contains MasterPrice info
            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const freeGoodsObject = bindingContext.getObject();

            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            //let packFactor =  this.getView().getModel('fastAppData').getData().ProductPricingView[0].PACKFACTOR;
            let packFactor = freeGoodsObject.packFactor;        
            let UOM = this.getView().getModel('fastAppData').getData().ProductPricingView[0].UOM;
            const privateCustomer = instType === "Private Account" || instType === "Cluster";
            const publicCustomer = instType === "Public Account" || instType === "Region(s)" || instType === "National";
            let mainConditionPrice = this.getMainConditionPrice(freeGoodsObject);

            // calculate potential savings
            let potentialSaving = "";
            if(freeGoodsObject.isSameAsMainProduct){
                potentialSaving = bonusAmount * mainConditionPrice;  
            }else {
                let correctedPVL;
                let correctedConfidentialPrice;                
                if(UOM === "Unit"){
                    correctedPVL = freeGoodsObject.PVL / packFactor;
                    correctedConfidentialPrice = freeGoodsObject.ConfidentialPrice / packFactor;
                } else {
                    correctedPVL = freeGoodsObject.PVL;
                    correctedConfidentialPrice = freeGoodsObject.ConfidentialPrice;
                }
                if(privateCustomer){
                    potentialSaving = correctedPVL * bonusAmount;
                }  
                if(publicCustomer){
                    if(freeGoodsObject.RoyalDecree === "Yes") potentialSaving = correctedConfidentialPrice * (1 - freeGoodsObject.RoyalDecreePercentage) * bonusAmount;
                    else potentialSaving = correctedConfidentialPrice * bonusAmount;
                }  
            }

            freeGoodsObject.PotentialGeneratedSavings = Number(potentialSaving).toFixed(2); 
            bindingContext.getModel().updateBindings();           
        },

        getMainConditionPrice(selectedFOCObject){
            const sSelectedMainPriceCondition = this.getView().byId('idPriceConditionSelect').getSelectedItem().getText();
            const priceConditionViewObjects = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const index = priceConditionViewObjects.findIndex(item => item.ConditionType === sSelectedMainPriceCondition);
            const mainPriceConditionViewObject = Services.getFastAppDataModel().getProperty("/PriceConditionView/".concat(index));
            if(mainPriceConditionViewObject.ConditionType === "Descuento Especial") return 0;
            if(mainPriceConditionViewObject.ConditionType === "Precio Neto"){
                // if(selectedFOCObject.RoyalDecree === "No")
                //     return mainPriceConditionViewObject.NetPriceWithoutTax;
                // else 
                    return mainPriceConditionViewObject.NetPriceWithoutTaxAfterDeductionRD;
            }
            if(mainPriceConditionViewObject.ConditionType === "Descuento Comercial") return mainPriceConditionViewObject.NetPriceWithoutTax;
            if(mainPriceConditionViewObject.ConditionType === "Rental" || mainPriceConditionViewObject.ConditionType === "PVL"){
                if(selectedFOCObject.RoyalDecree === "No")
                    return mainPriceConditionViewObject.PVL;
                else 
                    return mainPriceConditionViewObject.ConfidentialPrice * (1 - mainPriceConditionViewObject.RoyalDecreePercentage);
            }
        },
        
        onMonthlyRentPerUnitChange: function(oEvent){
            this.calculateAnnualValue(oEvent);
        },

        calculateAnnualValue: function(oEvent){
            const monthlyRent = oEvent.getParameter("newValue");
            const selectedPriceCondition = Services.getFastAppDataModel().getProperty(Services.getSelectedPriceConditionPath());
            const reqestedVolume = selectedPriceCondition.RequestedVolume;
            // Annual Values = (Monthly Rent x 12) x (RequestedVolume)
            selectedPriceCondition.AnnualValue = (monthlyRent * 12) * reqestedVolume;
            Services.getFastAppDataModel().updateBindings();
        },
        onSwitchChanged:function(event,switchName){
            const rappelIndex = Services.getFastAppDataModel().getProperty("/PriceConditionView").findIndex(item => item.ConditionType === switchName);
            const isRequired = Services.getFastAppDataModel().getProperty(`/${switchName}Required`);
            Services.getFastAppDataModel().setProperty(`/${switchName}Expanded`, isRequired);
            if(!isRequired && switchName === 'Rappel'){
                
                Services.getFastAppDataModel().setProperty(`/PriceConditionView/${rappelIndex}/RoyalDecree`,"");
                Services.getFastAppDataModel().setProperty(`/PriceConditionView/${rappelIndex}/Liquidation`,"");
                Services.getFastAppDataModel().setProperty(`/PriceConditionView/${rappelIndex}/Settlement_ID`,"");
                Services.getFastAppDataModel().setProperty(`/PriceConditionView/${rappelIndex}/RefundDate`,null);
                Services.getFastAppDataModel().setProperty(`/PriceConditionView/${rappelIndex}/DiscountConditions`,[]);
            }


            if(isRequired && switchName === 'Rappel') this.calculateRoyalDecreeAppliesAndMainConditionPrice();
            // if(isRequired && switchName === 'Rappel'){ 

            //     // const oFastAppDataModel = Services.getFastAppDataModel();
            //     // const priceConditionView = oFastAppDataModel.getProperty("/PriceConditionView");
            //     // const mainPriceCondition = priceConditionView.find(i => i.isMain && i.ExistingPriceConditionID);
            //     // const rappelPriceCondition = priceConditionView.find(item => item.ConditionType === switchName);

            //     // if(mainPriceCondition.ConditionType === "Precio Neto")
            //     // {
            //     //     rappelPriceCondition.MainPrice = mainPriceCondition.RoyalDecree === "Yes" ?  mainPriceCondition.NetPriceWithoutTaxAfterDeductionRD : mainPriceCondition.NetPriceWithoutTax;
            //     // }

            //     // if(mainPriceCondition.ConditionType === "Descuento Comercial")
            //     // {
            //     //     rappelPriceCondition.MainPrice = mainPriceCondition.NetPriceWithoutTax;
            //     // }

            //     // if(mainPriceCondition.ConditionType === "Descuento Especial")
            //     // {
            //     //     rappelPriceCondition.MainPrice = 0;
            //     // }

            //     // if(mainPriceCondition.ConditionType === "Rental" || mainPriceCondition.ConditionType === "PVL")
            //     // {
            //     //     rappelPriceCondition.MainPrice = mainPriceCondition.RoyalDecree === "Yes" ? mainPriceCondition.ConfidentialPrice * (1 - mainPriceCondition.RoyalDecree) : mainPriceCondition.PVL;                 
            //     // }

            //     // oFastAppDataModel.updateBindings();
            // }         
            if(!isRequired && switchName === 'FOC'){
                Services.getFastAppDataModel().setProperty(`/PriceConditionView/${rappelIndex}/FreeGoodsOther`,[]);
            }
        }

        
    });
});