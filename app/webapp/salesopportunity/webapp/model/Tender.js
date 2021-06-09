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
                "iD",
                "tenderID",
            ]);
        },

    });
    
    return tender;
});