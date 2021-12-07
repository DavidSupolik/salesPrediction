import { Router } from "express";
import { predictSales } from "../services/prediction.service.js"

const router = Router();

router.post('/predict', predictSales);

export default router;