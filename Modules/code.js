
const EventEmitter = require('events');
class EE extends EventEmitter{}
const code = new EE();
code.name="Eval";

code.commands={
	
};
module.exports=code;
