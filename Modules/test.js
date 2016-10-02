
const EventEmitter = require('events');
class EE extends EventEmitter{}
const test = new EE();
test.name="Testing";

var persistentVar="";
test.on("load",(p,data)=>{
	if(data.persistentVar)persistentVar=data.persistentVar;
	console.log("Example loaded!");
});
test.on("unload",(p,data)=>{
	data.persistentVar=persistentVar;
	console.log("Example unloaded!");
});


//test.on("message",(p,user,channelId,message,rawEvent)=>{console.log(user.id+" said "+rawEvent.d.id)});
//test.on("message_updated",(p,msgId,user,channelId,message,rawEvent)=>{console.log(user.id+" edited "+msgId)});
//test.on("message_deleted",(p,rawEvent)=>{console.log(user.id+" deleted "+rawEvent.d.id)});

function bitmaskToArr(bitmask){
	setBits=[];
	for(k=0;k<32;k++){
		if((bitmask&Math.pow(2,k))!=0)setBits[k+1]=true;
	}
	return setBits;
}

test.commands = {
	persistencytest: {
		aliases: ["tstpersist"],
		allowed: (p,user,args,event) => {
			return true;
		}, 
		usage: "persistencytest <new Var>",
		desc: "This command is a test command",
		run: (p, args, user, channel, event) => {
			//p.reply(event, JSON.stringify(p.bot));
			//p.reply(event, user.tag+" you said "+args.join(" "))
			p.reply(event,persistentVar);
			persistentVar=args.join(" ");
		}
	},
	test: {
		aliases: [],
		allowed: ()=>{return true;},
		usage: "test <return text>",
		parse: utils.combinate.all,
		desc: "This command is a test command",
		run: (p,args,user,channel,event)=>{
			p.reply(event,"returning : `"+args+"`");
		}
	},
	permissiontest: {
		aliases: [],
		allowed: (p, user, args, event)=>{
			console.log("Checking "+user.username+" if allowed to use PERMISSIONTEST");
			console.log("~PERMISSIONTEST BEGINS~");
			setTimeout(p.reply.bind(this,event,"You are "+(user.id==p.owner?"":"not ")+"the owner of this bot..."),0);
			setTimeout(p.reply.bind(this,event,"You are "+(user.id==p.bot.servers[p.bot.channels[event.channel_id].guild_id].owner_id?"":"not ")+"the owner of this server..."),2000);
			servUser=p.bot.servers[p.bot.channels[event.channel_id].guild_id].members[user.id];
			userRoles=[]
			outputRoles="";
			userPermissions=0;
			for(role of servUser.roles){
				userRoles.push(p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role]);
				outputRoles+=p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role].name+"\n";
				userPermissions=userPermissions|p.bot.servers[p.bot.channels[event.channel_id].guild_id].roles[role]._permissions;
			}
			setTimeout(p.reply.bind(this,event,"You are part of these groups (serverwide): ```py\n"+outputRoles+"\n```"),4000);
			setTimeout(p.reply.bind(this,event,"You have these perms (serverwide): ```py\n"+userPermissions+"\n```"),6000);
			userChanPerms=userPermissions;
			for(role of servUser.roles){
				console.log(p.bot.channels[event.channel_id].permissions.role[role]);
				if(!p.bot.channels[event.channel_id].permissions.role[role])continue;
				userChanPerms=userChanPerms|p.bot.channels[event.channel_id].permissions.role[role].allow;
				userChanPerms=userChanPerms^p.bot.channels[event.channel_id].permissions.role[role].deny;
			}
			setTimeout(p.reply.bind(this,event,"You have these perms (in this channel): ```py\n"+userChanPerms+"\n```"),8000);
			console.log("~PERMISSIONTEST ENDS~");
			return true;
			//setTimeout(p.reply.bind(this,event,"You are "+(user.id==p.owner?"":"not ")+"the owner of this bot"),4000);
			//setTimeout(p.reply.bind(this,event,"You are "+(user.id==p.owner?"":"not ")+"the owner of this bot"),5000);
		},
		usage:"permissiontest",
		desc:"Test your permissions.",
		run: (p,args,user,channel,event)=>{
			
		}
	}
} 

module.exports=test;
