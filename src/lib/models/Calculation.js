import mongoose from "mongoose";

const feederSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    bus: { type: Number, required: true },
    amps: { type: Number, default: 0 },
    mw: { type: Number, default: 0 },
  },
  { _id: false }
);

const calculationSchema = new mongoose.Schema(
  {
    busVoltages: {
      bus1: { type: Number, required: true },
      bus2: { type: Number, required: true },
    },
    feeders: [feederSchema],
    bottail11kV: { type: Number, default: 0 },
    totalMW: { type: Number, default: 0 },
    calculatedAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    /** null = active history; set = in trash */
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

calculationSchema.index({ deletedAt: 1, createdAt: -1 });

export default mongoose.models.Calculation ||
  mongoose.model("Calculation", calculationSchema);
