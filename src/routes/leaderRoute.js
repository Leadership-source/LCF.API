import express from "express";
const router = express.Router();

router.get("/leadership", (req, res) => {
  res.json({
    message: "leaders",
  });
});
export default router;
