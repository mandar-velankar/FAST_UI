sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseService",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (CoreService, Sorter, Filter, FilterOperator) {
	"use strict";

	var CtrService = CoreService.extend("com.bayer.tender.contracts.service.CtrService", {

		constructor: function (model) {
			CoreService.call(this, model);
        },
        
		getGroup: function (id) {
			var sKey = this.model.createKey("/Countries", {
				CountryCode: id
			});
			return this.odata(sKey).get({
				// urlParameters: {
				// 	$expand: "expand with associations"
				// }
			});
		},

		/**
		 * Get a list of countries for current user
		 */
		getCountries: function () {
			
			let sPath = "/TenderCountriesUser";

			var mParameters = {
			};

			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Get a list of institutes
		 */
		getInstitutes: function (sCountryCode) {
			
			let sPath = "/TenderInstitute";

            var oCountryFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var mParameters = {
				filters: [oCountryFilter]
			};

			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Get a list of sellingcompanies 
		 */
		getSellingCompanies: function (sCountryCode) {
			
			let sPath = "/TenderSellingCompany";

			/*not possible in V2
            var oCountryFilter = new Filter({
				path: 'Countries/CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});
			*/

			var mParameters = {
				urlParameters: {
					"$expand": "Countries"
				},
				//filters: [oCountryFilter]
			};

			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Get a list of distributors based upon the CountryCode
		 * @param {*} sCountryCode 
		 */
		getDistributors: function (sCountryCode) {
			
			let sPath = "/TenderDistributor";

            var oCountryFilter = new Filter({
				path: 'CountryCode',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var mParameters = {
				filters: [oCountryFilter]
			};

			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Get channels for contracts
		 */
		getChannels: function () {
			
			let sPath = "/Channels";

			var mParameters = {
			};

			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Get currencies for country
		 * @param {*} sCountryCode 
		 */
		getCountryCurrencies: function (sCountryCode) {
			
			let sPath = "/CountryCurrency";

            var oCountryFilter = new Filter({
				path: 'COUNTRY_CODE',
				operator: FilterOperator.EQ,
				value1: sCountryCode
			});

			var mParameters = {
				filters: [oCountryFilter]
			};

			return this.odata(sPath).get(mParameters);
		},

		/**
		 * Retrieves a list of Contracts from the backend (created within contracting app)
		 */
		getContracts: function () {

			let sPath = "/Contracts";
			
			var mParameters = {
				urlParameters: {
					"$expand": "Institutes/Institute,Distributor,Products/Product/Product",
					"$orderby": "ContractDate desc",
					"$top": 5000 //should be 50 but as long as we don't have backend filtering we should get more
				}
			};

			return this.odata(sPath).get(mParameters);
		},
		
		/**
		 * Retrieves a Contracts by number from the backend
		 */
		getContractByNumber: function (sContractNumber) {

            let sPath = "/Contracts";
            
            var oContractNumberFilter = new Filter({
				path: 'ContractNumber',
				operator: FilterOperator.EQ,
				value1: sContractNumber
			});
			

			var mParameters = {
				filters: [oContractNumberFilter],
				urlParameters: {
					//"$expand": "Products/Deliveries/Institute,Products/Letters,Products/Product,Institute,Channel,Distributor,SellingCompany"
					"$expand": "Products/Product,Institutes/Institute,Channel,Distributor,SellingCompany"
				}
			};

			return this.odata(sPath).get(mParameters);
		},

		deleteContractByNumber: function (sContractNumber){
			let sKey = this.model.createKey("/Contracts", {
				contractNumber: sContractNumber
			});
			return this.odata(sKey).delete();
		},

		/**
		 * Delete a Contract product from the backend
		 */
		deleteContractProductByID: function (guid) {
			var sKey = this.model.createKey("/Products", {
				ID: guid
			});
			return this.odata(sKey).delete();
		},

		/**
		 * Delete a Contract delivery from the backend
		 */
		/*deleteContractDeliveryByID: function (guid) {
			var sKey = this.model.createKey("/Deliveries", {
				ID: guid
			});
			return this.odata(sKey).delete();
		},*/

		/**
		 * Delete a TenderContract delivery from the backend
		 * @param {String} offerId 
		 * @param {Integer} productCode 
		 * @param {Integer} sNo 
		 */
		/*deleteTenderContractDelivery: function (offerId, productCode, sNo) {
			var sKey = this.model.createKey("/TenderDeliveries", {
				OfferID: offerId,
				ProductCode: productCode,
				SNo: sNo
			});
			return this.odata(sKey).delete();
		},*/

		/**
		 * Delete a Contract letter from the backend
		 */
		/*deleteContractLetterByID: function (guid) {
			var sKey = this.model.createKey("/Letters", {
				ID: guid
			});
			return this.odata(sKey).delete();
		},*/

		/**
		 * Delete a TenderContract letter from the backend
		 * @param {String} offerId 
		 * @param {Integer} skuCode 
		 * @param {Integer} sNo 
		 */
		/*deleteTenderContractLetter: function (offerId, skuCode, sNo) {
			var sKey = this.model.createKey("/TenderDeliveries", {
				OfferID: offerId,
				SkuCode: skuCode,
				SNo: sNo
			});
			return this.odata(sKey).delete();
		},*/

		/**
		 * Retrieves a list of PenaltyReasons from the backend
		 */
		getPenaltyReasons: function () {
			return this.odata("/PenaltyReasons").get();
		},

		/**
		 * Retrieves a list of Tender Contracts from the backend (created within tender management app)
		 */
		getTenderContracts: function () {

			let sPath = "/TenderContracts";
			
			var mParameters = {
				urlParameters: {
					"$expand": "Institute,Distributor,Products/Results", //for tender contracts we have to expand until Results, beceause
					"$orderby": "ContractDate desc",
					"$top": 5000 //should be 50 but as long as we don't have backend filtering we should get more
				}
			};

			return this.odata(sPath).get(mParameters);
		},
		
        /**
		 * Retrieves a TenderContracts by ContractNumber from the backend
		 */
		getTenderContractByNumber: function (sContractNumber) {

			var sKey = this.model.createKey("/TenderContracts", {
				ContractNumber: sContractNumber
			});

			var mParameters = {
				urlParameters: {
					//"$expand": "Products/Deliveries,Products/Letters,Products/Product,Products/GroupPurchasing,Institute/Children/Institute,Distributor,SellingCompany"
					"$expand": "Products/Product,Products/GroupPurchasing,Institute/Children/Institute,Distributor,SellingCompany"
				}
			};

			return this.odata(sKey).get(mParameters);
		},


		/**
		 * Creates a new contract
		 */
		createContract: function (oContract) {

			const data = oContract.getJSONExpanded();

			//conversion
			// data.InstituteId = Number(data.InstituteId);
			// data.DistributorId = Number(data.DistributorId);
			delete data['Products'];
			
			return this.odata("/Contracts").post(data);

		},

		/*
		 * Updates a contract in the backend
		 * @param {Contract} contract 
		 */
		updateContract: function(contract){ 

			const sKey = this.model.createKey("/Contracts", {
				ID: contract.iD
			});

			const data = contract.getJSONExpanded();


			return this.odata(sKey).put(data);
		},

		/*
		 * Updates a product in the backend - with managed associations to the linked deliveries & letters
		 * @param {Product} contract 
		 */
		updateProduct: function(product){ 

			const sKey = this.model.createKey("/Products", {
				ID: product.iD
			});

			const data = product.getJSONExpanded();

			return this.odata(sKey).put(data);

		},

		/*
		 * Updates a TenderDeliveries in the backend
		 * @param {Deliveries} contract 
		 */
		/*updateTenderDeliveries: function(deliveries, sTenderID){ 

			//new promise
			var aPromises = [];
			var that = this;

			if (deliveries.length > 0 ) {
				
				//loop at deliveries for saving
				deliveries.forEach(function (delivery) {
					aPromises.push(that.updateTenderDelivery(delivery, sTenderID).then(delivery => {
						//DONE
					}));
				});

			}else{
				return Promise.resolve(deliveries);
			}
			
			return Promise.all([aPromises]).then((values) => {
				//ALL DONE
			});
		
		},*/

		/*
		 * Updates a TenderDeliveries in the backend
		 * @param {Delivery} contract 
		 */
		/*updateTenderDelivery: function(delivery, sTenderID){ 

			const data = delivery.getTenderVersionJSON(sTenderID);

			/*
			const sKey = this.model.createKey("/TenderDeliveries", {
				OfferID: data.OfferID,
				ProductCode: data.SkuCode, 
				Active: sActive , 	
				SNo: data.sNo
			});
			*/
/*
			const sKey = this.model.createKey("/PT_TMDLVTR", {
				OfferID: data.OfferID, 	 
				ProductCode: data.SKUCode,		
				SNo: data.SNo
			});

			return this.odata(sKey).put(data);

		},*/

		/*
		 * Updates a TenderLetters in the backend
		 * @param {Letters} contract 
		 */
		/*updateTenderLetters: function(letters, sTenderID){ 

			//new promise
			var aPromises = [];
			var that = this;

			if (letters.length > 0 ) {
				
				//loop at letters for saving
				letters.forEach(function (letter) {
					aPromises.push(that.updateTenderLetter(letter, sTenderID).then(letter => {
						//DONE
					}));
				});

			}else{
				return Promise.resolve(letters);
			}
			
			return Promise.all([aPromises]).then((values) => {
				//ALL DONE
			});
		
		},*/

		/*
		 * Updates a TenderLetters in the backend
		 * @param {Letters} contract 
		 */
		/*updateTenderLetter: function(letter, sTenderID){ 

			const data = letter.getTenderVersionJSON(sTenderID);

			const sKey = this.model.createKey("/PT_TMUDLTRS", {
				OFFERID: data.OFFERID, 	 
				SKUCODE: data.SKUCODE,	
				SNO: data.SNO
			});

			return this.odata(sKey).put(data);

		}*/

		getCountryContractBrands: function (sCountryCode) {
			
			var aFilters = [];

			if(sCountryCode){

				var oCountryCodeFilter = new Filter({
					path: 'CountryCode',
					operator: FilterOperator.EQ,
					value1: sCountryCode
				});

				aFilters.push(oCountryCodeFilter);
			}

			
			var mParameters = {
				filters: aFilters
			};

			return this.odata("/CountryContractBrands").get(mParameters);
		},

    });
    
	return CtrService;
});