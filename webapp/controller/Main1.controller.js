sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessagePopover",
    "sap/m/MessagePopoverItem",
    "sap/ui/core/message/Message"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, MessagePopover, MessagePopoverItem, Message) {
        "use strict";
        var gPlant;
        var oController;
        var lang;
        var caller = new FunctionModuleCaller('/sap/zrest/');
        return Controller.extend("rest1.controller.Main1", {
            onInit: function () {
                oController = this;
                jQuery.sap.registerModulePath('easyfunctionmodules', './utils/');
                jQuery.sap.require('easyfunctionmodules.FunctionModuleCaller');

                // sap.ushell.Container.getService("UserInfo").getLanguage()
                // sap.ui.getCore().getConfiguration().getLanguage();

                //Get Plant From User Parameter
                var obj = { USERNAME: 'PONNAMX' };
                var that = this;
                caller.call('BAPI_USER_GET_DETAIL', obj,
                    function (oData) {
                        var data = oData.PARAMETER;
                        var Plant = data.find((item) => item.PARID === "WRK");
                        gPlant = Plant?.PARVA;
                        // gPlant = "1400";
                        // const parva = "1400";// data.find((item)=>item.PARID === "WRK");
                        that.getView().byId("iPlant").setValue(gPlant);//parva?.PARVA);
                        that.getView().byId("iPlant").setEnabled(false);

                    });

                // create a message manager and register the message model
                this._oMessageManager = sap.ui.getCore().getMessageManager();
                this._oMessageManager.registerObject(this.getView(), true);
                that.getView().setModel(this._oMessageManager.getMessageModel(), "message");


                this.oMessageTemplate = new MessagePopoverItem({
                    type: "{message>type}",
                    title: "{message>message}",
                    subtitle: "{message>additionalText}",
                    description: "{message>description}"
                });

                this._oMessagePopover = new MessagePopover({
                    items: {
                        path: "message>/",
                        template: this.oMessageTemplate
                    }
                });
                // this.byId("logs").addDependent(this._oMessagePopover);
            },

            onChange: function (oEvent) {
                oController.setState();
                var iTab1 = this.getView().byId("iTab");
                iTab1.setVisible(false);

                if (oEvent) {
                    var oInput = oEvent.getSource();
                    var oValue = oInput.getValue();
                }
                if (!oValue) {
                    oValue = oController.byId("iMatnr").getValue();
                }
                if (oValue) {

                    // Get Material Description
                    var input = { MATERIAL: oValue, PLANT: gPlant };
                    caller.call('BAPI_MATERIAL_GET_ALL', input,
                        function (oData) {
                            var ex = oData.RETURN.find((item) => item.TYPE === "E");
                            if (!ex) {

                                var maktg = oData.MATERIALDESCRIPTION.find((item) => item.LANGU === "E");
                                if (maktg) {
                                    oController.byId("Mat_desc").setText(maktg.MATL_DESC);
                                    if (oData.UNITSOFMEASURE) {

                                        oController.byId("iUom").setValue(oData.UNITSOFMEASURE[0].ALT_UNIT);
                                        oController.byId("iUom").setEnabled(false)
                                    }
                                } else {
                                    oInput.setValueState(sap.ui.core.ValueState.Error);
                                    oInput.setValueStateText(ex.MESSAGE);
                                    oController.byId("Mat_desc").setText(null);
                                }
                            }
                            else {
                                oController.byId("Mat_desc").setText(null);
                                var aMockMessages = {};
                                if (ex.TYPE === 'E') {

                                    aMockMessages.type = 'Error';
                                    aMockMessages.message = 'Error1';
                                    aMockMessages.additionalText = 'AT';
                                    aMockMessages.description = ex.MESSAGE;
                                }
                                // var oModel = new sap.ui.model.json.JSONModel();
                                // oModel.setData(aMockMessages);
                                // oController.getView().setModel(oModel, "message");
                                // oController.byId("logs").addDependent(oController._oMessagePopover);

                                oController._oMessageManager.addMessages(
                                    new Message({
                                        message: "A mandatory field is required",
                                        type: "Error",
                                        additionalText: "AT",
                                        description: ex.MESSAGE,
                                        // target: sTarget,
                                        processor: oController.getView().getModel('message')
                                    })
                                );
                            }
                        }
                    );

                    //Get Plant From User Parameter                                    
                    var obj = { MATNR: oValue, WERKS: gPlant };
                    caller.call('MARD_GENERIC_READ_MATNR_PLANT', obj,
                        function (oData) {

                            var oJSONModel = new sap.ui.model.json.JSONModel(oData.MARD_TAB);

                            function delete_row(given_value) {
                                // var table_row = oData.MARD_TAB.filter((item) => item.PSTAT === given_value);

                                for (let index = 0; index < oData.MARD_TAB.length; index++) {
                                    if (oData.MARD_TAB[index].PSTAT === given_value) {
                                        // Removing the row from table
                                        oData.MARD_TAB.splice(index, 1);
                                    }

                                }

                            }
                            delete_row("L");

                            oController.getView().setModel(oJSONModel, "Results");
                            var iTab = oController.byId("iTab");
                            iTab.setVisible(true);
                        });
                    //}
                    // } 
                    // else {
                    //     oInput.setValueState(sap.ui.core.ValueState.Error);
                    //     oInput.setValueStateText(ex.MESSAGE);
                    //     oController.byId("Mat_desc").setText(null);
                    // }
                    //},
                    //);
                }
            },
            onSelect: function (oEvent) {

                var oItem = oEvent.getSource().getBindingContext("Results").getObject();
                var Fsloc = this.getView().byId("iFromSloc").getValue();
                var Tsloc = this.getView().byId("iToSloc").getValue();
                if (!Fsloc) {
                    this.getView().byId("iFromSloc").setValue(oItem.LGORT);
                    this.getView().byId("iToSloc").focus();
                }
                else if (!Tsloc) {
                    this.getView().byId("iToSloc").setValue(oItem.LGORT);
                    this.getView().byId("iQuant").focus();
                }

            },
            onPost: function (oEvent) {

                var oEntry = {};
                oEntry.Plant = this.getView().byId("iPlant").getValue();
                oEntry.Material = this.getView().byId("iMatnr").getValue();
                oEntry.StgeLoc = this.getView().byId("iFromSloc").getValue();
                oEntry.EntryQnt = this.getView().byId("iQuant").getValue();
                oEntry.EntryUom = this.getView().byId("iUom").getValue();
                oEntry.MoveStloc = this.getView().byId("iToSloc").getValue();

                this.onValidate(oEntry);       // Validate fields 

                if (oEntry) {

                    var todaysDate = new Date();

                    function convertDate(date) {
                        var yyyy = date.getFullYear().toString();
                        var mm = (date.getMonth() + 1).toString();
                        var dd = date.getDate().toString();

                        var mmChars = mm.split('');
                        var ddChars = dd.split('');
                        var mon = (mmChars[1] ? mm : "0" + mmChars[0]);
                        var day = (ddChars[1] ? dd : "0" + ddChars[0]);
                        let result = yyyy.concat(mon, day);
                        return result;
                    }

                    todaysDate = convertDate(todaysDate);

                    var otab = {
                        "GOODSMVT_HEADER": { "PSTNG_DATE": todaysDate },
                        "GOODSMVT_CODE": { "GM_CODE": "04" },
                        "GOODSMVT_ITEM": [{
                            "MOVE_TYPE": "311", "PLANT": oEntry.Plant, "MATERIAL": oEntry.Material,
                            "STGE_LOC": oEntry.StgeLoc, "ENTRY_QNT": oEntry.EntryQnt, "Entry_UOM": oEntry.EntryUom,
                            "MOVE_STLOC": oEntry.MoveStloc
                        }]
                    };

                    //Goods Posting
                    caller.call('BAPI_GOODSMVT_CREATE', otab,
                        function (oData) {
                            var data = oData.MATERIALDOCUMENT;
                            var mov = "Movement ";
                            let result = mov.concat(data," posted.");
                            MessageToast.show(result, {
                                duration: 5000
                            });
                            oController.onClear();
                            if (oData.RETURN) {
                                var Return = oData.RETURN;
                                var oError = Return.find((item) => item.TYPE === "E");
                                if (oError.MESSAGE) {
                                    MessageToast.show(oError.MESSAGE, {
                                        duration: 4000
                                    });
                                }

                            }
                        }
                    );
                }
            },
            onValidate: function (oEntry) {
                var oInput1 = this.getView().byId(this.getView().createId("iMatnr"));
                if (!oEntry.Material) {
                    oInput1.setValueState(sap.ui.core.ValueState.Error);
                    oInput1.setValueStateText("Material field cannot be empty.");
                }
                var oInput3 = this.getView().byId(this.getView().createId("iFromSloc"));
                if (!oEntry.StgeLoc) {
                    oInput3.setValueState(sap.ui.core.ValueState.Error);
                    oInput3.setValueStateText("From storage location field cannot be empty.");
                }
                var oInput4 = this.getView().byId(this.getView().createId("iQuant"));
                if (!oEntry.EntryQnt) {
                    oInput4.setValueState(sap.ui.core.ValueState.Error);
                    oInput4.setValueStateText("Quantity field cannot be empty.");
                }
                var oInput5 = this.getView().byId(this.getView().createId("iUom"));
                if (!oEntry.EntryUom) {
                    oInput5.setValueState(sap.ui.core.ValueState.Error);
                    oInput5.setValueStateText("Unit field cannot be empty.");
                }
                var oInput6 = this.getView().byId(this.getView().createId("iToSloc"));
                if (!oEntry.MoveStloc) {
                    oInput6.setValueState(sap.ui.core.ValueState.Error);
                    oInput6.setValueStateText("To Storage location field cannot be empty.");
                }
            },
            onClear: function () {
                this.getView().byId("iMatnr").setValue(null);
                this.getView().byId("iFromSloc").setValue(null);
                this.getView().byId("iToSloc").setValue(null);
                this.getView().byId("iQuant").setValue(null);
                this.getView().byId("iUom").setValue(null);
                this.getView().byId("Mat_desc").setText(null);
                this.getView().byId("success").setText(null);
                var oModel = this.getView().getModel("Results");
                if (oModel) {
                    oModel.setData(null);
                }
                var colList = this.getView().byId("colList");
                colList.unbindCells();

                var iTab = this.getView().byId("iTab");
                iTab.setVisible(false);

                var messageProc = sap.ui.getCore().getMessageManager();
                messageProc.removeAllMessages();

                var oModel1 = this.getView();
                oModel1.getModel("message").setData(null);
                this.getView().byId("logs").setVisible(false);
                this.setState();
            },
            setState: function () {
                var oInput1 = this.getView().byId(this.getView().createId("iMatnr"));
                oInput1.setValueState(sap.ui.core.ValueState.None);
                var oInput2 = this.getView().byId(this.getView().createId("iFromSloc"));
                oInput2.setValueState(sap.ui.core.ValueState.None);
                var oInput3 = this.getView().byId(this.getView().createId("iToSloc"));
                oInput3.setValueState(sap.ui.core.ValueState.None);
                var oInput4 = this.getView().byId(this.getView().createId("iQuant"));
                oInput4.setValueState(sap.ui.core.ValueState.None);
                var oInput5 = this.getView().byId(this.getView().createId("iUom"));
                oInput5.setValueState(sap.ui.core.ValueState.None);
            },

            onMessagePopoverPress: function (oEvent) {
                this._getMessagePopover().openBy(oEvent.getSource());
                var oText = this.getView().byId("success").setVisible(false);
            },
            _getMessagePopover: function () {
                // create popover lazily (singleton)
                if (!this._oMessagePopover) {
                    this._oMessagePopover = sap.ui.xmlfragment("rest1.view.MessagePopover", this);
                    this.getView().addDependent(this._oMessagePopover);
                }
                return this._oMessagePopover;
            }

        });
    });

