sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/financial",
    "FAST_NS0FAST0/model/quotation",
	"sap/ui/core/Fragment",
	"com/bayer/tender/uilib/datatypes/PercentageType",
	"com/bayer/tender/uilib/datatypes/UoMPriceType",
    "com/bayer/tender/uilib/datatypes/CustomDecimalType",
	"sap/ui/model/Filter",
    "sap/ui/model/FilterType",
	"sap/ui/model/FilterOperator",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Sorter",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageToast"
], function (Controller, formatter, Services, UserInfo, MomentJS, Financial, Quotation, Fragment, PercentageType, UoMPriceType, CustomDecimalType, Filter, FilterType, FilterOperator, BusyIndicator,Sorter,NumberFormat, MessageToast) {
	"use strict";
	
	//var bundle;

	return Controller.extend("FAST_NS0FAST0.controller.FinancialOffer_BR", {

		//Formatting functions
		formatter: formatter,
		types: {
			percent: PercentageType,
            uomPrice: UoMPriceType,
            customDecimal: CustomDecimalType
		},

		onInit: function (oEvent) {

			const oViewModel = new sap.ui.model.json.JSONModel({
				delay: 0,
				selectedProductUoM: "",
                FinPricingOfferSubsectionisBusy: false,
                selectedConditionType: "Discount",
			});

			this.getView().setModel(oViewModel, "finOfferView");
            //Services.getFastAppDataModel().setProperty("/ExistingAgreementInPlace", false);

			//get resource bundle for translations or texts
			this._oOwnerComponent = this.getOwnerComponent();
			this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            // Register the view with the message manager
		    //sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);

			//keep router and model locally in this controller
			this._oRouter = this._oOwnerComponent.getRouter();
			this._oModel = this._oOwnerComponent.getModel();
			//bundle = this.getOwnerComponent().getModel("i18n").getResourceBundle(); // why do we have this two times ?

			this._DetailView = sap.ui.getCore().byId(this.getView().getId().split("---")[0] + "---tenderManagementDetailId");
			this._DetailController = this._DetailView.getController();

			Services.setRouterObject(this._oRouter);

			//attach the onTenderMatched method to handle routing between pages + load correct data
			// this._oRouter.getRoute("master").attachPatternMatched(this._onTenderMatched, this); // is this needed? according to the routing config this will cause side effects
			this._oRouter.getRoute("detail").attachPatternMatched(this._onTenderMatched, this);  

		},


		//Navigation between TenderMaster & Detail pages routing is matched
		_onTenderMatched: async function (oEvent) {

            // This code should only for Brazil
            if(Services.getSelectedCountry() !== "BR"){
                return;
            }

			// this method should only be called in case of Brazil
			var sTab = oEvent.getParameter("arguments").tab || "";
			if (sTab && sTab.includes("financialOfferId_BR")) {

                BusyIndicator.show();

            //load countryBrandProducts ( needed to get productnames for FOC model)
            let aCountryBrandProducts = await this.getCountryBrandProducts(Services.getSelectedCountry());
            Services.getFastAppDataModel().setProperty("/CountryBrandProducts", aCountryBrandProducts);

            await this.getProducts();
            

            this.onBindingItemsFinished(oEvent, true); //TODO: check w/ Wouter if there's a more proper solution to do this, and why this method is not executed every time on view load
        
            
            if(Services.getFastAppDataModel().getProperty('/SelectedOffer')){
                await this.managePriceConditionClassification();
                await this.managePriceConditions();
               
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
            const priceConditionBrazilViews = await this.getPriceConditionBrazilView();
            const tenderHistoryBrazil = await this.getTenderHistoryBrazil();
            Services.getFastAppDataModel().setProperty("/PriceConditionBrazilView", priceConditionBrazilViews);
            Services.getFastAppDataModel().setProperty("/TenderHistoryBrazil", tenderHistoryBrazil);
            
            const existingMainPriceCondition = priceConditionBrazilViews.find(item => item.isMain && item.ExistingPriceConditionID);
            const sConditionType = "Discount";
            //bind MainPriceCondition
            const existingMainPriceConditionType = existingMainPriceCondition ? existingMainPriceCondition.ConditionType : sConditionType;
            this.bindingMainPriceCondition(existingMainPriceConditionType);
            this.getView().getModel("finOfferView").setProperty("/selectedConditionType", existingMainPriceConditionType);
      
        },

        /**
         * Edit toggle action on the Edit/View mode on the Brazil FinancialOfferPage
         * @param {*} bEditMode 
         */        
        editFinancialOfferBRToggle: function(bEditMode){
            if(bEditMode){
                const sSelectedMainPriceCondition = this.getView().byId('idPriceConditionSelect').getSelectedItem().getText();
                const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionBrazilView");
                const index = priceConditions.findIndex(item => item.ConditionType === sSelectedMainPriceCondition);                
                if(index < 0) return null;
                if(sSelectedMainPriceCondition === "Discount"){
                    const bindingPath = "/PriceConditionBrazilView/".concat(index);
                    const oPriceCondition = Services.getFastAppDataModel().getProperty(bindingPath);
                    let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
                    let packFactor =  oProductPrice.PACKFACTOR;
                    let UOM = oProductPrice.UOM;
                    let correctPrice;
                    if(UOM === "Unit"){
                        correctPrice = oPriceCondition.masterPriceList / packFactor;
                    }else{
                        correctPrice = oPriceCondition.masterPriceList;
                    }
                    let dTaxExemption = oPriceCondition.TaxExemption ? oPriceCondition.TaxExemption : "No";
                    let dCap = oPriceCondition.CAP ? oPriceCondition.CAP : "No";
                    const dBasePrice                      = dTaxExemption === 'No' && dCap === 'No' ? correctPrice :
                                                            dTaxExemption === 'Yes' && dCap === 'No' ? oPriceCondition.PriceAfterTaxExemtion : oPriceCondition.PriceAfterCap;
                    this.calculateMainPriceCondition(oPriceCondition,oPriceCondition.AdditionalDiscount,oPriceCondition.CommercialProposal,dBasePrice);
                }

            }
            Services.getFastAppDataModel().updateBindings();
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
         * This method triggers on TenderHistory filter events
         * @param {*} oEvent 
         */
        onHistoryFilterCheck: async function(oEvent){
            const tenderHistoryBrazil = await this.getTenderHistoryBrazil();
            Services.getFastAppDataModel().setProperty("/TenderHistoryBrazil", tenderHistoryBrazil);    
        }, 

        /**
         * Get TenderHistory data for Spain using filters
         */
        getTenderHistoryBrazil: async function(){

            BusyIndicator.show();
            let aFilters = [];
            let oFilters = [];

            const offer = Services.getFastAppDataModel().getProperty("/SelectedOffer");
            if(offer){
                const currentInstituteId = Services.getFastAppDataModel().getProperty("/Tender/Institute/InstituteID");
                    if(this.byId("currentInstituteCheckId").getSelected()){                    
                        aFilters.push(new Filter({
                            path: 'INSTITUTE_ID',
                            operator: FilterOperator.EQ,
                            value1: currentInstituteId
                        }));
                    }
                    if(this.byId("wonCheckId").getSelected()){
                        oFilters.push(new Filter({
                            path: 'OUTCOME',
                            operator: FilterOperator.EQ,
                            value1: "Won"
                        }));
                        aFilters.push(new sap.ui.model.Filter(oFilters, false));
                    }                        
                    if(this.byId("lossCheckId").getSelected()){
                        oFilters.push(new Filter({
                            path: 'OUTCOME',
                            operator: FilterOperator.EQ,
                            value1: "Lost"
                        }));
                        aFilters.push(new sap.ui.model.Filter(oFilters, false));
                    }
                    //if(!(this.byId("currentInstituteCheckId").getSelected()) && !(this.byId("wonCheckId").getSelected()) && !(this.byId("lossCheckId").getSelected())){  
                        if(Services.getSelectedProductID()){             
                            aFilters.push(new Filter({
                                path: 'ProductCode',
                                operator: FilterOperator.EQ,
                                value1: Services.getSelectedProductID()
                            }));
                        }
                    //}
                    
                let tenderHistoryBrazil = await Services.getService("PriceCondition").getTenderHistoryBrazil(aFilters);
                
                BusyIndicator.hide();
                return tenderHistoryBrazil.data.results;
            } else return null;

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
         * This method  sets the element binding of the Brazil Main Price Conditions
         * @returns {String} - Binding path of the Brazil Main Price Conditions 
         */
        bindingMainPriceCondition: function(sConditionType){
            const priceConditions = Services.getFastAppDataModel().getProperty("/PriceConditionBrazilView");
            
            const MainConditionIndex = priceConditions.findIndex(p => p.ConditionType === sConditionType);
            if(MainConditionIndex < 0) return null;
            const mainConditionBindingPath = "/PriceConditionBrazilView/".concat(MainConditionIndex);
            const mainConditionVbox = this.byId("idPriceConditionVbox");
            mainConditionVbox.bindElement({ path: mainConditionBindingPath, model: "fastAppData" });
            return mainConditionBindingPath;
        },               
       

        getProducts: async function (){ 
            //load products
		    let aProducts = await this.getFinancialProducts(Services.getSelectedOfferID());
            aProducts.sort((a, b) => (a.SORTER > b.SORTER) ? 1 : -1);
            aProducts = aProducts?.filter(prod => prod.Channel !== "Decline");
            let oFastAppDataModel = Services.getFastAppDataModel();
            oFastAppDataModel.setProperty("/ProductPricingView", aProducts);

        },


        getPriceConditionBrazilView: async function(){

            BusyIndicator.show();

            const offer = Services.getFastAppDataModel().getProperty("/SelectedOffer");
            const selectedProductLotID = Services.getFastAppDataModel().getProperty("/EditSelectedProduct/LotID");
            if(offer){
                const selectedProduct = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(),Services.getSelectedProductID(), selectedProductLotID);

                const filter = {
                    "CountryCode": offer.CountryCode,
                    "Classification": offer.Tender.Classification,
                    "Division": offer.Division,
                    "OfferID": offer.OfferID,
                    "ProductCode": selectedProduct.ProductCode,
                    "LotID": selectedProduct.LotID
                };

                let priceConditionBrazilViews = await Services.getService("PriceCondition").getPriceConditionBrazilView(filter);
                
                BusyIndicator.hide();
                return priceConditionBrazilViews.data.results;
            } else return null;

        },
              
		setFinancialOffer: async function(){
			//Edit offer copy to move back to original values during cancel
			let sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID); 
			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
			let sSelectedSection = Services.getFinancialOfferPageSectionID_ES();
			Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection);

		},
		refreshFinancialTabBR: async function () {
			await this.getProducts();
            await this.managePriceConditionClassification();
            await this.managePriceConditions();
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
		 * Save financial offer for Brazil
		 * @param {*} oEvent 
		 */
		onSaveFinancialOfferBrazil: async function (oEvent) {

            BusyIndicator.show();

            const selectedPriceConditionViewObjects = this.getSelectedPriceConditionViewObjects();
            const aErroneousConditions = this.checkSaveFinancialOfferBrazil(selectedPriceConditionViewObjects);   
            const selectedProductID = Services.getSelectedProductID();
            if(aErroneousConditions && (aErroneousConditions.length > 0)) {
                BusyIndicator.hide();                
                this.byId("ApprovalButtonId").setEnabled(false);
                sap.m.MessageBox.error(`You must fill in all the mandatory fields for the following condition(s): \n\n ${aErroneousConditions.join()}`);
                return;
            } 
            else {         
                let sTenderID = "";   
                try {
                    await this.savePriceConditions(selectedPriceConditionViewObjects);

                    // Additional saving to PT_TMBDPR. The tender flow should keep working. 
                    // Thats why we need to store the basic price structure not only in the new tables but also in the PT_TMBDPR table
                    await this.savePricesToTMBDPR();
                                       
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
                await this.refreshFinancialTabBR();

                if(Services.getFastAppDataModel().getProperty("/SelectedOffer")){
                    await this.managePriceConditions();
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
                    requiredPriceConditionViewObject = priceConditionViewObj;
                }
                if(requiredPriceConditionViewObject){
                    const priceConditionSaveObject = Services.getService("PriceCondition").convertToSaveObject(requiredPriceConditionViewObject,"FinancialOfferPage");
                    savePriceConditionPromises.push(Services.getService("PriceCondition").upsertPriceCondition(priceConditionSaveObject));
                }
            });
     
            
            const deletePreExistingMainPriceConditionPromises = this.deletePreExistingMainPriceConditions(selectedPriceConditionViewObjects);

            return Promise.all([savePriceConditionPromises,deletePreExistingMainPriceConditionPromises]);                

        },

        /**
         * Delete all pre-existing main price conditions.
         * This use case can occur when the user changes the main price condition type 
         * after a main price condition was already been created
         * @returns {Array<Promise>}
         */
        deletePreExistingMainPriceConditions: function(selectedPriceConditionViewObjects){
            const allPriceConditionViews = Services.getFastAppDataModel().getProperty("/PriceConditionBrazilView");
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
            const oEditProduct = oFastAppDataModel.getProperty("/EditProduct");
			let oProduct = aProducts && aProducts.results && aProducts.results.find(prod => prod.ProductCode == sProductId && prod.LotID == oEditProduct.LotID);
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
            if(UOM === "Unit"){
                    correctPrice = oMainPriceCondition.masterPriceList / packFactor;
                } else {
                    correctPrice = oMainPriceCondition.masterPriceList;
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
				Discount: null,
				OfferPrice:  oMainPriceCondition.CommercialProposal,
				StandardDiscount: oMainPriceCondition.StandardDiscount,
				AdditionalDiscount: oMainPriceCondition.AdditionalDiscount,
				Deductions: 0,
				NetofferPrice: oMainPriceCondition.Invoive,
				BusinessCasePrice: 0,
				WholesalePrice: "",
				COGS: 0,
				SpotRate: 6.281785,
				BudgetRate: 6.53,
				Scenario: 0,
				FOC_ABS_PCT: null,
				FOCProduct_Bundled_1: null, 
				FOC_ABS_PCT_Bundled_1: null,
				FOC_Bundled_1: null,
				ActiveTier: 0,
				NetPrice: oMainPriceCondition.NetPrice,
				NetPrice_OfPaid: 0,
				PRICE_UPDATE: oOffer.APPROVALS_SENT, // Mechanism to identify that approval is required again is based on this field
                LotID: oProduct.LotID ? oProduct.LotID : 1
			};

			return oNewPriceInfo;
		},        


        /**
         * @returns {Array:Objects} - A list of price condition view objects that the user has interacted with in the UI
         */
        getSelectedPriceConditionViewObjects: function(){
            const selectedPriceConditionTypes = this.getSelectedPriceConditionTypes();
            const allPriceConditionViews = Services.getFastAppDataModel().getProperty("/PriceConditionBrazilView");
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

            const oSelectPriceCondition = this.byId("idPriceConditionSelect");

            if(oSelectPriceCondition.getSelectedItem()){
                selectedPriceConditions.push(oSelectPriceCondition.getSelectedItem().getText());
            }

            return selectedPriceConditions;
        },

        checkSaveFinancialOfferBrazil: function (oPriceConditions){

            var aErroneousCondition = [];            

            for(let i = 0; i < oPriceConditions.length; i++){            
                if(oPriceConditions[i].ConditionType === "Discount") {
                    if(oPriceConditions[i].AdditionalDiscount < 0){
                        aErroneousCondition.push(oPriceConditions[i].ConditionType);
                    }
                } else if(oPriceConditions[i].ConditionType === "Commercial Proposal"){
                    if(!oPriceConditions[i].CommercialProposal){
                        aErroneousCondition.push(oPriceConditions[i].ConditionType);
                    }
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
			// This code should only for Brazil. TODO: check why this method is also being run for Brazil. This is a side effect.
            if(Services.getSelectedCountry() !== "BR"){
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

			if ((bInitLoad || (sSourceId && sSourceId.includes('financialOfferViewId_BR'))) && !$.isEmptyObject(oProductsTable)) {
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
                            const selectedProductLotID = Services.getFastAppDataModel().getProperty("/EditSelectedProduct/LotID");
                            let selectedProduct = Services.getLoadedProductsForOffer(Services.getSelectedOfferID(), Services.getSelectedProductID(), selectedProductLotID);
                            Services.getFastAppDataModel().setProperty("/SelectedOffer/SelectedProduct",selectedProduct);
						}
                            
                        that.onFinancialProductPress(oEvent, true);
                        this.selectedProductPricePath = Services.getSelectedProductPath();
				}
                // else {
                //     // Disable approval button when financial offer table is empty
                //     this.byId("ApprovalButtonId").setEnabled(false);
                // }
			}
		},

        onFinancialProductPress: async function(oEvent, bBindingFinished){
            // BusyIndicator.show();
            // set the busy indicator on the princing subsection
            this.getView().getModel("finOfferView").setProperty("/FinPricingOfferSubsectionisBusy", true);
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
                let oBindingContext = this.byId("idFinancialOfferViewProduct").getItems()[parseInt(this.selectedProductPricePath.substring(this.selectedProductPricePath.lastIndexOf('/') + 1))]?.getBindingContext('fastAppData');
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
            let aOfferProducts = oOffer?.Product?.results;
            aOfferProducts = aOfferProducts?.filter(prod => prod.Channel !== "Decline");

			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
			Services.getFastAppDataModel().setProperty("/EditProduct/", oProductPrice);

			let oSelectedProduct = aOfferProducts && aOfferProducts.length > 0 ? aOfferProducts[this.selectedProductPricePath.substring(this.selectedProductPricePath.lastIndexOf('/') + 1)] : null;
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

            this.getView().getModel("finOfferView").setProperty("/FinPricingOfferSubsectionisBusy", false);

        },

        onPriceConditionChange: function(oEvent){
            const sConditionType = oEvent.getSource().getSelectedItem().getText();
            // const classification = Services.getFastAppDataModel().getProperty("/SelectedOffer/Tender/Classification");
            this.bindingMainPriceCondition(sConditionType); 
            // const bindingContext = oEvent.getSource().getBindingContext("fastAppData");   
            // let oPriceCondition = bindingContext.getProperty(bindingContext.sPath);
            // oPriceCondition.ConditionType = oEvent.getSource().getSelectedItem().getText();  
           
        },
             
        /**
         * Live Change method to calculate Brazil Price Condition
         * @param {*} oEvent 
         */
        
        onLiveChangePriceCondition: function(oEvent){

            const oNumberFormat = NumberFormat.getFloatInstance({
                maxFractionDigits: 2,
                groupingEnabled: true,
                groupingSeparator: ",",
                decimalSeparator: "."
              });

            const bindingContext = oEvent.getSource().getBindingContext("fastAppData");
            let oPriceCondition = bindingContext.getProperty(bindingContext.sPath);
            let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
            let packFactor =  oProductPrice.PACKFACTOR;
            let UOM = oProductPrice.UOM;
            let correctPrice;
            if(UOM === "Unit"){
                correctPrice = oPriceCondition.masterPriceList / packFactor;
            }else{
                correctPrice = oPriceCondition.masterPriceList;
            }
            let dTaxExemption = oPriceCondition.TaxExemption ? oPriceCondition.TaxExemption : "No";
            let dCap = oPriceCondition.CAP ? oPriceCondition.CAP : "No";

            const userInputValue = oEvent.getSource().getValue ? oNumberFormat.parse(oEvent.getSource().getValue().replace(",",".")) : 0;
            let dAdditionalDiscount = oEvent.getParameter('id').includes("idAdditionalDiscount") ? userInputValue / 100 : oPriceCondition.AdditionalDiscount ? oPriceCondition.AdditionalDiscount : 0;
            let dCommercialProposal = oEvent.getParameter('id').includes("idCommercialProposal") ? oNumberFormat.parse(oEvent.getParameter('newValue').replace(",",".")) : oPriceCondition.CommercialProposal ? oPriceCondition.CommercialProposal : 0;

            const dBasePrice                      = dTaxExemption === 'No' && dCap === 'No' ? correctPrice :
                                                    dTaxExemption === 'Yes' && dCap === 'No' ? oPriceCondition.PriceAfterTaxExemtion : oPriceCondition.PriceAfterCap;

            if(oEvent.getParameter('id').includes("idCommercialProposal")){
                if(userInputValue > (dBasePrice * (1 - oPriceCondition.StandardDiscount))){
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Commercial proposal value is too high.");
                    oEvent.getSource().openValueStateMessage();
                }else{
                    oEvent.getSource().setValueState("None");
                    oEvent.getSource().setValueStateText("");
                    oEvent.getSource().closeValueStateMessage();
                }
            }

            if(oEvent.getParameter('id').includes("idAdditionalDiscount")){
                if(parseFloat(oEvent.getParameter('newValue')) < 0){
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Additional discount value can not be negative.");
                    oEvent.getSource().openValueStateMessage();
                }else{
                    oEvent.getSource().setValueState("None");
                    oEvent.getSource().setValueStateText("");
                    oEvent.getSource().closeValueStateMessage();
                }
            }

            this.calculateMainPriceCondition(oPriceCondition,dAdditionalDiscount,dCommercialProposal,dBasePrice);
            bindingContext.getModel().updateBindings();
        },

        calculateMainPriceCondition: function(oPriceCondition,dAdditionalDiscount,dCommercialProposal,dBasePrice){
            const conditionType = this.getView().getModel('finOfferView').getProperty('/selectedConditionType');
            let oProductPrice = Services.getFastAppDataModel().getProperty(Services.getSelectedProductPath());
            let packFactor =  oProductPrice.PACKFACTOR;
            let UOM = oProductPrice.UOM;
            let correctPrice;
            if(UOM === "Unit"){
                correctPrice = oPriceCondition.masterPriceList / packFactor;
            }else{
                correctPrice = oPriceCondition.masterPriceList;
            }
            let dTaxExemption = oPriceCondition.TaxExemption ? oPriceCondition.TaxExemption : "No";
            let dCap = oPriceCondition.CAP ? oPriceCondition.CAP : "No";
            
            oPriceCondition.PriceAfterTaxExemtion = dTaxExemption === 'Yes' ? Number(correctPrice * (1 - oPriceCondition.ICMSTax)).toFixed(2) : null;
            oPriceCondition.PriceAfterCap         = dCap === 'Yes' &&  dTaxExemption === 'No' ? Number(correctPrice * (1 - oPriceCondition.CapValue)).toFixed(2) : 
                                                    dCap === 'Yes' &&  dTaxExemption === 'Yes' ? Number(correctPrice * (1 - oPriceCondition.ICMSTax) * (1 - oPriceCondition.CapValue)).toFixed(2) : null;
     
            if(dBasePrice === null){
                dBasePrice = dTaxExemption === 'No' && dCap === 'No' ? correctPrice :
                             dTaxExemption === 'Yes' && dCap === 'No' ? oPriceCondition.PriceAfterTaxExemtion : oPriceCondition.PriceAfterCap;
            }

            if(conditionType === 'Discount'){
                oPriceCondition.CommercialProposal = Number(dBasePrice * (1 - oPriceCondition.StandardDiscount - dAdditionalDiscount)).toFixed(2);
                
            } else if(conditionType === 'Commercial Proposal'){
                oPriceCondition.AdditionalDiscount = 1 - oPriceCondition.StandardDiscount - dCommercialProposal/dBasePrice;
                // oPriceCondition.CommercialProposal = dCommercialProposal;
                
            }
        },
      
		getRoyalDecree: async function(productPackID){
            return Services.getService("PriceCondition").getRoyalDecree(productPackID);
        },

        getMostRecentMasterPrices: async function(countryCode, productPackID){
            return Services.getService("PriceCondition").getMostRecentMasterPrices(countryCode, productPackID);
        },

        onShareApprovalsToIbizPress: async function(oEvent){

            BusyIndicator.show();

            const loadedOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
            const loadedOfferStatus = loadedOffer.OfferStatus.STATUS;
			
            //get user input
			let comment = loadedOfferStatus; // will contain the offer status value
			const workflowID = loadedOffer.IbizWorkflowID;
			const offerStatus = loadedOfferStatus == "Offer Approved" ? 1 : -1;
			try{
				//Logic to call the API to Notify about Product Switch
				const response = await Services.getService("Tender").sendApprovalToIbiz(workflowID, offerStatus, comment);
                if (offerStatus == 1) await this._saveAndSubmitQuotation();
                if (loadedOfferStatus === "Offer Rejected") {
                    Services.getFastAppDataModel().setProperty("/SelectedOffer/DecisionSharedWithIBIZ", true);
                    let oOfferSaveInfo = {
                        OfferID: loadedOffer.OfferID,
                        DecisionSharedWithIBIZ: true
                    }
                    //update offer
                    await Services.getService('Offer').updateOffer(oOfferSaveInfo).catch(function (oError) {

                        //show error message
                        Services.showErrorMessage(oError, "Update of offer");

                        //promises must fail as well
                        throw new Error(oError);

                    });
                }
                const res_msg = response.data;
				MessageToast.show(res_msg);
			}catch(error){
                try{
                    sap.m.MessageBox.error(error.message, {
                        title: "Error",
                        id: "messageBoxId3",
                        details: JSON.parse(error.responseText),
                        styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer"
                    });
                } catch(exception){
                    sap.m.MessageBox.error(error.message, {
                        title: "Error",
                        id: "messageBoxId4",
                        details: "Error occurred when sending approval to IBIZ",
                        styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer"
                    });
                }
			}

			// close loading that blocks everything
			BusyIndicator.hide();

			//close dialog
			// this.onNotifyibizDialogCancel();


		},
        _saveAndSubmitQuotation: async function () {
            var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

            // make sure selectedOfferPath is correctly set
            if(Services.getSelectedOfferPath() === "" || Services.getSelectedOfferPath().includes("results")){
                Services.setSelectedOfferPath(Services.getDefaultModel().createKey("/PT_TMOFRS", {
                    OfferID: Services.getSelectedOfferID()
                }))
            }
            const offerStatus = await Services.checkOfferStatus();
            if (!offerStatus) return;
			var sStatus = offerStatus.STATUS;
			var aStatusNoEdit = [
				"Awaiting Approval" //,
			];
			if ($.inArray(sStatus, aStatusNoEdit) !== -1) {
				sap.m.MessageBox.warning("Quotation cannot be saved, offer is in status Awating approval.", {});
			} else {

				let oCustomRemark = that.byId("idCustomRemark");
				let oSelectIssuedBy = that.byId("idSelectIssuedBy");
				let oSelectCompanyStamp = that.byId("idSelectCompanyStamp");

                await Services.loadOfferValidation(Services.getSelectedOfferID());

				const quotationFields = {
					OfferDate: oFastAppDataModel.getProperty("/OfferValidation/OFFERDATE"),
					OfferValidity: oFastAppDataModel.getProperty("/OfferValidation/OFFERVALIDITY"),
					EffectiveDate: oFastAppDataModel.getProperty("/OfferValidation/EffectiveDate"),
					ExpiryDate: oFastAppDataModel.getProperty("/OfferValidation/ExpiryDate"),
					CustomRemark: oCustomRemark ? that.byId("idCustomRemark").getValue() : '',
					IssuedBy: oSelectIssuedBy ? that.byId("idSelectIssuedBy").getSelectedKey() : '',
					CompanyStamp: oSelectCompanyStamp ? that.byId("idSelectCompanyStamp").getSelectedKey() : '',
				};

				//do the save of the quotation with UPDATED to 1
                const bSave = await Quotation.saveQuotation(quotationFields, 1)

                if (bSave) {
					//check if there needs to be an update (already existing and erpost)
                    const qoutationForSelectedOffer = await Quotation.loadQuotationForSelectedOffer(quotationFields.OfferDate);
                    if (qoutationForSelectedOffer) {
                        //do the save of the quotation
                        await Quotation.submitQuotation(quotationFields);
                    }
                }		
			}
        },
        onBrazilTenderOverviewPress: async function () {
            BusyIndicator.show(0);

			const oTenderOverviewObject = await this._createTenderOverviewModelStructure();
			Services.getFastAppDataModel().setProperty("/TenderOverview", oTenderOverviewObject);

			const oView = this.getView();

			// create TenderOverview dialog lazily
			if (!this.pTenderOverviewDialog) {

				this.pTenderOverviewDialog = Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.TenderOverviewDialog_BR",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					return oDialog;
				});

			}


			this.pTenderOverviewDialog.then(oDialog => oDialog.open() && BusyIndicator.hide());
        },
        _createTenderOverviewModelStructure: async function(){

			// get data
			const expandFields = "Product/PriceCondition,Distributor";
			const allTenderOffers = await this.getTenderOffers(expandFields);
			const allTenderProducts = await this.getTenderProducts(Services.getSelectedTenderID());
			const uniqueTenderProductCodes = Array.from(new Set(allTenderProducts.map(product => product.ProductCode)));

			// create rows
			const productTotalDiscounts = uniqueTenderProductCodes.map(productCode => {

				let row = allTenderOffers.map(offer => {
					const product = offer.Product.results.find(prd => prd.ProductCode === productCode);
					let totalDiscount = "NA";
					
                    // If product, Additional and Standart discounts exist take sum of two discounts
					if(product && product.PriceCondition.results.length > 0){
						const priceCondition = product.PriceCondition.results[0];
						totalDiscount = Number(priceCondition.AdditionalDiscount) + Number(priceCondition.StandardDiscount) + Number.EPSILON;
                        totalDiscount = totalDiscount == 0 ? "NA" : totalDiscount
					}
                    
                    // Add percent sign to totalDiscount
					return {
						value: totalDiscount
					};
				});

				row.forEach((item, index, arr) => {
					arr[index] = {
						value: item.value,
                        bSmallerDiscount: false
					}
				});


				// add product name at the beginning of the row
				const oProduct = allTenderProducts.find(prd => prd.ProductCode === productCode);

                //Check minimal discount in row items
                let discounts = row.map(prod => {
                   if (prod.value !== "NA")  return prod.value;
                });
                discounts = discounts.filter(discount => parseFloat(discount));
                
                // Check if product has totalDiscount take minimal discount
                // if discount is empty array Math.min() return infinity
                if (discounts.length > 0) {
                    let minDiscount = Math.min(...discounts); 
                    row.find(prod => {
                        if (prod.value == minDiscount) {
                            prod.bSmallerDiscount = true
                        }
                    })
                }
				row.unshift({
					value: oProduct.SKU.PRODUCTPACKNAME
				});

				return {
					product: productCode,
					totalDiscounts: row
				};
					
			});
			

			// adds an empty object at the beginning of the array before adding it to the model
			// first column must be empty
			allTenderOffers.unshift({}); 

			const oTenderOverview = {
				columns : allTenderOffers,
				rows    : productTotalDiscounts
			};

			return oTenderOverview;
		},
        onBrazilTenderOverviewDialogClose: function(){
			if(this.pTenderOverviewDialog){
				this.pTenderOverviewDialog.then( oDialog => oDialog.close());
			}
		},
        getTenderOffers: async function(sExpand) { 

			const { data: {results: offers} } = await Services.getOffers(Services.getSelectedTenderID(), Services.getSelectedCountry(), sExpand);

			return offers;
		},
        getTenderProducts: async function(sTenderID) { 

			const { data: {results: products} } = await Services.getTenderProducts(sTenderID);

			return products;
		},

        onSimulateTaxes: async function(oEvent) {
            const selectedConditionType = this.getSelectedPriceConditionTypes()[0];
            const selectedProductLotID = Services.getFastAppDataModel().getProperty("/EditSelectedProduct/LotID");
            const priceConditionBrazilView = Services.getFastAppDataModel().getProperty("/PriceConditionBrazilView");
            const selectedPriceCondition = priceConditionBrazilView.find(p => p.ProductCode == Services.getSelectedProductID() && p.ConditionType == selectedConditionType && p.LotID == selectedProductLotID);
            const body = {
                offerID: Services.getSelectedOfferID(), 
                productCode: Services.getSelectedProductID(), 
                lotID: selectedProductLotID, 
                conditionType: selectedConditionType,
                commercialProposal: (selectedPriceCondition.CommercialProposal)?.toString()
            };
            BusyIndicator.show();
            try {
                const result = await Services.simulateTaxes(body);
                selectedPriceCondition.NetPrice = result.data['_-BAY3_-8B_SD_RFC_TBN_CONTRACTFT.Response']['TT_CONTRACT_DETAILS']['item']["NET_VALUE"];
                selectedPriceCondition.ICMS = result.data['_-BAY3_-8B_SD_RFC_TBN_CONTRACTFT.Response']['TT_CONTRACT_DETAILS']['item']["TAX_AMOUNT"];
                selectedPriceCondition.Invoive = selectedPriceCondition.CommercialProposal;
                selectedPriceCondition.TaxEqualization = 0;
                Services.getFastAppDataModel().refresh()
            } catch (error) {
                const responseText = JSON.parse(error.responseText);
                sap.m.MessageBox.error("Tax simulation failed!", {
					title: "Error",
					details: responseText?.error?.message?.value,
					styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer"
				});
            } finally {
                BusyIndicator.hide();
            }
            
		}

    });
        
});