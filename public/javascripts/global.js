$(document).on('click','.window-close',function(){
	$(this).parent().hide();
});
$(document).on('click','.user',function(){
	/*Event listener for dynamic created elements*/
	getUserInfo($(this));
});
function formReset(id){
	var obj = $('#'+id);
	obj.val('');
	obj.find('select').val('');
	obj.find('input').val('');
	obj.find('textarea').val('');
}

function getUserInfo(obj){
	$.ajax({
		'type':'GET',
		'url': '/users/getuserinfo/'+obj.text().trim()
	}).done(function(response){
		var msg;
		displayUserInfo(response);
	});
}

function displayUserInfo(response){
	if(response.error!==undefined){
		$('#user-info>#info').text("Failed to retrieve target's information");
	}else{
		$('#user-info .db-content').text('');
		$('#user-info>#info').text('The information of '+response.msg.username+' is:');
		$('#user-info #geolocation').text(response.msg.geoLocation);
		$('#user-info #job').text(response.msg.job);
		$('#user-info #hobby').text(response.msg.hobby);
	}
	$('#user-info').show();
}

function displaySysInfo(msg){
	$('#sysinfo>p').text(msg);
	$('#sysinfo').show();
}

//find out if the given element is in 
function inArray(element,arr){
	for(var a of arr){
		if(a===element){
			return true;
		}
	}
	return false;
}