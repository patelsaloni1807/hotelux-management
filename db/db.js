mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("MongoDB Connected ✅");

    app.listen(process.env.PORT || 10000, () => {
        console.log("Server running 🚀");
    });
})
.catch(err => console.log(err));
