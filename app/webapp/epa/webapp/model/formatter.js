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

		discountPercentage : function (iDiscount){
			return Math.round(iDiscount * 100);
		},

		// moved to ApprovalRequest.js
		// sending_selectedKey: function(approvalStatus, approverTypeSection){

		// 	var send = "";

		// 	if (approverTypeSection === 1) {
		// 		send = "Yes";
		// 	} else {
		// 		send = "No";
		// 	}

		// 	//for waiting & notification sent, it would be forced to "no"
		// 	if (
		// 		approvalStatus === 'Waiting' ||
		// 		approvalStatus === "Notification Sent" ||
		// 		approvalStatus === "Processing" ||
		// 		approvalStatus === "Cancelling"
		// 	) {
		// 		send = "No";
		// 	}

		// 	return send;
				
		// },

		/**
		 * Returns an appropriate color Scheme for the overall approval status
		 * @param {*} sStatus 
		 * 
		 * TODO: change the color accordingly the requirements
		 */
		overallApprovalStatus: function (sStatus) {

			let sStatusToLower = sStatus ? sStatus.toLowerCase() : "";

			switch (sStatusToLower) {
				case "awaiting approval":
					return 5;
				case "price rejected":
					return 3;
				case "price approved":
					return 8;
				default:
					return 9; // default is Not Approved
			}
		}
	};
});