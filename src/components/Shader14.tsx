import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  DataTexture,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderTarget,
} from "three";

function ShaderScene({
  backgroundColor,
  color,
}: {
  backgroundColor: string;
  color: string;
}) {
  const outputMaterialRef = useRef<ShaderMaterial | null>(null);
  const { gl, size } = useThree();

  const renderTarget = useMemo(
    () =>
      new WebGLRenderTarget(1, 1, {
        format: RGBAFormat,
        magFilter: NearestFilter,
        minFilter: NearestFilter,
      }),
    [],
  );

  const firstPassUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new Vector3(1, 1, 1) },
      u_backgroundColor: { value: new Color(backgroundColor) },
      u_color: { value: new Color(color) },
    }),
    [backgroundColor, color],
  );

  const secondPassUniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new Vector3(1, 1, 1) },
      u_channel0: { value: renderTarget.texture },
      u_glyphAtlas: { value: createGlyphAtlas() },
    }),
    [renderTarget],
  );

  const offscreen = useMemo(() => {
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      fragmentShader: FLOW_SHADER,
      uniforms: firstPassUniforms,
      vertexShader: VERTEX_SHADER,
    });
    const mesh = new Mesh(new PlaneGeometry(2, 2), material);

    scene.add(mesh);

    return { camera, material, mesh, scene };
  }, [firstPassUniforms]);

  useEffect(() => {
    return () => {
      renderTarget.dispose();
      const glyphAtlas = secondPassUniforms.u_glyphAtlas.value as DataTexture;
      glyphAtlas.dispose();
      offscreen.mesh.geometry.dispose();
      offscreen.material.dispose();
    };
  }, [offscreen, renderTarget, secondPassUniforms]);

  useEffect(() => {
    renderTarget.setSize(size.width, size.height);
  }, [renderTarget, size.height, size.width]);

  useFrame((state) => {
    const resolution = new Vector3(size.width, size.height, 1);

    offscreen.material.uniforms.u_time.value = state.clock.elapsedTime;
    offscreen.material.uniforms.u_resolution.value = resolution;

    if (outputMaterialRef.current) {
      outputMaterialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
      outputMaterialRef.current.uniforms.u_resolution.value = resolution;
      outputMaterialRef.current.uniforms.u_channel0.value = renderTarget.texture;
    }

    gl.setRenderTarget(renderTarget);
    gl.render(offscreen.scene, offscreen.camera);
    gl.setRenderTarget(null);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={outputMaterialRef}
        depthTest={false}
        depthWrite={false}
        fragmentShader={DITHER_SHADER}
        uniforms={secondPassUniforms}
        vertexShader={VERTEX_SHADER}
      />
    </mesh>
  );
}

export default function Shader14({
  className = "",
  backgroundColor = "#000000",
  color = "#f0f0f0",
}: {
  className?: string;
  backgroundColor?: string;
  color?: string;
}) {
  return (
    <section className={className}>
      <Canvas
        camera={{ far: 1, near: 0, position: [0, 0, 1] }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false }}
      >
        <ShaderScene backgroundColor={backgroundColor} color={color} />
      </Canvas>
    </section>
  );
}

const VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FLOW_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform float u_time;
  uniform vec3 u_resolution;
  uniform vec3 u_backgroundColor;
  uniform vec3 u_color;

  #define TWOPI 6.28318530718

  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=vec3(1.0)-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=vec4(1.0)-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 55.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec3 c;
    float l,z=u_time;
    vec2 r=u_resolution.xy;
    vec2 uv0=fragCoord.xy/r;
    float noiseStrength=0.16;
    float noiseScale=0.001;
    float speed=0.1;
    float noiseTime=u_time*speed;
    float noise=snoise(vec3(
        (fragCoord.x-r.x/2.)*noiseScale,
        (fragCoord.y-r.y/2.)*noiseScale,
        noiseTime));
    uv0.x=fract(uv0).x+noiseStrength*sin(noise*TWOPI);
    uv0.y=fract(uv0).y+noiseStrength*cos(noise*TWOPI);
    for(int i=0;i<3;i++){
      vec2 uv,p=uv0;
      uv=p;
      p-=.5;
      p.x*=r.x/r.y;
      z+=.03;
      l=max(length(p), 0.0001);
      uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z-z));
      c[i]=.05/max(length(mod(uv,1.)-.5), 0.0001);
    }
    fragColor=vec4(c/max(l, 0.0001),1.0);
  }

  void main(){
    vec4 fragColor;
    vec2 fragCoord=vUv*u_resolution.xy;
    mainImage(fragColor,fragCoord);

    vec3 pattern = fragColor.rgb * u_color;
    fragColor.rgb = mix(u_backgroundColor, pattern, 0.6);

    gl_FragColor=fragColor;
  }
