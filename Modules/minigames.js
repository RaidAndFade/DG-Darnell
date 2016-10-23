
const EventEmitter = require('events');
class EE extends EventEmitter{}
const minigames = new EE();

var tttgames = [];
var tttplayers = {};

function tttTile(index,tileId){
	return [" "+index+" "," X "," O "][tileId+1];//Potentially do index+1 for cleaner UI.
}

function tttNTurn(tttGame){
	//tttIsGameOver();
	if(tttGame.players.length<2&&!tttGame.players[tttGame.turn]){
		setTimeout(tttPickLoc.bind(this,tttGame,"",Math.floor(Math.random()*9-0.1)),10);//Optimize this.
		return;
	}
	utils.sendTo(tttGame.players[tttGame.turn],"It is your turn to go,\n Here's the board:\n"+
		"```\n    |   |   "+
		"\n "+tttTile(0,tttGame.board[0])+"|"+tttTile(1,tttGame.board[1])+"|"+tttTile(2,tttGame.board[2])+" \n----|---|----\n"+
		" "+tttTile(3,tttGame.board[3])+"|"+tttTile(4,tttGame.board[4])+"|"+tttTile(5,tttGame.board[5])+"\n----|---|----\n"+
		" "+tttTile(6,tttGame.board[6])+"|"+tttTile(7,tttGame.board[7])+"|"+tttTile(8,tttGame.board[8])+"\n    |   |\n```\nPick the number you want to play at by using the command \n`"+(utils.chanData[tttGame.players[tttGame.turn]]?utils.chanData[tttGame.players[tttGame.turn]].settings.comInit:utils.chanData.def.settings.comInit)+"ttt <id>`"
	);
}

function tttPickLoc(tttGame,event,loc){//Potentially do loc-1 for cleaner UI.
	if(tttGame.board[loc]!=-1){
		if(event=="")
			setTimeout(tttPickLoc.bind(this,tttGame,"",Math.floor(Math.random()*9-0.1)),10);
		else
			utils.reply(event,"That spot is taken!");
		return;
	}
	else tttGame.board[loc]=tttGame.turn;
	tttGame.turn=tttGame.turn==0?1:0;
	tttNTurn(tttGame);
}

function tttBotMatch(p,event){
	var turn = Math.floor(Math.random()*2-0.1);
	var index = tttgames.push({board:[-1,-1,-1,-1,-1,-1,-1,-1,-1],turn:turn,players:[event.author.id]})-1;
	tttplayers[event.author.id]=index;
	p.reply(event,"Opponent not found! Bot game started.\nRandomly chosen, \nYou are player 1,\nA coin has been tossed, "+(turn==0?"You go":"The bot goes")+" first.");
	tttNTurn(tttgames[index],event);
}

function tttLeaveMatch(p,event,user){
	var delg = tttgames.splice(tttplayers[user],1)[0];
	console.log(delg);
	var players = delg.players;
	players.splice(players.indexOf(user),1);
	var opponent = players[0];
	delete tttplayers[user];
	if(opponent)delete tttplayers[opponent];
	if(opponent)p.sendTo(opponent,"Your opponent has left your Tic-Tac-Toe match!\nYou win by process of elimination!");
	p.sendTo(user,"You have abandoned a Tic-Tac-Toe match!");
}


minigames.name="Minigames";
minigames.commands = {
	tictactoe:{
		aliases: ["ttt","gttt","tttgame"],
		allowed: (p,user,args,event,helpReq) => {
			return true;
		}, 
		usage: "ttt help",
		desc: "Play Tic-Tac-Toe against a bot or with a friend!",
		parse: utils.combinator.seq(utils.combinate.word.or(utils.combinator.of("help")),utils.combinate.space.or(utils.combinator.of("")),utils.combinate.phrase.or(utils.combinator.of(""))),
		run: (p,args,user,channel,event) => {
			console.log(args);
			var subcom = args[0];
			args.shift();
			args.shift();
			console.log(args);
			var isDMs = typeof event.guild_id === 'undefined';
			switch(subcom){
				default:
					if(!isNaN(subcom)){
						if(!(event.author.id in tttplayers))return p.reply(event,"You are not playing a game!");
						tttPickLoc(tttgames[tttplayers[event.author.id]],p,subcom);
						break;
					}
				case "help":
					p.reply(event,"```\n"+
						"ttt play <@opponent> : Play versing an opponent, or AI if no tag.\n"+
						"ttt <slot#> : Play your turn in the slot number\n"+
						"ttt leave : Leave your current game\n"+
						"```");
					break;
				case "play":
					if(event.author.id in tttplayers)return p.reply(event,"You are already playing a game!");
					if(args[0]==""||!(args[0].includes("<@")&&args[0].includes(">"))){
						console.log(event);
						tttBotMatch(p,event);
						break;
					}
					p.bot.getMember({serverID:p.bot.channels[chan].guild_id,userID:args[0].replace("<@","").replace("!","").replace(">","")},function(err,res){
						if(err){
							tttBotMatch(p,event);
						}
						var opponent = res;
						//TODO Multiplayer
						console.log(opponent);
					});
					break;
				case "leave":
					//Alert opponent later.
					tttLeaveMatch(p,event,event.author.id);
					break;
			}
		}
	}
}
module.exports=minigames;