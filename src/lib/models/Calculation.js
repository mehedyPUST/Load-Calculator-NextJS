import mongoose from "mongoose";

const feederSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    bus: { type: Number, required: true },
    amps: { type: Number, default: 0 },
    mw: { type: Number, default: 0 },
    /** 33 kV ring line active on this feeder at save time */
    ringActive: { type: Boolean, default: false },
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
    hourSlot: { type: String, default: null },
    isHourly: { type: Boolean, default: false },
    note: { type: String, default: "" },
    /** true if any feeder had an active 33 kV ring when saved */
    hasActiveRing: { type: Boolean, default: false },
    /** null = active history; set = in trash */
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

calculationSchema.index({ deletedAt: 1, createdAt: -1 });
calculationSchema.index({ deletedAt: 1, isHourly: 1, calculatedAt: -1 });
calculationSchema.index({ deletedAt: 1, hasActiveRing: 1, calculatedAt: -1 });

export default mongoose.models.Calculation ||
  mongoose.model("Calculation", calculationSchema);
