sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function (Controller, MessageToast) {
	"use strict";

	return Controller.extend("FAST_NS0FAST0.controller.App", {
		
		onInit: function () {
			
			//what should be the density?
			this.getView().addStyleClass("sapUiSizeCompact"); //this.getOwnerComponent().getContentDensityClass()
			
			//Routing
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.getOwnerComponent().getRouter();
			
			//attach method fnHandleRoutePatternMatched to the route
			this.oRouter.attachRoutePatternMatched(this.fnHandleRoutePatternMatched, this);
		},
		
		//on every route matched, the binding of the images is set to the screen
		fnHandleRoutePatternMatched: function(oEvent) {
			
			//make a model for the images to be shown on the screen
			var oRootPath = jQuery.sap.getModulePath("FAST_NS0FAST0.images");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: oRootPath,
			});
			
			//bind the imageModel to the screen 
			this.getView().setModel(oImageModel, "imageModel");
			
		},
		
		//Home icon is clicked on top of the page... (header bar for each app)
		backHome: function (evt) {
			
			//beceause backHome can be fired from different parts in the application.
			//method is placed in the owner Component.js
			this.getOwnerComponent().backHome();
			
		},
		
		//When logo is clicked
		onPressLogo: function (evt) {
			window.open("http://sp-coll-bhc.bayer-ag.com/sites/221637/CoE/TenderManagement/default.aspx");
		},
		
		//TODO this is a formatter method, should be in a formatter script + check why it could not be bound from the imageModel that is used in other parts
		//get the transparant logo 
		getTransparentLogoLink: function () {
			var oRootpath = jQuery.sap.getModulePath("FAST_NS0FAST0");
			return oRootpath + "/images/Background.jpg";
		}

	});
});