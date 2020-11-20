sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
], function (BaseObject) {
    "use strict";

    var letter = BaseObject.extend("com.bayer.tender.contracts.model.Letter", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            // this field is only used internally to catch the user action performed on the object. 
            // possible values = "update" or "create" or "delete"
            this.setUserAction("update"); 

            if (data) {
                //copy array's manually to objects
                data.Letters && this.setLetters(data.Letters.results);
            }

        },
 
        setUserAction: function (action) {
            if (action) {
                this.userAction = action;
            }
        },
        getUserAction: function () {
            return this.userAction;
        },

        setLetters: function (letters) {
             if (letters) {
                 this.letters = letters.map((letter) => new Letter(letter));
                 this.letters.unshift({}); // add an empty object -> needed for the UI
             }
         },
        
        // getProducts: function () {
        //     return this.products || [];
        // },
       
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            const json = this.getJSONObject([
                "iD",
                "countryCode", 
                "skuCode", 
                "instituteId", 
                "enabled", 
                "reasonForLetter",
                "quantity",
                "batch",
                "manufacturingDate",
                "expiryDate",
                "returnDate",
                "returnedQuantity",
                "uoM",
                "product_ID",
                "contract_ID"
            ]);

            return {
                ...json,
                InstituteId: +json.InstituteId,
                Quantity: +json.Quantity,
                ReturnedQuantity: +json.ReturnedQuantity
            }
        },

        getTenderVersionJSON: function (sTenderID) {
            const json = this.getJSONObject([
                "countryCode", 
                "skuCode", 
                "instituteId", 
                "enabled", 
                "reasonForLetter",
                "quantity",
                "batch",
                "manufacturingDate",
                "expiryDate",
                "returnDate",
                "returnedQuantity",
                "uoM",
                "product_ID",
                "contract_ID",
                "offerID",
                "sNo"
            ]);

            return {
                //...json,
                TENDERID: sTenderID, //json.TenderID,
                OFFERID: json.Contract_ID || json.OfferID, //must stay as key
                COUNTRYCODE: json.CountryCode,
                INSTITUTEID: +json.InstituteId,
                SKUCODE: +json.SkuCode,
                //SUBMITTEDON: Date;
                //SUBMITTEDBY: String(100);
                ACTIVE: json.Enabled === true ? 1 : 0,
                REASONFORLETTER: json.ReasonForLetter,
                QUANTITY: +json.Quantity,
                BATCH: json.Batch,
                MANUFACTURINGDATE: json.ManufacturingDate,
                EXPIRYDATE: json.ExpiryDate,
                RETURNDATE: json.ReturnDate,
                RETURNEDQTY: +json.ReturnedQuantity,
                UOM: json.UoM,
                SNO: +json.SNo || 0 // in back-end this is filled with a autoincrement
            }
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });

    return letter;
});