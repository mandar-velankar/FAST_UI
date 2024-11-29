sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject"
    //"./Price"
], function (BaseObject) {
    "use strict";

    var product = BaseObject.extend("com.bayer.tender.uilib.model.Product", {
        constructor: function (data) {

           
            if(data) {
                if(data.ListPrice === null){
                    data.ListPrice = "";
                }
                if(data.Currency === null){
                    data.Currency = "";
                }
            }

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            

            this.NspPricePercDiff = {
				CDH_Clinic: "0%",
				CDH_Government: "0%",
				CDH_OTC: "0%",
				CDH_Private: "0%",
				PoHCEH_Clinic: "0%",
				PoHCEH_Government: "0%",
				PoHCEH_OTC: "0%",
				PoHCEH_Private: "0%",
				SMPCEA_Clinic: "0%",
				SMPCEA_Government: "0%",
				SMPCEA_OTC: "0%",
				SMPCEA_Private: "0%",
			};

			this.MspPricePercDiff = {
				CDH_Clinic: "0%",
				CDH_Government: "0%",
				CDH_OTC: "0%",
				CDH_Private: "0%",
				PoHCEH_Clinic: "0%",
				PoHCEH_Government: "0%",
				PoHCEH_OTC: "0%",
				PoHCEH_Private: "0%",
				SMPCEA_Clinic: "0%",
				SMPCEA_Government: "0%",
				SMPCEA_OTC: "0%",
				SMPCEA_Private: "0%",
			};
        }
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        // getJSON: function () {
        //     return this.getJSONObject(["CountryCode", "CountryName"]);
        // },
        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });
    return product;
});