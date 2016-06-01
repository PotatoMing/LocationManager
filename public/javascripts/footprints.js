$(function(){
	initFootprint();
	$('.deletable').on('click',function(){
		//delete target footprint
		var id = $(this).siblings('.footprint-id').val();
		console.log(id);
		$.ajax({
			'type':'DELETE',
			'url':'/users/deletefootprint/'+id
		}).done(function(response){
			if(response.msg===''){
				location.reload();
			}else{
				alert('Error: '+response.msg);
			}
		});
	});
	$('.footprints-addNew').on('click',function(){
		//enable add-new-footprint window
		$('#new-footprint input').val("");
		$('#new-footprint').show();

	});
	$('.close').on('click',function(){
		$(this).parent().hide();
	});

});
function initFootprint(){
	var count = 1;
	$('#new-footprint').hide();
	for(var j=0;j<footprints.length;j++){
		//convert date from string to Date()
		footprints[j].date = new Date(footprints[j].date);
	}
	footprints.sort(function(a,b){
		//sort footprints based on time
		return a.date-b.date;
	});
	for(var i=0;i<footprints.length;i++){
		var date = footprints[i].date.toDateString();
		var content = footprints[i].content;
		var title = footprints[i].title;
		var author = footprints[i].username;
		var id = footprints[i]._id;
		var users = JSON.parse(footprints[i].users);
		var location = footprints[i].location;
		if(location==undefined||location.trim().length===0){
			location = "undefined";
		}
		addFootprint(date,content,author,title,count,id,users,location);
		count++;
	}
}
function addFootprint(time,content,author,title,count,id,users,location){
	var newFootprint = $('<li><div class="timeline-badge"></div></li>');
	if(count%2!==0){
		newFootprint.addClass('timeline-inverted');
		newFootprint.children().addClass("success");	//change badge color
	}else{
		newFootprint.children().addClass("warning");	//change badge color
	}
	var panel = $('<div class="timeline-panel"></div>');
	newFootprint.append(panel);
	var heading = $('<div class="timeline-heading"><h4>'+title+'</h4></div>');
	if(author===username){
		//users are able to delete their own footprints
		heading.append('<div class="deletable"><a class="glyphicon glyphicon-remove"></a></div>');
	}
	heading.append('<p><small>'+time+'; Created by: '+author+'; Location:'+location+'</small></p>');
	//identification of each footprint in the database
	heading.append('<input type="hidden" class="footprint-id" value='+id+'>');
	panel.append(heading);
	var body = $('<div class="timeline-body"></div>');
	if(users!=undefined){
		console.log(users);
		var participatedUsers = $('<p>Participated Friends: </p>');
		for(var i=0;i<users.length;i++){
			var tmpUser = $('<a>'+users[i]+' </a>');
			if(users[i]===username){
				tmpUser.text("Yourself ");
			}else{
				tmpUser.addClass("user");
			}
			participatedUsers.append(tmpUser);
		}
	body.append(participatedUsers);
	}
	body.append('<p>'+content+'</p>');
	panel.append(body);
	$('.timeline').append(newFootprint);
}
function submitFootprint(){
	var month = Number.parseInt($('#footprint-month').val());
	var day = Number.parseInt($('#footprint-day').val());
	var year = Number.parseInt($('#footprint-year').val());
	var users = JSON.stringify($('#select-users').val());
	var geoX = $('#geoX').val();
	var geoY = $('#geoY').val();
	var geoLocation = $('#footprint-location').val();
	if(geoLocation.trim().length!=0&&(geoX.length===0||geoY.length===0)){
		alert("If you want to attach a location to this event, please do not forget to hit the \"confirm\" button. Otherwise please leave it empty.");
		return;
	}
	if(month<=0||month>12||isNaN(month)||day<=0||day>31||isNaN(day)||year<=1900||year>2020||isNaN(year)){
		alert("Invalid date!");
		$('#new-footprint').children('input').val('');
		return;
	}
	var title = $('#footprint-title').val().trim();
	if(title.length===0){
		alert("Title shouldn't be empty!");
		return;
	}
	var content = $('#footprint-content').val().trim();
	if(content.length===0){
		alert("Content shouldn't be empty!");
		return;
	}
	var date = new Date(year,month-1,day);
	$.ajax({
		type: 'POST',
		url: '/users/addfootprint/',
		data: {
			'date': date,
			'content': content,
			'title': title,
			'users': users,
			'geoX': geoX,
			'geoY': geoY,
			'location': geoLocation
		}
	}).done(function(response){
		if(response.msg===''){
			location.reload();
		}else{
			alert('Error'+response.msg);
		}
	})
}