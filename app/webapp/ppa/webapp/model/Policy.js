sap.ui.define([
    "com/bayer/tender/uilib/objects/BaseObject",
    "./Price"
], function (BaseObject, Price) {
    "use strict";

    var policy = BaseObject.extend("com.bayer.tender.uilib.model.Policy", {
        constructor: function (data) {
            //will copy all properties and make them camelcase starting with lowercase ;)
            BaseObject.call(this, data);

            //keep channels
            if(data && data.channels){
                this.setChannels(data.channels);
            }

            //ID is not existing we should go to creation
            if (data && data.ID) { 
                
                //Set prices as objects
                data.PolicyPrices && data.PolicyPrices.results && this.setPolicyPrices(data.PolicyPrices.results);
                //data.ProductPolicies && data.ProductPolicies.results && this.setPolicyPrices(data.ProductPolicies.results);

                //Array for easy binding to view (MSP & NSP prices)
                this.setPolicyPricesArray(this.getPolicyPrices());
                
            }else{ 

                //if no data exist create empty prices
                let oMspPrices = this.getEmptyPriceStructure();
                let oNspPrices = this.getEmptyPriceStructure(); 
                this.setMspPrices(oMspPrices);
                this.setNspPrices(oNspPrices);
                //create empty object & keep
                let aEmptyPolicyPrices = this.getEmptyPriceObjects();
                this.setPolicyPrices(aEmptyPolicyPrices);
                this.setPolicyPricesArray(this.getPolicyPrices()); //for binding on the UI
                
            }

            this.mspEditMode = false;
            this.nspEditMode = false;


        },

        setMspEditMode: function(editable){
            this.mspEditMode = editable;
        },

        setNspEditMode: function(editable){
            this.nspEditMode = editable;
        },
        
        //Set policy prices
        setPolicyPrices: function(aPolicyPrices){
            this.policyPrices = aPolicyPrices.map(policyPrice => new Price(policyPrice));
        },
        
        //Build NSP & MSP object for easy binding to UI
        setPolicyPricesArray: function (aPolicyPrices) {
            if (aPolicyPrices) {
                
                let oMspPrices = this.getEmptyPriceStructure();
                let oNspPrices = this.getEmptyPriceStructure();

                //Fill MSP & NSP objects with prices for each role/channelname combination
                aPolicyPrices.map((oPolicyPrice) => {
                    switch(oPolicyPrice.pricingPolicyName) {
                        case 'MSP':
                          //attribute_name
                          let sMspAttributeName = oPolicyPrice.role.replaceAll('/', '') + '_' + oPolicyPrice.channel.channelName;
                          //set price
                          oMspPrices[sMspAttributeName] = oPolicyPrice.price;
                          break;
                        case 'NSP':
                          //attribute_name
                          let sNspAttributeName = oPolicyPrice.role.replaceAll('/', '') + '_' + oPolicyPrice.channel.channelName;
                          //set price
                          oNspPrices[sNspAttributeName] = oPolicyPrice.price;
                          break;
                        default:
                          // code block
                    } //keep prices (as objects how they will be saved)
                });

                //keep prices (ready for binding easy to table)
                this.setMspPrices(oMspPrices);
                this.setNspPrices(oNspPrices);
                /*

                if(prices.RegisteredPrice && !prices.RegisteredPrice.__deferred){
                    this.prices.registeredPrice = new Price(prices.RegisteredPrice);
                }

                if(prices.MaxMarketSalesPrice && !prices.MaxMarketSalesPrice.__deferred){
                    this.prices.maxMarketSalesPrice = new Price(prices.MaxMarketSalesPrice);
                }
                */
                
            }
        },

        
		//match prices from UI structured object again to the actual price object
		matchPrices: function (){

            //Get prices
            let oMspPrices = this.getMspPrices();
			let oNspPrices = this.getNspPrices();
            let aPolicyPrices = this.getPolicyPrices();
            
            //Fill MSP & NSP objects with prices for each role/channelname combination
            aPolicyPrices.map((oPolicyPrice) => {
                switch(oPolicyPrice.pricingPolicyName) {
                    case 'MSP':
                          //attribute_name
                          let sMspAttributeName = oPolicyPrice.role.replaceAll('/', '') + '_' + oPolicyPrice.channel.channelName;
                          //set price
                          oPolicyPrice.price = oMspPrices[sMspAttributeName];
                          break;
                    case 'NSP':
                          //attribute_name
                          let sNspAttributeName = oPolicyPrice.role.replaceAll('/', '') + '_' + oPolicyPrice.channel.channelName;
                          //set price
                          oPolicyPrice.price =oNspPrices[sNspAttributeName];
                          break;
                    default:
                          // code block
                }
            });

        },
        
        /**
         * Set MSP Prices
         * @param {*} oMspPrices 
         */
        setMspPrices: function (oMspPrices) {
            this.mspPrices = oMspPrices;
        },

        /**
         * Set NSP Prices
         * @param {*} oNspPrices 
         */
        setNspPrices: function (oNspPrices) {
            this.nspPrices = oNspPrices;
        },

        /**
         * Get the policy prices
         */
        getPolicyPrices: function () {
            return this.policyPrices || [];
        },

        /**
         * Returns a price 
         * @param {string} sPriceType : msp/nsp
         * @param {string} sChannel 
         * @param {string} sRole 
         */
        getPrice: function (sPriceType, sChannel, sRole) {
            try {
                
                const prices = sPriceType.indexOf("msp") > -1 ? this.getMspPrices() : this.getNspPrices();


            }
            catch(err) {
                throw new Error(err);
            }
        },

        /**
         * Gets the prices for the a given channel and price type
         * @param {*} sPriceType : msp/nsp
         * @param {*} sChannel 
         */
        getPricesForChannelByPriceType: function(sPriceType, sChannel){

            try {
                
                const channelPrices = {};
                const prices = sPriceType.toLowerCase().indexOf("msp") > -1 ? this.getMspPrices() : this.getNspPrices();

                for (const price in prices) {
                    const channel = price.split("_").pop();
                    const rol = price.split("_")[0];
                    if(channel.indexOf(sChannel) > -1){
                        channelPrices[rol] = +prices[price];
                    }
                }

                return channelPrices;
            }
            catch(err) {
                throw new Error(err);
            }
            
        },

        /**
         * Gets the prices for the a given channel and rol
         * @param {*} sRol 
         * @param {*} sChannel 
         */
        getPricesForChannelByRole: function(sRole, sChannel){

            try {
                const mspChannelPrices = this.getPricesForChannelByPriceType("msp", sChannel);
                const nspChannelPrices = this.getPricesForChannelByPriceType("nsp", sChannel);

                return {
                    "Role": sRole,
                    "MSP_Price" : mspChannelPrices[sRole],
                    "NSP_Price" : nspChannelPrices[sRole],
                };
                
            }
            catch(err) {
                throw new Error(err);
            }
            
        },

        /**
         * Get hardcoded roles: TODO get dynamically
         */
        getHardCodedRoles: function (){
            let aRoles = [ 
                "NSM/SM/FM",
                "HBU",
                "CDH"
            ];

            return aRoles;
        },

        /**
         * get Channels
         * @param {*} aChannels 
         */
        getChannels: function(){
            return this.channels || [];
        },

        /**
         * set channels
         * @param {*} aChannels 
         */
        setChannels: function(aChannels){
            if(aChannels){
                this.channels = aChannels;
            }
        },

        /**
         * Get hardcoded channels: TODO get dynamically (getChannels method from services)
         */
        /*
        getHardCodedChannels: function (){
            let aChannels = [ 
                { iD : "302adcfd-4703-4edb-b5af-75fea7d06060", channelName : "Clinic" },
                { iD : "4056e8b9-726e-40fe-8901-a828e9d81702", channelName : "Government"},
                { iD : "5147aba7-1141-4fe8-a6ac-8583ba7b36af", channelName : "OTC"},
                { iD : "5fb0f9b5-ee0b-4ca8-aaa3-7d3a5200f4de", channelName : "Private"}
            ];
            return aChannels;
        },
        */

        /**
         * Get empty Price structure
         */
        getEmptyPriceStructure: function (){

            //get roles & channels
            let aRoles    = this.getHardCodedRoles();
            let aChannels = this.getChannels(); //this.getHardCodedChannels();

            //emptyPrice
            let oEmptyPrice = {};

            //Build structure dynamically
            aRoles.map(function(sRole){
                
                aChannels.map(function (oChannel) {
                    //Based on the combination of every rol with every channel
                    let sMspAttributeName = sRole.replaceAll('/', '') + '_' + oChannel.channelName;
                    oEmptyPrice[sMspAttributeName] = '';
                });

            });
            return oEmptyPrice;

        },

        /**
         * Get empty price objects for each role/channel combination
         */
        getEmptyPriceObjects: function(){

            //get roles & channels
            let aRoles    = this.getHardCodedRoles();
            let aChannels = this.getChannels(); //this.getHardCodedChannels();
            let oPrice = new Price();
            let oEmptyPriceObject = oPrice.getEmptyPriceObject();
            let aEmptyPriceObjects = [];

            //Build structure dynamically
            aRoles.map(function(sRole){
                
                aChannels.map(function (oChannel){
                    
                    //Object NSP
                    //oEmptyPriceObject.iD = ""; 
                    oEmptyPriceObject.pricingPolicyName = "NSP"; 
                    oEmptyPriceObject.role = sRole; 
                    oEmptyPriceObject.channel_ID = oChannel.iD;
                    oEmptyPriceObject.Channel = {
                        channelCountry: "TH",
                        channelName: oChannel.channelName,
                        iD: oChannel.iD
                    };
                    oEmptyPriceObject.price = "";
                    aEmptyPriceObjects.push(oEmptyPriceObject);

                    //add same object only now for MSP
                    oEmptyPriceObject = JSON.parse(JSON.stringify(oEmptyPriceObject));
                    oEmptyPriceObject.pricingPolicyName = "MSP";
                    aEmptyPriceObjects.push(oEmptyPriceObject);

                    //Start from scratch
                    oEmptyPriceObject = oPrice.getEmptyPriceObject();


                });

            });

            return aEmptyPriceObjects;

        },

        /**
         * Get MSP prices
         */
        getMspPrices: function () {
            return this.mspPrices || {};
        },

        /**
         * Get NSP prices
         */
        getNspPrices: function () {
            return this.nspPrices || {};
        },

        //<property>Changed function
        // countryCodeChanged: function (state, event) {
        //     //do something when countryCode changes in the view/ui
        // },
        
        /**
         * Get JSON format of Policy
         */
        getJSON: function () {
            return this.getJSONObject([
                "iD", 
                "countryCode", 
                "division", 
                "brandId", 
                "productPackId",
                "currency", 
                "mspStatus", 
                "nspStatus",
                "brandPolicy_ID"
            ]);
        },

        /**
         * Get JSON format of Policy together with its expands
         */
        getExpandedJSON: function (){

            //get json object from Policy
            const jsonObjPolicy = this.getJSON();

            // Get all prices
            const jsonObjPrices = this.getPolicyPrices().map(function (oPolicyPrice) {
                let policyPrice = oPolicyPrice.getJSON();
                //Conversions data types where needed
                policyPrice.Price = +policyPrice.Price;
                return policyPrice;
            });

            //Build 
            const expandedObj = {
                ...jsonObjPolicy,
                ProductPackId : +jsonObjPolicy.ProductPackId,
                PolicyPrices: jsonObjPrices
            };

            return expandedObj;

        },

        // getJSON: function () {
        //     return this.getJSONObject(["CountryCode", "CountryName"]);
        // },
        // getAll: function () {
        //     // return {
        //     //     ...this
        //     // };
        // }
    });
    return policy;
});