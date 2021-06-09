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

		getNewTenderID: function(){
			return this.getService().getNewTenderID().then(newTenderId => {
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
		 createNewTenderObject: async function(){ 
			const sTenderId = await this.getNewTenderID();

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
		setTemporaryTender: async function(){
			const tender = await this.createNewTenderObject();
			this.setProperty("newTender", tender);
		},

	});

	return soaState;

});