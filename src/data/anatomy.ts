import { AnatomyPart } from '../types';

export const ANATOMY_PARTS: Record<string, AnatomyPart> = {
  workpiece: {
    title: "Workpiece & 3-Jaw Chuck",
    category: "ROTARY DRIVE",
    desc: "The cylindrical metal stock is clamped by three synchronized, self-centering jaws on the heavy chuck. The chuck is securely bolted to the spindle nose, which runs on ultra-precision bearings inside the headstock.",
    bullets: [
      "Precision ground scroll-jaw mechanism ensures stock concentricity within 0.02 mm",
      "Transmits extreme rotational torque from the drive spindle directly to the raw stock",
      "High clamping force keeps metal parts perfectly rigid under intense lateral cutting loads"
    ],
    cameraPos: { x: 0.8, y: 1.4, z: 1.8 },
    targetPos: { x: 0.0, y: 0.87, z: -0.12 }
  },
  headstock: {
    title: "Headstock Assembly",
    category: "POWER & GEARING",
    desc: "The structural powerhouse of the lathe. It houses the high-torque electric motor, the speed-change gear selector train, and the main hollow spindle that holds the chuck.",
    bullets: [
      "Rigid cast-iron casing acts as an acoustic and vibration damper during heavy roughing",
      "Contains dual-taper roller bearings preloaded to handle high radial and axial thrust forces",
      "Integrates the gear selectors which govern low-range torque vs high-range speed ratios"
    ],
    cameraPos: { x: -0.9, y: 1.6, z: 1.8 },
    targetPos: { x: -0.65, y: 0.80, z: -0.05 }
  },
  toolpost: {
    title: "4-Way Indexing Tool Post (Rear Mount)",
    category: "CUTTING TOOL ASSEMBLY",
    desc: "Mounted atop the compound slide at the back of the machine, the 4-Way Indexing Tool Post secures the square tool shank in place with clamping bolts. It aligns the indexable carbide insert with the spindle centerline ($Y = 0.87$ in the 3D scene).",
    bullets: [
      "4-way indexing head allows quick indexing between turning, facing, and chamfering tools",
      "8 heavy-duty top clamping bolts deliver maximum locking force to prevent tool chatter",
      "Equipped with a triangular indexable tungsten-carbide insert for long edge life"
    ],
    cameraPos: { x: 0.8, y: 1.4, z: 1.2 },
    targetPos: { x: 0.4, y: 0.87, z: 0.10 }
  },
  compoundrest: {
    title: "Compound Rest & Swivel Slide",
    category: "TOOL ORIENTATION",
    desc: "Located on top of the rear-mounted cross-slide, this assembly can be swiveled and clamped at any angular orientation. It is used to hand-feed the tool for cutting precise tapers, chamfers, and bevels.",
    bullets: [
      "Equipped with a circular scale graduated in degrees for angular dial settings",
      "Features a compact, hand-cranked lead screw separate from the main carriage drive",
      "Enables high-precision chamfering of thread entries and tapered surfaces"
    ],
    cameraPos: { x: 0.8, y: 1.5, z: 1.2 },
    targetPos: { x: 0.4, y: 0.82, z: 0.15 }
  },
  crossslide: {
    title: "Cross-Slide Table (Rear Slide)",
    category: "TRANSVERSE FEED",
    desc: "Slides on precision-ground dovetail ways perpendicularly across the bed ($X$-axis) on the back side of the machine. It controls the diameter of the finished piece by moving the tool directly into or out of the workpiece from the rear.",
    bullets: [
      "Features a micro-calibrated handwheel dial to set cutting depths in fractional millimeters",
      "Dovetail ways are adjustable via a brass gib strip to eliminate mechanical backlash",
      "Provides flat facing operations across the face of the rotating stock"
    ],
    cameraPos: { x: 0.2, y: 1.4, z: 1.3 },
    targetPos: { x: 0.4, y: 0.73, z: 0.20 }
  },
  carriage: {
    title: "Carriage & Rear Apron",
    category: "LONGITUDINAL MOTION",
    desc: "A massive, H-shaped structural casting that spans the lathe bed. In this left-hand machine layout, the feed gearbox, main lead screw, and apron plates are mounted at the back of the bed.",
    bullets: [
      "Large handwheel drives a pinion along a gear rack on the bed for rapid positioning",
      "Contains the split-jaw half-nut mechanism that locks onto the lead screw for thread cutting",
      "Integrates safety interlocks to prevent simultaneous manual feed and lead screw engagement"
    ],
    cameraPos: { x: 0.6, y: 1.3, z: 1.6 },
    targetPos: { x: 0.4, y: 0.62, z: 0.35 }
  },
  bedways: {
    title: "Lathe Bed & Precision V-Ways",
    category: "STRUCTURAL FRAME",
    desc: "The heavy foundation of the machine, cast from close-grained alloy iron. It supports all moving components and holds them in perfect, frictionless alignment.",
    bullets: [
      "V-profile guide ways are flame-hardened and precision-ground to prevent wear",
      "High natural damping capacity absorbs high-frequency vibrations ('chatter')",
      "Engineered with deep rib-reinforced structural webs to prevent torsional twisting"
    ],
    cameraPos: { x: 0.8, y: 1.8, z: 2.5 },
    targetPos: { x: 0.8, y: 0.6, z: 0.0 }
  },
  tailstock: {
    title: "Tailstock Assembly",
    category: "AUXILIARY SUPPORT",
    desc: "Clamped at the right-hand end of the bed, the tailstock supports long, slender shafts that would otherwise bend or whip under heavy cutting forces. It is also used to hold drilling chucks.",
    bullets: [
      "Internal Morse Taper #3 quill extends and retracts via a handwheel with depth graduations",
      "Equipped with a heavy-duty ball-bearing live center to eliminate frictional heating",
      "Can be offset laterally to allow turning of shallow tapers over long distances"
    ],
    cameraPos: { x: 1.6, y: 1.5, z: 1.4 },
    targetPos: { x: 0.9, y: 0.87, z: -0.12 }
  },
  footbrake: {
    title: "Foot Brake Pedal Treadle (Leg Brake)",
    category: "EMERGENCY SAFETY & BRAKING",
    desc: "Located near floor level extending horizontally under the bed between the headstock and tailstock pedestals. Stepping on this full-length foot treadle bar immediately trips an electrical motor cutoff microswitch and mechanically contracts a friction band brake on the main spindle drum inside the headstock.",
    bullets: [
      "Floor-level horizontal treadle bar allows immediate emergency braking from any standing position",
      "Cuts off main drive motor electrical power instantaneously while applying mechanical braking force",
      "Reduces spindle coast-down time from over 10 seconds down to under 1 second for safe operation"
    ],
    cameraPos: { x: 0.8, y: -0.2, z: 2.2 },
    targetPos: { x: 0.8, y: -0.65, z: 0.5 }
  }
};
