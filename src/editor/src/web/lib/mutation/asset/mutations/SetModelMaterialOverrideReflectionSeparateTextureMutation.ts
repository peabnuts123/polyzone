
import { AssetType, ITextureAssetData, MeshAssetMaterialOverrideReflectionSeparateData } from "@polyzone/runtime/src/cartridge";
import { ReflectionLoading } from "@polyzone/runtime/src/world";
import { IModelMaterialMutation } from "../IModelMaterialMutation";
import { ModelMaterialMutationArguments } from "../ModelMaterialMutationArguments";
import { reconcileMaterialOverrideData } from "./util/reconcile-overrides";

export enum ReflectionSeparateTexture {
  positiveX,
  negativeX,
  positiveY,
  negativeY,
  positiveZ,
  negativeZ,
}

export class SetModelMaterialOverrideReflectionSeparateTextureMutation implements IModelMaterialMutation {
  // Mutation parameters
  private readonly modelAssetId: string;
  private readonly materialName: string;
  private readonly reflectionTextureAssetId: string | undefined;
  private readonly whichTexture: ReflectionSeparateTexture;

  // Undo state
  private oldReflectionTextureAssetId: string | undefined;

  public constructor(modelAssetId: string, materialName: string, reflectionTextureAssetId: string | undefined, whichTexture: ReflectionSeparateTexture) {
    this.modelAssetId = modelAssetId;
    this.materialName = materialName;
    this.reflectionTextureAssetId = reflectionTextureAssetId;
    this.whichTexture = whichTexture;
  }

  public apply({ ProjectController, ModelMaterialEditorController }: ModelMaterialMutationArguments): void {
    const meshAssetData = ProjectController.project.assets.getById(this.modelAssetId, AssetType.Mesh);
    const reflectionTextureAssetData = this.reflectionTextureAssetId ? ProjectController.project.assets.getById(this.reflectionTextureAssetId, AssetType.Texture) : undefined;
    const materialOverridesData = meshAssetData.getOverridesForMaterial(this.materialName);
    const material = ModelMaterialEditorController.getMaterialByName(this.materialName);

    if (materialOverridesData?.reflection?.type !== 'separate') {
      throw new Error(`Cannot set reflection texture for material override - the material doesn't have a reflection override yet`);
    }

    // 0. Store undo data
    this.oldReflectionTextureAssetId = getTextureData(materialOverridesData.reflection, this.whichTexture)?.id;

    // 1. Update data
    meshAssetData.setMaterialOverride(this.materialName, (overrides) => {
      setTextureData(overrides.reflection as MeshAssetMaterialOverrideReflectionSeparateData, this.whichTexture, reflectionTextureAssetData);
    });

    // 2. Update Babylon state
    if (reflectionTextureAssetData) {
      /* @NOTE Will only return a defined texture when all 6 textures are defined */
      ReflectionLoading.loadSeparate(
        materialOverridesData.reflection as MeshAssetMaterialOverrideReflectionSeparateData,
        {
          assetCache: ModelMaterialEditorController.assetCache,
          scene: ModelMaterialEditorController.scene,
          assetDb: ProjectController.project.assets,
        },
      )
        .then((reflectionTexture) => {
          material.overridesFromAsset.reflectionTexture = reflectionTexture;
        });
    } else {
      material.overridesFromAsset.reflectionTexture = undefined;
    }

    // 3. Update JSONC
    reconcileMaterialOverrideData(meshAssetData, ProjectController);
  }

  public undo(_args: ModelMaterialMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Set material reflection texture override`;
  }
}

function getTextureData(data: MeshAssetMaterialOverrideReflectionSeparateData, whichTexture: ReflectionSeparateTexture): ITextureAssetData | undefined {
  switch (whichTexture) {
    case ReflectionSeparateTexture.positiveX:
      return data.pxTexture;
    case ReflectionSeparateTexture.negativeX:
      return data.nxTexture;
    case ReflectionSeparateTexture.positiveY:
      return data.pyTexture;
    case ReflectionSeparateTexture.negativeY:
      return data.nyTexture;
    case ReflectionSeparateTexture.positiveZ:
      return data.pzTexture;
    case ReflectionSeparateTexture.negativeZ:
      return data.nzTexture;
    default:
      throw new Error(`Unimplemented separate reflection type: ${whichTexture}`);
  }
}

function setTextureData(data: MeshAssetMaterialOverrideReflectionSeparateData, whichTexture: ReflectionSeparateTexture, texture: ITextureAssetData | undefined): void {
  switch (whichTexture) {
    case ReflectionSeparateTexture.positiveX:
      data.pxTexture = texture;
      break;
    case ReflectionSeparateTexture.negativeX:
      data.nxTexture = texture;
      break;
    case ReflectionSeparateTexture.positiveY:
      data.pyTexture = texture;
      break;
    case ReflectionSeparateTexture.negativeY:
      data.nyTexture = texture;
      break;
    case ReflectionSeparateTexture.positiveZ:
      data.pzTexture = texture;
      break;
    case ReflectionSeparateTexture.negativeZ:
      data.nzTexture = texture;
      break;
    default:
      throw new Error(`Unimplemented separate reflection type: ${whichTexture}`);
  }
}
