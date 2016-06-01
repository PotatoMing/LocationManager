var user;
for(x of arr){
	if(x.username===currentUser){
		user = {
			x : x.geoX,
			y : x.geoY,
			username : x.username,
			geoLocation: x.geoLocation,
			city: x.city,
			country:x.country
		}
		break;
	}
}
var map = null;
var myCredentials = "AqKqe95YiDLLJltSTwoVs9XgfAifBDVLFgKLfevV8PzGqe5xNVsOyMHD_aWgHTS7";
var route = [];
var cities = [];
var countries = []; 
var farawayUsers = 0;
var distanceToUsers = [];
var upcomingFriends = [];
var currentDate = new Date();
$(document).ready(function(){
	getMap(user.x,user.y,"Main-Bing-Map");
	$('#welcome').show();
	$('.window-close').on('click',function(){
		$(this).parent().hide();
	});
});
function getMap(x,y,id){
	var location = new Microsoft.Maps.Location(x,y); 
	var mapOptions = {
		credentials: myCredentials,
		center: location,
		mapTypeId: Microsoft.Maps.MapTypeId.road,
		zoom: 7
	};
	map = new Microsoft.Maps.Map(document.getElementById(id),mapOptions);
	putPushPin(location,user.username,user.geoLocation);
	initMap(x,y);
}
function makeRouteRequest(start,end){
	var routeRequest = "http://dev.virtualearth.net/REST/v1/Routes?wp.0=" + encodeURI(start) + "&wp.1=" + encodeURI(end) + "&routePathOutput=Points&output=json&jsonp=routeCallback&key=" + myCredentials;
	callRestService(routeRequest);
}
function initMap(x,y){
	for(var i=0;i<arr.length;i++){
		//make push pins to represent users' location
		if(arr[i].username!==user.username){
			var l = new Microsoft.Maps.Location(arr[i].geoX,arr[i].geoY); 
			putPushPin(l,arr[i].username,arr[i].geoLocation);		
			makeRouteRequest(user.geoLocation,arr[i].geoLocation);
		}
	}
	for(var j=0;j<footprints.length;j++){
		if(footprints[j].geoX&&footprints[j].geoY&&footprints[j].location){
			l = new Microsoft.Maps.Location(footprints[j].geoX,footprints[j].geoY); 
			putPushPin(l,footprints[j].title,footprints[j].content,"footprint.png");	
		}
	}
	//Update user list
	var userlist = $('#userlist');
	userlist.append('<h4>Current users in the system: <h4><hr>');
	for(i in arr){
		userlist.append('<p>Username: <a class="user">'+arr[i].username+'</a></p><br>');
	}
}

function updateDistanceArray(){
	var tempDistance,x,y,location;
	for(var i=0;i<route.length;i++){
		/*create a map of username and distance*/
		tempDistance = route[i].travelDistance;
		x = route[i].routeLegs[0].endLocation.geocodePoints[0].coordinates[0].toFixed(5);
		y = route[i].routeLegs[0].endLocation.geocodePoints[0].coordinates[1].toFixed(5);
		location = route[i].routeLegs[0].endLocation.address.formattedAddress;
		/*Search for the related user in arr array*/
		for(var j=0;j<arr.length;j++){
			var tempx = Number.parseFloat(arr[j].geoX).toFixed(5);
			var tempy = Number.parseFloat(arr[j].geoY).toFixed(5);
			if(Math.abs(tempx-x<=0.001)&&Math.abs(tempy-y)<=0.001){
				distanceToUsers.push({
					"username":arr[j].username,
					"distance":tempDistance,
					"location":location
				});
			}
		}
	}
}
function updateInfoBox(id){
	var infobox = $('.info-box').eq(id);
	var distance = Number.MAX_VALUE;
	var index = 0;
	if(id===0){
		for(i in distanceToUsers){
			if(distanceToUsers[i].distance<distance){
				distance = distanceToUsers[i].distance;
				index = i;
			}
		}
		if(distanceToUsers.length!==0){
			infobox.append('<p>The nearest User is: <a class="user">'+distanceToUsers[index].username+'</a></p><br>');
			infobox.append('<p>The location of '+distanceToUsers[index].username+' is: '+distanceToUsers[index].location+'</p><br>');
			infobox.append('<p>The distance between you two is: '+distanceToUsers[index].distance+" KM"+'</p><br>');	
		}else{
			infobox.append('<p>There are currently no user exists around your location</p>');
		}
	}else if(id==1){
		for(friend of arr){
			if(friend.username!==user.username){
				if($.inArray(friend.city,cities)===-1){
					cities.push(friend.city);
				}
				if($.inArray(friend.country,countries)===-1){
					countries.push(friend.country);
				}
			}
		}
		infobox.append('<p>You have friends in following cities:</p>');
		var row = "";
		for(var i=0;i<cities.length;i++){
			var city = cities[i];
			if(i===cities.length-1){
				city += ". " 	
			}else{
				city += "; "
			}		
			row += city
		}
		infobox.append('<p>'+row+'</p>');
		infobox.append('<p>You have friends in following countries:</p>');
		row = ""
		for(var j=0;j<countries.length;j++){
			var country = countries[j];
			if(j===countries.length-1){
				country += ". "
			}else{
				country += "; "	
			}
			row += country
		}
		infobox.append('<p>'+row+'</p>');
	}else if(id==2){
		if(upcomingFriends.length>0){
			upcomingFriends.sort(function(a,b){
				return a.days-b.days;
			})
			for(var i=0;i<upcomingFriends.length;i++){
				infobox.append("<p>Your friend <a class='user'>"+upcomingFriends[i].username+"</a> is coming to your city in "+upcomingFriends[i].days+" day(s)</p>");
			}
			infobox.append("<p>Ready for a party?</p>");
		}else{
			infobox.append("<p>You have no friend coming to your city</p>")
		}
	}
}
function routeCallback(result){
	if (result &&
       	result.resourceSets &&
       	result.resourceSets.length > 0 &&
       	result.resourceSets[0].resources &&
    	result.resourceSets[0].resources.length > 0){
		// var routeline = result.resourceSets[0].resources[0].routePath.line;
		// var routepoints = new Array();
		// for(var i=0;i<routeline.coordinates.length;i++){
		// 	routepoints[i] = new Microsoft.Maps.Location(routeline.coordinates[i][0],routeline.coordinates[i][1]);
		// }
		// var routeshape = new Microsoft.Maps.Polyline(routepoints,{strokeColor: new Microsoft.Maps.Color(200,0,0,200)});
		// map.entities.push(routeshape);
		route.push(result.resourceSets[0].resources[0]);
	}else{
		farawayUsers++;
	}
	if(route.length+farawayUsers===arr.length-1){
		updateDistanceArray();
		findUsersByTrip(trips);
		updateInfoBox(0);
		updateInfoBox(1);
		updateInfoBox(2);
		$('.info-box').removeClass('loading');
		statistic();
	}
}

