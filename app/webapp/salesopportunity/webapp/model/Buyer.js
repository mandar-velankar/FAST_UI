sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var buyer = BaseObject.extend("com.bayer.tender.salesopportunity.model.Buyer", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

        },
        getOrganismCode(){
            return this.organismCode;
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
                "iD",
                "organismCode",
                "organismNumber",
                "unitID",
                "unitCode",
                "unitName",
                "unitAddress",
                "unitCommunity",
                "unitRegion",
                "userID",
                "userCode",
                "userNumber",
                "userTitle",
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