sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zescmatrizcost/utils/formatter",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "zescmatrizcost/utils/service",
    "sap/m/MessageBox",
    "zescmatrizcost/utils/errorHandler",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,formatter,Fragment,JSONModel,service,MessageBox,errorHandler,Filter,FilterOperator) {
        "use strict";

        return Controller.extend("zescmatrizcost.controller.View1", {
            formatter: formatter,
            onInit: function () {
                this.initFilterModel();
                this.initRoleValueHelpModels();
            },
            initRoleValueHelpModel: function(path,name){
                service.get(path).then(
                    function(oData) {
                         this.setJSONModel(oData, name);
                    }.bind(this)).then(undefined,
                    function(oError) {
                        this.showErrorMessage(oError);
                    }.bind(this));
            },
            initRoleValueHelpModels: function(){
                this.initRoleValueHelpModel("/Z_I_POARole","RoleValueHelpModel");
                this.initRoleValueHelpModel("/ESIPROJECTVH","ProjectValueHelpModel");
                this.initRoleValueHelpModel("/ZBudgetPackVH","BudgetPackValueHelpModel");
                this.initRoleValueHelpModel("/ZIFI_ESIFIPROJECT_CODE","ESIValueHelpModel");
            },
            setJSONModel: function (oData, sName) {
                var oModel = new JSONModel();
                oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                oModel.setData(oData);
                return this.getView().setModel(oModel, sName);
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
            initFilterModel:function(){
                var filter={
                    costObjectType:"",
                    costObject:"",
                    project:[],
                    budgetPack:[],
                    esiCode:[],
                    costController:[],
                    role:[],
                    authType:[]
                };
                var oModel = new JSONModel();
                oModel.setData(filter);
                oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                this.getView().setModel(oModel, "filterModel");
                
            },
            setColomnsModel:function(label1,template1,label2,template2){
                var oColumns={
                   "cols": [
                       {
                           "label": label1,
                           "template": template1,
                           "width": "15rem"
                       
                       },
                       {
                           "label": label2,
                           "template": template2
                       }
                   ]
               };
               this.ColumnModel = new JSONModel(oColumns);
               },
            onPressChange:function(){
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteChangeView");
            },
            onRoleValueHelpRequest: function() {
                this.setColomnsModel("Role","Role","Role Description","RoleDescription");
                var aCols = this.ColumnModel.getData().cols,
                 oModel=this.getView().getModel("RoleValueHelpModel"),
                 oMultiInput=this.getView().byId("roleInput");
        
                Fragment.load({
                    name: "zescmatrizcost.view.Dialogs.Roles",
                    controller:this
                }).then(function(oValueHelpDialog) {
                    this._RoleValueHelpDialog = oValueHelpDialog;
                    this.getView().addDependent(this._RoleValueHelpDialog);
        
                    this._RoleValueHelpDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(oModel);
                        oTable.setModel(this.ColumnModel, "columns");
        
                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", "/results");
                        }
        
                        if (oTable.bindItems) {
                            oTable.bindAggregation("items", "/results", function () {
                                return new ColumnListItem({
                                    cells: aCols.map(function (column) {
                                        return new Label({ text: "{" + column.template + "}" });
                                    })
                                });
                            });
                        }
                        this._RoleValueHelpDialog.update();
                    }.bind(this));
        
                    this._RoleValueHelpDialog.setTokens(oMultiInput.getTokens());
                    this._RoleValueHelpDialog.open();
                }.bind(this));
            },
            onRoleValueHelpOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                var oModel= this.getView().getModel("filterModel"),
                oData= oModel.getData();
                oData.role=[];
                oData.role= aTokens.map(function(oToken){
                    return {key:oToken.getKey(),text:oToken.getText()};

                });
                oModel.setData(oData);
                this._RoleValueHelpDialog.close();
            },
            onRoleValueHelpCancelPress: function () {
                this._RoleValueHelpDialog.close();
            },
        
            onRoleValueHelpAfterClose: function () {
                this._RoleValueHelpDialog.destroy();
            },
            onProjectValueHelpRequest: function() {
                var oModel=this.getView().getModel("ProjectValueHelpModel"),
                oMultiInput = this.getView().byId("projectInput");
                
                Fragment.load({
                    name: "zescmatrizcost.view.Dialogs.Projects",
                    controller:this
                }).then(function(oValueHelpDialog) {
                    this._ProjectValueHelpDialog = oValueHelpDialog;
                    this.getView().addDependent(this._ProjectValueHelpDialog);
                    this._ProjectValueHelpDialog.setModel(oModel);
                    this._ProjectValueHelpDialog.open();    
                    
                }.bind(this));
            },
            onProjectSearch:function(oEvent){
                var sValue = oEvent.getParameter("value");
                var oFilter = new Filter("ESIProject", FilterOperator.Contains, sValue);
                var oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter([oFilter]);

            },
            onProjectValueHelpDialogClose:function(oEvent){
                var oModel= this.getView().getModel("ProjectValueHelpModel"),
                 aSelectedContexts = oEvent.getParameter("selectedContexts"),
                 aSelectedItems=  aSelectedContexts.map(function (oContext) { return  oModel.getProperty(oContext.getPath()).ESIProject });
                var oFilterModel= this.getView().getModel("filterModel"),
                oData= oFilterModel.getData();
                oData.project=[];

			if (aSelectedItems && aSelectedItems.length > 0) {
                oData.project= aSelectedItems.map(function(oItem){
                    return {key:oItem};

                });
                oFilterModel.setData(oData);
				
			}
            },
            onBudgetPackValueHelpRequest: function() {
                this.setColomnsModel("Budget Pack","name","Project","prjct");
                var aCols = this.ColumnModel.getData().cols,
                 oModel=this.getView().getModel("BudgetPackValueHelpModel"),
                 oMultiInput=this.getView().byId("budgetPackInput");
        
                Fragment.load({
                    name: "zescmatrizcost.view.Dialogs.BudgetPack",
                    controller:this
                }).then(function(oValueHelpDialog) {
                    this._BudgetPackValueHelpDialog = oValueHelpDialog;
                    this.getView().addDependent(this._BudgetPackValueHelpDialog);
        
                    this._BudgetPackValueHelpDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(oModel);
                        oTable.setModel(this.ColumnModel, "columns");
        
                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", "/results");
                        }
        
                        if (oTable.bindItems) {
                            oTable.bindAggregation("items", "/results", function () {
                                return new ColumnListItem({
                                    cells: aCols.map(function (column) {
                                        return new Label({ text: "{" + column.template + "}" });
                                    })
                                });
                            });
                        }
                        this._BudgetPackValueHelpDialog.update();
                    }.bind(this));
        
                    this._BudgetPackValueHelpDialog.setTokens(oMultiInput.getTokens());
                    this._BudgetPackValueHelpDialog.open();
                }.bind(this));
            },
            onBudgetPackValueHelpOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                var oModel= this.getView().getModel("filterModel"),
                oData= oModel.getData();
                oData.budgetPack=[];
                oData.budgetPack= aTokens.map(function(oToken){
                    return {key:oToken.getKey(),text:oToken.getText()};

                });
                oModel.setData(oData);
                this._BudgetPackValueHelpDialog.close();
            },
            onBudgetPackValueHelpCancelPress: function () {
                this._BudgetPackValueHelpDialog.close();
            },
        
            onBudgetPackValueHelpafterClose: function () {
                this._BudgetPackValueHelpDialog.destroy();
            },
            onESIValueHelpRequest: function() {
                var oModel=this.getView().getModel("ESIValueHelpModel");
                Fragment.load({
                    name: "zescmatrizcost.view.Dialogs.ESI",
                    controller:this
                }).then(function(oValueHelpDialog) {
                    this._ESIValueHelpDialog = oValueHelpDialog;
                    this.getView().addDependent(this._ESIValueHelpDialog);
                    this._ESIValueHelpDialog.setModel(oModel);
                    this._ESIValueHelpDialog.open();    
                    
                }.bind(this));
                
            },
            onESISearch:function(oEvent){
                var sValue = oEvent.getParameter("value");
                var oFilter = new Filter("zzesipro", FilterOperator.Contains, sValue);
                var oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter([oFilter]);

            },
            onESIValueHelpDialogClose:function(oEvent){
                var oModel= this.getView().getModel("ESIValueHelpModel"),
                 aSelectedContexts = oEvent.getParameter("selectedContexts"),
                 aSelectedItems=  aSelectedContexts.map(function (oContext) { return  oModel.getProperty(oContext.getPath()).zzesipro });
                var oFilterModel= this.getView().getModel("filterModel"),
                oData= oFilterModel.getData();
                oData.esiCode=[];

			if (aSelectedItems && aSelectedItems.length > 0) {
                oData.esiCode= aSelectedItems.map(function(oItem){
                    return {key:oItem};

                });
                oFilterModel.setData(oData);
				
			}
            }
            

            
        });
    });
