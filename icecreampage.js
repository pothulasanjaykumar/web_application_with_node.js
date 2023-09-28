const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const bodyParser=require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Filter } = require('firebase-admin/firestore');
const serviceAccount = require("./key.json");
const { get } = require('request');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('ice.ejs', { name: undefined });
});

app.get('/menu', (req, res) => {
    res.render('menu.ejs');
});

app.get('/cart', (req, res) => {
    res.render('cart.ejs');
});


app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/contact', (req, res) => {
    res.render('contact.ejs',{alert:""});
});

app.post('/contactsubmit', function (req, res) {
    db.collection('contact').add({
        text1: req.body.text1,
        email1: req.body.email1,
        message1: req.body.message1
    }).then(() => {
        const alert = "Your response is successfully stored in the database.";
        res.render('contact.ejs', { alert: alert }); 
    }).catch((error) => {
        console.error("Error storing contact response:", error);
        res.status(500).send("Internal Server Error");
    });
});



app.post('/loginsubmit', async (req, res) => {
    try {
        const email = req.body.email_id;
        const password = req.body.password;
        
        const userQuerySnapshot = await db.collection('signin')
            .where("email_id", "==", email)
            .get();

        if (userQuerySnapshot.size === 0) {
            return res.render('login.ejs', { message: "Failed to login." });
        }

        const user = userQuerySnapshot.docs[0].data();
        const hashedPassword = user.password;

        const passMatch = await bcrypt.compare(password, hashedPassword);

        if (passMatch) {
            return res.render('ice.ejs', { name: user.full_name });
        } else {
            return res.render('login.ejs', { message: "Failed to login." });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send("Internal Server Error");
    }
});



app.get('/dashboard', (req, res) => {
    res.render('dashboard', { name: req.query.name });
});



app.get('/signup', (req, res) => {
    res.render('signup.ejs',{alert:""});
});
app.get('/checkout',(req,res)=>{
    res.render('checkout.ejs');
})


app.post('/signinsubmit', async (req, res) => {
    const email_id = req.body.email_id;
    const password = req.body.password;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    db.collection('signin')
    .where(
        Filter.or(
          Filter.where('email_id', '==', req.body.full_name),
          Filter.where('full_name', '==', req.body.full_name)
        )
      )
      .get()
  
    .then((docs) => {
      if (docs.size > 0) {
        const alert = "Hey this Username or Email is Already Exist Try Other One";
        res.render("signup.ejs",{alert:alert});
        }
        else{
            db.collection('signin').add({
                full_name: req.body.full_name,
                last_name: req.body.last_name,
                email_id: req.body.email_id,
                password:hashedPassword,
            }).then(() => {
                res.render('login.ejs', { message: "Signup successful!" });
            });
        }
    });

});




app.listen(3000, () => {
    console.log('Server is running on port 3000');
});