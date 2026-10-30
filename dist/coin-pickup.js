// Coin contact follows the rendered body's oriented bounds, not one small centre point.
export function touchesCoin(nav,coin){
 const p=nav.player,b=nav.pickupBounds||{halfWidth:nav.radius,halfDepth:nav.radius},yaw=nav.heading||0,dx=coin.x-p.x,dz=coin.z-p.z,side=dx*Math.cos(yaw)-dz*Math.sin(yaw),forward=dx*Math.sin(yaw)+dz*Math.cos(yaw),margin=.30;
 const sx=Math.max(0,Math.abs(side)-Math.max(nav.radius||.24,b.halfWidth||0)),sz=Math.max(0,Math.abs(forward)-Math.max(nav.radius||.24,b.halfDepth||0));
 return sx*sx+sz*sz<=margin*margin&&coin.y>=nav.y-.22&&coin.y<=nav.y+nav.height+.22;
}
