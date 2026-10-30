function authorizeModification(req, res, next) {
    if ((req.user.role != "parent" && req.user.role != "child")
        || (req.user.role == "child" && req.user.id != req.params.userId )) {
            return res.status(403).json({error: "Access denied"})
    }
    next();
}

export { authorizeModification };