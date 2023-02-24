sap.ui.define([
    "sap/ui/model/SimpleType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/format/NumberFormat"
], function (SimpleType,ValidateException,NumberFormat) {
    "use strict";
    return SimpleType.extend("FAST_NS0FAST0.model.datatypes.CustomDecimalType", {

        _oNumberFormat : NumberFormat.getFloatInstance({
            maxFractionDigits: 2,
            groupingEnabled: true,
            groupingSeparator: ",",
            decimalSeparator: "."
        }),

        formatValue: function(oValue) {
            return this._oNumberFormat.format(oValue);
        },

        parseValue: function(oValue) {
            oValue = oValue.replace(",",".");
            return this._oNumberFormat.format(oValue);
        },

        validateValue: function(oValue) {}

    });
});