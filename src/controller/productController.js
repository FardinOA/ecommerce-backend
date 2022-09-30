const ErrorHandeler = require("../../utils/errorHandeler");
const catchAssyncErrors = require("../../middleware/catchAssyncErrors");
const Product = require("../models/productModel");
const ApiFeatures = require("../../utils/apiFeatures");
const cloudinary = require("cloudinary").v2;

//create product -- admin
exports.createProduct = catchAssyncErrors(async (req, res, next) => {
    req.body.user = req.user.id;
    let images = [];

    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    let imagesLink = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.uploader.upload(images[i], {
            folder: "products",
        });

        imagesLink.push({
            public_id: result.public_id,
            url: result.secure_url,
        });
    }

    req.body.images = imagesLink;
    req.body.user = req.user.id;

    const product = await Product.create(req.body);
    res.status(200).json({
        success: true,
        product,
    });
});

// get all product
exports.getAllProduct = catchAssyncErrors(async (req, res, next) => {
    const resultPerPage = 8;
    const productsCount = await Product.countDocuments();

    const apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter();

    let products = await apiFeature.query;

    let filteredProductsCount = products.length;

    apiFeature.pagination(resultPerPage);

    products = await apiFeature.query;

    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    });
});

// update product --- admin
exports.updateProduct = catchAssyncErrors(async (req, res, next) => {
    const _id = req.params.id;
    let product = await Product.findById({ _id });
    if (!product) {
        return next(new ErrorHandeler("Product not found", 404));
    }

    let images = [];

    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    if (images !== undefined) {
        // deleting images from cloudinary

        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.uploader.destroy(product.images[i].public_id);
        }

        // upload images
        let imagesLink = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLink.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }
        req.body.images = imagesLink;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        { _id },
        {
            $set: req.body,
            updatedAt: new Date(),
        },
        {
            multi: true,
            new: true,
            runValidators: true,
            useFindAndModify: true,
        }
    );

    res.status(200).json({
        success: true,
        product: updatedProduct,
    });
});

//delete product -- admin only

exports.deleteProduct = catchAssyncErrors(async (req, res, next) => {
    const _id = req.params.id;
    let product = await Product.findById(_id);
    if (!product) {
        return next(new ErrorHandeler("Product not found", 404));
    }
    // deleting images from cloudinary

    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.uploader.destroy(product.images[i].public_id);
    }
    await Product.findByIdAndDelete({ _id });
    res.status(200).json({
        success: true,
        message: "product delete successfully",
    });
});
// get single product
exports.getSingleProduct = catchAssyncErrors(async (req, res, next) => {
    const _id = req.params.id;

    let product = await Product.findById(_id);
    if (!product) {
        return next(new ErrorHandeler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// create new review or update the review on products
exports.createProductReview = catchAssyncErrors(async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    };
    const product = await Product.findById(productId);
    const isReviewd = product.reviews.find(
        (rev) => rev.user.toString() === req.user._id.toString()
    );
    if (isReviewd) {
        product.reviews.forEach((rev) => {
            if (rev.user.toString() === req.user._id.toString()) {
                rev.rating = rating;
                rev.comment = comment;
            }
        });
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }
    let sum = 0;

    product.reviews.forEach((rev) => {
        sum += rev.rating;
    });
    product.ratings = sum / product.reviews.length;
    await product.save({ validateBeforeSave: false });

    res.status(200).json({ success: true });
});

// Get all reviews of a product
exports.getAllReviewsOfAProduct = catchAssyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    if (!product) {
        return next(new ErrorHandeler("Product not found", 404));
    }

    res.status(200).json({ success: true, reviews: product.reviews });
});

// delete product related to a product
exports.deleteProductReview = catchAssyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return next(new ErrorHandeler("Product not found", 404));
    }
    const reviews = product.reviews.filter(
        (rev) => rev._id.toString() !== req.query.id.toString()
    );

    let sum = 0;

    reviews.forEach((rev) => {
        sum += rev.rating;
    });
    let ratings = 0;
    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }

    const numOfReviews = reviews.length;
    await Product.findByIdAndUpdate(
        req.query.productId,
        {
            reviews,
            ratings,
            numOfReviews,
        },
        {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        }
    );
    res.status(200).json({ success: true });
});

// Get all Admin products
exports.getAllAdminProducts = catchAssyncErrors(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        products,
    });
});
