/* global moment:true */
/* global PizZip:true */
/* global Docxtemplater:true */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/util/File",
	"FAST_NS0FAST0/model/formatter",
	"FAST_NS0FAST0/utils/Formatter",
	"FAST_NS0FAST0/model/services",
	"FAST_NS0FAST0/model/userinfo",
	"FAST_NS0FAST0/libs/momentjs/moment.min"
], function (Object, File, Formatter, Formatter2, Services, UserInfo, Moment) {
	"use strict";
	
	var Quotation = Object.extend("FAST_NS0FAST0.model.quotation", {
		
		//CONSTRUCTOR
		//-----------
				constructor: function () {
					//one model for doing calls to the back-end
					this._oFastDataCalls = Services.getDefaultModel(); //new sap.ui.model.odata.ODataModel(Services.getConnectionString());
				},

		//GENERAL
		//-------
		
			//Local Variable
			//--------------
				_bDelayInSubmission: null,

		//Setters
		//-------
				//keep delay in submission
				setDelayInSubmission: function(bDelayInSubmission){
					this._bDelayInSubmission = bDelayInSubmission;
				},
				
		//Getters
		//-------
				
				getDelayInSubmission: function(){
					return	this._bDelayInSubmission;
				},
				
				getQuotationSaveInfo: function(){
					
					var that = this;
					
					//get selected offer
					var sSelectedOfferPath	= Services.getSelectedOfferPath();
					var oOffer				= Services.getDefaultModel().getProperty(sSelectedOfferPath);
					var sSelectedOfferID	= oOffer.OfferID;
					var aProducts			= Services.getLoadedProductsForOffer(sSelectedOfferID);
					var oQuotation = {};
					
					//get ready to save info
					oQuotation.TenderID 			= oOffer.TenderID;
					oQuotation.OfferID				= oOffer.OfferID;
					oQuotation.CountryCode			= oOffer.CountryCode;
					oQuotation.DistributorID		= oOffer.DistributorID;
					oQuotation.SubmittedOn			= moment().utc().toDate();
					oQuotation.SubmittedBy			= UserInfo.getCWID();
					oQuotation.Active				= 1;
					oQuotation.OfferValidity		= oOffer.CreationDate;
					oQuotation.DelayInSubmission	= that.getDelayInSubmission();
					oQuotation.AS1					= oOffer.SellingCompanyDetails ? oOffer.SellingCompanyDetails.AuthorizedSignatory1 : "NA";
					oQuotation.AS2					= oOffer.SellingCompanyDetails ? oOffer.SellingCompanyDetails.AuthorizedSignatory2 : "NA";
					oQuotation.OfferDate			= oOffer.CreationDate;
					if(aProducts && aProducts.results[0]){
						oQuotation.DeliveryTerms	= aProducts.results[0].INCOTerms;
					}else{
						oQuotation.DeliveryTerms	= '';
					}
					oQuotation.I_Q_1				= "test"; //TODO//oOffer.I_Q_1;
					oQuotation.I_Q_2				= "test"; //TODO//oOffer.I_Q_2;
					oQuotation.I_Q_3				= "test"; //TODO//oOffer.I_Q_3;
					oQuotation.Comment				= oOffer.Comment;
					
					return oQuotation;
					
				},

		
		//Clearing
		//--------
				clearQuotationOfferProducts: function(){
					var oFastAppDataModel = Services.getFastAppDataModel();
					
					//clear offer validation
					var aOfferValidation = [];
					oFastAppDataModel.setProperty("/OfferValidation", aOfferValidation);
					
					//clear offer product validation
					var aOfferProductValidation = [];
					oFastAppDataModel.setProperty("/OfferProductValidation", aOfferProductValidation);
					
					//clear switch
					this.setDelayInSubmission(null);
				},
				
		//Loaders
		//-------
				
				//loading Quotation for offer
				loadQuotationForSelectedOffer: function (sOfferDate){
					
					//lets work with callbacks (3 places, return, resolve, reject)
					var oDeferred = $.Deferred();
					var that = this;
					
					//get model for doing the calls to the back-end
					var oFastDataCalls = Services.getDefaultModel();
					var oFastAppDataModel = Services.getFastAppDataModel();	
					
					//get selected offer
					var sSelectedOfferPath	= Services.getSelectedOfferPath();
					var oOffer				= Services.getLoadedOffer(Services.getSelectedOfferID()); //Services.getDefaultModel().getProperty(sSelectedOfferPath);
					
					//Key's
					var sOfferID	= oOffer.OfferID;
					var sActive		= 1;
					if (!sOfferDate){
						//if offer date does not exist, we take the date of today
						sOfferDate	= moment().utc().toDate(); //Hours should be 00 beceause we don't keep it in front-end, otherwise we will always create a new date
					}
					
					/* NO LONGER NEEDED BECEAUSE ALL DATES ARE NOW IN UTC
					//The key should be created manually in this case, instead of using createKey method.
					//There are issues with datetimeconversion, as the createKey method reformats the date to UTC format.
					//var sQuotationPath = "/PT_TMQUTO(OfferID='" + sOfferID +"',Active=" + sActive + ",OfferDate=datetime'" + sOfferDate + "')";//using view to always have data
					*/
					
					//create path
					var sQuotationPath = Services.getDefaultModel().createKey("/PT_TMQUTO",{
						OfferID:sOfferID,
						Active:sActive,
						OfferDate:sOfferDate
					});
					
					//Reading the back end data from the Approvals table
					oFastDataCalls.read(sQuotationPath, {
						success: function(oData, oResponse) {
									
								if(oData){ //if quotation is found
								
										//path where the quotation for the selected offer should be stored
										var sPathQuotationOfSelectedOffer = "/QuotationSelectedOffer";
										oFastAppDataModel.setProperty(sPathQuotationOfSelectedOffer, oData);
										
										//keep sQuotationPath in odata result to return
										oData.sQuotationPath = sQuotationPath;
								}

									
								//let the callback be triggered
								oDeferred.resolve(oData);
									
						},
						error: function(oError) {
									
								//show error message
								//Services.showErrorMessage(oError, "Loading of Quotation");
									
								//let the callback be triggered
								//oDeferred.reject(oError);
								
								//if it was not found... we still want to return positive
								var oData = {};
								oData.sResult = 'nothingfound';
								oDeferred.resolve(oData);
									
						}
								
					});						

					
					//return promise so the function can check if execution is done
					return oDeferred.promise();
					
					
				},
					
				//load all Validation information
				loadOfferAndProductValidationInfo: function(){

					var that = this;
					
					// instantiate loading dialog
					if (!that._LoadingDialogOfferProductValidation) {
						that._LoadingDialogOfferProductValidation = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
					}
		
					// open loading dialog
					that._LoadingDialogOfferProductValidation.open();
					
					//get model for doing the calls to the back-end
					var oFastDataCalls = Services.getDefaultModel();
					var oFastAppDataModel = Services.getFastAppDataModel();	
					
					//Key's
					var sOfferID	= Services.getSelectedOfferID();					
					
					//catch all promises in an array
					let promises = [];
					
					//if all promsises are done
					var oDeferred_all = $.Deferred();
					
					if(sOfferID){
						
						//loading offer validation
						promises.push($.when(that.loadOfferValidation(sOfferID)).done(function(oData){
							
						}));
	
						//loading product validation
						promises.push($.when(that.loadOfferProductValidation(sOfferID)).done(function(oData){
							
						}));
						
					}else{
						
						// close loading dialog
						if (that._LoadingDialogOfferProductValidation) {
							that._LoadingDialogOfferProductValidation.close();
						}
						
						sap.m.MessageBox.warning("First select an offer.", {});
						oDeferred_all.resolve("No data is loaded");
						
					}
				
					//if all promises pushed from the loop have received their answer
					Promise.all(promises).then((result) => {

						// close loading dialog
						if (that._LoadingDialogOfferProductValidation) {
							that._LoadingDialogOfferProductValidation.close();
						}
								
						//return aProductsForBinding;
						oDeferred_all.resolve("All data is loaded.");
						
					})
					
					return oDeferred_all.promise();
						
				},
				
				//load offer validation  for offer
				loadOfferValidation: function(sOfferID){
					
					//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
					var oDeferred = $.Deferred();
					
					//get model for doing the calls to the back-end
					var oFastDataCalls = Services.getDefaultModel();
					var oFastAppDataModel = Services.getFastAppDataModel();
					
					var that = this;
					
					var sOfferValidationPath = "/OfferValidation";
					
					var aFilters = [];
					
					if(sOfferID){
						var oCountryFilter = new sap.ui.model.Filter("OFFERID", sap.ui.model.FilterOperator.EQ, sOfferID);
						aFilters.push(oCountryFilter);
					}
					
					//Reading the back end data from the tender table
					oFastDataCalls.read(sOfferValidationPath, {
							filters: aFilters,
							success: function(oData, oResponse) {
								
								//Offer validation data
								var oOfferValidation = oData.results[0];
								
								//data received is set to the award model
								oFastAppDataModel.setProperty("/OfferValidation", oOfferValidation);
								
								//let the callback be triggered
								oDeferred.resolve(oData);
							
							},
							error: function(oError) {
								
								// close loading dialog
								if (that._LoadingDialogOfferProductValidation) {
									that._LoadingDialogOfferProductValidation.close();
								}
						
								//show error message
								Services.showErrorMessage(oError, "Loading of quotation offer validation");
								
								//let the callback be triggered
								oDeferred.reject(oError);
							
							}
					});						
					

					//return promise so the function can check if execution is done
					return oDeferred.promise();	
				},
				
				//load offer product validation
				loadOfferProductValidation: function(sOfferID){
					
					//lets work with callbacks: this way we only load the product data in case the offers of the selected tender are loaded
					var oDeferred = $.Deferred();
					
					//get model for doing the calls to the back-end
					var oFastDataCalls = Services.getDefaultModel();
					var oFastAppDataModel = Services.getFastAppDataModel();
					
					var that = this;
					
					var sOfferProductValidationPath = "/OfferProductValidation";
					
					var aFilters = [];
					
					if(sOfferID){
						var oCountryFilter = new sap.ui.model.Filter("OFFER_ID", sap.ui.model.FilterOperator.EQ, sOfferID);
						aFilters.push(oCountryFilter);
					}
					

					//Reading the back end data from the tender table
					oFastDataCalls.read(sOfferProductValidationPath, {
							filters: aFilters,
							success: function(oData, oResponse) {
								
								//catch the offer products
								var aOfferProductValidation = oData.results;
								aOfferProductValidation = Services.sortByKeyAsc(aOfferProductValidation, "SORTER");
								
								//data received is set 
								oFastAppDataModel.setProperty("/OfferProductValidation", aOfferProductValidation);
								
								//let the callback be triggered
								oDeferred.resolve(oData);
							
							},
							error: function(oError) {

								// close loading dialog
								if (that._LoadingDialogOfferProductValidation) {
									that._LoadingDialogOfferProductValidation.close();
								}
								
								//show error message
								Services.showErrorMessage(oError, "Loading of quotation offer product validation");
								
								//let the callback be triggered
								oDeferred.reject(oError);
							
							}
					});						
					

					//return promise so the function can check if execution is done
					return oDeferred.promise();	
				},

		//CHECKERS
		//--------
				//check if approvertype is a mandatory type
				/*
				checkMandatory: function(sApproverTypeSection){
					
					//default false
					var bMandatory = false;
					
					//check if the approvertype is mandatory
					if (sApproverTypeSecion === 1) {
					 bMandatory = true;
					}
					
					return bMandatory;
					
				},
				*/
				
		//SAVERS
		//------		
				
				//Submitting a quotation
				submitQuotation: function(quotationFields) {
					
					//lets work with callbacks
					var oDeferred = $.Deferred();
					var that = this;
					
					//get model for calls
					var oModel = Services.getDefaultModel();
					
					let promises = [];
					
					//get selected offer
					var sSelectedOfferPath = Services.getSelectedOfferPath();
					var oOffer = Services.getDefaultModel().getProperty(sSelectedOfferPath);
					
					//check offer has been selected
					if(!oOffer){
						
						sap.m.MessageBox.warning("Nothing to submit. Please select offer to submit.", {});
						
						oDeferred.reject();
						return;
					}

					//check the offer status
					$.when(Services.checkOfferStatus()).done(function(oData){

						//re-submitting should be prevented when status is "Quotation Submitted" and beyond
						var aStatusNoReSubmitting = [
							"Quotation Submitted",
							"Results Recorded",
							"Delivery Ongoing"
						];
						
						//check if status is allowing delete,
						if($.inArray( oData.STATUS, aStatusNoReSubmitting ) !== -1){
							sap.m.MessageBox.warning("We can not re-submit the offer.", {});
							oDeferred.reject();
							return;
						}
					
						//get save info for quotation to be saved
						var oQuotationSaveInfo = that.getQuotationSaveInfo();
						oQuotationSaveInfo.OfferDate = quotationFields.OfferDate;
						oQuotationSaveInfo.OfferValidity = quotationFields.OfferValidity
						oQuotationSaveInfo.Comment = quotationFields.CustomRemark;
						oQuotationSaveInfo.AS1 = quotationFields.IssuedBy;
						oQuotationSaveInfo.AS2 = quotationFields.CompanyStamp;
						oQuotationSaveInfo.UPDATED = 1;

						var oQuotationToSave = Services.getService('Quotation').getConvertQuotationToSave(oQuotationSaveInfo);
						
						//array for the change operations
						var aChangeOperations = [];
						
						//table where the status of the offer is kept
						var sPath = ""; 
						
						//check if there needs to be an update (already existing and erpost)
						$.when(that.loadQuotationForSelectedOffer(quotationFields.OfferDate)).done(function(oData){
							
							
							if(oData.sResult === 'nothingfound'){
								
								/*//create path
								sPath = "/PT_TMQUTO";
								
								//Keep the change opperations: Create (POST) 
								aChangeOperations.push(oModel.createBatchOperation(sPath, "POST", oQuotationSaveInfo, null));*/
								
								promises.push(Services.getService('Quotation').createQuotation(oQuotationToSave).catch(function(oError){
									Services.showErrorMessage(oError, "Create Quotation");
									throw new Error(oError);
								}));
								
							}else{
															
								/*//update path
								sPath = oData.sQuotationPath; 
								
								//Keep the change opperations: Update (PUT) 
								aChangeOperations.push(oModel.createBatchOperation(sPath, "PUT", oQuotationSaveInfo, null));*/
								
								promises.push(Services.getService('Quotation').updateQuotation(oQuotationToSave).catch(function(oError){
									Services.showErrorMessage(oError, "Update Quotation");
									throw new Error(oError);
								}));
							
							}
	
							Promise.all(promises).then((result) =>{
									sap.m.MessageBox.success("Quotation succesfully saved..", {});
	
									$.when(Services.saveOfferSubmissionDate(oQuotationSaveInfo.SubmittedOn)).done(function(oSaveSubmissionDate){
										
									});
	
									//update the status of the offer accordingly
									$.when(Services.saveOfferStatus("Quotation Submitted")).done(function(oSaveStatus){
										
										//new offer status needs to be shown
										Services.getDefaultModel().refresh(true);
											
										//let the callback be triggered
										oDeferred.resolve(true);
										
									});
								
								//close loading dialog
								if(that._LoadingDialogQuotation){
									that._LoadingDialogQuotation.close();
								}
							}).catch(function(oError){
								//close loading dialog
								if(that._LoadingDialogQuotation){
									that._LoadingDialogQuotation.close();
								}
								
								//unexpected error occured
								Services.showErrorMessage(oError, "Quotation Submittion");
									
								//let the callback be triggered
								oDeferred.reject(oError);
							});
	
							/*//add update/create as a BATCH operation on the model
							oModel.addBatchChangeOperations(aChangeOperations);
										
							oModel.submitBatch(function(oData, oResponse, oError) {
										
								if (oError.length > 0) {
									
									//Error during save
									Services.showErrorMessage(oError, "Submitting of Quotation");
									
									//let the callback be triggered
									oDeferred.reject(oError);
									
								} else { 
									
									
									sap.m.MessageBox.success("Quotation succesfully submitted..", {});
									
									$.when(Services.saveOfferSubmissionDate(oQuotationSaveInfo.SubmittedOn)).done(function(oSaveSubmissionDate){
										
									});
									
									//update the status of the offer accordingly
									$.when(Services.saveOfferStatus("Quotation Submitted")).done(function(oSaveStatus){
											//new offer status needs to be shown
											Services.getDefaultModel().refresh(true);
									});
									
									//let the callback be triggered
									oDeferred.resolve(oData);
									
								}
							});	*/
						
							//return promise so the function can check if execution is done
							
						
						});
						
					});
					
					return oDeferred.promise();
				},
				
				//switching delay in submission on & off
				saveDelayInSubmission: function(bDelayInSubmission, sOfferDate){
					
					//lets work with callbacks: this way we only save products if OFFER is created
					var oDeferred = $.Deferred();
					var that = this;
					
					//get model for calls
					var oModel = Services.getDefaultModel();
					
					let promises = [];
					
					//get selected offer
					var sSelectedOfferPath = Services.getSelectedOfferPath();
					var oOffer = Services.getDefaultModel().getProperty(sSelectedOfferPath);
					
					//check offer has been selected
					if(!oOffer){
						
						sap.m.MessageBox.warning("No offer selected for setting the delay in submission flag", {});
						
						oDeferred.reject();
						return;
						
					}
					
					//array for the change operations
					var aChangeOperations = [];
					
					//Key's
					var sOfferID	= oOffer.OfferID;
					var sActive		= 1;
					if (sOfferDate){
						sOfferDate	= moment(sOfferDate, "DD.MM.YYYY").utc().toDate(); //Hours should be 00 beceause we don't keep it in front-end, otherwise we will always create a new date
					}else{
						//if offer date does not exist, we take the date of today
						sOfferDate	= moment().utc().toDate(); //Hours should be 00 beceause we don't keep it in front-end, otherwise we will always create a new date
					}

					//only delay in submission need to be changed
					var oQuotationSaveInfo = {};
					oQuotationSaveInfo.DelayInSubmission = bDelayInSubmission;
					oQuotationSaveInfo.OfferID = sOfferID;
					oQuotationSaveInfo.Active = sActive;
					oQuotationSaveInfo.OfferDate = sOfferDate;
					
					var oQuotationToSave = Services.getService('Quotation').getConvertQuotationToSave(oQuotationSaveInfo);
					
					//path
					/*var sPath = "PT_TMQUTO(OfferID='" + sOfferID +"',Active=" + sActive + ",OfferDate=datetime'" + sOfferDate + "')";//using view to always have data*/
					
					
					//data to save
					var oQuotation = {};
					oQuotation.DelayInSubmission = bDelayInSubmission;
					
					promises.push(Services.getService('Quotation').updateQuotation(oQuotationToSave).catch(function(oError){
						Services.showErrorMessage(oError, "Saving delay in submission");
						throw new Error(oError);
					}));
					
					Promise.all(promises).then((result) =>{
						sap.m.MessageBox.success("Delay in submission is succesfully changed..", {});
						//let the callback be triggered
						oDeferred.resolve(true);
					}).catch(function(oError){
						//let the callback be triggered
						oDeferred.reject(oError);
					});
							
					/*//Keep the change opperations: Update (PUT) 
					aChangeOperations.push(oModel.createBatchOperation(sPath, "MERGE", oQuotation, null));
						
					//add update/create as a BATCH operation on the model
					oModel.addBatchChangeOperations(aChangeOperations);
								
					oModel.submitBatch(function(oData, oResponse, oError) {
									
							if (oError.length > 0) {
								
								//Error during save
								that.showErrorMessage(oError, "Saving delay in submission");
								
								//let the callback be triggered
								oDeferred.reject(oError);
								
							} else { //no success message needed here
								
								//success message
								sap.m.MessageBox.success("Delay in submission is succesfully changed..", {});
								
								//let the callback be triggered
								oDeferred.resolve(oData);
								
							}
							
					});*/
					
					//return promise so the function can check if execution is done
					return oDeferred.promise();	
				},
				
				saveQuotation: function(quotationFields, updatedFlag) {

					//lets work with callbacks
					var oDeferred = $.Deferred();
					var that = this;
					
					//catch all promises in an array
					let promises = [];
					
					// instantiate loading dialog
					if (!that._LoadingDialogQuotation) {
						that._LoadingDialogQuotation = sap.ui.xmlfragment("FAST_NS0FAST0.fragments.Loading", that);
					}
		
					// open loading dialog
					that._LoadingDialogQuotation.open();
					
					//get model for calls
					var oModel = Services.getDefaultModel();
					
					//get selected offer
					var sSelectedOfferPath = Services.getSelectedOfferPath();
					var oOffer = Services.getDefaultModel().getProperty(sSelectedOfferPath);
					
					//check offer has been selected
					if(!oOffer || !quotationFields.OfferDate){
						sap.m.MessageBox.warning("Nothing to save. Please select offer (where price of product is set) to save.", {});
						//close loading dialog
						if(that._LoadingDialogQuotation){
							that._LoadingDialogQuotation.close();
						}
						oDeferred.reject();
						return;
					}

					//check the offer status
					$.when(Services.checkOfferStatus()).done(function(oData){

						//re-saving should be prevented when status is "Quotation Submitted" and beyond
						var aStatusNoReSubmitting = [
							"Quotation Submitted",
							"Results Recorded",
							"Delivery Ongoing"
						];
						
						//check if status is allowing delete,
						if($.inArray( oData.STATUS, aStatusNoReSubmitting ) !== -1){
							sap.m.MessageBox.warning("We can not re-save the offer, status of offer does not allow.", {});
							//close loading dialog
							if(that._LoadingDialogQuotation){
								that._LoadingDialogQuotation.close();
							}
							oDeferred.reject();
							return;
						}
						
						//get save info for quotation to be saved
						var oQuotationSaveInfo = that.getQuotationSaveInfo();
						oQuotationSaveInfo.OfferDate = quotationFields.OfferDate;
						oQuotationSaveInfo.OfferValidity = quotationFields.OfferValidity;
						oQuotationSaveInfo.Comment = quotationFields.CustomRemark;
						oQuotationSaveInfo.AS1 = quotationFields.IssuedBy;
						oQuotationSaveInfo.AS2 = quotationFields.CompanyStamp;
						oQuotationSaveInfo.UPDATED = updatedFlag;
						
						//array for the change operations
						var aChangeOperations = [];
						
						//table where the status of the offer is kept
						var sPath = ""; 
						
						var oQuotationToSave = Services.getService('Quotation').getConvertQuotationToSave(oQuotationSaveInfo);
						
						//check if there needs to be an update (already existing and erpost)
						$.when(that.loadQuotationForSelectedOffer(quotationFields.OfferDate)).done(function(oData){
							
							
							if(oData.sResult === 'nothingfound'){
								
								//create path
								//sPath = "/PT_TMQUTO";
								
								//Keep the change opperations: Create (POST) 
								//aChangeOperations.push(oModel.createBatchOperation(sPath, "POST", oQuotationSaveInfo, null));				
								
								promises.push(Services.getService('Quotation').createQuotation(oQuotationToSave).catch(function(oError){
									Services.showErrorMessage(oError, "Create Quotation");
									throw new Error(oError);
								}));
								
								
							}else{
															
								//update path
								sPath = oData.sQuotationPath; 
								
								//Keep the change opperations: Update (PUT) 
								//aChangeOperations.push(oModel.createBatchOperation(sPath, "PUT", oQuotationSaveInfo, null));		
								promises.push(Services.getService('Quotation').updateQuotation(oQuotationToSave).catch(function(oError){
									Services.showErrorMessage(oError, "Update Quotation");
									throw new Error(oError);
								}));
							}
	
							Promise.all(promises).then((result) =>{
									sap.m.MessageBox.success("Quotation succesfully saved..", {});
	
									//update the status of the offer accordingly
									$.when(Services.saveOfferStatus("Offer Created")).done(function(oSaveStatus){
										
										//new offer status needs to be shown
										Services.getDefaultModel().refresh(true);
											
										//let the callback be triggered
										oDeferred.resolve(true);
										
									});
								
								//close loading dialog
								if(that._LoadingDialogQuotation){
									that._LoadingDialogQuotation.close();
								}
							}).catch(function(oError){
								//close loading dialog
								if(that._LoadingDialogQuotation){
									that._LoadingDialogQuotation.close();
								}
									
								//let the callback be triggered
								oDeferred.reject(oError);
							});
	
							/*//add update/create as a BATCH operation on the model
							oModel.addBatchChangeOperations(aChangeOperations);
										
							oModel.submitBatch(function(oData, oResponse, oError) {
										
								if (oError.length > 0) {
									
									//Error during save
									var oXML = jQuery.parseXML(oError[0].response.body);
									var oXMLmsg = oXML.querySelector("message");
									var msg = oXMLmsg.textContent;
									sap.m.MessageBox.show(msg, {
										title: "Error",
										icon: sap.m.MessageBox.Icon.ERROR,
										onClose: function() {}
									});
									
									//set send dropbox back to NO
									
									//close loading dialog
									if(that._LoadingDialogQuotation){
										that._LoadingDialogQuotation.close();
									}
									
									//let the callback be triggered
									oDeferred.reject(oError);
									
								} else { 
									
									sap.m.MessageBox.success("Quotation succesfully saved..", {});

									//update the status of the offer accordingly
									$.when(Services.saveOfferStatus("Offer Created")).done(function(oSaveStatus){
										
										//new offer status needs to be shown
										Services.getDefaultModel().refresh(true);
										
										//let the callback be triggered
										oDeferred.resolve(true);
										
									});
								
									//close loading dialog
									if(that._LoadingDialogQuotation){
										that._LoadingDialogQuotation.close();
									}
									
								}
							});	*/
						
						});
						
					});

					//return promise so the function can check if execution is done
					return oDeferred.promise();
					
				},
				
				createWordQuotation: function(aOffer, aProducts) {
					this._oFastDataCalls.read('/TEMPLATE', {
						success: function (oData, oResponse) {
							var content = atob(oData.results[0].FILE);
							// var reader = new FileReader();
							// var blob = new Blob([content], {
							// 	type: "text/plain"
							// });
							// reader.readAsArrayBuffer(blob);
							var zip = new PizZip(content);
							var doc = new Docxtemplater();
							doc.loadZip(zip);
							var items = [];
							var i = 0;
							var totalAmount = 0;
							aProducts.results.forEach(function(p){
								i = i + 1;
								var foc = (p.Price.FOC_ABS_PCT === 'PCT')
								? p.Price.FOC * p.RequestedVolume
								: p.Price.FOC;
								var volume = (p.Price.FOCType === 'FOC 2')
								? p.RequestedVolume + foc
								: p.RequestedVolume;
								items.push({
									Item_No: i,
									Item_Code: p.Reference,
									Item_Description: p.SKU.PRODUCTPACKNAME,
									Item_Manufacturer: p.SKUCountry.MANUFACTURER,
									Item_Origin: p.SKUCountry.COUNTRYOFORIGIN,
									Item_Shelf: p.SKUCountry.SHELFLIFE,
									Item_Factor: p.SKU.PACKFACTOR,
									Item_Presentation: p.SKU.PRESENTATION,
									Item_Quantity: Formatter.price(volume) + ' ' + p.UnitPerPack,
									Item_UnitPrice: (p.UnitPerPack === "Unit") ? Formatter.price(p.Price.NetPrice, aOffer.Currency) : Formatter.price(p.Price.NetPrice / p.SKU.PACKFACTOR, aOffer.Currency),
									Item_PackPrice: (p.UnitPerPack !== "Unit") ? Formatter.price(p.Price.NetPrice, aOffer.Currency) : Formatter.price(p.Price.NetPrice * p.SKU.PACKFACTOR, aOffer.Currency),
									//Item_FOC: Formatter.price(foc),
									Item_Price: Formatter.price(p.Price.NetPrice * volume, aOffer.Currency),
								});
								totalAmount = totalAmount + p.Price.NetPrice * volume;
							});
							doc.setData({
								DistributorName: aOffer.Distributor ? aOffer.Distributor.DistributorName : "NA",
								DistributorAddress: aOffer.Distributor ? aOffer.Distributor.Address : "NA",
								DistributorPhone: aOffer.Distributor ? aOffer.Distributor.ContactNo : "NA",
								DistributorFax: aOffer.Distributor ? aOffer.Distributor.Fax : "NA",
								DistributorContact: aOffer.Distributor ? aOffer.Distributor.ContactPerson : "NA",
								OfferId: aOffer.OfferID,
								TenderId: aOffer.TenderID,
								OfferDate: Formatter2.bdate(aOffer.CreationDate),//TODO: set correct date
								OfferValidity: Formatter2.bdate(aOffer.CreationDate),//TODO: set correct date
								SellingCompany: aOffer.SellingCompanyDetails ? aOffer.SellingCompanyDetails.LegalEntityName : "NA",
								SellingCompanyBank: aOffer.SellingCompanyDetails ? aOffer.SellingCompanyDetails.BankDetails : "NA",
								Remarks: aOffer.SellingCompanyDetails ? aOffer.SellingCompanyDetails.Remarks : "NA",
								Approver1: aOffer.SellingCompanyDetails ? aOffer.SellingCompanyDetails.AuthorizedSignatory1 : "NA",
								Approver2: aOffer.SellingCompanyDetails ? aOffer.SellingCompanyDetails.AuthorizedSignatory2 : "NA",
								ShipmentTerms: aProducts.results[0].FirstShipment,
								PaymentTerms: aProducts.results[0].PaymentTerms,
								DeliveryTerms: aProducts.results[0].INCOTerms,
								Items: items,
								TotalAmount: Formatter.price(totalAmount, aOffer.Currency)
							});
							try {
								doc.render();
							} catch (error) {
								var e = {
									message: error.message,
									name: error.name,
									stack: error.stack,
									properties: error.properties,
								};
								console.log(JSON.stringify({
									error: e
								}));
								throw error;
							}
							var buf = doc.getZip().generate({type: 'nodebuffer'});
							File.save(buf, aOffer.OfferID, "docx", "application/octet-stream", "utf-8");
						},
						error: function fnError(response) {
							var a = 1;
						}
					});
				}
	});
	return new Quotation();
});