$(document).ready(function(){


	$("#downloads-list li").live("click",selecting);
	$(function() {
		$("#tabs").tabs({
			collapsible : false,
			activate : tabChange
		});
	});
	$(".close").live("click",removeQueueElement);
	$("#play-pause-button").live("click",togglePlayPause);

	$("#search").keyup(filterSearch);
	$("#search").mouseup(filterSearch);
	$("#msg").tooltip({ position: { my: "bottom", at: "bottom center", of : $(this)} });
	$("#download-btn").click(queueDownloadsInServer);
	$(document).ajaxStart(function(){
		$(".overlay").show();
	});
	$(document).ajaxStop(function(){
		$(".overlay").hide();
	});
	getTransfers();
	getQueue();
	$("#username").val(localStorage["login"]);
	$("#file").change(fileChange);
	$('#upload-form').submit(function(){return false});
	timer = setTimeout(updateProgress,10000);
});


function showMessage(message, type){
	$("#msg").attr("title",message);
	$( "#msg").tooltip( "option", "tooltipClass", "tooltip-"+type );
	$("#msg").tooltip("open");
	setTimeout(function(){$("#msg").tooltip("close");},3000);
}



function selecting(evt){
	$(this).toggleClass("ui-selected");
	var selectedCount = $("#downloads-list .ui-selected").length;
	$("#selected-count").text(String(selectedCount));
	if(selectedCount == 0)
		$( "#download-btn" ).button({ disabled: true });
	else
		$( "#download-btn" ).button({ disabled: false });
}
function removeQueueElement(evt){
	var queueId = $(evt.currentTarget).parents("li").data("queueId");
	removeElementFromServerQueue(queueId);
}

function tabChange(event, ui){
	var tabIndex = $( "#tabs" ).tabs( "option", "active" );
	switch(tabIndex)
	{
		case 0:
			getTransfers();
			getQueue();
			timer = setTimeout(updateProgress,10000);
			break;
		case 1:
			getAvailableDownloads();
			$("#selected-count").text(0);
			$( "#download-btn" ).button();
			$("#downloads-list").html("");
			clearTimeout(timer);
			break;
		case 2:
			break;
	}
}

function updateProgress(){
	var tabIndex = $( "#tabs" ).tabs( "option", "active" );
	if(tabIndex == 0){
		$.ajaxSetup({global : false});
		$("#progress-loader").show();
		$("#queue-loader").show();
		getTransfersFromServer(function(){
			setTimeout(updateProgress,10000);
			$("#progress-loader").hide();
			$.ajaxSetup({global : true});
		});
		getQueue(function(){
			$("#queue-loader").hide();
			$.ajaxSetup({global : true});
			
		});
	}
	
}
function getTransfers(){

	$( "#progressbar" ).progressbar();
	$( "#progressbar" ).progressbar("destroy");
	getTransfersFromServer();
	
}
/**
**
This function gets called in two diferent scenarios, one is when rendering the tab "Transfering" and the other
is when updating the progress. This two scenarios show a different ajax loader, the first one shows a semi-transparent 
overlay with the loader in the center. The second one shows a loader at the bottom of the progress bar.
To be able to use the same function for both we added a callback that's executed after the ajax call was successful.

**
**/

function getTransfersFromServer(callback){
	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/status?username="+localStorage["login"];
	$.ajax(url)
		.done(function(data, code, xhr){
			var xml = xhr.responseXML;
			var download = xml.getElementsByTagName("download");
			status = xml.getElementsByTagName("status")[0].textContent;
			if(status == "STARTED"){
				$("#play-pause-button").find("img").attr("src","pause.png");
			}
			else if(status == "STOPPED"){
				$("#play-pause-button").find("img").attr("src","play.png");
			}
			if(download.length == 0){
			$( "#progressbar" ).progressbar();
			$( "#progressbar" ).progressbar("destroy");
				$("#info").text("Nothing is being downloaded");
			}
			else{
				var downloadName = download[0].getElementsByTagName("fileName")[0].textContent;
				var size = Number(download[0].getElementsByTagName("size")[0].textContent);
				var transfered = Number(download[0].getElementsByTagName("transferred")[0].textContent);
				var progress = transfered * 100 / size;
				$("#info").text(downloadName + " ["+ progress.toFixed(2)+"%]");
				$( "#progressbar" ).progressbar({
					value: progress
				});
			}
			if(callback != undefined)
					callback();
			
		})
		.fail(function(){
			showMessage("Incorrect options or server not responding", "error");
		});
}

