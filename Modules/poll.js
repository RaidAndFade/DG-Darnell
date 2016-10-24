const EventEmitter = require('events');
class EE extends EventEmitter{}
const poll = new EE();
poll.name="Poll";

poll.commands = {
	
};
module.exports=poll;