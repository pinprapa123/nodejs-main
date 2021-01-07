require('dotenv').config();
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let mysql = require('mysql');
const jwt = require("jsonwebtoken");
const cors = require("cors")
const bcrypt = require("bcrypt");
const saltRounds = 10


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// homepage route
app.get('/', (req, res) => {
    return res.send({ 
        error: false, 
        message: 'Welcome to RESTful CRUD API with NodeJS, Express, MYSQL',
        written_by: 'Patiphan',
        published_on: 'https://milerdev.dev'
    })
})
var token;
 console.log(token); //undefined is key for us
// connection to mysql database
const dbCon = mysql.createConnection({
    host: '127.0.0.1',
    port: 3310,
    user: 'root',
    password: 'easyfo',
    database: 'easyfo7',
    multipleStatements: true
})
dbCon.connect();

// Register
app.post('/register' ,(req, res) => {
    const first_name = req.body.first_name;
    const email = req.body.email;
    const password = req.body.password;
    const phone = req.body.phone

     dbCon.query('SELECT email FROM users WHERE email = ?' , [email] ,async (error,results) => {
        if(error) {
            console.log(error);
        }
        if( results.length > 0 ) {
            return res.json({
                message: "อีเมลนี้ถูกใช้งานไปแล้ว",
                Data : results
            })
        }
        const hashedPassword = await bcrypt.hash(password, 8);
        bcrypt.hash(password, saltRounds, (err, hash) => {

    if (!first_name || !email || !password || !phone) {
        return res.status(400).send({ error: true, message: "กรุณากรอกข้อมูลให้ครบถ้วน"});
    } else {
        dbCon.query('INSERT INTO users SET ?', {first_name: first_name, email: email, password: hashedPassword, phone: phone}, (error, results) => {
            if (error){
                console.log(error);
            } else{
            return res.json({
                message: "สมัครสมาชิกสำเร็จ",
                Data : results
                
               })
            
            }
        })
    }
    })
    })
});

// Login
app.post('/login' , async (req,res) => { 
    
    const email = req.body.email;
    const password = req.body.password

   dbCon.query('SELECT * FROM users WHERE email = ? ' , email, (err, result) => {
    
       if (err) {
        res.send({err: err});
        
       } 
       if (result.length > 0) {
           bcrypt.compare(password, result[0].password,(error, response) => {
               if (response) {
                   token = jwt.sign({email , password} , process.env.ACESS_TOKEN); //generate token
                    return res.json({
                    message: "เข้าสู่ระบบสำเร็จ",
                    Data : result,
                    token: token
       })
               } else {
                res.send({message: "รหัสผ่านไม่ถูกต้อง"});
               }
           })
        
       }else{
           res.send({message: "ไม่พบบัญชีผู้ใช้นี้"});
       }         
    })
    
});

// Retrieve all
app.get('/users', auth , (req, res) => {
    dbCon.query('SELECT * FROM users', (error, results, fields) => {
        if (error) throw error;

        let message = ""
        if (results === undefined || results.length == 0) {
            message = "ไม่พบบัญชีผู้ใช้";
        } else {
            message = "เรียกข้อมูลผู้ใช้สำเร็จ";
        }
        return res.send({ error: false, data: results, message: message});
    })
})

// Retrieve by id 
app.get('/user/:id', auth , (req, res) => {
    let id = req.params.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide book id"});
    } else {
        dbCon.query("SELECT * FROM users WHERE id = ?", id, (error, results, fields) => {
            if (error) throw error;

            let message = "";
            if (results === undefined || results.length == 0) {
                message = "ไม่พบบัญชีผู้ใช้";
            } else {
                message = "เรียกข้อมูลผู้ใช้สำเร็จ";
            }

            return res.send({ error: false, data: results[0], message: message })
        })
    }
})

// Update 
app.put('/user', auth , (req, res) => {
    const id = req.body.id;
    const first_name = req.body.first_name;
    const email = req.body.email;
    const phone = req.body.phone;

    // validation
    if (!id || !first_name || !email|| !phone) {
        return res.status(400).send({ error: true, message: 'กรุณากรอกข้อมูลให้ถูกต้อง'});
    } else {
        dbCon.query('UPDATE users SET first_name = ?, email = ? , phone = ? WHERE id = ?', [first_name, email , phone, id], (error, results, fields) => {
            if (error) throw error;

            let message = "";
            if (results.changedRows === 0) {
                message = "ไม่พบข้อมูลผู้ใช้";
            } else {
                message = "อัพเดตข้อมูลผู้ใช้สำเร็จ";
            }

            return res.send({ error: false , message: message })
        })
    }
})

// Delete by id
app.delete('/user', auth , (req, res) => {
    const id = req.body.id;

    if (!id) {
        return res.status(400).send({ error: true, message: "Please provide book id"});
    } else {
        dbCon.query('DELETE FROM users WHERE id = ?', [id], (error, results, fields) => {
            if (error) throw error;

            let message = "";
            if (results.affectedRows === 0) {
                message = "ไม่พบบัญชีผู้ใช้";
            } else {
                message = "ลบบัญชีผู้ใช้แล้ว";
            }

            return res.send({ error: false , message: message })
        })
    }
})

// Logout
app.post('/logout',(req,res)=>{ 
    token = undefined; //value undefined
    res.send("logout");
 });
 
 function auth (req,res,next){  //middleware function
      if(token !== undefined){
            jwt.verify(token,process.env.ACESS_TOKEN,(err,verified)=>{
                if(err) return res.status(404).send("ไม่ได้รับอนุญาตให้ทำในส่วนนี้ กรุณาใส่Token"); //if err
                  req.user = verified;
                  next();
            });
      }else{
            return res.status(404).send("คุณต้องทำการเข้าสู่ระบบก่อนค่ะ");
      }
 }

 const PORT = process.env.PORT || 3000;
 app.listen(PORT,()=>{
    console.log('Node App is running on port 3000');
})

module.exports = app;
