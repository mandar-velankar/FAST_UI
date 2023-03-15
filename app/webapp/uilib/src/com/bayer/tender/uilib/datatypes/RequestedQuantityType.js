sap.ui.define([
    "sap/ui/model/SimpleType",
    "sap/ui/model/ValidateException"
], function (SimpleType,ValidateException) {
    "use strict";
    return SimpleType.extend("FAST_NS0FAST0.model.datatypes.RequestedQuantityType", {

        formatValue: function(ContractVolume) {
            return ContractVolume;
        },

        parseValue: function(ContractVolume) {
            return ContractVolume;
        },

        validateValue: function(RequestedQty) {

            if(!(/^\+?[1-9]\d*$/.test(RequestedQty))) {
                throw new ValidateException("Requested quantity can not be zero or negative number or characters");
            }
        }

    });
});