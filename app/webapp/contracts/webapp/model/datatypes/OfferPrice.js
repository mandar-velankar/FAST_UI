sap.ui.define([
    "sap/ui/model/SimpleType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/NumberFormat"
], function (SimpleType, ValidateException, NumberFormat) {
    "use strict";

    return SimpleType.extend("com.bayer.tender.contracts.model.datatypes.OfferPrice", {
		
    
        /**
         * 1. convert the user’s value (external value) into a suitable internal representation of the value (internal value)
         * @param {*} sExternalValue
         */
        parseValue: function(sExternalValue, sInternalType) {
        	
            // remove the groupingSeparator
            return sExternalValue.replace(/,/g,"")
            
        },
        
        /**
         * 2. This method receives the parsed value (that is, the internal representation of the value as determined 
         * by the parseValue method) and must decide whether or not the value is valid.
         * If the input is determined to be invalid, an exception of type sap.ui.model.
         * ValidateException should be thrown from within this method.
         * @param {*} sInternalValue 
         */
        validateValue: function(sInternalValue) {
        	
            //check and trow error if needed
            const value = parseFloat(sInternalValue);
            // if(value > 2147483647 || value < -2147483648){
            //     throw new ValidateException("A number in the range from -2147483648 to 2147483647 must be specified as value for type Edm.Int32.");
            // }
            
            
        },

        /**
         * 3. This method receives the parsed value (internal value) as a parameter and must return a formatted value 
         * (that is, a corresponding external value). This formatted value is displayed on the UI.
         * @param {*} sInternalValue 
         */
        formatValue: function(sInternalValue) {

            var oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
            });
            
			var oValue = oNumberFormat.format(parseFloat(sInternalValue));
            
			return oValue;
            
        },

    });

});