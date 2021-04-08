sap.ui.define([
	"FAST_NS0FAST0/services/BaseService",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/libs/momentjs/moment.min",
	"FAST_NS0FAST0/model/userinfo",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseService, Services, MomentJS, UserInfo, Filter, FilterOperator) {
	"use strict";

    var MailService = BaseService.extend("FAST_NS0FAST0.services.MailService", {
		constructor: function (model) {
			BaseService.call(this, model);
		},
        sendMail: function(oMailToSend) {
                
            //path of offer that is selected
            var sPath = "/Outbox";

            //Create
            return this.odata(sPath).post(oMailToSend);
            
        },
    });
    
    return MailService;
});