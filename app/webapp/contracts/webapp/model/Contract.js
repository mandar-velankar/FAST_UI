sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Distributor",
    "./Institute",
    "./Product",
    "./SellingCompany"
], function (BaseObject, Distributor, Institute, Product, SellingCompany) {
    "use strict";

    var contract = BaseObject.extend("com.bayer.tender.contracts.model.Contract", {

        constructor: function (data) {

            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            if (data) {
                data.Distributor && this.setDistributor(data.Distributor);
                data.Institute && this.setInstitute(data.Institute);
                data.Products && !data.Products.__deferred && this.setProducts(data.Products.results);
                data.SellingCompany && !data.SellingCompany.__deferred && this.setSellingCompany(data.SellingCompany);
            }

        },
        /*
        distributorChanged:function(state,event){
            console.log("changed distributor")
        },
        */
        setDistributor: function (distributor) {
            if (distributor) {
                this.distributor = new Distributor(distributor);
            }
        },
        getDistributor: function () {
            return this.distributor || {};
        },

        updateDistributor: function (distributor) {
            if (distributor && distributor instanceof Distributor) {
                this.distributor = distributor;
            } else {
                throw "Invalid Type. Expecting a Distributor obj.";
            }
        },

        setInstitute: function (institute) {
            if (institute) {
                this.institute = new Institute(institute);
            }
        },
        getInstitute: function () {
            return this.institute || {};
        },

        setProducts: function (products) {
            if (products) {
                this.products = products.map(product => new Product(product));
            }
        },
        getProducts: function () {
            return this.products || [];
        },

        getEnabledProducts: function () {
            return this.products.filter(product => product.enabled);
        },

        getProductByID: function (id) {
            return this.getProducts().find(product => product.iD = id);
        },

        getProductByProductPackId: function (productPackId) {
            return this.getProducts().find(product => product.productPackId === productPackId);
        },

        getProductIndex: function (oProduct) {
            return this.getProducts().findIndex(product => product.iD === oProduct.iD);
        },

        removeProduct: function (oProduct) {
            const prdIndex = this.getProductIndex(oProduct);
            this.getProducts().splice(prdIndex, 1);
        },

        addProduct: function (product) {
            if(product && !(product instanceof Product)){
                const data = {
                    "ID": this.create_UUID(),
                    "Contract_ID": this.iD,
                    "CountryCode": product.COUNTRY_CODE,
                    "Enabled": true,
                    "AlternateOffer": "",
                    "BudgetRate": "",
                    "Cogs": product.COGS,
                    "CogsBrand": "",
                    "Comment": "",
                    "CommissionRate": +product.COMMISSION_RATE,
                    "DocumentsRequired": "",
                    "FirstShipment": "",
                    "Foc": "",
                    "FocAbsPct": "",
                    "FocBrand": "",
                    "FocBrandAbsPct": "",
                    "FocBrandProductId": "",
                    "FocType": "",
                    "IncoTerms": product.INCO_TERMS,
                    "IntervalBetweenShipments": "",
                    "NetOfferPrice": "",
                    "NetPrice": "",
                    "NoofLots": "",
                    "OfferPrice": "",
                    "OfferValue": "",
                    "PaymentTerms": product.PAYMENT_TERMS,
                    "ProductPackId": product.PRODUCT_ID,
                    "Reference": "",
                    "RegisteredPrice": "",
                    "RequestedVolume": "",
                    "Samples": "",
                    "Sorter": this.getNextSorter(),
                    "SpotRate": "",
                    "UoM": "Unit",
                    "WholesalePrice": "",
                    "Product": {
                        "PRODUCTPACKID": product.PRODUCT_ID,
                        "PRODUCTPACKNAME": product.PRODUCT_NAME,
                        "PACKFACTOR": product.PACKFACTOR,
                        "REGISTERED_PRICE": product.COUNTRY_REGISTERED_PRICE.REGISTERED_PRICE,
                        "UOM": product.COUNTRY_REGISTERED_PRICE.UOM,
                        "CURRENCY": product.COUNTRY_REGISTERED_PRICE.CURRENCY,
                        "COUNTRY_CODE": product.COUNTRY_REGISTERED_PRICE.COUNTRY_CODE
                    }
                };

                const oProduct =  new Product(data);
                oProduct.userAction = "create";
                oProduct.calculateRegisteredPrice(product);

                this.getProducts().push(oProduct);

            }else if(product && product instanceof Product){
                this.getProducts().push(product);
            }
        },


        /**
         * Generates an integer value for the sorter property.
         * The sorter property is used to sort the products in the Add Product screen
         */
        getNextSorter: function(){
            let sorter = 0;
            
            this.getProducts().map(product => {
                if(product.sorter > sorter){
                    sorter = product.sorter;
                }
            });

            return sorter + 1 ;
        },

        /**
         * Clear products from contract
         */
        clearProducts: function () {
            this.products = [];
        },
        setSellingCompany: function (sellingCompany) {
            if (sellingCompany) {
                this.sellingCompany = new SellingCompany(sellingCompany);
            }
        },

        getSellingCompany: function () {
            return this.sellingCompany || {};
        },

        updateSellingCompany: function (sellingCompany) {
            if (sellingCompany && sellingCompany instanceof SellingCompany) {
                this.sellingCompany = sellingCompany;
            } else {
                throw "Invalid Type. Expecting a SellingCompany obj.";
            }
        },

        setSelectedProduct: function (product) {
            if (product && product instanceof Product) {
                this.selectedProduct = product;
            } else {
                //this.selectedProduct = null;
                throw "Invalid Type. Expecting a Product obj.";
            }
        },

        resetSelectedProduct: function (){
            this.selectedProduct = null;
        },

        getSelectedProduct: function () {
            return this.selectedProduct || null;
        },

        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },

        /**
         * Get JSON representation for saving to the back-end
         */
        getJSON: function () {

            return this.getJSONObject([
                "iD",
                "countryCode",
                "contractName",
                "contractNumber",
                "channelId",
                "contractDate",
                "contractValidUntil",
                "enabled",
                "instituteId",
                "distributorId",
                "sellingCompanyCode",
                "currency",
                "comment",
            ]);
        },

        /**
        * Get expanded JSON representation for saving to the back-end
        */
        getJSONExpanded: function () {

            const jsonObj = this.getJSONObject([
                "iD",
                "countryCode",
                "contractName",
                "contractNumber",
                "channelId",
                "contractDate",
                "contractValidUntil",
                "enabled",
                "instituteId",
                "distributorId",
                "sellingCompanyCode",
                "currency",
                "comment",
            ]);

            // Filter out products that have been newly created and deleted directly by the user from the UI
            const products = this.getProducts()
                .filter(product => {

                    const userAction = product.getUserAction();
                    const enabled = product.enabled;

                    if (userAction === "create" && enabled) {
                        return true;
                    } else if (userAction === "delete" || userAction === "update") {
                        return true;
                    }

                    return false;
                })
                .map(product => product.getJSONExpanded());

            const expandedObj = {
                ...jsonObj,
                DistributorId: +jsonObj.DistributorId,
                InstituteId: +jsonObj.InstituteId,
                Products: products,
                // SellingCompany: this.getSellingCompany().getJSON(),
                // Institute: this.getInstitute().getJSON(),
                // Distributor: this.getDistributor().getJSON()
            };

            return expandedObj;

        },

        // ,
        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }


        create_UUID: function(){
            var dt = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (dt + Math.random()*16)%16 | 0;
                dt = Math.floor(dt/16);
                return (c=='x' ? r :(r&0x3|0x8)).toString(16);
            });
            return uuid;
        },

    });

    return contract;
});