//const { filter } = require("compression");

sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, Sorter) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.epa.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {

			this.previousMSP = "";
			this.oSemanticPage = this.byId("detailPage");
			this.epaState = this.getOwnerComponent().getState(this.getOwnerComponent().EPA);
			this.setModel(this.epaState.getModel(), "epa");
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress : function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},



		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function (oEvent) {
			var iInstituteGroupId =  oEvent.getParameter("arguments").InstituteGroupId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

			this.showDetail(iInstituteGroupId);
		},

		showDetail:function(instituteGroupId){
			this.currentinstGroupId = instituteGroupId;
			this.epaState.setEditMode(false);
			this.getModel().metadataLoaded().then(() => {
				// if (objectId === "NEW") {
				// 	this.epaState.getNewGroup();
				// 	this.getOwnerComponent().oListSelector.clearMasterListSelection();
				// } else {
					/*var sObjectPath = this.getModel().createKey("PT_TMCTRYFake", {
						CountryCode: objectId
					});*/
					var sObjectPath = this.getModel().createKey("InstituteGroup", {
						Id: instituteGroupId
					});
					this.getOwnerComponent().oListSelector.selectAListItem("/" + sObjectPath);

					// selected InstituteGroup
					var oSelectedInstituteGroup = this.getModel().getProperty("/" + sObjectPath);

					//filter group institute members by selected institute group
					// this.filterInstitutesList(this.currentinstGroupId);

					//bind model to product selection form
					// this.getView().byId("idProductSelection").bindElement({
					// 	path: "/DivisionsForCountry(CountryCode='TH',Division='Pharma')",
					// 	model: "",
					// 	parameters: {
					// 		"expand": "Brands"
					// 	}
					// });

					//this.getGroup(instituteGroupId);

					this._clearSelections();

					this.sCountryCode = oSelectedInstituteGroup.CountryCode;
					this.sInstituteGroupId = instituteGroupId;

					// get Institutes and Divisions for a given Country and Institute Group
					this.getInstituteGroupsInstitutes(this.sInstituteGroupId);
					this.getDivisionsForCountry(this.sCountryCode);

				// }
				// this._bindView("/" + sObjectPath);
			});
		},

		_clearSelections: function(){
			
			// clear the Product Selection					
			let oProductSelect = this.getView().byId("idProduct");
			let oCtx = oProductSelect.getBindingContext("epa");
			oProductSelect.setSelectedKey();
			var oCurrencySelect = this.getView().byId("idCurrency");
			oCurrencySelect.setBindingContext(oCtx, "epa");
			this.sProductPackId = null;

			// clears the Approvals
			this.epaState.setNewLatestApprovalRequest();
			this.epaState.setNewCurrentInstituteGroup();

			// clears PriceChart
			this.refreshPriceChart();
		},

		getGroup: function (objectid) {
			this.getView().setBusy(true);
			this.epaState.getGroup(objectid).then(() => {
				this.getView().setBusy(false);
				// this.onChangeDate();
				// this._bindSpecifySelect();
			}).catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		getInstituteGroupsInstitutes: function(sInstituteGroupId){
			this.getView().setBusy(true);
			this.epaState.getInstituteGroups()
			.then((response) => {
				// set the selected institute group as current 
				this.epaState.setCurrentInstituteGroupById(sInstituteGroupId);

				// get the institutes
				this.epaState.getInstitutes(sInstituteGroupId);
			})
			.then((response) => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		getDivisionsForCountry: function(sCountryCode){
			this.getView().setBusy(true);
			this.epaState.getDivisionsForCountry(sCountryCode)
			.then((response) => {
				this.getView().setBusy(false);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		getLatestApprovalRequests: function (sCountryCode, sInstituteGroupId, sProductPackId, sDivision) {
			this.getView().setBusy(true);
			this.epaState.getLatestApprovalRequests(sCountryCode, sInstituteGroupId, sProductPackId, sDivision)
			.then((response) => {
				this.getView().setBusy(false);

				this.setTableGrouping(response.approvalRequests);
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.epaState.setEditMode(false);
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout",  this.getModel("appView").getProperty("/previousLayout"));
			}
		},

		// filterInstitutesList: function(iCurrentinstGroupId) {
		// 	var oInstituteList = this.byId("InstitutesList");
		// 	var oBinding = oInstituteList.getBinding("items");
		// 	var aFilter = [];

		// 	aFilter.push(new Filter("InstituteGroupId", "EQ", iCurrentinstGroupId));	
		// 	oBinding.filter(aFilter);
		// },


		/* Approval table specific logic
		*/
		onApprovalItemDetail: function(oEvent){
			var oApprovalsTable = this.byId("idMandatoryTable");

			if(oApprovalsTable){
				var aApprovals = oApprovalsTable.getItems();
				var sPathSelectedItem = oEvent.getSource().getBindingContextPath();
				//var oSelectedItem =
				//var iIndex =
				
				// Set the binding context from the selected appoval
				var oCtx = oEvent.getSource().getBindingContext("epa");
				var oDetailForm = this.byId("idApprovalDetailForm");
				oDetailForm.setBindingContext(oCtx, "epa");

				oDetailForm.setVisible(true);
			}
		},

		onApprovalItemSelect: function(oEvent){
			var oApprovalsTable = this.byId("idMandatoryTable");
		},

		onConfirmApproval: function(oEvent){
			this.byId("idApprovalDetailForm").setVisible(false);
		},

		/**
		 * Send button handler for the approvals table
		 * send approvals = save to database & change status
		 */
		onSendApprovals: function(oEvent){

			if (!this.sCountryCode || !this.sInstituteGroupId || !this.sProductPackId || !this.sDivision) {
				sap.m.MessageBox.warning("No product selected. Please select a product from the product section.", {});
				return;
			}
						
			// TODO: check if setCancelApprovalsPressed is necessary - is not used at the moment
			// Keep track that we pressed Send Approval button
			this.epaState.setSendApprovalsPressed(true);

			//save Approvals (&status)
			this.epaState.sendApprovals("Processing");

			//disable edit mode
			this.epaState.setEditMode(false);
			
		},

		/**
		 * Cancel button handler for the approvals table
		 */
		onCancelApprovals: function(oEvent){

			if (!this.sCountryCode || !this.sInstituteGroupId || !this.sProductPackId || !this.sDivision) {
				sap.m.MessageBox.warning("No product selected. Please select a product from the product section.", {});
				return;
			}

			// TODO: check if setCancelApprovalsPressed is necessary - is not used at the moment
			// Keep track that we pressed Send Approval button
			this.epaState.setCancelApprovalsPressed(true);

			//save Approvals (&status)
			this.epaState.sendApprovals("Cancelling");

			//disable edit mode
			this.epaState.setEditMode(false);
		},

		onEditModePress: function(oEvent){
			this.previousMSP = this.epaState.data.currentInstituteGroup.pricingData.msp;
			this.epaState.setEditMode(true);
		},

		/**
		 * Validates the inserted MSP value. Gives warning.
		 */
		validateMSP: function(oEvent){

			const msp = oEvent && Number(oEvent.getParameter("newValue")) || Number(this.epaState.data.currentInstituteGroup.pricingData.msp);
			const floorPrice = Number(this.epaState.data.currentInstituteGroup.pricingData.pricingObj.floorPrice.price);
			const cif = Number(this.epaState.data.currentInstituteGroup.pricingData.cif);
			const oInput = this.byId("idInputMSP");
			const oSaveBtn = this.byId("idBtnSaveMSP");
			oSaveBtn.setEnabled(true);
			
			if(oEvent && !oEvent.getParameter("newValue")){
				oSaveBtn.setEnabled(false);
			}

			if(msp < floorPrice){
				oInput.setValueState("Warning");
				oInput.setValueStateText("MSP value is below our floor price. Are you sure you want to continue?");
			}else if(msp > cif){
				oInput.setValueState("Error");
				oInput.setValueStateText("MSP value cannot be higher than the CIF value.");
				oSaveBtn.setEnabled(false);
			}
			else{
				oInput.setValueState("None");
				oInput.setValueStateText();
			}
		},

		/**
		 * Event handler for semantic:PositiveAction
		 */
		onSave: function(){
			this.saveMSP().then(this.refreshPriceChart.bind(this));
		},

		saveMSP: function () {

			this.getView().setBusy(true);

			const instituteGroupId = this.epaState.getCurrentInstituteGroup().id || null;
			const productPackId = this.epaState.getCurrentInstituteGroup().productData.getProductId() || null;
			const effectiveDate = new Date();
			const uom = this.epaState.getCurrentInstituteGroup().productData.getPrices().registeredPrice.uoM;
			const currency = this.epaState.getCurrentInstituteGroup().productData.getPrices().registeredPrice.currency;
			const price = +this.epaState.getCurrentInstituteGroup().getMSP();

			const oInstituteGroupPrice = {
				"InstituteGroupId": instituteGroupId,
				"ProductPackId": productPackId,
				"EffectiveDate": effectiveDate,
				"UoM": uom,
				"Currency": currency,
				"Price": price
			};

			return this.epaState.createInstituteGroupPrice(oInstituteGroupPrice)
			.then((response) => {
				this.getView().setBusy(false);
				this.epaState.setEditMode(false);
				this.epaState.calculateDiscount();
			})
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},

		/**
		 * Event handler for semantic:NegativeAction
		 */
		onCancel: function(oEvent){

			const msp = this.previousMSP; // previousMSP is set in the validateMSP()
			const oInput = this.byId("idInputMSP");

			oInput.setValue(msp);
			this.validateMSP();

			this.epaState.setEditMode(false);
		},

		/**
		 * Refresh button handler for the approvals table
		 */
		onRefreshApprovalsPress: function(){
			this.refreshApprovals();
		},

		refreshApprovals: function(){

			if (!this.sCountryCode || !this.sInstituteGroupId || !this.sProductPackId || !this.sDivision) {
				sap.m.MessageBox.warning("No product selected. Please select a product from the product section.", {});
				return;
			}

			this.getLatestApprovalRequests(this.sCountryCode, this.sInstituteGroupId, this.sProductPackId, this.sDivision);
		},

		onDivisionSelectionChange: function(oEvent){

			var oCtx = oEvent.getSource().getSelectedItem().getBindingContext("epa");
			this.sDivision = oCtx.getProperty("division");

			var oBrandSelect = this.getView().byId("idBrand");
			oBrandSelect.setBindingContext(oCtx, "epa");
			oBrandSelect.setSelectedKey();

			var oProductSelect = this.getView().byId("idProduct");
			oProductSelect.setBindingContext(oCtx, "epa");
			oProductSelect.setSelectedKey();

			var oCurrencySelect = this.getView().byId("idCurrency");
			oCurrencySelect.setBindingContext(oCtx, "epa");

			var oPricingDataSimpleForm = this.getView().byId("idPricingData");
			oPricingDataSimpleForm.setBindingContext(oCtx, "epa");

			// clears the LatestApprovals table
			this.epaState.setNewLatestApprovalRequest();

			//clear data 
			this.epaState.clearCurrentInstituteGroupPricingData();
			this.refreshPriceChart();

			this.setApprovalButtonsEnabled(false);
			this.byId("idBtnEditPricingData").setVisible(false);

		},

		onBrandSelectionChange: function(oEvent){
			var oCtx = oEvent.getSource().getSelectedItem().getBindingContext("epa");

			var oProductSelect = this.getView().byId("idProduct");
			oProductSelect.setBindingContext(oCtx, "epa");
			oProductSelect.setSelectedKey();

			var oCurrencySelect = this.getView().byId("idCurrency");
			oCurrencySelect.setBindingContext(oCtx, "epa");
			
			var oPricingDataSimpleForm = this.getView().byId("idPricingData");
			oPricingDataSimpleForm.setBindingContext(oCtx, "epa");

			// clears the LatestApprovals table
			this.epaState.setNewLatestApprovalRequest();

			//clear data 
			this.epaState.clearCurrentInstituteGroupPricingData();
			this.refreshPriceChart();

			this.setApprovalButtonsEnabled(false);
			this.byId("idBtnEditPricingData").setVisible(false);

		},

		onProductSelectionChange: function(oEvent){

			this.setApprovalButtonsEnabled(true);
			this.byId("idBtnEditPricingData").setVisible(true);

			var oCtx = oEvent.getSource().getSelectedItem().getBindingContext("epa");
			this.sProductPackId = oCtx.getProperty("productId");
			var oSelectedProduct = oCtx.getObject();

			const oProduct = oCtx.getObject();
			this.epaState.setProduct(oProduct);

			var oCurrencySelect = this.getView().byId("idCurrency");
			oCurrencySelect.setBindingContext(oCtx, "epa");

			var oPricingDataSimpleForm = this.getView().byId("idPricingData");
			oPricingDataSimpleForm.setBindingContext(oCtx, "epa");

			//clear data 
			this.epaState.clearCurrentInstituteGroupPricingData();

			// Get the approvals
			if(this.sProductPackId){

				
				this.getMSP(this.currentinstGroupId,this.sProductPackId).then(res => {

					//Set CIF price & calculate prices
					this.epaState.getCurrentInstituteGroup().setCIF(oSelectedProduct.getRegisteredPrice().price);
					//keep calculated prices
					const oPricing = {
						cif:  oSelectedProduct.getRegisteredPrice().price,
						discount : this.epaState.getCurrentInstituteGroup().getDiscount(),
						msp: this.epaState.getCurrentInstituteGroup().getMSP(),
						pricingObj: this.epaState.getCurrentInstituteGroup().productData.prices
					};
					this.epaState.setPricing(oPricing);
					//chart display
					this._setPriceChart("idListToNetChart1", oPricing);

					this.validateMSP();
				});
				
				this.getLatestApprovalRequests(this.sCountryCode, this.sInstituteGroupId, this.sProductPackId, this.sDivision);

			}else{
				this.epaState.setNewLatestApprovalRequest();
				this.epaState.updateModel();
				this.byId("idBtnEditPricingData").setVisible(false);
			}
			
		},


		setApprovalButtonsEnabled:function(bEnabled){
			const btnSend = this.byId("idBtnSendApprovals");
			const btnRefresh = this.byId("idBtnRefreshApprovals");

			btnSend.setEnabled(bEnabled);
			btnRefresh.setEnabled(bEnabled);
		},

		getMSP: function (currentinstGroupId,sProductPackId) {
			return this.epaState.getMSP(currentinstGroupId,sProductPackId)
			.catch((error) => {
				console.error(error);
				this.getView().setBusy(false);
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
			});
		},
		
		/**
		 * Set the grouping to Mandatory or Optional on the approvals table
		 * @param {*} aApprovalRequests 
		 */
		setTableGrouping: function(aApprovalRequests){

			var mGroupFunctions = {
				MandatoryOptional: function (oContext) {
					var sApproverTypeSection = oContext.getProperty("approverTypeSection");
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


			//Get items
			var oTable = this.getView().byId("idMandatoryTable"),
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
		},

		
		refreshPriceChart: function(){

			const oPricing = {
				cif:  this.epaState.getCurrentInstituteGroup() && this.epaState.getCurrentInstituteGroup().getCIF() || 0,
				discount : this.epaState.getCurrentInstituteGroup() && this.epaState.getCurrentInstituteGroup().getDiscount() || 0,
				msp: this.epaState.getCurrentInstituteGroup() && this.epaState.getCurrentInstituteGroup().getMSP() || 0,
				pricingObj: this.epaState.getCurrentInstituteGroup() && this.epaState.getCurrentInstituteGroup().productData.prices || {}
			};

			this._setPriceChart("idListToNetChart1", oPricing);
		},

		//local method for setting pricing chart data
		_setPriceChart: function (chartId, oPricingData) {

			//princing object
			var oPrincingObject = oPricingData && oPricingData.pricingObj;

			//currency
			const sCurrency = oPricingData && oPricingData.pricingObj && oPricingData.pricingObj.currency;

			//keep min/max prices
			const iMaxMarketSalesPrice = oPrincingObject && oPrincingObject.maxMarketSalesPrice && Number(oPrincingObject.maxMarketSalesPrice.price);
			const iMinMarketSalesPrice = oPrincingObject && oPrincingObject.minMarketSalesPrice && Number(oPrincingObject.minMarketSalesPrice.price);
			const iFloorPrice = oPrincingObject && oPrincingObject.floorPrice && Number(oPrincingObject.floorPrice.price);
			const iMaxWonOfferPrice = oPrincingObject && oPrincingObject.maxWonOfferPrice && Number(oPrincingObject.maxWonOfferPrice.price);
			const iMinLostOfferPrice = oPrincingObject && oPrincingObject.minLostOfferPrice && Number(oPrincingObject.minLostOfferPrice.price);


			var oViz = this.byId(chartId);
			var dataModel = {
				"data": [{
					"PriceType": "CIF",
					"Value": oPricingData.cif,
					"Type": "Revenue"
				}, {
					"PriceType": "Discounts",
					"Value": -Math.round(oPricingData.discount * oPricingData.cif),
					"Type": "Cost"
				}, {
					"PriceType": "MSP",
					"Value": oPricingData.msp,
					"Type": "Total"
				}]
			};
			var dataJsonModel = new sap.ui.model.json.JSONModel(dataModel);

			var oDataSet = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: "Price Component",
					value: "{PriceType}"
				}, {
					name: "Type",
					value: "{Type}"
				}],
				measures: [{
					name: "Price",
					value: "{Value}"
				}],
				data: {
					path: "/data",
					model: "waterfallChartData"
				}
			});

			oViz.removeAllFeeds();
			// var scales = [{
			// 	"feed": "color",
			// 	"palette": ["#0091DF", "#66B512", "#D30f4B"]
			// }];
			// var vizScalesOption = {
			// 	replace: true
			// };
			// oViz.setVizScales(scales, vizScalesOption);
			oViz.setDataset(oDataSet);
			oViz.setModel(dataJsonModel, "waterfallChartData");
			oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
				"uid": "valueAxis",
				"type": "Measure",
				"values": ["Price"]
			}));
			oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
				"uid": "categoryAxis",
				"type": "Dimension",
				"values": ["Price Component"]
			}));
			oViz.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
				"uid": "waterfallType",
				"type": "Dimension",
				"values": ["Type"]
			}));

			//reference lines
			var aRefLines =[];
			
			//Max MSP
			if(iMaxMarketSalesPrice){
				aRefLines.push({
					value: iMaxMarketSalesPrice,
					visible: true,
					size: 1,
					type: "dotted",
					label: {
						text: "Max MSP",
						visible: true,
						background: "#0091DF",
						style:{
							color: "#ffffff"
						}
					}
				});
			}

			//Min Lost Price
			if(iMinLostOfferPrice){
				aRefLines.push({
					value: iMinLostOfferPrice,
					visible: true,
					size: 1,
					type: "solid",
					label: {
						text: "Min Lost Price",
						visible: true,
						background: "#D30f4B",
						style:{
							color: "#ffffff"
						}
					}
				});
			}

			//Max Won Price
			if(iMaxWonOfferPrice){
				aRefLines.push({
					value: iMaxWonOfferPrice,
					visible: true,
					size: 1,
					type: "solid",
					label: {
						text: "Max Won Price",
						visible: true,
						background: "#66B512",
						style:{
							color: "#ffffff"
						}
					}
				});
			}


			//Min MSP
			if(iMinMarketSalesPrice){
				aRefLines.push({
					value: iMinMarketSalesPrice,
					visible: true,
					size: 1,
					type: "dotted",
					label: {
						text: "Min MSP",
						visible: true,
						background: "#624963",
						style:{
							color: "#ffffff"
						}
					}
				});
			}


			//Floor Price
			if(iFloorPrice){
				aRefLines.push({
					value: iFloorPrice,
					visible: true,
					size: 2,
					type: "dotted",
					//color: "#666666",
					label: {
						text: "Floor Price",
						visible: true,
						background: "#FF3162",
						style:{
							color: "#ffffff"
						}
					}
				});
			}

			//add reference lines
			oViz.setVizProperties({
				title: {
					text : 'Price Representation', 
					visible : false
				},
				plotArea: {
					dataLabel: {
						visible: true
					},
					referenceLine: {
						line: {
							valueAxis: aRefLines
						}	
					},	
				},
				valueAxis: {
					title: {
						text: "Price [" + sCurrency + "]",
						visible: true
					}
				},
				categoryAxis: {
					title: {
						visible: false
					}
				}
			});
		},
	});

});