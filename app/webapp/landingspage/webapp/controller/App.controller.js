sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, MessageBox) {
	"use strict";

	return BaseController.extend("com.bayer.tender.landingspage.controller.App", {

		onInit: function () {

			//what should be the density?
			this.getView().addStyleClass("sapUiSizeCompact"); //this.getOwnerComponent().getContentDensityClass()

			//Routing
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.getOwnerComponent().getRouter();
			var intervalId = setInterval(()=>{
				var unique = new Date().getTime().toString(16);
				this.getView().getModel("access").setUseBatch(false);
				this.getView().getModel("access").read("/getAccess", {
					urlParameters: { time: unique },
					error: () => {
						clearInterval(intervalId);
						MessageBox.warning(this.getText("sessionEnd"), {
							title: this.getText("information"),
							actions: [this.getText("close")],
							onClose: (sAction) => window.location.reload(true)
						});
					}
				});
				// this.getView().getModel("access").setUseBatch(true);
				// this.getView().getModel("access").refreshMetadata();
			}, 15000);//900000); //15 minutes
			//attach method fnHandleRoutePatternMatched to the route
			this.oRouter.attachRoutePatternMatched(this.fnHandleRoutePatternMatched, this);
		},

		//on every route matched, the binding of the images is set to the screen
		fnHandleRoutePatternMatched: function (oEvent) {

			//make a model for the images to be shown on the screen
			var oRootPath = jQuery.sap.getModulePath("com.bayer.tender.landingspage.images");
			var oImageModel = new JSONModel({
				path: oRootPath,
			});

			//bind the imageModel to the screen 
			this.getView().setModel(oImageModel, "imageModel");

		},

		//Home icon is clicked on top of the page... (header bar for each app)
		backHome: function (evt) {

			//beceause backHome can be fired from different parts in the application.
			//method is placed in the owner Component.js
			// this.getOwnerComponent().backHome();
			this.getRouter().navTo("Landingpage");

		},

		//When logo is clicked
		onPressLogo: function (evt) {
			window.open("http://sp-coll-bhc.bayer-ag.com/sites/221637/CoE/TenderManagement/default.aspx");
		},

		//TODO this is a formatter method, should be in a formatter script + check why it could not be bound from the imageModel that is used in other parts
		//get the transparant logo 
		getTransparentLogoLink: function () {
			var oRootpath = jQuery.sap.getModulePath("com.bayer.tender.landingspage");
			return oRootpath + "/images/Background.jpg";
		}
	});

});