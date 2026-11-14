// Require middleware
const express = require('express');
const { engine } = require('express-handlebars');
const cors = require('cors');
const methodOverride = require('method-override');
// Required files
const auth = require('../server/auth/auth-route');
const gem = require('../server/gem/gem-controller.js');
const fusion = require('../server/fusion/fusion-controller.js');
// Define app
const app = express();
// // Define router
// // Confused about router vs app
// const router = new express.Router(); // eslint-disable-line new-cap

// Use body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// override with POST having ?_method=DELETE or ?_method=PUT
app.use(express.static('public'));
app.use(methodOverride('_method'));

// Enable CORS - Cross Origin Resource Sharing.
app.use(cors());

// Set up handlebars
app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');

// Start up basic routes
app.get('/', (req, res) => {
	res.render('home.hbs');
});

// Mount all other routes
app.use('/auth', auth);
app.use('/gem', gem);
app.use('/fusion', fusion);

module.exports = app;
// // Confused about router vs app
// module.exports = router;
