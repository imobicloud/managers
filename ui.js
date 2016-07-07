var Alloy = require('alloy');

function UIManager() {
	var cache = [],
		events = {};
	
	// PRIVATE FUNCTIONS ========================================================
	
	function emptyFunction() {}
	
	/*
	 params:
	  - url: ''
	  - data: null or {}
	  - reset: null, false or true: delete previous objects or not
	  - remove: null or 1, 2, ...: delete 1, 2, ... previous objects
	 * */
	function load(params) {
		Ti.API.info('UI Manager: Load ' + params.url + ': ' + JSON.stringify(params.data));
		
		var hasPrevious = cache.length > 0;
		
		// cleanup previous
		if (hasPrevious) {
			var prev = getCache(-1);
			prev._alreadyCleanup = true;
			prev.controller.cleanup();
		}
		
		// load new
		var controller = Alloy.createController(params.url, params.data);
		
		// apply default functions
		(controller.cleanup == null) && (controller.cleanup = emptyFunction);
		(controller.reload  == null) && (controller.reload  = emptyFunction);
		(controller.unload  == null) && (controller.unload  = emptyFunction);
		
		params.controller = controller;
		
		// cached new
		cache.push(params);
		
		fireEvent('ui:show', params);
		
		// TODO: Deprecated
		if (params.isReset != null) {
			params.reset = params.isReset;
			Ti.API.error('UI Manager: [isReset] parameter is deprecated.\nPlease use [reset] parameter instead.');
		}
		
		// delete previous
		if (hasPrevious) {
			if (params.reset) {
				splice(0, -1);
			} else if (params.remove) {
				splice(- params.remove - 1, params.remove);
			}
		}
		
		Ti.API.info('UI Manager: Cached ' + JSON.stringify( cache.length ));
	};
	
	function destroyObject(params) {
		if (params == null) { return; }
		
		var controller = params.controller;
		params._alreadyCleanup !== true && controller.cleanup(true);
		controller.unload();
		
		fireEvent('ui:hide', params);
	}
	
	/*
	 params: 
	  - data: new data for current object
	  - count: number of previous object will be deleted
	 * */
	function loadPrevious(data, count, isReload) {
		Ti.API.info('UI Manager: loadPrevious ' + JSON.stringify( data ));
		
		if (cache.length < 2) { return false; }
		
		// destroy current object
		// if count == null or count == 0, set count = 1
		!count && (count = 1);
		splice(cache.length - count, count);
		
		// reload previous
		if (isReload !== false) {
			var prev = getCache(-1);
			prev.controller.reload(data);
			prev._alreadyCleanup = false;
		}
		
		Ti.API.info('UI Manager: Cached ' + JSON.stringify( cache.length ));
		
		return true;
	};
	
	/*
	 return array if index is null
	 if index is negative: start is the last index - index
	 * */
	function getCache(index) {
		if (index == null) {
			return cache; 					// cache = [ { url: '', controller: object } ]
		} else if (index < 0) {
			index = cache.length + index;
		}
		
	  	return cache[index]; 				// cache = { url: '', controller: object }
	}
	
	/*
	 remove all object, except the objects after index [end]
	 if start is null: start is the last index
	 if start is negative: start is the last index - start
	 * */
	function remove(start, end) {
		// TODO: Deprecated
		Ti.API.error('UIManager: [remove] function is deprecated.\nPlease use [splice(start, count)] function instead.');
		
		if (start == null) {
			start = cache.length - 1;
		} else if (start < 0) {
			start = cache.length + start;
		}
		
		for (var i = end; i <= start; i++){
			destroyObject(cache[i]);
		};
		
		cache.splice(end, start - end + 1);
	}
	
	/*
	 splice objects from [start] - [count] to [start]
	 if [start] < 0: [start] is the [last] + [start]
	 if [count] is null or 0: [count] is 1
	 if [count] is negative: [count] is the last index - [count] 
	 * */
	function splice(start, count) {
		if (cache.length == 0) { return false; }
		
		if (start < 0) {
			start = cache.length + start;
		}
		
		if (count == null || count == 0) {
			count = 1;
		} else if (count < 0) {
			count = cache.length + count;
		}
		
		for (var i = start + count - 1; i >= start; i--) {
			destroyObject(cache[i]);
		};
		
		cache.splice(start, count);
		
		return true;
	}
	
	// delete all object
	// same as splice(0, -1)
	function reset() {
		if (cache.length == 0) { return false; }
		
		for (var i = cache.length - 1; i >= 0; i--) {
		  	destroyObject(cache[i]);
		};
		
		cache.length = 0;
		
		return true;
	}
	
	function on(type, callback) {
	  	if (events[type]) {
	  		events[type].push(callback);
	  	} else {
	  		events[type] = [callback];
	  	}
	  	
	  	return this;
	}
	
	function fireEvent(type, data) {
	  	var callbacks = events[type];
	  	if (callbacks) {
	  		for (var i = 0, ii = callbacks.length; i < ii; i++) {
				callbacks[i](data, { type: type });
			};
	  	}
	}
	
	// PUBLIC FUNCTIONS ========================================================

	return {
		on: on,
        getCache: getCache,
        load: load,
        loadPrevious: loadPrevious,
        remove: remove,
        splice: splice,
        reset: reset
    };
};

module.exports = UIManager;