#!/usr/bin/env node

module.exports = (function(cb) {
	function get_prefix() {
		return ['[', (new Date()).toJSON(), ']', '-'];
	}

	return {
	    log: function(){
		    var args = Array.prototype.slice.call(arguments);
		    console.log.apply(console, get_prefix().concat(args));
		},
	    error: function(){
		    var args = Array.prototype.slice.call(arguments);
		    console.error.apply(console, get_prefix().concat(args));
		}
	};
})();