function putPushPin(location,username,geoLocation,icon){
	var pushpin = new Microsoft.Maps.Pushpin(location);
	if(icon!=null){
		console.log('hehehe');
		pushpin = new Microsoft.Maps.Pushpin(location,{
			'icon' : "/images/"+icon,
			'width' : 70,
			'height' : 70,
		});	
	}
	var pinInfo = new Microsoft.Maps.Infobox(location,{
		title: username,
		description: geoLocation+" (double click to dismiss the message)",
		visible: false,
		offset: new Microsoft.Maps.Point(0,15)
	});
	//add event handler to each pushpin
	Microsoft.Maps.Events.addHandler(pushpin,'mouseover',function(e){
		pinInfo.setOptions({visible:true});
	})

	Microsoft.Maps.Events.addHandler(pinInfo,'dblclick',function(e){
		pinInfo.setOptions({visible:false});
	})
	map.entities.push(pushpin);
	map.entities.push(pinInfo);
}

function callRestService(request){
	var script = document.createElement("script");
	script.setAttribute("type","text/javascript");
	script.setAttribute("src",request);
	document.body.appendChild(script);
}

function searchModuleLoaded(){
	var searchManager = new Microsoft.Maps.Search.SearchManager(map);
	for(var friend of arr){
		if(friend.username!==user.username){
			var reverseGeocodeRequest = {
				location:new Microsoft.Maps.Location(friend.geoX, friend.geoY), 
				count:10, 
				callback:reverseGeocodeCallback, 
				errorCallback:errCallback
			};
			searchManager.reverseGeocode(reverseGeocodeRequest);
		}
	}
}

function reverseGeocodeCallback(result,userData){
	console.log(result);
}

function errCallback(request){
	console.log("error occurred");
}
function statistic(){
	var sameCity = 0;
	var sameCountry = 0;
	for(x of arr){
		if(x.username===user.username){
			continue;
		}
		if(x.city===user.city){
			sameCity++;
		}
		if(x.country===user.country){
			sameCountry++;
		}
	}
	createDonutChart("country",sameCountry,1);
	createDonutChart("city",sameCity,2);
	createDonutChart("upcoming friends",upcomingFriends.length,3);
	getTravelFrequency(trips);
}
function createDonutChart(title,result,id){
	if(title==="upcoming friends"){
		var text = ""
		if(result===0){
			text = "You have no friend coming to your city";
		}else{
			text = "You have "+result+" friend(s) coming to your city";
		}
		$('#statistic-header'+id).text(text);
		Morris.Donut({
			element: "statistic-box"+id,
			data: [
				{label: "Friends coming to your city ", value: result},
				{label: "Friends not coming to your city ", value: arr.length-result-1}
			],
			colors:['#009900','#006600']
		});
	}else{
		var strresult = "0" 
		if(result!==0){
			strresult = (result/(arr.length-1)*100).toFixed(2) + "%";
		}
		$('#statistic-header'+id).text("You have "+strresult+" friend(s) live in the same "+title);
		Morris.Donut({
			element: "statistic-box"+id,
			data: [
				{label: "Friends in your "+title, value: result},
				{label: "Friends not in your "+title, value: arr.length-result-1}
			],
			colors:['#009900','#006600']
		});
	}
	$("#statistic-box"+id).removeClass("loading");
}
function findUsersByTrip(trips){
	//trips is an array of JSON object
	for(var trip of trips){
		if(trip.username===currentUser){
			continue;
		}
		var friends = JSON.parse(trip.friends);
		if(inArray(currentUser,friends)){
			var time = new Date(trip.time);
			if(time-currentDate>0){
				var days = Math.round((time-currentDate)/(60*60*24*1000));
				upcomingFriends.push({
					'username':trip.username,
					'days':days,
				});
			}
		}
	}
}

function getTravelFrequency(trips){
	var frequency = [];
	for(var user of arr){
		//initialize frequency array
		var tmp = {
			'username':user.username,
			'frequency':0
		};
		frequency.push(tmp);
	}
	for(var trip of trips){
		//find number of upcoming trips for each user 
		for(var i=0;i<frequency.length;i++){
			if(frequency[i].username===trip.username){
				frequency[i].frequency++;
				break;
			}
		}
	}
	frequency.sort(function(a,b){
		return -a.frequency+b.frequency;
	});
	console.log(frequency);
	Morris.Bar({
		element: 'travel-frequency',
		data: frequency.slice(0,5),
		xkey: 'username',
		ykeys: ['frequency'],
		labels: ['Travel Frequency'],
		barColors: ['#408000']
	});
}
