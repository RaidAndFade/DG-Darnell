//TODO ~ Combine this with RPG module when that module is complete 
//TODO ~ line 65.
//TODO ~ Center the top bar

const EventEmitter = require('events');
class EE extends EventEmitter{}
const fc = new EE();
fc.name="FightClub";


var config = {
	maxHealth : 99,
	dmgMin : 1,
	dmgMax : 10,
	healthBarCount : 10
}

var fights = {};
fc.on("load",(p,data)=>{
	console.log("FightClub loaded!");
});
fc.on("unload",(p,data)=>{
	console.log("FightClub unloaded!");
});

var template = "```diff"+
"\n{user1}vs.{user2}"+
"\n> [{health1BAR}] {health1}/{maxhp1} | {health2}/{maxhp2} [{health2BAR}] <";
var templateSUFF = "\n```";

var damageTEMPLATES = [
	"- {user1} has attacked {user2} for -{amount} damage.",
	"- {user1} verbally abused {user2}... -{amount} emotional damage.",
	"- {user1} hired a hitman to kill {user2}, The hitman tried but only did -{amount} damage.",
	"- {user2} just caught a grenade for {user1}, dealing -{amount} damage.",
	"- PICHAKU! {user1} choses you! Cast lightning rod for -{amount} damage!",
	"- {user1} has forced {user2} to study scientology, -{amount} mental damage.",
	"- {user1} just used trinity's force, dealing tons(-{amount}) of damage."
];
var healTEMPLATES = [
	"+ {user1} has used a HEALTH POTION for +{amount} health.",
	"+ {user1} just got healed by the local priest, +{amount} health.",
	"+ {user1} just ate some spinach, +{amount} health!",
	"+ {user1} just had PB&J, +{amount} health"
];
var finishedTEMPLATES = [
	"> {user1} has defeated {user2} in combat!",
	"> A victor has been revealed, {user1}!",
	"> {user2} has fled! {user1} wins this time."
];

var bar = "█"; // Have 10 of these boys

//Fight should tick once every 2 seconds.
function tickFight(channel){
	var fight = fights[channel];
	var resp = template;
	
	var user1 = fight[2][0].username.toUpperCase();
	resp = resp.replace(/{user1}/g,utils.pad(user1,20));
	
	if(fight[2][1]!=-1)var user2 = fight[2][1].username.toUpperCase();	
	else var user2 = "OPPONENT";
	resp = resp.replace(/{user2}/g,utils.pad(user2,20," ",true));
	
	if(fight[4]==-1){
		fight[4]=Math.round(Math.random());
		fights[5]+=[fight[4]]
	}
	
	//Only show past 5 events.
	fight[5].reverse();
	fight[5] = fight[5].slice(0,3);
	fight[5].reverse();
	
	var heal = (Math.random()<0.2&&fight[0][fight[4]]<config.maxHealth); //20% chance to heal, only if not max health.
	
	var amount = Math.round(Math.random()*config.dmgMax+config.dmgMin); //Random number between min and max, set in config.
	
	//Make sure they don't overheal
	amount = heal?(Math.min(amount,(config.maxHealth-Math.min(fight[0][fight[4]]+amount,config.maxHealth)))):amount;	
	//TODO FIX THIS ^^^^
	
	var msgList = (heal?healTEMPLATES:damageTEMPLATES);
	
	var message = msgList[Math.round(Math.random()*(msgList.length-1))];
	
	fight[5].push([fight[4],message,amount]);
	
	if(!heal)fight[0][fight[4]] -= amount;
	
	if(!(fight[0][0]>0&&fight[0][1]>0)){
		var finished = finishedTEMPLATES[Math.round(Math.random()*(finishedTEMPLATES.length-1))];
		fight[5].push([fight[4],finished,-1]);
	}
	
	fight[4] = fight[4]?0:1;	
	
	if(heal)fight[0][fight[4]] += amount;
	
	var health1 = fight[0][0];
	
	resp = resp.replace(/{health1}/g,utils.pad(health1,2," ",true));
	resp = resp.replace(/{maxhp1}/g,utils.pad(config.maxHealth,2," ",true));
	
	var health1BARpct = fight[0][0]/config.maxHealth;
	var health1BAR = "";
	
	var numBARS = Math.round(health1BARpct*config.healthBarCount);
	while(numBARS-->0)
		health1BAR+=bar;
	while(health1BAR.length<config.healthBarCount)
		health1BAR+=" ";
	
	resp = resp.replace(/{health1BAR}/g,health1BAR);
	
	var health2 = fight[0][1];
	
	resp = resp.replace(/{health2}/g,utils.pad(health2,2," ",true));
	resp = resp.replace(/{maxhp2}/g,utils.pad(config.maxHealth,2," ",true));
	
	var health2BARpct = fight[0][1]/config.maxHealth;
	var health2BAR = "";
	
	var numBARS = Math.round(health2BARpct*config.healthBarCount);
	while(numBARS-->0)
		health2BAR=bar+health2BAR;
	while(health2BAR.length<config.healthBarCount)
		health2BAR=" "+health2BAR;
	
	resp = resp.replace(/{health2BAR}/g,health2BAR);
	
	var events = "";
	for(var action of fight[5]){
		var actionText = action[1];
		actionText = actionText.replace(/{user1}/g,action[0]?user1:user2);
		actionText = actionText.replace(/{user2}/g,action[0]?user2:user1);
		actionText = actionText.replace(/{amount}/g,action[2]);
		events += "\n"+actionText;
	}
	resp += events+templateSUFF;
	
	console.log(fight[5]);
	
	utils.editMSG(channel,fight[3],resp);
	
	//Manual GC
	delete user1;
	delete user2;
	delete heal;
	delete amount;
	delete msgList;
	delete message;
	delete health1;
	delete health1BAR;
	delete health1BARpct;
	delete health2;
	delete health2BAR;
	delete health2BARpct;
	delete numBARS;
	
	if(fight[0][0]>0&&fight[0][1]>0){
		setTimeout(tickFight.bind(null,channel),2000);
	}else{
		delete fights[channel];
	}
}

fc.commands = {
	fight:{
		aliases: ["duel"],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		parse: utils.combinate.user.or(utils.combinator.of("-1")),
		usage: "fight <@opponent>",
		desc: "Fight someone!",
		run: (p, args, user, channel, event) => {
			if(args == "-1")
			return p.reply(event,"Initiating a fight between "+user.tag+" and a random opponent",((p,e,d)=>{	
				if(channel in fights)return p.reply(event,"There is already a fight in progress in this channel!");
				var healthVar = [config.maxHealth,config.maxHealth];
				var users = [user,-1];
				fights[channel] = [healthVar, channel, users, d.id, -1, []];
				tickFight(channel);
			}).bind(this,p));
			p.reply(event,"Initiating a fight between <@"+args+"> and "+user.tag,((p,e,d)=>{	
				if(channel in fights)return p.reply(event,"There is already a fight in progress in this channel!");
				if(!(args in p.bot.users))return p.reply(event,"That user is not found!");
				var healthVar = [config.maxHealth,config.maxHealth];
				var users = [user,p.bot.users[args]];
				fights[channel] = [healthVar, channel, users, d.id, -1, []];
				tickFight(channel);		 
			}).bind(this,p));
		}
	}
};
module.exports=fc;
