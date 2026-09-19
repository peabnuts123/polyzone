import { Color3 } from "@polyzone/core/math/Color3";
import { GameObjectComponent } from "../GameObjectComponent";

export abstract class DirectionalLightComponent extends GameObjectComponent {
  public abstract get color(): Color3;
  public abstract set color(value: Color3);
  public abstract get intensity(): number;
  public abstract set intensity(value: number);
}
