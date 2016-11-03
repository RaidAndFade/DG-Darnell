const EventEmitter = require('events');
const MathJs = require("mathjs");
class EE extends EventEmitter{}
const math = new EE();
math.name="Math";

function Shuffle(o) {
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

scope={};

math.commands={
	random: {
		aliases: ["pick"],
		allowed: (p,user,args,event,helpReq) => {
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
	},
	math: {
		aliases: [],
		allowed: ()=>{return true;},
		usage: "math <Equation>",
		desc: "Solve a math equation",
		parse: utils.combinator.all,
		run: (p, args, user, chan, event) => {
			if(!scope[user.id]){
				scope[user.id]={};
			}
			var reply = ""+MathJs.compile(args).eval(scope[user.id]);
			if(reply.indexOf("function ")!==-1)return p.reply(event,"Invalid expression!");
			p.reply(event,reply);
		}
	},
	mathvars: {
		aliases: ["mvars","mathlistvars","mathscope","mathviewscope","mscope","mviewscope"],
		allowed: ()=>{return true;},
		usage: "mathVars",
		desc: "Get a list of all of your set variables",
		parse: utils.combinator.all,
		run: (p, args, user, chan, event) => {
			console.log(scope);
			if(!scope[user.id]){
				scope[user.id]={};
			}
			resp = "```py\n";
			vars = "";
			for(var k in scope[user.id]){
				var v = scope[user.id][k];
				vars += k+" = "+v+"\n";
			}
			if(vars=="")vars="No variables set.";
			resp +=vars;
			resp +="\n```";
			p.reply(event,resp);
		}
	},
	mathclear: {
		aliases: ["mclear","mclearscope"],
		allowed: ()=>{return true;},
		usage: "mathClear",
		desc: "Clear all of your set variables",
		parse: utils.combinator.all,
		run: (p, args, user, chan, event) => {
			scope[user.id]={};
			p.reply(event,"Your scope has been cleared");
		}
	},
	mathunit: {
		aliases: ["munit"],
		allowed: ()=>{return false;},
		usage: "mathClear",
		desc: "create custom units!",
		parse: utils.combinator.seq(utils.combinate.phrase.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of("")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.all.or(utils.combinator.of(""))),
		run: (p, args, user, chan, event) => {
			
		}
	}
	//TODO : add custom units? :O
}
module.exports=math;