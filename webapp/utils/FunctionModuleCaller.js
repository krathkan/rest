jQuery.sap.declare("FunctionModuleCaller");

sap.ui.base.Object.extend("FunctionModuleCaller", {

    constructor: function (sBackendUrl) {
        this._sBackendUrl = sBackendUrl;
        this._functionModuleMocker = null;
        this._mockedFunctions = new Array();
    },

    call: function (sFunctionModuleName, oInputData, fSuccess, fError) {
        //Are we mocking this backend function?
        if (this._functionModuleMocker && this._mockedFunctions[sFunctionModuleName]) {
            this._functionModuleMocker.call(sFunctionModuleName, oInputData,
                fSuccess, fError);
            return;
        }
        var url = this._sBackendUrl + sFunctionModuleName;
        
        var data = JSON.stringify(oInputData);
        // var USERNAME ="RATHKKS";
        // var PASSWORD = "Krun@123";
        // var username = $("input#username").val();
        // var password = $("input#password").val();  
        
        // function make_base_auth(user, password) {
        //   var tok = user + ':' + password;
        //   var hash = btoa(tok);
        //   return "Basic " + hash;
        // }
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            success: fSuccess,
            dataType: 'json',
            headers: { 
                // "~path_info" : sFunctionModuleName,
                "Access-Control-Allow-Origin": "*",
                // "Authorization": "Basic " + btoa(USERNAME + ":" + PASSWORD)
            },
            // beforeSend: function (xhr){ 
            //     xhr.setRequestHeader('Authorization', make_base_auth(username, password)); 
            // },
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            contentType: "application/json",
            processData: false,
            error: fError
        });
    },

	/**
	 * Allows you to set an object that will intercept function module calls.
	 * oMocker is any object with a "call" method. 
	 * If you set a mocker and then tell to mock function X,
	 * any call to function module X will be intercepted by the mocker, 
	 * calls to other function modules happen normally. 
	 * You can mock as many or as little functions you want.
	 */
    setFunctionModuleMocker: function (oMocker) {
        this._functionModuleMocker = oMocker;
    },

	/*
	 * Start mocking function with name sFmName
	 * */
    mockFunction: function (sFmName) {
        this._mockedFunctions[sFmName] = true;
    }
});