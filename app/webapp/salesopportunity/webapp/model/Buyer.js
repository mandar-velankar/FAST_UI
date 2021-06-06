sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var buyer = BaseObject.extend("com.bayer.tender.salesopportunity.model.Buyer", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

        },
        
        /*
        distributorIDChanged:function(state,event){
            console.log("onChagned ditributor id");
        },
        */

        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            return this.getJSONObject([
                "cargoUsuario",
                "codigoOrganismo",
                "codigoUnidad",
                "codigoUsuario",
                "comunaUnidad",
                "direccionUnidad",
                "iD",
                "nombreOrganismo",
                "nombreUnidad",
                "nombreUsuario",
                "regionUnidad",
                "rutUnidad",
                "rutUsuario"
            ]);

        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
        
    });

    return buyer;
});