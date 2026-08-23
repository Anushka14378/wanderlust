module.exports.createListing = async (req, res, next) => {
    try {
        const location = req.body.listing.location;

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

        const url = req.file.path;
        const filename = req.file.filename;

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

    } catch (error) {
        console.log("MAPBOX / CREATE LISTING ERROR:", error);

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