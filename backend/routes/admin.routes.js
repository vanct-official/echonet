import express from "express";
import { toggleActiveStatus } from "../controllers/admin.controller.js";

const router = express.Router();
router.put("/:id/active", toggleActiveStatus);

export default router;