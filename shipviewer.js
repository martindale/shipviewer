var express = require('express')
  , app = express()
  , rest = require('restler');

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.errorHandler());
app.use(app.router);

app.locals = {
    width: 940
  , height: 618
  , shipName: 'drake'
};

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/ships', function(req, res) {
  res.render('ships');
});

app.get('/ships/:shipName', function(req, res) {
  res.render('ship', {
      shipName: req.param('shipName')
    , ship: app.locals.shipFacts[req.param('shipName')]
  });
});

app.get('/ships/:shipName/embed', function(req, res) {
  res.render('embedded-viewer', {
      shipName: req.param('shipName')
    , height: (req.param('height')) ? req.param('height') : 618
    , width: (req.param('width')) ? req.param('width') : 940
  });
});

rest.get('https://web.ccpgamescdn.com/shipviewer/assets/shipresources.js').on('complete', function( shipResources ) {

  function CCPShipResources(resources) { return resources; }
  function CCPShipFacts(facts) { return facts; }

  var resources = eval( shipResources );

  app.locals.ships = Object.keys(resources).sort();

  rest.get('https://web.ccpgamescdn.com/shipviewer/assets/shipfacts.js').on('complete', function( shipFacts ) {

    var facts = eval( shipFacts )
    
    app.locals.shipFacts = facts ;

    var shipClasses = {};
    app.locals.ships.forEach(function(ship) {
      shipClasses[ app.locals.shipFacts[ship.toLowerCase()].shipClass ] = app.locals.shipFacts[ship.toLowerCase()].shipClass;
    });
    app.locals.shipClasses = Object.keys(shipClasses).sort();

    app.listen(5001);

  });

});
