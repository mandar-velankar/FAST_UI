sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
], function (BaseObject) {
    "use strict";

    var delivery = BaseObject.extend("com.bayer.tender.contracts.model.Delivery", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            // this field is only used internally to catch the user action performed on the object. 
            // possible values = "update" or "create" or "delete"
            this.setUserAction("update"); 

        },
 
        setUserAction: function (action) {
            if (action) {
                this.userAction = action;
            }
        },
        getUserAction: function () {
            return this.userAction;
        },

        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {

            const json = this.getJSONObject([
                "iD",
                "countryCode", 
                "skuCode", 
                "instituteId", 
                "enabled", 
                "localOrDirect",
                "plannedInApo",
                "requestedDeliveryDate",
                "requestedDeliveryQuantity",
                "actualDeliveryDate",
                "actualDeliveryQuantity",
                "uoM",
                "penalty",
                "penaltyValue",
                "penaltyCurrency",
                "penaltyReason",
                "undertakingLetters",
                "compensated",
                "compensationComment",
                "paidOrFree",
                "pO",
                "invoiceNo",
                "product_ID",
                "contract_ID"
            ]);

            return {
                ...json,
                InstituteId: +json.InstituteId,
                Penalty: this.convertPenalty(json.Penalty)
            }
        },

        //get JSON from old table structure
        getTenderVersionJSON: function (sTenderID) {

            const json = this.getJSONObject([
                "countryCode", 
                "skuCode", 
                "instituteId", 
                "enabled",
                "localOrDirect",
                "plannedInApo",
                "requestedDeliveryDate",
                "requestedDeliveryQuantity",
                "actualDeliveryDate",
                "actualDeliveryQuantity",
                "uoM",
                "penalty",
                "penaltyValue",
                "penaltyCurrency",
                "penaltyReason",
                "undertakingLetters",
                "compensated",
                "compensationComment",
                "paidOrFree",
                "pO",
                "invoiceNo",
                "product_ID",
                "contract_ID",
                "offerID",
                "sNo"
            ]);

            return {
                //...json,
                TenderID: sTenderID, //json.TenderID,
                OfferID: json.Contract_ID || json.OfferID, //must stay as key
                CountryCode: json.CountryCode,
                InstituteID: +json.InstituteId,
                SKUCode: +json.SkuCode,
                Active: json.Enabled === true ? 1 : 0,
                LocalOrDirectDelivery: json.LocalOrDirect,
                PlannedInAPO: json.PlannedInApo,
                RequestedDeliveryDate: json.RequestedDeliveryDate,
                RequestedQuantity: json.ActualDeliveryQuantity,
                ActualDeliveryDate: json.ActualDeliveryDate,
                ActualDeliveryQuantity: json.ActualDeliveryQuantity,
                Penalty: json.Penalty === "true" ? "Yes" : "No",
                PenaltyValue: json.PenaltyValue,
                Currency: json.PenaltyCurrency,
                PenaltyReason: json.PenaltyReason,
                UndertakingLetters: json.UndertakingLetters,
                Compensated: json.Compensated,
                CompensationComment: json.CompensationComment,
                ProductCode: +json.SkuCode,
                PaidOrFree: json.PaidOrFree,
                PO: json.PO,
                InvoiceNo: json.InvoiceNo,
                SNo: +json.SNo || 0 // in back-end this is filled with a autoincrement
            }
        },

        convertPenalty: function(sPenaltyValue){
            switch (sPenaltyValue){
            case "true":
                return true;
            case "false":
                return false;
            case false:
                return false;
            case true:
                return true;
            }
        }
        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }

    });

    return delivery;
});