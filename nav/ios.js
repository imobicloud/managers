exports.load = function load(win, nav, G) {
  	if (nav.titleControl) {
		win.titleControl = nav.titleControl;
	} else if (nav.titleImage) {
		win.titleImage = nav.titleImage;
	} else if (nav.title) {
		win.title = nav.title;
	}
	
	var leftNavButtons = nav.leftNavButtons;
	if (leftNavButtons != null) {
		if (leftNavButtons.length == 1) {
			win.leftNavButton  = createNavButton(leftNavButtons[0], G);
		} else {
			// win.leftNavButtons = createNavButtons(leftNavButtons, G);  //TODO: click event does not fire with leftNavButtons
			   win.leftNavButton  = createNavButtons(leftNavButtons, G);
		}
	}	
		
	var rightNavButtons = nav.rightNavButtons;
	if (rightNavButtons) {
		if (rightNavButtons.length == 1) {
			win.rightNavButton  = createNavButton(rightNavButtons[0], G);
		} else {
			// win.rightNavButtons = createNavButtons(rightNavButtons, G); //TODO: click event does not fire with rightNavButtons
			   win.rightNavButton  = createNavButtons(rightNavButtons, G);
		}
	}
};

function createNavButtons(params, G) {
	//TODO: click event does not fire with rightNavButtons
	/*
	var navButtons = [];
  	for(var i = params.length - 1; i >= 0; i--){
	  	navButtons.push( createNavButton(params[i], G) );
	};
	return navButtons;
	*/
	
	var view = Ti.UI.createView({ width: Ti.UI.SIZE, layout: 'horizontal' });
  	for(var i=0,ii=params.length; i<ii; i++){
  		var button = createNavButton(params[i], G);
	  	view.add(button);
	};
	return view;
}

function createNavButton(params, G) {
	if (params.callback) {
		var styles = _.omit(params, ['callback', 'icon']);
		!styles.backgroundImage && (styles.backgroundImage = 'NONE');
		
		var button;
		if (G) {
			button = G.UI.create('Button', styles);
		} else {
			button = Ti.UI.createButton(styles);
		}
		
		params.icon && (button.image = params.icon);
		button.addEventListener('click', params.callback);
		
		return button;
	} else {
		return params;
	}
}