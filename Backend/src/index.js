import "dotenv/config";
import connectDB from "./Db/index.js";
import app from "./app.js";


connectDB().then(() => {
    app.listen(process.env.PORT, () => {    
        console.log(`Server is running on port ${process.env.PORT}`);
    }
    );
}).catch((error) => {
    console.error("Error starting the server:", error);
    process.exit(1); 
}
);
   