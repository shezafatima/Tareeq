import "server-only";
import { Schema } from "mongoose";
import { PRICING_LIMITS, PRICING_MODES } from "./rules";

// The stored pricing of a program or course (specs/034-pricing-certificate-announcement data-model.md §1).
// Optional on both models: a record without it keeps showing its price text.

export const pricingSchema = new Schema(
  {
    mode: { type: String, enum: PRICING_MODES, required: true },
    amount: {
      type: Number,
      min: 1,
      max: PRICING_LIMITS.amountMax,
      validate: { validator: Number.isInteger, message: "amount must be a whole number" },
    },
    originalAmount: {
      type: Number,
      min: 1,
      max: PRICING_LIMITS.amountMax,
      validate: { validator: Number.isInteger, message: "originalAmount must be a whole number" },
    },
    unitNote: { type: String, trim: true, maxlength: PRICING_LIMITS.unitNote },
    offerLabel: { type: String, trim: true, maxlength: PRICING_LIMITS.offerLabel },
    offerEndsText: { type: String, trim: true, maxlength: PRICING_LIMITS.offerEndsText },
  },
  { _id: false },
);
