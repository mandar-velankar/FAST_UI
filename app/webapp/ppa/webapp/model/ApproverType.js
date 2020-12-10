sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./CountryApprover"
], function (BaseObject, CountryApprover) {
    "use strict";

    var ApproverType = BaseObject.extend("com.bayer.tender.uilib.model.ApproverType", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            if (data) {
                //copy array's manually to objects
                data.brand && (this.brand = data.brand);
                data.approverType && BaseObject.call(this, data.approverType);
                data.approverType && data.approverType.CountryApprovers && this.setCountryApprovers(data.approverType.CountryApprovers.results);
                
            }
        },

        setCountryApprovers: function (countryApprovers) {
            if (countryApprovers) {
                // filter the CountryApprovers based on the selected brand. This is necessary to filter out irrelevant records from the CountryApprovers dropdown
                const filteredCountryApprovers = countryApprovers.filter(approver => (approver.CountryCode === this.brand.countryCode) && (approver.Division === this.brand.division));

                this.countryApprovers = filteredCountryApprovers.map(countryApprover => new CountryApprover(countryApprover));
            }
        },

        getCountryApprovers: function () {
            return this.countryApprovers || [];
        },
       
        
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
    return ApproverType;
});