var c=Object.defineProperty;var r=(e,o)=>c(e,"name",{value:o,configurable:!0});import*as n from"./vendor/three.module.min.js";const l=`
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
#endif`;let a=!1;function i(e){const o=n.ShaderChunk,t="vec3 CustomToneMapping( vec3 color ) { return color; }";return!a&&o.tonemapping_pars_fragment.includes(t)&&(o.tonemapping_pars_fragment=o.tonemapping_pars_fragment.replace(t,l+`
vec3 CustomToneMapping( vec3 color ) { return maximaVivid( color, toneMappingExposure ); }`),a=!0),e&&a&&(e.toneMapping=n.CustomToneMapping),a}r(i,"installVividToneMapping");export{l as VIVID_GRADE_GLSL,i as installVividToneMapping};
