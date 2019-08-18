var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as imageDataUri from 'image-data-uri';
import parseDataUrl from 'parse-data-url';
import * as URI from 'uri-js';
export function getPathFromRoot(target, root) {
    let node = target;
    let path = '';
    while (node !== null && node !== root) {
        path = `${node.name}/${path}`;
        node = node.parent;
    }
    return path.slice(0, -1);
}
export function getWorldTransformUntilRoot(target, root, outPos, outRot, outScale) {
    ccm.math.Vec3.set(outPos, 0, 0, 0);
    ccm.math.Quat.set(outRot, 0, 0, 0, 1);
    ccm.math.Vec3.set(outScale, 1, 1, 1);
    while (target !== root) {
        ccm.math.Vec3.multiply(outPos, outPos, target.scale);
        ccm.math.Vec3.transformQuat(outPos, outPos, target.rotation);
        ccm.math.Vec3.add(outPos, outPos, target.position);
        ccm.math.Quat.multiply(outRot, target.rotation, outRot);
        ccm.math.Vec3.multiply(outScale, target.scale, outScale);
        target = target.parent;
    }
}
var GltfAssetKind;
(function (GltfAssetKind) {
    GltfAssetKind[GltfAssetKind["Node"] = 0] = "Node";
    GltfAssetKind[GltfAssetKind["Mesh"] = 1] = "Mesh";
    GltfAssetKind[GltfAssetKind["Texture"] = 2] = "Texture";
    GltfAssetKind[GltfAssetKind["Skin"] = 3] = "Skin";
    GltfAssetKind[GltfAssetKind["Animation"] = 4] = "Animation";
    GltfAssetKind[GltfAssetKind["Image"] = 5] = "Image";
    GltfAssetKind[GltfAssetKind["Material"] = 6] = "Material";
    GltfAssetKind[GltfAssetKind["Scene"] = 7] = "Scene";
})(GltfAssetKind || (GltfAssetKind = {}));
export var NormalImportSetting;
(function (NormalImportSetting) {
    /**
     * 如果模型文件中包含法线信息则导出法线，否则不导出法线。
     */
    NormalImportSetting[NormalImportSetting["optional"] = 0] = "optional";
    /**
     * 不在导出的网格中包含法线信息。
     */
    NormalImportSetting[NormalImportSetting["exclude"] = 1] = "exclude";
    /**
     * 如果模型文件中包含法线信息则导出法线，否则重新计算并导出法线。
     */
    NormalImportSetting[NormalImportSetting["require"] = 2] = "require";
    /**
     * 不管模型文件中是否包含法线信息，直接重新计算并导出法线。
     */
    NormalImportSetting[NormalImportSetting["recalculate"] = 3] = "recalculate";
})(NormalImportSetting || (NormalImportSetting = {}));
export var TangentImportSetting;
(function (TangentImportSetting) {
    /**
     * 不在导出的网格中包含正切信息。
     */
    TangentImportSetting[TangentImportSetting["exclude"] = 0] = "exclude";
    /**
     * 如果模型文件中包含正切信息则导出正切，否则不导出正切。
     */
    TangentImportSetting[TangentImportSetting["optional"] = 1] = "optional";
    /**
     * 如果模型文件中包含正切信息则导出正切，否则重新计算并导出正切。
     */
    TangentImportSetting[TangentImportSetting["require"] = 2] = "require";
    /**
     * 不管模型文件中是否包含正切信息，直接重新计算并导出正切。
     */
    TangentImportSetting[TangentImportSetting["recalculate"] = 3] = "recalculate";
})(TangentImportSetting || (TangentImportSetting = {}));
const GltfSemantics = {
    normal: {
        name: "NORMAL" /* NORMAL */,
        baseType: 5126 /* FLOAT */,
        type: "VEC3" /* VEC3 */,
    },
    tangent: {
        name: "TANGENT" /* TANGENT */,
        baseType: 5126 /* FLOAT */,
        type: "VEC3" /* VEC3 */,
    },
};
const v3_1 = new ccm.math.Vec3();
const qt_1 = new ccm.math.Quat();
const v3_2 = new ccm.math.Vec3();
const nd_1 = new ccm.Node();
export function getNodePathByTargetName(root, name, path) {
    for (let index = 0; index < root.children.length; index++) {
        const n = root.children[index];
        const pathN = path + "/" + n.name;
        if (n.name === name) {
            return pathN;
        }
        else {
            const path1 = getNodePathByTargetName(n, name, pathN);
            if (path1 !== pathN) {
                return path1;
            }
        }
    }
    return path;
}
function do_create(sceneNode, out, model, path) {
    if (model.parent === sceneNode) {
        return;
    }
    let socket = out.find((s) => s.path === path);
    if (!socket) {
        const target = new ccm.Node();
        target.name = `${model.parent.name} Socket`;
        target.parent = sceneNode;
        getWorldTransformUntilRoot(model.parent, sceneNode, v3_1, qt_1, v3_2);
        target.setPosition(v3_1);
        target.setRotation(qt_1);
        target.setScale(v3_2);
        socket = new ccm.SkeletalAnimationComponent.Socket(path, target);
        out.push(socket);
    }
    model.parent = socket.target;
}
;
export function createSockets(sceneNode, specialNames) {
    if (!sceneNode.getComponentInChildren(ccm.SkinningModelComponent)) {
        return [];
    }
    const renderables = sceneNode.getComponentsInChildren(ccm.RenderableComponent);
    const sockets = [];
    const specialCases = specialNames ? new RegExp(specialNames.reduce((acc, cur) => acc ? `${acc}|${cur}` : cur, '')) : null;
    for (const renderable of renderables) {
        // general cases
        let model = renderable.node;
        // handle skinning models
        if (renderable instanceof ccm.SkinningModelComponent) {
            const skinningRoot = renderable._skinningRoot;
            if (skinningRoot === sceneNode) {
                continue;
            }
            if (skinningRoot) {
                model = skinningRoot;
            }
        }
        // skip special cases
        let path = getPathFromRoot(model.parent, sceneNode);
        if (specialCases && specialCases.test(path)) {
            continue;
        }
        do_create(sceneNode, sockets, model, path);
    }
    if (specialNames) {
        const targets = specialNames.map((n) => getNodePathByTargetName(sceneNode, n, ''));
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            if (!target) {
                continue;
            }
            const path = target.slice(1, -specialNames[i].length - 1);
            const model = sceneNode.getChildByPath(target);
            if (model) {
                do_create(sceneNode, sockets, model, path);
            }
        }
    }
    return sockets;
}
export class GltfConverter {
    constructor(_gltf, _buffers, _url) {
        this._gltf = _gltf;
        this._buffers = _buffers;
        this._url = _url;
        this._nodePathTable = null;
        /**
         * The parent index of each node.
         */
        this._parents = [];
        /**
         * The root node of each skin.
         */
        this._skinRoots = [];
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
    get gltf() {
        return this._gltf;
    }
    get url() {
        return this._url;
    }
    createMesh(iGltfMesh, options) {
        const gltfMesh = this._gltf.meshes[iGltfMesh];
        const bufferBlob = new BufferBlob();
        const vertexBundles = new Array();
        const minPosition = new ccm.math.Vec3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        const maxPosition = new ccm.math.Vec3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        let targetNodeIdx = -1;
        let targetNode = null;
        let targetCCNode = null;
        const idxMap = [];
        if (this._gltf.nodes) {
            targetNodeIdx = this._gltf.nodes.findIndex((n) => n.mesh === iGltfMesh);
            targetNode = this._gltf.nodes[targetNodeIdx];
        }
        if (targetNode && targetNode.skin !== undefined) {
            this.createSkeleton(targetNode.skin, idxMap);
            targetCCNode = this._createEmptyNode(targetNodeIdx);
        }
        const primitives = gltfMesh.primitives.map((gltfPrimitive, primitiveIndex) => {
            const { vertexBuffer, vertexCount, vertexStride, formats, posBuffer, posBufferAlign, } = this._readPrimitiveVertices(gltfPrimitive, minPosition, maxPosition, options, targetCCNode, idxMap);
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
            const primitive = {
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
                const indicesAccessor = this._gltf.accessors[gltfPrimitive.indices];
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
        const meshStruct = {
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
    createSkeleton(iGltfSkin, sortMap) {
        const gltfSkin = this._gltf.skins[iGltfSkin];
        const skeleton = new ccm.Skeleton();
        skeleton.name = this._getGltfXXName(GltfAssetKind.Skin, iGltfSkin);
        skeleton._joints = gltfSkin.joints.map(this._getNodePath.bind(this));
        if (gltfSkin.inverseBindMatrices !== undefined) {
            const inverseBindMatricesAccessor = this._gltf.accessors[gltfSkin.inverseBindMatrices];
            if (inverseBindMatricesAccessor.componentType !== WebGLRenderingContext.FLOAT ||
                inverseBindMatricesAccessor.type !== 'MAT4') {
                throw new Error(`The inverse bind matrix should be floating-point 4x4 matrix.`);
            }
            const m = new ccm.math.Mat4();
            const targetIdx = this._gltf.nodes.findIndex((n) => n.skin === iGltfSkin);
            const target = targetIdx >= 0 ? this._createEmptyNode(targetIdx) : nd_1;
            ccm.math.Mat4.invert(m, ccm.math.Mat4.fromRTS(m, target._lrot, target._lpos, target._lscale));
            const bindposes = new Array(gltfSkin.joints.length);
            const data = new Float32Array(bindposes.length * 16);
            this._readAccessor(inverseBindMatricesAccessor, createDataViewFromTypedArray(data));
            for (let i = 0; i < bindposes.length; ++i) {
                bindposes[i] = new ccm.math.Mat4(data[16 * i + 0], data[16 * i + 1], data[16 * i + 2], data[16 * i + 3], data[16 * i + 4], data[16 * i + 5], data[16 * i + 6], data[16 * i + 7], data[16 * i + 8], data[16 * i + 9], data[16 * i + 10], data[16 * i + 11], data[16 * i + 12], data[16 * i + 13], data[16 * i + 14], data[16 * i + 15]);
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
    getAnimationDuration(iGltfAnimation) {
        const gltfAnimation = this._gltf.animations[iGltfAnimation];
        let duration = 0;
        gltfAnimation.channels.forEach((gltfChannel) => {
            const targetNode = gltfChannel.target.node;
            if (targetNode === undefined) {
                // When node isn't defined, channel should be ignored.
                return;
            }
            const sampler = gltfAnimation.samplers[gltfChannel.sampler];
            const inputAccessor = this._gltf.accessors[sampler.input];
            const channelDuration = inputAccessor.max !== undefined && inputAccessor.max.length === 1 ? Math.fround(inputAccessor.max[0]) : 0;
            duration = Math.max(channelDuration, duration);
        });
        return duration;
    }
    createAnimation(iGltfAnimation, span) {
        const gltfAnimation = this._gltf.animations[iGltfAnimation];
        const curveDatas = {};
        const getCurveData = (node) => {
            const path = this._getNodePath(node);
            let curveData = curveDatas[path];
            if (curveData === undefined) {
                curveData = {};
                curveDatas[path] = curveData;
            }
            return curveData;
        };
        let duration = 0;
        const keys = new Array();
        const keysSplitInfos = new Array();
        const floatingIndexOf = (value, values) => {
            const iPast = values.findIndex((v) => v >= value);
            if (iPast < 0) {
                return values.length - 1;
            }
            else if (iPast === 0) {
                return 0;
            }
            else {
                const iBefore = iPast - 1;
                const before = values[iBefore];
                const past = values[iPast];
                const ratio = (value - before) / (past - before);
                return iBefore + ratio;
            }
        };
        const keysMap = new Map();
        const getKeysIndex = (iInputAccessor) => {
            let i = keysMap.get(iInputAccessor);
            if (i === undefined) {
                const inputAccessor = this._gltf.accessors[iInputAccessor];
                const inputs = this._readAccessorIntoArray(inputAccessor);
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
                }
                else {
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
            const inputAccessor = this._gltf.accessors[sampler.input];
            const channelDuration = inputAccessor.max !== undefined && inputAccessor.max.length === 1 ? Math.fround(inputAccessor.max[0]) : 0;
            duration = Math.max(channelDuration, duration);
        });
        if (this._gltf.nodes) {
            const r = new ccm.math.Quat();
            const t = new ccm.math.Vec3();
            const s = new ccm.math.Vec3();
            this._gltf.nodes.forEach((node, nodeIndex) => {
                const curveData = getCurveData(nodeIndex);
                curveData.props = curveData.props || {};
                let m;
                if (node.matrix) {
                    m = this._readNodeMatrix(node.matrix);
                    ccm.math.Mat4.toRTS(m, r, t, s);
                }
                if (!Reflect.has(curveData.props, 'position')) {
                    const v = new ccm.math.Vec3();
                    if (node.translation) {
                        ccm.math.Vec3.set(v, node.translation[0], node.translation[1], node.translation[2]);
                    }
                    else if (m) {
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
                    }
                    else if (m) {
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
                    }
                    else if (m) {
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
    createMaterial(iGltfMaterial, gltfAssetFinder, effectGetter) {
        const gltfMaterial = this._gltf.materials[iGltfMaterial];
        const material = new ccm.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, iGltfMaterial);
        material._effectAsset = effectGetter('db://internal/effects/builtin-standard.effect');
        const defines = {};
        const props = {};
        const states = {
            rasterizerState: {},
            blendState: { targets: [{}] },
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
            { name: 'METALLIC_CHANNEL', options: ['g'] },
            { name: 'OCCLUSION_CHANNEL', options: ['b'] },
        ];
        const properties = {
            pbrParams: { value: [0.8, 0.6, 1.0, 1.0] },
            pbrScale: { value: [1.0, 1.0, 1.0, 1.0] },
            albedoScale: { value: [1.0, 1.0, 1.0, 1.0] },
        };
        /* */
        const _channelMap = { r: 0, g: 1, b: 2, a: 3 };
        const O = _channelMap[shaderDefines.find((d) => d.name === 'OCCLUSION_CHANNEL').options[0]];
        const R = _channelMap[shaderDefines.find((d) => d.name === 'ROUGHNESS_CHANNEL').options[0]];
        const M = _channelMap[shaderDefines.find((d) => d.name === 'METALLIC_CHANNEL').options[0]];
        const pbrParams = properties['pbrParams'].value;
        props['pbrParams'] = new ccm.math.Vec4(pbrParams[O], pbrParams[R], pbrParams[M], pbrParams[3]);
        const pbrScale = properties['pbrScale'].value;
        props['pbrScale'] = new ccm.math.Vec4(pbrScale[O], pbrScale[R], pbrScale[M], pbrScale[3]);
        const albedoScale = properties['albedoScale'].value;
        props['albedoScale'] = new ccm.math.Vec4(albedoScale[0], albedoScale[1], albedoScale[2], albedoScale[3]);
        if (gltfMaterial.pbrMetallicRoughness) {
            const pbrMetallicRoughness = gltfMaterial.pbrMetallicRoughness;
            if (pbrMetallicRoughness.baseColorTexture !== undefined) {
                defines['USE_ALBEDO_MAP'] = true;
                props['albedoMap'] = gltfAssetFinder.find("textures" /* texture */, pbrMetallicRoughness.baseColorTexture.index);
            }
            if (pbrMetallicRoughness.baseColorFactor) {
                const c = pbrMetallicRoughness.baseColorFactor;
                ccm.math.Vec4.set(props['albedoScale'], c[0], c[1], c[2], c[3]);
            }
            if (pbrMetallicRoughness.metallicRoughnessTexture !== undefined) {
                defines['USE_METALLIC_ROUGHNESS_MAP'] = true;
                props['metallicRoughnessMap'] = gltfAssetFinder.find("textures" /* texture */, pbrMetallicRoughness.metallicRoughnessTexture.index);
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
                props['occlusionMap'] = gltfAssetFinder.find("textures" /* texture */, pbrOcclusionTexture.index);
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
                props['normalMap'] = gltfAssetFinder.find("textures" /* texture */, pbrNormalTexture.index);
                if (pbrNormalTexture.scale !== undefined) {
                    props['pbrScale'].w = pbrNormalTexture.scale;
                }
            }
        }
        if (gltfMaterial.emissiveTexture !== undefined) {
            defines['USE_EMISSIVE_MAP'] = true;
            props['emissiveMap'] = gltfAssetFinder.find("textures" /* texture */, gltfMaterial.emissiveTexture.index);
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
                console.warn(`Alpha mode ${gltfMaterial.alphaMode} ` +
                    `(for material named ${gltfMaterial.name}, gltf-index ${iGltfMaterial}) ` +
                    `is not supported currently.`);
                break;
        }
        material._defines = [defines];
        material._props = [props];
        material._states = [states];
        return material;
    }
    getTextureParameters(gltfTexture) {
        const convertWrapMode = (gltfWrapMode) => {
            if (gltfWrapMode === undefined) {
                gltfWrapMode = 10497 /* __DEFAULT */;
            }
            switch (gltfWrapMode) {
                case 33071 /* CLAMP_TO_EDGE */: return ccm.TextureBase.WrapMode.CLAMP_TO_EDGE;
                case 33648 /* MIRRORED_REPEAT */: return ccm.TextureBase.WrapMode.MIRRORED_REPEAT;
                case 10497 /* REPEAT */: return ccm.TextureBase.WrapMode.REPEAT;
                default:
                    console.error(`Unsupported wrapMode: ${gltfWrapMode}, 'repeat' is used.(in ${this.url})`);
                    return ccm.TextureBase.WrapMode.REPEAT;
            }
        };
        const convertMagFilter = (gltfFilter) => {
            switch (gltfFilter) {
                case 9728 /* NEAREST */: return ccm.TextureBase.Filter.NEAREST;
                case 9729 /* LINEAR */: return ccm.TextureBase.Filter.LINEAR;
                default:
                    console.warn(`Unsupported filter: ${gltfFilter}, 'linear' is used.(in ${this.url})`);
                    return ccm.TextureBase.Filter.LINEAR;
            }
        };
        const convertMinFilter = (gltfFilter) => {
            switch (gltfFilter) {
                case 9728 /* NEAREST */: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.NONE];
                case 9729 /* LINEAR */: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NONE];
                case 9984 /* NEAREST_MIPMAP_NEAREST */: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.NEAREST];
                case 9985 /* LINEAR_MIPMAP_NEAREST */: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NEAREST];
                case 9986 /* NEAREST_MIPMAP_LINEAR */: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.LINEAR];
                case 9987 /* LINEAR_MIPMAP_LINEAR */: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.LINEAR];
                default:
                    console.warn(`Unsupported filter: ${gltfFilter}, 'linear' is used.(in ${this.url})`);
                    return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NONE];
            }
        };
        const result = {};
        if (gltfTexture.sampler === undefined) {
            result.wrapModeS = ccm.TextureBase.WrapMode.REPEAT;
            result.wrapModeT = ccm.TextureBase.WrapMode.REPEAT;
        }
        else {
            const gltfSampler = this._gltf.samplers[gltfTexture.sampler];
            result.wrapModeS = convertWrapMode(gltfSampler.wrapS);
            result.wrapModeT = convertWrapMode(gltfSampler.wrapT);
            if (gltfSampler.magFilter !== undefined) {
                result.magFilter = convertMagFilter(gltfSampler.magFilter);
            }
            if (gltfSampler.minFilter !== undefined) {
                const [min, mip] = convertMinFilter(gltfSampler.minFilter);
                result.minFilter = min;
                result.mipFilter = mip;
            }
        }
        return result;
    }
    createScene(iGltfScene, gltfAssetFinder, withTransform = true) {
        return this._getSceneNode(iGltfScene, gltfAssetFinder, withTransform);
    }
    readImage(gltfImage, glTFUri, glTFHost) {
        return __awaiter(this, void 0, void 0, function* () {
            const imageUri = gltfImage.uri;
            if (imageUri !== undefined) {
                if (!isDataUri(imageUri)) {
                    const imageUriAbs = resolveGLTFUri(glTFUri, imageUri);
                    return yield this._readImageByFsPath(imageUriAbs, glTFHost);
                }
                else {
                    return yield this._readImageByDataUri(imageUri);
                }
            }
            else if (gltfImage.bufferView !== undefined) {
                const bufferView = this._gltf.bufferViews[gltfImage.bufferView];
                return yield this._readImageInBufferview(bufferView, gltfImage.mimeType);
            }
        });
    }
    _getNodeRotation(rotation, out) {
        ccm.math.Quat.set(out, rotation[0], rotation[1], rotation[2], rotation[3]);
        ccm.math.Quat.normalize(out, out);
        return out;
    }
    _gltfChannelToCurveData(gltfAnimation, gltfChannel, curveData, iKeys, span) {
        let propName;
        if (gltfChannel.target.path === "translation" /* translation */) {
            propName = 'position';
        }
        else if (gltfChannel.target.path === "rotation" /* rotation */) {
            propName = 'rotation';
        }
        else if (gltfChannel.target.path === "scale" /* scale */) {
            propName = 'scale';
        }
        else {
            console.error(`Unsupported channel target path '${gltfChannel.target.path}'.(in ${this.url})`);
            return 0;
        }
        const gltfSampler = gltfAnimation.samplers[gltfChannel.sampler];
        let outputs = this._readAccessorIntoArray(this._gltf.accessors[gltfSampler.output]);
        if (!(outputs instanceof Float32Array)) {
            const normalizedOutput = new Float32Array(outputs.length);
            const normalize = (() => {
                if (outputs instanceof Int8Array) {
                    return (value) => {
                        return Math.max(value / 127.0, -1.0);
                    };
                }
                else if (outputs instanceof Uint8Array) {
                    return (value) => {
                        return value / 255.0;
                    };
                }
                else if (outputs instanceof Int16Array) {
                    return (value) => {
                        return Math.max(value / 32767.0, -1.0);
                    };
                }
                else if (outputs instanceof Uint16Array) {
                    return (value) => {
                        return value / 65535.0;
                    };
                }
                else {
                    return (value) => {
                        return value;
                    };
                }
            })();
            for (let i = 0; i < outputs.length; ++i) {
                normalizedOutput[i] = normalize(outputs[i]); // Do normalize.
            }
            outputs = normalizedOutput;
        }
        let values = [];
        let blendingFunctionName = null;
        let valueConstructor = null;
        if (propName === 'position' || propName === 'scale') {
            valueConstructor = ccm.math.Vec3;
            values = new Array(outputs.length / 3);
            for (let i = 0; i < values.length; ++i) {
                values[i] = new ccm.math.Vec3(outputs[i * 3 + 0], outputs[i * 3 + 1], outputs[i * 3 + 2]);
            }
            blendingFunctionName = 'additive3D';
        }
        else if (propName === 'rotation') {
            valueConstructor = ccm.math.Quat;
            values = new Array(outputs.length / 4);
            for (let i = 0; i < values.length; ++i) {
                values[i] = new ccm.math.Quat(outputs[i * 4 + 0], outputs[i * 4 + 1], outputs[i * 4 + 2], outputs[i * 4 + 3]);
            }
            blendingFunctionName = 'additiveQuat';
        }
        curveData.props = curveData.props || {};
        const result = {
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
                        csValues[i] = new cubicSplineValueConstructor(result.values[i * 3 + 0], result.values[i * 3 + 1], result.values[i * 3 + 2]);
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
                    let lerpFx;
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
    _split(array, from, to, lerp) {
        let first;
        let iNext = 0;
        {
            const before = Math.trunc(from);
            const ratio = from - before;
            if (ratio === 0) {
                iNext = before;
            }
            else {
                const past = before + 1;
                first = lerp(array[before], array[past], ratio);
                iNext = past;
            }
        }
        let last;
        let iEnd = 0;
        {
            const before = Math.trunc(to);
            const ratio = to - before;
            if (ratio === 0) {
                iEnd = before;
            }
            else {
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
    _getParent(node) {
        return this._parents[node];
    }
    _commonRoot(nodes) {
        let minPathLen = Infinity;
        const paths = nodes.map((node) => {
            const path = [];
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
        const commonPath = [];
        for (let i = 0; i < minPathLen; ++i) {
            const n = paths[0][i];
            if (paths.every((path) => path[i] === n)) {
                commonPath.push(n);
            }
            else {
                break;
            }
        }
        if (commonPath.length === 0) {
            return -1;
        }
        return commonPath[commonPath.length - 1];
    }
    _getSkinRoot(skin) {
        let result = this._skinRoots[skin];
        if (result < 0) {
            result = this._commonRoot(this._gltf.skins[skin].joints);
            if (result < 0) {
                throw new Error(`Non-conforming glTf: skin joints do not have a common root(they are not under same scene).`);
            }
        }
        return result;
    }
    _checkTangentImportSetting(setting, gltfPrimitive) {
        const recalcNeeded = (setting === TangentImportSetting.recalculate) ||
            (setting === TangentImportSetting.require && !Reflect.has(gltfPrimitive.attributes, "TANGENT" /* TANGENT */));
        if (recalcNeeded && !Reflect.has(gltfPrimitive.attributes, "TEXCOORD_0" /* TEXCOORD_0 */)) {
            console.warn(`Tangent caculation is needed but the mesh has no uv information, ` +
                `the tangent attribute will be excluded therefor.(in glTf file: ${this.url})`);
            return TangentImportSetting.exclude;
        }
        else {
            return setting;
        }
    }
    _readPrimitiveVertices(gltfPrimitive, minPosition, maxPosition, options, targetNode, idxMap) {
        options.tangents = this._checkTangentImportSetting(options.tangents, gltfPrimitive);
        const attributeNames = Object.getOwnPropertyNames(gltfPrimitive.attributes);
        // 统计出所有需要导出的属性，并计算它们在顶点缓冲区中的偏移以及整个顶点缓冲区的容量。
        let vertexStride = 0;
        let vertexCount = 0;
        let recalcNormal = options.normals === NormalImportSetting.recalculate || options.normals === NormalImportSetting.require;
        let recalcTangent = options.tangents === TangentImportSetting.recalculate || options.tangents === TangentImportSetting.require;
        const exportingAttributes = [];
        for (const attributeName of attributeNames) {
            if (attributeName === 'NORMAL') {
                if (options.normals === NormalImportSetting.exclude ||
                    options.normals === NormalImportSetting.recalculate) {
                    continue;
                }
                else if (options.normals === NormalImportSetting.require) {
                    recalcNormal = false;
                }
            }
            else if (attributeName === 'TANGENT') {
                if (options.tangents === TangentImportSetting.exclude ||
                    options.tangents === TangentImportSetting.recalculate) {
                    continue;
                }
                else if (options.tangents === TangentImportSetting.require) {
                    recalcTangent = false;
                }
            }
            const attributeAccessor = this._gltf.accessors[gltfPrimitive.attributes[attributeName]];
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
        const formats = [];
        const v3_1 = new ccm.math.Vec3();
        const m4_1 = new ccm.math.Mat4();
        for (const exportingAttribute of exportingAttributes) {
            const attributeName = exportingAttribute.name;
            const attributeAccessor = this._gltf.accessors[gltfPrimitive.attributes[attributeName]];
            const dataView = new DataView(vertexBuffer, currentByteOffset);
            this._readAccessor(attributeAccessor, dataView, vertexStride);
            currentByteOffset += exportingAttribute.byteLength;
            if (attributeName === "POSITION" /* POSITION */) {
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
                if (attributeName === "POSITION" /* POSITION */) {
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
                if (attributeName === "NORMAL" /* NORMAL */ || attributeName === "TANGENT" /* TANGENT */) {
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
                    const ws = new Array(4);
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
        const appendVertexStreamF = (semantic, offset, data) => {
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
                format: this._getAttributeFormat(5126 /* FLOAT */, semantic.type),
                isNormalized: false,
            });
        };
        let primitiveViewer;
        const getPrimitiveViewer = () => {
            if (primitiveViewer === undefined) {
                primitiveViewer = this._makePrimitiveViewer(gltfPrimitive);
            }
            return primitiveViewer;
        };
        let normals;
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
    _readImageByFsPath(imagePath, glTFHost) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dot = imagePath.lastIndexOf('.');
                return {
                    imageData: new DataView(yield glTFHost.readBuffer(imagePath)),
                    extName: dot >= 0 ? imagePath.substr(dot + 1) : '',
                };
            }
            catch (error) {
                console.warn(`Failed to load texture with path: ${imagePath}`);
                return undefined;
            }
        });
    }
    _makePrimitiveViewer(gltfPrimitive) {
        const primitiveMode = gltfPrimitive.mode === undefined ? 4 /* __DEFAULT */ : gltfPrimitive.mode;
        if (primitiveMode !== 4 /* TRIANGLES */) {
            throw new Error(`Normals calculation needs triangle primitive.`);
        }
        let vertexCount = 0;
        const attributeNames = Object.keys(gltfPrimitive.attributes);
        if (attributeNames.length !== 0) {
            vertexCount = this._gltf.accessors[gltfPrimitive.attributes[attributeNames[0]]].count;
        }
        let faces;
        if (gltfPrimitive.indices === undefined) {
            faces = new Float32Array(vertexCount);
            for (let i = 0; i < faces.length; ++i) {
                faces[i] = i;
            }
        }
        else {
            const indicesAccessor = this._gltf.accessors[gltfPrimitive.indices];
            faces = this._readAccessorIntoArray(indicesAccessor);
        }
        const nFaces = Math.floor(faces.length / 3);
        const cachedAttributes = new Map();
        const getAttributes = (name) => {
            let result = cachedAttributes.get(name);
            if (result === undefined) {
                if (!Reflect.has(gltfPrimitive.attributes, name)) {
                    throw new Error(`Tangent calculation needs ${name}.`);
                }
                result = this._readAccessorIntoArray(this._gltf.accessors[gltfPrimitive.attributes[name]]);
                cachedAttributes.set(name, result);
            }
            return result;
        };
        const getVertexCount = () => vertexCount;
        const getFaces = () => faces;
        const getFaceCount = () => nFaces;
        const getPositions = () => {
            return getAttributes("POSITION" /* POSITION */);
        };
        const getNormals = () => {
            return getAttributes("NORMAL" /* NORMAL */);
        };
        const getUVs = () => {
            return getAttributes("TEXCOORD_0" /* TEXCOORD_0 */);
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
    _readAccessorIntoArray(gltfAccessor) {
        const storageConstructor = this._getAttributeBaseTypeStorage(gltfAccessor.componentType);
        const result = new storageConstructor(gltfAccessor.count * this._getComponentsPerAttribute(gltfAccessor.type));
        this._readAccessor(gltfAccessor, createDataViewFromTypedArray(result));
        return result;
    }
    _readImageByDataUri(dataUri) {
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
    _readImageInBufferview(bufferView, mimeType) {
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
        const imageData = new DataView(buffer.buffer, buffer.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
        return {
            extName,
            imageData,
        };
    }
    _getSceneNode(iGltfScene, gltfAssetFinder, withTransform = true) {
        const sceneName = this._getGltfXXName(GltfAssetKind.Scene, iGltfScene);
        const result = new ccm.Node(sceneName);
        const gltfScene = this._gltf.scenes[iGltfScene];
        if (gltfScene.nodes !== undefined) {
            const mapping = new Array(this._gltf.nodes.length).fill(null);
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
    _createEmptyNodeRecursive(iGltfNode, mapping, withTransform = true) {
        const gltfNode = this._gltf.nodes[iGltfNode];
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
    _setupNode(iGltfNode, mapping, gltfAssetFinder) {
        const node = mapping[iGltfNode];
        if (node === null) {
            return;
        }
        const gltfNode = this._gltf.nodes[iGltfNode];
        if (gltfNode.mesh !== undefined) {
            let modelComponent = null;
            if (gltfNode.skin === undefined) {
                modelComponent = node.addComponent(ccm.ModelComponent);
            }
            else {
                const skinningModelComponent = node.addComponent(ccm.SkinningModelComponent);
                const skeleton = gltfAssetFinder.find("skeletons" /* skeleton */, gltfNode.skin);
                if (skeleton) {
                    skinningModelComponent._skeleton = skeleton;
                }
                const skinRoot = mapping[this._getSkinRoot(gltfNode.skin)];
                if (skinRoot === null) {
                    console.error(`glTf requires that skin joints must exists in same scene as node references it.`);
                }
                else {
                    // assign a temporary root
                    skinningModelComponent._skinningRoot = skinRoot;
                }
                modelComponent = skinningModelComponent;
            }
            const mesh = gltfAssetFinder.find("meshes" /* mesh */, gltfNode.mesh);
            if (mesh) {
                modelComponent._mesh = mesh;
            }
            const gltfMesh = this.gltf.meshes[gltfNode.mesh];
            const materials = gltfMesh.primitives.map((gltfPrimitive) => {
                if (gltfPrimitive.material === undefined) {
                    return null;
                }
                else {
                    const material = gltfAssetFinder.find("materials" /* material */, gltfPrimitive.material);
                    if (material) {
                        return material;
                    }
                }
                return null;
            });
            modelComponent._materials = materials;
        }
    }
    _createEmptyNode(iGltfNode, withTransform = true) {
        const gltfNode = this._gltf.nodes[iGltfNode];
        const nodeName = this._getGltfXXName(GltfAssetKind.Node, iGltfNode);
        const node = new ccm.Node(nodeName);
        if (!withTransform) {
            return node;
        }
        if (gltfNode.translation) {
            node.setPosition(gltfNode.translation[0], gltfNode.translation[1], gltfNode.translation[2]);
        }
        if (gltfNode.rotation) {
            node.setRotation(this._getNodeRotation(gltfNode.rotation, new ccm.math.Quat()));
        }
        if (gltfNode.scale) {
            node.setScale(gltfNode.scale[0], gltfNode.scale[1], gltfNode.scale[2]);
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
    _readNodeMatrix(ns) {
        return new ccm.math.Mat4(ns[0], ns[1], ns[2], ns[3], ns[4], ns[5], ns[6], ns[7], ns[8], ns[9], ns[10], ns[11], ns[12], ns[13], ns[14], ns[15]);
    }
    _getNodePath(node) {
        if (this._nodePathTable == null) {
            this._nodePathTable = this._createNodePathTable();
        }
        return this._nodePathTable[node];
    }
    _createNodePathTable() {
        if (this._gltf.nodes === undefined) {
            return [];
        }
        const parentTable = new Array(this._gltf.nodes.length).fill(-1);
        this._gltf.nodes.forEach((gltfNode, nodeIndex) => {
            if (gltfNode.children) {
                gltfNode.children.forEach((iChildNode) => {
                    parentTable[iChildNode] = nodeIndex;
                });
                const names = gltfNode.children.map((iChildNode) => {
                    const childNode = this._gltf.nodes[iChildNode];
                    let name = childNode.name;
                    if (typeof name !== 'string' || name.length === 0) {
                        name = null;
                    }
                    return name;
                });
                const uniqueNames = makeUniqueNames(names, uniqueChildNodeNameGenerator);
                uniqueNames.forEach((uniqueName, iUniqueName) => {
                    this._gltf.nodes[gltfNode.children[iUniqueName]].name = uniqueName;
                });
            }
        });
        const nodeNames = new Array(this._gltf.nodes.length).fill('');
        for (let iNode = 0; iNode < nodeNames.length; ++iNode) {
            nodeNames[iNode] = this._getGltfXXName(GltfAssetKind.Node, iNode);
        }
        const result = new Array(this._gltf.nodes.length).fill('');
        this._gltf.nodes.forEach((gltfNode, nodeIndex) => {
            const segments = [];
            for (let i = nodeIndex; i >= 0; i = parentTable[i]) {
                segments.unshift(nodeNames[i]);
            }
            result[nodeIndex] = segments.join('/');
        });
        return result;
    }
    _readAccessor(gltfAccessor, outputBuffer, outputStride = 0) {
        if (gltfAccessor.bufferView === undefined) {
            console.warn(`Note, there is an accessor assiociating with no buffer view in file ${this.url}.`);
            return;
        }
        const gltfBufferView = this._gltf.bufferViews[gltfAccessor.bufferView];
        const componentsPerAttribute = this._getComponentsPerAttribute(gltfAccessor.type);
        const bytesPerElement = this._getBytesPerComponent(gltfAccessor.componentType);
        if (outputStride === 0) {
            outputStride = componentsPerAttribute * bytesPerElement;
        }
        const inputStartOffset = (gltfAccessor.byteOffset !== undefined ? gltfAccessor.byteOffset : 0) +
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
    _getPrimitiveMode(mode) {
        if (mode === undefined) {
            mode = 4 /* __DEFAULT */;
        }
        switch (mode) {
            case 0 /* POINTS */: return ccm.GFXPrimitiveMode.POINT_LIST;
            case 1 /* LINES */: return ccm.GFXPrimitiveMode.LINE_LIST;
            case 2 /* LINE_LOOP */: return ccm.GFXPrimitiveMode.LINE_LOOP;
            case 3 /* LINE_STRIP */: return ccm.GFXPrimitiveMode.LINE_STRIP;
            case 4 /* TRIANGLES */: return ccm.GFXPrimitiveMode.TRIANGLE_LIST;
            case 5 /* TRIANGLE_STRIP */: return ccm.GFXPrimitiveMode.TRIANGLE_STRIP;
            case 6 /* TRIANGLE_FAN */: return ccm.GFXPrimitiveMode.TRIANGLE_FAN;
            default:
                throw new Error(`Unrecognized primitive mode: ${mode}.`);
        }
    }
    _getAttributeFormat(componentType, type) {
        switch (componentType) {
            case 5120 /* BYTE */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R8SN;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG8SN;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB8SN;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA8SN;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case 5121 /* UNSIGNED_BYTE */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R8;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG8;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB8;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA8;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case 5122 /* SHORT */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R16I;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG16I;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB16I;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA16I;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case 5123 /* UNSIGNED_SHORT */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R16UI;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG16UI;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB16UI;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA16UI;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case 5125 /* UNSIGNED_INT */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R32UI;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG32UI;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB32UI;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA32UI;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            case 5126 /* FLOAT */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R32F;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG32F;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB32F;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA32F;
                    default: throw new Error(`Unrecognized attribute type: ${type}.`);
                }
            }
            default: throw new Error(`Unrecognized component type: ${componentType}.`);
        }
    }
    _getAttributeBaseTypeStorage(componentType) {
        switch (componentType) {
            case 5120 /* BYTE */: return Int8Array;
            case 5121 /* UNSIGNED_BYTE */: return Uint8Array;
            case 5122 /* SHORT */: return Int16Array;
            case 5123 /* UNSIGNED_SHORT */: return Uint16Array;
            case 5125 /* UNSIGNED_INT */: return Uint32Array;
            case 5126 /* FLOAT */: return Float32Array;
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }
    _getIndexStride(componentType) {
        switch (componentType) {
            case 5121 /* UNSIGNED_BYTE */: return 1;
            case 5123 /* UNSIGNED_SHORT */: return 2;
            case 5125 /* UNSIGNED_INT */: return 4;
            default:
                throw new Error(`Unrecognized index type: ${componentType}`);
        }
    }
    _getBytesPerAttribute(gltfAccessor) {
        return this._getBytesPerComponent(gltfAccessor.componentType) *
            this._getComponentsPerAttribute(gltfAccessor.type);
    }
    _getComponentsPerAttribute(type) {
        switch (type) {
            case "SCALAR" /* SCALAR */: return 1;
            case "VEC2" /* VEC2 */: return 2;
            case "VEC3" /* VEC3 */: return 3;
            case "VEC4" /* VEC4 */:
            case "MAT2" /* MAT2 */: return 4;
            case "MAT3" /* MAT3 */: return 9;
            case "MAT4" /* MAT4 */: return 16;
            default:
                throw new Error(`Unrecognized attribute type: ${type}.`);
        }
    }
    _getBytesPerComponent(componentType) {
        switch (componentType) {
            case 5120 /* BYTE */:
            case 5121 /* UNSIGNED_BYTE */: return 1;
            case 5122 /* SHORT */:
            case 5123 /* UNSIGNED_SHORT */: return 2;
            case 5125 /* UNSIGNED_INT */:
            case 5126 /* FLOAT */: return 4;
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }
    _getGfxAttributeName(name) {
        switch (name) {
            case "POSITION" /* POSITION */: return ccm.GFXAttributeName.ATTR_POSITION;
            case "NORMAL" /* NORMAL */: return ccm.GFXAttributeName.ATTR_NORMAL;
            case "TANGENT" /* TANGENT */: return ccm.GFXAttributeName.ATTR_TANGENT;
            case "COLOR_0" /* COLOR_0 */: return ccm.GFXAttributeName.ATTR_COLOR;
            case "TEXCOORD_0" /* TEXCOORD_0 */: return ccm.GFXAttributeName.ATTR_TEX_COORD;
            case "TEXCOORD_1" /* TEXCOORD_1 */: return ccm.GFXAttributeName.ATTR_TEX_COORD1;
            case 'TEXCOORD_2': return ccm.GFXAttributeName.ATTR_TEX_COORD2;
            case 'TEXCOORD_3': return ccm.GFXAttributeName.ATTR_TEX_COORD3;
            case "JOINTS_0" /* JOINTS_0 */: return ccm.GFXAttributeName.ATTR_JOINTS;
            case "WEIGHTS_0" /* WEIGHTS_0 */: return ccm.GFXAttributeName.ATTR_WEIGHTS;
            default:
                throw new Error(`Unrecognized attribute type: ${name}`);
        }
    }
    _getComponentReader(componentType) {
        switch (componentType) {
            case 5120 /* BYTE */: return (buffer, offset) => buffer.getInt8(offset);
            case 5121 /* UNSIGNED_BYTE */: return (buffer, offset) => buffer.getUint8(offset);
            case 5122 /* SHORT */: return (buffer, offset) => buffer.getInt16(offset, ccUseLittleEndian);
            case 5123 /* UNSIGNED_SHORT */: return (buffer, offset) => buffer.getUint16(offset, ccUseLittleEndian);
            case 5125 /* UNSIGNED_INT */: return (buffer, offset) => buffer.getUint32(offset, ccUseLittleEndian);
            case 5126 /* FLOAT */: return (buffer, offset) => buffer.getFloat32(offset, ccUseLittleEndian);
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }
    _getComponentWriter(componentType) {
        switch (componentType) {
            case 5120 /* BYTE */: return (buffer, offset, value) => buffer.setInt8(offset, value);
            case 5121 /* UNSIGNED_BYTE */: return (buffer, offset, value) => buffer.setUint8(offset, value);
            case 5122 /* SHORT */: return (buffer, offset, value) => buffer.setInt16(offset, value, ccUseLittleEndian);
            case 5123 /* UNSIGNED_SHORT */: return (buffer, offset, value) => buffer.setUint16(offset, value, ccUseLittleEndian);
            case 5125 /* UNSIGNED_INT */: return (buffer, offset, value) => buffer.setUint32(offset, value, ccUseLittleEndian);
            case 5126 /* FLOAT */: return (buffer, offset, value) => buffer.setFloat32(offset, value, ccUseLittleEndian);
            default:
                throw new Error(`Unrecognized component type: ${componentType}`);
        }
    }
    _getGltfXXName(assetKind, index) {
        const assetsArrayName = {
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
        }
        else {
            return `${GltfAssetKind[assetKind]}-${index}`;
        }
    }
}
function calculateNormals(gltfPrimitiveViewer) {
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
    const getPosition = (iVertex, out) => {
        ccm.math.Vec3.set(out, positions[iVertex * 3 + 0], positions[iVertex * 3 + 1], positions[iVertex * 3 + 2]);
    };
    const addFaceNormal = (iVertex, normal) => {
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
function calculateTangents(gltfPrimitiveViewer, overrideNormals) {
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
    const getPosition = (iVertex, out) => {
        ccm.math.Vec3.set(out, positions[iVertex * 3 + 0], positions[iVertex * 3 + 1], positions[iVertex * 3 + 2]);
    };
    const getUV = (iVertex, out) => {
        ccm.math.Vec2.set(out, uvs[iVertex * 2 + 0], uvs[iVertex * 2 + 1]);
    };
    const addTan = (tans, iVertex, val) => {
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
            ccm.math.Vec3.set(sdir, (t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r);
            ccm.math.Vec3.set(tdir, (s1 * x2 - s2 * x1) * r, (s1 * y2 - s2 * y1) * r, (s1 * z2 - s2 * z1) * r);
        }
        else {
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
export function readGltf(glTFFileUri, glTFHost) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = URI.parse(glTFFileUri).path;
        return (path && path.endsWith('.glb')) ?
            yield readGlb(glTFFileUri, glTFHost) :
            yield readGltfJson(glTFFileUri, glTFHost);
    });
}
function readGltfJson(uri, glTFHost) {
    return __awaiter(this, void 0, void 0, function* () {
        const gltf = yield glTFHost.readJSON(uri);
        let binaryBuffers = [];
        if (gltf.buffers) {
            binaryBuffers = yield Promise.all(gltf.buffers.map((gltfBuffer) => {
                if (!gltfBuffer.uri) {
                    return new DataView(new ArrayBuffer(0));
                }
                return readBufferData(uri, gltfBuffer.uri, glTFHost);
            }));
        }
        return { gltf, binaryBuffers };
    });
}
function readGlb(uri, glTFHost) {
    return __awaiter(this, void 0, void 0, function* () {
        const badGLBFormat = () => {
            throw new Error(`Bad glb format.`);
        };
        const glb = new DataView(yield glTFHost.readBuffer(uri));
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
        let gltf;
        let embededBinaryBuffer;
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
                gltf = JSON.parse(gltfJson);
            }
            else if (chunkType === ChunkTypeBin) {
                // TODO: Should we copy?
                // embededBinaryBuffer = payload.slice();
                embededBinaryBuffer = payload;
            }
        }
        if (!gltf) {
            return badGLBFormat();
        }
        else {
            let binaryBuffers = [];
            if (gltf.buffers) {
                binaryBuffers = yield Promise.all(gltf.buffers.map((gltfBuffer, index) => {
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
    });
}
export function isDataUri(uri) {
    return uri.startsWith('data:');
}
class BufferBlob {
    constructor() {
        this._arrayBufferOrPaddings = [];
        this._length = 0;
    }
    setNextAlignment(align) {
        if (align !== 0) {
            const remainder = this._length % align;
            if (remainder !== 0) {
                const padding = align - remainder;
                this._arrayBufferOrPaddings.push(padding);
                this._length += padding;
            }
        }
    }
    addBuffer(arrayBuffer) {
        const result = this._length;
        this._arrayBufferOrPaddings.push(arrayBuffer);
        this._length += arrayBuffer.byteLength;
        return result;
    }
    getLength() {
        return this._length;
    }
    getCombined() {
        const result = new Uint8Array(this._length);
        let counter = 0;
        this._arrayBufferOrPaddings.forEach((arrayBufferOrPadding) => {
            if (typeof arrayBufferOrPadding === 'number') {
                counter += arrayBufferOrPadding;
            }
            else {
                result.set(new Uint8Array(arrayBufferOrPadding), counter);
                counter += arrayBufferOrPadding.byteLength;
            }
        });
        return result;
    }
}
function readBufferData(glTFFileURI, uri, glTFHost) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!uri.startsWith('data:')) {
            const bufferURI = resolveGLTFUri(glTFFileURI, uri);
            return new DataView(yield glTFHost.readBuffer(bufferURI));
        }
        else {
            const dataUrl = parseDataUrl(uri);
            if (!dataUrl) {
                throw new Error(`Bad data uri.${uri}`);
            }
            return new DataView(dataUrl.toBuffer().buffer);
        }
    });
}
export function resolveGLTFUri(glTFFileURI, uri) {
    const result = URI.resolve(glTFFileURI, uri);
    return result;
}
function createDataViewFromBuffer(buffer, offset = 0) {
    return new DataView(buffer.buffer, buffer.byteOffset + offset);
}
function createDataViewFromTypedArray(typedArray, offset = 0) {
    return new DataView(typedArray.buffer, typedArray.byteOffset + offset);
}
const ccUseLittleEndian = true;
const glTFUseLittleEndian = true;
function uniqueChildNodeNameGenerator(original, last, index, count) {
    const postfix = count === 0 ? '' : `-${count}`;
    return `${original || ''}(__autogen ${index}${postfix})`;
}
function makeUniqueNames(names, generator) {
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
            }
            else {
                uniqueNames[i] = name;
                break;
            }
        }
    }
    return uniqueNames;
}
//# sourceMappingURL=glTF-converter.js.map