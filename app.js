const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session=require('express-session');
const passwordHash = require('password-hash');
const _ = require("lodash");

var fs = require('fs'); 
var path = require('path'); 
var multer = require('multer'); 
// var imgPath = '/path/yourimage.png';


const blogStartingContent =[];



var app = express();

app.set('view engine', 'ejs');

app.use(session({secret:"Shh,its a secret!"}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static('public'));
app.use(bodyParser.json()) 


let posts = [];

var storage = multer.diskStorage({ 
  destination: (req, file, cb) => { 
      cb(null, 'uploads') 
  }, 
  filename: (req, file, cb) => { 
      cb(null, file.fieldname + '-' + Date.now()) 
  } 
}); 

var upload = multer({ storage: storage }); 

mongoose.connect("mongodb://localhost:27017/DatabaseName", {useNewUrlParser: true, useUnifiedTopology: true})
var db=mongoose.connection; 
const userSchema = new mongoose.Schema({
    username:String,
    password:String,
})
const users = new mongoose.model('users',userSchema);
db.on('error', console.log.bind(console, "connection error")); 
db.once('open', function(callback){ 
    console.log("connection succeeded"); 
})

const postSchema = {
  title:String,
  content:String,
  author:String,
  image: { 
    data: Buffer, 
    contentType: String 
} 
  };



const Post =  mongoose.model("Post",postSchema);


app.get("/blog", function(req, res){

  Post.find({}, function(err, posts){
    res.render("blog", {
      blogStartingContent : blogStartingContent,
      posts: posts,
      // image: image

      });
  });
});




app.get('/signup',function(req,res){
  res.render("signup");
});


app.post('/signup', function(req,res){ 
  console.log(req.body);
  var username = req.body.username; 
  var password = req.body.password; 
  var confirmpassword =req.body.confirmpassword; 

  var newUser = new users({ 
      "username": username, 
      "password":passwordHash.generate(password),
  
  }); 
db.collection('details').insertOne(newUser,function(err, collection){ 
      if (err) throw err; 
      console.log("Record inserted Successfully"); 
            }); 
  users.find({username:username},function(err,user){
      if(user.length==0){
          var newUser = new users({
              username:username,
              password:passwordHash.generate(password),
          });
          newUser.save();
           return res.redirect('/login');
      }
      else{
          res.send('Username already exits.Please pick another username')
      }
  })
 

});


app.get('/login',function(req,res){
  var username = req.session.username;
  console.log("Current Session =",req.body.username)
  if(req.session.username === null || req.session.username === undefined){
    res.render('login');
  }
  else{
  res.render("compose");
  }
});



app.get('/hash/:password',function(req,res){
  var password=req.params.password;
  var hashedPassword=passwordHash.generate(password);
  res.send(hashedPassword);
});


app.post('/login',function(req,res){ 
  console.log(req.body);
  users.find({
      username :req.body.username,
  },function(err,users){
      if(users.length==0){
          res.send('incorrect username  or password!');
      }
      else{
          if(!passwordHash.verify(req.body.password,users[0].password)){
              res.send('incorrect username  or password!');
          }
          else{
            res.redirect('/compose');
          }
          
      }
  });
});

// app.get("/", function(req, res){
//   res.render("index");
// });

app.get("/", function(req, res){

  Post.find({}, function(err, posts){
    res.render("index", {
      posts: posts
      });
  });
});




app.get("/compose", function(req, res){
  res.render("compose");
});

// app.post("/compose", function(req, res){
//   console.log(req.body);
//   const post = new Post({
//     title:req.body.postTitle,
//     author:req.body.authorsName,
//     content:req.body.postBody,
//     image:req.body.postImage
//   });
//  post.save(function(err){
//     if (!err){
//         res.redirect("/blog");
      
//     }
//   });
// });

app.post('/compose', upload.single('image'), (req, res, next) => { 
  
  var post = { 
    title:req.body.postTitle,
    author:req.body.authorsName,
    content:req.body.postBody,
      image: { 
          data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
          contentType: 'image/png'
      } 
  } 
  Post.create(post, (err, item) => { 
      if (err) { 
          console.log(err); 
      } 
      else { 
          item.save(); 
          res.redirect('/blog'); 
      } 
  }); 
});


app.get("/posts/:postId", function(req, res){
//   const requestedTitle = _.lowerCase(req.params.postName);

// posts.forEach(function(post){
//   const storedTitle = _.lowerCase(post.title);

//    if(storedTitle === requestedTitle) {
  const requestedPostId = req.params.postId;
  Post.findOne({_id: requestedPostId}, function(err, posts){
     res.render("post", {
       posts: posts
     });
   

});

});
 
app.get("/author", function(req, res){

  Post.find({}, function(err, posts){
    res.render("author", {
      posts: posts
      });
  });
});


app.get('/file',function(req,res){
  res.render("file");
});


app.get('/main',function(req,res){
  res.render("main");
});


app.get('/list',function(req,res){
  res.render("list");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});