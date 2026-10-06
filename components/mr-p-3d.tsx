"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useSfx } from "@/components/sound-control";
import type { Emotion } from "@/lib/emotions";
import type { Sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

/** What the chat is doing; his feelings come on top of this. */
export type MrPState = "idle" | "listening" | "thinking" | "talking";

type Feeling = Emotion | "listening" | "talking";

const colors = {
  // The set's amber, so he belongs to the same broadcast.
  skin: "#ff7a2e",
  antenna: "#ffa564",
  ink: "#1d2a2a",
  shine: "#ffffff",
  blush: "rgba(255,52,92,0.75)",
  tongue: "#ff8597",
  tear: "#5ab8ff",
  suit: "#eef2f4",
  trim: "#e35f22",
  belt: "#2337f0",
  glass: "#d4f0ff",
  outline: "#1d2a2a",
};

/* ------------------------------------------------------------------ face */

type Eyes = "dot" | "happy" | "closed" | "star" | "heart" | "spiral" | "wide" | "wink" | "squint";
type Mouth = "grin" | "smile" | "small" | "o" | "frown" | "wavy" | "flat" | "cat" | "laugh" | "pout" | "talk";

type Expression = {
  eyes: Eyes;
  mouth: Mouth;
  blush?: boolean;
  brows?: "angry" | "sad" | "raised";
  tears?: boolean;
  sweat?: boolean;
  /** Where he looks, -1..1, unless the pointer says otherwise. */
  gaze?: [number, number];
};

const expressions: Record<Feeling, Expression> = {
  happy: { eyes: "dot", mouth: "cat", blush: true },
  excited: { eyes: "star", mouth: "grin", blush: true },
  love: { eyes: "heart", mouth: "smile", blush: true },
  laugh: { eyes: "happy", mouth: "laugh", blush: true },
  surprised: { eyes: "wide", mouth: "o", brows: "raised" },
  sad: { eyes: "dot", mouth: "frown", brows: "sad", tears: true, gaze: [0, -0.7] },
  thinking: { eyes: "dot", mouth: "pout", brows: "raised", gaze: [0.7, 0.8] },
  sleepy: { eyes: "closed", mouth: "small", blush: true },
  confused: { eyes: "dot", mouth: "wavy", sweat: true, gaze: [-0.4, 0.4] },
  shy: { eyes: "happy", mouth: "cat", blush: true, gaze: [-0.8, -0.4] },
  dizzy: { eyes: "spiral", mouth: "wavy" },
  grumpy: { eyes: "squint", mouth: "frown", brows: "angry" },
  wink: { eyes: "wink", mouth: "cat", blush: true },
  listening: { eyes: "dot", mouth: "smile", blush: true, gaze: [0.35, -0.85] },
  talking: { eyes: "dot", mouth: "talk" },
};

function heartPath(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.beginPath();
  context.moveTo(x, y + size * 0.35);
  context.bezierCurveTo(x - size, y - size * 0.35, x - size * 0.45, y - size, x, y - size * 0.4);
  context.bezierCurveTo(x + size * 0.45, y - size, x + size, y - size * 0.35, x, y + size * 0.35);
  context.closePath();
}

function starPath(context: CanvasRenderingContext2D, x: number, y: number, outer: number, inner: number) {
  context.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    context.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  context.closePath();
}

type FaceState = {
  expression: Expression;
  look: THREE.Vector2;
  blink: number;
  talk: number;
  time: number;
};

/** Head-space half-width the face texture covers, centred on his nose. */
const faceSpan = 1.3;

/**
 * Paints his face straight onto the skin: the texture is projected across
 * the head's front facets, so this canvas is his whole front, in skin orange.
 */
function drawFace(context: CanvasRenderingContext2D, face: FaceState) {
  const { width, height } = context.canvas;
  const { expression, look, blink, talk, time } = face;
  const unit = width / (faceSpan * 2);
  context.fillStyle = colors.skin;
  context.fillRect(0, 0, width, height);

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = colors.ink;
  context.fillStyle = colors.ink;

  const lookX = look.x * 12;
  const lookY = -look.y * 9;
  const eyeY = height / 2 + 0.1 * unit + lookY;
  const eyes = [width / 2 - 0.4 * unit + lookX, width / 2 + 0.4 * unit + lookX];

  // Brows.
  if (expression.brows) {
    context.lineWidth = 8.1;
    eyes.forEach((x, index) => {
      const side = index === 0 ? 1 : -1;
      context.beginPath();
      if (expression.brows === "angry") {
        context.moveTo(x - 16 * side, eyeY - 36);
        context.lineTo(x + 12 * side, eyeY - 26);
      } else if (expression.brows === "sad") {
        context.moveTo(x - 15 * side, eyeY - 26);
        context.lineTo(x + 13 * side, eyeY - 36);
      } else {
        context.moveTo(x - 14, eyeY - 34);
        context.quadraticCurveTo(x, eyeY - 44, x + 14, eyeY - 34);
      }
      context.stroke();
    });
  }

  // Eyes: glossy black beads with a catchlight, unless the feeling says otherwise.
  eyes.forEach((x, index) => {
    const style = expression.eyes === "wink" ? (index === 0 ? "dot" : "happy") : expression.eyes;
    const open = Math.max(0.08, 1 - blink);
    context.lineWidth = 9.9;
    switch (style) {
      case "dot":
      case "wide": {
        const big = style === "wide" ? 1.65 : 1.3;
        context.beginPath();
        context.ellipse(x, eyeY, 15 * big, 19 * big * open, 0, 0, Math.PI * 2);
        context.fill();
        if (open > 0.5) {
          context.fillStyle = colors.shine;
          context.beginPath();
          context.arc(x + 5 * big, eyeY - 7 * big, 5.5 * big, 0, Math.PI * 2);
          context.arc(x - 5 * big, eyeY + 7 * big, 2.5 * big, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = colors.ink;
        }
        break;
      }
      case "happy":
        context.beginPath();
        context.arc(x, eyeY + 6, 12, Math.PI * 1.1, Math.PI * 1.9);
        context.stroke();
        break;
      case "closed":
        context.beginPath();
        context.arc(x, eyeY - 5, 12, Math.PI * 0.15, Math.PI * 0.85);
        context.stroke();
        break;
      case "squint":
        context.beginPath();
        context.moveTo(x - 12, eyeY);
        context.lineTo(x + 12, eyeY);
        context.stroke();
        context.beginPath();
        context.ellipse(x, eyeY + 2, 7, 4, 0, 0, Math.PI);
        context.fill();
        break;
      case "star":
        starPath(context, x, eyeY, 21 + Math.sin(time * 10) * 2, 9);
        context.fillStyle = "#ffd23f";
        context.fill();
        context.lineWidth = 5.4;
        context.stroke();
        context.fillStyle = colors.ink;
        break;
      case "heart":
        context.fillStyle = "#ff4f7b";
        heartPath(context, x, eyeY + 3, 20 + Math.sin(time * 8) * 2);
        context.fill();
        context.fillStyle = colors.ink;
        break;
      case "spiral": {
        context.lineWidth = 6.3;
        context.beginPath();
        for (let step = 0; step < 40; step++) {
          const angle = step * 0.45 + time * 8 * (index ? 1 : -1);
          const radius = step * 0.4;
          context.lineTo(x + Math.cos(angle) * radius, eyeY + Math.sin(angle) * radius);
        }
        context.stroke();
        break;
      }
    }
  });

  // Blush.
  if (expression.blush) {
    context.fillStyle = colors.blush;
    for (const x of [width / 2 - 0.6 * unit, width / 2 + 0.6 * unit]) {
      context.beginPath();
      context.ellipse(x + lookX * 0.5, eyeY + 30, 19, 11, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = colors.ink;
  }

  // Tears and sweat.
  if (expression.tears) {
    context.fillStyle = colors.tear;
    eyes.forEach((x) => {
      const drop = (time * 45) % 50;
      context.beginPath();
      context.ellipse(x - 3, eyeY + 20 + drop, 5, 7, 0, 0, Math.PI * 2);
      context.fill();
    });
    context.fillStyle = colors.ink;
  }
  if (expression.sweat) {
    const x = width / 2 + 0.72 * unit;
    const y = eyeY - 0.42 * unit;
    context.fillStyle = colors.tear;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + 9, y + 20, x, y + 24);
    context.quadraticCurveTo(x - 9, y + 20, x, y);
    context.fill();
    context.fillStyle = colors.ink;
  }

  // Mouth.
  const mouthX = width / 2 + lookX * 0.6;
  const mouthY = eyeY + 0.25 * unit;
  context.lineWidth = 9;
  const openMouth = (wide: number, deep: number) => {
    context.beginPath();
    context.moveTo(mouthX - wide, mouthY - 6);
    context.quadraticCurveTo(mouthX, mouthY - 10, mouthX + wide, mouthY - 6);
    context.quadraticCurveTo(mouthX + wide * 0.9, mouthY + deep, mouthX, mouthY + deep);
    context.quadraticCurveTo(mouthX - wide * 0.9, mouthY + deep, mouthX - wide, mouthY - 6);
    context.closePath();
    context.fill();
    context.save();
    context.clip();
    context.fillStyle = colors.tongue;
    context.beginPath();
    context.ellipse(mouthX, mouthY + deep, wide * 0.6, deep * 0.5, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  switch (expression.mouth) {
    case "grin":
      openMouth(20, 20);
      break;
    case "laugh":
      openMouth(22, 22 + Math.sin(time * 22) * 4);
      break;
    case "talk": {
      const deep = 4 + talk * 16;
      if (deep < 7) {
        context.beginPath();
        context.moveTo(mouthX - 12, mouthY);
        context.quadraticCurveTo(mouthX, mouthY + 8, mouthX + 12, mouthY);
        context.stroke();
      } else {
        openMouth(13 + talk * 7, deep);
      }
      break;
    }
    case "smile":
      context.beginPath();
      context.moveTo(mouthX - 14, mouthY - 2);
      context.quadraticCurveTo(mouthX, mouthY + 12, mouthX + 14, mouthY - 2);
      context.stroke();
      break;
    case "small":
      context.beginPath();
      context.moveTo(mouthX - 8, mouthY);
      context.quadraticCurveTo(mouthX, mouthY + 6, mouthX + 8, mouthY);
      context.stroke();
      break;
    case "o":
      context.beginPath();
      context.ellipse(mouthX, mouthY + 4, 8, 10, 0, 0, Math.PI * 2);
      context.fill();
      break;
    case "frown":
      context.beginPath();
      context.moveTo(mouthX - 15, mouthY + 9);
      context.quadraticCurveTo(mouthX, mouthY - 6, mouthX + 15, mouthY + 9);
      context.stroke();
      break;
    case "wavy":
      context.beginPath();
      for (let step = 0; step <= 18; step++) {
        context.lineTo(mouthX - 18 + step * 2, mouthY + 3 + Math.sin(step * 0.9 + time * 6) * 4);
      }
      context.stroke();
      break;
    case "flat":
      context.beginPath();
      context.moveTo(mouthX - 12, mouthY + 3);
      context.lineTo(mouthX + 12, mouthY + 3);
      context.stroke();
      break;
    case "cat":
      // The little ω.
      context.beginPath();
      context.moveTo(mouthX - 20, mouthY - 3);
      context.quadraticCurveTo(mouthX - 10, mouthY + 14, mouthX, mouthY);
      context.quadraticCurveTo(mouthX + 10, mouthY + 14, mouthX + 20, mouthY - 3);
      context.stroke();
      break;
    case "pout":
      context.beginPath();
      context.arc(mouthX + 6, mouthY + 3, 5, 0, Math.PI * 2);
      context.stroke();
      break;
  }
}

/* ------------------------------------------------------------- particles */

type Glyph = "heart" | "star" | "z" | "question" | "bang" | "note" | "anger" | "dots";

const glyphFor: Partial<Record<Feeling, { glyph: Glyph; every: number }>> = {
  love: { glyph: "heart", every: 0.45 },
  excited: { glyph: "star", every: 0.35 },
  sleepy: { glyph: "z", every: 1.1 },
  confused: { glyph: "question", every: 1.2 },
  laugh: { glyph: "note", every: 0.4 },
  dizzy: { glyph: "star", every: 0.5 },
  grumpy: { glyph: "anger", every: 0.9 },
  thinking: { glyph: "dots", every: 1.4 },
  surprised: { glyph: "bang", every: 1.6 },
};

function glyphTexture(glyph: Glyph) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.strokeStyle = colors.outline;
  context.lineWidth = 8;
  const text = (value: string, color: string, size = 96) => {
    context.font = `900 ${size}px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.strokeText(value, 64, 68);
    context.fillStyle = color;
    context.fillText(value, 64, 68);
  };
  switch (glyph) {
    case "heart":
      heartPath(context, 64, 70, 48);
      context.fillStyle = "#ff4f7b";
      context.fill();
      context.stroke();
      break;
    case "star":
      starPath(context, 64, 64, 50, 22);
      context.fillStyle = "#ffd23f";
      context.fill();
      context.stroke();
      break;
    case "z":
      text("Z", "#ffffff");
      break;
    case "question":
      text("?", "#ffffff");
      break;
    case "bang":
      text("!", "#ffd23f");
      break;
    case "note":
      text("♪", "#ffffff");
      break;
    case "anger":
      context.strokeStyle = "#ff4b3e";
      context.lineWidth = 14;
      for (const [x1, y1, x2, y2] of [
        [30, 44, 54, 56],
        [98, 44, 74, 56],
        [30, 84, 54, 72],
        [98, 84, 74, 72],
      ]) {
        context.beginPath();
        context.moveTo(x1, y1);
        context.quadraticCurveTo(64, 64, x2, y2);
        context.stroke();
      }
      break;
    case "dots":
      context.fillStyle = "#ffffff";
      for (const x of [30, 64, 98]) {
        context.beginPath();
        context.arc(x, 64, 13, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
      break;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ----------------------------------------------------------------- poses */

type Pose = {
  left: [number, number, number];
  right: [number, number, number];
  /** Lean forward (+) or back (−), sideways tilt, and turn. */
  lean: number;
  tilt: number;
  turn: number;
  bounce: number;
  speed: number;
  /** Extra motion: a waving hand, a shake, a sway, a scratch… */
  motion?: "wave" | "waveBoth" | "shake" | "sway" | "wobble" | "scratch" | "tap" | "gesture" | "breathe";
};

// Hands stay outside the helmet: it is centred at (0, 0.3), about 1.48 × 1.36.
const rest: Pose = { left: [-0.78, -1.45, 0.2], right: [0.78, -1.45, 0.2], lean: 0, tilt: 0, turn: 0, bounce: 0.04, speed: 3 };

const poses: Record<Feeling, Pose> = {
  happy: { ...rest, right: [1.2, -0.7, 0.3], motion: "wave" },
  excited: { ...rest, left: [-1.2, -0.6, 0.3], right: [1.2, -0.6, 0.3], bounce: 0.16, speed: 10, motion: "waveBoth" },
  love: { ...rest, left: [-0.15, -1.15, 0.6], right: [0.15, -1.15, 0.6], bounce: 0.03, speed: 2, motion: "sway" },
  laugh: { ...rest, left: [-0.3, -1.3, 0.6], right: [0.3, -1.3, 0.6], lean: -0.08, bounce: 0.05, speed: 14, motion: "shake" },
  surprised: { ...rest, left: [-1.15, -0.8, 0.35], right: [1.15, -0.8, 0.35], lean: -0.14, bounce: 0.02, speed: 6 },
  sad: { ...rest, left: [-0.55, -1.6, 0.3], right: [0.55, -1.6, 0.3], lean: 0.2, tilt: 0.08, bounce: 0.01, speed: 1.5, motion: "breathe" },
  thinking: { ...rest, left: [-0.78, -1.4, 0.1], right: [0.3, -0.95, 0.95], tilt: 0.1, bounce: 0.02, speed: 2, motion: "tap" },
  sleepy: { ...rest, left: [-0.55, -1.55, 0.35], right: [0.55, -1.55, 0.35], lean: 0.12, bounce: 0.03, speed: 1.2, motion: "breathe" },
  confused: { ...rest, right: [1.45, -0.35, 0.25], tilt: -0.14, bounce: 0.02, speed: 3, motion: "scratch" },
  shy: { ...rest, left: [-0.15, -1.4, 0.55], right: [0.15, -1.4, 0.55], lean: 0.06, tilt: 0.12, turn: -0.45, bounce: 0.02, speed: 3, motion: "sway" },
  dizzy: { ...rest, left: [-1.25, -1.0, 0.2], right: [1.25, -1.0, 0.2], bounce: 0.02, speed: 3, motion: "wobble" },
  grumpy: { ...rest, left: [-0.72, -1.42, -0.05], right: [0.72, -1.42, -0.05], lean: -0.06, bounce: 0.01, speed: 2, motion: "shake" },
  wink: { ...rest, right: [1.15, -0.75, 0.45], tilt: -0.1, bounce: 0.04, speed: 4 },
  listening: { ...rest, lean: 0.16, tilt: 0.06, turn: 0.15, bounce: 0.02, speed: 2 },
  talking: { ...rest, left: [-0.8, -1.15, 0.5], right: [0.8, -1.15, 0.5], bounce: 0.05, speed: 7, motion: "gesture" },
};

/* -------------------------------------------------------------- geometry */

/** Head proportions: half-width, half-height, half-depth. */
const head = { a: 1.18, b: 0.92, c: 0.98 };

/**
 * His head: a faceted bean, a touch wider up top. The front facets carry
 * the face texture (a straight-on projection); every other facet samples a
 * plain corner of it, so the back of his head stays skin.
 */
function headGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.attributes.position;
  for (let index = 0; index < position.count; index++) {
    const y = position.getY(index);
    const swell = 1 + y * 0.08;
    position.setXYZ(index, position.getX(index) * head.a * swell, y * head.b, position.getZ(index) * head.c);
  }
  const uv = new Float32Array(position.count * 2);
  for (let first = 0; first < position.count; first += 3) {
    const depth = (position.getZ(first) + position.getZ(first + 1) + position.getZ(first + 2)) / 3;
    for (let index = first; index < first + 3; index++) {
      const front = depth > 0.2;
      uv[index * 2] = front ? 0.5 + position.getX(index) / (faceSpan * 2) : 0.02;
      uv[index * 2 + 1] = front ? 0.5 + position.getY(index) / (faceSpan * 2) : 0.02;
    }
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Faceted glass for the helmet: nearly clear face-on, catching white light
 * along every edge it turns away from you, with a hard glint per facet.
 */
function glassMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      tint: { value: new THREE.Color(colors.glass) },
      light: { value: new THREE.Vector3(-0.5, 0.75, 0.6).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vView;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vView = view.xyz;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 tint;
      uniform vec3 light;
      varying vec3 vView;
      void main() {
        // Flat facets: the normal comes from the screen-space derivatives.
        vec3 normal = normalize(cross(dFdx(vView), dFdy(vView)));
        vec3 toEye = normalize(-vView);
        if (dot(normal, toEye) < 0.0) normal = -normal;
        float fresnel = pow(1.0 - dot(normal, toEye), 1.6);
        float glint = pow(max(dot(reflect(-light, normal), toEye), 0.0), 28.0);
        vec3 color = mix(tint, vec3(1.0), clamp(fresnel + glint, 0.0, 1.0));
        // The scene renders to a linear buffer first; these colours were picked in sRGB.
        gl_FragColor = vec4(pow(color, vec3(2.2)), clamp(fresnel * fresnel * 1.6 + glint * 0.6, 0.0, 0.95));
      }
    `,
  });
}

/* ---------------------------------------------------------------- bitmap */

/** Screen pixels per bitmap pixel, from how big he's drawn. */
function bitmapPixel(width: number) {
  return Math.max(2, Math.round(width / 160));
}

/**
 * The bitmap look: the scene renders small into a linear buffer, then one
 * pass tone-maps it, crushes each channel to a few levels with a 4×4 Bayer
 * dither, and snaps alpha to fully on or off (dithered at soft edges, so the
 * glass turns to stipple). The canvas is scaled up without smoothing.
 */
function bitmapPass() {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const material = new THREE.ShaderMaterial({
    uniforms: { scene: { value: target.texture }, levels: { value: 6 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D scene;
      uniform float levels;
      varying vec2 vUv;

      float bayer(vec2 cell) {
        int x = int(mod(cell.x, 4.0));
        int y = int(mod(cell.y, 4.0));
        int index = x + y * 4;
        int matrix[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
        return (float(matrix[index]) + 0.5) / 16.0;
      }

      void main() {
        vec4 texel = texture2D(scene, vUv);
        float threshold = bayer(gl_FragCoord.xy);
        if (texel.a < threshold * 0.9 + 0.05) discard;
        // The buffer holds premultiplied colour; take the alpha back out.
        gl_FragColor = vec4(texel.rgb / max(texel.a, 0.001), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        gl_FragColor.rgb = floor(gl_FragColor.rgb * (levels - 1.0) + threshold) / (levels - 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    target,
    render(renderer: THREE.WebGLRenderer, source: THREE.Scene, view: THREE.Camera) {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(source, view);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(scene, camera);
    },
    dispose() {
      target.dispose();
      material.dispose();
      scene.traverse((object) => object instanceof THREE.Mesh && object.geometry.dispose());
    },
  };
}

/* -------------------------------------------------------------- the rig */

/** A bendy tube between two points (arms, legs, antenna stalks), rebuilt each frame. */
class Limb {
  readonly mesh: THREE.Mesh;
  private readonly curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);

  constructor(
    private readonly radius: number,
    material: THREE.Material,
    private readonly sides = 6,
  ) {
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  }

  /** From one end to the other, sagging in the middle. */
  shape(from: THREE.Vector3, to: THREE.Vector3, sag: number) {
    const middle = new THREE.Vector3().lerpVectors(from, to, 0.5).add(new THREE.Vector3(0, -sag, 0.05));
    this.through(from, middle, to);
  }

  /** Through a joint: a knee, an elbow, the bend of a stalk. */
  through(from: THREE.Vector3, joint: THREE.Vector3, to: THREE.Vector3) {
    this.curve.points[0].copy(from);
    this.curve.points[1].copy(joint);
    this.curve.points[2].copy(to);
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.TubeGeometry(this.curve, 10, this.radius, this.sides, false);
  }
}

/**
 * Mr. P in 3D: a little low-poly orange alien in a bubble helmet and spacesuit,
 * floating in zero-g with his knees tucked up, and a lot of feelings. He
 * follows the pointer, gets shy when you hover, giggles when poked (dizzy if
 * you keep at it, grumpy if you really keep at it), dozes off when nobody is
 * around, and takes his mood from the conversation.
 */
export function MrP3D({
  state,
  emotion,
  className,
}: {
  state: MrPState;
  /** How the latest reply feels; he holds it for a while, then relaxes. */
  emotion: Emotion;
  className?: string;
}) {
  const host = useRef<HTMLButtonElement>(null);
  const live = useRef({ state, emotion, emotionAt: 0 });
  const poke = useRef<() => void>(() => {});
  const sound = useSfx();
  const soundRef = useRef<Sfx>(sound);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    live.current.state = state;
  }, [state]);

  useEffect(() => {
    live.current.emotion = emotion;
    live.current.emotionAt = performance.now();
  }, [emotion]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    // One canvas pixel per bitmap pixel, blown up crisp by CSS.
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", imageRendering: "pixelated" });
    const bitmap = bitmapPass();
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0.3, 9.6);
    camera.lookAt(0, -0.12, 0);

    // Starlight: a soft sky fill, a warm sun from the upper left, a cool rim from behind.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.35;
    scene.add(new THREE.HemisphereLight("#eaf6ff", "#1a2b3a", 1.3));
    const key = new THREE.DirectionalLight("#fff4e4", 2.3);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight("#7fd8ff", 2.2);
    rim.position.set(4, 2, -5);
    scene.add(rim);

    // Low-poly surfaces: flat-shaded, so every facet reads.
    const lowPoly = (color: string, roughness = 0.7) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, flatShading: true });
    const suit = lowPoly(colors.suit, 0.6);
    const trim = lowPoly(colors.trim, 0.55);
    const skin = lowPoly(colors.skin);

    const rig = new THREE.Group();
    scene.add(rig);
    const body = new THREE.Group();
    rig.add(body);

    // The head, inside its helmet, riding on the suit so it can bob with his gaze.
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.3;
    body.add(headGroup);

    const faceCanvas = document.createElement("canvas");
    faceCanvas.width = 512;
    faceCanvas.height = 512;
    const faceContext = faceCanvas.getContext("2d");
    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    faceTexture.anisotropy = 4;
    const headMaterial = new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.75, flatShading: true });
    headGroup.add(new THREE.Mesh(headGeometry(), headMaterial));

    // Antennae: stalks poking up through the glass, bobbles on top.
    const antennae = [-1, 1].map((side) => {
      const stalk = new Limb(0.045, skin, 5);
      const bobble = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), lowPoly(colors.antenna, 0.6));
      headGroup.add(stalk.mesh, bobble);
      return { side, stalk, bobble };
    });

    // The bubble helmet, with white ear pads either side.
    const helmet = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), glassMaterial());
    helmet.scale.set(1.48, 1.36, 1.42);
    helmet.renderOrder = 2;
    headGroup.add(helmet);
    for (const side of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.18, 8), suit);
      pad.rotation.z = Math.PI / 2;
      pad.position.set(side * 1.42, -0.2, 0);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 8), trim);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(side * 1.53, -0.2, 0);
      headGroup.add(pad, cap);
    }

    // The suit: a chunky collar, a round little torso, a belt and a badge.
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.13, 5, 12), suit);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -0.98;
    body.add(collar);
    const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), suit);
    torso.scale.set(1, 0.92, 0.86);
    torso.position.y = -1.28;
    body.add(torso);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.45, 0.11, 10), lowPoly(colors.belt, 0.5));
    belt.position.y = -1.48;
    body.add(belt);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.05), trim);
    badge.position.set(0.16, -1.2, 0.42);
    badge.rotation.set(-0.2, 0.3, 0);
    body.add(badge);

    // Stubby arms with orange gloves; tucked legs with orange boots.
    const arms = { left: new Limb(0.11, suit), right: new Limb(0.11, suit) };
    const legs = { left: new Limb(0.13, suit), right: new Limb(0.13, suit) };
    for (const limb of [arms.left, arms.right, legs.left, legs.right]) rig.add(limb.mesh);
    const gloveGeometry = new THREE.IcosahedronGeometry(0.15, 1);
    const hands = { left: new THREE.Mesh(gloveGeometry, trim), right: new THREE.Mesh(gloveGeometry, trim) };
    rig.add(hands.left, hands.right);
    const bootGeometry = new THREE.IcosahedronGeometry(0.19, 1);
    const boots = [-1, 1].map(() => {
      const boot = new THREE.Mesh(bootGeometry, trim);
      boot.scale.set(1, 0.85, 1.3);
      rig.add(boot);
      return boot;
    });

    // Floating feelings: hearts, stars, Z's, question marks…
    const glyphTextures = new Map<Glyph, THREE.Texture>();
    const particles: { sprite: THREE.Sprite; age: number; life: number; drift: THREE.Vector3; spin: number }[] = [];
    function emit(glyph: Glyph) {
      let texture = glyphTextures.get(glyph);
      if (!texture) {
        texture = glyphTexture(glyph);
        glyphTextures.set(glyph, texture);
      }
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
      const side = Math.random() < 0.5 ? -1 : 1;
      sprite.position.set(side * (1.3 + Math.random() * 0.4), 1.2 + Math.random() * 0.3, 0.4);
      sprite.scale.setScalar(0.01);
      scene.add(sprite);
      particles.push({
        sprite,
        age: 0,
        life: 1.6 + Math.random() * 0.6,
        drift: new THREE.Vector3(side * (0.15 + Math.random() * 0.25), 0.7 + Math.random() * 0.4, 0),
        spin: (Math.random() - 0.5) * 2,
      });
    }

    // Pointer, hover, pokes, and dozing off.
    const pointer = new THREE.Vector2();
    const gaze = new THREE.Vector2();
    let hovering = false;
    let squash = 0;
    let hop = 0;
    let transient: { feeling: Feeling; until: number } | null = null;
    let pokes: number[] = [];
    let lastActivity = performance.now();
    let asleep = false;

    function followPointer(event: PointerEvent) {
      const bounds = container!.getBoundingClientRect();
      const x = (event.clientX - (bounds.left + bounds.width / 2)) / (window.innerWidth / 2);
      const y = (bounds.top + bounds.height * 0.3 - event.clientY) / (window.innerHeight / 2);
      pointer.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
    }

    function wake() {
      lastActivity = performance.now();
      if (asleep) {
        asleep = false;
        transient = { feeling: "surprised", until: performance.now() + 1100 };
        hop = 1;
      }
    }

    poke.current = () => {
      const now = performance.now();
      wake();
      pokes = [...pokes.filter((at) => now - at < 2200), now];
      squash = 1;
      hop = 1;
      const feeling: Feeling = pokes.length >= 7 ? "grumpy" : pokes.length >= 4 ? "dizzy" : "laugh";
      transient = { feeling, until: now + (feeling === "laugh" ? 1300 : 2600) };
    };

    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);
    const onActivity = () => wake();
    window.addEventListener("pointermove", followPointer, { passive: true });
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    container.addEventListener("pointerenter", onEnter);
    container.addEventListener("pointerleave", onLeave);

    function resize() {
      const { clientWidth, clientHeight } = container!;
      if (!clientWidth || !clientHeight) return;
      const pixel = bitmapPixel(clientWidth);
      const width = Math.max(1, Math.round(clientWidth / pixel));
      const height = Math.max(1, Math.round(clientHeight / pixel));
      renderer.setSize(width, height, false);
      bitmap.target.setSize(width, height);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    }
    const resizer = new ResizeObserver(resize);
    resizer.observe(container);
    resize();

    let visible = true;
    const watcher = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    watcher.observe(container);

    const face: FaceState = { expression: expressions.happy, look: new THREE.Vector2(), blink: 0, talk: 0, time: 0 };
    const pose = {
      left: new THREE.Vector3(...rest.left),
      right: new THREE.Vector3(...rest.right),
      lean: 0,
      tilt: 0,
      turn: 0,
      bounce: rest.bounce,
      speed: rest.speed,
    };
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    let shown: Feeling = "happy";
    let nextBlink = 2;
    let emitClock = 0;
    let last = performance.now();
    let t = 0;
    let frame = 0;

    function currentFeeling(now: number): Feeling {
      const { state: chatState, emotion: replyEmotion, emotionAt } = live.current;
      if (transient && now < transient.until) return transient.feeling;
      transient = null;
      if (chatState === "thinking") return "thinking";
      if (chatState === "talking") return "talking";
      if (chatState === "listening") return "listening";
      if (!asleep && now - lastActivity > 25000) asleep = true;
      if (asleep) return "sleepy";
      if (hovering) return "shy";
      return now - emotionAt < 9000 ? replyEmotion : "happy";
    }

    function animate() {
      frame = requestAnimationFrame(animate);
      if (!visible) return;
      const now = performance.now();
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += delta;
      face.time = t;

      // Feelings: pick, announce with a chirp, and set face and pose targets.
      const feeling = currentFeeling(now);
      const replyEmotion = live.current.emotion;
      if (feeling !== shown) {
        shown = feeling;
        emitClock = 0;
        if (feeling !== "talking" && feeling !== "listening") soundRef.current.emote(feeling);
      }
      // While talking, his eyes keep the reply's feeling; the mouth does the talking.
      face.expression =
        feeling === "talking"
          ? { ...(expressions[replyEmotion] ?? expressions.happy), mouth: "talk", tears: false }
          : (expressions[feeling] ?? expressions.happy);
      const target = poses[feeling] ?? poses.happy;

      // Floating glyphs for big feelings.
      const glyph = glyphFor[feeling === "talking" ? replyEmotion : feeling];
      emitClock -= delta;
      if (glyph && emitClock <= 0 && !reduceMotion) {
        emit(glyph.glyph);
        emitClock = glyph.every;
      }
      for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index];
        particle.age += delta;
        const progress = particle.age / particle.life;
        particle.sprite.position.addScaledVector(particle.drift, delta);
        particle.sprite.material.rotation += particle.spin * delta;
        particle.sprite.scale.setScalar(0.42 * Math.min(1, progress * 5) * (1 - progress * 0.3));
        particle.sprite.material.opacity = 1 - Math.max(0, progress - 0.6) / 0.4;
        if (progress >= 1) {
          scene.remove(particle.sprite);
          particle.sprite.material.dispose();
          particles.splice(index, 1);
        }
      }

      // Ease the pose toward the feeling.
      const ease = 1 - Math.pow(0.003, delta);
      pose.left.lerp(v(...target.left), ease);
      pose.right.lerp(v(...target.right), ease);
      pose.lean += (target.lean - pose.lean) * ease;
      pose.tilt += (target.tilt - pose.tilt) * ease;
      pose.turn += (target.turn - pose.turn) * ease;
      pose.bounce += (target.bounce - pose.bounce) * ease;
      pose.speed += (target.speed - pose.speed) * ease;

      // Look at the pointer, unless the feeling says where to look.
      const lookTarget = face.expression.gaze ? new THREE.Vector2(...face.expression.gaze) : pointer;
      gaze.lerp(lookTarget, 1 - Math.pow(0.004, delta));
      face.look.copy(gaze);

      const still = reduceMotion;
      const motion = target.motion;
      let tiltExtra = 0;
      let turnExtra = 0;
      if (!still) {
        if (motion === "shake") tiltExtra = Math.sin(t * 40) * 0.035;
        if (motion === "sway") tiltExtra = Math.sin(t * 2.4) * 0.08;
        if (motion === "wobble") {
          tiltExtra = Math.sin(t * 5) * 0.2;
          turnExtra = Math.cos(t * 5) * 0.2;
        }
        // Zero-g: a slow drift and roll, as if bobbing on nothing.
        tiltExtra += Math.sin(t * 0.8) * 0.05;
        rig.position.set(Math.sin(t * 0.5) * 0.04, Math.sin(t * 1.2) * 0.08, 0);
      }
      rig.rotation.set(
        pose.lean - (feeling === "listening" ? 0 : gaze.y * 0.08),
        pose.turn + turnExtra + (feeling === "shy" ? 0 : gaze.x * 0.4),
        pose.tilt + tiltExtra,
      );

      // Bounce, squash-and-stretch, hop.
      squash = Math.max(0, squash - delta * 3);
      hop = Math.max(0, hop - delta * 2.4);
      const squish = Math.sin(squash * Math.PI) * 0.16;
      const bounce = still ? 0 : Math.abs(Math.sin(t * pose.speed)) * pose.bounce;
      const breathe = motion === "breathe" && !still ? Math.sin(t * 1.6) * 0.025 : 0;
      body.position.y = bounce + Math.sin(hop * Math.PI) * 0.4;
      body.scale.set(1 + squish + breathe, 1 - squish + breathe, 1 + squish);
      // His head nods along with where he looks, a touch behind the body.
      headGroup.rotation.set(still ? 0 : -gaze.y * 0.06, gaze.x * 0.1, still ? 0 : Math.sin(t * pose.speed * 0.5) * pose.bounce * 0.4);

      // Antennae: springy stalks that lag behind the bob.
      antennae.forEach(({ side, stalk, bobble }) => {
        const wobble = still ? 0 : Math.sin(t * 3.1 + side) * 0.05 + Math.sin(hop * Math.PI) * 0.12 + squish * 0.4;
        const tip = v(side * (0.62 + wobble * 0.5), 1.72 - Math.abs(wobble) * 0.3, -0.05);
        stalk.through(v(side * 0.36, 0.72, 0.1), v(side * 0.46, 1.25, 0.02), tip);
        bobble.position.copy(tip);
        bobble.rotation.set(t * 0.4, t * 0.6 * side, 0);
      });

      // Blink every few seconds.
      if (t > nextBlink) {
        face.blink = Math.min(1, face.blink + delta * 14);
        if (face.blink >= 1) nextBlink = t + 2.2 + Math.random() * 3;
      } else {
        face.blink = Math.max(0, face.blink - delta * 10);
      }

      // Talking: a jittery jaw, like a cartoon voice.
      face.talk = feeling === "talking" ? 0.5 + 0.5 * Math.sin(t * 17) * Math.sin(t * 7.3 + 1) : 0;

      // Arms: shoulders ride with the body; hands follow the pose plus motion.
      const lift = body.position.y;
      const left = pose.left.clone();
      const right = pose.right.clone();
      if (!still) {
        if (motion === "wave") right.x += Math.sin(t * (hovering ? 14 : 8)) * 0.13;
        if (motion === "waveBoth") {
          left.x += Math.sin(t * 12) * 0.12;
          right.x -= Math.sin(t * 12) * 0.12;
        }
        if (motion === "scratch") right.y += Math.sin(t * 18) * 0.05;
        if (motion === "tap") right.y += Math.abs(Math.sin(t * 6)) * 0.04;
        if (motion === "gesture") {
          left.y += Math.sin(t * 5) * 0.15;
          right.y += Math.sin(t * 5 + Math.PI) * 0.15;
        }
        if (motion === "wobble") {
          left.y += Math.sin(t * 9) * 0.1;
          right.y -= Math.sin(t * 9) * 0.1;
        }
      }
      left.y += lift;
      right.y += lift;
      arms.left.shape(v(-0.4, -1.1 + lift, 0), left, 0.06);
      arms.right.shape(v(0.4, -1.1 + lift, 0), right, 0.06);
      hands.left.position.copy(left);
      hands.right.position.copy(right);

      // Legs: knees tucked up in front, feet paddling slowly at nothing.
      const hips = -1.62 * (1 - squish * 0.5) + lift;
      boots.forEach((boot, index) => {
        const side = index ? 1 : -1;
        const kick = still ? 0 : Math.sin(t * 1.8 + index * Math.PI) * 0.08;
        const knee = v(side * 0.26, hips + 0.02 + kick * 0.3, 0.55 + kick * 0.2);
        const ankle = v(side * 0.28, hips - 0.3 + kick, 0.68 + kick * 0.5);
        (index ? legs.right : legs.left).through(v(side * 0.2, hips + 0.05, 0.05), knee, ankle);
        boot.position.set(ankle.x, ankle.y - 0.06, ankle.z + 0.1);
        boot.rotation.set(0.2 + kick, 0, side * -0.1);
      });

      if (faceContext) {
        drawFace(faceContext, face);
        faceTexture.needsUpdate = true;
      }
      bitmap.render(renderer, scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      watcher.disconnect();
      window.removeEventListener("pointermove", followPointer);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown", onActivity);
      container.removeEventListener("pointerenter", onEnter);
      container.removeEventListener("pointerleave", onLeave);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          object.geometry.dispose();
          const material = object.material as THREE.Material | THREE.Material[];
          (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
        }
      });
      for (const texture of [faceTexture, ...glyphTextures.values()]) texture.dispose();
      environment.dispose();
      pmrem.dispose();
      bitmap.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <button
      ref={host}
      type="button"
      aria-label="Mr. P, the station's host. Poke him."
      onClick={() => {
        poke.current();
        sound.key();
      }}
      className={cn("cursor-pointer outline-none focus-visible:drop-shadow-[0_0_10px_var(--osd)]", className)}
    />
  );
}
