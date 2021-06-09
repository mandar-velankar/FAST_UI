sap.ui.define([
	"com/bayer/tender/uilib/objects/BaseState",
	"../model/PublicMarketTender"
], function (BaseState, PublicMarketTender) {
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
			return this.getProperty("/selectedOpportunity");
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
				return newTenderId.data.NEXT_TENDER_NO;
			});
		},

	});

	return soaState;

});