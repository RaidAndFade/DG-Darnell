const EventEmitter = require('events');
class EE extends EventEmitter{}
const rng = new EE();
rng.name="Random";
function Shuffle(o) {
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

rng.commands={
	random: {
		aliases: ["pick"],
		allowed: (p,user,args,event) => {
			return true;
		},
		usage: "random <choice1> <choice2>",
		desc: "Pick a random choice from a list",
		parse: utils.combinator.seq(utils.combinate.phrase,utils.combinate.space.or(utils.combinator.of(""))).many(),
		run: (p, args, user, channel, event) => {
			choices = [];
			console.log(args);
			for(choice of args){
				choices.push(choice[0]);
				console.log(choice);
			}
			choices.sort(function() { return 0.5 - Math.random() });
			choice = choices[0];
			p.reply(event,"I picked `"+choice+"` for you.");
		}
	}
}
module.exports=rng;