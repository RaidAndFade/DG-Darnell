const EventEmitter = require('events');
class EE extends EventEmitter{}
const moderation = new EE();
moderation.name="My Module";

moderation.on("load",(p,data)=>{
	console.log("Moderation loaded!");
});
moderation.on("unload",(p,data)=>{
	console.log("Moderation unloaded!");
});

moderation.commands = {
  
};
module.exports=moderation;
