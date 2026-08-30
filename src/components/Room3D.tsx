"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture, RoundedBox, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { RoomZone } from "@/types";

export interface PlacedRoomItem {
  title: string;
  imageUrl: string | null;
}

// Real Northwestern Residential Services furniture dimensions (inches),
// converted to feet (/12) so the scene is metrically honest rather than
// eyeballed: twin XL bed, 42x24x30in desk, 42x12x24in desk shelf, and a
// 42x24x72in wardrobe (see src/lib room notes / product page for source).
const IN = 1 / 12;
const ROOM_W = 11; // ft, back wall width
const ROOM_D = 12; // ft, side wall depth
const WALL_H = 8; // ft

const BED_LEN = 80 * IN;
const BED_WID = 39 * IN;
const BED_TOP = 22 * IN;

const DESK_W = 42 * IN;
const DESK_D = 24 * IN;
const DESK_H = 30 * IN;
const SHELF_H = 0.12;

const WARDROBE_W = 42 * IN;
const WARDROBE_D = 24 * IN;
const WARDROBE_H = 72 * IN;

const WOOD = "#C9A876";
const WOOD_DARK = "#B0885A";
const WALL_COLOR = "#F4EDE0";
const FLOOR_COLOR = "#D9D0BE";
const METAL = "#8B8378";

function Walls() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, WALL_H / 2, -ROOM_D / 2]} receiveShadow>
        <planeGeometry args={[ROOM_W, WALL_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>
      {/* Left wall */}
      <mesh
        position={[-ROOM_W / 2, WALL_H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_D, WALL_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.8} />
      </mesh>
    </group>
  );
}

// Shared with WallDecor below so wall items can actually avoid the window's
// footprint instead of a grid that has no idea the window exists.
const WINDOW_X = -1.5;
const WINDOW_Y = 5;
const WINDOW_W = 2.6;
const WINDOW_H = 3.4;

function Window() {
  const x = WINDOW_X;
  const y = WINDOW_Y;
  const z = -ROOM_D / 2 + 0.02;
  const w = WINDOW_W;
  const h = WINDOW_H;
  return (
    <group position={[x, y, z]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#EAF1F2" roughness={0.2} metalness={0.05} />
      </mesh>
      {[-w / 2, w / 2].map((fx) => (
        <mesh key={fx} position={[fx, 0, 0.01]}>
          <boxGeometry args={[0.08, h, 0.05]} />
          <meshStandardMaterial color={METAL} />
        </mesh>
      ))}
      {[-h / 2, h / 2].map((fy) => (
        <mesh key={fy} position={[0, fy, 0.01]}>
          <boxGeometry args={[w, 0.08, 0.05]} />
          <meshStandardMaterial color={METAL} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.05, h, 0.05]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[w, 0.05, 0.05]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
    </group>
  );
}

// Bed sits lengthwise against the left wall, headboard at the back.
const BED_X = -ROOM_W / 2 + BED_WID / 2 + 0.05;
const BED_Z = -ROOM_D / 2 + BED_LEN / 2 + 0.05;

function Bed() {
  const legY = 9 * IN; // frame leg height
  return (
    <group position={[BED_X, 0, BED_Z]}>
      {[
        [-BED_WID / 2 + 0.08, -BED_LEN / 2 + 0.08],
        [BED_WID / 2 - 0.08, -BED_LEN / 2 + 0.08],
        [-BED_WID / 2 + 0.08, BED_LEN / 2 - 0.08],
        [BED_WID / 2 - 0.08, BED_LEN / 2 - 0.08],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, legY / 2, lz]} castShadow>
          <boxGeometry args={[0.08, legY, 0.08]} />
          <meshStandardMaterial color={METAL} />
        </mesh>
      ))}
      <mesh position={[0, legY + 0.03, 0]} castShadow>
        <boxGeometry args={[BED_WID, 0.06, BED_LEN]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0, (BED_TOP + legY) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BED_WID - 0.02, BED_TOP - legY, BED_LEN - 0.02]} />
        <meshStandardMaterial color="#EDE7DC" roughness={0.85} />
      </mesh>
    </group>
  );
}

const DESK_X = 0.3;
const DESK_Z = -ROOM_D / 2 + DESK_D / 2 + 0.05;

function Desk() {
  return (
    <group position={[DESK_X, 0, DESK_Z]}>
      <mesh position={[-DESK_W / 2 + 0.1, (DESK_H - 0.1) / 2, 0]} castShadow>
        <boxGeometry args={[0.2, DESK_H - 0.1, DESK_D]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[DESK_W / 2 - 0.1, (DESK_H - 0.1) / 2, 0]} castShadow>
        <boxGeometry args={[0.2, DESK_H - 0.1, DESK_D]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[0, DESK_H - 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[DESK_W, 0.1, DESK_D]} />
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </mesh>
      {/* wall-mounted shelf */}
      <mesh position={[0, DESK_H + 1.1, -DESK_D / 2 + 0.15]} castShadow>
        <boxGeometry args={[DESK_W * 0.9, SHELF_H, 0.3]} />
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Chair() {
  const x = DESK_X;
  const z = DESK_Z + DESK_D / 2 + 1.1;
  const seatH = 1.5;
  return (
    <group position={[x, 0, z]}>
      {[
        [-0.6, -0.55],
        [0.6, -0.55],
        [-0.6, 0.55],
        [0.6, 0.55],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, seatH / 2, lz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, seatH, 8]} />
          <meshStandardMaterial color="#3A342A" />
        </mesh>
      ))}
      <mesh position={[0, seatH + 0.06, 0]} castShadow>
        <boxGeometry args={[1.4, 0.12, 1.3]} />
        <meshStandardMaterial color="#5B5347" roughness={0.7} />
      </mesh>
      <mesh position={[0, seatH + 0.7, -0.58]} castShadow>
        <boxGeometry args={[1.4, 1.3, 0.12]} />
        <meshStandardMaterial color="#5B5347" roughness={0.7} />
      </mesh>
    </group>
  );
}

const WARDROBE_X = ROOM_W / 2 - WARDROBE_W / 2 - 0.05;
const WARDROBE_Z = -ROOM_D / 2 + WARDROBE_D / 2 + 0.05;

