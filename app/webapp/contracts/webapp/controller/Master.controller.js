sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../model/formatter",
	"../model/datatypes/OfferPrice",
	"sap/ui/model/FilterType",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter, OfferPrice, FilterType, MessageToast) {
	"use strict";

	return BaseController.extend("com.bayer.tender.contracts.controller.Master", {

		formatter: formatter,

		customTypes: {
			OfferPrice
		},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit : function () {
			
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel();
				this._oList = oList;
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				//iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			/*this._oGroupFunctions = {
				stock : function(oContext) {
					var iNumber = oContext.getProperty('stock'),
						key, text;
					if (iNumber <= 20) {
						key = "LE20";
						text = this.getResourceBundle().getText("masterGroup1Header1");
					} else {
						key = "GT20";
						text = this.getResourceBundle().getText("masterGroup1Header2");
					}
					return {
						key: key,
						text: text
					};
				}.bind(this)
			};

			
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter : [],
				aSearch : []
			};*/

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			/*oList.attachEventOnce("updateFinished", function(){
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});*/

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.ctrState = this.getOwnerComponent().getState(this.getOwnerComponent().CTR);
			this.setModel(this.ctrState.getModel(), "ctr");

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);

			
			this.setFilter();
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch : function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("Contract", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh : function () {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenViewSettings : function (oEvent) {
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "com.bayer.tender.contracts.view.ViewSettingsDialog",
					controller: this
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog : function (oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aCaptions = [];

			// update filter state:
			// combine the filter array and the filter string
			aFilterItems.forEach(function (oItem) {
				switch (oItem.getKey()) {
					case "Filter1" :
						aFilters.push(new Filter("stock", FilterOperator.LE, 100));
						break;
					case "Filter2" :
						aFilters.push(new Filter("stock", FilterOperator.GT, 100));
						break;
					default :
						break;
				}
				aCaptions.push(oItem.getText());
			});

			this._oListFilterState.aFilter = aFilters;
			this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			this._applySortGroup(oEvent);
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			// apply sorter to binding
			// (grouping comes before sorting)
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				var vGroup = this._oGroupFunctions[sPath];
				aSorters.push(new Sorter(sPath, bDescending, vGroup));
			}
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange : function (oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed : function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader : function (oGroup) {
			return new GroupHeaderListItem({
				title : oGroup.text,
				upperCase : false
			});
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack : function() {
			// eslint-disable-next-line
			history.go(-1);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */


		_createViewModel : function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Contract",
				groupBy: "None"
			});
		},

		_onMasterMatched :  function() {
			//Set the layout property of the FCL control to 'OneColumn'
			this.getModel("appView").setProperty("/layout", "OneColumn");
			
			this.getCountries().then(() => {
				this.getContracts(false);
				this.ctrState.getPenaltyReasons();
						
				//this.getInstitutes(this.ctrState.getNewContract().countryCode);
				//this.getDistributors(this.ctrState.getNewContract().countryCode);
				this.getChannels();
				this.setFilter();
			})
			.catch((error) => { });
		},

		onAddNewContract: function (oEvent){

			this.ctrState.setTemporaryContract();
			this._getCreateContractDialog().open();

		},
		
		/**
		 * New contracting dialog
		 */
		_getCreateContractDialog : function () {
			
			//create new dialog if not yet existing
			if (!this._oAddNewContractDialog) {

					//get dialog
					this._oAddNewContractDialog = sap.ui.xmlfragment("com.bayer.tender.contracts.view.fragments.NewContract", this);
				  	this.getView().addDependent(this._oAddNewContractDialog);
					
			}

			//default the country to the filter country
			var oCountryNewContract = sap.ui.getCore().byId("idCountryNewContract");
			if(oCountryNewContract){
				oCountryNewContract.setSelectedKey(this.byId("idSlctCountry").getSelectedKey());
				this.onChangeCountry(); 
			}

			return this._oAddNewContractDialog;

		},

		/**
		 * Save new contract
		 * @param {} oEvent 
		 */
		onSaveNewContract: function(oEvent){
			var oContract = this.ctrState.getNewContract();
			var sContractID = oContract.contractNumber;
			var oRouter = this.getRouter();

			const bValid = this._validateNewContract(oContract);
			if(bValid){
				this.ctrState.createContract(oContract).then((values) => {
					
					//get contracts with hard refresh
					this.getContracts(true).then(() => {
						this._showDetail(undefined, sContractID);
						this.getView().setBusy(false);
						var msg = 'Contract is created.';
						MessageToast.show(msg);
					}); 
					
				});

				// Filter the master page based on the newly created country code
				this.byId("idSlctCountry").setSelectedKey(oContract.countryCode);
				this.setFilter();

				this._getCreateContractDialog().close();
			}else{
				sap.m.MessageBox.error("Please enter all the mandatory fields.");
			}
		},

		/**
		 * Check fields for contract
		 * @param {*} contract 
		 */
		_validateNewContract: function(contract){
			//Check for mandatory fields
			if (!contract.contractNumber ||
				!contract.countryCode ||
				!contract.currency ||
				!contract.instituteId ||
				!contract.distributorId ||
				!contract.sellingCompanyCode ||
				!contract.contractDate ||
				!contract.contractValidUntil
			){
				return false;

			} else {
				return true;
			}
		},

		/**
		 * Cancel contract creation
		 * @param {} oEvent 
		 */
		onCancelNewContract: function(oEvent){
			this._getCreateContractDialog().close();
		},

		onChangeCountry: function(oEvent){
			//Different distributors for different countries
			this.getDistributors(this.ctrState.getNewContract().countryCode);
			this.getSellingCompanies(this.ctrState.getNewContract().countryCode);
			this.getCountryCurrencies(this.ctrState.getNewContract().countryCode);
			this.getInstitutes(this.ctrState.getNewContract().countryCode);
			this.getChannels();
		},

		/**
		 * Get list of institutes 
		 */
		getInstitutes: function(sCountryCode){
			this.getView().setBusy(true);
			this.ctrState.getInstitutes(sCountryCode)
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
		 * Get list of countries 
		 */
		getCountries: function(){
			this.getView().setBusy(true);

			return this.ctrState.getCountries()
			.then(() => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				this.getView().setBusy(true);
				this.showNoAccessMessage("User ID doesn't have access");
				throw(error);
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
		 * Get list of selling companies
		 * @param {*} sObjectPath 
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

		getContracts: function(bHardRefresh){
			this.getView().setBusy(true);
			return this.ctrState.getContracts(bHardRefresh)
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
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail : function (oItem, sContractID) {
			var bReplace = !Device.system.phone;
			var oRouter = this.getRouter();
			var oCtrState = this.ctrState;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

			//if you pass an selected item
			if(oItem){
				if(oCtrState.getProperty("editMode")){
					var that = this;
	
					sap.m.MessageBox.warning("Are you sure you want to discard your changes?", {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						styleClass: "sapUiSizeCompact",
						onClose: function (sAction) {
							if (sAction === "YES") {
								oCtrState.setEditMode(false);
								oCtrState.getDetailPage().setShowFooter(false);
								oCtrState.setEditModeContract(false);
								oCtrState.setEditModeDelivery(false);
								//oCtrState.setSelectedProduct();
								oRouter.navTo("object", {
									objectId : oItem.getBindingContext("ctr").getProperty("contractNumber"),
									section : oCtrState.getContractSectionId(),
									productId: '',
								}, bReplace);
							} else {
								//Do nothing and close the popup
							}
						}
					});
				} else {
					oRouter.navTo("object", {
						objectId : oItem.getBindingContext("ctr").getProperty("contractNumber"),
						section : oCtrState.getContractSectionId(),
						productId : ''
					}, bReplace);
				}
			}

			//if you pass the id of the contract you want to navigate to
			if(sContractID){
				oRouter.navTo("object", {
					objectId : sContractID,
					section : oCtrState.getContractSectionId(),
					productId : ''
				}, bReplace);				
			}


			
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount : function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch : function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method that validates the contract number
		 * @param {*} oEvent 
		 * @private
		 */

		_onValidateContractNo : function (oEvent) {
			const oInputContractNumber = oEvent.oSource;
			if(this.ctrState.getContractByNumber(oEvent.getParameter("value"))){
				oInputContractNumber.setValueState("Warning");
				oInputContractNumber.setValueStateText("This contract number is already being used.");
			} else {
				oInputContractNumber.setValueState("None");
				oInputContractNumber.setValueStateText();
			}
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar : function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		setFilter: function (oSelection) {

			//var oFastAppData = Services.getFastAppDataModel();

			//get possible filters
			var oCountry = this.byId("idSlctCountry").getSelectedItem() ? this.byId("idSlctCountry").getSelectedItem().getKey() : "TH";
			//var oChannel = this.byId("idSlctChannel").getSelectedItem() ? this.byId("idSlctChannel").getSelectedItem().getKey() : "All";
			let oChannel = 'OTC';
			var sSearch = this.byId("idSearch").getProperty("value");

			//Add filters if they are set (so not the default, all...)
			var orFilters = [];
			var andFilters = [
				new sap.ui.model.Filter("countryCode", "EQ", oCountry),
				new sap.ui.model.Filter("enabled", "EQ", true)
			];

			if (oChannel !== "All"){
				andFilters.push(new sap.ui.model.Filter("channel", FilterOperator.EQ, oChannel));
			}
			
			//oSelection is empty when you are navigating back to the tender list after selecting a tender
			var sIdSource = "";
			if (oSelection) {
				sIdSource = oSelection.getSource().getId();
			}

			if (sSearch.length > 0) {

				orFilters.push(new Filter({
					path: "channel",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "countryCode",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "contractNumber",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "institute/instituteName",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "distributor/distributorName",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "offerValue",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				/*orFilters.push(new Filter({
					path: "contractDate",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));*/

				andFilters.push(new sap.ui.model.Filter(orFilters, false));
			}
			var oFilters = new sap.ui.model.Filter(andFilters, true);

			//Binding to table with the filters and the sorters
			this.getView().byId("list").getBinding("items").filter(oFilters, FilterType.Application);

		},

		onOpenViewSettings: async function(oEvent){ 

			const oDialog = await this._getViewSettingsDialog();
			oDialog.open();

		},

		_getViewSettingsDialog : function () { 

			if (!this._oViewSettingsDialog) {
				  
				return Fragment.load({
					id: this.getView().getId(),
					name: "com.bayer.tender.contracts.view.fragments.ViewSettingsDialog",
					controller: this
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());

					return this._oViewSettingsDialog = oDialog;
				}.bind(this));

			}else {
				return this._oViewSettingsDialog;
			}
		 },

		 /**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog : function (oEvent) {
			this._applySort(oEvent);
		},

		/**
		 * Apply the chosen sorter 
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySort: function (oEvent) {

			let mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));

			const oTable = this.byId("list");
			oTable.getBinding("items").sort(aSorters);
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

		//show no access message
		showNoAccessMessage: function (sProcessText) {

			//generic message
			var sMessage = sProcessText + ". \n Please contact application administrator."; //default

			//get message details
			//var sMessageDetails = this.getMessageDetails(oError);

			//show message
			sap.m.MessageBox.error(sMessage, {
				title: "User has no access yet.",
				id: "msgErrorAccess",
			//	details: sMessageDetails,
				styleClass: "sapUiSizeCompact",
				contentWidth: "100px",
				actions: ["Request access"],
				onClose: function () {

					//email content
					var sCloudUser = UserInfo.getUserName();
					var sEmail = "jonathan.hubeau.ext@bayer.com";
					var sEmailCC = "felipe.maul@bayer.com";
					var sSubject = "Access to Fast Tender management: " + sCloudUser;
					var sBody = "Can you please grant me access? My SAP cloud platform user is " + sCloudUser + ".";

					//trigger default email
					sap.m.URLHelper.triggerEmail(sEmail, sSubject, sBody, sEmailCC);

					window.location.reload(true);
				}
			});

		},
	});

});