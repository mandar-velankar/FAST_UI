sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/model/services",
	"sap/ui/core/format/NumberFormat",
], function (Controller, MessageToast, formatter, Services, NumberFormat) {
		"use strict";
		var _FOCProdBund1UpdateFinished = function(oDetailController, formId, forEdit, fieldId){
			
			var oFOCProducts = oDetailController.getView().byId("idPriceOffer_idFOCProdBund1");
			if (oFOCProducts){
				var oFOCProducts_fld = oDetailController.getView().byId(formId + fieldId);
				
				if(!forEdit || (forEdit && oFOCProducts && oFOCProducts.getItems().length === 0)){
					oFOCProducts_fld.setEnabled(false);
				} else if (forEdit && oFOCProducts && oFOCProducts.getItems().length > 0) {
					oFOCProducts_fld.setEnabled(true);
				} else if (!oFOCProducts) {
					oFOCProducts_fld.setEnabled(false);
				}
			}
		}
	
	return Controller.extend("FAST_NS0FAST0.controller.OfferProduct", {
		formatter: formatter,

		//controller is used for the following fragments: FinancialOfferEdit/view (NO LONGER: OfferProductsEdit/View)
		//TODO remove from fragments search for "controller.OfferProducts" (no controller so detail controller is used from where the fragments are implemented)
		//TODO merge this file content with financial.js & remove the define in the controller search for "controller/OfferProducts"
		//TODO search for "new OfferProducts()" the variable used can be changed to
		//TODO link financial.js to service file not in define but by set. this way we don't have the problem of 
		//TODO double check that all variables are changed correctly, be aware of naming look-a-likes OfferProducts <> oOfferProducts
		
		//local method for setting data for price form
		_setPriceForm: function (oDetailController, formId, price, forEdit, forScenario) {
			
			//get selected offer
			var sOfferID = Services.getSelectedOfferID();
			var oOffer = Services.getLoadedOffer(sOfferID);
			let oResourceBundle = oDetailController.getView().getModel("i18n").getResourceBundle();

			var sProductCode = Services.getSelectedProductID();
			var oProduct = Services.getLoadedProductsForOffer(sOfferID, sProductCode);
			var sCountryCode = Services.getCountryCodeofSelectedTender(); //COUNTRY_CODE
			var sInstituteID = Services.getInstituteIDofSelectedTender(); //INSTITUTE_ID
			var sDistributorID = Services.getSelectedDistributorID();     //DISTRIBUTOR_ID
			var sTenderChannel = Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');
			var aCommercialAgreement = Services.getFastAppDataModel().getProperty('/Tender/CommercialAgreement');
			var sLegalEntity = Services.getFastAppDataModel().getProperty("/EditOffer/SellingCompany");
			let sInstituteType = Services.getFastAppDataModel().getProperty('/Tender/Institute/InstituteType');

			//get form
			var oForm = oDetailController.byId(formId);
			oForm.destroyContent();
			
			//Put fields for each scenario as header
			if (forScenario) {

				//Scenario Name
				oForm.addContent(new sap.m.Label({
					text: "{i18n>ScenarioName}"
				}));
				oForm.addContent(new sap.m.Input({
					id: oDetailController.getView().createId(formId + "_idName"),
					value: price.name,
					//maxWidth: "50%",
					enabled: forEdit
				}));
				
				//Scenario Description
				oForm.addContent(new sap.m.Label({
					text: "{i18n>ScenarioDescription}"
				}));
				oForm.addContent(new sap.m.Input({
					id: oDetailController.getView().createId(formId + "_idDescription"),
					value: price.description,
					//maxWidth: "50%",
					enabled: forEdit
				}));

			} else {

				//whole sale offer
				oForm.addContent(new sap.m.Label({
					text: "{i18n>whlseofr}",
					visible: false
				}));
				oForm.addContent(new sap.m.Select({
					id: oDetailController.getView().createId(formId + "_idWhlseofr"),
					items: [{
						key: "Yes",
						text: "Yes"
					}, {
						key: "No",
						text: "No"
					}],
					maxWidth: "50%",
					enabled: forEdit,
					visible: false
				}));

			}

			//CIF price
			let oCifLabel = new sap.m.Label();
			let i18nKey = (sCountryCode === 'TH' || sCountryCode === 'AR' || sCountryCode === 'CL' ? ('CIFPrice_' + sCountryCode) : 'CIFPrice'); //Diferent labels for Thailand & Argentinia & chili
			oCifLabel.setText(oResourceBundle.getText(i18nKey));
			oForm.addContent(oCifLabel);
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idCifPrice"),
				value: forEdit ? formatter.priceTwoOrFour(price.newCifPrice, undefined, price.uom) : formatter.priceTwoOrFour(price.cifPrice, undefined, price.uom),
				description: price.offerCurrency,
				enabled: false
			}));
			
			//New CIF price
			oForm.addContent(new sap.m.Label({
				text: "{i18n>NewCIF}",
				visible: !forEdit && (formatter.priceTwoOrFour(price.newCifPrice, undefined, price.uom) !== formatter.priceTwoOrFour(price.cifPrice, undefined, price.uom))
			}));
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idNewCifPrice"),
				value: formatter.priceTwoOrFour(price.newCifPrice, undefined, price.uom),
				description: price.offerCurrency,
				visible: !forEdit && (formatter.priceTwoOrFour(price.newCifPrice, undefined, price.uom) !== formatter.priceTwoOrFour(price.cifPrice, undefined, price.uom)),
				enabled: false
			}));

			//Discount
			oForm.addContent(new sap.m.Label({
				text: "{i18n>Discount}"
			}));
			oForm.addContent(
				new sap.m.Input({
					id: oDetailController.getView().createId(formId + "_idDiscount"),
					value: formatter.percentageNoUnit(price.discount === null? 0 : price.discount),
					description: "%",
					enabled: false
				})
			);
			
			//OfferPrice / Standard price
			let oOfferPriceLabel = new sap.m.Label();
			i18nKey = (sCountryCode === 'TH' || sCountryCode === 'AR' || sCountryCode === 'CL' ? ('OfferPrice_' + sCountryCode) : 'OfferPrice'); //Diferent labels for Thailand & Argentinia & chili
			oOfferPriceLabel.setText(oResourceBundle.getText(i18nKey));
			oForm.addContent(oOfferPriceLabel);
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idOfferPrice"),
				value: formatter.priceTwoOrFour(price.offerPrice, undefined, price.uom),
				description: price.offerCurrency,
				enabled: sCountryCode === 'AR' || sCountryCode === 'CL' ? false : forEdit,
				submit: oDetailController.onEditFinancialOffer.bind(oDetailController)
			}));

			//Standard Discount
			oForm.addContent(new sap.m.Label({
						text: "{i18n>StandardDiscount}",
						visible: sCountryCode === "BR" ? true : false
			}));
			oForm.addContent(
					new sap.m.Input({
						id: oDetailController.getView().createId(formId + "_idStandardDiscount"),
						value: formatter.percentageNoUnit(price.standardDiscount),
						description: "%",
						visible: sCountryCode === "BR" ? true : false,
						enabled: false
					})
			);

			//Additional Discount
			oForm.addContent(new sap.m.Label({
					text: "{i18n>AdditionalDiscount}",
					visible: sCountryCode === "AR" || sCountryCode === "BR" || (sCountryCode === "CL" && sInstituteType === 'Cenabast') ? true : false
			}));
			oForm.addContent(
					new sap.m.Input({
						id: oDetailController.getView().createId(formId + "_idAdditionalDiscount"),
						value: formatter.percentageNoUnit(price.additionalDiscount),
						description: "%",
						visible: sCountryCode === "AR" || sCountryCode === "BR" || (sCountryCode === "CL" && sInstituteType === 'Cenabast') ? true : false,
						change: oDetailController.onEditFinancialOffer.bind(oDetailController),
						enabled: forEdit
					})
			);
			
			//FOC
			oForm.addContent(new sap.m.Label({
				text: "{i18n>FOC}",
				visible: sCountryCode === "CL" ? false : true
			}));
			//Absolute or Percentage is defaulted by first saved price, if price is not yet saved... but can still be changed
			let sFocAbsPCT = null;
			if(oOffer && oOffer.DEFAULT_FOC_ABS_PCT && !price.offerPrice){
				sFocAbsPCT = oOffer.DEFAULT_FOC_ABS_PCT;
			}else{
				sFocAbsPCT = price.focAbsPct;
			}
			oForm.addContent(new sap.m.Select({
				id: oDetailController.getView().createId(formId + "_idFocAbsPct"),
				items: [{
					key: "ABS",
					text: "Absolute"
				}, {
					key: "PCT",
					text: "Percentage"
				}],
				selectedKey: sFocAbsPCT,
				maxWidth: "80%",
				change: oDetailController.onEditFinancialOffer.bind(oDetailController),
				enabled: forEdit,
				visible: sCountryCode === "CL" ? false : true
			}));
			//Percentage/Absolute amount FOC
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idFoc"),
				value: (price.focAbsPct === "PCT") ? formatter.percentageNoUnit(price.foc) : price.foc,
				enabled: forEdit,
				description: (price.focAbsPct === "PCT") ? "%" : price.uom,
				submit: oDetailController.onEditFinancialOffer.bind(oDetailController),
				visible: sCountryCode === "CL" ? false : true
			}));

			//Net Price
			oForm.addContent(new sap.m.Label({
				text: "{= ${fastAppData>/Tender/CountryCode} === 'TH' ? ${i18n>NetOfferPrice_TH} : ${i18n>NetOfferPrice}}",
				visible: sCountryCode === "CL" ? false : true
			}));
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idNetOfferPrice"),
				value: formatter.priceTwoOrFour(price.netOfferPrice, undefined, price.uom),
				description: price.offerCurrency,
				enabled: false,
				visible: sCountryCode === "CL" ? false : true
			}));

			//Deductions
			oForm.addContent(new sap.m.Label({
				text: "{i18n>Deductions}"
			}));
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idDeduction"),
				value: formatter.percentageNoUnit(price.deductions),
				description: "%",
				enabled: (forEdit && !forScenario),
				submit: oDetailController.onEditFinancialOffer.bind(oDetailController)
			}));

			//Net price
			oForm.addContent(new sap.m.Label({
				text: "{i18n>NetPrice}"
			}));
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idNetPrice"),
				value: formatter.priceTwoOrFour(price.netPrice, undefined, price.uom),
				description: price.offerCurrency,
				enabled: false
			}));
			oForm.setVisible(true);
			
			//FOC for additional product
			if(!sLegalEntity){
				//var oSelectedOfferPath = Services.getDefaultModel().getProperty(Services.getSelectedOfferPath());
				//sLegalEntity = oSelectedOfferPath.SellingCompany;
				sLegalEntity = oOffer.SellingCompany;
			}
			
			if (oProduct && oProduct.SKU && oProduct.SKU.Product){
				var sBrandID = oProduct.SKU.Product.HLEVEL4_CODE;
			}
			
			//build array with filters
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, sCountryCode));
			aFilters.push(new sap.ui.model.Filter("INSTITUTE_ID", sap.ui.model.FilterOperator.EQ, sInstituteID));
			aFilters.push(new sap.ui.model.Filter("DISTRIBUTOR_ID", sap.ui.model.FilterOperator.EQ, sDistributorID));
			aFilters.push(new sap.ui.model.Filter("CHANNEL", sap.ui.model.FilterOperator.EQ, sTenderChannel));
			aFilters.push(new sap.ui.model.Filter("LEGAL_ENTITY_CODE", sap.ui.model.FilterOperator.EQ, sLegalEntity));
			//if(sBrandID !== null){
			aFilters.push(new sap.ui.model.Filter("BRAND_ID", sap.ui.model.FilterOperator.EQ, sBrandID));
			//}
			aFilters.push(new sap.ui.model.Filter("PRODUCT_ID", sap.ui.model.FilterOperator.NE, sProductCode));

			//add origin's to filter
			if(aCommercialAgreement){
				aCommercialAgreement.results.forEach(function (oCommercialAgreement, iIndex) {
					aFilters.push(new sap.ui.model.Filter("COUNTRY_OF_ORIGIN", sap.ui.model.FilterOperator.EQ, oCommercialAgreement.COUNTRY_OF_ORIGIN));
				});						
			}	
			
			//FOC additional product is not shown in argentinia
			oForm.addContent(new sap.m.Label({
				text: "{i18n>FOCAdditionalProd}",
				visible: sCountryCode === "AR" || sCountryCode === "CL" ? false : true
			}));
				
			oForm.addContent(new sap.m.ComboBox({
				id: oDetailController.getView().createId(formId + "_idFOCProdBund1"), 
				visible: sCountryCode === "AR" || sCountryCode === "CL" ? false : true,
				items: {
						path: "fastData>/InstituteDistributorBrandProduct",
						/*
						parameters: {
							expand : "Cogs,SKU"
						},
						*/
						filters: aFilters,
						template: new sap.ui.core.ListItem({
							key: '{fastData>PRODUCT_ID}',
							text: '{fastData>PRODUCT_NAME}'
						}),
						templateShareable: true
				},
				change: oDetailController.onEditFinancialOffer.bind(oDetailController),
				selectedKey: price.focProduct_bund1,
				maxWidth: "80%",
			}));
				
			//Absolute or Percentage is defaulted by first saved price, if price is not yet saved... but can still be changed
			if(oOffer && oOffer.DEFAULT_FOC_ABS_PCT && !price.offerPrice){
				var sFocAbsPCT_Bund1 = oOffer.DEFAULT_FOC_ABS_PCT;
			}else{
				var sFocAbsPCT_Bund1 = price.focAbsPct_bund1;
			}

			//absolute or precentage additional foc product
			oForm.addContent(new sap.m.Select({
				id: oDetailController.getView().createId(formId + "_idFocAbsPct1"),
				items: [{
					key: "ABS",
					text: "Absolute"
				}, {
					key: "PCT",
					text: "Percentage"
				}],
				selectedKey: sFocAbsPCT_Bund1,
				maxWidth: "80%",
				change: oDetailController.onEditFinancialOffer.bind(oDetailController),
				enabled: forEdit,
				visible: sCountryCode === "AR" || sCountryCode === "CL" ? false : true 
			}));

			//Value additional foc product
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idFoc1"),
				visible: sCountryCode === "AR" || sCountryCode === "CL" ? false : true,
				value: (price.focAbsPct_bund1 === "PCT") ? formatter.percentageNoUnit(price.foc_bund1) : price.foc_bund1,
				enabled: forEdit,
				description: (price.focAbsPct_bund1 === "PCT") ? "%" : price.uom,
				submit: oDetailController.onEditFinancialOffer.bind(oDetailController)
			}));
			
			//Business Case Price
			oForm.addContent(new sap.m.Label({
				text: "{i18n>BusinessCasePrice}",
				visible: sCountryCode === "AR" ? true : false
			}));
			oForm.addContent(new sap.m.Input({
				id: oDetailController.getView().createId(formId + "_idBusinessCasePrice"),
				visible: sCountryCode === "AR" ? true : false,
				value: formatter.priceTwoOrFour(price.businessCasePrice, undefined, price.uom),
				description: price.offerCurrency,
				enabled: forEdit
			}));

			/* tried to solve this using attribute onAfterRender. However, at this moment this doesn't seem to be working.
			   According to ticket https://trello.com/c/yUkwKbwZ, these fields should be disabled in case no Brand Products exist.
			   This method will be called 4 times, each time with a different form ID, as this logic is being executed on both the financial offer page as the scenario planner. Therefor, this has been built dynamically. 
			   In the called method, one field has been defined hardcoded (oDetailController.getView().byId("idPriceOffer_idFOCProdBund1");). This is the field on which we check if the Brand products are available or not.*/
			   
			_FOCProdBund1UpdateFinished(oDetailController, formId, forEdit, "_idFOCProdBund1");
			_FOCProdBund1UpdateFinished(oDetailController, formId, forEdit, "_idFocAbsPct1");
			_FOCProdBund1UpdateFinished(oDetailController, formId, forEdit, "_idFoc1");
		},
	
		//get calculated fields for profit table H & V
		_getCalculatedFieldsForProfitTables:  function(price){

			var oCalculatedFields = {
				iCombinedCogs: 0,
				iSpotNetSales: 0,
				iBudgetNetSales: 0,
				iSpotCogsRel: 0,
				iBudgetCogsRel: 0,
			}
			
			//calculate cogsRel
			if(price.foc_bund1===0){
			
			  //calculate total cogs value
			   oCalculatedFields.iCombinedCogs = price.mainProductQuantity * price.cogs
			
			}else{
			
			   //we got the aditional product, so we should make the sum
			   oCalculatedFields.iCombinedCogs = (price.mainProductQuantity * price.cogs) + (price.addFocProductQuantity * price.cogsAddFOCProduct);
			
			}
			
			//make more generic netsales
			oCalculatedFields.iSpotNetSales = (price.netPrice / price.spotRate) * (price.quantity + ((price.focType === "FOC 2") ? ((price.focAbsPct === "PCT") ?
					price.focQuantityRounded : price.foc) : 0));
			oCalculatedFields.iBudgetNetSales = (price.netPrice / price.budgetRate) * (price.quantity + ((price.focType === "FOC 2") ? ((price.focAbsPct === "PCT") ?
					price.focQuantityRounded : price.foc) : 0));
			oCalculatedFields.iSpotCogsRel = oCalculatedFields.iCombinedCogs / oCalculatedFields.iSpotNetSales;
			oCalculatedFields.iBudgetCogsRel = oCalculatedFields.iCombinedCogs / oCalculatedFields.iBudgetNetSales;	
			
			// price.customRate is set in the _calcCustomRate() only
			if(price.customRate && price.customRate > 0){
				oCalculatedFields.iCustomNetSales = (price.netPrice / price.customRate) * (price.quantity + ((price.focType === "FOC 2") ? ((price.focAbsPct === "PCT") ?
					price.focQuantityRounded : price.foc) : 0));
				oCalculatedFields.iCustomCogsRel = oCalculatedFields.iCombinedCogs / oCalculatedFields.iCustomNetSales;	
			}
			
			return oCalculatedFields;
		},
		
		//local method for setting profit table data
		_setProfitTableH: function (oDetailController, tableId, price) {
			var oTable = oDetailController.byId(tableId);
			let sCountryCode = Services.getSelectedCountry();
			let oResourceBundle = oDetailController.getView().getModel("i18n").getResourceBundle();

			oTable.destroyColumns();

			
			const oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});

			// 1. format the budgetRate and spotRate before doing calcuations
			price.budgetRate = oNumberFormat.format(parseFloat(price.budgetRate));
			price.spotRate = oNumberFormat.format(parseFloat(price.spotRate));

			
			// 2. get calculated fields for profit table
			var oCalculatedFields = this._getCalculatedFieldsForProfitTables(price);
			
			var tableData = [{
				rowHeader: "Spot",
				offerPriceLocal: price.offerPrice,
				offerPriceEUR: price.offerPrice / price.spotRate,
				netPriceEUR: price.netPrice / price.spotRate,
				cogsAbs: price.cogs,
				
				//changed
				cogsRel: oCalculatedFields.iSpotCogsRel, //price.cogs / (price.netPrice / price.spotRate),
				grossMargin: 1 - oCalculatedFields.iSpotCogsRel, //(price.cogs / (price.netPrice / price.spotRate)),
				
				quantity: price.mainProductQuantity, //price.quantity,
				foc: (price.focAbsPct === "PCT") ? price.focQuantityRounded : price.foc,
				paidQuantity: price.quantity - ((price.focType === "FOC 1") ? ((price.focAbsPct === "PCT") ? price.focQuantityRounded : price.foc) :
					0),
				netSales: oCalculatedFields.iSpotNetSales,
				
				//changed
				grossProfit: oCalculatedFields.iSpotNetSales - oCalculatedFields.iCombinedCogs,
				rate: price.spotRate
				/*((price.netPrice / price.spotRate) - price.cogs) * (price.quantity + ((price.focType === "FOC 2") ? ((price.focAbsPct ===
					"PCT") ? price.foc * price.quantity : price.foc) : 0))*/
					
			}, {
				rowHeader: "Budget",
				offerPriceLocal: price.offerPrice,
				offerPriceEUR: price.offerPrice / price.budgetRate,
				netPriceEUR: price.netPrice / price.budgetRate,
				cogsAbs: price.cogs,
				
				//changed
				cogsRel: oCalculatedFields.iBudgetCogsRel, // price.cogs / (price.netPrice / price.budgetRate),
				grossMargin: 1 - oCalculatedFields.iBudgetCogsRel, // (price.cogs / (price.netPrice / price.budgetRate)),
				
				quantity: price.mainProductQuantity, //price.quantity,
				foc: (price.focAbsPct === "PCT") ? price.focQuantityRounded : price.foc,
				paidQuantity: price.quantity - ((price.focType === "FOC 1") ? ((price.focAbsPct === "PCT") ? price.focQuantityRounded : price.foc) :
					0),
				netSales: oCalculatedFields.iBudgetNetSales,
				
				//todo
				grossProfit: oCalculatedFields.iBudgetNetSales - oCalculatedFields.iCombinedCogs,
				rate: price.budgetRate
				/*((price.netPrice / price.budgetRate) - price.cogs) * (price.quantity + ((price.focType === "FOC 2") ? ((price.focAbsPct ===
					"PCT") ? price.foc * price.quantity : price.foc) : 0))*/
			}, {
				rowHeader: "Custom",
				offerPriceLocal: price.offerPrice,
				offerPriceEUR: price.offerPrice / price.spotRate,
				netPriceEUR: price.netPrice / price.spotRate,
				cogsAbs: price.cogs,
				
				//changed
				cogsRel: oCalculatedFields.iSpotCogsRel, //price.cogs / (price.netPrice / price.spotRate),
				grossMargin: 1 - oCalculatedFields.iSpotCogsRel, //(price.cogs / (price.netPrice / price.spotRate)),
				
				quantity: price.mainProductQuantity, //price.quantity,
				foc: (price.focAbsPct === "PCT") ? price.focQuantityRounded : price.foc,
				paidQuantity: price.quantity - ((price.focType === "FOC 1") ? ((price.focAbsPct === "PCT") ? price.focQuantityRounded : price.foc) :
					0),
				netSales: oCalculatedFields.iSpotNetSales,
				
				//changed
				grossProfit: oCalculatedFields.iSpotNetSales - oCalculatedFields.iCombinedCogs,
				rate: price.spotRate	
			}];
			var oModel = new sap.ui.model.json.JSONModel(tableData);
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: ""
				})
			}));
			/*oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Offer Price \n [" + price.offerCurrency + "/ \n" + price.uom + "]",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));*/

			//OfferPrice
			let oOfferPriceLabel = new sap.m.Label({
				wrapping: true,
				vAlign: "Top",
				design: "Bold",
				textAlign: "Center"
			});
			let i18nKey = (sCountryCode === 'TH' || sCountryCode === 'AR' || sCountryCode === 'CL' ? ('OfferPrice_' + sCountryCode) : 'OfferPrice'); //Diferent labels for Thailand & Argentinia & chili
			oOfferPriceLabel.setText(oResourceBundle.getText(i18nKey));

			oTable.addColumn(new sap.m.Column({
				header: oOfferPriceLabel
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Net Price \n [" + this.sReportingCurrency + "/ \n" + price.uom + "]",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "COGS \n\n [" + this.sReportingCurrency + "/ \n" + price.uom + "] \n",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			/*oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "COGS \n\n [%] \n\n",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));*/
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Gross Margin \n [%] \n\n",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Quantity \n\n [" + price.uom + "] \n\n",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "FOC \n\n [" + price.uom + "] \n\n",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Paid Quantity \n [" + price.uom + "] \n\n",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Net Sales \n [" + this.sReportingCurrency + "] \n\n",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Gross Profit \n [" + this.sReportingCurrency + "] \n\n",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Rate",
					wrapping: true,
					vAlign: "Top",
					design: "Bold",
					textAlign: "Center"
				})
			}));
			var oTemplate = new sap.m.ColumnListItem({
				type: sap.m.ListType.Active,
				cells: [
					new sap.m.Label({
						text: "{rowHeader}"
					}),
					/*new sap.m.ObjectNumber({
						number: {
							path: "offerPriceLocal",
							formatter: formatter.price
						}
					}),*/
					new sap.m.ObjectNumber({
						number: {
							path: "offerPriceEUR",
							formatter: formatter.price
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							path: "netPriceEUR",
							formatter: formatter.price
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							path: "cogsAbs",
							formatter: formatter.price
						}
					}),
					/*new sap.m.ObjectNumber({
						number: {
							path: "cogsRel",
							formatter: formatter.percentage
						}
					}),*/
					new sap.m.ObjectNumber({
						number: {
							path: "grossMargin",
							formatter: formatter.percentage
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							path: "quantity",
							formatter: formatter.price
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							path: "foc",
							formatter: formatter.price
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							path: "paidQuantity",
							formatter: formatter.price
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							path: "netSales",
							formatter: formatter.amount
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							path: "grossProfit",
							formatter: formatter.amount
						}
					}),
					new sap.m.VBox({
						items: [
							new sap.m.ObjectNumber({
								visible: "{= ${rowHeader} !== 'Custom' ? true : false }",
								number: {
									path: "rate",
									formatter: formatter.price
								}
							}),
							new sap.m.Input({
								visible: "{= ${rowHeader} === 'Custom' ? true : false }",
								type: sap.m.InputType.Number,
								value: {
									path: "rate",
									formatter: formatter.price
								},
								liveChange: this._calcCustomRate.bind(this, price)
							})
						],
					}),
				]
			});
			oTable.setModel(oModel);
			oTable.bindAggregation("items", "/", oTemplate);
		},

		_calcCustomRate: function(price, oEvent){

			const oModel = oEvent.getSource().getModel();
			const oCustomRateRow = oModel.getData().find(row => row.rowHeader === "Custom");
			const newRate = +oEvent.getParameter("value");

			// 1. add new rate to the price object
			price['customRate'] = newRate;

			// 2. calculate fields
			const oCalculatedFields = this._getCalculatedFieldsForProfitTables(price);

			oCustomRateRow.offerPriceEUR =  price.offerPrice / newRate;
			oCustomRateRow.netPriceEUR =  price.netPrice / newRate;
			oCustomRateRow.rate = newRate;
			oCustomRateRow.cogsRel = oCalculatedFields.iCustomCogsRel;
			oCustomRateRow.grossMargin = 1 - oCalculatedFields.iCustomCogsRel;
			oCustomRateRow.netSales = oCalculatedFields.iCustomNetSales;
			oCustomRateRow.grossProfit = oCalculatedFields.iCustomNetSales - oCalculatedFields.iCombinedCogs,

			oModel.refresh();
		},
		
		//local method for setting profit table data
		_setProfitTableV: function (oDetailController, tableId, price) {
			var oTable = oDetailController.byId(tableId);
			oTable.destroyColumns();
			
			//get calculated fields for profit table
			var oCalculatedFields = this._getCalculatedFieldsForProfitTables(price);
			
			var tableData = [
				/*{
				rowHeader: "Offer Price \n [" + price.offerCurrency + "/" + price.uom + "]",
				spotCol: formatter.price(price.offerPrice),
				budgetCol: formatter.price(price.offerPrice)
			}, */{
				rowHeader: "Offer Price \n [EUR/" + price.uom + "]",
				spotCol: formatter.price(price.offerPrice / price.spotRate),
				budgetCol: formatter.price(price.offerPrice / price.budgetRate)
			}, {
				rowHeader: "Net Price \n [EUR/" + price.uom + "]",
				spotCol: formatter.price(price.netPrice / price.spotRate),
				budgetCol: formatter.price(price.netPrice / price.budgetRate)
			}, {
				rowHeader: "COGS \n [EUR/" + price.uom + "]",
				spotCol: formatter.price(price.cogs),
				budgetCol: formatter.price(price.cogs)
			}, /*{
				rowHeader: "COGS \n [%]",
				spotCol: formatter.percentage(oCalculatedFields.iSpotCogsRel), //formatter.percentage(price.cogs / (price.netPrice / price.spotRate)),
				budgetCol: formatter.percentage(oCalculatedFields.iBudgetCogsRel) //formatter.percentage(price.cogs / (price.netPrice / price.budgetRate))
			},*/ {
				rowHeader: "Gross Margin \n [%]",
				spotCol: formatter.percentage(1 - oCalculatedFields.iSpotCogsRel), //formatter.percentage(1 - (price.cogs / (price.netPrice / price.spotRate))),
				budgetCol: formatter.percentage(1 - oCalculatedFields.iBudgetCogsRel) //formatter.percentage(1 - (price.cogs / (price.netPrice / price.budgetRate)))
			}, {
				rowHeader: "Quantity \n [" + price.uom + "]",
				spotCol: formatter.price(price.mainProductQuantity), //formatter.price(price.quantity),
				budgetCol: formatter.price(price.mainProductQuantity) //formatter.price(price.quantity)
			}, {
				rowHeader: "FOC \n [" + price.uom + "]",
				spotCol: formatter.price((price.focAbsPct === "PCT") ? price.focQuantityRounded : price.foc),
				budgetCol: formatter.price((price.focAbsPct === "PCT") ? price.focQuantityRounded : price.foc)
			}, {
				rowHeader: "Paid Quantity \n [" + price.uom + "]",
				spotCol: formatter.price(price.quantity - ((price.focType === "FOC 1") ? ((price.focAbsPct === "PCT") ? price.focQuantityRounded :
					price.foc) : 0)),
				budgetCol: formatter.price(price.quantity - ((price.focType === "FOC 1") ? ((price.focAbsPct === "PCT") ? price.focQuantityRounded :
					price.foc) : 0))
			}, {
				rowHeader: "Net Sales \n [EUR]",
				spotCol: formatter.amount((price.netPrice / price.spotRate) * (price.quantity + ((price.focType === "FOC 2") ? ((price.focAbsPct ===
					"PCT") ? price.focQuantityRounded : price.foc) : 0))),
				budgetCol: formatter.amount((price.netPrice / price.budgetRate) * (price.quantity + ((price.focType === "FOC 2") ? ((price.focAbsPct ===
					"PCT") ? price.focQuantityRounded : price.foc) : 0)))
			}, {
				rowHeader: "Gross Profit \n [EUR]",
				spotCol: formatter.amount(oCalculatedFields.iSpotNetSales - oCalculatedFields.iCombinedCogs),
				/*formatter.amount(((price.netPrice / price.spotRate) - price.cogs) * (price.quantity + ((price.focType === "FOC 2") ? ((
					price.focAbsPct === "PCT") ? price.foc * price.quantity : price.foc) : 0))),*/
				budgetCol: formatter.amount(oCalculatedFields.iBudgetNetSales - oCalculatedFields.iCombinedCogs)
				/*formatter.amount(((price.netPrice / price.budgetRate) - price.cogs) * (price.quantity + ((price.focType === "FOC 2") ?
					((price.focAbsPct === "PCT") ? price.foc * price.quantity : price.foc) : 0)))*/
			}];

			var oModel = new sap.ui.model.json.JSONModel(tableData);
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: ""
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Spot"
				})
			}));
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Budget"
				})
			}));

			var oTemplate = new sap.m.ColumnListItem({
				type: sap.m.ListType.Active,
				cells: [
					new sap.m.Label({
						text: "{rowHeader}",
						wrapping: true,
						design: "Bold"
					}),
					new sap.m.Label({
						text: "{spotCol}"
					}),
					new sap.m.Label({
						text: "{budgetCol}"
					})
				]
			});
			oTable.setModel(oModel);
			oTable.bindAggregation("items", "/", oTemplate);
		},
		
		//local method for setting pricing chart data
		_setPriceChart: function (oDetailController, chartId, price) {

			var oViz = oDetailController.byId(chartId);
			let oChartDataModel = this._getChartDataModel(oDetailController,price);

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
			oViz.setModel(oChartDataModel, "waterfallChartData");
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
		},

		/**
		 * Get the data model for the Chart to show
		 * @param {object} oDetailController view controller
		 * @param {object} oPrice price
		 * @returns {object} returning the oChartDataModel
		 */
		_getChartDataModel: function(oDetailController,oPrice){

			const i18n = oDetailController.getView().getModel("i18n").getResourceBundle();
			const sCountryCode = Services.getFastAppDataModel().getProperty("/Tender/CountryCode");
			const sInstituteType = Services.getFastAppDataModel().getProperty('/Tender/Institute/InstituteType');

			//Cif price
			var oCIFPriceData = {
				"PriceType": (sCountryCode === 'TH' || sCountryCode === 'AR' || sCountryCode === 'CL') ? i18n.getText('CIFPrice_' + sCountryCode) :  i18n.getText('CIFPrice'), //Diferent labels for Thailand & Argentinia & chili
				"Value": oPrice.cifPrice,
				"Type": "Revenue"
			};
			
			//Discounts
			var oDiscountsData = {
				"PriceType": "Discounts",
				"Value": -oPrice.discount * oPrice.cifPrice,
				"Type": "Cost"
			};
			
			//OfferPrice
			var oOfferPriceData = {
				"PriceType": (sCountryCode === 'TH' || sCountryCode === 'AR' || sCountryCode === 'CL') ? i18n.getText('OfferPrice_' + sCountryCode) :  i18n.getText('OfferPrice'), //Diferent labels for Thailand & Argentinia & chili
				"Value": oPrice.offerPrice,
				"Type": "Total"
			};
			
			//Additional Discount
			var oAdditionalDiscountData = {
				"PriceType": "Additional Discount",
				"Value": -oPrice.additionalDiscount * oPrice.cifPrice,
				"Type": "Cost"
			};
			
			//FOC
			var oFOCData = {
				"PriceType": "FOC",
				"Value": -oPrice.focChart * (oPrice.offerPrice - oPrice.additionalDiscount * oPrice.cifPrice),
				"Type": "Cost"
			};
			
			//NetOfferPrice
			var oNetOfferPriceData = {
				"PriceType": sCountryCode === 'TH' ? i18n.getText("NetOfferPrice_TH") : i18n.getText("NetOfferPrice"),
				"Value": oPrice.netOfferPrice,
				"Type": "Total"
			};
				
			//Deductions
			var oDeductionsData = {
				"PriceType": "Deductions",
				"Value": -oPrice.deductions * oPrice.netOfferPrice,
				"Type": "Cost"
			};
			
			//Net Price
			var oNetPriceData = {
				"PriceType": "Net Price",
				"Value": oPrice.netPrice,
				"Type": "Total"
			};

			let aChartData = [];

			if(sCountryCode==='AR'){
				//difference is that we have oAdditionalDiscountData
				aChartData.push(oCIFPriceData,oDiscountsData,oOfferPriceData,oAdditionalDiscountData,oFOCData,oNetOfferPriceData,oDeductionsData,oNetPriceData);
			} else if (sCountryCode === "CL"){
				if(sInstituteType === 'Cenabast'){
					aChartData.push(oCIFPriceData,oDiscountsData,oOfferPriceData,oAdditionalDiscountData,oDeductionsData,oNetPriceData);
				} else {
					aChartData.push(oCIFPriceData,oDiscountsData,oOfferPriceData,oDeductionsData,oNetPriceData);
				}
			}else{
				aChartData.push(oCIFPriceData,oDiscountsData,oOfferPriceData,oFOCData,oNetOfferPriceData,oDeductionsData,oNetPriceData);
			}
			
			var oChartData = {
				"data": aChartData
			};

			//make a json model from the chart data (chart needs a json model)
			var oChartDataJSONModel = new sap.ui.model.json.JSONModel(oChartData);
			
			//returning chart
			return oChartDataJSONModel;

		},
		
		//local method for inital setting the pricing data
		_setPricingData: async function (oDetailController, formId, chartId, tableId, modelPath, forEdit, forScenario) {
			
			var that = this; //that is already used!! complicated! TODO improve could that be left out? other way to get the view
			let aPromises = [];

			//wait screen
			oDetailController.getView().setBusy(true); 

			//additional product get info
			let sOfferID = Services.getSelectedOfferID();
			let sProductCode = Services.getSelectedProductID();
			let oProduct = Services.getLoadedProductsForOffer(sOfferID, sProductCode);
			let oOffer = Services.getLoadedOffer(sOfferID);

			//direct binding (old way)
			var productValues = oDetailController.getView().getModel("fastData").getObject(modelPath);
			var skuValues = oDetailController.getView().getModel("fastData").getObject("/" + productValues.SKU.__ref);

			//get additional values
			let sCountryCode = Services.getCountryCodeofSelectedTender(); //COUNTRY_CODE
			let sInstituteID = Services.getInstituteIDofSelectedTender(); //INSTITUTE_ID
			let sDistributorID = Services.getSelectedDistributorID();     //DISTRIBUTOR_ID
			let sTenderChannel = Services.getLoadedTender().TenderChannel; //Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');
			let sSellingCompany = oOffer.SellingCompany || Services.getFastAppDataModel().getProperty("/EditOffer/SellingCompany") || Services.getSelectedSellingCompanyID() || null; //Services.getFastAppDataModel().getProperty("/EditOffer/SellingCompany");
			let sBrandID = oProduct && oProduct.SKU && oProduct.SKU.Product && oProduct.SKU.Product.HLEVEL4_CODE;
			let aCommercialAgreement = Services.getFastAppDataModel().getProperty('/Tender/CommercialAgreement');
			let iStandardDiscount = sCountryCode === 'BR' || sCountryCode === 'AR' || sCountryCode === 'CL' ? await that.getStandardDiscount(sDistributorID,sBrandID) : "";
			let iAdditionalDiscount = (oProduct && oProduct.Price && oProduct.Price.AdditionalDiscount) || 0;

			//selected offer currency on screen
			var offerCurrency = oDetailController.byId("idCurrency").getSelectedKey();

			//Object for storing registeredPrice
			var regPriceValues = {
				CURRENCY: offerCurrency, //selected currency on screen
				UOM: productValues.UnitPerPack,
				REGISTERED_PRICE: 0
			};

			//if registerd price is not null
			if (productValues.RegisteredPrice !== null) {
				aPromises.push(that.loadCountryRegisteredPrice(Services.getSelectedCountry(), productValues.UnitPerPack, Services.getSelectedProductID(), offerCurrency).then(sRegisteredPrice => {
					if(sRegisteredPrice){
						regPriceValues.REGISTERED_PRICE = sRegisteredPrice.REGISTERED_PRICE;
						regPriceValues.UOM = sRegisteredPrice.UOM;
					} else {
						regPriceValues.REGISTERED_PRICE = 0;
					}
					return sRegisteredPrice;
				}));
			}

			var cogsValues = {
				COGS: 0
			};
			if (productValues.Cogs !== null) {
				cogsValues = oDetailController.getView().getModel("fastData").getObject("/" + productValues.Cogs.__ref);
			}

			//get country information to read reportingCurrency
			const { data: {results: [oCountryInformation]} } = await Services.getService('Tender').getCountryInfo(sCountryCode);
			this.sReportingCurrency = oCountryInformation.ReportingCurrency;
			
			//load Budget rate again from database
			var sCountry = "";
			var sX_TYPE = "Budget";
			var sCurrencyFrom = offerCurrency;
			var sCurrencyTo = this.sReportingCurrency;
			var budgetRate = null;
			aPromises.push(that.loadExchangeRates(sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE).then(oBudgetExchangeRates => {
				if(oBudgetExchangeRates !== false){
					budgetRate = oBudgetExchangeRates.X_RATE;
				}
				return oBudgetExchangeRates;
			}));
			
			//load Spot rate again from database
			var sCountry = "";
			var sX_TYPE = "Monthly Average";
			var sCurrencyFrom = offerCurrency;
			var sCurrencyTo = this.sReportingCurrency;
			var spotRate = null;
			aPromises.push(that.loadExchangeRates(sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE).then(oMonthlyAvgExchangeRates => {
				if(oMonthlyAvgExchangeRates !== false){
					spotRate = oMonthlyAvgExchangeRates.X_RATE;
				}
				return oMonthlyAvgExchangeRates;
			}));
			
			//check if preapproved price can be found for the selected institute,productpack,currency combination 
			var sPreApprovedPrice = "";
			aPromises.push(that.loadPreApprovedPrices(Services.getInstituteIDofSelectedTender(), skuValues.PRODUCTPACKID, sCurrencyFrom).then(oPreApprovedPrice => {
				if(productValues.UnitPerPack === "Unit"){
					sPreApprovedPrice = oPreApprovedPrice === false ? "" : oPreApprovedPrice.PriceUnit;
				}else{
					sPreApprovedPrice = oPreApprovedPrice === false ? "" : oPreApprovedPrice.PricePack;
				}
				return oPreApprovedPrice;
			}));		

			//if product exists
			if(oProduct && oProduct.SKU && oProduct.SKU.Product){

				//get additional FOC product if its filled
				var sAddBrandProductCode = 0;
				if (productValues.Price !== undefined && productValues.Price !== null) {
					var priceValuesTemp = oDetailController.getView().getModel("fastData").getObject("/" + productValues.Price.__ref);
					sAddBrandProductCode = Number(priceValuesTemp.FOCProduct_Bundled_1);
				}

				//when an additional FOC product is selected and results are found, calculate some fields
				var sCogsAddFOCProduct = 0;
				aPromises.push(Services.loadFOCAdditionalBrandProductData(sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sSellingCompany, sBrandID, sAddBrandProductCode, aCommercialAgreement).then(oAddFocProduct => {
					if(oAddFocProduct){
						sCogsAddFOCProduct = oAddFocProduct.COGS * 
						(
								(productValues.UnitPerPack === "Unit") ? 1 / oAddFocProduct.PACKFACTOR : 1
						);
					}
					return oAddFocProduct;
				}));

			}

			//if all data is loaded, continue with calculations
			Promise.all(aPromises).then((values) =>{

				if(oProduct && oProduct.SKU && oProduct.SKU.Product){
							
						var uFactor = (regPriceValues.UOM === "Unit") ? skuValues.PACKFACTOR : 1;//this will convert registered price per pack if stored per unit in database
						var uCogsFactor = (productValues.UnitPerPack === "Unit") ? 1 / skuValues.PACKFACTOR : 1;
						var regPrice = regPriceValues.REGISTERED_PRICE * uFactor;//this is registered price per pack (always per pack)

						//Calculate the CIF price
						let cifPrice = (productValues.UnitPerPack === "Unit") ? regPrice / skuValues.PACKFACTOR : regPrice; //if offer in units, divide by pack factor, otherwise pack value if good
							
						//for argentinia & brazilië the offerPrice is not the preApprovedPrice
						let sDiscount = "";
						if(sCountryCode==="AR" || sCountryCode==="BR" || sCountryCode==="CL"){	
								//offer price is in this case the standard price based upon CIF price & reductions
								sPreApprovedPrice = cifPrice - (cifPrice * iStandardDiscount); //TODO get discount
								sDiscount = iStandardDiscount;
						}

						var price = {
								name: "Not Set",
								description: "",
								cifPrice: cifPrice,
								newCifPrice: cifPrice,
								discount: sDiscount, //"",//0,
								offerPrice: sPreApprovedPrice, //"",
								standardDiscount: iStandardDiscount,
								additionalDiscount: iAdditionalDiscount,
								focAbsPct: "PCT",
								focType: "FOC 1",
								foc: "",//0,
								focProduct_bund1: "",
								focAbsPct_bund1: "PCT",
								foc_bund1: "",//0,
								focChart: 0,
								businessCasePrice : "",
								netOfferPrice: "",
								deductions: productValues.DEFAULT_COMMISSION_RATE === null ? "" : productValues.DEFAULT_COMMISSION_RATE,// 0,
								netPrice: "",
								offerCurrency: offerCurrency,
								spotRate: spotRate,
								budgetRate: budgetRate,
								uom: productValues.UnitPerPack,
								cogs: cogsValues.COGS * uCogsFactor,
								cogsAddFOCProduct: sCogsAddFOCProduct, //bund1
								quantity: productValues.RequestedVolume,
								mainProductQuantity: 0,
								addFocProductQuantity: 0,
								focQuantityRounded: 0
						};
				
						if (productValues.Price !== undefined && productValues.Price !== null) {
								var priceValues = oDetailController.getView().getModel("fastData").getObject("/" + productValues.Price.__ref);
								regPrice = priceValues.RegPrice * uFactor;//offer-saved registered price per pack (assumption that UoM for price will always be same in database for same country/product/currency)
								price.cifPrice = (productValues.UnitPerPack === "Unit") ? regPrice / skuValues.PACKFACTOR : regPrice;//if offer in units, divide by pack factor, otherwise pack value if good
								var scenarioPrice;
								if (forScenario !== 0) {
									scenarioPrice = that._getScenarioPrice(oDetailController, productValues, forScenario);
									if (scenarioPrice) {
										price.name = scenarioPrice.name;
										price.description = scenarioPrice.description;
										priceValues.Discount = !forEdit 
											? ((price.cifPrice !== 0) ? (price.cifPrice - scenarioPrice.offerPrice) / price.cifPrice : 0)
											: ((price.newCifPrice !== 0) ? (price.newCifPrice - scenarioPrice.offerPrice) / price.newCifPrice : 0);
										priceValues.OfferPrice = parseFloat(scenarioPrice.offerPrice);
										priceValues.standardDiscount = parseFloat(scenarioPrice.standardDiscount);
										priceValues.additionalDiscount = parseFloat(scenarioPrice.additionalDiscount);
										priceValues.FOC_ABS_PCT = scenarioPrice.focAbsPct;
										priceValues.FOCType = scenarioPrice.focType;
										priceValues.FOC = parseFloat(scenarioPrice.foc);
										priceValues.focProduct_bund1 = scenarioPrice.FOCProduct_Bundled_1;
										priceValues.focAbsPct_bund1 = scenarioPrice.FOC_ABS_PCT_Bundled_1;
										priceValues.foc_bund1 = parseFloat(scenarioPrice.FOC_Bundled_1);
									}
								}
				
								price.discount = !forEdit ? parseFloat(priceValues.Discount) : ((price.newCifPrice !== 0) ? (price.newCifPrice -  parseFloat(priceValues.OfferPrice)) / price.newCifPrice : 0);
								price.offerPrice = parseFloat(priceValues.OfferPrice);
								price.standardDiscount = parseFloat(priceValues.StandardDiscount);
								price.additionalDiscount = parseFloat(priceValues.AdditionalDiscount);
								price.focAbsPct = priceValues.FOC_ABS_PCT;
								price.focType = priceValues.FOCType;
								price.foc = parseFloat(priceValues.FOC);
								price.focProduct_bund1 = priceValues.FOCProduct_Bundled_1;
								price.focAbsPct_bund1 = priceValues.FOC_ABS_PCT_Bundled_1;
								price.foc_bund1 = parseFloat(priceValues.FOC_Bundled_1);
								//mainProductQuantity
								var iFocQuantity = price.foc * price.quantity;
								var iFocQuantityRounded = Math.ceil(iFocQuantity); //formatter.roundXDecimals(iFocQuantity, 0);  we want to use ceiling rounding
								price.focQuantityRounded = iFocQuantityRounded;
								price.businessCasePrice = parseFloat(priceValues.BusinessCasePrice);
								price.mainProductQuantity = (productValues.RequestedVolume 
									+ (
									(price.focType === "FOC 1") 
									? 0 //FOC is part of requested volume
									: //FOC is on top of requested quantity
										(
											(price.focAbsPct === "PCT") //JH: corrected was using field from additional product
											? iFocQuantityRounded
											: price.foc
										)
									));
								//additional FOC product Quantity
								var iFocQuantityAddProduct = price.foc_bund1 * price.quantity;
								var iFocQuantityAddProductRounded = Math.ceil(iFocQuantityAddProduct); //formatter.roundXDecimals(iFocQuantityAddProduct, 0);
								price.addFocProductQuantity = (price.focAbsPct_bund1 === "PCT") ? iFocQuantityAddProductRounded : price.foc_bund1;//JH: corrected was using single "=" in check!!!!
										
								price.focChart = (price.focAbsPct === "PCT") ? ((price.focType === "FOC 1") ? price.foc : 1 - 1 / (1 + price.foc)) : ((price.focType ===
											"FOC 1") ? 1 - (productValues.RequestedVolume - price.foc) / productValues.RequestedVolume : 1 - productValues.RequestedVolume / (
											productValues.RequestedVolume + price.foc));
								price.deductions = priceValues.Deductions;
								if (!scenarioPrice) {
										price.netOfferPrice = parseFloat(priceValues.NetofferPrice);
										price.netPrice = parseFloat(priceValues.NetPrice);
								} else if(sCountryCode==="AR"||sCountryCode==="BR") {
										price.netOfferPrice = price.cifPrice * (1 - (price.standardDiscount + price.additionalDiscount)) * (1 - price.focChart);
										price.netPrice = (1 - price.deductions) * price.netOfferPrice;
								} else {
										price.netOfferPrice = price.offerPrice * (1 - price.focChart);
										price.netPrice = price.netOfferPrice * (1 - price.deductions);			
								}
								
						}
				
						if (chartId !== null) {
								that._setPriceChart(oDetailController, chartId, price);
						}
						if (formId !== null) {
								that._setPriceForm(oDetailController, formId, price, forEdit, (forScenario !== 0));
						}
						if (tableId !== null) {
								if (chartId !== null) {
									that._setProfitTableH(oDetailController, tableId, price);
								} else {
									that._setProfitTableV(oDetailController, tableId, price);
								}
						}
				
						oDetailController._productCode = skuValues.PRODUCTPACKID;

				}

				//hide waiting screen
				oDetailController.getView().setBusy(false); 

			});
		
		},
		
		//local method for setting scenarioPrice
		_getScenarioPrice: function (oDetailController, productValues, iScenario) {
			var scenarioPrice;
			
			if (productValues.Scenario) {
				var iScenariosLength = (productValues.Scenario.__list) ? productValues.Scenario.__list.length : iScenario; //TODO once we are fully working on fastcap, only iScenario should be kept
				if (iScenariosLength >= iScenario) {
					if(productValues.Scenario.__list){//TODO once fully on fastcap, we should only keep else part of this coding..
						var oScenario = oDetailController.getView().getModel("fastData").getObject("/" + productValues.Scenario.__list[iScenario - 1]);	
					}else{
						var oScenario = oDetailController.getView().getModel("fastData").getObject("/" + productValues.Scenario.__ref);
					}
					
					scenarioPrice = {
						name: oScenario.Name,
						description: oScenario.Description,
						offerPrice: oScenario.OfferPrice,
						focAbsPct: oScenario.FOC_ABS_PCT,
						foc: oScenario.FOC,
						focType: oScenario.FOCType,
						FOC_ABS_PCT_Bundled_1: oScenario.FOC_ABS_PCT_Bundled_1,
						FOC_Bundled_1: Number(oScenario.FOC_Bundled_1),
						FOCProduct_Bundled_1: parseFloat(oScenario.FOCProduct_Bundled_1)
					};
				}
			}
			return scenarioPrice;
		},
		
		//local method for setting history
		_setTenderHistory: function (oDetailController, productPath) {
			var oObjectPage = oDetailController.getView().byId("DetailPage");
			var forEdit = oObjectPage.getShowFooter();
			
			var oTable = forEdit ? oDetailController.byId("editTenderHistoryId") : oDetailController.byId("tenderHistoryId");
			var oCurrentInstitute = forEdit ? oDetailController.byId("editCurrentInstituteCheckId") : oDetailController.byId("currentInstituteCheckId");
			//JHHERE think current/parent institu
			var oParentInstitute = forEdit ? oDetailController.byId("editParentInstituteCheckId") : oDetailController.byId("parentInstituteCheckId");
			var oCurrentCountry = forEdit ? oDetailController.byId("editCurrentCountryCheckId") : oDetailController.byId("currentCountryCheckId");
			var oWon = forEdit ? oDetailController.byId("editWonCheckId") : oDetailController.byId("wonCheckId");
			var oLost = forEdit ? oDetailController.byId("editLossCheckId") : oDetailController.byId("lossCheckId");

			var tenderValues = oDetailController.getView().getModel("fastData").getObject(Services.getSelectedTenderPath());
			var productValues = oDetailController.getView().getModel("fastData").getObject(productPath);
			var oFilters =[];
			oFilters.push(new sap.ui.model.Filter("PRODUCT_ID", "EQ", productValues.ProductCode));
			if (oCurrentInstitute.getSelected()) {
				oFilters.push(new sap.ui.model.Filter("INSTITUTE_ID", "EQ", tenderValues.InstituteID));
			}
			if (oParentInstitute.getSelected()) {
				oFilters.push(new sap.ui.model.Filter("PARENT_ID", "EQ", tenderValues.InstituteID));
			}
			if (oCurrentCountry.getSelected()) {
				oFilters.push(new sap.ui.model.Filter("COUNTRY_CODE", "EQ", Services.getSelectedCountry()));
			}
			if (oWon.getSelected()) {
				oFilters.push(new sap.ui.model.Filter("OUTCOME", "EQ", "Won"));
			}
			if (oLost.getSelected()) {
				oFilters.push(new sap.ui.model.Filter("OUTCOME", "EQ", "Lost"));
			}

			var oSorter = new sap.ui.model.Sorter({
				path: "OFFER_DATE",
				descending: true
			});

			var oTenderHistoryTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{fastData>TENDER_ID}"
					}),
					new sap.m.Text({
						text: "{fastData>TENDER_NAME}"
					}),
					new sap.m.Text({
						text: "{fastData>OFFER_ID}"
					}),
					new sap.m.Text({
						text: "{path:'fastData>OFFER_DATE',formatter:'FAST_NS0FAST0.utils.Formatter.bdate'}"

					}),
					new sap.m.Text({
						text: "{fastData>INSTITUTE_NAME}"
					}),
					new sap.m.Text({
						text: "{fastData>PRODUCT_NAME}"
					}),
					new sap.m.ObjectNumber({
						number: {
							parts: [{
								path: "UNIT_PRICE",
								model: "fastData"
							}, {
								path: "CURRENCY",
								model: "fastData"
							}],
							formatter: formatter.price
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							parts: [{
								path: "PACK_PRICE",
								model: "fastData"
							}, {
								path: "CURRENCY",
								model: "fastData"
							}],
							formatter: formatter.price
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							parts: [{
								path: "UNIT_NET_PRICE",
								model: "fastData"
							}, {
								path: "CURRENCY",
								model: "fastData"
							}],
							formatter: formatter.price
						}
					}),
					new sap.m.ObjectNumber({
						number: {
							parts: [{
								path: "UNIT_NET_PRICE",
								model: "fastData"
							}, {
								path: "CURRENCY",
								model: "fastData"
							}],
							formatter: formatter.price
						}
					}),
					new sap.m.Text({
						text: "{fastData>UOM}"
					}),
					new sap.m.Text({
						text: "{fastData>FOC}"
					}),
					new sap.m.Text({
						text: "{fastData>OUTCOME}"
					})
				]
			});
			oTable.bindItems({
				path: "/TenderHistory",
				model: "fastData",
				filters: oFilters,
				sorter: oSorter,
				template: oTenderHistoryTemplate
			});
		},
		
		/**
		 * Get standard discount that is valid for a certain Brand or Distributor
		 * @param {string} sDistributorID distributor
		 * @param {string} sBrandID brand
		 */
		getStandardDiscount: async function(sDistributorID, sBrandID){

			if(!sDistributorID || !sBrandID){
				return null;
			}else{
				let oAggregatedDistributorBrandPolicy = await Services.getService('DistributorBrandPolicy').getAggregatedDistributorBrandPolicy(sDistributorID, sBrandID);
				return Number(oAggregatedDistributorBrandPolicy.data.results[0].StandardDiscount);
			}
			
			
		},

		//load all latest spotrate, budgetrate, regprice, cogs
		loadAllUpToDatePrices: function (oOffer, oProduct, oRegisterdPrice){
			
			var that = this;
			
			//catch all promises in an array
			let promises = [];

			//if all back-end load promsises are done
			var oDeferred_all = $.Deferred();
			
			//change values with up to date values
			var oUpToDatePrices = {
				RegPrice : "",
				COGS : "",
				SpotRate : "",
				BudgetRate : ""
			}
															
			//object with all prices we want to load from
			var iRegPrice = "";
			promises.push(that.loadNewCalcRegPrice(oOffer, oProduct, oRegisterdPrice, oOffer.Currency).then(function(oData){
				iRegPrice = oData;
			}));
			
			
			//Getting the up-to-date COGS values from master data if exists
			var oCogsValues = {
				COGS: 0
			};
			if (oProduct.Cogs !== null) {
				oCogsValues = oProduct.Cogs;
			}
			var iCOGS = oCogsValues.COGS;
			
			//load Budget rate again from database
			var sCountry = "";
			var sX_TYPE = "Budget";
			var sCurrencyFrom = oOffer.Currency;
			var sCurrencyTo = "EUR";
			var iBudgetRate = null;
			promises.push(that.loadExchangeRates(sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE).then(function(oData){
				if(oData !== false){
					iBudgetRate = oData.X_RATE;
				}
			}));
			
			//load Spot rate again from database
			sCountry = "";
			sX_TYPE = "Monthly Average";
			sCurrencyFrom = oOffer.Currency;
			sCurrencyTo = "EUR";
			let iSpotRate = null;
			promises.push(that.loadExchangeRates(sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE).then(function(oData){
				if(oData !== false){
					iSpotRate = oData.X_RATE;
				}
			}));
			
			
			//if all promises received = meaning all data is loaded from back-end
			Promise.all(promises).then((result) => {
				
				//if all data is received, fill object to return
				oUpToDatePrices.RegPrice = iRegPrice; //this one can be false, meaning something was wrong
				oUpToDatePrices.COGS = iCOGS;
				oUpToDatePrices.SpotRate = iSpotRate;
				oUpToDatePrices.BudgetRate = iBudgetRate;
				
				//return results				
				oDeferred_all.resolve(oUpToDatePrices);

			});
			
			//promise that results follow
			return oDeferred_all.promise();
		},
		
		//load Exchange Rates again from database
		loadExchangeRates: function (sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE){
			
			//that is this
			var oDeferred = $.Deferred();
			var sGroupId = "OfferProducts-loadExchangeRates-" + sX_TYPE;
			
			//get fast data calls
			var oFastDataCalls = Services.getDefaultModel();

			//Build the path
			var sPath = oFastDataCalls.createKey("/ExchangeRates", {
				//COUNTRY_CODE: sCountry,
				CURRENCY_FROM: sCurrencyFrom,
				CURRENCY_TO: sCurrencyTo,
				X_TYPE: sX_TYPE
			});
			
			//we gave a groupID so this can be in separate batch (otherwise the whole batch failes)
			oFastDataCalls.read(sPath, {
				groupId: sGroupId,
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
			
		},
		
		//load Exchange Rates again from database
		loadCountryRegisteredPrice: function (sCountry, sUOM, sProduct, sCurrency){
			
			//get fast data calls
			var oFastDataCalls = Services.getDefaultModel();
			
			//Rates for country from offer currency to EUR
            var sPath = oFastDataCalls.createKey("/CountryRegisteredPrice", {
                COUNTRY_CODE: sCountry,
                UOM: sUOM,
                PRODUCT_ID: sProduct,
                CURRENCY: sCurrency
            });
            
            
			//Read country
			//we give a groupId beceause if nothing is found we should keep the other calls to procede
            return new Promise(function (resolve, reject) {
                oFastDataCalls.read(sPath, {
					groupId: "OfferProducts-CountryRegisteredPrice",
                    success: function (oData, oResponse) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        //resolve, beceause we check on false to continue in correct way, if no results found
						resolve(false);
                    }
                });
            });
		},
		
		//load default price
		loadPreApprovedPrices: function (sInstituteID, sProductPackID, sCurrency){
			
			//get fast data calls
			var oFastDataCalls = Services.getDefaultModel();
			
			//Rates for country from offer currency to EUR
            var sPath = oFastDataCalls.createKey("/PreApprovedPrices", {
                InstituteId: sInstituteID,
                ProductPackId: sProductPackID,
                Currency: sCurrency
            });
            
            
			//Read country
			//we give a groupId beceause if nothing is found we should keep the other calls to procedeed
            return new Promise(function (resolve, reject) {
                oFastDataCalls.read(sPath, {
					groupId: "OfferProducts-PreApprovedPrices",
                    success: function (oData, oResponse) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        //resolve, beceause we check on false to continue in correct way, if no results found
						resolve(false);
                    }
                });
            });
		},
		
		//load newly calculated: RegPrice
		loadNewCalcRegPrice: function (oOffer, oProduct, oRegisterdPrice, sCurrency) {
			
			var oDeferred = $.Deferred();
			var that = this;
			
			//get country
			var sCountry = Services.getSelectedCountry();
			
			//catch all data calls promise in  array, continue only if all are done
			let promises = [];

			//currency of offer
			var sOfferCurrency = sCurrency;
				
			//unit per pack of product
			var offerUnit = oProduct.UnitPerPack;
				
			//Registered Price
			var regPriceValues = {
					CURRENCY: sOfferCurrency,
					UOM: offerUnit,
					REGISTERED_PRICE: 0
			};
			
			promises.push(that.loadCountryRegisteredPrice(sCountry, offerUnit, oProduct.ProductCode, sOfferCurrency).then(function (sRegisteredPrice) {
				if(sRegisteredPrice){
					regPriceValues.REGISTERED_PRICE = parseFloat(sRegisteredPrice.REGISTERED_PRICE);
				} else {
					regPriceValues.REGISTERED_PRICE = 0;
				}
			}));
			
			//Dedicated registered price exchange rate
			Promise.all(promises).then((result) => {
				var sRegPrice = regPriceValues.REGISTERED_PRICE;
				oDeferred.resolve(sRegPrice);	
			});
			
			//return promise so the function can check if execution is done
			return oDeferred.promise();
		},
		
		//check if offerprice is lower then the registered price
		checkOfferPriceLowerRegisterPrice: function(sOfferPrice, sRegPrice){
			
			var bValid = false;
			
			//check reg Price non existing, then true
			if(!sRegPrice){
				bValid = true;
				return bValid;
			}
			
			//Checking that offer price is lower than registered one - saving is not allowed if not
			if (Math.round(10000*sRegPrice) !== 0 && Math.round(10000*sOfferPrice) > Math.round(10000*sRegPrice)) {
				//offer price can not be higher then the registerd price
				bValid = false;
			}else{
				//offerprice is lower then registerd price
				bValid = true;
			}
			
			return bValid;
			
		},
		
		//convert registered price, so its in the same format as offer price (as shown on financial offer tab)
		convRegisteredPrice: function(oProduct, regPrice){
			
			
			if(regPrice){
	
				//no conversion possible
				if(regPrice.REGISTERED_PRICE > 0){
					//convert registered price, to same format as offerPrice
					var sUnitPerPackOffer = oProduct.UnitPerPack;
					var sUOMregPrice = regPrice.UOM;
					var iPackFactor = oProduct.SKU.PACKFACTOR;
						
					//calculate uFactor
					switch(sUnitPerPackOffer) {
					  case "Unit":
						    if(sUOMregPrice === "Pack"){
								var uFactor = 1 / iPackFactor;
						    }else{
								var uFactor = 1;
						    }
						    break;
					  case "Pack":
						    if(sUOMregPrice === "Unit"){
								var uFactor = iPackFactor;	
						    }else{
								var uFactor = 1;
						    }
						    break;
					  default:
							//for other types we have
						    var uFactor = 1;
					}
						
					//calculate the converted reg price
					var iConvertedRegPrice = regPrice.REGISTERED_PRICE * uFactor;
					
				}else{
					
					//value is 0 and stays 0 (or invalid to calculate if negative)
					var iConvertedRegPrice = regPrice.REGISTERED_PRICE;
					
				}
				
			}else{
				
				var iConvertedRegPrice = regPrice.REGISTERED_PRICE;
				
			}

			return iConvertedRegPrice;
			
		},
		
		//when saving financial offer or when changing currency or other fields...
		updateFinancialOffer: async function (oEvent, oDetailController) {
			
			var that = this;
			let aPromises = [];

			//wait screen
			oDetailController.getView().setBusy(true); 

			//wait for update
			var oDeferred = $.Deferred();
			var productValues = oDetailController.getView().getModel("fastData").getObject(oDetailController.pPath);
			var skuValues = oDetailController.getView().getModel("fastData").getObject("/" + productValues.SKU.__ref);
			var offerCurrency = oDetailController.byId("idEditCurrency").getSelectedKey();

			var regPriceValues = {
				CURRENCY: offerCurrency,
				UOM: productValues.UnitPerPack,
				REGISTERED_PRICE: 0
			};
			
			if (productValues.RegisteredPrice !== null) {
				aPromises.push(that.loadCountryRegisteredPrice(Services.getSelectedCountry(), productValues.UnitPerPack, Services.getSelectedProductID(), offerCurrency).then(sRegisteredPrice => {
					if(sRegisteredPrice){
						regPriceValues.REGISTERED_PRICE = sRegisteredPrice.REGISTERED_PRICE;
						regPriceValues.UOM = sRegisteredPrice.UOM;
					} else {
						regPriceValues.REGISTERED_PRICE = 0;
					}
					return sRegisteredPrice;
				}));
			}
			
			//TODO take cogsValues from navigation prop (this is used directly)
			var cogsValues = {
				COGS: 0
			};
			
			if (productValues.Cogs !== null) {
				cogsValues = oDetailController.getView().getModel("fastData").getObject("/" + productValues.Cogs.__ref);
			}
			
			//load Budget rate again from database
			var sCountry = "";
			var sX_TYPE = "Budget";
			var sCurrencyFrom = offerCurrency;
			var sCurrencyTo = "EUR";
			var budgetRate = null;
			aPromises.push(that.loadExchangeRates(sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE).then(oBudgetExchangeRate=>{
				if(oBudgetExchangeRate !== false){
					budgetRate = oBudgetExchangeRate.X_RATE;
				}
				return oBudgetExchangeRate;
			}));
			
			//load Spot rate again from database
			var sCountry = "";
			var sX_TYPE = "Monthly Average";
			var sCurrencyFrom = offerCurrency;
			var sCurrencyTo = "EUR";
			var spotRate = null;
			aPromises.push(that.loadExchangeRates(sCountry, sCurrencyFrom, sCurrencyTo, sX_TYPE).then(oMonthlyAvgExchangeRates=>{
				if(oMonthlyAvgExchangeRates !== false){
					spotRate = oMonthlyAvgExchangeRates.X_RATE;
				}
				return oMonthlyAvgExchangeRates;
			}));

			//additional product get info
			var sOfferID = Services.getSelectedOfferID();
			var sProductCode = Services.getSelectedProductID();
			var oProduct = Services.getLoadedProductsForOffer(sOfferID, sProductCode);
			var sCountryCode = Services.getCountryCodeofSelectedTender(); //COUNTRY_CODE
			var sInstituteID = Services.getInstituteIDofSelectedTender(); //INSTITUTE_ID
			var sDistributorID = Services.getSelectedDistributorID();     //DISTRIBUTOR_ID
			var sTenderChannel = Services.getFastAppDataModel().getProperty('/Tender/TenderChannel');
			var sSellingCompany = productValues.SellingCompany; //Services.getFastAppDataModel().getProperty("/EditOffer/SellingCompany");
			var sBrandID = oProduct.SKU.Product.HLEVEL4_CODE;
			var aCommercialAgreement = Services.getFastAppDataModel().getProperty('/Tender/CommercialAgreement');

			let iStandardDiscount = 0;
			if(sCountryCode === 'BR' || sCountryCode === 'AR' || sCountryCode === 'CL'){
				aPromises.push(that.getStandardDiscount(sDistributorID,sBrandID).then(iResult=>{
					iStandardDiscount = iResult;
					return iResult;
				}));
			}

			//get additional FOC product if its filled
			var oAddBrandProduct = oDetailController.getView().byId("idEditPriceOffer_idFOCProdBund1");
			var sAddBrandProductCode = 0;
			if(oAddBrandProduct){
					sAddBrandProductCode = Number(oAddBrandProduct.getSelectedKey()); 
			}
			
			//get FOC additional brand product data
			let oAddFocProduct = {};
			aPromises.push(Services.loadFOCAdditionalBrandProductData(sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sSellingCompany, sBrandID, sAddBrandProductCode, aCommercialAgreement).then(oResult =>{
				oAddFocProduct = oResult;
				return oResult;
			}));

			//if all data is loaded, continue with calculations
			Promise.all(aPromises).then((values) =>{		
						
				var uFactor = (regPriceValues.UOM === "Unit") ? skuValues.PACKFACTOR : 1;
				var uCogsFactor = (productValues.UnitPerPack === "Unit") ? 1 / skuValues.PACKFACTOR : 1;
				//var regPrice = regPriceValues.REGISTERED_PRICE * uFactor * registeredRate;
				var regPrice = regPriceValues.REGISTERED_PRICE * uFactor;
				var cifPrice = (productValues.UnitPerPack === "Unit") ? regPrice / skuValues.PACKFACTOR : regPrice;
				var deductions = oDetailController.byId("idEditPriceOffer_idDeduction").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOffer_idDeduction").getValue())/100 : 0;
				
				let offerPrice = 0;
				if(sCountryCode==="AR" || sCountryCode==="BR" || sCountryCode==="CL"){
					let sPreApprovedPrice = cifPrice - (cifPrice * iStandardDiscount);
					offerPrice = sPreApprovedPrice;
				}else{
					offerPrice = oDetailController.byId("idEditPriceOffer_idOfferPrice").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOffer_idOfferPrice").getValue().replace(",","")) : 0;
				}

				//JH changed
				var standardDiscount = oDetailController.byId("idEditPriceOffer_idStandardDiscount") && oDetailController.byId("idEditPriceOffer_idStandardDiscount").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOffer_idStandardDiscount").getValue()) / 100 : 0;
				if(sCountryCode==="AR"||sCountryCode==="BR"||sCountryCode==="CL"){
					standardDiscount = cifPrice && cifPrice!==0 ? (cifPrice - offerPrice) / cifPrice : 0;
					standardDiscount = iStandardDiscount;
				}
				//JH changed
				
				var additionalDiscount = oDetailController.byId("idEditPriceOffer_idAdditionalDiscount") && oDetailController.byId("idEditPriceOffer_idAdditionalDiscount").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOffer_idAdditionalDiscount").getValue()) / 100 : 0;
				var businessCasePrice = oDetailController.byId("idEditPriceOffer_idBusinessCasePrice").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOffer_idBusinessCasePrice").getValue().replace(",","")) : 0;
				var focAbsPct = oDetailController.byId("idEditPriceOffer_idFocAbsPct").getSelectedKey();
				//var focType = oDetailController.byId("idEditPriceOffer_idFocType").getSelectedKey();
				var focType = oDetailController.byId("idEditFOCType").getSelectedKey();
				var foc = oDetailController.byId("idEditPriceOffer_idFoc").getValue() != ""
				? (focAbsPct === "PCT") ? parseFloat(oDetailController.byId("idEditPriceOffer_idFoc").getValue()) / 100 : parseFloat(oDetailController.byId("idEditPriceOffer_idFoc").getValue())
				: 0;
				var focAbsPct_bund1 = oDetailController.byId("idEditPriceOffer_idFocAbsPct1").getSelectedKey();
				var focProduct_bund1 = Number(oDetailController.byId("idEditPriceOffer_idFOCProdBund1").getSelectedKey());
				var foc_bund1 = oDetailController.byId("idEditPriceOffer_idFoc1").getValue() != ""
				? (focAbsPct_bund1 === "PCT") ? parseFloat(oDetailController.byId("idEditPriceOffer_idFoc1").getValue()) / 100 : parseFloat(oDetailController.byId("idEditPriceOffer_idFoc1").getValue())
				: 0;
			
				//when an additional FOC product is selected and results are found, calculate some fields
				var sCogsAddFOCProduct = 0;
				if(oAddFocProduct){
					sCogsAddFOCProduct = oAddFocProduct.COGS * 
					(
						(productValues.UnitPerPack === "Unit") ? 1 / oAddFocProduct.PACKFACTOR : 1 //JH: same correction for factor
					);
				}
				
				var focChart = (focAbsPct === "PCT") ? ((focType === "FOC 1") ? foc : 1 - 1 / (1 + foc)) : ((focType === "FOC 1") ? 1 - (
					productValues.RequestedVolume - foc) / productValues.RequestedVolume : 1 - productValues.RequestedVolume / (productValues.RequestedVolume +
					foc));
				var netOfferPrice = cifPrice!==0 ? cifPrice * (1 - (standardDiscount + additionalDiscount)) * (1 - focChart) : offerPrice * (1 - focChart);//JH changed

				let netPrice, discount = "";
				if(sCountryCode==="AR"||sCountryCode==="BR"||sCountryCode==="CL"){
					netPrice = (1 - deductions) * netOfferPrice;
					discount = standardDiscount;
				}else{
					netPrice = (1 - deductions) * netOfferPrice;
					discount = (cifPrice !== 0) ? (cifPrice - offerPrice) / cifPrice : 0;
				}		
		
				//mainProductQuantity
				var iFocQuantity = foc * productValues.RequestedVolume;
				var iFocQuantityRounded = Math.ceil(iFocQuantity); //formatter.roundXDecimals(iFocQuantity, 0); we want to use ceiling rounding
				var iMainProductQuantity = (productValues.RequestedVolume 
						+ (
						(focType === "FOC 1") 
						? 0 //FOC is part of requested volume
						: //FOC is on top of requested quantity
							(
								(focAbsPct === "PCT") //JH: same correction to use main product fielf
								? iFocQuantityRounded
								: foc
							)
						));
				//additional FOC product Quantity
				var iFocQuantityAddProduct = foc_bund1 * productValues.RequestedVolume;
				var iFocQuantityAddProductRounded = formatter.roundXDecimals(iFocQuantityAddProduct, 0);
				var iAddFocProductQuantity = (focAbsPct_bund1 === "PCT") ? iFocQuantityAddProductRounded : foc_bund1;
					
				var price = {
					cifPrice: cifPrice,
					newCifPrice: cifPrice,
					discount: discount,
					offerPrice: offerPrice,
					standardDiscount: standardDiscount,
					additionalDiscount: additionalDiscount,
					focAbsPct: focAbsPct,
					focType: focType,
					foc: foc,
					focChart: focChart,
					businessCasePrice: businessCasePrice,
					netOfferPrice: netOfferPrice,
					deductions: deductions,
					netPrice: netPrice,
					offerCurrency: offerCurrency,
					spotRate: spotRate,
					budgetRate: budgetRate,
					uom: productValues.UnitPerPack,
					cogs: cogsValues.COGS * uCogsFactor,
					cogsAddFOCProduct: sCogsAddFOCProduct, //bund1
					quantity: productValues.RequestedVolume,
					focAbsPct_bund1: focAbsPct_bund1,
					focProduct_bund1: focProduct_bund1,
					foc_bund1: foc_bund1,
					mainProductQuantity: iMainProductQuantity,
					addFocProductQuantity: iAddFocProductQuantity,
					focQuantityRounded: iFocQuantityRounded
				};
			
				that._setPriceChart(oDetailController, "idEditListToNetChart", price);
				that._setPriceForm(oDetailController, "idEditPriceOffer", price, true, false);
				that._setProfitTableH(oDetailController, "idEditProfitabilityTable", price);
			
				that._updateScenario(oDetailController, price, productValues, 1);
				that._updateScenario(oDetailController, price, productValues, 2);
				that._updateScenario(oDetailController, price, productValues, 3);

				oDeferred.resolve("all updated on the screen");

				//close wait screen
				oDetailController.getView().setBusy(false); 

			});

			//wait for result
			return oDeferred.promise();
		},
		
		//local method for updating the scenario
		_updateScenario: function (oDetailController, price, productValues, idScenario) {

			//get selected country
			let sCountryCode = Services.getSelectedCountry();

			//get name & description for specific scenario
			price.name = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idName").getValue();
			price.description = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idDescription").getValue();

			//main foc product from selected scenario
			let offerPrice = 0;
			if(sCountryCode==="AR" || sCountryCode==="BR" || sCountryCode==="CL"){
				//for AR/BR/CL the offerPrice is a pre-approved price that is not changable
				let sPreApprovedPrice = price.cifPrice - (price.cifPrice * price.standardDiscount);
				offerPrice = sPreApprovedPrice;
			}else{
				//for other countries this can be filled
				offerPrice = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idOfferPrice").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idOfferPrice").getValue().replace(",","")) : 0;
			}

			let standardDiscount = 0;
			//var standardDiscount = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idStandardDiscount").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idStandardDiscount").getValue()) / 100 : 0;							 
			standardDiscount = price.cifPrice && price.cifPrice!==0 ? (price.cifPrice - offerPrice) / price.cifPrice : 0;
	
			var additionalDiscount = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idAdditionalDiscount").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idAdditionalDiscount").getValue()) / 100 : 0;
			var focAbsPct = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFocAbsPct").getSelectedKey();
			var foc = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFoc").getValue() != "" ? parseFloat(oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFoc").getValue()) : 0;
			if (focAbsPct === "PCT"){
				foc = foc / 100;
			}

			//var focType = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFocType").getSelectedKey();
			var focType = oDetailController.byId("idEditFOCType").getSelectedKey();
			
			//mainProductQuantity
			var iFocQuantity = foc * productValues.RequestedVolume;
			var iFocQuantityRounded = Math.ceil(iFocQuantity); //formatter.roundXDecimals(iFocQuantity, 0); we want to use ceiling rounding
			var iMainProductQuantity = (productValues.RequestedVolume 
					     + (
					     (focType === "FOC 1") 
					     ? 0 //FOC is part of requested volume
					     : //FOC is on top of requested quantity
					    	(
					     		(focAbsPct === "PCT") //JH: same correction to use main product fielf
					     		? iFocQuantityRounded
					     		: foc
					     	)
					     ));
			
			//get additional foc product from selected scenario
			var focAbsPct_bund1 = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFocAbsPct1").getSelectedKey();
			var focProduct_bund1 = Number(oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFOCProdBund1").getSelectedKey());
			var foc_bund1 = oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFoc1").getValue() != ""
			? (focAbsPct_bund1 === "PCT") ? parseFloat(oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFoc1").getValue()) / 100 : parseFloat(oDetailController.byId("idEditPriceOfferScenario" + idScenario + "_idFoc1").getValue())
			: 0;

			//additional FOC product Quantity
			var iFocQuantityAddProduct = foc_bund1 * productValues.RequestedVolume;
			var iFocQuantityAddProductRounded = Math.ceil(iFocQuantityAddProduct); //formatter.roundXDecimals(iFocQuantityAddProduct, 0);
			var iAddFocProductQuantity = (focAbsPct_bund1 === "PCT") ? iFocQuantityAddProductRounded : foc_bund1;
			
			
			var focChart = (focAbsPct === "PCT") ? ((focType === "FOC 1") ? foc : 1 - 1 / (1 + foc)) : ((focType === "FOC 1") ? 1 - (
				productValues.RequestedVolume - foc) / productValues.RequestedVolume : 1 - productValues.RequestedVolume / (productValues.RequestedVolume +
				foc));
			var netOfferPrice = price.cifPrice !== 0 ? price.cifPrice * (1 - (standardDiscount + additionalDiscount)) * (1 - focChart): offerPrice * (1 - focChart);
			var netPrice = (1 - price.deductions) * netOfferPrice;


			price.offerPrice = offerPrice;
			price.focAbsPct = focAbsPct;
			price.foc = foc;
			price.focType = focType;
			price.focAbsPct_bund1 = focAbsPct_bund1;
			price.focProduct_bund1 = focProduct_bund1;
			price.foc_bund1 = foc_bund1;
			price.netOfferPrice = netOfferPrice;
			price.netPrice = netPrice;
			price.discount = (price.cifPrice !== 0) ? (price.cifPrice - offerPrice) / price.cifPrice : 0;
			price.standardDiscount = standardDiscount;
			price.additionalDiscount = additionalDiscount;

			price.mainProductQuantity = iMainProductQuantity;
			price.addFocProductQuantity = iAddFocProductQuantity;
			price.focQuantityRounded = iFocQuantityRounded;
					
			this._setPriceForm(oDetailController, "idEditPriceOfferScenario" + idScenario, price, true, true);
			this._setProfitTableV(oDetailController, "idEditProfitabilityScenario" + idScenario, price);
		},
		
		//product is selected (start from detail)
		onProductSelected: function (oDetailController, sProductPath) {
			
			/*
			//when product is selected we check if we have a additional FOC brand product oDetailController is granted to the customer
			$.when(Services.loadFOCAdditionalBrandProductData(sInstituteID, sCountryCode, sDistributorID, sTenderChannel, sSellingCompany, sAddBrandProductCode)).done(function(oData){
				//check if product exist in list
				if(oData && oData.results && oData.results.length > 0){
					Services.	
				}
			});
			*/
			
			//var productPath = oEvent.getSource().getBindingContext("fastData").getPath(); //oEvent is no longer a paramter of onProductSelected
			var oObjectPage = oDetailController.getView().byId("DetailPage");
			var forEdit = oObjectPage.getShowFooter();
			if (forEdit) {
				this._setPricingData(oDetailController, "idEditPriceOffer", "idEditListToNetChart", "idEditProfitabilityTable", sProductPath, forEdit, 0);
				this._setPricingData(oDetailController, "idEditPriceOfferScenario1", null, "idEditProfitabilityScenario1", sProductPath, forEdit, 1);
				this._setPricingData(oDetailController, "idEditPriceOfferScenario2", null, "idEditProfitabilityScenario2", sProductPath, forEdit, 2);
				this._setPricingData(oDetailController, "idEditPriceOfferScenario3", null, "idEditProfitabilityScenario3", sProductPath, forEdit, 3);

				this._setTenderHistory(oDetailController, sProductPath);
			} else {
				this._setPricingData(oDetailController, "idPriceOffer", "idListToNetChart", "idProfitabilityTable", sProductPath, forEdit, 0);
				//this._setPricingData(oDetailController, "idPriceOfferScenario1", null, "idProfitabilityScenario1", sProductPath, forEdit);
				//this._setPricingData(oDetailController, "idPriceOfferScenario2", null, "idProfitabilityScenario2", sProductPath, forEdit);
				//this._setPricingData(oDetailController, "idPriceOfferScenario3", null, "idProfitabilityScenario3", sProductPath, forEdit);

				this._setTenderHistory(oDetailController, sProductPath);
			}
			
		},
		
		//Filter for history table (first detail onHistoryFilterCheck)
		onHistoryFilterCheck: function (oDetailController) {
			this._setTenderHistory(oDetailController, oDetailController.pPath);
		},
		
		//method for displaying binding financial offer page (only used on clicking on a offer in the financial tab (financialofferview fragment)
		setFinancialOfferDisplayBinding: function (oDetailController) {
		
			//oEvent.getSource().getBindingContext("fastData").getPath();
			var oOffer = Services.getLoadedOffer(Services.getSelectedOfferID());
			Services.getFastAppDataModel().setProperty("/EditOffer/", oOffer);
			var sOfferPath = Services.getSelectedOfferPath();
			
			//Currency (TODO check services loadCurrency)
			var oCurrency = oDetailController.byId("idCurrency");
			oCurrency.bindItems({
				path: "fastData>/CountryCurrency",
				sorter: new sap.ui.model.Sorter("SORTER"),
				filters: [new sap.ui.model.Filter("COUNTRY_CODE", sap.ui.model.FilterOperator.EQ, oDetailController._country)],
				template: new sap.ui.core.Item({
					text: "{fastData>CURRENCY}",
					key: "{fastData>CURRENCY}"
				})
			});
			oCurrency.setSelectedKey(oOffer.Currency);
			
			//Financial offer table for products build the template
			var oFinancialOfferTemplate = new sap.m.ColumnListItem({
				type: "Navigation",
				press: oDetailController.onFinancialOfferProductItemPress.bind(oDetailController),
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
								path: "fastAppData>/EditOffer/Currency",
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
								path: "fastAppData>/EditOffer/Currency",
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
								path: "fastAppData>/EditOffer/Currency"
							}, {
								path: "fastData>UnitPerPack"
							},{
								path: "fastData>SKU/PACKFACTOR"
							},{
								path: "fastData>Price/SpotRate"
							}],
							formatter: formatter.cogs
						}
					}),
					//gross sales
					new sap.m.ObjectNumber({
						number: {
							parts: [{
								path: "fastData>Price/OfferPrice"
							}, {
								path: "fastData>RequestedVolume"
							}, {
								path: "fastAppData>/EditOffer/Currency"
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
								path: "fastAppData>/EditOffer/Currency"
							}, {
								path: "fastData>Price/FOC"
							}, {
								path: "fastData>Price/FOC_ABS_PCT"
							}, {
								path: "fastData>Price/FOCType"
							}],
							formatter: formatter.netSales
						}
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
								path: "fastAppData>/EditOffer/Currency"
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
							},{
								path: "fastData>SKU/PACKFACTOR"
							},{
								path: "fastData>Price/FOC_Bundled_1"
							},{
								path: "fastData>Price/FOC_ABS_PCT_Bundled_1"
							},{
								path: "fastData>Price/Bundled_1_Cogs/COGS"
							},{
								path: "fastData>Price/Bundled_1_SKU/PACKFACTOR"
							}],
							formatter: formatter.profit
						},
						state: { parts: [
									{ path: "fastData>Price/NetPrice" }, 
								    { path: "fastData>Price/COGS" },
									{ path: "fastData>RequestedVolume" },
									{ path: "fastAppData>/EditOffer/Currency" },
									{ path: "fastData>Price/SpotRate" },
									{ path: "fastData>Price/FOC" },
									{ path: "fastData>Price/FOC_ABS_PCT" },
									{ path: "fastData>Price/FOCType" },
									{ path: "fastData>UnitPerPack" },
									{ path: "fastData>SKU/PACKFACTOR" },
									{ path: "fastData>Price/FOC_Bundled_1" },
									{ path: "fastData>Price/FOC_ABS_PCT_Bundled_1" },
									{ path: "fastData>Price/Bundled_1_Cogs/COGS" },
									{ path: "fastData>Price/Bundled_1_SKU/PACKFACTOR" }
								], formatter: formatter.profitState
							}
					})
				]
			});
			
			//Financial offer table for products set binding by using template
			var sProductPath = sOfferPath + "/Product";
			var oSorter = new sap.ui.model.Sorter('SORTER');
			var oTable = oDetailController.byId("idFinancialOfferViewProduct");
			oTable.bindItems({
				path: sProductPath,
				model: "fastData",
				filters: [
					new sap.ui.model.Filter("Active", sap.ui.model.FilterOperator.EQ, 1),
					new sap.ui.model.Filter("ActiveProduct", sap.ui.model.FilterOperator.NE, 2)
				],
				sorter: oSorter,
				parameters: {
					expand: "SKU,Price,RegisteredPrice,Cogs,Price/Bundled_1_Cogs,Price/Bundled_1_SKU"
				},
				template: oFinancialOfferTemplate
			});
			
			return sOfferPath;
		}
		
	});
});