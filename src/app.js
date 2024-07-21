import express from "express";
import cors from "cors";
import cookieparser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
//configuration of cors library for ors origin error.



app.use(express.json({limit:"16kb"})) 
//accept json with limit in express app

 
app.use(express.urlencoded({extended:true,limit:"16kb"})) 
// url-encoded in the express


app.use(express.static("public")) 
// used for stord public files on server and acess can anyone.

app.use(cookieparser())
//used for acess and set cookies {do CURD operation}

 






export{ app };