function removeElementFromServerQueue(queueId){

	var xhr = new XMLHttpRequest();
	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/downloads/delete?username="+localStorage["login"]+"&downloadId="+queueId;
	$.ajax(url)
		.done(function(){
			getTransfers();
			getQueue();
			showMessage("Element removed correctly", "ok");
		})
		.fail(function(){
			showMessage("Error removing element. Try again later", "error");
		});
}

function resetQueue(){
	
	$("#queue li").each(function(){
		if($(this).attr("id") != "queue-element"){
			$(this).remove();
		}
	});
	
}

function resetDownloadsList(){
	
	$("#downloads-list li").each(function(){
		$(this).remove();
	});
	
}

function getQueue(callback){

	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/downloads/queue?username="+localStorage["login"];
	$.ajax(url)
		.done(function(data, code, xhr){
			var xml = xhr.responseXML;
			var downloads = xml.getElementsByTagName("file");
			resetQueue();
			if(downloads.length == 0){
				$("#queue-info").text("Nothing queued");
			}
			else{
				$("#queue-info").text("");
				for(var i=0;i<downloads.length;i++){
					var downloadName = downloads[i].getElementsByTagName("name")[0].textContent;
					var queueId = downloads[i].getElementsByTagName("queueId")[0].textContent;
					var order = downloads[i].getElementsByTagName("order")[0].textContent;
					var newElement = $("#queue-element").clone();
					newElement.attr("id","");
					newElement.find(".queue-name").text(downloadName);
					newElement.show();
					newElement.appendTo("#queue");
					newElement.data("order",order);
					newElement.data("queueId",queueId);
				}
				sort("#queue li:not(#queue-element)",function(a){return $(a).data("order");});
				$( "#queue" ).sortable({ update : updateQueueOrder });
			}
			if(callback != undefined)
				callback();

		})
		.fail(function(){
			//Nothing here as another call is being made to fetch the current download and that will also fail and 
			//so it's going to show an error message.
		});
			
		

}


function getAvailableDownloads(){

	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/downloads/list?username="+localStorage["login"];
	$.ajax(url)
		.done(function(data, code, xhr){
			var xml = xhr.responseXML;
			var downloads = xml.getElementsByTagName("file");
			resetDownloadsList();
			if(downloads.length == 0){
				$("#downloads-info").text("Nothing on the server");
				
			}
			else{
				$("#downloads-info").text("");
				downloadsFromServer = [];
				for(var i=0;i<downloads.length;i++){
					var downloadName = downloads[i].getElementsByTagName("name")[0].textContent;
					downloadsFromServer.push(downloadName);
					$("<li>").text(downloadName).appendTo("#downloads-list");
				}
				sort("#downloads-list li", function(a){return $(a).text()});
			}
		})
		.fail(function(data, code, xhr){
			showMessage("Incorrect Options or server not responding.", "error");
		});

}

