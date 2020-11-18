sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Brand"
], function (BaseObject, Brand) {
    "use strict";

    var division = BaseObject.extend("com.bayer.tender.uilib.model.Division", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                data.Brands && this.setBrands(data.Brands.results);
            }
        },
        
        setBrands: function (brands) {
            if (brands) {
                this.brands = brands.map((brand) => new Brand(brand));
                this.brands.unshift({}); // add an empty object -> needed for the UI
            }
        },
        getBrands: function () {
            return this.brands || [];
        },
        
        // <property>Changed function
        divisionChanged: function (state, event) {
            //do something when countryCode changes in the view/ui
            debugger;
        }
        // countryNameChanged: function (state, event) {
        //     console.log("country name changed");
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
    return division;
});