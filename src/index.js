// index.js
import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./Db/db.index.js";



dotenv.config({
    path: './.env'
})

connectDB()
.then(() =>{

app.on("error",(error) => {
    console.log("error",error)  // it may be neglated
    throw error
})

app.listen(process.env.PORT || 8000 , () => {
    console.log(`Server is running on port: ${process.env.PORT}`);
  });
})
.catch((err) => {
    console.log("Mongo_DB coneection failed !!",err);
})






//  ; (async() => {

//     try{
// await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//     }catch(error){
//         console.log("ERROR:",error)
//         throw err
//     }
//  }  ) ()