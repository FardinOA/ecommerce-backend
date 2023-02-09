const app = require("./app");

const mongoose = require("mongoose");
const cloudinary = require("cloudinary");

// Handling uncaught Error exceptions
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to uncaught Error exceptions`);

    process.exit(1);
});

//connect database
const url = process.env.MONGO_URL;

mongoose
    .connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((data) => {
        console.log(`Mongo db connected with server ${data.connection.host}`);
    });

// connect cloudinary

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINAY_API_SECRET,
});
app.get("/ssl-request", async (req, res) => {
    const data = {
        total_amount: 100,
        currency: "EUR",
        tran_id: "REF123",
        success_url: "http://localhost:8000/ssl-payment-success",
        fail_url: "http://localhost:8000/ssl-payment-failure",
        cancel_url: "http://localhost:8000/ssl-payment-cancel",
        ipn_url: "http://localhost:8000/ssl-payment-ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: "Customer Name",
        cus_email: "cust@yahoo.com",
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
        multi_card_name: "mastercard",
        value_a: "ref001_A",
        value_b: "ref002_B",
        value_c: "ref003_C",
        value_d: "ref004_D",
    };

    const sslcommer = new SslCommerzPayment(
        process.env.STORE_ID,
        process.env.STORE_PASSWORD,
        false
    ); //true for live default false for sandbox

    sslcommer.init(data).then((data) => {
        //process the response that got from sslcommerz
        //https://developer.sslcommerz.com/doc/v4/#returned-parameters

        if (data?.GatewayPageURL) {
            res.status(200).json({ data });
        } else {
            res.status(400).json({ message: "Ssl Session was not successful" });
        }
    });
});

app.post("/ssl-payment-success", async (req, res, next) => {
    console.log(req.body);
    res.status(200).redirect("http://localhost:3000/payment/success");
});

app.post("/ssl-payment-failure", async (req, res, next) => {
    return res.status(400).json({ data: req.body });
});
app.post("/ssl-payment-cancel", async (req, res, next) => {
    return res.status(200).json({ data: req.body });
});
app.post("/ssl-payment-ipn", async (req, res, next) => {
    return res.status(200).json({ data: req.body });
});

const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
    res.json({ message: "hello Fardin" });
});

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to unhandled promise rejection`);
    server.close(() => {
        process.exit(1);
    });
});