function Wardrobe() {
  return (
    <group position={[WARDROBE_X, WARDROBE_H / 2, WARDROBE_Z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[WARDROBE_W, WARDROBE_H, WARDROBE_D]} />
        <meshStandardMaterial color="#EFE9DC" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, WARDROBE_D / 2 + 0.005]}>
        <boxGeometry args={[0.02, WARDROBE_H - 0.2, 0.01]} />
        <meshStandardMaterial color="#C9C2B0" />
      </mesh>
      {[-0.12, 0.12].map((hx) => (
        <mesh key={hx} position={[hx, 0.3, WARDROBE_D / 2 + 0.03]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={METAL} />
        </mesh>
      ))}
    </group>
  );
}

// three.js's TextureLoader requests images with crossOrigin="anonymous",
// which the Google Shopping thumbnail hosts don't answer with CORS headers
// — the browser then refuses to hand the pixels to WebGL. Routing through
// Next's own image endpoint makes the request same-origin, which sidesteps
// CORS entirely (and is already allowlisted for these hosts in next.config).
function proxiedImageUrl(url: string, width = 256) {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}

// Small objects (pillows, vases, lamps) don't read as real once you paste
// a flat product photo on them — a photo can't wrap around a 3D shape
// without warping. Instead we sample the photo's own average color (via an
// offscreen canvas, same-origin through the proxy above so it doesn't
// taint) and use that to color an actual 3D shape, so the object matches
// what the student picked without pretending a flat image is a solid.
function useDominantColor(url: string | null, fallback = "#DED6C4"): string {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 20;
        canvas.height = 20;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 20, 20);
        const data = ctx.getImageData(0, 0, 20, 20).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
        if (n === 0 || cancelled) return;
        setColor(`rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`);
      } catch {
        // tainted/undecodable canvas — keep the fallback color
      }
    };
    img.src = proxiedImageUrl(url, 32);
    return () => {
      cancelled = true;
    };
  }, [url]);
  return color;
}

// drei's <Image> renders with an unlit shader (built for gallery-style
// display), so it never picks up the room's directional light or shadows
// the way the rest of the furniture does — next to properly shaded
// geometry it reads as a flat sticker rather than something sitting in
// the room. Loading the texture ourselves and mapping it onto a normal
// lit mesh (meshStandardMaterial) makes it shade, catch shadows, and dim
// in corners exactly like the furniture around it.
function LitPhoto({
  url,
  position,
  rotation,
  size,
}: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number];
}) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
    </mesh>
  );
}

function DecorItem({
  item,
  position,
  rotation,
  size,
}: {
  item: PlacedRoomItem;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number];
}) {
  if (!item.imageUrl) {
    return (
      <mesh position={position} rotation={rotation} castShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#E8E1D2" roughness={0.9} />
      </mesh>
    );
  }
  return (
    <Suspense fallback={null}>
      <LitPhoto url={proxiedImageUrl(item.imageUrl)} position={position} rotation={rotation} size={size} />
    </Suspense>
  );
}

// A thin backing box behind each wall photo so it reads as a framed print
// hung on the wall, not a flat image floating in front of it.
function WallFrame({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[size[0] + 0.14, size[1] + 0.14, 0.03]} />
      <meshStandardMaterial color="#7A6A52" roughness={0.7} />
    </mesh>
  );
}

// A real mirror is a reflective disc in a frame, not a printed image — a
// flat photo of a mirror would just show whatever the product photographer
// shot reflected in it, which reads as fake. Render an actual round
// reflective surface instead, colored by the frame's own tone.
function WallMirror({
  position,
  radius,
  frameColor,
}: {
  position: [number, number, number];
  radius: number;
  frameColor: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[radius + 0.09, 32]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color="#AEBEC2" metalness={0.9} roughness={0.05} envMapIntensity={1.4} />
      </mesh>
    </group>
  );
}

function isMirror(title: string) {
  return title.toLowerCase().includes("mirror");
}

function isStringLights(title: string) {
  const t = title.toLowerCase();
  return t.includes("string light") || t.includes("fairy light") || t.includes("curtain light");
}

