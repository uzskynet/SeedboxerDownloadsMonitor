$(document).ready(function(){
	registerAllEvents();
	loadAllSettings();
	if(localStorage["mode"] == null){
		(localStorage["mode"] = "basic")
	}
	;
});

function loadAllSettings() {
	$(".persistent-input").each(function(){
		getSetting($(this).attr("id"));
	});
	if(localStorage["mode"] == "basic")
		$("#toggle-mode").html("Advanced Mode");
	else if(localStorage["mode"] == "advanced")
		$("#toggle-mode").html("Basic Mode");
	$("#toggle-mode").click(toggleMode);
}


function setSetting(e, val) {
	localStorage[e.id] = (val == undefined)?"":val;
}

function getSetting(id) {
	document.getElementById(id).value = (localStorage[id]==undefined)?"":localStorage[id];
}


function registerAllEvents() {
	document.querySelector("#host").onkeyup = function() {
		setSetting(this, this.value);
	};
	
	document.querySelector("#port").onkeyup = function() {
		setSetting(this, this.value);
	};
	
	document.querySelector("#login").onkeyup = function() {
		setSetting(this, this.value);
	};
	
	document.querySelector("#password").onkeyup = function() {
		setSetting(this, this.value);
		retrieveApikey();
	};

}

function retrieveApikey(){
	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/user/apikey";
	$.ajax({
		url : url,
		dataType : "json",
		beforeSend: function (xhr){ 
			xhr.setRequestHeader('Authorization', make_base_auth(localStorage["login"], localStorage["password"])); 
		},
		success : function(data, code, xhr){
			localStorage["apikey"] = data.apiKey != undefined ? data.apiKey : "" ;
			$("#apikey").val(data.apiKey);
			/*
			$.ajax({
					url : url,
					dataType : "json",
					beforeSend: function (xhr){ 
						xhr.setRequestHeader('Authorization', ""); 
					},
			});
			*/
		},
		error : function(){
			localStorage["apikey"] = "";
			$("#apikey").val("");
		}
	});

}

function make_base_auth(user, password) {
  var tok = user + ':' + password;
  var hash = btoa(tok);
  return "Basic " + hash;
}

function toggleMode(){
	if(localStorage["mode"] == "advanced"){
		localStorage["mode"] = "basic";
		$("#toggle-mode").html("Advanced Mode");
	}
	else if(localStorage["mode"] == "basic"){
		localStorage["mode"] = "advanced";
		$("#toggle-mode").html("Basic Mode");
	}
}