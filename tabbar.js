// var Alloy = require('alloy');

/*
_args = {
	DEBUG: false
}
*/
function TabbarManager(_args) {
	if (_args == null) { _args = {}; }
	
	var activeTab,
		container,
		events = {},
		// isFirstLoad = true,
		UICaches = [];

	// PRIVATE FUNCTIONS ========================================================

	/*
	 args = {
		 container: Ti.UI.View,
		 tabs: [{
			 url: '',
			 data: null
		 }],
		 defaultTab: 0
	 }
	 * */
	function init(args) {
		container = args.container;

		// render tabs

		var UIManager = require('managers/ui'),
			arrayTab = args.tabs;

		for (var i = 0, ii = arrayTab.length; i < ii; i++) {
			container.add( Ti.UI.createView({ visible: false }) );

			//

			var tab = arrayTab[i],
				UICache = new UIManager(_args);

			UICache
				.on('ui:show', pageLoaded)
				.on('ui:hide', pageDestroy);

			UICache.load({
				tabIndex: i,
				url: tab.url,
				data: tab.data
			});

			UICaches.push(UICache);
		};

		setActiveTab(args.defaultTab || 0, true, true);

		//

		Ti.API.log('Tabbar Manager: Initialize!');
	};

	function pageLoaded(params, e) {
		fireEvent('page:show', params);

		var vTab = container.children[params.tabIndex],
			length = vTab.children.length;
		length && (vTab.children[ length - 1 ].visible = false);
		vTab.add( params.controller.getView() );
	}

	function pageDestroy(params, e) {
		fireEvent('page:hide', params);

		var vTab = container.children[params.tabIndex],
			length = vTab.children.length;
		length > 1 && (vTab.children[ length - 2 ].visible = true);
		vTab.remove( params.controller.getView() );
	}

	/*
	 params = {
		url: url,			// the url of the page
		data: data,			// data for that page
		reset: false,		// remove previous pages or not, default is false
		tabIndex: tabIndex	// tab index
	 }
	 * */
	function load(params) {
		Ti.API.log('Tabbar Manager: load Tab ' + params.tabIndex + ' - Page ' + params.url + ': ' + JSON.stringify(params.data));

		var tabIndex = params.tabIndex;

		// focus tab
		if (tabIndex != activeTab) {
			setActiveTab(tabIndex, false, false);
		}

		if (params.url) {
			// does not allow remove root window
			params.reset = false;

			UICaches[tabIndex].load(params);

			loadOrReloadTab(params);

			fireEvent('page:focus', params);

		} else if (params.reset) {
			var len = getCache(activeTab).length;
			if (len > 1) {
				loadPrevious(params.data, len - 1);
			} else {
				var current = getCache(activeTab, -1);
				loadOrReloadTab(current, params.data);
				current.controller.getView().visible = true;
			}
		}

		Ti.API.log('Tabbar Manager: Tab ' + tabIndex + ' - Cached ' + getCache(tabIndex).length);
	}

	/*
	 params:
	 - count: number of revious pages will be removed
	 - data: new data for current page, the reload function of current tab will be called
	 * */
	function loadPrevious(data, count, isReload) {
		var cache = getCache(activeTab, -(count || 1) - 1);
		
		if (cache._alreadyLoad !== true) {
			loadOrReloadTab(cache, data);
			isReload = false;
		}
		
		fireEvent('page:focus', cache);

		UICaches[activeTab].loadPrevious(data, count, isReload);

		Ti.API.log('Tabbar Manager: Tab ' + activeTab + ' - Cached ' + getCache(activeTab).length);
	};

	function getCache(tabIndex, cacheIndex) {
		(tabIndex === -1) && (tabIndex = activeTab);
		return UICaches[tabIndex].getCache(cacheIndex);
	};

	function getActiveTab() {
		return activeTab;
	};

	function loadOrReloadTab(cache, data) {
		if (cache == null) { return; }
		
		// reload current tab
		if (cache._alreadyLoad) {
			cache.controller.reload(data);
		}
		// or load
		else {
			cache._alreadyLoad = true;

			// TODO: Deprecated
			var init = cache.controller.init;
			if (init) {
				cache.controller.load = init;
				_args.DEBUG && Ti.API.error('Tabbar Manager: [exports.init] DEPRECATED in favor of [exports.load]');
			}

			var load = cache.controller.load;
			load && load(cache, data);
		}
	}

	function setActiveTab(tabIndex, willReload, willShowUp) {
		// cleanup previous tab
		if (activeTab != null) {
			var prev = getCache(activeTab, -1);
			if (prev._alreadyLoad) {
				prev.controller.cleanup();
			}
			prev.controller.getView().visible = false;
			container.children[activeTab].visible = false;
		}

		var current = getCache(tabIndex, -1);

		if (willShowUp !== false) {
			fireEvent('page:focus', current);
		}

		activeTab = tabIndex;

		container.children[tabIndex].visible = true;

		if (willReload !== false) {
			loadOrReloadTab(current);
		} 
		
		if (willShowUp !== false) {
			current.controller.getView().visible = true;
		}

		Ti.API.log('Tabbar Manager: Tab ' + tabIndex + ' focussed! ');
	}

	function checkReady(callback) {
	  	if (container) {
	  		callback();
	  	}
	}

	function exit() {
		checkReady(function(){

			var children = container.children;
			for (var i = UICaches.length - 1; i >= 0; i--) {
				UICaches[i].reset();
				container.remove(children[i]);
			};

			activeTab = null;
			container = null;
			events = null;
			UICaches = null;

			Ti.API.log('Tabbar Manager: Exit!');

		});
	};

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
		getActiveTab: getActiveTab,
		setActiveTab: setActiveTab,
		exit: exit
	};
}

module.exports = TabbarManager;
