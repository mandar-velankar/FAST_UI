sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Division"
], function (BaseObject, Division) {
    "use strict";

    var divisionsForCountry = BaseObject.extend("com.bayer.tender.uilib.model.DivisionsForCountry", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                data.results && this.setDivisions(data.results);
            }
        },
        setDivisions: function (divisions) {
            if (divisions) {
                this.divisions = divisions.map((division) => new Division(division));
                this.divisions.unshift({}); // add an empty object -> needed for the UI
            }
        },
        getDivisions: function () {
            return this.divisions || [];
        },
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
        // countryNameChanged: function (state, event) {
        //     console.log("country name changed");
        //     //do something when countryCode changes in the view/ui
        // },
        getJSON: function () {
            // return this.getJSONObject(["CountryCode", "CountryName"]);
        },
        getAll: function () {
            // return {
            //     ...this
            // };
        }
    });
    return divisionsForCountry;
});