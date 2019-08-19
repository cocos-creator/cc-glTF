"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var parse_data_url_1 = __importDefault(require("parse-data-url"));
var URI = __importStar(require("uri-js"));
var data_uri_utils_1 = require("./data-uri-utils");
// tslint:disable:no-string-literal
var AssetFinderKind;
(function (AssetFinderKind) {
    AssetFinderKind["mesh"] = "meshes";
    AssetFinderKind["animation"] = "animations";
    AssetFinderKind["skeleton"] = "skeletons";
    AssetFinderKind["texture"] = "textures";
    AssetFinderKind["material"] = "materials";
})(AssetFinderKind = exports.AssetFinderKind || (exports.AssetFinderKind = {}));
function getPathFromRoot(target, root) {
    var node = target;
    var path = '';
    while (node !== null && node !== root) {
        path = node.name + "/" + path;
        node = node.parent;
    }
    return path.slice(0, -1);
}
exports.getPathFromRoot = getPathFromRoot;
function getWorldTransformUntilRoot(target, root, outPos, outRot, outScale) {
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
exports.getWorldTransformUntilRoot = getWorldTransformUntilRoot;
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
var NormalImportSetting;
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
})(NormalImportSetting = exports.NormalImportSetting || (exports.NormalImportSetting = {}));
var TangentImportSetting;
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
})(TangentImportSetting = exports.TangentImportSetting || (exports.TangentImportSetting = {}));
var GltfSemantics = {
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
var v3_1 = new ccm.math.Vec3();
var qt_1 = new ccm.math.Quat();
var v3_2 = new ccm.math.Vec3();
var nd_1 = new ccm.Node();
function getNodePathByTargetName(root, name, path) {
    for (var index = 0; index < root.children.length; index++) {
        var n = root.children[index];
        var pathN = path + "/" + n.name;
        if (n.name === name) {
            return pathN;
        }
        else {
            var path1 = getNodePathByTargetName(n, name, pathN);
            if (path1 !== pathN) {
                return path1;
            }
        }
    }
    return path;
}
exports.getNodePathByTargetName = getNodePathByTargetName;
function do_create(sceneNode, out, model, path) {
    if (model.parent === sceneNode) {
        return;
    }
    var socket = out.find(function (s) { return s.path === path; });
    if (!socket) {
        var target = new ccm.Node();
        target.name = model.parent.name + " Socket";
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
function createSockets(sceneNode, specialNames) {
    if (!sceneNode.getComponentInChildren(ccm.SkinningModelComponent)) {
        return [];
    }
    var renderables = sceneNode.getComponentsInChildren(ccm.RenderableComponent);
    var sockets = [];
    var specialCases = specialNames ? new RegExp(specialNames.reduce(function (acc, cur) { return acc ? acc + "|" + cur : cur; }, '')) : null;
    for (var _i = 0, renderables_1 = renderables; _i < renderables_1.length; _i++) {
        var renderable = renderables_1[_i];
        // general cases
        var model = renderable.node;
        // handle skinning models
        if (renderable instanceof ccm.SkinningModelComponent) {
            var skinningRoot = renderable._skinningRoot;
            if (skinningRoot === sceneNode) {
                continue;
            }
            if (skinningRoot) {
                model = skinningRoot;
            }
        }
        // skip special cases
        var path = getPathFromRoot(model.parent, sceneNode);
        if (specialCases && specialCases.test(path)) {
            continue;
        }
        do_create(sceneNode, sockets, model, path);
    }
    if (specialNames) {
        var targets = specialNames.map(function (n) { return getNodePathByTargetName(sceneNode, n, ''); });
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            if (!target) {
                continue;
            }
            var path = target.slice(1, -specialNames[i].length - 1);
            var model = sceneNode.getChildByPath(target);
            if (model) {
                do_create(sceneNode, sockets, model, path);
            }
        }
    }
    return sockets;
}
exports.createSockets = createSockets;
var GltfConverter = /** @class */ (function () {
    function GltfConverter(_gltf, _buffers, _url) {
        var _this = this;
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
            this._gltf.nodes.forEach(function (node, iNode) {
                if (node.children !== undefined) {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var iChildNode = _a[_i];
                        _this._parents[iChildNode] = iNode;
                    }
                }
            });
        }
        if (this._gltf.skins) {
            this._skinRoots = new Array(this._gltf.skins.length).fill(-1);
        }
        this._nodePathTable = this._createNodePathTable();
    }
    Object.defineProperty(GltfConverter.prototype, "gltf", {
        get: function () {
            return this._gltf;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GltfConverter.prototype, "url", {
        get: function () {
            return this._url;
        },
        enumerable: true,
        configurable: true
    });
    GltfConverter.prototype.createMesh = function (iGltfMesh, options) {
        var _this = this;
        var gltfMesh = this._gltf.meshes[iGltfMesh];
        var bufferBlob = new BufferBlob();
        var vertexBundles = new Array();
        var minPosition = new ccm.math.Vec3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        var maxPosition = new ccm.math.Vec3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        var targetNodeIdx = -1;
        var targetNode = null;
        var targetCCNode = null;
        var idxMap = [];
        if (this._gltf.nodes) {
            targetNodeIdx = this._gltf.nodes.findIndex(function (n) { return n.mesh === iGltfMesh; });
            targetNode = this._gltf.nodes[targetNodeIdx];
        }
        if (targetNode && targetNode.skin !== undefined) {
            this.createSkeleton(targetNode.skin, idxMap);
            targetCCNode = this._createEmptyNode(targetNodeIdx);
        }
        var primitives = gltfMesh.primitives.map(function (gltfPrimitive, primitiveIndex) {
            var _a = _this._readPrimitiveVertices(gltfPrimitive, minPosition, maxPosition, options, targetCCNode, idxMap), vertexBuffer = _a.vertexBuffer, vertexCount = _a.vertexCount, vertexStride = _a.vertexStride, formats = _a.formats, posBuffer = _a.posBuffer, posBufferAlign = _a.posBufferAlign;
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
            var primitive = {
                primitiveMode: _this._getPrimitiveMode(gltfPrimitive.mode),
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
                var indicesAccessor = _this._gltf.accessors[gltfPrimitive.indices];
                var indexStride = _this._getBytesPerAttribute(indicesAccessor);
                var indicesData = new ArrayBuffer(indexStride * indicesAccessor.count);
                _this._readAccessor(indicesAccessor, new DataView(indicesData));
                bufferBlob.setNextAlignment(indexStride);
                primitive.indexView = {
                    offset: bufferBlob.getLength(),
                    length: indicesData.byteLength,
                    count: indicesAccessor.count,
                    stride: _this._getIndexStride(indicesAccessor.componentType),
                };
                bufferBlob.addBuffer(indicesData);
            }
            return primitive;
        });
        var meshStruct = {
            primitives: primitives,
            vertexBundles: vertexBundles,
            minPosition: minPosition,
            maxPosition: maxPosition,
        };
        var mesh = new ccm.Mesh();
        mesh.name = this._getGltfXXName(GltfAssetKind.Mesh, iGltfMesh);
        mesh.assign(meshStruct, bufferBlob.getCombined());
        return mesh;
    };
    GltfConverter.prototype.createSkeleton = function (iGltfSkin, sortMap) {
        var gltfSkin = this._gltf.skins[iGltfSkin];
        var skeleton = new ccm.Skeleton();
        skeleton.name = this._getGltfXXName(GltfAssetKind.Skin, iGltfSkin);
        skeleton._joints = gltfSkin.joints.map(this._getNodePath.bind(this));
        if (gltfSkin.inverseBindMatrices !== undefined) {
            var inverseBindMatricesAccessor = this._gltf.accessors[gltfSkin.inverseBindMatrices];
            if (inverseBindMatricesAccessor.componentType !== WebGLRenderingContext.FLOAT ||
                inverseBindMatricesAccessor.type !== 'MAT4') {
                throw new Error("The inverse bind matrix should be floating-point 4x4 matrix.");
            }
            var m = new ccm.math.Mat4();
            var targetIdx = this._gltf.nodes.findIndex(function (n) { return n.skin === iGltfSkin; });
            var target = targetIdx >= 0 ? this._createEmptyNode(targetIdx) : nd_1;
            ccm.math.Mat4.invert(m, ccm.math.Mat4.fromRTS(m, target._lrot, target._lpos, target._lscale));
            var bindposes = new Array(gltfSkin.joints.length);
            var data = new Float32Array(bindposes.length * 16);
            this._readAccessor(inverseBindMatricesAccessor, createDataViewFromTypedArray(data));
            for (var i = 0; i < bindposes.length; ++i) {
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
    };
    GltfConverter.prototype.getAnimationDuration = function (iGltfAnimation) {
        var _this = this;
        var gltfAnimation = this._gltf.animations[iGltfAnimation];
        var duration = 0;
        gltfAnimation.channels.forEach(function (gltfChannel) {
            var targetNode = gltfChannel.target.node;
            if (targetNode === undefined) {
                // When node isn't defined, channel should be ignored.
                return;
            }
            var sampler = gltfAnimation.samplers[gltfChannel.sampler];
            var inputAccessor = _this._gltf.accessors[sampler.input];
            var channelDuration = inputAccessor.max !== undefined && inputAccessor.max.length === 1 ? Math.fround(inputAccessor.max[0]) : 0;
            duration = Math.max(channelDuration, duration);
        });
        return duration;
    };
    GltfConverter.prototype.createAnimation = function (iGltfAnimation, span) {
        var _this = this;
        var gltfAnimation = this._gltf.animations[iGltfAnimation];
        var curveDatas = {};
        var getCurveData = function (node) {
            var path = _this._getNodePath(node);
            var curveData = curveDatas[path];
            if (curveData === undefined) {
                curveData = {};
                curveDatas[path] = curveData;
            }
            return curveData;
        };
        var duration = 0;
        var keys = new Array();
        var keysSplitInfos = new Array();
        var floatingIndexOf = function (value, values) {
            var iPast = values.findIndex(function (v) { return v >= value; });
            if (iPast < 0) {
                return values.length - 1;
            }
            else if (iPast === 0) {
                return 0;
            }
            else {
                var iBefore = iPast - 1;
                var before = values[iBefore];
                var past = values[iPast];
                var ratio = (value - before) / (past - before);
                return iBefore + ratio;
            }
        };
        var keysMap = new Map();
        var getKeysIndex = function (iInputAccessor) {
            var i = keysMap.get(iInputAccessor);
            if (i === undefined) {
                var inputAccessor = _this._gltf.accessors[iInputAccessor];
                var inputs = _this._readAccessorIntoArray(inputAccessor);
                i = keys.length;
                var intputArray = Array.from(inputs);
                if (span) {
                    var splitInfo = {
                        from: floatingIndexOf(span.from, intputArray),
                        to: floatingIndexOf(span.to, intputArray),
                    };
                    keysSplitInfos.push(splitInfo);
                    var splitKeys = _this._split(intputArray, splitInfo.from, splitInfo.to, function (from, to, ratio) {
                        return from + (to - from) * ratio;
                    });
                    keys.push(splitKeys.map(function (splitKey) { return splitKey - span.from; }));
                }
                else {
                    keys.push(intputArray);
                }
                keysMap.set(iInputAccessor, i);
            }
            return i;
        };
        gltfAnimation.channels.forEach(function (gltfChannel) {
            var targetNode = gltfChannel.target.node;
            if (targetNode === undefined) {
                // When node isn't defined, channel should be ignored.
                return;
            }
            var curveData = getCurveData(targetNode);
            var sampler = gltfAnimation.samplers[gltfChannel.sampler];
            var iKeys = getKeysIndex(sampler.input);
            var keysSplitInfo = span ? keysSplitInfos[iKeys] : undefined;
            _this._gltfChannelToCurveData(gltfAnimation, gltfChannel, curveData, iKeys, keysSplitInfo);
            var inputAccessor = _this._gltf.accessors[sampler.input];
            var channelDuration = inputAccessor.max !== undefined && inputAccessor.max.length === 1 ? Math.fround(inputAccessor.max[0]) : 0;
            duration = Math.max(channelDuration, duration);
        });
        if (this._gltf.nodes) {
            var r_1 = new ccm.math.Quat();
            var t_1 = new ccm.math.Vec3();
            var s_1 = new ccm.math.Vec3();
            this._gltf.nodes.forEach(function (node, nodeIndex) {
                var curveData = getCurveData(nodeIndex);
                curveData.props = curveData.props || {};
                var m;
                if (node.matrix) {
                    m = _this._readNodeMatrix(node.matrix);
                    ccm.math.Mat4.toRTS(m, r_1, t_1, s_1);
                }
                if (!Reflect.has(curveData.props, 'position')) {
                    var v = new ccm.math.Vec3();
                    if (node.translation) {
                        ccm.math.Vec3.set(v, node.translation[0], node.translation[1], node.translation[2]);
                    }
                    else if (m) {
                        ccm.math.Vec3.copy(v, t_1);
                    }
                    curveData.props.position = {
                        blending: 'additive3D',
                        keys: -1,
                        values: [v],
                    };
                }
                if (!Reflect.has(curveData.props, 'scale')) {
                    var v = new ccm.math.Vec3(1, 1, 1);
                    if (node.scale) {
                        ccm.math.Vec3.set(v, node.scale[0], node.scale[1], node.scale[2]);
                    }
                    else if (m) {
                        ccm.math.Vec3.copy(v, s_1);
                    }
                    curveData.props.scale = {
                        blending: 'additive3D',
                        keys: -1,
                        values: [v],
                    };
                }
                if (!Reflect.has(curveData.props, 'rotation')) {
                    var v = new ccm.math.Quat();
                    if (node.rotation) {
                        _this._getNodeRotation(node.rotation, v);
                    }
                    else if (m) {
                        ccm.math.Quat.copy(v, r_1);
                    }
                    curveData.props.rotation = {
                        blending: 'additiveQuat',
                        keys: -1,
                        values: [v],
                    };
                }
            });
        }
        var animationClip = new ccm.SkeletalAnimationClip();
        animationClip.name = this._getGltfXXName(GltfAssetKind.Animation, iGltfAnimation);
        animationClip.curveDatas = curveDatas;
        animationClip.wrapMode = ccm.AnimationClip.WrapMode.Loop;
        animationClip.duration = span ? (span.to - span.from) : duration;
        animationClip.keys = keys;
        animationClip.sample = 30;
        return animationClip;
    };
    GltfConverter.prototype.createMaterial = function (iGltfMaterial, gltfAssetFinder, effectGetter) {
        var gltfMaterial = this._gltf.materials[iGltfMaterial];
        var material = new ccm.Material();
        material.name = this._getGltfXXName(GltfAssetKind.Material, iGltfMaterial);
        material._effectAsset = effectGetter('db://internal/effects/builtin-standard.effect');
        var defines = {};
        var props = {};
        var states = {
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
        var shaderDefines = [
            { name: 'ROUGHNESS_CHANNEL', options: ['r'] },
            { name: 'METALLIC_CHANNEL', options: ['g'] },
            { name: 'OCCLUSION_CHANNEL', options: ['b'] },
        ];
        var properties = {
            pbrParams: { value: [0.8, 0.6, 1.0, 1.0] },
            pbrScale: { value: [1.0, 1.0, 1.0, 1.0] },
            albedoScale: { value: [1.0, 1.0, 1.0, 1.0] },
        };
        /* */
        var _channelMap = { r: 0, g: 1, b: 2, a: 3 };
        var O = _channelMap[shaderDefines.find(function (d) { return d.name === 'OCCLUSION_CHANNEL'; }).options[0]];
        var R = _channelMap[shaderDefines.find(function (d) { return d.name === 'ROUGHNESS_CHANNEL'; }).options[0]];
        var M = _channelMap[shaderDefines.find(function (d) { return d.name === 'METALLIC_CHANNEL'; }).options[0]];
        var pbrParams = properties['pbrParams'].value;
        props['pbrParams'] = new ccm.math.Vec4(pbrParams[O], pbrParams[R], pbrParams[M], pbrParams[3]);
        var pbrScale = properties['pbrScale'].value;
        props['pbrScale'] = new ccm.math.Vec4(pbrScale[O], pbrScale[R], pbrScale[M], pbrScale[3]);
        var albedoScale = properties['albedoScale'].value;
        props['albedoScale'] = new ccm.math.Vec4(albedoScale[0], albedoScale[1], albedoScale[2], albedoScale[3]);
        if (gltfMaterial.pbrMetallicRoughness) {
            var pbrMetallicRoughness = gltfMaterial.pbrMetallicRoughness;
            if (pbrMetallicRoughness.baseColorTexture !== undefined) {
                defines['USE_ALBEDO_MAP'] = true;
                props['albedoMap'] = gltfAssetFinder.find(AssetFinderKind.texture, pbrMetallicRoughness.baseColorTexture.index);
            }
            if (pbrMetallicRoughness.baseColorFactor) {
                var c = pbrMetallicRoughness.baseColorFactor;
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
            var pbrOcclusionTexture = gltfMaterial.occlusionTexture;
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
            var pbrNormalTexture = gltfMaterial.normalTexture;
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
            var v = gltfMaterial.emissiveFactor;
            props['emissiveScale'] = new ccm.math.Vec4(v[0], v[1], v[2], 1);
        }
        if (gltfMaterial.doubleSided) {
            states.rasterizerState.cullMode = ccm.GFXCullMode.NONE;
        }
        switch (gltfMaterial.alphaMode) {
            case 'BLEND':
                var blendState = states.blendState.targets[0];
                blendState.blend = true;
                blendState.blendSrc = ccm.GFXBlendFactor.SRC_ALPHA;
                blendState.blendDst = ccm.GFXBlendFactor.ONE_MINUS_SRC_ALPHA;
                blendState.blendDstAlpha = ccm.GFXBlendFactor.ONE_MINUS_SRC_ALPHA;
                states.depthStencilState.depthWrite = false;
                break;
            case 'MASK':
                var alphaCutoff = gltfMaterial.alphaCutoff === undefined ? 0.5 : gltfMaterial.alphaCutoff;
                defines['USE_ALPHA_TEST'] = true;
                props['albedoScale'].w = alphaCutoff;
                break;
            case 'OPAQUE':
            case undefined:
                break;
            default:
                console.warn("Alpha mode " + gltfMaterial.alphaMode + " " +
                    ("(for material named " + gltfMaterial.name + ", gltf-index " + iGltfMaterial + ") ") +
                    "is not supported currently.");
                break;
        }
        material._defines = [defines];
        material._props = [props];
        material._states = [states];
        return material;
    };
    GltfConverter.prototype.getTextureParameters = function (gltfTexture) {
        var _this = this;
        var convertWrapMode = function (gltfWrapMode) {
            if (gltfWrapMode === undefined) {
                gltfWrapMode = 10497 /* __DEFAULT */;
            }
            switch (gltfWrapMode) {
                case 33071 /* CLAMP_TO_EDGE */: return ccm.TextureBase.WrapMode.CLAMP_TO_EDGE;
                case 33648 /* MIRRORED_REPEAT */: return ccm.TextureBase.WrapMode.MIRRORED_REPEAT;
                case 10497 /* REPEAT */: return ccm.TextureBase.WrapMode.REPEAT;
                default:
                    console.error("Unsupported wrapMode: " + gltfWrapMode + ", 'repeat' is used.(in " + _this.url + ")");
                    return ccm.TextureBase.WrapMode.REPEAT;
            }
        };
        var convertMagFilter = function (gltfFilter) {
            switch (gltfFilter) {
                case 9728 /* NEAREST */: return ccm.TextureBase.Filter.NEAREST;
                case 9729 /* LINEAR */: return ccm.TextureBase.Filter.LINEAR;
                default:
                    console.warn("Unsupported filter: " + gltfFilter + ", 'linear' is used.(in " + _this.url + ")");
                    return ccm.TextureBase.Filter.LINEAR;
            }
        };
        var convertMinFilter = function (gltfFilter) {
            switch (gltfFilter) {
                case 9728 /* NEAREST */: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.NONE];
                case 9729 /* LINEAR */: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NONE];
                case 9984 /* NEAREST_MIPMAP_NEAREST */: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.NEAREST];
                case 9985 /* LINEAR_MIPMAP_NEAREST */: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NEAREST];
                case 9986 /* NEAREST_MIPMAP_LINEAR */: return [ccm.TextureBase.Filter.NEAREST, ccm.TextureBase.Filter.LINEAR];
                case 9987 /* LINEAR_MIPMAP_LINEAR */: return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.LINEAR];
                default:
                    console.warn("Unsupported filter: " + gltfFilter + ", 'linear' is used.(in " + _this.url + ")");
                    return [ccm.TextureBase.Filter.LINEAR, ccm.TextureBase.Filter.NONE];
            }
        };
        var result = {};
        if (gltfTexture.sampler === undefined) {
            result.wrapModeS = ccm.TextureBase.WrapMode.REPEAT;
            result.wrapModeT = ccm.TextureBase.WrapMode.REPEAT;
        }
        else {
            var gltfSampler = this._gltf.samplers[gltfTexture.sampler];
            result.wrapModeS = convertWrapMode(gltfSampler.wrapS);
            result.wrapModeT = convertWrapMode(gltfSampler.wrapT);
            if (gltfSampler.magFilter !== undefined) {
                result.magFilter = convertMagFilter(gltfSampler.magFilter);
            }
            if (gltfSampler.minFilter !== undefined) {
                var _a = convertMinFilter(gltfSampler.minFilter), min = _a[0], mip = _a[1];
                result.minFilter = min;
                result.mipFilter = mip;
            }
        }
        return result;
    };
    GltfConverter.prototype.createScene = function (iGltfScene, gltfAssetFinder, withTransform) {
        if (withTransform === void 0) { withTransform = true; }
        return this._getSceneNode(iGltfScene, gltfAssetFinder, withTransform);
    };
    GltfConverter.prototype.readImage = function (gltfImage, glTFUri, glTFHost) {
        return __awaiter(this, void 0, void 0, function () {
            var imageUri, imageUriAbs, bufferView;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        imageUri = gltfImage.uri;
                        if (!(imageUri !== undefined)) return [3 /*break*/, 5];
                        if (!!isDataUri(imageUri)) return [3 /*break*/, 2];
                        imageUriAbs = resolveGLTFUri(glTFUri, imageUri);
                        return [4 /*yield*/, this._readImageByFsPath(imageUriAbs, glTFHost)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this._readImageByDataUri(imageUri)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        if (!(gltfImage.bufferView !== undefined)) return [3 /*break*/, 7];
                        bufferView = this._gltf.bufferViews[gltfImage.bufferView];
                        return [4 /*yield*/, this._readImageInBufferview(bufferView, gltfImage.mimeType)];
                    case 6: return [2 /*return*/, _a.sent()];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    GltfConverter.prototype._getNodeRotation = function (rotation, out) {
        ccm.math.Quat.set(out, rotation[0], rotation[1], rotation[2], rotation[3]);
        ccm.math.Quat.normalize(out, out);
        return out;
    };
    GltfConverter.prototype._gltfChannelToCurveData = function (gltfAnimation, gltfChannel, curveData, iKeys, span) {
        var propName;
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
            console.error("Unsupported channel target path '" + gltfChannel.target.path + "'.(in " + this.url + ")");
            return 0;
        }
        var gltfSampler = gltfAnimation.samplers[gltfChannel.sampler];
        var outputs = this._readAccessorIntoArray(this._gltf.accessors[gltfSampler.output]);
        if (!(outputs instanceof Float32Array)) {
            var normalizedOutput = new Float32Array(outputs.length);
            var normalize = (function () {
                if (outputs instanceof Int8Array) {
                    return function (value) {
                        return Math.max(value / 127.0, -1.0);
                    };
                }
                else if (outputs instanceof Uint8Array) {
                    return function (value) {
                        return value / 255.0;
                    };
                }
                else if (outputs instanceof Int16Array) {
                    return function (value) {
                        return Math.max(value / 32767.0, -1.0);
                    };
                }
                else if (outputs instanceof Uint16Array) {
                    return function (value) {
                        return value / 65535.0;
                    };
                }
                else {
                    return function (value) {
                        return value;
                    };
                }
            })();
            for (var i = 0; i < outputs.length; ++i) {
                normalizedOutput[i] = normalize(outputs[i]); // Do normalize.
            }
            outputs = normalizedOutput;
        }
        var values = [];
        var blendingFunctionName = null;
        var valueConstructor = null;
        if (propName === 'position' || propName === 'scale') {
            valueConstructor = ccm.math.Vec3;
            values = new Array(outputs.length / 3);
            for (var i = 0; i < values.length; ++i) {
                values[i] = new ccm.math.Vec3(outputs[i * 3 + 0], outputs[i * 3 + 1], outputs[i * 3 + 2]);
            }
            blendingFunctionName = 'additive3D';
        }
        else if (propName === 'rotation') {
            valueConstructor = ccm.math.Quat;
            values = new Array(outputs.length / 4);
            for (var i = 0; i < values.length; ++i) {
                values[i] = new ccm.math.Quat(outputs[i * 4 + 0], outputs[i * 4 + 1], outputs[i * 4 + 2], outputs[i * 4 + 3]);
            }
            blendingFunctionName = 'additiveQuat';
        }
        curveData.props = curveData.props || {};
        var result = {
            keys: iKeys, blending: blendingFunctionName, values: values,
        };
        switch (gltfSampler.interpolation) {
            case 'STEP':
                result.interpolate = false;
                if (span) {
                    result.values = this._split(result.values, span.from, span.to, function (from) { return from; });
                }
                break;
            case 'CUBICSPLINE':
                if (valueConstructor) {
                    result.interpolate = true;
                    var cubicSplineValueConstructor = (valueConstructor === ccm.math.Vec3) ?
                        ccm.CubicSplineVec3Value : ccm.CubicSplineQuatValue;
                    var csValues = new Array(result.values.length / 3);
                    for (var i = 0; i < csValues.length; ++i) {
                        csValues[i] = new cubicSplineValueConstructor(result.values[i * 3 + 0], result.values[i * 3 + 1], result.values[i * 3 + 2]);
                    }
                    result.values = csValues;
                    if (span) {
                        console.error("We currently do not support split animation with cubic-spline interpolation.");
                    }
                }
                break;
            case 'LINEAR':
            default:
                result.interpolate = true;
                if (span) {
                    var lerpFx = void 0;
                    switch (propName) {
                        case 'position':
                        case 'scale':
                            lerpFx = function (from, to, ratio) { return ccm.math.Vec3.lerp(new ccm.math.Vec3(), from, to, ratio); };
                            break;
                        case 'rotation':
                            lerpFx = function (from, to, ratio) { return ccm.math.Quat.lerp(new ccm.math.Quat(), from, to, ratio); };
                            break;
                        default:
                            lerpFx = function (from) { return from; };
                    }
                    result.values = this._split(result.values, span.from, span.to, lerpFx);
                }
                break;
        }
        curveData.props[propName] = result;
    };
    GltfConverter.prototype._split = function (array, from, to, lerp) {
        var first;
        var iNext = 0;
        {
            var before = Math.trunc(from);
            var ratio = from - before;
            if (ratio === 0) {
                iNext = before;
            }
            else {
                var past = before + 1;
                first = lerp(array[before], array[past], ratio);
                iNext = past;
            }
        }
        var last;
        var iEnd = 0;
        {
            var before = Math.trunc(to);
            var ratio = to - before;
            if (ratio === 0) {
                iEnd = before;
            }
            else {
                var past = before + 1;
                last = lerp(array[before], array[past], ratio);
                iEnd = before;
            }
        }
        var result = array.slice(iNext, iEnd + 1);
        if (first) {
            result.unshift(first);
        }
        if (last) {
            result.push(last);
        }
        return result;
    };
    GltfConverter.prototype._getParent = function (node) {
        return this._parents[node];
    };
    GltfConverter.prototype._commonRoot = function (nodes) {
        var _this = this;
        var minPathLen = Infinity;
        var paths = nodes.map(function (node) {
            var path = [];
            var curNode = node;
            while (curNode >= 0) {
                path.unshift(curNode);
                curNode = _this._getParent(curNode);
            }
            minPathLen = Math.min(minPathLen, path.length);
            return path;
        });
        if (paths.length === 0) {
            return -1;
        }
        var commonPath = [];
        var _loop_1 = function (i) {
            var n = paths[0][i];
            if (paths.every(function (path) { return path[i] === n; })) {
                commonPath.push(n);
            }
            else {
                return "break";
            }
        };
        for (var i = 0; i < minPathLen; ++i) {
            var state_1 = _loop_1(i);
            if (state_1 === "break")
                break;
        }
        if (commonPath.length === 0) {
            return -1;
        }
        return commonPath[commonPath.length - 1];
    };
    GltfConverter.prototype._getSkinRoot = function (skin) {
        var result = this._skinRoots[skin];
        if (result < 0) {
            result = this._commonRoot(this._gltf.skins[skin].joints);
            if (result < 0) {
                throw new Error("Non-conforming glTf: skin joints do not have a common root(they are not under same scene).");
            }
        }
        return result;
    };
    GltfConverter.prototype._checkTangentImportSetting = function (setting, gltfPrimitive) {
        var recalcNeeded = (setting === TangentImportSetting.recalculate) ||
            (setting === TangentImportSetting.require && !Reflect.has(gltfPrimitive.attributes, "TANGENT" /* TANGENT */));
        if (recalcNeeded && !Reflect.has(gltfPrimitive.attributes, "TEXCOORD_0" /* TEXCOORD_0 */)) {
            console.warn("Tangent caculation is needed but the mesh has no uv information, " +
                ("the tangent attribute will be excluded therefor.(in glTf file: " + this.url + ")"));
            return TangentImportSetting.exclude;
        }
        else {
            return setting;
        }
    };
    GltfConverter.prototype._readPrimitiveVertices = function (gltfPrimitive, minPosition, maxPosition, options, targetNode, idxMap) {
        var _this = this;
        options.tangents = this._checkTangentImportSetting(options.tangents, gltfPrimitive);
        var attributeNames = Object.getOwnPropertyNames(gltfPrimitive.attributes);
        // 统计出所有需要导出的属性，并计算它们在顶点缓冲区中的偏移以及整个顶点缓冲区的容量。
        var vertexStride = 0;
        var vertexCount = 0;
        var recalcNormal = options.normals === NormalImportSetting.recalculate || options.normals === NormalImportSetting.require;
        var recalcTangent = options.tangents === TangentImportSetting.recalculate || options.tangents === TangentImportSetting.require;
        var exportingAttributes = [];
        for (var _i = 0, attributeNames_1 = attributeNames; _i < attributeNames_1.length; _i++) {
            var attributeName = attributeNames_1[_i];
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
            var attributeAccessor = this._gltf.accessors[gltfPrimitive.attributes[attributeName]];
            var attributeByteLength = this._getBytesPerAttribute(attributeAccessor);
            vertexStride += attributeByteLength;
            // Validator: MESH_PRIMITIVE_UNEQUAL_ACCESSOR_COUNT
            vertexCount = attributeAccessor.count;
            exportingAttributes.push({
                name: attributeName,
                byteLength: attributeByteLength,
            });
        }
        var normalOffset = -1;
        if (recalcNormal) {
            normalOffset = vertexStride;
            vertexStride += 4 * 3;
        }
        var tangentOffset = -1;
        if (recalcTangent) {
            tangentOffset = vertexStride;
            vertexStride += 4 * 4;
        }
        // 创建顶点缓冲区。
        var vertexBuffer = new ArrayBuffer(vertexStride * vertexCount);
        // 写入属性。
        var currentByteOffset = 0;
        var posBuffer = new ArrayBuffer(0);
        var posBufferAlign = 0;
        var formats = [];
        var v3_1 = new ccm.math.Vec3();
        var m4_1 = new ccm.math.Mat4();
        for (var _a = 0, exportingAttributes_1 = exportingAttributes; _a < exportingAttributes_1.length; _a++) {
            var exportingAttribute = exportingAttributes_1[_a];
            var attributeName = exportingAttribute.name;
            var attributeAccessor = this._gltf.accessors[gltfPrimitive.attributes[attributeName]];
            var dataView = new DataView(vertexBuffer, currentByteOffset);
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
                var comps = this._getComponentsPerAttribute(attributeAccessor.type);
                var bytes = this._getBytesPerComponent(attributeAccessor.componentType);
                posBuffer = new ArrayBuffer(comps * bytes * attributeAccessor.count);
                posBufferAlign = bytes;
                this._readAccessor(attributeAccessor, new DataView(posBuffer));
            }
            if (targetNode) {
                // pre-apply local transform to mesh
                if (attributeName === "POSITION" /* POSITION */) {
                    var reader = this._getComponentReader(attributeAccessor.componentType);
                    var writer = this._getComponentWriter(attributeAccessor.componentType);
                    ccm.math.Mat4.fromRTS(m4_1, targetNode._lrot, targetNode._lpos, targetNode._lscale);
                    var comps = this._getComponentsPerAttribute(attributeAccessor.type);
                    var bytes = this._getBytesPerComponent(attributeAccessor.componentType);
                    var posBufferView = new DataView(posBuffer);
                    var posBufferStride = comps * bytes;
                    for (var iVert = 0; iVert < vertexCount; ++iVert) {
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
                        var aabb = ccm.geometry.aabb.fromPoints(ccm.geometry.aabb.create(), minPosition, maxPosition);
                        aabb.transform(m4_1, targetNode._lpos, targetNode._lrot, targetNode._lscale, aabb);
                        aabb.getBoundary(minPosition, maxPosition);
                    }
                }
                if (attributeName === "NORMAL" /* NORMAL */ || attributeName === "TANGENT" /* TANGENT */) {
                    var reader = this._getComponentReader(attributeAccessor.componentType);
                    var writer = this._getComponentWriter(attributeAccessor.componentType);
                    for (var iVert = 0; iVert < vertexCount; ++iVert) {
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
                    var ws = new Array(4);
                    var reader = this._getComponentReader(attributeAccessor.componentType);
                    var writer = this._getComponentWriter(attributeAccessor.componentType);
                    for (var iVert = 0; iVert < vertexCount; ++iVert) {
                        var sum = 0.0;
                        for (var iw = 0; iw < 4; ++iw) {
                            var w = reader(dataView, vertexStride * iVert + iw * 4);
                            ws[iw] = w;
                            sum += w;
                        }
                        if (sum !== 1.0 && sum !== 0.0) {
                            for (var iw = 0; iw < 4; ++iw) {
                                var normalizedWeight = ws[iw] / sum;
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
        var appendVertexStreamF = function (semantic, offset, data) {
            var nComponent = _this._getComponentsPerAttribute(semantic.type);
            var dataView = new DataView(vertexBuffer, offset);
            for (var iVertex = 0; iVertex < vertexCount; ++iVertex) {
                for (var i = 0; i < nComponent; ++i) {
                    var v = data[iVertex * nComponent + i];
                    dataView.setFloat32(iVertex * vertexStride + i * 4, v, ccUseLittleEndian);
                }
            }
            formats.push({
                name: _this._getGfxAttributeName(semantic.name),
                format: _this._getAttributeFormat(5126 /* FLOAT */, semantic.type),
                isNormalized: false,
            });
        };
        var primitiveViewer;
        var getPrimitiveViewer = function () {
            if (primitiveViewer === undefined) {
                primitiveViewer = _this._makePrimitiveViewer(gltfPrimitive);
            }
            return primitiveViewer;
        };
        var normals;
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
            var tangents = calculateTangents(getPrimitiveViewer(), normals);
            appendVertexStreamF(GltfSemantics.tangent, tangentOffset, tangents);
        }
        return {
            vertexBuffer: vertexBuffer,
            vertexCount: vertexCount,
            vertexStride: vertexStride,
            formats: formats,
            posBuffer: posBuffer,
            posBufferAlign: posBufferAlign,
        };
    };
    GltfConverter.prototype._readImageByFsPath = function (imagePath, glTFHost) {
        return __awaiter(this, void 0, void 0, function () {
            var dot, _a, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        dot = imagePath.lastIndexOf('.');
                        _a = {};
                        _b = DataView.bind;
                        return [4 /*yield*/, glTFHost.readBuffer(imagePath)];
                    case 1: return [2 /*return*/, (_a.imageData = new (_b.apply(DataView, [void 0, _c.sent()]))(),
                            _a.extName = dot >= 0 ? imagePath.substr(dot + 1) : '',
                            _a)];
                    case 2:
                        error_1 = _c.sent();
                        console.warn("Failed to load texture with path: " + imagePath);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GltfConverter.prototype._makePrimitiveViewer = function (gltfPrimitive) {
        var _this = this;
        var primitiveMode = gltfPrimitive.mode === undefined ? 4 /* __DEFAULT */ : gltfPrimitive.mode;
        if (primitiveMode !== 4 /* TRIANGLES */) {
            throw new Error("Normals calculation needs triangle primitive.");
        }
        var vertexCount = 0;
        var attributeNames = Object.keys(gltfPrimitive.attributes);
        if (attributeNames.length !== 0) {
            vertexCount = this._gltf.accessors[gltfPrimitive.attributes[attributeNames[0]]].count;
        }
        var faces;
        if (gltfPrimitive.indices === undefined) {
            faces = new Float32Array(vertexCount);
            for (var i = 0; i < faces.length; ++i) {
                faces[i] = i;
            }
        }
        else {
            var indicesAccessor = this._gltf.accessors[gltfPrimitive.indices];
            faces = this._readAccessorIntoArray(indicesAccessor);
        }
        var nFaces = Math.floor(faces.length / 3);
        var cachedAttributes = new Map();
        var getAttributes = function (name) {
            var result = cachedAttributes.get(name);
            if (result === undefined) {
                if (!Reflect.has(gltfPrimitive.attributes, name)) {
                    throw new Error("Tangent calculation needs " + name + ".");
                }
                result = _this._readAccessorIntoArray(_this._gltf.accessors[gltfPrimitive.attributes[name]]);
                cachedAttributes.set(name, result);
            }
            return result;
        };
        var getVertexCount = function () { return vertexCount; };
        var getFaces = function () { return faces; };
        var getFaceCount = function () { return nFaces; };
        var getPositions = function () {
            return getAttributes("POSITION" /* POSITION */);
        };
        var getNormals = function () {
            return getAttributes("NORMAL" /* NORMAL */);
        };
        var getUVs = function () {
            return getAttributes("TEXCOORD_0" /* TEXCOORD_0 */);
        };
        return {
            getVertexCount: getVertexCount,
            getPositions: getPositions,
            getFaces: getFaces,
            getFaceCount: getFaceCount,
            getNormals: getNormals,
            getUVs: getUVs,
        };
    };
    GltfConverter.prototype._readAccessorIntoArray = function (gltfAccessor) {
        var storageConstructor = this._getAttributeBaseTypeStorage(gltfAccessor.componentType);
        var result = new storageConstructor(gltfAccessor.count * this._getComponentsPerAttribute(gltfAccessor.type));
        this._readAccessor(gltfAccessor, createDataViewFromTypedArray(result));
        return result;
    };
    GltfConverter.prototype._readImageByDataUri = function (dataUri) {
        var result = data_uri_utils_1.decodeImageDataURI(dataUri);
        if (!result) {
            return undefined;
        }
        var x = result.imageType.split('/');
        if (x.length === 0) {
            console.error("Bad data uri." + dataUri);
            return undefined;
        }
        return {
            extName: "." + x[x.length - 1],
            imageData: new DataView(result.data.buffer, result.data.byteOffset, result.data.byteLength),
        };
    };
    GltfConverter.prototype._readImageInBufferview = function (bufferView, mimeType) {
        var extName = '';
        switch (mimeType) {
            case 'image/jpeg':
                extName = '.jpg';
                break;
            case 'image/png':
                extName = '.png';
                break;
            default:
                throw new Error("Bad MIME Type " + mimeType);
        }
        var buffer = this._buffers[bufferView.buffer];
        var imageData = new DataView(buffer.buffer, buffer.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
        return {
            extName: extName,
            imageData: imageData,
        };
    };
    GltfConverter.prototype._getSceneNode = function (iGltfScene, gltfAssetFinder, withTransform) {
        var _this = this;
        if (withTransform === void 0) { withTransform = true; }
        var sceneName = this._getGltfXXName(GltfAssetKind.Scene, iGltfScene);
        var result = new ccm.Node(sceneName);
        var gltfScene = this._gltf.scenes[iGltfScene];
        if (gltfScene.nodes !== undefined) {
            var mapping_1 = new Array(this._gltf.nodes.length).fill(null);
            for (var _i = 0, _a = gltfScene.nodes; _i < _a.length; _i++) {
                var node = _a[_i];
                var root = this._createEmptyNodeRecursive(node, mapping_1, withTransform);
                root.parent = result;
            }
            mapping_1.forEach(function (node, iGltfNode) {
                _this._setupNode(iGltfNode, mapping_1, gltfAssetFinder);
            });
            // update skinning root to animation root node
            result.getComponentsInChildren(ccm.SkinningModelComponent).forEach(function (comp) { return comp._skinningRoot = result; });
        }
        return result;
    };
    GltfConverter.prototype._createEmptyNodeRecursive = function (iGltfNode, mapping, withTransform) {
        if (withTransform === void 0) { withTransform = true; }
        var gltfNode = this._gltf.nodes[iGltfNode];
        var result = this._createEmptyNode(iGltfNode, withTransform);
        if (gltfNode.children !== undefined) {
            for (var _i = 0, _a = gltfNode.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var childResult = this._createEmptyNodeRecursive(child, mapping, withTransform);
                childResult.parent = result;
            }
        }
        mapping[iGltfNode] = result;
        return result;
    };
    GltfConverter.prototype._setupNode = function (iGltfNode, mapping, gltfAssetFinder) {
        var node = mapping[iGltfNode];
        if (node === null) {
            return;
        }
        var gltfNode = this._gltf.nodes[iGltfNode];
        if (gltfNode.mesh !== undefined) {
            var modelComponent = null;
            if (gltfNode.skin === undefined) {
                modelComponent = node.addComponent(ccm.ModelComponent);
            }
            else {
                var skinningModelComponent = node.addComponent(ccm.SkinningModelComponent);
                var skeleton = gltfAssetFinder.find(AssetFinderKind.skeleton, gltfNode.skin);
                if (skeleton) {
                    skinningModelComponent._skeleton = skeleton;
                }
                var skinRoot = mapping[this._getSkinRoot(gltfNode.skin)];
                if (skinRoot === null) {
                    console.error("glTf requires that skin joints must exists in same scene as node references it.");
                }
                else {
                    // assign a temporary root
                    skinningModelComponent._skinningRoot = skinRoot;
                }
                modelComponent = skinningModelComponent;
            }
            var mesh = gltfAssetFinder.find(AssetFinderKind.mesh, gltfNode.mesh);
            if (mesh) {
                modelComponent._mesh = mesh;
            }
            var gltfMesh = this.gltf.meshes[gltfNode.mesh];
            var materials = gltfMesh.primitives.map(function (gltfPrimitive) {
                if (gltfPrimitive.material === undefined) {
                    return null;
                }
                else {
                    var material = gltfAssetFinder.find(AssetFinderKind.material, gltfPrimitive.material);
                    if (material) {
                        return material;
                    }
                }
                return null;
            });
            modelComponent._materials = materials;
        }
    };
    GltfConverter.prototype._createEmptyNode = function (iGltfNode, withTransform) {
        if (withTransform === void 0) { withTransform = true; }
        var gltfNode = this._gltf.nodes[iGltfNode];
        var nodeName = this._getGltfXXName(GltfAssetKind.Node, iGltfNode);
        var node = new ccm.Node(nodeName);
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
            var ns = gltfNode.matrix;
            var m = this._readNodeMatrix(ns);
            var t = new ccm.math.Vec3();
            var r = new ccm.math.Quat();
            var s = new ccm.math.Vec3();
            ccm.math.Mat4.toRTS(m, r, t, s);
            node.setPosition(t);
            node.setRotation(r);
            node.setScale(s);
        }
        return node;
    };
    GltfConverter.prototype._readNodeMatrix = function (ns) {
        return new ccm.math.Mat4(ns[0], ns[1], ns[2], ns[3], ns[4], ns[5], ns[6], ns[7], ns[8], ns[9], ns[10], ns[11], ns[12], ns[13], ns[14], ns[15]);
    };
    GltfConverter.prototype._getNodePath = function (node) {
        if (this._nodePathTable == null) {
            this._nodePathTable = this._createNodePathTable();
        }
        return this._nodePathTable[node];
    };
    GltfConverter.prototype._createNodePathTable = function () {
        var _this = this;
        if (this._gltf.nodes === undefined) {
            return [];
        }
        var parentTable = new Array(this._gltf.nodes.length).fill(-1);
        this._gltf.nodes.forEach(function (gltfNode, nodeIndex) {
            if (gltfNode.children) {
                gltfNode.children.forEach(function (iChildNode) {
                    parentTable[iChildNode] = nodeIndex;
                });
                var names = gltfNode.children.map(function (iChildNode) {
                    var childNode = _this._gltf.nodes[iChildNode];
                    var name = childNode.name;
                    if (typeof name !== 'string' || name.length === 0) {
                        name = null;
                    }
                    return name;
                });
                var uniqueNames = makeUniqueNames(names, uniqueChildNodeNameGenerator);
                uniqueNames.forEach(function (uniqueName, iUniqueName) {
                    _this._gltf.nodes[gltfNode.children[iUniqueName]].name = uniqueName;
                });
            }
        });
        var nodeNames = new Array(this._gltf.nodes.length).fill('');
        for (var iNode = 0; iNode < nodeNames.length; ++iNode) {
            nodeNames[iNode] = this._getGltfXXName(GltfAssetKind.Node, iNode);
        }
        var result = new Array(this._gltf.nodes.length).fill('');
        this._gltf.nodes.forEach(function (gltfNode, nodeIndex) {
            var segments = [];
            for (var i = nodeIndex; i >= 0; i = parentTable[i]) {
                segments.unshift(nodeNames[i]);
            }
            result[nodeIndex] = segments.join('/');
        });
        return result;
    };
    GltfConverter.prototype._readAccessor = function (gltfAccessor, outputBuffer, outputStride) {
        if (outputStride === void 0) { outputStride = 0; }
        if (gltfAccessor.bufferView === undefined) {
            console.warn("Note, there is an accessor assiociating with no buffer view in file " + this.url + ".");
            return;
        }
        var gltfBufferView = this._gltf.bufferViews[gltfAccessor.bufferView];
        var componentsPerAttribute = this._getComponentsPerAttribute(gltfAccessor.type);
        var bytesPerElement = this._getBytesPerComponent(gltfAccessor.componentType);
        if (outputStride === 0) {
            outputStride = componentsPerAttribute * bytesPerElement;
        }
        var inputStartOffset = (gltfAccessor.byteOffset !== undefined ? gltfAccessor.byteOffset : 0) +
            (gltfBufferView.byteOffset !== undefined ? gltfBufferView.byteOffset : 0);
        var inputBuffer = createDataViewFromBuffer(this._buffers[gltfBufferView.buffer], inputStartOffset);
        var inputStride = gltfBufferView.byteStride !== undefined ?
            gltfBufferView.byteStride : componentsPerAttribute * bytesPerElement;
        var componentReader = this._getComponentReader(gltfAccessor.componentType);
        var componentWriter = this._getComponentWriter(gltfAccessor.componentType);
        for (var iAttribute = 0; iAttribute < gltfAccessor.count; ++iAttribute) {
            var i = createDataViewFromTypedArray(inputBuffer, inputStride * iAttribute);
            var o = createDataViewFromTypedArray(outputBuffer, outputStride * iAttribute);
            for (var iComponent = 0; iComponent < componentsPerAttribute; ++iComponent) {
                var componentBytesOffset = bytesPerElement * iComponent;
                var value = componentReader(i, componentBytesOffset);
                componentWriter(o, componentBytesOffset, value);
            }
        }
    };
    GltfConverter.prototype._getPrimitiveMode = function (mode) {
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
                throw new Error("Unrecognized primitive mode: " + mode + ".");
        }
    };
    GltfConverter.prototype._getAttributeFormat = function (componentType, type) {
        switch (componentType) {
            case 5120 /* BYTE */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R8SN;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG8SN;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB8SN;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA8SN;
                    default: throw new Error("Unrecognized attribute type: " + type + ".");
                }
            }
            case 5121 /* UNSIGNED_BYTE */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R8;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG8;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB8;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA8;
                    default: throw new Error("Unrecognized attribute type: " + type + ".");
                }
            }
            case 5122 /* SHORT */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R16I;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG16I;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB16I;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA16I;
                    default: throw new Error("Unrecognized attribute type: " + type + ".");
                }
            }
            case 5123 /* UNSIGNED_SHORT */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R16UI;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG16UI;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB16UI;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA16UI;
                    default: throw new Error("Unrecognized attribute type: " + type + ".");
                }
            }
            case 5125 /* UNSIGNED_INT */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R32UI;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG32UI;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB32UI;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA32UI;
                    default: throw new Error("Unrecognized attribute type: " + type + ".");
                }
            }
            case 5126 /* FLOAT */: {
                switch (type) {
                    case "SCALAR" /* SCALAR */: return ccm.GFXFormat.R32F;
                    case "VEC2" /* VEC2 */: return ccm.GFXFormat.RG32F;
                    case "VEC3" /* VEC3 */: return ccm.GFXFormat.RGB32F;
                    case "VEC4" /* VEC4 */: return ccm.GFXFormat.RGBA32F;
                    default: throw new Error("Unrecognized attribute type: " + type + ".");
                }
            }
            default: throw new Error("Unrecognized component type: " + componentType + ".");
        }
    };
    GltfConverter.prototype._getAttributeBaseTypeStorage = function (componentType) {
        switch (componentType) {
            case 5120 /* BYTE */: return Int8Array;
            case 5121 /* UNSIGNED_BYTE */: return Uint8Array;
            case 5122 /* SHORT */: return Int16Array;
            case 5123 /* UNSIGNED_SHORT */: return Uint16Array;
            case 5125 /* UNSIGNED_INT */: return Uint32Array;
            case 5126 /* FLOAT */: return Float32Array;
            default:
                throw new Error("Unrecognized component type: " + componentType);
        }
    };
    GltfConverter.prototype._getIndexStride = function (componentType) {
        switch (componentType) {
            case 5121 /* UNSIGNED_BYTE */: return 1;
            case 5123 /* UNSIGNED_SHORT */: return 2;
            case 5125 /* UNSIGNED_INT */: return 4;
            default:
                throw new Error("Unrecognized index type: " + componentType);
        }
    };
    GltfConverter.prototype._getBytesPerAttribute = function (gltfAccessor) {
        return this._getBytesPerComponent(gltfAccessor.componentType) *
            this._getComponentsPerAttribute(gltfAccessor.type);
    };
    GltfConverter.prototype._getComponentsPerAttribute = function (type) {
        switch (type) {
            case "SCALAR" /* SCALAR */: return 1;
            case "VEC2" /* VEC2 */: return 2;
            case "VEC3" /* VEC3 */: return 3;
            case "VEC4" /* VEC4 */:
            case "MAT2" /* MAT2 */: return 4;
            case "MAT3" /* MAT3 */: return 9;
            case "MAT4" /* MAT4 */: return 16;
            default:
                throw new Error("Unrecognized attribute type: " + type + ".");
        }
    };
    GltfConverter.prototype._getBytesPerComponent = function (componentType) {
        switch (componentType) {
            case 5120 /* BYTE */:
            case 5121 /* UNSIGNED_BYTE */: return 1;
            case 5122 /* SHORT */:
            case 5123 /* UNSIGNED_SHORT */: return 2;
            case 5125 /* UNSIGNED_INT */:
            case 5126 /* FLOAT */: return 4;
            default:
                throw new Error("Unrecognized component type: " + componentType);
        }
    };
    GltfConverter.prototype._getGfxAttributeName = function (name) {
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
                throw new Error("Unrecognized attribute type: " + name);
        }
    };
    GltfConverter.prototype._getComponentReader = function (componentType) {
        switch (componentType) {
            case 5120 /* BYTE */: return function (buffer, offset) { return buffer.getInt8(offset); };
            case 5121 /* UNSIGNED_BYTE */: return function (buffer, offset) { return buffer.getUint8(offset); };
            case 5122 /* SHORT */: return function (buffer, offset) { return buffer.getInt16(offset, ccUseLittleEndian); };
            case 5123 /* UNSIGNED_SHORT */: return function (buffer, offset) { return buffer.getUint16(offset, ccUseLittleEndian); };
            case 5125 /* UNSIGNED_INT */: return function (buffer, offset) { return buffer.getUint32(offset, ccUseLittleEndian); };
            case 5126 /* FLOAT */: return function (buffer, offset) { return buffer.getFloat32(offset, ccUseLittleEndian); };
            default:
                throw new Error("Unrecognized component type: " + componentType);
        }
    };
    GltfConverter.prototype._getComponentWriter = function (componentType) {
        switch (componentType) {
            case 5120 /* BYTE */: return function (buffer, offset, value) { return buffer.setInt8(offset, value); };
            case 5121 /* UNSIGNED_BYTE */: return function (buffer, offset, value) { return buffer.setUint8(offset, value); };
            case 5122 /* SHORT */: return function (buffer, offset, value) { return buffer.setInt16(offset, value, ccUseLittleEndian); };
            case 5123 /* UNSIGNED_SHORT */: return function (buffer, offset, value) { return buffer.setUint16(offset, value, ccUseLittleEndian); };
            case 5125 /* UNSIGNED_INT */: return function (buffer, offset, value) { return buffer.setUint32(offset, value, ccUseLittleEndian); };
            case 5126 /* FLOAT */: return function (buffer, offset, value) { return buffer.setFloat32(offset, value, ccUseLittleEndian); };
            default:
                throw new Error("Unrecognized component type: " + componentType);
        }
    };
    GltfConverter.prototype._getGltfXXName = function (assetKind, index) {
        var _a;
        var assetsArrayName = (_a = {},
            _a[GltfAssetKind.Animation] = 'animations',
            _a[GltfAssetKind.Image] = 'images',
            _a[GltfAssetKind.Material] = 'materials',
            _a[GltfAssetKind.Node] = 'nodes',
            _a[GltfAssetKind.Skin] = 'skins',
            _a[GltfAssetKind.Texture] = 'textures',
            _a[GltfAssetKind.Scene] = 'scenes',
            _a);
        var assets = this._gltf[assetsArrayName[assetKind]];
        if (!assets) {
            return '';
        }
        var asset = assets[index];
        if ((typeof asset.name) === 'string') {
            return asset.name;
        }
        else {
            return GltfAssetKind[assetKind] + "-" + index;
        }
    };
    return GltfConverter;
}());
exports.GltfConverter = GltfConverter;
function calculateNormals(gltfPrimitiveViewer) {
    var vertexCount = gltfPrimitiveViewer.getVertexCount();
    var positions = gltfPrimitiveViewer.getPositions();
    var indices = gltfPrimitiveViewer.getFaces();
    var nFaces = gltfPrimitiveViewer.getFaceCount();
    var normals = new Float32Array(3 * vertexCount);
    var a = new ccm.math.Vec3();
    var b = new ccm.math.Vec3();
    var c = new ccm.math.Vec3();
    var u = new ccm.math.Vec3();
    var v = new ccm.math.Vec3();
    var n = new ccm.math.Vec3();
    var getPosition = function (iVertex, out) {
        ccm.math.Vec3.set(out, positions[iVertex * 3 + 0], positions[iVertex * 3 + 1], positions[iVertex * 3 + 2]);
    };
    var addFaceNormal = function (iVertex, normal) {
        normals[iVertex * 3 + 0] += normal.x;
        normals[iVertex * 3 + 1] += normal.y;
        normals[iVertex * 3 + 2] += normal.z;
    };
    for (var iFace = 0; iFace < nFaces; ++iFace) {
        var ia = indices[iFace * 3 + 0];
        var ib = indices[iFace * 3 + 1];
        var ic = indices[iFace * 3 + 2];
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
    for (var iVertex = 0; iVertex < vertexCount; ++iVertex) {
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
    var vertexCount = gltfPrimitiveViewer.getVertexCount();
    var positions = gltfPrimitiveViewer.getPositions();
    var indices = gltfPrimitiveViewer.getFaces();
    var nFaces = gltfPrimitiveViewer.getFaceCount();
    var normals = overrideNormals ? overrideNormals : gltfPrimitiveViewer.getNormals();
    var uvs = gltfPrimitiveViewer.getUVs();
    var tangents = new Float32Array(4 * vertexCount);
    var tan1 = new Float32Array(3 * vertexCount);
    var tan2 = new Float32Array(3 * vertexCount);
    var v0 = new ccm.math.Vec3();
    var v1 = new ccm.math.Vec3();
    var v2 = new ccm.math.Vec3();
    var uv0 = new ccm.math.Vec2();
    var uv1 = new ccm.math.Vec2();
    var uv2 = new ccm.math.Vec2();
    var sdir = new ccm.math.Vec3();
    var tdir = new ccm.math.Vec3();
    var n = new ccm.math.Vec3();
    var t = new ccm.math.Vec3();
    var getPosition = function (iVertex, out) {
        ccm.math.Vec3.set(out, positions[iVertex * 3 + 0], positions[iVertex * 3 + 1], positions[iVertex * 3 + 2]);
    };
    var getUV = function (iVertex, out) {
        ccm.math.Vec2.set(out, uvs[iVertex * 2 + 0], uvs[iVertex * 2 + 1]);
    };
    var addTan = function (tans, iVertex, val) {
        tans[iVertex * 3 + 0] += val.x;
        tans[iVertex * 3 + 1] += val.y;
        tans[iVertex * 3 + 2] += val.z;
    };
    for (var iFace = 0; iFace < nFaces; ++iFace) {
        var i0 = indices[iFace * 3 + 0];
        var i1 = indices[iFace * 3 + 1];
        var i2 = indices[iFace * 3 + 2];
        getPosition(i0, v0);
        getPosition(i1, v1);
        getPosition(i2, v2);
        getUV(i0, uv0);
        getUV(i1, uv1);
        getUV(i2, uv2);
        var x1 = v1.x - v0.x;
        var x2 = v2.x - v0.x;
        var y1 = v1.y - v0.y;
        var y2 = v2.y - v0.y;
        var z1 = v1.z - v0.z;
        var z2 = v2.z - v0.z;
        var s1 = uv1.x - uv0.x;
        var s2 = uv2.x - uv0.x;
        var t1 = uv1.y - uv0.y;
        var t2 = uv2.y - uv0.y;
        var div = (s1 * t2 - s2 * t1);
        if (div !== 0.0) {
            var r = 1.0 / div;
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
    var tan2v = new ccm.math.Vec3();
    var vv = new ccm.math.Vec3();
    for (var iVertex = 0; iVertex < vertexCount; ++iVertex) {
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
        var sign = ccm.math.Vec3.dot(ccm.math.Vec3.cross(vv, n, t), tan2v) < 0 ? -1 : 1;
        tangents[4 * iVertex + 3] = sign;
    }
    return tangents;
}
function readGltf(glTFFileUri, glTFHost) {
    return __awaiter(this, void 0, void 0, function () {
        var path, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    path = URI.parse(glTFFileUri).path;
                    if (!(path && path.endsWith('.glb'))) return [3 /*break*/, 2];
                    return [4 /*yield*/, readGlb(glTFFileUri, glTFHost)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, readGltfJson(glTFFileUri, glTFHost)];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4: return [2 /*return*/, _a];
            }
        });
    });
}
exports.readGltf = readGltf;
function readGltfJson(uri, glTFHost) {
    return __awaiter(this, void 0, void 0, function () {
        var gltf, binaryBuffers;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, glTFHost.readJSON(uri)];
                case 1:
                    gltf = _a.sent();
                    binaryBuffers = [];
                    if (!gltf.buffers) return [3 /*break*/, 3];
                    return [4 /*yield*/, Promise.all(gltf.buffers.map(function (gltfBuffer) {
                            if (!gltfBuffer.uri) {
                                return new DataView(new ArrayBuffer(0));
                            }
                            return readBufferData(uri, gltfBuffer.uri, glTFHost);
                        }))];
                case 2:
                    binaryBuffers = _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, { gltf: gltf, binaryBuffers: binaryBuffers }];
            }
        });
    });
}
function readGlb(uri, glTFHost) {
    return __awaiter(this, void 0, void 0, function () {
        var badGLBFormat, glb, _a, magic, ChunkTypeJson, ChunkTypeBin, version, length, gltf, embededBinaryBuffer, iChunk, offset, chunkLength, chunkType, payload, gltfJson, binaryBuffers;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    badGLBFormat = function () {
                        throw new Error("Bad glb format.");
                    };
                    _a = DataView.bind;
                    return [4 /*yield*/, glTFHost.readBuffer(uri)];
                case 1:
                    glb = new (_a.apply(DataView, [void 0, _b.sent()]))();
                    if (glb.byteLength < 12) {
                        return [2 /*return*/, badGLBFormat()];
                    }
                    magic = glb.getUint32(0, glTFUseLittleEndian);
                    if (magic !== 0x46546C67) {
                        return [2 /*return*/, badGLBFormat()];
                    }
                    ChunkTypeJson = 0x4E4F534A;
                    ChunkTypeBin = 0x004E4942;
                    version = glb.getUint32(4, glTFUseLittleEndian);
                    length = glb.getUint32(8, glTFUseLittleEndian);
                    for (iChunk = 0, offset = 12; (offset + 8) <= glb.byteLength; ++iChunk) {
                        chunkLength = glb.getUint32(offset, glTFUseLittleEndian);
                        offset += 4;
                        chunkType = glb.getUint32(offset, glTFUseLittleEndian);
                        offset += 4;
                        if (offset + chunkLength > glb.byteLength) {
                            return [2 /*return*/, badGLBFormat()];
                        }
                        payload = new DataView(glb.buffer, offset, chunkLength);
                        offset += chunkLength;
                        if (iChunk === 0) {
                            if (chunkType !== ChunkTypeJson) {
                                return [2 /*return*/, badGLBFormat()];
                            }
                            gltfJson = new TextDecoder('utf-8').decode(payload);
                            gltf = JSON.parse(gltfJson);
                        }
                        else if (chunkType === ChunkTypeBin) {
                            // TODO: Should we copy?
                            // embededBinaryBuffer = payload.slice();
                            embededBinaryBuffer = payload;
                        }
                    }
                    if (!!gltf) return [3 /*break*/, 2];
                    return [2 /*return*/, badGLBFormat()];
                case 2:
                    binaryBuffers = [];
                    if (!gltf.buffers) return [3 /*break*/, 4];
                    return [4 /*yield*/, Promise.all(gltf.buffers.map(function (gltfBuffer, index) {
                            if (!gltfBuffer.uri) {
                                if (index === 0 && embededBinaryBuffer) {
                                    return embededBinaryBuffer;
                                }
                                return new DataView(new ArrayBuffer(0));
                            }
                            return readBufferData(uri, gltfBuffer.uri, glTFHost);
                        }))];
                case 3:
                    binaryBuffers = _b.sent();
                    _b.label = 4;
                case 4: return [2 /*return*/, { gltf: gltf, binaryBuffers: binaryBuffers }];
            }
        });
    });
}
function isDataUri(uri) {
    return uri.startsWith('data:');
}
exports.isDataUri = isDataUri;
var BufferBlob = /** @class */ (function () {
    function BufferBlob() {
        this._arrayBufferOrPaddings = [];
        this._length = 0;
    }
    BufferBlob.prototype.setNextAlignment = function (align) {
        if (align !== 0) {
            var remainder = this._length % align;
            if (remainder !== 0) {
                var padding = align - remainder;
                this._arrayBufferOrPaddings.push(padding);
                this._length += padding;
            }
        }
    };
    BufferBlob.prototype.addBuffer = function (arrayBuffer) {
        var result = this._length;
        this._arrayBufferOrPaddings.push(arrayBuffer);
        this._length += arrayBuffer.byteLength;
        return result;
    };
    BufferBlob.prototype.getLength = function () {
        return this._length;
    };
    BufferBlob.prototype.getCombined = function () {
        var result = new Uint8Array(this._length);
        var counter = 0;
        this._arrayBufferOrPaddings.forEach(function (arrayBufferOrPadding) {
            if (typeof arrayBufferOrPadding === 'number') {
                counter += arrayBufferOrPadding;
            }
            else {
                result.set(new Uint8Array(arrayBufferOrPadding), counter);
                counter += arrayBufferOrPadding.byteLength;
            }
        });
        return result;
    };
    return BufferBlob;
}());
function readBufferData(glTFFileURI, uri, glTFHost) {
    return __awaiter(this, void 0, void 0, function () {
        var bufferURI, _a, dataUrl;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!!uri.startsWith('data:')) return [3 /*break*/, 2];
                    bufferURI = resolveGLTFUri(glTFFileURI, uri);
                    _a = DataView.bind;
                    return [4 /*yield*/, glTFHost.readBuffer(bufferURI)];
                case 1: return [2 /*return*/, new (_a.apply(DataView, [void 0, _b.sent()]))()];
                case 2:
                    dataUrl = parse_data_url_1.default(uri);
                    if (!dataUrl) {
                        throw new Error("Bad data uri." + uri);
                    }
                    return [2 /*return*/, new DataView(dataUrl.toBuffer().buffer)];
            }
        });
    });
}
function resolveGLTFUri(glTFFileURI, uri) {
    var result = URI.resolve(glTFFileURI, uri);
    return result;
}
exports.resolveGLTFUri = resolveGLTFUri;
function createDataViewFromBuffer(buffer, offset) {
    if (offset === void 0) { offset = 0; }
    return new DataView(buffer.buffer, buffer.byteOffset + offset);
}
function createDataViewFromTypedArray(typedArray, offset) {
    if (offset === void 0) { offset = 0; }
    return new DataView(typedArray.buffer, typedArray.byteOffset + offset);
}
var ccUseLittleEndian = true;
var glTFUseLittleEndian = true;
function uniqueChildNodeNameGenerator(original, last, index, count) {
    var postfix = count === 0 ? '' : "-" + count;
    return (original || '') + "(__autogen " + index + postfix + ")";
}
function makeUniqueNames(names, generator) {
    var uniqueNames = new Array(names.length).fill('');
    var _loop_2 = function (i) {
        var name_1 = names[i];
        var count = 0;
        while (true) {
            var isUnique = function () { return uniqueNames.every(function (uniqueName, index) {
                return index === i || name_1 !== uniqueName;
            }); };
            if (name_1 === null || !isUnique()) {
                name_1 = generator(names[i], name_1, i, count++);
            }
            else {
                uniqueNames[i] = name_1;
                break;
            }
        }
    };
    for (var i = 0; i < names.length; ++i) {
        _loop_2(i);
    }
    return uniqueNames;
}
//# sourceMappingURL=glTF-converter.js.map