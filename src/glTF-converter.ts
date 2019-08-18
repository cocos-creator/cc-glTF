import * as imageDataUri from 'image-data-uri';
import * as parseDataUrl from 'parse-data-url';
import * as glTF from '../@types/glTF';
import * as URI from 'uri-js';

// tslint:disable:no-string-literal

export const enum AssetFinderKind {
    mesh = 'meshes',
    animation = 'animations',
    skeleton = 'skeletons',
    texture = 'textures',
    material = 'materials',
}

export interface AssetFinderResultMap {
    [AssetFinderKind.mesh]: ccm.Mesh;
    [AssetFinderKind.animation]: ccm.AnimationClip;
    [AssetFinderKind.skeleton]: ccm.Skeleton;
    [AssetFinderKind.texture]: ccm.Texture2D;
    [AssetFinderKind.material]: ccm.Material;
}

export interface AssetFinder {
    find<AFK extends AssetFinderKind>(kind: AFK, index: number): AssetFinderResultMap[AFK] | null;
}

export type GltfSubAsset = glTF.Node | glTF.Mesh | glTF.Texture | glTF.Skin | glTF.Animation | glTF.Image | glTF.Material | glTF.Scene;

export function getPathFromRoot (target: ccm.Node | null, root: ccm.Node) {
    let node: ccm.Node | null = target;
    let path = '';
    while (node !== null && node !== root) {
        path = `${node.name}/${path}`;
        node = node.parent;
    }
    return path.slice(0, -1);
}

export function getWorldTransformUntilRoot (target: ccm.Node, root: ccm.Node, outPos: ccm.math.Vec3, outRot: ccm.math.Quat, outScale: ccm.math.Vec3) {
    ccm.math.Vec3.set(outPos, 0, 0, 0);
    ccm.math.Quat.set(outRot, 0, 0, 0, 1);
    ccm.math.Vec3.set(outScale, 1, 1, 1);
    while (target !== root) {
        ccm.math.Vec3.multiply(outPos, outPos, target.scale);
        ccm.math.Vec3.transformQuat(outPos, outPos, target.rotation);
        ccm.math.Vec3.add(outPos, outPos, target.position);
        ccm.math.Quat.multiply(outRot, target.rotation, outRot);
        ccm.math.Vec3.multiply(outScale, target.scale, outScale);
        target = target.parent!;
    }
}

enum GltfAssetKind {
    Node,
    Mesh,
    Texture,
    Skin,
    Animation,
    Image,
    Material,
    Scene,
}

export enum NormalImportSetting {
    /**
     * 如果模型文件中包含法线信息则导出法线，否则不导出法线。
     */
    optional,

    /**
     * 不在导出的网格中包含法线信息。
     */
    exclude,

    /**
     * 如果模型文件中包含法线信息则导出法线，否则重新计算并导出法线。
     */
    require,

    /**
     * 不管模型文件中是否包含法线信息，直接重新计算并导出法线。
     */
    recalculate,
}

export enum TangentImportSetting {
    /**
     * 不在导出的网格中包含正切信息。
     */
    exclude,

    /**
     * 如果模型文件中包含正切信息则导出正切，否则不导出正切。
     */
    optional,

    /**
     * 如果模型文件中包含正切信息则导出正切，否则重新计算并导出正切。
     */
    require,

    /**
     * 不管模型文件中是否包含正切信息，直接重新计算并导出正切。
     */
    recalculate,
}

type AccessorStorageConstructor =
    typeof Int8Array | typeof Uint8Array | typeof Int16Array | typeof Uint16Array | typeof Uint32Array | typeof Float32Array;

type AccessorStorage = Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;

export interface IMeshOptions {
    normals: NormalImportSetting;
    tangents: TangentImportSetting;
}

export interface IGltfSemantic {
    name: string;
    baseType: number;
    type: string;
}

const GltfSemantics = {
    normal: {
        name: glTF.SemanticName.NORMAL,
        baseType: glTF.AccessorComponentType.FLOAT,
        type: glTF.AccessorType.VEC3,
    } as IGltfSemantic,

    tangent: {
        name: glTF.SemanticName.TANGENT,
        baseType: glTF.AccessorComponentType.FLOAT,
        type: glTF.AccessorType.VEC3,
    } as IGltfSemantic,
};

interface IPrimitiveViewer {
    getVertexCount(): number;
    getPositions(): Float32Array;
    getFaces(): AccessorStorage;
    getFaceCount(): number;
    getNormals(): Float32Array;
    getUVs(): AccessorStorage;
}

const v3_1 = new ccm.math.Vec3();
const qt_1 = new ccm.math.Quat();
const v3_2 = new ccm.math.Vec3();
const nd_1 = new ccm.Node();

export function getNodePathByTargetName(root: ccm.Node, name: string, path: string): string {
    for (let index = 0; index < root.children.length; index++) {
        const n = root.children[index];
        const pathN = path + "/" + n.name;
        if (n.name === name) {
            return pathN;
        } else {
            const path1 = getNodePathByTargetName(n, name, pathN);
            if (path1 !== pathN) {
                return path1;
            }
        }
    }
    return path;
}

function do_create (sceneNode: ccm.Node, out: ccm.SkeletalAnimationComponent.Socket[], model: ccm.Node, path: string) {
    if (model.parent === sceneNode) { return; }
    let socket = out.find((s) => s.path === path);
    if (!socket) {
        const target = new ccm.Node();
        target.name = `${model.parent!.name} Socket`;
        target.parent = sceneNode;
        getWorldTransformUntilRoot(model.parent!, sceneNode, v3_1, qt_1, v3_2);
        target.setPosition(v3_1);
        target.setRotation(qt_1);
        target.setScale(v3_2);
        socket = new ccm.SkeletalAnimationComponent.Socket(path, target);
        out.push(socket);
    }
    model.parent = socket.target;
};

export function createSockets(sceneNode: ccm.Node, specialNames?: string[]) {
    if (!sceneNode.getComponentInChildren(ccm.SkinningModelComponent)) { return []; }
    const renderables = sceneNode.getComponentsInChildren(ccm.RenderableComponent);
    const sockets: ccm.SkeletalAnimationComponent.Socket[] = [];
    const specialCases = specialNames ? new RegExp(specialNames.reduce((acc, cur) => acc ? `${acc}|${cur}` : cur, '')) : null;
    for (const renderable of renderables) {
        // general cases
        let model = renderable.node!;
        // handle skinning models
        if (renderable instanceof ccm.SkinningModelComponent) {
            const skinningRoot = renderable._skinningRoot;
            if (skinningRoot === sceneNode) { continue; }
            if (skinningRoot) { model = skinningRoot; }
        }
        // skip special cases
        let path = getPathFromRoot(model.parent, sceneNode);
        if (specialCases && specialCases.test(path)) { continue; }
        do_create(sceneNode, sockets, model, path);
    }
    if (specialNames) {
        const targets = specialNames.map((n) => getNodePathByTargetName(sceneNode, n, ''));
        for (let i = 0; i< targets.length; i++) {
            const target = targets[i];
            if (!target) { continue; }
            const path = target.slice(1, -specialNames[i].length - 1);
            const model = sceneNode.getChildByPath(target);
            if (model) { do_create(sceneNode, sockets, model, path); }
        }
    }
    return sockets;
}

export class GltfConverter {

    get gltf() {
        return this._gltf;
    }

    get url() {
        return this._url;
    }
    
    private _nodePathTable: string[] | null = null;

    /**
     * The parent index of each node.
     */
    private _parents: number[] = [];

    /**
     * The root node of each skin.
     */
    private _skinRoots: number[] = [];

    constructor(private _gltf: glTF.GlTf, private _buffers: DataView[], private _url: string) {
        // We require the scene graph is a disjoint union of strict trees.
        // This is also the requirement in glTf 2.0.
        if (this._gltf.nodes !== undefined) {
            this._parents = new Array(this._gltf.nodes.length).fill(-1);
            this._gltf.nodes.forEach((node, iNode) => {
                if (node.children !== undefined) {
                    for (const iChildNode of node.children) {
                        this._parents[iChildNode] = iNode;
                    }
                }
            });
        }

        if (this._gltf.skins) {
            this._skinRoots = new Array(this._gltf.skins.length).fill(-1);
        }

        this._nodePathTable = this._createNodePathTable();
    }

    public createMesh(iGltfMesh: number, options: IMeshOptions) {
        const gltfMesh = this._gltf.meshes![iGltfMesh];
        const bufferBlob = new BufferBlob();
        const vertexBundles = new Array<ccm.IVertexBundle>();
        const minPosition = new ccm.math.Vec3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        const maxPosition = new ccm.math.Vec3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

        let targetNodeIdx = -1;
        let targetNode = null;
        let targetCCNode: ccm.Node | null = null;
        const idxMap: number[] = [];
        if (this._gltf.nodes) {
            targetNodeIdx = this._gltf.nodes.findIndex((n) => n.mesh === iGltfMesh);
            targetNode = this._gltf.nodes[targetNodeIdx];
        }
        if (targetNode && targetNode.skin !== undefined) {
            this.createSkeleton(targetNode.skin!, idxMap);
            targetCCNode = this._createEmptyNode(targetNodeIdx);
        }

        const primitives = gltfMesh.primitives.map((gltfPrimitive, primitiveIndex): ccm.IPrimitive => {
            const { vertexBuffer,
                vertexCount,
                vertexStride,
                formats,
                posBuffer,
                posBufferAlign,
            } = this._readPrimitiveVertices(gltfPrimitive, minPosition, maxPosition, options, targetCCNode, idxMap);

            bufferBlob.setNextAlignment(0);
            vertexBundles.push({
                view: {
                    offset: bufferBlob.getLength(),
                    length: vertexBuffer.byteLength,
                    count: vertexCount,
                    stride: vertexStride,
                },
                attributes: formats,
            });
            bufferBlob.addBuffer(vertexBuffer);

            const primitive: ccm.IPrimitive = {
                primitiveMode: this._getPrimitiveMode(gltfPrimitive.mode),
                vertexBundelIndices: [primitiveIndex],
            };

            // geometric info for raycast purposes

            if (primitive.primitiveMode >= ccm.GFXPrimitiveMode.TRIANGLE_LIST) {
                bufferBlob.setNextAlignment(posBufferAlign);
                primitive.geometricInfo = {
                    view: {
                        offset: bufferBlob.getLength(),
                        length: posBuffer.byteLength,
                        count: posBuffer.byteLength / posBufferAlign,
                        stride: posBufferAlign,
                    },
                };
                bufferBlob.addBuffer(posBuffer);
            }

            if (gltfPrimitive.indices !== undefined) {
                const indicesAccessor = this._gltf.accessors![gltfPrimitive.indices];
                const indexStride = this._getBytesPerAttribute(indicesAccessor);
                const indicesData = new ArrayBuffer(indexStride * indicesAccessor.count);
                this._readAccessor(indicesAccessor, new DataView(indicesData));
                bufferBlob.setNextAlignment(indexStride);
                primitive.indexView = {
                    offset: bufferBlob.getLength(),
                    length: indicesData.byteLength,
                    count: indicesAccessor.count,
                    stride: this._getIndexStride(indicesAccessor.componentType),
                };
                bufferBlob.addBuffer(indicesData);
            }

            return primitive;
        });

        const meshStruct: ccm.IMeshStruct = {
            primitives,
            vertexBundles,
            minPosition,
            maxPosition,
        };

        const mesh = new ccm.Mesh();
        mesh.name = this._getGltfXXName(GltfAssetKind.Mesh, iGltfMesh);
        mesh.assign(meshStruct, bufferBlob.getCombined());
        return mesh;
    }

