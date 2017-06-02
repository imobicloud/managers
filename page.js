var Alloy = require('alloy');

/*
_args = {
	DEBUG: false
}
*/
function PageManager(_args) {
	if (_args == null) { _args = {}; }
	
	var UICache,
		container,
		events = {};
	
	// PRIVATE FUNCTIONS ========================================================
	
	/*
	args = {
		container: element,
	 	url: '',
	 	data: null
	}	
	 * */
	function init(args) {
	  	container = args.container;
	  	
	  	var UIManager = require('managers/ui');
		UICache = new UIManager(_args);
		UICache
			.on('ui:show', pageLoaded)
			.on('ui:hide', pageDestroy);
		
		args.url && load({
			url: args.url,
			data: args.data,
			reset: true
		});
	  	
	  	Ti.API.log('Page Manager: initialized');
	}
	
	function pageLoaded(params, e) {
		fireEvent('page:show', params);
		
		// make page visible
		var view = params.controller.getView();
		view.addEventListener('postlayout', pageVisible);
		container.add(view);
	}
	
	function pageDestroy(params, e) {
		fireEvent('page:hide', params);
		
		// hide page
		container.remove( params.controller.getView() );
	}
	
	function pageVisible(e) {
	  	e.source.removeEventListener('postlayout', pageVisible);
	  	var cache = getCache(-1);
	  	
	  	// TODO: Deprecated
	  	var init = cache.controller.init;
	  	if (init) {
	  		cache.controller.load = init;
	  		_args.DEBUG && Ti.API.error('Page Manager: [exports.init] DEPRECATED in favor of [exports.load].');
	  	}
	  	
	  	var load = cache.controller.load;
	  	load && load(cache);  
	}
	
	/*
	 params:
	  - url: the url of the page
	  - data: data for that page
	  - reset: remove previous page or not, default is false
	  - remove: remove n previous page from stack 
	 * */
	function load(params) {
		UICache.load(params);
	};
	
	/*
	 params: 
	  - count: number of revious pages will be removed
	  - data: new data for current page
	 * */
	function loadPrevious(data, count, isReload) {
	  	UICache.loadPrevious(data, count, isReload);
	};
	
	function getCache(index) {
	  	return UICache.getCache(index); 
	}
	
	function splice(start, count) {
		UICache.splice(start, count);
	}
	
	function reset() {
		UICache.reset();
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
	  		for(var i=0,ii=callbacks.length; i<ii; i++){
				callbacks[i](data, { type: type });
			};
	  	}
	}
	
	function getView() {
	  	return container;
	}
	
	// PUBLIC FUNCTIONS ========================================================
	
	return {
		init: init,
		on: on,
		load: load,
		loadPrevious: loadPrevious,
		getCache: getCache,
		getView: getView,
		reset: reset
	};
}
module.exports = PageManager;
