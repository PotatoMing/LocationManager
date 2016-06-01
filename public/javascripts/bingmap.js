var map = null;
var myCredentials = "AqKqe95YiDLLJltSTwoVs9XgfAifBDVLFgKLfevV8PzGqe5xNVsOyMHD_aWgHTS7";
var bingResources;
var geoLocation;
var next = 0;	//a pointer points to the next possible location
$(function(){
	$('.float-info').hide();
	$('.window-close').click(function(){
		$(this).parent().hide();
	});
});
function formValidation(){
	var password = document.getElementsByName("password")[0].value;
	var confirm_password = document.getElementsByName("confirm-password")[0].value;
	if(password===confirm_password){
		if(document.getElementById("geoX").value===""||document.getElementById("geoy").value===""){
			alert("Please confirm your location");
			return false;
		}else{
			return true;
		}
	}else{
		alert("The confirmed password does not match your original one!");
		document.getElementsByName("password")[0].value = "";
		document.getElementsByName("confirm-password")[0].value = "";
		return false;
	}
}
function getMap(x,y,id){
	var mapOptions = {
		credentials: myCredentials,
		center: new Microsoft.Maps.Location(x,y),
		mapTypeId: Microsoft.Maps.MapTypeId.road,
		zoom: 7
	};
	map = new Microsoft.Maps.Map(document.getElementById(id),mapOptions);
}

function setGeoLocation(id){
	geoLocation = document.getElementById(id).value;
	next = 0;
	//show the confirmation box
	$('#confirm-geolocation').show();
	$('#confirm-geolocation').addClass('loading');
	makeGeocodeRequest(geoLocation);
}

/*Geocode Search*/
function makeGeocodeRequest(geocodeLocation){
	var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations?query="+encodeURI(geocodeLocation)+"&output=json&jsonp=geocodeCallback&key="+myCredentials;
	callRestService(geocodeRequest);
}
function callRestService(request){
	var script = document.createElement("script");
	script.setAttribute("type","text/javascript");
	script.setAttribute("src",request);
	document.body.appendChild(script);
}
function geocodeCallback(result){
	if (result.resourceSets&&result.resourceSets.length>0&&result.resourceSets[0].resources&&result.resourceSets[0].resources.length>0){
		bingResources = result.resourceSets[0].resources;
		console.log(bingResources);	
	}
	displayResult();
}
function displayResult(){
	if(bingResources){
		if(next>=bingResources.length){
			$('#confirm-geolocation').hide();
			return;
		}
		geoLocation = new Microsoft.Maps.Location(bingResources[next].point.coordinates[0],bingResources[next].point.coordinates[1]);
		$('#confirm-geolocation').removeClass('loading');
		$('#confirm-geolocation>.info').text('Is this your address: '+bingResources[next].name+'?');
		next++;
	}else{
		$('#confirm-geolocation').removeClass('loading');
		$('#confirm-geolocation').hide();
		$('#popup-info').show();
		$('#popup-info>.info').text("Sorry, BingMap is unable to find out your address, could you please be more specific?");
	}
}
function changeMapBoundaries(bbox){
		var boundaries = Microsoft.Maps.LocationRect.fromLocations(new Microsoft.Maps.Location(bbox[0],bbox[1]),new Microsoft.Maps.Location(bbox[2],bbox[3]));
		map.setView({bounds: boundaries});
}
function putPushPin(location){
	var pushpin = new Microsoft.Maps.Pushpin(location);
	map.entities.push(pushpin);
}
function listResults(resources){
	//This function will list five locations returned by Bingmap and list them in #geocodeResults
	if (resources.length > 0){
		var div = document.getElementById("geocodeResults");
		div.style.display = "initial";
		len = Math.min(resources.length,5);
		for(var i=0;i<len;i++){
			var p = document.createElement("input");
			p.setAttribute("type","radio");
			p.setAttribute("Name","location");
			var pname = resources[i].name;
			p.value = pname;
			geoLocations.push(pname);
			p.addEventListener("click",function(){
				var index = geoLocations.indexOf(this.value);
				var location = new Microsoft.Maps.Location(resources[index].point.coordinates[0],resources[index].point.coordinates[1]);
				putPushPin(location);
				changeMapBoundaries(resources[index].bbox);
			});
			div.appendChild(p);
			div.appendChild(document.createTextNode(resources[i].name));
			div.appendChild(document.createElement("br"));
		}
	}
}

function confirmGeoLocation(id){
	var geoID = next-1;
	if(map!==null){
		putPushPin(geoLocation);
		changeMapBoundaries(bingResources[geoID].bbox);
		document.getElementById("geoX").value = bingResources[geoID].point.coordinates[0];
		document.getElementById("geoY").value = bingResources[geoID].point.coordinates[1];
		document.getElementById("form-geolocation").value = bingResources[geoID].name;
		document.getElementById("country").value = bingResources[geoID].address.countryRegion;
		document.getElementById("city").value = bingResources[geoID].address.locality;	
	}
	if($("#footprint-location")){
		$("#footprint-location").val(bingResources[geoID].name);
		$('#geoX').val(bingResources[geoID].point.coordinates[0]);
		$('#geoY').val(bingResources[geoID].point.coordinates[1]);
	}
	$('#'+id).hide();
}

function makeReverseGeocodeRequest(x,y,callbackName){
	var reverseGeocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations/"+encodeURI(x+","+y) + "?o=json&jsonp="+callbackName+"&key=" + myCredentials;
	callRestService(reverseGeocodeRequest);
}

