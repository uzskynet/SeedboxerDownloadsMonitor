$(document).ready(function(){
	registerAllEvents();

	loadAllSettings();
});

function loadAllSettings() {
	var e = document.getElementsByTagName("input");
	for (key in e) {
		getSetting(e[key]);
	}
}


function setSetting(e, val) {
	localStorage[e.id] = (val == undefined)?"":val;
}

function getSetting(e) {
	document.getElementById(e.id).value = (localStorage[e.id]==undefined)?"":localStorage[e.id];
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
	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/apikey";
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