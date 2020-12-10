sap.ui.define([], function () {
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
		 * Set colour for status
		 * @param {*} sValue 
		 */
		status : function (sStatus) {
			//Check status & give the correct colour
			switch(sStatus) {
				case 'Approved':
				  return 'Success';
				  break;
				case 'Draft':
				  return 'Error' 
				  break;
				default:
				  // code block
			}
		},
	};
});