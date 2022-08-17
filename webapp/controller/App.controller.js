sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zescmatrizcost/utils/service",
    "zescmatrizcost/utils/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "zescmatrizcost/utils/errorHandler",
    
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,service,formatter,JSONModel,MessageBox,errorHandler) {
        "use strict";

        return Controller.extend("zescmatrizcost.controller.App", {
            formatter: formatter, 
            onInit: function () {
                this.getTableData();
                 
            },
            getRouter : function () {
                return UIComponent.getRouterFor(this);
            },
            getTableData:function(){
                service.get("/POAAuthEscMatrixCostSet").then(
                    function(oData) {
                         this.setJSONModel(oData, "mainModel");
                    }.bind(this)).then(undefined,
                    function(oError) {
            
                        this.showErrorMessage(oError);
                     
                    }.bind(this));	

            },
            setJSONModel: function (oData, sName) {
                var oModel = new JSONModel();
                oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                oModel.setData(oData);
                return this.getOwnerComponent().setModel(oModel, sName);
            },
            showErrorMessage: function(oError) {
                var errorDetails = errorHandler.parseError(oError);
                
                MessageBox.error(errorDetails.message, {
                    icon:		MessageBox.Icon.ERROR,
                     title:		this.geti18nString("error"),
                    details:	errorDetails.details,
                    actions:	MessageBox.Action.CLOSE
                });
            },
            geti18nString: function(sKey, aArgs) {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey, aArgs);
            },
            
        });
    });