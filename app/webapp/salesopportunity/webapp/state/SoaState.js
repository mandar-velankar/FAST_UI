sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseState",
	"../model/PublicMarketTender",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"../model/Tender"
], function (BaseState, PublicMarketTender, MomentJS, Tender) {
	"use strict";

	var soaState = BaseState.extend("com.bayer.tender.salesopportunity.state.SoaState", {

		constructor: function (oService) {
			//data used for the view
			// this.data = ObservableSlim.create({
			this.data = {
				opportunities: [],
				selectedOpportunity: {},
				editMode: false
				//pricing: new Pricing()
			};
			// , true, (changes) => {
			// 	this.updateModel();
			// });

			this.soaService = oService;
			BaseState.call(this);
		},

		getService: function () {
			return this.soaService;
		},

		setEditMode: function (sEditMode){
			this.setProperty("editMode", sEditMode);
		},

		setTenderMatchingStatus:function(status){
			this.getSelectedOpportunity().setTenderMatchingStatus(status);
			this.updateModel();
		},

		createOpportunity: function(data){
			if(data){
				return new PublicMarketTender(data);
			}

			return "You must provide an object literal as a parameter to create an opportunity.";
		},

		setSelectedOpportunity: function(opportunity){
			this.setProperty("selectedOpportunity", opportunity);
		},

		getSelectedOpportunity: function(){
			return this.getProperty("selectedOpportunity");
		},

		/**
		 * Saves a given opportunity in the backend.
		 * @returns {Promise} - Return a promise
		 */
		saveSelectedOpportunity: function(){
			return this.getService().saveOpportunity(this.getSelectedOpportunity());
		},

		/**
		 * Fetches opportunities from the backend.
		 * @param {string} sPublicationDate - 
		 * @returns {promise} - a list of opportunities
		 */
		getOpportunities: async function(sPublicationDate){
			const { data } = await this.getService().getOpportunities(sPublicationDate);
			const opportunities = data.results.map(item => new PublicMarketTender(item));
			this.setProperty("opportunities", opportunities);
			return this.getProperty("opportunities");
		},

		//detailPage so we can access it everywhere
		getDetailPage: function () {
		    return this.detailPage;	
		},
		
        //keep detailPage so we can access it everywhere
        setDetailPage: function (oDetailPage){
            this.detailPage = oDetailPage;
		},

		getNewTenderID: function(sCountry){
			return this.getService().getNewTenderID(sCountry).then(newTenderId => {
				//get year & country
				var sYear = moment().format('YY');
				var sCountry = 'CL';

				//new tender ID is build by country
				return sCountry + "-" + sYear + "-" +  newTenderId.data.NEXT_TENDER_NO;
			});
		},

		/**
         * Get a new empty tender object
         */
		 createNewTenderObject: async function(sCountry){ 
			const sTenderId = await this.getNewTenderID(sCountry);

            const data = {
                "ID" : this.create_UUID(),
				"TenderId": sTenderId
            };

            const oTender = new Tender(data);
            return oTender;
		}, 	
		
		/**
		 * sets temporary new contract
		 * used for creating e new contract 
		 */
		setTemporaryTender: async function(sCountry){
			const tender = await this.createNewTenderObject(sCountry);
			this.setProperty("newTender", tender);
		},

		loadCountryChannels: async function(sCountry){
			const aCountryChannels = await this.getService().loadCountryChannels(sCountry);
			this.setProperty("CountryChannels", aCountryChannels.data.results);
		},

		loadCountryClassifications: async function(sCountry){
			const aCountryClassifications = await this.getService().loadCountryClassifications(sCountry);
			this.setProperty("CountryClassifications", aCountryClassifications.data.results);
		},

		loadCountryTenderTypes: async function(sCountry){
			const aCountryTenderTypes = await this.getService().loadCountryTenderTypes(sCountry);
			this.setProperty("CountryTenderTypes", aCountryTenderTypes.data.results);
		},

		loadCountryInstitutes: async function(sCountry, sInstituteType){
			const aCountryInstitutes = await this.getService().loadCountryInstitutes(sCountry, sInstituteType);
			this.setProperty("CountryInstitutes", aCountryInstitutes.data.results);
		},

		//sorting an array of objects
		sortByKeyAsc: function (array, key) {
			if (array) {
				return array.sort(function (a, b) {
					var x = a[key];
					var y = b[key];
					return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				});
			}

		},

	});

	return soaState;

});