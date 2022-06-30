sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services"
], function (BaseService, Services) {
	"use strict";

	var ApprovalService = BaseService.extend("FAST_NS0FAST0.services.AccessService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
		getAccess: function () {
			return this.odata('/getAccess').get();

		}
	});
	return ApprovalService;
});