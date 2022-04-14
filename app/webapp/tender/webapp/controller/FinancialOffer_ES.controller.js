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
    "sap/ui/core/BusyIndicator",
], function (Controller, formatter, Services, UserInfo, MomentJS, Financial, Fragment, PercentageType, Filter, FilterOperator, BusyIndicator) {
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
            Services.getFastAppDataModel().setProperty("/ExistingAgreementInPlace", false);

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

                BusyIndicator.show();
                // this.getView().setBusyIndicatorDelay(0);

                await this.getCountryBrandProductsCombined();
                await this.getProductTypeProfitability(Services.getSelectedOfferID(), Services.getSelectedCountry());

				this.onBindingItemsFinished(oEvent, true); //TODO: check w/ Wouter if there's a more proper solution to do this, and why this method is not executed every time on view load
                
                // initialize ConsolidatedProfitability
                Services.initializeConsolidatedProfitability();
                
                // get PriceConditionClassification
                const priceConditionClassification = await this.getPriceConditionClassification();
                // add empty item
                priceConditionClassification.push({
                    "ID": "99999999-9999-9999-9999-999999999999",
                    "ConditionType": "",
                    "isMain": true
                });
                Services.getFastAppDataModel().setProperty("/PriceConditionClassification", priceConditionClassification);

                // get price conditions
                const priceConditionViews = await this.getPriceConditionView();
                Services.getFastAppDataModel().setProperty("/PriceConditionView", priceConditionViews);

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
                

                //bind Rappel and FOC fragments 
                const rappelBindingPath = this.bindRappelFragment();
                const focBindingPath = this.bindFocFragment();

                // add DiscountCondition
                await this.addDiscountConditions(rappelBindingPath);
                await this.addFOCs(focBindingPath);

                // set selected key on idPriceConditionSelect
                const existingMainPriceCondition = priceConditionViews.find(item => item.isMain && item.ExistingPriceConditionID);
                if(existingMainPriceCondition){
                    this.byId("idPriceConditionSelect").setSelectedKey(existingMainPriceCondition.PriceConditionClassificationID);
                    // remove the dummy reference set in copyAndSetApplicableTenderConditionValues
                    existingMainPriceCondition.ExistingPriceConditionID = null; 
                }else{
                    this.byId("idPriceConditionSelect").setSelectedKey("99999999-9999-9999-9999-999999999999");
                }

                // load main fragment if main condition already exists
                const existingMainPriceConditionType = existingMainPriceCondition ? existingMainPriceCondition.ConditionType : "";
                this.loadMainPriceConditionFragment(existingMainPriceConditionType);

                this.calculateProfitability();

                BusyIndicator.hide();
			}

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
            applicablePriceConditionView.StandardDiscount = applicableTenderCondition.StandardDiscount;
            applicablePriceConditionView.Tax = applicableTenderCondition.Tax;
            const classification = Services.getFastAppDataModel().getProperty("/PriceConditionClassification")?.find(classification => classification.ConditionType === applicablePriceConditionView.ConditionType);
            applicablePriceConditionView.PriceConditionClassificationID = classification.ID;
            applicablePriceConditionView.ExistingPriceConditionID = "99999999-9999-9999-9999-999999999999"; // set dummy reference needed for the UI flow
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
            const rappelBindingPath = "/PriceConditionView/".concat(rappelIndex);
            const rappelvBox = this.byId("idRappelVbox");
            rappelvBox.bindElement({ path: rappelBindingPath, model: "fastAppData" });

            return rappelBindingPath;
        },

        /**
         * This method  sets the element binding of the FOC fragment
         * @returns {String} - Binding path of the Rappel price condition
         */
        bindFocFragment: function(){
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const focBindingPath = "/PriceConditionView/".concat(focIndex);
            const focVbox = this.byId("idFOCVbox");
            focVbox.bindElement({ path: focBindingPath, model: "fastAppData" });

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
                const focs = (await Services.getService("PriceCondition").getFocs({
                    PriceConditionID: focPriceCondition.ExistingPriceConditionID
                })).data.results;
                Services.getFastAppDataModel().setProperty(focBindingPath.concat("/FreeGoodsOther"), focs);
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

        getCountryBrandFOCsCombined: async function(){
            
            const oFastAppDataModel = Services.getFastAppDataModel();
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const focBindingPath = "/PriceConditionView/".concat(focIndex) + '/FreeGoodsOther';
            let aFreeGoodsOther = oFastAppDataModel.getProperty(focBindingPath);

			//load countryBrandProducts
			let aCountryBrandProducts = await this.getCountryBrandProducts(Services.getSelectedCountry());
            if(aFreeGoodsOther && aFreeGoodsOther.length > 0){
                aFreeGoodsOther = aFreeGoodsOther.map(freegood => {
                    var countryBrandProduct = aCountryBrandProducts.find(countryBrandProduct => countryBrandProduct.PRODUCT_ID === freegood.ProductPackId);
                    freegood.ProductName = countryBrandProduct.PRODUCT_NAME;
                    return freegood;
                });

                if(aFreeGoodsOther.length > 0){
                    aFreeGoodsOther = aFreeGoodsOther.map(freegood => {
                        var countryBrandProduct = aCountryBrandProducts.find(countryBrandProduct => countryBrandProduct.PRODUCT_ID === freegood.ProductPackId);
                        freegood.ProductName = countryBrandProduct.PRODUCT_NAME;
                        return freegood;
                    });

                    //set to fastappdata model for easy access on the view
                    aFreeGoodsOther.sort((a, b) => (a.SORTER > b.SORTER) ? 1 : -1)
                    oFastAppDataModel.setProperty(focBindingPath, aFreeGoodsOther);

                    return aFreeGoodsOther;
                } else {
                    return null;
                }
            }
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
            await this.getProductTypeProfitability(Services.getSelectedOfferID(), Services.getSelectedCountry());
			this.setFinancialOffer();
            this.calculateProfitability();
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

        getProductTypeProfitability: async function (sOfferId, sCountryCode){
            const oFastAppDataModel = Services.getFastAppDataModel();

            if (sOfferId, sCountryCode) {
				const response = await Services.getProductTypeProfitability(sOfferId, sCountryCode);
                oFastAppDataModel.setProperty("/ProductTypeProfitability");
				return response.data.results;
			}
        },

        getPriceConditionClassification: async function(){

            const oFastAppDataModel = Services.getFastAppDataModel();
            const offer = oFastAppDataModel.getProperty("/SelectedOffer");
            const selectedProduct = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(),Services.getSelectedProductID());
            const productType = selectedProduct?.SKU?.ProductType;
            const filter = {
                "CountryCode": offer.CountryCode,
                "Classification": offer.Tender.Classification,
                "Division": offer.Division,
                "ProductTypes": ["All"]
                // "isMain": true
            };

            if(productType === "Injector"){
                filter.ProductTypes.push(productType);
            }

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

		// _checkApprovalEnabled: function (){
		// 	let sOfferID = Services.getSelectedOfferID();
		// 	var oOffer = Services.getLoadedOffer(sOfferID);
		// 	var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);

		// 	if (oOffer.Active !== 1 || oOffer.ActiveOffer !== 1) {
		// 		bEnableApproval = false;
		// 	}

		// 	this.byId("ApprovalButtonId").setEnabled(bEnableApproval);

		// },

		/**
		 * Save financial offer for Italy
		 * @param {*} oEvent 
		 */
		onSaveFinancialOfferSpain: async function (oEvent) {

            BusyIndicator.show();
            
            const selectedPriceConditionViewObjects = this.getSelectedPriceConditionViewObjects();
            const aErroneousConditions = this.checkSaveFinancialOfferSpain(selectedPriceConditionViewObjects);   
            if(aErroneousConditions && (aErroneousConditions.length > 0)) {
                BusyIndicator.hide();                
                this.byId("ApprovalButtonId").setEnabled(false);
                sap.m.MessageBox.error(`You must fill in all the mandatory fields for the following condition(s): \n\n ${aErroneousConditions.join()}`);
                return;
            } 

            else {            
                const savePriceConditionPromises = selectedPriceConditionViewObjects.map(priceConditionViewObj => {
                    const priceConditionSaveObject = Services.getService("PriceCondition").convertToSaveObject(priceConditionViewObj);
                    return Services.getService("PriceCondition").upsertPriceCondition(priceConditionSaveObject);
                });

                await Promise.all(savePriceConditionPromises);

                                // Additional saving to PT_TMBDPR. The tender flow should keep working. 
                // Thats why we need to store the basic price structure not only in the new tables but also in the PT_TMBDPR table
                await this.savePricesToTMBDPR();

                //switch from edit to display
                this._DetailController.onEditToggleButtonPress();

                //show success message
                Services.getOfferCompositeMessages().push({
                    type: 'Success',
                    title: 'Financial Offer Saved Successfully',
                    description: 'Financial Offer Saved Successfully'
                });

                Services.showMessageCompositeView("Offer Saved", Services.getOfferCompositeMessages(), 'Success');
                Services.getOfferCompositeMessages().splice(0, Services.getOfferCompositeMessages().length);


                //refresh tenders master table (left pane)
                const sTenderID = selectedPriceConditionViewObjects[0].TenderID;
                Services.refreshTendersMasterTable(sTenderID);

                //update approvals sent to 0 (to indicate that a change has been made to the offer data, so approvals need to be send again)
                let sOfferID = Services.getSelectedOfferID();
                var oOffer = Services.getLoadedOffer(sOfferID);
                const iApprovals_sent = oOffer.APPROVALS_SENT; //offerInfo.APPROVALS_SENT;
                Services.saveOfferApprovalSent(iApprovals_sent).catch(function (oError) {
                    //Error during save
                    Services.showErrorMessage(oError, "Background saving for approvals sent field");
                });

                // enable approval button
                this.byId("ApprovalButtonId").setEnabled(true);

                //refresh data (for table)
                this.refreshFinancialTabES();

                let calculatedConsolidatedProfitability = this.getConsolidatedProfitability();
                const saveProductProfitabilityPromises = calculatedConsolidatedProfitability.map(consolidatedProfitabilityObj => {
                    return Services.getService("Offer").upsertProductTypeProfitability(consolidatedProfitabilityObj);
                });

                await Promise.all(saveProductProfitabilityPromises);

                BusyIndicator.hide();
            } 
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
            let packFactor =  this.getView().getModel('fastAppData').getData().ProductPricingView[0].PACKFACTOR;
            let UOM = this.getView().getModel('fastAppData').getData().ProductPricingView[0].UOM;
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
				PRICE_UPDATE: 0
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
            var aErroneousCondition = [];            

            for(let i = 0; i < oPriceConditions.length; i++){            
                if(oPriceConditions[i].ConditionType === "Precio Neto") {
                    if(!oPriceConditions[i].RoyalDecree || !oPriceConditions[i].NetPriceWithoutTaxAfterDeductionRD || !oPriceConditions[i].MaximumPrice){
                        aErroneousCondition.push(oPriceConditions[i].ConditionType);
                    }
                } else if(oPriceConditions[i].ConditionType === "Descuento Comercial"){
                    if(!oPriceConditions[i].RoyalDecree){
                        aErroneousCondition.push(oPriceConditions[i].ConditionType);
                    }
                } else if(oPriceConditions[i].ConditionType === "Descuento Especial"){
                    //no explicit checks needed
                } else if(oPriceConditions[i].ConditionType === "Rappel"){
                    // if(!oPriceConditions[i].RoyalDecree || !oPriceConditions[i].Liquidation || !oPriceConditions[i].onVolumeTreshhold || !oPriceConditions[i].Discount || !oPriceConditions[i].ReturnDate){
                    //     aErroneousCondition.push(oPriceConditions[i].ConditionType);
                    // } // TODO: check the requirements 
                } else if(oPriceConditions[i].ConditionType === "FOC"){
                    //no explicit checks needed
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
                        //that.onFinancialProductPress(oEvent, true);
                        this.selectedProductPricePath = Services.getSelectedProductPath();
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

            await this.getCountryBrandFOCsCombined();            

        },

        onPriceConditionChange: function(oEvent){
            const sConditionType = oEvent.getSource().getSelectedItem().getText();
            this.loadMainPriceConditionFragment(sConditionType);
        },

        loadMainPriceConditionFragment: function(sConditionType){

            // clear the VBox first
            const vBox = this.byId("idPriceConditionVbox");
            vBox.removeAllItems();

            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionView");
            const selectedPriceConditionsIndex = priceConditions.findIndex(item => item.ConditionType === sConditionType);
            const sFragmentPath = "FAST_NS0FAST0.view.fragments.priceConditions"; 

            if(selectedPriceConditionsIndex > -1) {
                const bindingPath = "/PriceConditionView/".concat(selectedPriceConditionsIndex);
                let sFragmentName = sConditionType.split(" ").join("");

                // add RequestedVolume from the selected product to the PriceConditionView entity.
                const requestedVolume = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(),Services.getSelectedProductID())?.RequestedVolume;
                Services.getFastAppDataModel().setProperty(bindingPath.concat("/RequestedVolume"), requestedVolume);
                
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

        calculateDiscountsAndNetPricesPrecioNeto: function(oEvent){

            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const priceConditionViewObj = bindingContext.getObject();

            let newNetP;
            if (oEvent.getId() === "change"){
                newNetP = Number(priceConditionViewObj.NetPriceWithoutTaxBeforeDeductionRD);
            } else {
                 newNetP = Number(oEvent.getSource().getValue());

            }

            const newNetPriceWithoutTaxBeforeDeductionRD = newNetP;

            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let packFactor =  this.getView().getModel('fastAppData').getData().ProductPricingView[0].PACKFACTOR;
            let UOM = this.getView().getModel('fastAppData').getData().ProductPricingView[0].UOM;
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
            const additionalDiscount =  correctPrice > 0 ? ((standardPrice - newNetPriceWithoutTaxBeforeDeductionRD) / standardPrice).toFixed(2) : 0;

            let newNetPriceWithoutTaxAfterDeductionRD = "";
            let newNetPriceWithTaxAfterDeductionRD =  "";

            if(priceConditionViewObj.RoyalDecree === "IncludeInPrecioNeto"){
                newNetPriceWithoutTaxAfterDeductionRD = newNetPriceWithoutTaxBeforeDeductionRD * ( 1 - priceConditionViewObj.RoyalDecreePercentage);
            }else {
                newNetPriceWithoutTaxAfterDeductionRD = newNetPriceWithoutTaxBeforeDeductionRD;
            }

            if(priceConditionViewObj.RoyalDecree === "ExcludeInPrecioNeto"){
                newNetPriceWithTaxAfterDeductionRD = newNetPriceWithoutTaxAfterDeductionRD * ( 1 + priceConditionViewObj.Tax) * ( 1 - priceConditionViewObj.RoyalDecreePercentage);
            }else {
                newNetPriceWithTaxAfterDeductionRD = newNetPriceWithoutTaxAfterDeductionRD * ( 1 + priceConditionViewObj.Tax);
            }

            // set the calcualted field and update the bindings
            priceConditionViewObj.AdditionalDiscount = additionalDiscount;
            priceConditionViewObj.NetPriceWithoutTaxAfterDeductionRD = Number(newNetPriceWithoutTaxAfterDeductionRD.toFixed(2));
            priceConditionViewObj.NetPriceWithTaxAfterDeductionRD = Number(newNetPriceWithTaxAfterDeductionRD.toFixed(2));

            bindingContext.getModel().updateBindings();
            
        },

        calculateNetPricesDescuentoComercial: function (oEvent){

            
            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            const priceConditionViewObj = bindingContext.getObject();
           
            let newNetPriceWithoutTax = "";

            let newDiscount;
            if (oEvent.getId() === "change"){
               newDiscount = Number(priceConditionViewObj.Discount);
            } else {
               newDiscount = Number(oEvent.getSource().getValue());

            }
            const discount = newDiscount;
            

            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let packFactor =  this.getView().getModel('fastAppData').getData().ProductPricingView[0].PACKFACTOR;
            let UOM = this.getView().getModel('fastAppData').getData().ProductPricingView[0].UOM;
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
                newNetPriceWithoutTax = correctPrice * (1 - priceConditionViewObj.RoyalDecreePercentage) * (1 - discount / 100);
            }else {
                newNetPriceWithoutTax = correctPrice * (1 - discount / 100);
            }

            // set the calcualted field and update the bindings
            priceConditionViewObj.NetPriceWithoutTax = newNetPriceWithoutTax;
            priceConditionViewObj.NetPriceWithTax = Number((newNetPriceWithoutTax * (1 + priceConditionViewObj.Tax)).toFixed(2))

            bindingContext.getModel().updateBindings();
        },

        calculateProfitability: function(){
            this.calculateProductProfitability();
            this.calculateConsolidatedProfitability();
        },

        calculateProductProfitability: function (){
            let oProductsTable = this.byId("idFinancialOfferViewProduct");
            let oBindingContext = oProductsTable.getBindingContext('fastAppData');
            let oFastAppDataModel = Services.getFastAppDataModel();
            let productProfitabilityData = [];
            let oProductConditionView = null;

            const aOfferProducts = oFastAppDataModel.getProperty('/SelectedOffer/Product/results');  //get all products from the model
            let aPriceConditionViews = oFastAppDataModel.getProperty('/PriceConditionView'); //get all price conditions from the model
                //aPriceConditionViews = aPriceConditionViews && aPriceConditionViews.filter(priceCondition => priceCondition.ExistingPriceConditionID != null); // we only need the active ones
            let aProductPricingView = oFastAppDataModel.getProperty('/ProductPricingView');
            const oSelectedOffer = oFastAppDataModel.getProperty('/SelectedOffer'); //get selected offer

            if (aOfferProducts && aOfferProducts.length > 0){
                productProfitabilityData = aOfferProducts.map(product => {
                    if(aPriceConditionViews && aPriceConditionViews.length > 0){
                        oProductConditionView = aPriceConditionViews[(Services.getSelectedPriceConditionPath()).split("/").pop()];
                    }

                    if(oSelectedOffer.Division !== 'Radiology' && oProductConditionView && oProductConditionView.ConditionType !== 'Rental'){
                        
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
                            let aFreeGoodsOther = oPriceCondition.FreeGoodsOther;
                            if(aFreeGoodsOther && aFreeGoodsOther.length > 0){
                                aFreeGoodsOther = aFreeGoodsOther.filter(freeGood => freeGood.ProductCode === product.SKU.PRODUCTPACKID);
                            }

                            sFOCType = oPriceCondition.FOCType;
                            sFOCBonus = aFreeGoodsOther && aFreeGoodsOther.length > 0 ? aFreeGoodsOther[0].FOCBonus : 0;
                            netPrice = oProductConditionView.NetPriceWithoutTaxAfterDeductionRD;
                        }
                        let requestedVolume = product.RequestedVolume;
                        let cogs = product.Cogs ? product.Cogs.COGS : 0;

                        let dPaidVolume = requestedVolume - ((sFOCType === 'FOC 1' ? sFOCBonus : 0));
                        let dTotalVolume = requestedVolume + ((sFOCType === 'FOC 2' ? sFOCBonus : 0));
                        let grossSales = netPrice * dPaidVolume;
                        let netPriceWithFoc = grossSales / dTotalVolume;
                        let grossProfit = grossSales - (cogs * dTotalVolume);
                        let grossMargin = grossSales ? (grossProfit / grossSales) : 0;

                        oPriceCondition.cogsUoM = cogs;
                        oPriceCondition.GrossSales = grossSales;
                        oPriceCondition.NetPriceFOC = netPriceWithFoc;
                        oPriceCondition.GrossProfit = Number((grossProfit).toFixed(2));
                        oPriceCondition.GrossMargin = grossMargin;
                        oPriceCondition.Sales_NPV = 0;
                        oPriceCondition.Cost_NPV = 0;

                    } else if(oSelectedOffer.Division === 'Radiology' && oProductConditionView && oProductConditionView.ConditionType === 'Rental'){
                        /* Calculation B
                            Only applies for all RENTAL price conditions, and offer division equals Radiology */
                        let dCost_Yi = [];
                        let dSales_Yi = [];
                        let oPriceCondition = aProductPricingView && aProductPricingView.length > 0 ? aProductPricingView.filter(priceCondition => priceCondition.ProductCode === product.SKU.PRODUCTPACKID)[0] : null;                               
                        let dMonthlyRentPerUnit = oProductConditionView ? oProductConditionView.MonthlyRentPerUnit : 0;
                        let dAnnualValue = oProductConditionView ? oProductConditionView.AnnualValue : 0;
                        let dAnnualUnits = product.RequestedVolume;

                        let dStartMonth = 1;
                        let dDiscountRate = 0.05;
                        let dMaintenanceCost = 1200;
                        let dDurationAgreementYears = 5;
                        let cogs = product.Cogs ? product.Cogs.COGS : 0;

                        let dCost_Y1 = cogs * (dAnnualUnits) * (12 - dStartMonth + 1) / (dDurationAgreementYears * 12) + dAnnualUnits * dMaintenanceCost * (12 - dStartMonth + 1) / 12;
                        let dSales_Y1 = (dAnnualValue / 12) * (12 - dStartMonth + 1);
                        
                        for(let i = 2; i <= dDurationAgreementYears; i++){
                            //should this return an array? 
                            dCost_Yi.push(cogs * dAnnualUnits / dDurationAgreementYears + dAnnualUnits * dMaintenanceCost);
                            dSales_Yi.push(dAnnualValue);
                        }
                        
                        let costY_total = cogs * (dAnnualUnits) * (dStartMonth - 1) / (dDurationAgreementYears * 12) + dAnnualUnits * dMaintenanceCost * (dStartMonth - 1) / 12;
                        let salesY_total = dAnnualValue / 12 * (dStartMonth - 1);
                    
                        let dCost_NPV = dCost_Y1;
                        let dSales_NPV = dSales_Y1;
                        
                        for(let i = 2; i <= (dDurationAgreementYears); i++){
                            dCost_NPV = dCost_NPV + dCost_Yi[i-2] / ((1 + dDiscountRate)**i);
                            dSales_NPV = dSales_NPV + dSales_Yi[i-2] / ((1 + dDiscountRate)**i);
                        }
                    
                        let netOfferPrice = dMonthlyRentPerUnit;
                        let netPriceWithFoc = dMonthlyRentPerUnit;
                        let grossSales = dAnnualValue;
                        let grossProfit = dSales_NPV - dCost_NPV;
                        let grossMargin = dSales_NPV ? grossProfit / dSales_NPV : 0;

                        oPriceCondition.cogsUoM = cogs;
                        oPriceCondition.GrossSales = grossSales;
                        oPriceCondition.NetofferPrice = netOfferPrice;
                        oPriceCondition.NetPriceFOC = netPriceWithFoc;
                        oPriceCondition.GrossProfit = Number((grossProfit).toFixed(2));
                        oPriceCondition.GrossMargin = grossMargin;
                        oPriceCondition.Sales_NPV = dSales_NPV;
                        oPriceCondition.Cost_NPV = dCost_NPV;

                    } else if(oSelectedOffer.Division === 'Radiology' && oProductConditionView && oProductConditionView.ConditionType !== 'Rental') {
                    
                        /* Calculation C
                        Only applies for all price conditions, except for rental, and offer division equals Radiology */
                        let dCost_Yi = [];
                        let dSales_Yi = [];

                        let oPriceCondition = aProductPricingView && aProductPricingView.length > 0 ? aProductPricingView.filter(priceCondition => priceCondition.ProductCode === product.SKU.PRODUCTPACKID)[0] : null;   
                        let netPrice = oProductConditionView ? oProductConditionView.NetPriceWithoutTaxAfterDeductionRD : 0;
                        let dAnnualUnits = product.RequestedVolume;
                        let dAnnualValue = dAnnualUnits * netPrice;
                        let cogs = product.Cogs ? product.Cogs.COGS : 0;
                        
                        let dStartMonth = 1;
                        let dDiscountRate = 0.05;
                        let dDurationAgreementYears = 5;
                        let dGrowthRate = 5;

                        let dCost_Y1 = cogs * (dAnnualUnits * (12 - dStartMonth + 1)) / (dDurationAgreementYears * 12);
                        let dSales_Y1 = (dAnnualValue / 12) * (12 - dStartMonth + 1);
                        
                        for(let i = 2; i <= dDurationAgreementYears; i++){
                            dCost_Yi.push((cogs * dAnnualUnits * dGrowthRate**(i-2)) / dDurationAgreementYears);
                            dSales_Yi.push(dAnnualValue * dGrowthRate**(i-2));
                        }
                        
                        let costY_total = cogs * dAnnualUnits * (dGrowthRate**dDurationAgreementYears) * (dStartMonth-1) / (dDurationAgreementYears * 12);
                        let salesY_total = dAnnualValue * dGrowthRate**dDurationAgreementYears * (dStartMonth - 1) / (dDurationAgreementYears * 12);

                        let dCost_NPV = dCost_Y1;
                        let dSales_NPV = dSales_Y1;
                        
                        for(let i = 2; i <= (dDurationAgreementYears); i++){
                            dCost_NPV = dCost_NPV + dCost_Yi[i-2] / ((1 + dDiscountRate )**i);
                            dSales_NPV = dSales_NPV + dSales_Yi[i-2] / ((1 + dDiscountRate )**i); 
                        }

                        let grossSales = dAnnualValue;
                        let grossProfit = dSales_NPV - dCost_NPV;
                        let grossMargin = dSales_NPV ? grossProfit / dSales_NPV : 0;

                        oPriceCondition.cogsUoM = cogs;
                        oPriceCondition.GrossSales = grossSales;
                        oPriceCondition.NetofferPrice = netPrice;
                        oPriceCondition.NetPriceFOC = netPrice;
                        oPriceCondition.GrossProfit = Number((grossProfit).toFixed(2));
                        oPriceCondition.GrossMargin = grossMargin;
                        oPriceCondition.Sales_NPV = dSales_NPV;
                        oPriceCondition.Cost_NPV = dCost_NPV;
                    }
                });

                Services.getFastAppDataModel().updateBindings();
            }
        },

        calculateConsolidatedProfitability: function(){
            const oFastAppDataModel          = Services.getFastAppDataModel();
            const aOfferProducts             = oFastAppDataModel.getProperty('/SelectedOffer/Product/results');  //get all products from the model
            const aProductPricingView        = oFastAppDataModel.getProperty('/ProductPricingView');
            const oConsolidatedProfitability = oFastAppDataModel.getProperty('/SelectedOffer/ConsolidatedProfitability');
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
                        let aProductsPerType = aOfferProducts.filter(product => product.SKU.ProductType === consolidatedEntry.ProductType.slice(0, -1));
                        oCalculatedResult = this.getCalculatedProfitability(aProductsPerType, aProductPricingView);
                    } else if(consolidatedEntry.ProductType !== 'Contrast Agents' && consolidatedEntry.ProductType !== 'Consumables' && consolidatedEntry.ProductType !== 'Injectors' && consolidatedEntry.ProductType !== 'Total'){
                        //calculate any other product type
                        let aProductsPerType = aOfferProducts.filter(product => (product.SKU.ProductType !== 'Contrast Agent' && product.SKU.ProductType !== 'Injector' && product.SKU.ProductType !== 'Total' && product.SKU.ProductType !== 'Consumable'));
                        oCalculatedResult = this.getCalculatedProfitability(aProductsPerType, aProductPricingView);
                    } else if(consolidatedEntry.ProductType === 'Total'){
                        //calculate totals
                        oCalculatedResult.GrossMargin = oCalculatedResultTotals.GrossMargin;
                        oCalculatedResult.NetSales = oCalculatedResultTotals.NetSales;
                        oCalculatedResult.COGS = oCalculatedResultTotals.COGS;
                        oCalculatedResult.Profitability = oCalculatedResultTotals.Profitability;
                    }

                    if(consolidatedEntry.ProductType !== 'Total'){
                        //keep track of actual totals
                        oCalculatedResultTotals.GrossMargin = oCalculatedResultTotals.GrossMargin + oCalculatedResult.GrossMargin;
                        oCalculatedResultTotals.NetSales = oCalculatedResultTotals.NetSales + oCalculatedResult.NetSales;
                        oCalculatedResultTotals.COGS = oCalculatedResultTotals.COGS + oCalculatedResult.COGS;
                        oCalculatedResultTotals.Profitability = oCalculatedResultTotals.Profitability + oCalculatedResult.Profitability;
                    }

                    consolidatedEntry.GrossMargin = oCalculatedResult.GrossMargin;
                    consolidatedEntry.NetSales = oCalculatedResult.NetSales;
                    consolidatedEntry.COGS = oCalculatedResult.COGS;
                    consolidatedEntry.Profitability = oCalculatedResult.Profitability;
                });

                Services.getFastAppDataModel().updateBindings();
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

                    npv_grossmargin = npv_grossmargin + oProductPricing.GrossMargin;
                    npv_netsales = npv_netsales + oProductPricing.Sales_NPV;
                    npv_cogs = npv_cogs + oProductPricing.Cost_NPV;
                }

                profitability = npv_netsales ? npv_cogs / npv_netsales : 0;
            });

            return {
                GrossMargin: Number((npv_grossmargin).toFixed(2)),
                NetSales: Number((npv_netsales).toFixed(2)),
                COGS: Number((npv_cogs).toFixed(2)),
                Profitability: Number((profitability).toFixed(2))
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
                const priceConditionView = Services.getFastAppDataModel().getProperty("/PriceConditionView");
                const rappelIndex = priceConditionView.findIndex(item => item.ConditionType === "Rappel");
                const bindingPath = "/PriceConditionView/".concat(rappelIndex);
                const oTable = this.byId("idVolumeTreshold");
                oTable.bindElement({ path: bindingPath, model: "fastAppData" });
                oDialog.open();
            }.bind(this));

        },

        onAddNewDiscountCondition: function(oEvent){

            const bindingPath = this.byId("idVolumeTreshold").getElementBinding("fastAppData").sPath;
            const priceConditions = Services.getFastAppDataModel().getProperty(bindingPath);
            const discountConditions = Services.getFastAppDataModel().getProperty(bindingPath.concat("/DiscountConditions")) || [];

            
            discountConditions.push({
                Volume: "",
                Discount: "",
                Tax: priceConditions.Tax,
                NetPriceWithoutTax: "",
                NetPriceWithTax: "",
            });

            Services.getFastAppDataModel().setProperty(bindingPath.concat("/DiscountConditions"), discountConditions);

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

            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let packFactor =  this.getView().getModel('fastAppData').getData().ProductPricingView[0].PACKFACTOR;
            let UOM = this.getView().getModel('fastAppData').getData().ProductPricingView[0].UOM;
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
                netPriceWithoutTax = correctPrice * (1 - priceConditionViewObj.RoyalDecreePercentage) * (1 - discount / 100);
            }else {
                netPriceWithoutTax = correctPrice * (1 - discount / 100)
            }

            // set the calcualted field and update the bindings
            discountConditionObj.NetPriceWithoutTax = netPriceWithoutTax;
            discountConditionObj.NetPriceWithTax = netPriceWithoutTax * (1 + priceConditionViewObj.Tax);

            bindingContext.getModel().updateBindings();

        },

        onApplyDiscountCondition: function(){
            if(this.pDialog) this.pDialog.then(dialog => dialog.close());
        },


        /** Free goods other event handlers */
        onOpenProducts: function () {

			var oView = this.getView();

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
			const priceConditions = oFastAppDataModel.getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const sPath = "/PriceConditionView/".concat(focIndex) + "/FreeGoodsOther";

			let freeGoodsOther = oFastAppDataModel.getProperty(sPath);
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
			oFastAppDataModel.setProperty(sPath, freeGoodsOther);
			const foundError = freeGoodsOther.find(freeGoods => freeGoods.FreeGoodsOtherFOCMinAmountValueState === "Error" || freeGoods.FOCBonusValueState === "Error");
			if (!foundError) this.byId("OtherProducts").close();
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


		_handleValueHelpClose: function (oEvent) {
			const oFastAppData = Services.getFastAppDataModel();
			const priceConditions = oFastAppData.getProperty("/PriceConditionView");
            const focIndex = priceConditions.findIndex(item => item.ConditionType === "FOC");
            const sPath = "/PriceConditionView/".concat(focIndex) + "/FreeGoodsOther";
            
			var oFreeGoodsOther = oFastAppData.getProperty(sPath + "/" + this._focIndex);

			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var oInputfield = this.byId('idOtherProducts');
				oInputfield.setValue(oSelectedItem.getTitle());

				oFreeGoodsOther.ProductPackId = parseInt(oSelectedItem.getDescription());
				oFreeGoodsOther.ProductName = oSelectedItem.getTitle();
				oFastAppData.setProperty(sPath, oFastAppData.getProperty(sPath))
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

            let instType = this.getView().getModel('fastAppData').getData().Tender.Institute.InstituteType;
            let packFactor =  this.getView().getModel('fastAppData').getData().ProductPricingView[0].PACKFACTOR;
            let UOM = this.getView().getModel('fastAppData').getData().ProductPricingView[0].UOM;
            let correctPrice;
            if(instType === "Private Account"){
                if(UOM === "Unit"){
                    correctPrice = priceConditionViewObject.PVL / packFactor;
                } else {
                    correctPrice = priceConditionViewObject.PVL;
                }
            } else {
                if(UOM === "Unit"){
                    correctPrice = priceConditionViewObject.YLAP / packFactor;
                } else {
                    correctPrice = priceConditionViewObject.YLAP;
                }
            }

            if(priceConditionViewObject.RoyalDecree !== null && priceConditionViewObject.RoyalDecree === 'Yes'){
                potentialSaving = bonusAmount * correctPrice * (1 - freeGoodsObject.RoyalDecreePercentage);                
            } else {
                potentialSaving = bonusAmount * correctPrice;
            }

            freeGoodsObject.PotentialGeneratedSavings = potentialSaving; 
            bindingContext.getModel().updateBindings();           
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


        
    });
});