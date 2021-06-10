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

		getNextTenderNo: function(){
			return this.nextTenderNo;
		},

		setNextTenderNo: function(sTenderNo){
			this.nextTenderNo = Number(sTenderNo);
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

		/**
		 * Returns a newTender from the State. No backend calls here.
		 */
		 getNewTender: function(){
			return this.getProperty("newTender") || {};
		},
		
        //keep detailPage so we can access it everywhere
        setDetailPage: function (oDetailPage){
            this.detailPage = oDetailPage;
		},

		getNewTenderNo: function(sCountry){
			return this.getService().getNewTenderNo(sCountry).then(newTenderId => {
				this.setNextTenderNo(newTenderId.data.NEXT_TENDER_NO);
				return newTenderId.data.NEXT_TENDER_NO;
			});
		},

		getNewTenderID: async function(sCountry){
			let sTenderNo = await this.getNewTenderNo(sCountry);

			//get year & country
			var sYear = moment().format('YY');

			//new tender ID is build by country
			return sCountry + "-" + sYear + "-" + sTenderNo;
		},

		/**
         * Get a new empty tender object
         */
		 createNewTenderObject: async function(sCountry){ 
			const sTenderId = await this.getNewTenderID(sCountry);
			const oSelectedOpportunity = this.getModel('soa').getProperty('/selectedOpportunity');

            const data = {
                //"ID" : this.create_UUID(),
				"TenderID": sTenderId,
				"TenderNo": this.getNextTenderNo(),
				"CountryCode": sCountry,
				"Active": 1,
				"Classification": "Contract",
				"TenderName": "",
				"InstituteID": 0,
				"TenderChannel": "Direct",
				"PublicationDate": oSelectedOpportunity.publicationDate,
				"BidDueDate": oSelectedOpportunity.finalDate,
				"AwardDate": oSelectedOpportunity.estimatedAwardDate,
				"NextPublicationDye": oSelectedOpportunity.datePubAnswers,
				"TenderStatus": "Open",
				"GroupPurchasing": 0,
				"TENDER_TYPE_ID": 6,
				"PROCUREMENT_METHOD_ID": "Not Specified",
				"PROCUREMENT_REASON": "",
				"HighValue": false,
				"ContractLength": Number(oSelectedOpportunity.contractDurationTime),
				"ContractExtension": Number(oSelectedOpportunity.TermExtension)
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

		/* create & update */
		 createTender: function (oTender) {
			return this.getService().createTender(oTender);
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