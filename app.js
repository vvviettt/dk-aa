const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { trim_all } = require("request_trimmer");
const { initializeApp, cert } = require("firebase-admin/app");
const app = express();
const apiRoutes = require("./src/routes/index.routes");
const {
    errorConverter,
    handleError,
    handleNotFound,
} = require("./src/middleware/error.middleware");
const path = require("path");
const { notificationHandle } = require("./src/services/notification.service");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const port = process.env.PORT || 8000;

global.__basedir = __dirname;
initializeApp({
    credential: cert(require("./firebase.json")),
});
//http request log
if (process.env.NODE_ENV === "development") {
    app.use(morgan("combined"));
}
//Set static folder
app.use(express.static(path.join(__dirname + "/src/public")));
//set security HTTP headers
app.use(helmet());
//parse json request body
app.use(express.json());
//parse urlencoded request body
app.use(express.urlencoded({ extended: true }));
//trim request params
app.use(trim_all);
//enable cors
app.use(cors());
app.options("*", cors());

//routes
app.use("/api", apiRoutes);
//handle error
app.use(errorConverter);
app.use(handleError);
app.use(handleNotFound);
app.listen(port, () => {
    notificationHandle();
    console.log(`Server listening on port ${port}`);
});
