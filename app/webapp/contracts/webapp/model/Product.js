sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    //"./Letter",
    //"./Delivery",
    "./ProductsProduct",
], function (BaseObject, ProductsProduct) {
    "use strict";

    var product = BaseObject.extend("com.bayer.tender.contracts.model.Product", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            // this field is only used internally to catch the user action performed on the object. 
            // possible values = "update" or "create" or "delete"
            this.setUserAction("update"); 

            if (data) {
                ///data.Deliveries && !data.Deliveries.__deferred && this.setDeliveries(data.Deliveries.results);
                //data.Letters && !data.Letters.__deferred && this.setLetters(data.Letters.results);
                data.Product && !data.Product.__deferred && this.setProduct(data.Product);
                this.calculateDiscount();
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
       
        /*setDeliveries: function (deliveries) {
            if (deliveries && deliveries.length > 0) {
                this.deliveries = deliveries.map(delivery => new Delivery(delivery));
            }
        },
        getDeliveries: function () {
            return this.deliveries || [];
        },

        getEnabledDeliveries: function () {
            return this.getDeliveries().filter(delivery => delivery.enabled);
        },

        getDeliveryIndex: function(oDelivery){
            return this.getDeliveries().findIndex(delivery => delivery.iD = oDelivery.iD);
        },

        removeDelivery: function(delivery){ 
            if (delivery && delivery instanceof Delivery) {
                const index = this.getDeliveryIndex(delivery); 
                this.getDeliveries().splice(index,1);
            }else{
                throw "Invalid Type. Expecting a Delivery obj.";
            }
        },

        addDelivery: function(delivery){ 
            if (delivery && delivery instanceof Delivery) {
                let aDeliveries = this.getDeliveries() || [];
                aDeliveries.push(delivery);
                this.setDeliveries(aDeliveries);
                return delivery;
            }else{
                throw "Invalid Type. Expecting a Delivery obj.";
            }
        },

        createNewDelivery: function(sInstitute, sCurrency){ 
            const data = {
                "ID": this.create_UUID(),
                "ActualDeliveryDate": "",
                "ActualDeliveryQuantity": "",
                "Compensated": "Yes",
                "CompensationComment": "",
                "Contract_ID": this.contract_ID || this.offerID || "",
                "CountryCode": this.countryCode || "",
                "Enabled": true,
                "Institute": "", //is this the navigation prop?
                "InstituteId": sInstitute,
                "InvoiceNo": "",
                "LocalOrDirect": "D",
                "PO": "",
                "PaidOrFree": "Paid",
                "Penalty": Number(0),
                "PenaltyCurrency": sCurrency,
                "PenaltyReason": "Delayed delivery of goods",
                "PlannedInApo": "Yes",
                "Product_ID": this.iD || this.productPackId || this.productCode || "",
                "RequestedDeliveryDate": "",
                "RequestedDeliveryQuantity": "",
                "Sku": "",
                "SkuCode": this.productPackId || this.productCode,
                "UndertakingLetters": "No",
                "UoM": "",

            };
            const oDelivery = new Delivery(data);
            return oDelivery;
        },

        setLetters: function (letters) {
            if (letters && letters.length > 0) {
                this.letters = letters.map(letter => new Letter(letter));
            }
        },

        getLetters: function () {
            return this.letters || [];
        },

        getEnabledLetters: function () {
            return this.getLetters().filter(letter => letter.enabled);
        },

        createNewLetter: function(sInstitute){ 
            const data = {
                "ID": this.create_UUID(),
                "Batch": "",
                "Contract_ID": this.contract_ID || this.offerID || "",
                "CountryCode": this.countryCode || "",
                "Enabled": true,
                "ExpiryDate": "",
                "InstituteId": sInstitute,
                "ManufacturingDate": "",
                "Product_ID": this.iD || this.productPackId || this.productCode || "",
                "Quantity": "",
                "ReasonForLetter": "",
                "ReturnDate": "",
                "ReturnedQuantity": "",
                "Sku": "",
                "SkuCode": this.productPackId || this.productCode || "",
                "UoM": ""
            };
            const oLetter = new Letter(data);
            return oLetter;
        },

        getLetterIndex: function(oLetter){
            return this.getLetters().findIndex(letter => letter.iD = oLetter.iD);
        },

        addLetter: function(letter){ 
            if (letter && letter instanceof Letter) {
                let aLetters = this.getLetters() || [];
                aLetters.push(letter);
                this.setLetters(aLetters);
                return letter;
            }else{
                throw "Invalid Type. Expecting a Letter obj.";
            }
        },

        removeLetter: function(oLetter){ 
            const index = this.getLetterIndex(oLetter); 
            this.getLetters().splice(index,1);
        },*/

        setProduct: function (product) {
            if (product) {
                this.product = new ProductsProduct(product);
            }
        },
        getProduct: function () {
            return this.product || {};
        },

        // The dicount is calculated based on the following formula
        // 1 - MSP / CIF
        calculateDiscount: function(){
            if(this.offerPrice && this.registeredPrice && this.registeredPrice != 0){ //TODO: check if this calculation is correct.
                this.discount = Math.abs(1 - this.offerPrice / this.registeredPrice);
            } 
        },


        calculateRegisteredPrice: function(product){ 

            const UoM = product.COUNTRY_REGISTERED_PRICE.UOM;
            const price = product.COUNTRY_REGISTERED_PRICE.REGISTERED_PRICE;
            const packFactor = product.PACKFACTOR;

            if(this.uoM === UoM){
                this.registeredPrice = price;
            }else if(this.uoM  === "Unit" && UoM === "Pack"){
                this.registeredPrice = price / packFactor;
            }else if(this.uoM  === "Pack" && UoM === "Unit"){
                this.registeredPrice = price * packFactor;
            }

            this.calculateDiscount();
        },

        /*setSelectedDelivery: function (delivery) {
            if (delivery && delivery instanceof Delivery) {
                this.selectedDelivery = delivery;
            }else{
                throw "Invalid Type. Expecting a Delivery obj.";
            }
        },

        setTemporaryDelivery: function (delivery) {
            if (delivery && delivery instanceof Delivery) {
                this.temporaryDelivery = delivery;
            }else{
                throw "Invalid Type. Expecting a Delivery obj.";
            }
        },

        getTemporaryDelivery: function () {
            return this.temporaryDelivery;
        },

        getTemporaryDelivery: function () {
            return this.temporaryDelivery;
        },
        
        removeTemporaryDelivery: function () {
            this.temporaryDelivery ? delete this.temporaryDelivery : "";
        },

        clearSelectedDelivery: function () {
            this.selectedDelivery = null;
        },

        getSelectedDelivery: function () {
            return this.selectedDelivery;
        },

        setTemporaryLetter: function (letter) {
            if (letter && letter instanceof Letter) {
                this.temporaryLetter = letter;
            }else{
                throw "Invalid Type. Expecting a Letter obj.";
            }
        },

        getTemporaryLetter: function () {
            return this.temporaryLetter;
        },

        removeTemporaryLetter: function () {
            this.temporaryLetter ? delete this.temporaryLetter : "";
        },

        setSelectedLetter: function (letter) {
            if (letter && letter instanceof Letter) {
                this.selectedLetter = letter;
            }else{
                throw "Invalid Type. Expecting a Delivery obj.";
            }
        },

        getSelectedLetter: function () {
            return this.selectedLetter || {};
        },*/
        
        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
     
        getJSON: function () {
            const json = this.getJSONObject([
                "iD",
                "productPackId", 
                "countryCode", 
                "enabled", 
                "reference", 
                "alternateOffer",
                "requestedVolume",
                "uoM",
                "samples",
                "documentsRequired",
                "firstShipment",
                "noofLots",
                "intervalBetweenShipments", 
                "paymentTerms", 
                "comment", 
                "incoTerms", 
                "sorter",
                "registeredPrice",
                "wholesalePrice",
                "offerPrice",
                "foc",
                "focType",
                "focAbsPct", 
                "netOfferPrice",
                "commissionRate",
                "netPrice",
                "cogs",
                "focBrandProductId",
                "focBrand",
                "focBrandAbsPct",
                "cogsBrand", 
                "budgetRate", 
                "spotRate"
            ]);


            return {
                ...json,
                ProductPackId: +json.ProductPackId,
                RequestedVolume: +json.RequestedVolume,
                Samples: +json.Samples,
                NoofLots: +json.NoofLots,
                IntervalBetweenShipments: +json.IntervalBetweenShipments,
                Sorter: +json.Sorter,
                FocBrandProductId: +json.FocBrandProductId
            }
        },

        /**
        * Get expanded JSON representation for saving to the back-end
        */
        getJSONExpanded: function () {

            //get JSON for product
            const jsonObj = this.getJSON();

            // Filter out deliveries that have been newly created and deleted directly by the user from the UI
            /*const deliveries = this.getDeliveries()
                .filter(delivery => {

                    const userAction = delivery.getUserAction();
                    const enabled = delivery.enabled;

                    if (userAction === "create" && enabled) {
                        return true;
                    } else if (userAction === "delete" || userAction === "update") {
                        return true;
                    }

                    return false;
                })
                .map(delivery => delivery.getJSON());            

            // Filter out letters that have been newly created and deleted directly by the user from the UI
            const letters = this.getLetters()
                .filter(letter => {

                    const userAction = letter.getUserAction();
                    const enabled = letter.enabled;

                    if (userAction === "create" && enabled) {
                        return true;
                    } else if (userAction === "delete" || userAction === "update") {
                        return true;
                    }

                    return false;
                })
                .map(letter => letter.getJSON()); */   

            //get additional assiciations
            const expandedObj = {
                ...jsonObj,
                //Associations
                Deliveries: deliveries, //this.getDeliveries().getJSON(),
                Letters: letters
                // Contract: this.getSellingCompany().getJSON(),
                // Product: this.getInstitute().getJSON(),
            };

            return expandedObj;

        },

        create_UUID: function(){
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (dt + Math.random()*16)%16 | 0;
                dt = Math.floor(dt/16);
                return (c=='x' ? r :(r&0x3|0x8)).toString(16);
            });
            return uuid;
        },

        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });

    return product;
});