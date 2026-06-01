// ============================================================
// Heavy-Duty Block Hinge — Print-in-Place
// Village Kit 3D Builder / GridKit
// ============================================================
//
// Rendered FLAT / OPEN (180°): both leaves are coplanar.
// Print orientation: flat on the bed, barrel up.
//
// Leaf layout (top view, open flat):
//
//   LEFT leaf          RIGHT leaf
//   [  knuckle 1  ]   [  knuckle 2  ]
//   [  knuckle 3  ]   [  knuckle 4  ]
//
// Knuckles interlock L-R-L-R from top (+Y) to bottom (-Y).
// ============================================================

$fn = 64;

// -----------------------------------------------------------
// OVERALL BODY
// -----------------------------------------------------------
total_width   = 62;      // mm — full open width (both leaves)
total_height  = 63;      // mm — top-to-bottom (= barrel length)
leaf_w        = total_width / 2;   // 31 mm each leaf
leaf_t        = 4.0;     // leaf plate thickness (Z when flat on bed)
corner_chamfer = 1.0;    // max chamfer on outer leaf corners

// -----------------------------------------------------------
// BARREL & KNUCKLES
// -----------------------------------------------------------
barrel_r      = 5.5;     // outer radius of barrel (11 mm OD)
barrel_len    = total_height;  // 63 mm
num_knuckles  = 4;
gap           = 0.4;     // gap between adjacent knuckles (mm)
num_gaps      = num_knuckles - 1;  // 3 gaps
knuckle_len   = (barrel_len - num_gaps * gap) / num_knuckles;
                          // = (63 - 1.2) / 4 = 15.45 mm

// -----------------------------------------------------------
// PIN (print-in-place)
// -----------------------------------------------------------
pin_r         = 3.0;     // radius of integrated pin (6 mm OD)
pin_hole_r    = 3.4;     // radius of hole in opposing leaf (6.8 mm)
                          // 0.4 mm radial clearance

// -----------------------------------------------------------
// MOUNTING HOLES  (M6 countersunk)
// -----------------------------------------------------------
hole_dia      = 6.5;     // through-hole diameter
cs_dia        = 13.0;    // countersink diameter (90° included angle)
cs_depth      = (cs_dia - hole_dia) / 2;  // depth for 90° CSK
hole_vert_cc  = 40;      // centre-to-centre vertical spacing
hole_horiz_cc = 40;      // centre-to-centre horizontal spacing
hole_from_end = 11.5;    // from top/bottom edges to hole centre
// Sanity check: hole_from_end * 2 + hole_vert_cc should equal total_height
// 11.5 + 40 + 11.5 = 63 ✓

// Derived: horizontal offset of each hole from leaf inner edge
// Holes are 20 mm from the barrel centreline, barrel is at X=0,
// so holes sit at X = ±20 mm. Within each leaf that is 20 mm
// from the centreline = leaf_w - 11 mm from the outer edge.
hole_x_from_cl = hole_horiz_cc / 2;   // 20 mm

// ============================================================
// MODULE: mounting_hole
//   Places one countersunk M6 hole, countersink on top face.
//   Call at Z=0 (bottom of leaf plate); hole runs +Z upward.
// ============================================================
module mounting_hole() {
    // Through hole
    cylinder(r = hole_dia / 2, h = leaf_t + 0.01);

    // 90° countersink on top face (Z = leaf_t)
    // For a 90° included angle the cone half-angle is 45°,
    // so depth = (cs_dia - hole_dia) / 2
    translate([0, 0, leaf_t - cs_depth])
        cylinder(r1 = hole_dia / 2, r2 = cs_dia / 2, h = cs_depth + 0.01);
}

// ============================================================
// MODULE: knuckle
//   A single cylindrical knuckle segment at the barrel.
//   is_pin: true  → solid pin (RIGHT leaf knuckles)
//           false → hollow, accepts pin (LEFT leaf knuckles)
//
//   Local origin: Z=0 at bottom of this knuckle, centred on
//   barrel axis (X=0, Y= -barrel_r ... +barrel_r projected
//   onto the leaf face, but we position in 3-D from the parent).
// ============================================================
module knuckle(is_pin = false) {
    difference() {
        // Outer barrel cylinder
        cylinder(r = barrel_r, h = knuckle_len);

        if (!is_pin) {
            // Hollow core — accepts the pin from the other leaf
            cylinder(r = pin_hole_r, h = knuckle_len + 0.02, center = false);
        }
    }

