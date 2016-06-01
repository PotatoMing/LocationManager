$(document).on('click','.deletable',function(){
	deleteTrip($(this).siblings('.trip-id').val());
})
$(function(){
	$( ".draggable" ).draggable();
});
function confirmTripDest(id){
	$('#'+id).hide();
	putPushPin(geoLocation);
	var geoID = next-1;
	endingPoint = bingResources[geoID].name;
	changeMapBoundaries(bingResources[geoID].bbox);
	$('#trip-destination').val(bingResources[geoID].name);
	$('#trip-results').show();
	$('#trip-results').addClass('loading');
	//load bing maps direction module
	Microsoft.Maps.loadModule('Microsoft.Maps.Directions',{callback:directionsModuleLoaded});
}
function directionsModuleLoaded(){
	//initialization
	directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
	findRoute();
}
function findRoute(){
	//starting point
	var start = new Microsoft.Maps.Directions.Waypoint({address: startingPoint});
	var end = new Microsoft.Maps.Directions.Waypoint({address: endingPoint });
	directionsManager.addWaypoint(start);
	directionsManager.addWaypoint(end);

	$('#trip-results').children().empty();

	directionsManager.setRequestOptions({routeMode: Microsoft.Maps.Directions.RouteMode.driving})

	directionsManager.setRequestOptions({itineraryContainer: document.getElementById('trip-results')});
	$('#trip-results').removeClass('loading');

	//add handlers
	Microsoft.Maps.Events.addHandler(directionsManager,'directionsUpdated',displayMessage);
	Microsoft.Maps.Events.addHandler(directionsManager,'directionsError',displayError);

	//displays a route on the map
	directionsManager.calculateDirections();
}
function displayMessage(e){
	if(e && e.route && e.route[0].routeLegs && e.route[0].routeLegs[0].itineraryItems){
		var x,y,tmpX,tmpY;
		upcomingUsers = new Map();					//initialize this variable each time
		steps = e.route[0].routeLegs[0].itineraryItems;
		console.log(steps);
		stepLength = steps.length;
		for(var i=1;i<stepLength;i++){
			var step = steps[i];
			x = step.coordinate.latitude;
			y = step.coordinate.longitude;
			findNearbyUsers(x,y);
			//makeReverseGeocodeRequest(x,y,"tripRouteCallback");
		}
		getUsers();				//get nearby users during the trip
	}
}
function findNearbyUsers(x,y){
	for(var i=0;i<info.length;i++){
		if(info[i].username===currentUser||info[i].city===currentCity){
			continue;
		}
		if(Math.abs(x-info[i].geoX)<=0.1&&Math.abs(y-info[i].geoY)<=0.1){
			if(!upcomingUsers.has(info[i].username)){
				upcomingUsers.set(info[i].username,1);
			}
		}
	}
}
function getUsers(){
	var temp = [];								//temp array that stores users we can meet during the trip
	if(upcomingUsers.size>0){
		console.log(upcomingUsers);
		for(var username of upcomingUsers.keys()){
			temp.push(username);
		}
		$('#trip-users>p').text("Following the suggested route, you will meet your friends: "+temp+" during the trip");
	}else{
		$('#trip-users>p').text("No friends can be met during this trip")
	}
	upcomingUsers = temp;
	$('#trip-users').show();
}
function submitTrip(){
	var username = currentUser;
	var destination = endingPoint;
	var friends = JSON.stringify(upcomingUsers);
	var time = new Date($('#trip-year').val(),$('#trip-month').val()-1,$('#trip-date').val());
	$('#trip-users').hide();
	$.ajax({
		type: 'POST',
		url: '/users/addtrip/',
		data:{
			'username':username,
			'destination':destination,
			'friends': friends,
			'time': time
		}
	}).done(function(response){
			if(response.msg===''){
				displaySysInfo("Trip submitted!");
				getSubmittedTrips();
			}else{
				alert("Error: "+response.msg);
			}
	})
}
function deleteTrip(id){
	$.ajax({
		type: 'delete',
		url: '/users/deletetrip/'+id
	}).done(function(response){
		if(response.msg===''){
			getSubmittedTrips();	//reload trips
		}else{
			alert("Error: "+response.msg);
		}
	});
}
function getSubmittedTrips(){
	$('.trip-element').empty();			//delete all element in class "trip-element"
	$.ajax({
		type: 'GET',
		url: '/users/trips'
	}).done(function(response){
		if(response.error===undefined){
			var today = new Date();
			for(var res of response.msg){
				var date = new Date(res.time);
				if(date-today>0){
					var diff = Math.round((date-today)/(1000*60*60*24));
					var trip = $('<div class="trip-element"></div>');
					var header = $('<p>You are going to '+res.destination+" in "+diff+" day(s)</p>");
					var result = $('<p>You can meet your friends '+res.friends+" during the trip</p>");
					trip.append("<div class='deletable'><a class='remove glyphicon glyphicon-remove'></a></div>")
					trip.append("<input type='hidden' class='trip-id' value="+res._id+"/><hr>");
					trip.append(header);
					trip.append(result);
					$('#trip-submitted').append(trip);
				}else{
					console.log("Deleting outdate trip with id: "+res._id);
					deleteTrip(res._id);
				}
			}
		}else{
			alert("Error: "+response.error);
		}
	});
}
function tripRouteCallback(result){
	stepCount++;
	if(result&&
			result.resourceSets &&
			result.resourceSets.length >0 &&
			result.resourceSets[0].resources &&
			result.resourceSets[0].resources.length > 0)
	{
		var location = result.resourceSets[0].resources[0].address;
		var city = location.locality;
		var country = location.countryRegion;
		if(!routeCity.has(city)){
			routeCity.set(city,1);
		}
		if(!routeCity.has(country)){
			routeCountry.set(country,1);
		}
	}
	if(stepCount>=stepLength){
		//finish searching for the locations
		console.log(routeCity);
		console.log(routeCountry);
		findUsers();
	}
}

function displayError(e){
	alert(e);
}
$(function(){
	getMap(x,y,"trip-BingMap");
	for(var user of info){
		var location = new Microsoft.Maps.Location(user.geoX,user.geoY);
		putPushPin(location);
	}
	getSubmittedTrips();
})