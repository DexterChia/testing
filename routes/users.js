// Defines that JavaScript code should be executed in "strict mode".
//cannot use undeclared variables.
"use strict";

const func = require("../functions/features.js");
const v = require("../functions/validate.js");
const Joi = require("joi");

var express = require('express');
var router = express.Router();
var model = require('../models');  //put path const v = require("../sad/sdsds");
var Sequelize = require('sequelize'); 

const Op = Sequelize.Op;
const Worker = require("worker-middleware").Worker;


//test();
/*function test ()
{
	var w = new Worker();
	w.do(abc());
	w.do(function(context,next){
		console.log(context.user+"---");
		next();
	});
	w.do(abc());
	w.run(function(context,err){ 
		if(err)
			return console.log(err);

		console.log(context);
	});
	// var c = this.child(next);
	// c.run();
}*/
/*
function abc()
{
	return function(context,next){
			console.log("123");
			context.user ="a";
			next(); //to run next statement
		};

}*/
const log = require("debug")("app:job:user:log");
log.log = console.log.bind(console);

router.use(function (req, res, next){
	console.log("Hello World");
	// next(new Error("test"));
	next();
});

/* GET users listing. */
router.get('/', function(req, res, next) {
	  
	 // res.send('respond with a resource');
	res.json({ status : true });
});


//Joi validation Api
const schema = {
	register: {
		body: {
			username: Joi.string().min(1).max(10).required(),
			password: Joi.string().min(1).max(10).required()
		},
		options: {
			abortEarly: false,
			stripUnknown: true
		}
	},
	changePassword: {
		body: {
			password_old: Joi.string().min(1).max(255).required(),
			password_new: Joi.string().min(1).max(255).required(),
			password_repeat: Joi.any().valid(Joi.ref("password_new")).required().strip().options({
				language: {
					key: "Confirm password ",
					any: {
						allowOnly: "does not match"
					}
				}
			}),
		},
		options: {
			abortEarly: false,
			stripUnknown: true
		}
	}
};
//console.log(schema.register);

/* Register a player */
router.post('/add', function(req, res) 
{
	var username = req.body.username; 
    var password = req.body.password;
	
/*	var result = Joi.validate(req.body,schema.register.body,schema.register.options,function (err, value)
	{	// Gracefully handle any errors.
		if(err) 
		{
			console.log("err:"+err); 
			return res.send({status_code: 3, member_id:0+"",balance:0, balance2:0});
		}
		console.log(value);
	});*/

	//promise bluebird --> research
	//promise (asynchronous) .then
	//promise.all{
	//	func1
	//	func2

	//}.then()

	var w = new Worker(); 
	w.do(v.validateJoiRegister(req.body,schema.register.body,schema.register.options));
	w.do(func.register(username,password));
	w.run(function(context,err){ 
		if(err)
		{
			res.send({status_code: context.status_code, member_id:0,balance:context.balance, balance2:0});
			return console.log(err);
		}
		res.send(context);
	});

});

/* top up wallet*/
router.post('/authenticate/deposit', function(req, res) {
	console.log("--- Top Up --- ");

	var getAccessToken = req.query.access_token;
	var TopUpAmount = req.body.Amount; 
	var w = new Worker(); 
	w.do(v.validateAccessToken(getAccessToken));
	w.do(v.validateIsPostiveNum(TopUpAmount));
	w.do(func.walletBalance());
	w.do(func.TopUpWallet(TopUpAmount));
	w.run(function(context,err){ 
		if(err)
		{
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
			return console.log(err);
		}
		res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
	});
	
});

/* Withdraw wallet*/
router.post('/authenticate/withdraw', function(req, res) {
	//http://localhost:8000/user/list/12?username=123
	console.log("--- Withdrawal --- ");

	var getAccessToken = req.query.access_token;
	var WithdrawAmount = req.body.Amount; 

 	var w = new Worker();
 	w.do(v.validateAccessToken(getAccessToken));
	w.do(v.validateIsPostiveNum(WithdrawAmount));
	w.do(func.walletBalance());
	w.do(v.checkSufficientAmount(WithdrawAmount));
	w.do(func.WithdrawWallet(WithdrawAmount));
	w.run(function(context,err){ 
		if(err)
		{
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
			return console.log(err);
		}
		
		res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
	});
	
});

/* View specific players */
router.get('/view/', function(req, res)
{	
	console.log("--- View an user ---");

	var getAccessToken = req.query.access_token;

	//model.wallet.belongsTo(model.user, {as:"user_wallet",foreignKey:"user_id"});
	//model.user.hasMany(model.wallet, {as:"user_wallet",foreignKey:"user_id"});
 	var w = new Worker();
 	w.do(v.validateAccessToken(getAccessToken));
 	w.do(func.ViewUser());
	w.do(func.walletBalance());

	w.run(function(context,err){ 
		if(err)
		{
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
			return console.log(err);
		}
		
		res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
	});
});