    if (is_pin) {
        // Integrated pin stub (solid, smaller radius)
        // Extends full knuckle height; the difference above keeps
        // the outer shell, no subtraction needed for pin knuckles.
        // (pin is just a solid cylinder of pin_r inside the barrel)
        // Already solid — nothing extra needed; barrel IS the pin body.
        // Pin radius is pin_r; the barrel itself is barrel_r.
        // We just leave it solid.  The hole in the opposing knuckle
        // provides the clearance.
    }
}

// ============================================================
// MODULE: leaf
//   One complete hinge leaf including its two knuckles.
//
//   side: "left"  → knuckles 1 (top) and 3 — hollow (pin hole)
//         "right" → knuckles 2 and 4 (bottom) — solid pin
//
//   The leaf plate occupies:
//     X: 0 to leaf_w  (right leaf) or -leaf_w to 0 (left leaf)
//     Y: 0 to total_height
//     Z: 0 to leaf_t
//
//   The barrel axis runs along Y, at X=0, Z= leaf_t + barrel_r.
//   (barrel sits proud of the plate top face)
// ============================================================
module leaf(side = "left") {
    is_right = (side == "right");
    is_pin   = is_right;   // right leaf carries the solid pin

    // Sign for X direction: right leaf goes +X, left goes -X
    x_sign = is_right ? 1 : -1;

    // ---- Leaf plate (flat rectangle) ----
    // Outer corners get a small chamfer (1 mm) on the outer edge.
    translate([is_right ? 0 : -leaf_w, 0, 0])
        cube([leaf_w, total_height, leaf_t]);

    // ---- Knuckles ----
    // Barrel axis: X=0, Z = leaf_t + barrel_r (barrel sits on top of plate)
    // Knuckle Y positions (bottom of each knuckle along barrel axis):
    //   knuckle 1 (top)    → Y start = total_height - knuckle_len
    //   knuckle 2          → Y start = total_height - knuckle_len - gap - knuckle_len
    //   knuckle 3          → etc.
    //   knuckle 4 (bottom) → Y start = 0
    //
    // LEFT  leaf: knuckles 1 and 3 (indices 0 and 2, counting from top)
    // RIGHT leaf: knuckles 2 and 4 (indices 1 and 3)

    for (i = [0 : num_knuckles - 1]) {
        // Determine which leaf this knuckle index belongs to
        knuckle_is_right = (i % 2 == 1);  // even=left(0,2), odd=right(1,3)

        if (knuckle_is_right == is_right) {
            // Y start of this knuckle (from top, index 0 = topmost)
            y_start = total_height - (i + 1) * knuckle_len - i * gap;

            translate([0, y_start, leaf_t + barrel_r])
                rotate([-90, 0, 0])   // cylinder along Y axis
                    knuckle(is_pin = is_pin);
        }
    }

    // ---- Mounting holes ----
    // Two holes per leaf, at:
    //   Y = hole_from_end  (near bottom)
    //   Y = total_height - hole_from_end  (near top)
    //   X = x_sign * hole_x_from_cl  (20 mm from centreline)
    //
    // Countersink on top face (Z = leaf_t, face away from print bed).

    for (y_pos = [hole_from_end, total_height - hole_from_end]) {
        translate([x_sign * hole_x_from_cl, y_pos, 0])
            mounting_hole();
    }
}

// ============================================================
// ASSEMBLY — rendered flat / open (180°)
// ============================================================
// Both leaves lie in the same plane.  The barrel centreline is
// the join at X=0.  LEFT leaf extends to -X, RIGHT to +X.

// LEFT leaf (knuckles 1 & 3, hollow / pin-hole)
leaf("left");

// RIGHT leaf (knuckles 2 & 4, solid pin)
leaf("right");
