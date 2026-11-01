import { castPresentation } from './combat-presentation.js';
// Small whole-model follow-through keeps supplied mesh proportions intact.
export class BodyMotion {
  constructor(model, height = 1) {
    this.model = model;
    this.height = height;
    this.pitch = 0;
    this.roll = 0;
    this.recoil = 0;
    this.applied = false;
  }
  reset() {
    if (!this.applied) return;
    this.model.rotation.x = this.baseX;
    this.model.rotation.z = this.baseZ;
    this.applied = false;
  }
  impact() {
    this.recoil = 0.34;
  }
  update(
    dt,
    {
      stage = 'ground',
      phase = null,
      moving = false,
      enabled = true,
      heading = 0,
      partner = 'hufflepuff',
      attack = null,
      reduced = false,
      terrain = 0,
      pace = null,
      brake = 0,
    } = {},
  ) {
    this.reset();
    if (!enabled || dt <= 0) return;
    if (reduced) {
      this.recoil = 0;
      this.roll = 0;
      this.flow = 0;
      this.pitch = 0;
      this.lastHeading = heading;
      return;
    }
    this.recoil = Math.max(0, this.recoil - dt);
    const turn =
      this.lastHeading === undefined
        ? 0
        : Math.atan2(Math.sin(heading - this.lastHeading), Math.cos(heading - this.lastHeading)) / Math.max(dt, 0.001);
    this.lastHeading = heading;
    this.roll +=
      ((moving && stage === 'ground' ? Math.max(-0.045, Math.min(0.045, -turn * 0.012)) : 0) - this.roll) *
      (1 - Math.exp(-dt * 10));
    this.gaitTime =
      (this.gaitTime || 0) + dt * (moving ? (Number.isFinite(pace) ? Math.max(1, Math.min(9, pace * 2.3)) : 6) : 1);
    const groundedMotion = moving && stage === 'ground',
      flow = groundedMotion
        ? Math.sin(this.gaitTime) *
          (partner === 'ravenclaw' ? 0.009 : partner === 'hufflepuff' ? 0.006 : partner === 'slytherin' ? 0.003 : 0.002)
        : 0;
    this.flow = (this.flow || 0) + (flow - (this.flow || 0)) * (1 - Math.exp(-dt * 10));
    const air = stage === 'air',
      land = stage === 'landing',
      anticipate = stage === 'anticipation';
    const groundLean =
      stage === 'ground' ? Math.max(-0.035, Math.min(0.035, terrain)) + Math.max(0, Math.min(1, brake)) * 0.018 : 0;
    const target = anticipate
      ? 0.025
      : air
        ? -0.035
        : land
          ? 0.04 * Math.sin(Math.PI * Math.max(0, Math.min(1, (phase - 0.78) / 0.22)))
          : groundLean;
    this.pitch += (target - this.pitch) * (1 - Math.exp(-dt * 20));
    const recoil = this.recoil > 0 ? Math.sin((Math.PI * this.recoil) / 0.34) * 0.065 : 0;
    this.baseX = this.model.rotation.x;
    this.baseZ = this.model.rotation.z;
    const cast = attack?.ranged ? castPresentation(attack) : null,
      charge = cast ? cast.charge * 0.7 - cast.release * 0.45 : 0,
      style =
        partner === 'slytherin'
          ? [-0.02, 0.045]
          : partner === 'gryffindor'
            ? [-0.045, 0.006]
            : partner === 'ravenclaw'
              ? [-0.012, -0.025]
              : [-0.015, 0.022];
    this.model.rotation.x += this.pitch + recoil + style[0] * charge;
    this.model.rotation.z += recoil * 0.35 + this.roll + this.flow + style[1] * charge;
    this.applied = true;
  }
}
