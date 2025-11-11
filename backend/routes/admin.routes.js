import express from "express";
import { toggleActiveStatus, changeUserRole } from "../controllers/admin.controller.js";

const router = express.Router();
router.put("/:id/active", toggleActiveStatus);
router.put("/:id/role", changeUserRole);

export default router;