function filterSearch(evt){
	$("#downloads-list li").each(function(){
		$(this).remove();
	});
	var filter = $(evt.currentTarget).val();
	if(filter != ""){
		for(var i=0;i<downloadsFromServer.length;i++){
			var downloadFromServer = String(downloadsFromServer[i]).toLowerCase();
			if(downloadFromServer.indexOf(filter.toLowerCase()) > -1){
				$("<li>").text(downloadsFromServer[i]).appendTo("#downloads-list");
			}
		}
	}
	else{
		for(var i=0;i<downloadsFromServer.length;i++){
			$("<li>").text(downloadsFromServer[i]).appendTo("#downloads-list");
		}
	}
	sort("#downloads-list li", function(a){return $(a).text()});
	$("#selected-count").text(String(0));
	$( "#download-btn" ).button({ disabled: true });
} 

function queueDownloadsInServer(){
	var fileNames = [];
	$("#downloads-list .ui-selected").each(function(){
		fileNames.push($(this).text());
	});
	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/downloads/put?username="+localStorage["login"];
	for(var i=0;i<fileNames.length;i++){
		url +="&fileName="+encodeURIComponent(fileNames[i]);
	}
	$.ajax(url)
		.done(function(){
			showMessage("Downloads are queued!", "ok");
		})
		.fail(function(){
			showMessage("There was an error. Try again later.", "error");}
		);
}


function uploadTorrent(){

	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/torrents/add";
    var formData = new FormData($('#upload-form')[0]);
    $.ajax({
        url: url,  //server script to process data
        type: 'POST',
        xhr: function() {  // custom xhr
            myXhr = $.ajaxSettings.xhr();
            if(myXhr.upload){ // check if upload property exists
                myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // for handling the progress of the upload
            }
            return myXhr;
        },
        //Ajax events
        success: function(){
			showMessage("Torrent uploaded successfully", "ok");
		},
        error: function(){
			showMessage("Error trying to upload torrent.", "error");
		},
        // Form data
        data: formData,
        //Options to tell JQuery not to process data or worry about content-type
        cache: false,
        contentType: false,
        processData: false

});
}

function progressHandlingFunction(e){
    if(e.lengthComputable){
		$( "#upload-progress-bar" ).progressbar({
			value: e.loaded * 100 / e.total
		});
    }
}

function fileChange(evt){
	if($(evt.currentTarget).val() != ""){
		$("#upload-btn").button({disabled : false});
		var file = this.files[0];
		type = file.type;
		if(type != "application/x-bittorrent"){
			$(evt.currentTarget).val("");
			$("#upload-btn").button({disabled : true});
			showMessage("Incorrect type, select a .torrent file.","warning");
		}else{
			uploadTorrent();
		}
	}
}

function sort(itemsSelector, getKey){
	var items = $(itemsSelector).get();
	items.sort(function(a,b){ 
	  var keyA = getKey(a);
	  var keyB = getKey(b);

	  if (keyA < keyB) return -1;
	  if (keyA > keyB) return 1;
	  return 0;
	});
	var parent = $(itemsSelector).parent();
	$.each(items, function(i, li){
	  parent.append(li);
	});
}

function updateQueueOrder(){
	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/downloads/update?username="+localStorage["login"];
	var items = $("#queue li:not(#queue-element)").get();
	var queueElements = [];
	$.each(items,function(i,li){
		var item = {};
		item.queueId = $(this).data("queueId");
		item.order = i+1;
		queueElements.push(item);
	});
	var data = JSON.stringify(queueElements);
	$.ajax({
		type: 'POST',
		url : url,
		contentType : 'application/json',
		data : data
	})
		.fail(function(){
			showMessage("There was an error when reordering the queue", "error");}
		);
	
}

function togglePlayPause(){
	var action;
	if(status == "STOPPED"){
		action = "start";
	}
	else if(status == "STARTED"){
		action = "stop";
	}
	var url = "http://"+localStorage["host"]+":"+localStorage["port"]+"/webservices/"+ action +"?username="+localStorage["login"];
	$.ajax({
		url : url
	})
		.done(function(){
			getTransfers();
			getQueue();
		})
		.fail(function(){
			showMessage("There was an error. Try again later.", "error");}
		);
	
}