sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Channel"
], function (BaseObject, Channel) {
    "use strict";

    var price = BaseObject.extend("com.bayer.tender.uilib.model.Price", {

        constructor: function (data) {
             //will copy all properties and make them camelcase starting with lowercase ;)
             BaseObject.call(this, data);
             if (data) {
                //Keep channel
                data.Channel && this.setPriceChannel(data.Channel);
                 
             }
        },

        //Keep price channel
        setPriceChannel: function (oChannel){
            //make new channel object
            this.channel = new Channel(oChannel);
        },

        //Get empty pricing object
        getEmptyPriceObject: function (){

            //empty price object
            let oEmptyPriceObject = {
                "iD" : null, 
                "pricingPolicyName" : null, 
                "role": null, 
                "channel_ID": null, 
                "price": null
            }
            
            return oEmptyPriceObject;
            
        },
         
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },

        /**
         * Get JSON format of Price
         */
        getJSON: function () {
            return this.getJSONObject([
                "iD", 
                "pricingPolicyName", 
                "role", 
                "channel_ID", 
                "price"
            ]);
        }

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }

    });
    return price;
});