// A curtain of string lights is a cluster of small emitters on hanging
// wires, not a framed print — a flat photo of it loses the actual glow.
// Draw vertical wire strands with small emissive "bulb" spheres directly
// against the wall instead of WallFrame's single picture-sized slot — a
// real string-light curtain runs the length of a wall, not a 9-inch
// square, and "surrounds the room" rather than sitting in one grid cell.
// `rotationY` lets the same component hang on the back wall (0) or the
// left wall (90°, matching Walls()' own left-wall rotation) so both
// visible walls can carry it.
function WallStringLights({
  position,
  rotationY = 0,
  width = 0.78,
  height = 1.15,
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
}) {
  const cols = Math.max(5, Math.round(width / 0.18));
  const rows = 7;
  const strandXs = Array.from({ length: cols }, (_, i) => -width / 2 + (i / (cols - 1)) * width);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {strandXs.map((sx) => (
        <mesh key={`wire-${sx}`} position={[sx, 0, 0.015]}>
          <boxGeometry args={[0.004, height, 0.004]} />
          <meshStandardMaterial color="#4A4438" />
        </mesh>
      ))}
      {strandXs.map((sx) =>
        Array.from({ length: rows }).map((_, ri) => {
          const py = height / 2 - (ri / (rows - 1)) * height;
          return (
            <mesh key={`${sx}-${ri}`} position={[sx, py, 0.027]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#FFE9B8" emissive="#FFDFA0" emissiveIntensity={1.2} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function isCurtain(title: string) {
  const t = title.toLowerCase();
  return (t.includes("curtain") || t.includes("drape")) && !isStringLights(title);
}

// Fabric curtain panels flanking the window — every coastal-cowgirl
// reference photo has some kind of window treatment, and a room with a
// bare window reads as unfinished next to them. Two sheer panels on a rod,
// printed with the same fabric-texture system as bedding (fabricKindFromTitle
// picks up "lace" as a floral-ish motif, see below) so a lace curtain shows
// an actual delicate print instead of a flat white rectangle. Rendered at
// the window's own position rather than the wall grid — a curtain belongs
// flanking the window, not in a random grid slot next to a picture frame.
function WindowCurtains({ title }: { title: string }) {
  const kind = fabricKindFromTitle(title);
  // A near-wall-colored fallback ("#F4EFE3" against WALL_COLOR "#F4EDE0")
  // used to render an invisible curtain — a sheer white panel needs to
  // read distinctly brighter than the warm wall directly behind it, not
  // just a hair different.
  const color = fabricColorFromTitle(title, "#FFFFFF");
  const base = useFabricTexture(kind, color);
  const rodY = WINDOW_Y + WINDOW_H / 2 + 0.3;
  const panelW = 0.5;
  const panelH = WINDOW_H + 1.0;
  const panelY = rodY - 0.1 - panelH / 2;
  const z = -ROOM_D / 2 + 0.05;
  const leftX = WINDOW_X - WINDOW_W / 2 - panelW / 2 + 0.12;
  const rightX = WINDOW_X + WINDOW_W / 2 + panelW / 2 - 0.12;
  const tex = useTiledFabric(base, panelW, panelH);
  return (
    <group>
      <mesh position={[WINDOW_X, rodY, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, WINDOW_W + panelW * 1.7, 8]} />
        <meshStandardMaterial color="#B8AF9C" metalness={0.4} roughness={0.4} />
      </mesh>
      {[leftX, rightX].map((x) => (
        <mesh key={x} position={[x, panelY, z + 0.015]} castShadow receiveShadow>
          <planeGeometry args={[panelW, panelH]} />
          <meshStandardMaterial map={tex} roughness={0.85} transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// Its own component (rather than inlined in WallDecor's .map) so the
// useDominantColor hook below has a stable call site per item, regardless
// of how many items are in the zone. String lights and curtains are
// handled separately in WallDecor (they render at fixed positions — a
// room-spanning light curtain and window-flanking panels — not a grid slot).
function isCapizShell(title: string) {
  const t = title.toLowerCase();
  return t.includes("shell") && (t.includes("wall") || t.includes("hanging") || t.includes("garland"));
}

// A capiz-shell hanging is a loose cluster of small overlapping discs, not
// a single flat print — a framed photo of one reads as a blurry beige
// square. Fake the iridescent, slightly-irregular shell look with several
// small low-poly discs (a heptagon reads as "organic" without needing a
// real irregular mesh), staggered in depth so they visibly overlap like a
// real cluster, in a pearly near-white with a touch of metalness for
// shimmer under the room's lights.
function CapizShellHanging({ position }: { position: [number, number, number] }) {
  const [x, y, wallZ] = position;
  const shells: [number, number, number][] = [
    [0, 0.32, 1], [-0.24, 0.08, 0.85], [0.24, 0.08, 0.85],
    [-0.13, -0.2, 0.7], [0.13, -0.2, 0.7], [0, -0.42, 0.6],
    [-0.3, -0.36, 0.62], [0.3, -0.36, 0.62],
  ];
  return (
    <group position={[x, y, wallZ + 0.02]}>
      {shells.map(([sx, sy, scale], i) => (
        <mesh key={i} position={[sx, sy, 0.008 * i]} rotation={[0, 0, (i * 0.6) % Math.PI]} castShadow>
          <circleGeometry args={[0.15 * scale, 7]} />
          <meshStandardMaterial color="#F1EAD9" roughness={0.35} metalness={0.15} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function isCorkboard(title: string) {
  const t = title.toLowerCase();
  return t.includes("corkboard") || t.includes("cork board") || t.includes("memo board");
}

// A ribbon memo board's whole identity is the criss-cross ribbon and the
// clipped photos on it — a Shopping photo of one is a lifestyle shot with
// someone else's already-clipped photos and random clutter, which reads
// as noise stretched onto a frame rather than "a corkboard." Build the
// cork backing, ribbon crosses, and a few blank photo squares directly.
function RibbonCorkboard({ position, title }: { position: [number, number, number]; title: string }) {
  const [x, y, wallZ] = position;
  const w = 0.85;
  const h = 0.85;
  const ribbonColor = fabricColorFromTitle(title, "#8CA2B5");
  const photos: [number, number, number][] = [
    [-0.2, 0.15, 1], [0.18, 0.06, -1], [-0.06, -0.22, 1], [0.22, -0.2, -1],
  ];
  return (
    <group position={[x, y, wallZ + 0.02]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.03]} />
        <meshStandardMaterial color="#D9C7A3" roughness={0.95} />
      </mesh>
      {[-0.22, 0.22].map((dx) => (
        <mesh key={`v-${dx}`} position={[dx, 0, 0.017]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.012, h * 0.95, 0.004]} />
          <meshStandardMaterial color={ribbonColor} roughness={0.7} />
        </mesh>
      ))}
      {[-0.2, 0.2].map((dy) => (
        <mesh key={`h-${dy}`} position={[0, dy, 0.017]} rotation={[0, 0, Math.PI / 2 + 0.15]}>
          <boxGeometry args={[0.012, w * 0.95, 0.004]} />
          <meshStandardMaterial color={ribbonColor} roughness={0.7} />
        </mesh>
      ))}
      {photos.map(([px, py, sign], i) => (
        <mesh key={i} position={[px, py, 0.022]} rotation={[0, 0, sign * 0.08]} castShadow>
          <planeGeometry args={[0.16, 0.12]} />
          <meshStandardMaterial color="#F4F1E9" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function isClock(title: string) {
  return title.toLowerCase().includes("clock");
}

// A starburst clock's whole identity is the radiating spokes — a flat
// product photo squashed into the standard 0.9x0.9 frame just shows a
// vague circle. Build the actual spokes (thin tapered boxes fanning out
// from a center disc) plus hands, colored from the photo like Mirror.
function StarburstClock({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const [x, y, wallZ] = position;
  const spokes = 16;
  return (
    <group position={[x, y, wallZ + 0.02]}>
      {Array.from({ length: spokes }).map((_, i) => {
        const a = (i / spokes) * Math.PI * 2;
        const len = i % 2 === 0 ? 0.46 : 0.34;
        return (
          <mesh key={i} rotation={[0, 0, a]} position={[Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.5, 0]} castShadow>
            <boxGeometry args={[len, 0.025, 0.015]} />
            <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.09, 20]} />
        <meshStandardMaterial color="#F4EDE0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0.014]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[0.11, 0.012, 0.006]} />
        <meshStandardMaterial color="#2B2B2B" />
      </mesh>
      <mesh position={[0, 0.02, 0.014]} rotation={[0, 0, -0.9]}>
        <boxGeometry args={[0.075, 0.012, 0.006]} />
        <meshStandardMaterial color="#2B2B2B" />
      </mesh>
    </group>
  );
}

function isPennant(title: string) {
  return title.toLowerCase().includes("pennant");
}

// A pennant is a triangle, not a square print — the standard WallFrame
// slot forces it into a rectangle and loses the actual silhouette that
// makes it read as a pennant flag. A simple flat triangle on a thin
// dowel, colored from the photo, fixes that with almost no extra code.
function PennantFlag({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const [x, y, wallZ] = position;
  // A pennant is wide and short — pole edge on the left, tapering to a
  // point on the right — not a tall narrow spike. w/h swapped from an
  // earlier version read as a thin sliver rather than a flag silhouette.
  const w = 0.78;
  const h = 0.34;
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, h / 2);
    s.lineTo(0, -h / 2);
    s.lineTo(w, 0);
    s.closePath();
    return s;
  }, [w, h]);
  return (
    <group position={[x, y, wallZ + 0.02]}>
      <mesh position={[-0.02, 0, -0.006]}>
        <boxGeometry args={[0.014, h + 0.14, 0.014]} />
        <meshStandardMaterial color="#7A6A52" roughness={0.6} />
      </mesh>
      <mesh position={[-w / 2, 0, 0]} castShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WallDecorItem({
  item,
  position,
}: {
  item: PlacedRoomItem;
  position: [number, number, number];
}) {
  const mirror = isMirror(item.title);
  const clock = isClock(item.title);
  const pennant = isPennant(item.title);
  const color = useDominantColor(mirror || clock ? item.imageUrl : null, "#7A6A52");
  const [x, y, wallZ] = position;

  if (mirror) {
    return <WallMirror position={[x, y, wallZ + 0.02]} radius={0.42} frameColor={color} />;
  }
  if (clock) {
    return <StarburstClock position={position} color={color} />;
  }
  if (pennant) {
    // A pennant's own product photo is usually padded with white
    // background around the small triangle, so the sampled average washes
    // out to near-white and disappears against the wall — same problem
    // bedding had. Read the color from the title instead (same system as
    // fabric prints), with a deep red fallback (classic pennant felt).
    return <PennantFlag position={position} color={fabricColorFromTitle(item.title, "#8C3B3B")} />;
  }
  if (isCapizShell(item.title)) {
    return <CapizShellHanging position={[x, y, wallZ]} />;
  }
  if (isCorkboard(item.title)) {
    return <RibbonCorkboard position={[x, y, wallZ]} title={item.title} />;
  }
  return (
    <group>
      <WallFrame position={[x, y, wallZ + 0.02]} size={[0.9, 0.9]} />
      <DecorItem item={item} position={[x, y, wallZ + 0.035]} size={[0.82, 0.82]} />
    </group>
  );
}

// A grid of positions across the wall's usable width — the space between
// the room's left edge and the wardrobe, minus the window. Earlier this
// was a blind col/row grid with no idea the window existed, so a third
// wall item would land squarely inside it (rendering underneath the
// window glass). Each candidate slot is now checked against the window's
// actual rectangle and skipped if it overlaps, so items flow around it
// instead of through it, regardless of how many are placed.
function wallGridPositions(count: number): [number, number][] {
  const startX = -ROOM_W / 2 + 0.9;
  const endX = WARDROBE_X - WARDROBE_W / 2 - 0.6;
  const colSpacing = 1.3;
  const rowSpacing = 1.3;
  const topY = 6.4;
  const cols = Math.max(1, Math.floor((endX - startX) / colSpacing) + 1);
  const pad = 0.15;
  const halfSlot = 0.5;
  const positions: [number, number][] = [];
  for (let row = 0; positions.length < count && row < 6; row++) {
    for (let col = 0; col < cols && positions.length < count; col++) {
      const x = startX + col * colSpacing;
      const y = topY - row * rowSpacing;
      const overlapsWindow =
        x + halfSlot + pad > WINDOW_X - WINDOW_W / 2 &&
        x - halfSlot - pad < WINDOW_X + WINDOW_W / 2 &&
        y + halfSlot + pad > WINDOW_Y - WINDOW_H / 2 &&
        y - halfSlot - pad < WINDOW_Y + WINDOW_H / 2;
      if (!overlapsWindow) positions.push([x, y]);
    }
  }
  return positions;
}

function WallDecor({ items }: { items: PlacedRoomItem[] }) {
  const wallZ = -ROOM_D / 2;
  const wallX = -ROOM_W / 2;
  const lightItems = items.filter((it) => isStringLights(it.title));
  const curtainItems = items.filter((it) => isCurtain(it.title));
  const otherItems = items.filter((it) => !isStringLights(it.title) && !isCurtain(it.title));
  const positions = wallGridPositions(otherItems.length);
  return (
    <>
      {lightItems.length > 0 && (
        <>
          {/* Back wall: spans nearly the full width, tucked under the ceiling. */}
          <WallStringLights position={[0, 7.5, wallZ]} width={ROOM_W - 1} height={0.9} />
          {/* Left wall: same band, rotated to match Walls()' own left-wall orientation — together the two rings the visible walls near the ceiling. */}
          <WallStringLights position={[wallX, 7.5, 0]} rotationY={Math.PI / 2} width={ROOM_D - 1} height={0.9} />
        </>
      )}
      {curtainItems.length > 0 && <WindowCurtains title={curtainItems[0].title} />}
      {otherItems.map((item, i) => {
        const [x, y] = positions[i];
        return (
          <WallDecorItem
            key={`${item.title}-${i}`}
            item={item}
            position={[x, y, wallZ]}
          />
        );
      })}
    </>
  );
}

// ---- Bedding as an actual printed fabric ----
// Google Shopping's bedding/pillow thumbnails are almost always full
// lifestyle photos (a whole staged bedroom or couch — window, other
// pillows, floor) rather than a flat product shot, and sampling their
// average color (useDominantColor, above) washes out to near-white
// because most of the frame is background, not fabric — a "Blue & White
// Floral Toile" set samples as flat grey. Product titles reliably name
// their own print and color ("Blue & White Floral Toile", "Cream
// Gingham", "Ticking Stripe") — read those straight from the title and
// draw an actual tiled print (stripe / gingham / floral) instead, so
// bedding reads as a coordinated set rather than a solid blob or a
// warped photo of somebody else's room.
type FabricKind = "stripe" | "gingham" | "floral" | "solid";

const FABRIC_COLOR_WORDS: [string, string][] = [
  ["navy", "#2F3E52"],
  ["denim", "#4A6B8A"],
  ["blue", "#5E7A96"],
  ["turquoise", "#4FA8A0"],
  ["teal", "#3D6B6B"],
  ["sage", "#8FA37E"],
  ["olive", "#6B6B3D"],
  ["green", "#7C8F6A"],
  ["coral", "#E0796A"],
  ["pink", "#E3AFC0"],
  ["maroon", "#5C2028"],
  ["burgundy", "#6E2A33"],
  ["red", "#B5473F"],
  ["rust", "#B5603A"],
  ["orange", "#D08A4B"],
  ["gold", "#C9A24B"],
  ["yellow", "#E4C05A"],
  ["mustard", "#C9A23B"],
  ["purple", "#9C86B0"],
  ["lilac", "#B6A4C9"],
  ["gray", "#9A9186"],
  ["grey", "#9A9186"],
  ["black", "#2B2B2B"],
  ["charcoal", "#3A3A3A"],
  ["brown", "#7A5C3E"],
  ["walnut", "#6B4A32"],
  ["tan", "#C8B38A"],
  ["cream", "#E9DEC6"],
  ["ivory", "#EFE6D2"],
  ["beige", "#E3D8C3"],
  ["neutral", "#C4B8A5"],
  ["white", "#DED2B8"],
];
const FABRIC_BASE = "#F8F5EE";

function fabricColorFromTitle(title: string, fallback: string): string {
  const lower = title.toLowerCase();
  for (const [word, hex] of FABRIC_COLOR_WORDS) {
    if (lower.includes(word)) return hex;
  }
  return fallback;
}

function fabricKindFromTitle(title: string): FabricKind {
  const lower = title.toLowerCase();
  if (lower.includes("stripe") || lower.includes("ticking")) return "stripe";
  if (lower.includes("gingham") || lower.includes("check") || lower.includes("plaid")) return "gingham";
  if (lower.includes("floral") || lower.includes("toile") || lower.includes("botanical") || lower.includes("flower") || lower.includes("lace")) return "floral";
  return "solid";
}

// Deterministic PRNG (mulberry32) so a floral print's scattered blooms sit
// in the same spots every render instead of jittering on every mount.
function mulberry32(seed: number) {
  return function rand() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, deltaL: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + deltaL, 0, 1));
  return `#${c.getHexString()}`;
}

function drawFabricPattern(ctx: CanvasRenderingContext2D, size: number, kind: FabricKind, color: string) {
  if (kind === "solid") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    return;
  }
  ctx.fillStyle = FABRIC_BASE;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = color;
  if (kind === "stripe") {
    const bandW = size / 6;
    for (let x = 0; x < size; x += bandW * 2) ctx.fillRect(x, 0, bandW, size);
  } else if (kind === "gingham") {
    ctx.globalAlpha = 0.5;
    const band = size / 5;
    for (let x = 0; x < size; x += band * 2) ctx.fillRect(x, 0, band, size);
    for (let y = 0; y < size; y += band * 2) ctx.fillRect(0, y, size, band);
    ctx.globalAlpha = 1;
  } else if (kind === "floral") {
    const rand = mulberry32(7);
    const petalCenter = shade(color, -0.12);
    const cols = 4;
    const rows = 4;
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const cx = (gx + 0.5 + (rand() - 0.5) * 0.5) * (size / cols);
        const cy = (gy + 0.5 + (rand() - 0.5) * 0.5) * (size / rows);
        const r = size * 0.03 + rand() * size * 0.012;
        ctx.fillStyle = color;
        for (let p = 0; p < 5; p++) {
          const angle = (p / 5) * Math.PI * 2;
          const px = cx + Math.cos(angle) * r * 1.3;
          const py = cy + Math.sin(angle) * r * 1.3;
          ctx.beginPath();
          ctx.ellipse(px, py, r, r * 0.65, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = petalCenter;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// The base print, generated once per (kind, color) — cheap enough to redraw
// on an offscreen canvas since it only runs when an item's title changes.
function useFabricTexture(kind: FabricKind, color: string): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) drawFabricPattern(ctx, size, kind, color);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [kind, color]);
}

// Tiled at a fixed real-world scale (repeats per foot) so the print's motif
// stays the same size on the mattress top as it does on the drop panels,
// instead of one print stretched per differently-shaped face. Each surface
// needs its own clone since `repeat` lives on the texture, not the material.
const FABRIC_TILE_FT = 0.55;
function useTiledFabric(base: THREE.CanvasTexture, width: number, height: number): THREE.Texture {
  return useMemo(() => {
    const t = base.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, Math.round(width / FABRIC_TILE_FT)), Math.max(1, Math.round(height / FABRIC_TILE_FT)));
    return t;
  }, [base, width, height]);
}

// A puffy rounded cushion printed with its own fabric (see above) instead
// of a flat sampled color or a warped product photo.
function Cushion({
  item,
  position,
}: {
  item: PlacedRoomItem;
  position: [number, number, number];
}) {
  const kind = fabricKindFromTitle(item.title);
  const color = fabricColorFromTitle(item.title, "#B7A98C");
  const base = useFabricTexture(kind, color);
  const w = BED_WID * 0.5;
  const d = 0.62;
  const h = 0.24;
  const tex = useTiledFabric(base, w, d);
  return (
    <group position={position}>
      <RoundedBox args={[w, h, d]} radius={0.07} smoothness={4} castShadow>
        <meshStandardMaterial map={tex} roughness={0.9} />
      </RoundedBox>
    </group>
  );
}

function isThrowBlanket(title: string) {
  const t = title.toLowerCase();
  return t.includes("blanket") && !t.includes("pillow");
}

function isShellPillow(title: string) {
  const t = title.toLowerCase();
  return t.includes("shell") && (t.includes("pillow") || t.includes("cushion"));
}

// A scallop-shell pillow isn't puffy-round like Cushion below — its whole
// identity is the fanned, fluted edge. A cone's base circle is already a
// faceted fan when its radial segment count is low (8-9), and cut in half
// (thetaLength = PI) that fan reads as a scallop shell silhouette with a
// hinge point on the flat side — sitting on the bed with its (short) axis
// vertical, no extra ridge geometry needed, the facets themselves read as
// fluting under the room's directional light.
function ShellPillow({ item, position }: { item: PlacedRoomItem; position: [number, number, number] }) {
  const color = fabricColorFromTitle(item.title, "#F6EEDC");
  const radius = 0.36;
  const h = 0.16;
  return (
    <mesh position={position} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
      <coneGeometry args={[radius, h, 9, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

// A throw blanket doesn't pile up near the headboard like a pillow — it
// gets folded a couple of times and laid across the foot of the bed. Same
// fabric-print system as Cushion, but a flat wide stack instead of a
// puffy round shape, and its own fixed spot rather than the pillow
// z-stacking sequence.
function FoldedBlanket({ item, position }: { item: PlacedRoomItem; position: [number, number, number] }) {
  const kind = fabricKindFromTitle(item.title);
  const color = fabricColorFromTitle(item.title, "#E9E2D0");
  const base = useFabricTexture(kind, color);
  const w = BED_WID - 0.1;
  const d = 0.55;
  const h = 0.12;
  const tex = useTiledFabric(base, w, d);
  return (
    <group position={position}>
      <RoundedBox args={[w, h, d]} radius={0.04} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial map={tex} roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[w * 0.93, h * 0.9, d * 0.82]} radius={0.04} smoothness={4} position={[0, h * 0.82, 0]} castShadow>
        <meshStandardMaterial map={tex} roughness={0.92} />
      </RoundedBox>
    </group>
  );
}

// The first bed item (the bedding set) covers the whole mattress like a
// real comforter, printed with its own fabric, rather than sitting on it
// as a small square photo. Anything added after that piles up near the
// head as pillow-shaped cushions instead of more flat squares.
// A comforter that stops exactly at the mattress edge reads as a sticker.
// Real bedding hangs over the sides — add three drop panels (both long
// sides + the foot), tiled with the same print as the top.
//
// These panels never actually showed up before: Bed()'s mattress box is
// BED_WID-0.02 / BED_LEN-0.02 wide, but the panels were offset by half of
// BED_WID-0.06 / BED_LEN-0.06 — half a centimeter *inside* the box's own
// opaque side faces, so the box itself hid them from every camera angle
// that could see it. Offset them just outside the box's actual surface
// instead, and drop them further so they read as fabric hanging down the
// frame rather than a thin sliver right at the mattress top.
function ComforterDrape({ base }: { base: THREE.CanvasTexture }) {
  const w = BED_WID - 0.06;
  const l = BED_LEN - 0.06;
  const dropH = 1.0;
  const dropY = BED_TOP - dropH / 2;
  const offX = BED_WID / 2 + 0.015;
  const offZ = BED_LEN / 2 + 0.015;
  const sideTex = useTiledFabric(base, l, dropH);
  const footTex = useTiledFabric(base, w, dropH);
  return (
    <>
      <mesh position={[BED_X - offX, dropY, BED_Z]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
        <planeGeometry args={[l, dropH]} />
        <meshStandardMaterial map={sideTex} roughness={0.9} />
      </mesh>
      <mesh position={[BED_X + offX, dropY, BED_Z]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <planeGeometry args={[l, dropH]} />
        <meshStandardMaterial map={sideTex} roughness={0.9} />
      </mesh>
      <mesh position={[BED_X, dropY, BED_Z + offZ]} castShadow receiveShadow>
        <planeGeometry args={[w, dropH]} />
        <meshStandardMaterial map={footTex} roughness={0.9} />
      </mesh>
    </>
  );
}

function isBedCanopy(title: string) {
  return title.toLowerCase().includes("canopy");
}

// The single most recognizable "dream dorm" TikTok/IG look — a sheer
// canopy parted around the pillows, hung from a ring near the ceiling
// above the headboard — and previously entirely missing from the room.
// Same title-driven fabric-print system as the window curtains, kept
// translucent (transparent + low opacity) so it reads as sheer netting
// rather than a solid wall. Rendered once at a fixed spot above the head
// of the bed, same as WindowCurtains is pulled out of the wall grid —
// this doesn't belong in the pillow z-stack.
function BedCanopy({ title }: { title: string }) {
  const kind = fabricKindFromTitle(title);
  const color = fabricColorFromTitle(title, "#FFFFFF");
  const base = useFabricTexture(kind, color);
  const ringY = 6.6;
  const ringRadius = 0.95;
  const cz = BED_Z - BED_LEN / 2 + 0.35;
  const panelW = 0.85;
  const panelH = ringY - BED_TOP - 0.3;
  const panelY = BED_TOP + 0.3 + panelH / 2;
  const tex = useTiledFabric(base, panelW, panelH);
  return (
    <group position={[BED_X, 0, cz]}>
      <mesh position={[0, ringY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ringRadius, 0.014, 8, 28]} />
        <meshStandardMaterial color="#B8AF9C" metalness={0.4} roughness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * ringRadius * 0.85, panelY, ringRadius * 0.3]}
          rotation={[0, side > 0 ? -0.35 : 0.35, 0]}
          castShadow
        >
          <planeGeometry args={[panelW, panelH]} />
          <meshStandardMaterial map={tex} roughness={0.85} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function BedDecor({ items }: { items: PlacedRoomItem[] }) {
  if (items.length === 0) return null;
  const [comforter, ...rest] = items;
  const canopyItem = rest.find((it) => isBedCanopy(it.title));
  const accents = rest.filter((it) => !isBedCanopy(it.title));
  const kind = fabricKindFromTitle(comforter.title);
  const color = fabricColorFromTitle(comforter.title, "#8CA2B5");
  const base = useFabricTexture(kind, color);
  const topTex = useTiledFabric(base, BED_WID - 0.06, BED_LEN - 0.06);
  return (
    <>
      <ComforterDrape base={base} />
      <mesh position={[BED_X, BED_TOP + 0.012, BED_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BED_WID - 0.06, BED_LEN - 0.06]} />
        <meshStandardMaterial map={topTex} roughness={0.9} />
      </mesh>
      {canopyItem && <BedCanopy title={canopyItem.title} />}
      {(() => {
        let pillowIndex = 0;
        return accents.map((item, i) => {
          if (isThrowBlanket(item.title)) {
            const z = BED_Z + BED_LEN / 2 - 0.45;
            return (
              <FoldedBlanket key={`${item.title}-${i}`} item={item} position={[BED_X, BED_TOP + 0.06, z]} />
            );
          }
          const z = Math.min(
            BED_Z - BED_LEN / 2 + 0.55 + pillowIndex * 0.7,
            BED_Z + BED_LEN / 2 - 0.5
          );
          pillowIndex += 1;
          if (isShellPillow(item.title)) {
            return (
              <ShellPillow key={`${item.title}-${i}`} item={item} position={[BED_X, BED_TOP + 0.16, z]} />
            );
          }
          return (
            <Cushion key={`${item.title}-${i}`} item={item} position={[BED_X, BED_TOP + 0.14, z]} />
          );
        });
      })()}
    </>
  );
}

// Desk knick-knacks read as fake pasted-on photos more than anything else
// in the room — a lamp, a vase, an organizer all have real volume a flat
// square can't fake. Infer a plausible shape from the item's title and
// color it from its own product photo instead.
function DeskObject({
  item,
  position,
}: {
  item: PlacedRoomItem;
  position: [number, number, number];
}) {
  const color = useDominantColor(item.imageUrl);
  const t = item.title.toLowerCase();

  if (t.includes("lamp")) {
    return (
      <group position={position}>
        <mesh position={[0, 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.06, 16]} />
          <meshStandardMaterial color="#3A342A" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.44, 8]} />
          <meshStandardMaterial color="#3A342A" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.56, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.12, 0.2, 20, 1]} />
          <meshStandardMaterial color={color} roughness={0.65} />
        </mesh>
      </group>
    );
  }

  if (t.includes("vase") || t.includes("pampas") || t.includes("grass")) {
    return (
      <group position={position}>
        <mesh position={[0, 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.06, 0.22, 16]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[Math.sin(i * 2.1) * 0.03, 0.4 + i * 0.04, Math.cos(i * 2.1) * 0.03]}
            rotation={[0, 0, (i - 1) * 0.18]}
            castShadow
          >
            <cylinderGeometry args={[0.006, 0.006, 0.48, 6]} />
            <meshStandardMaterial color="#D8C9A3" roughness={0.9} />
          </mesh>
        ))}
      </group>
    );
  }

  if (t.includes("vanity mirror") || t.includes("hollywood mirror")) {
    return (
      <group position={position}>
        <RoundedBox args={[0.22, 0.03, 0.14]} radius={0.01} position={[0, 0.015, 0]} castShadow>
          <meshStandardMaterial color="#D8CDB8" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.19, 0]} castShadow>
          <boxGeometry args={[0.03, 0.34, 0.03]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
        <group position={[0, 0.42, 0]}>
          <mesh>
            <circleGeometry args={[0.19, 24]} />
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.012]}>
            <circleGeometry args={[0.15, 24]} />
            <meshStandardMaterial color="#AEBEC2" metalness={0.9} roughness={0.05} />
          </mesh>
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.sin(a) * 0.19, Math.cos(a) * 0.19, 0.02]}>
                <sphereGeometry args={[0.014, 8, 8]} />
                <meshStandardMaterial color="#FFF3D6" emissive="#FFF3D6" emissiveIntensity={0.8} />
              </mesh>
            );
          })}
        </group>
      </group>
    );
  }

  // Default: a small desk-organizer cluster.
  return (
    <group position={position}>
      <RoundedBox args={[0.16, 0.18, 0.13]} radius={0.02} position={[-0.09, 0.09, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.11, 0.11, 0.11]} radius={0.015} position={[0.09, 0.055, 0.02]} castShadow>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
    </group>
  );
}

// Fixed 0.9ft steps only worked up to 3 items before the desk (DESK_W =
// 42in ≈ 3.5ft) started to overhang. Spread items evenly across a span
// that's the same for 3 items as before (so existing themes render
// identically) but scales down per-item as more are added, always
// staying safely inside the desk's actual width.
function DeskDecor({ items }: { items: PlacedRoomItem[] }) {
  const n = items.length;
  const span = n > 1 ? Math.min(2.6, 0.9 * (n - 1)) : 0;
  return (
    <>
      {items.map((item, i) => {
        const x = DESK_X - span / 2 + (n > 1 ? (i / (n - 1)) * span : 0);
        return (
          <DeskObject key={`${item.title}-${i}`} item={item} position={[x, DESK_H, DESK_Z]} />
        );
      })}
    </>
  );
}

// A rug's own Shopping photo has the same problem bedding's did (a whole
// staged room, not a clean flat weave) — stretching it across the floor
// warped it into the "doesn't look like a real rug" smear the reference
// photos don't have. Infer the rug's actual color from the photo (still
// useDominantColor — a rug's product shot is dominated by the rug itself,
// unlike a bedding lifestyle photo, so the average is meaningful here) but
// render the weave itself as a real basket-weave crosshatch — the texture
// natural jute/sisal/braided rugs actually have — instead of a flat photo.
function drawWovenPattern(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const band = size / 9;
  ctx.lineWidth = band * 0.4;
  ctx.strokeStyle = shade(color, -0.12);
  for (let i = -size; i < size * 2; i += band) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }
  ctx.strokeStyle = shade(color, 0.1);
  for (let i = -size; i < size * 2; i += band) {
    ctx.beginPath();
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
    ctx.stroke();
  }
}

function useWovenTexture(color: string): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) drawWovenPattern(ctx, size, color);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [color]);
}

// Real jute/woven rugs end in a braided fringe at both ends — a row of
// short strands is what actually reads as "rug" rather than "rectangle."
function RugFringe({ width, depth, color, y }: { width: number; depth: number; color: string; y: number }) {
  const count = 16;
  const len = 0.14;
  const xs = Array.from({ length: count }, (_, i) => -width / 2 + 0.04 + (i / (count - 1)) * (width - 0.08));
  return (
    <>
      {[-1, 1].map((side) =>
        xs.map((x, i) => (
          <mesh
            key={`${side}-${i}`}
            position={[x, y, (side * (depth + len)) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.007, 0.007, len, 6]} />
            <meshStandardMaterial color={color} roughness={1} />
          </mesh>
        ))
      )}
    </>
  );
}

// A bench or storage ottoman at the foot of the bed — a recurring piece
// across the reference photos and a real gap when a room only ever gets
// one floor piece. Same fabric-print system as the bedding, upholstered
// top on four simple legs, sized and placed so it sits in the actual open
// floor gap at the foot of the bed rather than overlapping the rug or the
// desk/chair.
function StorageBench({ item, position }: { item: PlacedRoomItem; position: [number, number, number] }) {
  const kind = fabricKindFromTitle(item.title);
  const color = fabricColorFromTitle(item.title, "#8CA2B5");
  const base = useFabricTexture(kind, color);
  const w = 2.4;
  const d = 0.95;
  const h = 1.1;
  const seatH = h * 0.5;
  const legH = h - seatH;
  const legColor = shade(color, -0.35);
  const tex = useTiledFabric(base, w, d);
  const legXZ: [number, number][] = [
    [-w / 2 + 0.14, -d / 2 + 0.14],
    [w / 2 - 0.14, -d / 2 + 0.14],
    [-w / 2 + 0.14, d / 2 - 0.14],
    [w / 2 - 0.14, d / 2 - 0.14],
  ];
  return (
    <group position={position}>
      {legXZ.map(([lx, lz], i) => (
        <mesh key={i} position={[lx, legH / 2, lz]} castShadow>
          <boxGeometry args={[0.07, legH, 0.07]} />
          <meshStandardMaterial color={legColor} roughness={0.6} />
        </mesh>
      ))}
      <RoundedBox args={[w, seatH, d]} radius={0.06} smoothness={4} position={[0, legH + seatH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={tex} roughness={0.88} />
      </RoundedBox>
    </group>
  );
}

// A woven hamper reuses the rug's own basket-weave texture system
// (useWovenTexture) — a laundry hamper is the same natural-fiber weave at
// a different scale, not a new material. Rendered as an open cylinder (no
// caps) so it actually reads as a basket you could put something in,
// rather than a solid drum, with a slightly darker rim.
function WovenHamper({ item, position }: { item: PlacedRoomItem; position: [number, number, number] }) {
  const color = useDominantColor(item.imageUrl, "#C9BBA0");
  const base = useWovenTexture(color);
  const radius = 0.42;
  const h = 1.05;
  const tex = useTiledFabric(base, radius * 2 * Math.PI, h);
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.92, h, 20, 1, true]} />
        <meshStandardMaterial map={tex} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.025, 8, 20]} />
        <meshStandardMaterial color={shade(color, -0.15)} roughness={0.8} />
      </mesh>
    </group>
  );
}

