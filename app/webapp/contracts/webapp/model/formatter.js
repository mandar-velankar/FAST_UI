sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function(NumberFormat) {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue : function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
		/**
		 * Convert to price with grouping , & decimal . 2
		 * @param {*} price 
		 * @param {*} currency 
		 */
		price: function(price) {
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
		 	/*if (currency === undefined){
		 		return oValue;
		 	}*/
		 	//return oValue + " "+ currency;
		 	return oValue;
	    },

		/**
		 * Convert to percentage with %
		 * @param {*} pct 
		 */
		percentage: function(pct){
			var oNumberFormat = NumberFormat.getPercentInstance({
				maxFractionDigits: 2,
				decimalSeparator: "."
			});
			var oValue = oNumberFormat.format(parseFloat(pct));
			return oValue;
		}

		/**
		 * Convert to percentage without %
		 * @param {*} pct 
		 */		
		// percentageNoUnit: function(pct){
		// 	var oNumberFormat = NumberFormat.getFloatInstance({
		// 		maxFractionDigits: 2,
		// 		decimalSeparator: "."
		// 	});
		// 	var oValue = oNumberFormat.format(parseFloat(pct)*100);
		// 	return oValue;
		// },

		/**
		 * Convert amount & use grouping
		 * @param {*} requested 
		 */
		// requestedAmount: function(requested){
		// 	var oNumberFormat = NumberFormat.getFloatInstance({
		// 		maxFractionDigits: 2,
		// 		groupingEnabled: true,
		// 		groupingSeparator: ",",
		// 		decimalSeparator: "."
		// 	});
		// 	var oValue = oNumberFormat.format(requested);
		// 	return oValue;
		// }
	};
});