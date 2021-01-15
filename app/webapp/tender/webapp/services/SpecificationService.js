sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, Filter, FilterOperator) {
	"use strict";

	var SpecificationService = BaseService.extend("FAST_NS0FAST0.services.SpecificationService", {

		constructor: function (model) {
			BaseService.call(this, model);
		},

		getSpecificationsForTender: function(sTenderID){ 
			
			var sPath = "/Specifications";

			var oTenderFilter = new Filter({
				path: 'TenderID',
				operator: FilterOperator.EQ,
				value1: sTenderID
			});

			var mParameters = {
				filters: [oTenderFilter]
			};

			return this.odata(sPath).get(mParameters);
		},
		
		//create new specification
		createSpecification: function (oSpecificationToSave) { debugger;

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = "/Specifications";

			//Create
			return this.odata(sPath).post(oSpecificationToSave);

		},

		//create new specifications based upon array
		createSpecifications: function (aSpecificationsToSave) {

			//array of promises
			let promises = [];
			
			//that is this
			var that = this;
			
			//get model for calls
			var oModel = Services.getDefaultModel();

			//when award criteria exist
			if (aSpecificationsToSave && aSpecificationsToSave.length > 0) {

				//loop at each award criteria and put it into the batch
				aSpecificationsToSave.forEach(function (oSpecification, iIndex) {

					//convert award criteria to save, with new tenderID
					var oSpecificationToSave = that.getConvertAwardCriteriaToSave(oSpecification);

					//add awardcriteria to save 1 by 1 as a batch
					promises.push(that.createAwardCriteria(oSpecificationToSave).catch(function (oError) {
						//show error message
						Services.showErrorMessage(oError, "Saving of new Specification");
						throw new Error(oError);
					}));

				});

			}

			//if all promises pushed from the loop have received their answer
			return Promise.all(promises).then((result) => {

				//resolve success
				return result;

			}).catch(function (oError) {

				//reject
				return oError;

			});

		},

		//update existing Specification
		updateSpecification: function (oSpecificationToSave) { debugger;

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/Specifications", {
				TenderID: oSpecificationToSave.TenderID,
				CountryCode: oSpecificationToSave.CountryCode,
			});

			//Update
			return this.odata(sPath).put(oSpecificationToSave);

		},
		
		//removing Specification
		removeSpecification: function (oSpecificationToRemove) { debugger;

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of offer that is selected
			var sPath = oModel.createKey("/Specifications", {
				TenderID: oSpecificationToRemove.TenderID,
			});

			//remove
			return new Promise(function (resolve, reject) {

				oModel.remove(sPath, {
					success: function (oData, oResponse) {

						//resolve success
						resolve(oData);

					},
					error: function (oError) {

						//show error message
						Services.showErrorMessage(oError, "Removing of Specification");

						//reject
						reject(oError);
					}
				});
			});
		},

		removeAllSpecificationForTenderID: function(sTenderID){

			return this.getSpecificationsForTender(sTenderID).then((response) => {
					debugger;
			});
			
		},
		
		//AwardCriteria to save
		getConvertAwardCriteriaToSave: function (oAwardCriteriaSaveInfo) {

			//Convert odata to structure that can be used to save
			var oAwardCriteriaToSave = {};

			oAwardCriteriaToSave.TENDERID = oAwardCriteriaSaveInfo.TENDERID;
			oAwardCriteriaToSave.COUNTRYCODE = oAwardCriteriaSaveInfo.COUNTRYCODE;
			oAwardCriteriaToSave.SUBMITTEDON = oAwardCriteriaSaveInfo.SUBMITTEDON;
			oAwardCriteriaToSave.Submittedby = oAwardCriteriaSaveInfo.Submittedby;
			oAwardCriteriaToSave.Active = oAwardCriteriaSaveInfo.Active;
			oAwardCriteriaToSave.AwardCriteria = oAwardCriteriaSaveInfo.AwardCriteria;
			oAwardCriteriaToSave.Weight = oAwardCriteriaSaveInfo.Weight;

			return oAwardCriteriaToSave;

		}
	});
	
	return SpecificationService;
});