import * as T from './vendor/three.module.min.js';
import { surfaceMaterial } from './surface-materials.js';
export function transferPiece(type) {
  const delivery = ['sort', 'instructions', 'listen-multi'].includes(type),
    organic = ['ending', 'intruder', 'spelling', 'listen-word'].includes(type),
    water = type === 'gap',
    repair = ['repair', 'correct'].includes(type),
    kind = delivery ? 'parcel' : organic ? 'seed' : water ? 'valve' : repair ? 'key' : 'coupler';
  const root = new T.Group();
  root.name = 'accepted-' + kind;
  const material = surfaceMaterial(
      organic ? 'organic' : delivery ? 'wood' : 'metal',
      organic ? '#b3c989' : delivery ? '#aa8356' : '#cfb67c',
    ),
    dark = surfaceMaterial('metal', '#635a43');
  const body = new T.Mesh(
    organic
      ? new T.IcosahedronGeometry(0.11, 1)
      : water
        ? new T.TorusGeometry(0.1, 0.025, 5, 12)
        : new T.BoxGeometry(delivery ? 0.22 : 0.13, delivery ? 0.17 : 0.08, delivery ? 0.18 : 0.2),
    material,
  );
  root.add(body);
  if (delivery) {
    const band = new T.Mesh(new T.BoxGeometry(0.035, 0.182, 0.192), dark);
    root.add(band);
  } else if (repair) {
    const tooth = new T.Mesh(new T.BoxGeometry(0.06, 0.12, 0.045), dark);
    tooth.position.set(0.035, -0.03, 0.075);
    root.add(tooth);
  }
  root.userData.kind = kind;
  root.traverse(o => {
    if (o.isMesh) {
      o.castShadow = false;
      o.receiveShadow = true;
    }
  });
  return root;
}
// Approach the socket from its front, then insert along its depth axis.
export function transferPose(effect, age) {
  const t = Math.min(1, Math.max(0, age / 0.62)),
    travel = Math.min(1, t / 0.72),
    ease = travel * travel * (3 - 2 * travel),
    mouth = effect.end.clone().addScaledVector(effect.axis, 0.23);
  const p = effect.start.clone().lerp(mouth, ease);
  p.y += Math.sin(travel * Math.PI) * 0.2;
  if (t > 0.72) {
    const seat = (t - 0.72) / 0.28;
    p.copy(mouth).lerp(effect.end, seat * seat * (3 - 2 * seat));
  }
  return { position: p, done: t === 1 };
}
