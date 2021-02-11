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

			//load the external ID of the USER
			$.when(Services.loadUserInfo()).done(function () {

				//bind countries to wich the user has acces	
				that._bindUserCountries();

				//get view: TenderMaster.view.xml
				that.oView = that.getView();
				that._bDescendingSort = false;

				//get table with tenders
				that.oProductsTable = that.oView.byId("tendersMasterTable");
				Services.setTendersMasterTable(that.oView.byId("tendersMasterTable"));

				//attach routing
				that.oRouter = that.getOwnerComponent().getRouter();
				that.oRouter.getRoute("master").attachPatternMatched(that._onTenderMatched, that);

				that.oProductsTable.attachBrowserEvent("tab keyup", function (oEvent) {
					that._bKeyboard = oEvent.type == "keyup";
				}, that);

				//set default filtering
				that.setFilter();			

				//set default sorting
				that.setSortColList();

				//set default we are in display modus
				Services.setEditMode(false);

				that.oProductsTable.attachUpdateFinished(oEvent => {
					that._filterProductsTable(oEvent);
				});

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

				if (this._bContainsSelectedBrand(aBrands)) {
					// add the item back to the table
					this.oProductsTable.addItem(item);
				}
			});
			
			oTable.setBusy(false);
		},

		/**
		 * This method checks whether Offer contains the selected brand
		 * @param a list of brands
		 * @return boolean
		 */
		_bContainsSelectedBrand: function (aBrands) {
			var oBrand = this._sSelectedBrandId;

			var bContainsBrand = aBrands.find(brand => {
				var brandID = brand.split("'")[5];
				return brandID == oBrand;
			});

			return !!bContainsBrand;
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

		//routing for tender Master view is matched
		_onTenderMatched: function (oEvent) {

			var that = this;

			if (!Services.getDefaultModel()) {
				this.getView().getModel("fastData").refresh(true);
				Services.setDefaultModel(this.getView().getModel("fastData"));
			} else {
				Services.getDefaultModel().refresh(true);
			}

			//bind countries to wich the user has acces
			this._bindUserCountries();
			this.setTenderOrigins();

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
			}
			//remove the selected tender filter
			var aFilter = [];
			oBinding.filter(aFilter);

		},

		//ACTIONS
		//-------

		//Openen van een popover: sorteren en filteren
		onClick: function (oEvent) {
			this.oSelCol = oEvent.getSource().getTitle();
			var oButton = oEvent.getSource();
			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("FAST_NS0FAST0.view.TableFilter", this);
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
			} else if (this.oSelCol === "TenderID") {
				oSel = "TENDER_ID";
			} else if (this.oSelCol === "Tender Name") {
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
			} else if (this.oSelCol === "TenderID") {
				oSel = "TENDER_ID";
			} else if (this.oSelCol === "Tender Name") {
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
			} else if (this.oSelCol === "TenderID") {
				oSel = "TENDER_ID";
			} else if (this.oSelCol === "Tender Name") {
				oSel = "TENDER_NAME";
			} else if (this.oSelCol === "Institute") {
				oSel = "INSTITUTE";
			} else if (this.oSelCol === "Value") {
				oSel = "VALUE";
			} else if (this.oSelCol === "Status") {
				oSel = "STATUS";
			} else if (this.oSelCol === "Bid Due Date") {
				oSel = "INTERNAL_BID_DUE_DATE";
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

			//get possible filters
			var oCountry = this.byId("idSlctCountry").getSelectedItem() ? this.byId("idSlctCountry").getSelectedItem().getKey() : oFastAppData.getProperty("/UserCountries/results/0/COUNTRY_CODE");
			var oBrand = this.byId("idSlctBrand").getSelectedItem() ? this.byId("idSlctBrand").getSelectedItem().getKey() : "All_Brands";
			var oStatus = this.byId("idSlctStatus").getSelectedItem() ? this.byId("idSlctStatus").getSelectedItem().getText() :
				"Awaiting Approval";

			var sTenderOrigin = this.byId("idSlctTenderOrigin").getSelectedItem() ? this.byId("idSlctTenderOrigin").getSelectedItem().getKey() :
				"All";
			var sSearch = this.byId("idSearch").getProperty("value");
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
						text: "{fastData>TENDER_ID}"
					}),
					new sap.m.Text({
						text: "{fastData>TENDER_NAME}"
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
					new sap.m.Text({
						text: "{path:'fastData>PUBLICATION_DATE',formatter:'FAST_NS0FAST0.utils.Formatter.bdate'}"

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

			//Add filters if they are set (so not the default, all...)
			var orFilters = [];
			var andFilters = [
				new sap.ui.model.Filter("COUNTRY", "EQ", oCountry)
			];
			if (!oSeeInactive) {
				andFilters.push(new sap.ui.model.Filter("ACTIVE_OFFER", "EQ", 1));
			}
			// if (oBrand !== "All_Brands"){
			// 	andFilters.push(new sap.ui.model.Filter("BRAND", "Contains", oBrand));
			// }
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

				andFilters.push(new sap.ui.model.Filter(orFilters, false));
			}
			var oFilters = new sap.ui.model.Filter(andFilters, true);

			//addsorter
			if (oStatus === 'Awaiting Approval' || oStatus === 'Offer Created' || oStatus === 'Offer Approved' || oStatus === 'Offer Rejected') {
				var sSortingPath = 'INTERNAL_BID_DUE_DATE';
				var sDescending = false;
			} else if (oStatus === 'Quotation Submitted' || oStatus === 'Results Recorded' || oStatus === 'Delivery Ongoing' ||
				oStatus === 'Wholesale Offer' || oStatus === 'Offer Declined' || oStatus === 'Tender Closed' || oStatus === 'Cancelled' || oStatus ===
				'All') {
				sSortingPath = 'PUBLICATION_DATE';
				sDescending = true;
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

			//if a new country is set, the brandlist should be re-loaded
			if (this._country !== oCountry) {
				this._country = oCountry;
				Services.setSelectedCountry(oCountry);
				this.setBrandsList();
				this.setTenderOrigins();
			}
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
				} catch (exception) {}
			}
		}

	});
});