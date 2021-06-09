sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
], function (BaseObject) {
    "use strict";

    var tender = BaseObject.extend("com.bayer.tender.salesopportunity.model.Tender", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

        },

        getJSON: function () {

            return this.getJSONObject([
                //"iD",
                "tenderID",
                "countryCode",
                "tenderNo",
                "highValue",
                "active",
                "classification",
                "tenderName",
                "instituteID",
                "tenderChannel",
                "groupPurchasing",
                "publicationDate",
                "bidDueDate",
                "awardDate",
                "nextPublicationDye",
                "contractLength",
                "ContractExtenseion",
                "tenderStatus",
                "TENDER_TYPE_ID",
                "CONTRACT_TYPE_ID",
                "SALES_TYPE_ID",
                "TENDER_ORIGIN_ID",
                "PROCUREMENT_METHOD_ID",
                "PROCUREMENT_REASON"
            ]);
        },

    });

    return tender;
});