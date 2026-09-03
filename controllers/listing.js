const Listing = require("../models/listing.js");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({
    accessToken: mapToken,
});


// INDEX - Show all listings
module.exports.index = async (req, res) => {
    const { category } = req.query;

    let allListings;

    if (category) {
        allListings = await Listing.find({
            categories: category
        });
    } else {
        allListings = await Listing.find({});
    }

    res.render("listings/index.ejs", { allListings });
};


// NEW - Show new listing form
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};


// CREATE - Create new listing
module.exports.createListing = async (req, res, next) => {
    try {
        const location = req.body.listing.location;

        if (!req.file) {
            req.flash("error", "Please upload an image.");
            return res.redirect("/listings/new");
        }

        const response = await geocodingClient
            .forwardGeocode({
                query: location,
                limit: 1,
            })
            .send();

        if (
            !response.body.features ||
            response.body.features.length === 0
        ) {
            req.flash(
                "error",
                "Location could not be found. Please enter a valid location."
            );

            return res.redirect("/listings/new");
        }

        const newListing = new Listing(req.body.listing);

        newListing.owner = req.user._id;

        newListing.categories =
            req.body.listing.categories || [];

        newListing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };

        newListing.geometry =
            response.body.features[0].geometry;

        await newListing.save();

        req.flash(
            "success",
            "New Listing Created!"
        );

        res.redirect("/listings");

    } catch (error) {
        console.log(
            "MAPBOX / CREATE LISTING ERROR:",
            error
        );

        if (error.statusCode === 429) {
            req.flash(
                "error",
                "Mapbox request limit reached. Please try again later."
            );

            return res.redirect("/listings/new");
        }

        next(error);
    }
};


// SHOW - Show one listing
module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        });

    if (!listing) {
        req.flash(
            "error",
            "Listing you requested does not exist!"
        );

        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", {
        listing
    });
};


// EDIT - Show edit form
module.exports.editListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash(
            "error",
            "Listing you requested does not exist!"
        );

        return res.redirect("/listings");
    }

    const originalImageUrl =
        listing.image && listing.image.url
            ? listing.image.url
            : "";

    res.render("listings/edit.ejs", {
        listing,
        originalImageUrl
    });
};


// UPDATE - Update listing
module.exports.updateListing = async (req, res, next) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash(
                "error",
                "Listing you requested does not exist!"
            );

            return res.redirect("/listings");
        }

        listing.title =
            req.body.listing.title;

        listing.description =
            req.body.listing.description;

        listing.price =
            req.body.listing.price;

        listing.country =
            req.body.listing.country;

        listing.location =
            req.body.listing.location;

        listing.categories =
            req.body.categories ||
            req.body.listing.categories ||
            [];

        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        const location =
            req.body.listing.location;

        const response = await geocodingClient
            .forwardGeocode({
                query: location,
                limit: 1,
            })
            .send();

        if (
            !response.body.features ||
            response.body.features.length === 0
        ) {
            req.flash(
                "error",
                "Location could not be found. Please enter a valid location."
            );

            return res.redirect(
                `/listings/${id}/edit`
            );
        }

        listing.geometry =
            response.body.features[0].geometry;

        await listing.save();

        req.flash(
            "success",
            "Listing Updated!"
        );

        res.redirect(
            `/listings/${id}`
        );

    } catch (error) {
        console.log(
            "UPDATE LISTING ERROR:",
            error
        );

        if (error.statusCode === 429) {
            req.flash(
                "error",
                "Mapbox request limit reached. Please try again later."
            );

            return res.redirect(
                `/listings/${req.params.id}/edit`
            );
        }

        next(error);
    }
};


// DELETE - Delete listing
module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;

    const listing =
        await Listing.findByIdAndDelete(id);

    if (!listing) {
        req.flash(
            "error",
            "Listing you requested does not exist!"
        );

        return res.redirect("/listings");
    }

    req.flash(
        "success",
        "Listing Deleted!"
    );

    res.redirect("/listings");
};