import express from "express";
import prediction from "./routes/prediction.routes.js"

const app = express();

const port = process.env.PORT || 5000;
app.use(express.json());
app.use('/', prediction);

app.listen(port, () => console.log(`App is listening on port ${port}`));

