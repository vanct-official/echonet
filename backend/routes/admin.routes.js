import express from "express";
import {getUserStatistics, getPostStatistics, toggleActiveStatus, changeUserRole } from "../controllers/admin.controller.js";

const router = express.Router();
router.get("/statistics", getUserStatistics);
router.get("/post-statistics", getPostStatistics);
router.put("/:id/active", toggleActiveStatus);
router.put("/:id/role", changeUserRole);

export default router;