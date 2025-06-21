// @TODO inline?
#include<__decl__defaultVertex>

// @TODO is there a better define for this? Something like UBO_SUPPORTED?
// @TODO in the declaration and put this in the non-UBO version 🤷‍♀️
#if !defined(WORLD_UBO)
// Stuff that is automatically defined by the UBO declaration
// but not by the vertex declaration
uniform mat4 world;
uniform vec4 vEyePosition;
uniform vec3 vEmissiveColor;
#endif

/*
  @TODO Shader backlog
    - Tidy code up?
    - Is `NORMAL` always defined?
    - Test vertex colors
    - Inline declarations / move into project
 */

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#include<uvAttributeDeclaration>[2..7]
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<helperFunctions>
#include<bonesDeclaration>

// Uniforms
#include<mainUVVaryingDeclaration>[1..7]

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#if defined(VERTEXCOLOR)
varying vec4 vColor;
#endif
varying vec3 vLightingColor;

#include<fogVertexDeclaration>

// Lighting
// @NOTE Must be below `vPositionW`
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>

void main(void)
{
  vec3 positionUpdated = position;
#ifdef NORMAL
  vec3 normalUpdated = normal;
#endif
#ifdef UV1
  vec2 uvUpdated = uv;
#endif
#ifdef UV2
  vec2 uv2Updated = uv2;
#endif
#ifdef VERTEXCOLOR
  vec4 colorUpdated = color;
#endif
  mat4 finalWorld = world; // @TODO Remove

#include<bonesVertex>

  vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

#ifdef NORMAL
  mat3 normalWorld = mat3(finalWorld);

  #ifdef NONUNIFORMSCALING
      normalWorld = transposeMat3(inverseMat3(normalWorld));
  #endif

  vNormalW = normalize(normalWorld * normalUpdated);
#endif

  gl_Position = viewProjection * worldPos; // @NOTE From block above
  vPositionW = vec3(worldPos);

  // Texture coordinates
#ifndef UV1
  vec2 uvUpdated = vec2(0., 0.);
#endif
#ifndef UV2
  vec2 uv2Updated = vec2(0., 0.);
#endif
#ifdef MAINUV1
  vMainUV1 = uvUpdated;
#endif
#ifdef MAINUV2
  vMainUV2 = uv2Updated;
#endif
#include<uvVariableDeclaration>[3..7]

#include<fogVertex>

#include<vertexColorMixing>

  // Lighting
  /* <Dependencies> */
  vec3 viewDirectionW = normalize(vEyePosition.xyz - vPositionW);
  vec3 normalW = normalize(vNormalW);
  float glossiness = 0.0;
  /* </Dependencies> */
  vec3 diffuseBase = vec3(0.0, 0.0, 0.0);
  lightingInfo info;
  float shadow = 1.0;
  float aggShadow = 0.0;
  float numLights = 0.0;

#include<lightFragment>[0..maxSimultaneousLights]

  aggShadow = aggShadow / numLights;

  vLightingColor = diffuseBase + vEmissiveColor;
}