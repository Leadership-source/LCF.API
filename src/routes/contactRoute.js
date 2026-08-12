import express from "express";
import { createContactMessage } from "../controller/contactController.js";
import { validate } from "../middleWare/validateRequest.js";
import { createContactMessageSchema } from "../validators/contactValidators.js";

const router = express.Router();

router.post("/", validate(createContactMessageSchema), createContactMessage);

export default router;
