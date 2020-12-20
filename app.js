var express = require("express");
var http = require('http');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var app = express();
var stripe = require('stripe')('sk_test_51H5VaTLZ4ou6tlFCg7rgPIdTe34l8T2BTBONN16eOOx22LGwTmcfWwHQMc67rMyXNqUXskQSzMS2JtQ5crz1x3s600i3pPguFF');
var server = http.createServer(app);
var io = require('socket.io')(server);
var path = require('path');

//mongodb+srv://our_first_user:<password>@cluster0.n5xe2.mongodb.net/<dbname>?retryWrites=true&w=majority
const mongoose = require("mongoose");
// var url = process.env.DATABASEURL || "mongodb://localhost/bus_lo";
// mongoose.connect(url, {
// 	useNewUrlParser: true,
// 	useUnifiedTopology: true,
// 	useCreateIndex: true,
// 	useFindAndModify: false
// })
// .then(() => console.log('Connected to DB!'))
// .catch(error => console.log(error.message));

mongoose.connect("mongodb+srv://buslo:sakshamkl72@buslo.zxjoe.mongodb.net/<dbname>?retryWrites=true&w=majority", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false
})
.then(() => console.log('Connected to DB!'))
.catch(error => console.log(error.message));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
secret: 'whatever you want',
resave: false,
saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

var User = require('./models/user');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
	res.render("home");
});

app.get("/login", function(req, res) {
	res.render("login");
});

app.post('/login', passport.authenticate('local', {
	successRedirect: '/dashboard',
	failureRedirect: '/login'
}), function(req, res) {});

app.get("/register", function(req, res) {
	res.render("signup");
});

app.post('/register', function(req, res) {
	User.register(new User({ username: req.body.username, name: req.body.name, email: req.body.email}),req.body.password, function(err, user) {
		if (err) {
			console.log(err);
			return res.redirect('/register');
		}
		passport.authenticate('local')(req, res, function() {
		res.redirect('/dashboard');
		});
	});
});

app.get("/dashboard", isLoggedIn, function(req, res) {
	res.render("dashboard");
});

app.get("/routees", isLoggedIn, function(req, res) {
	res.render("routees");
});

app.get("/accident", isLoggedIn, function(req, res) {
	res.render("Accident");
});

app.get("/damage", isLoggedIn, function(req, res) {
	res.render("Damage");
});

app.get("/pass", isLoggedIn, function(req, res) {
	res.render("Pass");
});

app.get("/traffic", isLoggedIn, function(req, res) {
	res.render("Traffic");
});

app.get("/battery", isLoggedIn, function(req, res) {
	res.render("battery");
});

app.get("/terms", function(req, res) {
	res.render("terms");
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/payment', isLoggedIn, function(req, res){ 
    res.render('payment', { 
       key: 'pk_test_51H5VaTLZ4ou6tlFCcV7ooU5KrrWZ2M9y5OskVtyRCiDytkrhnM9qmIwSgM5nXuaYtI6G4R5wdRCMzaxNL1jXbUsA00stU8iN11'
    }) 
}) 
  
app.post('/payment', function(req, res){ 
  
    // Moreover you can take more details from user 
    // like Address, Name, etc from form 
    stripe.customers.create({ 
        email: req.body.stripeEmail, 
        source: req.body.stripeToken, 
        name: 'BUSLO', 
        address: { 
            line1: 'TC 9/4 Old MES colony', 
            postal_code: '452331', 
            city: 'Indore', 
            state: 'Madhya Pradesh', 
            country: 'India', 
        } 
    }) 
    .then((customer) => { 
  
        return stripe.charges.create({ 
            amount: 2500,     // Charing Rs 25 
            description: 'Web Development Product', 
            currency: 'INR', 
            customer: customer.id 
        }); 
    }) 
    .then((charge) => { 
		// If no error occurs 
		res.redirect("/routees")
    }) 
    .catch((err) => { 
        res.send(err)       // If some error occurs 
    }); 
})
app.get('/messages', (req, res) => {
  res.render('index');
});
var name;

io.on('connection', (socket) => {
  console.log('new user connected');
  
  socket.on('joining msg', (username) => {
  	name = username;
  	io.emit('chat message', `---${name} joined the chat---`);
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
    io.emit('chat message', `---${name} left the chat---`);
    
  });
  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', msg);         //sending message to all except the sender
  });
});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
}
res.redirect('/login');
}
app.get("*", function(req, res) {
	res.send("Error");
});

server.listen(3000, function() {
	console.log("Server Started");
});