    public createSkeleton(iGltfSkin: number, sortMap?: number[]) {
        const gltfSkin = this._gltf.skins![iGltfSkin];

        const skeleton = new ccm.Skeleton();
        skeleton.name = this._getGltfXXName(GltfAssetKind.Skin, iGltfSkin);
        skeleton._joints = gltfSkin.joints.map(this._getNodePath.bind(this));

        if (gltfSkin.inverseBindMatrices !== undefined) {
            const inverseBindMatricesAccessor = this._gltf.accessors![gltfSkin.inverseBindMatrices];
            if (inverseBindMatricesAccessor.componentType !== WebGLRenderingContext.FLOAT ||
                inverseBindMatricesAccessor.type !== 'MAT4') {
                throw new Error(`The inverse bind matrix should be floating-point 4x4 matrix.`);
            }

            const m = new ccm.math.Mat4();
            const targetIdx = this._gltf.nodes!.findIndex((n) => n.skin === iGltfSkin);
            const target = targetIdx >= 0 ? this._createEmptyNode(targetIdx) : nd_1;
            ccm.math.Mat4.invert(m, ccm.math.Mat4.fromRTS(m, target._lrot, target._lpos, target._lscale));

            const bindposes: ccm.math.Mat4[] = new Array(gltfSkin.joints.length);
            const data = new Float32Array(bindposes.length * 16);
            this._readAccessor(inverseBindMatricesAccessor, createDataViewFromTypedArray(data));
            for (let i = 0; i < bindposes.length; ++i) {
                bindposes[i] = new ccm.math.Mat4(
                    data[16 * i + 0], data[16 * i + 1], data[16 * i + 2], data[16 * i + 3],
                    data[16 * i + 4], data[16 * i + 5], data[16 * i + 6], data[16 * i + 7],
                    data[16 * i + 8], data[16 * i + 9], data[16 * i + 10], data[16 * i + 11],
                    data[16 * i + 12], data[16 * i + 13], data[16 * i + 14], data[16 * i + 15]
                );
                ccm.math.Mat4.multiply(bindposes[i], bindposes[i], m); // for local transforms are already pre applied
            }
            skeleton._bindposes = bindposes;
        }

        /* [Optimization.1a] sort the joints array to be more cache-friendly *
        const idxMap = [...Array(joints.length).keys()].sort((a, b) => {
            if (joints[a] > joints[b]) { return 1; }
            if (joints[a] < joints[b]) { return -1; }
            return 0;
        });
        skeleton._joints = joints.map((_, idx, arr) => arr[idxMap[idx]]);
        if (skeleton._bindposes) { skeleton._bindposes = bindposes.map((_, idx, arr) => arr[idxMap[idx]]); }
        if (sortMap) { for (const i of idxMap) { sortMap.push(i); } }
        /* */

        return skeleton;
    }

    public getAnimationDuration(iGltfAnimation: number) {
        const gltfAnimation = this._gltf.animations![iGltfAnimation];
        let duration = 0;
        gltfAnimation.channels.forEach((gltfChannel) => {
            const targetNode = gltfChannel.target.node;
            if (targetNode === undefined) {
                // When node isn't defined, channel should be ignored.
                return;
            }

            const sampler = gltfAnimation.samplers[gltfChannel.sampler];
            const inputAccessor = this._gltf.accessors![sampler.input];
            const channelDuration = inputAccessor.max !== undefined && inputAccessor.max.length === 1 ? Math.fround(inputAccessor.max[0]) : 0;
            duration = Math.max(channelDuration, duration);
        });
        return duration;
    }

    public createAnimation(iGltfAnimation: number, span?: {from: number; to: number; }) {
        const gltfAnimation = this._gltf.animations![iGltfAnimation];

        const curveDatas: { [path: string]: ccm.ICurveData} = {};
        const getCurveData = (node: number) => {
            const path = this._getNodePath(node);
            let curveData = curveDatas[path];
            if (curveData === undefined) {
                curveData = {};
                curveDatas[path] = curveData;
            }
            return curveData;
        };
        let duration = 0;
        const keys = new Array<number[]>();
        const keysSplitInfos = new Array<{from: number; to: number; }>();
        const floatingIndexOf = (value: number, values: number[]): number => {
            const iPast = values.findIndex((v) => v >= value);
            if (iPast < 0) {
                return values.length - 1;
            } else if (iPast === 0) {
                return 0;
            } else {
                const iBefore = iPast - 1;
                const before = values[iBefore];
                const past = values[iPast];
                const ratio = (value - before) / (past - before);
                return iBefore + ratio;
            }
        };
        const keysMap = new Map<number, number>();
        const getKeysIndex = (iInputAccessor: number) => {
            let i = keysMap.get(iInputAccessor);
            if (i === undefined) {
                const inputAccessor = this._gltf.accessors![iInputAccessor];
                const inputs = this._readAccessorIntoArray(inputAccessor) as Float32Array;
                i = keys.length;
                const intputArray = Array.from(inputs);
                if (span) {
                    const splitInfo = {
                        from: floatingIndexOf(span.from, intputArray),
                        to: floatingIndexOf(span.to, intputArray),
                    };
                    keysSplitInfos.push(splitInfo);
                    const splitKeys = this._split(intputArray, splitInfo.from, splitInfo.to, (from, to, ratio) => {
                        return from + (to - from) * ratio;
                    });
                    keys.push(splitKeys.map((splitKey) => splitKey - span.from));
                } else {
                    keys.push(intputArray);
                }
                keysMap.set(iInputAccessor, i);
            }
            return i;
        };
        gltfAnimation.channels.forEach((gltfChannel) => {
            const targetNode = gltfChannel.target.node;
            if (targetNode === undefined) {
                // When node isn't defined, channel should be ignored.
                return;
            }

            const curveData = getCurveData(targetNode);
            const sampler = gltfAnimation.samplers[gltfChannel.sampler];
            const iKeys = getKeysIndex(sampler.input);
            const keysSplitInfo = span ? keysSplitInfos[iKeys] : undefined;
            this._gltfChannelToCurveData(gltfAnimation, gltfChannel, curveData, iKeys, keysSplitInfo);
            const inputAccessor = this._gltf.accessors![sampler.input];
            const channelDuration = inputAccessor.max !== undefined && inputAccessor.max.length === 1 ? Math.fround(inputAccessor.max[0]) : 0;
            duration = Math.max(channelDuration, duration);
        });

        if (this._gltf.nodes) {
            const r = new ccm.math.Quat(); const t = new ccm.math.Vec3(); const s = new ccm.math.Vec3();
            this._gltf.nodes.forEach((node, nodeIndex) => {
                const curveData = getCurveData(nodeIndex);
                curveData.props = curveData.props || {};
                let m: ccm.math.Mat4 | undefined;
                if (node.matrix) {
                    m = this._readNodeMatrix(node.matrix);
                    ccm.math.Mat4.toRTS(m, r, t, s);
                }
                if (!Reflect.has(curveData.props, 'position')) {
                    const v = new ccm.math.Vec3();
                    if (node.translation) {
                        ccm.math.Vec3.set(v, node.translation[0], node.translation[1], node.translation[2]);
                    } else if (m) {
                        ccm.math.Vec3.copy(v, t);
                    }
                    curveData.props.position = {
                        blending: 'additive3D',
                        keys: -1,
                        values: [v],
                    };
                }
                if (!Reflect.has(curveData.props, 'scale')) {
                    const v = new ccm.math.Vec3(1, 1, 1);
                    if (node.scale) {
                        ccm.math.Vec3.set(v, node.scale[0], node.scale[1], node.scale[2]);
                    } else if (m) {
                        ccm.math.Vec3.copy(v, s);
                    }
                    curveData.props.scale = {
                        blending: 'additive3D',
                        keys: -1,
                        values: [v],
                    };
                }
                if (!Reflect.has(curveData.props, 'rotation')) {
                    const v = new ccm.math.Quat();
                    if (node.rotation) {
                        this._getNodeRotation(node.rotation, v);
                    } else if (m) {
                        ccm.math.Quat.copy(v, r);
                    }
                    curveData.props.rotation = {
                        blending: 'additiveQuat',
                        keys: -1,
                        values: [v],
                    };
                }
            });
        }

        const animationClip = new ccm.SkeletalAnimationClip();
        animationClip.name = this._getGltfXXName(GltfAssetKind.Animation, iGltfAnimation);
        animationClip.curveDatas = curveDatas;
        animationClip.wrapMode = ccm.AnimationClip.WrapMode.Loop;
        animationClip.duration = span ? (span.to - span.from) : duration;
        animationClip.keys = keys;
        animationClip.sample = 30;
        return animationClip;
    }

    public createMaterial(
        iGltfMaterial: number,
        gltfAssetFinder: AssetFinder,
        effectGetter: (name: string) => ccm.EffectAsset) {
        const gltfMaterial = this._gltf.materials![iGltfMaterial];

        const material = new ccm.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, iGltfMaterial);
        material._effectAsset = effectGetter('db://internal/effects/builtin-standard.effect');

        const defines: ccm.IDefineMap = {};
        const props: Record<string, any> = {};
        const states: Record<string, any> = {
            rasterizerState: {},
            blendState: { targets: [ {} ] },
            depthStencilState: {},
        };

        // glTF convention
        defines['OCCLUSION_CHANNEL'] = 'r';
        defines['ROUGHNESS_CHANNEL'] = 'g';
        defines['METALLIC_CHANNEL'] = 'b';

        /* effect asset is actually not available *
        const shaderDefines = material._effectAsset.shaders[0].defines;
        const properties = material._effectAsset.techniques[0].passes[0].properties!;
        /* just manually set them here, remember to sync when these has changed */
        const shaderDefines = [
            { name: 'ROUGHNESS_CHANNEL', options: ['r'] },
            { name: 'METALLIC_CHANNEL',  options: ['g'] },
            { name: 'OCCLUSION_CHANNEL', options: ['b'] },
        ];
        const properties = {
            pbrParams: { value: [0.8, 0.6, 1.0, 1.0] },
            pbrScale: { value: [1.0, 1.0, 1.0, 1.0] },
            albedoScale: { value: [1.0, 1.0, 1.0, 1.0] },
        };
        /* */

