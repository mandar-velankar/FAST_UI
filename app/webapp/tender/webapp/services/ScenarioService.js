sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min"
], function (BaseService, Services, MomentJS) {
	"use strict";

	var ScenarioService = BaseService.extend("FAST_NS0FAST0.services.ScenarioService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		createScenario: function (oScenarioToSave) {

			//that is this
			var that = this;

			//path of offer that is selected
			var sPath = "/PT_SCENARIOPLAN";

			//Create
			return that.odata(sPath).post(oScenarioToSave);

		},

		//update existing offer
		updateScenario: function (oScenarioToSave) {

			//that is this
			var that = this;

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of scenario that is selected
			var sPath = oModel.createKey("/PT_SCENARIOPLAN", {
				OfferID: oScenarioToSave.OfferID,
				ProductCode: oScenarioToSave.ProductCode,
				Active: 1,
				Scenario: oScenarioToSave.Scenario
			});

			//Update
			return that.odata(sPath).put(oScenarioToSave);

		},
		
		//Scenario to save
		getConvertScenarioToSave: function (oScenarioSaveInfo) {

			//Convert odata to structure that can be used to save
			var oScenarioToSave = {};

			oScenarioToSave.TenderID = oScenarioSaveInfo.TenderID;
			oScenarioToSave.OfferID = oScenarioSaveInfo.OfferID;
			oScenarioToSave.CountryCode = oScenarioSaveInfo.CountryCode;
			oScenarioToSave.ProductCode = oScenarioSaveInfo.ProductCode;
			oScenarioToSave.SubmittedOn = moment(oScenarioSaveInfo.SubmittedOn).utc().toDate();
			oScenarioToSave.SubmitedBy = oScenarioSaveInfo.SubmitedBy;
			oScenarioToSave.Active = oScenarioSaveInfo.Active;
			oScenarioToSave.Scenario = oScenarioSaveInfo.Scenario;
			oScenarioToSave.Name = oScenarioSaveInfo.Name;
			oScenarioToSave.Description = oScenarioSaveInfo.Description;
			oScenarioToSave.Volume = oScenarioSaveInfo.Volume;
			oScenarioToSave.OfferPrice = (oScenarioSaveInfo.OfferPrice === null) ? null : oScenarioSaveInfo.OfferPrice.toString();
			oScenarioToSave.FOC_ABS_PCT = oScenarioSaveInfo.FOC_ABS_PCT;
			oScenarioToSave.FOC = (oScenarioSaveInfo.FOC === null) ? null : oScenarioSaveInfo.FOC.toString();
			oScenarioToSave.FOCType = oScenarioSaveInfo.FOCType;
			oScenarioToSave.FOC_ABS_PCT_Bundled_1 = oScenarioSaveInfo.FOC_ABS_PCT_Bundled_1;
			oScenarioToSave.FOC_Bundled_1 = (oScenarioSaveInfo.FOC_Bundled_1 === null) ? null : oScenarioSaveInfo.FOC_Bundled_1.toString();
			oScenarioToSave.FOCProduct_Bundled_1 = (oScenarioSaveInfo.FOCProduct_Bundled_1 === null) ? null : oScenarioSaveInfo.FOCProduct_Bundled_1
				.toString();

			return oScenarioToSave;

		}
	});
	return ScenarioService;
});