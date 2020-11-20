sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Member"
], function (BaseObject, Member) {
    "use strict";

    var group = BaseObject.extend("com.bayer.tender.contracts.model.Group", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);
            if (data) {
                //copy array's manually to objects
                data.Members && this.setMembers(data.Members.results);
            }
        },
        setMembers: function (members) {
            if (members) {
                this.members = members.map((member) => new Member(member));
            }
        },
        getMembers: function () {
            return this.members||[];
        },
        //<property>Changed function
        countryCodeChanged: function (state, event) {
            //do something when countryCode changes in the view/ui
        },
        countryNameChanged: function (state, event) {
            console.log("country name changed");
            //do something when countryCode changes in the view/ui
        },
        getJSON: function () {
            return this.getJSONObject(["CountryCode", "CountryName"]);
        },
        getAll: function () {
            // return {
            //     ...this
            // };
        }
    });
    return group;
});