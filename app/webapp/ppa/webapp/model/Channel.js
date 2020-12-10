sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
], function (BaseObject) {
    "use strict";

    var channel = BaseObject.extend("com.bayer.tender.uilib.model.Channel", {

        constructor: function (data) {
             //will copy all properties and make them camelcase starting with lowercase ;)
             BaseObject.call(this, data);
             if (data) {
                 
             }
        },
         
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },

        /**
         * Get JSON format of Channel
         */
        getJSON: function () {
            return this.getJSONObject([
                "iD", 
                "channelName",
                "channelCountry"
            ]);
        }

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });
    return channel;
});