// if(location.hostname.indexOf("localhost")>-1){
// 	jQuery.sap.registerModulePath("com.bayer.tender.epa", "/epa/webapp");
// 	jQuery.sap.registerModulePath("com.bayer.tender.contracts", "/contracts/webapp"); 
// 	// jQuery.sap.registerModulePath("com.bayer.tender.uilib", "/uilib/src/com/bayer/tender/uilib"); 
// 	sap.ui.getCore().loadLibrary("com.bayer.tender.uilib","/uilib/src/com/bayer/tender/uilib"); //registers & loads the library in one go
// 	jQuery.sap.registerModulePath("FAST_NS0FAST0", "/tender/webapp"); 
// }else{
// 	jQuery.sap.registerModulePath("com.bayer.tender.epa", "/epa");
// 	jQuery.sap.registerModulePath("com.bayer.tender.ppa", "/ppa");
// 	jQuery.sap.registerModulePath("com.bayer.tender.contracts", "/contracts"); 
// 	// jQuery.sap.registerModulePath("com.bayer.tender.uilib", "/uilib"); 
// 	sap.ui.getCore().loadLibrary("com.bayer.tender.uilib","/uilib");
// 	jQuery.sap.registerModulePath("FAST_NS0FAST0", "/tender"); 
// }
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/f/library",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Label",
	"sap/m/MessageToast",
	"sap/m/Text",
	"sap/m/TextArea",
	"sap/ui/model/odata/v2/ODataModel",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/services/OfferService",
	"FAST_NS0FAST0/services/TenderService",
	"FAST_NS0FAST0/services/ApprovalService",
	"FAST_NS0FAST0/services/AwardCriteriaService",
	"FAST_NS0FAST0/services/CompetitorResultService",
	"FAST_NS0FAST0/services/DeliveryService",
	"FAST_NS0FAST0/services/BankGuaranteeService",
	"FAST_NS0FAST0/services/PriceAgreementService",
	"FAST_NS0FAST0/services/BrazilContractService",
	"FAST_NS0FAST0/services/LetterService",
	"FAST_NS0FAST0/services/GroupPurchasingService",
	"FAST_NS0FAST0/services/PriceService",
	"FAST_NS0FAST0/services/DistributorBrandPolicyService",
	"FAST_NS0FAST0/services/ChannelProductPolicyService",
	"FAST_NS0FAST0/services/ProductService",
	"FAST_NS0FAST0/services/ResultService",
	"FAST_NS0FAST0/services/SalesOpportunityService",
	"FAST_NS0FAST0/services/ScenarioService",
	"FAST_NS0FAST0/services/QuotationService",
	"FAST_NS0FAST0/services/SpecificationService",
	"FAST_NS0FAST0/services/AccessService",
	"sap/ui/Device",
	"FAST_NS0FAST0/services/MailService",
    "FAST_NS0FAST0/services/PriceConditionService",
    "FAST_NS0FAST0/services/TenderHistoryService"
], function (UIComponent, JSONModel, fioriLibrary, FlexibleColumnLayoutSemanticHelper, Button, Dialog, Label, MessageToast, Text,
	TextArea, ODataModel, Services, OfferService, TenderService, ApprovalService, AwardCriteriaService, CompetitorResultService, 
	DeliveryService, BankGuaranteeService, PriceAgreementService, BrazilContractService, LetterService, GroupPurchasingService, PriceService, DistributorBrandPolicyService, ChannelProductPolicyService, ProductService, ResultService, SalesOpportunityService, ScenarioService, QuotationService, SpecificationService,AccessService, Device, MailService, PriceConditionService, TenderHistoryService) {
	"use strict";

	return UIComponent.extend("FAST_NS0FAST0.Component", {

		// /* 17 minutes warning & 22 minutes message saying timeout is reached; SESSION_TIMEOUT is now 24min (default Hana timeout is 15 minutes) 5400000, //*/
        // countdownWarning: 1020000,			//1020000=17min //840000=14min	//1800000=30min		(600000,	//10 minute ) // cureent active = 14 minutes
        // resetCountdownWarning:  1020000,	//1020000=17min //840000=14min 		//1800000=30min		(600000,	//10 minute ) // cureent active = 14 minutes
        // countdownSessionEnd:  1140000,		//1140000=19min		//2400000=40min		(840000,	//14 minutes) // cureent active = 19 minutes
        // resetCountdownSessionEnd: 1140000,	//1140000=19min	//2400000=40min		(840000,	//14 minutes) // cureent active = 19 minutes
        // logoutUrl: window.location.host + window.location.pathname + window.location.hash, // URL to logout page.
        
		metadata: {
			manifest: "json"
		},

		init: function () {
			var oModel,
				oRouter;

			UIComponent.prototype.init.apply(this, arguments);

			oModel = new JSONModel();
			this.setModel(oModel);

			// var xsoModel = new sap.ui.model.odata.ODataModel("tender");
			// this.setModel(xsoModel);
			//var oModel = new sap.ui.model.odata.ODataModel("tender/tender", true)
			// oModel = new ODataModel();
			// this.setModel(oModel);

			oRouter = this.getRouter();
			oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
			oRouter.initialize();
			
			var oDefaultModel = this.getModel("fastData");
			var accessModel = this.getModel("access");
			Services.setDefaultModel(oDefaultModel);
			Services.setComponentID(this.getId()); //keep component ID dynamically

			// Services.setModel(oDefaultModel);
			
			//Load services & set default model
			this.OfferService = new OfferService(oDefaultModel);
			this.TenderService = new TenderService(oDefaultModel);
			this.ApprovalService = new ApprovalService(oDefaultModel);
			this.AwardCriteriaService = new AwardCriteriaService(oDefaultModel);
			this.CompetitorResultService = new CompetitorResultService(oDefaultModel);
			this.DeliveryService = new DeliveryService(oDefaultModel);
			this.BankGuaranteeService = new BankGuaranteeService(oDefaultModel);
			this.PriceAgreementService = new PriceAgreementService(oDefaultModel);
			this.BrazilContractService = new BrazilContractService(oDefaultModel);
			this.LetterService = new LetterService(oDefaultModel);
			this.GroupPurchasingService = new GroupPurchasingService(oDefaultModel);
			this.PriceService = new PriceService(oDefaultModel);
			this.DistributorBrandPolicyService = new DistributorBrandPolicyService(oDefaultModel);
			this.ChannelProductPolicyService = new ChannelProductPolicyService(oDefaultModel);
			this.ProductService = new ProductService(oDefaultModel);
			this.ResultService = new ResultService(oDefaultModel);
			this.SalesOpportunityService = new SalesOpportunityService(oDefaultModel);
			this.ScenarioService = new ScenarioService(oDefaultModel);
			this.QuotationService = new QuotationService(oDefaultModel);
			this.SpecificationService = new SpecificationService(oDefaultModel);
			this.MailService = new MailService(oDefaultModel);
            this.PriceConditionService = new PriceConditionService(oDefaultModel);
			this.AccessService = new AccessService(accessModel);
            this.TenderHistoryService = new TenderHistoryService(oDefaultModel);
			
			Services.setAllServices({
				OfferService:this.OfferService,
				TenderService:this.TenderService,
				ApprovalService:this.ApprovalService,
				AwardCriteriaService:this.AwardCriteriaService,
				CompetitorResultService:this.CompetitorResultService,
				DeliveryService:this.DeliveryService,
				BankGuaranteeService:this.BankGuaranteeService,
				PriceAgreementService:this.PriceAgreementService,
				BrazilContractService:this.BrazilContractService,
				LetterService:this.LetterService,
				GroupPurchasingService:this.GroupPurchasingService,
				PriceService:this.PriceService,
				DistributorBrandPolicyService: this.DistributorBrandPolicyService,
				ChannelProductPolicyService: this.ChannelProductPolicyService,
				ProductService:this.ProductService,
				ResultService:this.ResultService,
				SalesOpportunityService:this.SalesOpportunityService,
				ScenarioService:this.ScenarioService,
				QuotationService:this.QuotationService,
				SpecificationService: this.SpecificationService,
				MailService: this.MailService,
                PriceConditionService: this.PriceConditionService,
                AccessService: this.AccessService,
                TenderHistoryService: this.TenderHistoryService,
			});
			
			// //ADDED FOR SESSION TIMEOUT
			// this.setInactivityTimeoutWarning(this.countdownWarning);
			// this.setInactivityTimeoutSessionEnd(this.countdownSessionEnd);
            // this.startInactivityTimerWarning();
            // this.startInactivityTimerSessionEnd();
                
            // var that = this;
            
            // /**
            // * Each time a request is issued, reset the inactivity countdown
            // */
			// //fast app data model
            // oDefaultModel.attachRequestCompleted(function (oEvent) {
            //         that.resetInactivityTimeoutWarning();
            //         that.resetInactivityTimeoutSessionEnd();
			// }, this);

			// set device model (can be used to show hide elements based on device used)
			var oDeviceModel = new JSONModel(Device);
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.setModel(oDeviceModel, "device");			
			
			//set media query
			oDeviceModel.getData().media.initRangeSet(sap.ui.Device.media.RANGESETS.SAP_6STEPS);
			
			Services.getAccess();
		},
		
		//FlexibleColumnLayoutSemanticHelper class to implement the recommended UX patterns for layout changes in the app.
		//https://sapui5.hana.ondemand.com/#/topic/b8561ff6f4c34c85a91ed06d20814cd3
		_onBeforeRouteMatched: function(oEvent) {
			var oModel = this.getModel(),
				sLayout = oEvent.getParameters().arguments.layout,
				oNextUIState;

			// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
			if (!sLayout) {
				this.getHelper().then(function(oHelper) {
					oNextUIState = oHelper.getNextUIState(0);
					oModel.setProperty("/layout", oNextUIState.layout);
				});
				return;
			}

			oModel.setProperty("/layout", sLayout);
		},
		
		//FlexibleColumnLayoutSemanticHelper class to implement the recommended UX patterns for layout changes in the app.
		//https://sapui5.hana.ondemand.com/#/topic/b8561ff6f4c34c85a91ed06d20814cd3
		getHelper: function () {
			return this._getFcl().then(function(oFCL) {
				var oSettings = {
					defaultTwoColumnLayoutType: fioriLibrary.LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: fioriLibrary.LayoutType.ThreeColumnsMidExpanded,
					initialColumnsCount: 2,
					maxColumnsCount: 2
				};
				return (FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings));
			});
		},
		
		//FlexibleColumnLayoutSemanticHelper class to implement the recommended UX patterns for layout changes in the app.
		//https://sapui5.hana.ondemand.com/#/topic/b8561ff6f4c34c85a91ed06d20814cd3
		_getFcl: function () {
			return new Promise(function(resolve, reject) {
				var oFCL = this.getRootControl().byId('flexibleColumnLayout');
				if (!oFCL) {
					this.getRootControl().attachAfterInit(function(oEvent) {
						resolve(oEvent.getSource().byId('flexibleColumnLayout'));
					}, this);
					return;
				}
				resolve(oFCL);

			}.bind(this));
		},

		//back to the tiles view (main.view) - Launch
		backHome: function (oEvent) {
			
			//if footer is shown, this will be meening that we are in edit mode
			if (Services.getEditMode()) {
				//TODO: first check if there are changes to be done
				
				//if we are in change mode show message to ask if you are sure you want to leave without saving
				this.onApproveDialog();
			}else{
				//lets go back to the main view
				this.getRouter().navTo("launch");
			}
		},

		//Check if you want to save changes first TODO there is no difference between the 2 actions at this point
		onApproveDialog: function () {
			var that = this;
			var dialog = new Dialog({
				title: 'FAST Tender Framework',
				type: 'Message',
				content: new Text({
					text: 'Want to save your changes?'
				}),
				buttons: [
					new Button({
						text: 'Save',
						press: function () {
							//show message that changes are saved (TODO actually save the changes)
							MessageToast.show('Changes saved!');
							dialog.close();
							
							//lets go back to the main view
							that.getRouter().navTo("launch");
						}
					}),
					new Button({
						text: "Don't Save",
						press: function () {
							//show message that changes are saved (TODO actually save the changes)
							MessageToast.show('Changes discarded!');
							dialog.close();
							
							//lets go back to the main view
							that.getRouter().navTo("launch");
						}
					}),
					new Button({
						text: 'Cancel',
						press: function () {
							//dialog is closed and nothing is to be done
							dialog.close();
						}
					})
				],
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		
		getContentDensityClass : function() {
			if (!this._sContentDensityClass) {
				if (!sap.ui.Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},
		

		// /**
        // * Set to correspond to something less than the SESSION_TIMEOUT value that you set for your approuter
        // * @see https://help.sap.com/viewer/4505d0bdaf4948449b7f7379d24d0f0d/2.0.04/en-US/5f77e58ec01b46f6b64ee1e2afe3ead7.html
        // */
            
        //     /**
        //      * Return number of milliseconds left till warning
        //      */
        //     getInactivityTimeoutWarning: function() {
        //         return this.countdownWarning;
        //     },
 
        //      /**
        //      * Return number of milliseconds left till automatic logout
        //      */
        //     getInactivityTimeoutSessionEnd: function() {
        //         return this.countdownSessionEnd;
        //     },
            
        //     /**
        //      * Set number of minutes left till warning
        //      */
        //     setInactivityTimeoutWarning: function(timeout_millisec) {
        //         this.countdownWarning = timeout_millisec;
        //         this.resetCountdownWarning = this.countdownWarning;
        //     },

        //     /**
        //      * Set number of minutes left till automatic logout
        //      */
        //     setInactivityTimeoutSessionEnd: function(timeout_millisec) {
        //         this.countdownSessionEnd = timeout_millisec;
        //         this.resetCountdownSessionEnd = this.countdownSessionEnd;
        //     },
            
        //     /**
        //      * Set number of minutes left till automatic logout
        //      */
        //     resetInactivityTimeoutWarning: function() {
        //         this.countdownWarning = this.resetCountdownWarning;
        //     },

        //     /**
        //      * Set number of minutes left till automatic logout
        //      */
        //     resetInactivityTimeoutSessionEnd: function() {
        //         this.countdownSessionEnd = this.resetCountdownSessionEnd;
        //     },
            
        //     /**
        //      * Begin counting tracking inactivity warning
        //      */
        //     startInactivityTimerWarning: function() {
        //         var that = this;
        //         this.intervalHandleWarning = setInterval(function() { 
        //         	//trigger warning message for possible extending
        //             that._inactivityCountdownWarning();
        //         },  10000);
        //     },
 
        //     /**
        //      * Begin counting tracking inactivity session end
        //      */
        //     startInactivityTimerSessionEnd: function() {
        //         var that = this;
        //         this.intervalHandleSessionEnd = setInterval(function() {  
        //              //trigger session timeout message
        //             that._inactivityCountdownSessionEnd();   
        //         },  10000);
        //     },
            
        //     stopInactivityTimerWarning: function() {
        //         if (this.intervalHandleWarning !== null) {
        //             clearInterval(this.intervalHandleWarning);
        //             this.intervalHandleWarning = null;
        //         }
        //     },

        //     stopInactivityTimerSessionEnd: function() {
        //         if (this.intervalHandleSessionEnd !== null) {
        //             clearInterval(this.intervalHandleSessionEnd);
        //             this.intervalHandleSessionEnd = null;
        //         }
        //     },
            
        //     //first show a warning, user can extend session
        //     _inactivityCountdownWarning: function() {
        //     	var that = this;
        //         this.countdownWarning -= 10000;
        //         if (this.countdownWarning <= 0) {
                
		// 			//stop warning
		// 		    //that.resetInactivityTimeoutWarning();
		// 		    that.stopInactivityTimerWarning();
				        
		// 			//if warning is already shown, we close it first
        //             var oSessionWarningMessage = sap.ui.getCore().byId("idSessionWarningMessage");
		//         	if(oSessionWarningMessage){
		//         		oSessionWarningMessage.close();	
		//         		oSessionWarningMessage.destroy();
		//         	}
		        
		//         	//check if session end message is found
		//         	var oSessionSessionEndMessage = sap.ui.getCore().byId("idSessionEndMessage");
		        
		//         	//only if session end message is not shown, we show a warning
		//         	if(!oSessionSessionEndMessage){
		        
		//         		//session end
		// 	        	sap.m.MessageBox.warning("Session is ending in 5min.. Click extend to keep working in the application", 
		// 	            			{
		// 	            				id: "idSessionWarningMessage",
		// 								title: "Information",
		// 								actions: ["Extend Session"],
		// 	        					onClose: function(sAction) {
			    
		// 	        						if(sAction === "Extend Session" ){
			        
		// 		        						//trigger back-end
		// 		        						Services.loadUserInfo();
				    
		// 		        						//start warning again
		// 		        						that.startInactivityTimerWarning();
				    
		// 		        						//reset session end
		// 		        						//that.stopInactivityTimerWarning(); //we do not want to stop showing warning messages
		// 		        						that.resetInactivityTimeoutWarning();
		// 		        						//that.stopInactivityTimerSessionEnd(); //we do not want to stop timeout triggering
		// 		        						that.resetInactivityTimeoutSessionEnd();
								
		// 	        						}
							
		// 	        					}
		// 	            			}
		// 	            );
			            
		//         	}
        //         }
        //     },
            
        //     //show message saying session has ended and user needs to login again
        //     _inactivityCountdownSessionEnd: function() {
        //     	var that = this;
        //         this.countdownSessionEnd -= 10000;
                
        //         if (this.countdownSessionEnd <= 0) {
            
        //         	//stop timers & reset
        //             this.stopInactivityTimerSessionEnd();
        //             this.resetInactivityTimeoutSessionEnd();
                    
        //             //if warning message is still open, close it first
        //             var oSessionWarningMessage = sap.ui.getCore().byId("idSessionWarningMessage");
		//         	if(oSessionWarningMessage){
		//         		oSessionWarningMessage.close();	
		//         		oSessionWarningMessage.destroy();
		//         	}
		    
		//         	//show session end message
		//         	sap.m.MessageBox.warning("Session has ended.. Please logon again.", 
		//             			{
		//             				id: "idSessionEndMessage",
		// 							title: "Information",
		// 							actions: ["Close"],
		//         					onClose: function(sAction) {
		//         						window.location.reload(true);
		//         						//window.location = that.logoutUrl;
		//         					}
		//             			}
		//             );
		            
        //         }
        //     }

	});
});