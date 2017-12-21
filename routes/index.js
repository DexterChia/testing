var express = require('express');
var router = express.Router();
var model = require('../models');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', function(req, res) {
	
    var password = req.body.password;
	var email = req.body.email;

	console.log("-- Login Page --");  // print 12

	model.players.findOne({where : {p_email: email}}).then(function(user)
	{
		if(user)
		{  //if got this user, then check for the password
			console.log("123");
			console.log(user);
			
			// why user.findOne cannot work - saying findOne if not a function)
			model.players.findOne({where: {p_password:password}}).then(function(result)
			{
				if(result)
				{
					console.log("---> Yes! Login successfully");
					res.send({code: 200, error: false, message:"Yes! Login success!"});
				}
				else
				{
					console.log("---> Password incorrect!");
					res.send({code: 404, error: true, message:"Password incorrect!"});
					return;
				}
				
			});
		}
		else
		{	
	
			console.log("---> This user is not exist!");
			res.send({code: 404, error: true, message:"This user is not exist!"});
		}
	});
	
});

module.exports = router;
