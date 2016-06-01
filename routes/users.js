var express = require('express');
var ObjectId = require('mongodb').ObjectID;	//MongoDB delete by ID!!!!!!!!
var router = express.Router();
/* GET users listing. */

router.get('/',function(req,res,next){
	var db = req.db;
	var collection = db.get('usercollection');
	var string = req.query.username;
	var query = string.split(';');
	var username = query[0];
	var password = query[1].replace('password=','');
	collection.findOne({'username':username},function(e,doc){
		if(doc&&doc.password===password){
			req.session.sw = username;
			res.redirect('../mainpage');
		}else{
			var error = encodeURIComponent('incorrect password');
			res.redirect('../?message='+error);
		}
	});
});


router.get('/webmaster',function(req,res,next){
	if(req.session.sw==='admin'){
		var db = req.db;
		var collection = db.get('usercollection');
		collection.find({},{},function(e,doc){
			res.render('./pages/webmaster',{'userlist':doc});
		});	
	}else{
		var error = 'invalid webmaster';
		res.redirect('/?message='+encodeURIComponent(error));
	}

});

router.get('/personalinfo',function(req,res,next){
	if(req.session.sw){
		var db = req.db;
		db.get('usercollection').findOne({'username':req.session.sw},function(e,doc){
			res.render('./pages/personalinfo',{'info':doc});
		});
	}else{
		var error = 'please login first';
		res.redirect('/?message='+encodeURIComponent(error));
	}

});

router.delete('/deleteuser/:username',function(req,res){
	var db = req.db;
	var username = req.params.username;
	db.get('usercollection').remove({
		'username':username},function(e,doc){
			res.send((e===null)?{msg:''}:{msg:e});
		});
});

router.post('/approveuser/:username',function(req,res){
	var db = req.db;
	var username = req.params.username;
	console.log("Approved user: "+username);
	db.get('usercollection').update({'username':username},
		{$set: {'approved':'yes'}}, //update only selected field;
		function(e,doc){
			res.send((e===null)?{msg:''}:{msg:e});
		});
});

/*update userinfo*/
router.post('/updateinfo/',function(req,res){
	var db = req.db;
	var username = req.session.sw;
	var data = req.body;
	console.log("About to change "+username+"'s information!");
	db.get('usercollection').update({'username':username},
		{$set:{
			'geoX':data.geoX,
			'geoY':data.geoY,
			'country':data.country,
			'city':data.city,
			'geoLocation':data.geoLocation,
			'job':data.job,
			'hobby':data.hobby
		}},
		function(e,doc){
			res.send((e===null)?{msg:''}:{msg:e});
		});
});

/*update user password*/
router.post('/updatepwd/',function(req,res){
	var db = req.db;
	var username = req.session.sw;
	var pwd = req.body.originalPwd;
	console.log("About to change "+username+"'s password!");
	db.get('usercollection').update({'username':username,'password':pwd},
		{$set:{
			'password':req.body.newPwd
		}},
		function(e,doc){
			if(doc===0){
				res.send({msg:"Original password is incorrect!"});
			}else{
				res.send((e===null)?{msg:''}:{msg:e});
			}
		});
});

/*Retrieve user information*/
router.get('/getuserinfo/:username',function(req,res){
	if(req.session.sw){
		var db = req.db;
		var username = req.params.username;
		console.log("Retrieving "+username+" info...");
		db.get('usercollection').findOne({"username":username},function(e,doc){
			if(e===null){
				var data = {};
				for(x in doc){
					if(x!=='password'&&x!=='_id'){
						data[x] = doc[x];
					}
				}
			}
			console.log(data);
			res.send((e===null)?{msg:data}:{error:e});
		});
	}
});

router.delete('/deletefootprint/:id',function(req,res){
	if(req.session.sw){
		var db = req.db;
		var id = req.params.id;
		console.log("Deleting footprint: "+id+"...");
		db.get('userfootprints').remove({
			_id:ObjectId(id)
		},function(e,doc){
			res.send((e===null)?{msg:''}:{msg:e});
		})
	}
});

router.post('/addfootprint/',function(req,res){
	var username = req.session.sw;
	var db = req.db;
	var data = req.body;
	db.get('userfootprints').insert({
		'username':username,
		'date':data.date,
		'title':data.title,
		'content':data.content,
		'users': data.users,
		'geoX': data.geoX,
		'geoY': data.geoY,
		'location': data.location
	},function(e,doc){
		res.send((e===null)?{msg:''}:{msg:e});
	});
});

router.post('/addcomment/',function(req,res){
	var username = req.session.sw;
	var db = req.db;
	var data = req.body;
	db.get('usercomments').insert({
		'username':username,
		'comment':data.comment,
		'time':data.time,
		'anounymous':data.anounymous
	},function(e,doc){
		res.send((e===null)?{msg:''}:{msg:e});
	});
});

router.post('/addtrip/',function(req,res){
	var db = req.db;
	var data = req.body;
	db.get('usertrips').insert({
		'username':req.body.username,
		'destination':req.body.destination,
		'friends': req.body.friends,
		'time': req.body.time
	},function(e,doc){
		console.log("Trip added:");
		console.log(data);
		res.send((e===null)?{msg:''}:{msg:e});
	})
});

router.get('/trips/',function(req,res){
	if(req.session.sw){
		var username = req.session.sw;
		var db = req.db;
		db.get('usertrips').find({'username':username},function(e,doc){
			res.send((e===null)?{msg:doc}:{error:e})
		})
	}
});

router.delete('/deletetrip/:id',function(req,res){
	if(req.session.sw){
		var id = req.params.id;
		var db = req.db;
		console.log("Deleting trip with id "+id);
		db.get('usertrips').remove({_id:ObjectId(id)},function(e,doc){
			res.send((e===null)?{msg:''}:{msg:e});
		});
	}
});

router.delete('/deletecomment/',function(req,res){
	if(req.session.sw){
		var db = req.db;
		console.log("Deleting a comment left at "+req.body.time);
		db.get('usercomments').remove({
			'username':req.body.username,
			'time':req.body.time
		},function(e,doc){
			res.send((e===null)?{msg:''}:{msg:e});
		})
	}
});
module.exports = router;
