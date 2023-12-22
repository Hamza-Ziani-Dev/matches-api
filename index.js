const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const PORT = 5000;
//Create Connection:
const pool = mysql.createPool({
    host : "localhost",
    user:"root",
    password: "",
    database:"classement"
})

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
const csv =  require('fast-csv');
const fs = require('fs');

//multer Config:
let storage = multer.diskStorage({
    destination: (req, file, callback)=> {
        callback(null,'./uploads/');
    },
    filename:(req, file, callback)=>{
        callback(null,file.filename + "-" + Date.now() + path.extname(file.originalname))
    }
});

let upload = multer({storage:storage});
app.use(cors());
app.get('/',(req,res)=>{
    res.sendFile(__dirname + "/index.html")
});


//******************************  Results *******************************//
app.post('/import-csv/', upload.single('file'), (req,res)=>{
    console.log(req.file.path);
    uploadCsv(__dirname + "/uploads/" + req.file.filename);
    // res.send("Data Imported!");
});

function uploadCsv(path){
    let stream = fs.createReadStream(path);
    let csvDataColl = [];
    let fileStream = csv
    .parse()
    .on('data', function(data){
        csvDataColl.push(data)
    })
    .on('end', function(){
        csvDataColl.shift()
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(error);
            } else {
                let query = "INSERT INTO resultats (region, equipe_domicile, buts_domicile, buts_visiteuse, equipe_visiteuse, journee, type_champions, date, heure) VALUES ?";
                connection.query(query, [csvDataColl], (error, res) => {
                    console.log('====================================');
                    console.log(error || res);
                    console.log('====================================');
                });
            }
        });
        fs.unlinkSync(path)
    })
    stream.pipe(fileStream)
}



app.listen(PORT, ()=>{
    console.log("Server Is Run In 5000");
})