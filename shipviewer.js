var express = require('express')
  , app = express();

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

app.get('/ships/:shipName', function(req, res) {
  res.render('ship', {
    shipName: req.param('shipName')
  });
});

app.get('/ships/:shipName/embed', function(req, res) {
  res.render('embedded-viewer', {
      shipName: req.param('shipName')
    , height: (req.param('height')) ? req.param('height') : 618
    , width: (req.param('width')) ? req.param('width') : 940
  });
});

app.listen(5001);