function isRugTitle(title: string) {
  return title.toLowerCase().includes("rug");
}

function isWireContainer(title: string) {
  const t = title.toLowerCase();
  return t.includes("wire") && (t.includes("basket") || t.includes("bin") || t.includes("storage"));
}

function isBasketContainer(title: string) {
  const t = title.toLowerCase();
  return !isRugTitle(title) && (t.includes("basket") || t.includes("bin") || t.includes("hamper"));
}

// A wire storage basket is an open metal frame, not a woven fiber slab —
// forcing it through the rug's basket-weave texture (meant for natural
// fiber) would render the wrong material entirely. Real thin wire bars in
// a ring instead, colored from the photo like the room's other metal
// pieces (Mirror, StarburstClock).
function WireBasket({ item, position }: { item: PlacedRoomItem; position: [number, number, number] }) {
  const color = useDominantColor(item.imageUrl, "#3A3A3A");
  const radius = 0.4;
  const h = 0.5;
  const bars = 14;
  return (
    <group position={position}>
      {Array.from({ length: bars }).map((_, i) => {
        const a = (i / bars) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, h / 2, Math.sin(a) * radius]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, h, 6]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
      {[0.15, 0.35, h - 0.02].map((ry, i) => (
        <mesh key={i} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.006, 6, 20]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// items[0] used to always render as a rug regardless of what it actually
// was — fine for every theme so far since every primary floor item was
// titled "... Rug", but industrial-minimalist's "Black Wire Storage
// Basket" was never a rug and rendering it as a woven fiber slab is the
// wrong material entirely. Now items[0] renders as a WireBasket if its
// title says "wire" + basket/bin, a WovenHamper if it says basket/bin/
// hamper without being a rug, and the rug otherwise — same fallback as
// before for every existing "... Rug" item.
// items[1] renders as a bench at the foot of the bed, items[2] as a
// hamper tucked beside the wardrobe (an open floor spot — clear of the
// chair, rug, and bench) — anything past that is silently dropped, see
// the view-and-theme-specialist agent notes.
function FloorDecor({ items }: { items: PlacedRoomItem[] }) {
  const rugItem = items[0];
  const benchItem = items[1];
  const hamperItem = items[2];
  const color = useDominantColor(rugItem?.imageUrl ?? null, "#C9BBA0");
  const base = useWovenTexture(color);
  const rugW = 3.06;
  const rugD = 2.06;
  const tex = useTiledFabric(base, rugW, rugD);
  if (!rugItem) return null;
  const x = BED_X + BED_WID / 2 + 1.6;
  const z = 0.5;
  const benchX = BED_X;
  const benchZ = BED_Z + BED_LEN / 2 + 0.95 / 2 + 0.15;
  const hamperX = WARDROBE_X - 0.5;
  const hamperZ = WARDROBE_Z + WARDROBE_D / 2 + 0.6;
  return (
    <>
      {isWireContainer(rugItem.title) ? (
        <WireBasket item={rugItem} position={[x, 0, z]} />
      ) : isBasketContainer(rugItem.title) ? (
        <WovenHamper item={rugItem} position={[x, 0, z]} />
      ) : (
        <group position={[x, 0, z]}>
          <RoundedBox args={[rugW, 0.06, rugD]} radius={0.02} position={[0, 0.03, 0]} receiveShadow castShadow>
            <meshStandardMaterial map={tex} roughness={1} />
          </RoundedBox>
          <RugFringe width={rugW} depth={rugD} color={shade(color, -0.1)} y={0.03} />
        </group>
      )}
      {benchItem && <StorageBench item={benchItem} position={[benchX, 0, benchZ]} />}
      {hamperItem && <WovenHamper item={hamperItem} position={[hamperX, 0, hamperZ]} />}
    </>
  );
}

export function Room3D({
  placedByZone,
}: {
  placedByZone: Record<RoomZone, PlacedRoomItem[]>;
}) {
  const cameraPos = useMemo<[number, number, number]>(() => [9, 7.5, 9], []);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-line" style={{ aspectRatio: "4 / 3" }}>
      <Canvas shadows camera={{ position: cameraPos, fov: 45 }}>
        <color attach="background" args={["#F4EDE0"]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={1.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <hemisphereLight intensity={0.35} groundColor="#D9D0BE" />
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.3} />
        </Suspense>

        <Walls />
        <Window />
        <Bed />
        <Desk />
        <Chair />
        <Wardrobe />

        <WallDecor items={placedByZone.wall} />
        <BedDecor items={placedByZone.bed} />
        <DeskDecor items={placedByZone.desk} />
        <FloorDecor items={placedByZone.floor} />

        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={14} blur={2} far={4} />

        <OrbitControls
          target={[0, 3, -2]}
          minDistance={4}
          maxDistance={16}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.49}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
