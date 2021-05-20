sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min"
], function (Controller, MessageToast, formatter, Services, UserInfo, MomentJS) {
	"use strict";

	return Controller.extend("FAST_NS0FAST0.controller.DeliveryTracking", {

		//Formatting functions
		formatter: formatter,

		onInit: function () {

			//get resource bundle for translations or texts
			this.oOwnerComponent = this.getOwnerComponent();
			this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			//keep router and model locally in this controller
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			
			this.oDetailView = sap.ui.getCore().byId(this.getView().getId().split("---")[0]+"---tenderManagementDetailId");
			this.ODetailController = this.oDetailView.getController();

			Services.setRouterObject(this.oRouter);

			//attach the onTenderMatched method to handle routing between pages + load correct data
			this.oRouter.getRoute("master").attachPatternMatched(this._onTenderMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onTenderMatched, this);

		},

		//Navigation between TenderMaster & Detail pages routing is matched
		_onTenderMatched: function (oEvent) {

			var sTab = oEvent.getParameter("arguments").tab || "";
			let that = this;

			// check if we are on the delivery tab, otherwise don't run the code after the if statement
			if (sTab !== Services.getDeliveryTrackingPageSectionID()) {
				return;
			}

			
			//get the tenderID/country from the navigation parameters
			var sTenderID = oEvent.getParameter("arguments").tender;
			var sCountry = oEvent.getParameter("arguments").country || "NA"; // if country is found in the link.. use NA
			var sOfferID = oEvent.getParameter("arguments").offer;
			
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

			//remove delivery table if it exists
			this._removeDeliveryTableFragment();

			//show delivery / purchase order table
			let oSubsection = this.getView().byId('DelivTrackDeliveriesSubsection');
			let oFragmentName = 'FAST_NS0FAST0.view.fragments.' + Services.getFastAppDataModel().getProperty('/permissions/fragments/deliveryTrackingId/fragment') ; //+ Services.getFastAppDataModel().getProperty('/permissions/fragments/deliveryTrackingId/fragment');
			sap.ui.core.Fragment.load({ type: 'XML',
										name: oFragmentName,
										id: 'deliveryTableFragment',
										controller: this
									  }).then(function(oFragment){
										  	oSubsection.addBlock(oFragment);
									   });
		},

		_removeDeliveryTableFragment: function(){
			//destroy the table
			let oTable = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableID');
			let oToolbar = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableToolbarId');
			let oSubsection = this.getView().byId('DelivTrackDeliveriesSubsection');

			if(oTable && oToolbar && oSubsection){
				oTable.destroy();
				oToolbar.destroy();
				oSubsection.removeAllBlocks();
			}
		},

		//when items are bound and displayed on the view, we should select the first item
		onBindingItemsFinished: function (oEvent) {

			var that = this;
			var sSelectedSection = Services.getDeliveryTrackingPageSectionID();

			//check the page we are on, only for finacial offer page this is applicable 
			//+ not if navigate back to the tender master page (so selectedtender is back to PT_TMTEND)
			if (Services.getSelectedTenderPath() !== '/PT_TMTEND' && sSelectedSection === Services.getDeliveryTrackingPageSectionID()) {

				var oListProducts = {};

				//depending on the tab we are on.. we should select first product of table
				switch (sSelectedSection) {
					// case Services.getFinancialOfferPageSectionID():
					// 	oListProducts = this.getView().byId("idFinancialOfferViewProduct");
					// 	break;
				case Services.getDeliveryTrackingPageSectionID():
					oListProducts = this.getView().byId("idDeliveryTrackViewProduct");
					break;
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
							// case Services.getFinancialOfferPageSectionID():
							// 	that.onFinancialOfferProductItemPress(oEvent, sProductPath);
							// 	break;
							case Services.getDeliveryTrackingPageSectionID():
								that.onDeliveryTrackProductItemSelect();
								break;
							}

						}
					}

				}
			}
		},

		//When you click on one of the offers, we should load the relating Products
		onDelivryTrackingOfferPress: function (oEvent) {

			var that = this;

			//get the selected offerID
			var sSelectedOfferID = Services.getSelectedOfferID();

			//if you click on an offer it is available (sometimes it is not availble when you switch between tabs)
			Services.setSelectedOfferAvailable(true);

			//get products that are loaded
			var aProducts = Services.getLoadedProductsForOffer(sSelectedOfferID);

			//set to fastappdata model for easy access on the view
			var oFastAppDataModel = Services.getFastAppDataModel();
			oFastAppDataModel.setProperty("/ProductsForOffer/", aProducts);

			//set selected product to null
			var oProduct = {};
			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/", oProduct);

			that.byId("idDeliveryDetailSection").setVisible(false);
			that.byId("idLetterDetailSection").setVisible(false);
			Services.setDeliveryItemEdit(-1);

		},

		//delivery Product selected
		onDeliveryTrackProductItemSelect: function (oEvent) {

			//declaration
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			//get selected offer
			var sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID);

			//Get selected ProductPath
			var oTable = this.byId("idDeliveryTrackViewProduct");
			var sSelectedProductPath = '/ProductsForOffer/results/' + oTable.indexOfItem(oTable.getSelectedItem());
			Services.setSelectedProductPath(sSelectedProductPath);

			//Get the Product info
			var oProduct = this.getView().getModel("fastAppData").getProperty(sSelectedProductPath);

			//keep selected product in services for easy access
			Services.setSelectedProductID(oProduct.ProductCode);
			Services.setSelectedProductName(oProduct.SKU.PRODUCTPACKNAME);

			//set selected product with empty array if no deliveries exist
			if (oProduct.Deliveries === null) {
				oProduct.Deliveries = {};
				oProduct.Deliveries.results = [];
			}

			//set selected product with empty array if no deliveries exist
			if (oProduct.Letters === null) {
				oProduct.Letters = {};
				oProduct.Letters.results = [];
			}

			//don't show the delivery detail form
			that.byId("idDeliveryDetailSection").setVisible(false);

			//Keep info of selectedDeliverie Product
			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/", oProduct);

			//set dynamic binding to dropdownfields only for financial offer page
			if (oOffer) {

				var sCountry = Services.getSelectedCountry();
				var oCurrency = that.byId("idCurrency"); //get the currency field from the 

				//if currency is set on offer, we should disable the selection of the currency
				if (oOffer.Currency && oOffer.Currency !== "NULL") {
					// oCurrency.setEnabled(false); testing
				} else {
					// oCurrency.setEnabled(true); testing
				}

				//load currency for country (dropdown)
				$.when(Services.loadCountryCurrency(sCountry)).done(function (oTenderData) {

				});

				//load penalty reasons (dropdown)
				$.when(Services.loadPenaltyReasons()).done(function (oTenderData) {

				});

			}

		},

		//When you click on add purchase order
		onAddPurchaseOrder: function (oEvent) {

			//distributor id is set on page form and should be used (instead of requested) when adding product
			//payment terms and inco terns should set based on information in view providing product
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();

			var oTableDeliveries = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableID');

			if (oTableDeliveries && Services.getDeliveryItemEdit() != -1) {
				var oFastAppDataModel = Services.getFastAppDataModel();
				var oSelectedItem = oTableDeliveries.getItems()[Services.getDeliveryItemEdit()];

				if (oSelectedItem) {
					var aCells = oSelectedItem.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", false);
					});

					Services.setDeliveryItemEdit(-1);
					that.byId("idDeliveryDetailSection").setVisible(false);
				}
			}

			if (!that._oDailogPurchaseOrder) {
				that._oDailogPurchaseOrder = new sap.m.Dialog("addPurchaseOrderDialog", {
					title: that.oBundle.getText("Add Purchase Order"),
					buttons: [new sap.m.Button({
							text: that.oBundle.getText("Add Purchase Order"),
							tap: [that.onAddPurchaseOrderDialogConfirm, that]

						}),
						new sap.m.Button({
							text: that.oBundle.getText("Cancel"),
							tap: [that.onCancelAddPurchaseOrder, that]
						})
					],
					//content with all fields that need to be filled
					content: [sap.ui.xmlfragment("FAST_NS0FAST0.fragments.AddPurchaseOrder", that)]
						// End of content of dialog
				});

			}

			that.getView().addDependent(that._oDailogPurchaseOrder);
			that._oDailogPurchaseOrder.open();

			//empty delivery
			var oEmptyDelivery = Services.getService('Delivery').getEmptyDelivery();

			//give values to empty object
			oEmptyDelivery.TenderID = Services.getSelectedTenderID();
			oEmptyDelivery.OfferID = Services.getSelectedOfferID();
			oEmptyDelivery.CountryCode = Services.getCountryCodeofSelectedTender();
			oEmptyDelivery.ProductCode = Services.getSelectedProductID();
			oEmptyDelivery.SKUCode = Services.getSelectedProductID();
			oEmptyDelivery.SubmittedOn = moment().utc().toDate();
			oEmptyDelivery.SubmittedBy = UserInfo.getCWID();
			oEmptyDelivery.Active = 1;
			oEmptyDelivery.PaidOrFree = "Paid";
			oEmptyDelivery.LocalOrDirectDelivery = "Direct";
			oEmptyDelivery.PlannedInAPO = "Yes";
			oEmptyDelivery.Contract = "Yes";
			oEmptyDelivery.RequestedQuantity = oFastAppDataModel.getProperty('/SelectedDeliverieProduct/RequestedVolume');
			oEmptyDelivery.Penalty = "";
			oEmptyDelivery.Compensated = "";
			oEmptyDelivery.UndertakingLetters = "";

			//set binding of empty delivery to dialog binding
			Services.getFastAppDataModel().setProperty("/EditDelivery/", oEmptyDelivery);

		},

		//When you confirm adding a new deliverie
		onAddPurchaseOrderDialogConfirm: function (oEvent) {

			//Delivery is added
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oAddDelivery = oFastAppDataModel.getProperty("/EditDelivery/");
			var that = this;

			//Check for mandatory fields
			//Check for mandatory fields
			if (!oAddDelivery.PoDate ||
				!oAddDelivery.ActualDeliveryQuantity ||
				!oAddDelivery.Contract ||
				!oAddDelivery.PO
			) {

				//check mandatory fields
				sap.m.MessageBox.error("Please enter all the mandatory fields.");

			} else {

				var aDeliveries = oFastAppDataModel.getProperty("/SelectedDeliverieProduct/Deliveries/results/");
				aDeliveries.push(oAddDelivery);

				oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Deliveries/results/", aDeliveries);

				//oFastAppDataModel.updateBindings(true);
				//close the dialog
				this._oDailogPurchaseOrder.close();

			}

		},

		//When you click on add deliverie
		onAddDeliverie: function (oEvent) {

			//distributor id is set on page form and should be used (instead of requested) when adding product
			//payment terms and inco terns should set based on information in view providing product
			var that = this;

			var oTableDeliveries = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableID');

			if (oTableDeliveries && Services.getDeliveryItemEdit() != -1) {
				var oFastAppDataModel = Services.getFastAppDataModel();
				var oSelectedItem = oTableDeliveries.getItems()[Services.getDeliveryItemEdit()];

				if (oSelectedItem) {
					var aCells = oSelectedItem.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", false);
					});

					Services.setDeliveryItemEdit(-1);
					that.byId("idDeliveryDetailSection").setVisible(false);
				}
			}

			if (!that._oDialogDeliverie) {
				that._oDialogDeliverie = new sap.m.Dialog("addDeliverieDialog", {
					title: that.oBundle.getText("Add Delivery"),
					buttons: [new sap.m.Button({
							text: that.oBundle.getText("Add Delivery"),
							tap: [that.onAddDeliverieDialogConfirm, that]

						}),
						new sap.m.Button({
							text: that.oBundle.getText("Cancel"),
							tap: [that.onCancelAddDeliverie, that]
						})
					],
					//content with all fields that need to be filled
					content: [sap.ui.xmlfragment("FAST_NS0FAST0.fragments.AddDelivery", that)]
						// End of content of dialog
				});

			}

			that.getView().addDependent(that._oDialogDeliverie);
			that._oDialogDeliverie.open();

			//empty delivery
			var oEmptyDelivery = Services.getService('Delivery').getEmptyDelivery();

			//give values to empty object
			oEmptyDelivery.TenderID = Services.getSelectedTenderID();
			oEmptyDelivery.OfferID = Services.getSelectedOfferID();
			oEmptyDelivery.CountryCode = Services.getCountryCodeofSelectedTender();
			oEmptyDelivery.ProductCode = Services.getSelectedProductID();
			oEmptyDelivery.SKUCode = Services.getSelectedProductID();
			oEmptyDelivery.SubmittedOn = moment().utc().toDate();
			oEmptyDelivery.SubmittedBy = UserInfo.getCWID();
			oEmptyDelivery.Active = 1;

			//set binding of empty delivery to dialog binding
			Services.getFastAppDataModel().setProperty("/EditDelivery/", oEmptyDelivery);

			//default enabled (could be set as disabled when you click on penalty no or compensation no)
			sap.ui.getCore().byId("idPenaltyValue").setEnabled(false);
			sap.ui.getCore().byId("idPenaltyReason").setEnabled(false);
			sap.ui.getCore().byId("idCurrency").setEnabled(false);
			sap.ui.getCore().byId("idCompensationComment").setEnabled(false);

		},
		
			//when penalty is set to true or false
		onChangePenalty: function(oEvent) {
			//get selected value
			var oPenaltyDrop = oEvent.getSource();
			var sPenalty = oPenaltyDrop.getSelectedItem().getKey();
			
			//get cells from same row as oOutcomeDrop
			if (oEvent.getSource().sId != 'idPenalty'){
				//if penalty is yes, value for penalty is enabled, else not
				if ( sPenalty === "No" ) {
					this.byId("idDeliveryDetailPenaltyReason").setSelectedKey("");
					this.byId("idDeliveryDetailPenaltyCurrency").setSelectedKey("");
					this.byId("idPenaltyValueTab").setValue("");
				}
			} else {
				var oPenaltyValue = sap.ui.getCore().byId("idPenaltyValue");
				var oPenaltyCurr  = sap.ui.getCore().byId("idCurrency");
				var oPenaltyReason = sap.ui.getCore().byId("idPenaltyReason");              
				if ( sPenalty === "Yes" ){
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

		//When you confirm adding a new deliverie
		onAddDeliverieDialogConfirm: function (oEvent) {

			//Delivery is added
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oAddDelivery = oFastAppDataModel.getProperty("/EditDelivery/");
			var that = this;

			//Check for mandatory fields
			//Check for mandatory fields
			if (!oAddDelivery.LocalOrDirectDelivery ||
				!oAddDelivery.PlannedInAPO ||
				!oAddDelivery.RequestedDeliveryDate ||
				!oAddDelivery.RequestedQuantity ||
				!oAddDelivery.ActualDeliveryDate ||
				!oAddDelivery.ActualDeliveryQuantity ||
				!oAddDelivery.Penalty ||
				!oAddDelivery.UndertakingLetters ||
				!oAddDelivery.Compensated ||
				!oAddDelivery.ProductCode ||
				!oAddDelivery.PaidOrFree ||
				(oAddDelivery.Penalty === 'Yes' && (!oAddDelivery.Currency || !oAddDelivery.PenaltyValue || !oAddDelivery.PenaltyReason)) ||
				(oAddDelivery.Compensated === 'Yes' && !oAddDelivery.CompensationComment)
			) {

				//check mandatory fields
				sap.m.MessageBox.error("Please enter all the mandatory fields.");

			} else {

				var aDeliveries = oFastAppDataModel.getProperty("/SelectedDeliverieProduct/Deliveries/results/");
				aDeliveries.push(oAddDelivery);

				oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Deliveries/results/", aDeliveries);

				//oFastAppDataModel.updateBindings(true);
				//close the dialog
				this._oDialogDeliverie.close();

			}

		},

		//When you cancel the adding of a new deliverie
		onCancelAddDeliverie: function (oEvent) {

			//close the dialog
			this._oDialogDeliverie.close();

		},

		onCancelAddPurchaseOrder: function (oEvent){
			this._oDailogPurchaseOrder.close();
		},

		//whe you click on delete deliverie
		onDeleteDeliverie: function (oEvent) {
			var that = this;

			var oFastAppDataModel = Services.getFastAppDataModel();
			var oTableDeliveries = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableID');
			var aSelectedItem = oEvent.getParameter("listItem");
			var sPathSelectedDelivery = aSelectedItem.getBindingContextPath();
			var iIndex = parseInt(sPathSelectedDelivery.substring(sPathSelectedDelivery.lastIndexOf('/') + 1));

			var aDeliveries = Services.getFastAppDataModel().getProperty('/SelectedDeliverieProduct/Deliveries/results/');
			var oItem = Services.getFastAppDataModel().getProperty(sPathSelectedDelivery);

			if (oItem && oItem._sOperation === "PUT") {
				oItem._sOperation = 'DELETE';
			} else {
				//group purchasing for this institute does not exists in the back-end tables
				//so we can delete it without deleting it in back-end during save
				aDeliveries.splice(iIndex, 1);
			}

			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Deliveries/results/", aDeliveries);

			//update bindings other wise filtering on DELETE is not applied for new binding
			oFastAppDataModel.updateBindings(true);
			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Deliveries/results/", aDeliveries);

			that.byId("idDeliveryDetailSection").setVisible(false);
			Services.setDeliveryItemEdit(-1);
		},

		onDeliveryItemDetail: function (oEvent) {
			var that = this;
			var oTableDeliveries = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableID');

			if (oTableDeliveries) {
				var oFastAppDataModel = Services.getFastAppDataModel();
				var aDeliveries = oTableDeliveries.getItems();
				var sPathSelectedItem = oEvent.getSource().getBindingContextPath();
				var oSelectedItem = oFastAppDataModel.getProperty(sPathSelectedItem);
				var iIndex = parseInt(sPathSelectedItem.substring(sPathSelectedItem.lastIndexOf('/') + 1));
				var oCountry = Services.getSelectedCountry();

				if (oSelectedItem && oCountry != 'CL') {
					this.byId("idDeliveryDetailForm").bindElement({
						path: sPathSelectedItem,
						model: "fastAppData"
					});
					this.byId("idDeliveryDetailForm").setVisible(true);
				}

				if (Services.getDeliveryItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					var oRow = oTableDeliveries.getItems()[Services.getDeliveryItemEdit()];
					if (oRow) {
						var aCells = oRow.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						Services.setDeliveryItemEdit(-1);
					}
				}

				//now set the other line in edit mode
				var oRow = oTableDeliveries.getItems()[iIndex];
				if (oRow) {
					var aCells = oRow.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", Services.getEditMode());
					});

					Services.setDeliveryItemEdit(iIndex);
				}
			}
			if (oCountry != 'CL') {
				that.byId("idDeliveryDetailSection").setVisible(true);
			}
		},

		onDeliveryItemSelect: function (oEvent) {
			var that = this;
			var oTableDeliveries = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableID');

			if (oTableDeliveries) {
				var oFastAppDataModel = Services.getFastAppDataModel();
				var aDeliveries = oTableDeliveries.getItems();
				var aSelectedItem = oEvent.getParameter("listItem");
				var sPathSelectedItem = aSelectedItem.getBindingContext('fastAppData').sPath;
				var iIndex = parseInt(sPathSelectedItem.substring(sPathSelectedItem.lastIndexOf('/') + 1));
				var oSelectedItem = oFastAppDataModel.getProperty(sPathSelectedItem);
				var oCountry = Services.getSelectedCountry();

				if (aDeliveries[iIndex] && oSelectedItem) {

					if(oCountry !== 'CL'){
						this.byId("idDeliveryDetailForm").bindElement({
							path: sPathSelectedItem,
							model: "fastAppData"
						});
						this.byId("idDeliveryDetailForm").setVisible(true);
					}

					oTableDeliveries.setSelectedItem(aDeliveries[iIndex], true);
					aDeliveries[iIndex].setSelected(true);
					aDeliveries[iIndex].setActive(true);
				}

				if (Services.getDeliveryItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					var oRow = oTableDeliveries.getItems()[Services.getDeliveryItemEdit()];
					if (oRow) {
						var aCells = oRow.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						Services.setDeliveryItemEdit(-1);
					}
				}

				//now set the other line in edit mode
				var oRow = oTableDeliveries.getItems()[iIndex];
				if (oRow) {
					var aCells = oRow.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", Services.getEditMode());
					});

					Services.setDeliveryItemEdit(iIndex);
				}
			}

			if(oCountry !== 'CL'){
				that.byId("idDeliveryDetailSection").setVisible(true);
			}
		},

		onCancelDeliveryEdit: function (oEvent) {
			var that = this;
			var oTableDeliveries = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableID');
			var oCountry = Services.getSelectedCountry();
			
			//switch to correct view edit/display
			that.ODetailController.onEditToggleButtonPress();
			if(oCountry !== 'CL'){
				that.byId("idDeliveryDetailSection").setVisible(false);
			}

			if (oTableDeliveries && Services.getDeliveryItemEdit() !== -1) {
				var oRow = oTableDeliveries.getItems()[Services.getDeliveryItemEdit()];
				if (oRow) {
					var aCells = oRow.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", Services.getEditMode());
					});

					Services.setDeliveryItemEdit(-1);
				}
			}
		},

		onConfirmDelivery: function (oEvent) {
			var that = this;
			var oTableDeliveries = sap.ui.core.Fragment.byId('deliveryTableFragment', 'deliveriesTableID');
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oDelivery = oFastAppDataModel.getProperty("/SelectedDeliverieProduct/Deliveries/results/" + Services.getDeliveryItemEdit());

			//TODO: implement this on save method
			if (!oDelivery.PlannedInAPO ||
				!oDelivery.RequestedDeliveryDate ||
				!oDelivery.RequestedQuantity ||
				!oDelivery.ActualDeliveryDate ||
				!oDelivery.ActualDeliveryQuantity ||
				!oDelivery.Penalty ||
				!oDelivery.UndertakingLetters ||
				!oDelivery.Compensated ||
				!oDelivery.ProductCode ||
				!oDelivery.PaidOrFree ||
				(oDelivery.Penalty === 'Yes' && (!oDelivery.PenaltyReason || !oDelivery.Currency || !oDelivery.PenaltyValue)) ||
				(oDelivery.Compensated === 'Yes' && !oDelivery.CompensationComment)) {
				sap.m.MessageBox.error("Please enter all the mandatory fields.");
			} else {
				that.byId("idDeliveryDetailSection").setVisible(false);

				if (oTableDeliveries && Services.getDeliveryItemEdit() !== -1) {
					var oRow = oTableDeliveries.getItems()[Services.getDeliveryItemEdit()];
					if (oRow) {
						var aCells = oRow.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						Services.setDeliveryItemEdit(-1);
					}
				}
			}
		},

		//When you click on add letter
		onAddLetter: function (oEvent) {

			//distributor id is set on page form and should be used (instead of requested) when adding product
			//payment terms and inco terns should set based on information in view providing product
			var that = this;

			var oTableLetters = this.byId("lettersTableID");

			if (oTableLetters && Services.getLetterItemEdit() != -1) {
				var oFastAppDataModel = Services.getFastAppDataModel();
				var oSelectedItem = oTableLetters.getItems()[Services.getLetterItemEdit()];

				if (oSelectedItem) {
					var aCells = oSelectedItem.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", false);
					});

					Services.setLetterItemEdit(-1);
					that.byId("idLetterDetailSection").setVisible(false);
				}
			}

			if (!this._oDialogLetter) {
				this._oDialogLetter = new sap.m.Dialog("addLetterDialog", {
					title: that.oBundle.getText("Add Letter"),
					buttons: [new sap.m.Button({
							text: that.oBundle.getText("Add Letter"),
							tap: [this.onAddLetterDialogConfirm, that]

						}),
						new sap.m.Button({
							text: that.oBundle.getText("Cancel"),
							tap: [this.onCancelAddLetter, that]
						})

					],
					//content with all fields that need to be filled
					content: [sap.ui.xmlfragment("FAST_NS0FAST0.fragments.AddLetter", that)]
						// End of content of dialog
				});
			}
			this.getView().addDependent(this._oDialogLetter);
			this._oDialogLetter.open();

			var oEmptyLetter = Services.getService('Letter').getEmptyLetter();
			oEmptyLetter.TENDERID = Services.getSelectedTenderID();
			oEmptyLetter.OFFERID = Services.getSelectedOfferID();
			oEmptyLetter.COUNTRYCODE = Services.getCountryCodeofSelectedTender();
			oEmptyLetter.SKUCODE = Services.getSelectedProductID();
			oEmptyLetter.SUBMITTEDON = moment().utc().toDate();
			oEmptyLetter.SUBMITTEDBY = UserInfo.getCWID();
			oEmptyLetter.ACTIVE = 1;

			Services.getFastAppDataModel().setProperty("/EditLetter", oEmptyLetter);
		},

		//When you confirm adding a new deliverie
		onAddLetterDialogConfirm: function (oEvent) {

			//that is this
			var that = this;

			//an empty array of deliveries is created
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oAddLetter = oFastAppDataModel.getProperty("/EditLetter/");

			//Check for mandatory fields
			if (!oAddLetter.REASONFORLETTER ||
				!oAddLetter.QUANTITY ||
				!oAddLetter.BATCH ||
				!oAddLetter.MANUFACTURINGDATE ||
				!oAddLetter.EXPIRYDATE ||
				!oAddLetter.RETURNDATE ||
				!oAddLetter.RETURNEDQTY ||
				oAddLetter.RETURNEDQTY === "" ||
				!oAddLetter.UOM
			) {

				//check mandatory fields
				sap.m.MessageBox.error("Please enter all the mandatory fields.");

			} else {
				/*
				//Adding the product to be saved later on + added to FastDataModel for binding
				//We use POST to indicate that the product does not exist yet in the database
				Services.addLetterSaveInfo(oAddLetter, "POST");

				//table binding with the seleced offer
				Services.addNewLettersToFastAppDataModel();
				*/

				//oAddLetter._sOperation = 'POST';
				var aLetters = oFastAppDataModel.getProperty("/SelectedDeliverieProduct/Letters/results/");
				aLetters.push(oAddLetter);
				oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Letters/results/", aLetters);

				//close the dialog
				this._oDialogLetter.close();
			}

		},

		onConfirmLetter: function (oEvent) {
			var that = this;
			var oTableLetters = this.byId("lettersTableID");
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oLetter = oFastAppDataModel.getProperty("/SelectedDeliverieProduct/Letters/results/" + Services.getLetterItemEdit());

			//TODO: implement this on save method
			if (!oLetter.REASONFORLETTER ||
				!oLetter.QUANTITY ||
				!oLetter.BATCH ||
				!oLetter.MANUFACTURINGDATE ||
				!oLetter.EXPIRYDATE ||
				!oLetter.RETURNDATE ||
				!oLetter.RETURNEDQTY ||
				!oLetter.UOM) {
				sap.m.MessageBox.error("Please enter all the mandatory fields.");
			} else {
				that.byId("idLetterDetailSection").setVisible(false);

				if (oTableLetters && Services.getLetterItemEdit() !== -1) {
					var oRow = oTableLetters.getItems()[Services.getLetterItemEdit()];
					if (oRow) {
						var aCells = oRow.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						Services.setLetterItemEdit(-1);
					}
				}
			}
		},

		//When you cancel the adding of a new deliverie
		onCancelAddLetter: function (oEvent) {

			//close the dialog
			this._oDialogLetter.close();

		},

		//when you click on delete letter
		onDeleteLetter: function (oEvent) {
			var that = this;
			var oFastAppDataModel = Services.getFastAppDataModel();
			var oTableLetters = this.byId("lettersTableID");
			var aSelectedItem = oEvent.getParameter("listItem");
			var sPathSelectedLetter = aSelectedItem.getBindingContextPath();
			var iIndex = parseInt(sPathSelectedLetter.substring(sPathSelectedLetter.lastIndexOf('/') + 1));

			var aLetters = Services.getFastAppDataModel().getProperty('/SelectedDeliverieProduct/Letters/results/');
			var oItem = Services.getFastAppDataModel().getProperty(sPathSelectedLetter);

			if (oItem && oItem._sOperation === "PUT") {
				oItem._sOperation = 'DELETE';
			} else {
				//group purchasing for this institute does not exists in the back-end tables
				//so we can delete it without deleting it in back-end during save
				aLetters.splice(iIndex, 1);
			}

			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Letters/results/", aLetters);

			//update bindings other wise filtering on DELETE is not applied for new binding
			oFastAppDataModel.updateBindings(true);
			oFastAppDataModel.setProperty("/SelectedDeliverieProduct/Letters/results/", aLetters);

			that.byId("idLetterDetailSection").setVisible(false);
			Services.setLetterItemEdit(-1);
		},

		onLetterItemDetail: function (oEvent) {
			var that = this;
			var oTableLetters = this.byId("lettersTableID");

			if (oTableLetters) {
				var oFastAppDataModel = Services.getFastAppDataModel();
				var aLetters = oTableLetters.getItems();
				var sPathSelectedItem = oEvent.getSource().getBindingContextPath();
				var oSelectedItem = oFastAppDataModel.getProperty(sPathSelectedItem);
				var iIndex = parseInt(sPathSelectedItem.substring(sPathSelectedItem.lastIndexOf('/') + 1));

				if (oSelectedItem) {
					this.byId("idLetterDetailSection").bindElement({
						path: sPathSelectedItem,
						model: "fastAppData"
					});
					this.byId("idLetterDetailForm").setVisible(true);
				}

				if (Services.getDeliveryItemEdit() !== -1) {
					//another line is currently in edit mode. Set this back to display first.
					var oRow = oTableLetters.getItems()[Services.getLetterItemEdit()];
					if (oRow) {
						var aCells = oRow.getCells();
						aCells.forEach(function (oCell, index) {
							oCell.setProperty("enabled", false);
						});

						Services.setLetterItemEdit(-1);
					}
				}

				//now set the other line in edit mode
				var oRow = oTableLetters.getItems()[iIndex];
				if (oRow) {
					var aCells = oRow.getCells();
					aCells.forEach(function (oCell, index) {
						oCell.setProperty("enabled", Services.getEditMode());
					});

					Services.setLetterItemEdit(iIndex);
				}
			}

			that.byId("idLetterDetailSection").setVisible(true);

		},

		onLetterItemSelect: function (oEvent) {
			var that = this;
			var oTableLetters = this.byId("lettersTableID");

			if (oTableLetters) {
				var oFastAppDataModel = Services.getFastAppDataModel();
				var aLetters = oTableLetters.getItems();
				var aSelectedItem = oEvent.getParameter("listItem");
				var sPathSelectedItem = aSelectedItem.getBindingContext('fastAppData').sPath;
				var iIndex = parseInt(sPathSelectedItem.substring(sPathSelectedItem.lastIndexOf('/') + 1));
				var oSelectedItem = oFastAppDataModel.getProperty(sPathSelectedItem);

				if (aLetters[iIndex] && oSelectedItem) {

					this.byId("idLetterDetailSection").bindElement({
						path: sPathSelectedItem,
						model: "fastAppData"
					});
					this.byId("idLetterDetailForm").setVisible(true);

					oTableLetters.setSelectedItem(aLetters[iIndex], true);
					aLetters[iIndex].setSelected(true);
					aLetters[iIndex].setActive(true);
				}
			}

			that.byId("idLetterDetailSection").setVisible(true);

		},

		//Save delivery tracking from button save in footer
		_onSaveDelvrTracking: function (oEvent) {

			//that is this
			var that = this;
			var aMessages = [];

			//get current offer & tender
			var sTenderID = Services.getSelectedTenderID();
			var sOfferID = Services.getSelectedOfferID();
			var bError = false;
			var aDeliveriesSaveInfo = Services.getFastAppDataModel().getProperty('/SelectedDeliverieProduct/Deliveries/results/');
			var aLettersSaveInfo = Services.getFastAppDataModel().getProperty('/SelectedDeliverieProduct/Letters/results/');
			var oTender = Services.getFastAppDataModel().getProperty("/Tender");
			var sCountry = Services.getSelectedCountry();

			aDeliveriesSaveInfo.forEach(function (oDeliverySaveInfo, index) {
				if (oDeliverySaveInfo._sOperation !== "DELETE" && sCountry != 'CL') {
					if (!oDeliverySaveInfo.PlannedInAPO ||
						!oDeliverySaveInfo.RequestedDeliveryDate ||
						!oDeliverySaveInfo.RequestedQuantity ||
						!oDeliverySaveInfo.ActualDeliveryDate ||
						!oDeliverySaveInfo.ActualDeliveryQuantity ||
						!oDeliverySaveInfo.Penalty ||
						!oDeliverySaveInfo.UndertakingLetters ||
						!oDeliverySaveInfo.Compensated ||
						!oDeliverySaveInfo.ProductCode ||
						!oDeliverySaveInfo.PaidOrFree ||
						(oDeliverySaveInfo.Penalty === 'Yes' && (!oDeliverySaveInfo.PenaltyReason || !oDeliverySaveInfo.Currency || !oDeliverySaveInfo
							.PenaltyValue)) ||
						(oDeliverySaveInfo.Compensated === 'Yes' && !oDeliverySaveInfo.CompensationComment) ||
						(oTender.GroupPurchasing !== 0 && !oDeliverySaveInfo.InstituteID)) {

						var oMessage = {
							type: 'Error',
							title: 'Please enter all the mandatory fields for delivery ' + (index + 1),
						};

						aMessages.push(oMessage);
						bError = true;
					}
				} else if (oDeliverySaveInfo._sOperation !== "DELETE" && sCountry != 'CL') {
					if (!oDeliverySaveInfo.PoDate ||
						!oDeliverySaveInfo.PO ||
						!oDeliverySaveInfo.ActualDeliveryQuantity ||
						!oDeliverySaveInfo.Contract)

						var oMessage = {
							type: 'Error',
							title: 'Please enter all the mandatory fields for purchase order ' + (index + 1),
						};

						aMessages.push(oMessage);
						bError = true;
				}
			});

			aLettersSaveInfo.forEach(function (oLetterSaveInfo, index) {
				if (oLetterSaveInfo._sOperation !== "DELETE") {
					if (!oLetterSaveInfo.REASONFORLETTER ||
						oLetterSaveInfo.QUANTITY === "" ||
						!oLetterSaveInfo.BATCH ||
						!oLetterSaveInfo.MANUFACTURINGDATE ||
						!oLetterSaveInfo.EXPIRYDATE ||
						!oLetterSaveInfo.RETURNDATE ||
						oLetterSaveInfo.RETURNEDQTY === "" ||
						!oLetterSaveInfo.UOM ||
						(oTender.GroupPurchasing !== 0 && !oLetterSaveInfo.INSTITUTEID)) {

						var oMessage = {
							type: 'Error',
							title: 'Please enter all the mandatory fields for letter ' + (index + 1),
						};

						aMessages.push(oMessage);

						bError = true;
					}
				}
			});

			if (bError) {
				Services.showMessageCompositeView('Error', aMessages, 'Error');
			} else {
				//Save all info on DeliveryTracking tab
				$.when(Services.saveDeliveryTrackingAll()).done(function (oSaveResults) {

					//When at least the savProductOffer has succeeded
					//Load 2 models again with data from database
					//clear necesarry globals
					if (oSaveResults.saveDeliveries === true && oSaveResults.saveLetters === true) {

						//refresh the default model (FastData) for the display view
						Services.getDefaultModel().refresh(true);

						//load data again from back-end

						//In this case we might dit some changes in the fastAppData model, we will load all data from the database again
						//otherwise nextOfferID is f.e still the one that is already created
						var sTenderID = Services.getSelectedTenderID();

						that.ODetailController.onRefresh();
						//we will load tender again after save is done
						/*var bLoadedCheck = false; 
						
						$.when(Services.loadAllFastAppDataForProdOffer(sTenderID, bLoadedCheck)).done(function (oDataTenderOffer) {
						*/
						//go back to display view
						that.ODetailController.onEditToggleButtonPress();

						//show offer table content, so there is more space on the screen
						//that.getView().byId("panelDeliveryTrackingOfferTableID").setExpanded(true);

						//clear all input
						Services.clearAllForDeliveryTrackingPage();

						//this way we can use a seperate layer, adding deleting... and afterords saving
						var oFastAppDataModel = Services.getFastAppDataModel();
						that.getView().setModel(oFastAppDataModel, "fastAppData");

					}
				});
			}
		}

	});
});