var url = require('url'),
    redis = require('redis'),
    flatiron = require('flatiron'),
    app = flatiron.app;
    Emitter = require('node-redis-events'),
    controllers = require('./lib/controllers');

app.use(flatiron.plugins.http);

/**
 * CORS header
 */

app.http.headers['Access-Control-Allow-Origin'] = '*';

/**
 * configure event emitter namespace
 */

var emitter = new Emitter({
  namespace: 'stalker'
});

// Route request to correct controller
app.controllers = controllers(emitter);

app.router.path(/users/i, app.controllers.User);

// Start the app
app.start(process.env.STALKER_PORT || 3000);