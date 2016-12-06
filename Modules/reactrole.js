const EventEmitter = require('events');
class EE extends EventEmitter{}
const RR = new EE();
RR.name="ReactRoles";

var msgs = {};
RR.on("load",(p,data)=>{
	if(data.msgs)msgs=data.msgs;
	console.log("RR loaded!");
});
RR.on("unload",(p,data)=>{
	data.msgs=msgs;
	console.log("RR unloaded!");
});

RR.on("message_deleted", (p,msgId,channelId,event)=>{
	if(Object.keys(msgs).indexOf(msgId)!==-1){
		delete msgs[msgId];
		p.reply(event,"The message you deleted was a REACTROLE message.\nThat message has now been removed completely.",[true,30000]);
	}
});

RR.on("message_reaction_add",(p,event)=>{
	try{
	console.log(event);
	if(Object.keys(msgs).indexOf(event.d.message_id)!==-1){
		console.log(event);
		var msg = msgs[event.d.message_id];
		console.log(msg);
		if(msg.owner == event.d.user_id){ //It's the owner. Ask what role the emoji means.
			utils.sendTo(event.d.channel_id,"You have added the "+event.d.emoji.name+" emoji. What role does this represent?\nanswer with ;rrole "+(event.d.emoji.id==null?event.d.emoji.name:"<:"+event.d.emoji.name+":"+event.d.emoji.id+">")+" <role id or tag>",(e,d)=>{console.log(e,d)});
		}else{
			utils.sendTo(event.d.channel_id,""+msg.owner+" vs " +event.d.user_id+ " = "+(msg.owner == event.d.user_id),(e,d)=>{console.log(e,d)});
		}
	}
	}catch(e){console.log(e);}
});

RR.on("message_reaction_remove",(p,event)=>{
	console.log(event);
});

RR.commands = {
	reactroles:{
		aliases: ["rreact","rolereact"],
		allowed: (p,user,args,event,helpReq) => {
			return p.hasPerm(event,user,"MANAGE_ROLES");
		}, 
		parse: utils.combinate.all,
		usage: "reactrole <message>",
		desc: "Create a ReactRole message!",
		run: (p, args, user, channel, event) => {
			if(args[0]=="\"")args.splice(0,1);
			if(args[args.length-1]=="\"")args.splice(args.length-1,1);
			p.reply(event,args,(e,d)=>{
				msgs[d.id]={owner:user.id,emojis:{}};
				p.sendTo(channel,"A REACTROLE message has been sent!\n"+user.tag+" must now add reactions in order to be prompted for the role it represents.\n Delete the message to remove it.",[true,30000]);
			});
		}
	},
	raddrole:{
		aliases: ["rrole"],
		allowed: (p,user,args,event,helpReq) => {
			if(helpReq)return false;
			return p.hasPerm(event,user,"MANAGE_ROLES");
		}, 
		parse: utils.combinate.seq(utils.combinate.word.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.user),
		usage: "reactrole <message>",
		desc: "Create a ReactRole message!",
		run: (p, args, user, channel, event) => {
			console.log(args);
		}
	}
};
module.exports=RR
