/* vim: set filetype=glsl : */

export const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uNormalMap;
uniform sampler2D uSpecularMap;
uniform sampler2D uClouds;
uniform vec3 uLightPos;
uniform vec3 uViewPos;

in vec3 texCoord;
in vec3 fragPos;
in mat3 TBN;

out vec4 outColor;

#define M_PI 3.1415926535897932384626433832795

void main()
{
    // texture coordinate
    vec2 st = vec2(
        (atan(texCoord.y, texCoord.x) / M_PI + 1.0) * 0.5, 
        asin(texCoord.z) / M_PI + 0.5
    );

    // normal
    vec3 normal = vec3(0.0);
    normal = texture(uNormalMap, st).rgb;
    normal = normal * 2.0 - 1.0;    // [0,1] => [-1,1]
    normal = normalize(TBN * normal);

    // lighting
    vec3 lightColor = vec3(0.8, 0.8, 0.8);

    // ambient
    vec3 ambient = lightColor * vec3(0.2, 0.2, 0.3);

    // diffuse
    vec3 lightDir = normalize(uLightPos - fragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = lightColor * diff * vec3(1.0) * 0.8;

    // specular
    vec3 viewDir = normalize(uViewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = max(dot(viewDir, reflectDir), 0.0);
    vec3 specular = lightColor * spec * texture(uSpecularMap, st).rgb * 0.8;

    // output
    vec4 texel = texture(uTexture, st);
    vec4 clouds = texture(uClouds, st);
    vec4 color = mix(texel, clouds, clouds.r);
    outColor = vec4((ambient + diffuse + specular) * color.rgb, 1.0);
}`;
