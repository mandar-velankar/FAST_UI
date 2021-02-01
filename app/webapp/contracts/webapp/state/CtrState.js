sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseState",
	"sap/m/MessageToast",
	"../model/Group",
	"../model/Contract",
	"../model/Distributor",
	"../model/SellingCompany",
	"../model/Channel",
	"../model/Country",
	"../model/Currency",
	"../model/Institute"
], function (BaseState, MessageToast, Group, Contract, Distributor, SellingCompany, Channel, Country, Currency, Institute) {
	"use strict";
	var ctrState = BaseState.extend("com.bayer.tender.contracts.state.CtrState", {

		constructor: function (oCtrService, oCatService) {
			//data used for the view
			this.data = {
				group: new Group(),
				institutes: [],
				institutesChildren: [],
				distributors: [],
				sellingCompanies: [],
				countries: [],
				currencies: [],
				channels: [],
				contracts: [],
				currentContract: {
					instituteDistributorBrandProducts: [],
					uniqueBrands: []
				},
				newContract: {},
				tendercontracts: [],
				editMode: false,
				editModeContract: false,
				editModeDelivery: false,
				selectedSection: null,
				contractSectionID: "contractInformationId",
				deliverySectionID: "deliveryTrackingId"

			};

			//detail page object
			this.detailPage = {};

			//Backup of data to restore after cancel or roll back scenario's
			this.backup = {
				currentContract: {}
			}

			this.ctrService = oCtrService;
			this.catService = oCatService;
			BaseState.call(this);
		},

		_sIDprevDistributor: "",
		_sIDprevSellingcompany: "",
		_sIDprevProduct: {},
		_iDeliveryItemEdit: -1,
		_iLetterItemEdit: -1,
		_iProductItemEdit: -1,

		getService: function () {
			return this.ctrService;
		},

		getCatService: function () {
			return this.catService;
		},

        //detailPage so we can access it everywhere
		getDetailPage: function () {
		    return this.detailPage;	
		},
		
        //keep detailPage so we can access it everywhere
        setDetailPage: function (oDetailPage){
            this.detailPage = oDetailPage;
		},
		
		//based on the situation edit is enabled or not
		setEditEnabled: function () {
			
			this.setProperty("editEnabled", this.checkEditAllowed());
			this.updateModel();

		},

		getEditEnabled: function() {
			return this.getProperty("editEnabled");
		},

		//get id of contractSection
		getContractSectionId: function(){
			return this.getProperty("contractSectionID");
		},

		//get id of contractSection
		getDeliverySectionId: function(){
			return this.getProperty("deliverySectionID");
		},

		//get & set the selected delivery item index
		getDeliveryItemEdit: function () {
			return this._iDeliveryItemEdit;
		},

		setDeliveryItemEdit: function (iDeliveryItemEdit) {
			this._iDeliveryItemEdit = iDeliveryItemEdit;
		},

		//get & set the selected letter item index
		getLetterItemEdit: function () {
			return this._iLetterItemEdit;
		},

		setLetterItemEdit: function (iLetterItemEdit) {
			this._iLetterItemEdit = iLetterItemEdit;
		},

		//get & set the selected product item index
		getProductItemEdit: function () {
			return this._iProductItemEdit;
		},

		setProductItemEdit: function (iProductItemEdit) {
			this._iProductItemEdit = iProductItemEdit;
		},

		//check if edit is allowed or not
		checkEditAllowed: function(){

			var sEditEnabled = true;
			var oCurrentContract = this.getCurrentContract();

			//for contract tab: contract type = other
			if (this.getSelectedSection() === this.getContractSectionId()){
				if( oCurrentContract.channel === 'OTC'){
					sEditEnabled = true;
				}else{
					sEditEnabled = false;
				}
			}

			//for deliveryTracking tab: product needs to be selected & contract type = other
			if (this.getSelectedSection() === this.getDeliverySectionId()){
				if(
					oCurrentContract.getSelectedProduct()
				){
					sEditEnabled = true;
				}else{
					sEditEnabled = false;
				}
			}

			return sEditEnabled;

		},

		setDeleteEnabled: function(sDeleteEnabled){
			var oCurrentContract = this.getCurrentContract();
			sDeleteEnabled = oCurrentContract.channel === 'OTC';
			this.setProperty("deleteEnabled", sDeleteEnabled);
			this.updateModel();
		},

		setEditMode: function (sEditMode) {
			this.setProperty("editMode", sEditMode);
			this.updateModel();
			if(sEditMode){
				//since we are going to edit mode, we should keep a backup of current data
				//this.createBackupCurrentContract();
			}
			
			//this.setEditEnabled(sEditMode);
		},

		setEditModeContract: function (sEditMode) {
			this.setProperty("editModeContract", sEditMode);
			this.updateModel();
		},

		setEditModeDelivery: function (sEditMode) {
			this.setProperty("editModeDelivery", sEditMode);
			this.updateModel();
		},

		/**
		 * Set selected section
		 * @param {} sSectionId 
		 */
		setSelectedSection: function(sSectionId){
			this.setProperty("selectedSection", sSectionId);
			this.updateModel();
		},

		/**
		 * Get selected section
		 */
		getSelectedSection: function(){
			return this.getProperty("selectedSection");
		},

		/**
		 * Create a backup of the contract data
		 */
		createBackupCurrentContract: function(){

			//get current contract
			var oContract = this.getProperty("currentContract");

			//keep selected product
			var oSelectedProduct = oContract.getSelectedProduct();

			//take backup of selected contract (for cancel..)
			const data = oContract.getJSONExpanded();
			
			//get expand of each product
			oContract.products.results.forEach((product) => {
				product
			});


			this.backup.currentContract = new Contract(data);

			//set additional data again
			this.backup.currentContract.setSelectedProduct(oSelectedProduct);

			

		},

		/**
		 * Restore a backup of the current contract data
		 */
		restoreBackupCurrentContract:function(){
			this.setProperty("currentContract",this.backup.currentContract);
			this.updateModel();
		},

		getGroup: function (id) {
			this.setProperty("group", new Group());
			return this.getService().getGroup(id).then((groupResponse) => {
				this.setProperty("group", new Group(groupResponse.data));
				return this.getProperty("group");
			});
		},

		/**
		 * get list of country for current user
		 */
		getCountries: function (){
								
			this.setProperty("countries", []);
			const ctrPromise = this.getService().getCountries().then(countries => {
				countries = countries.data.results;
				if(countries.length > 0){
					//add empty line
					var oEmptyCountry = {
						CountryCode: '',
						CountryName: ''
					};
					countries.push(oEmptyCountry);
					return countries.map(country => {
						return new Country(country);
					});
				} else {
					throw 'User not allowed';
				}
			});
			return Promise.all([ctrPromise]).then((values) => {
				const [countries] = values;
				this.setProperty("countries", [...countries]);
				return this.getProperty("countries");
			});			

		},

		/**
		 * get list of institutes
		 */
		getInstitutes: function (sCountryCode){
								
			this.setProperty("institutes", []);
			const ctrPromise = this.getService().getInstitutes(sCountryCode).then(institutes => {
				institutes = institutes.data.results;
				return institutes.map(institute => {
					return new Institute(institute);
				});
			});
			return Promise.all([ctrPromise]).then((values) => {
				const [institutes] = values;

				//add empty line
				var oEmptyInstitute = {
					instituteID: '',
					instituteName: ''
				};
				institutes.push(oEmptyInstitute);

				this.setProperty("institutes", [...institutes]);
				return this.getProperty("institutes");
			});			

		},

		/**
		 * get list of institutes with the childeren institutes
		 */
		getInstitutesChildren: function (){				
			return this.getProperty("institutesChildren");
		},

		/**
		 * set list of institutes with the childeren institutes
		 */
		setInstitutesChildren: function (aInstitutesChildren){				
			this.setProperty("institutesChildren", aInstitutesChildren);
		},

		/**
		 * get list of sellingcompanies
		 * @param {*} sCountryCode 
		 */
		getSellingCompanies: function (sCountryCode){
			var that = this;
			that.setProperty("sellingCompanies", []);
			const ctrPromise = that.getService().getSellingCompanies(sCountryCode).then(sellingCompanies => {
				const sellingCompaniesTemp = sellingCompanies.data.results;
				if(sCountryCode){
					//filter sellingcompanies for countrycode
					var sellingCompanies = that.filterSellingCompanies(sellingCompaniesTemp, sCountryCode);
				}else{
					//no filter
					sellingCompanies = sellingCompaniesTemp;
				}
				return sellingCompanies.map(sellingCompany => {
					return new SellingCompany(sellingCompany);
				});
			});
			return Promise.all([ctrPromise]).then((values) => {
				const [sellingCompanies] = values;

				that.setProperty("sellingCompanies", [...sellingCompanies]);
				return that.getProperty("sellingCompanies");
			});			
		},

		filterSellingCompanies: function (aSellingCompanies, sCountryCode){
			
			var sellingCompanies = [];

			//filter (not possible in back-end call)
			aSellingCompanies.forEach((oSellingCompany) => {	
				var bFound = false;
				//check if country matches 
				oSellingCompany.Countries.results.forEach((oCountry) => {
					//SellingCompany is available for country?
					if(oCountry.CountryCode === sCountryCode){
						bFound = true;
					}
				});

				if(bFound){
					sellingCompanies.push(oSellingCompany);
				}
				
			});

			return sellingCompanies;
		},

		/**
		 * get list of distributors
		*/
		getDistributors: function (sCountryCode){
			this.setProperty("distributors", []);
			const ctrPromise = this.getService().getDistributors(sCountryCode).then(distributors => {
				distributors = distributors.data.results;
				return distributors.map(distributor => {
					return new Distributor(distributor);
				});
			});
			return Promise.all([ctrPromise]).then((values) => {
				const [distributors] = values;
				this.setProperty("distributors", [...distributors]);
				return this.getProperty("distributors");
			});
		},

		/**
		 * Get channels for contracts
		*/
		getChannels: function (){
			this.setProperty("channels", []);
			const ctrPromise = this.getService().getChannels().then(channels => {
				channels = channels.data.results;
				return channels.map(channel => {
					return new Channel(channel);
				});
			});
			return Promise.all([ctrPromise]).then((values) => {
				const [channels] = values;
				this.setProperty("channels", [...channels]);
				return this.getProperty("channels");
			});
		},

		updateDistributor: function(distributor){
			this.getCurrentContract().updateDistributor(distributor);
			this.updateModel();
		},

		updateSellingCompany: function(sellingCompany){
			this.getCurrentContract().updateSellingCompany(sellingCompany);
			this.updateModel();
		},


		/**
		 * get list of currencies for country
		*/
		getCountryCurrencies: function (sCountryCode){
			this.setProperty("currencies", []);
			const ctrPromise = this.getService().getCountryCurrencies(sCountryCode).then(currencies => {
				currencies = currencies.data.results;
				return currencies.map(currency => {
					return new Currency(currency);
				});
			});
			return Promise.all([ctrPromise]).then((values) => {
				const [currencies] = values;
				this.setProperty("currencies", [...currencies]);
				return this.getProperty("currencies");
			});
		},

		/**
		 * Retrieves a list of Contracts from the backend (created within contracting app)
		 */
		getContracts: function (bHardRefresh) {
			if (this.getProperty("contracts").length > 0 && !bHardRefresh) {
				return Promise.resolve(this.contract);
			}
			this.setProperty("contracts", []);
			const ctrPromise = this.getService().getContracts().then(contracts => {
				contracts = contracts.data.results;
				return contracts.map(contract => {
					//indication for other contract
					contract['channel'] = 'OTC';
					return new Contract(contract);
				});
			});
			const tenderCtrPromise = this.getService().getTenderContracts().then(contracts => {
				contracts = contracts.data.results;
				return contracts.map(contract => {
					//indication for tender contract
					contract['channel'] = 'Tender';
					//check if product should be filtered out TODO: handle in background
					let aProducts = contract.Products && contract.Products.results || [];
					//get all results of all products
					const products = aProducts.filter(product => product.Results && product.Results.results[0]);
					//check if result is won
					const wonProducts = products.filter(product => product.Results && product.Results.results[0].Outcome === 'Won');
					
					//filter contracts to only keep products with outcome = won
					//Only Tender contracts with results won should be shown
					if(wonProducts.length > 0){
						
						//replace products on contract so that only products won are left
						contract.Products.results = wonProducts;
						//filter out products that are not won
						return new Contract(contract);

					}

				});
			});
			return Promise.all([ctrPromise, tenderCtrPromise]).then((values) => {
				const [contracts, tenderContracts] = values;
				//filter out undefined
				let filteredTenderContracts = tenderContracts.filter(contract => contract !== undefined);
				this.setProperty("contracts", [...contracts, ...filteredTenderContracts]);
				return this.getProperty("contracts");
			});

		},

		getContractDetails: function (sContractNumber, bHardRefresh) {
			this.setProperty("currentContract", new Contract());
			const loadedContract = this.getContractByNumber(sContractNumber);

			//Is contract loaded? (we still get the details?)
			if(loadedContract && !bHardRefresh){
				const channel = loadedContract.channel;
		
				if(channel === "Tender"){
					return this.getService().getTenderContractByNumber(sContractNumber).then(contract => {

						//Convert data to Tender contract
						var oContract = this.convertDataToTenderContract(contract.data);
						this.setProperty("currentContract", oContract);

						return oContract;

					});
				}else{
					return this.getService().getContractByNumber(sContractNumber).then(contract => {

						//Convert data to Contract
						var oContract = this.convertDataToContract(contract.data.results[0]);
						this.setProperty("currentContract", oContract); 

						return oContract;
					});
				}
			}else{
				//TODO should this be handled by back-end?
				//we don't know if the contract number is from a Tender or Other (not yet loaded)
				return this.getService().getTenderContractByNumber(sContractNumber).then(contract => {

						//Convert data to Tender contract
						var oContract = this.convertDataToTenderContract(contract.data);
						this.setProperty("currentContract", oContract);

						return oContract;

				}).catch((error) => {
					return this.getService().getContractByNumber(sContractNumber).then(contract => {

						//Convert data to Contract
						var oContract = this.convertDataToContract(contract.data.results[0]);
						this.setProperty("currentContract", oContract); 

						return oContract;

					});	
				});	
		
			}


		},

		getPrevSelectedDistributorID: function () {
			return this._sIDprevDistributor;
		},

		//get selected sellingCompanyID
		getPrevSelectedSellingCompanyID: function () {
			return this._sIDprevSellingcompany;
		},

		getPrevSelectedProduct: function() {
			return this._sIDprevProduct;
		},

		//convert data comming from back-end into TenderContract object
		convertDataToTenderContract: function(data){

			//json data of the contract
			const contract = data;

			//This is a channel contract
			contract['channel'] = 'Tender';

			//Contract
			var oContract = new Contract(contract);
			var aInstituteWithChildren = [];
			
			//if group purchasing (1 or 2) we will have institute children
			if(oContract.groupPurchasing === 1 || oContract.groupPurchasing === 2){

				//Check institute children & set
				if(oContract.institute && oContract.institute.Children.length > 0){
					
					//add parent institute
					var oPartentInistitute = {
						instituteID: oContract.institute.instituteID,
						instituteName: oContract.institute.instituteName,
						isParent: true
					}
					aInstituteWithChildren.push(oPartentInistitute);

					//add children institutes
					oContract.institute.Children.forEach(function (oChild, iIndex){
						if(oChild.Institute){
							//add child institute
							var oChildInistitute = {
								instituteID: oChild.Institute.InstituteID,
								instituteName: oChild.Institute.InstituteName,
								isParent: false
							}
							aInstituteWithChildren.push(oChildInistitute);
						}
					});

					//keep the institueChildren of this contract
					this.setInstitutesChildren(aInstituteWithChildren);

				}else{
					//only parent instistute exists (this way we always have a instistute available on delivery popup, even if its hidden, parent should be selected)
					var oPartentInistitute = {
						instituteID: oContract.institute.instituteID,
						instituteName: oContract.institute.instituteName,
						isParent: true
					}
					aInstituteWithChildren.push(oPartentInistitute);

					this.setInstitutesChildren(aInstituteWithChildren);
				}

			}

			return oContract;

		},

		//convert data comming from back-end into Contract object
		convertDataToContract: function(data){
			var aInstituteWithChildren = [];
			const contract = data; //TODO: check if the contract service can have multiple records for a particular contract number. if yes, then this code must probably be changed.  
			contract['channel'] = 'OTC';
			var oContract = new Contract(contract);

			//only parent instistute exists (this way we always have a instistute available on delivery popup, even if its hidden, parent should be selected)
			var oPartentInistitute = {
				instituteID: oContract.institute.instituteID,
				instituteName: oContract.institute.instituteName,
				isParent: true
			}
			aInstituteWithChildren.push(oPartentInistitute);
			
			this.setInstitutesChildren(aInstituteWithChildren);

			return oContract;

		},

		getPenaltyReasons: function () {
			this.setProperty("penaltyReasons", "");
			return this.getService().getPenaltyReasons().then(response => {
				this.setProperty("penaltyReasons", response.data.results); 
				return this.getProperty("penaltyReasons");
			});
		},


		/**
		 * Returns a contract from the State. No backend calls here.
		 * @param {*} sContractNumber 
		 */
		getContractByNumber: function (sContractNumber) {
			const contracts = this.getProperty("contracts") || undefined;
			return contracts.find(contract => contract.contractNumber == sContractNumber);
		},

		/**
		 * Returns a contract from the State. No backend calls here.
		 * @param {*} sContractNumber 
		 */
		getCurrentContract: function () {
			return this.getProperty("currentContract") || {};
		},

		/**
		 * Saves the current contract with all its products to the backend
		 */
		saveCurrentContract: function () { 
			const contract = this.getCurrentContract();
			return this.updateContract(contract);
		},

		/**
		 * Saves the current product with all its deliveries & letters to the backend
		 */
		saveCurrentProduct: function () { 
			const product = this.getCurrentContract().getSelectedProduct();
			return this.updateProduct(product);
		},

		/**
		 * Creates a new product in the backend
		 * @param {Product} product 
		 */
		createProduct: function(product){
			return this.getService().createProduct(product);
		},

		/**
		 * Update a product in the backend
		 * @param {Product} product 
		 */
		updateProduct: function(product){

			//depending on if its a product from a Other contract or its a product from a Tender Contract, 
			//different logic should be applied (managed association for other contract -> meaning product can be saved as a whole (including deliveries & letters) vs Tender contract separate tables)
			var oCurrentContract = this.getCurrentContract();
			var sTenderID = oCurrentContract.tenderID;
			if(oCurrentContract.channel === 'OTC'){

				//update the whole product with all linked deliveries & letters
				return this.getService().updateProduct(product);

			}else{
/*
				//product not changed here (no need for the moment)
				const letters = oCurrentContract.getSelectedProduct().getLetters();
				const deliveries = oCurrentContract.getSelectedProduct().getDeliveries();

				//new promise
				var aPromises = [];

					
				// if deliveries should be saved
				if(deliveries && deliveries.length > 0) {
					aPromises.push(this.getService().updateTenderDeliveries(deliveries, sTenderID));
				}

				// if letters should be saved
				if(letters && letters.length > 0){
					aPromises.push(this.getService().updateTenderLetters(letters, sTenderID));
				}

				//return resolve/reject based on the promises
				return Promise.all([aPromises]).then((values) => {
					//ALL DONE
				});
*/
			}
			
		},

		/**
		 * Update a contract in the backend
		 * @param {Product} product 
		 */
		updateContract: function(contract){
			return this.getService().updateContract(contract);
		},

		/**
		 * Returns a newContract from the State. No backend calls here.
		 */
		getNewContract: function(){
			return this.getProperty("newContract") || {};
		},

		/**
         * Get a new empty contract object
         */
        createNewContractObject: function(){ 
            const data = {
                "ID" : this.create_UUID(),
                "CountryCode": "", 
                "ContractNumber": "", 
                "ChannelId": "f790b7fe-9e1b-4a61-ba38-72fd2cb6f054", //other
                "ContractDate": "", 
                "Enabled": true,
                "InstituteId": "",
                "DistributorId": "",
                "SellingCompanyCode": "",
                "Currency": "",
                "Comment" : ""
            };
            const oContract = new Contract(data);
            return oContract;
		}, 	
		
		/**
		 * sets temporary new contract
		 * used for creating e new contract 
		 */
		setTemporaryContract: function(){
			const contract = this.createNewContractObject();
			this.setProperty("newContract", contract);
		},

		/* set previous selected distributor, used when switching between them */
		setPrevSelectedDistributorID: function(sIDdistributor){
			this._sIDprevDistributor = sIDdistributor;
		},
		/* set previous selected selling company, used when switching between them */
		setPrevSelectedSellingCompID: function(sIDsellingCompany){
			this._sIDprevSellingcompany = sIDsellingCompany;
		},

		/* set previous selected product, used when cancelling an edit */
		setPrevSelectedProduct: function(sIDprevProduct){
			this._sIDprevProduct = sIDprevProduct;
		},


		/**
		 * Creating a new contract in back-end
		 * @param {} oContract 
		 */
		createContract: function (oContract) {
			return this.getService().createContract(oContract);
		},

		setSelectedProduct: function(product){
			this.getCurrentContract().setSelectedProduct(product);
			this.updateModel();

			this.setEditEnabled();
		},

		resetSelectedProduct: function(){
			this.getCurrentContract().resetSelectedProduct();
			this.updateModel();
		},

		/**
		 * set selected delivery info
		 * @param {Object} delivery 
		 */
		/*setSelectedDelivery: function(delivery){
			this.getCurrentContract().getSelectedProduct().setSelectedDelivery(delivery);
			this.updateModel();
		},*/

		/**
		 * set selected letter info
		 * @param {Object} letter 
		 */
		/*setSelectedLetter: function(letter){
			this.getCurrentContract().getSelectedProduct().setSelectedLetter(letter);
			this.updateModel();
		},*/

		/**
		 * sets temporary delivery info
		 * used for creating e new delivery
		 * @param {Object} delivery 
		 */
		/*setTemporaryDelivery: function(delivery){
			this.getCurrentContract().getSelectedProduct().setTemporaryDelivery(delivery);
			this.updateModel();
		},*/

		/**
		 * sets temporary letter info
		 * used for creating e new letter
		 * @param {Object} letter 
		 */
		/*setTemporaryLetter: function(letter){
			this.getCurrentContract().getSelectedProduct().setTemporaryLetter(letter);
			this.updateModel();
		},*/

		/**
		 * Clear products from currentContract
		 */
		clearProducts: function(){
			this.getCurrentContract().clearProducts();
			this.updateModel();
		},

		/**
		 * Removes a product from CurrentContract from the State.
		 * @param {*} Product 
		 */
		removeProductFromCurrentContract: function(product){
			this.getCurrentContract().removeProduct(product);
			this.updateModel();
		},

		/**
		 * Removes a delivery from SelectedProduct from the State.
		 * @param {*} Delivery 
		 */
		/*removeDeliveryFromSelectedProduct: function(delivery){
			this.getCurrentContract().getSelectedProduct().removeDelivery(delivery);
			this.updateModel();
		},*/

		/**
		 * Removes a letter from SelectedProduct from the State.
		 * @param {*} Letter 
		 */
		/*removeLetterFromSelectedProduct: function(letter){
			this.getCurrentContract().getSelectedProduct().removeLetter(letter);
			this.updateModel();
		},*/


		/**
		 * Deletes a product from the backend
		 * @param {*} guid 
		 */
		deleteContractProductbyID: function(guid){
			return this.getService().deleteContractProductByID(guid);
		},

		/**
		 * Deletes all products for CurrentContract from the banckend.
		 */
		deleteAllCurrentContractProducts: function(){
			const products = this.getCurrentContract().getProducts();
			return products.map( product => this.deleteContractProductbyID(product.iD));
		},

		/**
		 * Deletes a delivery from the backend
		 * @param { String } guid 
		 */
		/*deleteContractDeliveryByID: function(guid){
			return this.getService().deleteContractDeliveryByID(guid);
		}, */

		/**
		 *  Deletes a tender contract delivery from the backend
		 * @param {String} offerId 
		 * @param {Integer} productCode 
		 * @param {Integer} sNo 
		 */
		/*deleteTenderContractDelivery: function(offerId, productCode, sNo){
			return this.getService().deleteTenderContractDelivery(offerId, productCode, sNo);
		}, */

		/**
		 * Deletes a letter from the backend
		 * @param { String } guid 
		 */
		/*deleteContractLetterByID: function(guid){
			return this.getService().deleteContractLetterByID(guid);
		}, */

		/**
		 *  Deletes a tender contract letter from the backend
		 * @param {String} offerId 
		 * @param {Integer} skuCode 
		 * @param {Integer} sNo 
		 */
		/*deleteTenderContractLetter: function(offerId, skuCode, sNo){
			return this.getService().deleteTenderContractDelivery(offerId, skuCode, sNo);
		}, */

		/**
		 * Soft deletes a product. Sets the product to disabled. 
		 * @param {Product} product 
		 */
		softDeleteProduct: function(product){
			product.enabled = false;

			if(product.getUserAction() !== "create"){
				product.setUserAction("delete");
			}
			
			this.updateModel();
		},

		/**
		 * Soft deletes a delivery. Sets the delivery to disabled. 
		 * @param {Delivery} delivery 
		 */
		/*softDeleteDelivery: function(delivery){
			delivery.enabled = false;

			if(delivery.getUserAction() !== "create"){
				delivery.setUserAction("delete");
			}
			
			this.updateModel();
		}, */

		/**
		 * Soft deletes a letter. Sets the letter to disabled. 
		 * @param {Letter} letter 
		 */
		/*softDeleteLetter: function(letter){
			letter.enabled = false;

			if(letter.getUserAction() !== "create"){
				letter.setUserAction("delete");
			}
			
			this.updateModel();
		}, */

		/**
		 * Fetches the InstituteDistributorBrandProducts from the backend and adds them to the currentContract
		 */
		getInstituteDistributorBrandProducts: function (){

			const sCountryCode = this.getCurrentContract().countryCode; 
			const iInstitudeId = this.getCurrentContract().instituteId;
			const iDistributorId = this.getCurrentContract().distributorId;
			const sSellingCompanyCode = this.getCurrentContract().sellingCompanyCode;

			return this.getCatService().getInstituteDistributorBrandProducts(sCountryCode, iInstitudeId, iDistributorId, sSellingCompanyCode).then((response) => {

				this.getCurrentContract()["instituteDistributorBrandProducts"] = response.data.results
				this.getCurrentContract()["uniqueBrands"] = Array.from(new Set(response.data.results.map(x => x.BRAND_ID)))
				.map(BRAND_ID => {
					return {
						BRAND_ID: BRAND_ID,
						BRAND_NAME: response.data.results.find(x => x.BRAND_ID === BRAND_ID).BRAND_NAME,
						SELECTED: false
					};
				});

				this.updateModel();
				return this.getCurrentContract().instituteDistributorBrandProducts;
			});
		},

		/**
		 * Fetches the CountryRegisteredPrice from the backend
		 */
		getCountryRegisteredPrice: function (sCountryCode, iProductId, sCurrency) {
			
			return this.getCatService().getCountryRegisteredPrice(sCountryCode, iProductId, sCurrency);
			
		},


		// This is a list of products from the selected brand used in Add Product screen
		setProductCollection: function (products) {
			this.getCurrentContract()["ProductCollection"] = products;
			this.updateModel();
		},

		getUniqueBrandById: function (sBrandId) {
			const uniqueBrands = this.getCurrentContract().uniqueBrands;
			return uniqueBrands.find(brand => brand.BRAND_ID == sBrandId);
		},

		//validations
		/*validateDelivery: function(delivery){
			//Check for mandatory fields
			if (!delivery.localOrDirect ||
				!delivery.plannedInApo ||
				!delivery.requestedDeliveryDate ||
				!delivery.requestedDeliveryQuantity ||
				!delivery.actualDeliveryDate ||
				!delivery.actualDeliveryQuantity ||
				!delivery.undertakingLetters ||
				!delivery.compensated ||
				!delivery.skuCode ||
				!delivery.paidOrFree ||
				(delivery.penalty > 0 && (!delivery.penaltyCurrency || !delivery.penaltyReason)) || 
				(delivery.compensated === 'Yes' && !delivery.compensationComment)
			){
				return false;

			} else {
				return true;
			}
		},

		validateLetter: function(letter){
			//Check for mandatory fields
			if (!letter.reasonForLetter ||
				!letter.quantity ||
				!letter.batch ||
				!letter.manufacturingDate ||
				!letter.expiryDate ||
				!letter.returnDate ||
				!letter.returnedQuantity ||
				!letter.uoM
			){
				return false;

			} else {
				return true;
			}
		},*/

	});

	return ctrState;

});