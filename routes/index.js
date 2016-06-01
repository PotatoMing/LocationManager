var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/',function(req,res,next){
	if(req.query.message){
		message = req.query.message;
	}else{
		message = undefined;
	}
	res.render('./pages/index', { 'title': 'Login','message':message });
});

router.get('/logout',function(req,res,next){
	//clear session
	req.session.sw = '';
	res.redirect('/?message='+'You have successfully logged out.');
});

/* GET the first page of application*/
router.get('/mainpage',function(req,res,next){
	var db = req.db;
	var collection = db.get('usercollection');
	if(req.session.sw){
		//get users' info
		collection.find({username:{$nin:['admin','']}},{password:0},function(e,doc){
			//get trip info
			db.get('usertrips').find({},{},function(e1,doc1){
				//get footprints info
				db.get('userfootprints').find({},{},function(e2,doc2){
					res.render('./pages/mainpage',{'user':req.session.sw,'approved':req.session.approved,'infolist':doc,'trips':doc1,'footprints':doc2});
				});
			});
		});
	}else{
		//if user did not log in
		var error = encodeURIComponent('Please login first');
		res.redirect('/?message='+error);						//put the error message in url
	}
});

/* GET the second page of application*/
router.get('/footprints',function(req,res,next){
	if(req.session.sw){
		var db = req.db;
		//get all footprints from db
		db.get('userfootprints').find({},{},function(e,doc){
			//get all users in the system
			db.get('usercollection').find({username: {$nin: ["admin",""]}},{fields: {password:0,approved:0,_id:0}},function(e,users){
				res.render('./pages/footprints',{'footprints':doc,'username':req.session.sw,'users':users});
			});
		});
	}else{
		//if user has not logged in
		var error = encodeURIComponent('Please login first');
		res.redirect('/?message='+error);
	}
})

router.get('/comments',function(req,res,next){
	if(req.session.sw){
		var db = req.db;
		db.get('usercomments').find({},{},function(e,doc){
			res.render('./pages/comments',{comments:doc,'user':req.session.sw});
		});
	}else{
		//if user has not logged in
		var error = encodeURIComponent('Please login first');
		res.redirect('/?message='+error);
	}
});

router.get('/trip/',function(req,res,next){
	var db = req.db;
	if(req.session.sw){
		db.get('usercollection').find({username:{$nin:["admin",""]}},{fields:{password:0,approved:0,_id:0}},function(e,doc){
			if(e){
				console.log(e);
				return;
			}
			res.render('./pages/trip',{'user':req.session.sw,'info':doc});
		});
	}else{
		var error = encodeURIComponent('Please login first');
		res.redirect('/?message='+error);
	}
});

router.get('/about/',function(req,res,next){
	if(req.session.sw){
		res.render('./pages/about');
	}else{
		loginError('Please login first');
	}
})

/* Handling user login*/
router.post('/login',function(req,res,next){
	var db = req.db;
	var collection = db.get('usercollection');
	var username = req.body.username;
	var password = req.body.password;
	collection.findOne({'username':username},function(e,doc){
		if(username&&doc&&doc.password===password){
			req.session.sw = username;
			req.session.approved = doc.approved;
			if(username==='admin'){
				res.redirect('./users/webmaster');
			}else if(doc.approved!=='no'){
				res.redirect('./mainpage');
			}else{
				res.render('./pages/pending')
			}
		}else{
			var error = 'incorrect username or password';
			res.redirect('/?message='+encodeURIComponent(error));
		}
	});
});

/*GET registration page*/
router.get('/register',function(req,res){
	var message = undefined;
	if(req.query.message){
		message = req.query.message;
	}
	res.render('./pages/register',{'message':message});
});

/*handle the registration request and get user's input*/
router.post('/register',function(req,res){
	var db = req.db;
	var username = req.body.username;
	var password = req.body.password;
	var geoX = req.body.geoX;					//geolocation x
	var geoY = req.body.geoY;					//geolocation y
	var geoLocation = req.body.geoLocation;		//geolocation description
	var country = req.body.country;
	var city = req.body.city;
	console.log("GeoLocation: "+geoLocation);
	var collection = db.get('usercollection');
	collection.findOne({"username":username},function(e,doc){
		if(e){
			return console.log('error');
		}
		if(doc){
			var error = encodeURIComponent('username exists');
			res.redirect('./register?message='+error);
		}
		else{
			collection.insert({
				'username' : username,
				'password' : password,
				'approved' : 'no',
				'geoX' : geoX,
				'geoY' : geoY,
				'geoLocation' : geoLocation,
				'country' : country,
				'city' : city
			},function(e,doc){
				req.session.sw = doc.username;
				updateSession(doc,req.session);
				res.redirect('/?message='+encodeURIComponent("You have successfully registered! Please sign in"));
			});
		}
	});
});

var findAllRecord = function(db,callback){
	db.get('usercollection').find({},{},function(e,doc){
		callback(e,doc);
	});
};

var updateSession = function(doc,session){
	for(property in doc){
		if(property==='password'){
			continue;
		}
		session[property] = doc[property];
	}
}

var loginError = function(msg){
	var msg = encodeURIComponent(msg);
	res.redirect('/?message='+msg);
}

module.exports = router;
