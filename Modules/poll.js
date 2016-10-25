const EventEmitter = require('events')
class EE extends EventEmitter{}
const pollMod = new EE();
pollMod.name="Poll";

var polls = {};
pollMod.on("load",(p,data)=>{
	if(data.polls)polls=data.polls;
});
pollMod.on("unload",(p,data)=>{
	data.polls=polls;
});

pollMod.on("tick",p=>{
	for(var channel in polls){
		var poll_t = polls[channel];
		if((new Date()).getTime() - poll_t.la<3000)continue;
		if(poll_t.nv==0)continue;
		poll_t.la=(new Date()).getTime();
		utils.sendTo(channel,"Added "+poll_t.nv+" new votes to poll!");
		poll_t.nv=0;
	}
});

pollMod.commands = {
	newpoll:{
		aliases: ["startvote"],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		parse: utils.combinator.seq(utils.combinate.phrase,utils.combinate.space.or(utils.combinator.of("")),utils.combinator.seq(utils.combinate.phrase,utils.combinate.space.or(utils.combinator.of(""))).many()),
		usage: "startvote <question> <option1> <option2> <optionN>",
		desc: "Launch a vote!",
		run: (p, args, user, channel, event) => {
			var pollmsg = "```py\nA Poll has been started!\n'"+args[0]+"'\nOptions are :";
			console.log(args);
			var options = args[2];
			var optionId = 1;
			var optionList = [];
			for(var option of options){
				console.log(option);
				optionList[optionId]=option[0];
				pollmsg += "\n"+optionId+" : "+ option[0];
				optionId++;
			}
			pollmsg+="\nVote using 'vote <num>'\n```";
			p.reply(event,pollmsg);
			polls[channel] = {o:optionList,v:{},c:event.author.id,la:0,nv:0};
		}
	},
	pollstatus:{
		aliases: ["showvotes","votestatus"],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		},
		usage: "endvote",
		desc: "End a running vote!",
		run: (p, args, user, channel, event) => {
			if(!(channel in polls))return p.reply(event,"There is no poll in this channel.");
			var options = [];
			for(var optionId in polls[channel].o){
				var option = polls[channel].o[optionId];
				options[optionId-1]=[option,0];
			}
			var votes = polls[channel].v;
			for(var voteId in votes){
				var vote = votes[voteId];
				options[vote][1]++;
			}
			var replystr = "```py\nThe poll`s current votes:\n";
			var winningOption = ["Null",-1];
			for(var optionId in options){
				var option = options[optionId];
				if(option[1]>winningOption[1])winningOption=option;
				replystr += "\n"+optionId+" : '"+option[0]+"' has "+option[1]+" vote"+(option[1]==1?"":"s");
			}
			replystr+="\nThe winning option so far is '"+winningOption[0]+"'\n```";
			p.reply(event,replystr);
		}
	},
	endpoll:{
		aliases: ["endvote","stopvote"],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		usage: "endvote",
		desc: "End a running vote!",
		run: (p, args, user, channel, event) => {
			if(!(channel in polls))return p.reply(event,"There is no poll in this channel.");
			var bypassOwner = ((typeof p.bot.servers[event.guild_id]=="undefined")?user.id == p.owner:(user.id==p.bot.servers[event.guild_id].owner_id || user.id == p.owner));
			if(!bypassOwner&&polls[channel].c!=event.author.id)return p.reply(event,"You cannot end a poll you did not create!");
			var options = [];
			for(var optionId in polls[channel].o){
				var option = polls[channel].o[optionId];
				options[optionId-1]=[option,0];
			}
			var votes = polls[channel].v;
			for(var voteId in votes){
				var vote = votes[voteId];
				options[vote][1]++;
			}
			var replystr = "```py\nThe poll is now over:\n";
			var winningOption = ["Null",-1];
			for(var optionId in options){
				var option = options[optionId];
				if(option[1]>winningOption[1])winningOption=option;
				replystr += "\n"+optionId+" : '"+option[0]+"' has "+option[1]+" vote"+(option[1]==1?"":"s");
			}
			replystr+="\nThe winning option was '"+winningOption[0]+"'\n```";
			p.reply(event,replystr);
			delete polls[channel];
		}
	},
	vote:{
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		},
		parse: utils.combinate.digits,
		usage: "vote <optionId>",
		desc: "Vote for something in a poll!",
		run: (p, args, user, channel, event) => {
			console.log(polls);
			if(!(channel in polls))return p.reply(event,"There is no poll in this channel.");
			polls[channel].v[event.author.id]=args-1;
			polls[channel].nv++;
		}
	}
};
module.exports=pollMod;