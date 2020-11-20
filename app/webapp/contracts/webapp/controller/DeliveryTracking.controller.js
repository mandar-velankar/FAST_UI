sap.ui.define([
	"./BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, MessageToast, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.bayer.tender.contracts.controller.DeliveryTracking", {
        onInit: function () {
		
			this.ctrState = this.getOwnerComponent().getState(this.getOwnerComponent().CTR);

			//get resource bundle for translations or texts
			this.oOwnerComponent = this.getOwnerComponent();
			this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
		},
		
		_onObjectMatched : function (oEvent) {
			this.sContractNumber =  oEvent.getParameter("arguments").objectId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

			// this.getModel().metadataLoaded().then( function() {
			// 	var sObjectPath = this.getModel().createKey("Contracts", {
			// 		ID :  sObjectId
			// 	});
			// 	this._bindView("/" + sObjectPath);
			// }.bind(this));

			//this.getContractDetails(this.sContractNumber, false);
			//this.ctrState.setEditEnabled();


		},

		onDeliveryItemDetail: function(oEvent){
			debugger;
		},

		onDeliveryItemSelect: function(oEvent){
			const oColumnListItem = oEvent.getParameter("listItem") || oEvent.getSource();
			const oSelectedDelivery = oColumnListItem.getBindingContext("ctr").getObject();
			const oCtrState = this.ctrState;
			
			oCtrState.setSelectedDelivery(oSelectedDelivery);

			//get delivery detail & set visible + letter detail form & hide (TODO: better way to get these elements from subpages)
			//can be replaced with method _getDeliveryDetailForm
			var oDeliveryTrackingDeliveriesView = this.getView();
			var oDelivTrackDeliveriesSubsection = oDeliveryTrackingDeliveriesView.getParent().getParent();
			var oDeliveryTrackingView = oDelivTrackDeliveriesSubsection.getParent();
			var oDetailPage = oDeliveryTrackingView.getParent();
			var oDetail = oDetailPage.getParent();
			oDetail.byId("idDelivTrackDeliveryDetailsSubsection").setVisible(true);
			oDetail.byId("idDelivTrackLetterDetailsSubSection").setVisible(false);
			//var oDetailFormDelivery = oDetail.getController().getControlFromDeliverySection("deliveryTrackingDeliveryDetailsViewId", "idDeliveryDetailForm");
			//oDetailFormDelivery.setVisible(true);
			//var oDetailFormLetter = oDetail.getController().getControlFromDeliverySection("deliveryTrackingLetterDetailsViewId", "idLetterDetailForm");
			//oDetailFormLetter.setVisible(false);

			const oLettersTable = this.getChildView("deliveryTrackingLettersViewId").byId("lettersTableID");
			oLettersTable.removeSelections();

			const oDeliveriesTable = this.getChildView("deliveryTrackingDeliveriesViewId").byId("deliveriesTableID");

			if(oDeliveriesTable.getItems()){
				var iIndex = parseInt(oEvent.getParameter("id").substring(oEvent.getParameter("id").lastIndexOf('-') + 1));

				if (oCtrState.getDeliveryItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					var oDelivery = oDeliveriesTable.getItems()[oCtrState.getDeliveryItemEdit()];
					if (oDelivery) {
						var aCells = oDelivery.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						oCtrState.setDeliveryItemEdit(-1);
					}
				}

				//now set the other line in edit mode
				var oDelivery = oDeliveriesTable.getItems()[iIndex];
				if (oDelivery) {
					var aCells = oDelivery.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", oCtrState.getEditEnabled());
					});

					oCtrState.setDeliveryItemEdit(iIndex);
				}
			}		
		},

		onLetterItemSelect: function(oEvent){
			const oColumnListItem = oEvent.getParameter("listItem") || oEvent.getSource();
			const oSelectedLetter = oColumnListItem.getBindingContext("ctr").getObject();
			const oCtrState = this.ctrState;

			oCtrState.setSelectedLetter(oSelectedLetter);

			//get delivery detail & set visible + letter detail form & hide (TODO: better way to get these elements from subpages)
			//can be replaced with method _getDeliveryLetterForm
			var oDeliveryTrackingDeliveriesView = this.getView();
			var oDelivTrackDeliveriesSubsection = oDeliveryTrackingDeliveriesView.getParent().getParent();
			var oDeliveryTrackingView = oDelivTrackDeliveriesSubsection.getParent();
			var oDetailPage = oDeliveryTrackingView.getParent();
			var oDetail = oDetailPage.getParent();
			oDetail.byId("idDelivTrackDeliveryDetailsSubsection").setVisible(false);
			oDetail.byId("idDelivTrackLetterDetailsSubSection").setVisible(true);
			//var oDetailFormLetter = oDetail.getController().getControlFromDeliverySection("deliveryTrackingLetterDetailsViewId", "idLetterDetailForm");
			//oDetailFormLetter.setVisible(true);
			//var oDetailFormDelivery = oDetail.getController().getControlFromDeliverySection("deliveryTrackingDeliveryDetailsViewId", "idDeliveryDetailForm");
			//oDetailFormDelivery.setVisible(false);

			// clear deliveries selection
			const oDeliveriesTable = this.getChildView("deliveryTrackingDeliveriesViewId").byId("deliveriesTableID");
			oDeliveriesTable.removeSelections();

			const oLettersTable = this.getChildView("deliveryTrackingLettersViewId").byId("lettersTableID");

			if(oLettersTable.getItems()){
				var iIndex = parseInt(oEvent.getParameter("id").substring(oEvent.getParameter("id").lastIndexOf('-') + 1));

				if (oCtrState.getLetterItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					var oLetter = oLettersTable.getItems()[oCtrState.getLetterItemEdit()];
					if (oLetter) {
						var aCells = oLetter.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						oCtrState.setLetterItemEdit(-1);
					}
				}

				//now set the other line in edit mode
				var oLetter = oLettersTable.getItems()[iIndex];
				if (oLetter) {
					var aCells = oLetter.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", oCtrState.getEditEnabled());
					});

					oCtrState.setLetterItemEdit(iIndex);
				}
			}
			

		},

		/**
		 * Deleting a delivery
		 * @param {*} oEvent 
		 */
		onDeleteDelivery: function(oEvent){

			const oSelectedItem = oEvent.getParameter("listItem");
			const selectedDelivery = oSelectedItem.getBindingContext("ctr").getObject();

			// only soft delete
			this.ctrState.softDeleteDelivery(selectedDelivery);

			// apply filter
			const aFilter = [];
			aFilter.push(new Filter("enabled", FilterOperator.EQ, true));
			const oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);

			this.ctrState.setDeliveryItemEdit(-1);

		},

		/**
		 * Deleting a letter
		 * @param {*} oEvent 
		 */
		onDeleteLetter: function(oEvent){

			const oSelectedItem = oEvent.getParameter("listItem");
			const selectedLetter = oSelectedItem.getBindingContext("ctr").getObject();

			// only soft delete
			this.ctrState.softDeleteLetter(selectedLetter);

			// apply filter
			const aFilter = [];
			aFilter.push(new Filter("enabled", FilterOperator.EQ, true));
			const oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);

			this.ctrState.setLetterItemEdit(-1);
		},

		onProductItemSelect: function(oEvent){
			//const oSelectedProduct = oEvent.getSource().getSelectedItem().getBindingContext("ctr").getObject();
			const oSelectedItem = oEvent.getSource() instanceof sap.m.ColumnListItem ? oEvent.getSource() : oEvent.getSource().getSelectedItem();
			const oSelectedProduct = oSelectedItem.getBindingContext("ctr").getObject();
			this.ctrState.setSelectedProduct(oSelectedProduct);

			this.clearTableSelections();		

			this._getDeliveryDetailForm().setVisible(false)
			this._getLetterDetailForm().setVisible(false)
		},

		/**
		 * clear selection on deliveries and letters tables
		 */
		clearTableSelections: function(){
			const oDeliveriesTable = this.getChildView("deliveryTrackingDeliveriesViewId").byId("deliveriesTableID");
			const oLettersTable = this.getChildView("deliveryTrackingLettersViewId").byId("lettersTableID");
			oDeliveriesTable.removeSelections();
			oLettersTable.removeSelections();
		},

		onBindingProductsFinished: function(oEvent){
			/*
			var oListProducts = this.getView().byId("idDeliveryTrackViewProductTable");

				//if table is found		
				if (!$.isEmptyObject(oListProducts)) {
					var aItems = oListProducts.getItems();
					if (aItems[0]) {

					}
				}
			*/
		},

		onAddDelivery: function(oEvent){

			var oCurrentContract = this.ctrState.getCurrentContract();
			var sInstitute = oCurrentContract.instituteId;
			var sCurrency = oCurrentContract.currency;
			var oSelectedProduct = oCurrentContract.getSelectedProduct();
			const delivery = oSelectedProduct.createNewDelivery(sInstitute, sCurrency);
			const oCtrState = this.ctrState;

			delivery.setUserAction("create");
			this.ctrState.setTemporaryDelivery(delivery);
			
			const oDeliveriesTable = this.getChildView("deliveryTrackingDeliveriesViewId").byId("deliveriesTableID");

			if(oDeliveriesTable.getItems()){
				var iIndex = parseInt(oEvent.getParameter("id").substring(oEvent.getParameter("id").lastIndexOf('-') + 1));

				if (oCtrState.getDeliveryItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					var oDelivery = oDeliveriesTable.getItems()[oCtrState.getDeliveryItemEdit()];
					if (oDelivery) {
						var aCells = oDelivery.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						oCtrState.setDeliveryItemEdit(-1);
					}
				}
			}

			this._getAddDeliveryDialog().open();

			//default enabled (could be set as disabled when you click on penalty no or compensation no)
			sap.ui.getCore().byId("idPenaltyValue").setEnabled(false);
			sap.ui.getCore().byId("idPenaltyValue").setValue();
			sap.ui.getCore().byId("idPenaltyReason").setEnabled(false);
			sap.ui.getCore().byId("idCurrency").setEnabled(false);
			sap.ui.getCore().byId("idCompensationComment").setEnabled(false);
			sap.ui.getCore().byId("idCompensated").setSelectedKey("No");
			sap.ui.getCore().byId("idPenalty").setSelectedKey("No");
		},

		onAddDeliveryDialogConfirm: function(){

			const delivery = this.ctrState.getCurrentContract().getSelectedProduct().getTemporaryDelivery();
			const bValid = this.ctrState.validateDelivery(delivery);

			if(bValid){
				this.ctrState.getCurrentContract().getSelectedProduct().addDelivery(delivery);
				this.ctrState.setSelectedDelivery(delivery);

				this.ctrState.getCurrentContract().getSelectedProduct().removeTemporaryDelivery();

				this._getAddDeliveryDialog().close();
				this._getDeliveryDetailForm().setVisible(true);

				this._getDeliveryDetailForm().setVisible(false);
			}else{
				sap.m.MessageBox.error("Please enter all the mandatory fields.");
			}
		},

		onAddDeliveryDialogCancel: function(oEvent){
			this.ctrState.getCurrentContract().getSelectedProduct().removeTemporaryDelivery();
			this._getAddDeliveryDialog().close();
		},

		onConfirmDelivery: function(oEvent){

			if(this.ctrState.validateDelivery(this.ctrState.getCurrentContract().getSelectedProduct().getSelectedDelivery())){
				const oDeliveriesTable = this.getChildView("deliveryTrackingDeliveriesViewId").byId("deliveriesTableID");
				oDeliveriesTable.removeSelections();

				this._getDeliveryDetailForm().setVisible(false);

				if (oDeliveriesTable && this.ctrState.getDeliveryItemEdit() !== -1) {
					var oRow = oDeliveriesTable.getItems()[this.ctrState.getDeliveryItemEdit()];
					if (oRow) {
						var aCells = oRow.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});
						this.ctrState.setDeliveryItemEdit(-1);
					}
				}
			} else {
				sap.m.MessageBox.error("Please enter all the mandatory fields.");
			}
		},

		onConfirmLetter: function(oEvent){

			if(this.ctrState.validateLetter(this.ctrState.getCurrentContract().getSelectedProduct().getSelectedLetter())){
				const oLettersTable = this.getChildView("deliveryTrackingLettersViewId").byId("lettersTableID");
				oLettersTable.removeSelections();

				this._getLetterDetailForm().setVisible(false);

				if(oLettersTable.getItems()){
					var iIndex = parseInt(oEvent.getParameter("id").substring(oEvent.getParameter("id").lastIndexOf('-') + 1));

					if (this.ctrState.getLetterItemEdit() !== -1) {
						//another line is currently in edit mode. Set this back to display first.
						var oLetter = oLettersTable.getItems()[this.ctrState.getLetterItemEdit()];
						if (oLetter) {
							var aCells = oLetter.getCells();
							aCells.forEach(function (oCell, index) {
								oCell.setProperty("enabled", false);
							});

							this.ctrState.setLetterItemEdit(-1);
						}
					}
				}
			} else {
				sap.m.MessageBox.error("Please enter all the mandatory fields.");
			}
		},

		_getAddDeliveryDialog : function () {
			if (!this._oAddDeliveryDialog) {
				this._oAddDeliveryDialog = sap.ui.xmlfragment("com.bayer.tender.contracts.view.fragments.AddDelivery", this);
			  	this.getView().addDependent(this._oAddDeliveryDialog);
			}
			return this._oAddDeliveryDialog;
		},

		_getDeliveryDetailForm: function (){
			//get delivery detail & set visible + letter detail form & hide (TODO: better way to get these elements from subpages)
			if(!this._oDeliveryDetailForm){
				var oDeliveryTrackingDeliveriesView = this.getView();
				var oDelivTrackDeliveriesSubsection = oDeliveryTrackingDeliveriesView.getParent().getParent();
				var oDeliveryTrackingView = oDelivTrackDeliveriesSubsection.getParent();
				var oDetailPage = oDeliveryTrackingView.getParent();
				var oDetail = oDetailPage.getParent();
				this._oDeliveryDetailForm = oDetail.byId("idDelivTrackDeliveryDetailsSubsection");
			}
			return this._oDeliveryDetailForm;
		},

		_getLetterDetailForm: function (){
			//get delivery detail & set visible + letter detail form & hide (TODO: better way to get these elements from subpages)
			if(!this._oLetterDetailForm){
				var oDeliveryTrackingLettersView = this.getView();
				var oDelivTrackLettersSubsection = oDeliveryTrackingLettersView.getParent().getParent();
				var oDeliveryTrackingView = oDelivTrackLettersSubsection.getParent();
				var oDetailPage = oDeliveryTrackingView.getParent();
				var oDetail = oDetailPage.getParent();
				this._oLetterDetailForm = oDetail.byId("idDelivTrackLetterDetailsSubSection");
			}
			return this._oLetterDetailForm;
		},

		getChildView: function(sViewName){
			if(sViewName){
				return this.getView().getParent().getParent().getParent().getParent().getParent().byId(sViewName);
			}
		},

		//when penalty is set to true or false
		onChangePenalty: function(oEvent) {
			//get selected value
			var oPenaltyDrop = oEvent.getSource();
			var sPenalty = oPenaltyDrop.getSelectedItem().getKey();
			
			//get cells from same row as oOutcomeDrop
			if (oEvent.getSource().sId == 'idPenalty'){
				var oPenaltyValue = sap.ui.getCore().byId("idPenaltyValue");
				var oPenaltyCurr  = sap.ui.getCore().byId("idCurrency");
				var oPenaltyReason = sap.ui.getCore().byId("idPenaltyReason");              
				if ( sPenalty === "true" ){
					oPenaltyValue.setProperty("enabled", true);
					oPenaltyCurr.setProperty("enabled", true);
					oPenaltyReason.setProperty("enabled", true); 
				} else {
					oPenaltyValue.setProperty("enabled", false);
					oPenaltyValue.setValue("");
					oPenaltyCurr.setProperty("enabled", false);
					oPenaltyCurr.setSelectedKey("");
					oPenaltyReason.setProperty("enabled", false);
					oPenaltyReason.setSelectedKey("");
				}
			}
		},
		
		//when compensated is set to true or false
		onChangeCompensated: function(oEvent) {
			//get selected value
			var oCompensatedDrop = oEvent.getSource();
			var sCompensated = oCompensatedDrop.getSelectedItem().getKey();
			
			if (oEvent.getSource().sId != 'idCompensated'){
				var oCompensationComment = this.byId("idDeliveryDetailCompensationComment").setValue("");
				oCompensationComment.setValue("");
			} else {
				var oCompensationComment = sap.ui.getCore().byId("idCompensationComment");	
				if ( sCompensated === "Yes" ) {
					oCompensationComment.setProperty("enabled", true);
				} else {
					oCompensationComment.setValue("");
					oCompensationComment.setProperty("enabled", false);
				}
			}
		},

		onAddLetter: function(oEvent){
			var oCurrentContract = this.ctrState.getCurrentContract();
			var sInstitute = oCurrentContract.instituteId;
			const letter = this.ctrState.getCurrentContract().getSelectedProduct().createNewLetter(sInstitute);
			const oCtrState = this.ctrState;

			letter.setUserAction("create");
			this.ctrState.setTemporaryLetter(letter);

			const oLettersTable = this.getChildView("deliveryTrackingLettersViewId").byId("lettersTableID");

			if(oLettersTable.getItems()){
				var iIndex = parseInt(oEvent.getParameter("id").substring(oEvent.getParameter("id").lastIndexOf('-') + 1));

				if (oCtrState.getLetterItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					var oLetter = oLettersTable.getItems()[oCtrState.getLetterItemEdit()];
					if (oLetter) {
						var aCells = oLetter.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						oCtrState.setLetterItemEdit(-1);
					}
				}
			}

			this._getAddLetterDialog().open();
		},

		onAddLetterDialogConfirm: function(){

			const letter = this.ctrState.getCurrentContract().getSelectedProduct().getTemporaryLetter();
			const bValid = this.ctrState.validateLetter(letter);

			if(bValid){
				this.ctrState.getCurrentContract().getSelectedProduct().addLetter(letter);
				this.ctrState.setSelectedLetter(letter);

				this.ctrState.getCurrentContract().getSelectedProduct().removeTemporaryLetter();

				this._getAddLetterDialog().close();
				this._getLetterDetailForm().setVisible(false);
			}else{
				sap.m.MessageBox.error("Please enter all the mandatory fields.");
			}
		},

		onAddLetterDialogCancel: function(oEvent){
			this.ctrState.getCurrentContract().getSelectedProduct().removeTemporaryLetter();
			this._getAddLetterDialog().close();
		}, 

		_getAddLetterDialog : function () {
			if (!this._oAddLetterDialog) {
				this._oAddLetterDialog = sap.ui.xmlfragment("com.bayer.tender.contracts.view.fragments.AddLetter", this);
			  	this.getView().addDependent(this._oAddLetterDialog);
			}
			return this._oAddLetterDialog;
		},
    
    });
});