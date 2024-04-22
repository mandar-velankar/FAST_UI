/* global moment:true */
sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"sap/ui/model/json/JSONModel",
	"sap/m/BusyDialog",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/utils/Formatter",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/libs/ranking/Ranking",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/model/financial"
], function (BaseService, JSONModel, BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, formatter, Formatter, MomentJS,
	Ranking, UserInfo, Financial) { //TODO what is this with 2 formatters??
	"use strict";

	//BaseService makes it such that everything within Services can be called
	var Service = BaseService.extend("FAST_NS0FAST0.model.services", {

		//Constructor
		//-----------
		constructor: function () {

			//one model for doing calls to the back-end
			//this._oFastDataCalls = new sap.ui.model.odata.ODataModel(this._connectionString);

			//one model for the seperation layer
			this._oFastAppDataModel = new JSONModel();
			this._accessModel = new JSONModel();
			this._oAllServices = {};

		},

		//GENERAL
		//-------

		//Local Variable
		//--------------

		_bEditMode: false,
		_sLayoutType: "",
		_sSelectedCountry: "",
		_sSelectedTenderID: "",
		_sSelectedTenderPath: "",
		_sNewTenderNo: "",
		_sSelectedOfferID: "",
		_sSelectedOfferPath: "",
		_bSelectedOfferAvailable: true,
		_sSelectedProductID: "",
		_sSelectedProductName: "",
		_sSelectedProductPath: "",
		_sSelectedPriceConditionPath: "",
		_sSelectedTab: "",
		_defaultModel: "",
		//_connectionString: "/v2/tender/",
		_oSelectedQuotationTemplate: {},
		_aOfferCompositeMessages: [],
		_bOfferCreated: false,
		_oRouter: {},
		_iDeliveryItemEdit: -1,
		_iLetterItemEdit: -1,

		//componentID (dynamicly filled)
		_sComponentID: "FastComponent", //default value both it will be filled dynamically

		//different Page sections on detail page
		_sBasicInformationPageSectionID: "---tenderManagementDetailId--basicInformationId",
		_sOfferProductPageSectionID: "---tenderManagementDetailId--offerProductsId",
		_sFinancialOfferPageSectionID_IT: "---tenderManagementDetailId--financialOfferId_IT",
        _sFinancialOfferPageSectionID_ES: "---tenderManagementDetailId--financialOfferId_ES",
        _sFinancialOfferPageSectionID_BR: "---tenderManagementDetailId--financialOfferId_BR",
		_sFinancialOfferPageSectionID: "---tenderManagementDetailId--financialOfferId",
		_sQuotationPageSectionID: "---tenderManagementDetailId--quotationId",
		_sTenderResultsPageSectionID: "---tenderManagementDetailId--tenderResultsId",
		_sDeliveryTrackingPageSectionID: "---tenderManagementDetailId--deliveryTrackingId",

        _aLotsBeforeEdit: [],

		//different Page sub-sections on detail page
		_sBasicInformationPageSubSectionID: "---tenderManagementDetailId--basicInformationSubSectionId",

		//Financial model (TODO merge financial.js & offerproducts.js)
		_oFinancialModel: {},

		//To keep track of tender master list - filters when leaving/returning to/from split screen
		_aTenderMasterApplicationFilters: [],

		//TendersMaster table to access everywhere
		_oTendersMasterTable: null,

		_oLoadingTenderMasterDialog: {},

		//GETTERS
		//-------
		//loading for clicking tile
		getLoadingTenderMasterDialog: function () {
			return this._oLoadingTenderMasterDialog;
		},

		//TendersMaster table to access everywhere
		getTendersMasterTable: function () {
			return this._oTendersMasterTable;
		},

		//TODO move to financial tab logic
		getFinancialModel: function () {
			return this._oFinancialModel;
		},
		getAccessModel:function(){
			return this._accessModel;
		},

		//TODO move to financial tab logic
		setFinancialModel: function (oModel) {
			this._oFinancialModel = oModel;
		},

		//get connection string
		/*
		getConnectionString: function () {
			return this._connectionString;
		},
		*/

		getOfferCreated: function () {
			return this._bOfferCreated;
		},

		//get default model used on most of the pages (till later on)
		getDefaultModel: function () {
			return this._defaultModel;
		},

		//get model fast data for accessing the database
		/*
		getFastDataCalls: function () {
			//True = we are in edit mode
			return this._oFastDataCalls;
		},
		*/

		//get model fast app data with data displayed on the views
		getFastAppDataModel: function () {
			//True = we are in edit mode
			return this._oFastAppDataModel;
		},

		//Component ID
		getComponentID: function () {
			return this._sComponentID;
		},

		//Page sections ID's
		getBasicInformationPageSectionID: function () {
			var sPage = this.getComponentID() + this._sBasicInformationPageSectionID;
			return sPage;
		},

		getOfferProductPageSectionID: function () {
			var sPage = this.getComponentID() + this._sOfferProductPageSectionID;
			return sPage;
		},

		getFinancialOfferPageSectionID: function () {
			var sPage = this.getComponentID() + this._sFinancialOfferPageSectionID;
			return sPage;
		},

		getFinancialOfferPageSectionID_IT: function () {
			var sPage = this.getComponentID() + this._sFinancialOfferPageSectionID_IT;
			return sPage;
		},

        getFinancialOfferPageSectionID_ES: function () {
			var sPage = this.getComponentID() + this._sFinancialOfferPageSectionID_ES;
			return sPage;
		},

        getFinancialOfferPageSectionID_BR: function () {
			var sPage = this.getComponentID() + this._sFinancialOfferPageSectionID_BR;
			return sPage;
		},

		getQuotationPageSectionID: function () {
			var sPage = this.getComponentID() + this._sQuotationPageSectionID;
			return sPage;
		},

		getTenderResultsPageSectionID: function () {
			var sPage = this.getComponentID() + this._sTenderResultsPageSectionID;
			return sPage;
		},

		getDeliveryTrackingPageSectionID: function () {
			var sPage = this.getComponentID() + this._sDeliveryTrackingPageSectionID;
			return sPage;
		},

		//Page sections ID's
		getBasicInformationPageSubSectionID: function () {
			var sPage = this.getComponentID() + this._sBasicInformationPageSubSectionID;
			return sPage;
		},

		//get selected tabblad
		getSelectedTab: function () {
			return this._sSelectedTab;
		},

		//get edit mode
		getEditMode: function () {
			//True = we are in edit mode
			return this._bEditMode;
		},

		//get layout type two columns, onecolumn, mid expanded...
		getLayoutType: function () {
			return this._sLayoutType;
		},

		//get current selected country code
		getSelectedCountry: function () {
			return this._sSelectedCountry;
		},

		//get current selected tenderID
		getSelectedTenderID: function () {
			//selected tenderID
			return this._sSelectedTenderID;
		},

		//get current selected tender path
		getSelectedTenderPath: function () {
			//Path of the selected tender
			return this._sSelectedTenderPath;
		},

		//get current selected tenderNo
		getNewTenderNo: function () {
			//selected tenderNo
			return this._sNewTenderNo;
		},

		//get current selected offer path
		getSelectedOfferPath: function () {
			//Path of the selected offer 
			return this._sSelectedOfferPath;
		},

		//get current selected offerID
		getSelectedOfferID: function () {
			return this._sSelectedOfferID;
		},

		//get selected offer available
		getSelectedOfferAvailable: function () {
			return this._bSelectedOfferAvailable;
		},

		//get current selected productID
		getSelectedProductID: function () {
			return this._sSelectedProductID;
		},

		//return the selected productID
		getSelectedProductName: function () {
			return this._sSelectedProductName;
		},

		//get current selected productPath
		getSelectedProductPath: function () {
			return this._sSelectedProductPath;
		},

		//get current selected priceConditionPath
		getSelectedPriceConditionPath: function () {
			return this._sSelectedPriceConditionPath;
		},

        getLotsBeforeEdit: function() {
            return this._aLotsBeforeEdit || [];
        },

        setLotsBeforeEdit: function(aLots) {
            this._aLotsBeforeEdit = aLots;
        },

		//get instituteID of selected ProductID
		getInstituteIDofSelectedTender: function () {

			var that = this;
			var oFastAppDataModel = that.getFastAppDataModel();
			var oTender = oFastAppDataModel.getProperty("/Tender");

			//return the InstituteID
			if (oTender) {
				return oTender.InstituteID;
			} else {
				return "";
			}

		},
		//EHQUT-199068-Italy – Tender search by Region
		getInstituteID: function(oInstituteName){
			let RegionInstitute=[];
			if(oInstituteName){
				let TotalInstitute=this.getFastAppDataModel().getProperty("/PT_TMINST");
				var iIndex = TotalInstitute.findIndex(x => x.InstituteID == oInstituteName);
				var RegionInstituteID=TotalInstitute[iIndex].RegionID;
				
				//RegionInstitute=TotalInstitute.filter(x => x.RegionID == RegionInstituteID);
				for (var i=0;i<TotalInstitute.length;i++){
				if(TotalInstitute[i].RegionID==RegionInstituteID)	{
					RegionInstitute.push(TotalInstitute[i].InstituteName);
				}
				}

					}							   
				return RegionInstitute;
			},

		//EHQUT-199068-Italy – Tender search by Region

		//EHQUT-217122-Spain - Tender search by Region

		getRegionID: function(oInstituteName){
			let RegionInstitute=[];
			if(oInstituteName){
				let TotalInstitute=this.getFastAppDataModel().getProperty("/PT_TMINST");
				var iIndex = TotalInstitute.findIndex(x => x.RegionID == oInstituteName);
				var RegionInstituteID=TotalInstitute[iIndex].RegionID;
				
				//RegionInstitute=TotalInstitute.filter(x => x.RegionID == RegionInstituteID);
				for (var i=0;i<TotalInstitute.length;i++){
				if(TotalInstitute[i].RegionID==RegionInstituteID)	{
					RegionInstitute.push(TotalInstitute[i].InstituteName);
				}
				}

					}							   
				return RegionInstitute;
			},
			
		getOfferCompositeMessages: function () {
			return this._aOfferCompositeMessages;
		},

		getDeliveryItemEdit: function () {
			return this._iDeliveryItemEdit;
		},

		getLetterItemEdit: function () {
			return this._iLetterItemEdit;
		},

		//get instituteID of selected ProductID
		getCountryCodeofSelectedTender: function () {

			var that = this;
			var oFastAppDataModel = this.getFastAppDataModel();
			var oTender = oFastAppDataModel.getProperty("/Tender");

			//return the CountryCode
			if (oTender) {
				return oTender.CountryCode;
			}

		},

		//get the date of today in a format used for tender management (moment.js lib is a good alternitive for doing thsese things)
		getDateToday: function () {
			var d = new Date();
			var year = d.getFullYear();
			var month = d.getMonth() + 1;
			if (month < 10)
				month = "0" + month;
			var day = d.getDate();
			if (day < 10)
				day = "0" + day;
			var todayDate = day + "." + month + "." + year;
			return todayDate;
		},
        loadDeliveryProductPack: function () {

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for product pack read
			var sProductPackPath = "/PT_TMPRDPCK(ACTIVERECORD='Yes')";

			if (sProductPackPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sProductPackPath, {
					urlParameters: {
						"$expand": "Product"
					},
					success: function (oData, oResponse) {

						//let the callback be triggered
						oDeferred.resolve(oData);
                        return oData;

					},
					error: function (oError) {

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			//return oDeferred.promise();

		},
		getAccess:function(){
			const accessService = this.getService("Access");
			const accessModel = this.getAccessModel();

			return accessService.getAccess().then(result=>{
				accessModel.setData(result.data);
				return result.data;
			});
		},
		//get offer path from fastappdata
		getLoadedOfferPath: function (sOfferID) {
			var oFastAppDataModel = this.getFastAppDataModel();
			var aOffers = oFastAppDataModel.getProperty("/Tender/Offer/results");

			//index of offerID found in the offer
			if (aOffers) {
				var iIndex = aOffers.findIndex(x => x.OfferID === sOfferID);
			}

			//path where the products should be stored
			var sPathOffer = "/Tender/Offer/results/" + iIndex;

			return sPathOffer;
		},

		//get loaded tender info
		getLoadedTender: function () {

			var oFastAppDataModel = this.getFastAppDataModel();
			var oTender = oFastAppDataModel.getProperty("/Tender");

			return oTender;

		},

		//get offer based on id
		getLoadedOffer: function (sOfferID) {

			var oFastAppDataModel = this.getFastAppDataModel();
			var aOffers = oFastAppDataModel.getProperty("/Tender/Offer/results");

			//index of offerID found in the offer
			if (aOffers) {
				var iIndex = aOffers.findIndex(x => x.OfferID === sOfferID);
			}

			//path where the products should be stored
			var sPathTenderOffer = "/Tender/Offer/results/" + iIndex;

			var oOffer = oFastAppDataModel.getProperty(sPathTenderOffer);

			return oOffer;

		},

		//get all products loaded for a specific offer from the fast app data model
		getLoadedProductsForOffer: function (sOfferID, sProductCode, sLotID) {
			if (!sLotID) {
				sLotID = 1;
			}
			//if no offer ID
			if (!sOfferID) {
				return []; //return no products
			}

			var that = this;
			var aProducts = [];
			var oFastAppDataModel = this.getFastAppDataModel();
			var aOffers = oFastAppDataModel.getProperty("/Tender/Offer/results");

			//if offers are found
			if (aOffers && aOffers.length > 0) {

				//index of offerID found in the offer
				var iIndex = aOffers.findIndex(x => x.OfferID === sOfferID);

				//path where the products should be stored
				var sPathTenderOfferProduct = "/Tender/Offer/results/" + iIndex + "/Product";

				//path is updated with the products
				aProducts = oFastAppDataModel.getProperty(sPathTenderOfferProduct);

				//if products are found
				if (aProducts.results) {

					//loop at each product to check if Results,Deliveries,Letters entities are filled
					//if its null we can not bind to it
					aProducts.results.forEach(function (oProduct, iIndex) {

						//if no results are saved, then use empty object for binding in the view of results tab
						if (!oProduct.Results || !oProduct.Results.results || oProduct.Results.results.length === 0) {
							//if no group purchasing, we add only 1 result
							that.addEmptyResultToProduct(oProduct, "");
						}

						/* Results where duplicated not only per product, but if group purchasing existed, they where also duplicated by institute.
						  This was no longer requested in ticket: https://trello.com/c/RH9khffV 
						if(oProduct.Results === null){
							if(oProduct.GroupPurchasing && oProduct.GroupPurchasing.results.length >0){
								//add an empty result for each group purchasing institute
								oProduct.GroupPurchasing.results.forEach(function(oGroupPurchasing){
									that.addEmptyResultToProduct(oProduct, oGroupPurchasing.InstituteID);
								});
							}else{
								//if no group purchasing, we add only 1 result
								that.addEmptyResultToProduct(oProduct, "");
							}
							
						}else{
							
							//results already saved in back-end, but lets check if all institutes from group purchasing exists (maybe new ones are added?)
							if(oProduct.GroupPurchasing && oProduct.GroupPurchasing.results.length >0){
								//add institutes from group purchasingthat does not exist in results
							}
							
						}
						*/

					});

				}
				//Deep copying not to keep reference to existing object
				aProducts = $.extend(true, {}, aProducts);
				//do we return only 1 specific product of all loaded products for the offer
				if (sProductCode) {

					if (aProducts && aProducts.results) {
						//only 1 product
						var aProductsFiltered = aProducts.results.filter(function (oProduct) {
							if (oProduct.ProductCode == sProductCode && oProduct.LotID == sLotID) {
								return oProduct;
							}
						});

						if (aProductsFiltered[0]) {
							return aProductsFiltered[0];
						}
					} else {
						//return empty
						return [];
					}

				}else {
					return aProducts;
				}

			}

		},

		//get quotation table template
		getSelectedQuotationTemplate: function () {
			return this._oSelectedQuotationTemplate;
		},

		//get message details
		getMessageDetails: function (oError) {

			var sMessageDetails = "";

			//Error occured: get message technical details
			if (oError.message) {
				//error message shown
				sMessageDetails = oError.message;
			} else {
				//more technical error shown
				if (oError.length > 0) {
					var oXML = jQuery.parseXML(oError[0].response.body);
					var oXMLmsg = oXML.querySelector("message");
					sMessageDetails = oXMLmsg.textContent;
				} else {

					if (oError.responseText) {
						var oResponseText = JSON.parse(oError.responseText);
						if (typeof (oResponseText.error.innererror.errordetails[0]) !== 'undefined') {
							sMessageDetails = oResponseText.error.innererror.errordetails[0].message;
						} else {
							sMessageDetails = oResponseText.error.message.value;
						}
					} else {
						sMessageDetails = "No technical details available."
					}

				}

			}

			return sMessageDetails;

		},

		//To keep track of tender master list - filters when leaving/returning to/from split screen
		getTenderMasterApplicationFilters: function () {
			return this._aTenderMasterApplicationFilters;
		},

		getRouterObject: function () {
			return this._oRouter;
		},
		
		//get particular service stored in the service file
		getService: function (sService) {
			return this._oAllServices[sService + 'Service'];
			
		},

		//SETTERS
		//-------
		/* only set these models by constructor
			//set model fast data for accessing the database
			setFastDataCalls: function (oModel){
				//Keep the model in the service file so it can be accessed here
				this._oFastDataCalls = oModel;
			},				

			//set model fast app data with data that is displayed on the views
			setFastAppDataModel: function (oModel){
				//Keep the model in the service file so it can be accessed here
				this._oFastAppDataModel = oModel;
			},
		*/

		//set default model in service file so we can refresh the data after saving
		setDefaultModel: function (oModel) {

			//we set the default model on the baseService so we can use it there
			this.setModel(oModel);

			//we set the default model also on the services so we can use int within the services as well
			this._defaultModel = oModel;

		},

		//Component ID
		setComponentID: function (sComponentID) {
			this._sComponentID = sComponentID;
		},

		//for keeping all sub-services stored in the service file
		setAllServices: function (oAllServices) {
			this._oAllServices = oAllServices;
		},

		//loading for clicking tile
		setLoadingTenderMasterDialog: function (oLoadingTenderMasterDialog) {
			this._oLoadingTenderMasterDialog = oLoadingTenderMasterDialog;
		},

		//TendersMaster table to access everywhere
		setTendersMasterTable: function (oTendersMasterTable) {
			this._oTendersMasterTable = oTendersMasterTable;
		},

		//set selected mode
		setEditMode: function (bEditMode) {
			this._bEditMode = bEditMode;
			//also keep edit mode in front-end so we can use it in the expression binding
			this.getFastAppDataModel().setProperty("/EditMode", bEditMode);
		},

		//get layout type two columns, onecolumn, mid expanded...
		setLayoutType: function (sLayoutType) {
			this._sLayoutType = sLayoutType;
		},

		//get current selected country code
		setSelectedCountry: function (sSelectedCountry) {
			this._sSelectedCountry = sSelectedCountry;
		},

		setOfferCreated: function (bOfferCreated) {
			this._bOfferCreated = bOfferCreated;
		},

		setRouterObject: function (oRouter) {
			this._oRouter = oRouter;
		},

		//set currently selected tender ID
		setSelectedTenderID: function (sSelectedTenderID) {
			this._sSelectedTenderID = sSelectedTenderID;
		},

		//set currently selected tender path
		setSelectedTenderPath: function (sSelectedTenderPath) {
			this._sSelectedTenderPath = sSelectedTenderPath;
		},

		//set currently selected tender No
		setNewTenderNo: function (sNewTenderNo) {
			this._sNewTenderNo = sNewTenderNo;
		},

		//set currently selected offer path
		setSelectedOfferPath: function (sSelectedOfferPath) {
			this._sSelectedOfferPath = sSelectedOfferPath;
		},

		//set selected offer id
		setSelectedOfferID: function (sSelectedOfferID) {

			this._sSelectedOfferID = sSelectedOfferID;
			var oOffer = this.getLoadedOffer(sSelectedOfferID);

			//also keep in app data model (used for binding to header view, instead of setting by ID of field)
			this.getFastAppDataModel().setProperty("/SelectedOfferID", sSelectedOfferID);
			this.getFastAppDataModel().setProperty("/SelectedOffer", oOffer);

		},

		//set selected offer available
		setSelectedOfferAvailable: function (bSelectedOfferAvailable) {
			this._bSelectedOfferAvailable = bSelectedOfferAvailable;
		},

		//set current selected productID TODO clear on switching between tabs!!
		setSelectedProductID: function (sProductID) {
			this._sSelectedProductID = sProductID;
		},

		//set selected product name
		setSelectedProductName: function (sProductName) {
			this._sSelectedProductName = sProductName;
			//also keep in app data model (used for binding to header view)
			this.getFastAppDataModel().setProperty("/SelectedProductName", sProductName);
		},

		//get current selected productPath TODO clear on switching between tabs!!
		setSelectedProductPath: function (sProductPath) {
			this._sSelectedProductPath = sProductPath;
		},

		//get current selected PriceCondition TODO clear on switching between tabs!!
		setSelectedPriceConditionPath: function (sPriceConditionPath) {
			this._sSelectedPriceConditionPath = sPriceConditionPath;
		},
		
		//get current quotation table template
		setSelectedQuotationTemplate: function (oTemplate) {
			this._oSelectedQuotationTemplate = oTemplate;
		},

		//To keep track of tender master list - filters when leaving/returning to/from split screen
		setTenderMasterApplicationFilters: function (aTenderMasterApplicationFilters) {
			this._aTenderMasterApplicationFilters = aTenderMasterApplicationFilters;
		},

		//set selected tabblad
		setSelectedTab: function (sSelectedTab) {
			this._sSelectedTab = sSelectedTab;
		},

		//Composite messages for during save of offer/product
		setOfferCompositeMessages: function (aOffercompositeMessages) {
			this._aOfferCompositeMessages = aOffercompositeMessages;
		},

		setDeliveryItemEdit: function (iDeliveryItemEdit) {
			this._iDeliveryItemEdit = iDeliveryItemEdit;
		},

		setLetterItemEdit: function (iLetterItemEdit) {
			this._iLetterItemEdit = iLetterItemEdit;
		},
		//ADDING
		//------

		//adding an empty Result to the Product, so we can bind to it
		addEmptyResultToProduct: function (oProduct, sInstituteID) {

			//if its null we can not bind to it
			var oEmptyResultDataForSave = {};
			var aResultsWithEmptyObject = []; //it has to be an array even if there is only 1 Result for 1 product

			//push data for saving
			oEmptyResultDataForSave = {
				TenderID: "",
				OfferID: "",
				CountryCode: "",
				InstituteID: sInstituteID,
				ProductCode: "",
				SubmittedOn: moment().utc().toDate(),
				SubmittedBy: UserInfo.getCWID(),
				Active: 0,
				AwardedCompany: "",
				AwardedProduct: "",
				AwardedPrice: "",
				Currency: "",
				UoM: "",
				ErrorInSubmission: "",
				Outcome: "",
				AwardedQty: "",
				Reason: "",
				Comment: "",
				AwardedTier: "",
				ExtensionNotes: null,
				ExtensionNotes: "",
				AwardLetterNo: "",
				AwardDelibNo: "",
				DeliveryDate: null,
				ResultDate: null,
				AwardDate: null,
				AwardActing: "",
				_sOperation: "POST"
			};

			//if there are no results existing for this product
			if (oProduct.Results === null) {

				//add the empty object to the oProduct object reference					
				aResultsWithEmptyObject.push(oEmptyResultDataForSave)
				oProduct.Results = {
					results: []
				};
				oProduct.Results.results = aResultsWithEmptyObject;
				aResultsWithEmptyObject = [];

			} else {
				oProduct.Results.results.push(oEmptyResultDataForSave);
			}

		},

		//MUTATORS
		//--------

		//show generic error messages all in the same way
		showErrorMessage: function (oError, sProcessText) {

			//generic message
			var sMessage = sProcessText + " failed. \n Please contact application administrator."; //default

			//get message details
			var sMessageDetails = this.getMessageDetails(oError);

			//formatting
			sMessageDetails = '<p><strong>' + sMessageDetails + '...</strong></p>';

			//if error message already exist, close first
			var oErrorDialog = sap.ui.getCore().byId("msgErrorGeneral");
			if (oErrorDialog) {
				//oErrorDialog.close();
				//oErrorDialog = {};
				oErrorDialog.destroy();

			}
			//show message
			sap.m.MessageBox.error(sMessage, {
				title: "Important message",
				id: "msgErrorGeneral",
				details: sMessageDetails,
				styleClass: "sapUiSizeCompact",
				contentWidth: "100px"
			});

		},

		//show no access message
		showNoAccessMessage: function (oError, sProcessText) {

			//generic message
			var sMessage = sProcessText + ". \n Please contact application administrator."; //default

			//get message details
			var sMessageDetails = this.getMessageDetails(oError);

			//show message
			sap.m.MessageBox.warning(sMessage, {
				title: "User has no access yet.",
				id: "msgErrorAccess",
				details: sMessageDetails,
				styleClass: "sapUiSizeCompact",
				contentWidth: "100px",
				actions: ["Request access"],
				onClose: function () {

					//email content
					var sCloudUser = UserInfo.getUserName();
					var sEmail = "FAST_Admin@bayer.com";
					var sEmailCC = "fabian.deck@bayer.com;frank.schmitt1@bayer.com";
					var sSubject = "Access to Fast Tender management: " + sCloudUser;
					var sBody = "Can you please grant me access? My SAP cloud platform user is " + sCloudUser + ".";

					//trigger default email
					sap.m.URLHelper.triggerEmail(sEmail, sSubject, sBody, sEmailCC);

					//Leave application
					//var logoutUrl = window.location.host + window.location.pathname + window.location.hash;
					//window.location = logoutUrl;
					window.location.reload(true);
				}
			});

		},

		showMessageCompositeView: function (sTitle, aMessages, sState) {

			var that = this;

			//template for message view
			//if we want to make a link to additional information page we can use oLink in the template
			var oLink = new sap.m.Link({
				text: "Show more information",
				href: "http://sap.com",
				target: "_blank"
			});

			var oMessageTemplate = new sap.m.MessageItem({
				type: '{type}',
				title: '{title}',
				description: '{description}',
				subtitle: '{subtitle}',
				counter: '{counter}',
				markupDescription: '{markupDescription}'
					//link: oLink
			});

			//Message view (where multiple errors can be bundeled)
			var oMessageView = new sap.m.MessageView({
					showDetailsPageHeader: false,
					itemSelect: function () {
						oBackButton.setVisible(true);
					},
					items: {
						path: "/",
						template: oMessageTemplate
					}
				}),
				oBackButton = new sap.m.Button({
					icon: sap.ui.core.IconPool.getIconURI("nav-back"),
					visible: false,
					press: function () {
						oMessageView.navigateBack();
						this.setVisible(false);
					}
				});

			//add messages	
			var oMessageModel = new JSONModel();
			oMessageModel.setData(aMessages);
			oMessageView.setModel(oMessageModel);

			//show dialog
			var oDialogMessages = new sap.m.Dialog({
				resizable: true,
				content: oMessageView,
				state: sState,
				beginButton: new sap.m.Button({
					press: function () {
						if (that.getOfferCreated()) {
							that.setOfferCreated(false);
							that.getRouterObject().navTo("detail", {
								layout: that.getLayoutType(),
								tender: that.getSelectedTenderID(),
								offer: that.getSelectedOfferID(),
								tab: that.getSelectedTab(),
								country: that.getSelectedCountry()
							});
						} else {
							this.getParent().close();
						}
					},
					text: "Close"
				}),
				customHeader: new sap.m.Bar({
					contentMiddle: [
						new sap.m.Text({
							text: sTitle
						})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "300px",
				contentWidth: "500px",
				verticalScrolling: false
			});

			oDialogMessages.open();

		},
		
		//sorting an array of objects
		sortByKeyDesc: function (array, key) {
			if (array) {
				return array.sort(function (a, b) {
					var x = a[key];
					var y = b[key];
					return ((x > y) ? -1 : ((x < y) ? 1 : 0));
				});
			}
		},

		//sorting an array of objects
		sortByKeyAsc: function (array, key) {
			if (array) {
				return array.sort(function (a, b) {
					var x = a[key];
					var y = b[key];
					return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				});
			}

		},

		//CHECKERS
		//--------
		/*
		//check offer valid for tab (TODO we should remove the offer table, instead filter here on tender offers based upon filters from tab)
		checkOfferValidForTab: function (sOfferID, iIndexColumnOfferID, oOffersTable) {

			//get items of offertable
			var aItems = oOffersTable.getItems();
			var bOfferValid = false;

			//Select again the same offer
			aItems.forEach(function (oItem) {
				if (oItem.getCells()[iIndexColumnOfferID].getTitle() === sOfferID) {
					bOfferValid = true;
				}
			});

			//return offer valid
			return bOfferValid;

		},
		*/

		checkOfferVisibleForTab: function (oOffer, sSelectedSection) {

			var bVisible = true;

			if (oOffer) {

				//only continue the checks if the offer is active & not deleted. If any of both cases does not meet the requirements, the offer should not be shown
				/*if(oOffer.Active !== 1 || oOffer.ActiveOffer !== 1){
					bVisible = false;
				}*/

				if (bVisible) {
					// particular logic per page section
					switch (sSelectedSection) {
					case this.getBasicInformationPageSectionID():
						//No particular status checks are needed, as the offer should be shown for all statuses
						bVisible = true;
						break;
					case this.getOfferProductPageSectionID():
						//No particular status checks are needed, as the offer should be shown for all statuses
						bVisible = true;
						break;
					case this.getFinancialOfferPageSectionID():
						//The offer should be shown for all statuses, except for:
						//	- 'Wholesale Offer' 
						//  - 'Offer Declined'
						if (oOffer.OfferStatus.STATUS !== 'Wholesale Offer' &&
							oOffer.OfferStatus.STATUS !== 'Offer Declined') {
							bVisible = true;
						} else {
							bVisible = false;
						}
						break;
					case this.getFinancialOfferPageSectionID_IT():
						//The offer should be shown for all statuses, except for:
						//	- 'Wholesale Offer' 
						//  - 'Offer Declined'
						if (oOffer.OfferStatus.STATUS !== 'Wholesale Offer' &&
							oOffer.OfferStatus.STATUS !== 'Offer Declined') {
							bVisible = true;
						} else {
							bVisible = false;
						}
						break;
                    case this.getFinancialOfferPageSectionID_ES():
						//The offer should be shown for all statuses, except for:
						//	- 'Wholesale Offer' 
						//  - 'Offer Declined'
						if (oOffer.OfferStatus.STATUS !== 'Wholesale Offer' &&
							oOffer.OfferStatus.STATUS !== 'Offer Declined') {
							bVisible = true;
						} else {
							bVisible = false;
						}
						break;

                    case this.getFinancialOfferPageSectionID_BR():
						//The offer should be shown for all statuses, except for:
						//	- 'Wholesale Offer' 
						//  - 'Offer Declined'
						if (oOffer.OfferStatus.STATUS !== 'Wholesale Offer' &&
							oOffer.OfferStatus.STATUS !== 'Offer Declined') {
							bVisible = true;
						} else {
							bVisible = false;
						}
						break;

					case this.getQuotationPageSectionID():
						//The offer should be shown for all statuses, except for:
						//	- 'Wholesale Offer' 
						//  - 'Offer Declined'
						//AND the price should be set for this quotation (//TODO)
						if (oOffer.OfferStatus.STATUS !== 'Wholesale Offer' &&
							oOffer.OfferStatus.STATUS !== 'Offer Declined' &&
							Financial.checkAllProductPricesSet(oOffer)) {
							bVisible = true;
						} else {
							bVisible = false;
						}
						break;
					case this.getTenderResultsPageSectionID():
						//The offer should be shown in case the offer status is:
						//	- 'Quotation Submitted' 
						//  - 'Results Recorded'
						//  - 'Delivery Ongoing'
						if (oOffer.OfferStatus.STATUS === 'Quotation Submitted' ||
							oOffer.OfferStatus.STATUS === 'In FOC Negotiation' ||
							oOffer.OfferStatus.STATUS === 'Appeal in Progress' ||
							oOffer.OfferStatus.STATUS === 'Results Recorded' ||
							oOffer.OfferStatus.STATUS === 'Delivery Ongoing') {
							bVisible = true;
						} else {
							bVisible = false;
						}
						break;
					case this.getDeliveryTrackingPageSectionID():
						//The offer should be shown in case the offer status is:
						//	- 'Results Recorded'
						//  - 'Delivery Ongoing'
						if (oOffer.OfferStatus.STATUS === 'In FOC Negotiation' ||
							oOffer.OfferStatus.STATUS === 'Appeal in Progress' ||
							oOffer.OfferStatus.STATUS === 'Results Recorded' ||
							oOffer.OfferStatus.STATUS === 'Delivery Ongoing') {
							bVisible = true;
						} else {
							bVisible = false;
						}
						break;
					default:
					}
				}

			} else {

				//if no offer exists only visible tabs are Basic info & offer Products: beceause we still need to be able to create an offer or change tender info
				switch (sSelectedSection) {
				case this.getBasicInformationPageSectionID():
					//No particular status checks are needed, as the offer should be shown for all statuses
					bVisible = true;
					break;
				case this.getOfferProductPageSectionID():
					//No particular status checks are needed, as the offer should be shown for all statuses
					bVisible = true;
					break;
				default:
					//on all other 
					bVisible = false;
				}

			}

			//keep result also on fastApp data model
			let oFastAppDataModel = this.getFastAppDataModel();
			oFastAppDataModel.setProperty("/CheckOfferVisibleForTab", bVisible);

			return bVisible;
		},

		//Check if products are vallid for the offer.
		//Use case: a reviewed or continued offer, clone to check if products still valid for sales 
		checkProductValidForOffer: function (sProductID, sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sSellingCompany,
			aCommercialAgreement) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			//load the corresponding products for the input list
			var aBrandTokens = [];

			var bValid = false;

			$.when(that.loadBrandProductNameList(sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sSellingCompany,
				aCommercialAgreement, aBrandTokens)).done(function (oData) {
				//check if product exist in list
				if (oData && oData.results && oData.results.length > 0) {

					//find product
					var iIndexProduct = oData.results.findIndex(x => x.PRODUCT_ID === sProductID);

					//check if product is found in valid product list
					if (iIndexProduct === -1) {
						//product is no longer valid for offer
						bValid = false;
					} else {
						//product is valid for offer
						bValid = true;
					}

					//let the callback be triggered
					oDeferred.resolve(bValid);

				} else {
					bValid = false;
					//no products find that are valid for this combination
					oDeferred.resolve(bValid);
				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//LOADERS
		//-------
		getCurrentUser: function () {

			var oFastDataCalls = this.getDefaultModel(); 
			return oFastDataCalls.metadataLoaded().then(function(oData){
				
				//check metadata to see if  getCurrentUser exists
				var oMetaData = oFastDataCalls.getServiceMetadata();
				var bFastCap = false;
				
				if( oMetaData 
				    && oMetaData.dataServices 
				    && oMetaData.dataServices.schema[0] 
				    && oMetaData.dataServices.schema[0].entityContainer
				    && oMetaData.dataServices.schema[0].entityContainer[0]
				    && oMetaData.dataServices.schema[0].entityContainer[0].functionImport.find(x => x.name === 'getCurrentUser')
				){
					bFastCap = true; //we are in CAP
				};
				
				if(bFastCap){
					return new Promise((resolve, reject) => {
						oFastDataCalls.callFunction("/getCurrentUser", {
							success: function (data) {
									resolve(data);
							},
							error: function (oError) {
									reject(oError);
							}
						});					
					});					
				}else{
					return new Promise((resolve, reject) => {
						reject("Not on FastCap");
					});
				}

				
			});
  


		},

		getMailTemplate: function(sCountryCode, sLanguage, sOfferId) {
			var oFastDataCalls = this.getDefaultModel(); 
			return oFastDataCalls.metadataLoaded().then(function(oData){
				return new Promise((resolve, reject) => {
					oFastDataCalls.callFunction("/getMailTemplate", {
						urlParameters: {
							"countryCode": sCountryCode,
							"language": sLanguage,
							"offerId": sOfferId,
						},
						success: function (data) {
								resolve(data);
						},
						error: function (oError) {
								reject(oError);
						}
					});					
				});					
			});
		},

		//load User information from back-end and keep information in userinfo
		loadUserInfo: function () {

			var oDeferred = $.Deferred();
			var that = this;

			//get fast data calls
			var oFastDataCalls = this.getDefaultModel(); //this.getFastDataCalls();

			//get user name of logedin user
			this.getCurrentUser().then(user => {
				UserInfo.setUserName(user.name);
			}).catch(fail=>{
				console.log("Not running on CF using CAP")
			}).then(()=>{
				var sUserName = UserInfo.getUserName();
				//build path for getting the user external ID + next tender number
				var sPathUserInfo = "/Users('" + encodeURIComponent(sUserName) + "')"; //"/UserInfo('" + UAT + "')"

				//read the UserInfo view from the back-end
				oFastDataCalls.read(sPathUserInfo, {
					urlParameters: {
						"$expand": "toUserCountries"
					},
					success: function (oData, oResponse) {

						//keep tool ID
						UserInfo.setToolID(oData.TOOL_ID);

						//keep the external Active directory id
						UserInfo.setCWID(oData.CWID);

						//set the user email
						UserInfo.setUserEmail(oData.UserEmail);

						//set the user role
						UserInfo.setRole(oData.ROLE);

						//keep the countries to which the user has access
						oData.toUserCountries.results = that.sortByKeyAsc(oData.toUserCountries.results, "COUNTRY_NAME");
						UserInfo.setUserCountries(oData.toUserCountries);

						//let the callback be triggered: all data is loaded
						oDeferred.resolve();

					},
					error: function fnError(oError) {

						//Message
						var sMessage = "User ID (" + UserInfo.getUserName() + ") doesn't have access";

						//show error message
						that.showNoAccessMessage(oError, sMessage);

						oDeferred.reject(oError);

					}
				});
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},

		//load country origin's
		loadCountryOrigins: function (sCountry) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sCountryTenderOriginPath = "/CountryTenderOrigin";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			//Reading the back end data from the tender table
			oFastDataCalls.read(sCountryTenderOriginPath, {
				filters: aFilters,
				urlParameters: {
					"$expand": "TenderOrigin"
				},
				success: function (oData, oResponse) {

					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var aCountryOrigins = oData.results;

					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var oEmptyCounctyOrigin = {
						TENDER_ORIGIN_ID: "",
						TenderOrigin: {
							CODE: "All",
							NAME: "All"
						}
					};

					//data received is set
					aCountryOrigins.push(oEmptyCounctyOrigin);
					aCountryOrigins = that.sortByKeyAsc(aCountryOrigins, "TENDER_ORIGIN_ID");
					oFastAppDataModel.setProperty("/CountryTenderOrigin", aCountryOrigins);

					//let the callback be triggered
					oDeferred.resolve(aCountryOrigins);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of country origins");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//load country currency's
		loadCountryCurrency: function (sCountry) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sCountryCurrencyPath = "/CountryCurrency";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			//Reading the back end data from the tender table
			oFastDataCalls.read(sCountryCurrencyPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var aCountryCurrency = oData.results;
					var oEmptyCounctyCurrency = {
						COUNTRY_CODE: "",
						CURRENCY: ""
					};
					aCountryCurrency.push(oEmptyCounctyCurrency);
					aCountryCurrency = that.sortByKeyAsc(aCountryCurrency, "COUNTRY_CODE");

					//data received is set to the award model
					oFastAppDataModel.setProperty("/CountryCurrency", aCountryCurrency);

					//let the callback be triggered
					oDeferred.resolve(aCountryCurrency);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of country currency");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//load penalty reasons
		loadPenaltyReasons: function () {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sPenaltyReasonsPath = "/PT_TMPNLTYRS";

			//Reading the back end data from the tender table
			oFastDataCalls.read(sPenaltyReasonsPath, {
				success: function (oData, oResponse) {
					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var aPenaltyReasons = oData.results;
					var oEmptyPenaltyReasons = {
						PenaltyReasons: ""
					};
					aPenaltyReasons.push(oEmptyPenaltyReasons);
					aPenaltyReasons = that.sortByKeyAsc(aPenaltyReasons, "COUNTRY_CODE");

					//data received is set to the award model
					oFastAppDataModel.setProperty("/PenaltyReasons", aPenaltyReasons);

					//let the callback be triggered
					oDeferred.resolve(oData);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of Penalty Reasons");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},
		
		//load country classifications
		loadCountryClassifications: function (sCountry) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sCountryClassificationPath = "/CountryClassifications";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			//Reading the back end data from the tender table
			oFastDataCalls.read(sCountryClassificationPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var aCountryClassifications = oData.results;
					
					// add an empty value at the begining of the array. needed for the dropdown
					if(oData.results.length > 0){
						aCountryClassifications.unshift({});
					}
					
					//data received is set
					oFastAppDataModel.setProperty("/CountryClassifications", aCountryClassifications);

					//let the callback be triggered
					oDeferred.resolve(aCountryClassifications);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of country classifications");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

        loadCountryApprovers: function (sCountry, sDivision) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sCountryApproversPath = "/CountryApprovers";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}
            if (sDivision){
				aFilters.push(new sap.ui.model.Filter("Division", sap.ui.model.FilterOperator.EQ, sDivision));
            }

			//Reading the back end data from the tender table
			oFastDataCalls.read(sCountryApproversPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var aCountryApprovers = oData.results;
					
					// add an empty value at the begining of the array. needed for the dropdown
					if(oData.results.length > 0){
						aCountryApprovers.unshift({});
					}
					
					//data received is set
					oFastAppDataModel.setProperty("/CountryApprovers", aCountryApprovers);

					//let the callback be triggered
					oDeferred.resolve(aCountryApprovers);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of country approvers");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//load country channels
		loadCountryChannels: function (sCountry) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sCountryChannelsPath = "/CountryChannels";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("ChannelCountry", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}
            //EHQUT-196584-Add OTC/Drugstore customer list in "Offer Management" application
			//aFilters.push(new sap.ui.model.Filter("ChannelName", sap.ui.model.FilterOperator.NE, 'OTC')); //exclude OTC
            //EHQUT-196584-Add OTC/Drugstore customer list in "Offer Management" application
			//Reading the back end data from the tender table
			oFastDataCalls.read(sCountryChannelsPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var aCountryChannels = oData.results;

					//data received is set
					oFastAppDataModel.setProperty("/CountryChannels", aCountryChannels);

					//let the callback be triggered
					oDeferred.resolve(aCountryChannels);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of country channels");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		// load CountryBiddingTypeLevel1
		loadCountryBiddingTypeLevel1: function(sCountry, sClassificationID) {

			// if no country is set don't run this method
			if(!sCountry || sCountry.indexOf("NA") > -1 || !sClassificationID){
				return undefined;
			}

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			//var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			oFastAppDataModel.setProperty("/CountryBiddingTypeLevel1", []);

			var that = this;

			var sPath = "/CountryBiddingTypeLevel1";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			if (sClassificationID) {
				let oFilter = new sap.ui.model.Filter("ClassificationID", sap.ui.model.FilterOperator.EQ, sClassificationID);
				aFilters.push(oFilter);
			}

			const promise = new Promise((resolve, reject) => {
				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) { 

						//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
						var aCountryBiddingTypeLevel1 = oData.results;

						// add an empty value at the begining of the array. needed for the dropdown
						if(oData.results.length > 0){
							aCountryBiddingTypeLevel1.unshift({});
						}


						//data received is set
						oFastAppDataModel.setProperty("/CountryBiddingTypeLevel1", aCountryBiddingTypeLevel1);

						//let the callback be triggered
						resolve(aCountryBiddingTypeLevel1);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of country BiddingTypeLevel1");

						//let the callback be triggered
						reject(oError);

					}
				});
			});

			

			//return promise so the function can check if execution is done
			// return oDeferred.promise();
			return  promise;
		},

		/**
		 * load CountryBiddingTypeLevel2
		 * @param {string} sCountry - 
		 * @param {string} sBiddingTypeLevel1Id -
		 * @return {undefined} - returns a promise
		 */
		loadCountryBiddingTypeLevel2: function(sCountry, sBiddingTypeLevel1Id) {

			// if no country is set don't run this method
			if(!sCountry || sCountry.indexOf("NA") > -1 || !sBiddingTypeLevel1Id){
				return undefined;
			}

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			// var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			// empty the CountryBiddingTypeLevel2 first. this is needed, otherwise the dropdown will be emtpty 
			oFastAppDataModel.setProperty("/CountryBiddingTypeLevel2", []);

			var that = this;

			var sPath = "/CountryBiddingTypeLevel2";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			if (sBiddingTypeLevel1Id) {
				let oFilter = new sap.ui.model.Filter("BiddingTypeLevel1ID", sap.ui.model.FilterOperator.EQ, sBiddingTypeLevel1Id);
				aFilters.push(oFilter);
			}

			const promise = new Promise((resolve, reject) => {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) { 
						//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
						const aCountryBiddingTypeLevel2 = oData.results;

						// add an empty value at the begining of the array. needed for the dropdown
						if(oData.results.length > 0){
							aCountryBiddingTypeLevel2.unshift({});
						}

						//data received is set to the model
						oFastAppDataModel.setProperty("/CountryBiddingTypeLevel2", aCountryBiddingTypeLevel2);

						resolve(aCountryBiddingTypeLevel2);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of country BiddingTypeLevel2");

						//let the callback be triggered
						//oDeferred.reject(oError);
						reject(oError);

					}
				});
				
			});


			return promise;

			//return promise so the function can check if execution is done
			//return oDeferred.promise();
		},

		// load CountryBiddingTypeLevel3
		loadCountryBiddingTypeLevel3: function(sCountry, sBiddingTypeLevel2Id) { 

			// if no country is set don't run this method
			if(!sCountry || sCountry.indexOf("NA") > -1 || !sBiddingTypeLevel2Id){
				return undefined;
			}

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			// var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			oFastAppDataModel.setProperty("/CountryBiddingTypeLevel3", []);

			var that = this;

			var sPath = "/CountryBiddingTypeLevel3";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			if (sBiddingTypeLevel2Id) {
				let oFilter = new sap.ui.model.Filter("BiddingTypeLevel2ID", sap.ui.model.FilterOperator.EQ, sBiddingTypeLevel2Id);
				aFilters.push(oFilter);
			}

			const promise = new Promise((resolve, reject) => {
				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) { 

						//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
						var aCountryBiddingTypeLevel3 = oData.results;

						// add an empty value at the begining of the array. needed for the dropdown
						if(oData.results.length > 0){
							aCountryBiddingTypeLevel3.unshift({});
						}
						
						//data received is set
						oFastAppDataModel.setProperty("/CountryBiddingTypeLevel3", aCountryBiddingTypeLevel3);

						//let the callback be triggered
						resolve(aCountryBiddingTypeLevel3);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of country BiddingTypeLevel3");

						//let the callback be triggered
						reject(oError);

					}
				});
			});

			

			//return promise so the function can check if execution is done
			return promise;
		},

		// load CountrySpecifications
		loadCountrySpecifications: function(sCountry, sClassificationId) { 

			// if no country is set don't run this method
			if(sCountry.indexOf("NA") > -1){
				return undefined;
			}

			
			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			// var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sPath = "/CountrySpecifications";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			if (sClassificationId) {
				let oFilter = new sap.ui.model.Filter("ClassificationID", sap.ui.model.FilterOperator.EQ, sClassificationId);
				aFilters.push(oFilter);
			}

			const promise = new Promise((resolve, reject) => {
				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) { 

						//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
						var aCountrySpecifications = oData.results;

						//data received is set
						oFastAppDataModel.setProperty("/CountrySpecifications", aCountrySpecifications);

						//let the callback be triggered
						resolve(aCountrySpecifications);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of country specifications");

						//let the callback be triggered
						reject(oError);

					}
				});
			});

			

			//return promise so the function can check if execution is done
			return promise;
		},

        loadCountryOfferTypes: function(sCountry){
            let oFastAppDataModel = this.getFastAppDataModel();
            let aOfferTypes = {
                "Types": [
                    {
						"CountryCode": "BR",
						"OfferType": "",
                        "Enabled": true
					},
					{
						"CountryCode": "BR",
						"OfferType": "Selling",
                        "Enabled": true
					},
					{
						"CountryCode": "BR",
						"OfferType": "Comodato",
                        "Enabled": true
					},
                    {
						"CountryCode": "IT",
						"OfferType": "",
                        "Enabled": true
					},
					{
						"CountryCode": "IT",
						"OfferType": "Selling",
                        "Enabled": true
					},
					{
						"CountryCode": "IT",
						"OfferType": "Rental",
                        "Enabled": true
					},
					{
						"CountryCode": "IT",
						"OfferType": "Comodato",
                        "Enabled": true
					}
				],
            }

            
            let sPath = '/CountrySpecificOfferTypes';
            aOfferTypes = aOfferTypes?.Types?.filter(type => type.CountryCode === sCountry);
            if(aOfferTypes && aOfferTypes.length > 0){
                oFastAppDataModel.setProperty(sPath, aOfferTypes);
            }
        },

		// load CountrySpecifications
		loadCountryCompetitors: function(sCountry, sProductCode) { 

			// if no country is set don't run this method
			if(sCountry.indexOf("NA") > -1){
				return;
			}


			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sPath = "/MasterCompetitors";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}
			
			//EFRCL- 308719- Italy-competitors DB is empty
			if (sProductCode && sCountry !=='IT') {
				let oFilter = new sap.ui.model.Filter("ProductCode", sap.ui.model.FilterOperator.EQ, sProductCode);
				aFilters.push(oFilter);
			}

			//Reading the back end data from the tender table
			oFastDataCalls.read(sPath, {
				filters: aFilters,
				success: function (oData, oResponse) { 

					var aCountryCompetitors = oData.results;

					var oOtherCompetitor = {
						CompetitorCompany: "Other",
						CompetitorProduct: "Other",
						CountryCode: sCountry,
						ID:"1",
					}
					aCountryCompetitors.push(oOtherCompetitor);


					var oEmptyCompetitor = {
						CompetitorCompany: "",
						CompetitorProduct: "",
						CountryCode: "",
						ID:""
					};

					//data received is set
					aCountryCompetitors.push(oEmptyCompetitor);
					aCountryCompetitors = that.sortByKeyAsc(aCountryCompetitors, "CompetitorCompany");

					//data received is set
					oFastAppDataModel.setProperty("/CountryCompetitors", aCountryCompetitors);
					oFastAppDataModel.setProperty("/CountryCompetitorProducts", aCountryCompetitors);
					oFastAppDataModel.setProperty("/CountryCompetitorCompanies", [...new Map(aCountryCompetitors.map(item => [item['CompetitorCompany'], item])).values()]);

					//let the callback be triggered
					oDeferred.resolve(aCountryCompetitors);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of country competitors");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},

		//load country channels
		loadCountryStatusses: function (sCountry) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sCountryChannelsPath = "/MASTER_COUNTRY_STATUS";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			//Reading the back end data from the tender table
			oFastDataCalls.read(sCountryChannelsPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var aCountryChannels = oData.results;

					//data received is set
					oFastAppDataModel.setProperty("/CountryStatusses", aCountryChannels);

					//let the callback be triggered
					oDeferred.resolve(aCountryChannels);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of country statusses");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		loadBrazilContractStatuses: function () {
			const oFastAppDataModel = this.getFastAppDataModel();
			return this.getService('Result').getBrazilContractStatuses().then((response) => {
				oFastAppDataModel.setProperty("/BrazilContractStatuses", response.data.results);
			});
		},
		saveBrazilContract: function (mappedContract, mappedContractProducts) {
			return this.createBrazilContract(mappedContract).then((response) => {
				const contractID = response.data.ID;
				mappedContractProducts.forEach(product => product.Contract_ID = contractID);
				return this.createBrazilContractProducts(mappedContractProducts);
			});
		},
		createBrazilContract: async function (contract) {
			return this.getService('Result').createBrazilContract(contract);
		},
		createBrazilContractProducts: function (products) {
			const promises = products.map(product => {
				return this.getService('Result').createBrazilContractProduct(product);
			});
			return Promise.all(promises);
		},

		simulateTaxes: function (payload) {
			return this.getService('Result').simulateTaxes(payload);
		},

		//load country channels
		loadCountryOutcomes: function (sCountry) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sCountryChannelsPath = "/MASTER_COUNTRY_OUTCOMES";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			//Reading the back end data from the tender table
			oFastDataCalls.read(sCountryChannelsPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
					var aCountryOutcomes = oData.results;

					if(oData.results.length > 0){
                        //EHQUT-OTT-118849-Making decision pending as default
                        if(sCountry !=='IT'){
						aCountryOutcomes.unshift({CountryCode:sCountry,Outcome:"",Sorter:"0"});
                        }
                        //EHQUT-OTT-118849-Making decision pending as default
					}

					//data received is set
					oFastAppDataModel.setProperty("/CountryOutcomes", aCountryOutcomes);

					//let the callback be triggered
					oDeferred.resolve(aCountryOutcomes);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of country outcomes");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//load new tender ID from DB
		loadNewTenderID: function () {

			var oDeferred = $.Deferred();
			var that = this;

			//get fast data calls
			var oFastDataCalls = this.getDefaultModel();

			//get selected country
			var sCountry = this.getSelectedCountry();

			//build path for getting the user external ID + next tender number
			var sPathCountryTenderNo = "/CountryTenderNo('" + sCountry + "')";

			//changed to country-based no.: get user name of logedin user
			//var sUserName = UserInfo.getUserName();

			//changed to country-based no.: build path for getting the user external ID + next tender number
			//var sPathUserInfo = "/Users('" + encodeURIComponent(sUserName) + "')"; //"/UserInfo('" + UAT + "')"

			//changed to country-based no.: read the UserInfo view from the back-end
			//read the CountryTenderNo from backend
			oFastDataCalls.read(sPathCountryTenderNo, {
				success: function (oData, oResponse) {

					//get year & country
					var sYear = moment().format('YY');
					var sCountry = that.getSelectedCountry();

					//new tender ID is build by country
					var sNewTenderID = sCountry + "-" + sYear + "-" + oData.NEXT_TENDER_NO;

					//clear offer id
					that.setSelectedOfferID("");
					that.setSelectedProductID("");
					that.setSelectedProductName("");

					//set new tenderID & tenderNo
					that.setSelectedTenderID(sNewTenderID);
					that.setNewTenderNo(oData.NEXT_TENDER_NO);

					//let the callback be triggered: all data is loaded
					oDeferred.resolve(sNewTenderID);

				},
				error: function fnError(oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of additional offer data");

					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//loading all tender en product offer info needed for fastAppData model
		loadAllFastAppDataForProdOffer: function (sTenderID, bLoadedCheck) {

			//deffered
			var oDeferred = $.Deferred();
			var that = this;
			var oFastAppDataModel = that.getFastAppDataModel();
			var oTenderLoaded = oFastAppDataModel.getProperty("/Tender"); //check if tender data is already loaded

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			//check if tender data is already loaded
			if (bLoadedCheck === true && oTenderLoaded && oTenderLoaded.TenderID === sTenderID) {

				//close loading dialog
				that._LoadingDialog.close();

				//let the callback be triggered: all data is already loaded for this tender
				oDeferred.resolve(oTenderLoaded);

			} else {

				//In this case we have selected a tender that was not yet loaded or we want to reload already loaded tender
				$.when(that.loadTenderData(sTenderID)).done(function (oTenderData) {

					//loop at offers to load additional data for offer Distributor
					$.when(that.loadAdditionalOfferData(sTenderID)).done(function (oAdditionalOfferData) {

						//read product data for the offers found in the tender
						$.when(that.loadProductDataForOffers()).done(function (oProductData) {

							/*
							//set offer & product as not selected (otherwise nothing is displayed)
							that.setSelectedOfferID("");
							that.setSelectedOfferPath("");
							that.setSelectedProductID("");
							that.setSelectedProductName("");
							that.setSelectedProductPath("");
							*/

							//close loading dialog
							that._LoadingDialog.close();

							//let the callback be triggered: all data is loaded
							oDeferred.resolve(oProductData);

						});

					});

				});

			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//loading the Tender data of the selected tender with all info
		loadTenderData: function (sTenderID, aFilters) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			//tenderpath
			var sTenderPath = "/PT_TMTEND('" + sTenderID + "')";

			if (sTenderPath && sTenderPath !== "/PT_TMTEND('1')") { //not null, empty, undefined.. and not a new tender TODO work with service file to know which button is pressed....

				//Reading the back end data from the tender table
				oFastDataCalls.read(sTenderPath, {
					filters: aFilters,
					urlParameters: {
						"$expand": "Institute/Children/Institute,Offer,Criteria,TenderValue,Brands,NextOfferId,CommercialAgreement,Specifications,CountrySpecificInformation,User,Country"
					},
					success: function (oData, oResponse) {

						//data received is set to the award model
						/*
						oFastAppDataModel.setData({
							Tender: oData //oData.results (als er meerdere resultaten zijn)
						});
						*/
						oFastAppDataModel.setProperty("/Tender", oData);

						// set the CountrySpecificInformation 
						if(oData.CountrySpecificInformation){
							oFastAppDataModel.setProperty("/CountrySpecificTenderInformation", oData.CountrySpecificInformation);
						}
						
						//Keep institute + childeren list
						that.bindInstituteWithChildren(oData.Institute);

						//let the callback be triggered
						oDeferred.resolve(oData);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of tender data");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			} else {
				//let the callback be triggered TODO go back to the tender master afterwardsè!
				var oData = {
					NothingToReload: true
				}
				oDeferred.resolve(oData);
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//Load Additional OfferData: like Tender
		loadAdditionalOfferData: function (sTenderID, aFilters) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			//path for additional offer data
			var sTenderPath = "/PT_TMTEND('" + sTenderID + "')";
			var sAdditionalOfferDataPath = sTenderPath + "/Offer"; //PT_TMTEND(TenderID='SA-100-TEST-AH',Active=1)/Offer?filter=Active%20eq%201&$expand=Distributor&format=json

			if (sAdditionalOfferDataPath) { //not null, empty, undefined..

				var that = this;

				//Reading the back end data from the tender table
				oFastDataCalls.read(sAdditionalOfferDataPath, {
					filters: aFilters,
					urlParameters: {
						"$expand": "Distributor,OfferStatus,Tender,Revision,SellingCompanyDetails/Signatories,Signatories,Quotation,Lots" //,Product" --> no product found = product null in enity, which gives problems
					},
					success: function (oData, oResponse) {

						//data received is set to the FastAppDataModel
						oFastAppDataModel.setProperty("/Tender/Offer/results", oData.results);

						//let the callback be triggered
						oDeferred.resolve(oData);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of additional offer data");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//loading the products of the offers linked to the selected tender
		loadProductDataForOffers: function (aFilters) {

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();
			var that = this;

			//products
			var aProductsResults = [];
			//catch all promises in an array
			let promises = [];
			//if all promsises are done
			var oDeferred_all = $.Deferred();

			//get all the offers of the Tender
			var aOffers = oFastAppDataModel.getProperty("/Tender/Offer/results");

			//check if offers exist
			if (aOffers) {

				//count the number of offers
				var iOffersCount = aOffers.length;

				//loop over the offers and get the matching products and product info
				for (var i = 0; i < iOffersCount; i++) {

					promises.push(that.loadProductDataForOffer(aOffers[i].OfferID).then(function (oData) {

						//add to array for binding
						aProductsResults.push(oData);

					}));

				}

				//if all promises pushed from the loop have received their answer
				Promise.all(promises).then((result) => {
					//return aProductsForBinding;
					oDeferred_all.resolve(aProductsResults);
				})

			} else {

				//we still need to resolve this method, otherwise we don't return correctly
				var sMessage = 'No products to be loaded';
				return oDeferred_all.resolve(sMessage);

			}

			return oDeferred_all.promise();

		},

		//load the product data for 1 offer of the selected tender
		loadProductDataForOffer: function (sOfferID) {

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();
			var that = this;

			//lets work with callbacks (3 places, return, resolve, reject)
			var oDeferred = $.Deferred();

			var sOfferProductsPath = "";

			//filters
			var aFilters = [];

			//active only offers only
			var oFilter = new sap.ui.model.Filter(
				"Active",
				sap.ui.model.FilterOperator.EQ,
				"1"
			);

			//Add to filter array
			aFilters.push(oFilter);

			sOfferProductsPath = "/PT_TMOFRS('" + sOfferID + "')/Product";

			//Reading the back end data from the tender table
			oFastDataCalls.read(sOfferProductsPath, {
				filters: aFilters,
				urlParameters: {
					"$expand": "SKU/Product/ProductPacks/ProductPackSKUs,SKU/ProductPackSKUs,Price,RegisteredPrice,Cogs,Results/CompetitorResult,Deliveries,Letters,Scenario,SKUCountry/ProductPack/ProductPackSKUs,Offer,GroupPurchasing/Institute,PriceAgreement,PriceCondition/PriceConditionClassification,PriceCondition/DiscountCondition,PriceCondition/FreeGoodsOther,PriceCondition/RoyalDecreePercentage" //added from results on
				},
				success: function (oDataProducts, oResponse) {
					if (oDataProducts.results[0]) { //if products are found add them to the Model

						//offers from application model
						var aOffers = oFastAppDataModel.getProperty("/Tender/Offer/results");
						//index of offerID found in the offer
						var iIndex = aOffers.findIndex(x => x.OfferID === sOfferID);
						//path where the products should be stored
						var sPathTenderOfferProduct = "/Tender/Offer/results/" + iIndex + "/Product";

						//sort by SORTER so they are already in correct sequence
						oDataProducts.results = that.sortByKeyAsc(oDataProducts.results, "SORTER");

						//check that SORTER is filled for the offer, if not, we should give them an initial sorting
						// prepare and initialize the rank property
						if (oDataProducts.results) {
							var iSorter = Ranking.ranking.Initial;
							oDataProducts.results.forEach(async function (oProduct, iIndexProduct) {

								//give sequence again so products are back in correct order
								oProduct.SORTER = iSorter;
								iSorter++;

								//if group purchasing exist mark them as PUT (so we can keep track on how to save them)
								if (oProduct.GroupPurchasing && oProduct.GroupPurchasing.results.length > 0) {

									oProduct.GroupPurchasing.results.forEach(function (oGroupPurchasing, iIndexPruch) {
										oGroupPurchasing._sOperation = "PUT";
									});

								}

								//if deliveries exist mark them as PUT (so we can keep track on how to save them)
								if (oProduct.Deliveries && oProduct.Deliveries.results.length > 0) {

									oProduct.Deliveries.results.forEach(function (oDelivery, iIndexPruch) {
										oDelivery._sOperation = "PUT";
									});

								}

								//if letters exist mark them as PUT (so we can keep track on how to save them)
								if (oProduct.Letters && oProduct.Letters.results.length > 0) {

									oProduct.Letters.results.forEach(function (oLetter, iIndexPruch) {
										oLetter._sOperation = "PUT";
									});

								}

								//if results exist mark them as PUT (so we can keep track on how to save them)
								if (oProduct.Results && oProduct.Results.results.length > 0) {

									oProduct.Results.results.forEach(function (oResult, iIndexResults) {
										oResult._sOperation = "PUT";
									});

								}

								if (oProduct.SKUCountry && oProduct.SKUCountry.ProductPack && oProduct.SKUCountry.ProductPack.ProductPackSKUs.results.length > 0) {
									//filter out non active values
									let oProducts = oProduct.SKUCountry.ProductPack.ProductPackSKUs.results.filter(function(sku, index, arr){ 
										return sku.ActiveRecord === 'Yes';
									});

									oProduct.SKUCountry.ProductPack.ProductPackSKUs.results = oProducts[oProducts.length - 1]; //get the last entry
								}

								//check if other price agreements exist, not associated to the given tender / offer
								let oPriceAgreement = await that.getProductPriceAgreement(oProduct.CountryCode, oProduct.ProductCode);
                                let agreementExists = false;
								let otherPriceAgreementOfferId = "";
								let otherPriceAgreementTenderClassification = "";
								let priceAgreementID = "";

								if(oPriceAgreement.data && oPriceAgreement.data.results.length > 0){
                                    let oTomorrowsDate = new Date();
                                    oTomorrowsDate.setDate(oTomorrowsDate.getDate() + 1);
                                    let aPriceAgreements = oPriceAgreement.data.results;
                                    aPriceAgreements = aPriceAgreements.filter(priceAgreement => priceAgreement.ExpiryDate && priceAgreement.ExpiryDate.toISOString() > oTomorrowsDate.toISOString());

									let oPriceAgreementFiltered = aPriceAgreements.filter((result) => {
										let candidates = result.Candidates?.results;
										if(candidates.find(candidate => candidate.CandidateID === that.getFastAppDataModel().getProperty('/Tender/Institute/InstituteID'))){
											return result;
										}
									})[0];

									if(oPriceAgreementFiltered){
										agreementExists = true;
										priceAgreementID = oPriceAgreementFiltered.ID; 
										otherPriceAgreementOfferId = oPriceAgreementFiltered.OfferId; 
										otherPriceAgreementTenderClassification = oPriceAgreementFiltered.Tender?.Classification; 
									} else {
										agreementExists = false;
									}

                                    /*for (let i = 0; i < aPriceAgreements.length; i++) {
                                        let candidates = aPriceAgreements[i].Candidates?.results;
                                        if(candidates.find(candidate => candidate.CandidateID === oFastAppDataModel.getProperty('/Tender/Institute/InstituteID'))){
                                            agreementExists = true;
											priceAgreementID = aPriceAgreements[i].ID; 
											otherPriceAgreementOfferId = aPriceAgreements[i].OfferId; 
											otherPriceAgreementTenderClassification = aPriceAgreements[i].Tender?.Classification; 
                                            break;
                                        } 
                                    }*/

									oProduct.OtherPriceAgreementsExist = agreementExists ? 'Yes' : 'No';
									oProduct.OtherPriceAgreementOfferId = otherPriceAgreementOfferId;
									oProduct.OtherPriceAgreementTenderClassification = otherPriceAgreementTenderClassification;
									oProduct.ExistingPriceAgreementId = priceAgreementID;
								}
							});
						}

						//sort by SORTER
						oDataProducts.results = that.sortByKeyAsc(oDataProducts.results, "SORTER");

						//path is updated with the products
						oFastAppDataModel.setProperty(sPathTenderOfferProduct, oDataProducts);

					}

					//let the callback be triggered
					oDeferred.resolve(oDataProducts);
				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of product data");

					//let the callback be triggered
					oDeferred.reject(oError);

				}

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},
        //EHQUT-167489-Auto Approval in Thailand
        loadPreApprovedprice: function (sInstituteID, SCountryCode) {

            var sPath = "/AccountPreApprovedPrices";

            var oTenderFilter = new Filter({
                path: 'COUNTRY_CODE',
                operator: FilterOperator.EQ,
                value1: SCountryCode
            });
            var oInstituteFilter = new Filter({
                path: 'INSTITUTE_ID',
                operator: FilterOperator.EQ,
                value1: sInstituteID
            });

            var mParameters = {
                filters: [oTenderFilter, oInstituteFilter]
            };

            return this.odata(sPath).get(mParameters);
        },
         //EHQUT-167489-Auto Approval in Thailand
		//Load 1 product
		loadProduct: function (sOfferID, sActive, sProductCode, oNewProductInfo, sLotId) { //TODO we keep oNewProductInfo beceause of promise in for loop, where we don't have the latest object

			//Load product data
			var sPath = "/PT_TMOFPR(OfferID='" + sOfferID + "',Active=" + sActive + ",ProductCode=" + sProductCode + ",LotID=" + sLotId + ")";

			var oDeferred = $.Deferred();
			var that = this;

			//get fast data calls
			var oFastDataCalls = that.getDefaultModel();

			oFastDataCalls.read(sPath, {
				success: function (oData, oResponse) {
					//TODO temp solution
					oData._NewProductInfo = oNewProductInfo;

					//let the callback be triggered
					oDeferred.resolve(oData);

				},
				error: function fnError(oError) {
					//resolve, beceause we check on false to continue in correct way, if no results found
					oDeferred.resolve(false);
				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},
         //EHQUT-167489-Auto Approval in Thailand
		//loading approvals for offer
		loadApprovalsForOffer: function (sOfferID) {

			//lets work with callbacks (3 places, return, resolve, reject)
			var oDeferred = $.Deferred();
			var that = this;

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

            var AutoApprovalflag=true;
            var Instituteid=this.getInstituteIDofSelectedTender();
            var countrycode=this.getSelectedCountry();
			const userRole = UserInfo.getRole();

            $.when(this.loadPreApprovedprice(Instituteid, countrycode)).done(function (oData) {
                if(countrycode=='TH'){
               var aProducts = [];
               var Preapproveddatas=[];
               aProducts = oFastAppDataModel.oData.SelectedOffer.Product.results;
               Preapproveddatas=oData.data.results;   

                //check for each product
                aProducts.forEach(function (oProduct) {
                 if(AutoApprovalflag)   {

                   AutoApprovalflag=false;
                   Preapproveddatas.forEach(function (oBackendcall) {
                    var convertofferprice=parseFloat(oProduct.Price.OfferPrice).toFixed(3);
                    var convertminunitprice=parseFloat(oBackendcall.MIN_UNIT_PRICE).toFixed(3);

                if(oProduct.ProductCode==oBackendcall.PRODUCT_ID &&(convertofferprice==convertminunitprice||oProduct.Price.OfferPrice==oBackendcall.MIN_PACK_PRICE
                    )){
                        AutoApprovalflag=true;

                    } 

                    })
                }
                })
            }

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			//Path
			var sApprovalPath = "/OfferProductOfferStatus"; //using view to always have data
			//Filters to apply
			var aFilters = [];

			//Offer ID 
			var sOfferFilterID = sOfferID;
			//var sOfferFilterID = "AE-18-468-1002-BME-11"; //test om resultaten te krijgen
			var oFilter = new sap.ui.model.Filter(
				"OfferId",
				sap.ui.model.FilterOperator.EQ,
				sOfferFilterID
			);

			//Add to filter array
			aFilters.push(oFilter);

			//active only
			var oFilter = new sap.ui.model.Filter(
				"Active",
				sap.ui.model.FilterOperator.EQ,
				"1"
			);

			//Add to filter array
			aFilters.push(oFilter);

			//Sorter to have nice groups
			var aSorter = new sap.ui.model.Sorter('ApproverTypeSection');

			//Reading the back end data from the Approvals table
			// EFRCL- 377753- Spain - changes in approval workflow for Pharma
			oFastDataCalls.read(sApprovalPath, {
				filters: aFilters,
				urlParameters: {
					"$expand": "ApproverList,ApproverTypes" //added from results on
				},
				sorter: aSorter,
				success: function (oData, oResponse) {

					if (oData.results) { //if offers are found add them to the Model
						if (countrycode == 'ES' && oFastAppDataModel.oData.EditOffer.Division == 'Pharma') {
                            var ApproverTypeCount = oData.results;
                            var SPainApproverTypes = ApproverTypeCount.findIndex(apc => apc.ApproverType === 'BU/RAM 1');
                            var ApproverListlength = ApproverTypeCount[SPainApproverTypes].ApproverList.results.length;
                            if (userRole !== 'RAM') {
                                for (var i = 0; i < ApproverListlength; i++) {
                                    if (ApproverTypeCount[SPainApproverTypes].ApproverList.results[i].ApproverName == 'Cristina Rodrigo') {
                                        ApproverTypeCount[SPainApproverTypes].ApproverList.results.splice(i, 1);
                                        ApproverListlength = ApproverListlength - 1;
                                    }
                                }
                            } else {
                                for (var i = 0; i < ApproverListlength; i++) {
                                    if (ApproverTypeCount[SPainApproverTypes].ApproverList.results[i].ApproverName == 'Victor Canellas Guerrero') {
                                        ApproverTypeCount[SPainApproverTypes].ApproverList.results.splice(i, 1);
                                        ApproverListlength = ApproverListlength - 1;
                                    }
                                }
                            }
                        }

                        if(AutoApprovalflag==false){

                            var length=oData.results;
                    //EHQUT-202292-Offer approval request from 'Offer Management app
                            length.forEach(function (oProduct) {
                               var total= oProduct.ApproverList.results.length;
                               for(var i=0; i<total;i++){
                                   if(oProduct.ApproverList.results[i].ApproverName=='Auto Approval'){
                                    oProduct.ApproverList.results.splice(i,1);
									total=total-1;
                                   }
                               }
                    //EHQUT-202292-Offer approval request from 'Offer Management app

                            })
                        }

						//path where the products should be stored
						var sPathApprovalsOfSelectedOffer = "/ApprovalsSelectedOffer";

						//sorting by approver type
						oData.results = that.sortByKeyAsc(oData.results, "ApproverTypeSection");

						//add send default No accept for mandatory approver types
						if (oData.results) {
							oData.results.forEach(function (oApprover, index) {

								//if(oApprover.ApproverType === "Country Business" || oApprover.ApproverType === "Supply Chain") {
								if (oApprover.ApproverTypeSection === 1) {
									oApprover.send = 'Yes';
								} else {
									oApprover.send = 'No';
								}

								//for waiting & notification sent, it would be forced to "no"
								if (
									oApprover.ApprovalStatus === 'Waiting' ||
									oApprover.ApprovalStatus === "Notification Sent" ||
									oApprover.ApprovalStatus === "Processing" ||
									oApprover.ApprovalStatus === "Cancelling"
								) {
									oApprover.send = 'No';
								}

							});
						}

						//path is updated with the products
						oFastAppDataModel.setProperty(sPathApprovalsOfSelectedOffer, oData.results);
						//oFastAppDataModel.refresh(true);
					}

					// close loading dialog
					if (that._LoadingDialog) {
						that._LoadingDialog.close();
					}

					//let the callback be triggered
					oDeferred.resolve(oData);

				},
				error: function (oError) {

					// close loading dialog
					if (that._LoadingDialog) {
						that._LoadingDialog.close();
					}

					//show error message
					that.showErrorMessage(oError, "Loading of approvals for offer");

					//let the callback be triggered
					oDeferred.reject(oError);

				}

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();
        })
		},

		//load offer validation  for offer
		loadOfferValidation: function(sOfferID){
							
			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();
			
			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();
			
			var that = this;
			
			var sOfferValidationPath = "/OfferValidation";
			
			var aFilters = [];
			
			if(sOfferID){
				var oCountryFilter = new sap.ui.model.Filter("OFFERID", sap.ui.model.FilterOperator.EQ, sOfferID);
				aFilters.push(oCountryFilter);
			}
			
			//Reading the back end data from the tender table
			oFastDataCalls.read(sOfferValidationPath, {
					filters: aFilters,
					success: function(oData, oResponse) {
						
						//Offer validation data
						var oOfferValidation = oData.results[0];
						
						//data received is set to the award model
						oFastAppDataModel.setProperty("/OfferValidation", oOfferValidation);
						
						//let the callback be triggered
						oDeferred.resolve(oData);
					
					},
					error: function(oError) {
						
						// close loading dialog
						if (that._LoadingDialogOfferProductValidation) {
							that._LoadingDialogOfferProductValidation.close();
						}
				
						//show error message
						that.showErrorMessage(oError, "Loading of quotation offer validation");
						
						//let the callback be triggered
						oDeferred.reject(oError);
					
					}
			});						
			

			//return promise so the function can check if execution is done
			return oDeferred.promise();	
		},

		//load offer product validation
		loadOfferProductValidation: function(sOfferID){
			
			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();
			
			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();
			
			var that = this;
			
			var sOfferProductValidationPath = "/OfferProductValidation";
			
			var aFilters = [];
			
			if(sOfferID){
				var oCountryFilter = new sap.ui.model.Filter("OFFER_ID", sap.ui.model.FilterOperator.EQ, sOfferID);
				aFilters.push(oCountryFilter);
			}
			

			//Reading the back end data from the tender table
			oFastDataCalls.read(sOfferProductValidationPath, {
					filters: aFilters,
					success: function(oData, oResponse) {
						
						//catch the offer products
						var aOfferProductValidation = oData.results;
						//aOfferProductValidation = this.sortByKeyAsc(aOfferProductValidation, "SORTER");
						
						//data received is set 
						oFastAppDataModel.setProperty("/OfferProductValidation", aOfferProductValidation);
						
						//let the callback be triggered
						oDeferred.resolve(oData);
					
					},
					error: function(oError) {

						// close loading dialog
						if (that._LoadingDialogOfferProductValidation) {
							that._LoadingDialogOfferProductValidation.close();
						}
						
						//show error message
						this.showErrorMessage(oError, "Loading of quotation offer product validation");
						
						//let the callback be triggered
						oDeferred.reject(oError);
					
					}
			});						
			

			//return promise so the function can check if execution is done
			return oDeferred.promise();	
		},

		//Load FOC additional brand product data
		loadFOCAdditionalBrandProductData: function (sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sLegalEntity, sBrand,
			sProductCode, aCommercialAgreement) {

			//lets work with callbacks (3 places, return, resolve, reject)
			var oDeferred = $.Deferred();

			//that is this
			var that = this;

			//set filters
			var aFilters = [];
			aFilters.push(
				new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode),
				new sap.ui.model.Filter("INSTITUTE_ID", sap.ui.model.FilterOperator.EQ, sInstituteID),
				new sap.ui.model.Filter("DISTRIBUTOR_ID", sap.ui.model.FilterOperator.EQ, sDistributorID),
				new sap.ui.model.Filter("CHANNEL", sap.ui.model.FilterOperator.EQ, sTenderChannel),
				new sap.ui.model.Filter("PRODUCT_ID", sap.ui.model.FilterOperator.EQ, sProductCode)
			);

			//if(sBrand !== null){
			new sap.ui.model.Filter("BRAND_ID", sap.ui.model.FilterOperator.EQ, sBrand);
			//}

			//if legal enitty is filled
			if (sLegalEntity) {
				aFilters.push(new sap.ui.model.Filter("LEGAL_ENTITY_CODE", sap.ui.model.FilterOperator.EQ, sLegalEntity));
			}

			//add origin's to filter
			if (aCommercialAgreement && aCommercialAgreement.results && aCommercialAgreement.results.length > 0) {
				aCommercialAgreement.results.forEach(function (oCommercialAgreement, iIndex) {
					aFilters.push(new sap.ui.model.Filter("COUNTRY_OF_ORIGIN", sap.ui.model.FilterOperator.EQ, oCommercialAgreement.COUNTRY_OF_ORIGIN));
				});
			}

			//Reading variables
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();
			var sPath = "/InstituteDistributorBrandProduct";

			//actual reading of the Product list
			oFastDataCalls.read(sPath, {
				filters: aFilters,
				/*
				urlParameters: {
					"$expand": "Cogs,SKU"
				},
				*/
				success: function (oData, oResponse) {

					if (oData && oData.results && oData.results && oData.results.length > 0) {
						//return product data
						oDeferred.resolve(oData.results[0]);
					} else {
						//no product returned. no error
						oDeferred.resolve("");
					}

				},
				error: function (oError) {

					//no product returned. no error
					oDeferred.resolve("");
				}

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//Load brand product name list after selecting the brand
		//JHHERE
		loadBrandProductNameList: function (sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sLegalEntity, aCommercialAgreement,
			aBrandTokens, sOfferDivision) {

			//lets work with callbacks (3 places, return, resolve, reject)
			var oDeferred = $.Deferred();

			//that is this
			var that = this;

			//set filters
			var aFilters = [];
			aFilters.push(
				new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode),
				new sap.ui.model.Filter("INSTITUTE_ID", sap.ui.model.FilterOperator.EQ, sInstituteID),
				new sap.ui.model.Filter("DISTRIBUTOR_ID", sap.ui.model.FilterOperator.EQ, sDistributorID),
				new sap.ui.model.Filter("CHANNEL", sap.ui.model.FilterOperator.EQ, sTenderChannel),
				new sap.ui.model.Filter("LEGAL_ENTITY_CODE", sap.ui.model.FilterOperator.EQ, sLegalEntity)
			);

			if(sOfferDivision &&  sOfferDivision != ""){
				aFilters.push(new sap.ui.model.Filter("DIVISION", sap.ui.model.FilterOperator.EQ, sOfferDivision));
			}

			//add origin's to filter
			if (aCommercialAgreement && aCommercialAgreement.results && aCommercialAgreement.results.length > 0) {
				aCommercialAgreement.results.forEach(function (oCommercialAgreement, iIndex) {
					aFilters.push(new sap.ui.model.Filter("COUNTRY_OF_ORIGIN", sap.ui.model.FilterOperator.EQ, oCommercialAgreement.COUNTRY_OF_ORIGIN));
				});
			}

			//add brands to filter
			if (aBrandTokens) {
				aBrandTokens.forEach(function (oBrandToken, iIndex) {
					//if (oBrandToken.getProperty("key") !== null){
					aFilters.push(new sap.ui.model.Filter("BRAND_ID", sap.ui.model.FilterOperator.EQ, oBrandToken.getProperty("key")));
					//}
				});
			}

			//Reading variables
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();
			var sPath = "/InstituteDistributorBrandProduct";

			//actual reading of the Product list
			oFastDataCalls.read(sPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					if (oData.results) { //if offers are found add them to the Model

						//sorting by product name (We now sort on the node js layer!! )
						//oData.results = that.sortByKeyAsc(oData.results, "PRODUCT_NAME");

					}

					//let the callback be triggered
					oDeferred.resolve(oData);
				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading list of products");

					//let the callback be triggered
					oDeferred.reject(oError);
				}

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//READERS
		//-------

		readInstituteDistributor: function (sCountryCode, sInstituteId, sChannel, sSellingCompanyID) {
			//that is this
			var that = this;
			var aFilters = [];

			//get model for calls
			var oModel = this.getDefaultModel();

			//path of offer that is selected
			var sPath = "/InstituteDistributor";

			//prepare filters
			aFilters.push(new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode));
			aFilters.push(new sap.ui.model.Filter("INSTITUTE_ID", sap.ui.model.FilterOperator.EQ, sInstituteId));
			aFilters.push(new sap.ui.model.Filter("CHANNEL", sap.ui.model.FilterOperator.EQ, sChannel));
			aFilters.push(new sap.ui.model.Filter("LEGAL_ENTITY_CODE", sap.ui.model.FilterOperator.EQ, sSellingCompanyID));

			//Create
			return new Promise(function (resolve, reject) {
				oModel.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {
						resolve(oData);
					},
					error: function (oError) {
						//show error message
						that.showErrorMessage(oError, "Reading of institute distributors");

						//let the callback be triggered
						reject(oError);
					}
				});
			});
		},

		//SAVERS
		//------			

		//soft delete tender (=set inactive column to 0)
		saveSoftDeleteTender: function () {

			var that = this;

			//get save info for offer status to be saved
			var oTenderSaveInfo = {};
			oTenderSaveInfo.TenderID = that.getSelectedTenderID();
			oTenderSaveInfo.Active = 0;

			//Keep the change opperations: Merge 
			return that.getService('Tender').updateTender(oTenderSaveInfo, "MERGE").then(function (oResult) {

				//deletion success
				sap.m.MessageBox.success("Tender is successfully removed..", {});

			}).catch(function (oError) {

				//Error during save
				that.showErrorMessage(oError, "Tender deletion");

			});

		},

		//REFRESH
		//-------
		//TendersMaster table refresh For Tender
		refreshTendersMasterTable: function (sTenderID) {
			var that = this;

			//refresh master data
			var oTendersMasterTable = that.getTendersMasterTable();
			
			if(oTendersMasterTable){
				oTendersMasterTable.attachEventOnce("updateFinished", function(){

					//Filter for selected tender
					var oBinding = oTendersMasterTable.getBinding("items");
			
					//clear all existing filters
					oBinding.aFilters = null;
					oBinding.aApplicationFilters = null;
		
					//add filters (only tender should be filtered)
					var aFilter = [];
					aFilter.push(new Filter("TENDER_ID", "EQ", sTenderID));
					//aFilter.push(new Filter("ACTIVE_OFFER", "EQ", 1));
					oBinding.filter(aFilter);
					
				});
				
			}

			


		},

		//CLEARING
		//--------

		//clear selected offer
		clearSelectedOffer: function () {
			this.setSelectedOfferID("");
			this.setSelectedOfferPath("");
		},

		//clear selected product
		clearSelectedProduct: function () {
			this.setSelectedProductID("");
			this.setSelectedProductName("");
			this.setSelectedProductPath("");
		},

		//BASIC INFORMATION
		//-----------------

		//Local Variable
		//--------------

		//Loaders
		//-------

		//load Institute information
		loadInstitute: async function (sCountry, sInstituteID, bWithChilderen) {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//country
			if (!sCountry) {
				sCountry = that.getSelectedCountry();
			}

			//institute
			if (!sInstituteID) {
				sInstituteID = that.getInstituteIDofSelectedTender();
			}

			if (bWithChilderen) {
				var oExpand = {
					"$expand": "Province,Children/Institute"
				}
			} else {
				var oExpand = {}; //no expand
			}
			//mandatory to have institute
			if (!sCountry || !sInstituteID) {
				//nothing to check, than resolve as true so group is visible
				return oDeferred.resolve(true);
			}

			//path for reading
			var sPath = "/PT_TMINST(CountryCode='" + sCountry + "',InstituteID=" + sInstituteID + ")";

			//filters
			var aFilters = [];

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			if (sPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					urlParameters: oExpand,
					success: function (oData, oResponse) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//let the callback be triggered
						oDeferred.resolve(oData);

					},
					error: function (oError) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//Error
						that.showErrorMessage(oError, "Loading institute information");

						//let the callback be triggered
						oDeferred.reject(oError);

					}

				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//bind institute & children 
		bindInstituteWithChildren: function (oData) {

			var that = this;
			var oFastAppDataModel = that.getFastAppDataModel();

			//add empty country (so on add delivey tab, you can have an empty currency in case of penalty = no)
			var aInstituteWithChildren = [];

			//first add parent to list
			var oParentInstitute = {
				InstituteID: oData.InstituteID,
				InstituteName: oData.InstituteName,
				IsParent: true
			};
			aInstituteWithChildren.push(oParentInstitute);

			//if childeren are found, we add them
			if (oData.Children && oData.Children.results && oData.Children.results.length > 0) {

				//add childeren to list
				oData.Children.results.forEach(function (oChild, iIndex) {
					if (oChild.Institute) {
						var oChildInstitute = {
							InstituteID: "",
							InstituteName: "",
							IsParent: false
						};
						oChildInstitute.InstituteID = oChild.Institute.InstituteID;
						oChildInstitute.InstituteName = oChild.Institute.InstituteName;
						oChildInstitute.IsParent = false;
						aInstituteWithChildren.push(oChildInstitute);
					} else {
						//no institute found?
						var bFail = true;
						var bIndex = iIndex;
					}
				});

				//sort
				//aInstituteWithChildren = that.sortByKeyAsc(aPenaltyReasons, "InstituteName");

			}

			//data received is set to the award model
			oFastAppDataModel.setProperty("/InstituteWithChildren", aInstituteWithChildren);
		},

		//Getters
		//-------

		//Setters
		//-------

		//Mutators
		//--------
		//preparing the tender clone based upon an existing
		prepTenderClone: function (oOriginalTender, sNewTenderID) {

			//that is this
			var that = this;

			//first keep track of original tenderData & tenderID
			var oTenderClone = oOriginalTender;
			var sOriginalTenderID = oOriginalTender.TenderID;

			//set new tender ID
			oTenderClone.TenderID = sNewTenderID;
			oTenderClone.TenderNo = that.getNewTenderNo(); //sNewTenderID.split("-")[2];

			//get user, submitted on, toolid
			oTenderClone.SubmittedOn = moment().utc().toDate();
			oTenderClone.SubmittedBy = UserInfo.getCWID();
			oTenderClone.ToolID = UserInfo.getToolID();
			oTenderClone.CloneTenderID = sOriginalTenderID;

			//tender status is always "Open"
			oTenderClone.TenderStatus = "Open";

			return oTenderClone;

		},

		//Checkers
		//--------

		checkBasicInfo: function (oBasicInfo, bCheckForTenderToClone) {

			var bValid = true;
			var bWarning = false;
			var aMessages = [];

			//check mandatory fields
			if (
				!oBasicInfo.TenderName ||
				(oBasicInfo.CountryCode !== 'IT' && !oBasicInfo.Classification) || // for Italy the Classification shouldn't be considered
				!oBasicInfo.InstituteID || //IntituteType is property of institute
				!oBasicInfo.TenderChannel ||
				oBasicInfo.GroupPurchasing === null ||
				!oBasicInfo.PublicationDate ||

				!oBasicInfo.BidDueDate || ((oBasicInfo.CountryCode === 'ES'  && oBasicInfo.Classification === 'Commercial Agreement') &&!oBasicInfo.EffectiveDate )|| 
				((oBasicInfo.CountryCode === 'ES'  && oBasicInfo.Classification === 'Commercial Agreement') &&!oBasicInfo.ExpiryDate )) {

				
				//add error message
				var oMessage = {
					type: 'Error',
					title: 'Mandatory fields.',
					description: '- Tender Name \n' +
						(oBasicInfo.CountryCode === 'IT' ? '':'- Classification \n') +
						'- Institute \n' +
						'- Channel \n' +
						'- Group Purchasing \n' +
						'- Publication Date \n' +
						'- Bid due Date \n' +
						(oBasicInfo.CountryCode === 'ES'  ? '-Effective Date \n':'') +
						(oBasicInfo.CountryCode === 'ES' ? '-Expiry Date \n':'')
						,
					subtitle: 'Please enter all the mandatory fields..',
					counter: 1
				}
				aMessages.push(oMessage);

				bValid = false;

			}

			//check if dates are correct
			if (!moment(oBasicInfo.PublicationDate).isBefore(oBasicInfo.BidDueDate)) {

				//add error message
				var oMessage = {
					type: 'Error',
					title: 'Publication Date',
					description: 'Publication date should be before the offer due date. \n',
					subtitle: 'Publication date should be before the offer due date.',
					counter: 1
				}
				aMessages.push(oMessage);

				bValid = false;
			}

			//check if dates are correct
			if (oBasicInfo.AwardDate) { //optional date

				if (!moment(oBasicInfo.BidDueDate).isBefore(oBasicInfo.AwardDate)) {

					//add error message
					var oMessage = {
						type: 'Error',
						title: 'OfferDuedate',
						description: 'OfferDuedate date should be before the Award date. \n',
						subtitle: 'OfferDuedate date should be before the Award date.',
						counter: 1
					}
					aMessages.push(oMessage);

					bValid = false;
				}
			}

			//check if dates are correct
			if (oBasicInfo.AwardDate && oBasicInfo.NextPublicationDye) { //optional dates

				if (!moment(oBasicInfo.AwardDate).isBefore(oBasicInfo.NextPublicationDye)) {
					//add error message
					var oMessage = {
						type: 'Error',
						title: 'Award date',
						description: 'Award date should be before the next publication date. \n',
						subtitle: 'Award date should be before the next publication date.',
						counter: 1
					}
					aMessages.push(oMessage);

					bValid = false;
				}

			}

			//check if dates are correct
			if (oBasicInfo.BidDueDate && oBasicInfo.InternalBidDueDate) { //optional dates

				if (!moment(oBasicInfo.InternalBidDueDate).isBefore(oBasicInfo.BidDueDate)) {
					//add error message
					var oMessage = {
						type: 'Error',
						title: 'Internal due date',
						description: 'Internal due date should be before the offer due date. \n',
						subtitle: 'Internal due date should be before the offer due date.',
						counter: 1
					}
					aMessages.push(oMessage);

					bValid = false;
				}
			}

			//if errors (or warnings) occured, show the messages in 1 dialog
			if (!bValid || bWarning) {

				//if this check is performed for the original tender that we clone from
				if (bCheckForTenderToClone) {
					var sTitle = 'Please solve before cloning.';
				} else {
					var sTitle = 'Error';
				}

				//Show error messages
				this.showMessageCompositeView(sTitle, aMessages, 'Error');
			}

			return bValid;
		},

		//check awardCriteria
		checkAwardCriteria: function (aAwardCriteria) {

			//default valid
			var bValid = true;

			//sum of all award criterias
			var sumWeight = 0;
			var awardCriteriaName = [];

			//checks on mandatory fields & calulation of sumWeight
			aAwardCriteria.forEach(function (oAwardCriteria) {

				//get values
				var sCriteria = oAwardCriteria.mAggregations.cells[0].getProperty("value");
				var iWeight = parseInt(oAwardCriteria.mAggregations.cells[1].getProperty("value"));

				//Check that award criteria is complete, everything is filled
				if (oAwardCriteria.getVisible()) {

					//check if everything is filled
					if (sCriteria === "" || iWeight === "") {
						sap.m.MessageBox.error("Award Criteria information incomplete.");
						bValid = false;
					}

					//make sum of weights, so we can check afterwards they are not above 100%
					sumWeight = sumWeight + iWeight;

					//keep the awardcritiria names so we can check lateron for duplicates
					awardCriteriaName.push(sCriteria);

				}

			});

			//check that sum of all award criteria = 100
			if (sumWeight !== 100 && awardCriteriaName.length !== 0) {
				sap.m.MessageBox.error("Sum of Award Criteria weight must be 100%");
				return;
			}

			//check only unique award criteria names are there
			var uniq = awardCriteriaName
				.map((name) => {
					return {
						count: 1,
						name: name
					}
				})
				.reduce((a, b) => {
					a[b.name] = (a[b.name] || 0) + b.count
					return a
				}, {});

			//if duplicates are found
			var duplicates = Object.keys(uniq).filter((a) => uniq[a] > 1);
			if (duplicates.length !== 0) {
				sap.m.MessageBox.error("Two award criteria cannot have the same name.");
				bValid = false;
			}

			return bValid;
		},

		//should Tender Channel be on "Distributor" yes or no
		checkTenderChannelOnDistributor: function (sCountry, sInstituteID) {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//country
			if (!sCountry) {
				sCountry = that.getSelectedCountry();
			}

			//institute
			if (!sInstituteID) {
				sInstituteID = that.getInstituteIDofSelectedTender();
			}

			//mandatory to have institute
			if (!sCountry || !sInstituteID) {
				//nothing to check, than resolve as true so group is visible
				return oDeferred.resolve(true);
			}

			//path for reading
			var sPath = "/PT_TMINST(CountryCode='" + sCountry + "',InstituteID=" + sInstituteID + ")/Terms";

			//filters
			var aFilters = [];

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			if (sPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					success: function (oData, oResponse) {

						//set tender channel on distributor (no terms)
						var bTenderChannelOnDistributor = true;

						//check if terms exist for institute
						if (oData.results) {
							if (oData.results.length > 0) {
								//institute has terms
								bTenderChannelOnDistributor = false;
							}
						}

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//let the callback be triggered
						oDeferred.resolve(bTenderChannelOnDistributor);

					},
					error: function (oError) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//Error
						that.showErrorMessage(oError, "Checking if tender channel should be on distributor");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},

		//show group purchasing only if it has childeren
		checkInstituteChilderen: function (sCountry, sInstituteID) {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//country
			if (!sCountry) {
				sCountry = that.getSelectedCountry();
			}

			//institute
			if (!sInstituteID) {
				sInstituteID = that.getInstituteIDofSelectedTender() || this.getDefaultModel().getProperty(this.getSelectedTenderPath()).InstituteID;
			}

			//mandatory to have institute
			if (!sCountry || !sInstituteID) {
				//nothing to check, than resolve as true so group is visible
				return oDeferred.resolve(true);
			}

			var bWithChilderen = true;

			$.when(that.loadInstitute(sCountry, sInstituteID, bWithChilderen)).done(function (oData) {

				//default no childeren
				var bInistituteChilderen = false;

				//check count results
				if (oData.Children && oData.Children.results && oData.CountryCode !== 'ES') {
					if (oData.Children.results.length > 0) {
						//institute has childeren
						bInistituteChilderen = true;
					}
				}

				//Keep institute + childeren list
				that.bindInstituteWithChildren(oData);

				//let the callback be triggered
				oDeferred.resolve(bInistituteChilderen);
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//check if tender type needs to be shown (if only 1 tendertype it is not shown)
		checkShowTenderType: function (sClassification) {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for reading
			var sPath = "/CountryTenderType";

			//filters
			var aFilters = [];

			//filter country
			var sCountryCode = that.getSelectedCountry();

			var oFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode);
			//Add to filter array
			aFilters.push(oFilter);

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			if (sPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						//show tender type
						var bShowTenderType = false;

						//check length
						if (oData.results) {
							if (oData.results.length > 1) {
								//als er meer dan 1 tendertypes gevonden worden
								bShowTenderType = true;
							}
						}

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						// for Chile the TenderType is only shown when InstituteType == 'Cenabast'
						// because of this requirement we default the bShowTenderType to false
						// at later point in time the dropdown will set this to true
						const country = that.getSelectedCountry();
						if(country === 'CL'){
							bShowTenderType = false;
						} else if(country ==='ES' && sClassification !== 'Tender'){
                            bShowTenderType = false;                                                                                    
                        }

						//let the callback be triggered
						oDeferred.resolve(bShowTenderType);

					},
					error: function (oError) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//Error
						that.showErrorMessage(oError, "Checking to show tender type");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

        		//check if tender type needs to be shown (if only 1 tendertype it is not shown)
		checkShowTenderType2: function (sClassification) {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for reading
			var sPath = "/CountryTenderType2";

			//filters
			var aFilters = [];

			//filter country
			var sCountryCode = that.getSelectedCountry();

			var oFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode);
			//Add to filter array
			aFilters.push(oFilter);

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			if (sPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						//show tender type
						var bShowTenderType = false;

						//check length
						if (oData.results) {
							if (oData.results.length > 1) {
								//als er meer dan 1 tendertypes gevonden worden
								bShowTenderType = true;
							}
						}

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						// for Chile the TenderType is only shown when InstituteType == 'Cenabast'
						// because of this requirement we default the bShowTenderType to false
						// at later point in time the dropdown will set this to true
						const country = that.getSelectedCountry();
						if(country !== 'ES' || country === 'ES' && sClassification !== 'Tender'){
							bShowTenderType = false;
						}

						//let the callback be triggered
						oDeferred.resolve(bShowTenderType);

					},
					error: function (oError) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//Error
						that.showErrorMessage(oError, "Checking to show tender type");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		/*<!--Mexico changes -->*/
		//check if sales type needs to be shown (if only 1 tendertype it is not shown)
		checkShowSalesType: function () {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for reading
			var sPath = "/CountrySalesType";

			//filters
			var aFilters = [];

			//filter country
			var sCountryCode = that.getSelectedCountry();

			var oFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode);
			//Add to filter array
			aFilters.push(oFilter);

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			if (sPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						//show tender type
						var bShowSalesType = false;

						//check length
						if (oData.results) {
							if (oData.results.length > 1) {
								//als er meer dan 1 tendertypes gevonden worden
								bShowSalesType = true;
							}
						}

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//let the callback be triggered
						oDeferred.resolve(bShowSalesType);

					},
					error: function (oError) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//Error
						that.showErrorMessage(oError, "Checking to show Sales type");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//check if tender origin needs to be shown (if only 1 tendertype it is not shown)
		checkShowTenderOrigin: function () {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for reading
			var sPath = "/CountryTenderOrigin";

			//filters
			var aFilters = [];

			//filter country
			var sCountryCode = that.getSelectedCountry();

			var oFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode);
			//Add to filter array
			aFilters.push(oFilter);

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			if (sPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						//show tender type
						var bShowTenderOrigin = false;

						//check length
						if (oData.results) {
							if (oData.results.length > 1) {
								//als er meer dan 1 tenderorigins gevonden worden
								bShowTenderOrigin = true;
							}
						}

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//let the callback be triggered
						oDeferred.resolve(bShowTenderOrigin);

					},
					error: function (oError) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//Error
						that.showErrorMessage(oError, "Checking to show Tender Origin");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//check if contract type needs to be shown (if only 1 tendertype it is not shown)
		checkShowContractType: function () {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for reading
			var sPath = "/CountryContractType";

			//filters
			var aFilters = [];

			//filter country
			var sCountryCode = that.getSelectedCountry();

			var oFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode);
			//Add to filter array
			aFilters.push(oFilter);

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			if (sPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						//show tender type
						var bShowContractType = false;

						//check length
						if (oData.results) {
							if (oData.results.length > 1) {
								//als er meer dan 1 tenderorigins gevonden worden
								bShowContractType = true;
							}
						}

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//let the callback be triggered
						oDeferred.resolve(bShowContractType);

					},
					error: function (oError) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//Error
						that.showErrorMessage(oError, "Checking to show Contract Type");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		/* Thailand implementation */
		checkShowProcurementMethod: function () {

			var that = this;

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for reading
			var sPath = "/CountryProcurementMethod";

			//filters
			var aFilters = [];

			//filter country
			var sCountryCode = that.getSelectedCountry();

			var oFilter = new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode);
			//Add to filter array
			aFilters.push(oFilter);

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			if (sPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						//show tender type
						var bShowProcurementMethod = false;

						//check length
						if (oData.results) {
							if (oData.results.length > 1) {
								//als er meer dan 1 tendertypes gevonden worden
								bShowProcurementMethod = true;
							}
						}

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//let the callback be triggered
						oDeferred.resolve(bShowProcurementMethod);

					},
					error: function (oError) {

						// CLOSE loading dialog
						if (that._LoadingDialog) {
							that._LoadingDialog.close();
						}

						//Error
						that.showErrorMessage(oError, "Checking to show Procurement Method");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		/* end of thailand implementation */

		//Savers
		//--------

		//clone tender with award criteria, offers and status of offers
		saveCloneTender: function (oTenderToClone, OfferProducts) {

			//keep track of service file
			var that = this;

			// instantiate loading dialog
			if (!that._LoadingDialog) {
				that._LoadingDialog = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialog.open();

			//catch all promises in an array
			let promises = [];

			//get model
			var oFastDataCalls = this.getDefaultModel();

			//Default use Batch = true, this means that all back-end calls are executed in batch
			//this also means 1 request is failing... all are failing... (in this case you can not see which request was the cause)
			//TODO once we are on the CAP we can do this cloning logic in the node.js layer, this way SAPUI5 doesn't have to take care of this logic anymore
			//oFastDataCalls.setUseBatch(false);

			//bundel messages in 1 message view
			var aMessages = [];

			//lets work with callbacks: this way we only save products if OFFER is created
			var oDeferred = $.Deferred();

			//var saveOfferStatus
			//first load new TenderID
			$.when(that.loadNewTenderID()).done(function (sNewTenderID) {

				//Prepare data for tender clone (based upon the tender to clone)
				var oTenderClone = that.prepTenderClone(oTenderToClone, sNewTenderID);
				var sFirstOfferID = "";
				
				//Prepare tender clone for saving (right fields & formats)
				var oTenderToSave = that.getService('Tender').getConvertTenderToSave(oTenderClone);

				//empty award criteria object for saving
				var oAwardCriteriaToSave = {};

				//object for keeping the status of each cloned offer
				//saving must be done, after all callbacks are finished
				var aOfferStatusSaveInfo = [];

				//check if data is still correct for the new tender to create (can fail when original data of tender is corrupt)
				//otherwise this will never fail, since checks are also done when original tender is saved
				if (that.checkBasicInfo(oTenderToSave)) {

					//Creating the tender (& wait for result in promises array)
					promises.push(that.getService('Tender').createTender(oTenderToSave));

					//only inf award criteria exist, they should be created
					if (oTenderClone.Criteria && oTenderClone.Criteria.results.length > 0) {

						//loop at each award criteria and change fields to clone data
						var aAwardCriteria = oTenderClone.Criteria.results;
						aAwardCriteria.forEach(function (oAwardCriteria, iIndex) {

							//new data for awardcriteria
							oAwardCriteria.TENDERID = sNewTenderID;
							oAwardCriteria.Active = 1;
							oAwardCriteria.COUNTRYCODE = oTenderToSave.CountryCode;
							oAwardCriteria.SUBMITTEDON = moment().utc().toDate();
							oAwardCriteria.Submittedby = UserInfo.getCWID();

						});

						//create award criteria
						promises.push(that.getService('AwardCriteria').createAllAwardCriteria(aAwardCriteria));
					}

					// only when Specifications exist, they should be created
					if (oTenderClone.Specifications && oTenderClone.Specifications.results.length > 0) {

						//loop at each specification and change fields to clone data
						const aSpecifications = oTenderClone.Specifications.results;

						// create new Speficiation entities
						const newSpecifications = aSpecifications.map(specification =>  {

							const newSpecification = {
								"TenderID": sNewTenderID,
								"CountryCode": oTenderToSave.CountryCode,
								"Name": specification.Name,
							};

							return newSpecification;

						});

						//create award criteria
						promises.push(that.getService('Specification').createSpecifications(newSpecifications));
					}

					//when offers exist
					if (oTenderClone.Offer) {
						var aOffers = oTenderClone.Offer.results;
					} else {
						var aOffers = [];
					}

					//when offers exist
					if (aOffers && aOffers.length > 0) {

						//initiate counter for creating new offer ID
						var iCountNextOffer = 1;

						//loop at each offer to save offer
						aOffers.forEach(function (oOffer, iIndex) {

							//list of invalid products for offer during tender clone
							var aInvalidProducts = [];

							//promisses for all products in offer
							let promisesProductsInOffer = [];

							//we only copy the active offers
							if (oOffer.Active === 1 && oOffer.ActiveOffer === 1) {

								//CREATE OFFER ENTRY
								//------------------
								//convert award criteria to save, with new tenderID
								var oOfferToSave = that.getService('Offer').getConvertOfferToSave(oOffer);

								//Keep original offerID
								var sOriginalOfferID = oOfferToSave.OfferID;

								//some fields need to be changed
								oOfferToSave.TenderID = sNewTenderID;
								oOfferToSave.CloneOfferID = sOriginalOfferID; //Original offer ID from which the Offer is cloned
								oOfferToSave.OfferID = sNewTenderID + "-" + iCountNextOffer; //new offerID
								oOfferToSave.RevisedOfferNo = 0; //A revised offer, is now a normal offer beceause we only copy active offers, its no use to keep track of revisions
								oOfferToSave.TenderOfferNo = iCountNextOffer;
								oOfferToSave.APPROVALS_SENT = 0; //no approvals sent yet - field used for: 
								oOfferToSave.ContinuationOfferNo = 0; //continued offers are now normal offers, so continuation offer no should be set to 0

								//keep 1 offerID to be selected as default
								sFirstOfferID = oOfferToSave.OfferID;
								
								//Path for offer
								var sOfferPath = "/PT_TMOFRS";

								//Create Offer
								promises.push(that.getService('Offer').createOffer(oOfferToSave).catch(function (oError) {

									//show error message
									that.showErrorMessage(oError, "Creation of offer");

									//promises must fail as well
									throw new Error(oError);

								}));

								//at the end we increase the next offer counter
								iCountNextOffer++;

								//offerstatus should be (except if no products found or prices not copied)
								var sOfferStatus = "Offer Created";

								//Deferred to push to all promises, to say we are still waiting for this product & price
								var oDeferredOfferDone = $.Deferred();
								promises.push(oDeferredOfferDone.promise()); //wait for resolve

								//CREATE PRODUCTS
								//---------------
								//check if products exist for this offer
								if (oOffer.Product) {
									var aProducts = oOffer.Product.results;
								} else {
									var aProducts = [];
								}
								//when products exist
								if (aProducts && aProducts.length > 0) {

									//loop at each product to save offer
									aProducts.forEach(function (oProduct, iIndex) {

										//only the active products we clone
										if (oProduct.Active === 1 && oProduct.ActiveProduct === 1) {

											//CREATE PRODUCT
											//--------------
											//change offerID and tenderID to new
											var oProductToSave = that.getService('Product').getConvertProductToSave(oProduct);
											oProductToSave.TenderID = sNewTenderID;
											oProductToSave.OfferID = oOfferToSave.OfferID;
											oProductToSave.SUPPLY_UPDATE = 0;
											oProductToSave.PAYMENT_UPDATE = 0;

											//get values to check product validity
											var sProductCode = oProductToSave.ProductCode;
											var sInstituteID = that.getInstituteIDofSelectedTender(); //INSTITUTE_ID
											var sCountryCode = that.getCountryCodeofSelectedTender(); //COUNTRY_CODE
											var sDistributorID = oOfferToSave.DistributorID; //DISTRIBUTOR_ID
											var sTenderChannel = that.getFastAppDataModel().getProperty('/Tender/TenderChannel');
											var sSellingCompany = oOfferToSave.SellingCompany;
											var aCommercialAgreement = that.getFastAppDataModel().getProperty('/Tender/CommercialAgreement');

											//if prices exist, we should also wait for these results to be finished
											if (oProduct.Price) {

												var oDeferredPriceDone = $.Deferred();
												promisesProductsInOffer.push(oDeferredPriceDone.promise()); //wait for resolve

											}

											//check if product is still valid
											promisesProductsInOffer.push(that.checkProductValidForOffer(sProductCode, sInstituteID, sCountryCode, sDistributorID,
												sTenderChannel, sSellingCompany, aCommercialAgreement).then(function (bValid) {

												//if product is still valid, we can add it to the model, otherwise we need to 
												if (bValid) {
													//Create Product
													promises.push(that.getService('Product').createProduct(oProductToSave).catch(function (oError) {
														//show error message
														that.showErrorMessage(oError, "Saving of new product");
														//whole promises batch may fail when a product fails
														throw new Error(oError);
													}));
												} else {
													//keep invalid product to show in popup
													var oInvalidProduct = {
														ProductID: sProductCode,
														ProductName: oProduct.SKU.PRODUCTPACKNAME
													};
													aInvalidProducts.push(oInvalidProduct);
												}

												//if product is valid, we can create price for product
												if (bValid) {

													//CREATE PRICES OF PRODUCT
													//------------------------
													//Save the prices for each product

													//for the reviewed offer, the products of the original offer can have price data as well
													if (oProduct.Price) {

														//in this case we should save this data as well
														var oPriceToSave = that.getService('Price').getConvertPriceToSave(oProduct.Price);
														oPriceToSave.TenderID = sNewTenderID;
														oPriceToSave.OfferID = oOfferToSave.OfferID;
														oPriceToSave.PRICE_UPDATE = 0;

														//RegPrice, spot&budget rate, cogs, can evolve/change over time, so we need to read it again from database
														//--------------------------------------------------------------------------------------------------------
														//var oRegisteredPrice = oProduct.RegisteredPrice;

														//we should wait for the prices to be finished
														promises.push(OfferProducts.loadCountryRegisteredPrice(sCountryCode, oProduct.UnitPerPack, oProduct.ProductCode,
															oOffer.Currency).then(function (sRegisteredPrice) {

															OfferProducts.loadAllUpToDatePrices(oOffer, oProduct, sRegisteredPrice.REGISTERED_PRICE).then(function (
																oUpToDatePrices) {

																//if sRegPrice = false, meaning calculation is no longer found & price is not copied
																if (oUpToDatePrices.RegPrice !== false) {

																	//convert Registration Price
																	var iConvertedRegPrice = OfferProducts.convRegisteredPrice(oProduct, sRegisteredPrice);

																	//make same rounding
																	if (oProduct.UnitPerPack) {
																		var sUnitPerPackOffer = oProduct.UnitPerPack;
																		var iConvertedOfferPrice = formatter.priceTwoOrFour(oPriceToSave.OfferPrice, undefined,
																			sUnitPerPackOffer);
																	} else {
																		var iConvertedOfferPrice = oPriceToSave.OfferPrice;
																	}

																	//make same rounding
																	if (sRegisteredPrice) {
																		var sUOMregPrice = sRegisteredPrice.UOM;
																		var iConvertedRegPrice = formatter.priceTwoOrFour(iConvertedRegPrice, undefined, sUOMregPrice);
																	} else {
																		var iConvertedRegPrice = iConvertedRegPrice;
																	}

																	//Check offer not larger then reg price
																	if (OfferProducts.checkOfferPriceLowerRegisterPrice(iConvertedOfferPrice, iConvertedRegPrice)) {

																		//change values with up to date values
																		oPriceToSave.RegPrice = (oUpToDatePrices.RegPrice === null) ? null : String(oUpToDatePrices.RegPrice);
																		oPriceToSave.COGS = (oUpToDatePrices.COGS === null) ? null : String(oUpToDatePrices.COGS);
																		oPriceToSave.SpotRate = (oUpToDatePrices.SpotRate === null) ? null : String(oUpToDatePrices.SpotRate);
																		oPriceToSave.BudgetRate = (oUpToDatePrices.BudgetRate === null) ? null : String(oUpToDatePrices.BudgetRate);

																		//Create Price
																		promises.push(that.getService('Price').createPrice(oPriceToSave).then(function (oResult) {

																			//prices done products all can continue
																			oDeferredPriceDone.resolve();

																		}).catch(function (oError) {

																			//show error message
																			that.showErrorMessage(oError, "Saving of new price");

																			//no need for aditional error message here... we already show a seperate pop-up that price saving failed (from within createPrice method, beceause this is called on other places as well)
																			//prices done products all can continue
																			oDeferredPriceDone.resolve();

																		}));

																	} else {

																		//status of offer will be tender recorded, beceause of price missing
																		//sOfferStatus = "Tender Recorded"; //its now always the default status "Offer Created"

																		//MessageToast.show("Offerprice should be lower then registered price. Please check prices after clone.");
																		//add error message
																		var oMessage = {
																			type: 'Error',
																			title: 'Not all prices copied',
																			description: 'Not all prices were copied because some are incompatible with current registered prices.. \n',
																			subtitle: 'Not all prices were copied because some are incompatible with current registered prices..',
																			counter: 1
																		}
																		aMessages.push(oMessage);

																		//prices done products all can continue
																		oDeferredPriceDone.resolve();

																	}

																} else {

																	//status of offer will be tender recorded, beceause of price missing
																	//sOfferStatus = "Tender Recorded"; //its now always the default status "Offer Created"

																	MessageToast.show(
																		"Price of product was not valid, so it wasn't copied. Please check prices after clone");

																	//add error message
																	var oMessage = {
																		type: 'Error',
																		title: 'Not all prices copied',
																		description: 'Price of product was not valid, so it wasn not copied. Please check prices after clone.. \n',
																		subtitle: 'Price of product was not valid, so it was not copied. Please check prices after clone..',
																		counter: 1
																	}
																	aMessages.push(oMessage);

																	//prices done products all can continue
																	oDeferredPriceDone.resolve();

																}

															}); //check price valid with callback

														}));

													} else {
														//price does not exist for product, so don't need to wait for further results	
														//sOfferStatus = "Tender Recorded"; //beceause not all products have prices //its now always the default status "Offer Created"

													}

												} else {
													//Product is not valid, nothing to copy + message is already build
													//if prices exist, there was a wait waiting, and it should be resolved
													if (oProduct.Price) {
														oDeferredPriceDone.resolve();
													}
												}

											})); //product valid check with callback

										} //active 1

									}); //loop products

								} else {
									//no products exist for offer, so status of offer should be
									//sOfferStatus = "Tender Recorded"; //its now always the default status "Offer Created"
								}

								//if all promises of products
								//we can show which products where not valid for copy (status of offer stays offer created if products that are left, still have prices set)
								//TODO this will no longer work beceause the promisses are not yet here, should add them during loop
								Promise.all(promisesProductsInOffer).then((result) => {

									//CREATE OFFERSTATUS
									//------------------
									//get save info for offer status to be saved
									var oOfferStatusSaveInfo = that.getService('Offer').getConvertOfferStatusToSave(oOfferToSave, sOfferStatus);

									//create offer status
									promises.push(that.getService('Offer').createOfferStatus(oOfferStatusSaveInfo).catch(function (oError) {
										//show error message
										that.showErrorMessage(oError, "Saving of offer status");
										//give fail back to promises so all promises fail
										throw new Error(oError);
									}));

									//MESSAGE INVALID PRODUCTS
									//------------------------
									//check for invalid products + give informitive message
									if (aInvalidProducts && aInvalidProducts.length > 0) {

										var sMessage =
											"The following products are no longer valid, and are missing in this reviewed or continued offer. \n \n Products: ";
										aInvalidProducts.forEach(function (oInvalidProduct, iIndexInvalidProduct) {
											sMessage = sMessage + "\n" + oInvalidProduct.ProductName;
										});

										//add error message
										var oMessage = {
											type: 'Error',
											title: 'Following product(s) where no longer valid for offer',
											description: sMessage,
											subtitle: sMessage,
											counter: 1
										}
										aMessages.push(oMessage);
									}

									//Promise for offer can be resolved
									//-------------------------------------
									oDeferredOfferDone.resolve();

								});

							} //active offer

						}); //loop offers

					} //offers exist?

					//if all promises pushed from the loop have received their answer
					Promise.all(promises).then((result) => {

						//oData
						var oData = {};

						//return new TenderID + results of batch
						oData.TenderID = sNewTenderID;
						oData.OfferID = sFirstOfferID;

						//let the callback be triggered
						//resolve(oData);
						oDeferred.resolve(oData);

						//add error message
						var oMessage = {
							type: 'Success',
							title: 'Clone of tender succesfully saved',
							description: 'Clone of tender succesfully saved',
							subtitle: 'Clone of tender succesfully saved',
							counter: 1
						}
						aMessages.push(oMessage);

						//show message view
						that.showMessageCompositeView("Cloning is done", aMessages, 'Success');

						// open loading dialog
						that._LoadingDialog.close();

					}).catch(function (oError) {

						//show error message
						//that.showErrorMessage(oError, "Clone of tender");

						// open loading dialog
						that._LoadingDialog.close();

						//Process
						var sProcessText = "Clone of tender";

						//generic message
						var sMessage = sProcessText + " failed. \n Please contact application administrator."; //default

						//get message details
						var sMessageDetails = that.getMessageDetails(oError);

						//formatting
						sMessageDetails = '<p><strong>' + sMessageDetails + '...</strong></p>';

						//add error message
						var oMessage = {
							type: 'Error',
							title: 'Clone of tender not saved',
							description: sMessageDetails,
							subtitle: sMessage,
							counter: 1
						}
						aMessages.push(oMessage);

						//show message view
						that.showMessageCompositeView("Cloning failed", aMessages, 'Error');

						//let the callback be triggered
						//reject(oError);
						oDeferred.reject(oError);

					});

				}

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},

		//CLEARING
		//--------

		//clear everything for the Offer product page
		clearAllForBasicInfoPage: function () {

			//clearing the Tender that was ready to be created
			this.setNewTenderNo("");

		},

		//PRODUCT OFFER
		//-------------

		//Local Variable
		//--------------
		_sIDdistributor: "",
		_sIDprevDistributor: "",
		_sIDsellingcompany: "",
		_sIDprevSellingcompany: "",
		_sIDdivision: "",
		_sIDprevDivision: "",
		_oOfferSaveInfo: {},
		_aProductsSaveInfo: [],
		_bNewOfferPressed: false,
		_bReviewedOfferPressed: false,
		_bContinuedOfferPressed: false,
		_bEditPressed: false,
		_bClonePressed: false,
		_bCreateModusOffer: true,

		//GETTERS
		//-------

		//get selected distributorID
		getSelectedDistributorID: function () {
			return this._sIDdistributor;
		},

		getPrevSelectedDistributorID: function () {
			return this._sIDprevDistributor;
		},

		//get selected sellingCompanyID
		getSelectedSellingCompanyID: function () {
			return this._sIDsellingcompany;
		},

		getPrevSelectedSellingCompanyID: function () {
			return this._sIDprevSellingcompany;
		},

		//get selected divisionID
		getSelectedDivisionID: function () {
			return this._sIDdivision;
		},

		getPrevSelectedDivisionID: function () {
			return this._sIDprevDivision;
		},

		//get selected offerID TenderOfferNo
		getSelectedTenderOfferNo: function () {
			var sSelectedTenderOfferNo = 1;
			var oFastAppDataModel = this.getFastAppDataModel();
			if (oFastAppDataModel.getProperty("/EditOffer/TenderOfferNo") >= 0) {
				sSelectedTenderOfferNo = oFastAppDataModel.getProperty("/EditOffer/TenderOfferNo");
			}

			return sSelectedTenderOfferNo;
		},

		//get selected offerID TenderOfferNo
		getSelectedRevisedOfferNo: function () {
			var sSelectedRevisedOfferNo = 0;
			var oFastAppDataModel = this.getFastAppDataModel();
			if (oFastAppDataModel.getProperty("/EditOffer/RevisedOfferNo") >= 0) {
				sSelectedRevisedOfferNo = oFastAppDataModel.getProperty("/EditOffer/RevisedOfferNo");
			}

			return sSelectedRevisedOfferNo;

		},

		getSelectedContinuedOfferNo: function () {
			var sSelectedContinuedOfferNo = 0;
			var oFastAppDataModel = this.getFastAppDataModel();
			if (oFastAppDataModel.getProperty("/EditOffer/ContinuedOfferNo") >= 0) {
				sSelectedContinuedOfferNo = oFastAppDataModel.getProperty("/EditOffer/ContinuedOfferNo");
			}

			return sSelectedContinuedOfferNo;

		},

		//What is the next available (get it from the tender thats already loaded in the model)
		//TODO check whereused & check if method can safely be refactored as an async method --> if yes we can use await getNextOfferID instead
		getLoadedNextOfferID: function () {

			//Next offer ID is default 1
			var sNextOfferID = 1;
		
			//Get Data model
			var oFastAppDataModel = this.getFastAppDataModel();
		
			if (oFastAppDataModel.getProperty("/Tender/NextOfferId/NEXTOFFERID")) {
		
				//Get the next available offerID
		
				//get the next available offer id
				sNextOfferID = oFastAppDataModel.getProperty("/Tender/NextOfferId/NEXTOFFERID");

			}
		
			return sNextOfferID;
		
		},

		//What is the next available OfferID (Reload from database)
		getNextOfferID: async function (sTenderID) {

			//read service again to get nextOfferID
			const oResult = await this.getService('Tender').getNextTenderOfferNo(sTenderID);
			const sNextOfferID = oResult && oResult.data && oResult.data.results && oResult.data.results[0].NEXTOFFERID || 1;

			return sNextOfferID;

		},

        getLots: async function (sOfferID) {

			//read service again to get nextOfferID
			let oFastAppDataModel = this.getFastAppDataModel();
			const oResult = await this.getService('Offer').getLotProducts(sOfferID);
			const aLots = oResult && oResult.data && oResult.data.results || [];
            oFastAppDataModel.setProperty('/OfferLots', aLots);

			return aLots;

		},

        getLotProducts: async function (sOfferID, sLotId) {

			//read service again to get nextOfferID
			let oFastAppDataModel = this.getFastAppDataModel();
			const oResult = await this.getService('Offer').getLotProducts(sOfferID, sLotId);
			const aLots = oResult && oResult.data && oResult.data.results || [];
            oFastAppDataModel.setProperty('/OfferLots', aLots);

			return aLots;

		},

		//get all offers to be saved (offer is saved 1 by 1)
		getOfferSaveInfo: function () {
			return this._oOfferSaveInfo;
		},

		//get all products that need to be saved
		getProductsSaveInfo: function () {
			this.sortByKeyAsc(this._aProductsSaveInfo, 'SORTER'); //sort 
			return this._aProductsSaveInfo;
		},

		//New offer button is pressed
		getNewOfferPressed: function () {
			return this._bNewOfferPressed;
		},

		//Reviewed offer button is pressed
		getReviewedOfferPressed: function () {
			return this._bReviewedOfferPressed;
		},

		//Reviewed offer button is pressed
		getContinuedOfferPressed: function () {
			return this._bContinuedOfferPressed;
		},

		//Edit button is pressed
		getEditPressed: function () {
			return this._bEditPressed;
		},

		//Clone button is pressed
		getClonePressed: function () {
			return this._bClonePressed;
		},

		//Creation modus?
		getCreationModusOffer: function () {
			return this._bCreateModusOffer;
		},

		//get next revision offer
		getNextRevisedOfferNo: function () {

			var sNextRevisedOfferNo = 1;

			//Get Data model
			var oFastAppDataModel = this.getFastAppDataModel();

			//Get the next available offerID
			if (oFastAppDataModel.getProperty("/EditOffer/Revision/NEXTREVISEDOFFERNO")) {

				//get the next available offer id
				sNextRevisedOfferNo = oFastAppDataModel.getProperty("/EditOffer/Revision/NEXTREVISEDOFFERNO");

			}

			return sNextRevisedOfferNo;
		},

		//get next continued offer
		getNextContinuedOfferNo: function () {

			var sNextContinuedOfferNo = 1;

			//Get Data model
			var oFastAppDataModel = this.getFastAppDataModel();

			//Get the next available offerID
			if (oFastAppDataModel.getProperty("/EditOffer/Revision/NEXTCONTINUEDOFFERNO")) {

				//get the next available offer id
				sNextContinuedOfferNo = oFastAppDataModel.getProperty("/EditOffer/Revision/NEXTCONTINUEDOFFERNO");

			}

			return sNextContinuedOfferNo;
		},

		//SETTERS
		//-------

		//set selected distributorID
		setSelectedDistributorID: function (sIDdistributor) {
			this._sIDdistributor = sIDdistributor;
		},

		setPrevSelectedDistributorID: function (sIDdistributor) {
			this._sIDprevDistributor = sIDdistributor;
		},

		//set selected SellingCompanyID
		setSelectedSellingCompanyID: function (sIDsellingCompany) {
			this._sIDsellingcompany = sIDsellingCompany;
		},

		setPrevSelectedSellingCompanyID: function (sIDsellingCompany) {
			this._sIDprevSellingcompany = sIDsellingCompany;
		},

		//set selected divisionID
		setSelectedDivisionID: function (sIDdivision) {
			this._sIDdivision = sIDdivision;
		},

		setPrevSelectedDivisionID: function (sIDdivision) {
			this._sIDprevDivision = sIDdivision;
		},

		//New offer button is pressed
		setNewOfferPressed: function (bBoolean) {
			this._bCreateModusOffer = true; //we are in create modus
			this._bNewOfferPressed = bBoolean;

			//For dynamic binding on the view
			this.getFastAppDataModel().setProperty("/NewOfferPressed", bBoolean);

			//True, meaning other buttons are not pressed.
			if (bBoolean) {
				this._bReviewedOfferPressed = false;
				this._bEditPressed = false;
				this._bClonePressed = false;
				this._bContinuedOfferPressed = false;

				//clear other view bindings
				this.getFastAppDataModel().setProperty("/ReviewedOfferPressed", false);
				this.getFastAppDataModel().setProperty("/ContinuedOfferPressed", false);
				this.getFastAppDataModel().setProperty("/EditPressed", false);
				this.getFastAppDataModel().setProperty("/ClonePressed", false);
			}

		},

		//Reviewed offer button is pressed
		setReviewedOfferPressed: function (bBoolean) {
			this._bCreateModusOffer = true; //we are in create modus
			this._bReviewedOfferPressed = bBoolean;

			//For dynamic binding on the view
			this.getFastAppDataModel().setProperty("/ReviewedOfferPressed", bBoolean);

			//True, meaning other buttons are not pressed.
			if (bBoolean) {
				this._bNewOfferPressed = false;
				this._bEditPressed = false;
				this._bClonePressed = false;
				this._bContinuedOfferPressed = false;

				//clear other view bindings
				this.getFastAppDataModel().setProperty("/NewOfferPressed", false);
				this.getFastAppDataModel().setProperty("/ContinuedOfferPressed", false);
				this.getFastAppDataModel().setProperty("/EditPressed", false);
				this.getFastAppDataModel().setProperty("/ClonePressed", false);
			}

		},

		//Continued offer button is pressed
		setContinuedOfferPressed: function (bBoolean) {
			this._bCreateModusOffer = true; //we are in create modus
			this._bContinuedOfferPressed = bBoolean;

			//For dynamic binding on the view
			this.getFastAppDataModel().setProperty("/ContinuedOfferPressed", bBoolean);

			//True, meaning other buttons are not pressed.
			if (bBoolean) {
				this._bNewOfferPressed = false;
				this._bEditPressed = false;
				this._bClonePressed = false;
				this._bReviewedOfferPressed = false;

				//clear other view bindings
				this.getFastAppDataModel().setProperty("/NewOfferPressed", false);
				this.getFastAppDataModel().setProperty("/ReviewedOfferPressed", false);
				this.getFastAppDataModel().setProperty("/EditPressed", false);
				this.getFastAppDataModel().setProperty("/ClonePressed", false);
			}

		},

		//Edit button is pressed
		setEditPressed: function (bBoolean) {
			this._bCreateModusOffer = false; //we are in update modus
			this._bEditPressed = bBoolean;

			//For dynamic binding on the view
			this.getFastAppDataModel().setProperty("/EditPressed", bBoolean);

			//True, meaning other buttons are not pressed.
			if (bBoolean) {
				this._bReviewedOfferPressed = false;
				this._bNewOfferPressed = false;
				this._bClonePressed = false;
				this._bContinuedOfferPressed = false;

				//clear other view bindings
				this.getFastAppDataModel().setProperty("/NewOfferPressed", false);
				this.getFastAppDataModel().setProperty("/ReviewedOfferPressed", false);
				this.getFastAppDataModel().setProperty("/ContinuedOfferPressed", false);
				this.getFastAppDataModel().setProperty("/ClonePressed", false);
			}
		},

		//Clone button is pressed
		setClonePressed: function (bBoolean) {
			this._bCreateModusOffer = true; //we are in create modus
			this._bClonePressed = bBoolean;

			//For dynamic binding on the view
			this.getFastAppDataModel().setProperty("/ClonePressed", bBoolean);

			//True, meaning other buttons are not pressed.
			if (bBoolean) {
				this._bReviewedOfferPressed = false;
				this._bNewOfferPressed = false;
				this._bEditPressed = false;
				this._bReviewedOfferPressed = false;

				//clear other view bindings
				this.getFastAppDataModel().setProperty("/NewOfferPressed", false);
				this.getFastAppDataModel().setProperty("/ReviewedOfferPressed", false);
				this.getFastAppDataModel().setProperty("/ContinuedOfferPressed", false);
				this.getFastAppDataModel().setProperty("/EditPressed", false);
				this.getFastAppDataModel().setProperty("/ClonePressed", false);
			}

		},

		//Update or 
		setCreationModusOffer: function (bCreationMod) {
			this._bCreateModusOffer = bCreationMod;
		},

		//keep latest version of offer info to save later on
		setOfferSaveInfo: function (oOfferSaveInfo) {
			this._oOfferSaveInfo = oOfferSaveInfo;
		},

		//set all products that need to be saved
		setProductsSaveInfo: function (aNewProductsSaveInfo) {
			this._aProductsSaveInfo = aNewProductsSaveInfo;
		},

		//CLEARING
		//--------

		//After saving... OfferInfo should be cleared
		clearOfferSaveInfo: function () {
			if (this._oOfferSaveInfo) { //if it exists
				this._oOfferSaveInfo = {};
			}
		},

		//After saving... Products should be cleared
		clearProductsSaveInfo: function () {
			if (this._aProductsSaveInfo) { //if it exists
				this._aProductsSaveInfo = [];
			}
		},

		//clear everything for the Offer product page
		clearAllForOfferProductPage: function (bKeepSelectedOffer) {

			//clear all data that was ready to be saved
			this.clearOfferSaveInfo();
			this.clearProductsSaveInfo();
			this._bCreateModusOffer = "";
			this._bEditMode = false;

		},

		clearProductsForOffer: function () {
			var aProducts = [];
			var oFastAppDataModel = this.getFastAppDataModel();
			oFastAppDataModel.setProperty("/ProductsForOffer/", aProducts);
		},
		clearResultsForProducts: function () {
			var aResultsForProducts = [];
			var aResultsForTree = [];
			var oFastAppDataModel = this.getFastAppDataModel();
			oFastAppDataModel.setProperty("/ResultsForProducts/", aResultsForProducts);
			oFastAppDataModel.setProperty("/ResultsForTree/", aResultsForTree);
		},
		clearDeliveriesForProduct: function () {
			var aDeliveries = [];
			var oFastAppDataModel = this.getFastAppDataModel();
			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Deliveries/results/", aDeliveries);
		},
		clearLettersForProduct: function () {
			var aLetters = [];
			var oFastAppDataModel = this.getFastAppDataModel();
			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Letters/results/", aLetters);
		},

		//ADDING
		//------

		//add a new offer that is not yet created in the database, so we can bind to it in the edit mode
		addNewOfferToFastAppDataModel:async function () {

			//what is the ID for the new offer
			//offerID is a temporary ID beceause at this point we do not know yet the selling companny.
			//the method prepSaveProductOffer which is executed behind the save button will overwrite this ID
			var sOfferID = this.getLoadedNextOfferID(); //Should be: Tenderoff + "-" + sNextOfferID;

			var that = this;
			var oResult=[];
			//get fastAppData model
			var oFastAppDataModel = this.getFastAppDataModel();

			//existing offers from application model
			var aOffers = oFastAppDataModel.getProperty("/Tender/Offer/results");
			if (!aOffers) {
				//if no offers exist, create empty array for new offer to add
				var aOffers = [];
				var oOffer = {
					results: aOffers
				};
				oFastAppDataModel.setProperty("/Tender/Offer/", oOffer);
			}

			//list of invalid products during reviewed of continued offer
			var aInvalidProducts = [];

			//new offer 
			if (this.getNewOfferPressed()) {

				//we can not base the new offer on the structure of an existing one. 
				//so create new object with same structure
				var oNewOfferInfo = {};
				oNewOfferInfo.Distributor = {};
				oNewOfferInfo.Product = {};
				oNewOfferInfo.Product.results = [];
				oNewOfferInfo.Tender = {};
				oNewOfferInfo.Tender.results = [];

				//initial data
				oNewOfferInfo.TenderID = this.getSelectedTenderID();
				oNewOfferInfo.OfferID = sOfferID; //temporary offer id beceause selling company is part the real offerID
				oNewOfferInfo.CountryCode = "";
				oNewOfferInfo.TenderOfferNo = "00";
				oNewOfferInfo.RevisedOfferNo = "0";
				oNewOfferInfo.ContinuationOfferNo = "0";
				oNewOfferInfo.ActiveOffer = "1"; //Tenderoffer count for active record
				//oNewOfferInfo.CloneOfferID = null;
				oNewOfferInfo.CreationDate = moment().utc().toDate();
				oNewOfferInfo.SubmissionDate = "00000000";
				oNewOfferInfo.SubmittedOn = moment().utc().toDate();
				oNewOfferInfo.SubmittedBy = UserInfo.getCWID();
				oNewOfferInfo.SellingCompany = "";
				oNewOfferInfo.Active = 1;
				oNewOfferInfo.APPROVALS_SENT = 0; //We start from saying no approvals are sent at this point: https://trello.com/c/np1g69g7
				oNewOfferInfo.Distributor.results = [];
				oNewOfferInfo.Product.results = [];
				oNewOfferInfo.Tender.results = [];

				//push to array of offers
				aOffers.push(oNewOfferInfo);
				//set current offer to easy path
				oFastAppDataModel.setProperty("/EditOffer/", oNewOfferInfo);

			}

			//Reviewed Offer or Continued Offer
			if (this.getReviewedOfferPressed() || this.getContinuedOfferPressed()) {

				//New offer based upon an existing offer that is selected
				var iIndexArray = aOffers.findIndex(x => x.OfferID === that.getSelectedOfferID());

				//catch all promises in an array
				let promises = [];
				var termChanged= false;
				//if no offer found, there is no offer selected
				if (iIndexArray === -1) {
					sap.m.MessageBox.warning("First select an offer.", {});
				} else {
					let oCopyExistingOfferInfo = $.extend(true, {}, aOffers[iIndexArray]); //deep copy from existing offer
					oCopyExistingOfferInfo.OfferID = sOfferID; //set new offerID (temporary)

					//if structures does not exist create them as empty
					if (!oCopyExistingOfferInfo.Distributor) {
						oCopyExistingOfferInfo.Distributor = {};
					}
					if (!oCopyExistingOfferInfo.Product.results) {
						oCopyExistingOfferInfo.Product = {};
						oCopyExistingOfferInfo.Product.results = [];
					}
					if (!oCopyExistingOfferInfo.Tender.results) {
						oCopyExistingOfferInfo.Tender = {};
						oCopyExistingOfferInfo.Tender.results = [];
					}

					/* Default internal bid due date & new offer due date to current date on revised / continued offer creation */
					oCopyExistingOfferInfo.InternalBidDueDate = new Date();
					oCopyExistingOfferInfo.NewOfferDueDate = new Date();
					
					//set distributorID as selected ID this way it is filled in the product add dialog
					if (oCopyExistingOfferInfo.Distributor.DistributorName) {
						that.setSelectedDistributorID(oCopyExistingOfferInfo.Distributor.DistributorID);
					}
					//EHQUT-401627-MEA-SCTASK15273924 - Payment Terms on revised Offers
					if(this.getReviewedOfferPressed() && oFastAppDataModel.oData.EditTender.Country.Region === 'MEA'){
					
						var rInstituteID = that.getInstituteIDofSelectedTender(); //INSTITUTE_ID
						var rCountryCode = oCopyExistingOfferInfo.CountryCode; //COUNTRY_CODE
						var rDistributorID = oCopyExistingOfferInfo.DistributorID; //DISTRIBUTOR_ID
						var rsTenderChannel = that.getFastAppDataModel().getProperty('/Tender/TenderChannel');
						var rsSellingCompany = oCopyExistingOfferInfo.SellingCompany;
						oResult = await that.getInstituteDistributorBrandProductsForMEA(rCountryCode,rInstituteID,rDistributorID,rsSellingCompany,rsTenderChannel);
						
						
						}
					//push to array of offers
					aOffers.push(oCopyExistingOfferInfo);

					//Add existing products to Products that will be saved 
					//TODO future after demo where we rebuild the app, this additional array of products is not needed anymore, we could always use our seperate model for it
					var aProductsToRemove = [];
					$.each(oCopyExistingOfferInfo.Product.results, function (index, value) {

						//get values to check product validity
						var sProductCode = oCopyExistingOfferInfo.Product.results[index].ProductCode;
						var sInstituteID = that.getInstituteIDofSelectedTender(); //INSTITUTE_ID
						var sCountryCode = that.getCountryCodeofSelectedTender(); //COUNTRY_CODE
						var sDistributorID = oCopyExistingOfferInfo.DistributorID //DISTRIBUTOR_ID
						var sTenderChannel = that.getFastAppDataModel().getProperty('/Tender/TenderChannel');
						var sSellingCompany = oCopyExistingOfferInfo.SellingCompany; //that.getFastAppDataModel().getProperty(that.getSelectedOfferPath()).SellingCompany;
						var aCommercialAgreement = that.getFastAppDataModel().getProperty('/Tender/CommercialAgreement');
						const priceConditions = oCopyExistingOfferInfo.Product.results[index].PriceCondition?.results;

						//check if product is still valid
						promises.push(that.checkProductValidForOffer(sProductCode, sInstituteID, sCountryCode, sDistributorID, sTenderChannel,
							sSellingCompany, aCommercialAgreement).then(function (bValid) {
							//if product is still valid, we can add it to the model, otherwise we need to 
							let resultdata=[];
							if (bValid) {
								var brandID=oCopyExistingOfferInfo.Product.results[index].SKU.Product.HLEVEL4_CODE;
								
								if(that.getReviewedOfferPressed() && oFastAppDataModel.oData.EditTender.Country.Region === 'MEA'){
									if(oResult.results.length>0){
									resultdata= (oResult.results.findIndex(commentdetails =>commentdetails.BRAND_ID	=== brandID && commentdetails.PRODUCT_ID === sProductCode) ) ;
									if(oCopyExistingOfferInfo.Product.results[index].PaymentTerms !==oResult.results[resultdata].PAYMENT_TERMS || oCopyExistingOfferInfo.Product.results[index].INCOTerms !==oResult.results[resultdata].INCO_TERMS){
										termChanged =true;
										oCopyExistingOfferInfo.Product.results[index].PaymentTerms =oResult.results[resultdata].PAYMENT_TERMS;
										oCopyExistingOfferInfo.Product.results[index].INCOTerms =oResult.results[resultdata].INCO_TERMS;
									}
									
								    
									}
								}
								
								//offerid should be the offer id of the new product
								oCopyExistingOfferInfo.Product.results[index].OfferID = sOfferID;
								//the update fields should be 0 (https://trello.com/c/np1g69g7)
								oCopyExistingOfferInfo.Product.results[index].SUPPLY_UPDATE = 0;
								oCopyExistingOfferInfo.Product.results[index].PAYMENT_UPDATE = 0;
								
								//set price update to 0 if prices exist
								if (oCopyExistingOfferInfo.Product.results[index].Prices && oCopyExistingOfferInfo.Product.results[index].Prices.results) {
									$.each(oCopyExistingOfferInfo.Product.results[index].Prices.results, function (index, oPrice) {
										//if prices exist
										oPrice.PRICE_UPDATE = 0;
									});
								}
								if(termChanged && oCopyExistingOfferInfo.Product.results.length === index +1){
									sap.m.MessageBox.warning("Payment and Inco Terms changed",{});
								}

								// clone PriceConditions
								const clonedPriceConditions = priceConditions.map(pc => {
									const clone = Object.assign({},pc);
									// clone DiscountConditions
									if(pc.DiscountCondition.results.length){
										delete clone.DiscountCondition; // to align the naming and type with the PriceConditionService:convertToSaveObject DiscountCondition
										clone.DiscountConditions = pc.DiscountCondition.results.map(dc => {
											const dcClone = Object.assign({},dc);
											return dcClone.ID && delete dcClone.ID && dcClone;
										});
									} 
									// clone FreeGoodsOther
									if(pc.FreeGoodsOther.results.length){
										clone.FreeGoodsOther = pc.FreeGoodsOther.results.map(foc => {
											const focClone = Object.assign({},foc);
											return focClone.ID && delete focClone.ID && focClone;
										});
									} 
									return clone.ID && delete clone.ID && clone;
								});
								clonedPriceConditions && (oCopyExistingOfferInfo.Product.results[index].PriceCondition.results = clonedPriceConditions);

								//we use POST to indicate that these products do not exist yet in the database
								that.addProductsSaveInfo(oCopyExistingOfferInfo.Product.results[index], "POST");
							} else {

								//we should remove the product from the oCopyExistingOfferInfo.Product.result after the loop
								aProductsToRemove.push(index);

								//keep invalid product to show in popup
								var oInvalidProduct = {
									ProductID: oCopyExistingOfferInfo.Product.results[index].ProductCode,
									ProductName: oCopyExistingOfferInfo.Product.results[index].SKU.PRODUCTPACKNAME
								};
								aInvalidProducts.push(oInvalidProduct);
							}

						}));
						
					}
					);
					// setTimeout(function(){
					// 	if(termChanged){
					// 		sap.m.MessageBox.warning("Payment and Inco Terms changed",{});
					// 	}
					// }, 1000);
					
					
					//if all promises pushed from the loop have received their answer
					//we can keep the copy
					Promise.all(promises).then((result) => {

						//after all results are there, we should remove
						for (var i = aProductsToRemove.length - 1; i >= 0; i--)
							oCopyExistingOfferInfo.Product.results.splice(aProductsToRemove[i], 1);

						//set current offer to easy path
						oFastAppDataModel.setProperty("/EditOffer/", oCopyExistingOfferInfo);

						//check for invalid products + give informitive message
						if (aInvalidProducts && aInvalidProducts.length > 0) {
							var sMessage =
								"The following products are no longer valid, and are missing in this reviewed or continued offer. \n \n Products: ";
							aInvalidProducts.forEach(function (oInvalidProduct, iIndexInvalidProduct) {
								sMessage = sMessage + "\n" + oInvalidProduct.ProductName;
							});
							sap.m.MessageBox.warning(sMessage, {});
						}

					});
					

				}
			}

			//Edit an existing offer
			if (this.getEditPressed()) {
				//edit an existing offer, no adding needs to be done here, its already loaded in the fastAppData 
				//set current offer to easy path
				var iIndexArray = aOffers.findIndex(x => x.OfferID === that.getSelectedOfferID());

				//if no offer found, there is no offer selected
				if (iIndexArray === -1) {
					sap.m.MessageBox.warning("First select an offer to edit.", {});
				} else {
					var oExistingOfferInfo = aOffers[iIndexArray];

					//set distributorID as selected ID this way it is filled in the product add dialog
					if (oExistingOfferInfo.Distributor.DistributorName) {
						that.setSelectedDistributorID(oExistingOfferInfo.Distributor.DistributorID);
					}

					//Add existing products to Products that will be saved 
					//TODO future after demo where we rebuild the app, this additional array of products is not needed anymore, we could always use our seperate model for it
					$.each(oExistingOfferInfo.Product.results, function (index, value) {
						//we use PUT to indicate that these products already exist in the database and should be updated
						that.addProductsSaveInfo(oExistingOfferInfo.Product.results[index], "PUT");
					});

					oFastAppDataModel.setProperty("/EditOffer/", oExistingOfferInfo);
				}
			}

		},

		//keep products in an array that will be saved later on
		addProductsSaveInfo: function (oProductSaveInfo, sOperation) {

			//Operation on product: CREATE UPDATE DELETE
			oProductSaveInfo._sOperation = sOperation;

			//array with products ready to be saved
			this._aProductsSaveInfo.push(oProductSaveInfo);

		},
		//EHQUT-401627-MEA-SCTASK15273924 - Payment Terms on revised Offers
		getInstituteDistributorBrandProductsForMEA: function (sCountryCode,sInstituteID,sDistributorID,sSellingCompany,sTenderChannel) {

	
			//lets work with callbacks (3 places, return, resolve, reject)
			var oDeferred = $.Deferred();

			//that is this
			var that = this;

			//set filters
			var aFilters = [];
			aFilters.push(
				new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode),
				new sap.ui.model.Filter("INSTITUTE_ID", sap.ui.model.FilterOperator.EQ, sInstituteID),
				new sap.ui.model.Filter("DISTRIBUTOR_ID", sap.ui.model.FilterOperator.EQ, sDistributorID),
				new sap.ui.model.Filter("CHANNEL", sap.ui.model.FilterOperator.EQ, sTenderChannel),
				new sap.ui.model.Filter("LEGAL_ENTITY_CODE", sap.ui.model.FilterOperator.EQ, sSellingCompany)
			);
				//Reading variables
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();
			var sPath = "/InstituteDistributorBrandProduct";

			//actual reading of the Product list
			oFastDataCalls.read(sPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					if (oData.results) { //if offers are found add them to the Model
					oFastAppDataModel.setProperty("/InstituteDistributorBrandProductMEA",oData.results)
			}

					//let the callback be triggered
					oDeferred.resolve(oData);
				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading list of products");

					//let the callback be triggered
					oDeferred.reject(oError);
				}

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		
	},

		//add already existing products to array that will be saved later on
		addAlreadyExistingProductsToSave: function () {

			//that is this
			var that = this;

			//FastAppData model
			var oFastAppDataModel = that.getFastAppDataModel();

			//get products from fastappdatamodel = existing + newly added / deleted indications
			var aProducts = oFastAppDataModel.getProperty("/EditOffer/Product/results");

			//products that are already ready for POST/PUT or delete should be left there
			var aProductsToSave = this.getProductsSaveInfo();

			//existing products
			$.each(aProducts, function (index, oProduct) {
				var iIndex = aProductsToSave.findIndex(x => x.ProductCode === oProduct.ProductCode);
				if (iIndex === -1) {
					//not found
					//adding as put into save... otherwise it already might be there with POST as its a new product thats added
					that.addProductsSaveInfo(oProduct, "PUT");
				} else {
					//already there with correct save data
				}
			});

		},

		//add a new products so we can bind to edit view
		addNewProductToFastAppDataModel: function () {

			//Model with data used for application layer data handling
			var oFastAppDataModel = this.getFastAppDataModel();

			/*
			//existing offers from application model
			var aOffers = oFastAppDataModel.getProperty("/Tender/Offer/results");
					
			//index of offerID found in the offer
			var sOfferID = this.getSelectedOfferID();
			if(!sOfferID){
				sOfferID = this.getLoadedNextOfferID(false);
			}
			var iIndex = aOffers.findIndex(x => x.OfferID === sOfferID);
					
			//path where the products should be stored
			var sPathTenderOfferProduct = "/Tender/Offer/results/" + iIndex + "/Product/results";
					
			*/

			//we gaan deze toevoegen aan de huidige Editoffer
			var sPathTenderOfferProduct = "/EditOffer/Product/results";

			//all products for offer to put back in the datamodel binding so they are shown on the screen
			var aProducts = this.getProductsSaveInfo();

			/* filtering is done in the binding at the view
			var aBindingToTable = [];
					
			aProducts.forEach(function(oProduct, index) {
					
					let oBindingToTable = $.extend(true,{},oProduct); 
					
					if(oBindingToTable._sOperation !== "DELETE"){
						aBindingToTable.push(oBindingToTable);
					};
					
					
					var oBindingToTable = oProduct;
					aBindingToTable.push(oBindingToTable);
			});
					
					
			//path is updated with the products
			oFastAppDataModel.setProperty(sPathTenderOfferProduct, aBindingToTable);	
			*/

			//path is updated with the products
			oFastAppDataModel.setProperty(sPathTenderOfferProduct, aProducts);
		},

		//REMOVING
		//--------
		removeProductsSaveInfo: function (aProductsToRemove, sCountryCode, bBrazilDivisionChanged) {

			var that = this;
			var oFastAppDataModel = this.getFastAppDataModel();
			var aProducts = this.getProductsSaveInfo();
			if(aProducts.length === 0){
				aProducts =	oFastAppDataModel.getProperty("/EditOffer/Product/results")
			}
			var aChangedProducts = [];
			var iIndex;
			var oProduct = {};
			var oFastAppDataModel = this.getFastAppDataModel();
			var sPathTenderOfferProduct = "/EditOffer/Product/results";

			//loop over the products and check if they need to be removed from the database
			aProducts.forEach(function (oProduct, indexCurrentProduct) {
				if (sCountryCode === "BR" && bBrazilDivisionChanged) {
					iIndex = aProductsToRemove.findIndex(x => x?.ProductCode === oProduct.ProductCode);
				}else {
					iIndex = aProductsToRemove.findIndex(x => x?.ProductCode === oProduct.ProductCode && x?.LotID === oProduct.LotID);
				}

				if (iIndex !== -1) { //deze staan klaar om verwijderd te worden

					oProduct = aProducts[indexCurrentProduct];

					switch (oProduct._sOperation) {
					case "POST":
						// Product is not yet existing in the back-end tables
						//this one will therefore no longer be pushed to achangeProducts (=just removed from front-end)
						oProduct._sOperation = "DELETE";
						//aProducts.splice(indexCurrentProduct, aProducts.length)
						delete aProducts[indexCurrentProduct];
						that.getFastAppDataModel().refresh(true);
						that.getDefaultModel().refresh(true);

						break;
					case "PUT":
						// Product exists already in the back-end tables
						oProduct._sOperation = "DELETE";
						aChangedProducts.push(oProduct);
						break;
					default:
						// code block
					}

				} else {
					aChangedProducts.push(oProduct);
				}

			});

			if (aChangedProducts.length > 0) {

				this.setProductsSaveInfo(aChangedProducts);
				//path is updated with the products
				oFastAppDataModel.setProperty(sPathTenderOfferProduct, aChangedProducts);

				//we have to filter out the ones that are marked for deletion.
				//they should be saved to the database but no longer displayed in the binding of the table
				var aBindingToTable = [];
				aChangedProducts.forEach(function (oProduct, index) {
					let oBindingToTable = $.extend(true, {}, oProduct);
					if (oBindingToTable._sOperation !== "DELETE") {
						aBindingToTable.push(oBindingToTable);
					};
				});

				//path is updated with the products
				oFastAppDataModel.setProperty(sPathTenderOfferProduct, aBindingToTable);

			}

		},

		//MUTATORS
		//--------
		convProductsForBinding: function (aProductsAfterAdd) {

			var that = this;
			var aProductsForBinding = [];

			//catch all promises in an array
			let promises = [];

			//if all promsises are done
			var oDeferred_all = $.Deferred();

			aProductsAfterAdd.forEach(function (oProduct, index) {

				//deep copy so no link with other objects do no longer exist
				//let oDeepCopyProduct = oProduct; //$.extend(true,{},oProduct); geen deep copy omdat we nu in edit mode de velden nog moeten aanpassen beter conv bij saven ipv andersom

				//load SKU details to show on screen as long as it is not yet saved, we don't have the info available
				promises.push(that.loadProductPackName(oProduct.ProductCode).then(function (oData) {

					//add SKU
					if (oData.PRODUCTPACKNAME) {
						oProduct.SKU = oData;
					}

					//add to array for binding
					aProductsForBinding.push(oProduct);

				}));

			});

			//if all promises pushed from the loop have received their answer
			Promise.all(promises).then((result) => {
				//return aProductsForBinding;
				oDeferred_all.resolve(aProductsForBinding);
			})

			return oDeferred_all.promise();

		},

		//CHECKERS
		//--------
		/*checkCreateNewOffer: function ( ){
			//Check if offer button is pressed: reviewed or new offer button
			var bCreateNew = false; //if false, we are in update mode
			if(this.getNewOfferPressed() || this.getReviewedOfferPressed()){ //new and review offer create a new offer
				_bCreateNewOffer = true;
			}
			return bCreateNew;
		},*/

		//is the product data changed, which is important for the supply team to give approval by devision
		checkApprovalPaymentUpdate: function (oOriginalProductInfo, oNewProductInfo) {
			var that = this;
			//when wa are changing a product check if inco payment terms have changed, if yes we need approval of business
			if (oNewProductInfo.PaymentTerms !== oOriginalProductInfo.PaymentTerms) {

				var iApprovals_sent = that.getFastAppDataModel().getProperty("/EditOffer/APPROVALS_SENT");
				oNewProductInfo.PAYMENT_UPDATE = iApprovals_sent;

			} else {
				//in this case we keep the payment_update value
				oNewProductInfo.PAYMENT_UPDATE = oOriginalProductInfo.PAYMENT_UPDATE;

			}

			return oNewProductInfo.PAYMENT_UPDATE;

		},

		//is the product data changed, which is important for the supply team to give approval for
		checkApprovalSupplyUpdate: function (oOriginalProductInfo, oNewProductInfo) {
			var that = this;
			if (
				oOriginalProductInfo.RequestedVolume === oNewProductInfo.RequestedVolume && oOriginalProductInfo.UnitPerPack === oNewProductInfo.UnitPerPack &&
				oOriginalProductInfo.FirstShipment === oNewProductInfo.FirstShipment && oOriginalProductInfo.NoofLots === oNewProductInfo.NoofLots &&
				oOriginalProductInfo.IntervalBetweenShipments === oNewProductInfo.IntervalBetweenShipments && oOriginalProductInfo.INCOTerms ===
				oNewProductInfo.INCOTerms
			) {
				//no important changes to inform supply chain.. (but maybe there where in previous saving, so we keep supply update field value)
				oNewProductInfo.SUPPLY_UPDATE = oOriginalProductInfo.SUPPLY_UPDATE;

			} else {
				//if data has changed we set the supply update field to the number of approvals that are sent
				//this way we can track changes in workflow
				var iApprovals_sent = that.getFastAppDataModel().getProperty("/EditOffer/APPROVALS_SENT");
				oNewProductInfo.SUPPLY_UPDATE = iApprovals_sent; // inform supply chain
			}

			return oNewProductInfo.SUPPLY_UPDATE;
		},

		getCurrentOfferStatus: function(sTenderID, sOfferID){ 
			if(!sTenderID) return;
			let offerId = sOfferID ? `'${sOfferID}'` : `''`;
			return this.getDefaultModel().getProperty(`/TenderOfferMaster(TENDER_ID='${sTenderID}',OFFER_ID=${offerId})`)?.STATUS;
		},

		//check if offer status should be updated or created
		checkOfferStatus: function (sImportTenderID, sImportOfferID) {

			//lets work with callbacks (3 places, return, resolve, reject)
			var oDeferred = $.Deferred();
			var that = this;

			//get model for doing the calls to the back-end
			var oFastDataCalls = that.getDefaultModel();
			var oFastAppDataModel = that.getFastAppDataModel();

			//get selected offer
			if (sImportTenderID && sImportOfferID) {
				//Key's
				var sTenderID = sImportTenderID;
				var sOfferID = sImportOfferID;
				var sActive = 1;

			} else {

				/* 
				//Ticket: https://trello.com/c/ZBekvrcr
				//when creating a reviewed offer, oOffer is not returned
				//probably its better to get the selected offerID & tenderID from the service instead of the default model
						
				var sSelectedOfferPath	= that.getSelectedOfferPath();
				var oOffer				= that.getDefaultModel().getProperty(sSelectedOfferPath);
						
				if(oOffer){
					
					//Key's
					var sTenderID	= oOffer.TenderID;
					var sOfferID	= oOffer.OfferID;
					var sActive		= 1;
					
				}else{
					
					//if offer is not existing
					//if it was not found... we still want to return positive
					var oData = {};
					oData.sResult = 'nothingfound';
					oDeferred.resolve(oData);
					
				}
				*/

				//Key's
				var sTenderID = that.getSelectedTenderID();
				var sOfferID = that.getSelectedOfferID();
				var sActive = 1;

			}

			//check if offer exists
			if (sTenderID && sOfferID) {

				//Path for writing
				var sOfferStatusSavePath = "/PT_TMTNOFST(TenderID='" + sTenderID + "',OfferID='" + sOfferID + "',Active=" + sActive + ")"; //using view to always have data

				//Path for reading is different beceause we also have statusses that are calculated (so Offer Created could be Offer Declined if calculated)
				var sOfferStatusPathRead = "/OfferStatus('" + sOfferID + "')";

				//Reading the back end data from the Approvals table
				oFastDataCalls.read(sOfferStatusPathRead, {
					success: function (oData, oResponse) {

						if (oData) { //if quotation is found

							//keep sOfferStatusPath in odata result to return
							oData.sOfferStatusSavePath = sOfferStatusSavePath;
						}

						//let the callback be triggered
						oDeferred.resolve(oData);

					},
					error: function (oError) {

						//if it was not found... we still want to return positive
						var oData = {};
						oData.sResult = 'nothingfound';
						oDeferred.resolve(oData);

					}

				});

			} else {

				//if offer is not existing
				//if it was not found... we still want to return positive
				var oData = {};
				oData.sResult = 'nothingfound';
				oDeferred.resolve(oData);

			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//LOADERS
		//-------

		//load selling companies for country
		loadSellingCompaniesForCountry: function (sCountry) {

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for product pack read
			var sCountryLegalPath = "/CountryLegalEntity";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			if (sCountryLegalPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sCountryLegalPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						//let the callback be triggered
						oDeferred.resolve(oData.results);

					},
					error: function (oError) {

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},

		//for newly added products we should load the productpackname again from the database
		//beceause for second added product we can get the product from the view but the first one is lost beceause the way the save structure works (TODO this coudld be improved)
		loadProductPackName: function (sProductPackID) {

			//lets work with callbacks: 
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();

			//path for product pack read
			var sProductPackPath = "/PT_TMPRDPCK(PRODUCTPACKID=" + sProductPackID + ")";

			if (sProductPackPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sProductPackPath, {
					urlParameters: {
						"$expand": "Product,ProductPackSKUs"
					},
					success: function (oData, oResponse) {

						//let the callback be triggered
						oDeferred.resolve(oData);

					},
					error: function (oError) {

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		loadMandatoryFields: function (sCountry) {

			if(!sCountry || sCountry === "NA"){
				return;
			}

			//lets work with callbacks: 
			var oDeferred = $.Deferred();
			var that = this;

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();
			
			//path for product pack read
			var sMandatoryFieldsPath = "/CountryTablesCustomization";
			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}

			if (sMandatoryFieldsPath) {

				//Reading the back end data from the tender table
				oFastDataCalls.read(sMandatoryFieldsPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						//let the callback be triggered
						oFastAppDataModel.setProperty("/MandatoryFields", oData.results);

						// creates a permissions object
						that.setTablePermissions(oData.results);

						oDeferred.resolve(oData);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of Mandatory Fields");

						//let the callback be triggered
						oDeferred.reject(oError);

					}
				});
			}

			

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		/**
		* Load all country specific Permissions
		*/
		//EHQUT-SCTASK14166747-In Price Agreement marks back To Offer
		loadCountryPermissions:async function(sCountry){

			if(!sCountry || sCountry.indexOf("NA") > -1 ){
				return;
			}

			const tabPermissions =await this.loadTabPermissions(sCountry);
			const fragmentPermissions =await this.loadFragmentPermissions(sCountry);

			return Promise.all([tabPermissions, fragmentPermissions]);
		},

		/**
		*Load tab permissions
		*/
		loadTabPermissions: function(sCountry){

			if(!sCountry || sCountry.indexOf("NA") > -1 ){
				return;
			}

			const that = this;
			const oFastDataCalls = this.getDefaultModel();
			
			//path for product pack read
			const sPath = "/CountryTabsCustomization";
			const aFilters = [];

			const oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
			aFilters.push(oCountryFilter);

			const promise = new Promise((resolve, reject) => {

				//Reading the back end data 
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						// creates a permissions object
						that.setTabPermissions(oData.results);

						resolve(oData.results);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of Permissions");

						reject(oError);

					}
				});

			});

			
			return promise;

		},

        /**
		*Load app config
		*/
		loadAppConfig: function(sCountry, sEnvironment){

			if(!sCountry || sCountry.indexOf("NA") > -1 ){
				return;
			}

			const that = this;
			const oFastDataCalls = this.getDefaultModel();
			
			//path for product pack read
			const sPath = "/AppConfig";
			const aFilters = [];

			const oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
			aFilters.push(oCountryFilter);

            if(sEnvironment){
                aFilters.push(new sap.ui.model.Filter("Environment", sap.ui.model.FilterOperator.EQ, sEnvironment));
            }

			const promise = new Promise((resolve, reject) => {

				//Reading the back end data 
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						// creates a permissions object
						that.setAppConfig(oData.results);

						resolve(oData.results);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of App configuration");

						reject(oError);

					}
				});

			});

			
			return promise;

		},

		/**
		*Load fragement permissions
		*/
		loadFragmentPermissions: function(sCountry){

			if(!sCountry || sCountry.indexOf("NA") > -1 ){
				return;
			}

			const that = this;
			const oFastDataCalls = this.getDefaultModel();
			
			//path for product pack read
			const sPath = "/CountryFragmentsCustomization";
			const aFilters = [];

			const oCountryFilter = new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, sCountry);
			aFilters.push(oCountryFilter);

			const promise = new Promise((resolve, reject) => {

				//Reading the back end data 
				oFastDataCalls.read(sPath, {
					filters: aFilters,
					success: function (oData, oResponse) {

						// creates a permissions object
						that.setFragmentPermissions(oData.results);

						resolve(oData.results);

					},
					error: function (oError) {

						//show error message
						that.showErrorMessage(oError, "Loading of Permissions");

						reject(oError);

					}
				});

			});

			
			return promise;

		},

		/**
		 * This method creates and sets a permission object in the FastAppDataModel.
		 * This object can be then used in Views to make the controls visible/required (per Country)
		 * @param {Array} aData - A list of permissions from CountryTablesCustomization service
		 * @example
		 * {
		 *		"Permissions":{
		 *			"editofferProductId": {
		 * 				"type": "Table",
		 * 				"Comment": {
		 *					"type": "Column",
		 *					"CountryCode": "AR",
		 *					"BindingPath": "Comment",
		 *					"Visible": false,
		 *					"Required": false
		 *				}
		 *			}
		 *		}
		 *	}
		 */
		setTablePermissions: function(aData){ 

			if(!Array.isArray(aData) || aData.length <= 0){
				return;
			}

			const oFastAppDataModel = this.getFastAppDataModel();

			const tablePermissions = {};
			
			aData.forEach(item => {

				const tableID = item.TableID;
				const column = item.Column;

				if(!tablePermissions[tableID]){
					tablePermissions[tableID] = {};
				}

				tablePermissions[tableID][column] =  {
					"type": "Column",
					"countryCode": item.CountryCode,
					"bindingPath": item.BindingPath.toLowerCase(),
					"visible": item.Visible,
					"required": item.Required,
					"description": item.Description
				}	

			});

			const allPermissions = oFastAppDataModel.getProperty("/permissions");

			if(allPermissions){
				allPermissions["tables"] = tablePermissions;
			}else{
				oFastAppDataModel.setProperty("/permissions", {"tables": {...tablePermissions}});
			}
		},

		/**
		 * This method creates and sets a permission object in the FastAppDataModel.
		 * This object can be then used in Views to make the controls visible/required (per Country)
		 * @param {Array} aData - A list of permissions from CountryTabsCustomization service
		 * @example
		 *	{
		 *		"Permissions": {
		 *			"tab": {
		 *				"editofferProductId": {
		 *					"CountryCode": "AR",
		 *					"Visible": false
		 *				}
		 *			}
		 *		}
		 *	}
		 */
		setTabPermissions: function(aData){ 

			if(!Array.isArray(aData) || aData.length <= 0){
				return;
			}

			const oFastAppDataModel = this.getFastAppDataModel();
			
			const tabPermissions = {};
			
			aData.forEach(item => {
				tabPermissions[item.TabID] =  {
					"countryCode": item.CountryCode,
					"visible": item.Visible
				}
			});

			const allPermissions = oFastAppDataModel.getProperty("/permissions");

			if(allPermissions){
				allPermissions["tabs"] = tabPermissions;
			}else{
				oFastAppDataModel.setProperty("/permissions", {"tabs": {...tabPermissions}});
			}

			
		},

        setAppConfig: function(aData){ 
			this.getFastAppDataModel().setProperty('/appConfig', aData);			
		},
		/**
		 * This method creates and sets a permission object in the FastAppDataModel.
		 * This object can be then used in Views to make the controls visible/required (per Country)
		 * @param {Array} aData - A list of permissions from CountryFragementsCustomization service
		 * @example
		 *	{
		 *		"Permissions": {
		 *			"tab": {
		 *				"editofferProductId": {
		 *					"CountryCode": "AR",
		 *					"Visible": false
		 *				}
		 *			}
		 *		}
		 *	}
		 */
		setFragmentPermissions: function(aData){ 

			if(!Array.isArray(aData) || aData.length <= 0){
				return;
			}

			const oFastAppDataModel = this.getFastAppDataModel();
			
			const fragmentPermissions = {};
			
			aData.forEach(item => {
				fragmentPermissions[item.FragmentID] =  {
					"countryCode": item.CountryCode,
					"visible": item.Visible,
					"fragment": item.FragmentName
				}
			});

			const allPermissions = oFastAppDataModel.getProperty("/permissions");

			if(allPermissions){
				allPermissions["fragments"] = fragmentPermissions;
			}else{
				oFastAppDataModel.setProperty("/permissions", {"fragments": {...fragmentPermissions}});
			}
			
		},

		//SAVERS
		//------

		//actual saving of the product offer
		saveProductOffer: async function (sPath) {

			//that is this
			var that = this;

			//get model for calls
			var oModel = this.getDefaultModel();

			//get offer to be saved
			var oOfferSaveInfo = this.getOfferSaveInfo();
			var oOfferToSave = that.getService('Offer').getConvertOfferToSave(oOfferSaveInfo);

			//Check if offer button is pressed: reviewed or continued new offer button (or clone button pressed)
			var bCreateOffer = that.getCreationModusOffer();

			//promises
			let promises = [];

			//check if we need to update the offer or create a new offer
			if (sPath === undefined || bCreateOffer === true) {

				//create new offer
				promises.push(that.getService('Offer').createOffer(oOfferToSave).catch(function (oError) {

					//show error message
					that.showErrorMessage(oError, "Creation of offer");

					//promises must fail as well
					throw new Error(oError);

				}));

			} else { //you are here when an update is done

				//update existing offer
				promises.push(that.getService('Offer').updateOffer(oOfferToSave).catch(function (oError) {

					//show error message
					that.showErrorMessage(oError, "Update of offer");

					//promises must fail as well
					throw new Error(oError);

				}));

			}

            
            //Get offer Lots to be saved at the same time
            const oFastAppDataModel = that.getFastAppDataModel();
            let aLots = oFastAppDataModel.getProperty('/EditOffer/Lots/results');
            let aExistingLots = await that.getService('Offer').getOfferLots(oOfferToSave.OfferID);
            aExistingLots = aExistingLots?.data.results;

            //delete removed lots
            aExistingLots.forEach(lot => {
                if(aLots.findIndex(editedLot => editedLot.LotID === lot.LotID) === -1){
                    promises.push(that.getService('Offer').deleteOfferLot(lot).catch(function (oError) {
                        that.showErrorMessage(oError, "Deletion of lot");
                        throw new Error(oError);
                    }));
                }
            });

            //create/update new/existing lots
            if(aLots && aLots.length > 0){
                aLots.forEach(lot => {
                    lot.LotID = Number(lot.LotID);
                    promises.push(that.getService('Offer').createOfferLot(lot).catch(function (oError) {
                        that.showErrorMessage(oError, "Creation of lot");
                        throw new Error(oError);
                    }));
                });
            }

			//when finished
			return Promise.all(promises).then((oResult) => {

				//succesful save
				if (that.getCreationModusOffer()) {

					//check offer created
					var sOfferID = 'Unknown';
					if (oResult && oResult.length > 0) {
						sOfferID = oResult[0].data.OfferID; //there is only 1
					}
					
					//show message
					that.getOfferCompositeMessages().push({
						type: 'Success',
						title: 'Offer created successfully',
						description: 'Offer created successfully',
						subtitle: 'Offer: ' + sOfferID
					});

				} else {

					//show update message
					that.getOfferCompositeMessages().push({
						type: 'Success',
						title: 'Offer updated successfully',
						description: 'Offer updated successfully',
						subtitle: 'Offer updated successfully'
					});
				}

				//creation modus is finished (now we go to update mode for this offer) 
				//f.e if products fails you can still continue with saving (offer is then updated)
				that.setCreationModusOffer(false);

				//let the callback be triggered
				//oDeferred.resolve(oData);

				//there is only 1 result at this point	
				return oResult[0].data;

			}).catch(function (oError) {

				//Error during save
				that.showErrorMessage(oError, "Saving of product offer");
				//let the callback be triggered

				//throw a new error for current change
				throw new Error(oError);
			});

		},

		saveOffer: function (offer) {

			const oOfferToSave = this.getService('Offer').getConvertOfferToSave(offer);

			return this.getService('Offer').createOffer(oOfferToSave);
		},

        saveOfferLots: function (offer) {

			const oLotsToSave = this.getFastAppDataModel.getProperty('/EditOffer/Lots/results');

			return this.getService('Offer').createOffer(oLotsToSave);
		},

		sendMail: function (mail) {
			return this.getService('Mail').sendMail(mail);
		},

		getOffers: function (sTenderID, sCountryCode, sExpand) {
			return this.getService('Offer').getOffers(sTenderID, sCountryCode, sExpand);
		},

		getTenderProducts: function (sTenderID) {
			return this.getService('Product').getTenderProducts(sTenderID);
		},

		getProductPriceAgreement: function (sCountryCode, sProductPackId){
			return this.getService('Product').getProductPriceAgreement(sCountryCode, sProductPackId);
		},

		getFinancialProducts: function (offerID) {
			let oProductService = this.getService('Product');
			return oProductService.getFinancialProducts(offerID);
		},

		getCountryBrandProducts: function (countryCode) {
			let oProductService = this.getService('Product');
			return oProductService.getCountryBrandProducts(countryCode);
		},

        getProductTypeProfitability: function (sOfferId, sCountryCode) {
			let oOfferService = this.getService('Offer');
			return oOfferService.getProductTypeProfitability(sOfferId, sCountryCode);
		},


		//soft delete Offer (=set inactive column to 0)
		saveSoftDeleteOffer: function () {

			//that is this
			var that = this;

			//get model for calls
			var oModel = this.getDefaultModel();

			//get save info for offer status to be saved
			var oOfferSaveInfo = {};
			oOfferSaveInfo.OfferID = that.getSelectedOfferID();
			oOfferSaveInfo.Active = 0;

			//Keep the change opperations: Merge 
			return that.getService('Offer').updateOffer(oOfferSaveInfo, "MERGE").then(function (oResult) {

				//deletion success
				sap.m.MessageBox.success("Offer is successfully removed..", {});

			}).catch(function (oError) {

				//Error during save
				that.showErrorMessage(oError, "Offer deletion");

			});

		},

		//set offer as an inactive offer, for example beceause you created a reviewed offer for this one
		saveInactiveOffer: function () {

			//that is this
			var that = this;

			//get model for calls
			var oModel = this.getDefaultModel();

			//get save info for offer status to be saved
			var oOfferSaveInfo = {};
			oOfferSaveInfo.OfferID = that.getSelectedOfferID();
			oOfferSaveInfo.ActiveOffer = 0;

			//Keep the change opperations: Merge 
			return that.getService('Offer').updateOffer(oOfferSaveInfo, "MERGE").then(function (oResult) {

				//no success message needed here

			}).catch(function (oError) {

				//Error during save
				that.showErrorMessage(oError, "Setting source offer to inactive");

			});

		},

		//saving of status without knowing if you need to update existing or creating
		saveOfferStatus: function (sStatus) {

			//lets work with callbacks: this way we only save products if OFFER is created
			var oDeferred = $.Deferred();
			var that = this;

			//get model for calls
			var oModel = this.getDefaultModel();

			//get save info for offer status to be saved
			var oOfferSaveInfo = this.getOfferSaveInfo();
			var oOfferStatusSaveInfo = this.getService('Offer').getConvertOfferStatusToSave(oOfferSaveInfo, sStatus);

			//check if there needs to be an update (already existing and erpost)
			$.when(that.checkOfferStatus()).done(function (oData) {

				if (oData.sResult === 'nothingfound') {

					//Keep the change opperations: Create (POST) 
					that.getService('Offer').createOfferStatus(oOfferStatusSaveInfo).then(function (oResult) {
						//let the callback be triggered 
						oDeferred.resolve(oData); //FYI: oData is correct to return, not a typing mistake
					}).catch(function (oError) {
						//show error message
						that.showErrorMessage(oError, "Create offerstatus");
						//let the callback be triggered
						oDeferred.reject(oError);
					});

				} else {

					//Keep the change opperations: Update (PUT) 
					that.getService('Offer').updateOfferStatus(oOfferStatusSaveInfo).then(function (oResult) {
						//let the callback be triggered
						oDeferred.resolve(oData);
					}).catch(function (oError) {
						//show error message
						that.showErrorMessage(oError, "Update offerstatus");
						//let the callback be triggered
						oDeferred.reject(oError);
					});

				}

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//Indicates that an approval has been sent, or after change on financial data, or offer data, this indicates sent needs to be done again
		//Description: https://trello.com/c/np1g69g7
		saveOfferApprovalSent: function (iApprovalsSent) {

			//that is this
			var that = this;
			var oModel = that.getDefaultModel();

			//get save info for offer Appr
			var oOfferSaveInfo = {};
			oOfferSaveInfo.APPROVALS_SENT = iApprovalsSent;

			//path of offer that is selected
			var sPath = oModel.createKey("/PT_TMOFRS", {
				OfferID: that.getSelectedOfferID()
			});

			//Update Offer
			return that.odata(sPath).put(oOfferSaveInfo);

		},

		//add All products as a batch to the database
		saveProductInfo: function () {

			//lets work with callbacks:
			var oDeferred = $.Deferred();

			//catch all promises in an array
			let promises = [];
			var oDeferred_all = $.Deferred();

			//Path to be writing to
			var sPath = "/PT_TMOFPR";
			var that = this;

			var OfferProducts = this.getFinancialModel();
			var oModel = that.getDefaultModel(); //new sap.ui.model.odata.ODataModel(this._connectionString);

			//saving all products, not only the newly added or removed whitch are already in getProductsSaveInfo
			that.addAlreadyExistingProductsToSave();

			//get the array of products that need to be saved
			var aProductsSaveInfo = this.getProductsSaveInfo();

			//counting the numbers of products to be saved. Starting from 0
			var iProductsCount = 0;
			if (aProductsSaveInfo) {
				iProductsCount = aProductsSaveInfo.length;
			}

			//Check if there are products to save, if no products to save, leave function
			if (iProductsCount === 0) {

				var bNothingToSave = true;

				//let the callback be triggered
				oDeferred.resolve(bNothingToSave);

			} else {

				//Put into batch operations
				var aChangeOperations = [];
				//for (var i = 0; i < iProductsCount; i++) {
				aProductsSaveInfo.forEach(function (oProductSaveInfo, iIndex) {

					//pas structuur aan aan de save....
					var oProductToSave = that.getService('Product').getConvertProductToSave(oProductSaveInfo);
					var originalOffer = oProductSaveInfo.Offer;

					//is it updating an existing product (PUT) or Creating an new product (POST) or Deleting an existing product (DELETE)
					var sOperation = oProductSaveInfo._sOperation;

					//sPath should be different for update or create
					switch (sOperation) {
					case "POST":

						//when we add a product, this will need approval, so we set supply update field to approval sent value of offer
						var iApprovals_sent = that.getFastAppDataModel().getProperty("/EditOffer/APPROVALS_SENT");
						oProductToSave.SUPPLY_UPDATE = iApprovals_sent;
						oProductToSave.PAYMENT_UPDATE = iApprovals_sent;

						//Create Product
						promises.push(that.getService('Product').createProduct(oProductToSave).catch(function (oError) {
							//show error message
							that.showErrorMessage(oError, "Saving of new product");
							//whole promises batch may fail when a product fails
							throw new Error(oError);
						}));

						break;
					case "PUT":
						//https://trello.com/c/np1g69g7
						promises.push(that.loadProduct(oProductToSave.OfferID, 1, oProductToSave.ProductCode, oProductToSave, oProductToSave.LotID).then(function (
							oOriginalProductInfo) {

							//when we are changing a product, we should check if data is changed that impacts the approval proces (supply update 1 or 0 for re-approval)
							if (oOriginalProductInfo !== false) {

								//check approval supply update
								oOriginalProductInfo._NewProductInfo.SUPPLY_UPDATE = that.checkApprovalSupplyUpdate(oOriginalProductInfo,
									oOriginalProductInfo._NewProductInfo);

								//check ApprovalPaymentUpdate
								oOriginalProductInfo._NewProductInfo.PAYMENT_UPDATE = that.checkApprovalPaymentUpdate(oOriginalProductInfo,
									oOriginalProductInfo._NewProductInfo);

							}

							//Create Product (push pending to promises as well)
							return that.getService('Product').updateProduct(oProductToSave, sOperation)
                            // .then(function(reponse){

                            //     // for Spain only.
                            //     if(oProductToSave.CountryCode === "ES"){
                            //         that.getService('Product').updateCountryProductPack(oProductSaveInfo.SKUCountry)
                            //         .catch(function (oError) {
                            //             that.showErrorMessage(oError, "Update of Country product pack");
                            //             throw oError;
                            //         });
                            //     }
                            // })
                            .catch(function (oError) {
								that.showErrorMessage(oError, "Update of product");
								throw new Error(oError);
							});

							//add to batch
							//aChangeOperations.push(oModel.createBatchOperation(sPath, sOperation, oOriginalProductInfo._NewProductInfo, null));

						}));

						break;

					case "DELETE":

						/*
						//when we delete a product, this will need approval, so we set supply update field to approval sent value of offer
						var iApprovals_sent = that.getFastAppDataModel().getProperty("/EditOffer/APPROVALS_SENT");
						oProductToSave.SUPPLY_UPDATE = iApprovals_sent;
						oProductToSave.PAYMENT_UPDATE = iApprovals_sent;
						*/

						//Remove the product
						promises.push(that.getService('Product').removeProduct(oProductToSave).catch(function (oError) {
							//show error message
							that.showErrorMessage(oError, "Removing of product");
							throw new Error(oError);
						}));

						// If product has price remove it
						const oProductPrice = oProductSaveInfo.Price;
						if (oProductPrice) {
							//Remove the price of product
							promises.push(that.getService('Price').deleteProductPrice(oProductPrice).catch(function (oError) {
								//show error message
								that.showErrorMessage(oError, "Removing of price");
								throw new Error(oError);
							}));
						}
						
						break;

					default:

					}

					//Save the prices for each product in case of Continued offer or Reviewed offer
					if (that.getReviewedOfferPressed() === true || that.getContinuedOfferPressed() === true) {

						//for the reviewed offer, the products of the original offer can have price data as well
						if (oProductSaveInfo.Price) {
							//we are waiting for the price to be saved
							var oDeferred_price = $.Deferred();
							promises.push(oDeferred_price);

							//we are waiting for the loading of the price
							promises.push(OfferProducts.loadCountryRegisteredPrice(that.getSelectedCountry(), oProductSaveInfo.UnitPerPack,
								oProductSaveInfo.ProductCode, originalOffer.Currency).then(function (sRegisteredPrice) {

								//make sure the price data is up to date & still matches checks, otherwise we don't save it
								OfferProducts.loadAllUpToDatePrices(oProductSaveInfo.Offer, oProductSaveInfo, sRegisteredPrice.REGISTERED_PRICE).then(
									function (oUpToDatePrices) {

										//in this case we should save price data as well
										var oProductPrice = that.getService('Price').getConvertPriceToSave(oProductSaveInfo.Price);
										var Region=that.getFastAppDataModel().oData.Tender.Country.Region;
										//if sRegPrice = false, meaning calculation is no longer found & price is not copied
										if (oUpToDatePrices.RegPrice !== false) {

											//convert Registration Price
											var iConvertedRegPrice = OfferProducts.convRegisteredPrice(oProductSaveInfo, sRegisteredPrice);
											//make same rounding
											if (oProductSaveInfo.UnitPerPack) {
												var sUnitPerPackOffer = oProductSaveInfo.UnitPerPack;
												var iConvertedOfferPrice = (Region === 'MEA' ) ? formatter.priceFour(oProductPrice.OfferPrice, undefined, sUnitPerPackOffer) :formatter.priceTwoOrFour(oProductPrice.OfferPrice, undefined, sUnitPerPackOffer);
											} else {
												var iConvertedOfferPrice = oProductPrice.OfferPrice;
											}

											//make same rounding
											if (sRegisteredPrice) {
												var sUOMregPrice = sRegisteredPrice.UOM;
												var iConvertedRegPrice = (Region === 'MEA' ) ? formatter.priceFour(iConvertedRegPrice, undefined, sUOMregPrice) :formatter.priceTwoOrFour(iConvertedRegPrice, undefined, sUOMregPrice);
											} else {
												var iConvertedRegPrice = iConvertedRegPrice;
											}

											//Check offer not larger then reg price
											if (OfferProducts.checkOfferPriceLowerRegisterPrice(iConvertedOfferPrice, iConvertedRegPrice)) {

												//change values with up to date values
												oProductPrice.RegPrice = (oUpToDatePrices.RegPrice === null) ? null : oUpToDatePrices.RegPrice.toString();
												oProductPrice.COGS = (oUpToDatePrices.COGS === null) ? null : oUpToDatePrices.COGS.toString();
												oProductPrice.SpotRate = (oUpToDatePrices.SpotRate === null) ? null : oUpToDatePrices.SpotRate.toString();
												oProductPrice.BudgetRate = (oUpToDatePrices.BudgetRate === null) ? null : oUpToDatePrices.BudgetRate.toString();

												//add creation of price to batch operation
												that.getService('Price').createPrice(oProductPrice).catch(function (oError) {

													//show error message
													that.showErrorMessage(oError, "Saving of new price");

												});
												//aChangeOperations.push(oModel.createBatchOperation(sPathPrice, "POST", oProductPrice, null));

											} else {
												//sap.m.MessageBox.warning("Offerprice should be lower then registered price. Price not copied.", {});
												that.getOfferCompositeMessages().push({
													type: 'Warning',
													title: 'Not all prices were copied',
													description: 'Not all prices were copied because some are incompatible with current registered prices.',
													subtitle: 'Not all prices were copied',
													counter: 1
												});
											}

										} else {
											that.getOfferCompositeMessages().push({
												type: 'Warning',
												title: "Price of product was not valid, so it wasn't copied.",
												description: "Price of product was not valid, so it wasn't copied.",
												subtitle: "Price of product was not valid, so it wasn't copied.",
												counter: 1
											});
										}

										//we now know everything for this price is resloved
										oDeferred_price.resolve();

									});
							}));
						}

						//for the reviewed or continued offer, the products of the original offer can have price condition data as well
						if(oProductSaveInfo.PriceCondition?.results?.length){
							// update offerID
							oProductSaveInfo.PriceCondition.results.forEach(pc => pc.OfferID = that.getSelectedOfferID());
							const priceConditionSaveObjects = oProductSaveInfo.PriceCondition.results.map(pc => that.getService("PriceCondition").convertToSaveObject(pc,"offerProductsPage"));
							const savePriceConditionPromises = priceConditionSaveObjects.map(pc => that.getService("PriceCondition").upsertPriceCondition(pc))
							promises.concat(savePriceConditionPromises);
						}
					}

					//Save the group purchasing for each product
					if (oProductSaveInfo.GroupPurchasing && oProductSaveInfo.GroupPurchasing.results.length > 0) {

						//loop at the results of the group purchasing
						oProductSaveInfo.GroupPurchasing.results.forEach(function (oGroupPurchasing, iIndex) {

							//convert group purchasing
							var oGroupPurchasingToSave = that.getService('GroupPurchasing').getConvertGroupPurchasingToSave(oGroupPurchasing);

							//sPath should be different for update or create
							var sPathGroupPurch = "";
							var sOperationGroupPurch = oGroupPurchasing._sOperation;
							switch (sOperationGroupPurch) {
							case "POST":
								//create group purchasing
								promises.push(that.getService('GroupPurchasing').createGroupPurchasing(oGroupPurchasingToSave).catch(function (oError) {
									//show error message
									that.showErrorMessage(oError, "Creation of group purchasing");
									throw new Error(oError);
								}));
								break;
							case "PUT":
								//update group purchasing
								promises.push(that.getService('GroupPurchasing').updateGroupPurchasing(oGroupPurchasingToSave).catch(function (oError) {
									//show error message
									that.showErrorMessage(oError, "Updating of group purchasing");
									throw new Error(oError);
								}));
								break;
							case "DELETE":
								//remove group purchasing
								promises.push(that.getService('GroupPurchasing').removeGroupPurchasing(oGroupPurchasingToSave).catch(function (oError) {
									//show error message
									that.showErrorMessage(oError, "Removing of group purchasing");
									throw new Error(oError);
								}));
								break;
							default:

							}

						});

					}

				});

				//if all promises pushed from the loop have received their answer, we can continue the save 
				//also if no promisses where pushed in the coding above... this will execute, beceause it doens't need to wait for results
				Promise.all(promises).then((result) => {

					//succesfull saving

					//Offer succesfully saved, so it can be cleared
					that.clearOfferSaveInfo();

					//sap.m.MessageBox.success("Products Sucessfully Changed..", {});
					that.getOfferCompositeMessages().push({
						type: 'Success',
						title: 'Products Successfully Changed..',
						description: 'Products Successfully Changed..',
						subtitle: 'Products Successfully Changed..'
					});

					//let the callback be triggered
					oDeferred.resolve(that.getProductsSaveInfo());

					//update approvals sent to the value of the offer (to indicate that a change has been made to the offer data, so approvals need to be send again)
					var iApprovals_sent = that.getFastAppDataModel().getProperty("/EditOffer/APPROVALS_SENT");
					that.saveOfferApprovalSent(iApprovals_sent).catch(function (oError) {
						//Error during save
						that.showErrorMessage(oError, "Background saving for approvals sent field");
					});

				}).catch(function (oError) {

					//error message
					that.showErrorMessage(oError, "Saving of product info");

					//let the callback be triggered
					oDeferred.reject(oError);

				});

			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//Saving All data for Product Offer view
		saveProductOfferAll: function (sPath) {

			//lets work with callbacks:
			var that = this;

			var sOfferID = that.getSelectedOfferID();
			var sOfferPath = that.getSelectedOfferPath();

			var aMessages = [];

			//Results Return
			var oSaveResult = {
				saveProductOfferID: sOfferID,
				saveProductOffer: false,
				saveProductOfferData: {},
				saveProductInfo: false,
				saveProductInfoData: ""
			}

			//saving product offer
			return that.saveProductOffer(sPath).then(function (oDataOffer) {

				//succesfully saved the ProductOffer
				oSaveResult.saveProductOffer = true;
				oSaveResult.saveProductOfferData = oDataOffer;
				var oOfferSaveInfo = that.getOfferSaveInfo();

				//keep saved offerID so we can select after save in display mode
				if (oOfferSaveInfo.OfferID) {
					oSaveResult.saveProductOfferID = oOfferSaveInfo.OfferID;
				}

				//when we are creating a reviewed offer, the original offer should be set to inactive
				if (that.getReviewedOfferPressed() === true) {

					that.saveInactiveOffer().then(function (oResult) {

					});

				}

				//IF save of offer succreeded... and we have a new offerID (not an update of an existing offerID) = create offer or reviewed offer is pressed
				if (
					that.getNewOfferPressed() === true ||
					that.getReviewedOfferPressed() === true ||
					that.getContinuedOfferPressed() === true
				) {

					//set the new offer as selected
					that.setSelectedOfferID(oOfferSaveInfo.OfferID);
					sOfferPath = "/PT_TMOFRS('" + oOfferSaveInfo.OfferID + "')";
					that.setSelectedOfferPath(sOfferPath);

				}

				//status is depending on if prices are already set or not
				//"Tender recorded" (now always "Offer created") = if no prices are set (new offer), or existing offer is edit
				//"Offer Created" = for reviewed offer & continued offer (prices are copied)
				if (that.getNewOfferPressed() === true || that.getEditPressed() === true) {
					//var sOfferStatus = "Tender Recorded";
					var sOfferStatus = "Offer Created";
				}
				if (that.getReviewedOfferPressed() === true || that.getContinuedOfferPressed() === true) {
					var sOfferStatus = "Offer Created";
				}

				//if offer status is set
				if (sOfferStatus) {

					//save offer status
					that.saveOfferStatus(sOfferStatus);

				}

				//IF save of offer succeeded... we can go on with saving the product
				return new Promise(function (resolve, reject) {

					$.when(that.saveProductInfo()).done(function (aProducts) {

						//clear all input
						that.clearAllForOfferProductPage();

						//succesfully saved the ProductOffer
						oSaveResult.saveProductInfo = true;
						oSaveResult.saveProductInfoData = aProducts;

						if (that.getOfferCompositeMessages()) {
							if (that.getNewOfferPressed() === true || that.getReviewedOfferPressed() === true || that.getContinuedOfferPressed() ===
								true) {
								that.setOfferCreated(true);
							}
							that.showMessageCompositeView("Offer created", that.getOfferCompositeMessages(), 'Success');
							that.getOfferCompositeMessages().splice(0, that.getOfferCompositeMessages().length);
						}

						resolve(oSaveResult);

					});

				});

			}).catch(function (oError) {
				MessageToast.show('..Error during save..');
				throw new Error(oError);
			});

		},

		//Change offer submissionDate
		saveOfferSubmissionDate: function (sSubmissionDate) {

			//lets work with callbacks: this way we only save products if OFFER is created
			var oDeferred = $.Deferred();
			var that = this;

			//get model for calls
			var oModel = this.getDefaultModel();

			//get save info for offer status to be saved
			var oOfferSaveInfo = {};
			oOfferSaveInfo.OfferID = that.getSelectedOfferID();
			oOfferSaveInfo.SubmissionDate = sSubmissionDate;

			//update offer
			that.getService('Offer').updateOffer(oOfferSaveInfo).catch(function (oError) {

				//show error message
				that.showErrorMessage(oError, "Error when saving submission date.");

				//let the callback be triggered
				oDeferred.reject(oError);

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//TENDER RESULTS
		//--------------

		//Local Variable
		//--------------

		//GETTERS
		//-------

		//SETTERS
		//-------

		//MUTATORS
		//--------

		//CHECKERS
		//--------

		//LOADERS
		//-------

		//load outcome reasons (TODO this should be used to fill dropdown on results tab (outcome table))
		loadOutcomeReasons: function (sOutcome, iIndex) {

			//default = first of dropdown from outcome
			if (!sOutcome) {
				sOutcome = "Decision Pending";
			}
			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sOutcomeReasonsPath = "/PT_TMOUTRS";

			var aFilters = [];

			if (sOutcome) {
				var oOutcomeFilter = new sap.ui.model.Filter("Outcome", sap.ui.model.FilterOperator.EQ, sOutcome);
				aFilters.push(oOutcomeFilter);
			}

			//Reading the back end data
			oFastDataCalls.read(sOutcomeReasonsPath, {
				filters: aFilters,
				success: function (oData, oResponse) {

					//keep index 
					oData.index = iIndex;

					//let the callback be triggered
					oDeferred.resolve(oData);

				},
				error: function (oError) {

					//show error message
					that.showErrorMessage(oError, "Loading of outcome reasons");

					//let the callback be triggered
					oDeferred.reject(oError);

				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

			//EHQUT-199069-Italy – Competitor results not linked to Bayer products/offers
			loadOtherCompetitorresult :function(productcodecollection,sSelectedOfferID){

				const filters = [];
				const orFilter =[];
				
				var product=productcodecollection.length;
				for(var i=0;i<product;i++){
					orFilter.push(new sap.ui.model.Filter("PRODUCTCODE",sap.ui.model.FilterOperator.NE, productcodecollection[i]));
				}
				filters.push(new sap.ui.model.Filter(orFilter, true));
		
				  filters.push(
					new sap.ui.model.Filter("OFFERID", sap.ui.model.FilterOperator.EQ, sSelectedOfferID),
					
				);
				
				return this.odata("/TransCompetitorResult").get({ filters: filters });
	
			},
	
			loadCompetitorProductID : function(productname){
				const filters = [];
				filters.push(new Filter({
					path: 'CountryCode',
					operator: FilterOperator.EQ,
					value1: 'IT'
				}));
				
				
				return this.odata("/MasterCompetitors").get({ filters: filters });
			},
			
			loadProductPackID: function () {
	
				//set filters
				const filters = [];
				filters.push(
					new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, 'IT'),
					
				);
				
				return this.odata("/CountryBrandProducts").get({ filters: filters });
				
	
			},
		//EHQUT-199069-Italy – Competitor results not linked to Bayer products/offers
		loadCompetitorResults: function (iIndex) {

			//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
			var oDeferred = $.Deferred();

			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getDefaultModel();
			var oFastAppDataModel = this.getFastAppDataModel();

			var that = this;

			var sCompetitorResultsPath = "/PT_TMTRRES";

			//Reading the back end data
			oFastDataCalls.read(sCompetitorResultsPath, {
				urlParameters: {
					"$expand": "CompetitorResult"
				},
				success: function (oData, oResponse) {
					//keep index 
					oData.index = iIndex;

					//let the callback be triggered
					oDeferred.resolve(oData);
				},
				error: function (oError) {
					//show error message
					that.showErrorMessage(oError, "Loading of competitor results");

					//let the callback be triggered
					oDeferred.reject(oError);
				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//ADDING
		//------

		//CLEARING
		//--------

		//clear everything for the Offer product page
		clearAllForTenderResultsPage: function () {

			this.setSelectedOfferID("");
			this.setSelectedOfferPath("");

		},

		//FINANCIAL OFFER
		//-------------------
		//CHECK OfferProducts.js (TODO put into correct state-service layer separation)


		//DELIVERY MANAGEMENT
		//-------------------

		//Local Variable
		//--------------
		_aDeliveriesSaveInfo: [],
		_aLettersSaveInfo: [],

		//GETTERS
		//-------
		//get all deliveries that need to be saved
		getDeliveriesSaveInfo: function () {
			return this._aDeliveriesSaveInfo;
		},

		//get all letters that need to be saved
		getLettersSaveInfo: function () {
			return this._aLettersSaveInfo;
		},

		//SETTERS
		//-------

		//set all deliveries that need to be saved
		setDeliveriesSaveInfo: function (aDeliveriesSaveInfo) {
			this._aDeliveriesSaveInfo = aDeliveriesSaveInfo;
		},

		//set all letters that need to be saved
		setLettersSaveInfo: function (aLettersSaveInfo) {
			this._aLettersSaveInfo = aLettersSaveInfo;
		},

		//ADDING
		//------

		//keep deliveries in an array that will be saved later on
		addDeliverySaveInfo: function (oDeliverySaveInfo, sOperation) {

			//Operation on product: CREATE UPDATE DELETE
			oDeliverySaveInfo._sOperation = sOperation;

			//array with products ready to be saved (TODO: use setDeliveriesSaveInfo() 
			this._aDeliveriesSaveInfo.push(oDeliverySaveInfo);

		},

		//keep deliveries in an array that will be saved later on
		addLetterSaveInfo: function (oLetterSaveInfo, sOperation) {

			//Operation on product: CREATE UPDATE DELETE
			oLetterSaveInfo._sOperation = sOperation;

			//array with products ready to be saved
			this._aLettersSaveInfo.push(oLetterSaveInfo);

		},

		//add a new products so we can bind to edit view
		//TODO: check if this can be deleted - no longer used
		addNewLettersToFastAppDataModel: function () {

			var that = this;

			//Model with data used for application layer data handling
			var oFastAppDataModel = this.getFastAppDataModel();

			//we gaan deze toevoegen aan de huidige selected product
			var sPathSelectedProduct = that.getSelectedProductPath();
			var sPathLettersSelectedProduct = sPathSelectedProduct + "/Letters/results/";

			//all products for offer to put back in the datamodel binding so they are shown on the screen
			var aLetters = this.getLettersSaveInfo();
			var aBindingToTable = [];

			aLetters.forEach(function (oLetter, index) {
				let oBindingToTable = $.extend(true, {}, oLetter);
				if (oBindingToTable._sOperation !== "DELETE") {
					aBindingToTable.push(oBindingToTable);
				};
			});

			//path is updated with the products
			oFastAppDataModel.setProperty(sPathLettersSelectedProduct, aBindingToTable);
			var oResults = {
				results: aBindingToTable
			}; //results to match path better
			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Letters/", oResults);
		},

		//REMOVING
		//--------
		removeLettersSaveInfo: function (aLettersToRemove) {

			var aLetters = this.getLettersSaveInfo();
			var aChangedLetters = [];
			var iIndex;
			var oLetter = {};
			var oFastAppDataModel = this.getFastAppDataModel();
			var sPathSelectedLetters = "/SelectedDeliverieProduct/Letters/results/";

			//loop over the Letters and check if they need to be removed from the database
			aLetters.forEach(function (oLetter, indexCurrentLetter) {

				iIndex = aLettersToRemove.findIndex(x => x.SNO === oLetter.SNO);

				if (iIndex !== -1) { //deze staan klaar om verwijderd te worden

					oLetter = aLetters[indexCurrentLetter];

					switch (oLetter._sOperation) {
					case "POST":
						//Letter is not yet existing in the back-end tables
						//this one will therefore no longer be pushed to achangeLetters (=just removed from front-end)
						break;
					case "PUT":
						//Letter exists already in the back-end tables
						oLetter._sOperation = "DELETE";
						aChangedLetters.push(oLetter);
						break;
					default:
						// code block
					}

				} else {
					aChangedLetters.push(oLetter);
				}

			});

			if (aChangedLetters) {

				this.setLettersSaveInfo(aChangedLetters);
				//path is updated with the Letters
				oFastAppDataModel.setProperty(sPathSelectedLetters, aChangedLetters);

				//we have to filter out the ones that are marked for deletion.
				//they should be saved to the database but no longer displayed in the binding of the table
				var aBindingToTable = [];
				aChangedLetters.forEach(function (oLetter, index) {
					let oBindingToTable = $.extend(true, {}, oLetter);
					if (oBindingToTable._sOperation !== "DELETE") {
						aBindingToTable.push(oBindingToTable);
					};
				});

				//path is updated with the products
				oFastAppDataModel.setProperty(sPathSelectedLetters, aBindingToTable);

			}

		},

		//CLEARING
		//--------

		//After saving... Deliveries should be cleared
		clearDeliveriesSaveInfo: function () {
			if (this._aDeliveriesSaveInfo) { //if it exists
				this._aDeliveriesSaveInfo = [];
			}
		},

		//After saving... Letters should be cleared
		clearLettersSaveInfo: function () {
			if (this._aLettersSaveInfo) { //if it exists
				this._aLettersSaveInfo = [];
			}
		},

		//clear everything for the Delivery Tracking page
		clearAllForDeliveryTrackingPage: function (bKeepSelectedOffer) {

			//clear all data that was ready to be saved
			this.clearDeliveriesSaveInfo();
			this.clearLettersSaveInfo();
			this._bEditMode = false;

		},

		//SAVERS
		//------

		//saving all information on the DeliveryTrackingTab
		saveDeliveryTrackingAll: function () {

			//lets work with callbacks:
			var oDeferred = $.Deferred();
			var that = this;

			//Results Return
			var oSaveResult = {
				saveDeliveries: false,
				saveDeliveryData: {},
				saveLetters: false,
				saveLetterData: ""
			}

			//saving deliveries
			$.when(that.saveDeliveries()).done(function (oDataDeliveries) {

				//succesfully saved the deliveries
				oSaveResult.saveDeliveries = true;
				oSaveResult.saveDeliveryData = oDataDeliveries;

				//saving letters
				$.when(that.saveLetters()).done(function (oDataLetters) {

					//succesfully saved the ProductOffer
					oSaveResult.saveLetters = true;
					oSaveResult.saveProductInfoData = oDataLetters;

					//update the status of the offer accordingly
					$.when(that.saveOfferStatus("Delivery Ongoing")).done(function (oSaveStatus) {
						//new offer status needs to be shown
						that.getDefaultModel().refresh(true);

						//Only oSaveResult is returned beceause we dont do anything with oSaveStatus
						oDeferred.resolve(oSaveResult);
					});

				});

			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//check new bank guarantee
		checkNewBankGuarantee: function(oBankGuarantee){
			let bValid = false;
			if(oBankGuarantee.Reference && 
				oBankGuarantee.Type && 
				oBankGuarantee.GuaranteedAmount != 0 && 
				oBankGuarantee.Currency && 
				oBankGuarantee.IssueDate &&
				(this.getSelectedCountry() !== 'ES' || 
					(this.getSelectedCountry() === 'ES' && 
					oBankGuarantee.BankRequestDate &&
					oBankGuarantee.BankName))){
					//oBankGuarantee.BankStatus &&
					//oBankGuarantee.ShippingDate
				//oBankGuarantee.ClosingDate
					 bValid = true;
			 }
 

			return bValid;
		},

		//save bank guarantee
		saveBankGuarantee: function(oBankGuaranteeSaveInfo){
			let oDeferred = $.Deferred();
			var that = this;

			let promises = [];

			//default closing date
			let oNewToDate = new Date("9999-12-31")
			oNewToDate.setHours(0,0,0,0);

			// Convert to UTC time
			const timeOffsetInMS = oNewToDate.getTimezoneOffset() * 60000;
			oNewToDate.setTime(oNewToDate.getTime() - timeOffsetInMS);
			oBankGuaranteeSaveInfo.ClosingDate = oNewToDate;

			switch(oBankGuaranteeSaveInfo._sOperation){
				case "POST":
					delete oBankGuaranteeSaveInfo._sOperation;
					promises.push(that.getService('BankGuarantee').createBankGuarantee(oBankGuaranteeSaveInfo).catch(function (oError) {
						that.showErrorMessage(oError, "Create Bank Guarantee");
						throw new Error(oError);
					}));
					break;
				case "PUT":
					delete oBankGuaranteeSaveInfo._sOperation;
					promises.push(that.getService('BankGuarantee').updateBankGuarantee(oBankGuaranteeSaveInfo).catch(function (oError) {
						that.showErrorMessage(oError, "Update Bank Guarantee");
						throw new Error(oError);
					}));
					break;
			}

			oBankGuaranteeSaveInfo = {};

		},

		//save bank guarantee
		savePriceAgreement: function(oPriceAgreementSaveInfo){
			let oDeferred = $.Deferred();
			var that = this;
			var oFastAppDataModel = this.getFastAppDataModel();

			let promises = [];

			switch(oPriceAgreementSaveInfo._sOperation){
				case "POST":
					delete oPriceAgreementSaveInfo._sOperation;
					promises.push(that.getService('PriceAgreement').createPriceAgreement(oPriceAgreementSaveInfo).then(function (response){
						//oFastAppDataModel.setProperty('/newPriceAgreement', oPriceAgreementSaveInfo);
						
						//show message view
						that.getOfferCompositeMessages().push({
							type: 'Success',
							title: 'Price Agreement has been created',
							description: 'Price Agreement has been created'
						});
						that.showMessageCompositeView("Success", that.getOfferCompositeMessages(), 'Success');
						that.getOfferCompositeMessages().splice(0, that.getOfferCompositeMessages().length);

						return response && response.data;
					})
					.catch(function (oError) {
						//that.showErrorMessage(oError, "Create Price Agreement");
						oPriceAgreementSaveInfo = {};

						//show message view
						that.getOfferCompositeMessages().push({
							type: 'Error',
							title: 'Error saving price agreement',
							description: 'Error saving price agreement'
						});
						that.showMessageCompositeView("Error", that.getOfferCompositeMessages(), 'Error');
						that.getOfferCompositeMessages().splice(0, that.getOfferCompositeMessages().length);
						throw new Error(oError);
					}));
					break;
				case "PUT":
					delete oPriceAgreementSaveInfo._sOperation;
					promises.push(that.getService('PriceAgreement').createPriceAgreement(oPriceAgreementSaveInfo).then(function (response){
						//oFastAppDataModel.setProperty('/newPriceAgreement', oPriceAgreementSaveInfo);

						//show message view
						that.getOfferCompositeMessages().push({
							type: 'Success',
							title: 'Price Agreement has been created',
							description: 'Price Agreement has been created'
						});
						that.showMessageCompositeView("Success", that.getOfferCompositeMessages(), 'Success');
						that.getOfferCompositeMessages().splice(0, that.getOfferCompositeMessages().length);

						return response && response.data;
					})
					.catch(function (oError) {
						//that.showErrorMessage(oError, "Update Price Agreement");
						oPriceAgreementSaveInfo = {};

						//show message view
						that.getOfferCompositeMessages().push({
							type: 'Error',
							title: 'Error saving price agreement',
							description: 'Error saving price agreement'
						});
						that.showMessageCompositeView("Error", that.getOfferCompositeMessages(), 'Error');
						that.getOfferCompositeMessages().splice(0, that.getOfferCompositeMessages().length);
						throw new Error(oError);
					}));
					break;
			}

			// oPriceAgreementSaveInfo = {};
			return Promise.all(promises);

		},

		savePriceAgreementWithoutMessages: function(oPriceAgreementSaveInfo){
			var that = this;

			let promises = [];

			switch(oPriceAgreementSaveInfo._sOperation){
				case "POST":
					delete oPriceAgreementSaveInfo._sOperation;
					promises.push(that.getService('PriceAgreement').createPriceAgreement(oPriceAgreementSaveInfo).then(function (response){
						return response && response.data;
					})
					.catch(function (oError) {
						throw new Error(oError);
					}));
					break;
				case "PUT":
					delete oPriceAgreementSaveInfo._sOperation;
					promises.push(that.getService('PriceAgreement').createPriceAgreement(oPriceAgreementSaveInfo).then(function (response){
						return response && response.data;
					})
					.catch(function (oError) {
						throw new Error(oError);
					}));
					break;
			}

			// oPriceAgreementSaveInfo = {};
			return Promise.all(promises);

		},

		//save the deliveries
		saveDeliveries: function () {

			//lets work with callbacks:
			var oDeferred = $.Deferred();

			//Path to be writing to
			var sPath = "/PT_TMDLVTR";
			var that = this;
			var bError = false;

			//catch all promises in an array
			let promises = [];

			var oModel = that.getDefaultModel(); //new sap.ui.model.odata.ODataModel(this._connectionString);

			//get the array of products that need to be saved
			var aDeliveriesSaveInfo = this.getFastAppDataModel().getProperty('/SelectedDeliverieProduct/Deliveries/results/');

			//Put into batch operations
			var aChangeOperations = [];

			//counting the numbers of products to be saved. Starting from 0
			aDeliveriesSaveInfo.forEach(function (oDeliverySaveInfo) {

				//Operation POST, PUT, DELETE (empty if already existing in database)
				if (oDeliverySaveInfo._sOperation !== "") {

					//pas structuur aan aan de save....
					var oDeliveryToSave = that.getService('Delivery').getConvertDeliveryToSave(oDeliverySaveInfo);

					//is it updating an existing product (PUT) or Creating an new product (POST) or Deleting an existing product (DELETE)
					var sOperation = oDeliverySaveInfo._sOperation;

					//sPath should be different for update or create
					switch (sOperation) {
					case "POST":
						promises.push(that.getService('Delivery').createDelivery(oDeliveryToSave).catch(function (oError) {
							that.showErrorMessage(oError, "Create Delivery item");
							throw new Error(oError);
						}));
						//sPath = "/PT_TMDLVTR";
						break;
					case "PUT":
						promises.push(that.getService('Delivery').updateDelivery(oDeliveryToSave).catch(function (oError) {
							that.showErrorMessage(oError, "Update Delivery item");
							throw new Error(oError);
						}));
						break;
					case "DELETE":
						promises.push(that.getService('Delivery').removeDelivery(oDeliveryToSave).catch(function (oError) {
							that.showErrorMessage(oError, "Remove Delivery item");
							throw new Error(oError);
						}));
						break;
					default:

					}

					//aChangeOperations.push(oModel.createBatchOperation(sPath, sOperation, oDeliveryToSave, null));

				}
			});

			//als er geen producten zijn om te bewaren
			if (!aChangeOperations || aChangeOperations.length === 0) {

				var bNothingToSave = true;

				//let the callback be triggered
				oDeferred.resolve(bNothingToSave);

			} else {

				//actual saving of the products
				//oModel.addBatchChangeOperations(aChangeOperations);

				Promise.all(promises).then((result) => {

					that.clearDeliveriesSaveInfo();

					sap.m.MessageBox.success("Deliveries Successfully Changed..", {});

					//let the callback be triggered
					oDeferred.resolve(true);

				}).catch(function (oError) {

					//error message
					that.showErrorMessage(oError, "Saving of deliveries");

					//let the callback be triggered
					oDeferred.reject(oError);
				});
				/*oModel.submitBatch(function (oData, oResponse, oError) {
					if (oError.length > 0) {

						//error message
						that.showErrorMessage(oError, "Saving of deliveries");

						//let the callback be triggered
						oDeferred.reject(oError);

					} else {
						//succesfull saving

						//Offer succesfully saved, so it can be cleared
						that.clearDeliveriesSaveInfo();

						sap.m.MessageBox.success("Deliveries Successfully Changed..", {});

						//let the callback be triggered
						oDeferred.resolve(oData);

					}
				});*/
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},

		//save the letters
		saveLetters: function () {

			//lets work with callbacks:
			var oDeferred = $.Deferred();

			//Path to be writing to
			var sPath = "/PT_TMUDLTRS";
			var that = this;

			//catch all promises in an array
			let promises = [];

			var oModel = that.getDefaultModel(); //new sap.ui.model.odata.ODataModel(this._connectionString);

			//get the array of products that need to be saved
			var aLettersSaveInfo = this.getLettersSaveInfo();

			//get the array of products that need to be saved
			var aLettersSaveInfo = this.getFastAppDataModel().getProperty('/SelectedDeliverieProduct/Letters/results/');

			//Put into batch operations
			var aChangeOperations = [];

			//counting the numbers of products to be saved. Starting from 0
			aLettersSaveInfo.forEach(function (oLetterSaveInfo) {

				//Operation POST, PUT, DELETE (empty if already existing in database)
				if (oLetterSaveInfo._sOperation !== "") {

					//pas structuur aan aan de save....
					var oLetterToSave = that.getService('Letter').getConvertLetterToSave(oLetterSaveInfo);

					//is it updating an existing product (PUT) or Creating an new product (POST) or Deleting an existing product (DELETE)
					var sOperation = oLetterSaveInfo._sOperation;

					//sPath should be different for update or create
					switch (sOperation) {
					case "POST":
						promises.push(that.getService('Letter').createLetter(oLetterToSave).catch(function (oError) {
							that.showErrorMessage(oError, "Create Letter item");
							throw new Error(oError);
						}));
						break;
					case "PUT":
						promises.push(that.getService('Letter').updateLetter(oLetterToSave).catch(function (oError) {
							that.showErrorMessage(oError, "Update Letter item");
							throw new Error(oError);
						}));
						break;
					case "DELETE":
						promises.push(that.getService('Letter').removeLetter(oLetterToSave).catch(function (oError) {
							that.showErrorMessage(oError, "Update Letter item");
							throw new Error(oError);
						}));
						break;
					default:

					}

					//aChangeOperations.push(oModel.createBatchOperation(sPath, sOperation, oLetterToSave, null));

				}
			});

			//als er geen producten zijn om te bewaren
			if (!aChangeOperations || aChangeOperations.length === 0) {

				var bNothingToSave = true;

				//let the callback be triggered
				oDeferred.resolve(bNothingToSave);

			} else {

				Promise.all(promises).then((result) => {

					that.clearLettersSaveInfo();

					sap.m.MessageBox.success("Letters Successfully Changed..", {});

					//let the callback be triggered
					oDeferred.resolve(true);

				}).catch(function (oError) {

					//error message
					that.showErrorMessage(oError, "Saving letters");

					//let the callback be triggered
					oDeferred.reject(oError);
				});

				/*//actual saving of the products
				oModel.addBatchChangeOperations(aChangeOperations);

				oModel.submitBatch(function (oData, oResponse, oError) {
					if (oError.length > 0) {
						//error message
						that.showErrorMessage(oError, "Saving letters");

						//let the callback be triggered
						oDeferred.reject(oError);

					} else {
						//succesfull saving

						//Offer succesfully saved, so it can be cleared
						that.clearLettersSaveInfo();

						sap.m.MessageBox.success("Letters Successfully Changed..", {});

						//let the callback be triggered
						oDeferred.resolve(oData);

					}
				});*/
			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		},

		//APPROVALS
		//---------

		//DECLARATIONS
		//------------
		_bCancelApprovalsPressed: false,
		_bSendApprovalsPressed: false,

		//GETTERS
		//-------

		//Cancel button is pressed
		getCancelApprovalsPressed: function () {
			return this._bCancelApprovalsPressed;
		},

		//Send button is pressed
		getSendApprovalsPressed: function () {
			return this._bSendApprovalsPressed;
		},

		//get information to save the status of an offer in the corresponding table PT_TMNOFST
		getApprovalsSaveInfo: function (sApprovalStatus) {

			var that = this;
			var oFastAppDataModel = this.getFastAppDataModel();
			var aApprovalsSelectedOffer = oFastAppDataModel.getProperty("/ApprovalsSelectedOffer");

			var oApprovalSaveInfo = {};
			var aApprovalsSaveInfo = []; //we save as a batch, because there are multiple products in 1 offer
			//var sStatusTime = moment().utc().format('DD-MM-YYYY HH:mm:ss'); //status time must be in UCT format to not have a mismatch between timezones
			var sStatusTime = moment().utc().toDate(); // moment().utc().format('YYYY-MM-DD HH:mm:ss');
			var sSubmittedBy = UserInfo.getCWID();
			//get products for selected offer
			var aProducts = that.getLoadedProductsForOffer(that.getSelectedOfferID());

			aApprovalsSelectedOffer.forEach(function (oApprovalsSelectedOffer) {

				//check if approval is put to send
				if (
					//In sending process, changes are only applied to records with send = yes
					(that.getSendApprovalsPressed() && oApprovalsSelectedOffer.send === "Yes") ||

					//In cancel process, we can only cancel if existing status is not "not sent", meaning we want to cancel the sending
					(that.getCancelApprovalsPressed() && oApprovalsSelectedOffer.ApprovalStatus !== "Not Sent")
				) {

					//if yes, we should save for each product a line in the approval status table
					aProducts.results.forEach(function (oProduct) {

						//ActiveProduct = 2 (excluded product)
						if (oProduct.ActiveProduct !== 2) {

							//be sure to work with a new object
							oApprovalSaveInfo = {};

							//get information for saving
							oApprovalSaveInfo.TenderID = oApprovalsSelectedOffer.TenderID;
							oApprovalSaveInfo.OfferId = oApprovalsSelectedOffer.OfferId;
							oApprovalSaveInfo.CountryCode = oApprovalsSelectedOffer.CountryCode;
							oApprovalSaveInfo.productcode = oProduct.ProductCode;
							oApprovalSaveInfo.ApprovalContent = oApprovalsSelectedOffer.ApprovalContent;
							oApprovalSaveInfo.ApproverTypeSection = oApprovalsSelectedOffer.ApproverTypeSection;
							oApprovalSaveInfo.ApprovalStatus = sApprovalStatus; //oApprovalsSelectedOffer.ApprovalStatus;
							//check in approvals list what the correct approverName is
							oApprovalsSelectedOffer.ApproverList.results.forEach(function (oApprovalList) {
								if (oApprovalList.ApproverEmailID === oApprovalsSelectedOffer.ApproverEmailID) {
									oApprovalSaveInfo.ApproverName = oApprovalList.ApproverName;
								}
							});
							oApprovalSaveInfo.ApproverEmailID = oApprovalsSelectedOffer.ApproverEmailID;
							oApprovalSaveInfo.SenderComment = oApprovalsSelectedOffer.SenderComment;
							oApprovalSaveInfo.ApproverComment = ""; //oApprovalsSelectedOffer.ApproverComment; approvercomment is only set from backend process
							oApprovalSaveInfo.Active = oApprovalsSelectedOffer.Active;
							oApprovalSaveInfo.Hierarchy = oApprovalsSelectedOffer.ApproverTypes.results[0].Hierarchy;
							oApprovalSaveInfo.AP_ID = oApprovalsSelectedOffer.AP_ID;
							oApprovalSaveInfo.RestoreKey = oApprovalsSelectedOffer.RestoreKey;
							oApprovalSaveInfo.Statustime = sStatusTime; //"17-09-2019 18:59"
							oApprovalSaveInfo.Submittedby = sSubmittedBy;
							oApprovalSaveInfo.ApproverDate = oApprovalsSelectedOffer.ApproverDate;
							oApprovalSaveInfo.ApproverType = oApprovalsSelectedOffer.ApproverType;
							oApprovalSaveInfo.FLOW_ID = oApprovalsSelectedOffer.FLOW_ID;
							oApprovalSaveInfo.REQUIRED_ACTION = oApprovalsSelectedOffer.REQUIRED_ACTION;
							oApprovalSaveInfo.LotID = oProduct.LotID;
							aApprovalsSaveInfo.push(oApprovalSaveInfo);

						}

					});

				}

			});

			return aApprovalsSaveInfo;

		},

		//SETTERS
		//-------
		//Cancel button is pressed
		setCancelApprovalsPressed: function (bBoolean) {
			this._bCancelApprovalsPressed = bBoolean;
			this._bSendApprovalsPressed = false;
		},

		//Send button is pressed
		setSendApprovalsPressed: function (bBoolean) {
			this._bSendApprovalsPressed = bBoolean;
			this._bCancelApprovalsPressed = false;
		},

		//CLEARING
		//--------
		//clear approval buttons pressed 
		clearApprovalButtonsPressed: function () {
			this._bCancelApprovalsPressed = false;
			this._bSendApprovalsPressed = false;
		},

		//LOADERS
		//-------

		//SAVERS
		//------
		//saving approvals (cancel or send will have different statusses)
		saveApprovals: function (sApprovalStatus, sOfferStatus) {

			//lets work with callbacks: this way we only save products if OFFER is created
			var oDeferred = $.Deferred();
			let promises = [];

			//that is this
			var that = this;

			//get model for calls
			var oModel = this.getDefaultModel();

			//get save info for offer status to be saved
			var aApprovalsSaveInfo = this.getApprovalsSaveInfo(sApprovalStatus);

			//save every
			aApprovalsSaveInfo.forEach(function (oApprovalSaveInfo) {

				//convert data for save
				var oApprovalToSave = that.getService('Approval').getConvertApprovalToSave(oApprovalSaveInfo);

				//create approval
				promises.push(that.getService('Approval').createApproval(oApprovalToSave));

			});

			//check if there is an approval that could be send
			if (!promises.length || promises.length === 0) {

				if (that.getSendApprovalsPressed()) {
					sap.m.MessageBox.warning("Nothing to send. Please select approvals to send.", {});
				}

				if (that.getCancelApprovalsPressed()) {
					sap.m.MessageBox.warning("Nothing to cancel. Please select approvals to send.", {});
				}

				oDeferred.reject();

			} else {

				Promise.all(promises).then((result) => {

					if (that.getSendApprovalsPressed()) {
						sap.m.MessageBox.success("Approvals succesfully sent for processing..", {});
					}

					if (that.getCancelApprovalsPressed()) {
						sap.m.MessageBox.success("Approvals succesfully sent for cancelling..", {});
					}

					//save offer status
					$.when(that.saveOfferStatus(sOfferStatus)).done(function (oSaveStatus) {

						//let the callback be triggered
						oDeferred.resolve(result);

						//close dialog
						var oHandleApprovalDialog = sap.ui.getCore().byId("handleApprovalDialog");
						if (oHandleApprovalDialog) {
							sap.ui.getCore().byId("handleApprovalDialog").close();
						}

					});

				}).catch(function (oError) {

					//Error during save
					that.showErrorMessage(oError, "Saving approvals");

					//set send dropbox back to NO

					//let the callback be triggered
					oDeferred.reject(oError);

				});

			}

			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},

		//get word templates
		getWordTemplates: function (countryCode) {
			return this.getService('Quotation').getWordTemplates(countryCode).then(function(response){
				this.getFastAppDataModel().setProperty("/WordTemplates", response.data.results);
				return response.data.results;
			}.bind(this));
		},
		// HELPERS
		/*sendMail: function(sRecipient, sSubject, sTemplate){
			
			//Load product data
			var sActionPath = "/sendMail";
			var oFastDataCalls = this.getDefaultModel();

			var oDeferred = $.Deferred();
			var that = this;

			var oData = {};
			oData.recipient = sRecipient;
			oData.subject = sSubject;
			oData.template = sTemplate;

			//get fast data calls
			var oFastDataCalls = that.getDefaultModel();

			oFastDataCalls.create(sActionPath, oData, {			
				success: function (oData, oResponse) {
					//let the callback be triggered
					oDeferred.resolve(oData);
				},
				error: function fnError(oError) {
					//resolve, beceause we check on false to continue in correct way, if no results found
					oDeferred.resolve(false);
				}
			});

			//return promise so the function can check if execution is done
			return oDeferred.promise();

		}*/

		// for italy, get products

		getInstituteDistributorBrandProductsForItaly: function (sInstitute) {

			var oCountryCodeFilter = new Filter({
				path: 'COUNTRY_CODE',
				operator: FilterOperator.EQ,
				value1: 'IT'
			});


			var oInstituteFilter = new Filter({
				path: 'INSTITUTE_ID',
				operator: FilterOperator.EQ,
				value1: sInstitute
			});


			var oDistributorFilter = new Filter({
				path: 'DISTRIBUTOR_ID',
				operator: FilterOperator.EQ,
				value1: this.getSelectedDistributorID()
			});

			var oChannelFilter = new Filter({
				path: 'CHANNEL',
				operator: FilterOperator.EQ,
				value1: "Direct"
			});


			

			var mParameters = {
				filters: [oCountryCodeFilter, oInstituteFilter, oDistributorFilter, oChannelFilter]
			};

			return this.odata("/InstituteDistributorBrandProduct").get(mParameters);
		},

        getInstituteDistributorBrandProductsForSpain: function (sInstitute) {

			var oCountryCodeFilter = new Filter({
				path: 'COUNTRY_CODE',
				operator: FilterOperator.EQ,
				value1: 'ES'
			});


			var oInstituteFilter = new Filter({
				path: 'INSTITUTE_ID',
				operator: FilterOperator.EQ,
				value1: sInstitute
			});


			var oDistributorFilter = new Filter({
				path: 'DISTRIBUTOR_ID',
				operator: FilterOperator.EQ,
				value1: this.getFastAppDataModel().oData.EditOffer.DistributorID
			});

			var oChannelFilter = new Filter({
				path: 'CHANNEL',
				operator: FilterOperator.EQ,
				value1: "Direct"
			});

            var oDivisionFilter = new Filter({
				path: 'DIVISION',
				operator: FilterOperator.EQ,
				value1: this.getFastAppDataModel().oData.EditOffer.Division
			});

			var mParameters = {
				filters: [oCountryCodeFilter, oInstituteFilter, oDistributorFilter, oChannelFilter, oDivisionFilter]
			};

			return this.odata("/InstituteDistributorBrandProduct").get(mParameters);
		},

		initializeConsolidatedProfitability: function(){

			const table = [
                {
                    ProductType: "Contrast Agents",
                    GrossMargin: 0,
                    NetSales: 0,
                    COGS: 0,
                    Profitability: 0
                },
                {
                    ProductType: "Consumables",
                    GrossMargin: 0,
                    NetSales: 0,
                    COGS: 0,
                    Profitability: 0
                },
                {
                    ProductType: "Injectors",
                    GrossMargin: 0,
                    NetSales: 0,
                    COGS: 0,
                    Profitability: 0
                },
                {
                    ProductType: "Other",
                    GrossMargin: 0,
                    NetSales: 0,
                    COGS: 0,
                    Profitability: 0
                },
                {
                    ProductType: "Total",
                    GrossMargin: 0,
                    NetSales: 0,
                    COGS: 0,
                    Profitability: 0
                },
            ];


			this.getFastAppDataModel().setProperty("/SelectedOffer/ConsolidatedProfitability", table);

		},

	});

	return new Service();

});