sap.ui.define([
		"sap/ui/core/format/NumberFormat",
		"FAST_NS0FAST0/libs/momentjs/moment.min"
	], function(NumberFormat, MomentJS) {
	"use strict";
	
	//private section
	var calculatedProfit = 0;
	
	var calculateProfit = function(netPrice, cogs, volume, currency, spotRate, foc, focAbsPct, focType, unit, packFactor, foc_bund1, focAbsPct_bund1, cogs_bund1, packFactor_bund1) {
			if (!netPrice){
				return "";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			var mainProductQuantity = (focType == "FOC 1") ? parseFloat(volume) :
			(
				(focAbsPct == "PCT") ? Math.ceil(parseFloat(volume)) * (1 + parseFloat(foc)) : Math.ceil(parseFloat(volume)) + parseFloat(foc)
			);
			var addFocProductQuantity = (focAbsPct_bund1 === "PCT") ? parseFloat(foc_bund1) * Math.ceil(parseFloat(volume)) : parseFloat(foc_bund1);
			
			mainProductQuantity = Math.round(mainProductQuantity);
			addFocProductQuantity = Math.round(addFocProductQuantity);
			
    		if (cogs && packFactor){
                cogs = (unit === "Unit") ? cogs / packFactor * spotRate : cogs * spotRate;
            }
            else{
                cogs = 0;
            }
           
            if (cogs_bund1 && packFactor_bund1){
                cogs_bund1 = (unit === "Unit") ? cogs_bund1 / packFactor_bund1 * spotRate : cogs_bund1 * spotRate;
            }
            else{
                cogs_bund1 = 0;
            }

			
			var totalCogs = mainProductQuantity * parseFloat(cogs) + addFocProductQuantity * parseFloat(cogs_bund1);
			var netSales = parseFloat(netPrice) * mainProductQuantity;
			
			calculatedProfit = oNumberFormat.format(netSales - totalCogs);
			
			return oNumberFormat.format(netSales - totalCogs);
	};
	
	return {
		profit: function(netPrice, cogs, volume, currency, spotRate, foc, focAbsPct, focType, unit, packFactor, foc_bund1, focAbsPct_bund1, cogs_bund1, packFactor_bund1) {
			//If net price is not yet set
			if (!netPrice){
				return "";
			}else{
				return calculateProfit(netPrice, cogs, volume, currency, spotRate, foc, focAbsPct, focType, unit, packFactor, foc_bund1, focAbsPct_bund1, cogs_bund1, packFactor_bund1) + " " + currency;
			}
			
		},
		
		profitState: function(netPrice, cogs, volume, currency, spotRate, foc, focAbsPct, focType, unit, packFactor, foc_bund1, focAbsPct_bund1, cogs_bund1, packFactor_bund1) {

			//If net price is not yet set
			if (!netPrice){
				return "None";
			}else{
				if (parseFloat(calculatedProfit) < 0) {
					return "Error";
				} else {
					return "Success";
				}				
			}
		},
		
		/*profitState: function(netPrice, cogs, volume, currency, spotRate, foc, focAbsPct, focType, unit, packFactor, foc_bund1, focAbsPct_bund1, cogs_bund1, packFactor_bund1) {
			if (calculateProfit(netPrice, cogs, volume, currency, spotRate, foc, focAbsPct, focType, unit, packFactor, foc_bund1, focAbsPct_bund1, cogs_bund1, packFactor_bund1) < 0) {
				return "Error";
			} else {
				return "Success";
			}
		},*/
		
		totalProductAmount: function(offerPrice, volume, foc, focAbsPct, focType, currency) {
			if (!offerPrice){
				return "";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			volume = (focType == "FOC 2") ? parseFloat(volume) :
			(
				(focAbsPct == "PCT") ? parseFloat(volume) * (1 - parseFloat(foc)) : parseFloat(volume) - parseFloat(foc)
			);
			volume = Math.round(volume);
			var oValue = oNumberFormat.format(parseFloat(offerPrice) * volume);
			return oValue + " "+ currency;
		},
		price: function(price, currency) {
			if (!price){
				return "";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			var oValue = oNumberFormat.format(parseFloat(price));
			if (currency === undefined){
				return oValue;
			}
			return oValue + " "+ currency;
		},
		priceTwoOrFour: function(price, currency, unit) {
			if (!price){
				return "";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: unit !== "Pack" ? 4 : 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			var oValue = oNumberFormat.format(parseFloat(price));
			if (!currency){
				return oValue;
			}
			return oValue + " "+ currency;
		},
		
		unitPrice: function(price, currency, unit, packFactor) {
			if (!price){
				return "";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 4,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			var pValue = parseFloat(price);
			if (unit !== "Unit"){
				pValue = pValue / parseFloat(packFactor);
			}
			var oValue = oNumberFormat.format(pValue);
			if (currency === undefined){
				return oValue;
			}
			return oValue + " "+ currency;
		},
		
		packPrice: function(price, currency, unit, packFactor) {
			if (!price){
				return "";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			var pValue = parseFloat(price);
			if (unit === "Unit"){
				pValue = pValue * parseFloat(packFactor);
			}
			var oValue = oNumberFormat.format(pValue);
			if (currency === undefined){
				return oValue;
			}
			return oValue + " "+ currency;
		},
		
		amount: function(amount, currency) {
			if (!amount){
				return "";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 1,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			var oValue = parseFloat(amount);
			var sFactor = "";
			if (oValue >= 1000000){
				oValue = oValue / 1000000;
				sFactor = "M ";
			}
			else if (oValue >= 1000){
				oValue = oValue / 1000;
				sFactor = "k ";
			}
			var fValue = oNumberFormat.format(oValue);
			if (!currency || currency === 'NULL'){
				return fValue + sFactor;
			}
			return fValue + sFactor + currency;
		},
		
		percentage: function(pct){
			var oNumberFormat = NumberFormat.getPercentInstance({
				maxFractionDigits: 2,
				decimalSeparator: "."
			});
			var oValue = oNumberFormat.format(parseFloat(pct));
			return oValue;
		},
		focQuotation: function(awardedCompany, foc, focAbsPct, focType, unitPerPack){
			
			var sFocDisplay = "";
				
			if(foc != 0 && awardedCompany === "Bayer"){
				if (focAbsPct === "PCT"){
					//sFocDisplay = Math.ceil(foc * 100) + '%';
					sFocDisplay = Math.round(foc * 100) + '%';
					
				} else {
					sFocDisplay = Math.ceil(foc) + ' ' + unitPerPack;
				}
			
				sFocDisplay = sFocDisplay + ' ' + ((focType === "FOC 1") ? "included" : "added");
			}
			
			return sFocDisplay;
		
		},
		percentageNoUnit: function(pct){
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				decimalSeparator: "."
			});
			var oValue = oNumberFormat.format(parseFloat(pct)*100);
			return oValue;
		},
		status:  function (sStatus) {
			try {
				switch(sStatus) {
				  case "Approved":
				    return "Success";
				  case "Rejected":
				    return "Error";
				  case "Waiting":
				  	return "Warning";
				  case "Notification Sent":
				  	return "Success";
				  default:
				    return "None";
				}
			} catch (err) {
				return "None";
			}
		},
		statusPrice:  function (isLowest) {
			try {
				if (isLowest === 1){
					return "Error";
				}
				return "None";
			} catch (err) {
				return "None";
			}
		},
		nullToBlank: function(x){
			if (x === null || x === "NULL"){
				return "";
			}
			return x;
		},
		countryValidation: function(countryCode){
			if(countryCode === 'CL'){
				return true;
			}

			return false;
		},
		
		/*
		sending_selectedKey: function (sStatus, sApproverType, sSelectedKey){
			
			//mandatory approver types should be forced to send
			if(Financial.checkMandatory(sApproverType)){
				
				//mandatory approver type
				
				//in case of approved or rejected, approval is already send
				if( sStatus === 'Approved'	|| sStatus === 'Rejected' || sStatus === "Notification Sent"){
					return sSelectedKey;
			    }else{
			    	
			    	//for waiting & notification sent, it would be forced to "no"
			    	if(sStatus === 'Waiting' || sStatus === "Processing" || sStatus === "Cancelling"){
			    		sSelectedKey = 'No';
			    	}else{
			    		sSelectedKey = 'Yes';	
			    	}
			    		
			    	return sSelectedKey;
			    }
			    
			}else{
				
				//optional approver type
				
				//for waiting & notification sent, it would be forced to "no"
			    if(sStatus === 'Waiting' || sStatus === "Processing" || sStatus === "Cancelling"){
			    	sSelectedKey = 'No';
			    }
			    
			    return sSelectedKey;
			}
		},
		*/
		
		sendingEnabled: function (sStatus, sApproverTypeSection, Financial) {
			
			/* WE TEMPORARELY MAKE THE SEND FIELD ALWAYS ENABLED... 
			--> ticket: https://trello.com/c/CKDulBnK*/
			
			/* reenabled for ticket https://trello.com/c/BWVc20av */
			
			//enable disable
			var bEnabled;
			
			
			//check status & approvertype
			if(
				sStatus !== 'Waiting'
				&& sStatus !== 'Processing'
				&& sStatus !== 'Cancelling'
				&& !(sApproverTypeSection === 1) //not mandatory
			){
				//only Approved, rejected or notification sent, send will be enabled to resend approvals
				bEnabled = true;
			}else{
				bEnabled = false;
			}
			
			return bEnabled;
			
			//return true;
		},
				
		shipment: function(nLots, iShipments, fShipment){
			//{fastAppData>NoofLots} lots at interval of {fastAppData>IntervalBetweenShipments} months with first {fastAppData>FirstShipment}
			if (nLots === 0 && iShipments === 0){
				return "Multiple deliveries from local stocks with first " + fShipment;
			}
			else{
				return nLots + " lots at interval of " + iShipments + " months with first " + fShipment;
			}
		},
		
		cogs: function(cogs, currency, unit, packFactor, spotRate) {
			if (!cogs || cogs === 0){
				return "NA";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			cogs = cogs * ((unit === "Unit") ? 1/packFactor : 1);
			var oValue = oNumberFormat.format(parseFloat(cogs) * spotRate);
			return oValue + " "+ currency;
		},
		
		grossSales: function(offerPrice, volume, currency) {
			if (!offerPrice){
				return "";
			}

			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			var oValue = oNumberFormat.format(parseFloat(offerPrice) * Math.ceil(parseFloat(volume)));
			return oValue + " "+ currency;
		},
		
		netSales: function(netPrice, volume, currency, foc, focAbsPct, focType) {
			//no need for foc when using net price, right?
			if (!netPrice){
				return "";
			}
			var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			volume = (focType === "FOC 1") ? Math.ceil(parseFloat(volume)) :
			(
				(focAbsPct === "PCT") ? Math.ceil(parseFloat(volume)) * (1 + parseFloat(foc)) : Math.ceil(parseFloat(volume)) + parseFloat(foc)
			);
			var oValue = oNumberFormat.format(parseFloat(netPrice) * Math.ceil(parseFloat(volume)));
			return oValue + " "+ currency;
		},
		
		roundXDecimals: function(value, decimals){
			//https://www.jacklmoore.com/notes/rounding-in-javascript/
			return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
		},
		
		statusInactive: function(status, activeOffer){
			return activeOffer===1 ? status : "Inactive";
		},
		
		tenderMasterHighlight: function(activeOffer, submissionDate, closingDate, status, offerId){
			var sCurrentDate = new Date();
			var sCurrentDateIncr = new Date();
			sCurrentDateIncr.setDate(sCurrentDate.getDate() + 5);
			
			if (activeOffer === 0){
				return 'None';
			} else if (activeOffer === 1 && (status !== 'Wholesale Offer' && status !== 'Offer Declined' && status !== 'Tender Closed' && status !== 'Cancelled' ) && (submissionDate > closingDate || submissionDate === '' || submissionDate === null || submissionDate.getFullYear() === 0) && closingDate < sCurrentDate){
				return 'Error';
			} else if (activeOffer === 1 && (status !== 'Wholesale Offer' && status !== 'Offer Declined' && status !== 'Tender Closed' && status !== 'Cancelled' ) && (submissionDate === '' || submissionDate === null || submissionDate.getFullYear() === 0) && closingDate < sCurrentDateIncr ){
				return 'Warning';
			} else {
				return 'Information';
			}
		},

		offerProductsColumnName: function(description){
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			return resourceBundle.getText(description);
		},

		formatUoMPrice: function(uom="Pack", packFactor=1, price){
			if(!price) {return};
			let newPrice = Number(price);
			if(~uom.toLowerCase().indexOf("unit")){ 
				newPrice = newPrice / packFactor;
			}
			const floatFormatter = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				minFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			return floatFormatter.format(newPrice);
		},
		
	};
});