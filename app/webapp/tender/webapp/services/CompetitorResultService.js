sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo"
], function (BaseService, Services, MomentJS, UserInfo) {
	"use strict";

	var CompetitorResultService = BaseService.extend("FAST_NS0FAST0.services.CompetitorResultService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		
		//create new competitor result
		createCompetitorResult: function (oResultToSave) {

			//path of offer that is selected
			var sPath = "/TransCompetitorResult";

			//Create
			return this.odata(sPath).post(oResultToSave);

		},

		//update existing competitor result
		updateCompetitorResult: function (oResultToSave) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of price
			var sPath = oModel.createKey("/TransCompetitorResult", {
				OFFERID: oResultToSave.OFFERID,
				PRODUCTCODE: oResultToSave.PRODUCTCODE,
				AWARDEDCOMPANY: oResultToSave.AWARDEDCOMPANY,
				AWARDEDPRODUCT: oResultToSave.AWARDEDPRODUCT
			});

			//update
			return this.odata(sPath).put(oResultToSave);

		},
		
		removeCompetitorResult: function (oResultToSave) {

			//get model for calls
			var oModel = Services.getDefaultModel();

			//path of price
			var sPath = oModel.createKey("/TransCompetitorResult", {
				OFFERID: oResultToSave.OFFERID,
				PRODUCTCODE: oResultToSave.PRODUCTCODE,
				AWARDEDCOMPANY: oResultToSave.AWARDEDCOMPANY,
				AWARDEDPRODUCT: oResultToSave.AWARDEDPRODUCT
			});

			//remove
			return this.odata(sPath).delete();

		},
		
		//convert for saving
		getConvertCompetitorResultToSave: function (oCompetitorResultTree) {

			if (oCompetitorResultTree) {
				var oCompetitorResult = {
					OFFERID: oCompetitorResultTree.OFFERID,
					PRODUCTCODE: oCompetitorResultTree.PRODUCTCODE,
					OUTCOME: oCompetitorResultTree.OUTCOME,
					AWARDEDCOMPANY: oCompetitorResultTree.AWARDEDCOMPANY !== 'Other' ? oCompetitorResultTree.AWARDEDCOMPANY : oCompetitorResultTree.OTHERCOMPANY,
					AWARDEDPRODUCT: oCompetitorResultTree.PRODUCT !== 'Other' ? oCompetitorResultTree.PRODUCT : oCompetitorResultTree.OTHERPRODUCT, //beceause bayer product & awarded product both use product on view
					AWARDEDPRICE: (oCompetitorResultTree.AWARDEDPRICE === null) ? null : oCompetitorResultTree.AWARDEDPRICE.toString(),
					CURRENCY: oCompetitorResultTree.CURRENCY,
					AWARDEDQTY:(oCompetitorResultTree.AWARDEDQTY !== "") ? Number(oCompetitorResultTree.AWARDEDQTY) : 0,
					UOM: oCompetitorResultTree.UOM,
					REASON: oCompetitorResultTree.REASON,
					COMMENT: oCompetitorResultTree.COMMENT,
					LASTUPDATE: moment().utc().toDate(),
					UPDATEDBY: UserInfo.getCWID(),
                    TOTALAWARDEDVALUE: (oCompetitorResultTree.TOTALAWARDEDVALUE) ? oCompetitorResultTree.TOTALAWARDEDVALUE.toString() : null,
					DELETED: 0
				};
			}

			return oCompetitorResult;

		}
	});
	return CompetitorResultService;
});