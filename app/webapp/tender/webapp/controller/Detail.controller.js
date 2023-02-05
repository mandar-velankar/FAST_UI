sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"../controller/OfferProducts",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/Dialog",
	"sap/ui/core/BusyIndicator",
	"sap/m/Label",
	"sap/ui/model/Sorter",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/utils/Formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/model/quotation",
	"FAST_NS0FAST0/model/financial",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Token",
	"sap/m/Tokenizer",
	"FAST_NS0FAST0/libs/ranking/Ranking",
	"sap/m/library",
	"com/bayer/tender/uilib/datatypes/PercentageType",
	"sap/m/MessageBox",
	"sap/m/library",
	"sap/ui/core/library"
], function (Controller, MessageToast, OfferProducts, Button, Text,  Dialog, BusyIndicator, Label, Sorter, formatter, Formatter, JSONModel,
	Fragment, Services,
	UserInfo, Quotation, Financial, Filter, FilterOperator, Token, Tokenizer, Ranking,mLib,PercentageType,MessageBox,mobileLibrary,coreLibrary) {
	"use strict";

	//global variable for the resource bundle - TODO not best practice
	var bundle; 
	var URLHelper = mLib.URLHelper;

	// shortcut for sap.m.ButtonType
	var ButtonType = mobileLibrary.ButtonType;

	// shortcut for sap.m.DialogType
	var DialogType = mobileLibrary.DialogType;

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	return Controller.extend("FAST_NS0FAST0.controller.Detail", {

		//GENERAL METHODS FOR ALL TABS/PAGES & SECTIONS
		//---------------------------------------------
		//Formatting functions
		formatter: formatter,
		types: {
			percent: PercentageType
		},


		//initialitation of the detail page
		onInit: function () {

			//get resource bundle for translations or texts
			this.oOwnerComponent = this.getOwnerComponent();
			bundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			//keep router and model locally in this controller
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();

			this.oDeliveryTrackingView = this.getView().byId("deliveryTrackingViewId");
			this.oDeliveryTrackingController = this.oDeliveryTrackingView.getController();
			
			Services.setRouterObject(this.oRouter);
            
			//TODO: talk about better solution with Wouter
			//Keep services object in Financial
			Financial.setServices(Services);

			//attach the onTenderMatched method to handle routing between pages + load correct data
			this.oRouter.getRoute("master").attachPatternMatched(this._onTenderMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onTenderMatched, this);
			
			jQuery.sap.require("sap.ui.model.json.JSONModel");
			var oDateModel = new sap.ui.model.json.JSONModel({
				minDate: new Date()
			});	
			this.getView().setModel(oDateModel, "dateModel");

			const oViewModel = new sap.ui.model.json.JSONModel({
				OfferProductsChannelWarningMessage: "",
				NotifyIbizWorkflowProductIDs:[],
				NotifyIbizDirectIndirect: null,
				NotifyIbizWorkflowID: null,
				BrazilContract: {}
			});	
			this.getView().setModel(oViewModel, "viewModel");

			this.accessModel = Services.getAccessModel();
			this.getView().setModel(this.accessModel, "access");
			// Responsibility Assignment Model - this model can be used to set the visibility of the controls for a specific country in the user interface
			/*this._oRaModel = new sap.ui.model.json.JSONModel({
				visibleCountry: ""
			});	
			this.getView().setModel(this._oRaModel, "raModel");*/
			
			Services.getFastAppDataModel().setProperty("/CreateContractButtonEnabled_BR", false);
		},

		_FOCProdBund1UpdateFinished: function () {
			return false;
		},

		//Go to sharepoint folder
		_onFolderButtonPress: function (oEvent) {
            const sDownloadButtonUrl = Services.getFastAppDataModel().getProperty('/appConfig')?.find(config => config.Control === 'DocumentButton');
			var url = sDownloadButtonUrl ? sDownloadButtonUrl.URL + '$CountryCode/$TenderId' : "https://bayergroup.sharepoint.com/:f:/r/sites/FASTSystem/Shared%20Documents/Documents_Library/Countries/$CountryCode/$TenderId";
			var countryCode = Services.getCountryCodeofSelectedTender();
			var tenderId = Services.getSelectedTenderID();
			url = url.replace("$CountryCode", countryCode);
			url = url.replace("$TenderId", tenderId);
			window.open(url);
		},

		//Navigation between TenderMaster & Detail pages routing is matched
		_onTenderMatched: function (oEvent) {

			//keep this as that
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();
			
			/*
			//default model keep in service file, if URL routing straight to detail... (for example sending somebody an url to check specific offer)
			if (!Services.getDefaultModel()){
				//this.getView().getModel("fastData").refresh(true);
				Services.setDefaultModel(this.getView().getModel("fastData"));
			} else {
				//Services.getDefaultModel().refresh(true);
			}
			*/

			// hide country specific fields
			//this._initializeCountrySpecificFields();

			//get the tenderID/country from the navigation parameters
			var sTenderID = oEvent.getParameter("arguments").tender;
			var sCountry = Services.getSelectedCountry() || oEvent.getParameter("arguments").country || "NA"; // if country is found in the link.. use NA
			var sOfferID = oEvent.getParameter("arguments").offer;
			var sTab = oEvent.getParameter("arguments").tab || Services.getBasicInformationPageSectionID();
			var sLayout = oEvent.getParameter("arguments").layout;
			var bSamePage = oEvent.getParameter("arguments").samePage || false; //on enter or exit fullscreen, we stay on same page so nothing need to happen
			var oObjectPage = that.getView().byId("DetailPage");
			//var oOffer = Services.getLoadedOffer(Services.getSelectedOfferID());

			that._country = sCountry;

			// set CurrentOfferStatus
			oFastAppDataModel.setProperty("/CurrentOfferStatus", Services.getCurrentOfferStatus(sTenderID, sOfferID));
			// set the visible country
			/*this._oRaModel.setProperty("/visibleCountry", sCountry);*/

			//keep layout and bind it to the view, so we can show, hide elements based on layout (onecolumn, twocolumn, ....)
			//to use for hiding or display certain fields
			oFastAppDataModel.setProperty("/LayoutType", sLayout);
			Services.setLayoutType(sLayout);

			Services.setSelectedTab(sTab);

			//build tender path
			var sTenderPath = "";
			if (sTenderID) {
				//example: PT_TMTEND(TenderID='SA-100-TEST-AH',Active=1)
				sTenderPath = "/PT_TMTEND('" + sTenderID + "')";
			} else {
				sTenderPath = "/PT_TMTEND";
			}

			//keep selected tender + tender path & countrycode
			Services.setSelectedTenderPath(sTenderPath);
			Services.setSelectedTenderID(sTenderID);
			Services.setSelectedCountry(sCountry);
			Services.setSelectedOfferID(sOfferID);
			Services.loadMandatoryFields(sCountry); // todo: add this function to loadCountryPermissions and remove it
			
			//Services.loadCountryPermissions(sCountry);
			$.when(Quotation.loadTenderBankGuarantee(sTenderID)).done(function (oData) {
				// TODO:
			});

			//bind data from model to view (=tender info) (expand institute so its still shown)
			if (sTenderPath !== "/PT_TMTEND('1')") {
				that.getView().bindElement({
					path: sTenderPath,
					model: "fastData",
					groupId: "Detail-onTenderMatched-PT_TMTEND", //this avoids failing on this binding will also fail the following services.calls
					parameters: {
						expand: "Institute,Origin"
					}
				});
			}else{
				oFastAppDataModel.setProperty("/CountrySpecificTenderInformation", {});
			}

			//handle full screen buttons depending on layout 
			//TODO the symantic helper class exists for this usecase, as long as you keep to the standard we can use it in the same way https://sapui5.hana.ondemand.com/#/topic/933965ba8c0440308e1e3233be7bc52f.html
			if (oEvent.getParameter("arguments").layout === "MidColumnFullScreen") {
				that.getView().byId("enterFullScreenButton").setVisible(false);
				that.getView().byId("exitFullScreenButton").setVisible(true);

			} else if (oEvent.getParameter("arguments").layout === "TwoColumnsMidExpanded") {
				that.getView().byId("exitFullScreenButton").setVisible(false);
				that.getView().byId("enterFullScreenButton").setVisible(true);
			}

			//when we enter or exit fullscreen for a page, we stay on the same page so nothing needs to be reloaded, only view layout changes
			if (!bSamePage) {

				//build image model to show images on the view (binding the source)
				var oRootPath = jQuery.sap.getModulePath("FAST_NS0FAST0.images");
				var oImageModel = new sap.ui.model.json.JSONModel({
					path: oRootPath
				});
				that.getView().setModel(oImageModel, "imageModel");

				//refresh data of main model fastData, good to do when somebody changed data in the back (while you already opened this tender)
				that.getView().getModel("fastData").refresh(true);

				//check if we are in creation modus of new tender & expanded the view so we come again to onRouteMatched
				var sNewTenderNo = Services.getNewTenderNo();

				that.reloadCountrySpecificData(sCountry);


				//when a new tender is created, the tender ID = 1 // or we are creating a new tender
				if (sTenderPath === "/PT_TMTEND('1')" || sNewTenderNo) {

					//new tender = show basic info edit screen & make ready to save new tender
					that._NewTenderMatched(that);
					var oObjectPage = that.getView().byId("DetailPage");
					//bar with tabs is not shown
					oObjectPage.setShowAnchorBar(false);

				} else if (sTenderPath === "/PT_TMTEND") {

					//When detail screen is closed, we go back to the Tender master screen with all the tenders
					//Footer with accept/reject button are no longer displayed
					that.getView().byId("DetailPage").setShowFooter(true);
					//Bar with tabs is shown
					oObjectPage.setShowAnchorBar(true);
					Services.setEditMode(false);

				} else {

					//existing tender = show basic info in display screen
					that._ExistingTenderMatched(that, sTab);
					//bar with tabs is shown
					oObjectPage.setShowAnchorBar(true);
					//init selected section (tab) (for if we navigate directly to a specific tab)
					//that._initSection(sTab);
				}
			}

		},

		getClassificationId: async function(){ 

			let classificationId = this.getView().byId("idClassification") && this.getView().byId("idClassification").getSelectedItem() && this.getView().byId("idClassification").getSelectedItem().data("classificationId");

			if(!classificationId){

				let classification = this.getView().byId("idClassificationDisplay") && this.getView().byId("idClassificationDisplay").getValue();
				let countryClassifications = Services.getFastAppDataModel().getProperty("/CountryClassifications");

				if(!countryClassifications){
					countryClassifications = await Services.loadCountryClassifications(Services.getSelectedCountry());
				}

				let classificationObj = countryClassifications.filter(item => item.CLASSIFICATION === classification);

				classificationId = classificationObj && classificationObj.length > 0 ? classificationObj[0].ID : undefined;

			}

			return classificationId;
		},

		/**
		 * @return {String} Returns BiddingTypeLevel1Id from FastAppDataModel
		 */
		getBiddingTypeLevel1Id: async function(){ 

			const biddingTypeLevel1Txt = this.getView().byId("idBiddingTypeLevel1Display") && this.getView().byId("idBiddingTypeLevel1Display").getValue();
			let aCountryBiddingTypeLevel1 = Services.getFastAppDataModel().getProperty("/CountryBiddingTypeLevel1");

			if(!aCountryBiddingTypeLevel1){
				const sClassificationId = await this.getClassificationId();
				aCountryBiddingTypeLevel1 = await Services.loadCountryBiddingTypeLevel1(Services.getSelectedCountry(), sClassificationId);
			}

			const biddingTypeLevel1IdFilter = aCountryBiddingTypeLevel1 && aCountryBiddingTypeLevel1.filter(item => item.Name && item.Name.indexOf(biddingTypeLevel1Txt) > -1 );

			const biddingTypeLevel1Id =  biddingTypeLevel1IdFilter && biddingTypeLevel1IdFilter instanceof Array && biddingTypeLevel1IdFilter.length > 0 && biddingTypeLevel1IdFilter[0].ID || undefined;

			return biddingTypeLevel1Id;
		},
	//EHQUT-199069-Italy – Competitor results not linked to Bayer products/offers
	onAddCompetitorProduct: function (oEvent) {

		//get model & selected row
		var oFastAppDataModel = Services.getFastAppDataModel();
		var oNewAwardedProduct = Services.getService('Product').getEmptyProductResult();
		var Resulttree=oFastAppDataModel.getProperty("/ResultsForTree");
		
		var oProductResult = {
			OFFERID: oFastAppDataModel.oData.SelectedOfferID,
			PRODUCTCODE: null,
			PRODUCT:'Other',
			ERRORINSUBMISSION: null,
			OUTCOME: null,
			UOM: null,
			AWARDEDQTY: null,
			REASON: null,
			COMMENT: null,
			AWARDEDCOMPANY: null,
			AWARDEDPRICE: null,
			CURRENCY: null,
			OutcomeLevel: null,
			APPEAL: null,
			INFONEEDED: null,                                                
			_sOperation: "POST"
		};
		oNewAwardedProduct.PRODUCT='Other';
		oNewAwardedProduct.OFFERID=oFastAppDataModel.oData.SelectedOfferID;
		Resulttree.push(oNewAwardedProduct);
		oFastAppDataModel.setProperty("/ResultsForTree", Resulttree);
	
	},

		/**
		 * @return {String} Returns biddingTypeLevel2Id from FastAppDataModel
		 */
		getBiddingTypeLevel2Id: function(){

			const biddingTypeLevel2Txt = this.getView().byId("idBiddingTypeLevel2Display") && this.getView().byId("idBiddingTypeLevel2Display").getValue();
			const aCountryBiddingTypeLevel2 = Services.getFastAppDataModel().getProperty("/CountryBiddingTypeLevel2");

			const biddingTypeLevel2IdFilter = aCountryBiddingTypeLevel2 && aCountryBiddingTypeLevel2.filter(item => item.Name && item.Name.indexOf(biddingTypeLevel2Txt) > -1 );

			const biddingTypeLevel2Id =  biddingTypeLevel2IdFilter && biddingTypeLevel2IdFilter instanceof Array && biddingTypeLevel2IdFilter.length > 0 && biddingTypeLevel2IdFilter[0].ID || undefined;

			return biddingTypeLevel2Id;
		},

		

		//on new tender matched
		_NewTenderMatched: function (oDetailController) {

			//fastappdata model
			var oFastAppDataModel = Services.getFastAppDataModel();

			//get the tender id from the screen beceause it might not be created yet
			var sTenderID = oDetailController.getView().byId("tenderId").getProperty("text");
			Services.setSelectedTenderID(sTenderID);

			//CurrentTender on FASTAPPDATA model for easy access, so we can move step by step to FastAppData model binding on basic information tab TODO currently we only use the dates in this way, we should use all fields in this way
			var oTenderNew = Services.getService('Tender').getEmptyTender();
            oTenderNew.CountryCode = Services.getSelectedCountry();
			oFastAppDataModel.setProperty("/EditTender/", oTenderNew);

			//new tender --> = show edit mode with corresponding fragment
			oDetailController._showSubSectionFragment("BasicInformationEdit", "basicInformationSubSectionId");

			//if new Tender is created, the following fields are editable
			oDetailController.getView().byId("idClassification").setEnabled(true);
			oDetailController.getView().byId("idInstituteType").setEnabled(true);
			oDetailController.getView().byId("idInstituteName").setEnabled(true);

			if(Services.getSelectedCountry() === 'CL' || Services.getSelectedCountry() === 'ES'){
				oDetailController.getView().byId("idTenderChannel").setSelectedKey("Direct");
				oDetailController.getView().byId("idTenderChannel").setEnabled(false);
			} else {
				oDetailController.getView().byId("idTenderChannel").setEnabled(true);
			}
			oDetailController.getView().byId("idGroupPurchasingEdit").setEnabled(true);

			// hide country specific fields
			this._initializeCountrySpecificFields();

			var oSalesType = this.getView().byId("idSelectSalesTypeEdit");
			var oTenderOrigin = this.getView().byId("idSelectTenderOriginEdit");
			var oTenderType = this.getView().byId("idSelectTenderTypeEdit");
			var oTenderType2 = this.getView().byId("idSelectTenderType2Edit");
            var oContentEdit = this.getView().byId("idContentEdit");
            var oPortalEdit = this.getView().byId("idPortalEdit");
            var oInstCode = this.getView().byId("idInstituteCode");
            var oInstProvince = this.getView().byId("idInstituteProvince");
            var oInstPoblacion = this.getView().byId("idInstitutePoblacion");
            var oInstCifCode = this.getView().byId("idInstituteCifCode");
            var oRegHealthSystem = this.getView().byId("idRegionalHealthSystem");
			var oContractType = this.getView().byId("idSelectContractTypeEdit");
			let oProcurementMethod = this.getView().byId("idSelectProcurementMethodEdit");
			let sInstituteType = Services.getFastAppDataModel().getProperty('/Tender/Institute/InstituteType');
            
			var sCountryCode = Services.getSelectedCountry();
			var aFilter = [];
			aFilter.push(new Filter("COUNTRY_CODE", FilterOperator.EQ, sCountryCode));

			let oProducrementReason = oDetailController.getView().byId("idProcurementReasonEdit");

			// apply country filter 
			this.setCountrySpecificDropDowns(aFilter);

			oProcurementMethod = oDetailController.getView().byId("idSelectProcurementMethodEdit");
			oProducrementReason = oDetailController.getView().byId("idProcurementReasonEdit");
			oProcurementMethod.bindItems({
				path: "fastData>/CountryProcurementMethod",
				filters: aFilter,
				sorter: new sap.ui.model.Sorter("SORTER"),
				template: new sap.ui.core.Item({
					text: "{fastData>PROCUREMENT_METHOD_ID}",
					key: "{fastData>PROCUREMENT_METHOD_ID}"
				})
			});

			//should salestype be visible on the screen based on data back-end
			$.when(Services.checkShowSalesType()).done(function (bShowSalesType) {
				oSalesType.setVisible(bShowSalesType);

				// TODO: check why "idClassification" is set back to visible after  checkShowSalesType()
				// Settings for Italy 
				if(Services.getSelectedCountry() === 'IT' || Services.getSelectedCountry() === 'ES'){
					Services.getWordTemplates(Services.getSelectedCountry());
					//oDetailController.getView().byId("idClassification").setVisible(false);
					oDetailController.getView().byId("idTenderChannel").setVisible(false);
				}
			});

			//should tendertype be visible on the screen based on data back-end
			$.when(Services.checkShowTenderType(oTenderNew.Classification)).done(function (bShowTenderType) {
				oTenderType.setVisible(bShowTenderType);	
				if(Services.getSelectedCountry() === 'CL' && sInstituteType === 'Cenabast'){
					oTenderType.setVisible(true);                
				}else{
					oTenderType.setVisible(bShowTenderType);
				}
			});

            //should tendertype2 be visible on the screen based on data back-end
			$.when(Services.checkShowTenderType2(oTenderNew.Classification)).done(function (bShowTenderType) {             
				    oTenderType2.setVisible(bShowTenderType);
			});

            //should contentEdit be visible on the screen based on data back-end
			if(Services.getSelectedCountry() === 'ES'){
				oContentEdit.setVisible(true);
                oPortalEdit.setVisible(true);
                oInstCode.setVisible(true);
                oInstPoblacion.setVisible(true);
                oInstProvince.setVisible(true);
                oInstCifCode.setVisible(true);
                oRegHealthSystem.setVisible(true);
			};

			//should tenderorigin be visible on the screen based on data back-end
			$.when(Services.checkShowTenderOrigin()).done(function (bShowTenderOrigin) {
				oTenderOrigin.setVisible(bShowTenderOrigin);
			});

			//should ContractType be visible on the screen based on data back-end
			$.when(Services.checkShowContractType()).done(function (bShowContractType) {
				oContractType.setVisible(bShowContractType);
			});

			//should ContractType be visible on the screen based on data back-end
			$.when(Services.checkShowProcurementMethod()).done(function (bShowProcurementMethod) {
				oProcurementMethod.setVisible(bShowProcurementMethod);
			});
			// Dunno why but binding not always found
			// var oBinding = oTenderType.getBinding("items");
			// //set filter for country on tender type: only when binding of tendertype is found
			// if(oBinding){
			// 	oBinding.filter(aFilter);
			// }

			
			oTenderType.setEnabled(true);
            oTenderType2.setEnabled(true);
            oContentEdit.setEnabled(true);
            oPortalEdit.setEnabled(true);

			//Mexico
			oSalesType.setEnabled(true);
			oTenderOrigin.setEnabled(true);
			oContractType.setEnabled(true);

			//Thailand
			oProcurementMethod.setEnabled(true);
			oProducrementReason.setEnabled(true);
            // Thailand word templates 
            if (Services.getSelectedCountry() === "TH" || Services.getSelectedCountry() === "BR"){
                Services.getWordTemplates(Services.getSelectedCountry());
            }

			//Keep track that we are in change modus
			Services.setEditMode(true);

			//this way we can use a seperate layer, adding deleting... and afterords saving
			var oFastAppDataModel = Services.getFastAppDataModel();
			oDetailController.getView().setModel(oFastAppDataModel, "fastAppData");

			//set new tender ID 
			$.when(Services.loadNewTenderID()).done(function (sNewTenderID) {
				//keep idNewTenderID (TODO: should we not use setSelectedTenderID for this? delete field)
				oDetailController.getView().byId("idNewTenderID").setValue(sNewTenderID);
			});

			//Does the table with award criteria exist on the page? 
			//idAwrdEdit = the award criteria table found in BasicInformationEdit fragment
			if (oDetailController.byId("idAwrdEdit")) {

				//Bind model for the award criteria
				var sPath = "/PT_TMAWRDCR"; //award criteria table
				var AwardModel = new sap.ui.model.json.JSONModel();

				//filters used in the award critiria call
				var aFilters = [];
				aFilters.push(new sap.ui.model.Filter("TENDERID", sap.ui.model.FilterOperator.EQ, sTenderID));
				aFilters.push(new sap.ui.model.Filter("Active", sap.ui.model.FilterOperator.EQ, 1));
				var oModel = oDetailController.getOwnerComponent().getModel("fastData");

				//Reading the back end data from the award critiria TODO this should be in the service file
				oModel.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {
						//data received is set to the award model
						AwardModel.setData({
							Data: oData.results
						});
						oDetailController.getView().setModel(AwardModel, "tabModel");
						// oDetailController.byId("awardCriteriaId").setModel(AwardModel, "tabModel");
						oDetailController.byId("idAwrdEdit").setModel(AwardModel, "tabModel"); //TODO tabModel = awardCriteria model? Use better name?
					},
					error: function (oError) {
						Services.showErrorMessage(oError, "Loading award criteria");
					}
				});

			}

			//TODO is there no better way for not overloading the detail screen- same approach for all tabs
			//show fragment for TAB: Offer products
			oDetailController._showSectionFragment("OfferProductsView", "offerProductsId");

			//show fragment for TAB: Financial Offer
			oDetailController._showSectionFragment("FinancialOfferView", "financialOfferId");

			//show fragment for TAB: Quotation
			oDetailController._showSectionFragment(oFastAppDataModel.getProperty('/permissions/fragments/quotationViewId/fragment'), "quotationId");

			//show footer with accept/reject button (this is not shown on the Tender master screen)
			oDetailController.getView().byId("DetailPage").setShowFooter(true);
			Services.setEditMode(true);

			//disable buttons when creating new tender
			//oDetailController.getView().byId("deleteButtonId").setVisible(false);//must be removed as button no longer exists
			oDetailController.getView().byId("editButtonId").setEnabled(false);
			oDetailController.getView().byId("cloneButtonId").setEnabled(false);

			// for Italy the clone button is not visible
			if(this._country === 'IT' || this._country === 'ES' || this._country === 'BR'){
				oDetailController.getView().byId("cloneButtonId").setVisible(false);
			}

			oDetailController.getView().byId("deleteTenderButtonId").setEnabled(false);

			// oDetailController.getView().byId("DetailPage").setShowAnchorBar(false);

			//Default basic information tab is shown + subsection
			oDetailController.byId("DetailPage").setSelectedSection(Services.getBasicInformationPageSectionID());
			oDetailController.getView().byId(Services.getBasicInformationPageSectionID()).setSelectedSubSection(Services.getBasicInformationPageSubSectionID());

		},

		/**
		 * Set the Country specific dropdown fields on the Basic information tab based upon selected Country
		 */
		setCountrySpecificDropDowns: function(aFilter){

			//apply country filter on tender type
			var oTenderType = this.getView().byId("idSelectTenderTypeEdit") || this.getView().byId("idSelectTenderType");

			if(oTenderType){
				oTenderType.bindItems({
					path: "fastData>/CountryTenderType",
					filters: aFilter,
					parameters: {
						"expand": "TenderType"
					},
					template: new sap.ui.core.Item({
						text: "{fastData>TenderType/NAME}",
						key: "{fastData>TenderType/ID}"
					})
				});
			}

            //apply country filter on tender type 2
			var oTenderType = this.getView().byId("idSelectTenderType2Edit") || this.getView().byId("idSelectTenderType2");

			if(oTenderType){
				oTenderType.bindItems({
					path: "fastData>/CountryTenderType2",
					filters: aFilter,
					parameters: {
						"expand": "TenderType"
					},
					template: new sap.ui.core.Item({
						text: "{fastData>TenderType/NAME}",
						key: "{fastData>TenderType/ID}"
					})
				});
			}

			//Mexico changes
			//apply country filter on sales type
			var oSalesType = this.getView().byId("idSelectSalesTypeEdit") || this.getView().byId("idSelectSalesType");

			if(oSalesType){
				oSalesType.bindItems({
					path: "fastData>/CountrySalesType",
					filters: aFilter,
					parameters: {
						"expand": "SalesType"
					},
					template: new sap.ui.core.Item({
						text: "{fastData>SalesType/NAME}",
						key: "{fastData>SalesType/ID}"
					})
				});
			}
			

			//apply country filter on tender origin
			var oTenderOrigin = this.getView().byId("idSelectTenderOriginEdit") || this.getView().byId("idSelectTenderOrigin");

			if(oTenderOrigin){
				oTenderOrigin.bindItems({
					path: "fastData>/CountryTenderOrigin",
					filters: aFilter,
					parameters: {
						"expand": "TenderOrigin"
					},
					template: new sap.ui.core.Item({
						text: "{fastData>TenderOrigin/NAME}",
						key: "{fastData>TenderOrigin/ID}"
					})
				});
			}
			

			//apply country filter on contract type
			var oContractType = this.getView().byId("idSelectContractTypeEdit") || this.getView().byId("idSelectContractType");

			if(oContractType){
				oContractType.bindItems({
					path: "fastData>/CountryContractType",
					filters: aFilter,
					parameters: {
						"expand": "ContractType"
					},
					template: new sap.ui.core.Item({
						text: "{fastData>ContractType/NAME}",
						key: "{fastData>ContractType/ID}"
					})
				});
			}
			
			
			let oProcurementMethod = this.getView().byId("idSelectProcurementMethodEdit") || this.getView().byId("idSelectProcurementMethod");

			if(oProcurementMethod){
				oProcurementMethod.bindItems({
					path: "fastData>/CountryProcurementMethod",
					filters: aFilter,
					template: new sap.ui.core.Item({
						text: "{fastData>PROCUREMENT_METHOD_ID}",
						key: "{fastData>PROCUREMENT_METHOD_ID}"
					})
				});
			}
			
			
		},

		//existing tender matched
		_ExistingTenderMatched: function (oDetailController, sTab) {

			//get selected Tender Path
			var that = this;
			var sTenderID = Services.getSelectedTenderID();
			var oOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
			let sInstituteType = Services.getFastAppDataModel().getProperty('/Tender/Institute/InstituteType');
			//var sOfferID  = Services.getSelectedOfferID();

			//if tender is already loaded, we will not load data again (refresh should be done after saving)
			var bLoadedCheck = true;

			//In this case we have selected a tender, we will load all data from the database
			$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

				//this way we can use a seperate layer, adding deleting... and afterords saving
				var oFastAppDataModel = Services.getFastAppDataModel();
				oDetailController.getView().setModel(oFastAppDataModel, "fastAppData");

				//get loaded tender & bind it for easy access
				var oTender = Services.getLoadedTender();
				oFastAppDataModel.setProperty("/EditTender/", oTender);

				//should tendertype be visible on the basic info screen?
				$.when(Services.checkShowTenderType(oTender.Classification)).done(function (bShowTenderType) {
					if(Services.getSelectedCountry() === 'CL' && sInstituteType === 'Cenabast'){
						oDetailController.getView().byId("idSelectTenderType").setVisible(true);
					}else{
						oDetailController.getView().byId("idSelectTenderType").setVisible(bShowTenderType);
					}
				});

                //should tendertype be visible on the basic info screen?
				$.when(Services.checkShowTenderType2(oTender.Classification)).done(function (bShowTenderType) {
					oDetailController.getView().byId("idSelectTenderType2").setVisible(bShowTenderType);
				});

				/* Mexico */
				//should tenderorigin be visible on the basic info screen?
				$.when(Services.checkShowTenderOrigin()).done(function (bShowTenderOrigin) {
					oDetailController.getView().byId("idSelectTenderOrigin").setVisible(bShowTenderOrigin);
				});

				//should salestype be visible on the basic info screen?
				$.when(Services.checkShowSalesType()).done(function (bShowSalesType) {
					oDetailController.getView().byId("idSelectSalesType").setVisible(bShowSalesType);
				});

				//should salestype be visible on the basic info screen?
				$.when(Services.checkShowContractType()).done(function (bShowContractType) {
					oDetailController.getView().byId("idSelectContractType").setVisible(bShowContractType);
				});
				/* End of MExico */

				/* Thailand */
				$.when(Services.checkShowProcurementMethod()).done(function (bShowProcurementMethod) {
					oDetailController.getView().byId("idSelectProcurementMethod").setVisible(bShowProcurementMethod);
				});
				/* End of Thailand */

				//should group purchasing be visible on the screen based on data back-end
				$.when(Services.checkInstituteChilderen(oTender.CountryCode)).done(function (bShowGroupPurchasing) {
					oDetailController.getView().byId("idGroupPurchasing")?.setVisible(bShowGroupPurchasing);
				});


				// this sets the Specifications dropdown
				oDetailController.setTenderSpecificationsSelectedKeys(sTenderID);

				
				// Italy  & spain
				if (Services.getSelectedCountry() === "IT" || Services.getSelectedCountry() === "ES"){
					Services.getWordTemplates(Services.getSelectedCountry());
					that.getTenderRegions(sTenderID).then(response => {

                        const oRegionView = that.byId("idRegionView");
                        let sFilterValue = Services.getSelectedCountry();
                        let oBinding = oRegionView.getBinding("items");
                        let aFilters = [];

                        if (sFilterValue){
                            aFilters.push( new Filter("CountryCode", 'EQ', sFilterValue) );
                        }

                        oBinding?.filter(aFilters);

                        const tenderArray = response.data.results.filter(tender => tender.TenderID === Services.getSelectedTenderID());
                        let regionIDs = [];
                        if(tenderArray.length !== 0){
                            regionIDs = tenderArray[0].Regions.results.map(region => region.RegionID);                            
                        }
						oRegionView.setSelectedKeys(regionIDs);
						that.byId("idTenderChannel") && that.byId("idTenderChannel").setVisible(false);

					})
				}

                // Thailand word templates 
				if (Services.getSelectedCountry() === "TH" || Services.getSelectedCountry() === "BR"){
					Services.getWordTemplates(Services.getSelectedCountry());
                }
			

				//vanaf hier 

				//Keep track that we are in display modus
				Services.setEditMode(false);

				//existing tender --> = show display mode for BasicInformation view
				oDetailController._showSubSectionFragment("BasicInformationView", "basicInformationSubSectionId");

				//if awardCriteria exists on the basic information tab
				if (oDetailController.byId("awardCriteriaId")) {

					//Bind model for the award criteria
					var sPath = "/PT_TMAWRDCR"; //table with award criteria
					var oAwardModel = new sap.ui.model.json.JSONModel();

					//filters used in the award critiria call
					var aFilters = [];
					aFilters.push(new sap.ui.model.Filter("TENDERID", sap.ui.model.FilterOperator.EQ, sTenderID));
					aFilters.push(new sap.ui.model.Filter("Active", sap.ui.model.FilterOperator.EQ, 1));
					var oDefaultModel = oDetailController.getOwnerComponent().getModel("fastData");

					//Reading the back end data from the award critiria TODO this should be in the service file
					oDefaultModel.read(sPath, {
						filters: aFilters,
						success: function (oData, oResponse) {
							oAwardModel.setData({
								Data: oData.results
							});
							oDetailController.getView().setModel(oAwardModel, "tabModel");
							oDetailController.byId("awardCriteriaId").setModel(oAwardModel, "tabModel");
						},
						error: function (oError) {
							Services.showErrorMessage(oError, "Loading award criteria");
						}
					});

				}

				//TODO is there no better way for not overloading the detail screen- same approach for all tabs
				//show fragment for TAB: Offer products				
				oDetailController._showSectionFragment("OfferProductsView", "offerProductsId");

				//show fragment for TAB: FinancialOffer
				oDetailController._showSectionFragment("FinancialOfferView", "financialOfferId");

					
				//show fragment for TAB: Quotation
				oDetailController._showSectionFragment(oFastAppDataModel.getProperty('/permissions/fragments/quotationViewId/fragment'), "quotationId");

				//show footer with accept/reject button (this is not shown on the Tender master screen)
				oDetailController.getView().byId("DetailPage").setShowFooter(false);
				Services.setEditMode(false);

				//make buttons visible when selected existing tender
				oDetailController.getView().byId("editButtonId").setVisible(true);
				/*if( Services.getLoadedOffer(Services.getSelectedOfferID()) && (Services.getLoadedOffer(Services.getSelectedOfferID()).Active !== 1 || Services.getLoadedOffer(Services.getSelectedOfferID()).ActiveOffer !== 1)){*/
				//EITOG-217330-Only to view commercial offers, NOT to modify
				if (oOffer && (oOffer.Active !== 1 || oOffer.ActiveOffer !== 1)) {
					oDetailController.getView().byId("editButtonId").setEnabled(false);
				} else if(oDetailController.accessModel.oData.tenderAccess.SPAINTENDERVIEW === true){
					oDetailController.getView().byId("editButtonId").setEnabled(false);
				}else{
					oDetailController.getView().byId("editButtonId").setEnabled(true);
				}

				// for Italy the clone button is not visible
				if(oDetailController._country === 'IT' || oDetailController._country === 'ES' || oDetailController._country === 'BR'){
					oDetailController.getView().byId("cloneButtonId").setVisible(false);
				}else {
					oDetailController.getView().byId("cloneButtonId").setVisible(true);
					oDetailController.getView().byId("cloneButtonId").setEnabled(true);
				}
				//EITOG-217330-Only to view commercial offers, NOT to modify
				if(oDetailController.accessModel.oData.tenderAccess.SPAINTENDERVIEW === true){
					oDetailController.getView().byId("deleteTenderButtonId").setEnabled(false);
				}else{
					oDetailController.getView().byId("deleteTenderButtonId").setEnabled(true);
				}
				

				if (!sTab || sTab === Services.getBasicInformationPageSectionID()) {
					//Default basic information tab is shown
					oDetailController.byId("DetailPage").setSelectedSection(Services.getBasicInformationPageSectionID());
					oDetailController.getView().byId(Services.getBasicInformationPageSectionID()).setSelectedSubSection(Services.getBasicInformationPageSubSectionID());
				} else {
					//Show selected section
					oDetailController.byId("DetailPage").setSelectedSection(sTab);

				}

				//keep offer selected
				//Services.setSelectedOfferID(sOfferID);

				//init selected section (tab) + select selected offer again (for if we navigate directly to a specific tab)
				//check on binding finished
				oDetailController._initSection(sTab);

			});

		},


		/**
		 * Fetches the Specifications from the banck-end and sets them as selected keys on
		 * ComboBoxes in BasicInformationView and BasicInformationEdit
		 * @param {ID} sTenderID 
		 */
		setTenderSpecificationsSelectedKeys: async function(sTenderID){
	
			const tenderSpecifications = await Services.getService('Specification').getSpecificationsForTender(sTenderID);
			const selectedKeys = tenderSpecifications && tenderSpecifications.data.results.map(item => item.Name);
			const oSpecificationsComboBox = this.byId("idSpecifications");
			const oSpecificationsDisplayComboBox = this.byId("idSpecificationsDisplay");
			const oSpecificationsDisplayComboBoxQuot = this.byId("idSpecificationsDisplayQuotation");

			// if there are no Specifications then they should not be displayed.
			if(!selectedKeys || selectedKeys.length <= 0){
				oSpecificationsComboBox && oSpecificationsComboBox.setVisible(false);
				oSpecificationsDisplayComboBox && oSpecificationsDisplayComboBox.setVisible(false);
				oSpecificationsDisplayComboBoxQuot && oSpecificationsDisplayComboBoxQuot.setVisible(false);
			}

			oSpecificationsComboBox && oSpecificationsComboBox.setSelectedKeys(selectedKeys);
			oSpecificationsDisplayComboBox && oSpecificationsDisplayComboBox.setSelectedKeys(selectedKeys);
			oSpecificationsDisplayComboBoxQuot && oSpecificationsDisplayComboBoxQuot.setSelectedKeys(selectedKeys);
		},

		/**
		 * Sets the selected key for BiddingTypeLevel1 on BasicInformationEdit page
		 */
		setTenderBiddingTypeLevel1SelectedKey: async function(){

			const oBiddingTypeLevel1ComboBox = this.byId("idBiddingTypeLevel1"); 

			if(oBiddingTypeLevel1ComboBox){
				oBiddingTypeLevel1ComboBox.setBusy(true);

				const sCountry = Services.getSelectedCountry();
				const sClassificationId = await this.getClassificationId();
				const oBiddingTypeLevel1DisplayInput = this.getView().byId("idBiddingTypeLevel1Display");
				const sBiddingTypeLevel1Txt = oBiddingTypeLevel1DisplayInput && oBiddingTypeLevel1DisplayInput.getValue();
	
				const aTenderBiddingTypeLevel1 = await Services.loadCountryBiddingTypeLevel1(sCountry, sClassificationId);
				const oTenderBiddingTypeLevel1 = aTenderBiddingTypeLevel1 && aTenderBiddingTypeLevel1.filter(item => item.Name && item.Name.indexOf(sBiddingTypeLevel1Txt) > -1);
	
				const selectedKey = oTenderBiddingTypeLevel1 && oTenderBiddingTypeLevel1.length >0 && oTenderBiddingTypeLevel1[0].Name || undefined;
	
				oBiddingTypeLevel1ComboBox.setBusy(false);
	
				return selectedKey && oBiddingTypeLevel1ComboBox.setSelectedKey(selectedKey);
			}

			return undefined;
			
		},

		/**
		 * Sets the selected key for BiddingTypeLevel2 on BasicInformationEdit page
		 */
		setTenderBiddingTypeLevel2SelectedKey: async function(){

			const oBiddingTypeLevel2ComboBox = this.byId("idBiddingTypeLevel2");

			if(oBiddingTypeLevel2ComboBox){
				oBiddingTypeLevel2ComboBox.setBusy(true);
			
				const oBiddingTypeLevel2DisplayInput = this.getView().byId("idBiddingTypeLevel2Display");
				const sBiddingTypeLevel2Txt = oBiddingTypeLevel2DisplayInput && oBiddingTypeLevel2DisplayInput.getValue();

				// if BiddingTypeLevel2 did not have a value on the display page, it means that it was not set and therefore should not be displayed.
				if(!sBiddingTypeLevel2Txt){
					oBiddingTypeLevel2ComboBox.setVisible(false);
					oBiddingTypeLevel2ComboBox.setBusy(false);
					return;
				}

				const sCountry = Services.getSelectedCountry();
				const sBiddingTypeLevel1Id = await this.getBiddingTypeLevel1Id();
				
				const aTenderBiddingTypeLevel2 = await Services.loadCountryBiddingTypeLevel2(sCountry, sBiddingTypeLevel1Id);
				const oTenderBiddingTypeLevel2 = aTenderBiddingTypeLevel2 && aTenderBiddingTypeLevel2.filter(item => item.Name && item.Name.indexOf(sBiddingTypeLevel2Txt) > -1);

				const selectedKey = oTenderBiddingTypeLevel2 && oTenderBiddingTypeLevel2.length > 0 && oTenderBiddingTypeLevel2[0].Name || undefined;

				oBiddingTypeLevel2ComboBox.setBusy(false);

				return selectedKey && oBiddingTypeLevel2ComboBox.setSelectedKey(selectedKey);
			}

			return undefined;
			
		},

		/**
		 * Sets the selected key for BiddingTypeLevel3 on BasicInformationEdit page
		 */
		setTenderBiddingTypeLevel3SelectedKeys: async function(){

			const oBiddingTypeLevel3ComboBox = this.byId("idBiddingTypeLevel3");

			if(oBiddingTypeLevel3ComboBox){
				oBiddingTypeLevel3ComboBox.setBusy(true);
			
				const oBiddingTypeLevel3DisplayInput = this.getView().byId("idBiddingTypeLevel3Display");
				const sBiddingTypeLevel3Txt = oBiddingTypeLevel3DisplayInput && oBiddingTypeLevel3DisplayInput.getValue();

				// if BiddingTypeLevel3 did not have a value on the display page, it means that it was not set and therefore should not be displayed.
				if(!sBiddingTypeLevel3Txt){
					oBiddingTypeLevel3ComboBox.setVisible(false);
					oBiddingTypeLevel3ComboBox.setBusy(false);
					return;
				}

				const sCountry = Services.getSelectedCountry();
				const sBiddingTypeLevel2Id = await this.getBiddingTypeLevel2Id();
				
				const aTenderBiddingTypeLevel3 = await Services.loadCountryBiddingTypeLevel3(sCountry, sBiddingTypeLevel2Id);
				const oTenderBiddingTypeLevel3 = aTenderBiddingTypeLevel3 && aTenderBiddingTypeLevel3.filter(item => item.Name && item.Name.indexOf(sBiddingTypeLevel3Txt) > -1);

				const selectedKey = oTenderBiddingTypeLevel3 && oTenderBiddingTypeLevel3.length > 0 && oTenderBiddingTypeLevel3[0].Name || undefined;

				oBiddingTypeLevel3ComboBox.setBusy(false);

				return selectedKey && oBiddingTypeLevel3ComboBox.setSelectedKey(selectedKey);
			}
			
			return undefined;
		},

		//array for holding the page fragments that are already loaded TODO keep in seperate file so this controller is not overloaded
		_pageFragments: {},

		//get pagefragement and keep it in the controller
		_getPageFragment: function (sFragmentName) {

			//Page fragment as it exists in this controller
			var oPageFragment = this._pageFragments[sFragmentName];

			if (oPageFragment) { 
				return oPageFragment;
			}

			//if not yet exists... get fragment from project folder
			oPageFragment = sap.ui.xmlfragment(this.getView().getId(), "FAST_NS0FAST0.view.fragments." + sFragmentName, this);

			//keep fragment in controller
			this._pageFragments[sFragmentName] = oPageFragment;
			return this._pageFragments[sFragmentName];

		},

		//show the corresponding Subsection Fragment (only used for BasicInformation)
		_showSubSectionFragment: function (sFragmentName, sPageSubSectionId) {

			var oPage = this.byId(sPageSubSectionId);
			var oBlocks = oPage.getBlocks();
			oPage.addBlock(this._getPageFragment(sFragmentName));
			//removes the subsection that exists in the basic info
			oBlocks.forEach(function (oBlock) {
				oPage.removeBlock(oBlock);
			});
			//oPage.addBlock(this._getPageFragment(sFragmentName));

		},

		_isQuotationFragment: function(value){
			if(value.includes('Quotation')){
				return true;
			} 
			return false;
		},

		//show the corresponding Fragment 
		_showSectionFragment: function (sFragmentName, sPageSectionId) {

			var oPage = this.byId(sPageSectionId);
			var aSubSections = oPage.getSubSections();
			//get all the subsections from the fragment
			var aNewSubSection = this._getPageFragment(sFragmentName);

			//add new sections for page
			aNewSubSection.forEach(function (oSubSection) {
				oPage.addSubSection(oSubSection);
			});

			//remove all subsection that are not the same as the newly added
			aSubSections.forEach(function (oSubSection) {
				//do not remove recently added subsections, only the others... otherwise we have an empty tab = no tab
				var iIndex = aNewSubSection.findIndex(x => x.sId === oSubSection.sId);
				if (iIndex === -1) {
					//if its not found in the newly added subsections, we should remove it
					oPage.removeSubSection(oSubSection);
				}
			});
		},

		//Block expanding the panel, beceause we are fasing out this logic
		onExpandOfferTable: function (oEvent) {
			var oPanel = oEvent.getSource();
			oPanel.setExpanded(false);

			MessageToast.show('Use left pannel for navigating between offers...', {
				duration: 3000, // default
				width: "15em", // default
				my: "center center",
				at: "center center",
				of: window, // default
				offset: "0 0", // default
				collision: "fit fit", // default
				onClose: null, // default
				autoClose: true, // default
				animationTimingFunction: "ease", // default
				animationDuration: 1000, // default
				closeOnBrowserNavigation: true // default
			});
		},

		//when deleting an offer, we want to select the first existing offer
		_selectFirstOfferInLeftPane: function (sOfferID) {

			//Set selected offer in left pane
			var oTendersMasterTable = Services.getTendersMasterTable();
			var aItems = oTendersMasterTable.getItems();
			var iIndexColumnOfferID = oTendersMasterTable.getParent().getParent().byId("TenderTableOfferID").getOrder();

			//refresh
			Services.getDefaultModel().refresh(true);

			//If first offer exist
			if (aItems && aItems.length > 1) {

				//Select first offer that is not equal to offer that is deleted
				var bOfferSelected = false;
				aItems.forEach(function (oItem) {
					if (oItem.getCells()[iIndexColumnOfferID].getTitle() !== sOfferID && bOfferSelected === false) {

						oTendersMasterTable.setSelectedItem(oItem, true);
						oItem.setSelected(true);
						oItem.setActive(true);
						oItem.firePress();
						oItem.setActive(true);

						bOfferSelected = true;

					}
				});

			} else {

				//if no offers exist or only 1 offer, then this is the offer we are deleting
				Services.clearSelectedOffer();

				//open basic info tab of tender
				var sBasicInfoTabID = Services.getBasicInformationPageSectionID();
				//var oBasicInfoTab = this.getView().byId(sBasicInfoTabID);
				var oDetailObjectPage = this.getView().byId("DetailPage");
				oDetailObjectPage.setSelectedSection(sBasicInfoTabID);

			}

		},

		//after save... we want to reselect the offer in the left pane
		_selectOfferInLeftPane: function (sOfferID) {

			//Set selected offer in left pane
			var oTendersMasterTable = Services.getTendersMasterTable();
			var aItems = oTendersMasterTable.getItems();
			var iIndexColumnOfferID = oTendersMasterTable.getParent().getParent().byId("TenderTableOfferID").getOrder();

			if (Services.getSelectedProductID()) {
				var sSelectedProductId = Services.getSelectedProductID();
				var sSelectedProductPath = Services.getSelectedProductPath();
				var sSelectedProductName = Services.getSelectedProductName();
			}

			//Select again the same offer
			aItems.forEach(function (oItem) {
				if (oItem.getCells()[iIndexColumnOfferID].getTitle() === sOfferID) {

					oTendersMasterTable.setSelectedItem(oItem, true);
					oItem.setSelected(true);
					oItem.setActive(true);
					oItem.firePress();
					oItem.setActive(true);

				}
			});

			if (sSelectedProductId) {
				Services.setSelectedProductID(sSelectedProductId);
				Services.setSelectedProductPath(sSelectedProductPath);
				Services.setSelectedProductName(sSelectedProductName);
			}

		},

		//on navigation we want to reselect the same offer
		_selectOfferInOfferTable: function (sTableID, sColumnOfferID) {

			var that = this;

			//Check if we are on the master page, if yes check is not needed
			if (that.oModel.getProperty("/layout") === "OneColumn") {
				return;
			}

			var sOfferID = Services.getSelectedOfferID();

			//check which tab is open
			var oDetailPage = that.getView().byId("DetailPage"),
				//bCurrentShowFooterState = oDetailPage.getShowFooter(),
				sSelectedSection = oDetailPage.getSelectedSection();

			//Get offer table
			var oOffersTable = that.getView().byId(sTableID);

			//if there is an offer selected, we should reselect if possible
			if (sOfferID && oOffersTable) {

				//get items of offertable
				var aItems = oOffersTable.getItems();
				var iIndexColumnOfferID = this.getView().byId(sColumnOfferID).getOrder();
				var bOfferFound = false;

				//Select again the same offer
				aItems.forEach(function (oItem) {
					if (oItem.getCells()[iIndexColumnOfferID].getTitle() === sOfferID) {
						oOffersTable.setSelectedItem(oItem, true);
						oItem.setSelected(true);
						oItem.setActive(true);
						oItem.firePress();
						oItem.setActive(true);
						bOfferFound = true;
						//to check if edit can be clicked
						Services.setSelectedOfferAvailable(true);
					}
				});

				if (!bOfferFound) {
					//to check if edit can be clicked
					Services.setSelectedOfferAvailable(false);
					//edit button is disabled
					MessageToast.show('Selected offer is not in the correct status.. Please select an other offer...', {
						duration: 3000, // default
						width: "15em", // default
						my: "center center",
						at: "center center",
						of: window, // default
						offset: "0 0", // default
						collision: "fit fit", // default
						onClose: null, // default
						autoClose: true, // default
						animationTimingFunction: "ease", // default
						animationDuration: 1000, // default
						closeOnBrowserNavigation: true // default
					});

					//for offer products tab, do not show details
					var oOfferProducts = that.getView().byId("offerDetailForm");
					if (oOfferProducts) {
						oOfferProducts.setVisible(false);
					}
				}

			} else {

				//only on master list, basic info, offer products it is possible that you don't have an offer selected.
				//other tabs should always have an offer selected.
				if (
					sSelectedSection === Services.getFinancialOfferPageSectionID() || sSelectedSection === Services.getFinancialOfferPageSectionID_IT() || sSelectedSection === Services.getFinancialOfferPageSectionID_ES() || sSelectedSection === Services.getFinancialOfferPageSectionID_BR() || 
                    sSelectedSection === Services.getQuotationPageSectionID() || sSelectedSection === Services.getTenderResultsPageSectionID() || sSelectedSection === Services.getDeliveryTrackingPageSectionID()
				)
				//edit button is disabled
				MessageToast.show('There is no offer selected. Please first select an offer in left pane...', {
					duration: 3000, // default
					width: "15em", // default
					my: "center center",
					at: "center center",
					of: window, // default
					offset: "0 0", // default
					collision: "fit fit", // default
					onClose: null, // default
					autoClose: true, // default
					animationTimingFunction: "ease", // default
					animationDuration: 1000, // default
					closeOnBrowserNavigation: true // default
				});
			}

			return bOfferFound;

		},

		//based on the Selected/Active Section, we initialize certain fields
		_initSection: function (sSelectedSection) { 
			
			var that = this;

			//clearing when swithcing between tabs
			Services.clearSelectedProduct();
			Services.clearOfferSaveInfo();
			Services.clearProductsSaveInfo();
			Services.clearResultsForProducts();
			Quotation.clearQuotationOfferProducts();
			
			Services.clearDeliveriesSaveInfo();
				Services.clearLettersSaveInfo();
				Services.clearProductsForOffer();
				Services.clearDeliveriesForProduct();
				Services.clearLettersForProduct();

			//Check on wich tab we are
			switch (sSelectedSection) {

				//Basic information tab
			case Services.getBasicInformationPageSectionID():

				//clone button only enabled on basic info page
				that.getView().byId("cloneButtonId").setEnabled(true);
				//EITOG-217330-Only to view commercial offers, NOT to modify
				if(this.accessModel.oData.tenderAccess.SPAINTENDERVIEW === true){
					this.getView().byId("deleteTenderButtonId").setEnabled(false);
				}else{
					that.getView().byId("deleteTenderButtonId").setEnabled(true);
				}
				if(this.accessModel.oData.tenderAccess.MEATENDERVIEW === true){
					this.getView().byId("editButtonId").setEnabled(false);
				}else{
					that.getView().byId("editButtonId").setEnabled(true);
				}
				
				break;

				//Offer products tab
			case Services.getOfferProductPageSectionID():

				//Offer details form: first hide, beceause if offer selected is not selectable for this tab, it should not be visible
				var oOfferProducts = that.getView().byId("offerDetailForm");
				oOfferProducts.setVisible(false);
				if(this.accessModel.oData.tenderAccess.MEATENDERVIEW === true){
					this.getView().byId("editButtonId").setEnabled(false);
				}else{
					that.getView().byId("editButtonId").setEnabled(true);
				}
				//Offer Products: clear previously selected (.unbindRows method gives an error in console, so we could not use this, thats why we bind empty model)
				var oTable = that.byId("offerProductId");
				if (oTable) {
					var aTableData = [];
					var oModelEmpty = new sap.ui.model.json.JSONModel(aTableData);
					oTable.setModel(oModelEmpty, "EmptyModel");
					oTable.bindRows({
						path: "/",
						model: "EmptyModel",
					});
				}

				//check if offer is valid for selection
				if (Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)) {
					//set binding Correct for ProductOfferPage & selected offer
					that.onProductOfferItemPress();
				} else {
					//message offer not available for tab
					MessageToast.show('Selected offer is not in the correct status.. Please select an other offer...', {
						duration: 3000, // default
						width: "15em", // default
						my: "center center",
						at: "center center",
						of: window, // default
						offset: "0 0", // default
						collision: "fit fit", // default
						onClose: null, // default
						autoClose: true, // default
						animationTimingFunction: "ease", // default
						animationDuration: 1000, // default
						closeOnBrowserNavigation: true // default
					});
				}

				break;

				//Financial offer tab
			case Services.getFinancialOfferPageSectionID():

				var oOfferProducts = that.byId("idFinancialOfferViewProduct");
				oOfferProducts.destroyItems();
				oOfferProducts = that.byId("tenderHistoryId");
				oOfferProducts.destroyItems();

				//check if offer is valid for selection
				if (Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)) {
					
					//Financial Offer: Tender offer Subsection
					var oFinOfferSubSection = that.byId("FinTenderOfferSubsection");
					if (oFinOfferSubSection) {
						oFinOfferSubSection.setVisible(true);
					}

					//Financial Offer: Pricing offer subsection
					var oFinPricingSubSection = that.byId("FinPricingOfferSubsection");
					if (oFinPricingSubSection) {
						oFinPricingSubSection.setVisible(true);
					}

					//Financial Offer: Tender History subsection
					var oFinHistorySubSection = that.byId("FinTenderHistorySubsection");
					if (oFinHistorySubSection) {
						oFinHistorySubSection.setVisible(true);
					}

					//Financial Offer: No offer subsection
					var oFinNoOfferSubsection = that.byId("FinNoOfferSubsection");
					if (oFinNoOfferSubsection) {
						oFinNoOfferSubsection.setVisible(false);
					}

					//set binding Correct for ProductOfferPage & selected offer
					that.onFinancialOfferItemPress();

				} else {

					//Financial Offer: Tender offer Subsection
					var oFinOfferSubSection = that.byId("FinTenderOfferSubsection");
					if (oFinOfferSubSection) {
						oFinOfferSubSection.setVisible(false);
					}

					//Financial Offer: Pricing offer subsection
					var oFinPricingSubSection = that.byId("FinPricingOfferSubsection");
					if (oFinPricingSubSection) {
						oFinPricingSubSection.setVisible(false);
					}

					//Financial Offer: Tender History subsection
					var oFinHistorySubSection = that.byId("FinTenderHistorySubsection");
					if (oFinHistorySubSection) {
						oFinHistorySubSection.setVisible(false);
					}

					//Financial Offer: No offer subsection
					var oFinNoOfferSubsection = that.byId("FinNoOfferSubsection");
					if (oFinNoOfferSubsection) {
						oFinNoOfferSubsection.setVisible(true);
					}

				}

				break;

			case Services.getFinancialOfferPageSectionID_IT():

				//check if offer is valid for selection (within this method we store the result also on the fastappdatamodel/checkOfferVisibleForTab)
				if(Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)){
					Services.getFastAppDataModel().setProperty("/CheckOfferVisibleForTab_IT", true);
				} else {
					Services.getFastAppDataModel().setProperty("/CheckOfferVisibleForTab_IT", false);
				}
				break;
            
            case Services.getFinancialOfferPageSectionID_ES():

				//check if offer is valid for selection (within this method we store the result also on the fastappdatamodel/checkOfferVisibleForTab)
				if(Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)){
					Services.getFastAppDataModel().setProperty("/CheckOfferVisibleForTab_ES", true);
				} else {
					Services.getFastAppDataModel().setProperty("/CheckOfferVisibleForTab_ES", false);
				}
				break;

            case Services.getFinancialOfferPageSectionID_BR():

                //check if offer is valid for selection (within this method we store the result also on the fastappdatamodel/checkOfferVisibleForTab)
                if(Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)){
                    Services.getFastAppDataModel().setProperty("/CheckOfferVisibleForTab_BR", true);
                } else {
                    Services.getFastAppDataModel().setProperty("/CheckOfferVisibleForTab_BR", false);
                }
                break;

				//Quotation tab	
			case Services.getQuotationPageSectionID():

				//
				let oQuotationInfo = that.byId("IdQuotationInfo");
				if(oQuotationInfo){
					oQuotationInfo.setVisible(false);
				}
				let oQuotationInfo2 = that.byId("IdQuotationInfo2");
				if(oQuotationInfo2){
					oQuotationInfo2.setVisible(false);
				}
				let oQofferValidity = that.byId("idQofferValidity");
				if(oQofferValidity){
					oQofferValidity.setEnabled(false);
				}
				if(this.accessModel.oData.tenderAccess.MEATENDERVIEW === true){
					this.getView().byId("editButtonId").setEnabled(false);
				}else{
					that.getView().byId("editButtonId").setEnabled(true);
				}
				that.byId("idQofferEffectiveDate") && that.byId("idQofferEffectiveDate").setEnabled(false);
				that.byId("idQofferExpiryDate") && that.byId("idQofferExpiryDate").setEnabled(false);
				let oCustomRemark = that.byId("idCustomRemark");
				if(oCustomRemark){
					oCustomRemark.setEnabled(false);
				}
				let oSelectIssuedBy = that.byId("idSelectIssuedBy");
				if (oSelectIssuedBy){
					oSelectIssuedBy.setEnabled(false);
				}
				let oSelectCompanyStamp = that.byId("idSelectCompanyStamp");
				if(oSelectCompanyStamp){
					oSelectCompanyStamp.setEnabled(false);
				}

				//reselect same offer if it exists, otherwise clear offer selected
				//that._selectOfferInOfferTable("quotationOffersTableViewID","quotationOffersTableOfferID");
				if (Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)) {
					//Quotation offer - subsection
					var oQuotationSubSection = that.byId("QuotationOfferSubsection");
					if (oQuotationSubSection) {
						oQuotationSubSection.setVisible(true);
					}

					//Quotation offer: No offer subsection
					var oQuotationNoOfferSubsection = that.byId("QuotationNoOfferSubsection");
					if (oQuotationNoOfferSubsection) {
						oQuotationNoOfferSubsection.setVisible(false);
					}

					that.onQuotationOfferItemPress();
				} else {

					//Quotation offer - subsection
					var oQuotationSubSection = that.byId("QuotationOfferSubsection");
					if (oQuotationSubSection) {
						oQuotationSubSection.setVisible(false);
					}

					//Quotation offer: No offer subsection
					var oQuotationNoOfferSubsection = that.byId("QuotationNoOfferSubsection");
					if (oQuotationNoOfferSubsection) {
						oQuotationNoOfferSubsection.setVisible(true);
					}

				}
				break;

				//Results tab
			case Services.getTenderResultsPageSectionID():

				//reselect same offer if it exists, otherwise clear offer selected
				//that._selectOfferInOfferTable("tenderResultsOfferTableViewID","tenderResultsOfferTableOfferID");
				if (Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)) {
                    Services.getFastAppDataModel().setProperty("/CheckOfferVisibleForTab_ES", true);
					
					//Tender Results - subsection
					/*var oFinHistorySubSection = that.byId("__component0---tenderManagementDetailId--tenderResultsFragmentId--TenderResOfferSubsection");
					if (oFinHistorySubSection) {
						oFinHistorySubSection.setVisible(false);
					}

					//Tender Results - awarded companies
					var oFinHistorySubSection = that.byId("__component0---tenderManagementDetailId--tenderResultsFragmentId--TenderResOfferAwardedComp");
					if (oFinHistorySubSection) {
						oFinHistorySubSection.setVisible(true);
					}

					//Quotation offer: No offer subsection
					var oFinNoOfferSubsection = that.byId("__component0---tenderManagementDetailId--tenderResultsFragmentId--TenderResNoOfferSubsection");
					if (oFinNoOfferSubsection) {
						oFinNoOfferSubsection.setVisible(false);
					}*/

					that.onTenderResultsOfferPress();
				} else {

					//Tender Results - subsection
					/*var oTenderResOfferSubSection = that.byId("__component0---tenderManagementDetailId--tenderResultsFragmentId--TenderResOfferSubsection");
					if (oTenderResOfferSubSection) {
						oTenderResOfferSubSection.setVisible(false);
					}

					//Tender Results - awarded companies
					var oAwardedCompSubSection = that.byId("__component0---tenderManagementDetailId--tenderResultsFragmentId--TenderResOfferAwardedComp");
					if (oAwardedCompSubSection) {
						oAwardedCompSubSection.setVisible(false);
					}

					//Quotation offer: No offer subsection
					var oTenderResNoOfferSubsection = that.byId("__component0---tenderManagementDetailId--tenderResultsFragmentId--TenderResNoOfferSubsection");
					if (oTenderResNoOfferSubsection) {
						oTenderResNoOfferSubsection.setVisible(true);
					}*/
                    Services.getFastAppDataModel().setProperty("/CheckOfferVisibleForTab_ES", false);
				
				}
				break;

				//Delivery Tracking
				case Services.getDeliveryTrackingPageSectionID():
					
					//reselect same offer if it exists, otherwise clear offer selected
					//that._selectOfferInOfferTable("deliveryTrackingOfferTableViewID","deliveryTrackingOfferTableOfferID");
					if(Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()),sSelectedSection)){
						
						//Deliveries - subsection
						var oDelivTrackOfferSubSection = that.oDeliveryTrackingView.byId("DelivTrackOfferSubsection");
						if (oDelivTrackOfferSubSection) {
							oDelivTrackOfferSubSection.setVisible(true);
						}

						//Deliveries - Deliveries
						var oDelivTrackDeliveriesSubSection = that.oDeliveryTrackingView.byId("DelivTrackDeliveriesSubsection");
						if (oDelivTrackDeliveriesSubSection) {
							oDelivTrackDeliveriesSubSection.setVisible(true);
						}

						//Deliveries - Delivery Detail
						var oDeliveryDetailSubSection = that.oDeliveryTrackingView.byId("idDeliveryDetailSection");
						if (oDeliveryDetailSubSection && Services.getSelectedCountry() !== 'CL') {
							oDeliveryDetailSubSection.setVisible(false);
						}

						//Deliveries - Letters
						var oDelivTrackLettersSubSection = that.oDeliveryTrackingView.byId("DelivTrackLettersSubsection");
						if (oDelivTrackLettersSubSection && Services.getSelectedCountry() !== 'CL') {
							oDelivTrackLettersSubSection.setVisible(true);
						}

						//Deliveries - Letter Details
						var oLetterDetailSubSection = that.oDeliveryTrackingView.byId("idLetterDetailSection");
						if (oLetterDetailSubSection) {
							oLetterDetailSubSection.setVisible(false);
						}

						//Deliveries - No offer subsection
						var oDelivTrackNoOfferSubsection = that.oDeliveryTrackingView.byId("DelivTrackNoOfferSubsection");
						if (oDelivTrackNoOfferSubsection) {
							oDelivTrackNoOfferSubsection.setVisible(false);
						}	

						that.oDeliveryTrackingController.onDelivryTrackingOfferPress();
					} else {

						//Deliveries - subsection
						var oDelivTrackOfferSubSection = that.oDeliveryTrackingView.byId("DelivTrackOfferSubsection");
						if (oDelivTrackOfferSubSection) {
							oDelivTrackOfferSubSection.setVisible(false);
						}

						//Deliveries - Deliveries
						var oDelivTrackDeliveriesSubSection = that.oDeliveryTrackingView.byId("DelivTrackDeliveriesSubsection");
						if (oDelivTrackDeliveriesSubSection) {
							oDelivTrackDeliveriesSubSection.setVisible(false);
						}

						//Deliveries - Delivery Detail
						var oDeliveryDetailSubSection = that.oDeliveryTrackingView.byId("idDeliveryDetailSection");
						if (oDeliveryDetailSubSection) {
							oDeliveryDetailSubSection.setVisible(false);
						}

						//Deliveries - Letters
						var oDelivTrackLettersSubSection = that.oDeliveryTrackingView.byId("DelivTrackLettersSubsection");
						if (oDelivTrackLettersSubSection) {
							oDelivTrackLettersSubSection.setVisible(false);
						}

						//Deliveries - Letter Details
						var oLetterDetailSubSection = that.oDeliveryTrackingView.byId("idLetterDetailSection");
						if (oLetterDetailSubSection) {
							oLetterDetailSubSection.setVisible(false);
						}

						//Deliveries - No offer subsection
						var oDelivTrackNoOfferSubsection = that.oDeliveryTrackingView.byId("DelivTrackNoOfferSubsection");
						if (oDelivTrackNoOfferSubsection) {
							oDelivTrackNoOfferSubsection.setVisible(true);
						}

					}
					break;

			default:
				//disable clone & delete button
				that.getView().byId("cloneButtonId").setEnabled(false);
				that.getView().byId("deleteTenderButtonId").setEnabled(false);
			}
		},

		//Navigation
		onNavigate: function (oControlEvent) {

			var that = this;

			var oDetailPage = that.getView().byId("DetailPage"),
				bCurrentShowFooterState = oDetailPage.getShowFooter(),
				sSelectedSection = oDetailPage.getSelectedSection();

			//Change navigation parameters
			that._initSection(sSelectedSection);

			//go to on route matched and handle it there
			var sLayout = oControlEvent.getSource().getParent().getParent().getParent().getProperty("layout") || "TwoColumnsMidExpanded";
			var sTenderID = Services.getSelectedTenderID();
			var sOfferID = Services.getSelectedOfferID();
			this.oRouter.navTo("detail", {
				layout: sLayout,
				tender: sTenderID,
				offer: sOfferID,
				tab: sSelectedSection,
				country: this._country
			});

			//if in edit mode, give message first
			if (bCurrentShowFooterState) {
				sap.m.MessageBox.show("Must Save first", { //TODO this doesn't work as it should be
					icon: sap.m.MessageBox.Icon.ERROR,
					onClose: function (evt) {
						return false;
					}
				});
			}

		},

		//GENERAL METHODS FOR THE ACTION BUTTONS
		//--------------------------------------

		//Refreshing app data
		onRefresh: function (oEvent) {

			var that = this;

			//In this case we have selected a tender, we will load all data from the database
			var sTenderID = Services.getSelectedTenderID();
			var sOfferID = Services.getSelectedOfferID();

			//models
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oDefaultModel = Services.getDefaultModel();

			//we will force reloading (false=no check on tender already loaded)
			var bLoadedCheck = false;

			if (sTenderID) {
				$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

					//this way we can use a seperate layer, adding deleting... and afterords saving
					oFastAppDataModel.refresh(true);
					oDefaultModel.refresh(true);

					//refresh tenders master table (left pane)
					Services.refreshTendersMasterTable(sTenderID);

					//Set selected offer in left pane
					that._selectOfferInLeftPane(sOfferID);

					//get section
					var sSelectedSection = that.getView().getContent()[0].getSelectedSection();

					//get offers table + index of offerID column
					var oOffersTableResult = that._getOfferTableForTab(sSelectedSection);

					//only when oOffersTable is found
					if (oOffersTableResult._oOffersTable) {

						that._selectOfferInOfferTable(oOffersTableResult._sOfferTableID, oOffersTableResult._sOfferColumnID);

					}

					//reselect same offer if it exists, otherwise clear offer selected
					//that._selectOfferInOfferTable("productOffersTableViewID","productOffersTableOfferID");

					//for Quotation tab offer should be selected again.
					if (that.getView().getContent()[0].getSelectedSection() == Services.getBasicInformationPageSectionID()) {

						//edit tender is same again
						var oTender = Services.getLoadedTender();
						oFastAppDataModel.setProperty("/EditTender", oTender);

					}

					//for Quotation tab offer should be selected again.
					if (that.getView().getContent()[0].getSelectedSection() == Services.getQuotationPageSectionID() && Services.checkOfferVisibleForTab(
							Services.getLoadedOffer(sOfferID), sSelectedSection)) {

						//QUOTATION TAB
						//select offer again
						that.onQuotationOfferItemPress();
					}

					if (that.getView().getContent()[0].getSelectedSection() == Services.getFinancialOfferPageSectionID() && Services.checkOfferVisibleForTab(
							Services.getLoadedOffer(sOfferID), sSelectedSection)) {

						//FINANCIAL OFFER
						//select offer again
						that.onFinancialOfferItemPress();
					}

					if (that.getView().getContent()[0].getSelectedSection() == Services.getFinancialOfferPageSectionID_IT() && Services.checkOfferVisibleForTab(
						Services.getLoadedOffer(sOfferID), sSelectedSection)) {

						//FINANCIAL OFFER for IT
						//select offer again (TODO)
						//that.onFinancialOfferItemPress();
						var oView = that.getView().byId("financialOfferViewId_IT");
						var oFinOfferController = oView.getController();
						oFinOfferController.refreshFinancialTabIT();
					}

                    if (that.getView().getContent()[0].getSelectedSection() == Services.getFinancialOfferPageSectionID_ES() && Services.checkOfferVisibleForTab(
						Services.getLoadedOffer(sOfferID), sSelectedSection)) {

						//FINANCIAL OFFER for IT
						//select offer again (TODO)
						//that.onFinancialOfferItemPress();
						var oView = that.getView().byId("financialOfferViewId_ES");
						var oFinOfferController = oView.getController();
						oFinOfferController.refreshFinancialTabES();
					}

                    if (that.getView().getContent()[0].getSelectedSection() == Services.getFinancialOfferPageSectionID_BR() && Services.checkOfferVisibleForTab(
						Services.getLoadedOffer(sOfferID), sSelectedSection)) {

						//FINANCIAL OFFER for BR
						//select offer again (TODO)
						//that.onFinancialOfferItemPress();
						var oView = that.getView().byId("financialOfferViewId_BR");
						var oFinOfferController = oView.getController();
						oFinOfferController.refreshFinancialTabBR();
					}

					if (that.getView().getContent()[0].getSelectedSection() == Services.getDeliveryTrackingPageSectionID() && Services.checkOfferVisibleForTab(
							Services.getLoadedOffer(sOfferID), sSelectedSection)) {

						//DELIVERY TAB
						//select offer again
						that.oDeliveryTrackingController.onDelivryTrackingOfferPress();
					}

					if (that.getView().getContent()[0].getSelectedSection() == Services.getTenderResultsPageSectionID() && Services.checkOfferVisibleForTab(
							Services.getLoadedOffer(sOfferID), sSelectedSection)) {

						//Tender Results
						//select offer again
						that.onTenderResultsOfferPress();
					}

				});
			}

		},

		//Edit action or clone button button on top of the screen is pressed
		//add offer button or add reviewed offer is pressed
		//save or cancel button below is pressed
		onEditToggleButtonPress: function (oEvent) {
			var that = this;
			let sCountry = Services.getSelectedCountry() || oEvent.getParameter("arguments").country || "NA";;
			var oObjectPage = that.getView().byId("DetailPage"),
				bCurrentShowFooterState = oObjectPage.getShowFooter();
			var sSelectedSection = oObjectPage.getSelectedSection();
			//in some cases edit/creation mode is not allowed
			var bStatusNotAllowingEdit = false;
			var bStatusNotAllowingContinuedRevised = false;
			var bScreenNotAllowingEdit = false;
			var bEditAllowed = true; //default we allow editing
			var oOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
			var oFastAppDataModel = Services.getFastAppDataModel();
			let sInstituteType = Services.getFastAppDataModel().getProperty('/Tender/Institute/InstituteType');
            var sClassification = that.getView().byId("idClassification") ? that.getView().byId("idClassification").getSelectedItem().getKey() : oFastAppDataModel.getProperty('/Tender/Classification');

			//if footerstate = true, meaning we are in edit mode??? TODO this should be based on a method + private var in service file (future footer could include other buttons that are not only for edit mode)
			if (bCurrentShowFooterState === true) {

				//Keep track that we are in display modus
				Services.setEditMode(false);

				//We are currently in EDIT mode & we go to VIEW mode
				switch (sSelectedSection) {
				case Services.getBasicInformationPageSectionID():

					//BASIC INFORMATION TAB

					that.reloadCountrySpecificData(sCountry);

					//back to default (only when new tender, these fields should be editable, also after save of new tender & back to edit mode)
					that.getView().byId("idClassification").setEnabled(false);
					that.getView().byId("idInstituteType").setEnabled(false);
					that.getView().byId("idInstituteName").setEnabled(false);
					that.getView().byId("idTenderChannel").setEnabled(false);
					that.getView().byId("idGroupPurchasingEdit").setEnabled(false);
					that.getView().byId("idSelectTenderTypeEdit").setEnabled(false);
					//spain
                    that.getView().byId("idSelectTenderType2Edit").setEnabled(false);
                    that.getView().byId("idContentEdit").setEnabled(false);
                    that.getView().byId("idPortalEdit").setEnabled(false);
                    that.getView().byId("idInstituteCode").setEnabled(false);
                    that.getView().byId("idInstituteProvince").setEnabled(false);
                    that.getView().byId("idInstitutePoblacion").setEnabled(false);
                    that.getView().byId("idInstituteCifCode").setEnabled(false);
                    that.getView().byId("idRegionalHealthSystem").setEnabled(false);
					//Mexico
					that.getView().byId("idSelectSalesTypeEdit").setEnabled(false);
					that.getView().byId("idSelectTenderOriginEdit").setEnabled(false);
					that.getView().byId("idSelectContractTypeEdit").setEnabled(false);
					//End of mexico

					//should tendertype be visible on the basic info screen?
					$.when(Services.checkShowTenderType(sClassification)).done(function (bShowTenderType) {
						that.getView().byId("idSelectTenderTypeEdit")?.setVisible(bShowTenderType);
						if(Services.getSelectedCountry() === 'CL' && sInstituteType === 'Cenabast'){
							that.getView().byId("idSelectTenderTypeEdit")?.setVisible(true);
						}else{
							that.getView().byId("idSelectTenderTypeEdit")?.setVisible(bShowTenderType);
							sCountry === "BR" && that.getView().byId("idSelectTenderType")?.setVisible(bShowTenderType);
						}
					});

                    //should tendertype2 be visible on the basic info screen?
					$.when(Services.checkShowTenderType2(sClassification)).done(function (bShowTenderType) {
						that.getView().byId("idSelectTenderType2Edit")?.setVisible(bShowTenderType);
					});

					/* Mexico */
					$.when(Services.checkShowSalesType()).done(function (bShowSalesType) {
						that.getView().byId("idSelectSalesTypeEdit")?.setVisible(bShowSalesType);
						that.getView().byId("idSelectSalesType")?.setVisible(bShowSalesType);
					});

					$.when(Services.checkShowTenderOrigin()).done(function (bShowTenderOrigin) {
						that.getView().byId("idSelectTenderOriginEdit")?.setVisible(bShowTenderOrigin);
						that.getView().byId("idSelectTenderOrigin")?.setVisible(bShowTenderOrigin);
					});

					$.when(Services.checkShowContractType()).done(function (bShowContractType) {
						that.getView().byId("idSelectContractTypeEdit")?.setVisible(bShowContractType);
						that.getView().byId("idSelectContractType")?.setVisible(bShowContractType);
					});
					/* End of mexico */

					/* Thailand */
					$.when(Services.checkShowProcurementMethod()).done(function (bShowProcurementMethod) {
						that.getView().byId("idSelectProcurementMethodEdit")?.setVisible(bShowProcurementMethod);
						that.getView().byId("idSelectProcurementMethod")?.setVisible(bShowProcurementMethod);
					});
					/* End of Thailand */

					//should group purchasing be visible on the screen based on data back-end
					$.when(Services.checkInstituteChilderen()).done(function (bShowGroupPurchasing) { 
						that.getView().byId("idGroupPurchasingEdit")?.setVisible(bShowGroupPurchasing);
						that.getView().byId("idGroupPurchasing")?.setVisible(bShowGroupPurchasing);
					});

					that._showSubSectionFragment("BasicInformationView", "basicInformationSubSectionId");

					that.bindAwardCriteria();
					break;
				case Services.getOfferProductPageSectionID():
					//OFFER PRODUCTS TAB
					that._showSectionFragment("OfferProductsView", "offerProductsId");
					//TODO reload of data needed?

                    //if we're in brazil, filter the offer products by the selected lot ID 
                    let sCountryCode = Services.getCountryCodeofSelectedTender();
                    if(sCountryCode === 'BR'){
                        let iSelectedLotID = that.getView().byId('idSelectLotView').getSelectedKey();
                        that.filterBySelectedLot(iSelectedLotID);
                    }

					break;
				case Services.getFinancialOfferPageSectionID():
					//FINANCIAL OFFER TAB
					that._showSectionFragment("FinancialOfferView", "financialOfferId");

					//check for approval enabled 
					var sSelectedOfferID = Services.getSelectedOfferID();
					var oOffer = Services.getLoadedOffer(sSelectedOfferID);

					var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);
					if (bEnableApproval && sSelectedOfferID !== '' && oOffer.Active === 1 && oOffer.ActiveOffer === 1) {
						that.byId("ApprovalButtonId").setEnabled(true);
					} else {
						that.byId("ApprovalButtonId").setEnabled(false);
					}

					break;
				case Services.getFinancialOfferPageSectionID_IT():
						//FINANCIAL OFFER TAB
						//that._showSectionFragment("FinancialOfferView", "financialOfferId");
	
						//check for approval enabled 
						var sSelectedOfferID = Services.getSelectedOfferID();
						var oOffer = Services.getLoadedOffer(sSelectedOfferID);
	
						var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);
						if (bEnableApproval && sSelectedOfferID !== '' && oOffer.Active === 1 && oOffer.ActiveOffer === 1) {
							that.byId("ApprovalButtonId").setEnabled(true);
						} else {
							that.byId("ApprovalButtonId").setEnabled(false);
						}
	
						break;
                case Services.getFinancialOfferPageSectionID_ES():
						//FINANCIAL OFFER TAB
						//that._showSectionFragment("FinancialOfferView", "financialOfferId");
	
						//check for approval enabled 
						var sSelectedOfferID = Services.getSelectedOfferID();
						var oOffer = Services.getLoadedOffer(sSelectedOfferID);
						
	
						var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);
						if (bEnableApproval && sSelectedOfferID !== '' && oOffer.Active === 1 && oOffer.ActiveOffer === 1) {
							that.byId("ApprovalButtonId").setEnabled(true);
						} else {
							that.byId("ApprovalButtonId").setEnabled(false);
						}
                        that.getView().byId("financialOfferViewId_ES").getController().editFinancialOfferESToggle(Services.getEditMode()); 
						break;

                case Services.getFinancialOfferPageSectionID_BR():
						//FINANCIAL OFFER TAB BR
						//that._showSectionFragment("FinancialOfferView", "financialOfferId");
	
						//check for approval enabled 
						var sSelectedOfferID = Services.getSelectedOfferID();
						var oOffer = Services.getLoadedOffer(sSelectedOfferID);
	
						var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);
						if (bEnableApproval && sSelectedOfferID !== '' && oOffer.Active === 1 && oOffer.ActiveOffer === 1) {
							that.byId("ApprovalButtonId").setEnabled(true);
						} else {
							that.byId("ApprovalButtonId").setEnabled(false);
						}
                        that.getView().byId("financialOfferViewId_BR").getController().editFinancialOfferBRToggle(Services.getEditMode()); 
						break;
                        
				case Services.getQuotationPageSectionID():
							
					//show fragment for TAB: Quotation
					that._showSectionFragment(oFastAppDataModel.getProperty('/permissions/fragments/quotationViewId/fragment'), "quotationId");

					let oQofferValidity = that.byId("idQofferValidity");
					if(oQofferValidity){
						oQofferValidity.setEnabled(false);
					}
					that.byId("idQofferEffectiveDate") && that.byId("idQofferEffectiveDate").setEnabled(false);
					that.byId("idQofferExpiryDate") && that.byId("idQofferExpiryDate").setEnabled(false);
					let oCustomRemark = that.byId("idCustomRemark");
					if(oCustomRemark){
						oCustomRemark.setEnabled(false);
					}
					let oSelectIssuedBy = that.byId("idSelectIssuedBy");
					if (oSelectIssuedBy){
						oSelectIssuedBy.setEnabled(false);
					}
					let oSelectCompanyStamp = that.byId("idSelectCompanyStamp");
					if(oSelectCompanyStamp){
						oSelectCompanyStamp.setEnabled(false);
					}
					let oDelayInSubmission = that.getView().byId("idDelayInSubmission");
					if(oDelayInSubmission){
						oDelayInSubmission.setVisible(true);
					}
					let oBtnSaveQuotation = that.getView().byId("btnSaveQuotation");
					if(oBtnSaveQuotation){
						oBtnSaveQuotation.setVisible(true);
					}
					//that.getView().byId("idLabelDelayInSubmission").setVisible(true);
					let oBtnDownloadQuotation = that.byId("btnDownloadQuotation");
					if (oOffer.Active === 1 && oOffer.ActiveOffer === 1 && oBtnDownloadQuotation) {
						that.getView().byId("btnDownloadQuotation").setVisible(true);
					}
					that.getView().byId("btnSubmitQuotation").setVisible(true);
					break;
				case Services.getTenderResultsPageSectionID():
					//TENDER RESULTS TAB
					that.onTenderResultsOfferPress(oEvent);
					//FOR THE NEW tree table
					//that.onOutcomeTableEditMode();
					that.onEditOutcomTreeTable();
					break;
				case Services.getDeliveryTrackingPageSectionID():
					//that._showSubSectionFragment(oFastAppDataModel.getProperty('/permissions/fragments/deliveryTrackingId/fragment'), 'deliveryTrackingId');
					//DELIVERY TRACKING TAB
					//that.getView().byId("deliveryTrackingViewId").byId("idAddDelv").setVisible(false);
					//that.getView().byId("idDelDelv").setVisible(false);
					//that.getView().byId("deliveryTrackingViewId").byId("idAddLtr").setVisible(false);
					//that.getView().byId("idDelLtr").setVisible(false);
				break;
				default:break;
				}
				// this.onOutcomeTableEditMode();

			} else {
				//We are currently in display mode and go to edit mode

				//check the offer status
				$.when(Services.checkOfferStatus()).done(function (oData) {

					//Functional description: https://trello.com/c/BCDzFpd0 + https://trello.com/c/F9OEyemn

					//Status in which editing is not allowed for (product offer, financial offer, quotation)
					var aStatusNoEdit = [
						"Awaiting Approval",
						"Quotation Submitted",
						"In FOC Negotiation",
						"Appeal in Progress",
						"Results Recorded",
						"Delivery Ongoing"
					];

					//Status in which editing is not allowed for (results, delivery)
					var aStatusNoEditResultsDeliveries = [
						"Awaiting Approval"
					];

					//Status which is not allowing to create a continued offer or revised offer
					//other statusses will allow edit while creating a revised or continued offer (creation modus)
					var aStatusNoContinuedNoRevised = [
						"Awaiting Approval"
					];

					//screens where the edit mode is not allowed in combination with the status
					var aScreensNoEdit = [
						//Services.getBasicInformationPageSectionID(),
						Services.getOfferProductPageSectionID(),
						Services.getFinancialOfferPageSectionID(),
						Services.getFinancialOfferPageSectionID_IT(),
						Services.getFinancialOfferPageSectionID_ES(),
                        Services.getFinancialOfferPageSectionID_BR(),                        
						Services.getQuotationPageSectionID(),
						Services.getTenderResultsPageSectionID(),
						Services.getDeliveryTrackingPageSectionID()
					];

					//check if status is allowing edit
					if (sSelectedSection === Services.getTenderResultsPageSectionID() || sSelectedSection === Services.getDeliveryTrackingPageSectionID()) {
						//Results & Delivery tracking different status allowing edit
						if ($.inArray(oData.STATUS, aStatusNoEditResultsDeliveries) === -1) {
							bStatusNotAllowingEdit = false;
						} else {
							bStatusNotAllowingEdit = true;
						}
					} else {
						//all other allowing edit (except for basic)
						if ($.inArray(oData.STATUS, aStatusNoEdit) === -1) {
							bStatusNotAllowingEdit = false;
						} else {
							bStatusNotAllowingEdit = true;
						}
					}

					//check if status is allowing edit
					if ($.inArray(oData.STATUS, aStatusNoContinuedNoRevised) === -1) {
						bStatusNotAllowingContinuedRevised = false;
					} else {
						bStatusNotAllowingContinuedRevised = true;
					}

					//check if screen is allowing edit
					if ($.inArray(sSelectedSection, aScreensNoEdit) === -1) {
						bScreenNotAllowingEdit = false;
					} else {
						bScreenNotAllowingEdit = true;
					}

					//Check if offer button is pressed: reviewed or continued new offer button (or clone button pressed)
					var bCreateOfferModus = Services.getCreationModusOffer();

					//creation modus = different logic for allowing edit
					if (bCreateOfferModus) {

						//we are in creation modus: reviewed or continued new offer button (or clone button pressed)
						//status not allowing
						if (bStatusNotAllowingContinuedRevised) {
							bEditAllowed = false;
						} else {
							bEditAllowed = true;
						}

					} else {

						//we are in edit mode of an existing offer (NOT reviewed nor continued)

						if (bStatusNotAllowingEdit && bScreenNotAllowingEdit) {
							bEditAllowed = false;
						} else {
							bEditAllowed = true;
						}

					}

					var sOfferID = Services.getSelectedOfferID();

					//check if offer is available for tab (if not edit mode is not allowed)
					//if(sOfferID && !that._checkOfferValidForTab(sOfferID)){
					if (sOfferID && !Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)) {
						bEditAllowed = false;
					}

					//if editing is not allowed (combination status, page, creation modus yes/no..)
					if (!bEditAllowed) {
						//go back to display mode
						that.onEditToggleButtonPress();
						sap.m.MessageBox.warning("Status of offer is not allowing to go to edit mode.", {});
						return;
					}

					//Keep track that we are in display
					Services.setEditMode(true);

					//updateExisting TODO still needed?
					this.updateExisting = true;
					switch (sSelectedSection) {

					case Services.getBasicInformationPageSectionID():

						/*initialize country filter for particular fields (tender type, tender origin, sales type, contract type) */
						var sCountryCode = Services.getSelectedCountry() || oEvent.getParameter("arguments").country || "NA";
						var aFilter = [];
						let sInstituteType = Services.getFastAppDataModel().getProperty('/Tender/Institute/InstituteType');
						aFilter.push(new Filter("COUNTRY_CODE", FilterOperator.EQ, sCountryCode));

						// Reload data
						that.reloadCountrySpecificData(sCountryCode);

						//BASIC INFORMATION TAB
						that._showSubSectionFragment("BasicInformationEdit", "basicInformationSubSectionId");

						//these fields should be disabled
						that.getView().byId("idClassification").setEnabled(false);
						that.getView().byId("idInstituteType").setEnabled(false);
						that.getView().byId("idInstituteName").setEnabled(false);
						that.getView().byId("idTenderChannel").setEnabled(false);
						that.getView().byId("idGroupPurchasingEdit").setEnabled(false);
						that.getView().byId("idSelectTenderTypeEdit").setEnabled(false);
						that.getView().byId("idSelectTenderType2Edit").setEnabled(false);
                        that.getView().byId("idContentEdit").setEnabled(true);
                        that.getView().byId("idPortalEdit").setEnabled(false);
                        that.getView().byId("idInstituteCode").setEnabled(false);
                        that.getView().byId("idInstituteProvince").setEnabled(false);
                        that.getView().byId("idInstitutePoblacion").setEnabled(false);
                        that.getView().byId("idInstituteCifCode").setEnabled(false);
                        that.getView().byId("idRegionalHealthSystem").setEnabled(false);
						that.getView().byId("idSelectSalesTypeEdit").setEnabled(false);
						that.getView().byId("idSelectTenderOriginEdit").setEnabled(false);
						that.getView().byId("idSelectContractTypeEdit").setEnabled(false);


						// Italy
						if (Services.getSelectedCountry() === "IT" || Services.getSelectedCountry() === "ES"){
						//that.getView().byId("idRegionEdit").setVisible(true);
							that.getTenderRegions(Services.getSelectedTenderID()).then(response => {
								const tenderArray = response.data.results.filter(tender => tender.TenderID === Services.getSelectedTenderID());
                                let regionIDs = [];
                                if(tenderArray.length !== 0){
                                    regionIDs = tenderArray[0].Regions.results.map(region => region.RegionID);                            
                                }
								that.byId("idRegionEdit").setSelectedKeys(regionIDs);
								that.byId("idTenderChannel").setVisible(false);
							})
                            
                            


						}

                        if (Services.getSelectedCountry() === "ES"){
                            that.byId("idTenderChannel").setVisible(false);                            
                        }

						//apply country filter on tender type
						var oTenderType = that.getView().byId("idSelectTenderTypeEdit");
						oTenderType.bindItems({
							path: "fastData>/CountryTenderType",
							filters: aFilter,
							parameters: {
								"expand": "TenderType"
							},
							template: new sap.ui.core.Item({
								text: "{fastData>TenderType/NAME}",
								key: "{fastData>TenderType/ID}"
							})
						});

						//should tendertype be visible on the screen?
						$.when(Services.checkShowTenderType(that.getView().byId("idClassification").getSelectedKey())).done(function (bShowTenderType) {
							oTenderType.setVisible(bShowTenderType);
							if(Services.getSelectedCountry() === 'CL' && sInstituteType === 'Cenabast'){
								oTenderType.setVisible(true);
							}else{
								oTenderType.setVisible(bShowTenderType);
							}
						});

                        //apply country filter on tender type 2
						var oTenderType2 = that.getView().byId("idSelectTenderType2Edit");
						oTenderType2.bindItems({
							path: "fastData>/CountryTenderType2",
							filters: aFilter,
							parameters: {
								"expand": "TenderType"
							},
							template: new sap.ui.core.Item({
								text: "{fastData>TenderType/NAME}",
								key: "{fastData>TenderType/ID}"
							})
						});

						//should tendertype be visible on the screen?
						$.when(Services.checkShowTenderType2(that.getView().byId("idClassification").getSelectedKey())).done(function (bShowTenderType) {
							oTenderType2.setVisible(bShowTenderType);
						});

						//should group purchasing be visible on the screen based on data back-end
						$.when(Services.checkInstituteChilderen()).done(function (bShowGroupPurchasing) { 
							that.getView().byId("idGroupPurchasingEdit").setVisible(bShowGroupPurchasing);
						});

						/* Mexico */
						//apply country filter on sales type
						var oSalesType = that.getView().byId("idSelectSalesTypeEdit");
						oSalesType.bindItems({
							path: "fastData>/CountrySalesType",
							filters: aFilter,
							parameters: {
								"expand": "SalesType"
							},
							template: new sap.ui.core.Item({
								text: "{fastData>SalesType/NAME}",
								key: "{fastData>SalesType/ID}"
							})
						});

						//should salestype be visible on the screen?
						$.when(Services.checkShowSalesType()).done(function (bShowSalesType) {
							oSalesType.setVisible(bShowSalesType);
						});

						//apply country filter on tender origin
						var oTenderOrigin = that.getView().byId("idSelectTenderOriginEdit");
						oTenderOrigin.bindItems({
							path: "fastData>/CountryTenderOrigin",
							filters: aFilter,
							parameters: {
								"expand": "TenderOrigin"
							},
							template: new sap.ui.core.Item({
								text: "{fastData>TenderOrigin/NAME}",
								key: "{fastData>TenderOrigin/ID}"
							})
						});

						//should tender origin be visible on the screen?
						$.when(Services.checkShowTenderOrigin()).done(function (bShowTenderOrigin) {
							oTenderOrigin.setVisible(bShowTenderOrigin);
						});

						//apply country filter on contract type
						var oContractType = that.getView().byId("idSelectContractTypeEdit");
						oContractType.bindItems({
							path: "fastData>/CountryContractType",
							filters: aFilter,
							parameters: {
								"expand": "ContractType"
							},
							template: new sap.ui.core.Item({
								text: "{fastData>ContractType/NAME}",
								key: "{fastData>ContractType/ID}"
							})
						});

						//should contract type be visible on the screen?
						$.when(Services.checkShowContractType()).done(function (bShowContractType) {
							oContractType.setVisible(bShowContractType);
						});

						/* End of mexico */

						/* apply country filter on procurement method*/
						let oProcurementMethod = that.getView().byId("idSelectProcurementMethodEdit");

						oProcurementMethod = that.getView().byId("idSelectProcurementMethodEdit");
						oProcurementMethod.bindItems({
							path: "fastData>/CountryProcurementMethod",
							filters: aFilter,
							sorter: new sap.ui.model.Sorter("SORTER"),
							template: new sap.ui.core.Item({
								text: "{fastData>PROCUREMENT_METHOD_ID}",
								key: "{fastData>PROCUREMENT_METHOD_ID}"
							})
						});

						// Dunno why but binding is not always found
						// var oBinding = oTenderType.getBinding("items");
						// //set filter for country on tender type: only when binding of tendertype is found
						// if(oBinding){
						// 	oBinding.filter(aFilter);
						// }
						that.bindAwardCriteria();
						break;

					case Services.getOfferProductPageSectionID():
						//OFFER PRODUCTS TAB

						var oFastAppDataModel = Services.getFastAppDataModel();

						that._showSectionFragment("OfferProductsEdit", "offerProductsId");
						var sOfferID = Services.getSelectedOfferID();
						//in case of reviewed offer, we want to keep the offer?
						if (!Services.getReviewedOfferPressed()) {
							Services.setSelectedOfferID(sOfferID); //keep selected offerID for later use TODO: find better place to fit this method
						}

						//we add the new offer to be addeded, so we can bind the edit view to it
						Services.addNewOfferToFastAppDataModel();

						//apply filter on countrycode for selling company
						var sCountryCode = Services.getCountryCodeofSelectedTender();
						var aFilter = [];
						aFilter.push(new Filter("CountryCode", FilterOperator.EQ, sCountryCode));
						var oList = that.getView().byId("idSellingCompany");
						var oBinding = oList.getBinding("items");
						oBinding.filter(aFilter);

						//apply filter on countrycode and institute for distributor
						var sInstituteId = Services.getInstituteIDofSelectedTender();
						var sChannel = Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');
						var sSellingCompanyID = that.byId("idSellingCompany").getSelectedKey();
						//if no selling company selected, take first selling company in line
						if (!sSellingCompanyID) {
							//load possible selling companies for country
							Services.loadSellingCompaniesForCountry(sCountryCode).then(function (aSellingCompany) {
								if (aSellingCompany) {
									//take first selling company in list
									sSellingCompanyID = aSellingCompany[0].LegalEntityCode;

									//newly filter
									aFilter = [];
									aFilter.push(new Filter("COUNTRY_CODE", FilterOperator.EQ, sCountryCode));
									aFilter.push(new Filter("INSTITUTE_ID", FilterOperator.EQ, sInstituteId));
									aFilter.push(new Filter("CHANNEL", FilterOperator.EQ, sChannel));
									aFilter.push(new Filter("LEGAL_ENTITY_CODE", FilterOperator.EQ, sSellingCompanyID));
									oList = that.getView().byId("idDistributorName");
									oBinding = oList.getBinding("items");
									oBinding.filter(aFilter);

									//set default selling company
									Services.getFastAppDataModel().setProperty("/EditOffer/SellingCompany", sSellingCompanyID);
								}
							});
						} else {
							//set selling company
							Services.getFastAppDataModel().setProperty("/EditOffer/SellingCompany", sSellingCompanyID);
						}

						//TODO: check if this can be removed, or the one higher up
						aFilter = [];
						aFilter.push(new Filter("COUNTRY_CODE", FilterOperator.EQ, sCountryCode));
						aFilter.push(new Filter("INSTITUTE_ID", FilterOperator.EQ, sInstituteId));
						aFilter.push(new Filter("CHANNEL", FilterOperator.EQ, sChannel));
						aFilter.push(new Filter("LEGAL_ENTITY_CODE", FilterOperator.EQ, sSellingCompanyID));
						oList = that.getView().byId("idDistributorName");
						oBinding = oList.getBinding("items");
						oBinding.filter(aFilter);

						//oList.getItems()[0]

						//keep default selected distributor
						var sDistributorID = that.getView().byId("idDistributorName").getSelectedKey();
						Services.setSelectedDistributorID(sDistributorID);
						Services.setPrevSelectedDistributorID(sDistributorID);

						//keep default selected selling company
						var sSellingCompanyID = that.getView().byId("idSellingCompany").getSelectedKey();
						Services.setSelectedSellingCompanyID(sSellingCompanyID);
						Services.setPrevSelectedSellingCompanyID(sSellingCompanyID);

						//keep default selected division
						var sDivisionID = that._country === "ES" ? that.getView().byId("idProductOfferDivisionES").getSelectedKey() : that.getView().byId("idProductOfferDivision").getSelectedKey();
						Services.setSelectedDivisionID(sDivisionID);
						Services.setPrevSelectedDivisionID(sDivisionID);

						//make fields mandatory based on list
						var aMandatoryFields = oFastAppDataModel.getProperty('/MandatoryFields');
						if (aMandatoryFields.length > 0) {
							//in case mandatory fields have been specified for the given country, set these fields as mandatory. 
							//other fields for the given country can be assumed as not being mandatory - therefore, the property required should be set to "false"
							//in case NO mandatory fields have been specified for the given country, the defaulted value on the view will be taken

							// TODO: remove this code after expression binding -> this is to set the required properties
							// for (var i = 0; i < aMandatoryFields.length; i++) {
							// 	that.getView().byId(aMandatoryFields[i].Column).setProperty("required", aMandatoryFields[i].Required);
							// }
						}

						//only in creation modus of an offer we will be able to set the distributor id
						var oDistributor = that.getView().byId("idDistributorName");
						if (Services.getCreationModusOffer()) {
							oDistributor.setEnabled(true);
						} else {
							oDistributor.setEnabled(false);
						}

						//distributor selector should not be shown if there's no given distributor for the selected country
						if(that.byId('idDistributorName') && that.byId('idDistributorName').getSelectedItem() && that.byId('idDistributorName').getSelectedItem().getProperty('text') === 'No Distributor'){
							that.byId('idDistributorName').setVisible(false);
						}

                        //if we're in brazil, filter the offer products by the selected lot ID 
                        if(sCountryCode === 'BR'){
                            let iSelectedLotID = that.getView().byId('idSelectLotView').getSelectedKey();
                            that.filterBySelectedLot(iSelectedLotID);
                        }

						break;

					case Services.getFinancialOfferPageSectionID():
						//FINANCIAL OFFER TAB
						that._showSectionFragment("FinancialOfferEdit", "financialOfferId");
						that.setFinancialOfferEditBinding();
						break;
					case Services.getFinancialOfferPageSectionID_IT():
						//FINANCIAL OFFER TAB for IT
						//Edit offer copy to move back to original values during cancel
						var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
						Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
						break;
                    case Services.getFinancialOfferPageSectionID_ES():
						//FINANCIAL OFFER TAB for ES
						//Edit offer copy to move back to original values during cancel
						var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
						Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
                        that.getView().byId("financialOfferViewId_ES").getController().editFinancialOfferESToggle(Services.getEditMode());
						break;
                    case Services.getFinancialOfferPageSectionID_BR():
                        //FINANCIAL OFFER TAB for BR
                        //Edit offer copy to move back to original values during cancel
                        var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
                        Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
                        that.getView().byId("financialOfferViewId_BR").getController().editFinancialOfferBRToggle(Services.getEditMode());
                        break;                        
					case Services.getQuotationPageSectionID():
									
						//show fragment for TAB: Quotation
						that._showSectionFragment(Services.getFastAppDataModel().getProperty('/permissions/fragments/quotationViewId/fragment'), "quotationId");

						//that.getView().byId("idQofferDate").setEnabled(true);
						let oQofferValidity = that.byId("idQofferValidity");
						if(oQofferValidity){
							oQofferValidity.setEnabled(true);
						}
						that.byId("idQofferEffectiveDate") && that.byId("idQofferEffectiveDate").setEnabled(true);
						that.byId("idQofferExpiryDate") && that.byId("idQofferExpiryDate").setEnabled(true);
						let oCustomRemark = that.byId("idCustomRemark");
						if(oCustomRemark){
							oCustomRemark.setEnabled(true);
						}
						let oSelectIssuedBy = that.byId("idSelectIssuedBy");
						if (oSelectIssuedBy){
							oSelectIssuedBy.setEnabled(true);
						}
						let oSelectCompanyStamp = that.byId("idSelectCompanyStamp");
						if(oSelectCompanyStamp){
							oSelectCompanyStamp.setEnabled(true);
						}
						let oDelayInSubmission = that.getView().byId("idDelayInSubmission");
						if(oDelayInSubmission){
							oDelayInSubmission.setVisible(false);
						}
						that.getView().byId("btnSaveQuotation").setVisible(false);
						//that.getView().byId("idLabelDelayInSubmission").setVisible(false);

						let oBtnDownloadQuotation = that.byId("btnDownloadQuotation");
						if(oBtnDownloadQuotation){
							oBtnDownloadQuotation.setEnabled(false);
						}

						that.getView().byId("btnSubmitQuotation").setVisible(false);
						break;
					case Services.getTenderResultsPageSectionID():
						//TENDER RESULTS TAB
						that.onTenderResultsOfferPress(oEvent);
						//FOR THE NEW tree table
						//that.onOutcomeTableEditMode();
						that.onEditOutcomTreeTable();
						break;

					case Services.getDeliveryTrackingPageSectionID():

						//DELIVERY TRACKING TAB
						//that.getView().byId("deliveryTrackingViewId").byId("idAddDelv").setVisible(true);
						//that.getView().byId("idDelDelv").setVisible(true);
						//that.getView().byId("deliveryTrackingViewId").byId("idAddLtr").setVisible(true);
						//that.getView().byId("idDelLtr").setVisible(true);
						break;

						
					default: 
							break;
					}

					

				});

			}

			//if editing is not allowed (combination status, page, creation modus yes/no..)
			if (!bEditAllowed) {
				//we should stay in display
				return;
			}

			//switch between edit mode and display mode by showing/hiding footer
			oObjectPage.setShowAnchorBar(bCurrentShowFooterState);
			oObjectPage.setShowFooter(!bCurrentShowFooterState);

			//Make an array of the Action buttons, so they can be enabled/disabled
			var ToggleEnabledButtons = [
				//"deleteButtonId",
				"deleteTenderButtonId",
				"editButtonId",
				"cloneButtonId",
				"refreshButtonId"
			];

			//enable, disable each action button
			ToggleEnabledButtons.forEach(function (updateButtonId) {
				var updateButton = that.byId(updateButtonId);
				updateButton.setEnabled(bCurrentShowFooterState);
				updateButton.setVisible(true);

				if(updateButtonId === 'cloneButtonId' && (Services.getSelectedCountry() === 'IT' || Services.getSelectedCountry() === 'ES')){
				updateButton.setVisible(false);
				}
			});

		},

		reloadCountrySpecificData: function(sCountryCode){

			if(!sCountryCode || sCountryCode.indexOf("NA") > -1){
				return;
			}

			const that = this;

			// fetches dropdown data
			Services.loadCountryClassifications(sCountryCode).then(() => { 
				
				that.getClassificationId().then(async sClassificationId => {
					if(sClassificationId){
						Services.loadCountrySpecifications(sCountryCode, sClassificationId);
						Services.loadCountryBiddingTypeLevel1(sCountryCode, sClassificationId);
					}

					let sBiddingTypeLevel1Id = await that.getBiddingTypeLevel1Id();
					let sBiddingTypeLevel2Id = await that.getBiddingTypeLevel2Id();
					
					Services.loadCountryBiddingTypeLevel2(sCountryCode, sBiddingTypeLevel1Id);
					Services.loadCountryBiddingTypeLevel3(sCountryCode, sBiddingTypeLevel2Id);
				}); 

				// Brazil only - Classification should default to Tender
				const oSelectClassification = that.byId("idClassification");
				if(Services.getSelectedCountry() === 'BR' && oSelectClassification){
					oSelectClassification.setSelectedKey('Tender');
					oSelectClassification.setEnabled(false);
				};
				
			});

			Services.loadCountryChannels(sCountryCode);
			Services.loadCountryCompetitors(sCountryCode);
			Services.loadCountryOutcomes(sCountryCode);
            Services.loadCountryOfferTypes(sCountryCode);
            if(sCountryCode === 'ES') Services.loadCountryApprovers(sCountryCode);
			that.setCountrySpecificDropDowns();

			// set the selected keys on the dropdowns
			that.setTenderBiddingTypeLevel1SelectedKey()
				.then(that.setTenderBiddingTypeLevel2SelectedKey.bind(that))
					.then(that.setTenderBiddingTypeLevel3SelectedKeys.bind(that));
			
			that.setTenderSpecificationsSelectedKeys(Services.getSelectedTenderID());

		},

		//Delete tender
		onDeleteTenderPress: function (oEvent) {

			//that is this, to keep reference to controller
			var that = this;
            let oTender = Services.getFastAppDataModel().getProperty('/Tender');
            let oMsg = oTender.CountryCode === 'ES' ? `Are you sure you want to delete the ${oTender.Classification.toLowerCase()}?` : `Are you sure you want to delete the tender?`
			//successfully created clone
			sap.m.MessageBox.warning(oMsg, {
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.ABORT],
				styleClass: "sapUiSizeCompact",
				onClose: function (sAction) {
					if (sAction === "ABORT") {
						sap.m.MessageToast.show("...aborted...");
					} else {
						that._deleteTender();
					}

				}
			});

		},

		//Delete tender continue
		_deleteTender: function () {

			var that = this;

			var oFastAppDataModel = Services.getFastAppDataModel();
			var aOffers = oFastAppDataModel.getProperty("/Tender/Offer/results");

			//first of all we say that Deletion is allowed
			var bStatusAllowingDelete = true;

			//catch all promises in an array
			let promises = [];

			//check if offers exists
			if (aOffers) {

				//loop at offers 
				aOffers.forEach(function (oOffer, index) {

					//check only valid for active offers... inactive offers can be deleted even in wrong status
					if (oOffer.Active === 1) {

						//check the offer status
						promises.push($.when(Services.checkOfferStatus(oOffer.TenderID, oOffer.OfferID)).done(function (oData) {

							//Status in which deleting of the offer is not allowed
							var aStatusNoDelete = [
								"Awaiting Approval",
								"Quotation Submitted",
								"In FOC Negotiation",
								"Appeal in Progress",
								"Results Recorded",
								"Delivery Ongoing"
							];

							//check if status is within the list of statusses wich do not allow deletion
							if ($.inArray(oData.STATUS, aStatusNoDelete) !== -1) {
								bStatusAllowingDelete = false;
							}

						}));

					} else {
						//go back to display mode				
						sap.m.MessageBox.warning("There is an offer in this tender with a status wich is not allowed for deletion.", {});
						return;
					}

				});

			} else {
				//it is allowed to delete a tender without offers
				bStatusAllowingDelete = true;
			}

			//if all checks on status are done
			Promise.all(promises).then((result) => {

				//no deletion possible
				if (bStatusAllowingDelete) {

					//execute deletion
					Services.saveSoftDeleteTender().then(function (oResult) {

						//go back to master
						that.handleClose();

						//deletion success
						MessageToast.show("Tender is successfully removed..");

					});

				} else {

					//go back to display mode				
					sap.m.MessageBox.warning("There is an offer in this tender with a status wich is not allowed for deletion.", {});
					return;

				}

			});

		},

		//Edit button is pressed
		onEditButtonPress: function () {

			// keep track of button that is pressed
			Services.setEditPressed(true);

			//Selected offerID
			var sOfferID = Services.getSelectedOfferID();
			Services.setSelectedOfferID(sOfferID); //keep selected offerID for later use TODO: find better place to fit this method

			//get selected productID
			var sProductCode = Services.getSelectedProductID();

			//check what the selected section is
			var oObjectPage = this.getView().byId("DetailPage");
			var sSelectedSection = oObjectPage.getSelectedSection();

			//check if selected offer was available in table
			var bSelectedOfferAvailable = Services.getSelectedOfferAvailable(true);

			if((sSelectedSection === Services.getFinancialOfferPageSectionID_IT() || sSelectedSection === Services.getFinancialOfferPageSectionID_ES() || sSelectedSection === Services.getFinancialOfferPageSectionID_BR()) && Services.getSelectedProductID() === ''){

				sap.m.MessageBox.warning("First select an product to edit.", {});

			} else {

			if (sOfferID && bSelectedOfferAvailable) {
				//ProductID should be selected on some tabs
				if (
					(sSelectedSection === Services.getDeliveryTrackingPageSectionID() || sSelectedSection === Services.getFinancialOfferPageSectionID()) &&
					!sProductCode
				) {
					sap.m.MessageBox.warning("First select an product to edit.", {});
				} else {
					//switch to correct view edit/display
					this.onEditToggleButtonPress();
				}

			} else {
				//warning should only appear on Offerproduct tab
				if (sSelectedSection !== Services.getBasicInformationPageSectionID()) {
					sap.m.MessageBox.warning("First select an offer to edit.", {});
				} else {
					//switch to correct view edit/display
					this.onEditToggleButtonPress();
				}
			}

		}

		},

		//Clone action button on top of the screen
		onCloneButtonPress: function () {

			//that is this, to keep reference to controller
			var that = this;

			//successfully created clone
			sap.m.MessageBox.warning(
				"Are you sure you want to create a clone? This will include: Tender & Award Criteria, Offers, Products, Prices...", {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.ABORT],
					styleClass: "sapUiSizeCompact",
					onClose: function (sAction) {
						if (sAction === "ABORT") {
							sap.m.MessageToast.show("...aborted...");
						} else {
							that._cloneTender();
						}
					}
				});

		},

		_cloneTender: function () {

			//that is this, to keep reference to controller
			var that = this;
			var oOfferFragment = new OfferProducts();

			//keep track that the clone button is pressed
			Services.setClonePressed(true);

			//Deep copy of Tender to save
			var oFastAppData = Services.getFastAppDataModel();
			let oTenderToClone = $.extend(true, {}, oFastAppData.getProperty("/Tender"));

			//convert dates
			if (moment(oTenderToClone.PublicationDate).year() < 1900) {
				oTenderToClone.PublicationDate = null;
			}
			if (moment(oTenderToClone.BidDueDate).year() < 1900) {
				oTenderToClone.BidDueDate = null;
			}
			if (moment(oTenderToClone.AwardDate).year() < 1900) {
				oTenderToClone.AwardDate = null;
			}
			if (moment(oTenderToClone.NextPublicationDye).year() < 1900) {
				oTenderToClone.NextPublicationDye = null;
			}

			if (moment(oTenderToClone.TerminationDate).year() < 1900) {
				oTenderToClone.TerminationDate = null;
			}
			//check if original data is valid (could be invalid due to data inconcistancy)
			//if data of origanal clone is not valid, end-user should fix original Tender data first
			var oTenderToCheck = Services.getService('Tender').getConvertTenderToSave(oTenderToClone);

			//check if data is correct for the original tender
			//if this fails, the end-user should change original tender first
			var bCheckForTenderToClone = true;
			if (Services.checkBasicInfo(oTenderToCheck, bCheckForTenderToClone)) {

				Services.saveCloneTender(oTenderToClone, oOfferFragment).then(function (oResult) {

					//successfully created clone
					sap.m.MessageBox.success("Clone created with ID (" + oResult.TenderID + ").", {
						actions: ["Go to new Tender", sap.m.MessageBox.Action.CLOSE],
						styleClass: "sapUiSizeCompact",
						onClose: function (sAction) {
							if (sAction === "CLOSE") {
								sap.m.MessageToast.show("Clone creation done...");
							} else {

								//clear everything thats needed to be cleared
								Services.clearAllForBasicInfoPage();
								Services.clearAllForOfferProductPage();
								Services.clearAllForTenderResultsPage();
								Services.clearAllForDeliveryTrackingPage();
								Services.clearSelectedOffer();
								Services.clearSelectedProduct();

								//switch to display mode
								that.onEditToggleButtonPress();

								//navigate to newly saved Tender
								that.oRouter.navTo("detail", {
									layout: "TwoColumnsMidExpanded",
									tender: oResult.TenderID,
									offer: oResult.OfferID,
									tab: Services.getBasicInformationPageSectionID(), //basic information tab
									country: that._country
								});

							}
						}
					});

				});

			}

		},

		//FOOTER action button SAVE
		onCancelButtonPress: function (oEvent) {

			//get the selected tender path
			var sTenderPath = Services.getSelectedTenderPath();
			var sTenderID = Services.getSelectedTenderID();

			var that = this;

			//when we cancel, we load the data again, so changes are undone
			var bLoadedCheck = false;

			//we are no longer in edit mode
			Services.getEditMode(false);

			//check if we are in creation modus of new tender & expanded the view so we come again to onRouteMatched
			var sNewTenderNo = Services.getNewTenderNo();

			if (sTenderPath === "/PT_TMTEND('1')" || sNewTenderNo) {

				//clear everything thats needed to be cleared when going back to the masters screen
				Services.clearAllForBasicInfoPage();
				Services.clearAllForOfferProductPage();
				Services.clearAllForTenderResultsPage();
				Services.clearAllForDeliveryTrackingPage();
				Services.clearSelectedOffer();
				Services.clearSelectedProduct();
				that.byId("idRegionEdit").setSelectedKeys([]);

				//we go back to tender master screen
				this.oRouter.navTo("master", {
					//tender: sTenderPath,
					country: this._country,
					layout: "OneColumn"
				});

				this.clearQuotationElements();

			} else {

				//we stay on the screen and reload the data 

				//get selected section
				var oObjectPage = that.getView().byId("DetailPage"),
					bCurrentShowFooterState = oObjectPage.getShowFooter();
				var sSelectedSection = oObjectPage.getSelectedSection();

				//data model
				var oFastAppDataModel = Services.getFastAppDataModel();

				//keep selected offerID & offerPath
				var sSelectedOfferID = Services.getSelectedOfferID();
				var sSelectedOfferPath = Services.getSelectedOfferPath();

				//clear data so it can be loaded again (we should clear more specific as shown below)
				//oFastAppDataModel.setData(null);

				//In this case we might have done some changes in the fastAppData model, we will load all data from the database again
				$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {
					//clear everything thats needed to be cleared when going back to the masters screen
					switch (sSelectedSection) {
					case Services.getBasicInformationPageSectionID():

						//editTender binding
						var oTender = Services.getLoadedTender();
						oFastAppDataModel.setProperty("/EditTender/", oTender);

					case Services.getOfferProductPageSectionID():

						//if we are on Offer Product Page we should clear the following
						Services.clearAllForOfferProductPage();
                        const aLotsPreviousState = Services.getLotsBeforeEdit();
                        const bindingPath = "/EditOffer/Lots/results";
                        if(aLotsPreviousState.length != 0) oFastAppDataModel.setProperty(bindingPath, aLotsPreviousState); //having entries here, would imply that we've edited the lots for the selected offer
                                                                                                                           //if these were not edited, no restore of their original state should happen
						const financialOfferViewBrazil = that.getView().byId("financialOfferViewId_BR");
						if(financialOfferViewBrazil){
							// clear the channel change warning message
							financialOfferViewBrazil.getModel("viewModel").setProperty("/OfferProductsChannelWarningMessage","");
						}
						break;
					case Services.getFinancialOfferPageSectionID():
					case Services.getFinancialOfferPageSectionID_IT():
						//show offer table content, so there is more space on the screen
						//that.getView().byId("panelFinancialOfferTableID").setExpanded(true);

						//make sure selected offer & product is still shown
						Services.setSelectedOfferID(sSelectedOfferID);
						Services.setSelectedOfferPath(sSelectedOfferPath);

						//check for approval enabled 
						var oOffer = Services.getLoadedOffer(sSelectedOfferID);

						var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);
						that.byId("ApprovalButtonId").setEnabled(bEnableApproval);

						//Italy has its own products table
						switch (sSelectedSection) {
							case Services.getFinancialOfferPageSectionID():
								//select offer again
								that.onFinancialOfferItemPress();
								break;
							case Services.getFinancialOfferPageSectionID_IT():
								//select offer again
								var oView = that.getView().byId("financialOfferViewId_IT");
								var oFinOfferController = oView.getController();
								oFinOfferController.refreshFinancialTabIT();
								break;
							default:
								break;
						}
						break;
                    case Services.getFinancialOfferPageSectionID_ES():
						//show offer table content, so there is more space on the screen
						//that.getView().byId("panelFinancialOfferTableID").setExpanded(true);

						//make sure selected offer & product is still shown
						Services.setSelectedOfferID(sSelectedOfferID);
						Services.setSelectedOfferPath(sSelectedOfferPath);

						//check for approval enabled 
						var oOffer = Services.getLoadedOffer(sSelectedOfferID);

						var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);
						that.byId("ApprovalButtonId").setEnabled(bEnableApproval);

						//Italy has its own products table
						switch (sSelectedSection) {
							case Services.getFinancialOfferPageSectionID():
								//select offer again
								that.onFinancialOfferItemPress();
								break;
							case Services.getFinancialOfferPageSectionID_ES():
								//select offer again
								var oView = that.getView().byId("financialOfferViewId_ES");
								var oFinOfferController = oView.getController();
								oFinOfferController.refreshFinancialTabES();
								break;
							default:
								break;
						}
						break;
                    case Services.getFinancialOfferPageSectionID_BR():
						//show offer table content, so there is more space on the screen
						//that.getView().byId("panelFinancialOfferTableID").setExpanded(true);

						//make sure selected offer & product is still shown
						Services.setSelectedOfferID(sSelectedOfferID);
						Services.setSelectedOfferPath(sSelectedOfferPath);

						//check for approval enabled 
						var oOffer = Services.getLoadedOffer(sSelectedOfferID);

						var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);
						that.byId("ApprovalButtonId").setEnabled(bEnableApproval);

						//Italy has its own products table
						switch (sSelectedSection) {
							case Services.getFinancialOfferPageSectionID():
								//select offer again
								that.onFinancialOfferItemPress();
								break;
							case Services.getFinancialOfferPageSectionID_BR():
								//select offer again
								var oView = that.getView().byId("financialOfferViewId_BR");
								var oFinOfferController = oView.getController();
								oFinOfferController.refreshFinancialTabBR();
								break;
							default:
								break;
						}
						break;
					case Services.getQuotationPageSectionID():
						//show offer table content, so there is more space on the screen
						//that.getView().byId("panelQuotationOfferTableID").setExpanded(true);

						//make sure selected offer & product is still shown
						Services.setSelectedOfferID(sSelectedOfferID);
						Services.setSelectedOfferPath(sSelectedOfferPath);

						//select offer again
						that.onQuotationOfferItemPress();
						break;
					case Services.getTenderResultsPageSectionID():

						//Clear all fields for delivery tracking
						Services.clearAllForTenderResultsPage();

						//make sure selected offer & product is still shown
						Services.setSelectedOfferID(sSelectedOfferID);
						Services.setSelectedOfferPath(sSelectedOfferPath);

						//show offer table content, so there is more space on the screen
						//that.getView().byId("panelTenderResultsOfferTableID").setExpanded(true);

						//select offer again
						that.onTenderResultsOfferPress();
						break;
					case Services.getDeliveryTrackingPageSectionID():

						//Clear all fields for delivery tracking
						Services.clearAllForDeliveryTrackingPage();

						//Set selected offer in left pane
						that._selectOfferInLeftPane(sSelectedOfferID);

						//reselect same offer if it exists, otherwise clear offer selected
						//TODO when offer table is removed on each tab, this will no longer be needed
						//that._selectOfferInOfferTable("deliveryTrackingOfferTableViewID","deliveryTrackingOfferTableOfferID");

						/*if (Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)) {
							that.oDeliveryTrackingController.onDelivryTrackingOfferPress();
						}*/
						that.oDeliveryTrackingController.onCancelDeliveryEdit();
						that.oDeliveryTrackingController.onCancelReturnEdit();

						//show offer table content, so there is more space on the screen
						//that.getView().byId("panelDeliveryTrackingOfferTableID").setExpanded(true);
						that.getView().byId("deliveryTrackingViewId").byId("idDeliveryDetailSection").setVisible(false);
						that.getView().byId("deliveryTrackingViewId").byId("idLetterDetailSection").setVisible(false);
						break;
					}

					//switch between View/Edit
					that.onEditToggleButtonPress();

					//this way we can use a seperate layer, adding deleting... and afterords saving
					that.getView().setModel(oFastAppDataModel, "fastAppData");

				});

			}

		},

		//when save button is pressed on top of split layout
		onSaveButtonPress: function (oEvent) {

			var that = this;
			var sSelectedSection = that.getView().getContent()[0].getSelectedSection();

			//Check which sub section of the page is currently selected
			switch (sSelectedSection) {

			case Services.getBasicInformationPageSectionID():

				//BASIC INFORMATION TAB
				that._onSaveBasicInfo(oEvent);
				break;

			case Services.getOfferProductPageSectionID():

				//OFFER PRODUCTS TAB
				that._onSaveOfferProduct(oEvent);
				break;

			case Services.getFinancialOfferPageSectionID():

				//FINANCIAL OFFER TAB

				//show loading screen
				//that.getView().setBusyIndicatorDelay(1); //busy indicator shown immediately
				that.getView().setBusy(true);

				
				var offerFragment = new OfferProducts();

				//offerFragment.updateFinancialOffer(oEvent, this);
				offerFragment.updateFinancialOffer(oEvent, this).then((response) => {

					//screen is updated with new calculated fields, we can continue with saving
					that._onSaveFinancialOffer(oEvent).then((response) => {
						that.getView().setBusy(false);
					});

				});
				
				break;
			case Services.getFinancialOfferPageSectionID_IT():

				//FINANCIAL OFFER TAB italy specific
				that.getView().setBusy(true);
				var oView = this.getView().byId("financialOfferViewId_IT");
				var oFinOfferController = oView.getController();
				oFinOfferController.onSaveFinancialOfferItaly();
				that.getView().setBusy(false);
				break;

            case Services.getFinancialOfferPageSectionID_ES():

				//FINANCIAL OFFER TAB spain specific
				that.getView().setBusy(true);
				var oView = this.getView().byId("financialOfferViewId_ES");
				var oFinOfferController = oView.getController();
				oFinOfferController.onSaveFinancialOfferSpain();
				that.getView().setBusy(false);
				break;

            case Services.getFinancialOfferPageSectionID_BR():

                    //FINANCIAL OFFER TAB spain specific
                    that.getView().setBusy(true);
                    var oView = this.getView().byId("financialOfferViewId_BR");
                    var oFinOfferController = oView.getController();
                    oFinOfferController.onSaveFinancialOfferBrazil();
                    that.getView().setBusy(false);
                    break;	

			case Services.getQuotationPageSectionID():

				//QUOTATION TAB
				that._onSaveQuotation(oEvent);
				break;

			case Services.getTenderResultsPageSectionID():

				//TENDER RESULTS TAB
				var path = oEvent.getSource().getBindingContext("fastData").getPath();
				var oRefre = oEvent.getSource();
				that._onSaveTenderResults(path, oRefre);
				break;

			case Services.getDeliveryTrackingPageSectionID():

				//DELIVERY TRACKING TAB
				this.oDeliveryTrackingController._onSaveDelvrTracking(oEvent);
				//this.byId("idDeliveryDetailSection").setVisible(false);
				if(Services.getSelectedCountry() != 'CL'){
					this.oDeliveryTrackingView.byId("idLetterDetailSection").setVisible(false);
				}
				break;

			default:
				// code block
			}

		},

		//get offertable & offerID column index
		_getOfferTableForTab: function (sSelectedSection) {

			var that = this;

			//init
			var oOffersTable = null;
			var iIndexColumnOfferID = 0;
			var sOfferTableID = "";
			var sOfferColumnID = "";

			//Check on wich tab we are
			switch (sSelectedSection) {

				//Basic information tab
			case Services.getBasicInformationPageSectionID():

				//no offer table available on this tab
				break;

				//Offer products tab
			case Services.getOfferProductPageSectionID():

				//Get offer table + column from where we can check if offer is valid for tab
				//oOffersTable = that.getView().byId("productOffersTableViewID");
				//iIndexColumnOfferID = this.getView().byId("productOffersTableOfferID").getOrder();	

				break;

				//Financial offer tab
			case Services.getFinancialOfferPageSectionID():

				//Get offer table + column from where we can check if offer is valid for tab
				//oOffersTable = that.getView().byId("financialOffersTableViewID");
				//iIndexColumnOfferID = this.getView().byId("financialOffersTableOfferID").getOrder();	

				break;

				//Quotation tab	
			case Services.getQuotationPageSectionID():

				//Get offer table + column from where we can check if offer is valid for tab

				//oOffersTable = that.getView().byId("quotationOffersTableViewID");
				//iIndexColumnOfferID = this.getView().byId("quotationOffersTableOfferID").getOrder();

				break;

				//Results tab
			case Services.getTenderResultsPageSectionID():

				//Get offer table + column from where we can check if offer is valid for tab
				//	oOffersTable = that.getView().byId("tenderResultsOfferTableViewID");
				//	iIndexColumnOfferID = this.getView().byId("tenderResultsOfferTableOfferID").getOrder();

				break;

				//Delivery Tracking
			case Services.getDeliveryTrackingPageSectionID():

				//Get offer table + column from where we can check if offer is valid for tab
				//	oOffersTable = that.getView().byId("deliveryTrackingOfferTableViewID");
				//	iIndexColumnOfferID = this.getView().byId("deliveryTrackingOfferTableOfferID").getOrder();	

				break;

			default:

				//Nothing
				break;

			}

			if (oOffersTable) {
				sOfferTableID = oOffersTable.getId();
				if (iIndexColumnOfferID >= 0) {
					sOfferColumnID = oOffersTable.getColumns()[iIndexColumnOfferID].getId();
				}
			}

			//return result
			var oResult = {
				_oOffersTable: oOffersTable,
				_sOfferTableID: sOfferTableID,
				_iIndexColumnOfferID: iIndexColumnOfferID,
				_sOfferColumnID: sOfferColumnID
			}

			return oResult;

		},

		//NAVIGATION ACTIONS
		//------------------

		//NAVIGATION ACTION: Full screen
		handleFullScreen: function () {

			//get parameters
			var sTenderID = Services.getSelectedTenderID();
			var sOfferID = Services.getSelectedOfferID();
			var sTab = Services.getSelectedTab();

			this.oRouter.navTo("detail", {
				layout: "MidColumnFullScreen",
				tender: sTenderID,
				offer: sOfferID,
				tab: sTab,
				country: this._country,
				samePage: true
			});

			//TODO this can be handled in a more default SAP way: check https://sapui5.hana.ondemand.com/#/topic/933965ba8c0440308e1e3233be7bc52f.html
			this.getView().byId("enterFullScreenButton").setVisible(false);
			this.getView().byId("exitFullScreenButton").setVisible(true);

		},

		//NAVIGATION ACTION: Exit Full screen
		handleExitFullScreen: function () {

			//get current selected tender
			var sTenderID = Services.getSelectedTenderID();
			var sOfferID = Services.getSelectedOfferID();
			var sTab = Services.getSelectedTab();

			//we change layout
			this.oRouter.navTo("detail", {
				layout: "TwoColumnsMidExpanded",
				tender: sTenderID,
				offer: sOfferID,
				tab: sTab,
				country: this._country,
				samePage: true
			});

			this.getView().byId("exitFullScreenButton").setVisible(false);
			this.getView().byId("enterFullScreenButton").setVisible(true);

		},

		//NAVIGATION ACTION: Closing current view
		handleClose: function () {
			var sTenderID = Services.getSelectedTenderID();

			//clear everything thats needed to be cleared when going back to the masters screen
			Services.clearAllForBasicInfoPage();
			Services.clearAllForOfferProductPage();
			Services.clearAllForDeliveryTrackingPage();
			Services.clearAllForTenderResultsPage();

			//clearing when going back to the main screen
			Services.clearSelectedOffer();
			Services.clearSelectedProduct();

			Services.clearProductsForOffer();
			Services.clearResultsForProducts();
			Services.clearDeliveriesForProduct();
			Services.clearLettersForProduct();
			Quotation.clearQuotationOfferProducts();

			let oRegionEdit = this.byId("idRegionEdit");
			if(oRegionEdit){
				oRegionEdit.setSelectedKeys([]); // clear the region selected keys
				oRegionEdit.setVisible(false); // hide regions
			}

			//tender should no longer be selected
			var oFastAppDataModel = Services.getFastAppDataModel();
			oFastAppDataModel.setProperty("/Tender", null);

			this.clearQuotationElements();
			
			// hide country specific fields

			//navigate back to master screen
			this.oRouter.navTo("master", {
				//tender: sTenderID,
				country: this._country,
				layout: "OneColumn"
			});

		},

		// TODO: improve the way of handeling of duplicate ID's. 
		clearQuotationElements: function(){
			//in order to have multiple views / country working correctly, all element ID's should be destroyed when closing a Tender
			//Otherwise, an error message will be thrown which informs the user that ID's with the same name are being added multiple times
			if(this._pageFragments){
				if(this._pageFragments.QuotationView_AR){
					this._pageFragments.QuotationView_AR = null;
				}

				if(this._pageFragments.QuotationView){
					this._pageFragments.QuotationView = null;
				}

				if(this._pageFragments.QuotationView_TH){
					this._pageFragments.QuotationView_TH = null;
				}

				if(this._pageFragments.QuotationView_CL){
					this._pageFragments.QuotationView_CL = null;
				}

				if(this._pageFragments.QuotationView_IT){
					this._pageFragments.QuotationView_IT = null;
				}

                if(this._pageFragments.QuotationView_ES){
					this._pageFragments.QuotationView_ES = null;
				}

				if(this._pageFragments.QuotationView_BR){
					this._pageFragments.QuotationView_BR = null;
				}
			}

			let oQuotationNoOfferSubsection = this.byId('QuotationNoOfferSubsection');
			if(oQuotationNoOfferSubsection){
				this.byId('QuotationNoOfferSubsection').destroy();
			}
			let oQuotationOfferSubsection = this.byId('QuotationOfferSubsection');
			if(oQuotationOfferSubsection){
				this.byId('QuotationOfferSubsection').destroy();
			}
		},

		//DELIVERY TRACKING TAB & FINANCIAL OFFER TAB
		//-------------------------------------------

		//when items are bound and displayed on the view, we should select the first item
		onBindingItemsFinished: function (oEvent) {

			var that = this;

			//if we are in financial offer tab, we should auto select first product
			var oObjectPage = this.getView().byId("DetailPage");
			var sSelectedSection = oObjectPage.getSelectedSection();

			//check the page we are on, only for finacial offer page this is applicable 
			//+ not if navigate back to the tender master page (so selectedtender is back to PT_TMTEND)
			if (
				Services.getSelectedTenderPath() !== '/PT_TMTEND' && (sSelectedSection === Services.getFinancialOfferPageSectionID())
			) {

				var oListProducts = {};

				//depending on the tab we are on.. we should select first product of table
				switch (sSelectedSection) {
				case Services.getFinancialOfferPageSectionID():
					oListProducts = this.getView().byId("idFinancialOfferViewProduct");
					break;
					// case Services.getDeliveryTrackingPageSectionID():
					// 	oListProducts = this.getView().byId("idDeliveryTrackViewProduct");
					// 	break;
				}

				//check if offer is valid for selection
				if (Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), sSelectedSection)) {

					//if table is found		
					if (!$.isEmptyObject(oListProducts)) {
						var aItems = oListProducts.getItems();
						if (aItems[0]) {
							var sProductPath = Services.getSelectedProductPath();
							if (!sProductPath) {
								oListProducts.setSelectedItem(aItems[0], true);
								aItems[0].setSelected(true);
								//aItems[0].setActive(true);

								//if no product is selected, we should select the first product in the list
								sProductPath = aItems[0].getBindingContextPath();
								Services.setSelectedProductPath(sProductPath);
							}

							//depending on the tab we are on, we should call deferent method
							switch (sSelectedSection) {
							case Services.getFinancialOfferPageSectionID():
								that.onFinancialOfferProductItemPress(oEvent, sProductPath);
								break;
								// case Services.getDeliveryTrackingPageSectionID():
								// 	that.onDeliveryTrackProductItemSelect();
								// 	break;
							}

						}
					}

				}
			}

		},

		//FINANCIAL OFFER TAB
		//-------------------

		//click on offer on FINANCIAL OFFER TAB
		onFinancialOfferItemPress: function () {

			//this is that
			var that = this;

			//get page
			var oDetailPage = that.getView().byId("DetailPage"),
				bCurrentShowFooterState = oDetailPage.getShowFooter(),
				sSelectedSection = oDetailPage.getSelectedSection();

			//get selected offerID
			var sOfferID = Services.getSelectedOfferID();

			//get default model
			var oDefaultModel = Services.getDefaultModel();

			//get & keep offerPath 
			var sOfferPath = oDefaultModel.createKey("/PT_TMOFRS", {
				OfferID: sOfferID
			});
			Services.setSelectedOfferPath(sOfferPath);

			//if you click on an offer it is available (sometimes it is not availble when you switch between tabs)
			Services.setSelectedOfferAvailable(true);

			var oOffer = Services.getLoadedOffer(sOfferID); //Services.getDefaultModel().getProperty(sOfferPath);
			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
			Services.setSelectedDistributorID(oOffer.DistributorID);

			//Financial offer data	
			var offerFragment = new OfferProducts();
			var oDetailController = that;
			offerFragment.setFinancialOfferDisplayBinding(oDetailController);
			var oSection = this.byId("FinPricingOfferSubsection");
			oSection.setVisible(false);

			//check for approval enabled 
			var bEnableApproval = Financial.checkAllProductPricesSet(oOffer);

			if (oOffer.Active !== 1 || oOffer.ActiveOffer !== 1) {
				bEnableApproval = false;
			}

			this.byId("ApprovalButtonId").setEnabled(bEnableApproval);

		},

		//click on product on FINANCIAL OFFER TAB
		onFinancialOfferProductItemPress: function (oEvent, sProductPath) {

			var oPricingSection = this.byId("FinPricingOfferSubsection");
			if (oPricingSection) {
				oPricingSection.setVisible(true);
			}

			oPricingSection = this.byId("idPricingOffer");
			if (oPricingSection) {
				oPricingSection.setVisible(true);
			}
			var offerFragment = new OfferProducts();
			if (!sProductPath) {
				sProductPath = oEvent.getSource().getBindingContext("fastData").getPath();
			}
			this.pPath = sProductPath; //todo is this needed, should we work with selectedProductPath

			//keep selected product
			var oDefaultModel = Services.getDefaultModel();
			if (oDefaultModel) {
				var oProduct = oDefaultModel.getProperty(sProductPath);
			}
			if (oProduct) {
				var sProductName = oDefaultModel.getProperty("/" + oProduct.SKU.__ref).PRODUCTPACKNAME;
				Services.setSelectedProductPath(sProductPath);
				if (sProductName) {
					Services.setSelectedProductName(sProductName);
				}
				Services.setSelectedProductID(oProduct.ProductCode);
			}

			//Product selected
			offerFragment.onProductSelected(this, sProductPath);

		},

		//Approval button on Finacial page
		onApprovalsPress: function (oEvent) {

			//get selected offer
			var sOfferID = Services.getSelectedOfferID();
			var that = this;

			//Check if offer is selected
			if (sOfferID) {

				//loading offer validation
				$.when(Services.loadOfferValidation(sOfferID)).done(function(oData){
					if(oData.results[0].IN_POLICY === false){
						$.when(Services.loadOfferProductValidation(sOfferID)).done(function(oData){
							let aProducts = oData.results;
							let aProductsNotValid = aProducts.filter(product => product.IN_POLICY === false);
							let productNames = aProductsNotValid.map(product => product.PRODUCTNAME);

							if(aProductsNotValid.length > 0 ){
								sap.m.MessageBox.error(`The following products do not have prices that comply with their pricing policy: \n\n ${productNames.join()}`);
							}
						});
					} else {

						//check the offer status
						$.when(Services.checkOfferStatus()).done(function (oData) {

							//Cancel of appproval is only possible when offer status = "Awaiting Approval"
							var bCancelEnabled = false;
							var bSendApprovalEnabled = false;

							if (oData.STATUS === "Awaiting Approval") {
								bCancelEnabled = true;
							}

							if (oData.STATUS !== "Quotation Submitted" && oData.STATUS !== "Results Recorded" && oData.STATUS !== "In FOC Negotiation" && oData.STATUS !== "Appeal in Progress" && oData.STATUS !== "Delivery Ongoing" ) {
										bSendApprovalEnabled = true;
								
								
							}

							//load additional approval data
							$.when(Services.loadApprovalsForOffer(sOfferID)).done(function (oData) {

								//show dialog
								if (!that._oDialogApproval) {
									that._oDialogApproval = new sap.m.Dialog("handleApprovalDialog", {
										//title: bundle.getText("Approvals"),
										resizable: true, //user is able to resize
										stretch: true, //dialog is as big as possible
										buttons: [
											new sap.m.Button({
												id: "btnSendApproval",
												text: bundle.getText("SendApprReq"),
												tap: [that.onSendApprovals, that],
												enabled: bSendApprovalEnabled
											}),
											new sap.m.Button({
												id: "btnCancelApproval",
												text: bundle.getText("CancelApprReq"),
												tap: [that.onCancelApprovals, that],
												enabled: bCancelEnabled
											}),
											new sap.m.Button("btnCloseApproval", {
												id: "btnCloseApproval",
												text: bundle.getText("Close"),
												tap: [that.onCloseApprovalsDialog, that]
											})
										],
										//content with all fields that need to be filled
										content: [sap.ui.xmlfragment("FAST_NS0FAST0.fragments.HandleApprovals", that)]
											// End of content of dialog
									});
								} else {
									//if dialog already build...
									sap.ui.getCore().byId("btnCancelApproval").setEnabled(bCancelEnabled);
									sap.ui.getCore().byId("btnSendApproval").setEnabled(bSendApprovalEnabled);
								}
								that.getView().addDependent(that._oDialogApproval);
								that._oDialogApproval.open();

								//Set grouping Mandatory or Optional
								var mGroupFunctions = {
									MandatoryOptional: function (oContext) {
										var sApproverTypeSection = oContext.getProperty("ApproverTypeSection");
										var key, text;

										//check for approvertypes that indicate they are mandatory approvers
										if (sApproverTypeSection === 1) {
											//Mandatory
											key = "Mandatory";
											text = "Mandatory Approvals";
										} else {
											key = "Optional";
											text = "Optional Approvals";
										}
										return {
											key: key,
											text: text
										};
									}
								};

								//Get table of approvals
								var oTable = sap.ui.getCore().byId("idMandatoryTable"),
									oBinding = oTable.getBinding("items"),
									sPath,
									bDescending,
									vGroup,
									aGroups = [];

								//Actual grouping
								sPath = "MandatoryOptional";
								bDescending = false;
								vGroup = mGroupFunctions[sPath];
								aGroups.push(new Sorter(sPath, bDescending, vGroup));
								// apply the selected group settings
								oBinding.sort(aGroups);

							});
						});
					}
				});
			} else {

				//message saying you have to select an offer first
				sap.m.MessageBox.warning("First select an offer to approve.", {});

			}

		},

		//Text input field on approval
		handleLiveChange: function (oEvent) {
			var oTextArea = oEvent.getSource(),
				iValueLength = oTextArea.getValue().length,
				iMaxLength = oTextArea.getMaxLength(),
				sState = iValueLength > iMaxLength ? "Warning" : "None";

			oTextArea.setValueState(sState);
		},

		//send approvals = save to database & change status
		onSendApprovals: function (oEvent) {

			//that is this
			var that = this;

			//Keep track that we pressed Send Approval button
			Services.setSendApprovalsPressed(true);

			//Approval Status + Offer Status
			var sApprovalStatus = "Processing"; //workflow will change this status to "Notification Sent"
			//var sOfferStatus = "Awaiting Approval";
			var sOfferStatus = "Offer Created";

			//save Approvals (&status) + change offer status
			$.when(Services.saveApprovals(sApprovalStatus, sOfferStatus)).done(function (oDataTenderOffer) {

				var sOfferID = Services.getSelectedOfferID();

				//when saving is finished
				$.when(Services.loadApprovalsForOffer(sOfferID)).done(function (oData) {
					//load data again
					Services.getDefaultModel().refresh(true);
				});

				//approvals are send again so on offer level we let offer now approvals are send.
				//used for the conditional re-approvals 
				//Description: https://trello.com/c/np1g69g7
				var oOffer = Services.getLoadedOffer(sOfferID);
				var iApprovals_sent = oOffer.APPROVALS_SENT + 1;
				Services.saveOfferApprovalSent(iApprovals_sent).catch(function (oError) {
					//Error during save
					Services.showErrorMessage(oError, "Background saving for approvals sent field");
				});

			});

		},

		//cancel approvals = save to database & change status
		onCancelApprovals: function (oEvent) {

			//Keep track that we pressed Cancel Approval button
			Services.setCancelApprovalsPressed(true);

			//Approval Status + Offer Status
			var sApprovalStatus = "Cancelling";
			var sOfferStatus = "Offer Created";

			//save Approvals (&status) + change offer status
			$.when(Services.saveApprovals(sApprovalStatus, sOfferStatus)).done(function (oDataTenderOffer) {

				var sOfferID = Services.getSelectedOfferID();
				//when saving is finished
				$.when(Services.loadApprovalsForOffer(sOfferID)).done(function (oData) {
					//load data again
					Services.getDefaultModel().refresh(true);
				});

			});

		},

		//When you cancel the handle approvals dialog
		onCloseApprovalsDialog: function (oEvent) {

			//clear indication that a button is pressed
			Services.clearApprovalButtonsPressed();

			//close the dialog
			this._oDialogApproval.close();

		},

		//Refresh
		onRefreshApprovalsPress: function (oEvent) {

			var sOfferID = Services.getSelectedOfferID();
			//when saving is finished
			$.when(Services.loadApprovalsForOffer(sOfferID)).done(function (oData) {
				//load data again
			});

		},

		//Filter for history table
		onHistoryFilterCheck: function (oEvent) {
			var offerFragment = new OfferProducts();
			var productPath = Services.getSelectedProductPath();
			this.pPath = productPath;
			offerFragment.onHistoryFilterCheck(this);
		},

		//BASIC INFORMATION TAB
		//---------------------
		//delete method for award criteria table on basic information tab (edit mode)
		handleDelete: function (oEvent) {
			var selectedRow = oEvent.getSource().getParent();
			selectedRow.setVisible(false);
		},

		//?
		setInstituteList: function (oSelection) {
			this.byId("idInstituteName").setValue("");
		},

		//Reset institute name
		resetInstituteName: function (oEvent) {
            const oRegionEdit = this.byId("idRegionEdit");
            const oClassification = this.byId("idClassification");
			this.byId("idInstituteName").setValue("...Select Institute");

			const selectedItem = oEvent.getParameter("selectedItem").getText();
			if(selectedItem === 'Cenabast' || this._country === 'IT' || (this._country === 'ES' && oClassification?.getSelectedKey() === 'Tender')){
				this.byId("idSelectTenderTypeEdit").setVisible(true);
                if(this._country === 'ES'){
                    this.byId("idSelectTenderType2Edit").setVisible(true);                    
                }                
            }else{
				this.byId("idSelectTenderTypeEdit").setVisible(false);
                this.byId("idSelectTenderType2Edit").setVisible(false);
			}

			// hide/unhide the Region field
            if(selectedItem === 'Region(s)' && (this._country === 'IT' || this._country === 'ES') ){
                let sFilterValue = this._country;
                let oBinding = oRegionEdit.getBinding("items");
                let aFilters = [];

                if (sFilterValue){
                    aFilters.push( new Filter("CountryCode", 'EQ', sFilterValue) );
                }
                oBinding.filter(aFilters);
				oRegionEdit.setVisible(true);
                
			}else{
				oRegionEdit.setSelectedKeys([]); // clear the region selected keys
				oRegionEdit.setVisible(false);
			}
		},

		//save basic information (tender info)
		_onSaveBasicInfo: function (oEvent) {

			var that = this;

			//receive Basic info from screen to save as tender
			var oSaveBasicInfo = {};
			oSaveBasicInfo.TenderID = this.byId("idTenderID").getValue();
			var oFastAppDataModel = Services.getFastAppDataModel();

			//TenderID="" means its new tender
			if (oSaveBasicInfo.TenderID === "") {

				//CREATION MODUS

				//call seperate method for adding new tender
				this.onAddBasicInformation(oEvent);

			} else {

				//CHANGE MODUS
				//get tender from default model 
				var oTender = Services.getFastAppDataModel().getProperty("/EditTender");

				oSaveBasicInfo.TenderName = this.byId("idTenderName").getValue();
				oSaveBasicInfo.CountryCode = this._country;
				oSaveBasicInfo.Active = 1;

				if (this.getView().byId("idhdrInstID").getText()) {
					oSaveBasicInfo.InstituteID = this.getView().byId("idhdrInstID").getText();
				} else {
					oSaveBasicInfo.InstituteID = this.getView().byId("idInstituteID").getValue();
				}

				oSaveBasicInfo.Classification = this.byId("idClassification").getSelectedItem().getText();

				oSaveBasicInfo.BiddingTypeLevel1 = this.byId("idBiddingTypeLevel1").getSelectedItem()&& this.byId("idBiddingTypeLevel1").getSelectedItem().getText();
				oSaveBasicInfo.BiddingTypeLevel2 = this.byId("idBiddingTypeLevel2").getSelectedItem() && this.byId("idBiddingTypeLevel2").getSelectedItem().getText();
				oSaveBasicInfo.BiddingTypeLevel3 = this.byId("idBiddingTypeLevel3").getSelectedItem() && this.byId("idBiddingTypeLevel3").getSelectedItem().getText();
				oSaveBasicInfo.HighValue = this.byId("idHighValue") && this.byId("idHighValue").getSelected();

				// Brazil only
				oSaveBasicInfo.IbizID = this.byId("idIbizIDEdit") && this.byId("idIbizIDEdit").getValue();
				oSaveBasicInfo.PublicNotice = this.byId("idPublicNoticeEdit") && this.byId("idPublicNoticeEdit").getValue();
				oSaveBasicInfo.OfferStartDate = (oTender.OfferStartDate) ? oTender.OfferStartDate : null;
				// END Brazil only

				oSaveBasicInfo.TENDER_TYPE_ID = this.byId("idSelectTenderTypeEdit").getSelectedKey();
                oSaveBasicInfo.TENDER_TYPE_2_ID = this.byId("idSelectTenderType2Edit").getSelectedKey();
                oSaveBasicInfo.PORTAL = this.byId("idPortalEdit").getValue();
                oSaveBasicInfo.CONTENT = this.byId("idContentEdit").getValue();
				oSaveBasicInfo.TenderChannel = this.byId("idTenderChannel").getSelectedItem().getText();
				oSaveBasicInfo.GroupPurchasing = this.byId("idGroupPurchasingEdit").getSelectedKey();

				oSaveBasicInfo.PublicationDate = (oTender.PublicationDate) ? oTender.PublicationDate : null;
				oSaveBasicInfo.BidDueDate = (oTender.BidDueDate) ? oTender.BidDueDate : null;
				oSaveBasicInfo.AwardDate = (oTender.AwardDate) ? oTender.AwardDate : null;
				oSaveBasicInfo.NextPublicationDye = (oTender.NextPublicationDye) ? oTender.NextPublicationDye : null;

				//EFRCL-217931-Italy - Tender expiry date field
				oSaveBasicInfo.TerminationDate = (oTender.TerminationDate) ? oTender.TerminationDate : null;
				oSaveBasicInfo.TenderStatus = this.byId("idTenderStatus").getSelectedKey();

				/* Mexico */
				oSaveBasicInfo.SALES_TYPE_ID = this.byId("idSelectSalesTypeEdit").getSelectedKey();
				oSaveBasicInfo.TENDER_ORIGIN_ID = this.byId("idSelectTenderOriginEdit").getSelectedKey();
				oSaveBasicInfo.CONTRACT_TYPE_ID = this.byId("idSelectContractTypeEdit").getSelectedKey();

				oSaveBasicInfo.ContractLength = this.byId("idContractLength").getValue() || 12;
				oSaveBasicInfo.ContractExtenseion = this.byId("idContractExtenseion").getValue() || 0;

				// if (!this.byId("idContractLength").getValue()) {
				// 	oSaveBasicInfo.ContractLength = 12;
				// } else {
				// 	oSaveBasicInfo.ContractLength = this.byId("idContractLength").getValue();
				// }
				// if (!this.byId("idContractExtenseion").getValue()) {
				// 	oSaveBasicInfo.ContractExtenseion = 0;
				// } else {
				// 	oSaveBasicInfo.ContractExtenseion = this.byId("idContractExtenseion").getValue();
				// }

				//TEMP TenderId fix
				oSaveBasicInfo.ToolID = UserInfo.getToolID(); //612;
				//oSaveBasicInfo.TenderNo = Services.getFastAppDataModel().getProperty("/Tender").TenderNo; //oSaveBasicInfo.TenderID.split("-")[2];
				oSaveBasicInfo.TenderNo = Services.getDefaultModel().getProperty(Services.getSelectedTenderPath()).TenderNo;

				/* Thailand */
				oSaveBasicInfo.PROCUREMENT_METHOD_ID = this.byId("idSelectProcurementMethodEdit").getSelectedKey();
				oSaveBasicInfo.PROCUREMENT_REASON = oSaveBasicInfo.PROCUREMENT_METHOD_ID === 'Other' ? this.byId("idProcurementReasonEdit").getValue() : '';

				//Check if data is correct
				if (Services.checkBasicInfo(oSaveBasicInfo)) {

					//if everything is ok, do the saving
					var that = this;
					var path = oEvent.getSource().getBindingContext("fastData").getPath();
					var oRefre = oEvent.getSource();

					//convert Tender data for saving
					var oTenderToSave = Services.getService('Tender').getConvertTenderToSave(oSaveBasicInfo);

					/* Italy */
					const tenderRegions = {
						"TenderID": oTenderToSave.TenderID,
						"RegionIDs": this.byId("idRegionEdit").getSelectedKeys()
					};

					that.updateBasicTenderInfo(oTenderToSave, path, oRefre, tenderRegions).then(async function (oResult) {

						//after saving we reload tender info even if it is already loaded
						var sTenderID = Services.getSelectedTenderID();
						var bLoadedCheck = false;
						let selectedCountry = Services.getSelectedCountry();

						/* Chile */
						if(selectedCountry === 'CL'){
							try{
								const bCountrySpecificInformationExists = Services.getDefaultModel().getProperty("/PT_TMTEND('CL-21-1001')/CountrySpecificInformation");

								if(bCountrySpecificInformationExists){
									await that.updateCountrySpecificInformation();
								}else{
									await that.createCountrySpecificInformation(sTenderID, selectedCountry);
								}

							} catch(err){
								console.error(err);
							}
						}

						// Italy & Spain - Load regins again 
						if (Services.getSelectedCountry() === "IT" || Services.getSelectedCountry() === "ES"){
							that.byId("idRegionView").setBusy(true);
							that.getTenderRegions(sTenderID).then(response => {
								const tenderArray = response.data.results.filter(tender => tender.TenderID === Services.getSelectedTenderID());
                                let regionIDs = [];
                                if(tenderArray.length !== 0){
                                    regionIDs = tenderArray[0].Regions.results.map(region => region.RegionID);                            
                                }
								that.byId("idRegionView").setSelectedKeys(regionIDs);
								that.byId("idRegionView").setBusy(false);
							})
						}

						//load tender data again so refresh is done
						$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

							//bind tender again
							var oTender = Services.getLoadedTender();
							oFastAppDataModel.setProperty("/EditTender/", oTender);

							//everything is saved and loaded correctly for the new tender
							//clear all, they will be set again when route matched on detail
							Services.setSelectedOfferID("");
							Services.setSelectedOfferPath("");
							Services.setSelectedProductID("");
							Services.setSelectedProductName("");
							Services.setSelectedProductPath("");
						});

					}).catch(function (oError) {
						if (oError === "checkFailed") {
							//message already provided in check
						}
					});
				}

			}

		},

		//Preparing information to create a new tender
		onAddBasicInformation: function (oEvent) {

			var that = this;

			var oSaveBasicInfo = {};
			this.getView().byId("tenderId").setText(Services.getSelectedTenderID());

			//TODO use this binding for every field, now its only filled for dates 
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oTender = oFastAppDataModel.getProperty("/EditTender");

			this.getView().byId("idhdrInstID").setText(this.byId("idInstituteID").getValue());
			this.getView().byId("idHdrTndrNme").setText(this.byId("idTenderName").getValue());
			oSaveBasicInfo.TenderID = Services.getSelectedTenderID();
			oSaveBasicInfo.TenderName = this.byId("idTenderName").getValue();
			oSaveBasicInfo.CountryCode = this._country;
			oSaveBasicInfo.Active = 1;
			if (this.getView().byId("idhdrInstID").getText()) {
				oSaveBasicInfo.InstituteID = this.getView().byId("idhdrInstID").getText();
			} else {
				oSaveBasicInfo.InstituteID = this.getView().byId("idInstituteID").getValue();
			}

			oSaveBasicInfo.Classification = this.byId("idClassification").getSelectedItem().getText();
			oSaveBasicInfo.BiddingTypeLevel1 = this.byId("idBiddingTypeLevel1").getSelectedItem() && this.byId("idBiddingTypeLevel1").getSelectedItem().getText();
			oSaveBasicInfo.BiddingTypeLevel2 = this.byId("idBiddingTypeLevel2").getSelectedItem() && this.byId("idBiddingTypeLevel2").getSelectedItem().getText();
			oSaveBasicInfo.BiddingTypeLevel3 = this.byId("idBiddingTypeLevel3").getSelectedItem() && this.byId("idBiddingTypeLevel3").getSelectedItem().getText();
			oSaveBasicInfo.HighValue = this.byId("idHighValue") && this.byId("idHighValue").getSelected();

			// Brazil only
			oSaveBasicInfo.IbizID = this.byId("idIbizIDEdit") && this.byId("idIbizIDEdit").getValue();
			oSaveBasicInfo.PublicNotice = this.byId("idPublicNoticeEdit") && this.byId("idPublicNoticeEdit").getValue();
			oSaveBasicInfo.OfferStartDate = (oTender.OfferStartDate) ? oTender.OfferStartDate : null;
			// END Brazil only

			oSaveBasicInfo.TENDER_TYPE_ID = this.byId("idSelectTenderTypeEdit").getSelectedKey();
            oSaveBasicInfo.TENDER_TYPE_2_ID = this.byId("idSelectTenderType2Edit").getSelectedKey();
            oSaveBasicInfo.PORTAL = this.byId("idPortalEdit").getValue();
            oSaveBasicInfo.CONTENT = this.byId("idContentEdit").getValue();
			oSaveBasicInfo.TenderChannel = this._country === 'IT' || this._country === 'ES' ? 'Direct' : this.byId("idTenderChannel").getSelectedItem().getText();
			oSaveBasicInfo.GroupPurchasing = this.byId("idGroupPurchasingEdit").getSelectedKey();

			oSaveBasicInfo.PublicationDate = (oTender.PublicationDate) ? oTender.PublicationDate : null;
            oSaveBasicInfo.PublicationDate = this._country === 'ES' && oSaveBasicInfo.Classification === 'Commercial Agreement' ? new Date() : oSaveBasicInfo.PublicationDate;
			
            oSaveBasicInfo.BidDueDate = (oTender.BidDueDate) ? oTender.BidDueDate : null;
            if(this._country === 'ES' && oSaveBasicInfo.Classification === 'Commercial Agreement'){
                let date = new Date();
                oSaveBasicInfo.BidDueDate = new Date(date.getFullYear(), date.getMonth() + 2, 0);
            } else {
                oSaveBasicInfo.BidDueDate
            }
			//EFRCL-217931-Italy - Tender expiry date field
			oSaveBasicInfo.TerminationDate = (oTender.TerminationDate) ? oTender.TerminationDate : null;
            oSaveBasicInfo.AwardDate = (oTender.AwardDate) ? oTender.AwardDate : null;
			oSaveBasicInfo.NextPublicationDye = (oTender.NextPublicationDye) ? oTender.NextPublicationDye : null;

			oSaveBasicInfo.TenderStatus = "Open";

			oSaveBasicInfo.ContractLength = oTender.ContractLength ? oTender.ContractLength : 12;
			oSaveBasicInfo.ContractExtenseion = oTender.ContractExtenseion ? oTender.ContractExtenseion : 0;

			// if (!this.byId("idContractLength").getValue()) {
			// 	oSaveBasicInfo.ContractLength = 12;
			// } else {
			// 	oSaveBasicInfo.ContractLength = this.byId("idContractLength").getValue();
			// }
			// if (!this.byId("idContractExtenseion").getValue()) {
			// 	oSaveBasicInfo.ContractExtenseion = 0;
			// } else {
			// 	oSaveBasicInfo.ContractExtenseion = this.byId("idContractExtenseion").getValue();
			// }

			/* Mexico */
			oSaveBasicInfo.SALES_TYPE_ID = this.byId("idSelectSalesTypeEdit").getSelectedKey();
			oSaveBasicInfo.TENDER_ORIGIN_ID = this.byId("idSelectTenderOriginEdit").getSelectedKey();
			oSaveBasicInfo.CONTRACT_TYPE_ID = this.byId("idSelectContractTypeEdit").getSelectedKey();

			/* Thailand */
			oSaveBasicInfo.PROCUREMENT_METHOD_ID = this.byId("idSelectProcurementMethodEdit").getSelectedKey();
			oSaveBasicInfo.PROCUREMENT_REASON = oSaveBasicInfo.PROCUREMENT_METHOD_ID === 'Other' ? this.byId("idProcurementReasonEdit").getValue() : '';

			//TEMP
			oSaveBasicInfo.ToolID = UserInfo.getToolID(); //612;
			oSaveBasicInfo.TenderNo = Services.getNewTenderNo(); //oSaveBasicInfo.TenderID.split("-")[2];


			//check info to save
			if (Services.checkBasicInfo(oSaveBasicInfo)) {

				//convert Tender data for saving
				var oTenderToSave = Services.getService('Tender').getConvertTenderToSave(oSaveBasicInfo);
				
				/* Italy */
				const tenderRegions = {
					"TenderID": oTenderToSave.TenderID,
					"RegionIDs": this.byId("idRegionEdit").getSelectedKeys()
				};

				that.createBasicTenderInfo(oTenderToSave, tenderRegions).then(async function (oSaveResults) {

					//if save is executed succesfully
					// if (oSaveResults) {

						//Save of tender is executed

						//after saving we reload tender info even if it is already loaded
						var sTenderID = Services.getSelectedTenderID();
						var bLoadedCheck = false;
						let selectedCountry = Services.getSelectedCountry();

						/* Chile */
						if(selectedCountry === 'CL'){
							try{
								await that.createCountrySpecificInformation(sTenderID, selectedCountry);
							} catch(err){
								console.error(err);
							}
						}

						// Italy - Load regins again 
						if (Services.getSelectedCountry() === "IT" || Services.getSelectedCountry() === "ES"){
							that.byId("idRegionView").setBusy(true);
							that.getTenderRegions(sTenderID).then(response => {
								const tenderArray = response.data.results.filter(tender => tender.TenderID === Services.getSelectedTenderID());
                                let regionIDs = [];
                                if(tenderArray.length !== 0){
                                    regionIDs = tenderArray[0].Regions.results.map(region => region.RegionID);                            
                                }
								that.byId("idRegionView").setSelectedKeys(regionIDs);
								that.byId("idRegionView").setBusy(false);
							})
						}

						//load tender data so its in the FastAppData model in the same way as for an existing tender
						$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {
							//everything is saved and loaded correctly for the new tender
							//clear all, they will be set again when route matched on detail
							Services.setSelectedOfferID("");
							Services.setSelectedOfferPath("");
							Services.setSelectedProductID("");
							Services.setSelectedProductName("");
							Services.setSelectedProductPath("");

							// Brazil only
							Services.getSelectedCountry() === "BR" && that.getView().byId("idSelectTenderType").setVisible(true);
						});

					// }

				}).catch(function (oError) {
					if (oError === "checkFailed") {
						//message already provided in check
					}
				});

			}
		},

		createCountrySpecificInformation: async function(sTenderID, sCountryCode){
			const oTenderInformation = Services.getFastAppDataModel().getProperty("/CountrySpecificTenderInformation");
			const data = {
				TenderID: sTenderID,
				CountryCode: sCountryCode,
				...oTenderInformation,
			};
			return Services.getService('Tender').createCountrySpecificInformation(data);
		},

		updateCountrySpecificInformation: async function(){
			const oTenderInformation = Services.getFastAppDataModel().getProperty("/CountrySpecificTenderInformation");
			return Services.getService('Tender').updateCountrySpecificInformation(oTenderInformation);
		},

		saveSpecifications: function(oTenderToSave, action){
			let promises = [];
			const aSpecifications = this.byId("idSpecifications").getSelectedItems().map(item => item.getText());

			const aSpecificationEntities = aSpecifications.map(sSpecificationName => {
				return {
					TenderID: oTenderToSave.TenderID,
					CountryCode: oTenderToSave.CountryCode,
					Name: sSpecificationName,
				};
			});


			switch(action){
				case "create":

					let createSpecification = aSpecificationEntities.map(function (oSpecification) {

						return Services.getService('Specification').createSpecification(oSpecification)
						.catch(function (oError) {
							//show error message
							Services.showErrorMessage(oError, "Saving of new AwardCriteria");
							throw new Error(oError);
						});

					});

					promises.push(createSpecification);
					
					break;
				case "update":
					// first remove all Specifications and then create the new ones ... update = delete + create
					let updateSpecification = Services.getService('Specification').removeAllSpecificationForTenderID(oTenderToSave.TenderID).then(() => {

						return aSpecificationEntities.map(function (oSpecification) {

							let createSpecification = Services.getService('Specification').createSpecification(oSpecification)
							.catch(function (oError) {
								//show error message
								Services.showErrorMessage(oError, "Saving of new AwardCriteria");
								throw new Error(oError);
							});

							return createSpecification;

						});

					});
						
					promises.push(updateSpecification);
					break;
				default: break;
			}

			

			return Promise.all(promises);
		},

		saveTenderRegions: function(tenderRegions){

			const tenderID = tenderRegions.TenderID;
			const regionIDs = tenderRegions.RegionIDs;

			return Services.getService('Tender').saveTenderRegions(tenderID, regionIDs)
						.catch(function (oError) {
							//show error message
							Services.showErrorMessage(oError, "Saving of Regions");
							throw new Error(oError);
						});

		},

		getTenderRegions: function(tenderID){

			return Services.getService('Tender').getTenderRegions(tenderID)
						.catch(function (oError) {
							//show error message
							Services.showErrorMessage(oError, "Fetching of Regions");
							throw new Error(oError);
						});

		},

		//submits changes in batch for the basic information tab
		updateBasicTenderInfo: function (oTenderToSave, sPath, oRefresh, tenderRegions) {

			//keep track of controller object
			var that = this;

			//catch all promises in an array
			let promises = [];

			//get change batch ready to save Tender & Basic info in 1 go
			var oModel = Services.getDefaultModel(); //new sap.ui.model.odata.ODataModel(Services.getConnectionString());

			//change data
			/*oTenderToSave.PublicationDate = moment(oTenderToSave.PublicationDate).toDate();
			oTenderToSave.BidDueDate = moment(oTenderToSave.BidDueDate).toDate();*/
			oTenderToSave.SubmittedOn = moment().utc().toDate();
			oTenderToSave.SubmittedBy = UserInfo.getCWID();

			// Specifications should be saved as well
			promises.push(that.saveSpecifications(oTenderToSave, "update"));

			//Award criteria should be saved as well
			var aAwardCriteria = this.getView().byId("idAwrdEdit").getItems();

			//regions should be saved for Italy
			if((this._country === 'IT' || this._country === 'ES') && tenderRegions){
				promises.push(that.saveTenderRegions(tenderRegions));
			}

			//data awardcriteria model
			var oAwDt = that.byId("idAwrdEdit").getModel("tabModel").getData();

			//check if awardCriteria is valid
			if (!Services.checkAwardCriteria(aAwardCriteria)) {
				return Promise.reject(new Error("checkFailed"));
			}

			//Update tender
			promises.push(Services.getService('Tender').updateTender(oTenderToSave, "PUT"));

			//loop over the awardcriteria and add them to save array
			aAwardCriteria.forEach(function (oAwardCriteria, iIndex) {

				//keep award criteria to save
				var oAwardCriteriaToSave = {
					TENDERID: that.byId("idTenderID").getValue(),
					COUNTRYCODE: that._country,
					Active: 1,
					AwardCriteria: oAwardCriteria.mAggregations.cells[0].getProperty("value"),
					Weight: String(oAwardCriteria.mAggregations.cells[1].getProperty("value") / 100),
					SUBMITTEDON: moment().utc().toDate(),
					Submittedby: UserInfo.getCWID()
				};

				//Check that award criteria is complete, everything is filled + make sum of all weight + if we need to delete, add, or change the awardcriteria
				if (oAwardCriteria.getVisible()) {

					if (oAwDt.Data[iIndex].__metadata !== undefined) {

						//update existing award criteria
						promises.push(Services.getService('AwardCriteria').updateAwardCriteria(oAwardCriteriaToSave).catch(function (oError) {
							//show error message
							Services.showErrorMessage(oError, "Update of AwardCriteria");
							throw new Error(oError);
						}));

					} else {

						//save new award criteria
						promises.push(Services.getService('AwardCriteria').createAwardCriteria(oAwardCriteriaToSave).catch(function (oError) {
							//show error message
							Services.showErrorMessage(oError, "Saving of new AwardCriteria");
							throw new Error(oError);
						}));

					}

				} else {

					//if award criteria is removed
					if (oAwDt.Data[iIndex].__metadata !== undefined) {

						//remove award criteria as to be deleted
						promises.push(Services.getService('AwardCriteria').removeAwardCriteria(oAwardCriteriaToSave));

					}

					oAwardCriteria.setVisible(true);

				}

			});

			//if all promises pushed from the loop have received their answer
			return Promise.all(promises).then((result) => {

				that.getView().getModel("fastData").refresh(true);
				oRefresh.getModel("fastData").refresh(true);
				$.when(Services.loadAllFastAppDataForProdOffer(Services.getSelectedTenderID(), false)).done(function (oDataTenderOffer) {
					sap.m.MessageBox.success(oTenderToSave.Classification + " Updated Successfully", {});
					that.onEditToggleButtonPress();
				});

			}).catch(function (oError) {
				//failed
				Services.showErrorMessage(oError, "Saving of basic information");
			});

		},

		//Actual creation of the new tender TODO this should be in the service file
		createBasicTenderInfo: function (oTenderToSave, tenderRegions) {

			//keep track of controller object
			var that = this;

			//catch all promises in an array
			let promises = [];

			//get default model
			var oModel = Services.getDefaultModel(); //new sap.ui.model.odata.ODataModel(Services.getConnectionString());

			//Award criteria should be saved as well
			var aAwardCriteria = this.getView().byId("idAwrdEdit").getItems();

			//specification should be saved as well
			promises.push(that.saveSpecifications(oTenderToSave, "create"));

			//regions should be saved for Italy
			if((this._country === 'IT' || this._country === 'ES') && tenderRegions){
				promises.push(that.saveTenderRegions(tenderRegions));
			}

			//check if awardCriteria is valid
			if (!Services.checkAwardCriteria(aAwardCriteria)) {
				return Promise.reject(new Error("checkFailed"));
			}

			//Create tender
			promises.push(Services.getService('Tender').createTender(oTenderToSave));

			//loop over the awardcriteria and add them to save array
			aAwardCriteria.forEach(function (oAwardCriteria) {

				//keep award criteria to save
				var oAwardCriteriaToSave = {
					TENDERID: Services.getSelectedTenderID(),
					Active: 1,
					COUNTRYCODE: that._country,
					AwardCriteria: oAwardCriteria.mAggregations.cells[0].getProperty("value"),
					Weight: String(oAwardCriteria.mAggregations.cells[1].getProperty("value") / 100),
					SUBMITTEDON: moment().utc().toDate(),
					Submittedby: UserInfo.getCWID()
				};

				//Check that award criteria is complete, everything is filled + make sum of all weight
				if (oAwardCriteria.getVisible()) {

					//save award criteria
					promises.push(Services.getService('AwardCriteria').createAwardCriteria(oAwardCriteriaToSave).catch(function (oError) {
						//show error message
						Services.showErrorMessage(oError, "Saving of new AwardCriteria");
						throw new Error(oError);
					}));

				} else {

					oAwardCriteria.setVisible(true);

				}

			});

			//if all promises pushed from the loop have received their answer
			return Promise.all(promises).then((result) => {

				//success
				sap.m.MessageBox.success(oTenderToSave.Classification + " Created Successfully", {});

				var sTenderPath = "/PT_TMTEND('" + Services.getSelectedTenderID() + "')";
				that.getView().bindElement({
					path: sTenderPath,
					parameters: {
						expand: "Institute,Specifications"
					},
					model: "fastData"
				});

				//keep created tenderID & path as selected
				Services.setSelectedTenderID(Services.getSelectedTenderID());
				Services.setSelectedTenderPath(sTenderPath);

				//move back to display
				that.onEditToggleButtonPress();

				//clearing all ()
				Services.clearAllForBasicInfoPage();

			}).catch(function (error) {
				//failed
				sap.m.MessageBox.error(oTenderToSave.Classification + " Creation failed", {});
			});

		},

		//when toggled between edit/display mode
		bindAwardCriteria: function () {

			//keep track of controller object
			var that = this;

			//get tenderID
			var TenderID = this.getView().byId("tenderId").getProperty("text"); //TODO this should be Services.getSelectedTenderID();

			//Path for reading the award criteria
			var sPath = "/PT_TMAWRDCR";

			//model for binding to award table
			var AwardModel = new sap.ui.model.json.JSONModel();

			//filters
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("TENDERID", sap.ui.model.FilterOperator.EQ, TenderID));
			aFilters.push(new sap.ui.model.Filter("Active", sap.ui.model.FilterOperator.EQ, 1));

			//reading default model
			var oModel = this.getOwnerComponent().getModel("fastData");
			oModel.read(sPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					//bind award criteria to model that will be used for binding to award table
					AwardModel.setData({
						Data: oData.results
					});
					that.getView().setModel(AwardModel, "tabModel");

					//depending 
					if (that.getView().byId("DetailPage").getShowFooter() === false) {
						//award table on display mode (basicinformationView.xml)
						that.byId("awardCriteriaId").setModel(AwardModel, "tabModel");
					} else {
						//award table on edit mode (basicinformationEdit.xml)
						that.byId("idAwrdEdit").setModel(AwardModel, "tabModel");
					}

				},
				error: function (oError) {
					//error message
					Services.showErrorMessage(oError, "Loading award criteria");
				}
			});

		},

		//Adding an award criteria
		onAddPressAwrd: function (oEvent) {
			var that = this;
			var tabLength;
			var oSlctpge = that.getView().byId("DetailPage").getShowFooter();

			//check if we are in creation modus of new tender & expanded the view so we come again to onRouteMatched
			var sNewTenderNo = Services.getNewTenderNo();
			var sTenderPath = Services.getSelectedTenderPath();

			if (sTenderPath === "/PT_TMTEND('1')" || sNewTenderNo) {
				tabLength = that.byId("idAwrdEdit").getModel("tabModel");
			} else if (sTenderPath !== "/PT_TMTEND('1')" && oSlctpge === "false") {
				tabLength = that.byId("awardCriteriaId").getModel("tabModel");
			} else {
				tabLength = that.byId("idAwrdEdit").getModel("tabModel");
			}
			var tabLengthData = tabLength.getData().Data;

			var aAwardCriteria = this.getView().byId("idAwrdEdit").getItems();
			for (var i = 0; i < aAwardCriteria.length; i++) {
				tabLengthData[i].AwardCriteria = aAwardCriteria[i].mAggregations.cells[0].getProperty("value");
				tabLengthData[i].Weight = aAwardCriteria[i].mAggregations.cells[1].getProperty("value") / 100;
			}

			tabLength.getData().Data.push({
				TENDERID: "",
				COUNTRYCODE: that._country,
				Active: 1,
				AwardCriteria: "",
				Weight: 0
			});
			tabLength.refresh(true);

		},

		//OFFER PRODUCTS TAB
		//------------------
		//click on offer on  "OFFER PRODUCT TAB "
		onProductOfferItemPress: function (oEvent) {

			//this is that
			var that = this;

			//FastAppData Model
			var oFastAppDataModel = Services.getFastAppDataModel();

			//get selected offer
			var sOfferID = Services.getSelectedOfferID();

			//get & keep offerPath
			//var sOfferPath = oEvent.getSource().getBindingContext("fastAppData").getPath(); //oEvent.getSource().getBindingContext("fastData").getPath();
            //EHQUT-INC16347164-Issue with offer validity field
            var sOfferPathnew = Services.getSelectedOfferPath();
            var sOfferPath = Services.getLoadedOfferPath(sOfferID);
            if(!sOfferPathnew)
            {
                
                Services.setSelectedOfferPath(sOfferPath);
            }
            //EHQUT-INC16347164-Issue with offer validity field
			//keep the selected offerID so we have it on the financial offer tab as well
			//var oOffer = oFastAppDataModel.getProperty(sOfferPath); //before oDefaultModel
			var oOffer = Services.getLoadedOffer(sOfferID)

			//var sOfferID = oOffer.OfferID;
			//Services.setSelectedOfferID(sOfferID);

			//if you click on an offer it is available (sometimes it is not availble when you switch between tabs)
			Services.setSelectedOfferAvailable(true);

			//at this point no product should be selected.
			Services.setSelectedProductID("");
			Services.setSelectedProductName("");
			Services.setSelectedProductPath("");

			//binding for offer details form
			var oForm = that.byId("offerDetailForm");
			oForm.bindElement({
				path: sOfferPath,
				model: "fastAppData"
			});
			oForm.setVisible(true);

			//offerproduct table binding
			var oTable = that.byId("offerProductId");
			var sProductPath = sOfferPath + "/Product/results";
			var oFilter = [new sap.ui.model.Filter("Active", "EQ", 1)];
			var oSorter = new sap.ui.model.Sorter({
				path: "SORTER",
				descending: false
			});

			/*let oProducts = oFastAppDataModel.getProperty("/SelectedOffer/Product/results");
			let skuCountries = oProducts.map((product) => { 
				return product.SKUCountry;
			});*/

			oTable.bindRows({
				path: sProductPath,
				model: "fastAppData",
				filters: oFilter,
				sorter: oSorter
			});

            //if we're in brazil, filter the offer products by the selected lot ID 
            if(Services.getSelectedCountry() === 'BR'){
                let iSelectedLotID = this.getView().byId('idSelectLotView').getSelectedKey();
                if(iSelectedLotID){
                    this.filterBySelectedLot(iSelectedLotID);
                }
            }

		},

		//Delete offer button is clicked
		onDeleteProductOffer: function (oEvent) {

			var sOfferIDToDelete = Services.getSelectedOfferID();
			var that = this;

			//do we have an offer selected?
			if (sOfferIDToDelete) {
				//check the offer status
				$.when(Services.checkOfferStatus()).done(function (oData) {

					//Status in which deleting of the offer is not allowed
					var aStatusNoDelete = [
						"Awaiting Approval",
						"Quotation Submitted",
						"In FOC Negotiation",
						"Appeal in Progress",
						"Results Recorded",
						"Delivery Ongoing"
					];

					//check if status is allowing delete,
					if ($.inArray(oData.STATUS, aStatusNoDelete) === -1) {
						var bStatusNotAllowingDelete = false;
					} else {
						var bStatusNotAllowingDelete = true;
					}

					//no deletion possible
					if (bStatusNotAllowingDelete) {
						//go back to display mode				
						sap.m.MessageBox.warning("Status of offer is not allowing deletion.", {});
						return;
					} else {

						Services.saveSoftDeleteOffer().then(function (oResult) {

							//reload all data
							that.onRefresh();

							//select first offer in left pane
							that._selectFirstOfferInLeftPane(sOfferIDToDelete);

						});

					}

				});

			} else {

				//go back to display mode				
				sap.m.MessageBox.warning("No offer selected for deletion.", {});
				return;

			}

		},

		//Reviewed offer button is clicked
		//revised offer, when the offer has been lost (on client side) => you expect to be in "Results Recorded" state at that point (but you might directly want to create revised offer, without recording results)
		onReviewProductOffer: function (oEvent) {

			var sOfferID = Services.getSelectedOfferID();
			var that = this;

			//keep track from where we are entering
			Services.setReviewedOfferPressed(true);

			//Selected offerID
			Services.setSelectedOfferID(sOfferID); //keep selected offerID for later use TODO: find better place to fit this method

			//at this point no product should be selected.
			Services.setSelectedProductID("");
			Services.setSelectedProductName("");
			Services.setSelectedProductPath("");

			//sometimes offer is selected but it is not availble when you switch between tabs)
			var bSelectedOfferAvailable = Services.getSelectedOfferAvailable();
			
			if (sOfferID && bSelectedOfferAvailable) {

				// Now using download link on sharepoint
				$.when(Services.checkOfferStatus()).done(function (oData) {

					if (
						oData.STATUS === "Quotation Submitted" ||
						oData.STATUS === "In FOC Negotiation" ||
						oData.STATUS === "Appeal in Progress" ||
						oData.STATUS === "Results Recorded"
					) {

						//Show a different view depending on what is
						that.onEditToggleButtonPress();

						//Review for offer - sOfferID (temp. Text)
						var sReviewOfferFor = "Creating revised offer for: " + sOfferID;
						Services.getFastAppDataModel().setProperty("/SelectedOfferID", sReviewOfferFor);

						//OFFER PRODUCTS TAB IS SHOWN
						that.byId("DetailPage").setSelectedSection(Services.getOfferProductPageSectionID());
						that.updateExisting = false;

					} else {

						sap.m.MessageBox.warning("Offer status must be 'Quotation Submitted', 'In FOC Negotiation', 'Appeal in Progress' or in 'Results Recorded'.", {});

					}

				});

			} else {

				sap.m.MessageBox.warning("First select an offer to Revise.", {});

			}

		},

		//continued offer button is pressed
		//continued offer is typically when you're creating a new offer to the client as continuation of same tender. You typically expect that, by that time, offer should be in "Delivery Ongoing" status BUT, it is possible that delivery information would not be available yet (hence in "Results Recorded") state. It is unlikely, but it is also conceivable results would not have been recorded yet (hence in "Quotation Submitted")
		onContinuedProductOffer: function (oEvent) {

			var sOfferID = Services.getSelectedOfferID();
			var that = this;

			//keep track from where we are entering
			Services.setContinuedOfferPressed(true);

			//Selected offerID
			Services.setSelectedOfferID(sOfferID); //keep selected offerID for later use TODO: find better place to fit this method

			//at this point no product should be selected.
			Services.setSelectedProductID("");
			Services.setSelectedProductName("");
			Services.setSelectedProductPath("");

			//sometimes offer is selected but it is not availble when you switch between tabs)
			var bSelectedOfferAvailable = Services.getSelectedOfferAvailable();

			if (sOfferID && bSelectedOfferAvailable) {

				// Now using download link on sharepoint
				$.when(Services.checkOfferStatus()).done(function (oData) {

					if (
						oData.STATUS === "Quotation Submitted" ||
						oData.STATUS === "In FOC Negotiation" ||
						oData.STATUS === "Appeal in Progress" ||
						oData.STATUS === "Results Recorded" ||
						oData.STATUS === "Delivery Ongoing"
					) {

						//Show a different view depending on what is
						that.onEditToggleButtonPress();

						//Review for offer - sOfferID (temp. Text)
						var sReviewOfferFor = "Creating continued offer for: " + sOfferID;
						Services.getFastAppDataModel().setProperty("/SelectedOfferID", sReviewOfferFor);

						//OFFER PRODUCTS TAB IS SHOWN
						that.byId("DetailPage").setSelectedSection(Services.getOfferProductPageSectionID());
						that.updateExisting = false;

					} else {

						sap.m.MessageBox.warning("Offer status must be 'Quotation Submitted', 'In FOC Negotiation', 'Appeal in Progress', 'Results Recorded' or 'Delivery Ongoing'.", {});

					}

				});

			} else {

				sap.m.MessageBox.warning("First select an offer to Revise.", {});

			}

		},

		/**
		 * Event handler for "Duplicate Offer" button click on the "Offer Products" tab
		 * @param {*} oEvent - 
		 */
		onDuplicateOffer: async function (oEvent) {

			const oView = this.getView();

			// add all Tender Offers to the FastAppDataModel
			const allTenderOffers = await this.getTenderOffers();

			// set the selected keys on the DistributorsMultiComboBox
			const allActiveOffers = allTenderOffers.filter(offer => offer.Active === 1);
			const selectedKeys = allActiveOffers.map(offer => String(offer.DistributorID));
			Services.getFastAppDataModel().setProperty("/TenderOfferDistributorIDs", selectedKeys);

			// add distributors to the FastAppDataModel
			const distributors = await this.getDistributors();
			//distributors.filter() TODO filter so that distributors where offer already exists is filtered out
			Services.getFastAppDataModel().setProperty("/InstituteDistributors", distributors);

			// create DuplicateOffer dialog lazily
			if (!this.pDuplicateOfferDialog) {

				this.pDuplicateOfferDialog = Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.DuplicateOfferDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					return oDialog;
				});

			}

			const { STATUS: offerStatus } = await Services.checkOfferStatus();

			// duplication only allowed for the following statuses
			if (offerStatus === "Offer Created" ||
				offerStatus === "Offer Approved" ||
				offerStatus === "Quotation Submitted") {

				this.pDuplicateOfferDialog.then(function(oDialog) {
					oDialog.open();
				});


			} else {
				sap.m.MessageBox.warning("Duplication only allowed for Offer with status 'Quotation Submitted', 'Offer Created' or 'Offer Approved'.", {});
			}

		},

		/**
		 * Fetches a list of Distributors from the backend
		 * @returns {Array} - A list of Distributors
		 */
		getDistributors: async function() { 

			const sCountryCode = Services.getCountryCodeofSelectedTender();
			const sInstituteId = Services.getInstituteIDofSelectedTender();
			const sChannel = Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');
			const sSellingCompanyID = Services.getLoadedOffer(Services.getSelectedOfferID()).SellingCompany;

			const { results: distributors } = await Services.readInstituteDistributor(sCountryCode, sInstituteId, sChannel, sSellingCompanyID);

			return distributors;
		},


		/**
		 * Fetches a list of Tender Offers from the backend
		 * @param {String} sExpand - a list of comma separated fields to be expanded
		 * @returns {Array} - A list of Offers
		 */
		 getTenderOffers: async function(sExpand) { 

			const { data: {results: offers} } = await Services.getOffers(Services.getSelectedTenderID(), Services.getSelectedCountry(), sExpand);

			return offers;
		},

		/**
		 * Fetches a list of Tender products from the backend
		 * @param {String} sTenderID - 
		 * @returns {Array} - A list of Tender products
		 */
		 getTenderProducts: async function(sTenderID) { 

			const { data: {results: products} } = await Services.getTenderProducts(sTenderID);

			return products;
		},

		/**
		 * Event handlers for the DuplicateOfferDialog
		 * @param {Object} oEvent -
		 */
		onDuplicateOfferDialogDuplicateOffer: async function(oEvent){ 

			//that is this
			let that = this;
			BusyIndicator.show();

			//Methods should be available
			let oOfferFragment = new OfferProducts();
			Services.setFinancialModel(oOfferFragment);

			const oDistributorsMultiComboBox = this.byId("idDistributorsMultiComboBox");
			const aSelectedDistributors = oDistributorsMultiComboBox.getSelectedItems().map(distributor => {
				return {
					"DISTRIBUTOR_ID" : +distributor.mProperties.key,
					"DISTRIBUTOR_NAME" : distributor.mProperties.text
				};
			});
			const oCurrentOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
			const aTenderOffers = Services.getLoadedTender() && Services.getLoadedTender().Offer && Services.getLoadedTender().Offer.results;

			// list of distributors for which the offer is to be duplicated
			const aDistributorsToBeDuplicated = [];

			aSelectedDistributors.forEach(distributor => {
				const bDistributorExists = aTenderOffers.find(offer => offer.DistributorID === distributor.DISTRIBUTOR_ID && offer.Active === 1);
				if(!bDistributorExists){
					aDistributorsToBeDuplicated.push(distributor);
				}
			});
			
			//aDistributorsToBeDuplicated.forEach(oDistributor => this._cloneOffer.call(this, oCurrentOffer, oDistributor));
			//since we have to wait for each offer to be finished before creating the next offer, we use a for loop with an await statement
			for (const oDistributor of aDistributorsToBeDuplicated) {
				await that._cloneOffer.call(this, oCurrentOffer, oDistributor);
			}

			//refresh screens/data - give success message & close
			
			let sTenderID = Services.getSelectedTenderID();
			let sOfferID = Services.getSelectedOfferID();
			let bLoadedCheck = false;

			//close button on dialog
			$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

				//refresh tenders master table (left pane)
				Services.refreshTendersMasterTable(sTenderID);

				//Set selected offer in left pane
				that._selectOfferInLeftPane(sOfferID);

				// close loading that blocks everything
				BusyIndicator.hide();

				//close dialog
				that.onDuplicateOfferDialogClose();

				// show messages
				if (Services.getOfferCompositeMessages().length > 0) {
					Services.showMessageCompositeView("Offer duplicated", Services.getOfferCompositeMessages(), 'Success');
					Services.getOfferCompositeMessages().splice(0, Services.getOfferCompositeMessages().length);
				}

			});	

		},

		/**
		 * Cloning of the offer for a new distributor
		 * @param {*} offer -
		 * @param {*} distributor -
		 */
		_cloneOffer: async function(offer, distributor){

			let that = this;
			const nextOfferID = await Services.getNextOfferID(offer.TenderID);

			const oNewOffer = {
				...offer,
				"TenderOfferNo" : nextOfferID, //nextOfferID is stored to always receive the latest next offer ID... if we don't provide this attribute, getNextOfferID will not return a correct value for the following offer ID
				"ContinuationOfferNo" : 0,
				"RevisedOfferNo": 0,
				"OfferID": Services.getSelectedTenderID() + "-" + nextOfferID,
				"ActiveOffer": 1,
				//"CreationDate": moment().utc().toDate(),
				//"SubmissionDate": null,           
				//"SubmittedOn": moment().utc().toDate(),           
				//"SubmittedBy": UserInfo.getCWID(),           
				"Active": 1,
				"DistributorID": distributor.DISTRIBUTOR_ID,
				"OfferRevisionSplitNo": 0,
				"APPROVALS_SENT": 0,
			}

			//keep this new Offer info for saving, products,prices,status,...
			Services.setOfferSaveInfo(oNewOffer);
			
			try {

				//save new offer
				await Services.saveOffer(oNewOffer)
				.then(function (oResult) {
					
					//if offer is created successfully we can create the offer status, products.. for the saved offer
					
					//save offer status
					let sOfferStatus = "Offer Created";
					Services.saveOfferStatus(sOfferStatus);
					
					//only active offers need to be copied
					let aProductsToBeDuplicated = oNewOffer.Product && oNewOffer.Product.results && oNewOffer.Product.results.filter(oProduct => oProduct.Active === 1);

					//create new products & corresponding prices (we want to wait for each product to finish, but still perform each product in paralell)
					return Promise.all(aProductsToBeDuplicated.map(async (oProduct)=> {
						await that._cloneProduct.call(that, oNewOffer, oProduct);
					}));

				})
				.then(() => {
					Services.getOfferCompositeMessages().push({
						type: 'Success',
						title: 'Offer duplicated successfully',
						description: 'Offer duplicated successfully',
						subtitle: 'Offer: ' + nextOfferID
					});
				})
				.catch(function (oError) {

					//show error message
					Services.showErrorMessage(oError, "Create offer");

				});

			}catch(oError){

				//something went wrong with the creation of the offer with corresponding products, prices...
				Services.showErrorMessage(oError, "Cloning of offer,products,prices..");

			}

		},

		/**
		 * Cloning of the Product for a new offer
		 * @param {Object} offer -
		 * @param {Object} product - 
		 */
		_cloneProduct: async function(offer, product){

			let that = this;

			const oNewProduct = {
				...product,
				"OfferID": offer.OfferID,
				"DistributorID" : offer.DistributorID,
				"SUPPLY_UPDATE": 0,
				"PAYMENT_UPDATE": 0
			}

			//get values to check product validity
			let sProductCode = oNewProduct.ProductCode;
			let sInstituteID = Services.getInstituteIDofSelectedTender(); //INSTITUTE_ID
			let sCountryCode = Services.getCountryCodeofSelectedTender(); //COUNTRY_CODE
			let sDistributorID = oNewProduct.DistributorID; //DISTRIBUTOR_ID
			let sTenderChannel = Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');
			let sSellingCompany = offer.SellingCompany;
			let aCommercialAgreement = Services.getFastAppDataModel().getProperty('/Tender/CommercialAgreement');

			//check if product is still valid
			let bValid = await Services.checkProductValidForOffer(sProductCode, sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sSellingCompany, aCommercialAgreement);

			//if product is still valid, we can create it
			if (bValid) {

					//Create Product
					//if product is still valid for new distributor
					let oProductToSave = Services.getService('Product').getConvertProductToSave(oNewProduct);

					try {

						const oResult = await Services.getService('Product').createProduct(oProductToSave);

						if(oResult){

							//if price exists, we should copy the price
							if(oNewProduct && oNewProduct.Price){
								//Copy price for product
								let oNewPrice = oNewProduct.Price;
								await that._clonePrice(offer,oNewProduct,oNewPrice);
							}

							//create group purchasing
							let aGroupPurchasingToBeDuplicated = oNewProduct.GroupPurchasing && oNewProduct.GroupPurchasing.results || [];
							aGroupPurchasingToBeDuplicated.forEach(oGroupPurchasing => that._cloneGroupPurchasing.call(that, offer, oNewProduct, oGroupPurchasing));

						}


						

					}catch(oError){

						//show error message
						Services.showErrorMessage(oError, "Saving of new product");

						//whole promises batch may fail when a product fails
						throw new Error(oError);

					}

			}else{
					/*
					//keep invalid product to show in popup
					var oInvalidProduct = {
						ProductID: sProductCode,
						ProductName: oProduct.SKU.PRODUCTPACKNAME
					};
					aInvalidProducts.push(oInvalidProduct);

					var sMessage =
											"The following products are no longer valid, and are missing in this reviewed or continued offer. \n \n Products: ";
										aInvalidProducts.forEach(function (oInvalidProduct, iIndexInvalidProduct) {
											sMessage = sMessage + "\n" + oInvalidProduct.ProductName;
										});
					*/
			}

		},

		/**
		 * Cloning of the price
		 * @param {object} offer 
		 * @param {object} product 
		 * @param {object} price 
		 */
		 _clonePrice: async function(offer, product, price){
			
			//let that = this;
			let OfferProducts = Services.getFinancialModel();

			//for the reviewed offer, the products of the original offer can have price data as well
			if (price) {

				//New Price
				let oNewPrice = {
					...price,
					"OfferID": offer.OfferID,
					//"DistributorID" : offer.DistributorID
				}

				//re-calculate Netprice based upon new distributor specific commission rate
				oNewPrice.NetPrice = oNewPrice.NetofferPrice * (1 - oNewPrice.Deductions);
				
				//we are waiting for the loading of the price
				const sRegisteredPrice = await OfferProducts.loadCountryRegisteredPrice(Services.getSelectedCountry(), product.UnitPerPack,product.ProductCode, offer.Currency);			
				const oUpToDatePrices = await OfferProducts.loadAllUpToDatePrices(product.Offer, product, sRegisteredPrice.REGISTERED_PRICE);

				//if sRegPrice = false, meaning calculation is no longer found & price is not copied
				if (oUpToDatePrices.RegPrice !== false) {

					//convert Registration Price
					let iConvertedRegPrice = OfferProducts.convRegisteredPrice(product, sRegisteredPrice);

					//make same rounding
					let iConvertedOfferPrice = 0;
					if (product.UnitPerPack) {
							var sUnitPerPackOffer = product.UnitPerPack;
							iConvertedOfferPrice = formatter.priceTwoOrFour(oNewPrice.OfferPrice, undefined, sUnitPerPackOffer);
					} else {
							iConvertedOfferPrice = oNewPrice.OfferPrice;
					}

					//make same rounding
					if (sRegisteredPrice) {
						var sUOMregPrice = sRegisteredPrice.UOM;
						iConvertedRegPrice = formatter.priceTwoOrFour(iConvertedRegPrice, undefined, sUOMregPrice);
					} 

					//Check offer not larger then reg price
					if (OfferProducts.checkOfferPriceLowerRegisterPrice(iConvertedOfferPrice, iConvertedRegPrice)) {

							//Case when RegisteredPrice would have changed since OfferX was created is very complex. Thats why we inform user to manualy adapt price
							if(Number(oNewPrice.RegPrice) !== oUpToDatePrices.RegPrice){

								Services.getOfferCompositeMessages().push({
									type: 'Warning',
									title: 'Not all prices were copied',
									description: 'Products were updated since original offer was made. Please update Offer before making the copy with the prices. Please delete this one first.',
									subtitle: 'Not all prices were copied',
									counter: 1
								});

							}else{

								//change values with up to date values
								oNewPrice.RegPrice = (oUpToDatePrices.RegPrice === null) ? null : oUpToDatePrices.RegPrice.toString();
								oNewPrice.COGS = (oUpToDatePrices.COGS === null) ? null : oUpToDatePrices.COGS.toString();
								oNewPrice.SpotRate = (oUpToDatePrices.SpotRate === null) ? null : oUpToDatePrices.SpotRate.toString();
								oNewPrice.BudgetRate = (oUpToDatePrices.BudgetRate === null) ? null : oUpToDatePrices.BudgetRate.toString();
								
								//specific recalculation for new distributor Argentinia with standard discount..
								if(offer.CountryCode === "AR"){
									oNewPrice = await this._calculatePricesNewDistributor(offer,product,oNewPrice);
								}

								//in this case we should save price data as well
								var oProductPrice = Services.getService('Price').getConvertPriceToSave(oNewPrice);

								//add creation of price to batch operation
								await Services.getService('Price').createPrice(oProductPrice).catch(function (oError) {

									//show error message
									//Services.showErrorMessage(oError, "Saving of new price");
									Services.getOfferCompositeMessages().push({
										type: 'Error',
										title: 'Saving of new price',
										description: 'Price is not saved to the database.',
										subtitle: 'Technical error during save',
										counter: 1
									});

								});

							}

						} else {
							
							//sap.m.MessageBox.warning("Offerprice should be lower then registered price. Price not copied.", {});
							Services.getOfferCompositeMessages().push({
								type: 'Warning',
								title: 'Not all prices were copied',
								description: 'Not all prices were copied because some are incompatible with current registered prices.',
								subtitle: 'Not all prices were copied',
								counter: 1
							});
						}

				} else {

						Services.getOfferCompositeMessages().push({
							type: 'Warning',
							title: "Price of product was not valid, so it wasn't copied.",
							description: "Price of product was not valid, so it wasn't copied.",
							subtitle: "Price of product was not valid, so it wasn't copied.",
							counter: 1
						});

				}

			}			

		},

		/**
		 * For the price we clone, we have to do some re-calculation for the new distributor
		 * This is only needed for Argentinia at this point. Beceause argentinia has 
		 * @param {object} offer 
		 * @param {object} product 
		 * @param {object} oNewPrice
		 */
		_calculatePricesNewDistributor: async function(offer, product, oNewPrice){

			//Get Financial offer offerProducts: to call methods from it
			let OfferProducts = Services.getFinancialModel();

			//Get brandID
			let sBrandID,sProductPackID = null;
			if (product && product.SKU && product.SKU.Product){
				sProductPackID = product && product.SKU && product.SKU.ProductPackId;
				sBrandID = product.SKU.Product.HLEVEL4_CODE;
			}

			let sCountryCode = Services.getCountryCodeofSelectedTender(); //COUNTRY_CODE
			let sChannelName = Services.getLoadedTender().Institute.InstituteType; //Institute type = channel Name
			//let sInstituteType = Services.getFastAppDataModel().getProperty('/Tender/Institute/InstituteType');
			let sDistributorID = offer.DistributorID;

			//Get standard discount
			const iStandardDiscount = await OfferProducts.getStandardDiscount(sCountryCode,sChannelName,sProductPackID,sDistributorID,sBrandID);

			//re-calculate additional discount based upon new standard discount from new distributor/brand
			let iCalcAdditionalDiscount = (Number(oNewPrice.Discount) + Number(oNewPrice.AdditionalDiscount)) - iStandardDiscount;
			let iAdditionalDiscount = iCalcAdditionalDiscount > 0 ? iCalcAdditionalDiscount : 0;
			oNewPrice.AdditionalDiscount = iAdditionalDiscount;

			//show warning that re-calculated additional discount is negative (=0)
			if(iCalcAdditionalDiscount<0){
				Services.getOfferCompositeMessages().push({
					type: 'Warning', 
					title: 'Incompatible net price',
					description: 'Incompatible distributor discount',
					subtitle: 'Distributor (' + offer.DistributorID + ') has too high standard discount to align net price on product (' + product.ProductCode + ').',
					counter: 1
				});
			}

			//apply standard discount
			oNewPrice.Discount = oNewPrice.StandardDiscount = iStandardDiscount; //standard discount is kept & applied as discount
			oNewPrice.OfferPrice = oNewPrice.RegPrice * (1 - iStandardDiscount);

			//netOfferPrice: re-calculate 
			let focType = oNewPrice.FOCType
			let focAbsPct = oNewPrice.FOC_ABS_PCT;
			let foc = oNewPrice.FOC;
			let productValues = product;

			let focChartPercentage = ((focType === "FOC 1") ? foc : 1 - 1 / (1 + foc));
			let focChartAbsolute = ((focType === "FOC 1") ? 1 - (productValues.RequestedVolume - foc) / productValues.RequestedVolume : 1 - productValues.RequestedVolume / (productValues.RequestedVolume + foc));
			let focChart = (focAbsPct === "PCT") ? focChartPercentage : focChartAbsolute;
			oNewPrice.NetOfferPrice = oNewPrice.RegPrice * (1 - (iStandardDiscount + iAdditionalDiscount)) * (1 - focChart);

			//netPrice: re-calculate 
			oNewPrice.netPrice = oNewPrice.NetOfferPrice * (1 - oNewPrice.Deductions);

			return oNewPrice;

		},

		/**
		 * Cloning of the group Purchasing
		 * @param {object} offer 
		 * @param {object} product 
		 * @param {object} groupPurchasing
		 */
		_cloneGroupPurchasing: async function(offer, product, groupPurchasing){

			//Save the group purchasing for each product
			if (groupPurchasing) {

				const oGroupPurchasing = {
					...groupPurchasing,
					"OfferID": offer.OfferID
				}

				//convert group purchasing
				let oGroupPurchasingToSave = Services.getService('GroupPurchasing').getConvertGroupPurchasingToSave(oGroupPurchasing);

				//create group purchasing
				await Services.getService('GroupPurchasing').createGroupPurchasing(oGroupPurchasingToSave).catch(function (oError) {
					//show error message
					Services.showErrorMessage(oError, "Creation of group purchasing");
					throw new Error(oError);
				});

			}

		},

		onDuplicateOfferDialogClose: function(){
			if(this.pDuplicateOfferDialog){

				this.pDuplicateOfferDialog.then(function(oDialog) {
					oDialog.close();
				});

			}
		},


		/**
		 * Event handler for "Tender Overview" button click on the "Financial Offer" tab
		 * @param {*} oEvent - 
		 */
		onTenderOverviewPress: async function(oEvent){

			BusyIndicator.show(0);

			const oTenderOverviewObject = await this._createTenderOverviewModelStructure();
			Services.getFastAppDataModel().setProperty("/TenderOverview", oTenderOverviewObject);

			const oView = this.getView();

			// create TenderOverview dialog lazily
			if (!this.pTenderOverviewDialog) {

				this.pTenderOverviewDialog = Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.TenderOverviewDialog",
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
			const expandFields = "Product/Price,Distributor";
			const allTenderOffers = await this.getTenderOffers(expandFields);
			const allTenderProducts = await this.getTenderProducts(Services.getSelectedTenderID());
			const uniqueTenderProductCodes = Array.from(new Set(allTenderProducts.map(product => product.ProductCode)));

			// create rows
			const productNetPrices = uniqueTenderProductCodes.map(productCode => {

				const row = allTenderOffers.map(offer => {
					const product = offer.Product.results.find(prd => prd.ProductCode === productCode);
					let netPrice = "NA";
					
					if(product && product.Price){
						//netPrice = product.Price.NetPrice;
						netPrice = formatter.priceTwoOrFour(product.Price.NetPrice, undefined, product.Price.UnitPerPack);
					}
	
					return {
						value: netPrice
					};
				});

				// check if net prices are different and add that info to the array
				const bNetPricesAreEqual = row.every( item => item.value === row[0].value );
				row.forEach((item, index, arr) => {
					arr[index] = {
						bNetPriceDiffer: !bNetPricesAreEqual,
						value: item.value
					}
				});


				// add product name at the beginning of the row
				const oProduct = allTenderProducts.find(prd => prd.ProductCode === productCode);
				row.unshift({
					value: oProduct.SKU.PRODUCTPACKNAME
				});

				return {
					product: productCode,
					netPrices: row
				};
					
			});
			

			// adds an empty object at the beginning of the array before adding it to the model
			// first column must be empty
			allTenderOffers.unshift({}); 

			const oTenderOverview = {
				columns : allTenderOffers,
				rows    : productNetPrices
			};

			return oTenderOverview;
		},

		onTenderOverviewDialogClose: function(){
			if(this.pTenderOverviewDialog){
				this.pTenderOverviewDialog.then( oDialog => oDialog.close());
			}
		},


		//Saving on Offer product tab
		_onSaveOfferProduct: async function (oEvent) {

			var oFastAppData = Services.getFastAppDataModel();
			var that = this;

			// for Brazil only
			// Warning message pop up when switching channels at the offer level
			if(oFastAppData.getProperty('/Tender/CountryCode') === 'BR'){
				try{
					await this.showOfferProductsChannelWarningMessage();
				}
				catch(error){
					// user aborted the warning message
					if(error === "Abort") return;
				}
			}

			// open loading indicator (used beceause higher z-index then loading dialog & other dialogs)
			BusyIndicator.show();

			//OFFER PRODUCTS TAB - SAVE button
			var bError = false;

			//products to save that are visible in the table
			var aProducts = oFastAppData.getProperty("/EditOffer/Product/results");
			//Brazil
			if (oFastAppData.getProperty('/Tender/CountryCode') === 'BR') {
				const isInDirectOffer = oFastAppData.getProperty("/isInDirectOffer");
				const isDirectOffer = oFastAppData.getProperty("/isDirectOffer");
				aProducts = aProducts.map(product => {
					if (product.Channel.toLowerCase() === "bayer" && isInDirectOffer) {
						product.ActiveProduct = 0;
					}
					if (product.Channel.toLowerCase() === "distributor" && isDirectOffer) {
						product.ActiveProduct = 0;
					}
					return product
				});
			}
			//TODO: we could do it in the same way we do it for Deliveries, Letters, GroupPurchasing - PUT when loaded, POST when we add, DELETE when PUT becomes DELETE
			//add products again that were ready to be deleted (they are not visible on EditOffer/product/results)
			//they should be added again, beceause they still need to be saved (as deleted)
			var aProductsBefore = Services.getProductsSaveInfo();
			if (aProductsBefore) {
				aProductsBefore.forEach(function (oProduct, index) {
					if (oProduct._sOperation === "DELETE") {
						aProducts.push(oProduct);
					}
				});
				Services.setProductsSaveInfo(aProducts);
			}

			//check for mandatory fields
			if (aProducts) {
				//make fields mandatory based on list
				let aMandatoryFields = oFastAppData.getProperty('/MandatoryFields');
				var aMessages = [];
				var iMsgCount = 0;
				var sErroneousFields = "";
                
                //maxPrice should not be mandatory for commercial agreement in spain
                if(oFastAppData.getProperty('/Tender/CountryCode') === 'ES' && oFastAppData.getProperty('/Tender/Classification') === 'Commercial Agreement'){
                    let index = aMandatoryFields.findIndex(field => field.Column === 'MaxPrice');
                    if (index > -1) aMandatoryFields.splice(index, 1);
                }
                
				// TODO: as discussed with Wouter: these kind of validation logic should be done in the backend and the back-end should throw an error 
				aProducts.forEach(function (oProduct, index) {
					if (aMandatoryFields.length > 0) {

						for (var i = 0; i < aMandatoryFields.length; i++) {

							let oProductField = "";
							
							// Binding path can be a nested path. Eg. "SKU/PRODUCTPACKNAME". Because of this this code was not working correctly.
							// We need to split the path and use each value as object key in oProduc
							if(aMandatoryFields[i].BindingPath.indexOf("/") > -1) {
								const parts = aMandatoryFields[i].BindingPath.split("/");
								
								let bindingPath = "oProduct";

								parts.forEach(part => {
									bindingPath += `["${part}"]`;
								});

								oProductField = eval(bindingPath);

								
							}else {
								oProductField = oProduct[aMandatoryFields[i].BindingPath];
							}

							// "0" values should be allowed and thus the error fields check should be skipped
							if(typeof oProductField === "number" && oProductField >= 0  && aMandatoryFields[i].Required === true){
								oProductField = true;
							}

							// error fields
							if (!oProductField && aMandatoryFields[i].Required === true && aMandatoryFields[i].TableID === "editofferProductId") {

								bError = true;
								iMsgCount = iMsgCount + 1;

								if (sErroneousFields === "") {
									sErroneousFields = aMandatoryFields[i].Column;
								} else {
									sErroneousFields = sErroneousFields + '\n' + aMandatoryFields[i].Column;
								}
							}
						}
					}

					if (bError) {
						var oMessage = {
							type: 'Error',
							title: 'Please enter all mandatory fields for product' + ' ' + oProduct.SKU.PRODUCTPACKNAME,
							description: sErroneousFields,
							subtitle: oProduct.SKU.PRODUCTPACKNAME,
							counter: iMsgCount
						}
						aMessages.push(oMessage);

						//clear the message count & the field list per product
						iMsgCount = 0;
						sErroneousFields = "";
					}

                    if(oProduct.CountryCode === 'BR'){ //just run this check for brazil products, not needed otherwise
                        if(aProducts.find(product => product.LotID === oProduct.LotID && product.Line === oProduct.Line && product.ProductCode !== oProduct.ProductCode)){
                            aMessages.push({
                                type: 'Error',
                                title: 'Another product other than' + ' ' + oProduct.SKU.PRODUCTPACKNAME + ' already has the same line number',
                                subtitle: oProduct.SKU.PRODUCTPACKNAME,
                                counter: iMsgCount
                            });

                            iMsgCount = 0;
                        }
                    }

					bError = false;
				});

				//show message view
				if (aMessages.length > 0) {
					Services.showMessageCompositeView('Error', aMessages, 'Error');

					// close loading that blocks everything
					BusyIndicator.hide();

					return;
				}

			}

			//Prepare offer to be saved
			bError = this.prepSaveProductOffer();
			if (bError) {

				// close loading that blocks everything
				BusyIndicator.hide();

				return;
			}

			//SAVE ALL DATA - Product offer + matching products
			var sSelectedOfferID = Services.getSelectedOfferID();
			var sOfferPath = "";
			if (sSelectedOfferID) {
				sOfferPath = "/PT_TMOFRS('" + sSelectedOfferID + "')";
			}

			//TODO merge to financial.js --> & set get on service file instead of passing it on to the methods...
			var oOfferFragment = new OfferProducts();
			Services.setFinancialModel(oOfferFragment);

			//$.when(Services.saveProductOfferAll(sOfferPath)).done(function (oSaveResults) {
			Services.saveProductOfferAll(sOfferPath).then(function (oSaveResults) {
				//When at least the savProductOffer has succeeded
				//Load 2 models again with data from database
				//clear necesarry globals
				if (oSaveResults.saveProductOffer === true) {

					//refresh the default model (FastData) for the display view
					Services.getDefaultModel().refresh(true);

					//In this case we might dit some changes in the fastAppData model, we will load all data from the database again
					//otherwise nextOfferID is f.e still the one that is already created
					var sTenderID = Services.getSelectedTenderID();

					//we will load tender again after save is done
					var bLoadedCheck = false;

					$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

						//go back to display view
						that.onEditToggleButtonPress();

						//this way we can use a seperate layer, adding deleting... and afterords saving
						var oFastAppDataModel = Services.getFastAppDataModel();

						oFastAppDataModel.refresh(true); //get sorting already right so the new offer is at right position
						that.getView().setModel(oFastAppDataModel, "fastAppData");

						//select saved item again in view
						if (oSaveResults.saveProductOfferID !== "") {

							//set selected offer
							Services.setSelectedOfferID(oSaveResults.saveProductOfferID);

							//refresh tenders master table (left pane)
							Services.refreshTendersMasterTable(sTenderID);

							//Set selected offer in left pane
							that._selectOfferInLeftPane(oSaveResults.saveProductOfferID);

						}

						// close loading that blocks everything
						BusyIndicator.hide();

					});

				}

			}).catch(function (oError) {
				// close loading that blocks everything
				BusyIndicator.hide();
			});

		},

		showOfferProductsChannelWarningMessage: function(){
			const sWarningMessage = this.getView().getModel("viewModel").getProperty("/OfferProductsChannelWarningMessage");
			if(!sWarningMessage) return;

			return new Promise((resolve, reject) => {
				const oOfferProductsChannelWarningMessageDialog = new Dialog({
					type: DialogType.Message,
					title: "Warning",
					state: ValueState.Warning,
					content: new Text({ text: sWarningMessage }),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Yes",
						press: function () {
							oOfferProductsChannelWarningMessageDialog.close();
							oOfferProductsChannelWarningMessageDialog.destroy();
							resolve("Yes");
						}.bind(this)
					}),
					endButton: new Button({
						type: ButtonType.Emphasized,
						text: "Abort",
						press: function () {
							oOfferProductsChannelWarningMessageDialog.close();
							oOfferProductsChannelWarningMessageDialog.destroy();
							reject("Abort");
						}.bind(this)
					})
				});
	
				oOfferProductsChannelWarningMessageDialog.open();
			  });

		},

		//decline all products underneath the offer with 1 reason
		onDeclineAllProductsForOffer: function (oEvent) {
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();
			//show dialog
			if (!that._oDialogDeclineProducts) {
				that._oDialogDeclineProducts = new sap.m.Dialog("handleDeclineDialog", {
					title: bundle.getText("DeclineProduct"),
					resizable: true, //user is able to resize
					stretch: false, //dialog is as big as possible
					contentHeight: '30%',
					contentWidth: '30%',
					buttons: [
						new sap.m.Button({
							id: "btnDeclineProducts",
							text: bundle.getText("DeclineProduct"),
							tap: [that.onDeclineAllProductsForOfferConfirm, that]

						}),
						new sap.m.Button({
							id: "btnCloseDeclineProducts",
							text: bundle.getText("Close"),
							tap: [that.onCloseProductsDeclineDialog, that]
						})

					],
					//content with all fields that need to be filled
					content: [sap.ui.xmlfragment("FAST_NS0FAST0.fragments.DeclineAllProductsForOffer", that)]
						// End of content of dialog
				});
			}

			//boolean for enabling decline button
			var bEnabled = false;
			if (oFastAppDataModel.getProperty("/EditOffer/Product/results/length") >= 0) {
				bEnabled = true;
			} else {
				bEnabled = false;
			}
			sap.ui.getCore().byId("btnDeclineProducts").setEnabled(bEnabled);

			//set as dependent so we have binding available
			that.getView().addDependent(that._oDialogDeclineProducts);
			that._oDialogDeclineProducts.open();
		},

		//decline all ProductsForOffer
		onDeclineAllProductsForOfferConfirm: function (oEvent) {

			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//get products that are loaded
			var aProducts = oFastAppDataModel.getProperty("/EditOffer/Product/results/");
			var sComment = sap.ui.getCore().byId("reasonForDeclineId").getValue();

			//loop at all the products and change the comment & decline
			aProducts.forEach(function (oProduct, iIndex) {
				oProduct.ActiveProduct = 2; //=decline
				oProduct.Comment = sComment; //copy comment
			});

			//set changed products
			oFastAppDataModel.setProperty("/EditOffer/Product/results/", aProducts);

			//close dialog
			that._oDialogDeclineProducts.close();

		},

		//close dialog for declining products
		onCloseProductsDeclineDialog: function (oEvent) {
			var that = this;
			//close dialog
			that._oDialogDeclineProducts.close();
		},

		//show dialog for adding a Product offer: OfferProductsEdit.fragment.xml
		onAddProductForOffer: async function (oEvent) {

			//distributor id is set on page form and should be used (instead of requested) when adding product
			//payment terms and inco terns should set based on information in view providing product

			//data declarations
			var oFastAppDataModel = Services.getFastAppDataModel();
			var that = this;
			let oTender = Services.getLoadedTender();
			let sTenderReference = oTender.CountrySpecificInformation && oTender.CountrySpecificInformation.TenderReference;

			Services.setSelectedDistributorID(that.getView().byId("idDistributorName").getSelectedKey());

			//clear fields
			oFastAppDataModel.setProperty("/ProductCollection", null);
			//oFastAppDataModel.setProperty("/ProductCollectionOutput", null);

			//for chile we show the products that were mached to say the the salesopportunity was IN (intresting for bayer fast)
			let sMercadoInProductsMessage = '';
			if(Services.getSelectedCountry() === 'CL'){

				const salesOpportunity = await Services.getService('SalesOpportunity').getOpportunity(sTenderReference);
				let oSalesOpportunity = salesOpportunity.data && salesOpportunity.data.results && salesOpportunity.data.results.length > 0 && salesOpportunity.data.results[0];
				sMercadoInProductsMessage = 'Sales opportunity was matched upon the following products: ';
				if(oSalesOpportunity.TenderMatchingStatus === 'In'){ //(intresting for bayer fast)
					
					let aProducts = oSalesOpportunity.Items && oSalesOpportunity.Items.results.length > 0 && oSalesOpportunity.Items.results;
					aProducts.forEach(oProduct => {
						sMercadoInProductsMessage = sMercadoInProductsMessage + oProduct.ProductName + ","
					});
					
				}else{
					sMercadoInProductsMessage = '';
				}

				//TenderMatchingStatus
				oFastAppDataModel.setProperty("/MercadoInProductsMessage", sMercadoInProductsMessage);
			}else{
				//Make message empty if other country (otherwise previous message from CL could be shown again)
				oFastAppDataModel.setProperty("/MercadoInProductsMessage", sMercadoInProductsMessage);
			}
			

			//if dialog exists destroy it first, so we always set dialog buttons in correct state
			if (that._oDialog) {
				that._oDialog.destroy();
			}

			that._oDialog = new sap.m.Dialog("addProductDialog", {
				title: bundle.getText("Addprod"),
				stretch: true,
				horizontalScrolling:false,
				verticalScrolling:false,
				buttons: [new sap.m.Button({
						id: "idAddProductsBtn",
						text: bundle.getText("Apply"),
						enabled: true,
						tap: [that.onAddProductDialogConfirm, that]

					})

					/*cancel is no longer possible, that should be done on offer screen,
					new sap.m.Button({
						text: bundle.getText("Cancel"),
						tap: [that.onCancelAddProductSearch, that]

					})
					*/

				],
				//content with all fields that need to be filled
				content: [sap.ui.xmlfragment("FAST_NS0FAST0.fragments.SelectBrandProductList", that)]
					// End of content of dialog
			});

			that.getView().addDependent(that._oDialog);
			that._oDialog.open();

            let sCountryCode = Services.getCountryCodeofSelectedTender();
            if(sCountryCode === 'BR'){
                let iSelectedLotID = Number(that.getView().byId('idSelectLotView').getSelectedKey());
                iSelectedLotID = oFastAppDataModel.getProperty('/SelectedLot') || 1;
                const lotFilter = new Filter({
                    path: 'LotID',
                    value1: iSelectedLotID,
                    operator: sap.ui.model.FilterOperator.EQ
                });
                sap.ui.getCore().byId("idListProductsOutput").getBinding("items")?.filter(lotFilter);
            }

			//Clear all fields
			var oBrandList = sap.ui.getCore().byId("idBrandList");
			var aBrandTokens = [];
			oBrandList.setTokens(aBrandTokens);

		},

        onAddLot: function () {

			var oView = this.getView();
            
            //store original freegoodsother for cancellation
            const oFastAppDataModel = Services.getFastAppDataModel();
            
            //saving original state to  service array object so we can return to it's original state / compare when saving
            const bindingPath = "/EditOffer/Lots/results";
            let aLots = oFastAppDataModel.getProperty(bindingPath);
            Services.setLotsBeforeEdit(aLots?.map(lot => {
                return Object.create(lot);
            }));

            //get original state of products so we can use these upon cancel
            let aExistingProducts = oFastAppDataModel.getProperty("/EditOffer/Product/results");
            this._aExistingProductsLotsEdit = aExistingProducts?.map(product => {
                return Object.create(product);
            });

			// create dialog lazily
			if (!this.pDialogAddLots) {
				this.pDialogAddLots = Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.brazil.AddLot",
					controller: this
				}).then(function (oDialogAddLots) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialogAddLots);
					oDialogAddLots.setModel(Services.getFastAppDataModel(), "fastAppData");
					return oDialogAddLots;
				});
			}

			this.pDialogAddLots.then(function (oDialogAddLots) {
                const oTable = this.byId("LotNumbers");
				oDialogAddLots.open();
			}.bind(this));
		},

        onAddNewLot: function (event) {
            const oFastAppDataModel = Services.getFastAppDataModel();
            const bindingPath = "/EditOffer/Lots/results";

            if(!oFastAppDataModel.getProperty("/EditOffer/Lots")){
                oFastAppDataModel.setProperty("/EditOffer/Lots", {});
            }
            
			let lots = oFastAppDataModel.getProperty(bindingPath) || [];
            //if we're creating a new offer, and adding lots immediately, we do not have the full OfferID at that point. Therefore, we'll have to combine it based on thee tender & next offer ID
			lots.push({
                LotID: 0,
                OfferID: oFastAppDataModel.getProperty('/NewOfferPressed') ? `${oFastAppDataModel.getProperty('/EditOffer/TenderID')}-${oFastAppDataModel.getProperty('/EditOffer/OfferID')}` : Services.getSelectedOfferID(),
			});

			oFastAppDataModel.setProperty(bindingPath, lots);
            
            const oTable = this.byId("LotNumbers");
            oTable.bindElement({ path: bindingPath, model: "fastAppData" });            
            oFastAppDataModel.updateBindings();            
		},

        onDeleteLot: function (event) {
            const oFastAppDataModel = Services.getFastAppDataModel();
            const bindingPath = "/EditOffer/Lots/results";

            //get deleted index
            let sSelectedPath = event.getSource().getParent().getBindingContext('fastAppData').sPath;
            let iIndex = parseInt(sSelectedPath.substring(sSelectedPath.lastIndexOf('/') + 1));

            //get current entries
            let aLots = oFastAppDataModel.getProperty(bindingPath);

            //remove linked products
            let aExistingProducts = oFastAppDataModel.getProperty("/EditOffer/Product/results");
            aExistingProducts = aExistingProducts?.filter(product => product.LotID === oFastAppDataModel.getProperty(sSelectedPath)?.LotID);
			Services.removeProductsSaveInfo(aExistingProducts);

            aLots.splice(iIndex, 1);
            oFastAppDataModel.refresh(true);
        },

        oCancelLots: function () {
            //reset previous saved state and close the dialog
            const oFastAppDataModel = Services.getFastAppDataModel();

            //return lots to their original state
            const bindingPath = "/EditOffer/Lots/results";
            const aLotsPreviousState = Services.getLotsBeforeEdit();
			oFastAppDataModel.setProperty(bindingPath, aLotsPreviousState);

            //return products to their original state - products can be removed when a lot is being removed
            oFastAppDataModel.setProperty("/EditOffer/Product/results", this._aExistingProductsLotsEdit);

            oFastAppDataModel.refresh(true);
            
            if(this.pDialogAddLots){

                this.pDialogAddLots.then(pDialog => pDialog.close());
            }
                
        },

        onValidateLotLine: function(oEvent){
            //reset previous saved state and close the dialog
            const oFastAppDataModel = Services.getFastAppDataModel();
            const bindingPath = "/EditOffer/Product";
            const iSelectedLotID = oFastAppDataModel.getProperty('/SelectedLot') || 1;
			let aProducts = oFastAppDataModel.getProperty(bindingPath);

            if(aProducts.results.find(product => product.Line === oEvent.getParameter('newValue') && product.LotID === iSelectedLotID)){
                oEvent.getSource().setValueState("Error");
                oEvent.getSource().setValueStateText("There already exists a product with the same line number");
                oEvent.getSource().openValueStateMessage();
            }else{
                oEvent.getSource().setValueState("None");
                oEvent.getSource().setValueStateText("");
                oEvent.getSource().closeValueStateMessage();
            }
        },

        oApplyLots: function () {
            const oFastAppDataModel = Services.getFastAppDataModel();
            const bindingPath = "/EditOffer/Lots/results";
            const aLots = oFastAppDataModel.getProperty(bindingPath);
            
            if(this.pDialogAddLots){

                this.pDialogAddLots.then(pDialog => pDialog.close());
            }

            const iSelectedLot = aLots && aLots.length > 0 ? Number(aLots[0].LotID) : 0;
            oFastAppDataModel.setProperty('/SelectedLot', iSelectedLot);
            this.filterBySelectedLot(iSelectedLot);
                
        },

		//when deleting a product
		onDeleteProductForOffer: function () {

			let oFastAppData = Services.getFastAppDataModel();
			const sCountryCode = Services.getCountryCodeofSelectedTender();
			//Deleting products
			var oTableProducts = this.byId("editofferProductId");
			var aIndexSelectedRows = oTableProducts.getSelectedIndices();
			var aProductsToRemove = [];
			var oProductToRemove = {};
			let aExistingProducts = Services.getProductsSaveInfo();
			let selectedLotID = 1; // Default LotID. Not for Brazil
			let bBrazilDivisionChanged = oFastAppData.getProperty("/bBrazilDivisionChanged");
			if (sCountryCode === "BR" && !bBrazilDivisionChanged) {
				selectedLotID = oFastAppData.getProperty("/SelectedLot") || Number(this.byId("idSelectLotView").getSelectedKey());
			}
			if (sCountryCode === "BR" && bBrazilDivisionChanged) {
				oFastAppData.setProperty("/bBrazilDivisionChanged", false);
				Services.removeProductsSaveInfo(aExistingProducts, sCountryCode, bBrazilDivisionChanged);
				oTableProducts.clearSelection();
				return;
			}
			if(!aExistingProducts || aExistingProducts.length === 0){ 
				aExistingProducts = oFastAppData.getProperty("/EditOffer/Product/results");
			}

			//already deleted products are not visible in table, so indexselectedrows should ignore these products
			//but they still need to be available for saving
			var aExistingProductsWhithoutAlreadyDeleted = aExistingProducts.filter(function (oCurrent) {
				return oCurrent._sOperation !== 'DELETE' && oCurrent.LotID === selectedLotID;
			});
			//loop at selected rows
			aIndexSelectedRows?.forEach(function (iSelectedIndex, iIndex) {

				if (aExistingProductsWhithoutAlreadyDeleted[iSelectedIndex]) {

					//Add selected products so they can be removed from the database
					oProductToRemove = {};
					oProductToRemove.ProductCode = aExistingProductsWhithoutAlreadyDeleted[iSelectedIndex].ProductCode;
					oProductToRemove.LotID = aExistingProductsWhithoutAlreadyDeleted[iSelectedIndex].LotID;
					aProductsToRemove.push(oProductToRemove);

				}

			});

			//remove products
			Services.removeProductsSaveInfo(aProductsToRemove);

			//no selection anymore
			oTableProducts.clearSelection();

		},

		//OFFER PRODUCTS - TENDER OFFER - CREATE OFFER BUTTON 
		onCreateProductOffer: function (oEvent) {

			//keep track from where we are entering 
			Services.setNewOfferPressed(true);

			//clear selected offer
			Services.setSelectedOfferID("");
			Services.setSelectedOfferPath("");

			//show different view
			this.onEditToggleButtonPress();

			//beceause onEditToggleButtonPress button has bound the current offer to the table
			//these fields should be cleared, and refilled by the user
			this.byId("idDistributorName").setValue();
			this.byId("idSellingCompany").setValue();
			this.byId("idintrDueDte").setValue();

			//if italy, default the internal due date to offer due date
			if(Services.getSelectedCountry() === 'IT' || Services.getSelectedCountry() === 'ES'){
				this.byId("idintrDueDte").setValue(this.byId("idOrfDueDate").getValue());
			}
			this.byId("idWhleSle").setValue();

			//at this point no product should be selected.
			Services.setSelectedProductID("");
			Services.setSelectedProductName("");
			Services.setSelectedProductPath("");

			//But show text that we are creating a new offer. (temp. Text)
			var sNewOfferTemp = "Creating a new offer ";
			Services.getFastAppDataModel().setProperty("/SelectedOfferID", sNewOfferTemp);

			//OFFER PRODUCTS TAB is shown
			this.byId("DetailPage").setSelectedSection(Services.getOfferProductPageSectionID());

			//TODO should also clear products table
			this.updateExisting = false;

		},

		//When in edit mode button to add a product is clicked - Offer products - Offerproductsedit.fragment
		onAddProductDialogConfirm: function (oEvent) {

			//data declarations
			var oFastAppDataModel = Services.getFastAppDataModel();
			var that = this;
			var aMessages = [];

			//add productpack sku after product is added to the fastappdatamodel
			//otherwise the structure of the object is not correct to use in the save
			//these are not saved to the database (not existing in PT_TMOFPR) but still displayed in the product table in edit mode
			//so we need the binding seperatly for the newly added ones
			//SKU so name is displayed in the page

			//products with newly added product included
			var sPath = "/EditOffer/Product/results";
			var aProductsAfterAdd = oFastAppDataModel.getProperty(sPath);

			if (aProductsAfterAdd) {
				$.when(Services.convProductsForBinding(aProductsAfterAdd)).done(function (aProductsForBinding) {

					//Bind the product objects (including the newly added & extended product)
					oFastAppDataModel.setProperty(sPath, aProductsForBinding);

					//show message for active agreements
					if(aProductsForBinding.some( product => product.OtherPriceAgreementsExist === 'Yes')){
						var aProductsForBindingFilter = aProductsForBinding;

						aMessages.push({
							type: 'Warning',
							title: 'Active agreements exist for products',
							subtitle: '',
							description: Array.from(aProductsForBindingFilter.filter((product) => product.OtherPriceAgreementsExist === 'Yes')
										.map((product) => { return `${product.SKU.PRODUCTPACKNAME} \nOfferID: ${product.OtherPriceAgreementOfferId} \nClassification: ${product.OtherPriceAgreementTenderClassification}`}))
										.join("\n")
						});
						Services.showMessageCompositeView('Warning', aMessages, 'Warning');
					}

					// Set the OfferProducts Channel for Brazil OfferProducts
					that.setOfferProductsChannel(aProductsForBinding);

					//close the dialog
					that._oDialog.close();

					//sort again by refresh items binding
					var oEditOfferProductTable = that.getView().byId("editofferProductId");
					if (oEditOfferProductTable) {
						//refresh table with new items or existing
						if (oEditOfferProductTable.getBinding("items"))
							oEditOfferProductTable.getBinding("items").refresh(true);
						else {
							oEditOfferProductTable.getBinding().refresh(true);
						}
					}
				});
			} else {
				//close the dialog
				that._oDialog.close();
			}
		},

		/**
		 * This method sets the Channel dropdown default value based on the Distributor Name
		 * Applicable for Brazil only
		 * @return - returns true if the channel was set, else false
		 */
		setOfferProductsChannel: function(aProducts){
			const countryCode = Services.getCountryCodeofSelectedTender();
			if(!countryCode || countryCode.toLowerCase() !== "br"){
				console.error("The country code does not exist or is not set correctly");
				return false;
			}

			const sSelectedDistributorName = this.getView().byId("idDistributorName").getSelectedItem().getText();
			let sOfferProductsChannel;

			if(!sSelectedDistributorName){
				console.error("OfferProducts DistributorName could not be determined");
				return false;
			}

			if(sSelectedDistributorName && sSelectedDistributorName.replace(/\s/g, '').toLowerCase() === "bayerbrazil"){
				sOfferProductsChannel = "Bayer";
			}else{
				sOfferProductsChannel = "Distributor";
			}

			// set the default channel
			aProducts.forEach(prd => prd.Channel = sOfferProductsChannel);

			// update the bindings
			const oTable = this.getView().byId("editofferProductId");
			oTable.getModel("fastAppData").updateBindings();
			return true;
		},

		/**
		 * Event handler for OfferProducts Channel select change
		 * @param {Object} - Event obj
		 */
		onOfferProductsChannelChange: function(oEvent){
			const sSelectedChannelText = oEvent.getParameter('selectedItem').getText();
			const sSelectedDistributorText = this.getView().byId("idDistributorName").getSelectedItem().getText();
			const oSelectedObject = oEvent.getParameter('selectedItem').getBindingContext("fastAppData").getObject();
			
			// set warning message when switching Channels at the offer level
			const sWarningMessage = this.getOfferProductsChannelWarningMessage(sSelectedChannelText, sSelectedDistributorText);
			this.getView().getModel("viewModel").setProperty("/OfferProductsChannelWarningMessage", sWarningMessage);

			// set notifyIbizData
			this.setNotifyIbizData(sWarningMessage, oSelectedObject,sSelectedDistributorText);
			
		},

		setNotifyIbizData: function(sWarningMessage, oObject,sDistributorName){
			// const directIndirect = sDistributorName.replace(/\s/g, '').toLowerCase() === "bayerbrazil" ? 0 : 1; // (0 = direct; 1 = indirect)
			const workflowproductIDs = new Set(this.getView().getModel("viewModel").getProperty("/NotifyIbizWorkflowProductIDs"));
			const ibizWorkflowID = oObject?.Offer?.IbizWorkflowID;

			if(sWarningMessage){ // add
				workflowproductIDs.add(Number(oObject?.WorkflowProductID));
			}else{ // remove
				workflowproductIDs.delete(Number(oObject?.WorkflowProductID));
			}
			
			this.getView().getModel("viewModel").setProperty("/NotifyIbizWorkflowProductIDs", Array.from(workflowproductIDs));
			// this.getView().getModel("viewModel").setProperty("/NotifyIbizDirectIndirect", directIndirect);
			this.getView().getModel("viewModel").setProperty("/NotifyIbizWorkflowID", ibizWorkflowID);
		
		},

		getOfferProductsChannelWarningMessage: function(channel, distributor){
			if(!channel || !distributor) return;
			const sDistributorToBayerMessage = "You are changing the tender channel. This will inform the distributor that we are " +
												"refusing the opportunity and will lead to some changes in the FAST process. " + 
												"Once the distributor is informed, you will not be able to change the status again";
			const sBayerToDistributorMessage = "You are changing the tender channel. This will lead to some changes in the FAST " + 
												"process and inform the distributor about the opportunity at the end of the process. " +
												"Once you confirmed, you will not be able to change the status again";
			let sMessage = "";
			// from Bayer to Distributor
			if(distributor.replace(/\s/g, '').toLowerCase() === "bayerbrazil" && channel.toLowerCase() === "distributor"){
				sMessage = sBayerToDistributorMessage;
				this.getView().getModel("viewModel").setProperty("/NotifyIbizDirectIndirect", 1);
				Services.getFastAppDataModel().setProperty("/isDirectOffer", true);
				Services.getFastAppDataModel().setProperty("/isInDirectOffer", false);
			}
			// form Distributor to Bayer
			else if(!(distributor.replace(/\s/g, '').toLowerCase() === "bayerbrazil") && channel.toLowerCase() === "bayer"){
				sMessage = sDistributorToBayerMessage;
				this.getView().getModel("viewModel").setProperty("/NotifyIbizDirectIndirect", 0);
				Services.getFastAppDataModel().setProperty("/isInDirectOffer", true);
				Services.getFastAppDataModel().setProperty("/isDirectOffer", false);
			}else {
				sMessage = "";
			}

			return sMessage;
		},

		//OFFER PRODUCTS SAVE is clicked
		prepSaveProductOffer: function () {

			//get fast app data model
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
            let Division = this._country === "ES" || this._country === "BR" ? this.getView().byId("idProductOfferDivisionES").getSelectedItem().getKey() : this.getView().byId("idProductOfferDivision").getSelectedItem().getKey();

			//check on mandatory fields
			if (
				//this.byId("idDistributorName").getSelectedKey() === "" ||
				//Services.getSelectedDistributorID() === "" ||
				oFastAppDataModel.getProperty("/EditOffer/DistributorID") === "" ||
				this.byId("idintrDueDte").getValue() === "" ||
				this.byId("idSellingCompany").getSelectedKey() === "" ||
				this.byId("idWhleSle").getSelectedItem().getKey() === "" ||
				Division === "" ||
				//new offer date only exists in continued or reviewed offer - but in this case it is a mandatory field
				(
					(Services.getContinuedOfferPressed() || Services.getReviewedOfferPressed()) && (this.byId("idNewOfferDate").getValue() === "")
				)
			) {
				sap.m.MessageBox.error("Please enter all the mandatory fields.");
				return true;
			}

			//keep the selected distributor ID
			Services.setSelectedDistributorID(this.byId("idDistributorName").getSelectedKey());

			//Varriable ready
			var oOfferSaveInfo = {};
			var that = this;

			//In edit mode, the offer is available, so we should take that offerID to do the saving
			if (Services.getEditPressed()) {
				var sOfferID = Services.getSelectedOfferID();
				var TenderOfferNo = Services.getSelectedTenderOfferNo();
				var RevisedOfferNo = Services.getSelectedRevisedOfferNo();
				var ContinuedOfferNo = Services.getSelectedContinuedOfferNo();
			} else {
				//When the offer is not yet available/existing in the database: get next offer ID
				var sNextOfferID = Services.getLoadedNextOfferID();

				//Get new offerID
				var Tenderoff = Services.getSelectedTenderID();
				var Sellingoff = that.byId("idSellingCompany").getSelectedKey(); //NILS_CHECK: that.byId("idSellingCompany").getValue();
				if (((!Services.getReviewedOfferPressed() && !Services.getContinuedOfferPressed()) || Services.getClonePressed())) {
					var sOfferID = Tenderoff + "-" + sNextOfferID;
					var TenderOfferNo = sNextOfferID;
					var ContinuedOfferNo = 0;
					var RevisedOfferNo = 0;
				} else {
					var TenderOfferNo = Services.getSelectedTenderOfferNo();
					if (Services.getContinuedOfferPressed()) {
						var ContinuedOfferNo = Services.getNextContinuedOfferNo();
						var sOfferID = Tenderoff + "-" + TenderOfferNo + "-C" + ContinuedOfferNo;
						var RevisedOfferNo = 0;
					}
					if (Services.getReviewedOfferPressed()) {
						var RevisedOfferNo = Services.getNextRevisedOfferNo();
						sOfferID = Tenderoff + "-" + TenderOfferNo + "-R" + RevisedOfferNo;
						var ContinuedOfferNo = 0;
					}

				}

				//display the new offer id that will be created (don't set as selected yet?)
				Services.getFastAppDataModel().setProperty("/SelectedOfferID", sOfferID);

			}

			oOfferSaveInfo.OfferID = sOfferID;

			//Fill all data needed for the save of the new product for the offer
			oOfferSaveInfo.TenderID = Services.getSelectedTenderID();
			oOfferSaveInfo.CountryCode = that._country;
			oOfferSaveInfo.TenderOfferNo = TenderOfferNo;
			oOfferSaveInfo.RevisedOfferNo = RevisedOfferNo;
			oOfferSaveInfo.ActiveOffer = "1"; //Tenderoffer count for active record

			//Creation Date
			oOfferSaveInfo.CreationDate = moment().utc().toDate(); //Formatter.saveDateTime(Services.getDateToday());

			oOfferSaveInfo.SubmissionDate = null;
			oOfferSaveInfo.SubmittedOn = moment().utc().toDate();
			oOfferSaveInfo.SubmittedBy = UserInfo.getCWID();
			oOfferSaveInfo.Active = 1;

			//get the distributorID
			oOfferSaveInfo.DistributorID = Services.getSelectedDistributorID();

			// oOfferSaveInfo.InternalBidDueDate = moment(Formatter.saveDateTime(that.byId("idintrDueDte").getValue())).utc().toDate(); //Formatter.saveDateTime(that.byId("idintrDueDte").getValue());
			oOfferSaveInfo.InternalBidDueDate = oFastAppDataModel.getProperty("/EditOffer/InternalBidDueDate");
			oOfferSaveInfo.SellingCompany = that.byId("idSellingCompany").getSelectedKey(); //NILS_CHECK:that.byId("idSellingCompany").getValue();

			oOfferSaveInfo.ProductCount = "3"; //No. of products in product table
           //EHQUT-INC16393796-Offer creation - issue with delete material function
           if(that._country=='IT'){
            oOfferSaveInfo.Currency = oFastAppDataModel.getProperty("/CurrencyTEMP");
             }
            else{
            oOfferSaveInfo.Currency = oFastAppDataModel.getProperty("/EditOffer/Currency");
            }
          //EHQUT-INC16393796-Offer creation - issue with delete material function
			
			oOfferSaveInfo.ManualSaveStatus = "Yes";
			oOfferSaveInfo.WholesaleOffer = that.byId("idWhleSle").getSelectedItem().getKey();
			//oOfferSaveInfo.Comment = that.byId("idComment").getValue();
			oOfferSaveInfo.OfferRevisionSplitNo = "0";
			
			if(oOffer){
				oOfferSaveInfo.FOCType = oOffer.FOCType;
				oOfferSaveInfo.DEFAULT_FOC_ABS_PCT = oOffer.DEFAULT_FOC_ABS_PCT;
			}else{
				oOfferSaveInfo.FOCType = "";
				oOfferSaveInfo.DEFAULT_FOC_ABS_PCT = "";
                if(this._country === "ES"){
                    oOfferSaveInfo.ProfitabilityStartMnth = 1;
                    oOfferSaveInfo.ProfitabilityAgrDur = 5;
                    oOfferSaveInfo.ProfitabilityYrlyMntCost = 1200;
                    oOfferSaveInfo.ProfitabilityDiscRate = 0.05;
                    oOfferSaveInfo.ProfitabilityGrowthRate = 0.05;
                }
			}
			
			if (!Services.getNewOfferPressed() && (Services.getContinuedOfferPressed() || Services.getReviewedOfferPressed() || Number(
					oFastAppDataModel.getProperty("/EditOffer/RevisedOfferNo")) !== 0 || Number(oFastAppDataModel.getProperty(
					"/EditOffer/ContinuationOfferNo") !== 0))) {

				oOfferSaveInfo.NewOfferDueDate = oFastAppDataModel.getProperty("/EditOffer/NewOfferDueDate");

			} else {
				oOfferSaveInfo.NewOfferDueDate = moment().utc().toDate(); //Formatter.saveDateTime(Services.getDateToday());
			}
			oOfferSaveInfo.ContinuationOfferNo = ContinuedOfferNo;
			oOfferSaveInfo.APPROVALS_SENT = 0;

			/* 01/08/2021 - Division */
			oOfferSaveInfo.Division = that._country === "ES" ? that.getView().byId("idProductOfferDivisionES").getSelectedKey() : that.getView().byId("idProductOfferDivision").getSelectedKey();

			/* 13/02/2020 - Offer products check on internal due date */
			if (oFastAppDataModel.oData.Tender.BidDueDate != null) {
				var bidDueDate = oFastAppDataModel.oData.Tender.BidDueDate;
			}

			//are we in Continued or Revised offer (edit or creation) yes/no
			var bContinuedOrRevised = !Services.getNewOfferPressed() && (
				Services.getContinuedOfferPressed() || Services.getReviewedOfferPressed() || oFastAppDataModel.getProperty(
					"/EditOffer/RevisedOfferNo") !== 0 || oFastAppDataModel.getProperty("/EditOffer/ContinuationOfferNo") !== 0
			);

			//check if we are in Revised/Continued offer or we are creating a new offer
			if (bContinuedOrRevised) {
				//revised offer or continued offer (creation modus or edit modus)
				var checkDueDate = oOfferSaveInfo.NewOfferDueDate;
			} else {
				//creating a new offer or changing an existing offer that is not revised or continued
				var checkDueDate = bidDueDate;
			}

			//check if internal date is not after due date
			if (moment(oOfferSaveInfo.InternalBidDueDate).isAfter(checkDueDate)) {
				sap.m.MessageBox.error(
					"Internal due date can not be after offer due date. Or in case of Reviewed, continued offer, after new offer due date");
				return true;
			}

			//keep Offer info, that will be saved later on.
			Services.setOfferSaveInfo(oOfferSaveInfo);

			//bind to form
			return false;
		},

		//if a product is selected in the product input list
		onSelectionChangeProductListInput: function (oEvt) {

			var oList = oEvt.getSource();
			var oLabel = sap.ui.getCore().byId("idFilterLabelInput");
			var oInfoToolbar = sap.ui.getCore().byId("idInfoToolbarInput");

			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			var aContexts = oList.getSelectedContexts(true);

			// update UI
			var bSelected = (aContexts && aContexts.length > 0);
			var sText = (bSelected) ? aContexts.length + " selected" : null;
			oInfoToolbar.setVisible(bSelected);
			oLabel.setText(sText);

		},

		//if a product is selected in the product input list
		onSelectionChangeProductListOutput: function (oEvt) {

			var oList = oEvt.getSource();
			var oLabel = sap.ui.getCore().byId("idFilterLabelOutput");
			var oInfoToolbar = sap.ui.getCore().byId("idInfoToolbarOutput");
			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			var aContexts = oList.getSelectedContexts(true);

			// update UI
			var bSelected = (aContexts && aContexts.length > 0);
			var sText = (bSelected) ? aContexts.length + " selected" : null;
			oInfoToolbar.setVisible(bSelected);
			oLabel.setText(sText);

		},

		//Add product to output list
		onPressAddProductToOutputList: async function (oEvent) {
			//EHQUT-RITM12706398-SEWA Change Request
			//get input & output list for products
			var that = this;
			var oListInput = sap.ui.getCore().byId("idListProductsInput");
			var oListOutput = sap.ui.getCore().byId("idListProductsOutput");
			var oFastAppDataModel = Services.getFastAppDataModel();
			var sPathProducts = "/EditOffer/Product/results/";
			var Regionname=oFastAppDataModel.oData.EditTender.Country.Region;
			var aProducts = oFastAppDataModel.getProperty(sPathProducts);
			var bExisting = false;
			var oInfoToolbar = sap.ui.getCore().byId("idInfoToolbarInput");
			//var oButtonAddSelected = sap.ui.getCore().byId("idAddProductsBtn");

			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			var aContexts = oListInput.getSelectedContexts(true);

			//In edit mode, the offer is available, so we should take that offerID to do the saving
			if (Services.getEditPressed()) {
				var sOfferID = Services.getSelectedOfferID();
			} else {
				//When the offer is not yet available/existing in the database: create the offer ID
				var sNextOfferID = Services.getLoadedNextOfferID();
				//TenderID
				var sTenderID = that.getView().byId("tenderId").getText();
				//Selling company
				var sSellingCompanyID = that.byId("idSellingCompany").getSelectedKey(); //NILS_CHECK: that.byId("idSellingCompany").getValue();
				//Product ID 
				if ((!Services.getReviewedOfferPressed() && !Services.getContinuedOfferPressed()) || Services.getClonePressed()) {
					var sOfferID = sTenderID + "-" + sNextOfferID;
				} else {
					var TenderOfferNo = Services.getSelectedTenderOfferNo();
					if (Services.getContinuedOfferPressed()) {
						var ContinuedOfferNo = Services.getNextContinuedOfferNo();
						var sOfferID = sTenderID + "-" + TenderOfferNo + "-C" + ContinuedOfferNo;
					}
					if (Services.getReviewedOfferPressed()) {
						var RevisedOfferNo = Services.getNextRevisedOfferNo();
						var sOfferID = sTenderID + "-" + TenderOfferNo + "-R" + RevisedOfferNo;
					}
				}
			}

			//loop over the selected products from input list
			//aContexts.forEach(async function (oContext, index) {

			for(const oContext of aContexts){
				//first selected product
				var oProduct = oFastAppDataModel.getProperty(oContext.sPath);

				//Are there already products added? if yes we should check if this is not a double
				if (aProducts) {
                    if(Services.getSelectedCountry() === 'BR'){
                        var iIndex = aProducts.findIndex(x => x.ProductCode === oProduct.PRODUCT_ID && x.LotID === Number(that.getView().byId("idSelectLot").getSelectedKey()));
                    } else {
                        iIndex = aProducts.findIndex(x => x.ProductCode === oProduct.PRODUCT_ID);
                    }
					if (iIndex === -1) {
						//not found
						bExisting = false;
					} else {
						bExisting = true;
					}
				} else {
					//no products yet
					aProducts = [];
					bExisting = false;
				}

				//product can only be added once
				if (bExisting) {

					//product already exists
					sap.m.MessageBox.error("Product(" + oProduct.PRODUCT_NAME + ") is already added.");

				} else {

					//make an empty array to add the product
					var oAddProduct = {};

					//filling the data available
					//EHQUT-RITM12706398-SEWA Change Request
					oAddProduct.TenderID = Services.getSelectedTenderID(); //that.getView().byId("tenderId").getProperty("text");
					oAddProduct.OfferID = sOfferID;
					oAddProduct.CountryCode = oProduct.COUNTRY_CODE;
					oAddProduct.SubmittedOn = moment().utc().toDate();
					oAddProduct.SubmittedBy = UserInfo.getCWID();
					oAddProduct.Active = 1;
					oAddProduct.ProductCode = oProduct.PRODUCT_ID;
					oAddProduct.Reference = "";
					oAddProduct.Channel = "";
					oAddProduct.AlternateOfferYN = "No";
					oAddProduct.RequestedVolume = "";
					oAddProduct.UnitPerPack = "Unit";
					oAddProduct.SampleYN = "No";
					oAddProduct.SampleQuantity = 0;
					oAddProduct.DocumentsRequired = "No";
					oAddProduct.FirstShipment = Regionname ==='SEWA' ? "14 days from receipt of order" : "";
					oAddProduct.NoofLots = "";
					oAddProduct.IntervalBetweenShipments = "";
					oAddProduct.NoOfTier = 0;
					oAddProduct.DiscOrOffer = "";
					oAddProduct.PaymentTerms = oProduct.PAYMENT_TERMS;
					oAddProduct.DistributorID = oProduct.DISTRIBUTOR_ID;
					oAddProduct.SNo = 0;
					oAddProduct.ActiveProduct = 1;
					oAddProduct.Comment = "";
					oAddProduct.INCOTerms = oProduct.INCO_TERMS;
					oAddProduct.PricingPolicyCluster = oProduct.COUNTRY_CODE === 'CL' ? "Without Comodatos" : "";
					oAddProduct.MinInvoiceAmount = "";
					oAddProduct.DeliveryConditions = "";
					oAddProduct.SKUS = oProduct.SKUS;
                    oAddProduct.LotID = oProduct.COUNTRY_CODE === 'BR' ? Number(that.byId('idSelectLot').getSelectedKey()) : 1;
					
					oAddProduct.SKU = {
						PRODUCTPACKNAME: oProduct.PRODUCT_NAME,
						MoleculeName: oProduct.MoleculeName
					};

					// To make this code work on the nodejs layer, we need to expand on SKUCountry in 'READ', 'InstituteDistributorBrandProduct'
					oAddProduct.SKUCountry = {
						GOV_CODE: undefined,
						CODE1: undefined,
						CODE2: undefined
					};

					if (aProducts && aProducts.length) {
						oAddProduct.SORTER = aProducts.length; //added as last in the list
					} else {
						oAddProduct.SORTER = 0; //first product
					}
					oAddProduct.DEFAULT_COMMISSION_RATE = oProduct.COMMISSION_RATE; //default comission rate
					oAddProduct._sOperation = 'POST';

					//get possible price agreement
					let otherPriceAgreementOfferId = "";
					let otherPriceAgreementTenderClassification = "";
                    let agreementExists = false;
                    let oTomorrowsDate = new Date();
                    oTomorrowsDate.setDate(oTomorrowsDate.getDate() + 1);

					let oPriceAgreements = await Services.getProductPriceAgreement(oProduct.COUNTRY_CODE, oProduct.PRODUCT_ID);
                    let aPriceAgreements = oPriceAgreements?.data?.results;
                    aPriceAgreements = aPriceAgreements.filter(priceAgreement => priceAgreement.ExpiryDate && priceAgreement.ExpiryDate.toISOString() > oTomorrowsDate.toISOString());

                    for (let i = 0; i < aPriceAgreements.length; i++) {
                        let candidates = aPriceAgreements[i].Candidates?.results;
                        if(candidates.find(candidate => candidate.CandidateID === oFastAppDataModel.getProperty('/Tender/Institute/InstituteID'))){
                            agreementExists = true; 
							otherPriceAgreementOfferId = aPriceAgreements[i].OfferId; 
							otherPriceAgreementTenderClassification = aPriceAgreements[i].Tender?.Classification;
                            break;
                        } 
                    }

					oAddProduct.OtherPriceAgreementsExist = aPriceAgreements.length > 0 && agreementExists ? 'Yes' : 'No';
					oAddProduct.OtherPriceAgreementOfferId = otherPriceAgreementOfferId;
					oAddProduct.OtherPriceAgreementTenderClassification = otherPriceAgreementTenderClassification;

					aProducts.push(oAddProduct);

					//Adding the product to be saved later on + added to FastDataModel for binding
					//We use POST to indicate that the product does not exist yet in the database
					//Services.addProductsSaveInfo(oAddProduct, "POST");

					//table binding with the seleced offer
					Services.addNewProductToFastAppDataModel();

				}

			};

			//sort
			aProducts = Services.sortByKeyAsc(aProducts, "ApproverTypeSection");

			//add to binding
			oFastAppDataModel.setProperty(sPathProducts, aProducts);

			//no selection anymore
			oListInput.removeSelections();
			oListOutput.removeSelections();
			oInfoToolbar.setVisible(false);
			//oButtonAddSelected.setEnabled(true);
			this.setScrollProductsOutputContainter();
		},

		onNavToPa: function (oEvent){
			const oFastAppDataModel = Services.getFastAppDataModel();
			const sSelectedRow = oEvent.getSource().getBindingContext('fastAppData').getPath();
			const oProduct = oFastAppDataModel.getProperty(sSelectedRow);

			if(oProduct){
				window.open("/app/#/priceagreements&/pa/PriceAgreements/" + oProduct.ExistingPriceAgreementId);
			}

		},

		//Remove product from output list
		onPressRemoveProductFromOutputList: function (oEvent) {

			var oList = sap.ui.getCore().byId("idListProductsOutput");
			var oInfoToolbar = sap.ui.getCore().byId("idInfoToolbarOutput");
			var oFastAppDataModel = Services.getFastAppDataModel();
			var sPathProducts = "/EditOffer/Product/results/";
			var aProducts = oFastAppDataModel.getProperty(sPathProducts);
			//var oButtonAddSelected = sap.ui.getCore().byId("idAddProductsBtn");
			var aProductsToRemove = [];
			var oProductToRemove = {};

			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			var aContexts = oList.getSelectedContexts(true);

			aContexts.forEach(function (oContext, index) {

				//get selected product
				var oProduct = oFastAppDataModel.getProperty(oContext.sPath);

				//remove it from the products
				aProducts.splice(aProducts.indexOf(oProduct), 1);

				//if s_operation is PUT, the product is already existing in back-end
				oProductToRemove = {};
				oProductToRemove.ProductCode = oProduct.ProductCode;
				aProductsToRemove.push(oProductToRemove);

			});

			//remove from binding model
			oFastAppDataModel.setProperty(sPathProducts, aProducts);

			//remove products to be saved
			Services.removeProductsSaveInfo(aProductsToRemove);

			//no selection anymore
			//oList.removeSelections();
			oInfoToolbar.setVisible(false);
			this.setScrollProductsOutputContainter();
		},

		onSelectionChangeProcurementMethod: function(oEvent){
			let oProcurementReason = this.byId("idProcurementReasonEdit");
			if(this.byId("idSelectProcurementMethodEdit").getSelectedKey() === 'Other'){
				oProcurementReason.setVisible(true);
			} else {
				oProcurementReason.setVisible(false);
			}
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
			var oListOutput = sap.ui.getCore().byId("idListProductsOutput");
			Ranking.getSelectedItemContext(oListOutput, function (oSelectedItemContext, iSelectedItemIndex) {
				var iSiblingItemIndex = iSelectedItemIndex + (sDirection === "Up" ? -1 : 1);
				var oSiblingItem = oListOutput.getItems()[iSiblingItemIndex];
				var oSiblingItemContext = oSiblingItem.getBindingContext("fastAppData");
				if (!oSiblingItemContext) {
					return;
				}

				// swap the selected and the siblings rank
				var oProductsModel = oListOutput.getModel("fastAppData");
				var iSiblingItemRank = oSiblingItemContext.getProperty("SORTER");
				var iSelectedItemRank = oSelectedItemContext.getProperty("SORTER");

				oProductsModel.setProperty("SORTER", iSiblingItemRank, oSelectedItemContext);
				oProductsModel.setProperty("SORTER", iSelectedItemRank, oSiblingItemContext);

				//sort again by refresh items binding
				oListOutput.getBinding("items").refresh(true);

				// after move select the sibling
				oListOutput.getItems()[iSiblingItemIndex].setSelected(true);
			});
		},

		//Select Brand: when you click on the F4 for Brands on adding a product to the offer of the tender
		brandNameList_f4: function () {

			//that is this
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//selection
			var sInstituteID = Services.getInstituteIDofSelectedTender(); //INSTITUTE_ID
			var sCountryCode = Services.getCountryCodeofSelectedTender(); //COUNTRY_CODE
			var sDistributorID = Services.getSelectedDistributorID(); //DISTRIBUTOR_ID
			var sTenderChannel = Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');
			var sLegalEntity = Services.getFastAppDataModel().getProperty("/EditOffer/SellingCompany");
			var aCommercialAgreement = Services.getFastAppDataModel().getProperty('/Tender/CommercialAgreement');
			var sOfferDivision = Services.getFastAppDataModel().getProperty("/EditOffer/Division");
			var aBrandTokens = [];
			that.aBrandProducts = [];

			//Check if distributor is selected						
			if (sDistributorID) {

				//load the corresponding products for the input list
				$.when(Services.loadBrandProductNameList(sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sLegalEntity,
					aCommercialAgreement, aBrandTokens, sOfferDivision)).done(function (oData) {

					//check if results are found
					if (oData && oData.results.length > 0) {

						//keep brand products
						that.aBrandProducts = oData.results;

						//only keep unique brands... this way we also know there are valid products underneath these...
						var aUniqueBrands = Array.from(new Set(oData.results.map(x => x.BRAND_ID)))
							.map(BRAND_ID => {
								return {
									BRAND_ID: BRAND_ID,
									BRAND_NAME: oData.results.find(x => x.BRAND_ID === BRAND_ID).BRAND_NAME
								};
							});

						//for binding stateModel
						var oBrandResults = {
							results: aUniqueBrands
						};

						//binding statemodel to value help popup
						var stateModel = new sap.ui.model.json.JSONModel();
						stateModel.setData(oBrandResults);
						if (!that._valueHelpSelectBrandDialog) {
							that._valueHelpSelectBrandDialog = new sap.m.SelectDialog({
								title: bundle.getText("brandnme"),
								multiSelect: true,
								rememberSelections: true,
								items: {
									path: "/results",
									template: new sap.m.StandardListItem({
										title: "{BRAND_NAME}",
										description: "{BRAND_ID}",
										//active: true
									})
								},
								liveChange: function (oEvent) {
									var sValue = oEvent.getParameter("value");
									var oFilters = [];
									oFilters.push(new sap.ui.model.Filter("BRAND_NAME", sap.ui.model.FilterOperator.Contains, sValue));
									oFilters.push(new sap.ui.model.Filter("BRAND_ID", sap.ui.model.FilterOperator.Contains, sValue));
									oEvent.getSource().getBinding("items").filter(new sap.ui.model.Filter(oFilters, false));
								},
								confirm: function (oEvent) {
									that._handleCloseBrandNameList(oEvent);
								},
								cancel: function (oEvent) {
									that._handleCloseBrandNameList(oEvent);
								}
							});
						}

						that._valueHelpSelectBrandDialog.setModel(stateModel);
						that._valueHelpSelectBrandDialog.open();

					} else {
						MessageToast.show("There are no brands to display.");
					}

				});

			} else {
				sap.m.MessageBox.show("Select Distributor name first!", sap.m.MessageBox.Icon.ERROR);
			}

		},

		_handleCloseBrandNameList: function (oEvent) {

			//general
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//no selection anymore
			sap.ui.getCore().byId("idInfoToolbarInput").setVisible(false);
			var oListInput = sap.ui.getCore().byId("idListProductsInput");
			oListInput.removeSelections();

			//selected brands
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {

				MessageToast.show("The following brands where selected: " + aContexts.map(function (oContext) {
					return oContext.getObject().BRAND_NAME;
				}).join(", "));

				//get multi input box
				var oBrandList = sap.ui.getCore().byId("idBrandList");
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

				//Filter brand products to find only the products of the selected brand
				const aFilteredBrandProducts = that.aBrandProducts.filter(
					(elem) => aBrands.find(({
						BRAND_ID
					}) => elem.BRAND_ID === BRAND_ID)
				);

				//load the corresponding products for the input list based on selected brands
				//$.when(Services.loadBrandProductNameList(sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sLegalEntity, aCommercialAgreement, aBrandTokens)).done(function(oData){
				//loaded
				//path where the products should be stored
				var sPathProductCollection = "/ProductCollection";

				//path is updated with the products
				oFastAppDataModel.setProperty(sPathProductCollection, aFilteredBrandProducts);
				//});

			} else {

				MessageToast.show("No new item was selected.");

			}
			oEvent.getSource().getBinding("items").filter([]);
			this.setScrollProductsInputContainter();
		},
		setScrollProductsInputContainter:function(){
			const fastAppDataModel = Services.getFastAppDataModel();
			const productsInput = fastAppDataModel.getProperty("/ProductCollection");
			const mercadoInProductsMessage = fastAppDataModel.getProperty("/MercadoInProductsMessage");
			const inputItemsHeight = productsInput.length * 67;
			const dialogContentHeight = this._oDialog.getContent()[0].getDomRef().offsetHeight;
			let parentHeight = dialogContentHeight - 49 - 65; //todo: add check for message of MercadoInProductsMessage
			if(mercadoInProductsMessage !== ''){
				parentHeight -= 65;
			}
			sap.ui.getCore().byId("idListProductsInputContainer").removeStyleClass("listInDialogWithTwoMessages");
			sap.ui.getCore().byId("idListProductsInputContainer").removeStyleClass("listInDialogWithMessage");
			if(inputItemsHeight>=parentHeight){
				if(mercadoInProductsMessage === ''){
					sap.ui.getCore().byId("idListProductsInputContainer").addStyleClass("listInDialogWithMessage");
				}else{
					sap.ui.getCore().byId("idListProductsInputContainer").addStyleClass("listInDialogWithTwoMessages");
				}
			}
			// sap.ui.getCore().byId("idListProductsInputContainer").addStyleClass("listInDialogWithMessage");
			// sap.ui.getCore().byId("idListProductsOutputContainer").addStyleClass("listInDialogWithMessage");
		},
		setScrollProductsOutputContainter:function(){
			const fastAppDataModel = Services.getFastAppDataModel();
			const productsOuput = fastAppDataModel.getProperty("/EditOffer/Product/results/");
			const mercadoInProductsMessage = fastAppDataModel.getProperty("/MercadoInProductsMessage");
			const outputItemsHeight = productsOuput.length * 67;
			const dialogContentHeight = this._oDialog.getContent()[0].getDomRef().offsetHeight;
			let parentHeight = dialogContentHeight - 49 - 65; //todo: add check for message of MercadoInProductsMessage
			if(mercadoInProductsMessage !== ''){
				parentHeight -= 65;
			}
			sap.ui.getCore().byId("idListProductsOutputContainer").removeStyleClass("listInDialogWithTwoMessages");
			sap.ui.getCore().byId("idListProductsOutputContainer").removeStyleClass("listInDialogWithMessage");
			if(outputItemsHeight>=parentHeight){
				if(mercadoInProductsMessage === ''){
					sap.ui.getCore().byId("idListProductsOutputContainer").addStyleClass("listInDialogWithMessage");
				}else{
					sap.ui.getCore().byId("idListProductsOutputContainer").addStyleClass("listInDialogWithTwoMessages");
				}
			}
			// sap.ui.getCore().byId("idListProductsInputContainer").addStyleClass("listInDialogWithMessage");
			// sap.ui.getCore().byId("idListProductsOutputContainer").addStyleClass("listInDialogWithMessage");
		},
		onSearchProductsInput: function(event){
			// const fastAppDataModel = Services.getFastAppDataModel();
			// const pathProductCollection = "/ProductCollection";
			const searchValue = event.getParameter("newValue");
			const binding = sap.ui.getCore().byId("idListProductsInput").getBinding("items");
			const filters = ['PRODUCT_NAME','SKUS'].map(filterPath => new Filter({
				path:filterPath,
				operator:FilterOperator.Contains,
				value1: searchValue
			}));
			binding.filter(new Filter({
				filters: filters,
				and:false
			}));
		},
		//When the user is adding or removing a token
		onBrandTokenChange: function (oEvent) {

			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//get multi input box
			var oBrandList = sap.ui.getCore().byId("idBrandList");
			var oDefaultModel = Services.getDefaultModel();

			//Brands already existing in the multi input field
			that._aBrandTokens = oBrandList.getTokens();

			//added brands
			if (oEvent.getParameter('type') === Tokenizer.TokenUpdateType.Added) {
				var aBrandsAdded = oEvent.getParameter("addedTokens");
				aBrandsAdded.forEach(function (iIndex, oBrandToken) {
					that._aBrandTokens.push(oBrandToken);
				});
			}

			//removed brands
			if (oEvent.getParameter('type') === Tokenizer.TokenUpdateType.Removed) {
				var aBrandsRemoved = oEvent.getParameter("removedTokens");
				aBrandsRemoved.forEach(function (oRemovedBrandToken, iIndex) {
					that._aBrandTokens = $.grep(that._aBrandTokens, function (oBrandToken) {
						return oBrandToken.getProperty("key") != oRemovedBrandToken.getProperty("key");
					});
				});
			}

			//load the corresponding products for the input list
			var sInstituteID = Services.getInstituteIDofSelectedTender(); //INSTITUTE_ID
			var sCountryCode = Services.getCountryCodeofSelectedTender(); //COUNTRY_CODE
			var sDistributorID = Services.getSelectedDistributorID(); //DISTRIBUTOR_ID
			var oProductInputList = sap.ui.getCore().byId("idListProductsInput");
			var sTenderChannel = Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');
			var sLegalEntity = Services.getFastAppDataModel().getProperty("/EditOffer/SellingCompany");
			var aCommercialAgreement = Services.getFastAppDataModel().getProperty('/Tender/CommercialAgreement');
			var sOfferDivision = Services.getFastAppDataModel().getProperty("/EditOffer/Division");

			//load products for list
			if (that._aBrandTokens && that._aBrandTokens.length > 0) {
				$.when(Services.loadBrandProductNameList(sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sLegalEntity,
					aCommercialAgreement, that._aBrandTokens, sOfferDivision)).done(function (oData) {
					//loaded products

					//path where the products should be stored
					var sPathProductCollection = "/ProductCollection";

					//path is updated with the products
					oFastAppDataModel.setProperty(sPathProductCollection, oData.results);

					oProductInputList.getBinding("items").refresh(true);
					that.setScrollProductsInputContainter();
				});
			} else {
				//path for clearing
				var sPathProductCollection = "/ProductCollection";

				var aEmpty = [];

				//path is updated with the products
				oFastAppDataModel.setProperty(sPathProductCollection, aEmpty);

				//refresh empty list
				oProductInputList.getBinding("items").refresh(true);
				this.setScrollProductsInputContainter();
			}
		},

		InstituteName_f4: function (oEvent) {
            this.getView().setBusy(true);
			var model_f4 = this.getView().getModel("fastData");
			var sPath = "/PT_TMINST";
			var data;
			var aFilters = [];
			const regionMCB = this.getView().byId("idRegionEdit");
			const instituteType = this.byId("idInstituteType").getProperty("selectedKey");

			aFilters.push(new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, this._country),
				new sap.ui.model.Filter("InstituteType", sap.ui.model.FilterOperator.EQ, instituteType)
			);
			var that = this;
			model_f4.read(sPath, {
				filters: aFilters,
				success: function (OData, oResponse) {
					data = OData;
					var stateModel = new sap.ui.model.json.JSONModel();

					//sort on institute name
					data.results = Services.sortByKeyAsc(data.results, "InstituteName");
					//convert customer id to string to enable contains filter
					data.results = data.results.map(item=>{
						item.CustomerID = item.CustomerID.toString();
						return item;
					});

					stateModel.setData(data);
					that.valueHelpBasicInsSlctDialog = new sap.m.SelectDialog({
						title: bundle.getText("institnme"),
						multiSelect: false,
						items: {
							path: "/results",
							template: new sap.m.StandardListItem({
								title: "{InstituteName}",
								info:"{= ${CustomerID} && ${CustomerID}!=='0'?${CustomerID}:''}",
								//description: "{InstituteID}",
								//active: true,
								//beceause we no longer have the selected instituteID visible, we keep it in the customData of the list item
								customData: new sap.ui.core.CustomData({
									key: "InstituteID",
									value: "{InstituteID}"
								})
							})
						},
						liveChange: function (oEvent) {
							var sValue = oEvent.getParameter("value");
							var oFilters = [new sap.ui.model.Filter([
												new sap.ui.model.Filter("InstituteName", sap.ui.model.FilterOperator.Contains, sValue),
												new sap.ui.model.Filter("CustomerID", sap.ui.model.FilterOperator.Contains, sValue)],
											false)];
							oEvent.getSource().getBinding("items").filter(oFilters);
						},
						confirm: handleCloseInstituteName,
						// cancel: handleCloseInstituteName
					});
					that.valueHelpBasicInsSlctDialog.setModel(stateModel);
					that.valueHelpBasicInsSlctDialog.open();
                    that.getView().setBusy(false);

				},
				error: function (oError) {
                    that.getView().setBusy(false);
					Services.showErrorMessage(oError, "Institute loading");
				}
			});
			var handleCloseInstituteName = async function (oEvent) {
				var oSelectedItem = oEvent.getParameter("selectedItem");
                const oFastAppDataModel = Services.getFastAppDataModel();
                const event = oEvent.getSource();
				if (oSelectedItem) {
					const regionId = oEvent.getParameter("selectedContexts")[0].getObject().RegionID;
					that.byId("idInstituteName").setValue(oSelectedItem.getTitle());
					//that.byId("idInstituteID").setValue(oSelectedItem.getDescription());
					//that.getView().byId("idhdrInstID").setText(oSelectedItem.getDescription());
					var sSelectedInstituteID = oSelectedItem.data("InstituteID");
                    let oInstitute = await Services.loadInstitute(Services.getSelectedCountry(), sSelectedInstituteID, true);
                    
					that.byId("idInstituteID").setValue(sSelectedInstituteID);
                    that.byId("idInstituteCifCode").setValue(oInstitute.CifCode);
                    that.byId("idRegionalHealthSystem").setValue(oInstitute.RegionalHealthSystem);
                    that.byId("idInstitutePoblacion").setValue(oInstitute.City);
                    that.byId("idInstituteCode").setValue(oInstitute.CustomerID);
                    that.byId("idInstituteProvince").setValue(oInstitute.Province?.Name);
					that.getView().byId("idhdrInstID").setText(sSelectedInstituteID);

					//should group purchasing be visible on the screen based on data back-end
					var sCountry = Services.getSelectedCountry();

					// for Italy only the Regions must be set
					if((sCountry === 'IT' || sCountry === 'ES') && instituteType === "Region(s)"){
						setTenderRegion(regionId);
					}


					$.when(Services.checkInstituteChilderen(sCountry, sSelectedInstituteID)).done(function (bShowGroupPurchasing) { 
						if (bShowGroupPurchasing === false) {
							//default no =  0
							that.getView().byId("idGroupPurchasingEdit").setSelectedKey(0);
						}
						that.getView().byId("idGroupPurchasingEdit").setVisible(bShowGroupPurchasing);
					});

					//should tender channel be defaulted/forced on distributor?
					$.when(Services.checkTenderChannelOnDistributor(sCountry, sSelectedInstituteID)).done(function (bTenderChannelOnDistributor) {
						//default on Distributor / Direct for Chile
						if(Services.getSelectedCountry() === 'CL'){
							that.getView().byId("idTenderChannel").setSelectedKey("Direct");
							that.getView().byId("idTenderChannel").setEnabled(false);
						} else {
							if (bTenderChannelOnDistributor) {
								that.getView().byId("idTenderChannel").setSelectedKey("Distributor");
								that.getView().byId("idTenderChannel").setEnabled(false);
							} else {
								that.getView().byId("idTenderChannel").setEnabled(true);
							}
						}
					});
                    // oFastAppDataModel.refresh(true); // this is causing issues and hinding the Regions field
				}
				// event.getBinding("items").filter([]); // is this needed ?
			};

			
			const setTenderRegion = function(regionId){
				regionMCB && regionMCB.setSelectedKeys([regionId]);
				// regionMCB.getSelectedItems()[0].setEnabled(false); // the UI5 API has changed and thus setEnabled does not provided the required result
			}

		},

		//ProductOfferEdit fragment: Value help for Distriubtor name 
		onChangeDistributor: function (oEvent) {
			var oFastAppDataModel = Services.getFastAppDataModel();

			if (oFastAppDataModel.getProperty("/EditOffer/Product/results/length") >= 1) {
				var that = this;

				sap.m.MessageBox.warning("Are you sure you want to change the Distributor? Existing products will be removed.", {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					styleClass: "sapUiSizeCompact",
					onClose: function (sAction) {
						if (sAction === "YES") {
							var oTableProducts = that.byId("editofferProductId");
							oTableProducts.selectAll();
							that.onDeleteProductForOffer();
							Services.setSelectedDistributorID(that.getView().byId("idDistributorName").getSelectedKey());
							Services.setPrevSelectedDistributorID(Services.getSelectedDistributorID());
							that.getView().byId("idDistributorName").setSelectedKey(Services.getSelectedDistributorID());
						} else {
							that.getView().byId("idDistributorName").setSelectedKey(Services.getPrevSelectedDistributorID());
						}
					}
				});
			} else {
				Services.setSelectedDistributorID(this.getView().byId("idDistributorName").getSelectedKey());
				Services.setPrevSelectedDistributorID(Services.getSelectedDistributorID());
			}
		},

		//ProductOfferEdit fragment: Value help for Division
		onChangeDivision: function (oEvent) {
            
			var oFastAppDataModel = Services.getFastAppDataModel();
            var that = this;
            let oDivisionSelect = that._country === "ES" ? that.getView().byId("idProductOfferDivisionES") : that.getView().byId("idProductOfferDivision");
			if (oFastAppDataModel.getProperty("/EditOffer/Product/results/length") >= 1) {
				sap.m.MessageBox.warning("Are you sure you want to change the Division? Existing products will be removed.", {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					styleClass: "sapUiSizeCompact",
					onClose: function (sAction) {
						if (sAction === "YES") {
							var oTableProducts = that.byId("editofferProductId");
							if (that._country === "BR") oFastAppDataModel.setProperty("/bBrazilDivisionChanged", true);// If you change division it will remove all products from offer using this property. For Brazil
							oTableProducts.selectAll();
							that.onDeleteProductForOffer();
							Services.setSelectedDivisionID(oDivisionSelect.getSelectedKey());
							Services.setPrevSelectedDivisionID(Services.getSelectedDivisionID());
							oDivisionSelect.setSelectedKey(Services.getSelectedDivisionID());
						} else {
							oDivisionSelect.setSelectedKey(Services.getPrevSelectedDivisionID());
						}
					}
				});
			} else {
				Services.setSelectedDivisionID(oDivisionSelect.getSelectedKey());
				Services.setPrevSelectedDivisionID(Services.getSelectedDivisionID());
			}
		},

		//when selecting a new selling company
		onChangeSellingCompany: function (oEvent) {

			var oFastAppDataModel = Services.getFastAppDataModel();
			var that = this;
			var sCountryCode = Services.getCountryCodeofSelectedTender();
			var sInstituteId = Services.getInstituteIDofSelectedTender();
			var sChannel = Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');

			if (oFastAppDataModel.getProperty("/EditOffer/Product/results/length") >= 1) {

				sap.m.MessageBox.warning("Are you sure you want to change the Selling commpany? Existing products will be removed.", {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					styleClass: "sapUiSizeCompact",
					onClose: function (sAction) {
						if (sAction === "YES") {
							var oTableProducts = that.byId("editofferProductId");
							oTableProducts.selectAll();
							that.onDeleteProductForOffer();
							Services.setSelectedSellingCompanyID(that.getView().byId("idSellingCompany").getSelectedKey());
							Services.setPrevSelectedSellingCompanyID(Services.getSelectedSellingCompanyID());
							that.getView().byId("idSellingCompany").setSelectedKey(Services.getSelectedSellingCompanyID());
						} else {
							that.getView().byId("idSellingCompany").setSelectedKey(Services.getPrevSelectedSellingCompanyID());
						}
					}
				});
			} else {
				Services.setSelectedSellingCompanyID(this.getView().byId("idSellingCompany").getSelectedKey());
				Services.setPrevSelectedSellingCompanyID(Services.getSelectedSellingCompanyID());
			}

			//refresh binding & filter for distributor
			//TODO: refactoring
			var sSellingCompanyID = that.byId("idSellingCompany").getSelectedKey();
			Services.readInstituteDistributor(sCountryCode, sInstituteId, sChannel, sSellingCompanyID).then(function (oData) {
				if (oData && oData.results.length === 0) {
					that.getView().byId("idDistributorName").setSelectedKey("");
					oFastAppDataModel.setProperty("/EditOffer/DistributorID", "");
					//oFastAppDataModel.setProperty(Services.getLoadedOfferPath(Services.getSelectedOfferID()) + "/Distributor/DistributorName", "");
				} else {
					oFastAppDataModel.setProperty("/EditOffer/DistributorID", oData.results[0].DISTRIBUTOR_ID);
				}

				var aFilter = [];
				aFilter.push(new Filter("COUNTRY_CODE", FilterOperator.EQ, sCountryCode));
				aFilter.push(new Filter("INSTITUTE_ID", FilterOperator.EQ, sInstituteId));
				aFilter.push(new Filter("CHANNEL", FilterOperator.EQ, sChannel));
				aFilter.push(new Filter("LEGAL_ENTITY_CODE", FilterOperator.EQ, sSellingCompanyID));

				var oList = that.getView().byId("idDistributorName");
				var oBinding = oList.getBinding("items");
				oBinding.filter(aFilter);
				oList.setEnabled(true);
			});
		},

		onSlctSmYN: function (oEvent) {
			var oSlct = sap.ui.getCore().byId("idSampleYN").getSelectedItem().getText();
			if (oSlct === "Yes") {
				sap.ui.getCore().byId("idSampleQuantity").setEnabled(true);
			} else {
				sap.ui.getCore().byId("idSampleQuantity").setEnabled(false);
			}
		},

		//Show RequestedVolume		
		onPressShowRequestedVolume: function (oEvent) {
			var that = this;
			that.loadRequestedGroupPurchasingDialog(oEvent);
		},

		//Edit RequestedVolume
		onPressEditRequestedVolume: function (oEvent) {
			var that = this;
			that.loadRequestedGroupPurchasingDialog(oEvent);
		},

		//Called when showing & editing requested volume
		loadRequestedGroupPurchasingDialog: function (oEvent) {

			//general
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//are we in edit mode?
			var bEdit = Services.getEditMode();

			//on which product are we clicking
			var oRequestedVolumeCell = oEvent.getSource().getParent();
			var aRequestedVolumeCellItems = oRequestedVolumeCell.getItems();
			var oRequestedVolumeInput = aRequestedVolumeCellItems[0];

			//What is the currently selected Product info
			var oCurrentRow = oRequestedVolumeCell.getParent();
			var iIndexRow = oCurrentRow.getIndex();
			var sBindingPathProduct = oCurrentRow.getParent().getBinding().getPath() + iIndexRow + "/";
			var sOfferID = Services.getSelectedOfferID();

			if (bEdit) {
				//in edit mode we get the products from the edit offer
				var aProducts = oFastAppDataModel.getProperty("/EditOffer/Product/");
			} else {
				//in desplay mode we get the products from the loaded
				var aProducts = Services.getLoadedProductsForOffer(sOfferID);
			}

			//sorting
			Services.sortByKeyAsc(aProducts.results, "SORTER");

			//get current selected product
			var oSelectedProduct = aProducts.results[iIndexRow];

			//check if groupPurchasing is found for this product (new products don't have these)
			if (oSelectedProduct.GroupPurchasing && oSelectedProduct.GroupPurchasing.results) {
				var aAllGroupPurchasing = oSelectedProduct.GroupPurchasing.results;
			}

			//only bind the Group purchasing institutions who have a requeted amount
			var aRequestedGroupPurchasing = [];

			if (aAllGroupPurchasing && aAllGroupPurchasing.length > 0) {

				//loop at the results of the group purchasing
				aAllGroupPurchasing.forEach(function (oGroupPurchasing, iIndex) {

					//check if the group purchasing has a requested amount
					if (oGroupPurchasing.Requested && oGroupPurchasing.Requested > 0) {
						//keep
						aRequestedGroupPurchasing.push(oGroupPurchasing);
					}

				});
			}

			if (!bEdit && aRequestedGroupPurchasing.length === 0) {
				//no institutes exist with requested amounts, go to edit mode to add them
				sap.m.MessageToast.show("There are no requested amounts for institutes.");
				return;
			}

			//bind it to the display popup
			if (aRequestedGroupPurchasing && aRequestedGroupPurchasing.length >= 0) {

				//keep on fastappdata model
				oFastAppDataModel.setProperty("/RequestedGroupPurchasing", aRequestedGroupPurchasing);

				//if dialog exists destroy it first, so we always set dialog buttons in correct state
				if (that._oDialog) {
					that._oDialog.destroy();
				}

				//create the dialog again
				that._oDialog = new sap.m.Dialog("idShowDialogRequestedGroupPurchasingDisplay", {
					title: 'Requested Group Purchasing',
					buttons: [
						//if edit mode = true, this button is visible
						new sap.m.Button({
							text: bundle.getText("Confirm"),
							visible: bEdit,
							type: "Accept",
							tap: [that.onConfirmRequestedGroupPurchasing, that]

						}),
						//if edit mode = true, this button is visible
						new sap.m.Button({
							text: bundle.getText("Cancel"),
							visible: bEdit,
							type: "Reject",
							tap: [that.onCancelRequestedGroupPurchasing, that]
						}),
						//if edit mode = true, this button is visible
						new sap.m.Button({
							text: bundle.getText("Close"),
							visible: !bEdit,
							type: "Reject",
							tap: [that.onCloseRequestedGroupPurchasing, that]
						})
					],
					//content with all fields that need to be filled
					content: [sap.ui.xmlfragment("FAST_NS0FAST0.fragments.RequestedGroupPurchasing", that)]
				});

				//add custom data to dialog so if we add a new requested institute, we know for which product we are adding it
				that._oDialog.data("SelectedProduct", oSelectedProduct);

				//add original requested group purchasing, so we can go back to this version on canceling
				var aOriginalRequestedGroupPurchasing = $.extend(true, {}, aRequestedGroupPurchasing);
				that._oDialog.data("OriginalRequestedGroupPurchasing", aOriginalRequestedGroupPurchasing);

				//keep binding path of the selected product
				that._oDialog.data("SelectedProductPath", sBindingPathProduct);

				that.getView().addDependent(that._oDialog);
				that._oDialog.open();

			}

		},

		//closing requested group purchasing dialog
		onCloseRequestedGroupPurchasing: function (oEvent) {
			//close the dialog
			var that = this;
			that._oDialog.close();
		},

		//closing requested group purchasing dialog
		onCancelRequestedGroupPurchasing: function (oEvent) {

			//general
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//go back to original requested group purchasing
			var aRequestedGroupPurchasing = that._oDialog.data("OriginalRequestedGroupPurchasing");
			oFastAppDataModel.setProperty("/RequestedGroupPurchasing", aRequestedGroupPurchasing);

			//close dialog
			that._oDialog.close();

		},

		//when add institute is pressed on the requested group purchasing dialog
		onAddInstituteGroupPurchasing: function (oEvent) {

			//general
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			var sInstituteID = Number(sap.ui.getCore().byId("idInstituteRequestedGroupPurch").getSelectedKey());
			var sCountry = Services.getSelectedCountry();
			var oSelectedProduct = that._oDialog.data("SelectedProduct");

			//get requested group Purchasing
			var aRequestedGroupPurchasing = oFastAppDataModel.getProperty("/RequestedGroupPurchasing");

			//default it is an POST, new institute in database
			var sOperation = "POST";

			//check if institute already exist in requested group purchasing.
			var iIndex = aRequestedGroupPurchasing.findIndex(x => x.InstituteID === sInstituteID);

			//if institute already existing in group purchasing as an institute that was ready to be deleted from database
			//this user deleted the institute in pop-up & then added it again... we now need to change DELETE into PUT (update)
			if (iIndex !== -1 && aRequestedGroupPurchasing[iIndex]._sOperation === "DELETE") {

				sOperation = "PUT";

				//only grep institutes that is not the one we are trying to add (so actually remove selected institute from array)
				var aRequestedGroupPurchasing = $.grep(aRequestedGroupPurchasing, function (e) {
					return e.InstituteID != sInstituteID;
				});

				//say that index = -1 so that the institute is added again as a put
				iIndex = -1;

			}

			if (iIndex === -1) {

				//load name of institute (&other data which we not use at this point)
				var bWithChilderen = false;
				$.when(Services.loadInstitute(sCountry, sInstituteID, bWithChilderen)).done(function (oInstitute) {

					//check count results
					if (oInstitute) {

						var oRequestedGroupPurchasing = {
							TenderID: oSelectedProduct.TenderID,
							OfferID: oSelectedProduct.OfferID,
							RegionCode: "",
							CountryCode: sCountry,
							SubmittedOn: moment().utc().toDate(),
							SubmittedBy: UserInfo.getCWID(),
							Active: 1,
							ProductCode: oSelectedProduct.ProductCode,
							InstituteID: sInstituteID,
							Institute: oInstitute,
							DistributorID: oSelectedProduct.DistributorID,
							Requested: "",
							KeyForRestore: "",
							_sOperation: sOperation
						};

						//add to the binding
						aRequestedGroupPurchasing.push(oRequestedGroupPurchasing);
						oFastAppDataModel.setProperty("/RequestedGroupPurchasing", aRequestedGroupPurchasing);

					}

				});
			} else {

				//no institutes exist with requested amounts, go to edit mode to add them
				sap.m.MessageToast.show("This institute is already existing in the list.");

			}

		},

        //change selected lot brazil
        onChangeSelectedLot: function (oEvent) {
            const iSelectedLot = Number(oEvent.getSource().getSelectedKey());
            Services.getFastAppDataModel().setProperty('/SelectedLot', iSelectedLot);
            this.filterBySelectedLot(iSelectedLot);
        },

        filterBySelectedLot: function(iSelectedLot){
            //make sure we always have this as integer
            iSelectedLot = Number(iSelectedLot);
            const lotFilter = new Filter({
                path: 'LotID',
                value1: iSelectedLot,
                operator: sap.ui.model.FilterOperator.EQ
            });
            
            let oTable = !Services.getEditMode() ? this.byId("offerProductId") : this.byId("editofferProductId");
            oTable.getBinding("rows").filter(lotFilter);
        },

		//delete requested group purchasing
		onDeleteRequestedGroupPurchasing: function (oEvent) {

			//general
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//get path of item to be deleted
			var sPathSelectedRequest = oEvent.getParameter('listItem').getBindingContextPath();
			var iIndex = parseInt(sPathSelectedRequest.substring(sPathSelectedRequest.lastIndexOf('/') + 1));

			//delete item from list binding
			var aRequestedGroupPurchasing = oFastAppDataModel.getProperty("/RequestedGroupPurchasing");
			if (aRequestedGroupPurchasing[iIndex]._sOperation === "PUT") {
				//in this case the group purchasing for this institute already exists in the back-end tables
				//so we keep it but put it as DELETE operation
				aRequestedGroupPurchasing[iIndex]._sOperation = "DELETE";
			} else {
				//group purchasing for this institute does not exists in the back-end tables
				//so we can delete it without deleting it in back-end during save
				aRequestedGroupPurchasing.splice(iIndex, 1);
			}

			//change binding
			oFastAppDataModel.setProperty("/RequestedGroupPurchasing", aRequestedGroupPurchasing);

			//update bindings other wise filtering on DELETE is not applied for new binding
			oFastAppDataModel.updateBindings(true);
		},

		//saving the requested group purchasing
		onConfirmRequestedGroupPurchasing: function (oEvent) {
			//close the dialog

			//general
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//get selected product for dialog
			var oSelectedProduct = that._oDialog.data("SelectedProduct");

			//calculate sum of requested amounts
			var sSumRequestedVolume = 0;
			var aRequestedGroupPurchasing = oFastAppDataModel.getProperty("/RequestedGroupPurchasing");

			//if requested group purchasing exists calculate
			if (aRequestedGroupPurchasing && aRequestedGroupPurchasing.length > 0) {

				//loop at the results of the group purchasing
				aRequestedGroupPurchasing.forEach(function (oGroupPurchasing, iIndex) {

					//check if the group purchasing has a requested amount
					if (oGroupPurchasing.Requested && oGroupPurchasing.Requested > 0 && oGroupPurchasing._sOperation !== "DELETE") {
						sSumRequestedVolume = sSumRequestedVolume + Number(oGroupPurchasing.Requested);
					}

				});
			}

			//keep result on product
			oSelectedProduct.RequestedVolume = sSumRequestedVolume;

			//keep new group purchasing at product level
			if (oSelectedProduct.GroupPurchasing && oSelectedProduct.GroupPurchasing.results) {
				oSelectedProduct.GroupPurchasing.results = aRequestedGroupPurchasing;
			} else {

				//results doesn't exist, add it first so we can bind to it
				var oResults = {
					results: []
				}
				oResults.results = aRequestedGroupPurchasing;
				oSelectedProduct.GroupPurchasing = oResults;

			}

			//change binding
			var sBindingPathProduct = that._oDialog.data("SelectedProductPath");
			oFastAppDataModel.setProperty(sBindingPathProduct, oSelectedProduct);

			//close dialog
			that._oDialog.close();
		},

		//FINANCIAL OFFER TAB
		//-------------------

		//binding finished on offer table
		/*
		onFinancialOffersTableFinished: function (oEvent) {
			//Check if financialOffer Tab is opened, other wise this should not be selected
			if(Services.getSelectedTab() === Services.getFinancialOfferPageSectionID()){
				//that is this
				var that  = this;
				
				//reselect same offer if it exists, otherwise clear offer selected
				that._selectOfferInOfferTable("financialOffersTableViewID","financialOffersTableOfferID");				
			}
		},	
		*/

		//currency or other fields are changed on the financial offer tab (in edit mode)
		onEditFinancialOffer: function (oEvent) {
			var offerFragment = new OfferProducts();

			//offerFragment.updateFinancialOffer(oEvent, this);
			offerFragment.updateFinancialOffer(oEvent, this).then((response) => {
				//screen is updated

			});

			//price is changed
			//Financial.setPricingChanged(true);               
		},

		//Save in footer is clicked & financial offer tab is openened
		_onSaveFinancialOffer: function (oEvent) {
			this.getView().setBusy(true);
			//TODO use these when we have converted the edit view binding to the fastAppDataModel
			var sPathSelectedOffer = Services.getSelectedOfferPath();
			var sPathSelectedProduct = Services.getSelectedProductPath();
			var oDefaultModel = Services.getDefaultModel();
			var sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID); //oDefaultModel.getProperty(sPathSelectedOffer);
			var oProduct = oDefaultModel.getProperty(sPathSelectedProduct); //includes all navigation properties with latest data

			//catch all promises in an array
			let promises = [];
			var that = this;

			//if all back-end load promsises are done
			var oDeferred_all = $.Deferred();

			//TODO: this is not needed if you use above variable OfferProducts (define)
			var offerFragment = new OfferProducts();

			//Update page to make sure screen data is calculated (automatic if user pressed enter when changing value but not otherwise)
			//offerFragment.updateFinancialOffer(oEvent, that); //this is now done before calling onSaveFinancialOffer

			var oNewPriceInfo = {};
			var aChangeOperations = [];

			var oModel = Services.getDefaultModel(); //new sap.ui.model.odata.ODataModel(Services.getConnectionString());
			var sPath = Services.getSelectedOfferPath();

			//Generic problem check for possible session lost (this should be solved by session timeout implementation)
			if (sPath === undefined || that.pPath === undefined) {
				sap.m.MessageBox.show("Something went wrong, please contact administrator", {
					title: "Error",
					icon: sap.m.MessageBox.Icon.ERROR,
					onClose: function () {}
				});
				return;
			}

			//Root offer information //TODO replace with oOffer = same
			//var offerInfo = that.getView().getModel("fastData").getProperty(sPath);

			//Products information in offer TODO replace with oProduct = samne
			var offerValues = that.getView().getModel("fastData").getProperty(that.pPath); //Property or Object (was object)
			//var productId = Services.getSelectedProductID(); TODO: does not work (second part to reset at bottom of method)
			//var productName = Services.getSelectedProductName(); TODO: does not work (second part to reset at bottom of method)
			//var productValues = that.getView().getModel("fastData").getObject("/" + offerValues.SKU.__ref);

			//TODO get tenderID, offerID, CountryCode in the same way
			var tenderId = oOffer.TenderID; //offerInfo.TenderID;
			var offerId = oOffer.OfferID; //offerInfo.OfferID;
			var countryCode = oOffer.CountryCode; //offerInfo.CountryCode;

			//TODO change usage of __ref only possible after edit view is bound to fastAppData model, so we have all navigation properties available

			//Existing price data path for product
			var priceLink = offerValues.Price;
			var pricePath = (priceLink !== undefined && priceLink !== null) ? priceLink.__ref : null;

			//Number of items in pack used for unit conversion depending on if offer is for units or packs
			var packFactor = this.getView().getModel("fastData").getProperty("/" + offerValues.SKU
				.__ref).PACKFACTOR;

			//Unit for offer (Unit or Pack)
			var offerUnit = offerValues.UnitPerPack;

			//Currency of the offer (for new offers offer.Currency is not yet filled, thats why we need to take it from the view)
			var offerCurrency = that.byId("idEditCurrency").getSelectedKey();

			//Registered Price
			var regPriceValues = {
				CURRENCY: offerCurrency,
				UOM: offerUnit,
				REGISTERED_PRICE: 0
			};

			var oRegisterdPrice;
			var iRegPrice = "";

			//Get registered price from master data through navigation property, if exists
			if (offerValues.RegisteredPrice !== null) {
				/*regPriceValues = that.getView().getModel("fastData").getObject("/" + offerValues.RegisteredPrice.__ref);
				regPriceValues.REGISTERED_PRICE = parseFloat(regPriceValues.REGISTERED_PRICE);*/
				promises.push(offerFragment.loadCountryRegisteredPrice(Services.getSelectedCountry(), offerValues.UnitPerPack, Services.getSelectedProductID(),
					offerCurrency).then(function (sRegisteredPrice) {
					if (sRegisteredPrice) {
						regPriceValues.REGISTERED_PRICE = parseFloat(sRegisteredPrice.REGISTERED_PRICE);
					} else {
						regPriceValues.REGISTERED_PRICE = 0;
					}

					oRegisterdPrice = regPriceValues;
				}));
			}
			//Registered Price

			//Rates for country from offer currency to EUR
			/*
			var budgetRatePath = "/ExchangeRates(COUNTRY_CODE='" + "" +
				"',CURRENCY_FROM='" + offerCurrency + "',CURRENCY_TO='EUR',X_TYPE='Budget')";
			var budgetRate = this.getView().getModel("fastData").getObject(budgetRatePath).X_RATE;
			//get budget
			var spotRatePath = "/ExchangeRates(COUNTRY_CODE='" + "" +
				"',CURRENCY_FROM='" + offerCurrency + "',CURRENCY_TO='EUR',X_TYPE='Monthly Average')";
			var spotRate = this.getView().getModel("fastData").getObject(spotRatePath).X_RATE;
			*/

			//load Budget rate again from database
			var sCountry = "";
			var sX_TYPE = "Budget";
			var sCurrencyFrom = offerCurrency;
			var sCurrencyTo = "EUR";
			var iBudgetRate = null;
			promises.push(offerFragment.loadExchangeRates(sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE).then(function (oData) {
				if (oData !== false) {
					iBudgetRate = oData.X_RATE;
				}
			}));

			//load Spot rate again from database
			var sCountry = "";
			var sX_TYPE = "Monthly Average";
			var sCurrencyFrom = offerCurrency;
			var sCurrencyTo = "EUR";
			var iSpotRate = null;
			promises.push(offerFragment.loadExchangeRates(sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE).then(function (oData) {
				if (oData !== false) {
					iSpotRate = oData.X_RATE;
				}
			}));


			//Rates: eventually, we get
			//	+ either registeredRate=0 (=> we don't have a registered price i that currency)
			//	+ or the registeredRate to convert registered price (if it exists) to offer currency

			//if all promises received = meaning all data is loaded from back-end
			Promise.all(promises).then(async (result) => {

				// validate distributor offer product net prices
				if(Services.getSelectedCountry() === 'AR'){
					const bNetPricesAreValid = await that._validateDistributorProductNetPrices();
					if(!bNetPricesAreValid){
						that.getView().setBusy(false);
						return;
					}
				}

				//if all saving promises are done
				let promises_saving = [];

				$.when(offerFragment.loadNewCalcRegPrice(oOffer, oProduct, oRegisterdPrice, offerCurrency)).done(function (oData) {
					iRegPrice = oData;
					//when registered price could not be calculated due to not found we should not continue
					if (iRegPrice === false) {
						return;
					}

					//TODO after edit view binding is done to fastAppData model, we can take cogsValues from navigation prop (that is used directly)
					//COGS
					var cogsValues = {
						COGS: 0
					};
					//Getting the up-to-date COGS values from master data if exists
					if (offerValues.Cogs !== null) {
						cogsValues = that.getView().getModel("fastData").getObject("/" + offerValues.Cogs.__ref);
					}
					//COGS

					//Update offer
					var oOfferSaveInfo = {};
					oOfferSaveInfo.OfferID = Services.getSelectedOfferID();
					oOfferSaveInfo.Currency = that.byId("idEditCurrency").getSelectedKey();
					oOfferSaveInfo.FOCType = that.byId("idEditFOCType").getSelectedKey();
					//default foc abolute or percentage is decided on first product price thats saved... so if empty, save
					//if(!offerInfo.DEFAULT_FOC_ABS_PCT){
					if (!oOffer.DEFAULT_FOC_ABS_PCT) {
						oOfferSaveInfo.DEFAULT_FOC_ABS_PCT = that.byId("idEditPriceOffer_idFocAbsPct").getSelectedKey();
					}

					var setCurrency = oOfferSaveInfo.Currency;
					//update offer
					promises_saving.push(Services.getService('Offer').updateOffer(oOfferSaveInfo).catch(function (oError) {
						//show error message
						Services.showErrorMessage(oError, "Update of offer");
						//promises must fail as well
						throw new Error(oError);
					}));

					//Registered price we have on screen (same as up-to-date master data one (iRegPrice) BUT already converted to offer currency)
					var sCifPrice = that.byId("idEditPriceOffer_idCifPrice").getValue();
					var regPrice = parseFloat(sCifPrice.replace(",", ""));

					if (that.byId("idEditPriceOffer_idOfferPrice").getValue() === "") {
						sap.m.MessageBox.show("No offer price was set", {
							title: "Error",
							icon: sap.m.MessageBox.Icon.ERROR,
							onClose: function () {}
						});
						that.getView().setBusy(false);
						return;
					}

					

					//Offer price as set on screen
					var offerPrice = parseFloat(that.byId("idEditPriceOffer_idOfferPrice").getValue().replace(",", ""));

					//Checking that offer price is lower than registered one - saving is not allowed if not
					//if (regPrice !== 0 && Math.round(10000*offerPrice) > Math.round(10000*regPrice)) {
					if (!offerFragment.checkOfferPriceLowerRegisterPrice(offerPrice, regPrice)) {
						sap.m.MessageBox.show("Offer price cannot be higher than registered price", {
							title: "Error",
							icon: sap.m.MessageBox.Icon.ERROR,
							onClose: function () {}
						});

						that.getView().setBusy(false);
						return;
					}
                   //EHQUT-SCTASK0105431-Issue in Whole price of Nexavar
					//Set price for product
					oNewPriceInfo = {
						TenderID: tenderId,
						OfferID: offerId,
						CountryCode: countryCode,
						ProductCode: that._productCode,
						SubmittedOn: moment().utc().toDate(),
						SubmittedBy: UserInfo.getCWID(),
						Active: 1,
						Tier: 0,
						VolumeFrom: 0,
						VolumeTo: 0,
						RegPrice: iRegPrice, //regPriceValues.REGISTERED_PRICE * registeredRate,
						FOC: (that.byId("idEditPriceOffer_idFocAbsPct").getSelectedKey() === "PCT") ? that.byId("idEditPriceOffer_idFoc").getValue() /
							100 : that.byId("idEditPriceOffer_idFoc").getValue(),
						FOCType: that.byId("idEditFOCType").getSelectedKey(), //that.byId("idEditPriceOffer_idFocType").getSelectedKey(),
						Discount: that.byId("idEditPriceOffer_idDiscount").getValue() / 100,
						OfferPrice: parseFloat(that.byId("idEditPriceOffer_idOfferPrice").getValue().replaceAll(",", "")),
						StandardDiscount: that.byId("idEditPriceOffer_idStandardDiscount").getValue() / 100,
						AdditionalDiscount: that.byId("idEditPriceOffer_idAdditionalDiscount").getValue() / 100,
						//Deductions: that.byId("idEditPriceOffer_idDeduction").getValue() / 100,
						//EHQUT-196575- Thailand - Change Request - INC16653808 
						Deductions:(countryCode !=="TH") ? that.byId("idEditPriceOffer_idDeduction").getValue() / 100 : ((that.byId("idEditPriceOffer_idDeductionAbsPct").getSelectedKey() === "PCT") ? that.byId("idEditPriceOffer_idDeduction").getValue() /100 : that.byId("idEditPriceOffer_idDeduction").getValue()),
						NetofferPrice: parseFloat(that.byId("idEditPriceOffer_idNetOfferPrice").getValue().replaceAll(",", "")),
						BusinessCasePrice: parseFloat(that.byId("idEditPriceOffer_idBusinessCasePrice").getValue().replace(",", "")),
						WholesalePrice: that.byId("idEditPriceOffer_idWhlseofr").getSelectedKey(),
						COGS: cogsValues.COGS,
						SpotRate: iSpotRate,
						BudgetRate: iBudgetRate,
						Scenario: 0,
						FOC_ABS_PCT: that.byId("idEditPriceOffer_idFocAbsPct").getSelectedKey(),
						FOCProduct_Bundled_1: Number(that.byId("idEditPriceOffer_idFOCProdBund1").getSelectedKey()), //FOC ADDITIONAL PRODUCT
						FOC_ABS_PCT_Bundled_1: that.byId("idEditPriceOffer_idFocAbsPct1").getSelectedKey(), //FOC ADDITIONAL PROD ABSOLUTE or PERCENTAGE
						FOC_Bundled_1: (that.byId("idEditPriceOffer_idFocAbsPct1").getSelectedKey() === "PCT") ? that.byId(
							"idEditPriceOffer_idFoc1").getValue() / 100 : that.byId("idEditPriceOffer_idFoc1").getValue(), //FOC ADDITIONAL PROD VALUE
						ActiveTier: 0,
						NetPrice: parseFloat(that.byId("idEditPriceOffer_idNetPrice").getValue().replaceAll(",", "")),
						NetPrice_OfPaid: parseFloat(that.byId("idEditPriceOffer_idNetPrice").getValue().replaceAll(",", "")),
						PRICE_UPDATE: 0,
						Deductions_ABS_PCT:(countryCode ==="TH") ? that.byId("idEditPriceOffer_idDeductionAbsPct").getSelectedKey() : " "
					};
                //EHQUT-SCTASK0105431-Issue in Whole price of Nexavar
					//check if any of the pricing data is changed
					$.when(Financial.loadProductPrice(offerId, that._productCode, 1, 0)).done(function (oOriginalPrices) {

						//convert price to save
						var oPriceToSave = Services.getService('Price').getConvertPriceToSave(oNewPriceInfo);

						//if oOriginalPrices = false, they were not found, and we are creating new
						if (oOriginalPrices !== false) {
							//otherwise they were found and the check results for price update should be used
							oPriceToSave.PRICE_UPDATE = Financial.checkPriceUpdate(oOriginalPrices, oNewPriceInfo);
						}

						if (pricePath !== null) {
							//update Price
							promises_saving.push(Services.getService('Price').updatePrice(oPriceToSave).catch(function (oError) {
								//show error message
								Services.showErrorMessage(oError, "Update of Price");
								//promises must fail as well
								throw new Error(oError);
							}));
						} else {
							//create Price
							promises_saving.push(Services.getService('Price').createPrice(oPriceToSave).catch(function (oError) {
								//show error message
								Services.showErrorMessage(oError, "Creation of Price");
								//promises must fail as well
								throw new Error(oError);
							}));
						}

						//Save all scenario's
						promises_saving.push(that._saveFinancialOfferScenario(oNewPriceInfo, offerValues));

						//if all promises pushed from the loop have received their answer
						Promise.all(promises_saving).then((result) => {

							//this method is actually no longer needed, Offerstatus is always "Offer created", never "Results recorded"
							//$.when(that._updateFinancialOfferStatus(oNewPriceInfo, oOffer.OfferStatus)).then(function () {
							//save offer status as tender recorded... 
							$.when(Services.saveOfferStatus("Offer Created")).done(function (oSaveStatus) {

								//In that case we might dit some changes in the fastAppData model, we will load all data from the database again
								//otherwise nextOfferID is f.e still the one that is already created
								var sTenderPath = Services.getSelectedTenderPath();
								var sTenderID = Services.getSelectedTenderID();
								let bWarning = false;

								//we will load tender again after save is done
								var bLoadedCheck = false;

								$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

									//set selected offer ID
									Services.setSelectedOfferID(offerId);
									Services.setSelectedOfferPath(sPath);

									//Selected offer binding
									var oOffer = Services.getLoadedOffer(offerId);
									Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
									//Services.setSelectedProductID(productId);
									//Services.setSelectedProductName(productName);

									//switch from edit to display
									that.onEditToggleButtonPress();
									that.byId("idCurrency").setSelectedKey(setCurrency);

									//show success message
									//sap.m.MessageBox.success("Financial Offer Saved Successfully", {});
									Services.getOfferCompositeMessages().push({
										type: 'Success',
										title: 'Financial Offer Saved Successfully',
										description: 'Financial Offer Saved Successfully'
									});
									
									if(oOffer.CountryCode === "AR"){
										oOffer.Product.results.map((product) => {
											if(product.Price !== null && product.Price.BusinessCasePrice !== null && product.Price.BusinessCasePrice !== ""){
												bWarning = true;
											}
										});
									}
									if(bWarning){
										Services.getOfferCompositeMessages().push({
											type: 'Warning',
											title: 'Please upload the business case document',
											description: 'Please upload the business case document'
										});
									}

									Services.showMessageCompositeView("Offer Saved", Services.getOfferCompositeMessages(), 'Success');
									Services.getOfferCompositeMessages().splice(0, Services.getOfferCompositeMessages().length);

									oDeferred_all.resolve("saving is done");
									
									//refresh tenders master table (left pane)
									Services.refreshTendersMasterTable(sTenderID);

									//update approvals sent to 0 (to indicate that a change has been made to the offer data, so approvals need to be send again)
									var iApprovals_sent = oOffer.APPROVALS_SENT; //offerInfo.APPROVALS_SENT;
									Services.saveOfferApprovalSent(iApprovals_sent).catch(function (oError) {
										//Error during save
										Services.showErrorMessage(oError, "Background saving for approvals sent field");
									});
								});
							});

						}).catch(function (oError) {

							//error message
							Services.showErrorMessage(oError, "Saving financial offer");
							this.getView().setBusy(false);
							oDeferred_all.reject();

						});

					});
				});

			});

			//wait saving method to wait for results...
			return oDeferred_all.promise();

		},


		/**
		 * There is legal obligation in Argentina that all distributors should be granted the same net price.
		 * This method checks the offer product net prices for all distributors.
		 * @returns {Boolean} - Returns true if all net prices are equal else returns false
		 */
		_validateDistributorProductNetPrices: async function(){ 

			const expandFields = "Product/Price";
			const allTenderOffers = await this.getTenderOffers(expandFields);
			const selectedOfferID = Services.getSelectedOfferID();
			const selectedProductID = Services.getSelectedProductID();
			const selectedProductName = Services.getSelectedProductName();
			const selectedProductNewNetPrice = parseFloat(this.byId("idEditPriceOffer_idNetPrice").getValue().replace(',',''));
			const otherDistributorProduct = allTenderOffers
				.filter(offer => offer.OfferID !== selectedOfferID)
				.map(offer => offer.Product.results.find(prod => (prod && prod.Price && prod.ProductCode === selectedProductID)))
				.filter(Product => Product !== undefined); //no products or prices underneath the offer
			const otherDistributorProductNetPrices = otherDistributorProduct
				.map(prod => {
					return {
							offerID : prod.OfferID,
							netPrice : +prod.Price.NetPrice
					};
				});
			
			const lowestNetPrice = Math.min.apply(null, otherDistributorProductNetPrices.map(item => item.netPrice));
			const bNetPriceIsHigherThanAppliedForOtherDistributor = otherDistributorProductNetPrices.some(item => selectedProductNewNetPrice > item.netPrice );
			const sNetPriceIsHigherThanAppliedForOtherDistributor = otherDistributorProductNetPrices
				.filter(item => selectedProductNewNetPrice > item.netPrice )
				.map(item => item.offerID + ' with a net price (' + item.netPrice + ')').toString();
			const bNetPriceIsLowerThanAppliedForOtherDistributor = otherDistributorProductNetPrices.some(item => selectedProductNewNetPrice < item.netPrice );
			const sNetPriceIsLowerThanAppliedForOtherDistributor = otherDistributorProductNetPrices
				.filter(item => selectedProductNewNetPrice < item.netPrice )
				.map(item => item.offerID + ' with a net price (' + item.netPrice + ')').toString();
			
			let msg = "";

			if(bNetPriceIsHigherThanAppliedForOtherDistributor){
				msg = `You have selected different net prices applicable ${sNetPriceIsHigherThanAppliedForOtherDistributor}. The lowest price used is ${lowestNetPrice}. Please check for product ${selectedProductName}. Additional discount should be calculated and applied to have same as lowest net price for other distributors`;
			}

			if(bNetPriceIsLowerThanAppliedForOtherDistributor){
				msg = `Warning "You have selected a higher net prices in offer ${sNetPriceIsLowerThanAppliedForOtherDistributor} for product ${selectedProductName}.`;
			}

			if(bNetPriceIsHigherThanAppliedForOtherDistributor || bNetPriceIsLowerThanAppliedForOtherDistributor){
				return new Promise(function(resolve, reject){
					sap.m.MessageBox.warning(msg, {
						actions: ["Save", sap.m.MessageBox.Action.CANCEL],
						emphasizedAction: "Save",
						onClose: function (sAction) {
							if (sAction === "CANCEL") resolve(false);
							if (sAction === "Save") resolve(true);
						}
					});
				});
			}
			
			return true;
		},

		//saving of scenario's
		_saveFinancialOfferScenario: function (saveInfo, offerValues) {

			//that is this
			var that = this;

			//wait for all saving to be done
			let promises = [];
			var oModel = Services.getDefaultModel(); //new sap.ui.model.odata.ODataModel(Services.getConnectionString());

			//loop & get values for each scenario
			var scenarioList = (offerValues.Scenario && offerValues.Scenario.__list) ? offerValues.Scenario.__list : offerValues.Scenario; //once we are fully on FASTCAP, we can use offerValues.Scenario as the value without the check on list
			for (var i = 1; i < 4; i++) {
				var scenarioPrice = this.byId("idEditPriceOfferScenario" + i + "_idOfferPrice").getValue().replace(",", "");
				if (scenarioPrice === "") {
					scenarioPrice = this.byId("idEditPriceOffer_idOfferPrice").getValue().replace(",", "");
				}

				//Scenario get info from screen
				var oScenarioSaveInfo = {
					TenderID: saveInfo.TenderID,
					OfferID: saveInfo.OfferID,
					CountryCode: saveInfo.CountryCode,
					ProductCode: saveInfo.ProductCode,
					SubmittedOn: moment().utc().toDate(),
					SubmitedBy: UserInfo.getCWID(), //TODO change database column name submi(T)ted & change to uppercase in general
					Active: 1,
					Scenario: i,
					Name: this.byId("idEditPriceOfferScenario" + i + "_idName").getValue(),
					Description: this.byId("idEditPriceOfferScenario" + i + "_idDescription").getValue(),
					Volume: offerValues.RequestedVolume,
					OfferPrice: scenarioPrice,
					FOC_ABS_PCT: this.byId("idEditPriceOfferScenario" + i + "_idFocAbsPct").getSelectedKey(),
					FOC: (this.byId("idEditPriceOfferScenario" + i + "_idFocAbsPct").getSelectedKey() === "PCT") ? this.byId(
						"idEditPriceOfferScenario" + i + "_idFoc").getValue() / 100 : this.byId("idEditPriceOfferScenario" + i + "_idFoc").getValue(),
					FOCType: this.byId("idEditFOCType").getSelectedKey(), //this.byId("idEditPriceOfferScenario" + i + "_idFocType").getSelectedKey(),
					FOC_ABS_PCT_Bundled_1: this.byId("idEditPriceOfferScenario" + i + "_idFocAbsPct1").getSelectedKey(),
					FOC_Bundled_1: parseFloat((this.byId("idEditPriceOfferScenario" + i + "_idFocAbsPct1").getSelectedKey() === "PCT") ? this.byId(
						"idEditPriceOfferScenario" + i + "_idFoc1").getValue() / 100 : this.byId("idEditPriceOfferScenario" + i + "_idFoc1").getValue()),
					FOCProduct_Bundled_1: Number(this.byId("idEditPriceOfferScenario" + i + "_idFOCProdBund1").getSelectedKey())
				};

				//Convert scenario object for saving
				var oScenarioToSave = Services.getService('Scenario').getConvertScenarioToSave(oScenarioSaveInfo);

				//Path for finding scenariolist
				var sScenarioPath = "PT_SCENARIOPLAN(OfferID='" + oScenarioSaveInfo.OfferID + "',ProductCode=" + oScenarioSaveInfo.ProductCode +
					",Active=1,Scenario=" + oScenarioSaveInfo.Scenario + ")";

				//create or save scenario	
				if (scenarioList && scenarioList.includes(sScenarioPath)) {
					//update existing scenario
					promises.push(Services.getService('Scenario').updateScenario(oScenarioToSave).catch(function (oError) {
						Services.showErrorMessage(oError, "Updating scenario");
						throw new Error(oError);
					}));
				} else {
					//create scenario
					promises.push(Services.getService('Scenario').createScenario(oScenarioToSave).catch(function (oError) {
						Services.showErrorMessage(oError, "Creating scenario");
						throw new Error(oError);
					}));
				}

			}

			//all scenario's are saved
			//if all promises pushed from the loop have received their answer
			//when finished
			return Promise.all(promises).then((oResult) => {

				//success (can be more then 1 result in result)	
				return oResult;

			}).catch(function (oError) {

				//throw a new error for current change
				throw new Error(oError);

			});

		},

		//in financial offer change mode
		setFinancialOfferEditBinding: function () {

			//that is this
			var that = this;

			this.byId("idScenarioPlanner").setVisible(false);
			this.byId("idPricingOffer").setVisible(false);

			//get offer & product path
			var sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID);

			var sOfferPath = Services.getSelectedOfferPath();

			var sProductPath = sOfferPath + "/Product";

			//only if selected offer
			if (sOfferPath) {

				//get & keep offer
				//Services.getDefaultModel().getProperty(sOfferPath);
				Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);

				//if currency is set on offer, we should disable the selection of the currency
				var oCurrency = that.byId("idEditCurrency");
				if (oOffer.Currency && oOffer.Currency !== "NULL") {
					oCurrency.setEnabled(false);
				} else {
					oCurrency.setEnabled(true);
				}

				oCurrency.bindItems({
					path: "fastData>/CountryCurrency",
					filters: [new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, that._country)],
					sorter: new sap.ui.model.Sorter("SORTER"),
					template: new sap.ui.core.Item({
						text: "{fastData>CURRENCY}",
						key: "{fastData>CURRENCY}"
					})
				});
				oCurrency.setSelectedKey(oOffer.Currency);

				//Foc type is saved together with first product thats saved
				var oEditFocType = that.byId("idEditFOCType");
				if (oOffer.FOCType) {
					oEditFocType.setEnabled(false);
				} else {
					oEditFocType.setEnabled(true);
				}

				var oFinancialOfferTemplate = new sap.m.ColumnListItem({
					type: "Navigation",
					press: that.onFinancialOfferProductItemPress.bind(that),
					cells: [
						//Product
						new sap.m.Text({
							text: "{fastData>SKU/PRODUCTPACKNAME}"
						}),
						//Volume
						new sap.m.Text({
							text: "{fastData>RequestedVolume}"
						}),
						//UoM
						new sap.m.Text({
							text: "{fastData>UnitPerPack}"
						}),
						//Net Price
						new sap.m.ObjectNumber({
							number: {
								parts: [{
									path: "Price/NetPrice",
									model: "fastData"
								}, {
									path: "fastAppData>EditOffer/Currency",
									model: "fastAppData"
								}],
								formatter: formatter.price
							}
						}),
						//Offer Price
						new sap.m.ObjectNumber({
							number: {
								parts: [{
									path: "Price/OfferPrice",
									model: "fastData"
								}, {
									path: "fastAppData>EditOffer/Currency",
									model: "fastAppData"
								}],
								formatter: formatter.price
							}
						}),
						//cogs
						new sap.m.ObjectNumber({
							number: {
								parts: [{
									path: "fastData>Price/COGS"
								}, {
									path: "fastAppData>EditOffer/Currency"
								}, {
									path: "fastData>UnitPerPack"
								}, {
									path: "fastData>SKU/PACKFACTOR"
								}],
								formatter: formatter.cogs
							},
							visible:"{access>/tenderAccess/COGS}"	
						}),
						//gross sales
						new sap.m.ObjectNumber({
							number: {
								parts: [{
									path: "fastData>Price/OfferPrice"
								}, {
									path: "fastData>RequestedVolume"
								}, {
									path: "fastAppData>EditOffer/Currency"
								}],
								formatter: formatter.grossSales
							}	
						}),
						//net sales
						new sap.m.ObjectNumber({
							number: {
								parts: [{
									path: "fastData>Price/NetPrice"
								}, {
									path: "fastData>RequestedVolume"
								}, {
									path: "fastAppData>EditOffer/Currency"
								}, {
									path: "fastData>Price/FOC"
								}, {
									path: "fastData>Price/FOC_ABS_PCT"
								}, {
									path: "fastData>Price/FOCType"
								}],
								formatter: formatter.netSales
							},
							visible:"{access>/tenderAccess/COGS}"
						}),
						//Profitability
						new sap.m.ObjectNumber({
							number: {
								parts: [{
									path: "fastData>Price/NetPrice"
								}, {
									path: "fastData>Price/COGS"
								}, {
									path: "fastData>RequestedVolume"
								}, {
									path: "fastAppData>EditOffer/Currency"
								}, {
									path: "fastData>Price/SpotRate"
								}, {
									path: "fastData>Price/FOC"
								}, {
									path: "fastData>Price/FOC_ABS_PCT"
								}, {
									path: "fastData>Price/FOCType"
								}, {
									path: "fastData>UnitPerPack"
								}, {
									path: "fastData>SKU/PACKFACTOR"
								}, {
									path: "fastData>Price/FOC_Bundled_1"
								}, {
									path: "fastData>Price/FOC_ABS_PCT_Bundled_1"
								}, {
									path: "fastData>Price/Bundled_1_Cogs/COGS"
								}, {
									path: "fastData>Price/Bundled_1_SKU/PACKFACTOR"
								}],
								formatter: formatter.profit
							},

							state: {
								parts: [{
									path: "fastData>Price/NetPrice"
								}, {
									path: "fastData>Price/COGS"
								}, {
									path: "fastData>RequestedVolume"
								}, {
									path: "fastAppData>EditOffer/Currency"
								}, {
									path: "fastData>Price/SpotRate"
								}, {
									path: "fastData>Price/FOC"
								}, {
									path: "fastData>Price/FOC_ABS_PCT"
								}, {
									path: "fastData>Price/FOCType"
								}, {
									path: "fastData>UnitPerPack"
								}, {
									path: "fastData>SKU/PACKFACTOR"
								}, {
									path: "fastData>Price/FOC_Bundled_1"
								}, {
									path: "fastData>Price/FOC_ABS_PCT_Bundled_1"
								}, {
									path: "fastData>Price/Bundled_1_Cogs/COGS"
								}, {
									path: "fastData>Price/Bundled_1_SKU/PACKFACTOR"
								}],
								formatter: formatter.profitState
							},
							visible:"{access>/tenderAccess/COGS}"
						})
					]
				});

				//Products table
				var oSorter = new sap.ui.model.Sorter('SORTER');
				var oTable = that.byId("idEditFinancialOfferViewProduct");
				oTable.bindItems({
					path: sProductPath,
					model: "fastData",
					filters: [
						new sap.ui.model.Filter("Active", sap.ui.model.FilterOperator.EQ, 1),
						new sap.ui.model.Filter("ActiveProduct", sap.ui.model.FilterOperator.NE, 2)
					],
					sorter: oSorter,
					parameters: {
						expand: "SKU,Price,RegisteredPrice,Cogs,Scenario,Price/Bundled_1_Cogs,Price/Bundled_1_SKU"
					},
					template: oFinancialOfferTemplate
				});
			}
			//EHQUT-199080-MEA -Global/local pricing policy identification
			let ProductCode=that._productCode;
			var oFastAppDataModel = Services.getFastAppDataModel();
			let Region=oFastAppDataModel.oData.Tender.Country.Region;
			var aProducts = oFastAppDataModel.getProperty("/EditOffer/Product/results");
            var iIndex = aProducts.findIndex(x => x.ProductCode === ProductCode);
            let GPP_Goverened=aProducts[iIndex].SKUCountry.GPP_GOVERNED;
			const oView=this.getView();
			var data={
				ProductCollection :[]
			};
			
			if(GPP_Goverened==='Yes'){
			
			var ProductDetails={
				LAP_CURRENCY:aProducts[iIndex].SKUCountry.LAP_CURRENCY,
				LAP:aProducts[iIndex].SKUCountry.LAP,
				LAP_UNIT:aProducts[iIndex].SKUCountry.LAP_UNIT,
				PRAF_COMMENTS:aProducts[iIndex].SKUCountry.PRAF_COMMENTS,
				PRAF_ID:aProducts[iIndex].SKUCountry.PRAF_ID
			}
			data.ProductCollection.push(ProductDetails);
		}
			if(GPP_Goverened==='Yes' && Region=== 'MEA'){
				if (!this.oDefaultDialog) {
				
					this.oDefaultDialog = Fragment.load({
						id: this.getView().getId(),
						name: "FAST_NS0FAST0.view.fragments.PrafDetails_MEA",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						return oDialog;
					});
					
				}
				this.oDefaultDialog.then(function (oDialog) {
					var oModel=new sap.ui.model.json.JSONModel(data);
					oDialog.setModel(oModel);
					oDialog.open();
				}.bind(this));
			}
			//EHQUT-199080-MEA -Global/local pricing policy identification
		},
		//EHQUT-199080-MEA -Global/local pricing policy identification
		onClose:function(){
            if(this.oDefaultDialog) this.oDefaultDialog.then(dialog => dialog.close());
        },
		
		onToggleScenarioPlanner: function (oEvent) {
			var oScenarioPlanner = this.byId("idScenarioPlanner");
			var oPricingOffer = this.byId("idPricingOffer");
			oScenarioPlanner.setVisible(!oScenarioPlanner.getVisible());
			oPricingOffer.setVisible(!oPricingOffer.getVisible());
		},
		onSelectScenario: function (oEvent) {
			var buttonId = oEvent.getParameters().id;
			var idScenario = buttonId[buttonId.length - 1];

			this.byId("idEditPriceOffer_idOfferPrice").setValue(this.byId("idEditPriceOfferScenario" + idScenario + "_idOfferPrice").getValue());
			//this.byId("idEditPriceOffer_idFocType").setSelectedKey(this.byId("idEditPriceOfferScenario" + idScenario + "_idFocType").getSelectedKey());
			this.byId("idEditPriceOffer_idFocAbsPct").setSelectedKey(this.byId("idEditPriceOfferScenario" + idScenario + "_idFocAbsPct").getSelectedKey());
			this.byId("idEditPriceOffer_idFoc").setValue(this.byId("idEditPriceOfferScenario" + idScenario + "_idFoc").getValue());
			//update additional FOC as well
			this.byId("idEditPriceOffer_idFOCProdBund1").setSelectedKey(this.byId("idEditPriceOfferScenario" + idScenario + "_idFOCProdBund1").getSelectedKey());
			this.byId("idEditPriceOffer_idFocAbsPct1").setSelectedKey(this.byId("idEditPriceOfferScenario" + idScenario + "_idFocAbsPct1").getSelectedKey());
			this.byId("idEditPriceOffer_idFoc1").setValue(this.byId("idEditPriceOfferScenario" + idScenario + "_idFoc1").getValue());

			this.onEditFinancialOffer(oEvent);
			this.onToggleScenarioPlanner(oEvent);

		},

		/**
         * Get the existing price agreement related to a Tender classification "Tender"
         * which is not expiring before tomorrow for the same product
         */
		getExistingPriceAgreement: async function(existingPriceAgreementId){
		
			let filter = {};

			if(existingPriceAgreementId){
				filter = {
					ID: existingPriceAgreementId,
				};
			}

			if(filter){
				return (await Services.getService("PriceAgreement").getPriceAgreements(filter))?.data?.results?.filter((result) => {
					let candidates = result.Candidates?.results;
					if(candidates.find(candidate => candidate.CandidateID === Services.getFastAppDataModel().getProperty('/Tender/Institute/InstituteID'))){
						return result;
					}
				})[0];
			} else return null;
		},

		//QUOTATION TAB
		//-------------
		onQuotationOfferItemPress: async function (oEvent) {

			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			if (oEvent) { //if you enter this method from the edit button, the oEvent is empty & offer path is already set
				var sSelectedOfferPath = oEvent.getSource().getBindingContext("fastData").getPath();
				Services.setSelectedOfferPath(sSelectedOfferPath);
			} else {
				var sSelectedOfferPath = Services.getSelectedOfferPath();
			}

			//Product path
			var sProductPath = sSelectedOfferPath + "/Product";

			//get & keep selected offerID
			//var sSelectedOfferID = that.getView().getModel("fastData").getProperty(sSelectedOfferPath).OfferID;
			var sSelectedOfferID = Services.getSelectedOfferID();
			Services.setSelectedOfferID(sSelectedOfferID);

			//if you click on an offer it is available (sometimes it is not availble when you switch between tabs)
			Services.setSelectedOfferAvailable(true);

			//Selected offer
			var oOffer = Services.getLoadedOffer(sSelectedOfferID);
			oFastAppDataModel.setProperty("/EditOffer/", oOffer);

			//at this point no product should be selected.
			Services.setSelectedProductID("");
			Services.setSelectedProductName("");
			Services.setSelectedProductPath("");
			Quotation.setDelayInSubmission(null);

			//hide offer table, so there is more space on the screen
			/*
			if(sSelectedOfferID){
				that.getView().byId("panelQuotationOfferTableID").setExpanded(false);
			}
			*/

			//get products that are loaded
			var aProducts = Services.getLoadedProductsForOffer(sSelectedOfferID);
			var oFastAppDataModel = Services.getFastAppDataModel();

			//load quotation data
			$.when(Quotation.loadOfferAndProductValidationInfo()).done(async function (oData) {
				if(Services.getSelectedCountry() === "ES"){

					let aUnlockedProductPricing = aProducts.results.filter((product) => {
						if(product?.PriceCondition?.results.find((pricing) => pricing.IsPricingUnlocked === true)){
							return product;
						}
					});
		
					let oExistingAgreement = {};
					if(aUnlockedProductPricing && aUnlockedProductPricing.length > 0){
						oExistingAgreement = await that.getExistingPriceAgreement(aUnlockedProductPricing[0].ExistingPriceAgreementId);
						if(oExistingAgreement){
							that.setQuotationDateRestrictions(true, oExistingAgreement.ExpiryDate);

							if(!oFastAppDataModel.getProperty('/QuotationSelectedOffer')){
								//if we have an active agreement & quotation has not yet been saved, the effective & expiry dates will be calculated in backend
								//overwriting it here
								let dateAfterExpiryDate = new Date(oExistingAgreement.ExpiryDate);
								dateAfterExpiryDate.setDate(dateAfterExpiryDate.getDate() + 1);
								let newExpiryDate = new Date(dateAfterExpiryDate);
								newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
								oFastAppDataModel.setProperty('/OfferValidation/EffectiveDate', dateAfterExpiryDate);
								oFastAppDataModel.setProperty('/OfferValidation/ExpiryDate', newExpiryDate);

								that.setQuotationDateRestrictions(true, oExistingAgreement.ExpiryDate);
							}
						}
					} else {
						that.setQuotationDateRestrictions(false);
					}
					that._createPriceConditionTableEntitiesOnQuotationTabForSpain();
				}

				if(Services.getSelectedCountry() === "BR"){
					that.setQuotationDateRestrictions();
					that._createPriceConditionTableEntitiesOnQuotationTabForBrazil();
				}
			});

			/*$.when(Quotation.loadTenderBankGuarantee(Services.getSelectedTenderID())).done(function (oData) {

			});*/

			//set to fastappdata model for easy access on the view
			oFastAppDataModel.setProperty("/ProductsForOffer/", aProducts);
			var oForm = that.byId("IdQuotationInfo");
			if(oForm){
				oForm.setVisible(true);
				oForm.bindElement({
					path: sSelectedOfferPath,
					model: "fastData"
				});
			}
			oForm = that.byId("IdQuotationInfo2");
			if(oForm){
				oForm.setVisible(true);
				oForm.bindElement({
					path: sSelectedOfferPath,
					model: "fastData"
				});
			}
			//bind offer of default model to data to switch
			var oSwitch = that.byId("idDelayInSubmission");
			if(oSwitch){
				oSwitch.bindElement({
					path: sSelectedOfferPath,
					model: "fastData"
				});
			}

			var sOfferStatus = oOffer.OfferStatus.STATUS;
			var sOfferDate = "";
			if (oOffer && oOffer.Quotation) {
				sOfferDate = oOffer.Quotation.OfferDate;
			}

			//check if there needs to be an update (already existing and erpost)
			$.when(Quotation.loadQuotationForSelectedOffer(sOfferDate)).done(async function (oData) {

				var oQuotation = oFastAppDataModel.getProperty("/QuotationSelectedOffer");
				var oBankGuarantee = oFastAppDataModel.getProperty("/newBankGuarantee");

				//enable or disable download button 
				var enableDownload = false;
				if (sOfferStatus !== "Offer Created" && (oQuotation && oQuotation.UPDATED === 1)) {
					enableDownload = true;
				}
				let oBtnDownloadQuotation = that.byId("btnDownloadQuotation");
				if(oBtnDownloadQuotation){
					oBtnDownloadQuotation.setEnabled(enableDownload);
				}

				//enable or disable submit button
				var enableSubmit = false;
				if (sOfferStatus === "Offer Approved" && (oQuotation && oQuotation.UPDATED === 1) ) {
						enableSubmit = true;
				}
				that.byId("btnSubmitQuotation").setEnabled(enableSubmit);

			});

		},

		/**
		 * This method creates entities to be used for the binding of the Price Condition 
		 * tables on the Quotation tab for Spain.
		 */
		_createPriceConditionTableEntitiesOnQuotationTabForSpain: function(){ 
			const aOfferProductValidation = Services.getFastAppDataModel().getProperty("/OfferProductValidation");
			const tableData = {
				pvl: [],
				precioNeto: [],
				descuentoComercial: [],
				descuentoEspecial: [],
				rappel: [],
				foc: [],
				rental: []
			};

			// create PriceConditionTableEntities
			aOfferProductValidation.forEach(prd => {
				const priceConditions = prd.PriceCondition.results;
				priceConditions.forEach(pc => {
					const data = {
						SORTER: prd.SORTER,
						PRODUCTNAME: prd.PRODUCTNAME,
						PACKSIZE: prd.PACKSIZE,
						REQUESTED_QUANTITY: prd.REQUESTED_QUANTITY,
						REQ_PRICE_UNIT_OFFER_CURRENCY: prd.REQ_PRICE_UNIT_OFFER_CURRENCY,
						CURRENCY: prd.CURRENCY,
						IS_LOWEST: prd.IS_LOWEST,
						REQ_PRICE_PACK_OFFER_CURRENCY: prd.REQ_PRICE_PACK_OFFER_CURRENCY,
						GROSS_SALES_OFFER_CURRENCY: prd.GROSS_SALES_OFFER_CURRENCY,
						PAID_VOLUME: prd.PAID_VOLUME,
						UNIT: prd.UNIT,
						PriceCondition: pc
					};
					const conditionType = pc.PriceConditionClassification.ConditionType;
					switch(conditionType){
						case "PVL": tableData.pvl.push(data);
									break;
						case "Precio Neto": tableData.precioNeto.push(data);
									break;
						case "Descuento Comercial": tableData.descuentoComercial.push(data);
									break;
						case "Descuento Especial": tableData.descuentoEspecial.push(data);
									break;
						case "Rappel": tableData.rappel.push(data);
									break;
						case "FOC": tableData.foc.push(data);
									break;
						case "Rental": tableData.rental.push(data);
									break;
						default : console.error(`ConditionType ${conditionType} does not exist`); 
									break;
					}
				});
			});


			// add Tax to each DiscountCondition entity
			tableData.rappel.forEach(rappelCondition => {
				rappelCondition.PriceCondition.DiscountCondition.results = rappelCondition.PriceCondition.DiscountCondition.results.map(dc => ({...dc, Tax: rappelCondition.PriceCondition.Tax}))
			});

			// flatten/unpack foc entities
			tableData.foc = [].concat.apply([], tableData.foc.map(focCondition => focCondition.PriceCondition.FreeGoodsOther.results.map(foc => ({...focCondition, ...foc}))));
			
			Services.getFastAppDataModel().setProperty("/QuotationPriceConditionTableSpain", tableData);
		},

		_createPriceConditionTableEntitiesOnQuotationTabForBrazil: function(){ 
			const aOfferProductValidation = Services.getFastAppDataModel().getProperty("/OfferProductValidation");
			const tableData = {
				commercialProposal: [],
				discount: []
			};

			// create PriceConditionTableEntities
			aOfferProductValidation.forEach(prd => {
				const priceConditions = prd.PriceCondition.results.filter(el => el.LotID == prd.LOTID);
				priceConditions.forEach(pc => {
					const data = {
						SORTER: prd.SORTER,
						PRODUCTNAME: prd.PRODUCTNAME,
						PACKSIZE: prd.PACKSIZE,
						REQUESTED_QUANTITY: prd.REQUESTED_QUANTITY,
						REQ_PRICE_UNIT_OFFER_CURRENCY: prd.REQ_PRICE_UNIT_OFFER_CURRENCY,
						CURRENCY: prd.CURRENCY,
						IS_LOWEST: prd.IS_LOWEST,
						REQ_PRICE_PACK_OFFER_CURRENCY: prd.REQ_PRICE_PACK_OFFER_CURRENCY,
						GROSS_SALES_OFFER_CURRENCY: prd.GROSS_SALES_OFFER_CURRENCY,
						PAID_VOLUME: prd.PAID_VOLUME,
						UNIT: prd.UNIT,
						PriceCondition: pc
					};
					const conditionType = pc.PriceConditionClassification.ConditionType;
					switch(conditionType){
						case "Commercial Proposal": tableData.commercialProposal.push(data);
									break;
						case "Discount": tableData.discount.push(data);
									break;
						default : console.error(`ConditionType ${conditionType} does not exist`); 
									break;
					}
				});
			});

			Services.getFastAppDataModel().setProperty("/QuotationPriceConditionTableBrazil", tableData);
		},

		setQuotationDateRestrictions:function(hasExistingPriceAgreement, existingPaExpiryDate){

			let dateRestrictions = {};
			
			if(!hasExistingPriceAgreement){
				let tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				dateRestrictions = {
					effectiveDate:{
						min: tomorrow
					}
				};
			} else {
				let dateAfterExpiryDate = new Date(existingPaExpiryDate);
				dateAfterExpiryDate.setDate(dateAfterExpiryDate.getDate() + 1);
				dateRestrictions = {
					effectiveDate:{
						min: dateAfterExpiryDate
					}
				};

			}
			Services.getFastAppDataModel().setProperty("/QuotationDateRestrictions", dateRestrictions);
		},

		onChangeQuotationDates:function(event,dateType){
			Services.getFastAppDataModel().setProperty(`/OfferValidation/${dateType}ValueState`,event.getSource().isValidValue()?"None":"Error");
		},

		onCreateContractBR: function (oEvent) {
			
			this._getCreateContractDialog().open();

		},

		/**
		 * New contracting dialog
		 * @returns {dialog} - oDialog
		 */
		 _getCreateContractDialog: function () {

			const oFastAppDataModel = Services.getFastAppDataModel();

			//create new dialog if not yet existing
			if (!this._oAddNewContractDialog) {

				//get dialog
				this._oAddNewContractDialog = sap.ui.xmlfragment(this.getView().getId(), "FAST_NS0FAST0.view.fragments.brazil.CreateContract", this);
				this.getView().addDependent(this._oAddNewContractDialog);

			}

			if(oFastAppDataModel.getProperty('/SelectedOffer/Distributor/DistributorName') === 'Bayer Brazil'){
				this.getView().byId('idNewContractCustomerInstitute')?.setVisible(true);
				this.getView().byId('idNewContractCustomerDistributor')?.setVisible(false);
			} else {
				this.getView().byId('idNewContractCustomerInstitute')?.setVisible(false);
				this.getView().byId('idNewContractCustomerDistributor')?.setVisible(true);
			}
			
			this.getView().byId('idNewContractType')?.setSelectedKey("");	
			this.getView().byId('idNewContractCustomerInstitute')?.setSelectedKey("");
			this.getView().byId('idNewContractCustomerDistributor')?.setSelectedKey("");

			return this._oAddNewContractDialog;
		},

		onSaveNewContract: async function (oEvent){
			const selectedOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
			const selectedOfferProducts = Services.getLoadedProductsForOffer(Services.getSelectedOfferID());
			const contractUserInput = this.getView().getModel("viewModel").getProperty("/BrazilContract");
			const mappedContract = this.getMappedContract(selectedOffer, contractUserInput);
			const mappedContractProducts = this.getMappedContractProducts(selectedOfferProducts, contractUserInput);
			try {
				BusyIndicator.show(0);
				await Services.saveBrazilContract(mappedContract, mappedContractProducts);
				this._getCreateContractDialog().close();
				this.getView().getModel("viewModel").setProperty("/BrazilContract", {});
				BusyIndicator.hide();
				MessageBox.success("Contract and Contract Products are created successfully");
			} catch (error) {
				console.log(error);
				BusyIndicator.hide();
				if (error.statusCode && (error.statusCode == 400 || error.statusCode == 404)) {
					const oError = JSON.parse(error.responseText);
					const sErrorMsg = oError["error"]["message"]["value"];
					MessageBox.error(sErrorMsg);
				}
			}
		},

		getMappedContract: function (selectedOffer, contractUserInput) {
			const contractStatus = Services.getFastAppDataModel().getProperty("/BrazilContractStatuses");
			const statusID = (contractStatus.find(el => el.Status.toLowerCase() === "new fast"))?.ID;
			return {
				"TenderID": selectedOffer.TenderID,
				"OfferID": selectedOffer.OfferID,
				"InstituteID": contractUserInput.InstituteID,
				"DistributorID": contractUserInput.DistributorID,
				"ContractNumber": null, 
				"IbizProcessNumber": null,
				"ContractType": contractUserInput.ContractType,
				"OBS": null,
				"IbizContractID": null,
				"IbizContractNumber": null,
				"IbizContractSignDate": null,
				"StartDate": selectedOffer.Quotation.EffectiveDate,
				"EndDate": selectedOffer.Quotation.ExpiryDate,
				"StatusID": statusID
			}
		},

		getMappedContractProducts: function (selectedOfferProducts, contractUserInput) {
			return selectedOfferProducts.results.map(product => {
				const requestedVolume = contractUserInput.ContractType === "Adhesion Contract" ? 0 : product.RequestedVolume
				return {
					"ProductPackID": product.ProductCode,
					"IbizContractProductID": null,
					"OfferID": product.OfferID,
					"RequestedVolume": requestedVolume,
					"IbizItemType": null,
					"LotID": product.LotID,
					"ContractPrice": product.PriceCondition.results[0].CommercialProposal,
					"Contract_ID": ""
				}
			})
			
		},

		onCancelNewContract: function (){
			this.getView().getModel("viewModel").setProperty("/BrazilContract", {});
			this._oAddNewContractDialog.close();
		},
		/**
		 * Event handler for when the user changes ContractType in the UI
		 * @param {*} evt 
		 */
		onChangeContractType: function (evt){
			this.getView().getModel("viewModel").setProperty("/BrazilContract/ContractType", evt.getSource().getSelectedKey());
			this.getView().byId('idNewContractCustomerInstitute')?.setSelectedKey("");
			this.getView().byId('idNewContractCustomerDistributor')?.setSelectedKey("");
			//Set BrazilContract InstituteID and DistributorID from Offer
			const selectedOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
			this.getView().getModel("viewModel").setProperty("/BrazilContract/InstituteID", selectedOffer.Tender.InstituteID);
			this.getView().getModel("viewModel").setProperty("/BrazilContract/DistributorID", selectedOffer.DistributorID);
			if(evt.getSource().getSelectedItem().getKey() !== 'From Offer' && evt.getSource().getSelectedItem().getKey() !== '') {
				this.getView().byId('idNewContractCustomerInstitute')?.setEnabled(true);
				this.getView().byId('idNewContractCustomerDistributor')?.setEnabled(true);
			} else {
				this.getView().byId('idNewContractCustomerInstitute')?.setEnabled(false);
				this.getView().byId('idNewContractCustomerDistributor')?.setEnabled(false);
			}
		},
		/**
		 * Event handler for when the user changes Customer in the UI
		 * @param {*} evt 
		 */
		onChangeContractCustomer: function (evt, customerType) {
			const selectedValue = evt.getSource().getSelectedKey();
			if (customerType === "Institute") {
				this.getView().getModel("viewModel").setProperty("/BrazilContract/CustomerType", "Institute");
				this.getView().getModel("viewModel").setProperty("/BrazilContract/InstituteID", selectedValue);
			} 
			if (customerType === "Distributor") {
				this.getView().getModel("viewModel").setProperty("/BrazilContract/CustomerType", "Distributor");
				this.getView().getModel("viewModel").setProperty("/BrazilContract/DistributorID", selectedValue);
			} 
		},
		/**
		 * Click handler for VolumeTreshhold fragment on the Quotation page
		 * @param {*} oEvent 
		 */
		onVolumeTreshholdPress: function(oEvent){

            const oView = this.getView();
			const oContext = oEvent.getSource().getParent().getBindingContext('fastAppData');

            // create dialog lazily
            if (!this.pDialog) {
                this.pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "FAST_NS0FAST0.view.fragments.priceConditions.VolumeTreshhold_ES_Display",
                    controller: this
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    oDialog.setModel(Services.getFastAppDataModel(), "fastAppData");
                    return oDialog;
                });
            }

            this.pDialog.then(function (oDialog) {
				const oTable = this.byId("idVolumeTresholdDisplay");
				oTable.setBindingContext(oContext, "fastAppData");
                oDialog.open();
            }.bind(this));

        },


		onCancelDiscountCondition:function(){
            if(this.pDialog) this.pDialog.then(dialog => dialog.close());
        },


		//switchDelayInSubmission on or off
		onSwitchDelayInSubmission: function (oEvent) {

			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			var bDelayInSubmission = oEvent.getParameters("state").state;

			//keep delay in submission
			if (bDelayInSubmission) {
				//true
				Quotation.setDelayInSubmission('Yes');
			} else {
				//false
				Quotation.setDelayInSubmission('No');
			}

			//offerdate for quotation path
			var sOfferDate = oFastAppDataModel.getProperty("/OfferValidation/OFFERDATE"); //that.byId("idQofferDate").getValue();

			//do the save of the quotation
			$.when(Quotation.saveDelayInSubmission(Quotation.getDelayInSubmission(), sOfferDate)).done(function (oSaveStatus) {
				//message
				sap.m.MessageToast.show("Saved the delay in submission");
			});
		},

		onDownloadQuotation: function (oEvent) {
			// Now using download link on sharepoint
			$.when(Services.checkOfferStatus()).done(function (oData) {
                const sDownloadButtonUrl = Services.getFastAppDataModel().getProperty('/appConfig')?.find(config => config.Control === 'DownloadButton');
                const sDownloadButtonApproval = Services.getFastAppDataModel().getProperty('/appConfig')?.find(config => config.Control === 'DownloadButtonAwaitingApproval');
			
                if(sDownloadButtonUrl && sDownloadButtonApproval){
                    var url = (oData.STATUS !== "Awaiting Approval") ? sDownloadButtonApproval.URL + '$CountryCode/$TenderId/Approval_Docs/Quotation_$OfferId.pdf' : sDownloadButtonUrl.URL + 'Quotation_$OfferId.pdf';
                        /*"https://bayergroup.sharepoint.com/:f:/r/sites/FASTSystem/Shared%20Documents/Documents_Library/Countries/$CountryCode/$TenderId/Approval_Docs/Quotation_$OfferId.pdf" :
                        "https://bayergroup.sharepoint.com/:f:/r/sites/FASTSystem/Shared%20Documents/System_Data/System_TMP/Quotation_$OfferId.pdf";*/
                    var countryCode = Services.getCountryCodeofSelectedTender();
                    var tenderId = Services.getSelectedTenderID();
                    var offerId = Services.getSelectedOfferID();
                    url = url.replace("$CountryCode", countryCode);
                    url = url.replace("$TenderId", tenderId);
                    url = url.replace("$OfferId", offerId);
                    window.open(url);
                }
			});

			// KEEP!!! OUTDATED BUT MIGHT BE RE-USED!!!
			// var oModel = new sap.ui.model.odata.ODataModel(Services.getConnectionString());
			// var sOfferID = this.getView().byId("headerOfferId").getText(); //get selected offerid
			// if (!sOfferID) {
			// 	sap.m.MessageBox.warning("First select an offer for quotation.", {});
			// 	return;
			// }
			// var sSelectedOfferPath = Services.getSelectedOfferPath();
			// var oOffer = this.getView().getModel("fastData").getProperty(sSelectedOfferPath);
			// var sSelectedOfferID = oOffer.OfferID;
			// var aProducts = Services.getLoadedProductsForOffer(sSelectedOfferID);
			// oModel.read(sSelectedOfferPath, {
			// 	urlParameters: {
			// 		"$expand": "Distributor,SellingCompanyDetails"
			// 	},
			// 	success: function (oData, oResponse) {
			// 		Quotation.createWordQuotation(oData, aProducts);
			// 	},
			// 	error: function fnError(response) {
			// 		var a = 1;
			// 	}
			// });
		},

		onExportToExcel: function (oEvent){
			let sOfferId = Services.getSelectedOfferID();
			var url = ("../../v2/tender/ExcelAttachment('$sOfferId')/content");
			url = url.replace("$sOfferId", sOfferId);
			sap.m.URLHelper.redirect(url, true);
			//window.open(url);
		},

		//when submitting quotation, we will save data in the quotation tab + set the correct status on the offer
		onSaveDefaultQuotation: function (oEvent) {
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

            // make sure selectedOfferPath is correctly set
            if(Services.getSelectedOfferPath() === "" || Services.getSelectedOfferPath().includes("results")){
                Services.setSelectedOfferPath(Services.getDefaultModel().createKey("/PT_TMOFRS", {
                    OfferID: Services.getSelectedOfferID()
                }))
            }

			$.when(Services.checkOfferStatus()).done(function (oData) {
				var sStatus = oData.STATUS;
				var aStatusNoEdit = [
					"Awaiting Approval" //,
				];
				if ($.inArray(sStatus, aStatusNoEdit) !== -1) {
					sap.m.MessageBox.warning("Quotation cannot be saved, offer is in status Awating approval.", {});
				} else {
					//keep the latest state of switch delay in submission
					let oDelayInSubmission = that.getView().byId("idDelayInSubmission");
					if(oDelayInSubmission){
						var bDelayInSubmission = oDelayInSubmission.getState();
					}

					//keep delay in submission (needed when you don't click on the switch first)
					if (bDelayInSubmission) {
						//true
						Quotation.setDelayInSubmission('Yes');
					} else {
						//false
						Quotation.setDelayInSubmission('No');
					}

					let oCustomRemark = that.byId("idCustomRemark");
					let oSelectIssuedBy = that.byId("idSelectIssuedBy");
					let oSelectCompanyStamp = that.byId("idSelectCompanyStamp");

					var quotationFields = {
						OfferDate: oFastAppDataModel.getProperty("/OfferValidation/OFFERDATE"),
						OfferValidity: oFastAppDataModel.getProperty("/OfferValidation/OFFERVALIDITY"),
						EffectiveDate: oFastAppDataModel.getProperty("/OfferValidation/EffectiveDate"),
						ExpiryDate: oFastAppDataModel.getProperty("/OfferValidation/ExpiryDate"),
						CustomRemark: oCustomRemark ? that.byId("idCustomRemark").getValue() : '',
						IssuedBy: oSelectIssuedBy ? that.byId("idSelectIssuedBy").getSelectedKey() : '',
						CompanyStamp: oSelectCompanyStamp ? that.byId("idSelectCompanyStamp").getSelectedKey() : '',
					};

					//do the save of the quotation with UPDATED to 1
					$.when(Quotation.saveQuotation(quotationFields, 1)).done(function (bSave) {

						var oFastAppDataModel = Services.getFastAppDataModel();
						//var oQuotation = oFastAppDataModel.getProperty("/QuotationSelectedOffer");

						//check if there needs to be an update (already existing and erpost)
						$.when(Quotation.loadQuotationForSelectedOffer(quotationFields.OfferDate)).done(function (oData) {

							var oQuotation = oFastAppDataModel.getProperty("/QuotationSelectedOffer");
							//var oBankGuarantee = oFastAppDataModel.getProperty("/newBankGuarantee");

							//get updated status
							var sStatus = oFastAppDataModel.getProperty("/EditOffer/OfferStatus/STATUS");

							var enableSubmit = false;
							
							if (sStatus === "Offer Approved" && (oQuotation) ){
							//&& ((oBankGuarantee && oBankGuarantee.Status) && (oBankGuarantee.Status === 'Preliminary' || oBankGuarantee.Status === 'Confirmed'))) { //&& oQuotation.UPDATED === 1)){ //Updated is in this case always 1 (thats what we are updating here) 
								enableSubmit = true;
							}
							that.byId("btnSubmitQuotation").setEnabled(enableSubmit);

							//enable or disable download button 
							var enableDownload = false;
							if (sStatus !== "Offer Created" && (oQuotation)) { //&& oQuotation.UPDATED === 1)){ //Updated is in this case always 1 (thats what we are updating here) 
								enableDownload = true;
							}

							let oBtnDownloadQuotation = that.byId("btnDownloadQuotation");
							if(oBtnDownloadQuotation){
								oBtnDownloadQuotation.setEnabled(enableDownload);
							}

							//refresh everything
							that.onRefresh();

						});

					});
				}
			});
		},

		
		onCreateGuarantee: function (oEvent) {
			var that = this;
			let oFastAppDataModel = Services.getFastAppDataModel();
			let aCountryCurrencies = oFastAppDataModel.getProperty("/CountryCurrency");
			let oBankGuarantee = oFastAppDataModel.getProperty("/newBankGuarantee");

			if(!oBankGuarantee){
				oBankGuarantee = Services.getService('BankGuarantee').createEmptyBankGuarantee();
				oFastAppDataModel.setProperty("/newBankGuarantee/", oBankGuarantee);
			}

			//Open the dialog
			if(aCountryCurrencies !== undefined && aCountryCurrencies.length > 0){
				that._getCreateBankGuaranteeDialog().open();
			} else {
				$.when(Services.loadCountryCurrency(Services.getSelectedCountry())).done(function (oTenderData) {
					that._getCreateBankGuaranteeDialog().open();
				});
			}

		},

		onBankGuarantee: function (oEvent){
			let type = oEvent.getParameter("item").getText();

			var that = this;
			let oFastAppDataModel = Services.getFastAppDataModel();
			let aCountryCurrencies = oFastAppDataModel.getProperty("/CountryCurrency");
			let oBankGuarantees = oFastAppDataModel.getProperty("/BankGuarantees");
			let currentBankGuarantee ;

			if(oBankGuarantees.length === 0){
				currentBankGuarantee = Services.getService('BankGuarantee').createEmptyBankGuarantee(type);

			} else {
				currentBankGuarantee = oBankGuarantees.filter(bgr => bgr.Type === type)[0];

				if(!currentBankGuarantee){
					currentBankGuarantee = Services.getService('BankGuarantee').createEmptyBankGuarantee(type);
				}


			}

			oFastAppDataModel.setProperty("/newBankGuarantee/", currentBankGuarantee);

			

			//Open the dialog
			if(aCountryCurrencies !== undefined && aCountryCurrencies.length > 0){
				that._getCreateBankGuaranteeDialog().open();
			} else {
				$.when(Services.loadCountryCurrency(Services.getSelectedCountry())).done(function (oTenderData) {
					that._getCreateBankGuaranteeDialog().open();
				});
			}




			


		},

		onSaveNewBankGuarantee: function (oEvent){
			
			BusyIndicator.show();
			let oBankGuaranteeSaveInfo = Services.getFastAppDataModel().getProperty('/newBankGuarantee');
			let bUpdate = false;

			if(!oBankGuaranteeSaveInfo.Status || oBankGuaranteeSaveInfo.Status === ''){
				oBankGuaranteeSaveInfo.Status = "Open";
				oBankGuaranteeSaveInfo._sOperation = "POST";
			} else {
				if(!oBankGuaranteeSaveInfo.ID){//if new bank guarantee => POST
					oBankGuaranteeSaveInfo._sOperation = "POST";
				} else {
					oBankGuaranteeSaveInfo._sOperation = "PUT";
				}


				
				bUpdate = true;
			}

			if(Services.checkNewBankGuarantee(oBankGuaranteeSaveInfo)){
				$.when(Services.saveBankGuarantee(oBankGuaranteeSaveInfo)).done(() => {
					this._getCreateBankGuaranteeDialog().close();

					if(bUpdate === false){
						//this.byId("btnCreateBankGuarantee").setText("Edit Bank Guarantee");

						Services.getOfferCompositeMessages().push({
							type: 'Success',
							title: 'Bank Guarantee Created',
							description: 'A new bank guarantee has been created for this tender.'
						});
					} else {
						Services.getOfferCompositeMessages().push({
							type: 'Success',
							title: 'Bank Guarantee Update',
							description: 'Bank guarantee for this tender has been updated succesfully.'
					});
					}
					Services.showMessageCompositeView("Success", Services.getOfferCompositeMessages(), 'Success');
					Services.getOfferCompositeMessages().splice(0, Services.getOfferCompositeMessages().length);
				});
			} else {
				sap.m.MessageBox.error("Please enter all mandatory fields.");
			}

			$.when(Quotation.loadTenderBankGuarantee(Services.getSelectedTenderID())).done(function (oData) {
				//reload the created or updated bank guarantee
				BusyIndicator.hide();
			});

		},

		onCancelNewBankGuarantee: function (oEvent){
			let oFastAppDataModel = Services.getFastAppDataModel();
			let oBankGuarantee = oFastAppDataModel.getProperty("/newBankGuarantee");

			if(!oBankGuarantee.ID){//only delete when bankguarantee was an empty one 
				oFastAppDataModel.setProperty("/newBankGuarantee", undefined);
			}

			
			

			this._getCreateBankGuaranteeDialog().close();
		},
		
		/**
		 * New contracting dialog
		 * @returns {dialog} - oDialog
		 */
		 _getCreateBankGuaranteeDialog: function () {
			var selectedCountry = Services.getSelectedCountry();
			var dialogVersion = "";
			if(selectedCountry === 'ES'){
				dialogVersion = '_ES';
			}
			//create new dialog if not yet existing
			if (!this["_oAddNewBankGuaranteeDialog"+dialogVersion]) {

					//get dialog
					this["_oAddNewBankGuaranteeDialog"+dialogVersion] = sap.ui.xmlfragment(this.getView().getId(), "FAST_NS0FAST0.view.fragments.NewBankGuarantee"+dialogVersion, this);
					this.getView().addDependent(this["_oAddNewBankGuaranteeDialog"+dialogVersion]);
					
			}

			return this["_oAddNewBankGuaranteeDialog"+dialogVersion];
		},

		onUpdateBankGuarantee: function(oEvent){
			BusyIndicator.show();

			let that = this;
			let type = oEvent.getParameter("item").getText();
			let oFastAppDataModel = Services.getFastAppDataModel();
			let oTenderResults = oFastAppDataModel.getProperty('/ResultsForTree');
			let aCountryCurrencies = oFastAppDataModel.getProperty("/CountryCurrency");
			let oBankGuarantees = oFastAppDataModel.getProperty("/BankGuarantees");
			let currentBankGuarantee ;

			if(oBankGuarantees.length === 0){
				currentBankGuarantee = Services.getService('BankGuarantee').createEmptyBankGuarantee(type);
				

			} else {
				currentBankGuarantee = oBankGuarantees.filter(bgr => bgr.Type === type)[0];

				if(!currentBankGuarantee){
					currentBankGuarantee = Services.getService('BankGuarantee').createEmptyBankGuarantee(type);
				}


			}

			
			
		

			let wonProducts = oTenderResults.filter(res => res.OUTCOME === "Won")[0];

				if(wonProducts){
					//update the status
					currentBankGuarantee.Status = "Open";

					if(!currentBankGuarantee){
						currentBankGuarantee._sOperation = "POST";
					} else {
						currentBankGuarantee._sOperation = "PUT";
					}
					

					oFastAppDataModel.setProperty("/newBankGuarantee/", currentBankGuarantee);

					//Open the dialog
					if(aCountryCurrencies !== undefined && aCountryCurrencies.length > 0){
						that._getCreateBankGuaranteeDialog().open();
					} else {
						$.when(Services.loadCountryCurrency(Services.getSelectedCountry())).done(function (oTenderData) {
							that._getCreateBankGuaranteeDialog().open();
						});
					}
				

						} else if(!currentBankGuarantee.ID){


								sap.m.MessageToast.show("No products are won!");



							} else {

								//Ask user if he's sure to cancel the bank guarantee
								sap.m.MessageBox.warning("There are no products won. Would you like to close the bank guarantee?", {
									actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
									styleClass: "sapUiSizeCompact",
									onClose: function (sAction) {
										if (sAction === "YES") {
											currentBankGuarantee.Status = "Cancelled";
											currentBankGuarantee._sOperation = "PUT";
											if(Services.checkNewBankGuarantee(currentBankGuarantee)){
												$.when(Services.saveBankGuarantee(currentBankGuarantee)).done(() => {
														Services.getOfferCompositeMessages().push({
															type: 'Success',
															title: 'Bank Guarantee Update',
															description: 'Bank guarantee has been cancelled.'
													});
												});
											}
										} else {
											return;
										}
									}
								});



							}




			BusyIndicator.hide();
		},

		preparePriceAgreementSaveInfo: async function(oTenderResult){

			let oPriceAgreementSaveInfo = {};
			let oFastAppDataModel = Services.getFastAppDataModel();
			let oTender = oFastAppDataModel.getProperty("/EditTender/");
            let oEffectiveDateOneYr = new Date(oFastAppDataModel.getProperty("/SelectedOffer/Quotation/EffectiveDate"));
            oEffectiveDateOneYr.setFullYear(oEffectiveDateOneYr.getFullYear() + 1);

			const {
					data: {
						results: [
							financialProduct
						] = []
					} = {}
			} = await Services.getService("Product").getFinancialProduct(oTenderResult.OFFERID, Services.getSelectedCountry(), oTenderResult.PRODUCTCODE);

			oPriceAgreementSaveInfo.AwardedVolume = oTenderResult.AWARDEDQTY;
			oPriceAgreementSaveInfo.DeliveredVolume = 0; // When creating agreement, no deliveries, hence SUM(null)=0 (blank is good, too) 
			oPriceAgreementSaveInfo.ProductPackId = oTenderResult.PRODUCTCODE;
			oPriceAgreementSaveInfo.TenderId = oTender.TenderID;
			oPriceAgreementSaveInfo.OfferId = oTenderResult.OFFERID;
			oPriceAgreementSaveInfo.Currency = oTenderResult.CURRENCY;
			oPriceAgreementSaveInfo.UoM = oTenderResult.UOM;
			oPriceAgreementSaveInfo.Price = oTenderResult.AWARDEDPRICE;
			oPriceAgreementSaveInfo.hasNewMaterials = false;
			oPriceAgreementSaveInfo.CountryCode = Services.getCountryCodeofSelectedTender();
			oPriceAgreementSaveInfo.InstituteId = oTender.InstituteID;
			oPriceAgreementSaveInfo.EffectiveDate = oTender.CountryCode === 'ES' ? oFastAppDataModel.getProperty("/SelectedOffer/Quotation/EffectiveDate") : new Date();
			oPriceAgreementSaveInfo.ExpiryDate = oTender.CountryCode === 'ES' ? oFastAppDataModel.getProperty("/SelectedOffer/Quotation/ExpiryDate") : oPriceAgreementSaveInfo.ExpiryDate;
			oPriceAgreementSaveInfo.ListPrice = financialProduct.UOM === 'Pack' ? financialProduct.ConsumerPriceExclPP : financialProduct.ConsumerPriceExclPU; // ListPrice = ConsumerPrice w/o VAT
			oPriceAgreementSaveInfo.RetailPrice = financialProduct.UOM === 'Pack' ? financialProduct.MaxPriceNhsPP : financialProduct.MaxPriceNhsPU; // RetailPrice = MaxPrice for NHS w/o VAT;
			oPriceAgreementSaveInfo.Discount = financialProduct.AdditionalDiscount;
            oPriceAgreementSaveInfo.ExtendPriceAgreement = oTender.Classification === 'Commercial Agreement' && oFastAppDataModel.getProperty("/SelectedOffer/Quotation/ExpiryDate").toISOString() >= oEffectiveDateOneYr.toISOString() ? true : false;
            oPriceAgreementSaveInfo.ExpiryExtensionPeriod = oTender.Classification === 'Commercial Agreement' && oFastAppDataModel.getProperty("/SelectedOffer/Quotation/ExpiryDate").toISOString() >= oEffectiveDateOneYr.toISOString() ? 12 : 0;


			// Spain only 
			if(Services.getSelectedCountry() === "ES"){
				// This information is already present in the PriceConditions entity for Spain
				oPriceAgreementSaveInfo.ListPrice = null;
				oPriceAgreementSaveInfo.RetailPrice = null;
				oPriceAgreementSaveInfo.Discount = null;
			}


			return oPriceAgreementSaveInfo;
		},

		//EHQUT-199069-Italy – Competitor results not linked to Bayer products/offers
		onCreatePriceAgreement: async function (oEvent) {

			//get model & selected row
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();
			const offerProducts = oFastAppDataModel.getProperty("/ProductsForOffer/results")?.filter(product => product.ActiveProduct !== 2);
			const tenderResults = oFastAppDataModel.getProperty("/ResultsForTree/");
			const offerValidation = oFastAppDataModel.getProperty("/OfferValidation/");

			const sPath = oEvent.oSource.getParent().oBindingContexts.fastAppData.sPath;

			var oOutcomeTreeTable = this.byId(this.getView().getId() + "--tenderResultsFragmentId" +"--idOutcomeTable");
			var iRowIndex = sPath.split('/')[2];
			var oRowContext = tenderResults[iRowIndex];

			//check if a product is selected
			if (oRowContext === null) {
				sap.m.MessageToast.show("Select an awarded product to create a price agreement");
				return;
			}
			if(oRowContext.AWARDEDCOMPANY==='Bayer'){
			const oSelectedProduct = offerProducts[iRowIndex];
			const selectedProductType = oSelectedProduct.SKU.ProductType;
			var oLoadedPriceAgreement = oSelectedProduct.PriceAgreement;

			
			// TODO: check if this only applies to Spain
            // CHANGE: instead of checking on selectedProductType, the check should check whether or not the main price condition is "Rental"
            //         if it's a rental condition, the error should be shown. Otherwise, the PA can be created
			if (oSelectedProduct.CountryCode === "ES" && oSelectedProduct.PriceCondition.results.find(condition => condition.PriceConditionClassification.ConditionType === "Rental")){
				sap.m.MessageToast.show("No price agreement can be created for Rental");
				return;
			}
		

			if(oLoadedPriceAgreement){
				// window.open("http://localhost:8080/landingspage/webapp/index.html#/tender&/t/detail/CL/" + oTender.tenderID + "//__component0---tenderManagementDetailId--basicInformationId//TwoColumnsMidExpanded");
				window.open("/app/#/priceagreements&/pa/PriceAgreements/" + oLoadedPriceAgreement.ID);
			} else {
				
				const rowProductCode = oRowContext.PRODUCTCODE;
				const offerProduct = offerProducts.find(prd => prd.ProductCode === rowProductCode);
				const offerType = offerProduct.OfferType;

				// Only selling type can be synchronised with SAP and 
				// therefore only allow creating price agreements for selling offer type products! 
				if(offerType !== "Selling" && Services.getSelectedCountry() !== 'ES'){
					sap.m.MessageBox.error("Only products with OfferType 'Selling' are allowed to create a price agreement.");
					return;
				}

				//var sPathSelectedRow = oRowContext.getPath();
				let oSelectedTenderResult = oRowContext;

				if (oSelectedTenderResult.OUTCOME !== "Won"){
					//message that you should
					sap.m.MessageToast.show("The product you have selected has not been won");
				} else {
					BusyIndicator.show();
					var oPriceAgreementSaveInfo = oSelectedProduct.PriceAgreement;

					if(!oPriceAgreementSaveInfo){
						oPriceAgreementSaveInfo = await this.preparePriceAgreementSaveInfo(oRowContext);
						oPriceAgreementSaveInfo._sOperation = "POST";
					} else {
						oPriceAgreementSaveInfo._sOperation = "PUT";
					}

					const priceAgreement = await Services.savePriceAgreement(oPriceAgreementSaveInfo);
					const priceAgreementID = priceAgreement[0].ID;

					// add PriceAgreementID to PriceCondtions
					if(priceAgreementID){
						const priceConditions = offerProduct.PriceCondition.results
						const savePriceConditionPromises = priceConditions.map(condition => {
							condition.PriceAgreement_ID = priceAgreementID;
							const priceConditionSaveObject = Services.getService("PriceCondition").convertToSaveObject(condition,"ResultsPage");
							return Services.getService("PriceCondition").upsertPriceCondition(priceConditionSaveObject);
						});
						await Promise.all(savePriceConditionPromises);
					}

					//reload offer data
					await Services.loadProductDataForOffer(offerProduct.OfferID);

					//refresh everything
					that.onRefresh();

					BusyIndicator.hide();
				}
			}
		}else{
			sap.m.MessageBox.error("No price agreement can be created for this product");
		}
		},
    //EHQUT-199069-Italy – Competitor results not linked to Bayer products/offers

	onSubmitQuotation: function (oEvent) {

		//that is this
		var that = this;
		var oFastAppDataModel = Services.getFastAppDataModel();

		$.when(Services.checkOfferStatus()).done(function (oData) {
			var aStatusNoEdit = [
				"Awaiting Approval" //,
			];
			if ($.inArray(oData.STATUS, aStatusNoEdit) !== -1) {
				sap.m.MessageBox.warning("Quotation cannot be submitted, offer is awating approval.", {});
			} else {
				//keep the latest state of switch delay in submission
				let oDelayInSubmission = that.getView().byId("idDelayInSubmission");
				if(oDelayInSubmission){
					var bDelayInSubmission = oDelayInSubmission.getState();
				}

				//keep delay in submission (needed when you don't click on the switch first)
				if (bDelayInSubmission) {
					//true
					Quotation.setDelayInSubmission('Yes');
				} else {
					//false
					Quotation.setDelayInSubmission('No');
				}

				let oCustomRemark = that.byId("idCustomRemark");
				let oSelectIssuedBy = that.byId("idSelectIssuedBy");
				let oSelectCompanyStamp = that.byId("idSelectCompanyStamp");

				var quotationFields = {
					OfferDate: oFastAppDataModel.getProperty("/OfferValidation/OFFERDATE"),
					OfferValidity: oFastAppDataModel.getProperty("/OfferValidation/OFFERVALIDITY"),
					EffectiveDate: oFastAppDataModel.getProperty("/OfferValidation/EffectiveDate"),
					ExpiryDate: oFastAppDataModel.getProperty("/OfferValidation/ExpiryDate"),
					CustomRemark: oCustomRemark ? that.byId("idCustomRemark").getValue() : '',
					IssuedBy: oSelectIssuedBy ? that.byId("idSelectIssuedBy").getSelectedKey() : '',
					CompanyStamp: oSelectCompanyStamp ? that.byId("idSelectCompanyStamp").getSelectedKey() : '',
				};

				//do the save of the quotation
				$.when(Quotation.submitQuotation(quotationFields)).done(function (oSaveStatus) {
					//refresh everything
					that.onRefresh();
				});
			}
		});
	},

		onEmailQuotation: function (oEvent) {	
			BusyIndicator.show(0);		
			this._getEmailQuotationDialog().open();
		},

		
		/**
		 * New email dialog
		 */
		 _getEmailQuotationDialog : function () {
			
			var oFastAppDataModel = Services.getFastAppDataModel();
			var sRecipient = oFastAppDataModel.getProperty('/SelectedOffer/Distributor/CONTACT_EMAIL');
			var sSubject = 'Quotation for offer ' + oFastAppDataModel.getProperty('/Tender/TenderName');

			if (this._EmailQuotationDialog) {
				this._EmailQuotationDialog.destroy();
			}

			//create new dialog if not yet existing
			//if (!this._EmailQuotationDialog) {

					//get dialog
					this._EmailQuotationDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.QuotationMail", this);
				  	this.getView().addDependent(this._EmailQuotationDialog);
					
			//}

			Services.getMailTemplate(Services.getCountryCodeofSelectedTender(), "ES", Services.getSelectedOfferID()).then(template => {

				//get screen elements
				let oRecipients = sap.ui.getCore().byId("idTo");
				let oSubject = sap.ui.getCore().byId("idSubject");
				let oSender = sap.ui.getCore().byId("idFrom");
				let sSender = UserInfo.getUserEmail();
				let oEditor = sap.ui.getCore().byId("idEditor");
				
				oEditor.setValue(template.value);
				oSubject.setValue(sSubject);

				oRecipients.setTokens([
					new Token({text: sRecipient, key: sRecipient}),
				]);

				oSender.setTokens([
					new Token({text: sSender, key: sSender}),
				]);

				// add validator
				let fnValidator = function(args){
					let text = args.text;

					return new Token({key: text, text: text});
				};

				oRecipients.addValidator(fnValidator);
				oSender.addValidator(fnValidator);

				BusyIndicator.hide();
			}).catch(error => {
				console.log("Error retrieving mail template");
			});
			

			return this._EmailQuotationDialog;

		},

		_onSaveQuotation: function (oEvent) {
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			let oCustomRemark = that.byId("idCustomRemark");
			let oSelectIssuedBy = that.byId("idSelectIssuedBy");
			let oSelectCompanyStamp = that.byId("idSelectCompanyStamp");

			var quotationFields = {
				OfferDate: oFastAppDataModel.getProperty("/OfferValidation/OFFERDATE"),
				OfferValidity: oFastAppDataModel.getProperty("/OfferValidation/OFFERVALIDITY"),
				EffectiveDate: oFastAppDataModel.getProperty("/OfferValidation/EffectiveDate"),
				ExpiryDate: oFastAppDataModel.getProperty("/OfferValidation/ExpiryDate"),
				CustomRemark: oCustomRemark ? this.byId("idCustomRemark").getValue() : '',
				IssuedBy: oSelectIssuedBy ? this.byId("idSelectIssuedBy").getSelectedKey() : '',
				CompanyStamp: oSelectCompanyStamp ? this.byId("idSelectCompanyStamp").getSelectedKey() : '',
			};

			//keep selected offer
			var sOfferID = Services.getSelectedOfferID();
			var sOfferPath = Services.getSelectedOfferPath();
			
			var effectiveDateValueState = oFastAppDataModel.getProperty("/OfferValidation/EffectiveDateValueState");
			var expiryDateValueState = oFastAppDataModel.getProperty("/OfferValidation/ExpiryDateValueState");
			if(effectiveDateValueState === 'Error' || expiryDateValueState === 'Error' || quotationFields.EffectiveDate > quotationFields.ExpiryDate){
				MessageBox.error("Make sure effective date and expiry date are valid! Effective date needs to be in the future and not after the expiry date.");
				return;
			}
			//if it comes at this place, we already checked if dates are in error or not correct match
			//this allows us to just check for the warning: if expiry date is more tFhan 12 months after effective date. 
			let warningDate = new Date(quotationFields.EffectiveDate.getTime());
            warningDate = new Date(warningDate.setFullYear(warningDate.getFullYear() + 1));
			if(warningDate < quotationFields.ExpiryDate && ( warningDate.getMonth() < quotationFields.ExpiryDate.getMonth() || warningDate.getFullYear() < quotationFields.ExpiryDate.getFullYear() ) && Services.getLoadedTender().Classification === "Commercial Agreement"){
				MessageBox.error("Agreement is set for more than 12 months");
				return;
			}

            //old code wouter - replaced for ticket https://trello.com/c/svXScOwQ
			/*warningDate = warningDate.setFullYear(warningDate.getFullYear() + 1);
			if(warningDate < quotationFields.ExpiryDate){
				MessageBox.warning("Warning, agreement is set for more than 12 months", {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.OK,
					onClose: function (action) {
						if(action === MessageBox.Action.OK) that._onSaveQuotationToBackend(quotationFields);
					}
				});
				return;
			}*/
			this._onSaveQuotationToBackend(quotationFields);

		},
		_onSaveQuotationToBackend:function(quotationFields){
			var that = this;
             // make sure selectedOfferPath is correctly set
             if(Services.getSelectedOfferPath() === "" || Services.getSelectedOfferPath().includes("results")){
                Services.setSelectedOfferPath(Services.getDefaultModel().createKey("/PT_TMOFRS", {
                    OfferID: Services.getSelectedOfferID()
                }))
            }

			//do the save of the quotation
			$.when(Quotation.saveQuotation(quotationFields, 0)).done(function (oSaveStatus) {
				//Refresh (beceause offer is reselected in onRefresh as well)
				that.onRefresh();

			});

			this.onEditToggleButtonPress();
		},

		onSendQuotationMail: function (oEvent){

			let sRecipients = "";
			let sSubject = sap.ui.getCore().byId('idSubject').getValue();
			let sMailBody = sap.ui.getCore().byId('idEditor').getValue();
			let aRecipients = sap.ui.getCore().byId('idTo').getTokens();
			let sSenders = sap.ui.getCore().byId('idFrom').getTokens();
			aRecipients.forEach(recipient => sRecipients += recipient.getProperty('text') + ';')

			let oMail = {
				"CountryCode": Services.getSelectedCountry(),
				"TenderID": Services.getSelectedTenderID(),
				"OfferID": Services.getSelectedOfferID(),
				"Sender":sSenders[0].getProperty('text'),
				"Recipients":sRecipients,
				"Subject":sSubject,
				"MailBody":sMailBody,
				"Sent":false,
			}

			Services.sendMail(oMail)
				.then(() => {
					this._EmailQuotationDialog.destroy();
					Services.getOfferCompositeMessages().push({
						type: 'Success',
						title: 'Mail sent successfully',
						description: 'Mail sent successfully'
					});
					Services.showMessageCompositeView("Success", Services.getOfferCompositeMessages(), 'Success');
				})
				.catch(function (oError) {
					//show error message
					Services.showErrorMessage(oError, "Sending mail");
				});
		},

		onCancelQuotationMail: function (oEvent){
			this._EmailQuotationDialog.destroy();
		},

		onMCEEditorLoaded: function(oEvent){
			//get the editor
			let oMCEEditor = sap.ui.getCore().byId('idEditor');
			oMCEEditor.addButtonGroup("styleselect").addButtonGroup("table");
		},

		//TENDER RESULTS TAB
		//-------------------

		//Method for loading products for offer + so edit can be done for PT_TMTRRES
		//TODO: remove logic to retrieve data for original outcome table 

		  //EHQUT-199069-Italy – Competitor results not linked to Bayer products/offers
		  onTenderResultsOfferPress: async function (oEvent) {

			//that = this
			var that = this;

			if (oEvent) { //if you enter this method from the edit button, the oEvent is empty & offer path is already set
				var sSelectedOfferPath = oEvent.getSource().getBindingContext("fastData").getPath();
				Services.setSelectedOfferPath(sSelectedOfferPath);
			} else {
				var sSelectedOfferPath = Services.getSelectedOfferPath();
			}

			//getting selected offer on the new way.
			var sSelectedOfferID = Services.getSelectedOfferID(); //this.getView().getModel("fastData").getProperty(sSelectedOfferPath).OfferID;

			//Get offer table + column from where we can check if offer is valid for tab
			//var oOffersTable = that.getView().byId("tenderResultsOfferTableViewID");
			//var iIndexColumnOfferID = this.getView().byId("tenderResultsOfferTableOfferID").getOrder();

			//check if offer is selected & valid for current tab (page section)
			//if(sSelectedOfferID && Services.checkOfferValidForTab(sSelectedOfferID, iIndexColumnOfferID, oOffersTable)){
			if (sSelectedOfferID && Services.checkOfferVisibleForTab(Services.getLoadedOffer(Services.getSelectedOfferID()), Services.getTenderResultsPageSectionID())) {

				//indicate that tree table is loading
				var oOutcomeTreeTable = this.byId(this.getView().getId() + "--tenderResultsFragmentId" +"--idOutcomeTable");
				oOutcomeTreeTable.setBusy(true);

				//Product path
				var sProductPath = sSelectedOfferPath + "/Product";

				//Services.setSelectedOfferID(sSelectedOfferID);

				//if you click on an offer it is available (sometimes it is not availble when you switch between tabs)
				Services.setSelectedOfferAvailable(true);
				//hide offer table so there is more space on the screen
				/*
				if(sSelectedOfferID){
					that.getView().byId("panelTenderResultsOfferTableID").setExpanded(false);
				}
				*/

				//get products that are loaded
				var aProducts = Services.getLoadedProductsForOffer(sSelectedOfferID);
				var ProductCodeCollection=[];
				for (var i=0;i<aProducts.results.length; i++){
					
					ProductCodeCollection.push(aProducts.results[i].ProductCode);
				}
				

				var CompetitorData=await Services.loadOtherCompetitorresult(ProductCodeCollection,sSelectedOfferID);

				//catch all promises in an array
				let promises = [];

				//build dynamic list for outcome reasons
				aProducts.results.forEach(function (oProduct, iIndex) {
					/*
					promises.push($.when(Services.loadCompetitorResults(sSelectedOfferID, oProduct.ProductCode, iIndex)).done(function(oCompetitorResultsNew){
						var oCompetitors = oCompetitorResultsNew;
					}));
					*/
					//loop at each result to check outcome & corresponding reasons
					oProduct.Results.results.forEach(function (oResult) {

						//TODO localy keep all outcome results and select localy correct values from list

						//load outcome reasons for bayer product results
						promises.push($.when(Services.loadOutcomeReasons(oResult.Outcome, iIndex)).done(function (oOutcomeReasons) {
							//keep list of outcome reasons with the correct product (Product & Results = 1 to 1)
							//aProducts.results[oOutcomeReasons.index].Results.results[0].ListOutcomeReasons = oOutcomeReasons.results;
							oResult.ListOutcomeReasons = oOutcomeReasons.results;

						}));

						//load outcome reasons for competitor results
						if (oResult.CompetitorResult && oResult.CompetitorResult.results) {
							//for each competitor in product result
							oResult.CompetitorResult.results.forEach(function (oCompetitorResult) {
								promises.push($.when(Services.loadOutcomeReasons(oCompetitorResult.OUTCOME, iIndex)).done(function (oOutcomeReasonsComp) {
									//keep list of outcome reasons with the correct product (Product & Results = 1 to 1)
									oCompetitorResult.ListOutcomeReasons = oOutcomeReasonsComp.results;

								}));
							});
						}

					});

				});
				CompetitorData.data.results.forEach(function (oProduct, iIndex) {

					
						promises.push($.when(Services.loadOutcomeReasons(oProduct.OUTCOME, iIndex)).done(function (oOutcomeReasonsComp) {
							//keep list of outcome reasons with the correct product (Product & Results = 1 to 1)
							oProduct.ListOutcomeReasons = oOutcomeReasonsComp.results;

						}));
					
					
		})
				//load currency for country (dropdown)
				var sCountry = Services.getSelectedCountry();
				promises.push($.when(Services.loadCountryCurrency(sCountry)).done(function (oTenderData) {
					//do nothing
				}));

				//if all promises pushed from the loop have received their answer
				Promise.all(promises).then((result) => {
					//TODO Is this still needed? we now use /ResultsForProducts (but maybe for the other tabs Delivery track or quoatation?
					var oFastAppDataModel = Services.getFastAppDataModel();
					oFastAppDataModel.setProperty("/ProductsForOffer/", aProducts);

					//empty array 
					var aResultsForProducts = [];
					var aResultsForTree = [];
					let aCountryCompetitors = oFastAppDataModel.getProperty('/CountryCompetitors');
					let aCountryCompetitorProducts = oFastAppDataModel.getProperty('/CountryCompetitorProducts')

					aProducts.results.forEach(function (oProduct, iIndex) {

						//Product must be active to be shown in the tree-table (this filtering can not be done in view, beceause of bug in standard SAPUI5 for tree table https://github.com/SAP/openui5/issues/1822)
						if (oProduct.Active === 1 && oProduct.ActiveProduct !== 2) {

							//are there results
							if (oProduct.Results && oProduct.Results.results.length > 0) {
								
								let results = oProduct.Results.results;

								// Brazil - Filter for LotID if it exists
								if(sCountry === "BR" && oProduct.Results.results[0].LotID){
									results = results.filter(r => r.LotID == oProduct.LotID);
								}

								results.forEach(function (oResult) {
									//Results, repeat product for each result
									var oResultsForProducts = {
										oProduct: {},
										oResult: {}
									};
									//add product
									oResultsForProducts.oProduct = oProduct;
									oResultsForProducts.oResult = oResult;
									aResultsForProducts.push(oResultsForProducts);

									//build tree
									if (oResult.CompetitorResult && oResult.CompetitorResult.results) {
										var aCompetitorResult = [];

										//for each competitor in product result
										oResult.CompetitorResult.results.forEach(function (oCompetitorResult) {

											let oFastAppDataModel = Services.getFastAppDataModel();
											
											//default reason if empty & edit mode
											/*if( (oCompetitorResult.OUTCOME === 'Won' || oCompetitorResult.OUTCOME === 'Lost') && (oCompetitorResult.REASON === '' || oCompetitorResult.REASON === 'Not Specified') ){
												oCompetitorResult.REASON = 'Not Specified';
											} else {
												oCompetitorResult.REASON = oCompetitorResult.REASON;
											}*/
                                            //EHQUT-OTT-118849-Making decision pending as default
                                            if(oCompetitorResult.OUTCOME=='' && sCountry=='IT')
                                            {
                                                oCompetitorResult.OUTCOME='Decision Pending';
                                            }
											//EHQUT-218727-Requested Volume Field for competitor result
											if(sCountry !== "IT"){
												oCompetitorResult.REQUESTEDVOLUME =null;
											}
                                            //EHQUT-OTT-118849-Making decision pending as default
											var oCompetitorResultForView = {
												OFFERID: oCompetitorResult.OFFERID,
												PRODUCTCODE: oCompetitorResult.PRODUCTCODE,
												PRODUCT: oCompetitorResult.AWARDEDPRODUCT,
												OUTCOME: oCompetitorResult.OUTCOME,
												UOM: oCompetitorResult.UOM,
												REQUESTEDVOLUME: oCompetitorResult.REQUESTEDVOLUME,
												AWARDEDQTY: oCompetitorResult.AWARDEDQTY,
                                                TOTALAWARDEDVALUE: oCompetitorResult.TOTALAWARDEDVALUE,
												REASON: oCompetitorResult.REASON,
												COMMENT: oCompetitorResult.COMMENT,
												AWARDEDCOMPANY: oCompetitorResult.AWARDEDCOMPANY,
												AWARDEDCOMPANYCOMP: aCountryCompetitors.find(company => company.CompetitorCompany === oCompetitorResult.AWARDEDCOMPANY) ? oCompetitorResult.AWARDEDCOMPANY : 'Other',
												OTHERCOMPANY: oCompetitorResult.AWARDEDCOMPANY,
												AWARDEDPRODUCT: oCompetitorResult.AWARDEDPRODUCT,
												PRODUCTCOMP: aCountryCompetitors.find(product => product.CompetitorProduct === oCompetitorResult.AWARDEDPRODUCT) ? oCompetitorResult.AWARDEDPRODUCT : 'Other',
												OTHERPRODUCT: oCompetitorResult.AWARDEDPRODUCT,
												AWARDEDPRICE: oCompetitorResult.AWARDEDPRICE,
												FOC: oProduct.Price.FOC,
												FOCTYPE: oProduct.Price.FOCType,
												FOC_ABS_PCT: oProduct.Price.FOC_ABS_PCT,
												UNITPERPACK: oProduct.UnitPerPack,
												CURRENCY: oCompetitorResult.CURRENCY,
												LISTOUTCOMEREASONS: oCompetitorResult.ListOutcomeReasons,
												CountryCompetitorProducts: aCountryCompetitorProducts,
												_sOperation: "PUT", //PUT beceause its an existing competitor result in the back-end
											}
											aCompetitorResult.push(oCompetitorResultForView);
										});
									}
									//EHQUT-202917-MEA - awarded quantity blank
									//Bayer product that will be saved in PT_TMTRRES
									/* when awarded QTY is not yet filled, it will take the requested volume as default value*/
									var oFastAppDataModel = Services.getFastAppDataModel();
			                        let Region=oFastAppDataModel.oData.Tender.Country.Region;
									if(Region === 'MEA'){
										if (oResult.AwardedQty === "") {
											var sAwardedQtyBayer = "";
										} else {
											sAwardedQtyBayer = oResult.AwardedQty;
										}
									}else{
										if (oResult.AwardedQty === "") {
											var sAwardedQtyBayer = oProduct.RequestedVolume;
										} else {
											sAwardedQtyBayer = oResult.AwardedQty;
										}
									}
									
                                    //EHQUT-202917-MEA - awarded quantity blank
									//default reason if empty & edit mode
									/*if( (oResult.Outcome === 'Won' || oResult.Outcome === 'Lost') && (oResult.Reason === '' || oResult.Reason === 'Not Specified') ){
										oResult.Reason = 'Not Specified';
									} else {
										oResult.Reason = oResult.Reason;
									}*/

									//offerprice not always existing
									var iAwardedPrice = null;
                                    let iPriceCondition = null;
									if (oProduct && oProduct.Price && oProduct.Price.OfferPrice) {
										iAwardedPrice = oProduct.Price.OfferPrice;
									}
                                    if(Services.getSelectedCountry().indexOf("ES") > -1){

                                        let priceConditionObject = oProduct?.PriceCondition?.results?.find( cond => cond?.PriceConditionClassification?.isMain);
                                        iPriceCondition = priceConditionObject?.PriceConditionClassification?.ConditionType;
                                        switch(iPriceCondition) {
                                            case "PVL":
                                                let instType = Services.getFastAppDataModel().getProperty("/Tender/Institute/InstituteType");

                                                if (instType === 'Public Account' || instType === 'Region(s)' || instType === 'National'){

                                                    iAwardedPrice = priceConditionObject.ConfidentialPrice * ( 1- (priceConditionObject.RoyalDecreePercentage?.Percentage || 0));

                                                } else {
                                                    iAwardedPrice = priceConditionObject.PVL;
                                                }

                                              break;
                                            case "Rental":
                                                iAwardedPrice = priceConditionObject.MonthlyRentPerUnit;
                                              break;
                                            default:
                                              // code block
                                          }
    

                                    }

									// Brazil only
									if(Services.getSelectedCountry().indexOf("BR") > -1){
										const commercialProposal = oProduct.PriceCondition.results[0].CommercialProposal;
										iAwardedPrice = commercialProposal; 
                                    }
                                    
                                    

                                    //EHQUT-OTT-118849-Making decision pending as default
                                    if(oResult.Outcome=='' && sCountry=='IT')
                                    {
                                        oResult.Outcome='Decision Pending';
                                    }
                                    //EHQUT-OTT-118849-Making decision pending as default
									var oBayerProduct = {
										CONTRACT_NO: oResult.ContractNo,
										OFFERID: oProduct.OfferID,
										PRODUCTCODE: oProduct.ProductCode,
										PRODUCT: oProduct.SKU.PRODUCTPACKNAME,
										ERRORINSUBMISSION: oResult.ErrorInSubmission,
										OUTCOME: oResult.Outcome,
										//UOM: oResult.UoM,
										UOM: oProduct.UnitPerPack,
										//AWARDEDQTY: oResult.AwardedQty,
										//AWARDEDQTY: oProduct.RequestedVolume,
										REQUESTEDVOLUME: oProduct.RequestedVolume,
										AWARDEDQTY: sAwardedQtyBayer,
										REASON: oResult.Reason,
										COMMENT: oResult.Comment,
										AWARDEDCOMPANY: "Bayer",
										AWARDEDPRODUCT: oProduct.SKU.PRODUCTPACKNAME,
										AWARDEDPRICE: iAwardedPrice,
										FOC: oProduct.Price.FOC,
										FOCTYPE: oProduct.Price.FOCType,
										FOC_ABS_PCT: oProduct.Price.FOC_ABS_PCT,
										UNITPERPACK: oProduct.UnitPerPack,
										//CURRENCY: oResult.Currency,
										CURRENCY: oProduct.Offer.Currency,
										LISTOUTCOMEREASONS: oResult.ListOutcomeReasons,
										OutcomeLevel: aCompetitorResult,
										//italy
										ExtensionDate: oResult.ExtensionDate,
										ExtensionNotes: oResult.ExtensionNotes,
										AwardLetterNo: oResult.AwardLetterNo,
										AwardDelibNo: oResult.AwardDelibNo,
										DeliveryDate: oResult.DeliveryDate,
										ResultDate: oResult.ResultDate,
										AwardDate: oResult.AwardDate,
										AwardActing: oResult.AwardActing,
										PriceAgreement: oProduct.PriceAgreement,
                                        APPEAL:(!oResult.Appeal ? "No" : oResult.Appeal) ,
                                        INFONEEDED:(!oResult.InfoNeeded ? "No" : oResult.InfoNeeded),
                                        TOTALAWARDEDVALUE: oResult.TotalAwardedValue,
										_sOperation: oResult._sOperation, //we don't save, or update bayer results at this moment, but maybe in future, at this moment we need same fields for display
                                        PriceCondition: iPriceCondition,
										LotID: oProduct.LotID
                                    }

									var oResultsForTree = {
										OutcomeLevel: oBayerProduct
									}

									aResultsForTree.push(oResultsForTree.OutcomeLevel);
									

								});

							} else {
								//never happens? beceause we always add an empty result when loading ProductsForOffers
							}

						}

					});
					

					
					for (var i=0;i<CompetitorData.data.results.length; i++){

						var value =CompetitorData.data.results[i];
						if((value.OUTCOME ===null || value.OUTCOME ==='') && sCountry=='IT')
						{
							value.OUTCOME='Decision Pending';
						}
						
						var oCompetitorResult = {
							OFFERID: value.OFFERID,
							PRODUCTCODE: value.PRODUCTCODE,
							PRODUCT: value.AWARDEDPRODUCT,
							OUTCOME: value.OUTCOME,
							UOM: value.UOM,
							REQUESTEDVOLUME: value.REQUESTEDVOLUME,
							AWARDEDQTY: value.AWARDEDQTY,
							TOTALAWARDEDVALUE: value.TOTALAWARDEDVALUE,
							REASON: value.REASON,
							COMMENT: value.COMMENT,
							AWARDEDCOMPANY: value.AWARDEDCOMPANY,
							AWARDEDCOMPANYCOMP: aCountryCompetitors.find(company => company.CompetitorCompany === value.AWARDEDCOMPANY) ? value.AWARDEDCOMPANY : 'Other',
							OTHERCOMPANY: value.AWARDEDCOMPANY,
							AWARDEDPRODUCT: value.AWARDEDPRODUCT,
							PRODUCTCOMP: aCountryCompetitors.find(product => product.CompetitorProduct === value.AWARDEDPRODUCT) ? value.AWARDEDPRODUCT : 'Other',
							OTHERPRODUCT: value.AWARDEDPRODUCT,
							AWARDEDPRICE: value.AWARDEDPRICE,
							FOC: '',
							FOCTYPE: '',
							FOC_ABS_PCT: '',
							UNITPERPACK: '',
							CURRENCY: value.CURRENCY,
							LISTOUTCOMEREASONS: value.ListOutcomeReasons,
							CountryCompetitorProducts: aCountryCompetitorProducts,
							_sOperation: "PUT", //PUT beceause its an existing competitor result in the back-end
						}
						
						aResultsForTree.push(oCompetitorResult);
					}
				
	               
					oFastAppDataModel.setProperty("/ResultsForProducts/", aResultsForProducts);
					oFastAppDataModel.setProperty("/ResultsForTree/", aResultsForTree);

					//Enable Create contract button only for Brazil
					const enableCreateContractButton = aResultsForTree.some((elem) => elem.OUTCOME === "Won");
					Services.getFastAppDataModel().setProperty("/CreateContractButtonEnabled_BR", enableCreateContractButton);

					//apply filter for outcome tree table
					oOutcomeTreeTable.getBinding("rows").filter(
						new Filter({
							path: "_sOperation",
							operator: "NE",
							value1: "DELETE",
						})
					);
					oOutcomeTreeTable.setBusy(false);

				})

			}

		},
		//collapse hyrarchie of tree table
		onCollapseOutcome: function () {
			var oOutcomeTreeTable = this.byId(this.getView().getId() + "--tenderResultsFragmentId" +"--idOutcomeTable");
			oOutcomeTreeTable.collapseAll();
		},

		//Expand hyrarchie of tree table
		onExpandOutcome: function () {
			var oOutcomeTreeTable = this.byId(this.getView().getId() + "--tenderResultsFragmentId" +"--idOutcomeTable");
			oOutcomeTreeTable.expandToLevel(1);
		},
		//EHQUT-199069-Italy – Competitor results not linked to Bayer products/offers 
		onDeleteCompetitorProduct: function (oEvent) {

			//get model & selected row
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oOutcomeTreeTable = this.byId(this.getView().getId() + "--tenderResultsFragmentId" +"--idOutcomeTable");
			var iRowIndex = oOutcomeTreeTable.getSelectedIndex();
			var oRowContext = oOutcomeTreeTable.getContextByIndex(iRowIndex);
			
			//check if a product is selected
			if (oRowContext === null) {
				sap.m.MessageToast.show("Select an awarded product to delete");
				return;
			}

			var sPathSelectedRow = oRowContext.getPath();
			var iRowIndexParent = sPathSelectedRow.split('/')[2];

			var sPathResultsForTree = "/ResultsForTree";
			
			var oAwardedProduct = Services.getFastAppDataModel().getProperty(sPathSelectedRow);
			if(oAwardedProduct.AWARDEDCOMPANY !== "Bayer"){
			
			if (oAwardedProduct._sOperation === "PUT") {
				
				oAwardedProduct._sOperation = "DELETE";
				oFastAppDataModel.setProperty(sPathSelectedRow, oAwardedProduct);
			} else {
				
				var aResultsForTreeAwarded = oFastAppDataModel.getProperty(sPathResultsForTree);
					
				aResultsForTreeAwarded.splice(iRowIndexParent, 1);
					
				oFastAppDataModel.setProperty(sPathResultsForTree, aResultsForTreeAwarded);
			}
					
		}else{
			sap.m.MessageToast.show("Select an awarded product other than bayer to delete");
				return;
		}	

			

		},
		//add awarded company results
		onAddAwardedProduct: function (oEvent) {

			//get model & selected row
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oOutcomeTreeTable = this.byId(this.getView().getId() + "--tenderResultsFragmentId" +"--idOutcomeTable");
			var iRowIndex = oOutcomeTreeTable.getSelectedIndex();
			var oRowContext = oOutcomeTreeTable.getContextByIndex(iRowIndex);
			

			//check if a product is selected
			if (oRowContext === null) {
				sap.m.MessageToast.show("Please first select the line where you want to add a product...");
				return;
			}

			let sCountry = oFastAppDataModel.getProperty('/Tender/CountryCode');
			let sProductCode = oFastAppDataModel.getProperty(oRowContext.sPath + '/PRODUCTCODE');

			$.when(Services.loadCountryCompetitors(sCountry, sProductCode)).done(function () {

				//get path of selected product (This can be a Bayer product or an Awarded product)
				var sPathSelectedRow = oRowContext.getPath();

				//check if selected product is an awarded product (the path includes OutcomeLevel/xx)
				if(sPathSelectedRow.includes("/OutcomeLevel")){ 
					//get path of parent (BayerProduct)
					sPathSelectedRow = sPathSelectedRow.substring(0,sPathSelectedRow.indexOf("/OutcomeLevel"));
				}

				//get main path for the rewarded 
				var sPathSelectedRowSubLevel = sPathSelectedRow + "/OutcomeLevel";
				var aCompetitorsForSelectedRow = oFastAppDataModel.getProperty(sPathSelectedRowSubLevel);
				if (!aCompetitorsForSelectedRow) {
					aCompetitorsForSelectedRow = [];
				}

				//Add new awarded product
				var oBayerProduct = Services.getFastAppDataModel().getProperty(sPathSelectedRow);
				var oNewRewardedProduct = Services.getService('Product').getEmptyProductResult();
                //EHQUT-OTT-118849-Making decision pending as default
                if(sCountry=='IT'){
                    oNewRewardedProduct.OUTCOME='Decision Pending';
                    }
                //EHQUT-OTT-118849-Making decision pending as default
				//fill necesary data
				oNewRewardedProduct.OFFERID = oBayerProduct.OFFERID;
				oNewRewardedProduct.PRODUCTCODE = oBayerProduct.PRODUCTCODE;
				aCompetitorsForSelectedRow.push(oNewRewardedProduct);
				oFastAppDataModel.setProperty(sPathSelectedRowSubLevel, aCompetitorsForSelectedRow);

				//clear competitorProducts, as such that initially, an awarded company should be selected
				//TODO JVDB: clear dropdown, not model
				//oFastAppDataModel.setProperty('/CountryCompetitorProducts', []);
			});
		},

		onChangeAwardedProductCompetitor: function(oEvent){
			//get model & selected row
			let oFastAppDataModel = Services.getFastAppDataModel();
			let oProductDrop = oEvent.getSource();
			let sBindingPath = oProductDrop.getBindingContext("fastAppData").getPath();
			let oProductLevel = oFastAppDataModel.getProperty(sBindingPath);
			let sBindingPathSet = sBindingPath + '/PRODUCT';
			
			//check if a product is selected
			if (oProductLevel === null) {
				return;
			}

			oFastAppDataModel.setProperty(sBindingPathSet, oProductLevel.PRODUCTCOMP);
		},

		onChangeAwardedCompanyCompetitor: function(oEvent){
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oOutcomeDrop = oEvent.getSource();
			var sBindingPath = oOutcomeDrop.getBindingContext("fastAppData").getPath();
			let oOutcomeLevel = oFastAppDataModel.getProperty(sBindingPath);
			let sBindingPathSet = sBindingPath + '/AWARDEDCOMPANY';
			
			//check if a product is selected
			if (oOutcomeLevel === null) {
				return;
			}

			oFastAppDataModel.setProperty(sBindingPathSet, oOutcomeLevel.AWARDEDCOMPANYCOMP);

			//filter competitor product dropdown by selected competitor company
			let aCompetitorProducts = oFastAppDataModel.getProperty('/CountryCompetitors');
			if(aCompetitorProducts.length > 0){
				aCompetitorProducts = aCompetitorProducts.filter(product => product.CompetitorCompany === oOutcomeLevel.AWARDEDCOMPANYCOMP || product.CompetitorProduct === '');
				if(oOutcomeLevel.AWARDEDCOMPANYCOMP !== 'Other'){

					//Push an "other" option to the product list
					var oOtherProduct = {
						CompetitorCompany: oOutcomeLevel.AWARDEDCOMPANYCOMP,
						CompetitorProduct: "Other",
						CountryCode: oOutcomeLevel.CountryCode,
						ID:"1",
					}
					aCompetitorProducts.push(oOtherProduct);
				}
				oFastAppDataModel.setProperty(sBindingPath + '/CountryCompetitorProducts', aCompetitorProducts);
			}
		},

		//remove awarded company results
		onDeleteAwardedProduct: function (oEvent) {

			//get model & selected row
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oOutcomeTreeTable = this.byId(this.getView().getId() + "--tenderResultsFragmentId" +"--idOutcomeTable");
			var iRowIndex = oOutcomeTreeTable.getSelectedIndex();
			var oRowContext = oOutcomeTreeTable.getContextByIndex(iRowIndex);
			
			//check if a product is selected
			if (oRowContext === null) {
				sap.m.MessageToast.show("Select an awarded product to delete");
				return;
			}

			var sPathSelectedRow = oRowContext.getPath();
			var iRowIndexAwarded = sPathSelectedRow.split('/')[4];
			var iRowIndexParent = sPathSelectedRow.split('/')[2];

			var sPathResultsForTree = "/ResultsForTree";
			var sPathResultsForTreeAwarded = "/ResultsForTree/" + iRowIndexParent + "/OutcomeLevel/";

			//TODO in the future iLevel should just not be 0 so every line will be able to select the awarded product
			if (sPathSelectedRow.includes("/OutcomeLevel")) {

				//delete rewarded product
				var oAwardedProduct = Services.getFastAppDataModel().getProperty(sPathSelectedRow);

				if (oAwardedProduct._sOperation === "PUT") {
					//in this case the awarded product for this institute already exists in the back-end tables
					//so we keep it but put it as DELETE operation
					oAwardedProduct._sOperation = "DELETE";
					oFastAppDataModel.setProperty(sPathSelectedRow, oAwardedProduct);
				} else {
					//awarded product for this institute does not exists in the back-end tables
					//so we can delete it without deleting it in back-end during save
					var aResultsForTreeAwarded = oFastAppDataModel.getProperty(sPathResultsForTreeAwarded);
					var aResultsForTree = oFastAppDataModel.getProperty(sPathResultsForTree);
					aResultsForTreeAwarded.splice(iRowIndexAwarded, 1);
					//oFastAppDataModel.setProperty(sPathResultsForTree,aResultsForTree);
					oFastAppDataModel.setProperty(sPathResultsForTree, aResultsForTree);
				}

			} else {
				//message that you 
				sap.m.MessageToast.show("Select an awarded product to delete");
			}

		},

		onEditOutcomTreeTable: function () {
			/*	
			var oTable = this.getView().byId("idOutcomeTable");
				var oRows = oTable.getRows();
				var oItem = {};
				
				var aCellsDisplayOnly = [0, 1, 2, 3, 4];
				
				var bEditMode = Services.getEditMode();
				
				oRows.forEach(function (oRow) {
					oItem = oRow.getCells();
					
					for (var i = 0; i < oItem.length; i++) {
						if (bEditMode === true) {
								//if awarded company (9), product (10) or price (11)
							if (i === 1 || i === 0 || i === 2 ) {
									//outcome (6) is won
									if( oItem[7].getSelectedKey() === "Won"){
										//these fields are disabled and have default values
										oItem[i].setProperty("editable", false);
										oItem[1].setValue("Bayer");
										oItem[0].setValue(oItem[0].getValue()); //product won is product selected
										oItem[2].setValue(oItem[2].getValue()); //price won is price selected
									}
									
									//outcome (6) is lost
									if( oItem[7].getSelectedKey() === "Lost"){
										oItem[i].setProperty("editable", true);
										oItem[1].setValue("");
										oItem[0].setValue("");
										oItem[2].setValue("0");
									}
							} else {
								oItem[i].setProperty("editable", true);
							}
							
							
						}
					}
				});
				*/
		},

		//when changing outcome in results table
		onChangeOutcome: function (oEvent) {

			//get products that are bound to this table
			var oFastAppDataModel = Services.getFastAppDataModel();

			//get results from tree binding
			var sPathResultsForTree = "/ResultsForTree";
			var aResultsForTree = oFastAppDataModel.getProperty(sPathResultsForTree);

			//get selected value
			var oOutcomeDrop = oEvent.getSource();
			var sOutcome = oOutcomeDrop.getSelectedItem().getKey();
			var iIndex = oOutcomeDrop.getParent().getIndex();
			var sBindingPath = oOutcomeDrop.getBindingContext("fastAppData").getPath();
			var sBindingPathListOutcomeReasons = sBindingPath + "/LISTOUTCOMEREASONS/";

			var oReasonResultsDrop = this.byId("resultsForTreeReason");

			//if outcome is lost or won, the reason is enabled otherwise it is disabled
			if (sOutcome === "Won" || sOutcome === "Lost") {

				//load list of reasons depending on won or lost + change binding of reason
				$.when(Services.loadOutcomeReasons(sOutcome, iIndex)).done(function (oOutcomeReasons) {
					oFastAppDataModel.setProperty(sBindingPathListOutcomeReasons, oOutcomeReasons.results);
				});

				oFastAppDataModel.getProperty(sBindingPath).REASON = "Not Specified";

			} else {
				//clear list of outcome reasons for this product
				var aListOutcomeReasons = [];
				oFastAppDataModel.setProperty(sBindingPathListOutcomeReasons, aListOutcomeReasons);
			}

		},

		  //EHQUT-199069-Italy – Competitor results not linked to Bayer products/offers
		//saving the tender results page
		//TODO move to services file (refactoring)
		_onSaveTenderResults: async function (sPathIn, oModelrf) {

			//FastAppDataModel
			var oFastAppDataModel = Services.getFastAppDataModel();
			var aMessages = [];
			var bError = false;

			//model for saving
			var oModel = Services.getDefaultModel(); //new sap.ui.model.odata.ODataModel(Services.getConnectionString());
			var that = this;

			//get fastData model
			var oDefaultData = Services.getDefaultModel();
			var sOfferPath = Services.getSelectedOfferPath();

			let promises = [];
			var oBayerResultToSave = {};

			//var offerid = this.getView().getModel("fastData").getProperty(path).OfferID;
			var sOfferID = Services.getSelectedOfferID();
			var sTenderID = Services.getSelectedTenderID();
			var sInstituteID = Services.getInstituteIDofSelectedTender();
			var sCountryCode = Services.getCountryCodeofSelectedTender();

			//products of offer
			var aResultsForProducts = oFastAppDataModel.getProperty("/ResultsForProducts");
			var aResultsForTree = oFastAppDataModel.getProperty("/ResultsForTree");
			var competitorproductcode=await Services.loadCompetitorProductID();
			var otherproduct=await Services.loadProductPackID();
			const missingFields = new Set();
			
			aResultsForTree.forEach(function(oResultForTree, iIndex) {

				missingFields.clear();
				
                //Check missing mandatory fields for only Spain, as there are no mandatory fields for Italy
                if(sCountryCode === 'ES'){
                    
				    if (oResultForTree) {
                                        
                        if(oResultForTree.PriceAgreement === null){
                                
                            if(!oResultForTree.OUTCOME){
                                missingFields.add("Outcome");
                            }
                            if(oResultForTree.PRODUCT === "Other" && !oResultForTree.AWARDEDPRICE){
                                missingFields.add("Awarded Price");
                            }
                            if(!oResultForTree.AWARDEDQTY){
                                missingFields.add("Awarded Quantity");
                            }
                            if(oResultForTree.AWARDEDCOMPANY === "Bayer" && !oResultForTree.INFONEEDED){
                                missingFields.add("Information Needed");
                            }
                            if(oResultForTree.AWARDEDCOMPANY === "Bayer" && !oResultForTree.APPEAL){
                                missingFields.add("Appeal");
                            }
                            if((oResultForTree.OUTCOME && (oResultForTree.OUTCOME === 'Won' || oResultForTree.OUTCOME === 'Lost')) && !oResultForTree.REASON){
                                missingFields.add("Reason");
                            }                        
                        }
                    }
                }                

                                
				//loop at competitors awarded results
				if (oResultForTree.OutcomeLevel && oResultForTree.OutcomeLevel.length > 0) {
					oResultForTree.OutcomeLevel.forEach(function(oOutcomeLevel, iIndexLevel) {
						if(oResultForTree._sOperation !== "DELETE"){

							if(oOutcomeLevel.AWARDEDCOMPANY === "Other" && !oOutcomeLevel.OTHERCOMPANY){
								missingFields.add("Awarded Company");
							}

							if(oOutcomeLevel.PRODUCT === "Other" && !oOutcomeLevel.OTHERPRODUCT){
								missingFields.add("Product");
							}

                            if(sCountryCode === 'ES'){
                                //extra checks for Spain
                                if(!oOutcomeLevel.OUTCOME){
                                    missingFields.add("Outcome");
                                }
                                if(oOutcomeLevel.PRODUCT === "Other" && !oOutcomeLevel.AWARDEDPRICE){
                                    missingFields.add("Awarded Price");
                                }
                                if(!oOutcomeLevel.AWARDEDQTY){
                                    missingFields.add("Awarded Quantity");
                                }
                                if(oOutcomeLevel.AWARDEDCOMPANY === "Bayer" && !oOutcomeLevel.INFONEEDED){
                                    missingFields.add("Information Needed?");
                                }
                                if(oOutcomeLevel.AWARDEDCOMPANY === "Bayer" && !oOutcomeLevel.APPEAL){
                                    missingFields.add("Appeal");
                                }
                                if((oOutcomeLevel.OUTCOME && (oOutcomeLevel.OUTCOME === 'Won' || oOutcomeLevel.OUTCOME === 'Lost')) && !oOutcomeLevel.REASON){
                                    missingFields.add("Reason");
                                }
                            }

						}
					});
				}

				if(missingFields.size > 0){
					var oMessage = {
						type: 'Error',
						title: `Please enter all mandatory fields.`,
						subtitle: oResultForTree.PRODUCT,
						description: Array.from(missingFields).join("\n")
					};

					aMessages.push(oMessage);
					bError = true;
				}


			});

			if(bError){
				Services.showMessageCompositeView('Error', aMessages, 'Error');
				return;
			}

			//loop at each row TODO this can be handeled by using binding in the same way as on the other tabs, so no looping over rows...
			aResultsForTree.forEach(function (oResultForTree, iIndex) {

				//only if we are in a cell with a product
				if (oResultForTree) {

					//EHQUT
					if(oResultForTree.AWARDEDCOMPANY === "Bayer"){

					//push data for saving
					oBayerResultToSave = {
						ContractNo: oResultForTree.CONTRACT_NO,
						TenderID: sTenderID,
						OfferID: sOfferID,
						CountryCode: sCountryCode,
						InstituteID: sInstituteID, //Number(aCells["14"].getSelectedKey()),
						ProductCode: oResultForTree.PRODUCTCODE,
						SubmittedOn: moment().utc().toDate(),
						SubmittedBy: UserInfo.getCWID(),
						Active: 1,
						ErrorInSubmission: oResultForTree.ERRORINSUBMISSION,
						Outcome: oResultForTree.OUTCOME,
						AwardedCompany: oResultForTree.AWARDEDCOMPANY, //"Bayer",
						AwardedProduct: oResultForTree.AWARDEDPRODUCT, //0
						AwardedPrice: (oResultForTree.AWARDEDPRICE === "" || oResultForTree.AWARDEDPRICE === null) ? null : oResultForTree.AWARDEDPRICE
							.toString(), //2
						Currency: oResultForTree.CURRENCY,
						AwardedQty: (oResultForTree.AWARDEDQTY !== "") ? oResultForTree.AWARDEDQTY : "0",
						// AwardedQty: sAwardedQty
						UoM: oResultForTree.UOM,
						Reason: oResultForTree.REASON,
						Comment: oResultForTree.COMMENT,
						AwardedTier: 0,
						//italy fields
						ExtensionDate: oResultForTree.ExtensionDate,
						ExtensionNotes: oResultForTree.ExtensionNotes,
						AwardLetterNo: oResultForTree.AwardLetterNo,
						AwardDelibNo: oResultForTree.AwardDelibNo,
						DeliveryDate: oResultForTree.DeliveryDate,
						ResultDate: oResultForTree.ResultDate,
						AwardDate: oResultForTree.AwardDate,
						AwardActing: oResultForTree.AwardActing,
                        Appeal: oResultForTree.APPEAL,
                        TotalAwardedValue: oResultForTree.TOTALAWARDEDVALUE,
                        InfoNeeded: oResultForTree.INFONEEDED,
						LotID: sCountryCode === "BR" ? oResultForTree.LotID : 1                     
					};

					//Check if for the result is newly added and does not exist in database (in this case _sOperation exists and is POST)
					switch (oResultForTree._sOperation) {
					case "POST":
						//create new Result (Bayer)
						promises.push(Services.getService('Result').createResult(oBayerResultToSave).catch(function (oError) {
							//show error message
							Services.showErrorMessage(oError, "Creation of Bayer Result");
							//promises must fail as well
							throw oError;
						}));
						oBayerResultToSave = {};
						break;
					case "PUT":
						//update Result (Bayer)
						promises.push(Services.getService('Result').updateResult(oBayerResultToSave).catch(function (oError) {
							//show error message
							Services.showErrorMessage(oError, "Updating of Bayer Result");
							//promises must fail as well
							throw oError;
						}));
						oBayerResultToSave = {};
						break;
					default:
						//update Result (Bayer)
						promises.push(Services.getService('Result').updateResult(oBayerResultToSave).catch(function (oError) {
							//show error message
							Services.showErrorMessage(oError, "Updating of Bayer Result");
							//promises must fail as well
							throw oError;
						}));
						oBayerResultToSave = {};
						break;
					}

					//loop at competitors awarded results
					if (oResultForTree.OutcomeLevel && oResultForTree.OutcomeLevel.length > 0) {
						oResultForTree.OutcomeLevel.forEach(function (oCompetitorResult, iIndex) {
							//competitor results
							//EHQUT-218727-Requested Volume Field for competitor result
							if(sCountryCode !== "IT"){
								oCompetitorResult.REQUESTEDVOLUME=null;
							}
							var oCompetitorResultToSave = Services.getService('CompetitorResult').getConvertCompetitorResultToSave(oCompetitorResult);
							//Check if for the result is newly added and does not exist in database (in this case _sOperation exists and is POST)
							switch (oCompetitorResult._sOperation) {
							case "POST":
								//create Result (Competitor)
								promises.push(Services.getService('CompetitorResult').createCompetitorResult(oCompetitorResultToSave).catch(function (
									oError) {
									//show error message
									Services.showErrorMessage(oError, "Create Result");
									//promises must fail as well
									throw oError;
								}));
								oCompetitorResultToSave = {};
								break;
							case "PUT":
								//update Result (Competitor)
								promises.push(Services.getService('CompetitorResult').updateCompetitorResult(oCompetitorResultToSave).catch(function (
									oError) {
									//show error message
									Services.showErrorMessage(oError, "Updating of Competitor Result");
									//promises must fail as well
									throw oError;
								}));
								oCompetitorResultToSave = {};
								break;
							case "DELETE":
								//remove Result (Competitor)
								promises.push(Services.getService('CompetitorResult').removeCompetitorResult(oCompetitorResultToSave).catch(function (
									oError) {
									//show error message
									Services.showErrorMessage(oError, "Removing of Competitor Result");
									//promises must fail as well
									throw oError;
								}));
								oCompetitorResultToSave = {};
								break;
							default:
								break;
							}
						});
					}
				}else{
					var oCompetitorResult=[];
					if(oResultForTree.PRODUCTCODE === null){

					
					var productcode=otherproduct.data.results.findIndex(x => x.PRODUCT_NAME === oResultForTree.OTHERPRODUCT);
					
					
					if(productcode === -1 || productcode === null){
						
						var otherproductcode=competitorproductcode.data.results.findIndex(x => x.CompetitorProduct === oResultForTree.PRODUCTCOMP);
						var code=competitorproductcode.data.results[otherproductcode];
						if(otherproductcode !== -1){
							oResultForTree.PRODUCTCODE=code.ProductCode;
						}else{
							missingFields.add("Please Enter Valid Product");
											
						}
					}else{
						
						oResultForTree.PRODUCTCODE=otherproduct.data.results[productcode].PRODUCT_ID;
						
					}
				}
				
	
				if(oResultForTree.PRODUCTCODE !== null){
					oCompetitorResult.push(oResultForTree);
										
					var oCompetitorResultToSave = Services.getService('CompetitorResult').getConvertCompetitorResultToSave(oResultForTree);
							//Check if for the result is newly added and does not exist in database (in this case _sOperation exists and is POST)
							switch (oCompetitorResult[0]._sOperation) {
							case "POST":
								//create Result (Competitor)
								promises.push(Services.getService('CompetitorResult').createCompetitorResult(oCompetitorResultToSave).catch(function (
									oError) {
									//show error message
									Services.showErrorMessage(oError, "Create Result");
									//promises must fail as well
									throw oError;
								}));
								oCompetitorResultToSave = {};
								break;
							case "PUT":
								//update Result (Competitor)
								promises.push(Services.getService('CompetitorResult').updateCompetitorResult(oCompetitorResultToSave).catch(function (
									oError) {
									//show error message
									Services.showErrorMessage(oError, "Updating of Competitor Result");
									//promises must fail as well
									throw oError;
								}));
								oCompetitorResultToSave = {};
								break;
							case "DELETE":
								//remove Result (Competitor)
								promises.push(Services.getService('CompetitorResult').removeCompetitorResult(oCompetitorResultToSave).catch(function (
									oError) {
									//show error message
									Services.showErrorMessage(oError, "Removing of Competitor Result");
									//promises must fail as well
									throw oError;
								}));
								oCompetitorResultToSave = {};
								break;
							default:
								break;
							}
						}
				}
				}
			
			});
			if(missingFields.size > 0){
				var oMessage = {
					type: 'Error',
					title: `Please enter all mandatory fields.`,
					description: Array.from(missingFields).join("\n")
				};

				aMessages.push(oMessage);
				bError = true;
			}
			if(bError){
				Services.showMessageCompositeView('Error', aMessages, 'Error');
				return;
			}

			//DOING THE ACCUAL SAVE
			Promise.all(promises).then((result) => {

				var sTenderPath = Services.getSelectedTenderPath();
				var sTenderID = Services.getSelectedTenderID();
				var sOfferID = Services.getSelectedOfferID();

				//we will load tender again after save is done
				var bLoadedCheck = false;

				//load all data again
				$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

					//give message that everything was updated
					sap.m.MessageBox.success("Results Updated Successfully", {});

					//save offer status as tender recorded... 
					$.when(Services.saveOfferStatus("Results Recorded")).done(function (oSaveStatus) {

						//FOR THE NEW tree table
						//that.onOutcomeTableEditMode();
						that.onEditOutcomTreeTable();

						that.getView().getModel("fastData").refresh(true);
						oModelrf.getModel("fastData").refresh(true);
						that.onEditToggleButtonPress();
						//Services.setSelectedTenderID(sTenderID);

						//clear all input
						var bKeepSelectedOffer = true;
						Services.clearAllForDeliveryTrackingPage(bKeepSelectedOffer);

						//this way we can use a seperate layer, adding deleting... and afterords saving
						var oFastAppDataModel = Services.getFastAppDataModel();
						that.getView().setModel(oFastAppDataModel, "fastAppData");

						//refresh & load everything + re-select
						that.onRefresh();

					});

				});

			}).catch(function (oError) {

				if(oError.responseText.indexOf("Entity already exists") > -1){
					//promises must fail as well
					sap.m.MessageBox.error("The competitor entity already exists. The combination of OfferID, ProductCode and AwardedCompany is not unique.");
				}else{
					//error message
					Services.showErrorMessage(oError, "Saving tender results");
				}

				
			});
		
		},

		onChangeSampleYN: function (oEvent) {
			//get selected value
			var oSampleYN = oEvent.getSource();
			var sSample = oSampleYN.getSelectedItem().getKey();

			//get cells from same row as oOutcomeDrop
			var aCells = oSampleYN.getParent().getCells();
			if (sSample === "No") {
				aCells[6].setValue("0");
			}
		},

		onChangeDecline: function (oEvent) {
			//get selected value
			var oDecline = oEvent.getSource();
			var sDecline = oDecline.getSelectedItem().getKey();

			//get cells from same row as oOutcomeDrop
			var aCells = oDecline.getParent().getCells();
			if (sDecline === "1") {
				aCells[14].setValue("");
			}
		},

		_initializeCountrySpecificFields: function(){

			this.byId("idBiddingTypeLevel1") && this.byId("idBiddingTypeLevel1").setVisible(false);
			this.byId("idBiddingTypeLevel2") && this.byId("idBiddingTypeLevel2").setVisible(false);
			this.byId("idBiddingTypeLevel3") && this.byId("idBiddingTypeLevel3").setVisible(false);
			this.byId("idSpecifications") && this.byId("idSpecifications").setVisible(false);
            this.byId("idSelectTenderTypeEdit") && this.byId("idSelectTenderTypeEdit").setVisible(false);
            this.byId("idSelectTenderType2Edit") && this.byId("idSelectTenderType2Edit").setVisible(false);
                        
			//this.byId("idClassification") && this.byId("idClassification").setVisible(false);

			this.byId("idBiddingTypeLevel1") && this.byId("idBiddingTypeLevel1").clearSelection();
			this.byId("idBiddingTypeLevel2") && this.byId("idBiddingTypeLevel2").clearSelection();
			this.byId("idBiddingTypeLevel3") && this.byId("idBiddingTypeLevel3").clearSelection();
			this.byId("idSpecifications") && this.byId("idSpecifications").clearSelection();
            this.byId("idSelectTenderTypeEdit") && this.byId("idSelectTenderTypeEdit").clearSelection();
            this.byId("idSelectTenderType2Edit") && this.byId("idSelectTenderType2Edit").clearSelection();

		},

		onClassificationChange: async function(oEvent){ 

			const oForm = this.byId("idBasicInfoSimpleForm");
			oForm.setBusyIndicatorDelay(0);

			let sCountry = this._country;
			let sClassificationId = oEvent.getSource().getSelectedItem().data("classificationId");
            let sKey =  oEvent.getSource().getSelectedItem().getKey();

			this._initializeCountrySpecificFields();
			
			if(sClassificationId){                 
				try {

					oForm.setBusy(true);

					const aBiddingTypeLevel1 = await Services.loadCountryBiddingTypeLevel1(sCountry, sClassificationId);
				
					if(aBiddingTypeLevel1.length > 0){
						this.byId("idBiddingTypeLevel1").setVisible(true);
					}

					const aSpecifications = await Services.loadCountrySpecifications(sCountry, sClassificationId);

					if(aSpecifications.length > 0){
						this.byId("idSpecifications").setVisible(true);
					}

					// if(sCountry === "IT"){
					// 	this.byId("idTerminationDate").setVisible(true);
					// 	this.byId("idTerminationDateLabel").setVisible(true);
					// }
                    //EHQUT-INC0184560-Issue in offer creation
                    if(sCountry === 'ES' && sKey === 'Tender' || sCountry === 'IT') {
                        this.byId("idSelectTenderTypeEdit").setVisible(true);
                        if(sCountry === 'ES'){
                            this.byId("idSelectTenderType2Edit").setVisible(true);  
                            this.byId("idContractExtenseion").setVisible(true);
                            this.byId("idContractLength").setVisible(true);
                            this.byId("idContractLengthLabel").setVisible(true);
                            this.byId("idContractExtenseionLabel").setVisible(true);
                            this.byId("idPublicationDateLabel").setVisible(true);
                            this.byId("idPublicationDate").setVisible(true);
                            this.byId("idBidDueDateLabel").setVisible(true);
                            this.byId("idBidDueDate").setVisible(true);
                            this.byId("idNextPublicationDyeLabel").setVisible(true);
                            this.byId("idNextPublicationDye").setVisible(true);
                            this.byId("idAwardDate").setVisible(true);
                            this.byId("idAwardDateLabel").setVisible(true);
                        }                   
                    } else if(sCountry === 'ES' && sKey !== 'Tender'){
                        this.byId("idSelectTenderTypeEdit").setVisible(false);
                        if(sCountry === 'ES'){
                            this.byId("idSelectTenderType2Edit").setVisible(false);   
                            this.byId("idContractExtenseion").setVisible(false);
                            this.byId("idContractLength").setVisible(false);  
                            this.byId("idContractLengthLabel").setVisible(false);
                            this.byId("idContractExtenseionLabel").setVisible(false);
                            this.byId("idPublicationDateLabel").setVisible(false);
                            this.byId("idPublicationDate").setVisible(false);
                            this.byId("idBidDueDateLabel").setVisible(false);
                            this.byId("idBidDueDate").setVisible(false);
                            this.byId("idNextPublicationDyeLabel").setVisible(false);
                            this.byId("idNextPublicationDye").setVisible(false);
                            this.byId("idAwardDate").setVisible(false);
                            this.byId("idAwardDateLabel").setVisible(false);
                        }                  
                    }         
                    //EHQUT-INC0184560-Issue in offer creation
				} catch(err) {
					console.log(err);
				} finally{
					oForm.setBusy(false);
					this.byId("idBiddingTypeLevel2").getItems().length > 0 ? this.byId("idBiddingTypeLevel2").destroyItems() : "";
					this.byId("idBiddingTypeLevel3").getItems().length > 0 ? this.byId("idBiddingTypeLevel3").destroyItems() : "";
				}

				
			}

		},

		onBiddingTypeLevel1Change: async function(oEvent){

			const oForm = this.byId("idBasicInfoSimpleForm");
			oForm.setBusyIndicatorDelay(0);

			let sCountry = this._country;
			let sBiddingTypeLevel1Id = oEvent.getSource().getSelectedItem().data("ID");
			let that = this;

			this.byId("idBiddingTypeLevel2").setVisible(false);
			this.byId("idBiddingTypeLevel3").setVisible(false);
			this.byId("idBiddingTypeLevel2").clearSelection();
			this.byId("idBiddingTypeLevel3").clearSelection();

			if(sBiddingTypeLevel1Id){

				//that.getView().setBusy(true);
				try {

					oForm.setBusy(true);

					const aBiddingTypeLevel2 = await Services.loadCountryBiddingTypeLevel2(sCountry, sBiddingTypeLevel1Id);

					if(aBiddingTypeLevel2.length > 0){
						that.byId("idBiddingTypeLevel2").setVisible(true);
					}else{
						that.byId("idBiddingTypeLevel2").setVisible(false);
					}

				} catch(err) {
					console.log(err);
				} finally{
					oForm.setBusy(false);
				}
				

				// $.when(Services.loadCountryBiddingTypeLevel2(sCountry, sBiddingTypeLevel1Id)).done(function (oData){
				// 	if(oData.length > 0){
				// 		that.byId("idBiddingTypeLevel2").setVisible(true);
				// 		that.getView().setBusy(false);
				// 	}else{
				// 		that.byId("idBiddingTypeLevel2").setVisible(false);
				// 		that.getView().setBusy(false);
				// 	}
				// });

			}
		},

		onBiddingTypeLevel2Change: async function(oEvent){ 

			const oForm = this.byId("idBasicInfoSimpleForm");
			oForm.setBusyIndicatorDelay(0);

			let sCountry = this._country;
			let sBiddingTypeLevel2Id = oEvent.getSource().getSelectedItem().data("ID");
			let that = this;


			this.byId("idBiddingTypeLevel3").setVisible(false);
			this.byId("idBiddingTypeLevel3").clearSelection();

			if(sBiddingTypeLevel2Id){
				// this.getView().setBusy(true);

				try {

					oForm.setBusy(true);

					const aBiddingTypeLevel3 = await Services.loadCountryBiddingTypeLevel3(sCountry, sBiddingTypeLevel2Id);

					if(aBiddingTypeLevel3.length > 0){
						that.byId("idBiddingTypeLevel3").setVisible(true);
					}else{
						that.byId("idBiddingTypeLevel3").setVisible(false);
					}

				} catch(err) {
					console.log(err);
				} finally{
					oForm.setBusy(false);
				}


				// $.when(Services.loadCountryBiddingTypeLevel3(sCountry, sBiddingTypeLevel2Id)).done(function (oData){
				// 	if(oData.length > 0){
				// 		that.byId("idBiddingTypeLevel3").setVisible(true);
				// 		that.getView().setBusy(false);
				// 	}else{
				// 		that.byId("idBiddingTypeLevel3").setVisible(false);
				// 		that.getView().setBusy(false);
				// 	}
				// });
			}

		},

		onBiddingTypeLevel3Change: function(oEvent){ 
			this.toggleHighValueCheckboxVisibility();
		},

		onTenderChannelChange:function(oEvent){ 
			if(Services.getSelectedCountry() === 'AR'){
				this.toggleHighValueCheckboxVisibility();
			}
		},

		/**
		 * Toggles the HighValue checkbox visibility on the BasicInformation page for Argentina
		 */
		toggleHighValueCheckboxVisibility: function() {

			const sBiddingTypeLevel3SelectedItem = this.byId("idBiddingTypeLevel3").getSelectedItem().getText();
			const sTenderChannelSelectedItem = this.byId("idTenderChannel").getSelectedItem().getText();
			const oHighValueCheckBox = this.byId("idHighValue");
			const oHighValueLabel = this.byId("idHighValueLabel");
			
			if(sBiddingTypeLevel3SelectedItem === "Nacional" && sTenderChannelSelectedItem === "Direct"){
				oHighValueCheckBox.setVisible(true);
				oHighValueLabel.setVisible(true);
			}else{
				oHighValueCheckBox.setVisible(false);
				oHighValueLabel.setVisible(false);
			}
		},
		onDownloadWord:function(event){
			// http://localhost:4004/v2/tender/WordAttachments(templateId=1,offerId='AE-16-100-1049-BPH-11')/content
			const url = "/v2/tender/WordAttachments(templateId="+event.getSource().getBindingContext("fastAppData").getProperty("templateId")+",offerId='"+Services.getSelectedOfferID()+"')/content";
			URLHelper.redirect(url,true);
		},

		/**
		 * Button on the Offer Products page that will allow FAST user to notify business 
		 * team they can proceed with financial offer.
		 * Only applicable for Spain Tenders
		 * @param {*} evt 
		 */
		onSendNotification: async function(evt){
			const oDialog = await this._getSendNotificationDialog();         
			oDialog.open();
		},


		/**
		 * New email dialog
		 */
		 _getSendNotificationDialog : async function () {

             const oController = this;          

            BusyIndicator.show();
		

			if(this._sendNotificationDialog){
				this._sendNotificationDialog.destroy();
			}

			this._sendNotificationDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.NotificationMail", this);
			this.getView().addDependent(this._sendNotificationDialog);

            let template = undefined;
            
			try {
				template = await Services.getMailTemplate(Services.getCountryCodeofSelectedTender(), "ES", Services.getSelectedOfferID());
			}
			catch(error){
                const errMsg = error.responseText && JSON.parse(error.responseText).error.message.value || error.message;
                sap.m.MessageBox.error(errMsg);
                BusyIndicator.hide();                
				throw error;
			}

			
			//get screen elements
			let oRecipients = sap.ui.getCore().byId("idTo");
			let oSubject = sap.ui.getCore().byId("idSubject");
			let oSender = sap.ui.getCore().byId("idFrom");
			let sSender = UserInfo.getUserEmail();
			let oEditor = sap.ui.getCore().byId("idEditor");
            let aRAMs = [];

            const oFastAppDataModel = Services.getFastAppDataModel();
            const sDivision = oFastAppDataModel.getProperty('/SelectedOffer/Division');
			const sRecipient = oFastAppDataModel.getProperty('/SelectedOffer/Distributor/CONTACT_EMAIL');
			const sSubject = 'Notification for offer ' + oFastAppDataModel.getProperty('/Tender/TenderName');
            aRAMs = oFastAppDataModel.getProperty('/CountryApprovers');
 
            //EHQUT-197300-Spain – notification e-mail to RAMs
            aRAMs = aRAMs.filter(ram => ram.Division === sDivision && ram.ApproverType === 'EmailKAM');
            oFastAppDataModel.setProperty('/CountryApprovers', aRAMs);
			
			oEditor.setValue(template.value);
			oSubject.setValue(sSubject);

            if(sRecipient){
                oRecipients.setTokens([
                    new Token({text: sRecipient, key: sRecipient}),
                ]);     
            }


			oSender.setTokens([
				new Token({text: sSender, key: sSender}),
			]);

			// add validator
			let fnValidator = function(args){
				let text = args.text;

                const emailIsNotValid = oController.validateEmail(text);

                if(emailIsNotValid){
                    oRecipients.setValueStateText(emailIsNotValid)
                    oRecipients.setValueState("Error");  
                    oRecipients.openValueStateMessage();                 
                    return;
                }

                oRecipients.setValueState("None"); 
                oRecipients.closeValueStateMessage();
                
				return new Token({key: text, text: text});
			};

			//oRecipients.addValidator(fnValidator);
			oSender.addValidator(fnValidator);

			BusyIndicator.hide();
			

			return this._sendNotificationDialog;

		},


        validateEmail: function (oValue) {
            // The following Regex is only used for demonstration purposes and does not cover all variations of email addresses.
            // It's always better to validate an address by simply sending an e-mail to it.
            var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
            if (!oValue.match(rexMail)) {
                return "'" + oValue + "' is not a valid e-mail address";
            }
        },


		onSendNotificationMail: function(evt){

			let sRecipients = "";
			let sSubject = sap.ui.getCore().byId('idSubject').getValue();
			let sMailBody = sap.ui.getCore().byId('idEditor').getValue();
			let aRecipients = sap.ui.getCore().byId('idTo').getSelectedKeys();
			let sSenders = sap.ui.getCore().byId('idFrom').getTokens();
			aRecipients.forEach(recipient => sRecipients += recipient + ';')

			let oMail = {
				"CountryCode": Services.getSelectedCountry(),
				"TenderID": Services.getSelectedTenderID(),
				"OfferID": Services.getSelectedOfferID(),
				"Sender":sSenders[0].getProperty('text'),
				"Recipients":sRecipients,
				"Subject":sSubject,
				"MailBody":sMailBody,
				"Sent":false,
			}

			Services.sendMail(oMail)
				.then(() => {
					this._sendNotificationDialog.destroy();
					Services.getOfferCompositeMessages().push({
						type: 'Success',
						title: 'Mail sent successfully',
						description: 'Mail sent successfully'
					});
					Services.showMessageCompositeView("Success", Services.getOfferCompositeMessages(), 'Success');
				})
				.catch(function (oError) {
					//show error message
					Services.showErrorMessage(oError, "Sending mail");
				});

		},


		onCancelNotificationMail: function(evt){
			this._sendNotificationDialog.destroy();
		},

		checkBtnCreatePriceAgreementEnabled: function(productCode){
            if(!productCode) return;
            const selectedProductPath = '/SelectedOffer/Product/results';
            const oFastAppModel = Services.getFastAppDataModel();
            let oOfferProducts = oFastAppModel.getProperty(selectedProductPath)?.filter(product => product.ProductCode === productCode);
            let aResultsForTree = oFastAppModel.getProperty('/ResultsForTree')?.filter(result => result.PRODUCTCODE === productCode);
            let oTenderResultProduct = aResultsForTree && aResultsForTree.length > 0 ? aResultsForTree[0] : null;
            let oSelectedProduct = oOfferProducts && oOfferProducts.length > 0 ? oOfferProducts[0] : null;
			
            let priceConditions = oSelectedProduct ? oSelectedProduct.PriceCondition : null;
			let outcome = oTenderResultProduct && oTenderResultProduct.OUTCOME ? oTenderResultProduct.OUTCOME : null;

            if(!outcome) return false;
			const isOutcomeWon = outcome && outcome.toLowerCase().indexOf("won") > -1;
			const isSpain = Services.getSelectedCountry().indexOf("ES") > -1;
			if(!isOutcomeWon) return false;
			if(isOutcomeWon && !isSpain) return true;
			if(!priceConditions) return false;
			
			let bEnabled = false;
			const mainCondition = priceConditions?.results?.find(condition => condition?.PriceConditionClassification?.isMain);
			const referencePriceAgreement = mainCondition?.ReferencePriceAgreement ? true : false;
			const hadAdditionalPriceConditions = priceConditions.results.length > 1;
			bEnabled = isOutcomeWon;
			if(isOutcomeWon && referencePriceAgreement) bEnabled = hadAdditionalPriceConditions;
			return bEnabled;
		},


        onNotifyIbiz: function(oEvent){
            
            const oView = this.getView();    

            // create NotifyIbiz dialog lazily
			if (!this.pNotifyIbizDialog) {

				this.pNotifyIbizDialog = Fragment.load({
					id: oView.getId(),
					name: "FAST_NS0FAST0.view.fragments.NotifyIbizDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					return oDialog;
				});

			}

            this.pNotifyIbizDialog.then(function(oDialog){
                oDialog.open();
            }.bind(this));

        },

        onNotifyibizDialog: async function(oEvent){

           //that is this
            let that = this;
            BusyIndicator.show();
			
            //get user input
			let oNotifyIbizComment = this.byId("idNotifyIbizComments").getValue();
			const workflowID = this.getView().getModel("viewModel").getProperty("/NotifyIbizWorkflowID");
			const directIndirect = this.getView().getModel("viewModel").getProperty("/NotifyIbizDirectIndirect");
			const workflowproductIDs =this.getView().getModel("viewModel").getProperty("/NotifyIbizWorkflowProductIDs");
			
			try{
				//Logic to call the API to Notify about Product Switch
				await Services.getService("Tender").notifyIbiz(workflowID, directIndirect, workflowproductIDs);

			}catch(error){
				sap.m.MessageBox.error(error.message, {
					title: "Error",
					id: "messageBoxId3",
					details: JSON.parse(error.responseText),
					styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer"
				});
			}

			// close loading that blocks everything
			BusyIndicator.hide();

			//close dialog
			that.onNotifyibizDialogCancel();

        },

        onNotifyibizDialogCancel: function(oEvent){
            
			if(this.pNotifyIbizDialog){
                this.pNotifyIbizDialog.then(function(oDialog){
					oDialog.close();
				});

			}
		},


	});
});