        const _channelMap: Record<string, number> = { r: 0, g: 1, b: 2, a: 3 };
        const O = _channelMap[shaderDefines.find((d) => d.name === 'OCCLUSION_CHANNEL')!.options![0]];
        const R = _channelMap[shaderDefines.find((d) => d.name === 'ROUGHNESS_CHANNEL')!.options![0]];
        const M = _channelMap[shaderDefines.find((d) => d.name === 'METALLIC_CHANNEL')!.options![0]];

        const pbrParams = properties['pbrParams'].value as number[];
        props['pbrParams'] = new ccm.math.Vec4(pbrParams[O], pbrParams[R], pbrParams[M], pbrParams[3]);
        const pbrScale = properties['pbrScale'].value as number[];
        props['pbrScale'] = new ccm.math.Vec4(pbrScale[O], pbrScale[R], pbrScale[M], pbrScale[3]);
        const albedoScale = properties['albedoScale'].value as number[];
        props['albedoScale'] = new ccm.math.Vec4(albedoScale[0], albedoScale[1], albedoScale[2], albedoScale[3]);

        if (gltfMaterial.pbrMetallicRoughness) {
            const pbrMetallicRoughness = gltfMaterial.pbrMetallicRoughness;
            if (pbrMetallicRoughness.baseColorTexture !== undefined) {
                defines['USE_ALBEDO_MAP'] = true;
                props['albedoMap'] = gltfAssetFinder.find(AssetFinderKind.texture, pbrMetallicRoughness.baseColorTexture.index);
            }
            if (pbrMetallicRoughness.baseColorFactor) {
                const c = pbrMetallicRoughness.baseColorFactor;
                ccm.math.Vec4.set(props['albedoScale'], c[0], c[1], c[2], c[3]);
            }
            if (pbrMetallicRoughness.metallicRoughnessTexture !== undefined) {
                defines['USE_METALLIC_ROUGHNESS_MAP'] = true;
                props['metallicRoughnessMap'] = gltfAssetFinder.find(AssetFinderKind.texture, pbrMetallicRoughness.metallicRoughnessTexture.index);
            }
            if (pbrMetallicRoughness.metallicFactor !== undefined) {
                props['pbrParams'].z = 1;
                props['pbrScale'].z = pbrMetallicRoughness.metallicFactor;
            }
            if (pbrMetallicRoughness.roughnessFactor !== undefined) {
                props['pbrParams'].y = 1;
                props['pbrScale'].y = pbrMetallicRoughness.roughnessFactor;
            }
        }

        if (gltfMaterial.occlusionTexture) {
            const pbrOcclusionTexture = gltfMaterial.occlusionTexture;
            if (pbrOcclusionTexture.index !== undefined) {
                defines['USE_OCCLUSION_MAP'] = true;
                props['occlusionMap'] = gltfAssetFinder.find(AssetFinderKind.texture, pbrOcclusionTexture.index);
                if (pbrOcclusionTexture.strength !== undefined) {
                    props['pbrParams'].x = 1;
                    props['pbrScale'].x = pbrOcclusionTexture.strength;
                    // const strength = pbrOcclusionTexture.strength;
                    // props['pbrScale'].x = strength > 1 ? 1 / strength : 2 - strength;
                }
            }
        }

        if (gltfMaterial.normalTexture !== undefined) {
            const pbrNormalTexture = gltfMaterial.normalTexture;
            if (pbrNormalTexture.index !== undefined) {
                defines['USE_NORMAL_MAP'] = true;
                props['normalMap'] = gltfAssetFinder.find(AssetFinderKind.texture, pbrNormalTexture.index);
                if (pbrNormalTexture.scale !== undefined) {
                    props['pbrScale'].w = pbrNormalTexture.scale;
                }
            }
        }

        if (gltfMaterial.emissiveTexture !== undefined) {
            defines['USE_EMISSIVE_MAP'] = true;
            props['emissiveMap'] = gltfAssetFinder.find(AssetFinderKind.texture, gltfMaterial.emissiveTexture.index);
            props['emissive'] = new ccm.math.Vec4(1, 1, 1, 1);
        }

        if (gltfMaterial.emissiveFactor !== undefined) {
            const v = gltfMaterial.emissiveFactor;
            props['emissiveScale'] = new ccm.math.Vec4(v[0], v[1], v[2], 1);
        }

        if (gltfMaterial.doubleSided) {
            states.rasterizerState.cullMode = ccm.GFXCullMode.NONE;
        }

        switch (gltfMaterial.alphaMode) {
            case 'BLEND':
                const blendState = states.blendState.targets[0];
                blendState.blend = true;
                blendState.blendSrc = ccm.GFXBlendFactor.SRC_ALPHA;
                blendState.blendDst = ccm.GFXBlendFactor.ONE_MINUS_SRC_ALPHA;
                blendState.blendDstAlpha = ccm.GFXBlendFactor.ONE_MINUS_SRC_ALPHA;
                states.depthStencilState.depthWrite = false;
                break;
            case 'MASK':
                const alphaCutoff = gltfMaterial.alphaCutoff === undefined ? 0.5 : gltfMaterial.alphaCutoff;
                defines['USE_ALPHA_TEST'] = true;
                props['albedoScale'].w = alphaCutoff;
                break;
            case 'OPAQUE':
            case undefined:
                break;
            default:
                console.warn(
                    `Alpha mode ${gltfMaterial.alphaMode} ` +
                    `(for material named ${gltfMaterial.name}, gltf-index ${iGltfMaterial}) ` +
                    `is not supported currently.`);
                break;
        }

        material._defines = [defines];
        material._props = [props];
        material._states = [states];

