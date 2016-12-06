const EventEmitter = require('events');
class EE extends EventEmitter{}
const events = new EE();
events.name="Events";

events.on("load",(p,data)=>{
	console.log("Module loaded!");
});
events.on("unload",(p,data)=>{
	console.log("Module unloaded!");
});

events.on("any_mod_event",(e)=>{

});

events.commands = {
	event:{
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return p.hasPerm(event,user,"ADMINISTRATOR");
		},
		usage: "event <arg>",
		desc: "Manage the events of a channel",
		run: (p, args, user, channel, event) => {

		}
	}
};
module.exports=events;
