const EventEmitter = require('events');
class EE extends EventEmitter{}
const rpg = new EE();
rpg.name="RPG";

rpg.on("load",(p,data)=>{
	console.log("RPG Mod loaded!");
});
rpg.on("unload",(p,data)=>{
	console.log("RPG Mod unloaded!");
});

rpg.commands = {
	rpg:{
		aliases: [],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		usage: "cmd <arg>",
		desc: "",
		run: (p, args, user, channel, event) => {
		}
	}
};
module.exports=rpg;