        return material;
    }

    public getTextureParameters(gltfTexture: glTF.Texture) {
        const convertWrapMode = (gltfWrapMode?: number): ccm.TextureBase.WrapMode =>  {
            if (gltfWrapMode === undefined) {
                gltfWrapMode = glTF.WrapMode.__DEFAULT;
            }
            switch (gltfWrapMode) {
                case glTF.WrapMode.CLAMP_TO_EDGE: return ccm.TextureBase.WrapMode.CLAMP_TO_EDGE;
                case glTF.WrapMode.MIRRORED_REPEAT: return ccm.TextureBase.WrapMode.MIRRORED_REPEAT;
                case glTF.WrapMode.REPEAT: return ccm.TextureBase.WrapMode.REPEAT;
                default:
                    console.error(`Unsupported wrapMode: ${gltfWrapMode}, 'repeat' is used.(in ${this.url})`);
                    return ccm.TextureBase.WrapMode.REPEAT;
            }
        };

        const convertMagFilter = (gltfFilter: number): ccm.TextureBase.Filter => {
            switch (gltfFilter) {
                case glTF.TextureMagFilter.NEAREST: return ccm.TextureBase.Filter.NEAREST;
                case glTF.TextureMagFilter.LINEAR: return ccm.TextureBase.Filter.LINEAR;
                default:
                    console.warn(`Unsupported filter: ${gltfFilter}, 'linear' is used.(in ${this.url})`);
                    return ccm.TextureBase.Filter.LINEAR;
            }
        };

        const convertMinFilter = (gltfFilter: number): ccm.TextureBase.Filter[] => {
            switch (gltfFilter) {
                case glTF.TextureMinFilter.NEAREST: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.NONE];
                case glTF.TextureMinFilter.LINEAR: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NONE];
                case glTF.TextureMinFilter.NEAREST_MIPMAP_NEAREST: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.NEAREST];
                case glTF.TextureMinFilter.LINEAR_MIPMAP_NEAREST: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NEAREST];
                case glTF.TextureMinFilter.NEAREST_MIPMAP_LINEAR: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.LINEAR];
                case glTF.TextureMinFilter.LINEAR_MIPMAP_LINEAR: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.LINEAR];
                default:
                    console.warn(`Unsupported filter: ${gltfFilter}, 'linear' is used.(in ${this.url})`);
                    return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NONE];
            }
        };

        const result: Partial<{
            wrapModeS: ccm.TextureBase.WrapMode;
            wrapModeT: ccm.TextureBase.WrapMode;
            minFilter: ccm.TextureBase.Filter;
            magFilter: ccm.TextureBase.Filter;
            mipFilter: ccm.TextureBase.Filter;
        }> = {};

        if (gltfTexture.sampler === undefined) {
            result.wrapModeS = ccm.TextureBase.WrapMode.REPEAT;
            result.wrapModeT = ccm.TextureBase.WrapMode.REPEAT;
        } else {
            const gltfSampler = this._gltf.samplers![gltfTexture.sampler];
            result.wrapModeS = convertWrapMode(gltfSampler.wrapS);
            result.wrapModeT = convertWrapMode(gltfSampler.wrapT);
            if (gltfSampler.magFilter !== undefined) {
                result.magFilter = convertMagFilter(gltfSampler.magFilter);
            }
            if (gltfSampler.minFilter !== undefined) {
                const [ min, mip ] = convertMinFilter(gltfSampler.minFilter);
                result.minFilter = min;
                result.mipFilter = mip;
            }
        }

        return result;
    }

    public createScene(iGltfScene: number, gltfAssetFinder: AssetFinder, withTransform = true): ccm.Node {
        return this._getSceneNode(iGltfScene, gltfAssetFinder, withTransform);
    }

    public async readImage(gltfImage: glTF.Image, glTFUri: string, glTFHost: GLTFHost) {
        const imageUri = gltfImage.uri;
        if (imageUri !== undefined) {
            if (!isDataUri(imageUri)) {
                const imageUriAbs = resolveGLTFUri(glTFUri, imageUri);
                return await this._readImageByFsPath(imageUriAbs, glTFHost);
            } else {
                return await this._readImageByDataUri(imageUri);
            }
        } else if (gltfImage.bufferView !== undefined) {
            const bufferView = this._gltf.bufferViews![gltfImage.bufferView];
            return await this._readImageInBufferview(bufferView, gltfImage.mimeType);
        }
    }

    private _getNodeRotation(rotation: number[], out: ccm.math.Quat) {
        ccm.math.Quat.set(out, rotation[0], rotation[1], rotation[2], rotation[3]);
        ccm.math.Quat.normalize(out, out);
        return out;
    }

    private _gltfChannelToCurveData(
        gltfAnimation: glTF.Animation,
        gltfChannel: glTF.AnimationChannel,
        curveData: ccm.ICurveData,
        iKeys: number,
        span?: { from: number; to: number; }) {
        let propName: string | undefined;
        if (gltfChannel.target.path === glTF.AnimationChannelTargetPath.translation) {
            propName = 'position';
        } else if (gltfChannel.target.path === glTF.AnimationChannelTargetPath.rotation) {
            propName = 'rotation';
        } else if (gltfChannel.target.path === glTF.AnimationChannelTargetPath.scale) {
            propName = 'scale';
        } else {
            console.error(`Unsupported channel target path '${gltfChannel.target.path}'.(in ${this.url})`);
            return 0;
        }

        const gltfSampler = gltfAnimation.samplers[gltfChannel.sampler];

        let outputs = this._readAccessorIntoArray(this._gltf.accessors![gltfSampler.output]);
        if (!(outputs instanceof Float32Array)) {
            const normalizedOutput = new Float32Array(outputs.length);
            const normalize = (() => {
                if (outputs instanceof Int8Array) {
                    return (value: number) => {
                        return Math.max(value / 127.0, -1.0);
                    };
                } else if (outputs instanceof Uint8Array) {
                    return (value: number) => {
                        return value / 255.0;
                    };
                } else if (outputs instanceof Int16Array) {
                    return (value: number) => {
                        return Math.max(value / 32767.0, -1.0);
                    };
                } else if (outputs instanceof Uint16Array) {
                    return (value: number) => {
                        return value / 65535.0;
                    };
                } else {
                    return (value: number) => {
                        return value;
                    };
                }
            })();
            for (let i = 0; i < outputs.length; ++i) {
                normalizedOutput[i] = normalize(outputs[i]); // Do normalize.
            }
            outputs = normalizedOutput;
        }

        let values: any[] = [];
        let blendingFunctionName: 'additive1D' | 'additive3D' | 'additiveQuat' | null = null;
        let valueConstructor: (typeof ccm.math.Vec3) | (typeof ccm.math.Quat) | null = null;
        if (propName === 'position' || propName === 'scale') {
            valueConstructor = ccm.math.Vec3;
            values = new Array<ccm.math.Vec3>(outputs.length / 3);
            for (let i = 0; i < values.length; ++i) {
                values[i] = new ccm.math.Vec3(outputs[i * 3 + 0], outputs[i * 3 + 1], outputs[i * 3 + 2]);
            }
            blendingFunctionName = 'additive3D';
        } else if (propName === 'rotation') {
            valueConstructor = ccm.math.Quat;
            values = new Array<ccm.math.Quat>(outputs.length / 4);
            for (let i = 0; i < values.length; ++i) {
                values[i] = new ccm.math.Quat(outputs[i * 4 + 0], outputs[i * 4 + 1], outputs[i * 4 + 2], outputs[i * 4 + 3]);
            }
            blendingFunctionName = 'additiveQuat';
        }

        curveData.props = curveData.props || {};
        const result: ccm.PropertyCurveData = {
            keys: iKeys, blending: blendingFunctionName, values,
        };
        switch (gltfSampler.interpolation) {
            case 'STEP':
                result.interpolate = false;
                if (span) {
                    result.values = this._split(result.values, span.from, span.to, (from) => from);
                }
                break;
            case 'CUBICSPLINE':
                if (valueConstructor) {
                    result.interpolate = true;
                    const cubicSplineValueConstructor = (valueConstructor === ccm.math.Vec3) ?
                        ccm.CubicSplineVec3Value : ccm.CubicSplineQuatValue;
                    const csValues = new Array(result.values.length / 3);
                    for (let i = 0; i < csValues.length; ++i) {
                        csValues[i] = new cubicSplineValueConstructor(
                            result.values[i * 3 + 0],
                            result.values[i * 3 + 1],
                            result.values[i * 3 + 2]
                        );
                    }
                    result.values = csValues;

                    if (span) {
                        console.error(`We currently do not support split animation with cubic-spline interpolation.`);
                    }
                }
                break;
            case 'LINEAR':
            default:
                result.interpolate = true;
                if (span) {
                    let lerpFx: undefined | ((from: any, to: any, ratio: number) => any);
                    switch (propName) {
                        case 'position':
                        case 'scale':
                            lerpFx = (from, to, ratio) => ccm.math.Vec3.lerp(new ccm.math.Vec3(), from, to, ratio);
                            break;
                        case 'rotation':
                            lerpFx = (from, to, ratio) => ccm.math.Quat.lerp(new ccm.math.Quat(), from, to, ratio);
                            break;
                        default:
                            lerpFx = (from) => from;
                    }
                    result.values = this._split(result.values, span.from, span.to, lerpFx);
                }
                break;
        }
        curveData.props[propName] = result;
    }

    private _split<T>(array: T[], from: number, to: number, lerp: (from: T, to: T, ratio: number) => T): T[] {
        let first: T | undefined;
        let iNext = 0;
        {
            const before = Math.trunc(from);
            const ratio = from - before;
            if (ratio === 0) {
                iNext = before;
            } else {
                const past = before + 1;
                first = lerp(array[before], array[past], ratio);
                iNext = past;
            }
        }

        let last: T | undefined;
        let iEnd = 0;
        {
            const before = Math.trunc(to);
            const ratio = to - before;
            if (ratio === 0) {
                iEnd = before;
            } else {
                const past = before + 1;
                last = lerp(array[before], array[past], ratio);
                iEnd = before;
            }
        }

        const result = array.slice(iNext, iEnd + 1);
        if (first) {
            result.unshift(first);
        }
        if (last) {
            result.push(last);
        }
        return result;
    }

    private _getParent(node: number) {
        return this._parents[node];
    }

    private _commonRoot(nodes: number[]) {
        let minPathLen = Infinity;
        const paths = nodes.map((node) => {
            const path: number[] = [];
            let curNode = node;
            while (curNode >= 0) {
                path.unshift(curNode);
                curNode = this._getParent(curNode);
            }
            minPathLen = Math.min(minPathLen, path.length);
            return path;
        });
        if (paths.length === 0) {
            return -1;
        }

        const commonPath: number[] = [];
        for (let i = 0; i < minPathLen; ++i) {
            const n = paths[0][i];
            if (paths.every((path) => path[i] === n)) {
                commonPath.push(n);
            } else {
                break;
            }
        }

        if (commonPath.length === 0) {
            return -1;
        }
        return commonPath[commonPath.length - 1];
    }

    private _getSkinRoot(skin: number) {
        let result = this._skinRoots[skin];
        if (result < 0) {
            result = this._commonRoot(this._gltf.skins![skin].joints);
            if (result < 0) {
                throw new Error(`Non-conforming glTf: skin joints do not have a common root(they are not under same scene).`);
            }
        }
        return result;
    }

    private _checkTangentImportSetting(setting: TangentImportSetting, gltfPrimitive: glTF.MeshPrimitive) {
        const recalcNeeded = (setting === TangentImportSetting.recalculate) ||
            (setting === TangentImportSetting.require && !Reflect.has(gltfPrimitive.attributes, glTF.SemanticName.TANGENT));
        if (recalcNeeded && !Reflect.has(gltfPrimitive.attributes, glTF.SemanticName.TEXCOORD_0)) {
            console.warn(
                `Tangent caculation is needed but the mesh has no uv information, ` +
                `the tangent attribute will be excluded therefor.(in glTf file: ${this.url})`);
            return TangentImportSetting.exclude;
        } else {
            return setting;
        }
    }

    private _readPrimitiveVertices(
        gltfPrimitive: glTF.MeshPrimitive, minPosition: ccm.math.Vec3, maxPosition: ccm.math.Vec3,
        options: IMeshOptions, targetNode: ccm.Node | null, idxMap: number[]) {

        options.tangents = this._checkTangentImportSetting(options.tangents, gltfPrimitive);

        const attributeNames = Object.getOwnPropertyNames(gltfPrimitive.attributes);
        // 统计出所有需要导出的属性，并计算它们在顶点缓冲区中的偏移以及整个顶点缓冲区的容量。
        let vertexStride = 0;
        let vertexCount = 0;
        let recalcNormal = options.normals === NormalImportSetting.recalculate || options.normals === NormalImportSetting.require;
        let recalcTangent = options.tangents === TangentImportSetting.recalculate || options.tangents === TangentImportSetting.require;
        const exportingAttributes: Array<{
            name: string;
            byteLength: number;
        }> = [];
        for (const attributeName of attributeNames) {
            if (attributeName === 'NORMAL') {
                if (options.normals === NormalImportSetting.exclude ||
                    options.normals === NormalImportSetting.recalculate) {
                    continue;
                } else if (options.normals === NormalImportSetting.require) {
                    recalcNormal = false;
                }
            } else if (attributeName === 'TANGENT') {
                if (options.tangents === TangentImportSetting.exclude ||
                    options.tangents === TangentImportSetting.recalculate) {
                    continue;
                } else if (options.tangents === TangentImportSetting.require) {
                    recalcTangent = false;
                }
            }
            const attributeAccessor = this._gltf.accessors![gltfPrimitive.attributes[attributeName]];
            const attributeByteLength = this._getBytesPerAttribute(attributeAccessor);
            vertexStride += attributeByteLength;
            // Validator: MESH_PRIMITIVE_UNEQUAL_ACCESSOR_COUNT
            vertexCount = attributeAccessor.count;
            exportingAttributes.push({
                name: attributeName,
                byteLength: attributeByteLength,
            });
        }

        let normalOffset = -1;
        if (recalcNormal) {
            normalOffset = vertexStride;
            vertexStride += 4 * 3;
        }

        let tangentOffset = -1;
        if (recalcTangent) {
            tangentOffset = vertexStride;
            vertexStride += 4 * 4;
        }

        // 创建顶点缓冲区。
        const vertexBuffer = new ArrayBuffer(vertexStride * vertexCount);

        // 写入属性。
        let currentByteOffset = 0;
        let posBuffer = new ArrayBuffer(0);
        let posBufferAlign = 0;
        const formats: ccm.IGFXAttribute[] = [];
        const v3_1 = new ccm.math.Vec3();
        const m4_1 = new ccm.math.Mat4();
        for (const exportingAttribute of exportingAttributes) {
            const attributeName = exportingAttribute.name;
            const attributeAccessor = this._gltf.accessors![gltfPrimitive.attributes[attributeName]];
            const dataView = new DataView(vertexBuffer, currentByteOffset);
            this._readAccessor(attributeAccessor, dataView, vertexStride);
            currentByteOffset += exportingAttribute.byteLength;

            if (attributeName === glTF.SemanticName.POSITION) {
                if (attributeAccessor.min) {
                    v3_1.x = Math.fround(attributeAccessor.min[0]);
                    v3_1.y = Math.fround(attributeAccessor.min[1]);
                    v3_1.z = Math.fround(attributeAccessor.min[2]);
                    ccm.math.Vec3.min(minPosition, minPosition, v3_1);
                }
                if (attributeAccessor.max) {
                    v3_1.x = Math.fround(attributeAccessor.max[0]);
                    v3_1.y = Math.fround(attributeAccessor.max[1]);
                    v3_1.z = Math.fround(attributeAccessor.max[2]);
                    ccm.math.Vec3.max(maxPosition, maxPosition, v3_1);
                }

                const comps = this._getComponentsPerAttribute(attributeAccessor.type);
                const bytes = this._getBytesPerComponent(attributeAccessor.componentType);
                posBuffer = new ArrayBuffer(comps * bytes * attributeAccessor.count);
                posBufferAlign = bytes;
                this._readAccessor(attributeAccessor, new DataView(posBuffer));
            }

            if (targetNode) {
                // pre-apply local transform to mesh
                if (attributeName === glTF.SemanticName.POSITION) {
                    const reader = this._getComponentReader(attributeAccessor.componentType);
                    const writer = this._getComponentWriter(attributeAccessor.componentType);
                    ccm.math.Mat4.fromRTS(m4_1, targetNode._lrot, targetNode._lpos, targetNode._lscale);
                    const comps = this._getComponentsPerAttribute(attributeAccessor.type);
                    const bytes = this._getBytesPerComponent(attributeAccessor.componentType);
                    const posBufferView = new DataView(posBuffer);
                    const posBufferStride = comps * bytes;
                    for (let iVert = 0; iVert < vertexCount; ++iVert) {
                        v3_1.x = reader(dataView, vertexStride * iVert);
                        v3_1.y = reader(dataView, vertexStride * iVert + bytes);
                        v3_1.z = reader(dataView, vertexStride * iVert + bytes * 2);
                        ccm.math.Vec3.transformMat4(v3_1, v3_1, m4_1);
                        writer(dataView, vertexStride * iVert, v3_1.x);
                        writer(dataView, vertexStride * iVert + bytes, v3_1.y);
                        writer(dataView, vertexStride * iVert + bytes * 2, v3_1.z);
                        writer(posBufferView, posBufferStride * iVert, v3_1.x);
                        writer(posBufferView, posBufferStride * iVert + bytes, v3_1.y);
                        writer(posBufferView, posBufferStride * iVert + bytes * 2, v3_1.z);
                    }
                    if (attributeAccessor.min || attributeAccessor.max) {
                        const aabb = ccm.geometry.aabb.fromPoints(ccm.geometry.aabb.create(), minPosition, maxPosition);
                        aabb.transform(m4_1, targetNode._lpos, targetNode._lrot, targetNode._lscale, aabb);
                        aabb.getBoundary(minPosition, maxPosition);
                    }
                }
                if (attributeName === glTF.SemanticName.NORMAL || attributeName === glTF.SemanticName.TANGENT) {
                    const reader = this._getComponentReader(attributeAccessor.componentType);
                    const writer = this._getComponentWriter(attributeAccessor.componentType);
                    for (let iVert = 0; iVert < vertexCount; ++iVert) {
                        v3_1.x = reader(dataView, vertexStride * iVert);
                        v3_1.y = reader(dataView, vertexStride * iVert + 4);
                        v3_1.z = reader(dataView, vertexStride * iVert + 8);
                        ccm.math.Vec3.transformQuat(v3_1, v3_1, targetNode._lrot);
                        writer(dataView, vertexStride * iVert, v3_1.x);
                        writer(dataView, vertexStride * iVert + 4, v3_1.y);
                        writer(dataView, vertexStride * iVert + 8, v3_1.z);
                    }
                }
                // normalize weights
                if (attributeName.startsWith('WEIGHTS')) {
                    const ws = new Array<number>(4);
                    const reader = this._getComponentReader(attributeAccessor.componentType);
                    const writer = this._getComponentWriter(attributeAccessor.componentType);
                    for (let iVert = 0; iVert < vertexCount; ++iVert) {
                        let sum = 0.0;
                        for (let iw = 0; iw < 4; ++iw) {
                            const w = reader(dataView, vertexStride * iVert + iw * 4);
                            ws[iw] = w;
                            sum += w;
                        }
                        if (sum !== 1.0 && sum !== 0.0) {
                            for (let iw = 0; iw < 4; ++iw) {
                                const normalizedWeight = ws[iw] / sum;
                                writer(dataView, vertexStride * iVert + iw * 4, normalizedWeight);
                            }
                        }
                    }
                }
                /* [Optimization.1b] map joint indices to match the sorted joints array *
                if (attributeName.startsWith('JOINTS')) {
                    const reader = this._getComponentReader(attributeAccessor.componentType);
                    const writer = this._getComponentWriter(attributeAccessor.componentType);
                    for (let iVert = 0; iVert < vertexCount; ++iVert) {
                        for (let iw = 0; iw < 4; ++iw) {
                            const w = reader(dataView, vertexStride * iVert + iw * 4);
                            writer(dataView, vertexStride * iVert + iw * 4, idxMap[w]);
                        }
                    }
                }
                /* */
            }

            formats.push({
                name: this._getGfxAttributeName(attributeName),
                format: this._getAttributeFormat(attributeAccessor.componentType, attributeAccessor.type),
                isNormalized: attributeAccessor.normalized || false,
            });
        }

        const appendVertexStreamF = (semantic: IGltfSemantic, offset: number, data: Float32Array) => {
            const nComponent = this._getComponentsPerAttribute(semantic.type);
            const dataView = new DataView(vertexBuffer, offset);
            for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
                for (let i = 0; i < nComponent; ++i) {
                    const v = data[iVertex * nComponent + i];
                    dataView.setFloat32(iVertex * vertexStride + i * 4, v, ccUseLittleEndian);
                }
            }
            formats.push({
                name: this._getGfxAttributeName(semantic.name),
                format: this._getAttributeFormat(glTF.AccessorComponentType.FLOAT, semantic.type),
                isNormalized: false,
            });
        };

        let primitiveViewer: IPrimitiveViewer | undefined;
        const getPrimitiveViewer = () => {
            if (primitiveViewer === undefined) {
                primitiveViewer = this._makePrimitiveViewer(gltfPrimitive);
            }
            return primitiveViewer;
        };

        let normals: Float32Array | undefined;
        if (normalOffset >= 0) {
            normals = calculateNormals(getPrimitiveViewer());
            appendVertexStreamF(GltfSemantics.normal, normalOffset, normals);
            // consistency test
            // if (Reflect.has(gltfPrimitive.attributes, glTF.SemanticName.NORMAL)) {
            //     const embeddedNormalAccessor = this._gltf.accessors![gltfPrimitive.attributes[glTF.SemanticName.NORMAL]];
            //     const embeddedNormals = this._readAccessorIntoArray(embeddedNormalAccessor);
            //     // return embeddedNormals as Float32Array;
            //     for (let i = 0; i < Math.min(normals.length, embeddedNormals.length); ++i) {
            //         if (embeddedNormals[i] !== normals[i]) {
            //             const an = normals[i];
            //             const bn = embeddedNormals[i];
            //             if (Math.abs(an - bn) > 0.01) {
            //                 // debugger;
            //             }
            //         }
            //     }
            // }
        }

        if (tangentOffset >= 0) {
            const tangents = calculateTangents(getPrimitiveViewer(), normals);
            appendVertexStreamF(GltfSemantics.tangent, tangentOffset, tangents);
        }

        return {
            vertexBuffer,
            vertexCount,
            vertexStride,
            formats,
            posBuffer,
            posBufferAlign,
        };
    }

    private async _readImageByFsPath(imagePath: string, glTFHost: GLTFHost) {
        try {
            const dot = imagePath.lastIndexOf('.');
            return {
                imageData: new DataView(await glTFHost.readBuffer(imagePath)),
                extName: dot >= 0 ? imagePath.substr(dot + 1) : '',
            };
        } catch (error) {
            console.warn(`Failed to load texture with path: ${imagePath}`);
            return undefined;
        }
    }

    private _makePrimitiveViewer(gltfPrimitive: glTF.MeshPrimitive): IPrimitiveViewer {
        const primitiveMode = gltfPrimitive.mode === undefined ? glTF.PrimitiveMode.__DEFAULT : gltfPrimitive.mode;
        if (primitiveMode !== glTF.PrimitiveMode.TRIANGLES) {
            throw new Error(`Normals calculation needs triangle primitive.`);
        }

        let vertexCount = 0;
        const attributeNames = Object.keys(gltfPrimitive.attributes);
        if (attributeNames.length !== 0) {
            vertexCount = this._gltf.accessors![gltfPrimitive.attributes[attributeNames[0]]].count;
        }

        let faces: AccessorStorage;
        if (gltfPrimitive.indices === undefined) {
            faces = new Float32Array(vertexCount);
            for (let i = 0; i < faces.length; ++i) {
                faces[i] = i;
            }
        } else {
            const indicesAccessor = this._gltf.accessors![gltfPrimitive.indices];
            faces = this._readAccessorIntoArray(indicesAccessor);
        }
        const nFaces = Math.floor(faces.length / 3);

        const cachedAttributes = new Map<string, AccessorStorage>();
        const getAttributes = (name: string) => {
            let result = cachedAttributes.get(name);
            if (result === undefined) {
                if (!Reflect.has(gltfPrimitive.attributes, name)) {
                    throw new Error(`Tangent calculation needs ${name}.`);
                }
                result = this._readAccessorIntoArray(this._gltf.accessors![gltfPrimitive.attributes[name]]);
                cachedAttributes.set(name, result);
            }
            return result;
        };

        const getVertexCount = () => vertexCount;
        const getFaces = () => faces;
        const getFaceCount = () => nFaces;
        const getPositions = () => {
            return getAttributes(glTF.SemanticName.POSITION) as Float32Array;
        };
        const getNormals = () => {
            return getAttributes(glTF.SemanticName.NORMAL) as Float32Array;
        };
        const getUVs = () => {
            return getAttributes(glTF.SemanticName.TEXCOORD_0);
        };

        return {
            getVertexCount,
            getPositions,
            getFaces,
            getFaceCount,
            getNormals,
            getUVs,
        };
    }

    private _readAccessorIntoArray(gltfAccessor: glTF.Accessor) {
        const storageConstructor = this._getAttributeBaseTypeStorage(gltfAccessor.componentType);
        const result = new storageConstructor(gltfAccessor.count * this._getComponentsPerAttribute(gltfAccessor.type));
        this._readAccessor(gltfAccessor, createDataViewFromTypedArray(result));
        return result;
    }

    private _readImageByDataUri(dataUri: string) {
        const result = imageDataUri.decode(dataUri);
        if (!result) {
            return undefined;
        }
        const x = result.imageType.split('/');
        if (x.length === 0) {
            console.error(`Bad data uri.${dataUri}`);
            return undefined;
        }
        return {
            extName: `.${x[x.length - 1]}`,
            imageData: new DataView(result.dataBuffer.buffer, result.dataBuffer.byteOffset, result.dataBuffer.byteLength),
        };
    }

    private _readImageInBufferview(bufferView: glTF.BufferView, mimeType: string | undefined) {
        let extName = '';
        switch (mimeType) {
            case 'image/jpeg':
                extName = '.jpg';
                break;
            case 'image/png':
                extName = '.png';
                break;
            default:
                throw new Error(`Bad MIME Type ${mimeType}`);
        }

        const buffer = this._buffers[bufferView.buffer];
        const imageData = new DataView(
            buffer.buffer, buffer.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
        return {
            extName,
            imageData,
        };
    }

    private _getSceneNode(iGltfScene: number, gltfAssetFinder: AssetFinder, withTransform = true) {
        const sceneName = this._getGltfXXName(GltfAssetKind.Scene, iGltfScene);
        const result = new ccm.Node(sceneName);
        const gltfScene = this._gltf.scenes![iGltfScene];
        if (gltfScene.nodes !== undefined) {
            const mapping: Array<ccm.Node | null> = new Array(this._gltf.nodes!.length).fill(null);
            for (const node of gltfScene.nodes) {
                const root = this._createEmptyNodeRecursive(node, mapping, withTransform);
                root.parent = result;
            }
            mapping.forEach((node, iGltfNode) => {
                this._setupNode(iGltfNode, mapping, gltfAssetFinder);
            });
            // update skinning root to animation root node
            result.getComponentsInChildren(ccm.SkinningModelComponent).forEach((comp) => comp._skinningRoot = result);
        }
        return result;
    }

    private _createEmptyNodeRecursive(iGltfNode: number, mapping: Array<ccm.Node | null>, withTransform = true): ccm.Node {
        const gltfNode = this._gltf.nodes![iGltfNode];
        const result = this._createEmptyNode(iGltfNode, withTransform);
        if (gltfNode.children !== undefined) {
            for (const child of gltfNode.children) {
                const childResult = this._createEmptyNodeRecursive(child, mapping, withTransform);
                childResult.parent = result;
            }
        }
        mapping[iGltfNode] = result;
        return result;
    }

    private _setupNode(iGltfNode: number, mapping: Array<ccm.Node | null>, gltfAssetFinder: AssetFinder) {
        const node = mapping[iGltfNode];
        if (node === null) {
            return;
        }
        const gltfNode = this._gltf.nodes![iGltfNode];
        if (gltfNode.mesh !== undefined) {
            let modelComponent: ccm.ModelComponent | null = null;
            if (gltfNode.skin === undefined) {
                modelComponent = node.addComponent(ccm.ModelComponent);
            } else {
                const skinningModelComponent = node.addComponent(ccm.SkinningModelComponent);
                const skeleton = gltfAssetFinder.find(AssetFinderKind.skeleton, gltfNode.skin);
                if (skeleton) {
                    skinningModelComponent._skeleton = skeleton;
                }
                const skinRoot = mapping[this._getSkinRoot(gltfNode.skin)];
                if (skinRoot === null) {
                    console.error(`glTf requires that skin joints must exists in same scene as node references it.`);
                } else {
                    // assign a temporary root
                    skinningModelComponent._skinningRoot = skinRoot;
                }
                modelComponent = skinningModelComponent;
            }
            const mesh = gltfAssetFinder.find(AssetFinderKind.mesh, gltfNode.mesh);
            if (mesh) {
                modelComponent._mesh = mesh;
            }
            const gltfMesh = this.gltf.meshes![gltfNode.mesh];
            const materials = gltfMesh.primitives.map((gltfPrimitive) => {
                if (gltfPrimitive.material === undefined) {
                    return null;
                } else {
                    const material = gltfAssetFinder.find(AssetFinderKind.material, gltfPrimitive.material);
                    if (material) {
                        return material;
                    }
                }
                return null;
            });
            modelComponent._materials = materials;
        }
    }

    private _createEmptyNode(iGltfNode: number, withTransform = true) {
        const gltfNode = this._gltf.nodes![iGltfNode];
        const nodeName = this._getGltfXXName(GltfAssetKind.Node, iGltfNode);

        const node = new ccm.Node(nodeName);
        if (!withTransform) { return node; }

        if (gltfNode.translation) {
            node.setPosition(
                gltfNode.translation[0],
                gltfNode.translation[1],
                gltfNode.translation[2]
            );
        }
        if (gltfNode.rotation) {
            node.setRotation(this._getNodeRotation(gltfNode.rotation, new ccm.math.Quat()));
        }
        if (gltfNode.scale) {
            node.setScale(
                gltfNode.scale[0],
                gltfNode.scale[1],
                gltfNode.scale[2]
            );
        }
        if (gltfNode.matrix) {
            const ns = gltfNode.matrix;
            const m = this._readNodeMatrix(ns);
            const t = new ccm.math.Vec3();
            const r = new ccm.math.Quat();
            const s = new ccm.math.Vec3();
            ccm.math.Mat4.toRTS(m, r, t, s);
            node.setPosition(t);
            node.setRotation(r);
            node.setScale(s);
        }
        return node;
    }

    private _readNodeMatrix(ns: number[]) {
        return new ccm.math.Mat4(
            ns[0], ns[1], ns[2], ns[3],
            ns[4], ns[5], ns[6], ns[7],
            ns[8], ns[9], ns[10], ns[11],
            ns[12], ns[13], ns[14], ns[15]);
    }

    private _getNodePath(node: number) {
        if (this._nodePathTable == null) {
            this._nodePathTable = this._createNodePathTable();
        }
        return this._nodePathTable[node];
    }

    private _createNodePathTable() {
        if (this._gltf.nodes === undefined) {
            return [];
        }

        const parentTable = new Array<number>(this._gltf.nodes.length).fill(-1);
        this._gltf.nodes.forEach((gltfNode, nodeIndex) => {
            if (gltfNode.children) {
                gltfNode.children.forEach((iChildNode) => {
                    parentTable[iChildNode] = nodeIndex;
                });
                const names = gltfNode.children.map((iChildNode) => {
                    const childNode = this._gltf.nodes![iChildNode];
                    let name = childNode.name;
                    if (typeof name !== 'string' || name.length === 0) {
                        name =  null;
                    }
                    return name;
                });
                const uniqueNames = makeUniqueNames(names, uniqueChildNodeNameGenerator);
                uniqueNames.forEach((uniqueName, iUniqueName) => {
                    this._gltf.nodes![gltfNode.children![iUniqueName]].name = uniqueName;
                });
            }
        });

        const nodeNames = new Array<string>(this._gltf.nodes.length).fill('');
        for (let iNode = 0; iNode < nodeNames.length; ++iNode) {
            nodeNames[iNode] = this._getGltfXXName(GltfAssetKind.Node, iNode);
        }

        const result = new Array<string>(this._gltf.nodes.length).fill('');
        this._gltf.nodes.forEach((gltfNode, nodeIndex) => {
            const segments: string[] = [];
            for (let i = nodeIndex; i >= 0; i = parentTable[i]) {
                segments.unshift(nodeNames[i]);
            }
            result[nodeIndex] = segments.join('/');
        });

        return result;
    }

    private _readAccessor(gltfAccessor: glTF.Accessor, outputBuffer: DataView, outputStride = 0) {
        if (gltfAccessor.bufferView === undefined) {
            console.warn(`Note, there is an accessor assiociating with no buffer view in file ${this.url}.`);
            return;
        }

        const gltfBufferView = this._gltf.bufferViews![gltfAccessor.bufferView];

        const componentsPerAttribute = this._getComponentsPerAttribute(gltfAccessor.type);
        const bytesPerElement = this._getBytesPerComponent(gltfAccessor.componentType);

        if (outputStride === 0) {
            outputStride = componentsPerAttribute * bytesPerElement;
        }

        const inputStartOffset =
            (gltfAccessor.byteOffset !== undefined ? gltfAccessor.byteOffset : 0) +
            (gltfBufferView.byteOffset !== undefined ? gltfBufferView.byteOffset : 0);

        const inputBuffer = createDataViewFromBuffer(this._buffers[gltfBufferView.buffer], inputStartOffset);

        const inputStride = gltfBufferView.byteStride !== undefined ?
            gltfBufferView.byteStride : componentsPerAttribute * bytesPerElement;

        const componentReader = this._getComponentReader(gltfAccessor.componentType);
        const componentWriter = this._getComponentWriter(gltfAccessor.componentType);

        for (let iAttribute = 0; iAttribute < gltfAccessor.count; ++iAttribute) {
            const i = createDataViewFromTypedArray(inputBuffer, inputStride * iAttribute);
            const o = createDataViewFromTypedArray(outputBuffer, outputStride * iAttribute);
            for (let iComponent = 0; iComponent < componentsPerAttribute; ++iComponent) {
                const componentBytesOffset = bytesPerElement * iComponent;
                const value = componentReader(i, componentBytesOffset);
                componentWriter(o, componentBytesOffset, value);
            }
        }
    }

    private _getPrimitiveMode(mode: number | undefined) {
        if (mode === undefined) {
            mode = glTF.PrimitiveMode.__DEFAULT;
        }
        switch (mode) {
            case glTF.PrimitiveMode.POINTS: return ccm.GFXPrimitiveMode.POINT_LIST;
            case glTF.PrimitiveMode.LINES: return ccm.GFXPrimitiveMode.LINE_LIST;
            case glTF.PrimitiveMode.LINE_LOOP: return ccm.GFXPrimitiveMode.LINE_LOOP;
            case glTF.PrimitiveMode.LINE_STRIP: return ccm.GFXPrimitiveMode.LINE_STRIP;
            case glTF.PrimitiveMode.TRIANGLES: return ccm.GFXPrimitiveMode.TRIANGLE_LIST;
            case glTF.PrimitiveMode.TRIANGLE_STRIP: return ccm.GFXPrimitiveMode.TRIANGLE_STRIP;
            case glTF.PrimitiveMode.TRIANGLE_FAN: return ccm.GFXPrimitiveMode.TRIANGLE_FAN;
            default:
                throw new Error(`Unrecognized primitive mode: ${mode}.`);
        }
    }

    private _getAttributeFormat(componentType: number, type: string) {
        switch (componentType) {
            case glTF.AccessorComponentType.BYTE: {
                switch (type) {
                    case glTF.AccessorType.SCALAR: return ccm.GFXFormat.R8SN;
                    case glTF.AccessorType.VEC2: return ccm.GFXFormat.RG8SN;
                    case glTF.AccessorType.VEC3: return ccm.GFXFormat.RGB8SN;
                    case glTF.AccessorType.VEC4: return ccm.GFXFormat.RGBA8SN;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case glTF.AccessorComponentType.UNSIGNED_BYTE: {
                switch (type) {
                    case glTF.AccessorType.SCALAR: return ccm.GFXFormat.R8;
                    case glTF.AccessorType.VEC2: return ccm.GFXFormat.RG8;
                    case glTF.AccessorType.VEC3: return ccm.GFXFormat.RGB8;
                    case glTF.AccessorType.VEC4: return ccm.GFXFormat.RGBA8;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case glTF.AccessorComponentType.SHORT: {
                switch (type) {
                    case glTF.AccessorType.SCALAR: return ccm.GFXFormat.R16I;
                    case glTF.AccessorType.VEC2: return ccm.GFXFormat.RG16I;
                    case glTF.AccessorType.VEC3: return ccm.GFXFormat.RGB16I;
                    case glTF.AccessorType.VEC4: return ccm.GFXFormat.RGBA16I;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case glTF.AccessorComponentType.UNSIGNED_SHORT: {
                switch (type) {
                    case glTF.AccessorType.SCALAR: return ccm.GFXFormat.R16UI;
                    case glTF.AccessorType.VEC2: return ccm.GFXFormat.RG16UI;
                    case glTF.AccessorType.VEC3: return ccm.GFXFormat.RGB16UI;
                    case glTF.AccessorType.VEC4: return ccm.GFXFormat.RGBA16UI;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case glTF.AccessorComponentType.UNSIGNED_INT: {
                switch (type) {
                    case glTF.AccessorType.SCALAR: return ccm.GFXFormat.R32UI;
                    case glTF.AccessorType.VEC2: return ccm.GFXFormat.RG32UI;
                    case glTF.AccessorType.VEC3: return ccm.GFXFormat.RGB32UI;
                    case glTF.AccessorType.VEC4: return ccm.GFXFormat.RGBA32UI;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case glTF.AccessorComponentType.FLOAT: {
                switch (type) {
                    case glTF.AccessorType.SCALAR: return ccm.GFXFormat.R32F;
                    case glTF.AccessorType.VEC2: return ccm.GFXFormat.RG32F;
                    case glTF.AccessorType.VEC3: return ccm.GFXFormat.RGB32F;
                    case glTF.AccessorType.VEC4: return ccm.GFXFormat.RGBA32F;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            default: throw new Error(`Unrecognized component type: ${componentType}.`);
        }
    }

    private _getAttributeBaseTypeStorage(componentType: number): AccessorStorageConstructor {
        switch (componentType) {
            case glTF.AccessorComponentType.BYTE: return Int8Array;
            case glTF.AccessorComponentType.UNSIGNED_BYTE: return Uint8Array;
            case glTF.AccessorComponentType.SHORT: return Int16Array;
            case glTF.AccessorComponentType.UNSIGNED_SHORT: return Uint16Array;
            case glTF.AccessorComponentType.UNSIGNED_INT: return Uint32Array;
            case glTF.AccessorComponentType.FLOAT: return Float32Array;
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }

    private _getIndexStride(componentType: number) {
        switch (componentType) {
            case glTF.AccessorComponentType.UNSIGNED_BYTE: return 1;
            case glTF.AccessorComponentType.UNSIGNED_SHORT: return 2;
            case glTF.AccessorComponentType.UNSIGNED_INT: return 4;
            default:
                throw new Error(`Unrecognized index type: ${componentType}`);
        }
    }

    private _getBytesPerAttribute(gltfAccessor: glTF.Accessor) {
        return this._getBytesPerComponent(gltfAccessor.componentType) *
            this._getComponentsPerAttribute(gltfAccessor.type);
    }

    private _getComponentsPerAttribute(type: string) {
        switch (type) {
            case glTF.AccessorType.SCALAR: return 1;
            case glTF.AccessorType.VEC2: return 2;
            case glTF.AccessorType.VEC3: return 3;
            case glTF.AccessorType.VEC4: case glTF.AccessorType.MAT2: return 4;
            case glTF.AccessorType.MAT3: return 9;
            case glTF.AccessorType.MAT4: return 16;
            default:
                throw new Error(`Unrecognized attribute type: ${type}.`);
        }
    }

    private _getBytesPerComponent(componentType: number) {
        switch (componentType) {
            case glTF.AccessorComponentType.BYTE: case glTF.AccessorComponentType.UNSIGNED_BYTE: return 1;
            case glTF.AccessorComponentType.SHORT: case glTF.AccessorComponentType.UNSIGNED_SHORT: return 2;
            case glTF.AccessorComponentType.UNSIGNED_INT: case glTF.AccessorComponentType.FLOAT: return 4;
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }

    private _getGfxAttributeName(name: string) {
        switch (name) {
            case glTF.SemanticName.POSITION: return ccm.GFXAttributeName.ATTR_POSITION;
            case glTF.SemanticName.NORMAL: return ccm.GFXAttributeName.ATTR_NORMAL;
            case glTF.SemanticName.TANGENT: return ccm.GFXAttributeName.ATTR_TANGENT;
            case glTF.SemanticName.COLOR_0: return ccm.GFXAttributeName.ATTR_COLOR;
            case glTF.SemanticName.TEXCOORD_0: return ccm.GFXAttributeName.ATTR_TEX_COORD;
            case glTF.SemanticName.TEXCOORD_1: return ccm.GFXAttributeName.ATTR_TEX_COORD1;
            case 'TEXCOORD_2': return ccm.GFXAttributeName.ATTR_TEX_COORD2;
            case 'TEXCOORD_3': return ccm.GFXAttributeName.ATTR_TEX_COORD3;
            case glTF.SemanticName.JOINTS_0: return ccm.GFXAttributeName.ATTR_JOINTS;
            case glTF.SemanticName.WEIGHTS_0: return ccm.GFXAttributeName.ATTR_WEIGHTS;
            default:
                throw new Error(`Unrecognized attribute type: ${name}`);
        }
    }

    private _getComponentReader(componentType: number): (buffer: DataView, offset: number) => number {
        switch (componentType) {
            case glTF.AccessorComponentType.BYTE: return (buffer, offset) => buffer.getInt8(offset);
            case glTF.AccessorComponentType.UNSIGNED_BYTE: return (buffer, offset) => buffer.getUint8(offset);
            case glTF.AccessorComponentType.SHORT: return (buffer, offset) => buffer.getInt16(offset, ccUseLittleEndian);
            case glTF.AccessorComponentType.UNSIGNED_SHORT: return (buffer, offset) => buffer.getUint16(offset, ccUseLittleEndian);
            case glTF.AccessorComponentType.UNSIGNED_INT: return (buffer, offset) => buffer.getUint32(offset, ccUseLittleEndian);
            case glTF.AccessorComponentType.FLOAT: return (buffer, offset) => buffer.getFloat32(offset, ccUseLittleEndian);
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }

    private _getComponentWriter(componentType: number): (buffer: DataView, offset: number, value: number) => void {
        switch (componentType) {
            case glTF.AccessorComponentType.BYTE: return (buffer, offset, value) => buffer.setInt8(offset, value);
            case glTF.AccessorComponentType.UNSIGNED_BYTE: return (buffer, offset, value) => buffer.setUint8(offset, value);
            case glTF.AccessorComponentType.SHORT: return (buffer, offset, value) => buffer.setInt16(offset, value, ccUseLittleEndian);
            case glTF.AccessorComponentType.UNSIGNED_SHORT: return (buffer, offset, value) => buffer.setUint16(offset, value, ccUseLittleEndian);
            case glTF.AccessorComponentType.UNSIGNED_INT: return (buffer, offset, value) => buffer.setUint32(offset, value, ccUseLittleEndian);
            case glTF.AccessorComponentType.FLOAT: return (buffer, offset, value) => buffer.setFloat32(offset, value, ccUseLittleEndian);
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }

    private _getGltfXXName(assetKind: GltfAssetKind, index: number) {
        const assetsArrayName: {
            [x: number]: string
        } = {
            [GltfAssetKind.Animation]: 'animations',
            [GltfAssetKind.Image]: 'images',
            [GltfAssetKind.Material]: 'materials',
            [GltfAssetKind.Node]: 'nodes',
            [GltfAssetKind.Skin]: 'skins',
            [GltfAssetKind.Texture]: 'textures',
            [GltfAssetKind.Scene]: 'scenes',
        };

        const assets = this._gltf[assetsArrayName[assetKind]];
        if (!assets) {
            return '';
        }
        const asset = assets[index];
        if ((typeof asset.name) === 'string') {
            return asset.name;
        } else {
            return `${GltfAssetKind[assetKind]}-${index}`;
        }
    }
}

function calculateNormals(gltfPrimitiveViewer: IPrimitiveViewer): Float32Array {
    const vertexCount = gltfPrimitiveViewer.getVertexCount();
    const positions = gltfPrimitiveViewer.getPositions();
    const indices = gltfPrimitiveViewer.getFaces();
    const nFaces = gltfPrimitiveViewer.getFaceCount();
    const normals = new Float32Array(3 * vertexCount);
    const a = new ccm.math.Vec3();
    const b = new ccm.math.Vec3();
    const c = new ccm.math.Vec3();
    const u = new ccm.math.Vec3();
    const v = new ccm.math.Vec3();
    const n = new ccm.math.Vec3();
    const getPosition = (iVertex: number, out: ccm.math.Vec3) => {
        ccm.math.Vec3.set(out, positions[iVertex * 3 + 0], positions[iVertex * 3 + 1], positions[iVertex * 3 + 2]);
    };
    const addFaceNormal = (iVertex: number, normal: ccm.math.Vec3) => {
        normals[iVertex * 3 + 0] += normal.x;
        normals[iVertex * 3 + 1] += normal.y;
        normals[iVertex * 3 + 2] += normal.z;
    };
    for (let iFace = 0; iFace < nFaces; ++iFace) {
        const ia = indices[iFace * 3 + 0];
        const ib = indices[iFace * 3 + 1];
        const ic = indices[iFace * 3 + 2];
        getPosition(ia, a);
        getPosition(ib, b);
        getPosition(ic, c);

        // Calculate normal of triangle [a, b, c].
        ccm.math.Vec3.subtract(u, b, a);
        ccm.math.Vec3.subtract(v, c, a);
        ccm.math.Vec3.cross(n, u, v);

        addFaceNormal(ia, n);
        addFaceNormal(ib, n);
        addFaceNormal(ic, n);
    }
    for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {
        ccm.math.Vec3.set(n, normals[iVertex * 3 + 0], normals[iVertex * 3 + 1], normals[iVertex * 3 + 2]);
        ccm.math.Vec3.normalize(n, n);
        normals[iVertex * 3 + 0] = n.x; // -n.x;
        normals[iVertex * 3 + 1] = n.y; //  n.z;
        normals[iVertex * 3 + 2] = n.z; // -n.y;
    }

    return normals;
}

function calculateTangents(gltfPrimitiveViewer: IPrimitiveViewer, overrideNormals?: Float32Array): Float32Array {
    /// http://www.terathon.com/code/tangent.html
    const vertexCount = gltfPrimitiveViewer.getVertexCount();
    const positions = gltfPrimitiveViewer.getPositions();
    const indices = gltfPrimitiveViewer.getFaces();
    const nFaces = gltfPrimitiveViewer.getFaceCount();
    const normals = overrideNormals ? overrideNormals : gltfPrimitiveViewer.getNormals();
    const uvs = gltfPrimitiveViewer.getUVs();
    const tangents = new Float32Array(4 * vertexCount);
    const tan1 = new Float32Array(3 * vertexCount);
    const tan2 = new Float32Array(3 * vertexCount);
    const v0 = new ccm.math.Vec3();
    const v1 = new ccm.math.Vec3();
    const v2 = new ccm.math.Vec3();
    const uv0 = new ccm.math.Vec2();
    const uv1 = new ccm.math.Vec2();
    const uv2 = new ccm.math.Vec2();
    const sdir = new ccm.math.Vec3();
    const tdir = new ccm.math.Vec3();
    const n = new ccm.math.Vec3();
    const t = new ccm.math.Vec3();
    const getPosition = (iVertex: number, out: ccm.math.Vec3) => {
        ccm.math.Vec3.set(out, positions[iVertex * 3 + 0], positions[iVertex * 3 + 1], positions[iVertex * 3 + 2]);
    };
    const getUV = (iVertex: number, out: ccm.math.Vec2) => {
        ccm.math.Vec2.set(out, uvs[iVertex * 2 + 0], uvs[iVertex * 2 + 1]);
    };
    const addTan = (tans: Float32Array, iVertex: number, val: ccm.math.Vec3) => {
        tans[iVertex * 3 + 0] += val.x;
        tans[iVertex * 3 + 1] += val.y;
        tans[iVertex * 3 + 2] += val.z;
    };
    for (let iFace = 0; iFace < nFaces; ++iFace) {
        const i0 = indices[iFace * 3 + 0];
        const i1 = indices[iFace * 3 + 1];
        const i2 = indices[iFace * 3 + 2];

        getPosition(i0, v0);
        getPosition(i1, v1);
        getPosition(i2, v2);

        getUV(i0, uv0);
        getUV(i1, uv1);
        getUV(i2, uv2);

        const x1 = v1.x - v0.x;
        const x2 = v2.x - v0.x;
        const y1 = v1.y - v0.y;
        const y2 = v2.y - v0.y;
        const z1 = v1.z - v0.z;
        const z2 = v2.z - v0.z;

        const s1 = uv1.x - uv0.x;
        const s2 = uv2.x - uv0.x;
        const t1 = uv1.y - uv0.y;
        const t2 = uv2.y - uv0.y;

        const div = (s1 * t2 - s2 * t1);
        if (div !== 0.0) {
            const r = 1.0 / div;
            ccm.math.Vec3.set(sdir,
                (t2 * x1 - t1 * x2) * r,
                (t2 * y1 - t1 * y2) * r,
                (t2 * z1 - t1 * z2) * r);
            ccm.math.Vec3.set(tdir,
                (s1 * x2 - s2 * x1) * r,
                (s1 * y2 - s2 * y1) * r,
                (s1 * z2 - s2 * z1) * r);
        } else {
            ccm.math.Vec3.set(sdir, 1.0, 0.0, 0.0);
            ccm.math.Vec3.set(tdir, 0.0, 1.0, 0.0);
        }

        addTan(tan1, i0, sdir);
        addTan(tan1, i1, sdir);
        addTan(tan1, i2, sdir);

        addTan(tan2, i0, tdir);
        addTan(tan2, i1, tdir);
        addTan(tan2, i2, tdir);
    }
    const tan2v = new ccm.math.Vec3();
    const vv = new ccm.math.Vec3();
    for (let iVertex = 0; iVertex < vertexCount; ++iVertex) {

        // Gram-Schmidt orthogonalize
        // tangent[a] = (t - n * Dot(n, t)).Normalize();
        // Calculate handedness
        // tangent[a].w = (Dot(Cross(n, t), tan2[a]) < 0.0F) ? -1.0F : 1.0F;

        ccm.math.Vec3.set(n, normals[iVertex * 3 + 0], normals[iVertex * 3 + 1], normals[iVertex * 3 + 2]);
        ccm.math.Vec3.set(t, tan1[iVertex * 3 + 0], tan1[iVertex * 3 + 1], tan1[iVertex * 3 + 2]);
        ccm.math.Vec3.set(tan2v, tan2[iVertex * 3 + 0], tan2[iVertex * 3 + 1], tan2[iVertex * 3 + 2]);

        ccm.math.Vec3.multiplyScalar(vv, n, ccm.math.Vec3.dot(n, t));
        ccm.math.Vec3.subtract(vv, t, vv);
        ccm.math.Vec3.normalize(vv, vv);

        tangents[4 * iVertex + 0] = vv.x;
        tangents[4 * iVertex + 1] = vv.y;
        tangents[4 * iVertex + 2] = vv.z;

        const sign = ccm.math.Vec3.dot(ccm.math.Vec3.cross(vv, n, t), tan2v) < 0 ? -1 : 1;
        tangents[4 * iVertex + 3] = sign;
    }

    return tangents;
}

export interface GLTFHost {
    readJSON: (uri: string) => Promise<any>;
    readBuffer: (uri: string) => Promise<ArrayBuffer>;
}

export async function readGltf(glTFFileUri: string, glTFHost: GLTFHost) {
    const path = URI.parse(glTFFileUri).path;
    return (path && path.endsWith('.glb')) ?
        await readGlb(glTFFileUri, glTFHost) :
        await readGltfJson(glTFFileUri, glTFHost);
}

async function readGltfJson(uri: string, glTFHost: GLTFHost) {
    const gltf = await glTFHost.readJSON(uri) as glTF.GlTf;
    let binaryBuffers: DataView[] = [];
    if (gltf.buffers) {
        binaryBuffers = await Promise.all(gltf.buffers.map((gltfBuffer) => {
            if (!gltfBuffer.uri) {
                return new DataView(new ArrayBuffer(0));
            }
            return readBufferData(uri, gltfBuffer.uri, glTFHost);
        }));
    }
    return { gltf, binaryBuffers };
}

async function readGlb(uri: string, glTFHost: GLTFHost) {
    const badGLBFormat = (): never => {
        throw new Error(`Bad glb format.`);
    };

    const glb = new DataView(await glTFHost.readBuffer(uri));
    if (glb.byteLength < 12) {
        return badGLBFormat();
    }

    const magic = glb.getUint32(0, glTFUseLittleEndian);
    if (magic !== 0x46546C67) {
        return badGLBFormat();
    }

    const ChunkTypeJson = 0x4E4F534A;
    const ChunkTypeBin = 0x004E4942;
    const version = glb.getUint32(4, glTFUseLittleEndian);
    const length = glb.getUint32(8, glTFUseLittleEndian);
    let gltf: glTF.GlTf | undefined;
    let embededBinaryBuffer: DataView | undefined;
    for (let iChunk = 0, offset = 12; (offset + 8) <= glb.byteLength; ++iChunk) {
        const chunkLength = glb.getUint32(offset, glTFUseLittleEndian);
        offset += 4;
        const chunkType = glb.getUint32(offset, glTFUseLittleEndian);
        offset += 4;
        if (offset + chunkLength > glb.byteLength) {
            return badGLBFormat();
        }
        const payload = new DataView(glb.buffer, offset, chunkLength);
        offset += chunkLength;
        if (iChunk === 0) {
            if (chunkType !== ChunkTypeJson) {
                return badGLBFormat();
            }
            const gltfJson = new TextDecoder('utf-8').decode(payload);
            gltf = JSON.parse(gltfJson) as glTF.GlTf;
        } else if (chunkType === ChunkTypeBin) {
            // TODO: Should we copy?
            // embededBinaryBuffer = payload.slice();
            embededBinaryBuffer = payload;
        }
    }

    if (!gltf) {
        return badGLBFormat();
    } else {
        let binaryBuffers: DataView[] = [];
        if (gltf.buffers) {
            binaryBuffers = await Promise.all(gltf.buffers.map((gltfBuffer, index) => {
                if (!gltfBuffer.uri) {
                    if (index === 0 && embededBinaryBuffer) {
                        return embededBinaryBuffer;
                    }
                    return new DataView(new ArrayBuffer(0));
                }
                return readBufferData(uri, gltfBuffer.uri, glTFHost);
            }));
        }
        return { gltf, binaryBuffers };
    }
}

export function isDataUri(uri: string) {
    return uri.startsWith('data:');
}

class BufferBlob {
    private _arrayBufferOrPaddings: Array<ArrayBuffer | number> = [];
    private _length = 0;

    public setNextAlignment(align: number) {
        if (align !== 0) {
            const remainder = this._length % align;
            if (remainder !== 0) {
                const padding = align - remainder;
                this._arrayBufferOrPaddings.push(padding);
                this._length += padding;
            }
        }
    }

    public addBuffer(arrayBuffer: ArrayBuffer) {
        const result = this._length;
        this._arrayBufferOrPaddings.push(arrayBuffer);
        this._length += arrayBuffer.byteLength;
        return result;
    }

    public getLength() {
        return this._length;
    }

    public getCombined() {
        const result = new Uint8Array(this._length);
        let counter = 0;
        this._arrayBufferOrPaddings.forEach((arrayBufferOrPadding) => {
            if (typeof arrayBufferOrPadding === 'number') {
                counter += arrayBufferOrPadding;
            } else {
                result.set(new Uint8Array(arrayBufferOrPadding), counter);
                counter += arrayBufferOrPadding.byteLength;
            }
        });
        return result;
    }
}

async function readBufferData(glTFFileURI: string, uri: string, glTFHost: GLTFHost): Promise<DataView> {
    if (!uri.startsWith('data:')) {
        const bufferURI = resolveGLTFUri(glTFFileURI, uri);
        return new DataView(await glTFHost.readBuffer(bufferURI));
    } else {
        const dataUrl = parseDataUrl(uri);
        if (!dataUrl) {
            throw new Error(`Bad data uri.${uri}`);
        }
        return new DataView(dataUrl.toBuffer().buffer);
    }
}

export function resolveGLTFUri(glTFFileURI: string, uri: string) {
    const result = URI.resolve(glTFFileURI, uri);
    return result;
}

function createDataViewFromBuffer(buffer: DataView, offset: number = 0) {
    return new DataView(buffer.buffer, buffer.byteOffset + offset);
}

function createDataViewFromTypedArray(typedArray: ArrayBufferView, offset: number = 0) {
    return new DataView(typedArray.buffer, typedArray.byteOffset + offset);
}

const ccUseLittleEndian = true;

const glTFUseLittleEndian = true;

type UniqueNameGenerator = (original: string | null, last: string | null, index: number, count: number) => string;

function uniqueChildNodeNameGenerator(original: string | null, last: string | null, index: number, count: number): string {
    const postfix = count === 0 ? '' : `-${count}`;
    return `${original || ''}(__autogen ${index}${postfix})`;
}

function makeUniqueNames(names: Array<(string | null)>, generator: UniqueNameGenerator): string[] {
    const uniqueNames = new Array(names.length).fill('');
    for (let i = 0; i < names.length; ++i) {
        let name = names[i];
        let count = 0;
        while (true) {
            const isUnique = () => uniqueNames.every((uniqueName, index) => {
                return index === i || name !== uniqueName;
            });
            if (name === null || !isUnique()) {
                name = generator(names[i], name, i, count++);
            } else {
                uniqueNames[i] = name;
                break;
            }
        }
    }
    return uniqueNames;
}
