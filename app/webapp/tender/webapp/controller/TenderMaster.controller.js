jQuery.sap.require("FAST_NS0FAST0.utils.Formatter");

sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/MessageBox",
	"../model/formatter",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/utils/Formatter"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, formatter, Services, UserInfo, Formatter, MomentJS) {
	"use strict";

	return Controller.extend("FAST_NS0FAST0.controller.TenderMaster", {

		//GENERAL METHODS
		//---------------
		onInit: function () {

			//that
			var that = this;

			// instantiate loading dialog
			if (!that._LoadingDialogMaster) {
				that._LoadingDialogMaster = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
			}

			// open loading dialog
			that._LoadingDialogMaster.open();

			//get table with tenders
			that.oProductsTable = that.oView.byId("tendersMasterTable");
			Services.setTendersMasterTable(that.oProductsTable);

			//load the external ID of the USER
			$.when(Services.loadUserInfo()).done(function () {

				//bind countries to wich the user has acces	
				that._bindUserCountries();

				//get view: TenderMaster.view.xml
				that.oView = that.getView();
				that._bDescendingSort = false;

				//attach routing
				that.oRouter = that.getOwnerComponent().getRouter();
				that.oRouter.getRoute("master").attachPatternMatched(that._onTenderMatched, that);

				that.oProductsTable.attachBrowserEvent("tab keyup", function (oEvent) {
					that._bKeyboard = oEvent.type == "keyup";
				}, that);
				Services.getFastAppDataModel().setSizeLimit(6000);
				//set default filtering
				that.setFilter();

				//set default sorting
				that.setSortColList();

				//set default we are in display modus
				Services.setEditMode(false);

				that.oProductsTable.attachUpdateFinished(oEvent => {
					if (Services.getFastAppDataModel().getProperty("/LayoutType") !== "TwoColumnsMidExpanded") {
						that._filterProductsTable(oEvent);
					}
				});

				// close loading dialog
				if (that._LoadingDialogMaster) {
					that._LoadingDialogMaster.close();
				}

			});

		},

		/**
		 * OData V2 does not support operators "Any" and "All". 
		 * Because of this we can not filter a collection of entities on the server side.
		 * This is a client side filter.
		 */
		_filterProductsTable: function (oEvent) {

			this._sSelectedBrandId = this.byId("idSlctBrand").getSelectedItem() ? this.byId("idSlctBrand").getSelectedItem().getKey() :
				"All_Brands";

			if (this._sSelectedBrandId == "All_Brands") {
				return;
			}

			// get all table items
			var oTable = oEvent.getSource();
			oTable.setBusyIndicatorDelay(0);
			oTable.setBusy(true);
			var aItems = oTable.getItems();

			// destroy table items
			oTable.removeAllItems();
			oTable.refreshItems();

			// filter based on oBrand
			aItems.map(item => {
				var sPath = item.getBindingContextPath();
				var oCtx = item.getBindingContext("fastData");
				var obj = oCtx.getObject(sPath);
				var aBrands = obj.BRAND.__list;
				//Services.getTenderProducts(obj.TENDER_ID).then((async aProducts => {;

				//if (aProducts.data.results.length > 0 && this._bContainsSelectedBrand(aBrands)) {
				if (this._bContainsSelectedBrand(aBrands, obj.OFFER_ID)) {
					// add the item back to the table
					this.oProductsTable.addItem(item);
				}
				//}));
			});

			oTable.setBusy(false);
		},

		/**
		 * This method checks whether Offer contains the selected brand
		 * @param a list of brands
		 * @return boolean
		 */
		_bContainsSelectedBrand: function (aBrands, sOfferId) {
			let sSelectedBrand = this._sSelectedBrandId;
			let bBrandFound = false;

			var bContainsBrand = aBrands.find(brand => {
				bBrandFound = brand.lastIndexOf(sSelectedBrand) !== -1 && brand.lastIndexOf(sOfferId) !== -1 ? true : bBrandFound;
				return bBrandFound;
			});

			return bContainsBrand;
		},

		//bind countries to wich the user has acces
		_bindUserCountries: function () {

			//get countries to wich user has access
			var aUserCountries = UserInfo.getUserCountries();

			//get fast app data model
			var oFastAppDataModel = Services.getFastAppDataModel();
			oFastAppDataModel.setProperty("/UserCountries/", aUserCountries);
			this.oView.setModel(oFastAppDataModel, "fastAppData");

		},
		//EHQUT-199068-Italy – Tender search by Region
		loadInstituteName: function (sCountry) {
			var oDeferred = $.Deferred();
			var oFastDataCalls = Services.getDefaultModel();
			var oFastAppDataModel = Services.getFastAppDataModel();
			var Regiontype = this.byId("idfltInstituteType").getSelectedItem() ? this.byId("idfltInstituteType").getSelectedItem().getText() : "";
			//EHQUT-217122-Spain - Tender search by Region
			var that = this;
				//EHQUT-217122-Spain - Tender search by Region
			if (that._country === 'IT' || that._country === 'ES') {
				if (Regiontype === "") {
					this.byId("idfltInstituteName").setVisible(false);
					this.setFilter();
				} else {
					this.byId("idfltInstituteName").setVisible(true);
				}
			}
			var sCountryChannelsPath = "/PT_TMINST";
			const instituteType = this.byId("idfltInstituteType").getProperty("selectedKey");
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("CountryCode", sap.ui.model.FilterOperator.EQ, that._country),
				new sap.ui.model.Filter("InstituteType", sap.ui.model.FilterOperator.EQ, instituteType)
			);



			oFastDataCalls.read(sCountryChannelsPath, {
				filters: aFilters,
				success: function (oData, oResponse) {
					var aCountryChannels = oData.results;
					aCountryChannels = Services.sortByKeyAsc(aCountryChannels, "InstituteName");
					if (oData.results.length > 0) {
						aCountryChannels.unshift({});
					}

					oFastAppDataModel.setProperty("/Institute", aCountryChannels);


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
		//EHQUT-199068-Italy – Tender search by Region


		//EHQUT-167493-Thailand - Filter of Offer’s Creator and Institute in ‘Existing Offers’ Page
		setInstituteList: function (oCountry) {
			var oDeferred = $.Deferred();
			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getView().getModel("fastData");
			var oFastAppDataModel = Services.getFastAppDataModel();

			const sInstitutesPath = "/PT_TMINST";
			var aFilter = [];
			aFilter.push(new Filter("CountryCode", FilterOperator.EQ, oCountry));

			oFastDataCalls.read(sInstitutesPath, {
				filters: aFilter,

				success: function (oData, oResponse) {

					var aCountryInstitute = oData.results;
					aCountryInstitute = Services.sortByKeyAsc(aCountryInstitute, "InstituteName");

					if (oData.results.length > 0) {
						aCountryInstitute.unshift({});
					}
					oFastAppDataModel.setProperty("/PT_TMINST", aCountryInstitute);

					oDeferred.resolve(aCountryInstitute);

				},
				error: function (oError) {
					//show error message
					this.showErrorMessage(oError, "No Institute");
					oDeferred.reject(oError);
				}
			});
			return oDeferred.promise();


		},


		//routing for tender Master view is matched
		_onTenderMatched: function (oEvent) {

			var that = this;

			if (!Services.getDefaultModel()) {
				this.getView().getModel("fastData").refresh(true);
				Services.setDefaultModel(this.getView().getModel("fastData"));
			} else {
				Services.getDefaultModel().refresh(true);
			}

			//get table with tenders
			that.oProductsTable = that.oView.byId("tendersMasterTable");
			Services.setTendersMasterTable(that.oProductsTable);

			//bind countries to wich the user has acces
			this._bindUserCountries();
			this.setTenderOrigins();
			this.setCountryStatusses();

			//get the tenderID/country from the navigation parameters
			/*
			var sTenderID = oEvent.getParameter("arguments").tender;
			var sCountry = oEvent.getParameter("arguments").country || "NA"; // if country is found in the link.. use NA
			var sOfferID = oEvent.getParameter("arguments").offer;
			var sTab =  oEvent.getParameter("arguments").tab || Services.getBasicInformationPageSectionID();
			var sLayout = oEvent.getParameter("arguments").layout;
			var oObjectPage = that.getView().byId("DetailPage");
			*/



			//reset filter to original state
			var oTendersMasterTable = Services.getTendersMasterTable(); //this.getView().byId("tendersMasterTable");
			var oBinding = oTendersMasterTable.getBinding("items");
			var aTenderMasterApplicationFilters = Services.getTenderMasterApplicationFilters();
			//if we stored the application filters, we restore them
			if (aTenderMasterApplicationFilters.length > 0) {
				oBinding.aApplicationFilters = aTenderMasterApplicationFilters;
			} else {

				//if application filter is lost.. its probably due to a hard refresh in the browser.
				//then we restore selections
				/*let aFilters = [];
				aFilters.push(new Filter("COUNTRY_CODE", FilterOperator.EQ, Services.getSelectedCountry()));
				aFilters.push(new Filter("ACTIVE_OFFER", FilterOperator.EQ, 1));
				*/
				let oCountryDropdown = that.byId("idSlctCountry");
				oCountryDropdown.setSelectedKey(Services.getSelectedCountry());
				/*
				var oApplicationFilter = new Filter(aFilters, true);

				oBinding.aApplicationFilters = oApplicationFilter

				Services.setTenderMasterApplicationFilters(oApplicationFilter);
				*/

			}
			//remove the selected tender filter
			var aFilter = [];
			oBinding.filter(aFilter);

			//set default filtering (needed when navigating back after refresh on detail page + close split mode)
			that.setFilter();

		},

		//ACTIONS
		//-------

		//Openen van een popover: sorteren en filteren
		onClick: function (oEvent) {
			this.oSelCol = oEvent.getSource().getTitle();
			var oButton = oEvent.getSource();
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("FAST_NS0FAST0.view.fragments.TableFilter", this);
				this.getView().addDependent(this._oPopover);
			}
			var eDock = sap.ui.core.Popup.Dock;
			this._oPopover.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
		},

		//In the popover of the column: when you press enter after adding a filter text on the column
		handleColumnFilterTextPress: function (oEvent) {

			//get source object
			var oSource = oEvent.getSource();
			var oSel;

			//TODO rebuild filtering by good practice of SAP or use get property for i18n
			if (this.oSelCol === "Country") {
				oSel = "COUNTRY";
			} else if (this.oSelCol === "TenderID" || this.oSelCol === "ID") {
				oSel = "TENDER_ID";
			} else if (this.oSelCol === "Classification") {
				oSel = "CLASSIFICATION";
			} else if (this.oSelCol === "Name / Reference") {
				oSel = "TENDER_NAME";
			} else if (this.oSelCol === "Institute") {
				oSel = "INSTITUTE";
			} else if (this.oSelCol === "Offer ID") {
				oSel = "OFFER_ID";
			} else if (this.oSelCol === "Value") {
				oSel = "VALUE";
			} else if (this.oSelCol === "Status") {
				oSel = "STATUS";
			} else if (this.oSelCol === "Publication Date") {
				oSel = "PUBLICATION_DATE";
			} else if (this.oSelCol === "Creation Date") {
				oSel = "CREATION_DATE";
			} else if (this.oSelCol === "Bid Due Date") {
				oSel = "INTERNAL_BID_DUE_DATE";
			} else if (this.oSelCol === "Closing Date") {
				oSel = "CLOSING_DATE";
			} else if (this.oSelCol === "Tender Origin") {
				oSel = "ORIGIN_CODE";
			} else if (this.oSelCol === "Distributor") {
				oSel = "DISTRIBUTOR";
			} else if (this.oSelCol === "Offer Date") {
				oSel = "OFFER_DATE";
			} else if (this.oSelCol === "Created By") {
				oSel = "UserName";
			}

			//var oTextfield = this.getView().byID("filterFieldID").getValue();
			var oTableSearchStatus = [],
				sQuery = oSource.getValue(); //get value from filter field in popover
			//sQuery = oEvent.getParameters().selectedItem.getText();
			//sQuery = oEvent.getParameters().item.mProperties.value;

			if (sQuery && sQuery.length > 0) {
				oTableSearchStatus = [new Filter(oSel, FilterOperator.Contains, sQuery)];
				var aExistingFilters = this.oProductsTable.getBinding("items").aApplicationFilters;
				aExistingFilters.push(oTableSearchStatus[0]);
				this.oProductsTable.getBinding("items").filter(aExistingFilters, "Application");
				// update filter bar
				this.byId("vsdFilterBar").setVisible(aExistingFilters.length > 0);
				this.byId("vsdFilterLabel").setText("Latest search for: " + sQuery);
			} else {
				//remove the filter
				var aKeepFilters = [];

				this.oProductsTable.getBinding("items").aApplicationFilters.forEach(function (oFilter) {
					//remove filter
					if (oFilter.sPath !== oSel) {
						var oFilterKeep = $.extend(true, {}, oFilter);
						aKeepFilters.push(oFilterKeep);
					}
				});
				//set default filtering
				this.setFilter();
				//this.oProductsTable.getBinding("items").filter(aKeepFilters, "Application");
				this.oProductsTable.getModel().refresh(true);
				//update filter bar
				this.byId("vsdFilterBar").setVisible(false);
			}

		},

		//when you click on the column text, you can sort Ascending on the selected column
		//TODO make 1 method for handleMenuItemAsPress & handleMenuDesItemPress (no differnce, except ascending, descending)
		handleMenuItemAsPress: function (oEvent) {
			var oSel;
			if (this.oSelCol === "Country") {
				oSel = "COUNTRY";
			} else if (this.oSelCol === "TenderID" || this.oSelCol === "ID") {
				oSel = "TENDER_ID";
			} else if (this.oSelCol === "Classification") {
				oSel = "CLASSIFICATION";
			} else if (this.oSelCol === "Name / Reference") {
				oSel = "TENDER_NAME";
			} else if (this.oSelCol === "Institute") {
				oSel = "INSTITUTE";
			} else if (this.oSelCol === "Offer ID") {
				oSel = "OFFER_ID";
			} else if (this.oSelCol === "Value") {
				oSel = "VALUE";
			} else if (this.oSelCol === "Status") {
				oSel = "STATUS";
			} else if (this.oSelCol === "Publication Date") {
				oSel = "PUBLICATION_DATE";
			} else if (this.oSelCol === "Creation Date") {
				oSel = "CREATION_DATE";
			} else if (this.oSelCol === "Bid Due Date") {
				oSel = "INTERNAL_BID_DUE_DATE";
			} else if (this.oSelCol === "Closing Date") {
				oSel = "CLOSING_DATE";
			} else if (this.oSelCol === "Tender Origin") {
				oSel = "ORIGIN_CODE";
			} else if (this.oSelCol === "Distributor") {
				oSel = "DISTRIBUTOR";
			} else if (this.oSelCol === "Offer Date") {
				oSel = "OFFER_DATE";
			} else if (this.oSelCol === "Created By") {
				oSel = "UserName";
			}

			var oTable = this.oProductsTable,

				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = oSel;
			bDescending = false;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		//when you click on the column text, you can sort Descending on the selected column
		//TODO make 1 method for handleMenuItemAsPress & handleMenuDesItemPress (no differnce, except ascending, descending)
		handleMenuDesItemPress: function (oEvent) {
			var oSel;
			if (this.oSelCol === "Country") {
				oSel = "COUNTRY";
			} else if (this.oSelCol === "TenderID" || this.oSelCol === "ID") {
				oSel = "TENDER_ID";
			} else if (this.oSelCol === "Classification") {
				oSel = "CLASSIFICATION";
			} else if (this.oSelCol === "Name / Reference") {
				oSel = "TENDER_NAME";
			} else if (this.oSelCol === "Institute") {
				oSel = "INSTITUTE";
			} else if (this.oSelCol === "Value") {
				oSel = "VALUE";
			} else if (this.oSelCol === "Status") {
				oSel = "STATUS";
			} else if (this.oSelCol === "Bid Due Date") {
				oSel = "INTERNAL_BID_DUE_DATE";
			} else if (this.oSelCol === "Creation Date") {
				oSel = "CREATION_DATE";
			} else if (this.oSelCol === "Publication Date") {
				oSel = "PUBLICATION_DATE";
			} else if (this.oSelCol === "Closing Date") {
				oSel = "CLOSING_DATE";
			} else if (this.oSelCol === "Offer ID") {
				oSel = "OFFER_ID";
			} else if (this.oSelCol === "Tender Origin") {
				oSel = "ORIGIN_CODE";
			} else if (this.oSelCol === "Distributor") {
				oSel = "DISTRIBUTOR";
			} else if (this.oSelCol === "Offer Date") {
				oSel = "OFFER_DATE";
			} else if (this.oSelCol === "Created By") {
				oSel = "UserName";
			}

			var oTable = this.oProductsTable,

				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = oSel;
			bDescending = true;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		setSortColList: function () {
			var oColnme = [];

			for (var i = 0; i < this.oProductsTable.getColumns().length; i++) {
				var obj = {};
				obj.Name = this.oProductsTable.getColumns()[i].getHeader().getTitle();
				oColnme.push(obj);
			}
			var oJsonSortColList = new JSONModel();
			this.oView.setModel(oJsonSortColList, "oJsonSortColList");
			this.oView.getModel("oJsonSortColList").setData(oColnme);
		},

		/*
		//Generate a popup with list of fields the user can show/hide in the tender table
		onSugestSel: function () {

			//get the tender table
			var oBtnTableSelectn = this.oProductsTable;

			//create empty array of colums
			var oColHeader = [];

			//get the columumns that exist in the table
			var oColmns = oBtnTableSelectn.getColumns();

			//loop over the columns
			for (var i = 0; i < oColmns.length; i++) {
				var obj = {};
				obj.Label = oColmns[i].getHeader().getTitle();
				obj.isSelected = oColmns[i].getVisible();
				oColHeader.push(obj);
			}
			var _TableData = new sap.ui.model.json.JSONModel();
			this.getView().setModel(_TableData, "oJTableData");
			_TableData.setData(oColHeader);
			if (this._oTabDialog === undefined) {
				this._oTabDialog = sap.ui.xmlfragment("FAST_NS0FAST0.view.ColumnSelectin", this);
			}
			this.getView().addDependent(this._oTabDialog);
			this._oTabDialog.open();
		},
		*/
		handleOkPress: function (evt) {
			var temp = evt.getParameters().selectedItem;

			if (temp !== null) {
				var oModel = evt.getParameters().selectedItem.getBindingContext("oJTableData").getModel().getData();
			}
			var oSelectdColumnHdr = this.oProductsTable;
			for (var j = 0; j < oSelectdColumnHdr.getColumns().length; j++) {

				var odt = oModel[j].isSelected;
				if (odt === true) {
					oSelectdColumnHdr.getColumns()[j].setVisible(true);
				} else {
					oSelectdColumnHdr.getColumns()[j].setVisible(false);
				}

			}
		},
		setBrandsList: function () {
			var oList = this.byId("idSlctBrand");
			var oSorter = new sap.ui.model.Sorter('BRANDNAME');
			var oListTemplate = new sap.ui.core.Item({
				key: "{fastData>BRANDID}",
				text: "{fastData>BRANDNAME}"
			});
			oList.bindItems({
				path: "fastData>/CountryTenderBrands",
				sorter: oSorter,
				filters: [
					new sap.ui.model.Filter("COUNTRYCODE", "EQ", this._country)
				],
				template: oListTemplate
			});
		},

		setCountryStatusses: function () {
			var sCountry = Services.getSelectedCountry();
			var oList = this.byId("idSlctStatus");
			var oSorter = new sap.ui.model.Sorter('Sorter');
			var oListTemplate = new sap.ui.core.Item({
				key: "{fastAppData>Status}",
				text: "{fastAppData>Status}"
			});
			$.when(Services.loadCountryStatusses(sCountry)).done(function (oCountryData) {
				oList.bindItems({
					path: "fastAppData>/CountryStatusses",
					sorter: oSorter,
					/*filters: [
						new sap.ui.model.Filter("CountryCode", "EQ", this._country)
					],*/
					template: oListTemplate
				});
			});
		},

		//setting the tender origins
		setTenderOrigins: function () {

			var sCountry = Services.getSelectedCountry();
			var oList = this.getView().byId("idSlctTenderOrigin");

			$.when(Services.loadCountryOrigins(sCountry)).done(function (oTenderData) {
				var oListTemplate = new sap.ui.core.Item({
					key: "{fastAppData>TenderOrigin/CODE}",
					text: "{fastAppData>TenderOrigin/NAME}"
				});
				oList.bindItems({
					path: "fastAppData>/CountryTenderOrigin",
					template: oListTemplate
				});
			});
		},

		//filter based upon the selections made above the tender table
		//setFilter is called on every route match.
		//setFilter contains also binding of the items from the tender table
		//Here the first reading of the odata is done PT_TMTEND
		//TODO seperate this logic to the service file? move itembinding back to the view? 
		setFilter: function (oSelection) {

			var oFastAppData = Services.getFastAppDataModel();


        ////EHQUT-199068-Italy – Tender search by Region
			//get possible filters
			let sSelectedCountry = Services.getSelectedCountry() || oFastAppData.getProperty("/UserCountries/results/0/COUNTRY_CODE");
			var oCountry = this.byId("idSlctCountry").getSelectedItem() ? this.byId("idSlctCountry").getSelectedItem().getKey() : sSelectedCountry;
			Services.setSelectedCountry(oCountry);
			//this.oRouter.getHashChanger().setHash(oCountry + Services.getLayoutType() || "/OneColumn")
			//EHQUT-167493-Thailand - Filter of Offer’s Creator and Institute in ‘Existing Offers’ Page
			if (oCountry == 'TH') {
				this.byId("idSlctInstitute").setVisible(true);
				this.byId("idSlctCreatedBy").setVisible(true);

			} else {
				this.byId("idSlctInstitute").setVisible(false);
				this.byId("idSlctCreatedBy").setVisible(false);

			}
		 	//EHQUT-217122-Spain - Tender search by Region
			//EHQUT-189207-Creation date instead of bid duedate
			if (oCountry == 'IT' || oCountry == 'ES') {
				this.byId("idDueDate").setVisible(false);
				this.byId("idCreationDate").setVisible(true);
				this.byId("idfltInstituteType").setVisible(true);

			} else {
				this.byId("idDueDate").setVisible(true);
				this.byId("idCreationDate").setVisible(false);
				this.byId("idfltInstituteType").setVisible(false);
				this.byId("idfltInstituteName").setVisible(false);

			}

			var oBrand = this.byId("idSlctBrand").getSelectedItem() ? this.byId("idSlctBrand").getSelectedItem().getKey() : "All_Brands";

			var oCreatedBy = this.byId("idSlctCreatedBy").getSelectedItem() ? this.byId("idSlctCreatedBy").getSelectedItem().getText() :
				"";
				//EHQUT-199068-Italy – Tender search by Region
                var oInstituteName;
				var Regiontype=this.byId("idfltInstituteType").getSelectedItem()?this.byId("idfltInstituteType").getSelectedItem().getText() : "";

				if(Regiontype === ""){
					this.byId("idfltInstituteName").setSelectedKey("");
				}
				//EHQUT-217122-Spain - Tender search by Region
				if(oCountry=='IT' || oCountry=='ES'){

					
					if(Regiontype==="Region(s)"){
						
						oInstituteName=this.byId("idfltInstituteName").getSelectedItem() ? this.byId("idfltInstituteName").getSelectedItem().getKey(): "";
						let InstituteIDList=Services.getInstituteID(oInstituteName);
						oInstituteName=InstituteIDList;
						
					}else{
						oInstituteName=this.byId("idfltInstituteName").getSelectedItem() ? this.byId("idfltInstituteName").getSelectedItem().getText(): "";
					}
					
					
				}else{
					 oInstituteName=this.byId("idSlctInstitute").getSelectedItem() ? this.byId("idSlctInstitute").getSelectedItem().getText(): "";
				}
//EHQUT-199068-Italy – Tender search by Region
			//var oInstituteName = this.byId("idSlctInstitute").getSelectedItem() ? this.byId("idSlctInstitute").getSelectedItem().getText() : "";
			//EHQUT-167493-Thailand - Filter of Offer’s Creator and Institute in ‘Existing Offers’ Page
			var oStatus = this.byId("idSlctStatus").getSelectedItem() ? this.byId("idSlctStatus").getSelectedItem().getText() :
				"Awaiting Approval";

			var sTenderOrigin = this.byId("idSlctTenderOrigin").getSelectedItem() ? this.byId("idSlctTenderOrigin").getSelectedItem().getKey() :
				"All";
			var sSearch = this.byId("idSearch").getProperty("value");

			let oMercadoPublicoRef = this.byId("idMercadoPublicoRef");

			if (sSearch.length > 0) {
				this.byId("idCheckBoxInactive").setSelected(true);
			}
			var oSeeInactive = this.byId("idCheckBoxInactive").getSelected();

			//TODO check why list is not shown on XML? but build here
			var oTenderTemplate = new sap.m.ColumnListItem({
				type: "Navigation",
				press: this.onListItemPress.bind(this), //onListItemPress TODO rename to onTenderItemPress
				highlight: {
					parts: [{
						path: 'fastData>ACTIVE_OFFER'
					}, {
						path: 'fastData>SUBMISSION_DATE'
					}, {
						path: 'fastData>CLOSING_DATE'
					}, {
						path: 'fastData>STATUS'
					}, {
						path: 'fastData>OFFER_ID'
					}],
					formatter: formatter.tenderMasterHighlight
				},
				cells: [
					new sap.m.Text({
						text: "{fastData>COUNTRY}"
					}),
					new sap.m.Text({
						text: "{fastData>TENDER_REFERENCE}"
					}),
					new sap.m.VBox({
						items: [
							new sap.m.Text({
								text: "{fastData>TENDER_ID}"
							}),
							new sap.m.Text({
								text: "{fastData>EXTERNAL_ID}"
							}),
							new sap.m.Text({
								text: "{fastData>SAP_ID}"
							}),
						]
					}),
					new sap.m.Text({
						text: "{fastData>CLASSIFICATION}"
					}),
					new sap.m.Text({
						text: "{fastData>TENDER_NAME}"
					}),
					new sap.m.Text({
						text: "{fastData>UserName}"
					}),
					new sap.m.Text({
						text: "{fastData>INSTITUTE}"
					}),
					// new sap.m.Text({
					// 	text: "{fastData>OFFER_ID}"
					// }),
					new sap.m.ObjectIdentifier({
						text: "{fastData>PFI_NO}",
						title: "{fastData>OFFER_ID}"
					}),
					new sap.m.ObjectNumber({
						number: {
							parts: [{
								path: "VALUE",
								model: "fastData"
							}, {
								path: "CURRENCY",
								model: "fastData"
							}],
							formatter: formatter.amount
						}
					}),
					new sap.m.Text({
						text: {
							parts: [{
								path: "STATUS",
								model: "fastData"
							}, {
								path: "ACTIVE_OFFER",
								model: "fastData"
							}],
							formatter: formatter.statusInactive
						}
					}),
					//EHQUT-OTT-123341-Italy Customer Code in Tender Page
					new sap.m.Text({
						text: "{path:'fastAppData>/Tender/Institute/CustomerID'}"

					}),
					//EHQUT-OTT-123341-Italy Customer Code in Tender Page
					new sap.m.Text({
						text: "{path:'fastData>PUBLICATION_DATE',formatter:'FAST_NS0FAST0.utils.Formatter.bdate'}"

					}),
					//EHQUT-189207-Creation date instead of bid duedate
					new sap.m.Text({
						text: "{path:'fastData>CREATION_DATE',formatter:'FAST_NS0FAST0.utils.Formatter.bdate'}"
					}),
					new sap.m.Text({
						text: "{path:'fastData>INTERNAL_BID_DUE_DATE',formatter:'FAST_NS0FAST0.utils.Formatter.bdate'}"
					}),
					new sap.m.Text({
						text: "{path:'fastData>CLOSING_DATE',formatter:'FAST_NS0FAST0.utils.Formatter.bdate'}"
					}),
					new sap.m.Text({
						text: "{path:'fastData>ORIGIN_CODE'}"
					}),
					new sap.m.Text({
						text: "{path:'fastData>DISTRIBUTOR'}"
					}),
					new sap.m.Text({
						text: "{path:'fastData>OFFER_DATE',formatter:'FAST_NS0FAST0.utils.Formatter.bdate'}"
					})
				]
			});
			//EHQUT-167493-Thailand - Filter of Offer’s Creator and Institute in ‘Existing Offers’ Page
			//Add filters if they are set (so not the default, all...)
			var orFilters = [];
			var orInstituteFilter=[];
			var andFilters = [
				new sap.ui.model.Filter("COUNTRY", "EQ", oCountry)
			];
			if (oCreatedBy !== "") {
				andFilters.push(new sap.ui.model.Filter("UserName", "EQ", oCreatedBy));
			}
			// if (oInstituteName !== "") {
			// 	andFilters.push(new sap.ui.model.Filter("INSTITUTE", "EQ", oInstituteName));
			// }
			//EHQUT-199068-Italy – Tender search by Region
			if(oInstituteName !== ""){
				if(Regiontype==="Region(s)"){
					if(oInstituteName.length>1){
						for(var i=0;i<oInstituteName.length;i++){
							orInstituteFilter.push(new sap.ui.model.Filter("INSTITUTE", sap.ui.model.FilterOperator.EQ, oInstituteName[i]));
							
						}
						andFilters.push(new sap.ui.model.Filter(orInstituteFilter, false));
					}
				}else{
					andFilters.push(new sap.ui.model.Filter("INSTITUTE", sap.ui.model.FilterOperator.EQ, oInstituteName));
				}
           
           }
//EHQUT-199068-Italy – Tender search by Region
			if (!oSeeInactive) {
				andFilters.push(new sap.ui.model.Filter("ACTIVE_OFFER", "EQ", 1));
			}
			if (oBrand === "All_Brands") {
				this.oProductsTable.setGrowingThreshold(15);
			} else {
				this.oProductsTable.setGrowingThreshold(1000000);
			}
			if (oStatus !== "All") {
				andFilters.push(new sap.ui.model.Filter("STATUS", "EQ", oStatus));
			}

			//oSelection is empty when you are navigating back to the tender list after selecting a tender
			var sIdSource = "";
			if (oSelection) {
				sIdSource = oSelection.getSource().getId();
			}

			if (sTenderOrigin !== "All" && sIdSource !== this.byId("idSlctCountry").getId()) {
				//if (sTenderOrigin !== "All" && 	oFastAppData.getProperty('/CountryTenderOrigin/length') > 2 ){
				andFilters.push(new sap.ui.model.Filter("ORIGIN_CODE", "EQ", sTenderOrigin));
			}
			if (sSearch.length > 0) {

				orFilters.push(new Filter({
					path: "TENDER_NAME",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "CLASSIFICATION",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "UserName",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "TENDER_REFERENCE",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "TENDER_ID",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "OFFER_ID",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "INSTITUTE",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "PFI_NO",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "EXTERNAL_ID",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				orFilters.push(new Filter({
					path: "SAP_ID",
					operator: FilterOperator.Contains,
					value1: sSearch,
					caseSensitive: false
				}));

				andFilters.push(new sap.ui.model.Filter(orFilters, false));
			}
			var oFilters = new sap.ui.model.Filter(andFilters, true);
			var sSortingPath, sDescending;
			//addsorter
			if (oStatus === 'Awaiting Approval' || oStatus === 'Offer Created' || oStatus === 'Offer Approved' || oStatus === 'Offer Rejected') {
				if (oCountry == 'TH') {
					sSortingPath = 'OFFER_ID';
					sDescending = true;
				} else {
					sSortingPath = 'INTERNAL_BID_DUE_DATE';
					sDescending = false;
				}

			} else if (oStatus === 'Quotation Submitted' || oStatus === 'Results Recorded' || oStatus === 'In FOC Negotiation' || oStatus === 'Appeal in Progress' || oStatus === 'Delivery Ongoing' ||
				oStatus === 'Wholesale Offer' || oStatus === 'Offer Declined' || oStatus === 'Tender Closed' || oStatus === 'Cancelled' || oStatus ===
				'All') {
				if (oCountry == 'TH') {
					sSortingPath = 'OFFER_ID';
					sDescending = true;
				} else {
					sSortingPath = 'PUBLICATION_DATE';
					sDescending = true;
				}
			}
			var oSorter = new sap.ui.model.Sorter({
				path: sSortingPath,
				descending: sDescending
			});

			//Binding to table with the filters and the sorters
			this.oProductsTable.bindItems({
				path: "/TenderOfferMaster", //this is the Tender table (TODO seperate the logic)
				model: "fastData",
				filters: oFilters,
				sorter: oSorter,
				template: oTenderTemplate,
				parameters: {
					expand: "BRAND"
				}
			});

			//this solves  a problem with dropdowns not loaded correctly on initial load of application
			oCountry = (oCountry === "NA") ? oFastAppData.getProperty("/UserCountries/results/0/COUNTRY_CODE") : oCountry;

			//if a new country is set, the brandlist should be re-loaded
			if (this._country !== oCountry) {
				let sEnvironment = window.location.host.search('dev') > -1 ? 'DEV' : window.location.host.search('qa') > -1 ? 'QA' : window.location.host.search('sbx') > -1 ? 'SBX' : window.location.host.search('prod') > -1 ? 'PRD' : 'LOCL';

				this._country = oCountry;
				Services.setSelectedCountry(oCountry);
				this.setBrandsList();
				this.setInstituteList(oCountry);
				this.setCreatedByList(oCountry);
				this.setTenderOrigins();
				this.setCountryStatusses(oCountry);
				Services.loadCountryPermissions(oCountry);
				this.loadCountryChannels(oCountry);
				Services.loadAppConfig(oCountry, sEnvironment);
			}

			oMercadoPublicoRef.setVisible(oCountry === 'CL');
		},

		/*
		createFilter: function(key, operator, value, useToLower) {
			return new Filter(useToLower ? "tolower(" + key + ")" : key, operator, useToLower ? "'" + value.toLowerCase() + "'" : value);
		},
		*/

		//Create a new tender (new tender initially has tenderID= 1)
		onAdd: function () {

			//put filter on seleted Tender
			var oBinding = this.oProductsTable.getBinding("items");

			//keep filters of list so we can add them again when returning to the master list
			if (Services.getFastAppDataModel().getProperty("/LayoutType") === "OneColumn") {
				Services.setTenderMasterApplicationFilters(oBinding.aApplicationFilters);
			}

			//navigate to the detail screen with the different tabs
			this.oRouter.navTo("detail", {
				layout: "TwoColumnsMidExpanded", //only the midcolumn is shown in fullscreen
				//layout : "TwoColumnsMidExpanded",
				//layout: oNextUIState.layout,
				tender: "1",
				tab: Services.getBasicInformationPageSectionID(),
				country: this._country
			});
		},

		//sorting
		onSort: function () {
			this._bDescendingSort = !this._bDescendingSort;
			var oBinding = this.oProductsTable.getBinding("items"),
				oSorter = new Sorter("PublicationDate", this._bDescendingSort);

			oBinding.sort(oSorter);
		},

		//navigate to the detail screen with the different tabs
		onListItemPress: function (oEvent) {

			//that is this
			var that = this;

			//get tenderPath & ID
			var sTenderPath = oEvent.getSource().getBindingContext("fastData").getPath();
			var sTenderID = Services.getDefaultModel().getProperty(sTenderPath).TENDER_ID;
			var sOfferId = Services.getDefaultModel().getProperty(sTenderPath).OFFER_ID;
			var sOfferPath = "/PT_TMOFRS('" + sOfferId + "')";

			//put filter on seleted Tender
			var oBinding = this.oProductsTable.getBinding("items");

			//keep filters of list so we can add them again when returning to the master list
			if (Services.getFastAppDataModel().getProperty("/LayoutType") === "OneColumn") {
				Services.setTenderMasterApplicationFilters(oBinding.aApplicationFilters);
			}

			//clear all existing filters
			oBinding.aFilters = null;
			oBinding.aApplicationFilters = null;

			//add filters (only tender should be filtered)
			var aFilter = [];
			aFilter.push(new Filter("TENDER_ID", "EQ", sTenderID));
			//aFilter.push(new Filter("ACTIVE_OFFER", "EQ", 1));
			oBinding.filter(aFilter);

			//add sorter (sort on offer ID)
			var aSorters = [];
			aSorters.push(new Sorter('OFFER_ID', true));
			oBinding.sort(aSorters);

			//navigate to the detail screen with the different tabs
			if (sTenderID) {

				//determine layout to be used, onecolumn = tender master list, "TwoColumnsMidExpanded" = 2 columns visible, "MidColumnFullScreen" = tabs on detail page are in full screen mode
				var sLayout = "";
				if (Services.getFastAppDataModel().getProperty("/LayoutType") === "OneColumn") {
					//default we start with this view
					sLayout = "TwoColumnsMidExpanded";
				} else {
					//this means we click on tenderlist when we are already on detail screen for a specific tender
					sLayout = that.getView().getParent().getParent().getProperty("layout") || "TwoColumnsMidExpanded";
				}

				var sTab = Services.getSelectedTab() || Services.getBasicInformationPageSectionID(); //check tab to open

				//check if tender is already loaded   
				var bLoadedCheck = true;

				//In this case we have selected a new tender, we will load all data from the database
				$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {

					//set as selected
					Services.setSelectedTenderID(sTenderID);
					Services.setSelectedOfferID(sOfferId);
					Services.setSelectedOfferPath(sOfferPath);
					Services.setSelectedProductID("");
					Services.setSelectedProductName("");
					Services.setSelectedProductPath("");

					//only if initial dataloading is finished, we continue
					if (!Services.getOfferCreated()) {
						that.oRouter.navTo("detail", {
							layout: sLayout,
							tender: sTenderID,
							offer: sOfferId,
							tab: sTab,
							country: that._country
						});
					}
				});

			}
		},
//EHQUT-199068-Italy – Tender search by Region
		loadCountryChannels: function (sCountry) {

			
			var oDeferred = $.Deferred();
			var oFastDataCalls = Services.getDefaultModel();
			var oFastAppDataModel = Services.getFastAppDataModel();

			var that = this;

			var sCountryChannelsPath = "/CountryChannels";

			var aFilters = [];

			if (sCountry) {
				var oCountryFilter = new sap.ui.model.Filter("ChannelCountry", sap.ui.model.FilterOperator.EQ, sCountry);
				aFilters.push(oCountryFilter);
			}
         	oFastDataCalls.read(sCountryChannelsPath, {
				filters: aFilters,
				success: function (oData, oResponse) {
					var aCountryChannels = oData.results;
					if(oData.results.length > 0){
						// aCountryUserName.unshift({});
						aCountryChannels.unshift({});
					 }

					oFastAppDataModel.setProperty("/Channels", aCountryChannels);

					
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
		//EHQUT-167493-Thailand - Filter of Offer’s Creator and Institute in ‘Existing Offers’ Page
		setCreatedByList: function (oCountry) {

			var oDeferred = $.Deferred();
			//get model for doing the calls to the back-end
			var oFastDataCalls = this.getView().getModel("fastData");
			var oFastAppDataModel = Services.getFastAppDataModel();

			//const sUserNamePath = "/PT_TMUSERCTRY";
			const sUserNamePath = "/CountryApprovers"
			var aFilter = [];
			aFilter.push(new Filter("CountryCode", FilterOperator.EQ, oCountry));
			aFilter.push(new Filter("ApproverName", FilterOperator.NE, "Auto Approval"));

			oFastDataCalls.read(sUserNamePath, {
				filters: aFilter,

				success: function (oData, oResponse) {


					//var aCountryUserName = oData.results;
					var aUniqueName = Array.from(new Set(oData.results.map(x => x.ApproverID)))
						.map(ApproverID => {
							return {
								ApproverID: ApproverID,
								ApproverName: oData.results.find(x => x.ApproverID === ApproverID).ApproverName
							};
						});

					aUniqueName = Services.sortByKeyAsc(aUniqueName, "ApproverName");

					if (oData.results.length > 0) {
						// aCountryUserName.unshift({});
						aUniqueName.unshift({});
					}
					// oFastAppDataModel.setProperty("/Users", aCountryUserName);
					oFastAppDataModel.setProperty("/CountryApprovers", aUniqueName);


					oDeferred.resolve(aUniqueName);

				},
				error: function (oError) {

					//show error message
					this.showErrorMessage(oError, "No User");
					oDeferred.reject(oError);
				}
			});
			return oDeferred.promise();
		},
		//when tenders are loaded and displayed, select selected Offer
		onFinishedBindingTendersTable: function (oEvent) {
			var that = this;
			//is there an offer/tender selected?
			var sTenderID = Services.getSelectedTenderID();
			var sOfferID = Services.getSelectedOfferID();

			//get tender table
			var oTenderTable = oEvent.getSource();

			//get items of offertable
			var aItems = oTenderTable.getItems();
			var iIndexColumnTenderID = this.getView().byId("TenderTableTenderID").getOrder();
			var iIndexColumnOfferID = this.getView().byId("TenderTableOfferID").getOrder();

			//See if tender and or offer is selected, this tender should be highlighted (only usefull for split screen)
			if (sTenderID) {
				//first we need all items to be set to inactive!
				//only 1 can be active, so if we don't do this loop first, it will not work in all cases
				aItems.forEach(function (oItem) {
					oItem.setActive(false);
				});

				if (sOfferID) {
					//Select same offer again
					aItems.forEach(function (oItem) {
						if (oItem.getCells()[iIndexColumnOfferID].getTitle() === sOfferID) {
							oItem.setActive(true);
						}
					});

				}
			}

			//when coming from tile "Tender management" we start loading screen.. this will be ended here
			var oLoadingTenderMasterDialog = Services.getLoadingTenderMasterDialog();
			if (oLoadingTenderMasterDialog) {
				// close loading dialog
				try {
					//this should be caught in case oLoadingTenderMasterDialog is initial.
					//this variable is being set in Main.controller.js, method onTileTenderManagementPress
					//when navigating to a tender offer, by copy pasting the link, this would otherwise throw an error
					//see js error when navigating offer opened in new tab from link for reference
					oLoadingTenderMasterDialog.close();
				} catch (exception) { }
			}
		}

	});
});