/* BET */
router.get('/bet/', function(req, res)
{	
	console.log("--- BET ---");

	var getAccessToken = req.query.access_token;
	var getTicket_id = req.query.ticket_id;
	var getTotal_bet = req.query.total_bet; //in cent
	var getKey = req.query.key;
	var getGame_code = req.query.game_code;

	var w = new Worker();
 	w.do(v.validateAccessToken(getAccessToken));
	w.do(v.validateTicketId(getTicket_id));
	w.do(v.validateGameCode(getGame_code));
	w.do(v.validateIsPostiveNum(getTotal_bet));
	w.do(v.validateGameKey(getKey));
	w.do(func.walletBalance());
	w.do(v.checkSufficientAmount(getTotal_bet/100));

	w.do(func.Bet(getTotal_bet));
	w.do(func.deductTotalBet(getTotal_bet/100));

	w.run(function(context,err){ 
		if(err)
		{
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
			return console.log(err);
		}

		if(context.TypeOfGameCode == true)
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:(context.balance*100*100).toFixed(0), balance2:0, currency:context.currency});
		else
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:(context.balance*100).toFixed(0), balance2:0, currency:context.currency});
	});


});


/* Result on Bet */
router.get('/result/', function(req, res)
{	
	console.log("--- Result on Bet ---");

	var getAccessToken = req.query.access_token;
	var getTicket_id = req.query.ticket_id;
	var getTotal_win = req.query.total_win;
	var getGame_code = req.query.game_code;

	var w = new Worker();
 	w.do(v.validateAccessToken(getAccessToken));
	w.do(v.validateTicketId(getTicket_id));
	w.do(v.validateGameCode(getGame_code));
	w.do(v.validateIsPostiveNum2(getTotal_win));

	w.do(v.validateTransactionID());

	w.do(func.walletBalance());
	w.do(func.calTotalWin("",getTotal_win));
	w.do(func.updateBetResult(getTotal_win/100));
	w.do(func.topUpWinning(getTotal_win/100));

	w.run(function(context,err){ 
		if(err)
		{
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
			return console.log(err);
		}

		if(context.TypeOfGameCode == true)
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:(context.balance*100*100).toFixed(0), balance2:0, currency:context.currency});
		else
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:(context.balance*100).toFixed(0), balance2:0, currency:context.currency});
	});

});


/* Refund on Bet, cancel the latest bet*/
router.get('/refund/', function(req, res)
{	
	console.log("--- Result on Bet ---");

	var getAccessToken = req.query.access_token;
	var getTicket_id = req.query.ticket_id;
	var getGame_code = req.query.game_code;

	// if(!(getGame_code=="fish"||getGame_code=="jungle"||getGame_code=="bird"))
	// {
	// 	console.log("---> Invalid Game Code");
	// 	res.send({status_code: 4, member_id:0,balance:0, balance2:0, message:"Invalid game code."});
	// 	return;
	// }
	// else
	// {
	// 	var TypeOfGameCode = true;
	// }

	var w = new Worker();
 	w.do(v.validateAccessToken(getAccessToken));
	w.do(v.validateTicketId(getTicket_id));
	w.do(v.validateGameCode(getGame_code));
	w.do(v.validateTransactionID());
	w.do(func.walletBalance());
	w.do(func.updateRefundStatus());
	w.do(func.refundBet());

	w.run(function(context,err)
	{ 
		if(err)
		{
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
			return console.log(err);
		}

		if(context.TypeOfGameCode == true)
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:(context.balance*100*100).toFixed(0), balance2:0, currency:context.currency});
		else
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:(context.balance*100).toFixed(0), balance2:0, currency:context.currency});
	});
});


/* BET AND WIN API*/
router.get('/betandwin/', function(req, res)
{	
	console.log("--- BET and WIN ---");

	var getAccessToken = req.query.access_token;
	var getTicket_id = req.query.ticket_id;
	var getTotal_bet = req.query.total_bet; //in cent
	var getTotal_win = req.query.total_win; //in cent
	var getGame_code = req.query.game_code;

	if(getTotal_bet==0)
	{
		console.log("---> Bet must be greater than 0");
		res.send({status_code: 4,balance:0, balance2:0, message:"Bet must be greater than 0"});
		return;
	}

	var w = new Worker();
 	w.do(v.validateAccessToken(getAccessToken));
	w.do(v.validateTicketId(getTicket_id));
	w.do(v.validateGameCode(getGame_code));

	w.do(v.validateIsPostiveNum2(getTotal_win));
	w.do(v.validateIsPostiveNum2(getTotal_bet));
	w.do(func.walletBalance());
	w.do(v.checkSufficientAmount(getTotal_bet/100));
	w.do(func.calTotalWin(getTotal_bet,getTotal_win));
	w.do(func.BetAndResult(getTotal_bet,getTotal_win));
	w.do(func.deductTotalBet(getTotal_bet/100));
	w.do(func.topUpWinning(getTotal_win/100));

	w.run(function(context,err)
	{ 
		if(err)
		{
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:context.balance, balance2:0, currency:context.currency});
			return console.log(err);
		}

		if(context.TypeOfGameCode == true)
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:(context.balance*100*100).toFixed(0), balance2:0, currency:context.currency});
		else
			res.send({status_code: context.status_code, member_id:context.member_id+"",balance:(context.balance*100).toFixed(0), balance2:0, currency:context.currency});
	});
		
});


module.exports = router;