// @TODO inline?
#include<__decl__defaultFragment>

// Input
varying vec3 vPositionW;
varying vec3 vLightingColor;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#if defined(VERTEXCOLOR)
varying vec4 vColor;
#endif

#include<mainUVVaryingDeclaration>[1..7]

#include<helperFunctions>

// Samplers
#include<samplerFragmentDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_SAMPLERNAME_,diffuse)


// @DEBUG Just vibes for now
#ifdef DITHER
// From: https://github.com/WojtekPachowiak/playstation1-dither/blob/main/opengl/ps1_dither.frag
mat4 psx_dither_table=mat4
(
    0,8,2,10,
    12,4,14,6,
    3,11,1,9,
    15,7,13,5
);
vec3 dither(vec3 color, vec2 p) {
  // extrapolate 16bit color float to 16bit integer space
  color *= 255.;

  //get dither value from dither table (by indexing it with column and row offsets)
  highp int col = int(mod(p.x, 4.0));
  highp int row = int(mod(p.y, 4.0));
  float dither = psx_dither_table[col][row];

  // dithering process as described in PSYDEV SDK documentation
  color += (dither / 2.0 - 4.0);

  // clamp to 0
  color = max(color, 0.0);

  // @TODO Split out 15 bit color into its own feature
  // truncate to 5bpc precision via bitwise AND operator, and limit value max to prevent wrapping.
  // PS1 colors in default color mode have a maximum integer value of 248 (0xf8)
  ivec3 c = ivec3(color) & ivec3(0xf8);
  color = mix(vec3(c), vec3(0xf8), step(vec3(0xf8), color));

  // bring color back to floating point number space
  color /= 255.;
  return color;
}
#endif

// Reflection
#ifdef REFLECTION
  #ifdef REFLECTIONMAP_3D
uniform samplerCube reflectionCubeSampler;
  #else
uniform sampler2D reflection2DSampler;
  #endif
  #include<reflectionFunction>
#endif

// Fog
#include<fogFragmentDeclaration>

void main(void) {
  vec3 viewDirectionW = normalize(vEyePosition.xyz - vPositionW);

	// Base color
  vec4 baseColor = vec4(1., 1., 1., 1.);
  vec3 diffuseColor = vDiffuseColor.rgb;

	// Alpha
  float alpha = vDiffuseColor.a;

	// Bump
#ifdef NORMAL
  vec3 normalW = normalize(vNormalW);
#else
  // @TODO needed?
  vec3 normalW = normalize(-cross(dFdx(vPositionW), dFdy(vPositionW)));
#endif

  vec2 uvOffset = vec2(0.0, 0.0);

  // @TODO needed?
#ifdef TWOSIDEDLIGHTING
  normalW = gl_FrontFacing ? normalW : -normalW;
#endif

  // Diffuse texture
#ifdef DIFFUSE
  baseColor = texture2D(diffuseSampler, vDiffuseUV + uvOffset);

	#if defined(ALPHATEST) && !defined(ALPHATEST_AFTERALLALPHACOMPUTATIONS)
  if(baseColor.a < alphaCutOff)
    discard;
	#endif

	#ifdef ALPHAFROMDIFFUSE
  alpha *= baseColor.a;
	#endif

  baseColor.rgb *= vDiffuseInfos.y;
#endif

  // Vertex colors
#if defined(VERTEXCOLOR)
  baseColor.rgb *= vColor.rgb;
#endif

  // Reflection
  vec4 reflectionColor = vec4(0., 0., 0., 1.);
#ifdef REFLECTION
  vec3 vReflectionUVW = computeReflectionCoords(vec4(vPositionW, 1.0), normalW);
	#ifdef REFLECTIONMAP_3D
  reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW);
	#else
  vec2 coords = vReflectionUVW.xy;

  coords.y = 1.0 - coords.y;
  reflectionColor = texture2D(reflection2DSampler, coords);
	#endif
  reflectionColor.rgb *= vReflectionInfos.x;
#endif

  // Vertex colors
#if defined(VERTEXALPHA)
  alpha *= vColor.a;
#endif

#ifdef ALPHATEST
    #ifdef ALPHATEST_AFTERALLALPHACOMPUTATIONS
  if(alpha < alphaCutOff)
    discard;
    #endif
    #ifndef ALPHABLEND
  // Prevent to blend with the canvas.
  alpha = 1.0;
    #endif
#endif

	// Composition
  vec3 finalDiffuse = clamp(vLightingColor * diffuseColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;

  // #ifdef REFLECTIONOVERALPHA
  // @TODO Bring this back? Only if it doesn't apply to like alpha=0.1
  // Probably don't care about alpha=0
  // 	alpha = clamp(alpha + dot(reflectionColor.rgb, vec3(0.3, 0.59, 0.11)), 0., 1.);
  // #endif

  vec4 color = vec4(finalDiffuse + reflectionColor.rgb, alpha);

#ifdef DITHER
  color.rgb = dither(color.rgb, floor(gl_FragCoord.xy / 1.0));
#endif

  color.rgb = max(color.rgb, 0.);

#include<fogFragment>

  // color.a *= visibility;

  gl_FragColor = color;
}