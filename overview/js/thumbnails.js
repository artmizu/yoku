"use strict";

var page = require('webpage').create();
var system = require('system');
var url = system.args[1];
var name = system.args[2];

page.viewportSize = { 
    width: 1300,
    height: 900
};

page.clipRect = {
    top: 0,
    left: 0,
    width: 1300,
    height: 900
};

page.open(url, function(status) {
    if (status !== 'success') {
        console.log('Unable to load the address!');
        phantom.exit(1);
    } else {
        page.render('./overview/img/' + name);
        phantom.exit();
    }
});