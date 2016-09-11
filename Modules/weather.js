const weatherjs = require("weather-js");
const EventEmitter = require('events');
class EE extends EventEmitter{}
const weather = new EE();
weather.name="Weather";

//weather.on("load",(p)=>{});
//weather.on("message",(p,user,channelId,message,rawEvent)=>{console.log(user.id+" said "+rawEvent.d.id)});
//weather.on("message_updated",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" edited "+msgId)});
//weather.on("message_deleted",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" deleted "+msgId)});

weather.commands = {
	forecast: {
		parse: utils.combinator.seq(utils.combinate.phrase,utils.combinate.space.or(utils.combinator.of("")),utils.combinate.letter.or(utils.combinator.of("C"))),	
		usage: "forecast \"city\" <C/F>",
		desc: "Get the five day forecast of an area",
		run: (p, args, user, channel, event) => {
		  //The city is given in args[0].
			args.splice(1,1);
			console.log(args);
			if(!args[1])args[1]="c";
		  	args[1]=args[1].toLowerCase();
		  	if(args[1]!="c"&&args[1]!="f")args[1]="c";
		  	weatherjs.find({search: args[0], degreeType: args[1].toUpperCase()}, function(err, result) {
				if(err) console.log(err);
			forecast = "```py\nFive day weather forecast for '"+result[0].location.name+"'\nDay                      | Low   | High  | Forecast\n";
				for(dayk in result[0].forecast){
					day = result[0].forecast[dayk];
					forecast += utils.pad(day.day,24)+" | "+utils.pad(day.low,3)+"°"+result[0].location.degreetype+" | "+utils.pad(day.high,3)+"°"+result[0].location.degreetype+" | "+day.skytextday+"\n";
				}
				forecast += "```";
				utils.reply(event,forecast);
			});
		}
	},
	weather: {
		parse: utils.combinator.seq(utils.combinate.phrase,utils.combinate.space.or(utils.combinator.of("")),utils.combinate.letter.or(utils.combinator.of("C"))),	
		usage: "weather \"city\" <C/F>",
		desc: "Get the current of an area",
		run: (p, args, user, channel, event) => {
		  //The city is given in args[0].
			args.splice(1,1);
			console.log(args);
			if(!args[1])args[1]="c";
		  	args[1]=args[1].toLowerCase();
		  	if(args[1]!="c"&&args[1]!="f")args[1]="c";
		  	weatherjs.find({search: args[0], degreeType: args[1].toUpperCase()}, function(err, result) {
				if(err) console.log(err);
				text = "```py\nCurrent weather in '"+result[0].location.name+"'\n"+
					"Right now it is: "+result[0].current.temperature+"°"+result[0].location.degreetype+"\n"+
					"Though, it feels like: "+result[0].current.feelslike+"°"+result[0].location.degreetype+"\n"+
					"Humidity: "+result[0].current.humidity+"% | Wind Speed: "+result[0].current.windspeed+"\n";
				today = result[0].forecast[0];
				text +="Today is forecasted to be '"+today.skytextday+"' with a low of "+today.low+"°"+result[0].location.degreetype+" and a high of "+today.high+"°"+result[0].location.degreetype+"\n";
				text +="```";
				utils.reply(event,text);
			});
		}
	}
} 

module.exports=weather;
