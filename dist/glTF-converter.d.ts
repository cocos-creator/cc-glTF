/// <reference path="../@types/cc/cc.d.ts" />
import * as glTF from '../@types/glTF';
export declare const enum AssetFinderKind {
    mesh = "meshes",
    animation = "animations",
    skeleton = "skeletons",
    texture = "textures",
    material = "materials"
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
export declare type GltfSubAsset = glTF.Node | glTF.Mesh | glTF.Texture | glTF.Skin | glTF.Animation | glTF.Image | glTF.Material | glTF.Scene;
export declare function getPathFromRoot(target: ccm.Node | null, root: ccm.Node): string;
export declare function getWorldTransformUntilRoot(target: ccm.Node, root: ccm.Node, outPos: ccm.math.Vec3, outRot: ccm.math.Quat, outScale: ccm.math.Vec3): void;
export declare enum NormalImportSetting {
    /**
     * 如果模型文件中包含法线信息则导出法线，否则不导出法线。
     */
    optional = 0,
    /**
     * 不在导出的网格中包含法线信息。
     */
    exclude = 1,
    /**
     * 如果模型文件中包含法线信息则导出法线，否则重新计算并导出法线。
     */
    require = 2,
    /**
     * 不管模型文件中是否包含法线信息，直接重新计算并导出法线。
     */
    recalculate = 3
}
export declare enum TangentImportSetting {
    /**
     * 不在导出的网格中包含正切信息。
     */
    exclude = 0,
    /**
     * 如果模型文件中包含正切信息则导出正切，否则不导出正切。
     */
    optional = 1,
    /**
     * 如果模型文件中包含正切信息则导出正切，否则重新计算并导出正切。
     */
    require = 2,
    /**
     * 不管模型文件中是否包含正切信息，直接重新计算并导出正切。
     */
    recalculate = 3
}
export interface IMeshOptions {
    normals: NormalImportSetting;
    tangents: TangentImportSetting;
}
export interface IGltfSemantic {
    name: string;
    baseType: number;
    type: string;
}
export declare function getNodePathByTargetName(root: ccm.Node, name: string, path: string): string;
export declare function createSockets(sceneNode: ccm.Node, specialNames?: string[]): any[];
export declare class GltfConverter {
    private _gltf;
    private _buffers;
    private _url;
    readonly gltf: glTF.GlTf;
    readonly url: string;
    private _nodePathTable;
    /**
     * The parent index of each node.
     */
    private _parents;
    /**
     * The root node of each skin.
     */
    private _skinRoots;
    constructor(_gltf: glTF.GlTf, _buffers: DataView[], _url: string);
    createMesh(iGltfMesh: number, options: IMeshOptions): import("cc").Mesh;
    createSkeleton(iGltfSkin: number, sortMap?: number[]): import("cc").Skeleton;
    getAnimationDuration(iGltfAnimation: number): number;
    createAnimation(iGltfAnimation: number, span?: {
        from: number;
        to: number;
    }): import("cc").SkeletalAnimationClip;
    createMaterial(iGltfMaterial: number, gltfAssetFinder: AssetFinder, effectGetter: (name: string) => ccm.EffectAsset): import("cc").Material;
    getTextureParameters(gltfTexture: glTF.Texture): Partial<{
        wrapModeS: any;
        wrapModeT: any;
        minFilter: any;
        magFilter: any;
        mipFilter: any;
    }>;
    createScene(iGltfScene: number, gltfAssetFinder: AssetFinder, withTransform?: boolean): ccm.Node;
    readImage(gltfImage: glTF.Image, glTFUri: string, glTFHost: GLTFHost): Promise<{
        imageData: DataView;
        extName: string;
    } | undefined>;
    private _getNodeRotation;
    private _gltfChannelToCurveData;
    private _split;
    private _getParent;
    private _commonRoot;
    private _getSkinRoot;
    private _checkTangentImportSetting;
    private _readPrimitiveVertices;
    private _readImageByFsPath;
    private _makePrimitiveViewer;
    private _readAccessorIntoArray;
    private _readImageByDataUri;
    private _readImageInBufferview;
    private _getSceneNode;
    private _createEmptyNodeRecursive;
    private _setupNode;
    private _createEmptyNode;
    private _readNodeMatrix;
    private _getNodePath;
    private _createNodePathTable;
    private _readAccessor;
    private _getPrimitiveMode;
    private _getAttributeFormat;
    private _getAttributeBaseTypeStorage;
    private _getIndexStride;
    private _getBytesPerAttribute;
    private _getComponentsPerAttribute;
    private _getBytesPerComponent;
    private _getGfxAttributeName;
    private _getComponentReader;
    private _getComponentWriter;
    private _getGltfXXName;
}
export interface GLTFHost {
    readJSON: (uri: string) => Promise<any>;
    readBuffer: (uri: string) => Promise<ArrayBuffer>;
}
export declare function readGltf(glTFFileUri: string, glTFHost: GLTFHost): Promise<{
    gltf: glTF.GlTf;
    binaryBuffers: DataView[];
}>;
export declare function isDataUri(uri: string): boolean;
export declare function resolveGLTFUri(glTFFileURI: string, uri: string): any;
