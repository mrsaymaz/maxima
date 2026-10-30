import * as T from './vendor/three.module.min.js';
// One vivid colour response for every graphics preset. Low and Balanced use it as the renderer's tone mapping
// (a few arithmetic operations per pixel, no extra pass); High's post-processing composite calls the same curve,
// so all presets share a look. The include guard lets both copies meet in one shader. The curve keeps hues and saturation (unlike ACES, which washed the valley out),
// then adds a gentle storybook grade: richer colour, a little contrast, warm light and cool shade.
export const VIVID_GRADE_GLSL=`
#ifndef MAXIMA_VIVID
#define MAXIMA_VIVID
vec3 maximaNeutral( vec3 color ) {
	const float startCompression = 0.76;
	const float desaturation = 0.15;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < startCompression ) return color;
	float d = 1.0 - startCompression;
	float newPeak = 1.0 - d * d / ( peak + d - startCompression );
	color *= newPeak / peak;
	float g = 1.0 - 1.0 / ( desaturation * ( peak - newPeak ) + 1.0 );
	return mix( color, vec3( newPeak ), g );
}
vec3 maximaVivid( vec3 color, float exposure ) {
	color = maximaNeutral( max( color * exposure, vec3( 0.0 ) ) );
	float luma = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
	color = max( mix( vec3( luma ), color, 1.15 ), vec3( 0.0 ) );
	// Contrast around a mid grey in a perceptual-ish space, then warm lights / cool shade.
	vec3 p = pow( color, vec3( 1.0 / 2.2 ) );
	p = ( p - 0.5 ) * 1.06 + 0.5;
	float l = dot( p, vec3( 0.299, 0.587, 0.114 ) );
	p += vec3( -0.006, 0.0, 0.018 ) * ( 1.0 - smoothstep( 0.0, 0.5, l ) ) + vec3( 0.022, 0.012, -0.012 ) * smoothstep( 0.55, 1.0, l );
	return pow( clamp( p, 0.0, 1.0 ), vec3( 2.2 ) );
}
#endif`;
let installed=false;
export function installVividToneMapping(renderer){
 const C=T.ShaderChunk,stub='vec3 CustomToneMapping( vec3 color ) { return color; }';
 if(!installed&&C.tonemapping_pars_fragment.includes(stub)){C.tonemapping_pars_fragment=C.tonemapping_pars_fragment.replace(stub,VIVID_GRADE_GLSL+'\nvec3 CustomToneMapping( vec3 color ) { return maximaVivid( color, toneMappingExposure ); }');installed=true;}
 if(renderer&&installed)renderer.toneMapping=T.CustomToneMapping;
 return installed;
}
