const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({
    accessToken: mapToken
});


// ===============================
// INDEX - ALL / FILTER LISTINGS
// ===============================

module.exports.index = async (req, res) => {

    const { category } = req.query;

    let allListings;

    if (category) {

        // Show only selected category listings
        allListings = await Listing.find({
            categories: category
        });

    } else {

        // Show all listings
        allListings = await Listing.find({});
    }

    res.render("listings/index.ejs", {
        allListings
    });
};


// ===============================
// NEW LISTING FORM
// ===============================

module.exports.renderNewForm = (req, res) => {

    res.render("listings/new.ejs");

};


// ===============================
// SHOW LISTING
// ===============================

module.exports.showListing = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {

        req.flash(
            "error",
            "Listing you requested does not exist!"
        );

        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", {
        listing,
        mapToken
    });

};


// ===============================
// CREATE LISTING
// ===============================

module.exports.createListing = async (req, res) => {

    let response = await geocodingClient
        .forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        })
        .send();


    let url = req.file.path;

    let filename = req.file.filename;


    console.log(req.body.listing);


    const newListing = new Listing(req.body.listing);


    newListing.owner = req.user._id;


    newListing.image = {
        url,
        filename,
    };


    newListing.geometry =
        response.body.features[0].geometry;


    await newListing.save();


    req.flash(
        "success",
        "New Listing Created!"
    );


    res.redirect("/listings");

};


// ===============================
// EDIT LISTING
// ===============================

module.exports.editListing = async (req, res) => {

    let { id } = req.params;


    const listing = await Listing.findById(id);


    if (!listing) {

        req.flash(
            "error",
            "Listing you requested does not exist!"
        );

        return res.redirect("/listings");
    }


    let originalImageUrl =
        listing.image.url;


    originalImageUrl =
        originalImageUrl.replace(
            "/upload",
            "/upload/w_250"
        );


    res.render("listings/edit.ejs", {

        listing,

        originalImageUrl,

    });

};


// ===============================
// UPDATE LISTING
// ===============================

module.exports.updateListing = async (req, res) => {

    let { id } = req.params;


    console.log(req.body.listing);


    let listing = await Listing.findByIdAndUpdate(

        id,

        {
            ...req.body.listing
        },

        {
            new: true,
            runValidators: true,
        }

    );


    if (typeof req.file !== "undefined") {

        let url = req.file.path;

        let filename = req.file.filename;


        listing.image = {

            url,

            filename,

        };


        await listing.save();

    }


    req.flash(
        "success",
        "Listing Updated!"
    );


    res.redirect(`/listings/${id}`);

};


// ===============================
// DELETE LISTING
// ===============================

module.exports.destroyListing = async (req, res) => {

    let { id } = req.params;


    await Listing.findByIdAndDelete(id);


    req.flash(
        "success",
        "Listing Deleted!"
    );


    res.redirect("/listings");

};