`;

const DITHER_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform float u_time;
  uniform vec3 u_resolution;
  uniform sampler2D u_channel0;
  uniform sampler2D u_glyphAtlas;

  float glyphIndex(float gray) {
    float idx = 0.0;
    if (gray > 0.1064) idx = 1.0;
    if (gray > 0.1096) idx = 2.0;
    if (gray > 0.1130) idx = 3.0;
    if (gray > 0.1263) idx = 4.0;
    if (gray > 0.1395) idx = 5.0;
    if (gray > 0.1628) idx = 6.0;
    if (gray > 0.1860) idx = 7.0;
    if (gray > 0.2093) idx = 8.0;
    if (gray > 0.2326) idx = 9.0;
    if (gray > 0.2558) idx = 10.0;
    if (gray > 0.2791) idx = 11.0;
    if (gray > 0.3023) idx = 12.0;
    if (gray > 0.3256) idx = 13.0;
    if (gray > 0.3488) idx = 14.0;
    if (gray > 0.3721) idx = 15.0;
    if (gray > 0.3953) idx = 16.0;
    if (gray > 0.4186) idx = 17.0;
    if (gray > 0.4419) idx = 18.0;
    if (gray > 0.4651) idx = 19.0;
    if (gray > 0.4884) idx = 20.0;
    if (gray > 0.5116) idx = 21.0;
    if (gray > 0.5349) idx = 22.0;
    if (gray > 0.5581) idx = 23.0;
    if (gray > 0.5814) idx = 24.0;
    if (gray > 0.6047) idx = 25.0;
    if (gray > 0.6279) idx = 26.0;
    if (gray > 0.6512) idx = 27.0;
    if (gray > 0.6744) idx = 28.0;
    if (gray > 0.6977) idx = 29.0;
    if (gray > 0.7209) idx = 30.0;
    if (gray > 0.7442) idx = 31.0;
    if (gray > 0.7674) idx = 32.0;
    if (gray > 0.7907) idx = 33.0;
    if (gray > 0.8140) idx = 34.0;
    if (gray > 0.8372) idx = 35.0;
    if (gray > 0.8605) idx = 36.0;
    if (gray > 0.8837) idx = 37.0;
    if (gray > 0.9070) idx = 38.0;
    if (gray > 0.9302) idx = 39.0;
    if (gray > 0.9535) idx = 40.0;
    if (gray > 0.9767) idx = 41.0;
    return idx;
  }

  float glyphMask(float idx, vec2 p) {
    vec2 cell = floor(p * vec2(-4.0, 4.0) + 2.5);

    if (cell.x < 0.0 || cell.x > 4.0 || cell.y < 0.0 || cell.y > 4.0) {
      return 0.0;
    }

    vec2 atlasSize = vec2(210.0, 5.0);
    vec2 atlasCoord = vec2(idx * 5.0 + cell.x + 0.5, cell.y + 0.5) / atlasSize;
    return texture2D(u_glyphAtlas, atlasCoord).r;
  }

  void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 pix=fragCoord.xy;
    vec3 col=texture2D(u_channel0,floor(pix/16.0)*16.0/u_resolution.xy).rgb;
    float gray=clamp(dot(col, vec3(0.3, 0.59, 0.11)), 0.0, 1.0);
    vec2 p=mod(pix/8.0,2.0)-vec2(1.0);
    float mask = glyphMask(glyphIndex(gray), p);
    vec3 finalCol=col*mask;
    fragColor=vec4(finalCol,1.0);
  }

  void main(){
    vec4 fragColor;
    vec2 fragCoord=vUv*u_resolution.xy;
    mainImage(fragColor,fragCoord);
    gl_FragColor=fragColor;
  }
`;

function createGlyphAtlas() {
  const width = GLYPH_MASKS.length * 5;
  const height = 5;
  const data = new Uint8Array(width * height * 4);

  for (let glyph = 0; glyph < GLYPH_MASKS.length; glyph += 1) {
    const mask = GLYPH_MASKS[glyph];
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const bit = (mask >>> (x + y * 5)) & 1;
        const index = ((y * width) + glyph * 5 + x) * 4;
        const value = bit ? 255 : 0;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }
    }
  }

  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.needsUpdate = true;
  texture.flipY = false;
  return texture;
}

const GLYPH_MASKS = [
  4096, 131200, 4329476, 459200, 4591748, 12652620, 14749828, 18393220,
  15239300, 17318431, 32641156, 18393412, 18157905, 17463428, 14954572,
  13177118, 6566222, 16269839, 18444881, 18400814, 33061392, 15255086,
  32045584, 18405034, 15022158, 15018318, 16272942, 18415153, 32641183,
  32540207, 18732593, 18667121, 16267326, 32575775, 15022414, 15255537,
  32032318, 32045617, 33081316, 32045630, 33061407, 11512810,
];
