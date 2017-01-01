const EventEmitter = require('events');
class EE extends EventEmitter{}
const timer = new EE();
const strtotime = require("strtotime");
timer.name="Timer";

var timers={};
var reminders={};
timer.on("load",(p,data)=>{
	if(data.reminders)reminders=data.reminders;
	if(data.timers)timers=data.timers;
	console.log("Timer loaded!");
});
timer.on("unload",(p,data)=>{
	data.reminders=reminders;
	data.timers=timers;
	console.log("Timer unloaded!");
});

function formatTime(sec,showSecs=false){
	min=0,hour=0,day=0,week=0,month=0,year=0;
	if(sec<60)showSecs=true;
	if(sec>31536000){year=~~(sec/31536000);sec=sec%31536000;}
	if(sec>2592000){month=~~(sec/2592000);sec=sec%2592000;}
	if(sec>604800){week=~~(sec/604800);sec=sec%604800;}
	if(sec>86400){day=~~(sec/86400);sec=sec%86400;}
	if(sec>3600){hour=~~(sec/3600);sec=sec%3600;}
	if(sec>60){min=~~(sec/60);sec=sec%60;}
	sec=~~sec;
	return	(year!=0?year+" Year"+(year==1?"":"s")+" ":"")+
			(month!=0?month+" Month"+(month==1?"":"s")+" ":"")+
			(week!=0?week+" Week"+(week==1?"":"s")+" ":"")+
			(day!=0?day+" Day"+(day==1?"":"s")+" ":"")+
			(hour!=0?hour+" Hour"+(hour==1?"":"s")+" ":"")+
			(!(min==0||showSecs)?min+" Min"+(min==1?"":"s")+" ":"")+
			(sec!=0&&showSecs?sec+" Sec"+(sec==1?"":"s")+" ":"");
}

timer.on("tick",(utils)=>{
	now = new Date().getTime();
	for(var channel in reminders){
		for(var reminderId in reminders[channel]){
			var reminder = reminders[channel][reminderId];
			if(reminder[0]-now<=0){
				var reminder = reminders[channel].splice(reminderId,reminderId+1)[0];
				console.log(reminder);
				console.log(reminder[1]-now);
				utils.sendTo(channel,"<@"+reminder[3]+"> You set a reminder "+formatTime(~~((now-reminder[1])/1000))+"ago: `"+reminder[2].replace(/`/g,"'")+"`");
			}
		}
	}
	for(var channel in timers){
		for(var timerId in timers[channel]){
			var timer = timers[channel][timerId];
			next = new Date(timer[2]).getTime();
			if(next-now<=0){
				timer[1] = parseInt(timer[1]);
				timer[2]=strtotime(timer[1]+" seconds");
				//utils.sendTo(timer[0],timer[3]);
				timers[channel][timerId]=timer;
			}
		}
	}
});

timer.commands = {
	remind:{
		aliases: ["reminder"],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		parse: utils.combinator.seq(utils.combinate.phrase.or(utils.combinator.of("")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.all.or(utils.combinator.of(""))),
		usage: "remind <time> <text>",
		desc: "Use this command to set up reminders",
		run: (p, args, user, channel, event) => {
			if(args[0]==""||args[2]=="")return p.reply(event,"Please set a proper time and a proper message");
			args[0] = args[0].replace(/s(ec(ond)?(s)?)?/gi,"seconds");
			args[0] = args[0].replace(/y(ear(s)?)?/gi,"years");
			args[0] = args[0].replace(/m(onth(s)?)?/gi,"months");
			args[0] = args[0].replace(/d(ay(s)?)?/gi,"days");
			args[0] = args[0].replace(/h(our(s)?)?/gi,"hours");
			args[0] = args[0].replace(/m(in(ute)?(s)?)?/gi,"minutes");
			args[0] = args[0].replace(/([0-9])([a-z])/gi,"$1 $2");
			args[0] = args[0].replace(/([a-z])([0-9])/gi,"$1 $2");
			remindtime = strtotime(args[0]);
			if(!remindtime)return p.reply(event,"Invalid time given!");
			now = new Date().getTime();
			delay = remindtime-now;
			delay /= 1000;
			if(!(channel in reminders))reminders[channel]=[];
			reminders[channel].push([remindtime,now,args[2],event.author.id]);
			p.reply(event,"Reminder set for "+formatTime(delay)+"from now");
		}
	},
	timer:{
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return p.hasPerm(event,user,"MANAGE_MESSAGES");
		}, 
		parse: utils.combinator.seq(utils.combinate.phrase.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of("")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of("")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of(""))),
		usage: "timer help",
		desc: "Use this command to set up timers",
		run: (p, args, user, channel, event) => {
			switch(args[0]){
				case "create":
					var id = args[2];
					var interval = args[4];
					var message = args[6];
					if(id=="")return p.reply(event,"Please make sure to enter a proper Id");
					if(interval=="")return p.reply(event,"Please make sure to enter a proper interval");
					if(message=="")return p.reply(event,"Please make sure to enter a proper message");
					console.log(event);
					var timerchan = event.guild_id?event.guild_id:channel;
					var textchan = channel;
					interval = interval.replace(/s(ec(ond)?(s)?)?/gi,"seconds");
					interval = interval.replace(/y(ear(s)?)?/gi,"years");
					interval = interval.replace(/m(onth(s)?)?/gi,"months");
					interval = interval.replace(/d(ay(s)?)?/gi,"days");
					interval = interval.replace(/h(our(s)?)?/gi,"hours");
					interval = interval.replace(/m(in(ute)?(s)?)?/gi,"minutes");
					interval = interval.replace(/([0-9])([a-z])/gi,"$1 $2");
					interval = interval.replace(/([a-z])([0-9])/gi,"$1 $2");
					now = new Date().getTime();
					next = strtotime(interval);
					delay = (next-now)/1000;
					if(delay<30)return p.reply(event,"Delay is way too short, Try at least 30s!");
					if(!(timerchan in timers))timers[timerchan] = {};
					timers[timerchan][id] = [textchan,delay,next,message];//Add the owner, so that not everybody can remove a timer.
					p.reply(event,"Timer `"+id+"` has been set!");
					break;
				case "list":
					var timerlist = "```py\nTimers on this server:\n";
					var timerchan = event.guild_id?event.guild_id:channel;
					if(Object.keys(timers[timerchan]).length==0)return p.reply(event,"This server actually has no timers!\nCreate one using `timer create`");
					for(var timerId in timers[timerchan]){
						var timer = timers[timerchan][timerId];
						var next = new Date(timer[2]).getTime();
						timerlist += "\t"+timerId+" ("+formatTime((next-now)/1000)+"Left)"+"\n";
					}
					timerlist+="```";
					p.reply(event,timerlist);
					break;
				case "remove":
					var timerchan = event.guild_id?event.guild_id:channel;
					var id = args[2];
					if(id==""||!(id in timers[timerchan]))return p.reply(event,"Please make sure to enter a proper Id.\nUse `timer list` to see a list of them!");
					delete timers[timerchan][id];
					p.reply(event,"Successfully removed the timer `"+id+"`");
					break;
				default:
					p.reply(event,"```py\nTimers are interesting creatures...\n\tList of commands:\ntimer create <id> <interval> <text> \n\t# Create a timer by the name of <id> that says <text> every <interval>\ntimer list\n\t# List all timers\ntimer remove <id>\n\t# Remove a timer\n```");
					break;
			}
		}
	}
};
module.exports=timer;
