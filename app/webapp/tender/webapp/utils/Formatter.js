jQuery.sap.declare("FAST_NS0FAST0.utils.Formatter");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.ui.core.format.NumberFormat");
FAST_NS0FAST0.utils.Formatter = {
	bdate: function (d) {
		if (d == null) {
			return "";
			// var d = new Date();
			// var year = d.getFullYear();
			// var month = d.getMonth() + 1;
			// if (month < 10)
			// 	month = "0" + month;
			// var day = d.getDate();
			// if (day < 10)
			// 	day = "0" + day;

			// var todayDate = day + "." + month + "." + year;
			// return todayDate;
		} 
		else if (d.getFullYear() === 0){
			return "";
		}
		else {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance();
			oDateFormat.format(new Date(d));

			var year = d.getFullYear();
			var month = d.getMonth() + 1;
			if (month < 10)
				month = "0" + month;
			var day = d.getDate();
			if (day < 10)
				day = "0" + day;
			//var birthdate = month + "/" + day + "/" + year;
			//var birthdate = day + "/" + month + "/" + year;
			var birthdate = day + "." + month + "." + year;
			return birthdate;
		}
	},
	saveDateTime: function (dt) {
		if (dt.length != 0 & dt.length != undefined) {
			var year = dt.slice(6);
			var mm = dt.slice(3, 5);
			var dd = dt.slice(0, 2);
			var newdt = year + "-" + mm + "-" + dd + "T00:00:00.0000000";
			return newdt;
			//var oDate = new Date(newdt);
			//return oDate;
			//var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "dd/MM/yyyy" });
			//var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
			//var dateStr = dateFormat.format(new Date(oDate.getTime() + TZOffsetMs));
			//var parsedDate = new Date(dateFormat.parse(dateStr).getTime() - TZOffsetMs); 
			//return parsedDate;
			////return parsedDate.getTime();
		}
	},
	newDate: function (todayDate) {

		var d = new Date();

		var year = d.getFullYear();
		var month = d.getMonth() + 1;
		if (month < 10)
			month = "0" + month;
		var day = d.getDate();
		if (day < 10)
			day = "0" + day;

		var todayDate = day + "." + month + "." + year;
		return todayDate;
	},
	//TODO this setVisible is only used for showing/hiding inputfield "idNewTenderID" (this field should be removed, new offerID should simply show in "idTenderID")
	setVisible: function (val) {
		if (val == null) {
			return true;
		} else {
			return false;
		}
	},//temp because not working in other formatter
    floatNoUnit: function(value){
		let oLocale = new sap.ui.core.Locale("en-US"); //force the same number format for all countries (also if browser language is german, . will be . as decimal)
        var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
            maxFractionDigits: 2,
            minFractionDigits: 2,
            groupingEnabled: true,
            groupingSeparator: ",",
            decimalSeparator: "."
        },oLocale);
        var oValue = oNumberFormat.format(parseFloat(value));
        return oValue;
    },
	floatNoUnitEsIt: function(value){
		let oLocale = new sap.ui.core.Locale("en-US"); //force the same number format for all countries (also if browser language is german, . will be . as decimal)
        var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
            maxFractionDigits: 2,
            minFractionDigits: 2,
            groupingEnabled: false,
            groupingSeparator: ",",
            decimalSeparator: "."
        },oLocale);
        var oValue = oNumberFormat.format(parseFloat(value));
        return oValue;
    },
	percentage: function(pct){
			var oNumberFormat = sap.ui.core.format.NumberFormat.getPercentInstance({
				maxFractionDigits: 2
			});
			var oValue = oNumberFormat.format(parseFloat(pct));
			return oValue;
		},
	percentageNoUnit: function(pct){
			let oLocale = new sap.ui.core.Locale("en-US"); //force the same number format for all countries (also if browser language is german, . will be . as decimal)
			var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				maxFractionDigits: 0
			},oLocale);
			var oValue = oNumberFormat.format(parseFloat(pct)*100);
			return oValue;
		},

		bgrIcon: function(bankGuarantees){
            if(bankGuarantees){
                var foundBankGuarantee = bankGuarantees.filter(bgr => bgr.Type === this.getText())[0];
                if(foundBankGuarantee){
                    return "sap-icon://accept";
                } else {
                    return "";
                }
            } else {
                return "";
            }
			
			
		}
};